import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { SellListing, SellListingResponse } from '../types';

const LISTINGS_COLLECTION = 'sell_listings';
const RESPONSES_COLLECTION = 'sell_listing_responses';

export type ListingCreateInput = Omit<SellListing, 'id' | 'sellerId' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: SellListing['status'];
};

export async function createListing(sellerId: string, input: ListingCreateInput) {
  const payload = {
    ...input,
    sellerId,
    status: input.status ?? 'live',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, LISTINGS_COLLECTION), payload);
  return ref.id;
}

// The deadline sweep used to run on every Marketplace mount from every
// visitor: a 500-doc read + a batch write each time. It's now rate-limited to
// once per session (10 min), which is more than enough to flip overdue
// listings — and the client-side deadline filter in listMarketplace already
// hides them before any sweep lands.
let lastSweepAt = 0;
const SWEEP_MIN_INTERVAL_MS = 10 * 60 * 1000;

/** Deadline categories (food / jobs / agriculture) only.
 * Marks a live listing as expired if its deadline has passed.
 * Returns true if a change was written.
 */
export async function expireOverdueListings() {
  if (Date.now() - lastSweepAt < SWEEP_MIN_INTERVAL_MS) {
    return 0;
  }
  lastSweepAt = Date.now();
  const snap = await getDocs(
    query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'live'), limit(500))
  );
  const nowMs = Date.now();
  let changed = 0;
  const batch = writeBatch(db);
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as any;
    const deadline = data?.deadline;
    if (!deadline) continue;
    const deadlineMs = deadline?.toMillis ? deadline.toMillis() : new Date(deadline).getTime();
    if (!Number.isFinite(deadlineMs)) continue;
    if (deadlineMs < nowMs) {
      const ref = doc(db, LISTINGS_COLLECTION, docSnap.id);
      batch.update(ref, { status: 'expired' });
      changed++;
    }
  }
  if (changed > 0) {
    await batch.commit();
  }
  return changed;
}

export async function updateListing(listingId: string, patch: Partial<SellListing>) {
  const ref = doc(db, LISTINGS_COLLECTION, listingId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() } as any);
}

export async function softDeleteListing(listingId: string) {
  await updateListing(listingId, { status: 'deleted' } as any);
}

export async function hardDeleteListing(listingId: string) {
  // Not used by default; keep available for admin/testing.
  await deleteDoc(doc(db, LISTINGS_COLLECTION, listingId));
}

export async function getListing(listingId: string): Promise<SellListing | null> {
  const snap = await getDoc(doc(db, LISTINGS_COLLECTION, listingId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as SellListing;
}

export async function listMarketplace(params: {
  search?: string;
  category?: string;
  /** Category family: any of these values pass the category filter (e.g. car + vehicles). */
  categories?: string[];
  location?: string;
  pageSize?: number;
}) {
  // Wider fetch window than the old 50: category/location/search filters are
  // applied client-side below (kept as-is to avoid requiring new composite
  // indexes), so a 50-doc window meant filters were often applied to an
  // arbitrary slice and returned nothing. 300 is a bounded, index-free read
  // that makes filtering reliably find matches. pageSize still caps the final
  // page the caller renders.
  const pageSize = params.pageSize ?? 50;
  const fetchLimit = Math.max(pageSize, 300);

  // Query only by status to avoid requiring composite indexes; sort/filter client-side.
  const q = query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'live'), limit(fetchLimit));
  const snap = await getDocs(q);
  let listings = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];

  // Hide deadline listings whose deadline has already passed — the
  // background sweep may not have flipped their status yet. Only food listings
  // carry a deadline, so this never affects any other category.
  const nowMs = Date.now();
  listings = listings.filter((l) => {
    if (!l.deadline) return true;
    const ms = l.deadline?.toMillis ? l.deadline.toMillis() : new Date(l.deadline).getTime();
    return !Number.isFinite(ms) || ms > nowMs;
  });

  // Keep latest listings first.
  listings = listings.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });

  if (params.categories?.length) {
    listings = listings.filter((l) => params.categories!.includes(l.category) || (Array.isArray((l as any).categories) && (l as any).categories.some((c: string) => params.categories!.includes(c))));
  } else if (params.category) {
    listings = listings.filter((l) => l.category === params.category || (Array.isArray((l as any).categories) && (l as any).categories.includes(params.category!)));
  }
  if (params.location) {
    listings = listings.filter((l) => l.location === params.location);
  }

  const s = (params.search ?? '').trim().toLowerCase();
  if (s) {
    listings = listings.filter((l) => {
      const hay = `${l.title ?? ''} ${l.description ?? ''} ${(l.tags ?? []).join(' ')} ${l.category ?? ''}`.toLowerCase();
      return hay.includes(s);
    });
  }
  return listings;
}

export async function listMyListings(sellerId: string) {
  const q = query(
    collection(db, LISTINGS_COLLECTION),
    where('sellerId', '==', sellerId)
  );
  const snap = await getDocs(q);
  const listings = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((l) => l.status === 'live' || l.status === 'draft' || l.status === 'expired');
  // Sort client-side to avoid needing a composite index
  return listings.sort((a, b) => {
    const aMs = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  }) as SellListing[];
}

export async function createListingResponse(input: Omit<SellListingResponse, 'id' | 'createdAt'> & { buyerName?: string }) {
  // Filter out undefined values — Firestore rejects them
  const cleanInput = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  );
  const payload = {
    ...cleanInput,
    voiceUrl: input.voiceUrl || null,
    attachments: input.attachments || null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, RESPONSES_COLLECTION), payload);

  // Also create a chat message so it appears in user chats
  try {
    const chatEnquiryId = `sell_listing_${input.listingId}`;
    await addDoc(collection(db, 'chatMessages'), {
      enquiryId: chatEnquiryId,
      sellerId: input.buyerId,
      senderId: input.buyerId,
      senderName: input.buyerName || 'Buyer',
      senderType: 'buyer',
      recipientId: input.sellerId,
      // Required for real-time chat listeners (ChatContext onSnapshot filters on participants)
      participants: [input.buyerId, input.sellerId],
      message: input.offeredPrice
        ? `₹${Number(input.offeredPrice).toLocaleString("en-IN")}${input.message ? " - " + input.message : ""}`
        : (input.message || (input.type === 'connect' ? '👋 is interested in your listing' : '')),
      timestamp: serverTimestamp(),      offeringPrice: input.offeredPrice || null,
      voiceUrl: input.voiceUrl || null,
      attachments: input.attachments || null,
    });

  } catch (chatErr) {
    console.error('Failed to create chat message for listing response:', chatErr);
  }

  return ref.id;
}

export async function listResponsesForListing(listingId: string) {
  const q = query(collection(db, RESPONSES_COLLECTION), where('listingId', '==', listingId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    }) as SellListingResponse[];
}

export async function listResponsesForSeller(sellerId: string) {
  const q = query(collection(db, RESPONSES_COLLECTION), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  const responses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListingResponse[];
  // Sort client-side to avoid needing a composite index
  return responses.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });
}



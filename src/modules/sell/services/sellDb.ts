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
  location?: string;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 50;

  // Query only by status to avoid requiring composite indexes; sort/filter client-side.
  const q = query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'live'), limit(pageSize));
  const snap = await getDocs(q);
  let listings = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];

  // Keep latest listings first.
  listings = listings.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });

  if (params.category) {
    listings = listings.filter((l) => l.category === params.category);
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
    .filter((l) => l.status === 'live' || l.status === 'draft');
  // Sort client-side to avoid needing a composite index
  return listings.sort((a, b) => {
    const aMs = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  }) as SellListing[];
}

export async function createListingResponse(input: Omit<SellListingResponse, 'id' | 'createdAt'> & { buyerName?: string }) {
  const payload = {
    ...input,
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
      message: input.offeredPrice ? `₹${Number(input.offeredPrice).toLocaleString("en-IN")}${input.message ? " - " + input.message : ""}` : input.message,
      timestamp: serverTimestamp(),
      offeringPrice: input.offeredPrice || null,
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



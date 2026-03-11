import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
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

  // Keep this simple and safe: Firestore doesn't support "contains-any" full text;
  // we'll do lightweight client-side filtering for search.
  const constraints: any[] = [where('status', '==', 'live'), orderBy('createdAt', 'desc'), limit(pageSize)];
  if (params.category) constraints.splice(1, 0, where('category', '==', params.category));
  if (params.location) constraints.splice(1, 0, where('location', '==', params.location));

  const q = query(collection(db, LISTINGS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  let listings = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];

  const s = (params.search ?? '').trim().toLowerCase();
  if (s) {
    listings = listings.filter((l) => {
      const hay = `${l.title ?? ''} ${l.description ?? ''} ${(l.tags ?? []).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }
  return listings;
}

export async function listMyListings(sellerId: string) {
  const q = query(
    collection(db, LISTINGS_COLLECTION),
    where('sellerId', '==', sellerId),
    where('status', 'in', ['live', 'draft']),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];
}

export async function createListingResponse(input: Omit<SellListingResponse, 'id' | 'createdAt'>) {
  const payload = {
    ...input,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, RESPONSES_COLLECTION), payload);
  return ref.id;
}

export async function listResponsesForListing(listingId: string) {
  const q = query(collection(db, RESPONSES_COLLECTION), where('listingId', '==', listingId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListingResponse[];
}

export async function listResponsesForSeller(sellerId: string) {
  const q = query(collection(db, RESPONSES_COLLECTION), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListingResponse[];
}



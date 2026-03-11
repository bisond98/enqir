import { db } from '@/firebase';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import type { SellListing } from '../types';

type EnquiryLite = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  status?: string;
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 3);
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export async function suggestEnquiriesForListing(listing: SellListing, opts?: { threshold?: number; max?: number }) {
  const threshold = opts?.threshold ?? 0.8; // 80%
  const max = opts?.max ?? 10;

  // READ-ONLY: We only read enquiries; do not write or mutate anything.
  const q = query(collection(db, 'enquiries'), where('status', '==', 'live'), orderBy('createdAt', 'desc'), limit(200));
  const snap = await getDocs(q);
  const enquiries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as EnquiryLite[];

  const listingText = `${listing.title} ${listing.description} ${listing.category} ${listing.location} ${(listing.tags ?? []).join(' ')}`;
  const lt = tokenize(listingText);

  const scored = enquiries
    .map((e) => {
      const et = tokenize(`${e.title ?? ''} ${e.description ?? ''} ${e.category ?? ''} ${e.location ?? ''}`);
      const score = jaccard(lt, et);
      return { enquiry: e, score };
    })
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored;
}

export async function suggestListingsForEnquiry(enquiry: EnquiryLite, opts?: { threshold?: number; max?: number }) {
  const threshold = opts?.threshold ?? 0.8;
  const max = opts?.max ?? 10;

  // READ-ONLY: only reads sell_listings.
  const q = query(collection(db, 'sell_listings'), where('status', '==', 'live'), orderBy('createdAt', 'desc'), limit(200));
  const snap = await getDocs(q);
  const listings = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];

  const et = tokenize(`${enquiry.title ?? ''} ${enquiry.description ?? ''} ${enquiry.category ?? ''} ${enquiry.location ?? ''}`);
  const scored = listings
    .map((l) => {
      const lt = tokenize(`${l.title ?? ''} ${l.description ?? ''} ${l.category ?? ''} ${l.location ?? ''} ${(l.tags ?? []).join(' ')}`);
      const score = jaccard(et, lt);
      return { listing: l, score };
    })
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored;
}



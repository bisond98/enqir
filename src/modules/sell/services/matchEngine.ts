// Match Engine — connects the two engines (enquiries = needs, sell_listings = supply).
// Pure local scoring (no external AI API): instant, free, offline-safe.
// Used by the Dashboard "Matches" tab: shows listings matching a user's enquiries
// and enquiries matching a user's listings.

import { db } from '@/firebase';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import type { SellListing } from '../types';

// ---------- public types ----------

export interface MatchItem {
  listingId: string;
  enquiryId: string;
  score: number; // 0-100
  label: 'Perfect match' | 'Close match' | 'Related';
  reasons: string[];
  // snapshot fields for rendering cards without extra reads
  listing?: SellListing;
  enquiry?: EnquiryForMatch;
}

export interface EnquiryForMatch {
  id: string;
  title: string;
  description?: string;
  category: string;
  categories?: string[];
  budget: string;
  location: string;
  userId: string;
  status?: string;
  deadline?: any;
  dealClosed?: boolean;
}

export interface UserMatches {
  forNeeds: MatchItem[];   // listings that match the user's enquiries
  forListings: MatchItem[]; // enquiries that match the user's listings
  computedAt: number;
}

// ---------- category families (same values on both sides + aliases) ----------

const CATEGORY_FAMILY: Record<string, string[]> = {
  // NOTE: 'automobile' is deliberately NOT a family of car/vehicles/bike — it's a
  // broad bucket. Cross-bucket matches only happen via BROAD_BUCKETS in scoreMatch,
  // which requires model/brand text evidence (otherwise a Pulsar listing would
  // "match" a Land Cruiser enquiry that just picked 'Automobile').
  car: ['car', 'vehicles'],
  vehicles: ['vehicles', 'car'],
  bike: ['bike', 'bicycles'],
  bicycles: ['bicycles', 'bike'],
  mobiles: ['mobiles', 'electronics-gadgets', 'electronics'],
  laptops: ['laptops', 'electronics-gadgets', 'electronics', 'technology'],
  electronics: ['electronics', 'electronics-gadgets', 'mobiles'],
  'electronics-gadgets': ['electronics-gadgets', 'electronics', 'mobiles', 'laptops'],
  appliances: ['appliances', 'electronics-gadgets', 'electronics'],
  furniture: ['furniture', 'home-furniture', 'home'],
  home: ['home', 'home-furniture', 'furniture'],
  'home-furniture': ['home-furniture', 'furniture', 'home'],
  fashion: ['fashion', 'fashion-apparel', 'sneakers'],
  'fashion-apparel': ['fashion-apparel', 'fashion', 'sneakers'],
  sneakers: ['sneakers', 'fashion-apparel'],
  books: ['books', 'books-publications'],
  'books-publications': ['books-publications', 'books'],
  gaming: ['gaming', 'gaming-recreation'],
  'gaming-recreation': ['gaming-recreation', 'gaming'],
  'real-estate': ['real-estate'],
  jobs: ['jobs'],
  pets: ['pets'],
  'baby-kids': ['baby-kids', 'childcare-family'],
  'childcare-family': ['childcare-family', 'baby-kids'],
  'jewelry-accessories': ['jewelry-accessories'],
  'sports-outdoor': ['sports-outdoor', 'fitness-gym-equipment'],
  'fitness-gym-equipment': ['fitness-gym-equipment', 'sports-outdoor'],
  'musical-instruments': ['musical-instruments'],
  'photography-cameras': ['photography-cameras'],
};

const inSameFamily = (a: string | undefined, b: string | undefined): boolean => {
  if (!a || !b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x === y) return true;
  const famA = CATEGORY_FAMILY[x] ?? [x];
  return famA.includes(y);
};

// ---------- helpers ----------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'at', 'of', 'to', 'need',
  'wanted', 'want', 'looking', 'buy', 'selling', 'sell', 'urgent', 'good',
  'condition', 'price', 'budget', 'best', 'me', 'my',
]);

const tokenize = (text: string): string[] =>
  (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const toNum = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
};

const listingPrice = (l: SellListing): number | null => {
  if (l.priceType === 'range') return toNum(l.priceMax ?? l.priceMin ?? l.price);
  return toNum(l.price ?? l.priceMax ?? l.priceMin);
};

const isEnquiryLive = (e: EnquiryForMatch): boolean => {
  if (e.dealClosed) return false;
  if (!e.deadline) return true;
  try {
    let d: Date;
    if (e.deadline?.toDate) d = e.deadline.toDate();
    else if (e.deadline?.seconds !== undefined) d = new Date(e.deadline.seconds * 1000);
    else if (e.deadline instanceof Date) d = e.deadline;
    else d = new Date(e.deadline);
    return isNaN(d.getTime()) ? true : d.getTime() >= Date.now();
  } catch {
    return true;
  }
};

const sameCity = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

// ---------- scoring ----------

// Broad buckets on the enquiry side: 'Automobile' covers car/bike/vehicles.
// A broad-bucket pair only counts when text evidence (model/brand keywords) backs it up,
// otherwise a Pulsar bike listing would "match" a Land Cruiser car enquiry.
const BROAD_BUCKETS: Record<string, string[]> = {
  automobile: ['car', 'vehicles', 'bike', 'bicycles'],
};

export function scoreMatch(listing: SellListing, enquiry: EnquiryForMatch): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const listingCats = [String(listing.category ?? '').toLowerCase()];
  const enquiryCats = [enquiry.category, ...(enquiry.categories ?? [])]
    .filter(Boolean)
    .map((c) => String(c).toLowerCase());

  // --- text signals (computed before the broad-bucket gate) ---
  const ld = (listing.details ?? {}) as Record<string, string>;
  const enquiryText = `${enquiry.title} ${enquiry.description ?? ''}`.toLowerCase();
  const brandHit = !!ld.brand && enquiryText.includes(ld.brand.toLowerCase());

  const lTokens = new Set([...tokenize(listing.title), ...tokenize(listing.description), ...tokenize((listing.tags ?? []).join(' '))]);
  const eTokens = tokenize(enquiryText);
  let overlaps = 0;
  for (const t of eTokens) if (lTokens.has(t)) overlaps++;

  // --- category gate ---
  let catScore = 0;
  let catKind: 'exact' | 'family' | 'broad' | null = null;
  for (const ec of enquiryCats) {
    for (const lc of listingCats) {
      if (!lc || !ec) continue;
      if (lc === ec) { catScore = 30; catKind = 'exact'; break; }
      if (!catKind && inSameFamily(lc, ec)) { catScore = 26; catKind = 'family'; }
      const broadHit = BROAD_BUCKETS[lc]?.includes(ec) || BROAD_BUCKETS[ec]?.includes(lc);
      if (!catKind && broadHit) { catScore = 10; catKind = 'broad'; }
    }
    if (catKind === 'exact') break;
  }
  if (!catKind) return { score: 0, reasons };

  // Broad bucket ('Automobile') alone is too vague — require model/brand evidence
  if (catKind === 'broad' && overlaps === 0 && !brandHit) {
    return { score: 0, reasons };
  }

  let score = catScore;
  if (catKind === 'exact') reasons.push('Same category');
  else if (catKind === 'family') reasons.push('Matching category');
  else reasons.push('Auto category + model match');

  // Brand (structured detail confirmed in enquiry text)
  if (brandHit) {
    score += 10;
    reasons.push(`${ld.brand} — brand match`);
  }

  // Keyword / model-word overlap (strong signal — this is what separates a Pulsar
  // from a Land Cruiser inside the same broad 'Automobile' bucket)
  if (overlaps > 0) {
    score += Math.min(30, overlaps * 10);
    if (catKind === 'broad') score += 10; // model-evidence bonus
    if (overlaps >= 2) reasons.push('Strong model match');
    else reasons.push('Model keyword match');
  }

  // Price vs budget
  const price = listingPrice(listing);
  const budget = toNum(enquiry.budget);
  if (price !== null && budget !== null) {
    if (price <= budget) {
      const ratio = price / budget;
      if (ratio >= 0.75) { score += 20; reasons.push('Price fits your budget'); }
      else { score += 12; reasons.push('Below your budget'); }
    } else {
      const over = (price - budget) / budget;
      if (over <= 0.1) { score += 12; reasons.push('Just above budget'); }
      else if (over <= 0.25) { score += 6; reasons.push('Slightly above budget'); }
      else return { score: 0, reasons }; // way over budget — not a match
    }
  } else {
    score += 8; // one side has no number — neutral credit
  }

  // Location
  if (sameCity(listing.location, enquiry.location)) {
    score += 20;
    reasons.push(`Same city · ${listing.location}`);
  } else {
    score += 4;
  }

  // Year detail
  if (ld.year && enquiryText.includes(ld.year)) {
    score += 5;
    reasons.push(`Year ${ld.year}`);
  }

  return { score: Math.min(100, score), reasons };
}

const labelFor = (score: number): MatchItem['label'] =>
  score >= 85 ? 'Perfect match' : score >= 60 ? 'Close match' : 'Related';

// ---------- data access ----------

async function fetchLiveListings(): Promise<SellListing[]> {
  const snap = await getDocs(query(collection(db, 'sell_listings'), where('status', '==', 'live')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SellListing[];
}

async function fetchLiveEnquiries(): Promise<EnquiryForMatch[]> {
  // status filter client-side to avoid composite index requirements
  const snap = await getDocs(collection(db, 'enquiries'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((e: any) => !e.status || !['deleted', 'rejected', 'draft'].includes(String(e.status).toLowerCase())) as EnquiryForMatch[];
}

export const MIN_MATCH_SCORE = 45;

/**
 * Compute all matches for a user, both directions:
 *  - forNeeds: live listings matching this user's live enquiries
 *  - forListings: live enquiries matching this user's live listings
 * Skips the user's own listings/enquiries (never match yourself).
 */
export async function computeUserMatches(userId: string): Promise<UserMatches> {
  const [listings, enquiries] = await Promise.all([fetchLiveListings(), fetchLiveEnquiries()]);

  const myEnquiries = enquiries.filter((e) => e.userId === userId && isEnquiryLive(e));
  const myListings = listings.filter((l) => l.sellerId === userId);

  const forNeeds: MatchItem[] = [];
  for (const e of myEnquiries) {
    for (const l of listings) {
      if (l.sellerId === userId) continue; // never match own listing
      const { score, reasons } = scoreMatch(l, e);
      if (score >= MIN_MATCH_SCORE) {
        forNeeds.push({ listingId: l.id, enquiryId: e.id, score, label: labelFor(score), reasons, listing: l, enquiry: e });
      }
    }
  }
  forNeeds.sort((a, b) => b.score - a.score);

  const forListings: MatchItem[] = [];
  for (const l of myListings) {
    if (l.status !== 'live') continue;
    for (const e of enquiries) {
      if (e.userId === userId) continue; // never match own enquiry
      if (!isEnquiryLive(e)) continue;
      const { score, reasons } = scoreMatch(l, e);
      if (score >= MIN_MATCH_SCORE) {
        forListings.push({ listingId: l.id, enquiryId: e.id, score, label: labelFor(score), reasons, listing: l, enquiry: e });
      }
    }
  }
  forListings.sort((a, b) => b.score - a.score);

  return { forNeeds, forListings, computedAt: Date.now() };
}

/**
 * Matches for ONE enquiry — used right after posting (success screen strip)
 * and by notification flows.
 */
export async function matchesForEnquiry(enquiry: EnquiryForMatch, listings?: SellListing[]): Promise<MatchItem[]> {
  const pool = listings ?? (await fetchLiveListings());
  const out: MatchItem[] = [];
  for (const l of pool) {
    if (l.sellerId === enquiry.userId) continue;
    const { score, reasons } = scoreMatch(l, enquiry);
    if (score >= MIN_MATCH_SCORE) {
      out.push({ listingId: l.id, enquiryId: enquiry.id, score, label: labelFor(score), reasons, listing: l, enquiry });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Matches for ONE listing (used right after publishing).
 */
export async function matchesForListing(listing: SellListing, enquiries?: EnquiryForMatch[]): Promise<MatchItem[]> {
  const pool = enquiries ?? (await fetchLiveEnquiries());
  const out: MatchItem[] = [];
  for (const e of pool) {
    if (e.userId === listing.sellerId) continue;
    if (!isEnquiryLive(e)) continue;
    const { score, reasons } = scoreMatch(listing, e);
    if (score >= MIN_MATCH_SCORE) {
      out.push({ listingId: listing.id, enquiryId: e.id, score, label: labelFor(score), reasons, listing, enquiry: e });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}

// ---------- Firestore-backed notifications (bell + notifications page) ----------

/**
 * Store a match notification for a user. Uses the 'notifications' Firestore
 * collection so it shows in the bell across devices (not just localStorage).
 * Non-blocking: failures are logged, never thrown.
 */
export async function notifyMatch(params: {
  userId: string;
  side: 'buyer' | 'seller';
  count: number;
  topScore: number;
  listingTitle?: string;
  enquiryTitle?: string;
  targetUrl: string;
}): Promise<void> {
  try {
    const { userId, side, count, topScore, listingTitle, enquiryTitle, targetUrl } = params;
    const isBuyer = side === 'buyer';
    const title = isBuyer
      ? count === 1 ? '🔥 We found what you need!' : `🔥 ${count} listings match your need!`
      : count === 1 ? '👥 A buyer needs this!' : `👥 ${count} buyers need this!`;
    const message = isBuyer
      ? `${listingTitle ?? 'A listing'} · ${topScore}% match with your enquiry`
      : `Your listing "${enquiryTitle ? '' : ''}${listingTitle ?? ''}" matches ${count === 1 ? 'an enquiry' : 'enquiries'}`;
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'match',
      side,
      title,
      message: isBuyer
        ? `${listingTitle ?? 'A listing'} matched your enquiry — ${topScore}%`
        : `${count} active ${count === 1 ? 'buyer' : 'buyers'} match your listing${listingTitle ? ` "${listingTitle}"` : ''}`,
      score: topScore,
      targetUrl,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('notifyMatch failed (non-blocking):', error);
  }
}

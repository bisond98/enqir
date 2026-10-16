// src/lib/profileCache.ts
//
// Shared, TTL-based cache for seller/poster profile lookups. Every list page
// (Marketplace, EnquiryWall, Dashboard cards) used to re-fetch the same
// userProfiles docs on each snapshot / listings change — this dedupes those
// reads across pages and across re-renders.
//
// - 5-minute TTL: profile edits (name, avatar, verification) still show up
//   quickly, but repeated page visits / snapshots within the window are free.
// - In-flight dedupe: concurrent identical batch queries share one promise.
// - Missing profiles are cached too (null), so unknown uids don't hammer Firestore.

import { db } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export type ProfileMap = Record<string, any>;

const TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { data: any; at: number }>();
const inflight = new Map<string, Promise<any>>();

// sessionStorage mirror of the same entries — survives the full-page reloads
// triggered by sign-out (`window.location.href = '/'`) and stale-chunk
// recovery, so re-entering the app repaints names/trust badges instantly
// instead of re-fetching them. Same TTL, same values, purely additive; every
// access is try/catch-guarded (private mode, quota).
const SS_PREFIX = 'enqir_profile_v1:';

function ssRead(uid: string): { data: any; at: number } | null {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + uid);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.at !== 'number') return null;
    if (Date.now() - entry.at >= TTL_MS) {
      sessionStorage.removeItem(SS_PREFIX + uid);
      return null;
    }
    return entry as { data: any; at: number };
  } catch {
    return null;
  }
}

function ssWrite(uid: string, entry: { data: any; at: number }) {
  try {
    sessionStorage.setItem(SS_PREFIX + uid, JSON.stringify(entry));
  } catch {
    /* private mode or quota — memory tier still works */
  }
}

/** Synchronous cache hit (or null). Use to render instantly while fetching. */
export function getCachedProfile(uid: string): any | null {
  const entry = cache.get(uid);
  if (entry && Date.now() - entry.at < TTL_MS) return entry.data;
  // Memory tier missed (fresh page load) — promote the persisted entry.
  const persisted = ssRead(uid);
  if (persisted) {
    cache.set(uid, persisted);
    return persisted.data;
  }
  return null;
}

/** Insert profiles into the cache (e.g. from a page that already fetched them). */
export function primeProfiles(profiles: ProfileMap) {
  const at = Date.now();
  Object.entries(profiles).forEach(([uid, data]) => {
    if (uid) {
      const entry = { data: data ?? null, at };
      cache.set(uid, entry);
      ssWrite(uid, entry);
    }
  });
}

/** Single profile by doc id, cached. Falls back to a live read on miss. */
export async function fetchProfileByUid(uid: string): Promise<any | null> {
  const hit = getCachedProfile(uid);
  if (hit !== null) return hit;
  try {
    const snap = await getDoc(doc(db, 'userProfiles', uid));
    const data = snap.exists() ? snap.data() : null;
    const entry = { data, at: Date.now() };
    cache.set(uid, entry);
    ssWrite(uid, entry);
    return data;
  } catch {
    return null;
  }
}

async function batchQuery(batch: string[]): Promise<ProfileMap> {
  const key = `in:${batch.join(',')}`;
  let promise = inflight.get(key);
  if (!promise) {
    promise = getDocs(query(collection(db, 'userProfiles'), where('userId', 'in', batch)))
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
  }
  const snap = await promise;
  const out: ProfileMap = {};
  snap.forEach((d) => {
    const data = d.data();
    const uid = (data?.userId as string) || d.id;
    if (uid) out[uid] = data;
  });
  return out;
}

async function fallbackDocRead(batch: string[]): Promise<ProfileMap> {
  const out: ProfileMap = {};
  await Promise.all(batch.map(async (uid) => {
    try {
      let snap = await getDoc(doc(db, 'userProfiles', uid));
      if (!snap.exists()) snap = await getDoc(doc(db, 'profiles', uid));
      out[uid] = snap.exists() ? snap.data() : null;
    } catch {
      out[uid] = null;
    }
  }));
  return out;
}

/**
 * Fetch profiles for a set of uids using batched `in` queries (max 10 per
 * query) with a shared 5-minute cache. Results are keyed by uid; uids whose
 * profile couldn't be read map to null (same shape the pages built by hand).
 *
 * A uid found via the `userId` field query wins; uids not covered by that
 * query are re-read by doc id (covers legacy profiles whose doc id is the uid
 * but whose userId field differs or is missing).
 */
export async function fetchProfilesByUids(uids: string[]): Promise<ProfileMap> {
  const out: ProfileMap = {};
  const now = Date.now();
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const uid of uids) {
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    const entry = cache.get(uid);
    if (entry && now - entry.at < TTL_MS) {
      out[uid] = entry.data;
    } else {
      // Promote from the persisted tier before treating the uid as missing.
      const persisted = ssRead(uid);
      if (persisted) {
        cache.set(uid, persisted);
        out[uid] = persisted.data;
      } else {
        missing.push(uid);
      }
    }
  }
  if (missing.length === 0) return out;

  const fetched: ProfileMap = {};
  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += 10) batches.push(missing.slice(i, i + 10));

  await Promise.all(batches.map(async (batch) => {
    let found: ProfileMap = {};
    let queryOk = true;
    try {
      found = await batchQuery(batch);
    } catch {
      queryOk = false; // `in` query can fail (rules/index) — fall back to doc reads
    }
    const leftovers = queryOk ? batch.filter((uid) => !(uid in found)) : batch;
    if (leftovers.length > 0) {
      Object.assign(found, await fallbackDocRead(leftovers));
    }
    Object.assign(fetched, found);
  }));

  primeProfiles(fetched);
  Object.assign(out, fetched);
  return out;
}

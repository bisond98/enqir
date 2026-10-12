import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * getUserDisplayName — one resolver for how a user's name shows app-wide.
 *
 * Priority: saved profile name (userProfiles/{uid}.fullName) → Firebase
 * auth displayName → "#userXXXX" neutral ID (last 4 of uid, zero-padded
 * uniqueness within a typical user base). Never falls back to an email
 * prefix, so private email handles stop leaking as display names.
 *
 * Loaded user objects (already-fetched profile docs) can be passed via
 * opts to avoid duplicate Firestore reads in list rendering.
 */
export function shortUserId(uid: string): string {
  const digits = (uid.replace(/\D/g, '') || '0').slice(-4);
  return `#user${digits.padStart(4, '0')}`;
}

export type DisplayNameRefs = {
  /** userProfiles doc data, if already fetched */
  profile?: { fullName?: string; username?: string } | null;
  /** users doc data, if already fetched */
  userDoc?: { displayName?: string } | null;
};

export async function resolveUserDisplayName(
  uid: string,
  authUser: { displayName?: string | null; email?: string | null } | null,
  opts?: DisplayNameRefs
): Promise<string> {
  // 1. Saved profile name (user's own chosen username/full name)
  let profile = opts?.profile;
  if (profile === undefined) {
    try {
      const snap = await getDoc(doc(db, 'userProfiles', uid));
      profile = snap.exists() ? (snap.data() as { fullName?: string; username?: string }) : null;
    } catch { profile = null; }
  }
  const savedName = profile?.username?.trim() || trustedName(profile?.fullName);
  if (savedName) return savedName;

  // 2. Firebase auth display name (given name at signup — but it is often
  // the email prefix, so only trust it when it doesn't look like an email handle)
  const dn = authUser?.displayName?.trim();
  if (dn && !dn.includes('@') && !dn.includes('.')) return dn;

  // 3. users/{uid}.displayName written by phone sign-in (same trust rule)
  let userDoc = opts?.userDoc;
  if (userDoc === undefined) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      userDoc = snap.exists() ? (snap.data() as { displayName?: string }) : null;
    } catch { userDoc = null; }
  }
  const pdn = userDoc?.displayName?.trim();
  if (pdn && !pdn.includes('@') && !pdn.includes('.')) return pdn;

  // 4. Neutral unique ID — never an email prefix
  return shortUserId(uid);
}

/**
 * A STORED display name (chat senderName, sellerName, etc.) is only shown
 * when it doesn't look like an email or email prefix; otherwise callers fall
 * back to the neutral #userXXXX id. Old docs predate the "never email"
 * rule, so render-time must not trust them blindly.
 */
export function trustedName(name?: string | null): string {
  const n = (name || '').trim();
  if (!n || n.includes('@') || n.includes('.')) return '';
  return n;
}

/**
 * Sync helper for a userProfiles/{uid} doc already in hand (list/map
 * rendering). Prefers the user's chosen username, then their saved full
 * name, then the given fallback — never an email prefix.
 */
export function profileDisplayName(
  profile: { username?: string; fullName?: string } | null | undefined,
  fallback = ''
): string {
  // fullName is only trusted when it doesn't look like an email handle —
  // old accounts had email prefixes auto-saved into that field.
  const name = profile?.username?.trim() || trustedName(profile?.fullName);
  return name || fallback;
}

/**
 * Sync variant for the current user when the profile is already in hand —
 * used on write paths (chat messages, responses) that must not be delayed.
 */
export function displayNameForUser(
  authUser: { displayName?: string | null; email?: string | null } | null,
  savedFullName?: string | null,
  savedUsername?: string | null
): string {
  const savedName = savedUsername?.trim() || trustedName(savedFullName);
  if (savedName) return savedName;
  const dn = authUser?.displayName?.trim();
  if (dn && !dn.includes('@') && !dn.includes('.')) return dn;
  return shortUserId(authUser?.uid || '');
}

export default resolveUserDisplayName;

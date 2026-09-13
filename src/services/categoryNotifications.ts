// Category Notifications — fan out in-app notifications to users whose
// liked categories match a newly published listing or enquiry.
// Stored in the 'notifications' Firestore collection (same as match notifications),
// so they appear in the bell + notifications page across devices.
// Non-blocking by design: callers fire-and-forget, failures are logged.

import { db } from '@/firebase';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

interface LikedUser {
  uid: string;
  likedCategories: string[];
  notifyListings: boolean;
  notifyEnquiries: boolean;
}

async function fetchLikedUsers(): Promise<LikedUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...(d.data() as any) }))
    .filter((u: any) => Array.isArray(u.likedCategories) && u.likedCategories.length > 0)
    .map((u: any) => ({
      uid: u.uid,
      likedCategories: u.likedCategories as string[],
      notifyListings: u.likedNotifyListings !== false,
      notifyEnquiries: u.likedNotifyEnquiries !== false,
    }));
}

// Categories on both listings and enquiries can be single or multi.
const categoriesOf = (c: string | null, cs?: string[] | null): string[] => {
  const set = new Set<string>();
  if (c) set.add(c);
  if (Array.isArray(cs)) cs.forEach(v => v && set.add(v));
  return Array.from(set);
};

async function fanOut(params: {
  kind: 'listing' | 'enquiry';
  categories: string[];
  authorId: string;
  title: string;
  targetUrl: string;
}) {
  try {
    const { kind, categories, authorId, title, targetUrl } = params;
    if (categories.length === 0) return;
    const users = await fetchLikedUsers();
    const catSet = new Set(categories);

    await Promise.all(users
      .filter(u => u.uid !== authorId)
      .filter(u => (kind === 'listing' ? u.notifyListings : u.notifyEnquiries))
      .filter(u => u.likedCategories.some(c => catSet.has(c)))
      .slice(0, 200) // safety cap per post
      .map(u => addDoc(collection(db, 'notifications'), {
        userId: u.uid,
        type: kind === 'listing' ? 'new_listing_in_liked_category' : 'new_enquiry_in_liked_category',
        title: kind === 'listing' ? '🆕 New listing in a category you like' : '🛎️ New enquiry in a category you like',
        message: kind === 'listing'
          ? `Someone just listed "${title}" — in a category you're following`
          : `Someone needs "${title}" — in a category you're following`,
        targetUrl,
        read: false,
        createdAt: serverTimestamp(),
      }))
    );
  } catch (error) {
    console.error('categoryNotifications fanOut failed (non-blocking):', error);
  }
}

export const notifyNewListing = (params: { categories: string[]; authorId: string; title: string; targetUrl: string }) =>
  fanOut({ kind: 'listing', ...params });

export const notifyNewEnquiry = (params: { categories: string[]; authorId: string; title: string; targetUrl: string }) =>
  fanOut({ kind: 'enquiry', ...params });

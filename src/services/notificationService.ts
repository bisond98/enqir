/**
 * Firestore-backed realtime notification service.
 *
 * - Notifications are stored in the `notifications` collection (one doc per
 *   notification) so they sync across devices and update the bell in realtime
 *   via onSnapshot.
 * - Chat-message notifications are intentionally EXCLUDED here: unread chat
 *   messages are surfaced only on the header Chats icon badge (Layout.tsx),
 *   never in the bell / notifications page.
 */

import { db } from '@/firebase';
import {
  collection,
  query,
  where,
  limit as fsLimit,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: 'admin_approval' | 'new_response' | 'new_chat' | 'enquiry_update' | 'achievement' | 'reminder' | 'system' | 'payment' | 'call';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt?: any; // Firestore serverTimestamp
}

const NOTIFICATIONS_COLLECTION = 'notifications';
const MAX_NOTIFICATIONS = 30;

/** Chat-type notifications never appear in the bell / notifications page. */
function isBellVisible(n: RealtimeNotification): boolean {
  return n.type !== 'new_chat';
}

/** Convert a Firestore doc snapshot into the UI notification shape. */
function mapDoc(id: string, data: any): RealtimeNotification {
  const ts = data?.createdAt;
  let createdAt: any = undefined;
  if (ts instanceof Timestamp) createdAt = ts.toDate();
  else if (ts?.toDate && typeof ts.toDate === 'function') createdAt = ts.toDate();
  else if (ts) createdAt = new Date(ts);

  return {
    id,
    userId: data.userId,
    type: data.type || 'system',
    title: data.title || 'Notification',
    message: data.message || '',
    priority: data.priority || 'medium',
    read: !!data.read,
    actionUrl: data.actionUrl,
    actionText: data.actionText,
    createdAt,
  };
}

/**
 * Realtime subscription to the current user's notifications (bell-visible only).
 * Returns the unsubscribe function.
 */
export function subscribeToUserNotifications(
  userId: string,
  onChange: (notifications: RealtimeNotification[], unreadCount: number) => void,
  onError?: (err: any) => void
): () => void {
  // Single equality filter — no composite index required. Sorting client-side.
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    fsLimit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map(d => mapDoc(d.id, d.data()))
        .filter(isBellVisible)
        .sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        })
        .slice(0, MAX_NOTIFICATIONS);

      const unread = items.filter(n => !n.read).length;
      onChange(items, unread);
    },
    (err) => {
      console.error('Notification listener error:', err);
      onError?.(err);
    }
  );
}

/** Create a notification for any user (fire-and-forget safe). */
export async function pushNotification(
  targetUserId: string,
  data: {
    type: RealtimeNotification['type'];
    title: string;
    message: string;
    priority?: RealtimeNotification['priority'];
    actionUrl?: string;
    actionText?: string;
  }
): Promise<string | null> {
  try {
    if (!targetUserId) return null;
    const ref = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: targetUserId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      read: false,
      actionUrl: data.actionUrl || null,
      actionText: data.actionText || null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error('Failed to push notification:', err);
    return null;
  }
}

export async function setNotificationRead(notificationId: string, read: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { read });
  } catch (err) {
    console.error('Failed to update notification read state:', err);
    throw err;
  }
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const unread = snap.docs.filter(d => !d.data().read);
    await Promise.all(unread.map(d => updateDoc(d.ref, { read: true })));
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
    throw err;
  }
}

export async function clearAllUserNotifications(userId: string): Promise<void> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  } catch (err) {
    console.error('Failed to clear notifications:', err);
    throw err;
  }
}

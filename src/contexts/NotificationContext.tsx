/**
 * Notification Context — realtime (Firestore-backed)
 *
 * Global state management for notifications. Backed by the `notifications`
 * collection via onSnapshot so the bell badge and notifications page update
 * in realtime across all devices/tabs.
 *
 * NOTE: chat-message notifications ('new_chat') are EXCLUDED from this
 * context — unread chat messages are surfaced only on the header Chats
 * icon badge, per product decision.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToUserNotifications,
  pushNotification,
  setNotificationRead,
  markAllUserNotificationsRead,
  clearAllUserNotifications,
  RealtimeNotification,
} from '@/services/notificationService';

interface NotificationContextType {
  notifications: RealtimeNotification[];
  unreadCount: number;
  loading: boolean;
  preferences: null;

  // Actions
  createNotification: (type: RealtimeNotification['type'], data: any) => Promise<void>;
  createNotificationForUser: (targetUserId: string, type: RealtimeNotification['type'], data: any) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Realtime subscription — fires on any change (new notification, read state,
  // clear) from any device or tab. Auto-cleans up when the user signs out.
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(user.uid, (items, unread) => {
      setNotifications(items);
      setUnreadCount(unread);
    });

    return unsubscribe;
  }, [user?.uid]);

  const createNotification = async (type: RealtimeNotification['type'], data: any) => {
    if (!user?.uid) return;
    // Self-notifications are skipped for chat-type (never bell-visible anyway)
    await pushNotification(user.uid, {
      type,
      title: data.title || '',
      message: data.message || '',
      priority: data.priority,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
    });
  };

  const createNotificationForUser = async (targetUserId: string, type: RealtimeNotification['type'], data: any) => {
    if (!targetUserId) return;
    // Never notify the actor about their own action
    if (targetUserId === user?.uid && type === 'new_chat') return;
    await pushNotification(targetUserId, {
      type,
      title: data.title || '',
      message: data.message || '',
      priority: data.priority,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
    });
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.uid || !notificationId) return;
    // Optimistic local update, then persist (listener will reconcile)
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, unreadCount - 1));
    try {
      await setNotificationRead(notificationId, true);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    if (!user?.uid || !notificationId) return;
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: false } : n))
    );
    setUnreadCount(prev => prev + 1);
    try {
      await setNotificationRead(notificationId, false);
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllUserNotificationsRead(user.uid);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.uid) return;
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearAllUserNotifications(user.uid);
      // Broadcast so any legacy localStorage listeners stay in sync
      try {
        localStorage.setItem('notifications_cleared_at', Date.now().toString());
        window.dispatchEvent(new CustomEvent('notificationsCleared'));
      } catch {
        // Ignore storage errors
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      throw err;
    }
  };

  const updatePreferences = async (_newPreferences: any) => {
    // Preferences are not used by the realtime system yet; kept for API compat.
    return;
  };

  const refreshNotifications = async () => {
    // Data is realtime via onSnapshot — no manual refresh needed.
    return;
  };

  // Disabled: no browser permission prompt in the realtime system yet.
  const requestNotificationPermission = async () => {
    return;
  };

  const value: NotificationContextType = {
    notifications: Array.isArray(notifications) ? notifications : [],
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    loading,
    preferences: null,
    createNotification,
    createNotificationForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllNotifications,
    updatePreferences,
    refreshNotifications,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

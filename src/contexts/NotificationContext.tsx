/**
 * Notification Context
 * Global state management for smart notifications
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  smartNotificationService, 
  NotificationData, 
  UserNotificationPreferences 
} from '@/services/ai/notifications';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  preferences: UserNotificationPreferences | null;
  
  // Actions
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>;
  createNotificationForUser: (targetUserId: string, type: NotificationData['type'], data: any) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserNotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notifications when user changes
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
      return;
    }

    const initialize = async () => {
      try {
        // Clear all old notifications on first load
        await clearAllOldNotifications();
        await initializeNotifications();
        // Don't load any existing notifications - start fresh
        setNotifications([]);
        setUnreadCount(0);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [user?.uid]);

  // Clear all old notifications from localStorage
  const clearAllOldNotifications = async () => {
    try {
      // Clear all notification-related localStorage keys
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('notification') || key.includes('notif')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all old notifications from localStorage');
    } catch (error) {
      console.error('Failed to clear old notifications:', error);
    }
  };

  const initializeNotifications = async () => {
    if (!user?.uid) return;
    await smartNotificationService.initializeUserNotifications(user.uid);
  };

  const refreshNotifications = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Only load notifications created from NOW onwards (no past notifications)
      const now = new Date();
      const userNotifications = await smartNotificationService.getUserNotifications(user.uid, 20);
      
      // Ensure notifications array is valid
      const validNotifications = Array.isArray(userNotifications) ? userNotifications : [];
      
      // STRICT: Only show notifications created from now onwards (no past ones)
      const futureNotifications = validNotifications.filter(n => {
        if (!n || !n.timestamp) return false;
        const notifDate = n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp);
        // Only include if timestamp is from current session (after app loaded)
        return notifDate >= now;
      });
      
      setNotifications(futureNotifications);
      
      const unread = futureNotifications.filter(n => n && !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      // Set empty array on error to prevent crashes
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications when marked as read to update badge
  const markAsRead = async (notificationId: string) => {
    if (!user?.uid || !notificationId) return;
    
    try {
      // Check if notification is already read to prevent double-decrement
      const currentNotification = notifications.find(n => n.id === notificationId);
      if (currentNotification && currentNotification.read) {
        // Already read, no need to update
        return;
      }
      
      await smartNotificationService.markAsRead(user.uid, notificationId);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count only if it was previously unread
      if (currentNotification && !currentNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Don't refresh - local state is sufficient to prevent infinite loops
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId: string) => {
    if (!user?.uid || !notificationId) return;
    
    try {
      // Check if notification is already unread to prevent double-increment
      const currentNotification = notifications.find(n => n.id === notificationId);
      if (currentNotification && !currentNotification.read) {
        // Already unread, no need to update
        return;
      }
      
      await smartNotificationService.markAsUnread(user.uid, notificationId);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      
      // Update unread count only if it was previously read
      if (currentNotification?.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Don't refresh - local state is sufficient to prevent infinite loops
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      // Only process unread notifications to avoid unnecessary operations
      const unreadNotifications = notifications.filter(n => n && !n.read);
      
      if (unreadNotifications.length === 0) {
        // Already all read, no need to update
        return;
      }
      
      // Mark all unread notifications as read
      for (const notification of unreadNotifications) {
        if (notification.id) {
          await smartNotificationService.markAsRead(user.uid, notification.id);
        }
      }
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Don't refresh - local state is sufficient to prevent infinite loops
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const createNotification = async (type: NotificationData['type'], data: any) => {
    if (!user?.uid) return;
    
    try {
      const notification = await smartNotificationService.createNotification(user.uid, type, data);
      
      // Update local state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Don't refresh - local state is sufficient to prevent infinite loops
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const createNotificationForUser = async (targetUserId: string, type: NotificationData['type'], data: any) => {
    if (!targetUserId) return;
    
    try {
      await smartNotificationService.createNotification(targetUserId, type, data);
      
      // If it's for current user, refresh (this is needed for notifications created from external sources)
      if (targetUserId === user?.uid) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Failed to create notification for user:', error);
    }
  };


  const clearAllNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      await smartNotificationService.clearAllNotifications(user.uid);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserNotificationPreferences>) => {
    if (!user?.uid) return;
    
    try {
      await smartNotificationService.saveUserPreferences(user.uid, newPreferences);
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  // COMPLETELY DISABLED: Request notification permission
  const requestNotificationPermission = async () => {
    // DO NOTHING
    return false;
  };

  // Expose permission request function
  const value: NotificationContextType = {
    notifications: Array.isArray(notifications) ? notifications : [],
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    loading: typeof loading === 'boolean' ? loading : false,
    preferences,
    createNotification,
    createNotificationForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllNotifications,
    updatePreferences,
    refreshNotifications,
    requestNotificationPermission
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

// Export notification helper functions
export const createAdminApprovalNotification = (
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>,
  approved: boolean,
  itemType: string,
  actionUrl?: string
) => {
  // COMPLETELY DISABLED
  return Promise.resolve();
};

export const createNewResponseNotification = (
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>,
  enquiryId: string,
  enquiryTitle: string,
  sellerId: string,
  sellerName: string
) => {
  // COMPLETELY DISABLED
  return Promise.resolve();
};

export const createNewChatNotification = (
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>,
  enquiryId: string,
  enquiryTitle: string,
  senderId: string,
  senderName: string
) => {
  // COMPLETELY DISABLED
  return Promise.resolve();
};

export const createEnquiryUpdateNotification = (
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>,
  enquiryId: string,
  enquiryTitle: string,
  updateType: string
) => {
  // COMPLETELY DISABLED
  return Promise.resolve();
};

export const createAchievementNotification = (
  createNotification: (type: NotificationData['type'], data: any) => Promise<void>,
  message: string,
  achievementType: string,
  actionUrl?: string
) => {
  // COMPLETELY DISABLED
  return Promise.resolve();
};

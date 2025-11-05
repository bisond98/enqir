/**
 * AI-Powered Smart Notifications Service
 * Provides intelligent, context-aware notifications with optimal timing
 */

export interface NotificationData {
  id: string;
  type: 'admin_approval' | 'new_response' | 'new_chat' | 'enquiry_update' | 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface UserNotificationPreferences {
  userId: string;
  enabledTypes: string[];
  quietHours: { start: string; end: string };
  frequency: 'immediate' | 'batched' | 'daily';
  lastActivityTime?: Date;
  timezone?: string;
}

export interface NotificationAnalytics {
  totalSent: number;
  readRate: number;
  clickRate: number;
  userEngagement: number;
  optimalTiming: { hour: number; engagement: number }[];
}

class SmartNotificationService {
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private analytics: Map<string, NotificationAnalytics> = new Map();

  /**
   * Initialize notification service for user
   */
  async initializeUserNotifications(userId: string): Promise<void> {
    try {
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        console.warn('Invalid userId provided to initializeUserNotifications');
        return;
      }

      // Get user preferences from localStorage or default settings
      const preferences = this.getUserPreferences(userId);
      this.userPreferences.set(userId, preferences);
      
      // Initialize analytics
      this.analytics.set(userId, {
        totalSent: 0,
        readRate: 0,
        clickRate: 0,
        userEngagement: 0,
        optimalTiming: []
      });

      console.log('Smart notifications initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Don't throw the error to prevent app crashes
    }
  }

  /**
   * Get user notification preferences
   */
  private getUserPreferences(userId: string): UserNotificationPreferences {
    try {
      const stored = localStorage.getItem(`notification_prefs_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse stored notification preferences:', error);
    }

    // Default preferences
    return {
      userId,
      enabledTypes: ['admin_approval', 'new_response', 'new_chat', 'enquiry_update', 'achievement'],
      quietHours: { start: '22:00', end: '07:00' },
      frequency: 'immediate',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<void> {
    try {
      const current = this.userPreferences.get(userId) || this.getUserPreferences(userId);
      const updated = { ...current, ...preferences };
      
      this.userPreferences.set(userId, updated);
      localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Generate smart notification content
   */
  generateNotificationContent(
    type: NotificationData['type'],
    data: any,
    userId: string
  ): Omit<NotificationData, 'id' | 'timestamp' | 'read'> {
    const preferences = this.userPreferences.get(userId);
    const isQuietTime = this.isQuietTime(preferences);

    switch (type) {
      case 'admin_approval':
        return {
          type,
          title: data.title || (data.approved ? 'Approved! 🎉' : 'Update Required'),
          message: data.message || (data.approved 
            ? `${data.itemType || 'Item'} has been approved and is now live!`
            : `${data.itemType || 'Item'} needs some updates. Please check the requirements.`),
          priority: data.priority || (data.approved ? 'medium' : 'high'),
          actionUrl: data.actionUrl,
          actionText: data.actionText || (data.approved ? 'View Now' : 'Update Now'),
          metadata: { approved: data.approved, itemType: data.itemType }
        };

      case 'new_response':
        return {
          type,
          title: data.title || 'New Response! 💬',
          message: data.message || `You got a response to "${data.enquiryTitle || 'your enquiry'}" from ${data.sellerName || 'a seller'}`,
          priority: data.priority || 'high',
          actionUrl: data.actionUrl || `/enquiry/${data.enquiryId}/responses?sellerId=${data.sellerId}`,
          actionText: data.actionText || 'View Response',
          metadata: { enquiryId: data.enquiryId, sellerId: data.sellerId }
        };

      case 'new_chat':
        return {
          type,
          title: data.title || 'New Message! 📱',
          message: data.message || `New message from ${data.senderName || 'someone'} about "${data.enquiryTitle || 'your enquiry'}"`,
          priority: data.priority || 'high',
          actionUrl: data.actionUrl || `/enquiry/${data.enquiryId}/responses?sellerId=${data.senderId}`,
          actionText: data.actionText || 'Chat Now',
          metadata: { enquiryId: data.enquiryId, senderId: data.senderId }
        };

      case 'enquiry_update':
        return {
          type,
          title: data.title || 'Enquiry Update 📊',
          message: data.message || `Your enquiry has been updated`,
          priority: data.priority || 'medium',
          actionUrl: data.actionUrl || `/enquiry/${data.enquiryId}`,
          actionText: data.actionText || 'View Details',
          metadata: { enquiryId: data.enquiryId, updateType: data.updateType }
        };

      case 'achievement':
        return {
          type,
          title: 'Achievement Unlocked! 🏆',
          message: data.message,
          priority: 'medium',
          actionUrl: data.actionUrl,
          actionText: 'View Achievement',
          metadata: { achievementType: data.achievementType }
        };

      case 'reminder':
        return {
          type,
          title: 'Reminder ⏰',
          message: data.message,
          priority: 'low',
          actionUrl: data.actionUrl,
          actionText: 'Take Action',
          metadata: { reminderType: data.reminderType }
        };

      case 'system':
        return {
          type,
          title: 'System Update 🔧',
          message: data.message,
          priority: 'low',
          actionUrl: data.actionUrl,
          actionText: 'Learn More',
          metadata: { systemType: data.systemType }
        };

      default:
        return {
          type,
          title: 'Notification',
          message: data.message || 'You have a new notification',
          priority: 'medium',
          actionUrl: data.actionUrl,
          actionText: 'View',
          metadata: data
        };
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietTime(preferences?: UserNotificationPreferences): boolean {
    if (!preferences?.quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime || currentTime <= endTime;
  }

  /**
   * Determine optimal delivery time
   */
  getOptimalDeliveryTime(userId: string, priority: NotificationData['priority']): Date {
    const preferences = this.userPreferences.get(userId);
    const analytics = this.analytics.get(userId);
    
    // For urgent notifications, send immediately
    if (priority === 'urgent') {
      return new Date();
    }

    // Check quiet hours
    if (this.isQuietTime(preferences)) {
      // Schedule for after quiet hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8 AM
      return tomorrow;
    }

    // Use analytics to find optimal time
    if (analytics?.optimalTiming.length > 0) {
      const bestTime = analytics.optimalTiming.reduce((best, current) => 
        current.engagement > best.engagement ? current : best
      );
      
      const deliveryTime = new Date();
      deliveryTime.setHours(bestTime.hour, 0, 0, 0);
      return deliveryTime;
    }

    // Default to immediate delivery
    return new Date();
  }

  /**
   * Create and queue notification
   */
  async createNotification(
    userId: string,
    type: NotificationData['type'],
    data: any
  ): Promise<NotificationData> {
    try {
      const content = this.generateNotificationContent(type, data, userId);
      const deliveryTime = this.getOptimalDeliveryTime(userId, content.priority);
      
      const notification: NotificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...content,
        timestamp: deliveryTime,
        read: false
      };

      // Store notification
      await this.storeNotification(userId, notification);
      
      // Update analytics
      this.updateAnalytics(userId, 'sent');

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Store notification in localStorage (in real app, this would be a database)
   * ONLY stores fresh notifications (not old ones)
   */
  private async storeNotification(userId: string, notification: NotificationData): Promise<void> {
    try {
      const key = `notifications_${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      // ULTRA-STRICT: Only store if notification is absolutely fresh (within last 30 seconds)
      const now = new Date();
      const notifTime = new Date(notification.timestamp);
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      
      if (notifTime < thirtySecondsAgo) {
        console.log('⚠️ Skipping old notification - too old to store (>30sec)');
        return; // Don't store old notifications
      }
      
      existing.push(notification);
      
      // Keep only last 20 notifications (reduced for speed)
      if (existing.length > 20) {
        existing.splice(0, existing.length - 20);
      }
      
      // Filter out any notifications older than 30 seconds while storing
      const fresh = existing.filter((n: NotificationData) => {
        const t = new Date(n.timestamp);
        return t >= thirtySecondsAgo;
      });
      
      localStorage.setItem(key, JSON.stringify(fresh));
      console.log(`💾 Stored notification (total: ${fresh.length} fresh)`);
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  /**
   * Get user notifications
   * ONLY returns absolutely fresh notifications (last 30 seconds)
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<NotificationData[]> {
    try {
      const key = `notifications_${userId}`;
      const stored = localStorage.getItem(key);
      
      // If no stored data, return empty immediately
      if (!stored) {
        return [];
      }
      
      const notifications = JSON.parse(stored);
      
      // ULTRA-STRICT: Filter out ANY notifications older than 30 seconds
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000); // Only last 30 seconds
      
      const freshNotifications = notifications.filter((n: NotificationData) => {
        if (!n || !n.timestamp) return false;
        const notifTime = new Date(n.timestamp);
        // Only return notifications from last 30 seconds
        return notifTime >= thirtySecondsAgo;
      });
      
      // Sort by timestamp (newest first)
      return freshNotifications
        .sort((a: NotificationData, b: NotificationData) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `notifications_${userId}`;
      const notifications = JSON.parse(localStorage.getItem(key) || '[]');
      
      const notification = notifications.find((n: NotificationData) => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem(key, JSON.stringify(notifications));
        this.updateAnalytics(userId, 'read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `notifications_${userId}`;
      const notifications = JSON.parse(localStorage.getItem(key) || '[]');
      
      const notification = notifications.find((n: NotificationData) => n.id === notificationId);
      if (notification) {
        notification.read = false;
        localStorage.setItem(key, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  }

  /**
   * Update analytics
   */
  private updateAnalytics(userId: string, action: 'sent' | 'read' | 'clicked'): void {
    const analytics = this.analytics.get(userId);
    if (!analytics) return;

    switch (action) {
      case 'sent':
        analytics.totalSent++;
        break;
      case 'read':
        analytics.readRate = (analytics.readRate + 1) / analytics.totalSent;
        break;
      case 'clicked':
        analytics.clickRate = (analytics.clickRate + 1) / analytics.totalSent;
        break;
    }

    this.analytics.set(userId, analytics);
  }

  /**
   * Get notification analytics
   */
  getAnalytics(userId: string): NotificationAnalytics | null {
    return this.analytics.get(userId) || null;
  }

  /**
   * Clear all notifications for user
   */
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const key = `notifications_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }
}

// Export singleton instance
export const smartNotificationService = new SmartNotificationService();

// Export utility functions
export const createNotification = (userId: string, type: NotificationData['type'], data: any) =>
  smartNotificationService.createNotification(userId, type, data);

export const getUserNotifications = (userId: string, limit?: number) =>
  smartNotificationService.getUserNotifications(userId, limit);

export const markNotificationAsRead = (userId: string, notificationId: string) =>
  smartNotificationService.markAsRead(userId, notificationId);

export const initializeNotifications = (userId: string) =>
  smartNotificationService.initializeUserNotifications(userId);

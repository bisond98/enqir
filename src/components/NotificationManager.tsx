import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { NotificationContext } from '@/contexts/NotificationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNotificationPopup } from './MobileNotificationPopup';
import { NotificationData } from '@/services/ai/notifications';

interface ActivePopup {
  notification: NotificationData;
  index: number;
}

export const NotificationManager: React.FC = () => {
  try {
    const context = useContext(NotificationContext);
    const isMobile = useIsMobile();
    const [activePopups, setActivePopups] = useState<ActivePopup[]>([]);
    const shownNotificationIdsRef = useRef<Set<string>>(new Set());
    const lastNotificationCountRef = useRef(0);
    const timeoutRefsRef = useRef<NodeJS.Timeout[]>([]);

    // Safety check - return null if context not available
    if (!context) {
      return null;
    }

    const { notifications = [], markAsRead } = context;

    useEffect(() => {
      try {
        // Only show popups on mobile
        if (!isMobile) {
          // Clear all popups if not mobile
          setActivePopups([]);
          return;
        }

        // Validate notifications array
        if (!Array.isArray(notifications)) {
          return;
        }

        // Get unread notifications that haven't been shown as popups yet
        const unreadNotifications = notifications.filter(
          (n) => n && n.id && typeof n.read === 'boolean' && !n.read && !shownNotificationIdsRef.current.has(n.id)
        );

        // Only process if there are new unread notifications (limit to prevent spam)
        if (unreadNotifications.length > 0 && unreadNotifications.length <= 2) {
          // Clear any existing timeouts
          timeoutRefsRef.current.forEach(timeout => {
            try {
              clearTimeout(timeout);
            } catch (e) {
              // Ignore timeout errors
            }
          });
          timeoutRefsRef.current = [];
          
          // Add new popups with staggered appearance (max 2 at once)
          unreadNotifications.slice(0, 2).forEach((notification, idx) => {
            try {
              const timeout = setTimeout(() => {
                try {
                  setActivePopups((prev) => {
                    // Limit to max 2 popups at once
                    const currentPopups = Array.isArray(prev) ? prev.slice(-1) : [];
                    const newPopup: ActivePopup = {
                      notification,
                      index: currentPopups.length,
                    };
                    
                    // Mark as shown so we don't show it again
                    if (notification.id) {
                      shownNotificationIdsRef.current.add(notification.id);
                    }
                    
                    return [...currentPopups, newPopup];
                  });
                } catch (error) {
                  console.error('Error setting active popup:', error);
                }
              }, idx * 1000); // 1000ms delay between each popup (increased for stability)
              
              timeoutRefsRef.current.push(timeout);
            } catch (error) {
              console.error('Error creating popup timeout:', error);
            }
          });
        }

        lastNotificationCountRef.current = notifications.length;

        // Cleanup function
        return () => {
          try {
            timeoutRefsRef.current.forEach(timeout => {
              try {
                clearTimeout(timeout);
              } catch (e) {
                // Ignore timeout errors
              }
            });
            timeoutRefsRef.current = [];
          } catch (error) {
            console.error('Error in cleanup:', error);
          }
        };
      } catch (error) {
        console.error('Error in notification popup effect:', error);
      }
    }, [notifications, isMobile]);

    const handleDismiss = useCallback((notificationId: string) => {
      if (!notificationId || !markAsRead) return;
      
      try {
        // Mark as read in the notification system
        if (typeof markAsRead === 'function') {
          markAsRead(notificationId);
        }
        
        // Remove from active popups
        setActivePopups((prev) => {
          try {
            if (!Array.isArray(prev)) return [];
            const filtered = prev.filter((popup) => 
              popup && 
              popup.notification && 
              popup.notification.id && 
              popup.notification.id !== notificationId
            );
            // Reindex remaining popups
            return filtered.map((popup, idx) => ({ ...popup, index: idx }));
          } catch (error) {
            console.error('Error filtering popups:', error);
            return [];
          }
        });
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
        // Still remove from popups even if marking as read fails
        setActivePopups((prev) => {
          if (!Array.isArray(prev)) return [];
          return prev.filter((popup) => 
            popup && 
            popup.notification && 
            popup.notification.id !== notificationId
          );
        });
      }
    }, [markAsRead]);

    // Clean up shown IDs periodically to prevent memory issues
    useEffect(() => {
      try {
        if (!Array.isArray(notifications)) return;
        
        const cleanupInterval = setInterval(() => {
          try {
            const currentNotificationIds = new Set(
              notifications.filter(n => n && n.id).map((n) => n.id)
            );
            shownNotificationIdsRef.current = new Set(
              Array.from(shownNotificationIdsRef.current).filter((id) =>
                currentNotificationIds.has(id)
              )
            );
          } catch (error) {
            console.error('Error in cleanup interval:', error);
          }
        }, 60000); // Every minute

        return () => {
          try {
            clearInterval(cleanupInterval);
          } catch (error) {
            console.error('Error clearing cleanup interval:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up cleanup interval:', error);
      }
    }, [notifications]);

    if (!isMobile || activePopups.length === 0) {
      return null;
    }

    // Safely render popups with error boundary
    try {
      return (
        <>
          {activePopups.map((popup) => {
            try {
              if (!popup || !popup.notification || !popup.notification.id) return null;
              return (
                <MobileNotificationPopup
                  key={popup.notification.id}
                  id={popup.notification.id}
                  title={popup.notification.title || 'Notification'}
                  message={popup.notification.message || ''}
                  type={popup.notification.type || 'info'}
                  actionUrl={popup.notification.actionUrl}
                  onDismiss={handleDismiss}
                  index={popup.index || 0}
                />
              );
            } catch (error) {
              console.error('Error rendering popup:', error);
              return null;
            }
          })}
        </>
      );
    } catch (error) {
      console.error('Error rendering notification popups:', error);
      return null;
    }
  } catch (error) {
    console.error('NotificationManager error:', error);
    return null;
  }
};


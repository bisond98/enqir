import React, { useContext, useState } from 'react';
import { NotificationContext } from '@/contexts/NotificationContext';
import { Bell, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const SmartNotifications: React.FC<{ className?: string }> = ({ className = '' }) => {
  const context = useContext(NotificationContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Safety check - return null if context not available
  if (!context) {
    return null;
  }

  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead } = context;

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    if (!notificationId || !markAsRead) return;
    
    try {
      markAsRead(notificationId);
      setIsOpen(false);
      
      if (actionUrl) {
        // Fix old notification URLs that might have wrong format
        let correctedUrl = actionUrl;
        
        // Handle old /enquiry-responses/:id route
        if (actionUrl.startsWith('/enquiry-responses/')) {
          const enquiryId = actionUrl.replace('/enquiry-responses/', '');
          correctedUrl = `/enquiry/${enquiryId}/responses-page`;
        }
        
        navigate(correctedUrl);
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const handleMarkAllRead = () => {
    if (!markAllAsRead) return;
    try {
      markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Fixed positioning for mobile, absolute for desktop */}
          <div className="fixed sm:absolute left-2 right-2 top-16 sm:left-auto sm:right-0 sm:top-12 w-auto sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-5rem)] sm:max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] sm:text-xs bg-gray-800 hover:bg-gray-900 text-white font-medium px-2 py-1 rounded transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 overscroll-contain max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(Array.isArray(notifications) ? notifications : []).slice(0, 5).map((notification) => {
                    if (!notification || !notification.id) return null;
                    try {
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                          className={`p-3 sm:p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                            !notification.read ? 'bg-gray-800/10' : ''
                          }`}
                        >
                          <div className="flex gap-2 sm:gap-3">
                            <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'success' ? 'bg-green-100' :
                              notification.type === 'error' ? 'bg-red-100' :
                              notification.type === 'warning' ? 'bg-yellow-100' :
                              'bg-gray-800/20'
                            }`}>
                              <Check className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                notification.type === 'success' ? 'text-green-600' :
                                notification.type === 'error' ? 'text-red-600' :
                                notification.type === 'warning' ? 'text-yellow-600' :
                                'text-gray-800'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1 line-clamp-2">
                                {notification.title || 'Notification'}
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-600 mb-1 sm:mb-2 line-clamp-2">
                                {notification.message || ''}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-400">
                                {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : 'Just now'}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-800 rounded-full mt-1.5 sm:mt-2" />
                            )}
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering notification:', error);
                      return null;
                    }
                  })}
                </div>
              )}
            </div>
            
            {/* View All Button */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 p-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full text-center text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white py-2 rounded transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SmartNotifications;


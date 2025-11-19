import React, { useContext, useState } from 'react';
import { NotificationContext } from '@/contexts/NotificationContext';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Bell, Check, Trash2, CheckCircle, X, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const context = useContext(NotificationContext);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Safety check - show empty state if context not available
  if (!context) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Notifications not available</p>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const { notifications = [], unreadCount = 0, markAsRead, markAsUnread, markAllAsRead, clearAllNotifications } = context;

  // Safely filter notifications with null checks
  const filteredNotifications = filter === 'unread' 
    ? (Array.isArray(notifications) ? notifications : []).filter(n => n && !n.read)
    : (Array.isArray(notifications) ? notifications : []);

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    if (!notificationId || !markAsRead) return;
    try {
      markAsRead(notificationId);
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

  const handleMarkAsUnread = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (!notificationId || !markAsUnread) return;
    try {
      markAsUnread(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const handleClearAll = async () => {
    if (!clearAllNotifications) {
      console.error('clearAllNotifications function not available');
      return;
    }
    
    // Show confirmation modal
    setConfirmTitle('Clear All Notifications');
    setConfirmMessage('Are you sure you want to delete all notifications? This action cannot be undone.');
    setConfirmAction(async () => {
      try {
        console.log('Clearing all notifications...');
        await clearAllNotifications();
        console.log('✅ All notifications cleared successfully');
        setShowConfirmModal(false);
        // Force a small delay to ensure state updates
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (error) {
        console.error('❌ Failed to clear notifications:', error);
        alert('Failed to clear notifications. Please try again.');
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-3 sm:py-8 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                    <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                      Notifications
                    </h1>
                    <p className="text-xs sm:text-base text-gray-600 mt-0.5 font-medium">
                      {unreadCount > 0 ? (
                        <span className="text-gray-800">
                          {unreadCount} unread{unreadCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">All caught up!</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {unreadCount > 0 && markAllAsRead && (
                    <button
                      onClick={() => {
                        try {
                          markAllAsRead();
                        } catch (error) {
                          console.error('Failed to mark all as read:', error);
                        }
                      }}
                      className="text-[11px] sm:text-sm bg-gray-800 hover:bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation min-h-[36px] sm:min-h-[40px] border border-gray-800"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Mark all read</span>
                      <span className="sm:hidden">Read</span>
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    disabled={!clearAllNotifications}
                    className="text-[11px] sm:text-sm bg-gray-800 hover:bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all duration-200 flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation min-h-[36px] sm:min-h-[40px] border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Clear all</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter Tabs */}
            {notifications.length > 0 && (
              <div className="flex gap-1.5 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-1 sm:p-1.5 shadow-sm border border-gray-200 w-full sm:w-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-[11px] sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all duration-200 flex-1 sm:flex-none text-center touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                    filter === 'all' 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  All <span className="text-[9px] sm:text-xs opacity-90">({notifications.length})</span>
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`text-[11px] sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all duration-200 flex-1 sm:flex-none text-center touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                    filter === 'unread' 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Unread <span className="text-[9px] sm:text-xs opacity-90">({unreadCount})</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="p-6 sm:p-16 text-center bg-white shadow-sm border border-gray-200">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h2>
              <p className="text-xs sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-2">
                {filter === 'unread' 
                  ? 'You\'re all caught up! Check back later for new updates.'
                  : 'When you get notifications, they\'ll appear here.'}
              </p>
              {filter === 'unread' && notifications.length > 0 && (
                <button
                  onClick={() => setFilter('all')}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation min-h-[36px]"
                >
                  View all notifications
                </button>
              )}
            </Card>
          ) : (
            <div className="space-y-2.5 sm:space-y-4">
              {filteredNotifications.map((notification) => {
                if (!notification || !notification.id) return null;
                return (
                <Card
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                  className={`group p-3 sm:p-5 cursor-pointer transition-all duration-200 border touch-manipulation active:scale-[0.98] ${
                    !notification.read 
                      ? 'bg-gray-800/5 border-gray-800/20 shadow-sm hover:shadow-md hover:border-gray-800/30' 
                      : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-2.5 sm:gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm ${
                      notification.type === 'admin_approval' ? 'bg-green-50 border-2 border-green-200' :
                      notification.type === 'new_response' ? 'bg-gray-800/10 border-2 border-gray-800/20' :
                      notification.type === 'new_chat' ? 'bg-gray-800/10 border-2 border-gray-800/20' :
                      notification.type === 'enquiry_update' ? 'bg-yellow-50 border-2 border-yellow-200' :
                      notification.type === 'achievement' ? 'bg-green-50 border-2 border-green-200' :
                      notification.type === 'system' ? 'bg-gray-800/10 border-2 border-gray-800/20' :
                      notification.type === 'reminder' ? 'bg-gray-800/10 border-2 border-gray-800/20' :
                      'bg-gray-800/10 border-2 border-gray-800/20'
                    }`}>
                      <Check className={`w-5 h-5 sm:w-7 sm:h-7 ${
                        notification.type === 'admin_approval' ? 'text-green-600' :
                        notification.type === 'new_response' ? 'text-gray-800' :
                        notification.type === 'new_chat' ? 'text-gray-800' :
                        notification.type === 'enquiry_update' ? 'text-yellow-600' :
                        notification.type === 'achievement' ? 'text-green-600' :
                        notification.type === 'system' ? 'text-gray-800' :
                        notification.type === 'reminder' ? 'text-gray-800' :
                        'text-gray-800'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 line-clamp-2 leading-tight tracking-tight flex-1">
                          {notification.title || 'Notification'}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-800 rounded-full mt-1 sm:mt-1.5 animate-pulse" />
                          )}
                          {notification.read && (
                            <button
                              onClick={(e) => handleMarkAsUnread(notification.id, e)}
                              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 hover:text-gray-700" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs sm:text-base text-gray-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                        {notification.message || 'No message'}
                      </p>
                      
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                        <span className="text-[10px] sm:text-sm text-gray-500 font-medium">
                          {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : 'Just now'}
                        </span>
                        
                        {notification.priority && (
                          <span 
                            className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              notification.priority === 'high' ? 'bg-gray-800 text-white' :
                              notification.priority === 'medium' ? 'bg-gray-600 text-white' :
                              'bg-gray-400 text-white'
                            }`}
                          >
                            {notification.priority}
                          </span>
                        )}
                        
                        {notification.read && (
                          <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Friendly Confirmation Modal */}
      {showConfirmModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-200"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[9999] transition-all duration-300">
            <Card className="mx-3 sm:mx-auto sm:w-[400px] bg-white shadow-2xl border border-gray-200 rounded-t-2xl sm:rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {confirmTitle}
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8">
                  {confirmMessage}
                </p>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation min-h-[44px] active:scale-95 shadow-sm"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Notifications;


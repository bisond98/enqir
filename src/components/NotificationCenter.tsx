import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Check, X, MessageSquare, Heart, AlertCircle, Trophy, CheckCircle, Clock, User, Shield, Star, Zap } from "lucide-react";

interface Notification {
  id: string;
  type: 'message' | 'response' | 'system' | 'achievement' | 'approval' | 'rejection' | 'chat' | 'verification' | 'urgent';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "approval",
      title: "Offer Approved! 🎉",
      description: "Your offer for 'Vintage Maruti 800' has been approved by admin",
      timestamp: "2024-01-08T10:30:00Z",
      isRead: false,
      actionUrl: "/responses",
      priority: "high"
    },
    {
      id: "2",
      type: "chat",
      title: "New Chat Message",
      description: "John sent you a message about the antique clock deal",
      timestamp: "2024-01-08T09:15:00Z",
      isRead: false,
      actionUrl: "/messages/john",
      priority: "medium"
    },
    {
      id: "3",
      type: "response",
      title: "New Response Received",
      description: "Someone responded to your 'Vintage Maruti 800' enquiry",
      timestamp: "2024-01-08T08:45:00Z",
      isRead: false,
      actionUrl: "/enquiries/ENQ001",
      priority: "high"
    },
    {
      id: "4",
      type: "verification",
      title: "Profile Verified ✅",
      description: "Your trust badge verification has been completed",
      timestamp: "2024-01-07T14:20:00Z",
      isRead: true,
      priority: "medium"
    },
    {
      id: "5",
      type: "rejection",
      title: "Offer Rejected",
      description: "Your offer for 'Antique Clock' was rejected by admin",
      timestamp: "2024-01-07T12:00:00Z",
      isRead: true,
      priority: "low"
    },
    {
      id: "6",
      type: "urgent",
      title: "Urgent: Payment Required",
      description: "Complete your payment to finalize the deal",
      timestamp: "2024-01-07T10:00:00Z",
      isRead: true,
      priority: "high"
    }
  ]);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'response':
        return <Heart className="h-4 w-4 text-pink-600" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejection':
        return <X className="h-4 w-4 text-red-600" />;
      case 'verification':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'urgent':
        return <Zap className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  // Get notification type counts for ring display
  const getNotificationTypeCounts = () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    return {
      approval: unreadNotifications.filter(n => n.type === 'approval').length,
      chat: unreadNotifications.filter(n => n.type === 'chat').length,
      response: unreadNotifications.filter(n => n.type === 'response').length,
      urgent: unreadNotifications.filter(n => n.type === 'urgent').length,
      verification: unreadNotifications.filter(n => n.type === 'verification').length,
      rejection: unreadNotifications.filter(n => n.type === 'rejection').length,
    };
  };

  const typeCounts = getNotificationTypeCounts();
  const hasHighPriority = typeCounts.urgent > 0 || typeCounts.approval > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <div className="relative">
            {/* Professional ring design */}
            <div className="relative w-6 h-6">
              <Bell className="h-5 w-5 transition-all duration-200 group-hover:scale-110 text-slate-600 group-hover:text-slate-800" />
              
              {/* Ring indicator for different notification types */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {hasHighPriority ? (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  ) : typeCounts.approval > 0 ? (
                    <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  ) : typeCounts.chat > 0 ? (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-2xl bg-white/98 backdrop-blur-md overflow-hidden">
          {/* Professional header with notification breakdown */}
          <div className="relative p-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  {unreadCount > 0 ? (
                    <div className="flex items-center space-x-2 text-xs text-white/80">
                      <span>{unreadCount} unread</span>
                      {typeCounts.approval > 0 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                          {typeCounts.approval} approved
                        </span>
                      )}
                      {typeCounts.chat > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                          {typeCounts.chat} chats
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60">All caught up</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-white/90 hover:text-white hover:bg-white/20 text-xs px-3 py-1 rounded-full border border-white/20"
                >
                  ✓ Mark all read
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-indigo-500" />
                </div>
                <h4 className="text-base font-semibold text-slate-700 mb-1">All caught up! 🎉</h4>
                <p className="text-slate-500 text-sm">No new updates</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`group p-3 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 cursor-pointer transition-all duration-200 ${
                      !notification.isRead ? 'bg-gradient-to-r from-blue-50/30 to-purple-50/30' : ''
                    } ${notification.priority === 'high' ? 'border-l-2 border-l-red-500' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon with type-based styling */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                          notification.type === 'approval' ? 'bg-green-100 group-hover:bg-green-200' :
                          notification.type === 'rejection' ? 'bg-red-100 group-hover:bg-red-200' :
                          notification.type === 'chat' ? 'bg-blue-100 group-hover:bg-blue-200' :
                          notification.type === 'response' ? 'bg-pink-100 group-hover:bg-pink-200' :
                          notification.type === 'verification' ? 'bg-purple-100 group-hover:bg-purple-200' :
                          notification.type === 'urgent' ? 'bg-red-100 group-hover:bg-red-200' :
                          notification.type === 'system' ? 'bg-orange-100 group-hover:bg-orange-200' :
                          'bg-yellow-100 group-hover:bg-yellow-200'
                        }`}>
                          <div className="scale-75">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-sm font-semibold leading-tight ${
                                !notification.isRead ? 'text-slate-800' : 'text-slate-600'
                              }`}>
                                {notification.title}
                              </h4>
                              {notification.priority === 'high' && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                  URGENT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {notification.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-500 font-medium">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {notification.type === 'approval' && (
                                  <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                                )}
                                {notification.type === 'rejection' && (
                                  <span className="text-xs text-red-600 font-medium">✗ Rejected</span>
                                )}
                              </div>
                              {!notification.isRead && (
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  notification.priority === 'high' ? 'bg-red-500' :
                                  notification.type === 'approval' ? 'bg-green-500' :
                                  notification.type === 'chat' ? 'bg-blue-500' :
                                  'bg-purple-500'
                                }`}></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg"
              >
                <span className="mr-2">👀</span>
                View All Updates
              </Button>
            </div>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
};
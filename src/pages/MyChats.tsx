import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/contexts/ChatContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ShoppingCart, UserCheck, ArrowRight, MessageCircle, Trash2, X, ChevronLeft, ChevronRight, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";

interface ChatThread {
  id: string;
  enquiryId?: string;
  participants: string[];
  lastMessage?: string | { text?: string; senderId?: string; timestamp?: any };
  updatedAt?: any;
  sellerId?: string;
  enquiryTitle?: string; // Added to store enquiry title
  isBuyerChat?: boolean; // true if user is buyer (posted enquiry), false if seller (responded to enquiry)
  enquiryData?: any; // Store enquiry data to check status
  isDisabled?: boolean; // Mark if chat should be disabled
  unreadCount?: number; // Count of unread messages in this thread
  isAdminChat?: boolean; // Mark if this is an admin chat (warning/suspension)
}

export default function MyChats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { allChats: preloadedChats, loading: chatsLoading, refreshChats } = useChats();
  // Initialize with preloaded chats immediately - don't wait for loading state
  // Try to load from localStorage first for instant display, then use context
  const [allChats, setAllChats] = useState<ChatThread[]>(() => {
    // First try to get chats from context (if already loaded)
    if (preloadedChats && preloadedChats.length > 0) {
      return preloadedChats;
    }
    // Then try localStorage cache for instant display
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('myChats_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it's recent (less than 5 minutes old)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            return parsed.chats || [];
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
    // Fallback to context or empty array
    return preloadedChats || [];
  });
  // Only show loading if we truly have no chats - show chats immediately if available
  const [loading, setLoading] = useState(() => {
    // If we have chats (from cache or context), never show loading
    const hasChats = allChats.length > 0;
    return !hasChats && chatsLoading;
  });
  const [visibleChatsCount, setVisibleChatsCount] = useState(4);
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatsViewMode');
      return (saved === 'buyer' || saved === 'seller') ? saved : 'buyer';
    }
    return 'buyer';
  });
  
  
  // Calculate unread counts for buyer and seller chats (count unique threads, not messages)
  // Exclude disabled/expired chats from unread counts
  const buyerUnreadCount = allChats
    .filter(chat => chat.isBuyerChat === true && !chat.isDisabled && (chat.unreadCount || 0) > 0)
    .length;
  
  const sellerUnreadCount = allChats
    .filter(chat => chat.isBuyerChat === false && !chat.isDisabled && (chat.unreadCount || 0) > 0)
    .length;

  const handleToggleView = (mode: 'buyer' | 'seller') => {
    setViewMode(mode);
    localStorage.setItem('chatsViewMode', mode);
  };

  // Helper function to check if chat is expired
  const isChatExpired = useCallback((chat: ChatThread) => {
    if (!chat.isDisabled || !chat.enquiryData) return false;
    
    // Check for expired (deadline passed)
    if (chat.enquiryData.deadline) {
      const now = new Date();
      const deadline = chat.enquiryData.deadline?.toDate ? chat.enquiryData.deadline.toDate() : new Date(chat.enquiryData.deadline);
      if (deadline < now) return true;
    }
    
    return false;
  }, []);

  // Filter chats based on view mode (show all chats including disabled ones)
  // Then sort: warning messages pinned first, then live chats, then expired chats
  // Memoize to prevent unnecessary recalculations
  const allFilteredChats = useMemo(() => {
    return allChats
      .filter(chat => {
    // Filter by view mode (don't exclude disabled chats - show them as disabled)
    if (viewMode === 'buyer') {
      return chat.isBuyerChat === true; // User's own enquiries (buyer chats)
    } else {
      return chat.isBuyerChat === false; // User's responses to other enquiries (seller chats)
    }
      })
      .sort((a, b) => {
        // Pin warning messages at the top
        const aIsWarning = a.isAdminChat && a.enquiryTitle?.includes('Warning');
        const bIsWarning = b.isAdminChat && b.enquiryTitle?.includes('Warning');
        
        if (aIsWarning && !bIsWarning) return -1; // a is warning, b is not - a comes first
        if (!aIsWarning && bIsWarning) return 1; // a is not warning, b is - b comes first
        
        // If both are warnings or both are not warnings, continue with normal sorting
        // Check if chats are expired
        const aExpired = isChatExpired(a);
        const bExpired = isChatExpired(b);

        // Live chats (not expired) come first
        if (aExpired && !bExpired) return 1; // a is expired, b is live - b comes first
        if (!aExpired && bExpired) return -1; // a is live, b is expired - a comes first
        
        // If both are same status (both live or both expired), sort by updatedAt (newest first)
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return bTime - aTime; // Newest first
      });
  }, [allChats, viewMode, isChatExpired]);

  // Show only visible chats (pagination)
  const chats = allFilteredChats.slice(0, visibleChatsCount);
  const hasMoreChats = allFilteredChats.length > visibleChatsCount;

  // Reset visible count when view mode changes
  useEffect(() => {
    setVisibleChatsCount(4);
  }, [viewMode]);

  const loadMoreChats = () => {
    setVisibleChatsCount(prev => prev + 4);
  };

  // Use preloaded chats from context - update immediately when available
  useEffect(() => {
    // Always update chats immediately when they change - don't wait for loading
    if (preloadedChats !== undefined) {
      // Preserve warnings that haven't been dismissed when updating from context
      setAllChats(prevChats => {
        // Keep any warnings that are in prevChats but might be missing from preloadedChats
        // This prevents warnings from disappearing unexpectedly
        const existingWarnings = prevChats.filter(chat => 
          chat.isAdminChat && chat.enquiryTitle?.includes('Warning')
        );
        
        // Merge: use preloadedChats as base, but preserve existing warnings that aren't in preloadedChats
        const preloadedWarningIds = new Set(
          preloadedChats
            .filter(chat => chat.isAdminChat && chat.enquiryTitle?.includes('Warning'))
            .map(chat => chat.id)
        );
        
        const warningsToKeep = existingWarnings.filter(warning => 
          !preloadedWarningIds.has(warning.id)
        );
        
        // Combine preloaded chats with preserved warnings
        const mergedChats = [...preloadedChats, ...warningsToKeep];
        
        return mergedChats;
      });
      
      // Cache chats to localStorage for instant display on next visit
      if (preloadedChats.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem('myChats_cache', JSON.stringify({
            chats: preloadedChats,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Ignore cache errors
        }
      }
      // Never show loading if we have chats, even if context is still loading
      // Only show loading if we truly have no chats AND context is still loading
      setLoading(preloadedChats.length === 0 && chatsLoading);
    }
  }, [preloadedChats, chatsLoading]);

  // Real-time listener for unread message counts - Optimized
  useEffect(() => {
    if (!user?.uid || allChats.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const updateUnreadCounts = async () => {
      try {
        // Get all chat messages
        const chatMessagesQuery = query(collection(db, "chatMessages"));
        const snapshot = await getDocs(chatMessagesQuery);
        
        const threadsWithUnread = new Set<string>();
        
        // Create a set of existing chat thread keys for quick lookup (exclude disabled/expired chats)
        const existingThreadKeys = new Set<string>();
        allChats.forEach(chat => {
          if (chat.enquiryId && chat.sellerId && !chat.isDisabled) {
            const threadKey = `${chat.enquiryId}_${chat.sellerId}`;
            existingThreadKeys.add(threadKey);
          }
        });
        
        // Process all messages to find threads with unread messages
        snapshot.docs.forEach((docSnap) => {
          const messageData = docSnap.data();
          const enquiryId = messageData.enquiryId;
          const sellerId = messageData.sellerId;
          const senderId = messageData.senderId;
          
          if (!enquiryId || !sellerId || !senderId) return;
          if (messageData.isSystemMessage || senderId === user.uid) return;
          
          const threadKey = `${enquiryId}_${sellerId}`;
          
          // Only process if this thread exists in our chats
          if (!existingThreadKeys.has(threadKey)) return;
          
          // If already marked as unread, skip further processing
          if (threadsWithUnread.has(threadKey)) return;
          
          const readKey = `chat_read_${user.uid}_${threadKey}`;
          const lastViewedTime = localStorage.getItem(readKey);
          
          if (lastViewedTime) {
            // Only count messages that arrived after last view
            const messageTime = messageData.timestamp?.toDate 
              ? messageData.timestamp.toDate().getTime() 
              : (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
            const viewedTime = parseInt(lastViewedTime, 10);
            
            if (messageTime > viewedTime) {
              threadsWithUnread.add(threadKey);
            }
          } else {
            // Never viewed - all messages are unread
            threadsWithUnread.add(threadKey);
          }
        });
        
        if (!isMounted) return;
        
        // Update chats with unread status (1 if has unread, 0 if not)
        setAllChats(prevChats => {
          const updated = prevChats.map(chat => {
            const threadKey = chat.enquiryId && chat.sellerId 
              ? `${chat.enquiryId}_${chat.sellerId}` 
              : chat.id;
            const hasUnread = threadsWithUnread.has(threadKey);
            return {
              ...chat,
              unreadCount: hasUnread ? 1 : 0
            };
          });
          
          // Debug: Log unread counts
          const totalUnread = updated.filter(c => c.unreadCount > 0).length;
          if (totalUnread > 0) {
            console.log('MyChats: Found unread chats:', totalUnread, updated.filter(c => c.unreadCount > 0).map(c => ({ title: c.enquiryTitle, unread: c.unreadCount })));
          }
          
          return updated;
        });
      } catch (error) {
        console.error("Error updating unread counts:", error);
      }
    };

    // Debounced update function
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateUnreadCounts();
      }, 200); // 200ms debounce
    };

    // Initial count
    updateUnreadCounts();
    
    // Set up real-time listener (with debouncing)
    const unsubscribe = onSnapshot(
      query(collection(db, "chatMessages")),
      () => {
        debouncedUpdate();
      },
      (error) => {
        console.error("Error listening to chat messages for unread counts:", error);
      }
    );

    // Listen for chat viewed events
    const handleChatViewed = () => {
      debouncedUpdate();
    };
    
    window.addEventListener('chatViewed', handleChatViewed);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener('chatViewed', handleChatViewed);
    };
  }, [user?.uid, allChats.length]);

  const formatTime = (ts: any) => {
    if (!ts) return "Recently";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older messages, show date in compact format
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Mark chat as read when opened
  const markChatAsRead = (chat: ChatThread) => {
    if (!chat.enquiryId || !chat.sellerId || !user?.uid) return;
    
    const threadKey = `${chat.enquiryId}_${chat.sellerId}`;
    const readKey = `chat_read_${user.uid}_${threadKey}`;
    
    // Store current timestamp as last viewed time
    localStorage.setItem(readKey, Date.now().toString());
    
    // Update local state to remove unread count
    setAllChats(prevChats => 
      prevChats.map(c => {
        if (c.enquiryId === chat.enquiryId && c.sellerId === chat.sellerId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      })
    );
    
    // Trigger event to notify other components
    window.dispatchEvent(new CustomEvent('chatViewed', { 
      detail: { enquiryId: chat.enquiryId, sellerId: chat.sellerId } 
    }));
  };

  const openChat = (chat: ChatThread) => {
    if (chat.isDisabled || !chat.enquiryId) return;
    
    // Mark chat as read when opening
    markChatAsRead(chat);
    
    if (chat.sellerId) {
      navigate(`/enquiry/${chat.enquiryId}/responses?sellerId=${chat.sellerId}`);
    } else {
      navigate(`/enquiry/${chat.enquiryId}/responses-page`);
    }
  };

  // Dismiss warning message
  const dismissWarning = async (chat: ChatThread) => {
    if (!user?.uid || !chat.isAdminChat) return;
    
    try {
      // Find the warning message in Firestore and mark it as dismissed
      const warningMessagesQuery = query(
        collection(db, 'chatMessages'),
        where('enquiryId', '==', 'admin_warning'),
        where('recipientId', '==', user.uid),
        where('isAdminMessage', '==', true),
        where('adminMessageType', '==', 'warning')
      );
      
      const snapshot = await getDocs(warningMessagesQuery);
      
      // Update all warning messages for this user to mark as dismissed
      const updatePromises = snapshot.docs.map(docSnap => 
        updateDoc(docSnap.ref, {
          dismissed: true,
          dismissedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      // Remove from local state immediately
      setAllChats(prevChats => prevChats.filter(c => c.id !== chat.id));
      
      // Refresh chats from context
      if (refreshChats) {
        refreshChats();
      }
    } catch (error) {
      console.error('Error dismissing warning:', error);
    }
  };

  // Helper function to get disabled status text
  const getDisabledStatusText = (chat: ChatThread) => {
    if (!chat.isDisabled) return '';
    
    // Check if enquiry data exists (if not, it's deleted)
    if (!chat.enquiryData) return 'Deleted';
    
    // Check for deal closed
    if (chat.enquiryData.status === 'deal_closed' || chat.enquiryData.dealClosed === true) return 'Deal Closed';
    
    // Check for expired (deadline passed)
    if (chat.enquiryData.deadline) {
      const now = new Date();
      const deadline = chat.enquiryData.deadline?.toDate ? chat.enquiryData.deadline.toDate() : new Date(chat.enquiryData.deadline);
      if (deadline < now) return 'Expired';
    }
    
    // Check for rejected or completed
    if (chat.enquiryData.status === 'rejected') return 'Rejected';
    if (chat.enquiryData.status === 'completed') return 'Completed';
    
    return 'Closed';
  };

  // Function to clear expired chats (only those visible on current page)
  const clearExpiredChats = async () => {
    if (!user?.uid) return;
    
    // Find expired chats only from the currently visible chats (filtered by view mode)
    const expiredChats = chats.filter(chat => isChatExpired(chat));
    
    if (expiredChats.length === 0) {
      alert('No expired chats to clear on this page.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${expiredChats.length} expired chat(s) from this page? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Delete chat documents from Firestore (only the visible expired ones)
      const deletePromises = expiredChats.map(async (chat) => {
        try {
          // Delete the chat document
          const chatRef = doc(db, 'chats', chat.id);
          await deleteDoc(chatRef);
          
          // Also delete all messages in this chat thread
          if (chat.enquiryId && chat.sellerId) {
            const messagesQuery = query(
              collection(db, 'chatMessages'),
              where('enquiryId', '==', chat.enquiryId),
              where('sellerId', '==', chat.sellerId)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const messageDeletePromises = messagesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
            await Promise.all(messageDeletePromises);
          }
        } catch (error) {
          console.error(`Error deleting chat ${chat.id}:`, error);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Update local state to remove only the expired chats that were on this page
      const expiredChatIds = new Set(expiredChats.map(chat => chat.id));
      setAllChats(prevChats => prevChats.filter(chat => !expiredChatIds.has(chat.id)));
      
      // Refresh chats from context
      if (refreshChats) {
        refreshChats();
      }
      
      alert(`Successfully deleted ${expiredChats.length} expired chat(s) from this page.`);
    } catch (error) {
      console.error('Error clearing expired chats:', error);
      alert('Failed to clear expired chats. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Seller Form Background - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/dashboard'); }}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
                <div className="w-10 h-10"></div>
              </div>
            </div>
            
            {/* Your Chats Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 rounded-full" />
                      Your Chats.
                    </h1>
                  </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    See all conversations you're currently having with buyers and sellers.
                  </p>
                </div>
            
                  {/* Toggle - Creative Rotating Dial Design */}
                  <div className="flex flex-col justify-center items-center mt-4 sm:mt-5 relative">
                    {/* Arrow Indicator */}
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mb-2 sm:mb-3 flex items-center gap-1 sm:gap-1.5"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400" />
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400" />
                    </motion.div>
                    {/* Labels and Toggle Container */}
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                      {/* Buy Label with Animation */}
                    <motion.div 
                        animate={{
                          scale: viewMode === 'buyer' ? 1.1 : 1,
                          opacity: viewMode === 'buyer' ? 1 : 0.5,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className={`text-[9px] sm:text-[10px] lg:text-xs font-bold transition-colors duration-300 whitespace-nowrap ${
                          viewMode === 'buyer' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Buy
                        </span>
                      </motion.div>
                      
                      {/* Creative Rotating Dial Toggle */}
                      <div className="relative inline-flex items-center">
                        {/* Track Background with Animated Gradient */}
                      <motion.div 
                          className="w-20 h-8 sm:w-28 sm:h-10 lg:w-32 lg:h-12 bg-gradient-to-r from-gray-200 via-white to-gray-200 rounded-full relative cursor-pointer overflow-hidden"
                          animate={{
                            background: viewMode === 'buyer' 
                              ? 'linear-gradient(to right, #3b82f6, #60a5fa, #93c5fd)' 
                              : 'linear-gradient(to right, #10b981, #34d399, #6ee7b7)',
                          }}
                          transition={{ duration: 0.5 }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const trackWidth = rect.width;
                            const isLeftSide = clickX < trackWidth / 2;
                            
                            if (isLeftSide && viewMode !== 'buyer') {
                              handleToggleView('buyer');
                            } else if (!isLeftSide && viewMode !== 'seller') {
                              handleToggleView('seller');
                            }
                          }}
                      >
                          {/* Animated Background Overlay */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                              background: viewMode === 'buyer'
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 197, 253, 0.2))'
                                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(110, 231, 183, 0.2))',
                            }}
                            transition={{ duration: 0.5 }}
                          />
                      
                          {/* Rotating Dial Knob */}
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                              handleToggleView(viewMode === 'buyer' ? 'seller' : 'buyer');
                        }}
                            className="absolute top-1/2 w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full cursor-pointer z-10"
                            animate={{
                              left: viewMode === 'buyer' ? '-8px' : 'calc(100% - 32px)',
                              rotate: viewMode === 'buyer' ? [0, -15, 15, 0] : [0, 15, -15, 0],
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                              rotate: { duration: 0.6 }
                            }}
                            whileHover={{ scale: 1.15, rotate: viewMode === 'buyer' ? -10 : 10 }}
                            whileTap={{ scale: 0.85 }}
                            style={{
                              transform: 'translateY(-50%)',
                            }}
                      >
                            {/* Outer Ring - Rotating */}
                        <motion.div 
                              className="absolute inset-0 rounded-full border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]"
                              animate={{
                                rotate: viewMode === 'buyer' ? 0 : 360,
                              }}
                              transition={{
                                duration: 0.8,
                                ease: "easeInOut"
                              }}
                            >
                              {/* Gear Notches */}
                              {[...Array(12)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 left-1/2 w-0.5 h-2 sm:h-2.5 lg:h-3 bg-gray-400 rounded-full origin-bottom"
                                  style={{
                                    transform: `translateX(-50%) rotate(${i * 30}deg)`,
                                  }}
                                />
                              ))}
                            </motion.div>
                            
                            {/* Inner Circle with 3D Effect */}
                            <div className="absolute inset-1 sm:inset-1.5 lg:inset-2 rounded-full bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,255,255,0.5)] flex items-center justify-center">
                              {/* Center Dot */}
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-inner"></div>
                              
                              {/* Arrow Icons - Left and Right */}
                              <div className="absolute inset-0 flex items-center justify-between px-1.5 sm:px-2 lg:px-2.5">
                                <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-gray-700 flex-shrink-0" />
                                <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-gray-700 flex-shrink-0" />
                              </div>
                              
                              {/* Text Label - Rotating */}
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{
                                  rotate: viewMode === 'buyer' ? 0 : 180,
                                }}
                                transition={{ duration: 0.6 }}
                              >
                                <span className="text-[7px] sm:text-[9px] lg:text-[11px] font-black text-gray-800 absolute">
                                  {viewMode === 'buyer' ? 'B' : 'S'}
                                </span>
                              </motion.div>
                            </div>
                            
                            {/* Shine Effect */}
                            <motion.div
                              className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
                              animate={{
                                rotate: [0, 360],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                            
                            {/* Unread Badge - Buyer */}
                            {viewMode === 'buyer' && buyerUnreadCount > 0 && (
                            <motion.span 
                                className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[7px] sm:text-[8px] font-black rounded-full min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] flex items-center justify-center z-50 border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] px-1"
                              animate={{
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 15, -15, 0]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              {buyerUnreadCount > 9 ? '9+' : buyerUnreadCount}
                            </motion.span>
                          )}
                            
                            {/* Unread Badge - Seller */}
                            {viewMode === 'seller' && sellerUnreadCount > 0 && (
                            <motion.span 
                                className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[7px] sm:text-[8px] font-black rounded-full min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] flex items-center justify-center z-50 border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] px-1"
                              animate={{
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 15, -15, 0]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              {sellerUnreadCount > 9 ? '9+' : sellerUnreadCount}
                            </motion.span>
                          )}
                      </motion.button>
                          
                          {/* Animated Particles on Toggle */}
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                              animate={{
                                x: viewMode === 'buyer' ? [0, 20, 0] : [0, -20, 0],
                                y: [0, Math.sin(i) * 10, 0],
                                opacity: [0.6, 0, 0.6],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: "easeInOut"
                              }}
                              style={{
                                left: '50%',
                                top: '50%',
                              }}
                            />
                          ))}
                    </motion.div>
                      </div>
                      
                      {/* Sell Label with Animation */}
                      <motion.div
                        animate={{
                          scale: viewMode === 'seller' ? 1.1 : 1,
                          opacity: viewMode === 'seller' ? 1 : 0.5,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className={`text-[9px] sm:text-[10px] lg:text-xs font-bold transition-colors duration-300 whitespace-nowrap ${
                          viewMode === 'seller' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Sell
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Content - Inside Container */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {loading && allChats.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-[0.5px] border-black bg-gradient-to-br from-white via-white to-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 lg:p-5 animate-pulse">
                  <div className="flex flex-col items-center h-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gray-300 mb-2 sm:mb-3 lg:mb-4"></div>
                    <div className="h-4 sm:h-5 w-3/4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 sm:h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 sm:h-4 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <Card className="border-2 border-black bg-gradient-to-br from-white to-gray-50 shadow-lg p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                <p className="text-base sm:text-lg text-black font-bold">
                  No chats yet
                </p>
                <p className="text-[10px] sm:text-xs text-gray-900 font-medium">
                  {viewMode === 'buyer' 
                    ? "Start posting enquiries to begin chatting with sellers."
                    : "Start responding to enquiries to begin chatting with buyers."}
                </p>
              </div>
            </Card>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {chats.map((chat, index) => {
                const isDisabled = chat.isDisabled || false;
                const statusText = getDisabledStatusText(chat);
                const isAdminWarning = chat.isAdminChat && chat.enquiryTitle?.includes('Warning');
                
                return (
                  <div
                    key={chat.id}
                  >
                    <Card
                      className={`border-[0.5px] border-black rounded-lg sm:rounded-xl transition-all duration-300 relative overflow-hidden ${
                        isAdminWarning
                          ? 'bg-[#5C1A1A] text-white'
                          : isDisabled 
                            ? 'opacity-60 grayscale cursor-not-allowed shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] bg-gradient-to-br from-white via-white to-gray-50' 
                            : 'cursor-pointer group shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-br from-white via-white to-gray-50'
                      }`}
                      onClick={() => !isDisabled && !isAdminWarning && openChat(chat)}
                    >
                      {/* Close button for warning messages */}
                      {isAdminWarning && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissWarning(chat);
                          }}
                          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-20 p-1 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                          aria-label="Dismiss warning"
                        >
                          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      )}
                      {/* Physical button depth effect */}
                      {!isDisabled && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                        </>
                      )}
                      {/* Animated background gradient */}
                      {!isDisabled && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-green-50/10 to-transparent opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.4 }}
                        />
                      )}
                      
                      {/* Clickable tile with enquiry heading */}
                      <div className={`flex flex-col h-full relative z-10 ${
                        isAdminWarning ? 'p-1.5 sm:p-2 lg:p-2.5' : 'p-2.5 sm:p-4 lg:p-5'
                      }`}>
                        {/* Chat avatar – rounded, WhatsApp-style green bubble with creative animation */}
                        <div className={`flex items-center justify-center relative ${
                          isAdminWarning ? 'mb-1 sm:mb-1.5' : 'mb-2 sm:mb-3 lg:mb-4'
                        }`}>
                          {/* Glowing ring effect */}
                          {!isDisabled && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          )}
                          
                          <motion.div 
                            className={`rounded-full ${
                              isAdminWarning 
                                ? 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8' 
                                : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14'
                            } ${
                              isDisabled ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600'
                            } flex items-center justify-center border-[0.5px] border-black shadow-lg relative overflow-hidden`}
                            animate={!isDisabled ? {
                              rotate: [0, 360],
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{
                              rotate: {
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                              },
                              scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }
                            }}
                            whileHover={!isDisabled ? {
                              scale: 1.2,
                              rotate: [0, 180, 360],
                              transition: { duration: 0.6 }
                            } : {}}
                          >
                            {/* Shimmer effect */}
                            {!isDisabled && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                  x: ['-100%', '100%'],
                                }}
                                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
                              />
                            )}
                            
                            <motion.div
                              animate={!isDisabled ? {
                                y: [0, -5, 0],
                                rotate: [0, 10, -10, 0],
                              } : {}}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              whileHover={!isDisabled ? {
                                scale: 1.2,
                                rotate: 360,
                                transition: { duration: 0.5 }
                              } : {}}
                            >
                              <MessageSquare className={`text-white relative z-10 ${
                                isAdminWarning 
                                  ? 'h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5' 
                                  : 'h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6'
                              }`} />
                            </motion.div>
                          </motion.div>
                          
                          {!isDisabled && (chat.unreadCount || 0) > 0 && (
                            <motion.span 
                              className={`absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xl z-20 ${
                                isAdminWarning
                                  ? 'text-[7px] sm:text-[8px] min-w-[14px] h-3.5 sm:min-w-[16px] sm:h-4'
                                  : 'text-[10px] sm:text-[11px] min-w-[20px] h-5 sm:min-w-[24px] sm:h-6'
                              }`}
                              animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, 10, -10, 0],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              whileHover={{
                                scale: 1.4,
                                rotate: 360,
                                transition: { duration: 0.3 }
                              }}
                            >
                              1
                            </motion.span>
                          )}
                        </div>
                      
                        {/* Enquiry heading as tile title */}
                        <h3 
                          className={`font-black text-center line-clamp-2 ${
                            isAdminWarning 
                              ? 'text-[8px] sm:text-[9px] lg:text-[10px] mb-0.5 sm:mb-1 min-h-[1rem] sm:min-h-[1.25rem]' 
                              : 'text-xs sm:text-sm lg:text-base mb-1.5 sm:mb-2 lg:mb-3 min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem]'
                          } ${
                            isAdminWarning ? 'text-white' : isDisabled ? 'text-gray-500' : 'text-black'
                          }`}
                        >
                          {chat.enquiryTitle || `Enquiry ${chat.enquiryId || chat.id}`}
                        </h3>
                        
                        {/* Status badge for disabled chats */}
                        {isDisabled && statusText && (
                          <div 
                            className="flex justify-center mb-1.5 sm:mb-2"
                          >
                            <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 bg-gray-200 text-gray-600 rounded border border-gray-300 font-semibold">
                              {statusText}
                            </span>
                          </div>
                        )}
                        
                        {/* Last message preview with typing effect */}
                        <p 
                          className={`text-center line-clamp-2 flex-1 ${
                            isAdminWarning 
                              ? 'text-[7px] sm:text-[8px] lg:text-[9px] mb-0.5 sm:mb-1' 
                              : 'text-[9px] sm:text-[10px] lg:text-xs mb-2 sm:mb-3 lg:mb-4'
                          } ${
                            isAdminWarning ? 'text-white/90' : isDisabled ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {typeof chat.lastMessage === 'string' 
                            ? chat.lastMessage 
                            : (chat.lastMessage?.text || "No messages yet")}
                        </p>
                        
                        {/* Timestamp */}
                        <div 
                          className={`flex items-center justify-center gap-1 ${
                            isAdminWarning 
                              ? 'text-[6px] sm:text-[7px] lg:text-[8px] mb-0.5 sm:mb-1' 
                              : 'text-[8px] sm:text-[9px] lg:text-[10px] mb-2 sm:mb-3 lg:mb-4'
                          } ${
                            isAdminWarning ? 'text-white/80' : isDisabled ? 'text-gray-400' : 'text-gray-500'
                          }`}
                          >
                            <Clock className={`${
                              isAdminWarning ? 'h-2 w-2 sm:h-2.5 sm:w-2.5' : 'h-2.5 w-2.5 sm:h-3 sm:w-3'
                            }`} />
                          <span className="truncate">
                            {formatTime(chat.updatedAt)}
                          </span>
                        </div>
                        
                        {/* Open Chat button - Hidden for admin warnings */}
                        {!isAdminWarning && (
                          <div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isDisabled}
                            className={`w-full border-[0.5px] border-black text-[9px] sm:text-[10px] lg:text-xs font-black py-1.5 sm:py-2 rounded-xl relative overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 ${
                              isDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                                : 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] group/openchat'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDisabled) {
                                openChat(chat);
                              }
                            }}
                          >
                            {/* Physical button depth effect */}
                            {!isDisabled && (
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                            )}
                            {/* Shimmer effect on button */}
                            {!isDisabled && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/openchat:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                            )}
                            
                            <span className="flex items-center justify-center relative z-10">
                              <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5 flex-shrink-0 relative z-10" />
                            <span className="relative z-10 whitespace-nowrap tracking-tight">{isDisabled ? 'Chat Closed' : 'Open Chat'}</span>
                            </span>
                          </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
            
            {/* Load More Button */}
            {hasMoreChats && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button
                  onClick={loadMoreChats}
                  className="border-[0.5px] border-black bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-xs sm:text-sm font-black px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden group/loadmore"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/loadmore:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                  <span className="relative z-10 flex items-center gap-2">
                    Load More
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10" />
                  </span>
                </Button>
            </div>
            )}
            </>
          )}
          
          {/* Action Buttons - After Cards */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            {/* Clear Expired Chats Button */}
            {chats.filter(chat => isChatExpired(chat)).length > 0 && (
              <Button
                onClick={clearExpiredChats}
                className="border-[0.5px] border-black bg-gradient-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden group/clear"
              >
                {/* Physical button depth effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/clear:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                <span className="relative z-10 flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 text-white" />
                  Clear Expired Chats
                </span>
              </Button>
            )}
            
            {/* Show All Chats Button */}
            <Button
              variant="outline"
              onClick={() => navigate('/all-chats')}
              className="border-[0.5px] border-black !bg-white hover:!bg-gray-50 text-black text-xs sm:text-sm font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden group/allchats"
            >
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/allchats:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
              <span className="relative z-10 flex items-center gap-2">
                Show All Chats
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

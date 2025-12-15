import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/contexts/ChatContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ShoppingCart, UserCheck, ArrowRight, MessageCircle, Trash2 } from "lucide-react";
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
  const [allChats, setAllChats] = useState<ChatThread[]>(preloadedChats);
  const [loading, setLoading] = useState(chatsLoading);
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatsViewMode');
      return (saved === 'buyer' || saved === 'seller') ? saved : 'buyer';
    }
    return 'buyer';
  });
  
  // Track if animation has been initialized to prevent double animation
  const hasAnimated = useRef(false);
  
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
    // Reset animation flag when switching views
    hasAnimated.current = false;
  };

  // Filter chats based on view mode (show all chats including disabled ones)
  const chats = allChats.filter(chat => {
    // Filter by view mode (don't exclude disabled chats - show them as disabled)
    if (viewMode === 'buyer') {
      return chat.isBuyerChat === true; // User's own enquiries (buyer chats)
    } else {
      return chat.isBuyerChat === false; // User's responses to other enquiries (seller chats)
    }
  });

  // Use preloaded chats from context
  useEffect(() => {
    if (preloadedChats && preloadedChats.length > 0) {
      setAllChats(preloadedChats);
      setLoading(false);
    } else {
      setLoading(chatsLoading);
    }
  }, [preloadedChats, chatsLoading]);

  // Reset animation flag when view mode changes
  useEffect(() => {
    hasAnimated.current = false;
  }, [viewMode]);

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

  // Helper function to check if chat is expired
  const isChatExpired = (chat: ChatThread) => {
    if (!chat.isDisabled || !chat.enquiryData) return false;
    
    // Check for expired (deadline passed)
    if (chat.enquiryData.deadline) {
      const now = new Date();
      const deadline = chat.enquiryData.deadline?.toDate ? chat.enquiryData.deadline.toDate() : new Date(chat.enquiryData.deadline);
      if (deadline < now) return true;
    }
    
    return false;
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
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10"></div>
              </div>
            </div>
            
            {/* Your Chats Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2">
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
                  <div className="flex justify-center items-center mt-4 sm:mt-5 relative">
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
          {loading ? (
            <p className="text-sm text-gray-500">Loading chats…</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {chats.map((chat, index) => {
                const isDisabled = chat.isDisabled || false;
                const statusText = getDisabledStatusText(chat);
                const isAdminWarning = chat.isAdminChat || chat.enquiryId === 'admin_warning' || (chat.enquiryTitle?.includes('Warning') || chat.enquiryTitle?.includes('⚠️'));
                // For admin warnings, users should not be able to open chat
                const shouldDisableChat = isDisabled || isAdminWarning;
                
                // Only animate on first render of this view
                const shouldAnimate = !hasAnimated.current;
                
                return (
                  <motion.div
                    key={chat.id}
                    initial={shouldAnimate ? { 
                      opacity: 0, 
                      y: 50, 
                      scale: 0.8,
                      rotateX: -15,
                      rotateY: 10
                    } : {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      rotateX: 0,
                      rotateY: 0
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      rotateX: 0,
                      rotateY: 0
                    }}
                    transition={shouldAnimate ? { 
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: index * 0.08,
                      duration: 0.6
                    } : {
                      duration: 0
                    }}
                    onAnimationComplete={() => {
                      // Mark as animated after first animation completes
                      if (shouldAnimate && index === chats.length - 1) {
                        hasAnimated.current = true;
                      }
                    }}
                    whileHover={!isDisabled ? { 
                      y: -8,
                      scale: 1.05,
                      rotateY: 5,
                      rotateX: 2,
                      transition: { 
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }
                    } : {}}
                    whileTap={!isDisabled ? { 
                      scale: 0.95,
                      rotateY: -2,
                      transition: { duration: 0.1 }
                    } : {}}
                    style={{ perspective: 1000 }}
                  >
                    <Card
                      className={`border-[0.5px] ${
                        isAdminWarning 
                          ? 'border-red-600 bg-gradient-to-br from-red-50 via-red-100 to-red-200' 
                          : 'border-black bg-gradient-to-br from-white via-white to-gray-50'
                      } rounded-lg sm:rounded-xl transition-all duration-300 relative overflow-hidden ${
                        isDisabled
                          ? 'opacity-60 grayscale cursor-not-allowed shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]' 
                          : 'cursor-pointer group shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                      onClick={() => !isDisabled && openChat(chat)}
                    >
                      {/* Physical button depth effect */}
                      {!isDisabled && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                        </>
                      )}
                      {/* Animated background gradient */}
                      {!isDisabled && !isAdminWarning && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-green-50/10 to-transparent opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.4 }}
                        />
                      )}
                      {/* Red gradient for admin warnings */}
                      {!isDisabled && isAdminWarning && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-red-200/30 via-red-100/20 to-transparent opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.4 }}
                        />
                      )}
                      
                      {/* Clickable tile with enquiry heading */}
                      <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col h-full relative z-10">
                        {/* Chat avatar – rounded, WhatsApp-style green bubble with creative animation */}
                        <div className="flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 relative">
                          {/* Glowing ring effect */}
                          {!isDisabled && !isAdminWarning && (
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
                          {/* Red glowing ring for admin warnings */}
                          {!isDisabled && isAdminWarning && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-red-400/40 blur-xl"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 0.7, 0.4],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          )}
                          
                          <motion.div 
                            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${
                              isDisabled 
                                ? 'bg-gray-400' 
                                : isAdminWarning 
                                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700' 
                                : 'bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600'
                            } flex items-center justify-center border-[0.5px] ${
                              isAdminWarning ? 'border-red-700' : 'border-black'
                            } shadow-lg relative overflow-hidden`}
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
                              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white relative z-10" />
                            </motion.div>
                          </motion.div>
                          
                          {!isDisabled && (chat.unreadCount || 0) > 0 && (
                            <motion.span 
                              className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] sm:text-[11px] font-bold rounded-full min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 flex items-center justify-center border-2 border-white shadow-xl z-20"
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
                        <motion.h3 
                          className={`text-xs sm:text-sm lg:text-base font-black mb-1.5 sm:mb-2 lg:mb-3 text-center line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] ${
                            isDisabled 
                              ? 'text-gray-500' 
                              : isAdminWarning 
                              ? 'text-red-800' 
                              : 'text-black'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          whileHover={!isDisabled ? { 
                            scale: 1.08,
                            x: [0, 3, -3, 0],
                            transition: { duration: 0.3 }
                          } : {}}
                        >
                          {chat.enquiryTitle || `Enquiry ${chat.enquiryId || chat.id}`}
                        </motion.h3>
                        
                        {/* Status badge for disabled chats */}
                        {isDisabled && statusText && (
                          <motion.div 
                            className="flex justify-center mb-1.5 sm:mb-2"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              type: "spring",
                              delay: 0.3,
                              stiffness: 200
                            }}
                          >
                            <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 bg-gray-200 text-gray-600 rounded border border-gray-300 font-semibold">
                              {statusText}
                            </span>
                          </motion.div>
                        )}
                        
                        {/* Last message preview with typing effect */}
                        <motion.p 
                          className={`text-[9px] sm:text-[10px] lg:text-xs text-center mb-2 sm:mb-3 lg:mb-4 line-clamp-2 flex-1 ${
                            isDisabled 
                              ? 'text-gray-400' 
                              : isAdminWarning 
                              ? 'text-red-700' 
                              : 'text-gray-600'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.25 + index * 0.05,
                            type: "spring",
                            stiffness: 100
                          }}
                          whileHover={!isDisabled ? {
                            scale: 1.05,
                            transition: { duration: 0.2 }
                          } : {}}
                        >
                          {typeof chat.lastMessage === 'string' 
                            ? chat.lastMessage 
                            : (chat.lastMessage?.text || "No messages yet")}
                        </motion.p>
                        
                        {/* Timestamp with creative animation */}
                        <motion.div 
                          className={`flex items-center justify-center gap-1 text-[8px] sm:text-[9px] lg:text-[10px] mb-2 sm:mb-3 lg:mb-4 ${
                            isDisabled ? 'text-gray-400' : 'text-gray-500'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.3 + index * 0.05,
                            type: "spring",
                            stiffness: 150
                          }}
                        >
                          <motion.div
                            animate={!isDisabled ? {
                              rotate: [0, 360],
                              scale: [1, 1.2, 1],
                            } : {}}
                            transition={{
                              rotate: {
                                duration: 3,
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
                              rotate: 180,
                              scale: 1.3,
                              transition: { duration: 0.3 }
                            } : {}}
                          >
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </motion.div>
                          <motion.span 
                            className="truncate"
                            animate={!isDisabled ? {
                              opacity: [1, 0.7, 1],
                            } : {}}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            {formatTime(chat.updatedAt)}
                          </motion.span>
                        </motion.div>
                        
                        {/* Open Chat button with creative effects */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                          whileHover={!isDisabled ? { 
                            scale: 1.08,
                            y: -2,
                            transition: { 
                              type: "spring",
                              stiffness: 400
                            }
                          } : {}}
                          whileTap={!isDisabled ? { 
                            scale: 0.92,
                            transition: { duration: 0.1 }
                          } : {}}
                        >
                          {!isAdminWarning ? (
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
                            
                            <motion.span
                              className="flex items-center justify-center relative z-10"
                              animate={!isDisabled ? {
                                x: [0, 3, -3, 0],
                              } : {}}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              whileHover={!isDisabled ? {
                                x: [0, 5, -5, 0],
                                transition: { duration: 0.3 }
                              } : {}}
                            >
                              <motion.div
                                animate={!isDisabled ? {
                                  rotate: [0, 15, -15, 0],
                                } : {}}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5 flex-shrink-0 group-hover/openchat:scale-110 transition-transform duration-200 relative z-10" />
                              </motion.div>
                            </motion.span>
                            <span className="relative z-10 whitespace-nowrap tracking-tight">{isDisabled ? 'Chat Closed' : 'Open Chat'}</span>
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
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

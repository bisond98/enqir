import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, doc, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ShoppingCart, UserCheck } from "lucide-react";

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
}

export default function MyChats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allChats, setAllChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatsViewMode');
      return (saved === 'buyer' || saved === 'seller') ? saved : 'buyer';
    }
    return 'buyer';
  });
  
  // Calculate unread counts for buyer and seller chats (count unique threads, not messages)
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

  // Filter chats based on view mode
  const chats = allChats.filter(chat => {
    if (viewMode === 'buyer') {
      return chat.isBuyerChat === true; // User's own enquiries (buyer chats)
    } else {
      return chat.isBuyerChat === false; // User's responses to other enquiries (seller chats)
    }
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadActiveChats = async () => {
      try {
        const chatThreadMap = new Map<string, ChatThread>();

        // 1. Load all chat messages where user has sent or received messages
        const chatMessagesQuery = query(
          collection(db, "chatMessages")
        );
        
        const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
        
        // Process messages to find chats where user is involved
        const messagePromises: Promise<void>[] = [];
        
        chatMessagesSnapshot.forEach((messageDoc) => {
          const messageData = messageDoc.data();
          const enquiryId = messageData.enquiryId;
          const sellerId = messageData.sellerId;
          const senderId = messageData.senderId;
          
          if (!enquiryId || !sellerId) return;
          
          // Check if user is involved in this chat
          const promise = getDoc(doc(db, "enquiries", enquiryId)).then(async (enquiryDoc) => {
            if (!enquiryDoc.exists()) return;
            
            const enquiryData = enquiryDoc.data();
            const buyerId = enquiryData.userId;
            
            // User is involved if they're the buyer OR the seller OR the sender
            const isUserInvolved = (buyerId === user.uid) || (sellerId === user.uid) || (senderId === user.uid);
            
            if (isUserInvolved) {
              const threadKey = `${enquiryId}_${sellerId}`;
              const isBuyerChat = buyerId === user.uid; // true if user is buyer (posted enquiry)
              
              if (!chatThreadMap.has(threadKey)) {
                chatThreadMap.set(threadKey, {
                  id: threadKey,
                  enquiryId: enquiryId,
                  sellerId: sellerId,
                  enquiryTitle: enquiryData.title || "Untitled Enquiry",
                  enquiryData: enquiryData, // Store enquiry data for status checking
                  participants: [buyerId, sellerId],
                  updatedAt: messageData.timestamp || messageData.createdAt,
                  lastMessage: {
                    text: messageData.text || messageData.message || "",
                    senderId: senderId,
                    timestamp: messageData.timestamp
                  },
                  isBuyerChat: isBuyerChat
                });
              } else {
                // Update with latest message if this one is newer
                const existingThread = chatThreadMap.get(threadKey)!;
                const messageTime = messageData.timestamp?.toDate ? messageData.timestamp.toDate().getTime() : 
                                  (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
                const existingTime = existingThread.updatedAt?.toDate ? existingThread.updatedAt.toDate().getTime() : 
                                   (existingThread.updatedAt ? new Date(existingThread.updatedAt).getTime() : 0);
                
                if (messageTime > existingTime) {
                  existingThread.updatedAt = messageData.timestamp || messageData.createdAt;
                  existingThread.lastMessage = {
                    text: messageData.text || messageData.message || "",
                    senderId: senderId,
                    timestamp: messageData.timestamp
                  };
                }
              }
            }
          }).catch(err => {
            console.error("Error processing message:", err);
          });
          
          messagePromises.push(promise);
        });

        // Wait for all message processing to complete
        await Promise.all(messagePromises);

        // 2. Also check the 'chats' collection for any additional threads with messages
        try {
          const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid)
          );
          const chatsSnapshot = await getDocs(chatsQuery);
          
          // Process chats collection with async to get enquiry data
          const chatPromises: Promise<void>[] = [];
          
          chatsSnapshot.forEach((chatDoc) => {
            const chatData = chatDoc.data();
            if (!chatData.enquiryId || !chatData.sellerId) return;
            
            const threadKey = `${chatData.enquiryId}_${chatData.sellerId}`;
            
            // Get enquiry to determine if user is buyer
            const promise = getDoc(doc(db, "enquiries", chatData.enquiryId)).then((enquiryDoc) => {
              if (!enquiryDoc.exists()) return;
              
              const enquiryData = enquiryDoc.data();
              const buyerId = enquiryData.userId;
              const isBuyerChat = buyerId === user.uid;
              
              if (!chatThreadMap.has(threadKey)) {
                // Only add if there's a lastMessage (indicating actual chat activity)
                if (chatData.lastMessage) {
                  chatThreadMap.set(threadKey, {
                    id: chatDoc.id,
                    enquiryId: chatData.enquiryId,
                    sellerId: chatData.sellerId,
                    enquiryTitle: chatData.enquiryTitle || enquiryData.title || "Loading...",
                    enquiryData: enquiryData, // Store enquiry data for status checking
                    participants: chatData.participants || [],
                    updatedAt: chatData.updatedAt,
                    lastMessage: chatData.lastMessage,
                    isBuyerChat: isBuyerChat
                  });
                }
              } else {
                // Update existing thread with last message from chats collection if newer
                const existingThread = chatThreadMap.get(threadKey)!;
                if (chatData.lastMessage && chatData.updatedAt) {
                  const chatTime = chatData.updatedAt?.toDate ? chatData.updatedAt.toDate().getTime() : 
                                 (chatData.updatedAt ? new Date(chatData.updatedAt).getTime() : 0);
                  const existingTime = existingThread.updatedAt?.toDate ? existingThread.updatedAt.toDate().getTime() : 
                                     (existingThread.updatedAt ? new Date(existingThread.updatedAt).getTime() : 0);
                  
                  if (chatTime > existingTime) {
                    existingThread.lastMessage = chatData.lastMessage;
                    existingThread.updatedAt = chatData.updatedAt;
                  }
                }
              }
            }).catch(err => {
              console.error("Error fetching enquiry for chat:", err);
            });
            
            chatPromises.push(promise);
          });
          
          // Wait for all chat processing to complete
          await Promise.all(chatPromises);
        } catch (err) {
          console.warn("Error loading chats collection:", err);
        }

        // Convert map to array and fetch missing enquiry titles and data
        const threads = Array.from(chatThreadMap.values());
        
        const enrichedThreads = await Promise.all(
          threads.map(async (thread) => {
            if (thread.enquiryId) {
              // Only fetch if we don't already have enquiryData
              if (!thread.enquiryData) {
                try {
                  const enquiryDoc = await getDoc(doc(db, "enquiries", thread.enquiryId));
                  if (enquiryDoc.exists()) {
                    thread.enquiryData = enquiryDoc.data();
                    thread.enquiryTitle = thread.enquiryData.title || "Untitled Enquiry";
                  } else {
                    // Enquiry deleted
                    thread.enquiryTitle = "Enquiry Not Found";
                    thread.isDisabled = true;
                  }
                } catch (err) {
                  console.error("Error fetching enquiry data:", err);
                  if (!thread.enquiryTitle) {
                    thread.enquiryTitle = "Loading...";
                  }
                }
              }
              
              // Check if chat should be disabled (using existing or newly fetched enquiryData)
              if (thread.enquiryData) {
                const enquiryData = thread.enquiryData;
                
                // 1. Check if deal is closed
                if (enquiryData.status === 'deal_closed' || enquiryData.dealClosed === true) {
                  thread.isDisabled = true;
                }
                // 2. Check if enquiry is expired
                else if (enquiryData.deadline) {
                  const now = new Date();
                  const deadline = enquiryData.deadline?.toDate ? enquiryData.deadline.toDate() : new Date(enquiryData.deadline);
                  if (deadline < now) {
                    thread.isDisabled = true;
                  }
                }
                // 3. Check if enquiry is rejected or completed
                else if (enquiryData.status === 'rejected' || enquiryData.status === 'completed') {
                  thread.isDisabled = true;
                }
              } else if (!thread.enquiryData && thread.enquiryId) {
                // If we couldn't fetch enquiry data, mark as disabled (likely deleted)
                thread.isDisabled = true;
              }
            }
            return thread;
          })
        );

        // Sort by updatedAt (most recent first)
        enrichedThreads.sort((a, b) => {
          const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return bTime - aTime;
        });

        setAllChats(enrichedThreads);
        setLoading(false);
      } catch (error) {
        console.error("Error loading active chats:", error);
        setLoading(false);
      }
    };

    loadActiveChats();
  }, [user]);

  // Real-time listener for unread message counts
  useEffect(() => {
    if (!user?.uid || allChats.length === 0) return;

    const updateUnreadCounts = async () => {
      try {
        // Get all chat messages
        const chatMessagesQuery = query(collection(db, "chatMessages"));
        const snapshot = await getDocs(chatMessagesQuery);
        
        const threadsWithUnread = new Map<string, boolean>();
        
        // Create a map of existing chat threads for quick lookup
        const existingThreads = new Map<string, ChatThread>();
        allChats.forEach(chat => {
          if (chat.enquiryId && chat.sellerId) {
            const threadKey = `${chat.enquiryId}_${chat.sellerId}`;
            existingThreads.set(threadKey, chat);
          }
        });
        
        // Process all messages to find threads with unread messages
        for (const docSnap of snapshot.docs) {
          const messageData = docSnap.data();
          const enquiryId = messageData.enquiryId;
          const sellerId = messageData.sellerId;
          const senderId = messageData.senderId;
          
          if (!enquiryId || !sellerId || !senderId) continue;
          
          // Skip system messages and messages from current user
          if (messageData.isSystemMessage || senderId === user.uid) continue;
          
          const threadKey = `${enquiryId}_${sellerId}`;
          
          // Only process if this thread exists in our chats
          if (!existingThreads.has(threadKey)) continue;
          
          const readKey = `chat_read_${user.uid}_${threadKey}`;
          
          // Check if user has viewed this chat
          const lastViewedTime = localStorage.getItem(readKey);
          
          let isUnread = false;
          
          if (lastViewedTime) {
            // Only count messages that arrived after last view
            const messageTime = messageData.timestamp?.toDate 
              ? messageData.timestamp.toDate().getTime() 
              : (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
            const viewedTime = parseInt(lastViewedTime, 10);
            
            if (messageTime > viewedTime) {
              // Message arrived after last view - mark as unread
              isUnread = true;
            }
          } else {
            // Never viewed - all messages are unread
            isUnread = true;
          }
          
          // Mark thread as unread if any message is unread
          if (isUnread) {
            threadsWithUnread.set(threadKey, true);
          }
        }
        
        // Update chats with unread status (1 if has unread, 0 if not)
        setAllChats(prevChats => {
          const updated = prevChats.map(chat => {
            const threadKey = chat.enquiryId && chat.sellerId 
              ? `${chat.enquiryId}_${chat.sellerId}` 
              : chat.id;
            const hasUnread = threadsWithUnread.get(threadKey) || false;
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

    // Initial count
    updateUnreadCounts();
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      query(collection(db, "chatMessages")),
      () => {
        updateUnreadCounts();
      },
      (error) => {
        console.error("Error listening to chat messages for unread counts:", error);
      }
    );

    // Listen for chat viewed events
    const handleChatViewed = () => {
      updateUnreadCounts();
    };
    
    window.addEventListener('chatViewed', handleChatViewed);

    return () => {
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
    if (!chat.isDisabled || !chat.enquiryData) return '';
    
    if (!chat.enquiryData) return 'Deleted';
    if (chat.enquiryData.status === 'deal_closed' || chat.enquiryData.dealClosed) return 'Deal Closed';
    if (chat.enquiryData.status === 'rejected') return 'Rejected';
    if (chat.enquiryData.status === 'completed') return 'Completed';
    if (chat.enquiryData.deadline) {
      const now = new Date();
      const deadline = chat.enquiryData.deadline?.toDate ? chat.enquiryData.deadline.toDate() : new Date(chat.enquiryData.deadline);
      if (deadline < now) return 'Expired';
    }
    return 'Closed';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Professional Header - Matching Dashboard Style */}
          <div className="mb-6 sm:mb-12 lg:mb-16">
            <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-8 lg:p-10 overflow-hidden">
              {/* Content Card - White Background */}
              <div className="bg-white border border-black rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Your Chats
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    See all conversations you're currently having with buyers and sellers.
                  </p>
            
                  {/* Toggle Button - Similar to Dashboard */}
                  <div className="flex justify-center items-center mt-4 sm:mt-5">
              <div className="relative inline-flex items-center bg-white border border-black rounded-full p-0.5 sm:p-1 shadow-lg">
                {/* Animated Background Slider */}
                <div 
                  className={`absolute top-0.5 bottom-0.5 sm:top-1 sm:bottom-1 rounded-full bg-green-800 transition-all duration-300 ease-in-out ${
                    viewMode === 'buyer' ? 'left-0.5 right-1/2 sm:left-1 sm:right-1/2' : 'left-1/2 right-0.5 sm:left-1/2 sm:right-1'
                  }`}
                  style={{ width: 'calc(50% - 2px)' }}
                />
                
                {/* Buyer Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleView('buyer');
                  }}
                  className={`relative z-10 px-2 py-1 sm:px-4 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-bold text-[10px] sm:text-xs lg:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] justify-center ${
                    viewMode === 'buyer'
                      ? 'text-white'
                      : 'text-black hover:text-black'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <ShoppingCart className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 transition-transform duration-300 ${viewMode === 'buyer' ? 'scale-110' : 'scale-100'}`} />
                    {buyerUnreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center z-50 border-2 border-white shadow-xl px-1">
                        {buyerUnreadCount > 9 ? '9+' : buyerUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className="whitespace-nowrap">Buy</span>
                </button>
                
                {/* Seller Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleView('seller');
                  }}
                  className={`relative z-10 px-2 py-1 sm:px-4 sm:py-2 lg:px-6 lg:py-2.5 rounded-full font-bold text-[10px] sm:text-xs lg:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] justify-center ${
                    viewMode === 'seller'
                      ? 'text-white'
                      : 'text-black hover:text-black'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <UserCheck className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 transition-transform duration-300 ${viewMode === 'seller' ? 'scale-110' : 'scale-100'}`} />
                    {sellerUnreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center z-50 border-2 border-white shadow-xl px-1">
                        {sellerUnreadCount > 9 ? '9+' : sellerUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className="whitespace-nowrap">Sell</span>
                </button>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading chats…</p>
          ) : chats.length === 0 ? (
            <Card className="border border-black bg-white shadow-md p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                <p className="text-sm sm:text-base text-gray-700 font-medium">
                  No chats yet
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {viewMode === 'buyer' 
                    ? "Start posting enquiries to begin chatting with sellers."
                    : "Start responding to enquiries to begin chatting with buyers."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {chats.map((chat) => {
                const isDisabled = chat.isDisabled || false;
                const statusText = getDisabledStatusText(chat);
                
                return (
                  <Card
                    key={chat.id}
                    className={`border-4 border-black bg-white shadow-md transition-all duration-200 ${
                      isDisabled 
                        ? 'opacity-60 grayscale cursor-not-allowed' 
                        : 'hover:shadow-lg cursor-pointer group'
                    }`}
                    onClick={() => !isDisabled && openChat(chat)}
                  >
                    {/* Clickable tile with enquiry heading */}
                    <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col h-full">
                      {/* Chat avatar – rounded, WhatsApp-style green bubble */}
                      <div className="flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 relative">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${
                          isDisabled ? 'bg-gray-400' : 'bg-[#16a34a]'
                        } flex items-center justify-center border-2 border-black shadow-sm ${
                          isDisabled ? '' : 'group-hover:scale-110'
                        } transition-transform`}>
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        {!isDisabled && (chat.unreadCount || 0) > 0 && (
                          <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-red-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 flex items-center justify-center border-2 border-white shadow-xl z-20">
                            1
                          </span>
                        )}
                      </div>
                      
                      {/* Enquiry heading as tile title */}
                      <h3 className={`text-xs sm:text-sm lg:text-base font-black mb-1.5 sm:mb-2 lg:mb-3 text-center line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] ${
                        isDisabled ? 'text-gray-500' : 'text-black'
                      }`}>
                        {chat.enquiryTitle || `Enquiry ${chat.enquiryId || chat.id}`}
                      </h3>
                      
                      {/* Status badge for disabled chats */}
                      {isDisabled && statusText && (
                        <div className="flex justify-center mb-1.5 sm:mb-2">
                          <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 bg-gray-200 text-gray-600 rounded border border-gray-300 font-semibold">
                            {statusText}
                          </span>
                        </div>
                      )}
                      
                      {/* Last message preview */}
                      <p className={`text-[9px] sm:text-[10px] lg:text-xs text-center mb-2 sm:mb-3 lg:mb-4 line-clamp-2 flex-1 ${
                        isDisabled ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {chat.lastMessage?.text || chat.lastMessage || "No messages yet"}
                      </p>
                      
                      {/* Timestamp */}
                      <div className={`flex items-center justify-center gap-1 text-[8px] sm:text-[9px] lg:text-[10px] mb-2 sm:mb-3 lg:mb-4 ${
                        isDisabled ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="truncate">{formatTime(chat.updatedAt)}</span>
                      </div>
                      
                      {/* Open Chat button */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDisabled}
                        className={`w-full border-2 border-black text-[9px] sm:text-[10px] lg:text-xs font-bold py-1.5 sm:py-2 ${
                          isDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDisabled) {
                            openChat(chat);
                          }
                        }}
                      >
                        <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                        {isDisabled ? 'Chat Closed' : 'Open Chat'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}



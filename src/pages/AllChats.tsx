import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/contexts/ChatContext";
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ChatThread {
  id: string;
  enquiryId?: string;
  participants: string[];
  lastMessage?: string | { text?: string; senderId?: string; timestamp?: any };
  updatedAt?: any;
  sellerId?: string;
  enquiryTitle?: string;
  isBuyerChat?: boolean;
  enquiryData?: any;
  isDisabled?: boolean;
  unreadCount?: number;
}

export default function AllChats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { allChats: preloadedChats, loading: chatsLoading } = useChats();
  const [allChats, setAllChats] = useState<ChatThread[]>(preloadedChats);
  const [loading, setLoading] = useState(chatsLoading);
  const [responseNumbers, setResponseNumbers] = useState<Map<string, number>>(new Map());

  // Use preloaded chats from context - update whenever context changes
  useEffect(() => {
    setAllChats(preloadedChats || []);
    setLoading(chatsLoading);
  }, [preloadedChats, chatsLoading]);

  // Fetch response numbers for all chats
  useEffect(() => {
    if (!user?.uid || allChats.length === 0) return;

    const fetchResponseNumbers = async () => {
      const numbersMap = new Map<string, number>();
      const enquiryIds = new Set<string>();

      // Collect all unique enquiry IDs
      allChats.forEach(chat => {
        if (chat.enquiryId && chat.sellerId) {
          enquiryIds.add(chat.enquiryId);
        }
      });

      // Fetch responses for each enquiry and calculate response numbers
      const promises = Array.from(enquiryIds).map(async (enquiryId) => {
        try {
          const responsesQuery = query(
            collection(db, "sellerSubmissions"),
            where("enquiryId", "==", enquiryId),
            where("status", "==", "approved")
          );
          const snapshot = await getDocs(responsesQuery);
          
          const responses: Array<{ sellerId: string; createdAt: any }> = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.sellerId) {
              responses.push({
                sellerId: data.sellerId,
                createdAt: data.createdAt
              });
            }
          });

          // Sort by createdAt (oldest first) to get response order
          responses.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return aTime - bTime;
          });

          // Map sellerId to response number
          responses.forEach((response, index) => {
            const threadKey = `${enquiryId}_${response.sellerId}`;
            numbersMap.set(threadKey, index + 1);
          });
        } catch (error) {
          console.error(`Error fetching responses for enquiry ${enquiryId}:`, error);
        }
      });

      await Promise.all(promises);
      setResponseNumbers(numbersMap);
    };

    fetchResponseNumbers();
  }, [user?.uid, allChats]);

  // Sort chats by latest (most recent first)
  const sortedChats = [...allChats].sort((a, b) => {
    const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    return bTime - aTime; // Latest first
  });

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
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openChat = (chat: ChatThread) => {
    if (chat.isDisabled || !chat.enquiryId) return;
    
    // Mark chat as read when opening (only if it has actual messages)
    if (chat.lastMessage && typeof chat.lastMessage !== 'string' && chat.lastMessage.text !== "Ready to chat - Click to start conversation") {
      const threadKey = `${chat.enquiryId}_${chat.sellerId}`;
      const readKey = `chat_read_${user?.uid}_${threadKey}`;
      localStorage.setItem(readKey, Date.now().toString());
    }
    
    if (chat.sellerId) {
      navigate(`/enquiry/${chat.enquiryId}/responses?sellerId=${chat.sellerId}`);
    } else {
      navigate(`/enquiry/${chat.enquiryId}/responses-page`);
    }
  };

  // Check if chat is ready to chat (not used yet)
  const isReadyToChat = (chat: ChatThread) => {
    if (!chat.lastMessage || typeof chat.lastMessage === 'string') return false;
    return chat.lastMessage.text === "Ready to chat - Click to start conversation";
  };

  // Helper function to get disabled status text
  const getDisabledStatusText = (chat: ChatThread) => {
    if (!chat.isDisabled) return '';
    
    if (!chat.enquiryData) return 'Deleted';
    
    if (chat.enquiryData.status === 'deal_closed' || chat.enquiryData.dealClosed === true) return 'Deal Closed';
    
    if (chat.enquiryData.deadline) {
      const now = new Date();
      const deadline = chat.enquiryData.deadline?.toDate ? chat.enquiryData.deadline.toDate() : new Date(chat.enquiryData.deadline);
      if (deadline < now) return 'Expired';
    }
    
    if (chat.enquiryData.status === 'rejected') return 'Rejected';
    if (chat.enquiryData.status === 'completed') return 'Completed';
    
    return 'Closed';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-chats')}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-md border-2 border-black hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black">
                All Chats
              </h1>
            </div>
            <div className="flex items-center justify-between ml-11 sm:ml-14">
              <p className="text-[10px] sm:text-xs text-gray-600">
                View all your available chats and conversations
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading chats…</p>
          ) : sortedChats.length === 0 ? (
            <Card className="border-2 border-black bg-gradient-to-br from-white to-gray-50 shadow-lg p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                <p className="text-base sm:text-lg text-black font-bold">
                  No chats yet
                </p>
                <p className="text-[10px] sm:text-xs text-gray-900 font-medium">
                  Start posting enquiries or responding to begin chatting.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sortedChats.map((chat, index) => {
                const isDisabled = chat.isDisabled || false;
                const statusText = getDisabledStatusText(chat);
                const readyToChat = isReadyToChat(chat);
                const threadKey = chat.enquiryId && chat.sellerId ? `${chat.enquiryId}_${chat.sellerId}` : '';
                const responseNumber = threadKey ? responseNumbers.get(threadKey) : null;
                
                return (
                  <motion.div
                    key={chat.id}
                    initial={{ 
                      opacity: 0, 
                      x: -20
                    }}
                    animate={{ 
                      opacity: 1, 
                      x: 0
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: index * 0.02,
                      duration: 0.4
                    }}
                    whileHover={!isDisabled ? { 
                      x: 4,
                      transition: { 
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }
                    } : {}}
                  >
                    <Card
                      className={`border-[0.5px] border-black bg-gradient-to-br from-white via-white to-gray-50 shadow-md transition-all duration-300 relative overflow-hidden ${
                        isDisabled 
                          ? 'opacity-60 grayscale cursor-not-allowed' 
                          : 'hover:shadow-xl cursor-pointer group'
                      }`}
                      onClick={() => !isDisabled && openChat(chat)}
                    >
                      {/* Animated background gradient */}
                      {!isDisabled && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-green-50/10 to-transparent opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.4 }}
                        />
                      )}
                      
                      {/* List view content */}
                      <div className="p-2.5 sm:p-3 lg:p-4 flex flex-row items-center gap-2 sm:gap-3 lg:gap-4 relative z-10">
                        {/* Left: Avatar and badges */}
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          {/* My Enquiry / My Response Badge */}
                          {chat.isBuyerChat !== undefined && (
                            <div className="flex items-center justify-center border-[0.5px] border-black rounded px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0 font-black text-[7px] sm:text-[8px] shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)] bg-white text-black">
                              <span>{chat.isBuyerChat ? 'My Enquiry' : 'My Response'}</span>
                            </div>
                          )}

                          {/* Response Number Badge - Only show for buyers */}
                          {responseNumber && chat.isBuyerChat === true && (
                            <div className="flex items-center justify-center border-2 border-black rounded px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-b from-blue-600 to-blue-700 text-white flex-shrink-0 font-black text-[8px] sm:text-[9px] shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]">
                              <span>Response #{responseNumber}</span>
                            </div>
                          )}

                          {/* Chat avatar */}
                          <div className="relative">
                            <motion.div 
                              className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full ${
                                isDisabled ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600'
                              } flex items-center justify-center border-[0.5px] border-black shadow-md relative overflow-hidden`}
                              whileHover={!isDisabled ? {
                                scale: 1.1,
                                rotate: 180,
                                transition: { duration: 0.3 }
                              } : {}}
                            >
                              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white relative z-10" />
                            </motion.div>
                            
                            {!isDisabled && (chat.unreadCount || 0) > 0 && (
                              <motion.span 
                                className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-[8px] sm:text-[9px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[18px] sm:h-4.5 flex items-center justify-center border-2 border-white shadow-lg z-20"
                                animate={{
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                1
                              </motion.span>
                            )}
                          </div>
                        </div>

                        {/* Center: Content */}
                        <div className="flex-1 min-w-0">
                          {/* Enquiry title */}
                          <h3 
                            className={`text-xs sm:text-sm lg:text-base font-black mb-1 sm:mb-1.5 line-clamp-1 ${
                              isDisabled ? 'text-gray-500' : 'text-black'
                            }`}
                          >
                            {chat.enquiryTitle || `Enquiry ${chat.enquiryId || chat.id}`}
                          </h3>
                          
                          {/* Status badge for disabled chats */}
                          {isDisabled && statusText && (
                            <div className="flex items-center mb-1">
                              <span className="text-[7px] sm:text-[8px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded border border-gray-300 font-semibold">
                                {statusText}
                              </span>
                            </div>
                          )}
                          
                          {/* Last message preview */}
                          <p 
                            className={`text-[9px] sm:text-[10px] lg:text-xs mb-1 sm:mb-1.5 line-clamp-2 ${
                              isDisabled ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {typeof chat.lastMessage === 'string' 
                              ? chat.lastMessage 
                              : (chat.lastMessage?.text || "No messages yet")}
                          </p>
                          
                          {/* Timestamp */}
                          <div 
                            className={`flex items-center gap-1 text-[8px] sm:text-[9px] ${
                              isDisabled ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span>{formatTime(chat.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Right: Action button */}
                        <div className="flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isDisabled}
                            className={`border-[0.5px] border-black text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl relative overflow-hidden transition-all duration-200 ${
                              isDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                : 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 group/startchat'
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
                            {/* Shimmer effect */}
                            {!isDisabled && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/startchat:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                            )}
                            <span className="relative z-10">{isDisabled ? 'Closed' : readyToChat ? 'Start Chat' : 'Open Chat'}</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

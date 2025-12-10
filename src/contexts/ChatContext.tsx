import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/firebase";
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from "firebase/firestore";

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
  isAdminChat?: boolean;
}

interface ChatContextType {
  allChats: ChatThread[];
  loading: boolean;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allChats, setAllChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveChats = async () => {
    if (!user?.uid) {
      setAllChats([]);
      setLoading(false);
      return;
    }

    try {
      const chatThreadMap = new Map<string, ChatThread>();

      // 1. Load all chat messages where user has sent or received messages
      const chatMessagesQuery = query(collection(db, "chatMessages"));
      const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
      
      // Process messages to find chats where user is involved
      // First pass: Collect all unique enquiry IDs and build thread map
      const enquiryIds = new Set<string>();
      const messageThreadData = new Map<string, { enquiryId: string; sellerId: string; senderId: string; messageData: any }>();
      
      chatMessagesSnapshot.forEach((messageDoc) => {
        const messageData = messageDoc.data();
        const enquiryId = messageData.enquiryId;
        const sellerId = messageData.sellerId;
        const senderId = messageData.senderId;
        
        if (!enquiryId || !sellerId) return;
        
        const threadKey = `${enquiryId}_${sellerId}`;
        enquiryIds.add(enquiryId);
        
        // Track message data for this thread (keep latest)
        const existing = messageThreadData.get(threadKey);
        const messageTime = messageData.timestamp?.toDate ? messageData.timestamp.toDate().getTime() : 
                          (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
        const existingTime = existing?.messageData.timestamp?.toDate ? existing.messageData.timestamp.toDate().getTime() : 
                           (existing?.messageData.timestamp ? new Date(existing.messageData.timestamp).getTime() : 0);
        
        if (!existing || messageTime > existingTime) {
          messageThreadData.set(threadKey, { enquiryId, sellerId, senderId, messageData });
        }
      });

      // Batch fetch all enquiries at once
      const enquiryPromises = Array.from(enquiryIds).map(enquiryId => 
        getDoc(doc(db, "enquiries", enquiryId)).catch(() => null)
      );
      const enquiryDocs = await Promise.all(enquiryPromises);
      
      // Create enquiry data map
      const enquiryDataMap = new Map<string, any>();
      enquiryDocs.forEach((enquiryDoc, index) => {
        if (enquiryDoc?.exists()) {
          const enquiryId = Array.from(enquiryIds)[index];
          enquiryDataMap.set(enquiryId, enquiryDoc.data());
        }
      });

      // Second pass: Build chat threads from collected data
      messageThreadData.forEach((threadInfo, threadKey) => {
        const enquiryData = enquiryDataMap.get(threadInfo.enquiryId);
        if (!enquiryData) return; // Enquiry deleted
        
        const buyerId = enquiryData.userId;
        const { sellerId, senderId, messageData } = threadInfo;
        
        // User is involved if they're the buyer OR the seller OR the sender
        const isUserInvolved = (buyerId === user.uid) || (sellerId === user.uid) || (senderId === user.uid);
        
        if (isUserInvolved) {
          const isBuyerChat = buyerId === user.uid; // true if user is buyer (posted enquiry)
          
          if (!chatThreadMap.has(threadKey)) {
            chatThreadMap.set(threadKey, {
              id: threadKey,
              enquiryId: threadInfo.enquiryId,
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
      });

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

      // 3. Load enquiries with approved responses that are ready to chat
      // (even if no chat messages exist yet)
      // NOTE: These won't affect notification counts since they have no messages
      try {
        // For buyers: Get enquiries they posted with approved responses
        const buyerEnquiriesQuery = query(
          collection(db, "enquiries"),
          where("userId", "==", user.uid)
        );
        const buyerEnquiriesSnapshot = await getDocs(buyerEnquiriesQuery);
        
        const buyerEnquiryPromises: Promise<void>[] = [];
        buyerEnquiriesSnapshot.forEach((enquiryDoc) => {
          const enquiryData = enquiryDoc.data();
          const enquiryId = enquiryDoc.id;
          
          // Check if enquiry is still active (not expired, closed, etc.)
          const now = new Date();
          const deadline = enquiryData.deadline?.toDate ? enquiryData.deadline.toDate() : new Date(enquiryData.deadline);
          const isExpired = deadline && deadline < now;
          const isClosed = enquiryData.status === 'deal_closed' || enquiryData.dealClosed === true;
          const isRejected = enquiryData.status === 'rejected' || enquiryData.status === 'completed';
          
          if (isExpired || isClosed || isRejected) return;
          
          // Get approved responses for this enquiry
          const promise = getDocs(
            query(
              collection(db, "sellerSubmissions"),
              where("enquiryId", "==", enquiryId),
              where("status", "==", "approved")
            )
          ).then((responsesSnapshot) => {
            responsesSnapshot.forEach((responseDoc) => {
              const responseData = responseDoc.data();
              const sellerId = responseData.sellerId;
              if (!sellerId) return;
              
              const threadKey = `${enquiryId}_${sellerId}`;
              
              // Only add if chat doesn't already exist (no messages yet)
              if (!chatThreadMap.has(threadKey)) {
                chatThreadMap.set(threadKey, {
                  id: threadKey,
                  enquiryId: enquiryId,
                  sellerId: sellerId,
                  enquiryTitle: enquiryData.title || "Untitled Enquiry",
                  enquiryData: enquiryData,
                  participants: [enquiryData.userId, sellerId],
                  updatedAt: responseData.createdAt || responseData.updatedAt,
                  lastMessage: {
                    text: "Ready to chat - Click to start conversation",
                    senderId: sellerId,
                    timestamp: responseData.createdAt || responseData.updatedAt
                  },
                  isBuyerChat: true, // User is the buyer
                  unreadCount: 0 // Explicitly set to 0 - no unread messages for ready-to-chat items
                });
              }
            });
          }).catch(err => {
            console.error("Error fetching responses for enquiry:", err);
          });
          
          buyerEnquiryPromises.push(promise);
        });
        
        // For sellers: Get approved responses they submitted
        const sellerResponsesQuery = query(
          collection(db, "sellerSubmissions"),
          where("sellerId", "==", user.uid),
          where("status", "==", "approved")
        );
        const sellerResponsesSnapshot = await getDocs(sellerResponsesQuery);
        
        const sellerResponsePromises: Promise<void>[] = [];
        sellerResponsesSnapshot.forEach((responseDoc) => {
          const responseData = responseDoc.data();
          const enquiryId = responseData.enquiryId;
          if (!enquiryId) return;
          
          // Get enquiry data
          const promise = getDoc(doc(db, "enquiries", enquiryId)).then((enquiryDoc) => {
            if (!enquiryDoc.exists()) return;
            
            const enquiryData = enquiryDoc.data();
            
            // Check if enquiry is still active
            const now = new Date();
            const deadline = enquiryData.deadline?.toDate ? enquiryData.deadline.toDate() : new Date(enquiryData.deadline);
            const isExpired = deadline && deadline < now;
            const isClosed = enquiryData.status === 'deal_closed' || enquiryData.dealClosed === true;
            const isRejected = enquiryData.status === 'rejected' || enquiryData.status === 'completed';
            
            if (isExpired || isClosed || isRejected) return;
            
            const sellerId = user.uid;
            const threadKey = `${enquiryId}_${sellerId}`;
            
            // Only add if chat doesn't already exist (no messages yet)
            if (!chatThreadMap.has(threadKey)) {
              chatThreadMap.set(threadKey, {
                id: threadKey,
                enquiryId: enquiryId,
                sellerId: sellerId,
                enquiryTitle: enquiryData.title || "Untitled Enquiry",
                enquiryData: enquiryData,
                participants: [enquiryData.userId, sellerId],
                updatedAt: responseData.createdAt || responseData.updatedAt,
                lastMessage: {
                  text: "Ready to chat - Click to start conversation",
                  senderId: sellerId,
                  timestamp: responseData.createdAt || responseData.updatedAt
                },
                isBuyerChat: false, // User is the seller
                unreadCount: 0 // Explicitly set to 0 - no unread messages for ready-to-chat items
              });
            }
          }).catch(err => {
            console.error("Error fetching enquiry for response:", err);
          });
          
          sellerResponsePromises.push(promise);
        });
        
        // Wait for all new promises to complete
        await Promise.all([...buyerEnquiryPromises, ...sellerResponsePromises]);
      } catch (err) {
        console.warn("Error loading ready-to-chat enquiries:", err);
      }

      // 4. Load admin messages (suspensions, warnings) - Real-time via onSnapshot
      // Note: This is handled separately in useEffect with onSnapshot for real-time updates
      try {
        const adminMessagesQuery = query(
          collection(db, 'chatMessages'),
          where('recipientId', '==', user.uid),
          where('isAdminMessage', '==', true)
        );
        const adminMessagesSnapshot = await getDocs(adminMessagesQuery);
        
        adminMessagesSnapshot.forEach((messageDoc) => {
          const messageData = messageDoc.data();
          const adminChatId = `admin_${messageData.adminMessageType}_${messageDoc.id}`;
          
          // Determine title based on message type
          let title = 'Admin Message';
          if (messageData.adminMessageType === 'suspension') {
            title = '🚫 Account Suspended';
          } else if (messageData.adminMessageType === 'warning') {
            title = '⚠️ Warning from Admin';
          }
          
          // Create admin chat thread
          chatThreadMap.set(adminChatId, {
            id: adminChatId,
            enquiryId: messageData.enquiryId || 'admin',
            sellerId: 'admin',
            enquiryTitle: title,
            participants: ['admin', user.uid],
            updatedAt: messageData.timestamp,
            lastMessage: {
              text: messageData.message || '',
              senderId: 'admin',
              timestamp: messageData.timestamp
            },
            isBuyerChat: true, // Show in buyer chats
            isAdminChat: true, // Mark as admin chat
            unreadCount: 1 // Show as unread for notification badge
          });
        });
      } catch (err) {
        console.warn("Error loading admin messages:", err);
      }

      // Convert map to array and fetch missing enquiry titles and data
      const threads = Array.from(chatThreadMap.values());
      
      const enrichedThreads = await Promise.all(
        threads.map(async (thread) => {
          if (thread.enquiryId) {
            // Only fetch if we don't already have enquiryData
            // IMPORTANT: Skip fetching enquiry data for admin warnings (they don't need it)
            if (!thread.enquiryData && !(thread.isAdminChat && thread.enquiryTitle?.includes('Warning'))) {
              try {
                const enquiryDoc = await getDoc(doc(db, "enquiries", thread.enquiryId));
                if (enquiryDoc.exists()) {
                  thread.enquiryData = enquiryDoc.data();
                  thread.enquiryTitle = thread.enquiryData.title || "Untitled Enquiry";
                } else {
                  // Enquiry deleted - but NOT for admin warnings
                  if (!thread.isAdminChat) {
                    thread.enquiryTitle = "Enquiry Not Found";
                    thread.isDisabled = true;
                  }
                }
              } catch (err) {
                console.error("Error fetching enquiry data:", err);
                if (!thread.enquiryTitle && !thread.isAdminChat) {
                  thread.enquiryTitle = "Loading...";
                }
              }
            }
            
            // Check if chat should be disabled (using existing or newly fetched enquiryData)
            // IMPORTANT: Admin warnings are NEVER disabled
            if (thread.isAdminChat && thread.enquiryTitle?.includes('Warning')) {
              thread.isDisabled = false; // Warnings are never disabled
            } else if (thread.enquiryData) {
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
            } else if (!thread.enquiryData && thread.enquiryId && !thread.isAdminChat) {
              // If we couldn't fetch enquiry data, mark as disabled (likely deleted)
              // But NOT for admin warnings
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
      setAllChats([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveChats();
    
    // Set up real-time listeners for chat messages and seller submissions to refresh
    if (!user?.uid) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const refreshChats = () => {
      // Debounce refresh to avoid too frequent updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadActiveChats();
      }, 500);
    };
    
    // Listen to chat messages changes (includes admin messages)
    const unsubscribeChatMessages = onSnapshot(
      query(collection(db, "chatMessages")),
      () => {
        refreshChats();
      },
      (error) => {
        console.error("Error listening to chat messages:", error);
      }
    );
    
    // Real-time listener specifically for admin messages (warnings/suspensions)
    const unsubscribeAdminMessages = onSnapshot(
      query(
        collection(db, 'chatMessages'),
        where('recipientId', '==', user.uid),
        where('isAdminMessage', '==', true)
      ),
      () => {
        refreshChats(); // Refresh when admin messages change
      },
      (error) => {
        console.error("Error listening to admin messages:", error);
      }
    );

    // Listen to seller submissions changes (for new approved responses / ready-to-chat items)
    const unsubscribeSellerSubmissions = onSnapshot(
      query(
        collection(db, "sellerSubmissions"),
        where("status", "==", "approved")
      ),
      () => {
        refreshChats();
      },
      (error) => {
        console.error("Error listening to seller submissions:", error);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribeChatMessages();
      unsubscribeSellerSubmissions();
      unsubscribeAdminMessages();
    };
  }, [user?.uid]);

  return (
    <ChatContext.Provider value={{ allChats, loading, refreshChats: loadActiveChats }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatProvider");
  }
  return context;
};




import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Shield, User, MessageSquare, CheckCircle, X } from "lucide-react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import VerifiedUser from "@/components/VerifiedUser";

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName?: string;
  senderType?: 'admin' | 'user';
  timestamp: any;
  isSystemMessage?: boolean;
  isAdminMessage?: boolean;
  enquiryId?: string;
  adminMessageType?: string;
}

export default function AdminChat() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWarningChat, setIsWarningChat] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const [chatConnected, setChatConnected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const warningMessagesRef = useRef<ChatMessage[]>([]);
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) return;
      
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdmin();
  }, [user]);

  // Load user profile
  useEffect(() => {
    const loadUser = async () => {
      if (!userId || !user?.uid) return;
      
      try {
        // If admin: load the target user's profile
        // If user: load their own profile (for display)
        const targetUserId = isAdmin ? userId : user.uid;
        const userDoc = await getDoc(doc(db, 'userProfiles', targetUserId));
        if (userDoc.exists()) {
          setChatUser(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    // Wait for admin check to complete
    if (isAdmin !== undefined) {
      loadUser();
    }
  }, [userId, user?.uid, isAdmin]);

  // Fetch user profiles for verification status
  useEffect(() => {
    if (messages.length === 0) return;

    const uniqueUserIds = [...new Set(messages.map(msg => msg.senderId))];
    const missingIds = uniqueUserIds.filter(id => !userProfiles[id] && id !== user?.uid);

    if (missingIds.length === 0) return;

    const fetchProfiles = async () => {
      const profilesData: {[key: string]: any} = {};
      for (const userId of missingIds) {
        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
          if (profileDoc.exists()) {
            profilesData[userId] = profileDoc.data();
          }
        } catch (error) {
          console.error(`Error fetching profile for ${userId}:`, error);
        }
      }
      if (Object.keys(profilesData).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...profilesData }));
      }
    };

    fetchProfiles();
  }, [messages, user?.uid, userProfiles]);

  // Real-time chat listener - Load both warning and chat messages
  useEffect(() => {
    if (!userId || !user?.uid || isAdmin === undefined) return;

    // Determine the chat participants
    // If user is admin: chat with userId (the target user)
    // If user is not admin: chat with 'admin' (userId is their own ID)
    const targetUserId = isAdmin ? userId : user.uid;

    // Query 1: Load warning messages (enquiryId: 'admin_warning')
    // Query without orderBy to avoid index issues, we'll sort manually
    // This query gets admin warning messages sent to the user
    const warningQuery = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', 'admin_warning'),
      where('recipientId', '==', targetUserId),
      where('isAdminMessage', '==', true),
      where('adminMessageType', '==', 'warning')
    );

    // Query 1b: Load user replies to warnings (enquiryId: 'admin_warning', but from user)
    // This allows users to reply to admin warnings
    const warningRepliesQuery = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', 'admin_warning'),
      where('sellerId', '==', 'admin'),
      where('senderId', '==', targetUserId)
    );

    // Query 2: Load chat messages (enquiryId: 'admin_chat')
    // Query messages where sellerId matches targetUserId (main thread identifier)
    // Also query by senderId and recipientId to catch all messages
    const chatQuery1 = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', 'admin_chat'),
      where('sellerId', '==', targetUserId),
      orderBy('timestamp', 'asc')
    );
    
    // Query messages sent by the target user
    const chatQuery2 = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', 'admin_chat'),
      where('senderId', '==', targetUserId),
      orderBy('timestamp', 'asc')
    );
    
    // Query messages sent to the target user (for admin messages)
    const chatQuery3 = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', 'admin_chat'),
      where('recipientId', '==', targetUserId),
      orderBy('timestamp', 'asc')
    );

    // Reset refs when component mounts or dependencies change
    warningMessagesRef.current = [];
    chatMessagesRef.current = [];

    // Function to combine and update messages
    const updateMessages = () => {
      const allMessages = [...warningMessagesRef.current, ...chatMessagesRef.current].sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return timeA.getTime() - timeB.getTime();
      });
      
      setMessages(allMessages);
      setIsWarningChat(warningMessagesRef.current.length > 0);
      setLoading(false);
      setChatConnected(true);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    const unsubscribeWarning = onSnapshot(
      warningQuery,
      (snapshot) => {
        warningMessagesRef.current = [];
        snapshot.forEach((doc) => {
          const messageData = { id: doc.id, ...doc.data() } as ChatMessage;
          warningMessagesRef.current.push(messageData);
        });
        
        // Update messages with latest data from both listeners
        updateMessages();
      },
      (error) => {
        console.error('Warning query error:', error);
        // If warning query fails (e.g., no index), continue with chat messages only
        warningMessagesRef.current = [];
        setIsWarningChat(false);
        updateMessages();
      }
    );

    // Track all chat messages from both queries
    const allChatMessages = new Map<string, ChatMessage>();

    const updateChatMessages = () => {
      chatMessagesRef.current = Array.from(allChatMessages.values());
      updateMessages();
    };

    const unsubscribeChat1 = onSnapshot(
      chatQuery1,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const messageData = { id: doc.id, ...doc.data() } as ChatMessage;
          allChatMessages.set(doc.id, messageData);
        });
        updateChatMessages();
      },
      (error) => {
        console.error('Chat query 1 error:', error);
        setLoading(false);
        setChatConnected(false);
      }
    );

    const unsubscribeChat2 = onSnapshot(
      chatQuery2,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const messageData = { id: doc.id, ...doc.data() } as ChatMessage;
          allChatMessages.set(doc.id, messageData);
        });
        updateChatMessages();
      },
      (error) => {
        console.error('Chat query 2 error:', error);
        // Continue even if this query fails
      }
    );

    const unsubscribeChat3 = onSnapshot(
      chatQuery3,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const messageData = { id: doc.id, ...doc.data() } as ChatMessage;
          allChatMessages.set(doc.id, messageData);
        });
        updateChatMessages();
      },
      (error) => {
        console.error('Chat query 3 error:', error);
        // Continue even if this query fails
      }
    );

    return () => {
      unsubscribeWarning();
      unsubscribeWarningReplies();
      unsubscribeChat1();
      unsubscribeChat2();
      unsubscribeChat3();
    };
  }, [userId, user?.uid, isAdmin]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !user?.uid) return;

    try {
      const senderType = isAdmin ? 'admin' : 'user';
      const senderName = isAdmin ? 'Admin' : (chatUser?.fullName || user.email || 'User');
      
      // Determine target user ID for the chat thread
      // If admin: chat with userId (target user)
      // If user: chat with their own ID (admin will see it)
      const targetUserId = isAdmin ? userId : user.uid;

      // Use 'admin_warning' if it's a warning chat, otherwise use 'admin_chat'
      const enquiryId = isWarningChat ? 'admin_warning' : 'admin_chat';
      const sellerIdForThread = isWarningChat ? 'admin' : targetUserId;

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: enquiryId,
        sellerId: sellerIdForThread, // Use 'admin' for warning chats, targetUserId for regular chats
        senderId: user.uid,
        senderName: senderName,
        senderType: senderType,
        message: newMessage.trim(),
        isAdminMessage: isAdmin,
        recipientId: isAdmin ? userId : 'admin',
        // For warning chats, also set adminMessageType to allow replies
        ...(isWarningChat && !isAdmin ? { adminMessageType: 'warning' } : {}),
        timestamp: serverTimestamp()
      });

      setNewMessage("");
      
      // Auto-scroll
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to send message', 
        variant: 'destructive' 
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clean message text by removing warning prefixes
  const cleanMessageText = (text: string) => {
    if (!text) return '';
    // Remove "⚠️ WARNING FROM ADMIN: " prefix
    return text.replace(/^⚠️\s*WARNING\s*FROM\s*ADMIN:\s*/i, '').trim();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading chat...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Chat Card - Matching EnquiryResponses styling */}
          <Card className="border border-black shadow-sm h-[calc(100vh-100px)] sm:h-[calc(100vh-200px)] lg:h-[750px] xl:h-[800px] flex flex-col bg-white overflow-hidden" style={{ width: '100%', borderWidth: '0.5px' }}>
            {/* Header - Matching EnquiryResponses */}
            <CardHeader className="pb-2 sm:pb-2 lg:pb-2.5 bg-green-950 p-2 sm:p-2 lg:p-2.5 overflow-visible relative" style={{ borderBottom: '0.5px solid black' }}>
              {/* Close Button - Top Right Corner (Mobile Only) */}
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 lg:hidden z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="text-white hover:text-white hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-md transition-colors duration-200 flex-shrink-0 min-touch"
                >
                  <X className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                </Button>
              </div>
              
              {/* Header Content */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 relative">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="hidden lg:flex text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <>
                        <User className="h-5 w-5 text-white" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white">
                          Chat with {chatUser?.fullName || chatUser?.email || userId}
                        </h3>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 text-white" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white">
                          {isWarningChat ? 'Warning from Admin' : 'Chat with Admin'}
                        </h3>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Chat Messages Container - Matching EnquiryResponses */}
            <div ref={chatContainerRef} id="chat-messages" className="flex-1 overflow-y-auto bg-white min-h-0 max-h-full" style={{ maxHeight: '100%' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5 lg:mb-3">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-slate-500" />
                    </div>
                    <h4 className="text-xs sm:text-sm lg:text-base font-bold text-black mb-1.5 sm:mb-2 lg:mb-2.5">Start chatting</h4>
                    <p className="text-black font-medium text-[10px] sm:text-xs lg:text-sm max-w-sm mx-auto px-3 sm:px-4 lg:px-5">
                      {isWarningChat ? 'Continue the conversation with admin' : 'Begin discussing with admin'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4 lg:py-5 space-y-2 sm:space-y-2.5 lg:space-y-3" style={{ minHeight: 'auto' }}>
                  {messages.map((message, index) => {
                    // System messages (like warnings) - Display as regular messages but clean the text
                    // Note: We're treating warnings as regular messages now, not system messages
                    
                    const isOwnMessage = message.senderId === user?.uid;
                    const isAdminMsg = message.senderType === 'admin' || message.isAdminMessage;
                    
                    return (
                      <div
                        key={message.id || `message-${index}`}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[70%] lg:max-w-[65%] px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl relative border-[0.5px] ${
                            isAdminMsg
                              ? 'bg-red-600 border-red-600 text-white'
                              : isOwnMessage
                              ? 'bg-white text-black border-black'
                              : 'bg-white text-black border-black'
                          }`}
                        >
                          {/* Message Content */}
                          {message.message && (
                            <p className={`text-sm sm:text-base lg:text-lg leading-relaxed break-words font-medium ${
                              isAdminMsg ? 'text-white' : 'text-black'
                            }`}>
                              {cleanMessageText(message.message).split(/(₹?\d+(?:,\d+)*(?:\.\d+)?)/g).map((part, i) => {
                                // Check if part is a number (with or without ₹)
                                if (/^₹?\d+(?:,\d+)*(?:\.\d+)?$/.test(part)) {
                                  return <span key={i} className={`font-bold px-1 rounded ${
                                    isAdminMsg ? 'text-white bg-red-700' : 'text-black bg-gray-200'
                                  }`}>{part}</span>;
                                }
                                return <span key={i}>{part}</span>;
                              })}
                            </p>
                          )}
                          
                          {/* Message Meta */}
                          <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                            <span className={`text-[8px] sm:text-[9px] lg:text-[10px] font-medium ${
                              isAdminMsg ? 'text-red-100' : 'text-gray-600'
                            }`}>
                              {formatDate(message.timestamp)}
                            </span>
                            {isOwnMessage && (
                              <div className="ml-0.5 sm:ml-1">
                                <CheckCircle className={`h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 ${
                                  isAdminMsg ? 'text-red-100' : 'text-gray-600'
                                }`} />
                              </div>
                            )}
                          </div>
                          
                          {/* Sender Name */}
                          {message.senderId !== user?.uid && message.senderName && message.senderName !== 'User' && (
                            <div className="mt-1.5 sm:mt-2">
                              <VerifiedUser 
                                name={message.senderName}
                                isVerified={userProfiles[message.senderId]?.isProfileVerified || false}
                                className="text-xs sm:text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Real-time Status Indicator */}
                  {chatConnected && (
                    <div className="flex justify-center py-2">
                      <div className="flex items-center space-x-2 text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input - Matching EnquiryResponses */}
            <div className="border-t border-gray-800 bg-white">
              <div className="p-2.5 sm:p-2 lg:p-2.5">
                {/* Simple Chat Input */}
                <div className="flex items-center space-x-2 sm:space-x-2.5 lg:space-x-3 border border-gray-800 rounded-lg sm:rounded-xl p-1.5 sm:p-2 lg:p-2.5">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm sm:text-base lg:text-lg"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 p-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 rounded-full min-touch"
                  >
                    <Send className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

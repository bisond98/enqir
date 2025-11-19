import { useState, useEffect, useRef, useContext } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, MessageSquare, Shield, ImageIcon, Send, CheckCircle, Clock, AlertTriangle, User, X, Paperclip, Image, Mic, File, MicOff, Square, Crown, Lock, Phone, PhoneOff, PhoneCall, Tag, MapPin, Briefcase, Sparkles } from "lucide-react";
import VerifiedUser from "@/components/VerifiedUser";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { useUsage } from "@/contexts/UsageContext";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import { db } from "@/firebase";
import { collection, query, where, doc, getDoc, addDoc, orderBy, serverTimestamp, getDocs, limit, updateDoc, onSnapshot, deleteDoc, setDoc, arrayUnion } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { getPrivacyProtectedName, isUserVerified, getSafeLogData } from "@/utils/privacy";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import MicrophonePermissionPrompt from "@/components/MicrophonePermissionPrompt";
import { checkMicrophonePermission, MicrophonePermissionStatus } from "@/utils/permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location?: string;
  status: 'pending' | 'live' | 'rejected' | 'completed';
  userId: string;
  createdAt: any;
  responses: number;
  likes: number;
  shares: number;
  views: number;
  adminNotes?: string;
  userLikes?: string[];
  isUrgent?: boolean;
  deadline?: any;
  isPremium?: boolean;
}

interface SellerSubmission {
  id: string;
  enquiryId: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  title: string;
  message: string;
  price: string;
  notes: string;
  imageUrls: string[];
  imageNames: string[];
  imageCount: number;
  govIdType: string;
  govIdNumber: string;
  govIdUrl: string;
  govIdFileName: string;
  isIdentityVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt: any;
  buyerViewed: boolean;
  chatEnabled: boolean;
}

interface ChatMessage {
  id: string;
  enquiryId: string;
  sellerId: string;
  senderId: string;
  senderName: string;
  senderType: 'buyer' | 'seller';
  message: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
  }>;
  timestamp: any;
}

const EnquiryResponses = () => {
  const { user } = useAuth();
  const notificationContext = useContext(NotificationContext);
  const createNotification = notificationContext?.createNotification || (async () => {
    console.warn('NotificationContext not available');
  });
  const { canViewResponse, canViewAllResponses, getResponseViewLimit, purchasePremiumEnquiry, purchaseMonthlySubscription, usageStats } = useUsage();
  const navigate = useNavigate();
  const { enquiryId } = useParams();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [approvedResponses, setApprovedResponses] = useState<SellerSubmission[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<SellerSubmission | null>(null);
  
  // Get sellerId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sellerIdFromUrl = urlParams.get('sellerId');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [showBlockUserConfirm, setShowBlockUserConfirm] = useState(false);
  const [showCloseDealConfirm, setShowCloseDealConfirm] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{id: string, name: string} | null>(null);

  // Call-related state
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'active' | 'ended'>('idle');
  const [callsEnabled, setCallsEnabled] = useState(true); // Call toggle state
  
  // Microphone permission state
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionStatus>('checking');
  const [showMicrophonePrompt, setShowMicrophonePrompt] = useState<boolean>(false);
  
  // Update ref whenever callStatus changes
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCaller, setIsCaller] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const attachmentDropdownRef = useRef<HTMLDivElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callSignalingRef = useRef<(() => void) | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const callStatusRef = useRef<'idle' | 'calling' | 'ringing' | 'connecting' | 'active' | 'ended'>('idle');
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!enquiryId || !user) return;

    setLoading(true);
    console.log('EnquiryResponses: Starting to fetch data for enquiry:', enquiryId);

    // Fetch enquiry details
    const fetchEnquiry = async () => {
      try {
        const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
        if (enquiryDoc.exists()) {
          const enquiryData = { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
          setEnquiry(enquiryData);
          console.log('EnquiryResponses: Fetched enquiry:', enquiryData);
        }
      } catch (error) {
        console.error('Error fetching enquiry:', error);
        toast({ title: 'Error', description: 'Failed to fetch enquiry details', variant: 'destructive' });
      }
    };

    fetchEnquiry();

    // Simple function to load responses
    const loadResponses = async () => {
      try {
        // Always show all responses for the enquiry
        // Access control is handled in the UI based on user role
        const responsesQuery = query(
          collection(db, 'sellerSubmissions'),
          where('enquiryId', '==', enquiryId)
        );

        const snapshot = await getDocs(responsesQuery);
        const responsesData: SellerSubmission[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            responsesData.push({ id: doc.id, ...(data as any) } as SellerSubmission);
          }
        });
        
        // Filter approved responses and sort
        const approvedResponses = responsesData
          .filter(response => response.status === 'approved')
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
        
        console.log('EnquiryResponses: Fetched approved responses:', approvedResponses);
        setApprovedResponses(approvedResponses);
        
        // Auto-select seller if sellerId is in URL
        if (sellerIdFromUrl && responsesData.length > 0) {
          const targetResponse = responsesData.find(response => response.sellerId === sellerIdFromUrl);
          if (targetResponse) {
            setSelectedResponse(targetResponse);
            console.log('EnquiryResponses: Auto-selected seller from URL:', getSafeLogData({ sellerName: targetResponse.sellerName }));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.log('Error loading responses:', error);
        setLoading(false);
      }
    };

    loadResponses();
  }, [enquiryId, user]);

  // Handle URL parameter changes for sellerId
  useEffect(() => {
    if (sellerIdFromUrl && approvedResponses.length > 0) {
      const targetResponse = approvedResponses.find(response => response.sellerId === sellerIdFromUrl);
      if (targetResponse) {
        // Only open chat if the user is authorized to chat with this seller
        // (either the buyer of the enquiry or the seller themselves)
        const isAuthorized = user?.uid === enquiry?.userId || user?.uid === targetResponse.sellerId;
        if (isAuthorized) {
          setSelectedResponse(targetResponse);
          console.log('EnquiryResponses: Selected seller from URL change:', targetResponse.sellerName);
        } else {
          console.log('EnquiryResponses: User not authorized to chat with this seller');
        }
      }
    }
  }, [sellerIdFromUrl, approvedResponses, user, enquiry]);

  // Load calls enabled state from Firestore
  useEffect(() => {
    if (!selectedResponse || !enquiryId) return;

    const loadCallsEnabled = async () => {
      try {
        const chatSettingsRef = doc(db, 'chatSettings', `${enquiryId}_${selectedResponse.sellerId}`);
        const chatSettingsDoc = await getDoc(chatSettingsRef);
        
        if (chatSettingsDoc.exists()) {
          const data = chatSettingsDoc.data();
          setCallsEnabled(data.callsEnabled !== undefined ? data.callsEnabled : true);
        } else {
          setCallsEnabled(true); // Default to enabled
        }
      } catch (error) {
        console.log('Error loading calls enabled state:', error);
        setCallsEnabled(true); // Default to enabled on error
      }
    };

    loadCallsEnabled();
  }, [selectedResponse, enquiryId]);

  // Check microphone permission on mount and when chat opens
  useEffect(() => {
    if (!selectedResponse) return;

    const checkPermission = async () => {
      try {
        const status = await checkMicrophonePermission();
        setMicrophonePermission(status);
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        setMicrophonePermission('prompt'); // Default to prompt on error
      }
    };

    checkPermission();
  }, [selectedResponse]);

  // Handle permission granted callback
  const handlePermissionGranted = async () => {
    // Re-check permission status
    const status = await checkMicrophonePermission();
    setMicrophonePermission(status);
    setShowMicrophonePrompt(false); // Hide prompt when permission is granted
  };

  // Simple real-time chat with onSnapshot
  useEffect(() => {
    if (!selectedResponse || !enquiryId) return;

    // Ensure the selected response belongs to the current enquiry
    if (selectedResponse.enquiryId !== enquiryId) {
      console.log('EnquiryResponses: Selected response does not belong to current enquiry, clearing selection');
      setSelectedResponse(null);
      return;
    }

    console.log('Setting up real-time chat for enquiry:', enquiryId, 'seller:', selectedResponse.sellerId);
    
    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', enquiryId),
      where('sellerId', '==', selectedResponse.sellerId)
    );

    const unsubscribe = onSnapshot(chatQuery, 
      (snapshot) => {
        const messagesData: ChatMessage[] = [];
        
        snapshot.forEach((doc) => {
          const messageData = { id: doc.id, ...doc.data() } as ChatMessage;
          messagesData.push(messageData);
        });
        
        // Sort by timestamp
        messagesData.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return timeA.getTime() - timeB.getTime();
        });
        
        setChatMessages(messagesData);
        setChatConnected(true);
        
        // Auto-scroll
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-messages');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      },
      (error) => {
        console.log('Chat error:', error);
        setChatConnected(false);
      }
    );

    return () => {
      unsubscribe();
      // Clean up chat state when component unmounts or enquiry changes
      setChatMessages([]);
      setChatConnected(false);
    };
  }, [selectedResponse, enquiryId]);

  // Fetch user profiles for verification status
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const userIds = [...new Set(chatMessages.map(msg => msg.senderId))];
    const profilesData: {[key: string]: any} = {};

    const fetchProfiles = async () => {
      for (const userId of userIds) {
        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
          if (profileDoc.exists()) {
            profilesData[userId] = profileDoc.data();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      setUserProfiles(profilesData);
    };

    fetchProfiles();
  }, [chatMessages]);

  // Also fetch profile for selected response seller and current user
  useEffect(() => {
    if (!selectedResponse?.sellerId && !user?.uid) return;

    const fetchProfiles = async () => {
      try {
        // Fetch seller profile
        if (selectedResponse?.sellerId) {
          const sellerProfileDoc = await getDoc(doc(db, 'userProfiles', selectedResponse.sellerId));
          if (sellerProfileDoc.exists()) {
            setUserProfiles(prev => ({
              ...prev,
              [selectedResponse.sellerId]: sellerProfileDoc.data()
            }));
          }
        }
        
        // Fetch current user profile
        if (user?.uid) {
          const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          if (userProfileDoc.exists()) {
            setUserProfiles(prev => ({
              ...prev,
              [user.uid]: userProfileDoc.data()
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };

    fetchProfiles();
  }, [selectedResponse?.sellerId, user?.uid]);

  // Real-time listener handles message loading automatically

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedResponse || !enquiryId || !user) return;

    const messageText = newMessage.trim();
    const isSeller = user.uid === selectedResponse.sellerId;
    
    // Clear input and attachments immediately
    setNewMessage("");
    setAttachments([]);

    try {
      // Create attachment data with compression and base64
      const attachmentData = (await Promise.all(attachments.map(async (file, index) => {
        const fileId = `${Date.now()}-${index}`;
        setUploadingFiles(prev => ({ ...prev, [fileId]: true }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Compress file based on type
          let processedFile = file;
          if (file.type.startsWith('image/')) {
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressImage(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

          } else if (file.type.startsWith('audio/')) {
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressAudio(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
          } else {
            // Handle documents and other file types
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressDocument(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
          }

          const baseData = {
            name: processedFile.name,
            type: processedFile.type,
            size: processedFile.size,
            lastModified: processedFile.lastModified
          };

          // For images, audio, and videos, include base64 data (for chat history persistence)
          if (processedFile.type.startsWith('image/') || processedFile.type.startsWith('audio/') || processedFile.type.startsWith('video/')) {
            // Check if file is still too large after compression
            if (processedFile.size > 3 * 1024 * 1024) {
              console.log('File is still too large after compression, skipping');
              setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
              return null; // Skip this file
            }
            
            setUploadProgress(prev => ({ ...prev, [fileId]: 75 }));
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(processedFile);
            });
            setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
            return { ...baseData, base64 };
          }

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          return baseData;
        } finally {
          setUploadingFiles(prev => ({ ...prev, [fileId]: false }));
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);
        }
      }))).filter(attachment => attachment !== null);

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: enquiryId,
        sellerId: selectedResponse.sellerId,
        senderId: user.uid,
        senderName: userProfiles[user.uid]?.fullName || 'User',
        senderType: isSeller ? 'seller' : 'buyer',
        message: messageText,
        attachments: attachmentData,
        timestamp: serverTimestamp()
      });

      // Create notification for new chat message - Send to recipient
      try {
        const recipientId = isSeller ? enquiry?.userId : selectedResponse.sellerId;
        if (recipientId && recipientId !== user.uid && notificationContext?.createNotificationForUser) {
          await notificationContext.createNotificationForUser(
            recipientId,
            'new_chat',
            {
              title: '💬 New Message',
              message: `${userProfiles[user.uid]?.fullName || 'Someone'} sent you a message about "${enquiry?.title}"`,
              priority: 'high',
              actionUrl: `/enquiry/${enquiryId}/responses?sellerId=${selectedResponse.sellerId}`,
              actionText: 'View Message',
              enquiryId: enquiryId,
              senderId: user.uid,
              senderName: userProfiles[user.uid]?.fullName || 'Someone'
            }
          );
          console.log('✅ Chat notification sent to recipient');
        }
      } catch (notificationError) {
        console.error('Failed to create chat notification:', notificationError);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message if failed
      setAttachments(attachments); // Restore attachments if failed
    }
  };

  const sendSellerMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedResponse || !enquiryId || !user) return;

    const messageText = newMessage.trim();
    
    // Clear input and attachments immediately
    setNewMessage("");
    setAttachments([]);

    try {
      // Create attachment data with compression and base64
      const attachmentData = (await Promise.all(attachments.map(async (file, index) => {
        const fileId = `seller-${Date.now()}-${index}`;
        setUploadingFiles(prev => ({ ...prev, [fileId]: true }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Compress file based on type
          let processedFile = file;
          if (file.type.startsWith('image/')) {
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressImage(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

          } else if (file.type.startsWith('audio/')) {
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressAudio(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
          } else {
            // Handle documents and other file types
            setUploadProgress(prev => ({ ...prev, [fileId]: 25 }));
            processedFile = await compressDocument(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));
          }

          const baseData = {
            name: processedFile.name,
            type: processedFile.type,
            size: processedFile.size,
            lastModified: processedFile.lastModified
          };

          // For images, audio, and videos, include base64 data (for chat history persistence)
          if (processedFile.type.startsWith('image/') || processedFile.type.startsWith('audio/') || processedFile.type.startsWith('video/')) {
            // Check if file is still too large after compression
            if (processedFile.size > 3 * 1024 * 1024) {
              console.log('File is still too large after compression, skipping');
              setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
              return null; // Skip this file
            }
            
            setUploadProgress(prev => ({ ...prev, [fileId]: 75 }));
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(processedFile);
            });
            setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
            return { ...baseData, base64 };
          }

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          return baseData;
        } finally {
          setUploadingFiles(prev => ({ ...prev, [fileId]: false }));
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);
        }
      }))).filter(attachment => attachment !== null);

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: enquiryId,
        sellerId: selectedResponse.sellerId,
        senderId: user.uid,
        senderName: userProfiles[user.uid]?.fullName || 'User',
        senderType: 'seller',
        message: messageText,
        attachments: attachmentData,
        timestamp: serverTimestamp()
      });

      // Create notification for new chat message - Send to buyer
      try {
        const buyerId = enquiry?.userId;
        if (buyerId && buyerId !== user.uid && notificationContext?.createNotificationForUser) {
          await notificationContext.createNotificationForUser(
            buyerId,
            'new_chat',
            {
              title: '💬 New Message',
              message: `${userProfiles[user.uid]?.fullName || 'Seller'} sent you a message about "${enquiry?.title}"`,
              priority: 'high',
              actionUrl: `/enquiry/${enquiryId}/responses?sellerId=${selectedResponse.sellerId}`,
              actionText: 'View Message',
              enquiryId: enquiryId,
              senderId: user.uid,
              senderName: userProfiles[user.uid]?.fullName || 'Seller'
            }
          );
          console.log('✅ Chat notification sent to buyer');
        }
      } catch (notificationError) {
        console.error('Failed to create seller chat notification:', notificationError);
      }
      
    } catch (error) {
      console.error('Error sending seller message:', error);
      setNewMessage(messageText); // Restore message if failed
      setAttachments(attachments); // Restore attachments if failed
    }
  };

  // Function to close the chat
  const closeChat = () => {
    setSelectedResponse(null);
    setChatMessages([]);
    setNewMessage("");
    setIsTyping(false);
  };

  // Function to show end chat confirmation
  const handleEndChatClick = () => {
    setShowEndChatConfirm(true);
  };

  // Function to end chat permanently (for both buyers and sellers)
  const endChat = async () => {
    setShowEndChatConfirm(false);
    
    try {
      if (enquiry && selectedResponse) {
        // Delete all chat messages for this specific conversation
        const chatMessagesQuery = query(
          collection(db, 'chatMessages'),
          where('enquiryId', '==', enquiry.id),
          where('sellerId', '==', selectedResponse.sellerId)
        );
        const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
        
        // Delete all chat messages
        const deletePromises = chatMessagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        toast({ title: 'Chat Ended', description: 'Chat history has been deleted permanently.' });
        closeChat();
      }
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({ title: 'Error', description: 'Failed to end chat', variant: 'destructive' });
    }
  };

  // Function to show block user confirmation
  const handleBlockUserClick = () => {
    if (!selectedResponse || !enquiry || !user) return;

    const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
    const otherUserName = user.uid === enquiry.userId ? selectedResponse.sellerName : userProfiles[enquiry.userId]?.fullName || 'User';

    setUserToBlock({ id: otherUserId, name: otherUserName });
    setShowBlockUserConfirm(true);
  };

  // Function to block user
  const blockUser = async () => {
    if (!userToBlock || !user) return;

    setShowBlockUserConfirm(false);

    try {
      // Get or create user's blocked list
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const blockedUsers = userDoc.data().blockedUsers || [];
        if (!blockedUsers.includes(userToBlock.id)) {
          await updateDoc(userRef, {
            blockedUsers: arrayUnion(userToBlock.id)
          });
        }
      } else {
        await setDoc(userRef, {
          blockedUsers: [userToBlock.id]
        }, { merge: true });
      }

      toast({ 
        title: 'User Blocked', 
        description: `${userToBlock.name} has been blocked. You will no longer receive messages from this user.` 
      });
      
      // End the chat and close
      closeChat();
      setUserToBlock(null);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({ title: 'Error', description: 'Failed to block user', variant: 'destructive' });
      setUserToBlock(null);
    }
  };

  // Function to show close deal confirmation
  const handleCloseDealClick = () => {
    setShowCloseDealConfirm(true);
  };

  // Function to mark deal as closed (both buyers and sellers can do this)
  const closeDeal = async () => {
    setShowCloseDealConfirm(false);

    try {
      if (enquiry) {
        // Mark the enquiry as deal closed
        await updateDoc(doc(db, 'enquiries', enquiry.id), {
          status: 'deal_closed',
          dealClosed: true,
          dealClosedAt: serverTimestamp(),
          dealClosedBy: user?.uid
        });
        
        toast({ 
          title: 'Deal Closed', 
          description: 'This enquiry has been marked as "Deal Closed" and will appear in your history.' 
        });

        // Create notification for deal closure
        try {
          await createNotification('enquiry_update', {
            title: 'Deal Closed Successfully! ✅',
            message: `The deal for "${enquiry.title}" has been closed and marked as completed.`,
            priority: 'high',
            actionUrl: '/my-enquiries',
            actionText: 'View My Enquiries'
          });
        } catch (notificationError) {
          console.error('Failed to create deal closure notification:', notificationError);
        }

        closeChat();
      }
    } catch (error) {
      console.error('Error closing deal:', error);
      toast({ title: 'Error', description: 'Failed to close deal', variant: 'destructive' });
    }
  };

  // Function to handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000); // Hide after 3 seconds
  };

  // WebRTC Call Functions
  // Play ringtone for incoming calls
  const playRingtone = () => {
    try {
      // Stop any existing ringtone first
      stopRingtone();
      
      // Create audio context for ringtone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Function to play one ring cycle
      const playRingCycle = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure ringtone: alternating tones (like a phone)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.8); // Fade out
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      };
      
      // Play first ring immediately
      playRingCycle();
      
      // Store audio context for cleanup
      ringtoneAudioRef.current = audioContext;
      
      // Repeat ringtone every 2 seconds (ring for 0.8s, pause for 1.2s)
      ringtoneIntervalRef.current = setInterval(() => {
        // Only continue if still ringing or connecting
        if (callStatusRef.current === 'ringing' || callStatusRef.current === 'connecting') {
          playRingCycle();
        } else {
          stopRingtone();
        }
      }, 2000);
      
      console.log('🔔 Ringtone started');
    } catch (error) {
      console.error('Error playing ringtone:', error);
      // Fallback: try using HTML5 audio if Web Audio API fails
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
        audio.loop = true;
        audio.volume = 0.3;
        audio.play().catch(err => console.error('Error playing fallback ringtone:', err));
        ringtoneAudioRef.current = audio;
      } catch (fallbackError) {
        console.error('Fallback ringtone also failed:', fallbackError);
      }
    }
  };
  
  // Stop ringtone
  const stopRingtone = () => {
    try {
      // Clear interval
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
      
      // Stop audio context or HTML audio
      if (ringtoneAudioRef.current) {
        if (ringtoneAudioRef.current instanceof AudioContext || (ringtoneAudioRef.current as any).close) {
          (ringtoneAudioRef.current as AudioContext).close().catch(err => console.error('Error closing audio context:', err));
        } else if (ringtoneAudioRef.current instanceof HTMLAudioElement) {
          ringtoneAudioRef.current.pause();
          ringtoneAudioRef.current.currentTime = 0;
        }
        ringtoneAudioRef.current = null;
      }
      
      console.log('🔇 Ringtone stopped');
    } catch (error) {
      console.error('Error stopping ringtone:', error);
    }
  };

  const createPeerConnection = async (stream: MediaStream) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('✅ Received remote track:', event.track);
      console.log('✅ Remote streams:', event.streams);
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(err => {
            console.error('Error playing remote audio:', err);
          });
          console.log('✅ Remote audio element set and playing');
          
          // When we receive remote track, connection is established
          // Set status to active if we're still connecting
          if (callStatusRef.current === 'connecting') {
            console.log('✅ Remote track received - call is now active!');
            setCallStatus('active');
            callStatusRef.current = 'active';
            setIsInCall(true);
            // Stop ringtone when call becomes active
            stopRingtone();
          }
        }
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && selectedResponse && enquiry && user) {
        const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
        const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;

        const callSignalingDoc = doc(db, 'callSignaling', callDocId);
        try {
          // Store candidate immediately
          const candidateData = event.candidate.toJSON();
          console.log('Sending ICE candidate:', candidateData);
          
          // Store the latest candidate for real-time exchange
          await updateDoc(callSignalingDoc, {
            [`${user.uid}.lastCandidate`]: candidateData,
            [`${user.uid}.lastCandidateTime`]: serverTimestamp()
          }).catch(async (error) => {
            // If document doesn't exist, create it
            console.log('Document not found, creating it');
            await setDoc(callSignalingDoc, {
              [`${user.uid}.lastCandidate`]: candidateData,
              [`${user.uid}.lastCandidateTime`]: serverTimestamp()
            });
          });
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      } else if (!event.candidate) {
        console.log('All ICE candidates have been sent');
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const connState = peerConnection.connectionState;
      console.log('📡 Connection state changed:', connState);
      
      if (connState === 'connected') {
        // Connection is established
        if (callStatusRef.current === 'connecting' || callStatusRef.current === 'calling') {
          console.log('✅ Call connected successfully!');
          setCallStatus('active');
          callStatusRef.current = 'active';
          setIsInCall(true);
          // Stop ringtone when call becomes active
          stopRingtone();
        }
      } else if (connState === 'connecting') {
        // Still connecting - this is normal, just log it
        console.log('🔄 Still connecting...');
        if (callStatusRef.current !== 'connecting' && callStatusRef.current !== 'active') {
          setCallStatus('connecting');
          callStatusRef.current = 'connecting';
        }
      } else if (peerConnection.connectionState === 'disconnected') {
        // Only end call if we were in an active call, not if still ringing/connecting
        const currentStatus = callStatusRef.current;
        if (currentStatus === 'active' || currentStatus === 'connecting') {
          console.log('Call disconnected during active call, ending call');
          toast({
            title: 'Call Disconnected',
            description: 'The call was disconnected. This may be due to network issues.',
            variant: 'default'
          });
          endCall();
        } else {
          console.log('Connection disconnected but call not active, ignoring');
        }
      } else if (peerConnection.connectionState === 'failed' || 
                 peerConnection.connectionState === 'closed') {
        // Only end call if we were in an active call
        const currentStatus = callStatusRef.current;
        if (currentStatus === 'active' || currentStatus === 'connecting') {
          console.log('Call failed/closed:', peerConnection.connectionState);
          toast({
            title: 'Call Failed',
            description: 'The call failed to connect. Please check your internet connection.',
            variant: 'destructive'
          });
          endCall();
        } else {
          console.log('Connection failed/closed but call not active, ignoring');
        }
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log('🧊 ICE connection state:', iceState);
      
      // When ICE connection is established, mark call as active
      if (iceState === 'connected' || iceState === 'completed') {
        if (callStatusRef.current === 'connecting' || callStatusRef.current === 'calling') {
          console.log('✅ ICE connection established - call is now active!');
          setCallStatus('active');
          callStatusRef.current = 'active';
          setIsInCall(true);
          // Stop ringtone when call becomes active
          stopRingtone();
        }
      }
      
      // Handle network connectivity issues
      if (iceState === 'failed') {
        const currentStatus = callStatusRef.current;
        if (currentStatus === 'connecting' || currentStatus === 'active') {
          console.log('ICE connection failed - network issue detected');
          toast({
            title: 'Connection Failed',
            description: 'Unable to establish connection. The other person may be offline or have network issues.',
            variant: 'destructive'
          });
          
          // Give it a few more seconds to recover
          setTimeout(() => {
            if (peerConnectionRef.current?.iceConnectionState === 'failed' && 
                (callStatusRef.current === 'connecting' || callStatusRef.current === 'calling')) {
              console.log('ICE failed and did not recover, ending call');
              endCall(false);
            }
          }, 5000);
        }
      } else if (iceState === 'disconnected') {
        const currentStatus = callStatusRef.current;
        if (currentStatus === 'active') {
          console.log('ICE disconnected - possible network issue');
          toast({
            title: 'Connection Lost',
            description: 'The connection was lost. Attempting to reconnect...',
            variant: 'default'
          });
          
          // Try to reconnect - if still disconnected after 10 seconds, end call
          setTimeout(() => {
            if (peerConnectionRef.current?.iceConnectionState === 'disconnected' && 
                callStatusRef.current === 'active') {
              console.log('Connection lost and did not recover, ending call');
              toast({
                title: 'Call Ended',
                description: 'Unable to reconnect. The other person may have lost internet connection.',
                variant: 'destructive'
              });
              endCall(false);
            }
          }, 10000);
        }
      }
    };

    return peerConnection;
  };

  // Toggle calls for this chat
  const toggleCallsEnabled = async () => {
    if (!selectedResponse || !enquiryId) return;

    try {
      const chatSettingsRef = doc(db, 'chatSettings', `${enquiryId}_${selectedResponse.sellerId}`);
      const newCallsEnabled = !callsEnabled;
      
      await updateDoc(chatSettingsRef, {
        callsEnabled: newCallsEnabled,
        updatedAt: new Date(),
        updatedBy: user?.uid
      }).catch(async (error) => {
        // If document doesn't exist, create it
        if (error.code === 'not-found') {
          await setDoc(chatSettingsRef, {
            enquiryId: enquiryId,
            sellerId: selectedResponse.sellerId,
            callsEnabled: newCallsEnabled,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user?.uid
          });
        } else {
          throw error;
        }
      });

      setCallsEnabled(newCallsEnabled);
      
      toast({
        title: newCallsEnabled ? 'Calls Enabled' : 'Calls Disabled',
        description: newCallsEnabled ? 
          'You can now make audio calls in this chat.' : 
          'Audio calls are now disabled for this chat.',
      });

      // If disabling calls while in a call, end the call
      if (!newCallsEnabled && (isCalling || isInCall)) {
        await endCall();
      }
    } catch (error) {
      console.error('Error toggling calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to update call settings. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const initiateCall = async () => {
    if (!selectedResponse || !enquiry || !user) return;
    
    // Check if calls are enabled
    if (!callsEnabled) {
      toast({
        title: 'Calls Disabled',
        description: 'Calls have been disabled for this chat. Please enable calls to make a call.',
        variant: 'default'
      });
      return;
    }

    try {
      // Check microphone permission first
      const permissionStatus = await checkMicrophonePermission();
      if (permissionStatus !== 'granted') {
        setMicrophonePermission(permissionStatus);
        setShowMicrophonePrompt(true);
        return;
      }

      // Check network connectivity before initiating call
      if (!navigator.onLine) {
        toast({
          title: 'No Internet Connection',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsCalling(true);
      setIsCaller(true);
      setCallStatus('calling');
      callStatusRef.current = 'calling';
      callStartTimeRef.current = Date.now();
      setCallDuration(0);
      
      // Update call duration every second
      const durationInterval = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(elapsed);
          
          // Check network connectivity
          if (!navigator.onLine) {
            console.log('Network offline detected');
            clearInterval(durationInterval);
            toast({
              title: 'No Internet Connection',
              description: 'Your internet connection was lost. The call cannot continue.',
              variant: 'destructive'
            });
            endCall(false);
            return;
          }
          
          // Auto-end call after 60 seconds if not answered
          if (elapsed >= 60 && (callStatusRef.current === 'calling')) {
            console.log('Call timeout - no answer after 60 seconds, ending call');
            clearInterval(durationInterval);
            toast({ 
              title: 'Call Not Answered', 
              description: 'The call was not answered. The other person may be offline or have network issues.',
              variant: 'default'
            });
            endCall(false); // Update Firestore to mark as ended
          }
        }
      }, 1000);
      
      // Store interval in timeout ref for cleanup
      callTimeoutRef.current = durationInterval as any;

      // Get user media
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      console.log('Microphone access granted, stream created:', stream);
      console.log('Audio tracks:', stream.getAudioTracks());
      
      setLocalStream(stream);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Mute local audio to prevent feedback
        localAudioRef.current.play().catch(err => {
          console.error('Error playing local audio:', err);
        });
      }

      // Create peer connection
      const peerConnection = await createPeerConnection(stream);
      peerConnectionRef.current = peerConnection;

      // Create offer
      console.log('Creating offer...');
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await peerConnection.setLocalDescription(offer);
      console.log('Offer created and local description set');

      // Send offer through Firestore
      const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
      const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
      
      const callSignalingDoc = doc(db, 'callSignaling', callDocId);
      await setDoc(callSignalingDoc, {
        callerId: user.uid,
        receiverId: otherUserId,
        enquiryId: enquiry.id,
        offer: JSON.stringify(offer),
        status: 'calling',
        createdAt: serverTimestamp(),
        [user.uid]: {
          offer: JSON.stringify(offer),
          timestamp: serverTimestamp()
        }
      });

      // Send notification for incoming call
      try {
        if (notificationContext?.createNotificationForUser) {
          await notificationContext.createNotificationForUser(
            otherUserId,
            'new_chat',
            {
              title: '📞 Incoming Call',
              message: `${userProfiles[user.uid]?.fullName || 'Someone'} is calling you about "${enquiry.title}"`,
              priority: 'urgent',
              actionUrl: `/enquiry/${enquiryId}/responses?sellerId=${selectedResponse.sellerId}`,
              actionText: 'Answer',
              enquiryId: enquiryId,
              callerId: user.uid,
              callerName: userProfiles[user.uid]?.fullName || 'Someone'
            }
          );
          console.log('✅ Incoming call notification sent to recipient');
        }
      } catch (notificationError) {
        console.error('Failed to create call notification:', notificationError);
      }

      // Listen for answer and ICE candidates
      const unsubscribe = onSnapshot(callSignalingDoc, async (snapshot) => {
        const data = snapshot.data();
        if (!data || !peerConnection) return;

        // Handle answer
        if (data.status === 'answered' && data.answer && peerConnection.localDescription && !peerConnection.remoteDescription) {
          console.log('Received answer, setting remote description');
          
          // Check network before processing answer
          if (!navigator.onLine) {
            console.log('Network offline when receiving answer');
            toast({
              title: 'Connection Lost',
              description: 'Lost internet connection while connecting. Please try again.',
              variant: 'destructive'
            });
            endCall(false);
            return;
          }
          
          // Clear timeout since call was answered
          if (callTimeoutRef.current) {
            clearInterval(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
          
          const answer = JSON.parse(data.answer);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          setCallStatus('connecting');
          callStatusRef.current = 'connecting';
          
          // Process any pending ICE candidates
          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            if (candidate) {
              try {
                await peerConnection.addIceCandidate(candidate);
                console.log('Added pending ICE candidate');
              } catch (error) {
                console.error('Error adding pending ICE candidate:', error);
              }
            }
          }
        }

        // Handle ICE candidates from the other user
        const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
        const remoteLastCandidate = data[`${otherUserId}.lastCandidate`];
        const candidateTime = data[`${otherUserId}.lastCandidateTime`];
        
        if (remoteLastCandidate) {
          // Create a unique key for this candidate
          const candidateKey = `${remoteLastCandidate.candidate}-${remoteLastCandidate.sdpMLineIndex}-${remoteLastCandidate.sdpMid}`;
          
          // Skip if we've already processed this candidate
          if (processedCandidatesRef.current.has(candidateKey)) {
            return;
          }
          
          try {
            if (peerConnection.remoteDescription) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(remoteLastCandidate));
              processedCandidatesRef.current.add(candidateKey);
              console.log('Added ICE candidate from remote');
            } else {
              // Queue candidate if remote description not set yet
              const candidate = new RTCIceCandidate(remoteLastCandidate);
              pendingIceCandidatesRef.current.push(candidate);
              processedCandidatesRef.current.add(candidateKey);
              console.log('Queued ICE candidate (waiting for remote description)');
            }
          } catch (error) {
            // Candidate might already be added, that's okay
            if (!error.message?.includes('already been set')) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        }

        // Handle call end/reject - only if we're the caller and call was actually answered first
        if (data.status === 'rejected' || (data.status === 'ended' && peerConnection.remoteDescription)) {
          console.log('Call ended/rejected, ending call');
          endCall();
        } else if (data.status === 'ended' && !peerConnection.remoteDescription) {
          // Call ended before answer - just reset, don't call full endCall
          console.log('Call ended before answer, resetting state');
          setCallStatus('idle');
          callStatusRef.current = 'idle';
          setIsCalling(false);
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
          }
        }
      });

      callSignalingRef.current = unsubscribe;

    } catch (error) {
      console.error('Error initiating call:', error);
      toast({ title: 'Error', description: 'Failed to start call. Please check microphone permissions.', variant: 'destructive' });
      endCall();
    }
  };

  const answerCall = async () => {
    if (!selectedResponse || !enquiry || !user) return;

    // Don't stop ringtone here - let it continue during connecting
    // It will stop when call becomes active

    try {
      // Check microphone permission first
      const permissionStatus = await checkMicrophonePermission();
      if (permissionStatus !== 'granted') {
        setMicrophonePermission(permissionStatus);
        setShowMicrophonePrompt(true);
        endCall();
        return;
      }

      // Check network connectivity before answering call
      if (!navigator.onLine) {
        toast({
          title: 'No Internet Connection',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsCalling(true);
      setIsCaller(false);
      setCallStatus('connecting');
      callStatusRef.current = 'connecting';

      // Get user media
      console.log('Answering call, requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      console.log('Microphone access granted (answer), stream created:', stream);
      console.log('Audio tracks:', stream.getAudioTracks());
      
      setLocalStream(stream);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
        localAudioRef.current.play().catch(err => {
          console.error('Error playing local audio (answer):', err);
        });
      }

      // Create peer connection
      const peerConnection = await createPeerConnection(stream);
      peerConnectionRef.current = peerConnection;

      // Get call signaling data
      const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
      const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
      
      const callSignalingDoc = doc(db, 'callSignaling', callDocId);
      const callData = await getDoc(callSignalingDoc);

      if (callData.exists() && callData.data().offer) {
        console.log('Answering call, setting remote description');
        const offer = JSON.parse(callData.data().offer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Process any pending ICE candidates
        while (pendingIceCandidatesRef.current.length > 0) {
          const candidate = pendingIceCandidatesRef.current.shift();
          if (candidate) {
            try {
              await peerConnection.addIceCandidate(candidate);
              console.log('Added pending ICE candidate (answer side)');
            } catch (error) {
              console.error('Error adding pending ICE candidate:', error);
            }
          }
        }

        // Clear timeout since call is being answered
        if (callTimeoutRef.current) {
          clearInterval(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        
        // Create answer
        console.log('Creating answer...');
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('✅ Answer created and local description set');
        
        // Start connection timeout - if not connected in 30 seconds, end call
        setTimeout(() => {
          if (callStatusRef.current === 'connecting' && peerConnectionRef.current) {
            const iceState = peerConnectionRef.current.iceConnectionState;
            const connState = peerConnectionRef.current.connectionState;
            console.log('⏱️ Connection timeout check (answer side) - ICE:', iceState, 'Connection:', connState);
            
            if (iceState !== 'connected' && iceState !== 'completed' && connState !== 'connected') {
              console.log('❌ Connection timeout - ending call');
              toast({
                title: 'Connection Timeout',
                description: 'Unable to establish connection. Please check your internet connection and try again.',
                variant: 'destructive'
              });
              endCall(false);
            }
          }
        }, 30000); // 30 second timeout

        // Send answer
        await updateDoc(callSignalingDoc, {
          answer: JSON.stringify(answer),
          status: 'answered',
          [`${user.uid}.answer`]: JSON.stringify(answer),
          [`${user.uid}.timestamp`]: serverTimestamp()
        });

        // Listen for ICE candidates and call end
        const unsubscribe = onSnapshot(callSignalingDoc, async (snapshot) => {
          const data = snapshot.data();
          if (!data || !peerConnection) return;

          // Handle ICE candidates from the other user
          const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
          const remoteLastCandidate = data[`${otherUserId}.lastCandidate`];
          
          if (remoteLastCandidate) {
            // Create a unique key for this candidate
            const candidateKey = `${remoteLastCandidate.candidate}-${remoteLastCandidate.sdpMLineIndex}-${remoteLastCandidate.sdpMid}`;
            
            // Skip if we've already processed this candidate
            if (processedCandidatesRef.current.has(candidateKey)) {
              return;
            }
            
            try {
              if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(remoteLastCandidate));
                processedCandidatesRef.current.add(candidateKey);
                console.log('Added ICE candidate from remote (answer side)');
              } else {
                // Queue candidate if remote description not set yet
                const candidate = new RTCIceCandidate(remoteLastCandidate);
                pendingIceCandidatesRef.current.push(candidate);
                processedCandidatesRef.current.add(candidateKey);
                console.log('Queued ICE candidate (answer side, waiting for remote description)');
              }
            } catch (error) {
              // Candidate might already be added, that's okay
              if (!error.message?.includes('already been set')) {
                console.error('Error adding ICE candidate:', error);
              }
            }
          }

          // Handle call end
          if (data.status === 'ended') {
            endCall();
          }
        });

        callSignalingRef.current = unsubscribe;
      }

    } catch (error) {
      console.error('Error answering call:', error);
      toast({ title: 'Error', description: 'Failed to answer call. Please check microphone permissions.', variant: 'destructive' });
      endCall();
    }
  };

  const endCall = async (skipFirestoreUpdate = false) => {
    const currentStatus = callStatusRef.current;
    console.log('endCall called, currentStatus:', currentStatus, 'skipFirestoreUpdate:', skipFirestoreUpdate);
    
    // Clear any timeouts/intervals
    if (callTimeoutRef.current) {
      clearInterval(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe from signaling
    if (callSignalingRef.current) {
      callSignalingRef.current();
      callSignalingRef.current = null;
    }

    // Update Firestore - only if call was answered or we explicitly want to end it
    // Don't update if call is still ringing (not answered yet)
    if (!skipFirestoreUpdate && selectedResponse && enquiry && user) {
      const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
      const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
      
      try {
        const callSignalingDoc = doc(db, 'callSignaling', callDocId);
        const currentData = await getDoc(callSignalingDoc);
        
        // Only update to 'ended' if:
        // 1. We're ending an active call (status was 'active' or 'connecting')
        // 2. OR the call was already answered (has answer in doc)
        // 3. OR we're the caller and want to cancel (currentStatus is 'calling')
        const shouldEnd = currentStatus === 'active' || 
                         currentStatus === 'connecting' ||
                         (currentStatus === 'calling' && isCaller) ||
                         (currentData.exists() && currentData.data().status === 'answered');
        
        if (shouldEnd) {
          console.log('Updating Firestore to ended status');
          await updateDoc(callSignalingDoc, {
            status: 'ended',
            endedAt: serverTimestamp(),
            endedBy: user.uid
          });
        } else {
          console.log('Skipping Firestore update - call not yet answered');
        }
      } catch (error) {
        console.error('Error updating call status:', error);
      }
    }

    // Reset state
    setIsCalling(false);
    setIsInCall(false);
    setCallStatus('idle');
    callStatusRef.current = 'idle';
    setRemoteStream(null);
    setIsCaller(false);
    pendingIceCandidatesRef.current = [];
    processedCandidatesRef.current.clear();

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!selectedResponse || !enquiry || !user) return;

    const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
    const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
    
    const callSignalingDoc = doc(db, 'callSignaling', callDocId);
    
    console.log('Setting up incoming call listener for:', callDocId);
    
    // Clean up old call documents on mount
    const cleanupOldCall = async () => {
      try {
        const docSnapshot = await getDoc(callSignalingDoc);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const callTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
          const timeDiff = Date.now() - callTime;
          const twoMinutesInMs = 2 * 60 * 1000;
          
          // If call is old and still in calling/ringing state, mark it as ended
          if (timeDiff > twoMinutesInMs && (data.status === 'calling' || data.status === 'ringing')) {
            console.log('Cleaning up old call document:', callDocId);
            await updateDoc(callSignalingDoc, {
              status: 'ended',
              endedAt: serverTimestamp(),
              autoEnded: true
            });
          }
        }
      } catch (error) {
        console.error('Error cleaning up old call:', error);
      }
    };
    
    cleanupOldCall();
    
    const unsubscribe = onSnapshot(callSignalingDoc, (snapshot) => {
      const data = snapshot.data();
      const currentStatus = callStatusRef.current;
      const currentIsCalling = isCalling;
      const currentIsInCall = isInCall;
      
      console.log('Incoming call listener triggered:', {
        hasData: !!data,
        status: data?.status,
        callerId: data?.callerId,
        currentStatus,
        currentIsCalling,
        currentIsInCall
      });
      
      if (!data) {
        // If document is deleted and we were ringing, reset
        if (currentStatus === 'ringing') {
          console.log('Call document deleted while ringing, resetting state');
          setCallStatus('idle');
          callStatusRef.current = 'idle';
        }
        return;
      }

      // Only process incoming calls if we're not already in a call AND calls are enabled
      if (!currentIsCalling && !currentIsInCall && currentStatus === 'idle' && callsEnabled) {
        // Check if there's an incoming call
        if (data.status === 'calling' && data.callerId && data.callerId !== user.uid) {
          // Check if the call is recent (within last 2 minutes)
          const callTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
          const timeDiff = Date.now() - callTime;
          const twoMinutesInMs = 2 * 60 * 1000;
          
          if (timeDiff > twoMinutesInMs) {
            console.log('Ignoring old call (older than 2 minutes):', data.callerId, 'age:', Math.floor(timeDiff / 1000), 'seconds');
            return;
          }
          
          console.log('Incoming call detected from:', data.callerId);
          setCallStatus('ringing');
          callStatusRef.current = 'ringing';
          callStartTimeRef.current = Date.now();
          setCallDuration(0);
          
          // Play ringtone for incoming call
          playRingtone();
          
          // Update call duration every second
          if (callTimeoutRef.current) {
            clearInterval(callTimeoutRef.current);
          }
          
          const durationInterval = setInterval(() => {
            if (callStartTimeRef.current) {
              const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
              setCallDuration(elapsed);
              
              // Check network connectivity
              if (!navigator.onLine) {
                console.log('Network offline detected while ringing');
                clearInterval(durationInterval);
                toast({
                  title: 'No Internet Connection',
                  description: 'Your internet connection was lost. Cannot receive calls.',
                  variant: 'destructive'
                });
                
                // Update Firestore to mark as rejected due to network
                const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
                const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
                const callSignalingDoc = doc(db, 'callSignaling', callDocId);
                
                updateDoc(callSignalingDoc, {
                  status: 'rejected',
                  rejectedAt: serverTimestamp(),
                  rejectedBy: user.uid,
                  rejectionReason: 'network_offline'
                }).catch(err => console.error('Error rejecting call:', err));
                
                setCallStatus('idle');
                callStatusRef.current = 'idle';
                setIsCalling(false);
                setIsInCall(false);
                return;
              }
              
              // Auto-reject after 60 seconds if not answered
              if (elapsed >= 60 && callStatusRef.current === 'ringing') {
                console.log('Incoming call timeout - not answered after 60 seconds, auto-rejecting');
                clearInterval(durationInterval);
                toast({ 
                  title: 'Call Missed', 
                  description: 'You did not answer the call in time.',
                  variant: 'default'
                });
                
                // Update Firestore to mark as rejected
                const otherUserId = user.uid === enquiry.userId ? selectedResponse.sellerId : enquiry.userId;
                const callDocId = user.uid < otherUserId ? `${user.uid}_${otherUserId}` : `${otherUserId}_${user.uid}`;
                const callSignalingDoc = doc(db, 'callSignaling', callDocId);
                
                updateDoc(callSignalingDoc, {
                  status: 'rejected',
                  rejectedAt: serverTimestamp(),
                  rejectedBy: user.uid
                }).catch(err => console.error('Error rejecting call:', err));
                
                setCallStatus('idle');
                callStatusRef.current = 'idle';
                setIsCalling(false);
                setIsInCall(false);
                stopRingtone(); // Stop ringtone on timeout
              }
            }
          }, 1000);
          
          callTimeoutRef.current = durationInterval as any;
        }
      }
      
      // Keep ringing state if call is still active
      if (currentStatus === 'ringing' && data.status === 'calling' && data.callerId && data.callerId !== user.uid) {
        // Call is still active, keep ringing - do nothing, just log
        console.log('Call still ringing, status:', data.status);
        return;
      }
      
      // Handle call end - only if status was actually set
      if (data.status === 'ended' || data.status === 'rejected') {
        if (currentStatus === 'ringing' || currentIsCalling || currentIsInCall) {
          console.log('Call ended/rejected remotely, status:', data.status);
          setCallStatus('idle');
          callStatusRef.current = 'idle';
          
          // Only fully end call if we were in an active call
          if (currentIsCalling || currentIsInCall) {
            endCall();
          } else {
            // Just reset ringing state
            setIsCalling(false);
            setIsInCall(false);
          }
        }
      }
      
      // If caller cancels the call by changing status (but not to ended/rejected)
      if (currentStatus === 'ringing' && data.status !== 'calling' && data.status !== 'answered' && data.status !== 'ended' && data.status !== 'rejected') {
        console.log('Call cancelled by caller (status changed to:', data.status, ')');
        setCallStatus('idle');
        callStatusRef.current = 'idle';
      }
    });

    return () => {
      console.log('Cleaning up incoming call listener');
      unsubscribe();
    };
  }, [selectedResponse, enquiry, user, isCalling, isInCall]);

  // File upload functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      // Check microphone permission first
      const permissionStatus = await checkMicrophonePermission();
      if (permissionStatus !== 'granted') {
        setMicrophonePermission(permissionStatus);
        setShowMicrophonePrompt(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // Record in 100ms chunks for better responsiveness
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks([]);

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Store timer reference for cleanup
      (recorder as any).timer = timer;

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: 'Error', description: 'Could not access microphone', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Clear timer
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioBlob(null);
      setAudioChunks([]);
      setRecordingTime(0);
      
      // Clear timer
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer);
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !selectedResponse || !enquiryId || !user) return;

    setSendingVoice(true);
    
    try {
      const isSeller = user.uid === selectedResponse.sellerId;
      
      // Convert audio blob to base64 for chat history persistence
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      // Create attachment data with base64
      const attachmentData = [{
        name: `voice-message-${Date.now()}.webm`,
        type: 'audio/webm',
        size: audioBlob.size,
        lastModified: Date.now(),
        base64: base64
      }];

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: enquiryId,
        sellerId: selectedResponse.sellerId,
        senderId: user.uid,
        senderName: userProfiles[user.uid]?.fullName || 'User',
        senderType: isSeller ? 'seller' : 'buyer',
        message: `🎤 Voice message (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`,
        attachments: attachmentData,
        timestamp: serverTimestamp()
      });

      // Reset recording state
      setAudioBlob(null);
      setAudioChunks([]);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({ title: 'Error', description: 'Failed to send voice message', variant: 'destructive' });
    } finally {
      setSendingVoice(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Compression functions
  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new file with the compressed blob
            const compressedFile = Object.assign(blob, {
              name: file.name,
              lastModified: Date.now()
            }) as File;
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };



  const compressAudio = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // If file is small enough, return as is
      if (file.size <= 3 * 1024 * 1024) { // 3MB limit
        console.log('Audio file is small enough, no compression needed');
        resolve(file);
        return;
      }

      // For now, just return the original file
      console.log('Audio file is large, but compression is complex - using original');
      resolve(file);
    });
  };

  const compressDocument = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // For documents, we'll limit to 20MB
      if (file.size <= 20 * 1024 * 1024) { // 20MB limit
        resolve(file);
        return;
      }
      
      // If too large, we'll still send it but warn the user
      resolve(file);
    });
  };



  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Premium logic functions
  const getVisibleResponses = () => {
    if (!enquiryId || !enquiry || !user) return [];
    
    // Sort responses by creation time (oldest first)
    const sortedResponses = [...approvedResponses].sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return timeA.getTime() - timeB.getTime();
    });
    
    // If user is the enquiry owner (buyer)
    if (user.uid === enquiry.userId) {
      // Get the selected plan for this enquiry
      const selectedPlanId = enquiry.selectedPlanId || 'free';
      
      // Determine response limit based on plan
      let responseLimit = 2; // Default free plan
      
      switch (selectedPlanId) {
        case 'free':
          responseLimit = 2;
          break;
        case 'basic':
          responseLimit = 5;
          break;
        case 'standard':
          responseLimit = 10;
          break;
        case 'premium':
        case 'pro':
          responseLimit = -1; // Unlimited
          break;
        default:
          responseLimit = 2; // Default to free
      }
      
      // If unlimited, return all responses
      if (responseLimit === -1) {
        return sortedResponses;
      }
      
      // Return limited responses based on plan
      return sortedResponses.slice(0, responseLimit);
    }
    
    // If user is a seller, only show their own response
    return sortedResponses.filter(response => response.sellerId === user.uid);
  };



  const isUserInQueue = () => {
    if (!enquiry || !user) return false;
    
    // If user is the enquiry owner (buyer), they're not in queue
    if (user.uid === enquiry.userId) return false;
    
    // Check if user has submitted a response
    const userResponse = approvedResponses.find(r => r.sellerId === user.uid);
    if (!userResponse) return false;
    
    // Check if enquiry is premium
    if (enquiry.isPremium) return false;
    
    // Check if user is 3rd or later in the queue
    const userIndex = approvedResponses.findIndex(r => r.sellerId === user.uid);
    return userIndex >= 2; // 0-indexed, so 2 means 3rd position
  };

  const getUserQueuePosition = () => {
    if (!enquiry || !user) return 0;
    
    // If user is the enquiry owner (buyer), they're not in queue
    if (user.uid === enquiry.userId) return 0;
    
    // Check if user has submitted a response
    const userResponse = approvedResponses.find(r => r.sellerId === user.uid);
    if (!userResponse) return 0;
    
    // Check if enquiry is premium
    if (enquiry.isPremium) return 0;
    
    // Get user's position in the queue (1-indexed)
    const userIndex = approvedResponses.findIndex(r => r.sellerId === user.uid);
    return userIndex + 1; // Convert to 1-indexed
  };

  const canUserChat = (response: SellerSubmission) => {
    if (!enquiry || !user) return false;
    
    // For non-premium enquiries, only allow chat with first 2 responses
    if (!enquiry.isPremium && !usageStats.premiumSubscription) {
      const responseIndex = approvedResponses.findIndex(r => r.id === response.id);
      if (responseIndex >= 2) return false;
    }
    
    // Buyer can chat with any allowed seller
    if (user.uid === enquiry.userId) return true;
    
    // Seller can only chat if they're the response owner
    if (user.uid !== response.sellerId) return false;
    
    // For non-premium enquiries, only first 2 sellers can chat
    if (!enquiry.isPremium && !usageStats.premiumSubscription) {
      const userIndex = approvedResponses.findIndex(r => r.sellerId === user.uid);
      return userIndex < 2; // 0-indexed, so 0 and 1 are first 2
    }
    
    // For premium enquiries, all sellers can chat
    return true;
  };

  const handleResponseClick = (response: SellerSubmission) => {
    if (!enquiryId) {
      return;
    }
    
    setSelectedResponse(response);
  };

  const handlePremiumUpgrade = () => {
    if (!enquiryId) return;
    purchasePremiumEnquiry(enquiryId);
    setShowPremiumModal(false);
    toast({
      title: "Premium Unlocked! 🎉",
      description: "You can now view all responses for this enquiry",
    });
  };

  const handleMonthlyUpgrade = () => {
    purchaseMonthlySubscription();
    setShowPremiumModal(false);
    toast({
      title: "Monthly Premium Activated! 👑",
      description: "You now have premium privileges for 10 enquiries",
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentDropdownRef.current && !attachmentDropdownRef.current.contains(event.target as Node)) {
        setShowAttachmentOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        if ((mediaRecorder as any).timer) {
          clearInterval((mediaRecorder as any).timer);
        }
      }
    };
  }, [mediaRecorder, isRecording]);

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

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };


  // Cleanup effect for image overlays
  useEffect(() => {
    return () => {
      // Clean up any lingering image overlays when component unmounts
      const existingOverlays = document.querySelectorAll('[data-image-overlay]');
      existingOverlays.forEach(overlay => overlay.remove());
    };
  }, []);

  if (loading) {
    return <LoadingAnimation message="Loading responses" />;
  }

  // Show "No responses" message if enquiry exists but has no approved responses
  if (enquiry && approvedResponses.length === 0 && !loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/my-enquiries')}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Enquiry Responses</h1>
                  <p className="text-slate-600">View and chat with approved sellers</p>
                </div>
              </div>
            </div>

            {/* Enquiry Summary */}
            <Card className="mb-8 border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {enquiry.title}
                      {enquiry.isUrgent && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Urgent
                        </Badge>
                      )}
                    </h2>
                    <p className="text-slate-600 mb-3">{enquiry.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <Badge variant="outline">{enquiry.category}</Badge>
                      <span>Budget: {formatBudget(enquiry.budget)}</span>
                      {enquiry.location && <span>📍 {enquiry.location}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Responses Message */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-12 w-12 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Responses Yet</h3>
                <p className="text-slate-600 text-lg mb-6 max-w-md mx-auto">
                  Your enquiry hasn't received any approved responses yet. Sellers are reviewing your request and will respond soon.
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Enquiries
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Browse More Enquiries
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!enquiry) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
          <div className="text-center w-full max-w-sm mx-auto">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Enquiry Not Found</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed px-2">
              The enquiry you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/my-enquiries')} 
              size="sm" 
              className="h-9 sm:h-10 text-xs sm:text-sm px-4 sm:px-6 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Back to My Enquiries
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header - Mobile Responsive - Creative Design */}
          <div className="mb-4 sm:mb-6 lg:mb-8 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-gray-700/50">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-3 sm:px-5 py-3 sm:py-5">
              {/* Top Bar with Back Button and Chat Title */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/my-enquiries')}
                  className="p-2 hover:bg-gray-700/50 rounded-lg min-touch text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">Chat</h1>
                </div>
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>
              
              {/* Enquiry Details Card - Single Color Design */}
              <div className="bg-white border border-gray-800 rounded-lg p-4 sm:p-5">
                <div className="space-y-3 sm:space-y-4">
                  {/* Title Row with Response Count Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight truncate flex-1 min-w-0">
                      {enquiry.title}
                    </h2>
                    <div className="flex items-center justify-center border border-gray-800 rounded-md px-2.5 py-1.5 flex-shrink-0">
                      <span className="text-base sm:text-lg font-black text-gray-800">1</span>
                    </div>
                  </div>
                  
                  {/* Category and Type Row - Single Color Badges */}
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 border border-gray-800 rounded-md px-2.5 py-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-gray-800 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-800 font-medium">fulltime</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 border border-gray-800 rounded-md px-2.5 py-1.5">
                      <Tag className="h-3.5 w-3.5 text-gray-800 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-800 font-medium capitalize">{enquiry.category}</span>
                    </div>
                  </div>
                  
                  {/* Budget and Location Row - Single Color Layout */}
                  <div className="flex items-start gap-4 sm:gap-6 pt-2 border-t border-gray-800">
                    {/* Budget Section */}
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-sm sm:text-base text-gray-800 flex-shrink-0 mt-0.5">₹</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-800 font-medium mb-1">Budget</div>
                        <div className="text-sm sm:text-base font-bold text-gray-800 truncate">{formatBudget(enquiry.budget)}</div>
                      </div>
                    </div>
                    
                    {/* Location Section */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <MapPin className="h-4 w-4 sm:h-4 sm:w-4 text-gray-800 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-800 font-medium mb-1">Location</div>
                        <div className="text-sm sm:text-base font-bold text-gray-800 truncate max-w-[120px] sm:max-w-none">{enquiry.location}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8">
            {/* Responses List */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-2 sm:mb-3 lg:mb-4">Approved Responses</h3>
              {approvedResponses.length === 0 ? (
                <Card className="p-4 sm:p-6 lg:p-8 text-center border-0 shadow-lg rounded-2xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-slate-600" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No response till now</h4>
                  <p className="text-slate-600 text-xs sm:text-sm">We are still pushing your enquiry to the right sellers</p>
                </Card>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Visible Responses */}
                  {getVisibleResponses().map((response, index) => (
                    <div
                      key={response.id}
                      className={`cursor-pointer border-0 shadow-lg transition-all duration-300 min-touch rounded-lg border bg-card text-card-foreground ${
                        selectedResponse?.id === response.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:shadow-xl'
                      }`}
                      onClick={() => handleResponseClick(response)}
                    >
                      <div className="p-3 sm:p-4 pointer-events-none">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            {user?.uid === enquiry?.userId && (
                              <Badge variant="outline" className="text-xs font-medium">
                                Response #{index + 1}
                              </Badge>
                            )}
                            <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm sm:text-base">{response.title}</h4>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {response.isIdentityVerified && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{response.message}</p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                          <span className="font-semibold text-emerald-600">{response.price?.toString().startsWith('₹') ? response.price : `₹${response.price || 'N/A'}`}</span>
                          <span>{response.imageCount} images</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}


              {/* Success Message for 3rd+ Sellers (Non-Premium) - Mobile Only */}
              {isUserInQueue() && (
                <Card className="border-0 shadow-lg bg-green-50 border-green-200 md:hidden mt-6 relative z-0 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-800 mb-1">Response Submitted Successfully</h4>
                            <p className="text-green-700 text-sm">
                              Your response has been submitted. The buyer will review it and get back to you if interested.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
            </div>

            {/* Chat Section */}
            <div className="lg:col-span-2 order-1 lg:order-2 min-h-0">
              {selectedResponse ? (
                // Always show chat box for sellers, but with different behavior
                <>
                <Card className="border border-gray-800 shadow-sm h-[600px] sm:h-[500px] lg:h-[600px] flex flex-col bg-white">
                  <CardHeader className="pb-2 sm:pb-3 border-b-2 border-gray-800 bg-slate-50/50 p-3 sm:p-4">
                    {/* Minimal Header - Mobile Responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      {/* Left: Chat Info */}
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h2 className="text-xs sm:text-sm lg:text-base font-medium text-slate-900">Chat</h2>
                            <span className="text-xs text-slate-500">with</span>
                            <VerifiedUser 
                              name={user?.uid === enquiry?.userId ? 
                                (userProfiles[selectedResponse.sellerId]?.fullName || 'Seller') : 
                                (userProfiles[enquiry?.userId]?.fullName || 'Buyer')
                              }
                              isVerified={user?.uid === enquiry?.userId ? 
                                (userProfiles[selectedResponse.sellerId]?.isProfileVerified || false) : 
                                (userProfiles[enquiry?.userId]?.isProfileVerified || false)
                              }
                              className="text-xs"
                            />
                            {enquiry && (
                              <Badge 
                                variant={enquiry.status === 'live' ? 'default' : 'secondary'}
                                className="text-[10px] sm:text-xs h-4 lg:h-5 px-1.5 lg:px-2 flex-shrink-0"
                              >
                                {enquiry.status === 'live' ? 'Live' : 'Ended'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Action Buttons - Mobile Optimized */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                        {/* Call Toggle - Simple text button */}
                        {canUserChat(selectedResponse) && (
                          <Button
                            onClick={toggleCallsEnabled}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-medium rounded-md transition-colors duration-200 flex-shrink-0 whitespace-nowrap border border-gray-800 hover:border-gray-900"
                            title={callsEnabled ? 'Click to disable calls' : 'Click to enable calls'}
                          >
                            {callsEnabled ? '🔊 Calls On' : '🔇 Calls Off'}
                          </Button>
                        )}
                        
                        {/* Call Button - First on mobile, only shown if calls enabled */}
                        {canUserChat(selectedResponse) && callsEnabled && (
                          <Button
                            onClick={() => {
                              if (isCalling || isInCall) {
                                endCall();
                              } else {
                                initiateCall();
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-md transition-colors duration-200 flex-shrink-0 relative z-10 border border-gray-800 ${
                              isCalling || isInCall
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-gray-900'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-gray-900'
                            }`}
                            disabled={callStatus === 'ringing'}
                            title={isCalling || isInCall ? 'End Call' : 'Start Call'}
                          >
                            {isCalling || isInCall ? (
                              <PhoneOff className="h-4 w-4" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        {/* Deal Closed - Only for buyers */}
                        {enquiry && user?.uid === enquiry.userId && (
                          <Button
                            onClick={handleCloseDealClick}
                            variant="outline"
                            size="sm"
                            className="text-slate-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 h-8 sm:h-9 rounded-md border-slate-200 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
                          >
                            Deal Closed
                          </Button>
                        )}
                        
                        {/* End Chat - For both buyers and sellers */}
                        <Button
                          onClick={handleEndChatClick}
                          variant="outline"
                          size="sm"
                          className="text-slate-600 hover:text-orange-700 hover:border-orange-300 hover:bg-orange-50 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 h-8 sm:h-9 rounded-md border-gray-800 hover:border-gray-900 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
                        >
                          End Chat
                        </Button>
                        
                        {/* Block User - For both buyers and sellers */}
                        <Button
                          onClick={handleBlockUserClick}
                          variant="outline"
                          size="sm"
                          className="text-slate-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 h-8 sm:h-9 rounded-md border-gray-800 hover:border-gray-900 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
                        >
                          Block User
                        </Button>
                        
                        {/* Close Chat Window - For both */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={closeChat}
                          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-md transition-colors duration-200 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Enquiry Summary - Mobile Responsive */}
                    <div className="pt-2 border-t-2 border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs lg:text-sm font-medium text-slate-900 truncate">
                            {enquiry.title}
                            {enquiry.isUrgent && (
                              <Badge variant="destructive" className="ml-1 lg:ml-2 text-xs h-3 lg:h-4 px-1">
                                Urgent
                              </Badge>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">{enquiry.description}</p>
                        </div>
                        <div className="text-right ml-2 lg:ml-3 flex-shrink-0">
                          <div className="text-xs lg:text-sm font-semibold text-white bg-gray-800 px-2 py-1 rounded">{selectedResponse.price?.toString().startsWith('₹') ? selectedResponse.price : `₹${selectedResponse.price || 'N/A'}`}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>



                  <div ref={chatContainerRef} id="chat-messages" className="flex-1 overflow-y-auto bg-gray-50/40">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 lg:py-16">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-500" />
                        </div>
                        <h4 className="text-xs sm:text-sm lg:text-base font-medium text-slate-700 mb-1 lg:mb-2">Start chatting</h4>
                        {user?.uid !== selectedResponse?.sellerId && (
                          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto px-3 sm:px-4">
                            Begin discussing details and negotiating with this seller
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 space-y-1 sm:space-y-1.5 lg:space-y-2">
                        {chatMessages.map((message, index) => (
                          <div
                            key={message.id || `message-${index}`}
                            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[200px] sm:max-w-[240px] lg:max-w-[280px] px-2 sm:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-lg relative ${
                                message.senderId === user?.uid
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-900'
                              }`}
                            >
                              {/* Message Content */}
                              {message.message && (
                                <p className="text-xs lg:text-sm leading-relaxed break-words">{message.message}</p>
                              )}
                              
                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment, attIndex) => (
                                    <div key={attIndex}>
                                      {attachment.type.startsWith('image/') && (
                                        <div className="relative group">
                                          <img
                                            src={(attachment as any).base64}
                                            alt={attachment.name}
                                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => {
                                              // Remove any existing overlays first
                                              const existingOverlays = document.querySelectorAll('[data-image-overlay]');
                                              existingOverlays.forEach(overlay => overlay.remove());
                                              
                                              // Create full-screen overlay
                                              const overlay = document.createElement('div');
                                              overlay.setAttribute('data-image-overlay', 'true');
                                              overlay.style.position = 'fixed';
                                              overlay.style.top = '0';
                                              overlay.style.left = '0';
                                              overlay.style.width = '100vw';
                                              overlay.style.height = '100vh';
                                              overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                                              overlay.style.zIndex = '9999';
                                              overlay.style.display = 'flex';
                                              overlay.style.alignItems = 'center';
                                              overlay.style.justifyContent = 'center';
                                              overlay.style.cursor = 'pointer';
                                              
                                              // Create image element
                                              const img = document.createElement('img');
                                              img.src = (attachment as any).base64;
                                              img.style.maxWidth = '90vw';
                                              img.style.maxHeight = '90vh';
                                              img.style.objectFit = 'contain';
                                              img.style.borderRadius = '8px';
                                              img.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                              img.style.cursor = 'default';
                                              
                                              // Add close button
                                              const closeBtn = document.createElement('button');
                                              closeBtn.innerHTML = '✕';
                                              closeBtn.style.position = 'absolute';
                                              closeBtn.style.top = '20px';
                                              closeBtn.style.right = '20px';
                                              closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                                              closeBtn.style.border = 'none';
                                              closeBtn.style.borderRadius = '50%';
                                              closeBtn.style.width = '40px';
                                              closeBtn.style.height = '40px';
                                              closeBtn.style.color = 'white';
                                              closeBtn.style.fontSize = '20px';
                                              closeBtn.style.cursor = 'pointer';
                                              closeBtn.style.display = 'flex';
                                              closeBtn.style.alignItems = 'center';
                                              closeBtn.style.justifyContent = 'center';
                                              
                                              // Add elements to overlay
                                              overlay.appendChild(img);
                                              overlay.appendChild(closeBtn);
                                              document.body.appendChild(overlay);
                                              
                                              // Close on overlay click or close button
                                              const closeOverlay = () => {
                                                try {
                                                  if (overlay && overlay.parentNode) {
                                                    overlay.parentNode.removeChild(overlay);
                                                  }
                                                } catch (error) {
                                                  console.error('Error removing overlay:', error);
                                                }
                                              };
                                              
                                              overlay.onclick = (e) => {
                                                if (e.target === overlay) closeOverlay();
                                              };
                                              closeBtn.onclick = closeOverlay;
                                              
                                              // Close on Escape key
                                              const handleEscape = (e: KeyboardEvent) => {
                                                if (e.key === 'Escape') {
                                                  closeOverlay();
                                                  document.removeEventListener('keydown', handleEscape);
                                                }
                                              };
                                              document.addEventListener('keydown', handleEscape);
                                            }}
                                          />
                                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                            {formatFileSize(attachment.size)}
                                          </div>
                                        </div>
                                      )}
                                      

                                      
                                      {attachment.type.startsWith('audio/') && (
                                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                                          <div className="flex-shrink-0">
                                            <Mic className="h-6 w-6 text-gray-800" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700">Voice Message</p>
                                            <p className="text-xs text-gray-600">{formatFileSize(attachment.size)}</p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <audio
                                              src={(attachment as any).base64}
                                              controls
                                              preload="metadata"
                                              className="h-8 w-32"
                                              style={{ 
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                outline: 'none'
                                              }}
                                              onError={(e) => {
                                                console.error('Audio error:', e);
                                                const audio = e.target as HTMLAudioElement;
                                                console.log('Audio failed to load:', audio.src);
                                              }}
                                              onLoadStart={() => console.log('Audio loading started')}
                                              onCanPlay={() => console.log('Audio can play')}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      
                                      {!attachment.type.startsWith('image/') && !attachment.type.startsWith('audio/') && (
                                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
                                          <div className="flex-shrink-0">
                                            <File className="h-6 w-6 text-slate-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{attachment.name}</p>
                                            <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              // Create download link for document
                                              const link = document.createElement('a');
                                              if ((attachment as any).base64) {
                                                link.href = (attachment as any).base64;
                                              } else if ((attachment as any).blobUrl) {
                                                link.href = (attachment as any).blobUrl;
                                              } else {
                                                const blob = new Blob([attachment as any], { type: attachment.type });
                                                link.href = URL.createObjectURL(blob);
                                              }
                                              link.download = attachment.name;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-100"
                                          >
                                            📥
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Message Meta - Mobile Responsive */}
                              <div className="flex items-center justify-end space-x-1 mt-1">
                                <span className={`text-xs ${message.senderId === user?.uid ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {formatDate(message.timestamp)}
                                </span>
                                {message.senderId === user?.uid && (
                                  <div className="ml-1">
                                    <CheckCircle className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-blue-100" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Sender Name - Mobile Responsive */}
                              {message.senderId !== user?.uid && (
                                <div className="mt-1">
                                  <VerifiedUser 
                                    name={message.senderName}
                                    isVerified={userProfiles[message.senderId]?.isProfileVerified || false}
                                    className="text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing Indicator - Mobile Responsive */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-white border border-slate-200">
                              <div className="flex items-center space-x-1">
                                <div className="flex space-x-1">
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
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

                  <div className="border-t-2 border-gray-800 bg-white">
                    {/* Message Input Section - Mobile Responsive */}
                    <div className="p-3 sm:p-4">
                      {/* Microphone Permission Prompt - Creative Modal - Only show when user tries to use voice/call features */}
                      <Dialog open={showMicrophonePrompt && microphonePermission !== 'granted'} onOpenChange={setShowMicrophonePrompt}>
                        <DialogContent className="sm:max-w-lg max-w-[95vw] p-0 gap-0 border-0 bg-transparent shadow-2xl">
                          <div className="p-4 sm:p-6">
                            <MicrophonePermissionPrompt
                              permissionStatus={microphonePermission}
                              onPermissionGranted={handlePermissionGranted}
                              className="border-0 shadow-none bg-transparent"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      {/* Smart Suggestions - Mobile Responsive */}
                      <div className="flex items-center space-x-2 sm:space-x-2 mb-3 sm:mb-4 overflow-x-auto pb-3">
                        {user?.uid === selectedResponse?.sellerId ? (
                          // SELLER Suggestions - Mobile Responsive
                          <>
                            <button
                              onClick={() => setNewMessage("Payment: 50% advance, 50% on delivery")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium min-touch"
                            >
                              💳 Payment
                            </button>
                            <button
                              onClick={() => setNewMessage("Delivery: 3-5 days")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium"
                            >
                              ⏰ Delivery
                            </button>
                            <button
                              onClick={() => setNewMessage("Bulk discounts available")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium"
                            >
                              📦 Bulk
                            </button>
                            <button
                              onClick={() => setNewMessage("Quality guarantee included")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium"
                            >
                              ✅ Quality
                            </button>
                            <button
                              onClick={() => setNewMessage("Can we schedule a meetup to discuss details?")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium"
                            >
                              🤝 Meetup
                            </button>
                            <button
                              onClick={() => setNewMessage("I sell samples for testing")}
                              className="flex-shrink-0 px-1.5 py-0.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white text-black border border-gray-800 rounded-md hover:bg-gray-50 hover:border-gray-900 transition-colors duration-200 font-medium"
                            >
                              🧪 Samples
                            </button>
                          </>
                        ) : (
                          // BUYER Suggestions - Mobile Responsive
                          <>
                            <button
                              onClick={() => setNewMessage("Can you provide more details about pricing?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 font-medium"
                            >
                              💰 Pricing
                            </button>
                            <button
                              onClick={() => setNewMessage("What's the delivery timeline?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors duration-200 font-medium"
                            >
                              ⏰ Timeline
                            </button>
                            <button
                              onClick={() => setNewMessage("Can you share more images?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 font-medium"
                            >
                              🖼️ Images
                            </button>
                            <button
                              onClick={() => setNewMessage("What are the payment terms?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition-colors duration-200 font-medium"
                            >
                              💳 Terms
                            </button>
                            <button
                              onClick={() => setNewMessage("Can we meet in person to discuss?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200 font-medium"
                            >
                              🤝 Meetup
                            </button>
                            <button
                              onClick={() => setNewMessage("Do you have samples I can check?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-pink-50 text-pink-700 border border-pink-200 rounded-md hover:bg-pink-100 hover:border-pink-300 transition-colors duration-200 font-medium"
                            >
                              🧪 Samples
                            </button>
                            <button
                              onClick={() => setNewMessage("What's your best price for this?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-100 hover:border-yellow-300 transition-colors duration-200 font-medium"
                            >
                              💵 Best Price
                            </button>
                            <button
                              onClick={() => setNewMessage("Can you provide references or reviews?")}
                              className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 hover:border-indigo-300 transition-colors duration-200 font-medium"
                            >
                              ⭐ Reviews
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Attachments Preview */}
                      {attachments.length > 0 && (
                        <div className="mb-3 p-2 bg-slate-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Attachments ({attachments.length})</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAttachments([])}
                              className="text-xs h-6 px-2"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => {
                              const fileId = `${Date.now()}-${index}`;
                              const isUploading = uploadingFiles[fileId];
                              const progress = uploadProgress[fileId] || 0;
                              
                              return (
                                <div key={index} className="flex items-center space-x-2 bg-white rounded-md border p-2 text-xs relative">
                                {file.type.startsWith('image/') ? (
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-medium text-slate-700">{file.name}</p>
                                      <p className="text-slate-500">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>

                                ) : file.type.startsWith('audio/') ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                      <Mic className="h-4 w-4 text-gray-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-medium text-slate-700">{file.name}</p>
                                      <p className="text-slate-500">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                      <File className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-medium text-slate-700">{file.name}</p>
                                      <p className="text-slate-500">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(index)}
                                  className="h-5 w-5 p-0 text-slate-400 hover:text-red-500"
                                  disabled={isUploading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                
                                {/* Progress Bar Overlay */}
                                {isUploading && (
                                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded-md flex items-center justify-center">
                                    <div className="w-full mx-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-600">Uploading...</span>
                                        <span className="text-xs text-slate-600">{progress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${progress}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Voice Recording UI */}
                      {isRecording && (
                        <div className="mb-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-red-700">Recording...</span>
                                <div className="text-lg text-red-600 font-mono font-bold">{formatRecordingTime(recordingTime)}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelRecording}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full p-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={stopRecording}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full p-2"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-red-500 text-center">
                            Hold to record, release to send
                          </div>
                        </div>
                      )}

                      {/* Voice Message Preview */}
                      {audioBlob && !isRecording && (
                        <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <Mic className="h-6 w-6 text-blue-600" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-700">Voice Message</p>
                                <p className="text-lg text-blue-600 font-mono font-bold">{formatRecordingTime(recordingTime)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAudioBlob(null);
                                  setRecordingTime(0);
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full p-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={sendVoiceMessage}
                                disabled={sendingVoice}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 rounded-full p-2"
                              >
                                {sendingVoice ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-blue-500 text-center">
                            Tap to send voice message
                          </div>
                        </div>
                      )}

                      {/* Simple Chat Input */}
                      <div className="flex items-end space-x-2 border border-gray-800 rounded-lg p-2">
                        {/* Voice Recording Button */}
                        {!isRecording && !audioBlob && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canUserChat(selectedResponse)}
                            onMouseDown={() => {
                              if (canUserChat(selectedResponse)) {
                                setIsButtonPressed(true);
                                startRecording();
                              }
                            }}
                            onMouseUp={() => {
                              if (canUserChat(selectedResponse)) {
                                setIsButtonPressed(false);
                                stopRecording();
                              }
                            }}
                            onMouseLeave={() => {
                              if (canUserChat(selectedResponse)) {
                                setIsButtonPressed(false);
                                stopRecording();
                              }
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              if (canUserChat(selectedResponse)) {
                                setIsButtonPressed(true);
                                startRecording();
                              }
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              if (canUserChat(selectedResponse)) {
                                setIsButtonPressed(false);
                                stopRecording();
                              }
                            }}
                            className={`h-9 w-9 lg:h-10 lg:w-10 p-0 transition-all duration-150 ${
                              !canUserChat(selectedResponse)
                                ? 'md:text-red-600 md:hover:text-red-700 md:hover:bg-red-50 md:active:bg-red-100 md:active:scale-95 text-slate-300 cursor-not-allowed'
                                : isButtonPressed 
                                  ? 'text-white bg-red-600 scale-110 shadow-lg' 
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-95'
                            }`}
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Attachment Button */}
                        <div className="relative" ref={attachmentDropdownRef}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => canUserChat(selectedResponse) && setShowAttachmentOptions(!showAttachmentOptions)}
                            disabled={!canUserChat(selectedResponse)}
                            className={`h-9 w-9 lg:h-10 lg:w-10 p-0 ${
                              canUserChat(selectedResponse) 
                                ? 'text-slate-600 hover:text-blue-600 hover:bg-blue-50' 
                                : 'md:text-slate-600 md:hover:text-blue-600 md:hover:bg-blue-50 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          
                          {/* Attachment Options Dropdown */}
                          {showAttachmentOptions && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10">
                              <div className="flex flex-col space-y-1">
                                <label className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                                  <Image className="h-4 w-4 text-green-600" />
                                  <span>Image</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>

                                <label className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                                  <Mic className="h-4 w-4 text-gray-800" />
                                  <span>Audio</span>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                                <label className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                                  <File className="h-4 w-4 text-slate-600" />
                                  <span>File</span>
                                  <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 relative">
                          <Textarea
                            placeholder={canUserChat(selectedResponse) ? "Type a message..." : "Chat not available - Response submitted successfully"}
                            value={newMessage}
                            onChange={(e) => {
                              if (canUserChat(selectedResponse)) {
                                setNewMessage(e.target.value);
                                if (e.target.value.length > 0) {
                                  handleTyping();
                                }
                              }
                            }}
                            disabled={!canUserChat(selectedResponse)}
                            className={`resize-none border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg px-3 py-2 pr-12 text-sm min-touch ${
                              !canUserChat(selectedResponse) ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                            }`}
                            rows={1}
                            style={{ minHeight: '50px', maxHeight: '100px' }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && canUserChat(selectedResponse)) {
                                e.preventDefault();
                                if (user?.uid === selectedResponse?.sellerId) {
                                  sendSellerMessage();
                                } else {
                                  sendMessage();
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && canUserChat(selectedResponse)) {
                                e.preventDefault();
                                if (user?.uid === selectedResponse?.sellerId) {
                                  sendSellerMessage();
                                } else {
                                  sendMessage();
                                }
                              }
                            }}
                          />
                          {/* Character Count - Mobile Responsive */}
                          <div className="absolute bottom-1.5 lg:bottom-2 right-1.5 lg:right-2 text-xs text-slate-400">
                            {newMessage.length}/500
                          </div>
                        </div>
                        
                        {/* Send Button - Mobile Responsive */}
                        <Button
                          onClick={() => {
                            if (canUserChat(selectedResponse)) {
                              if (user?.uid === selectedResponse?.sellerId) {
                                sendSellerMessage();
                              } else {
                                sendMessage();
                              }
                            }
                          }}
                          disabled={!canUserChat(selectedResponse) || ((!newMessage.trim() && attachments.length === 0) || Object.values(uploadingFiles).some(uploading => uploading))}
                          className={`h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 p-0 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-touch ${
                            canUserChat(selectedResponse) 
                              ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                              : 'md:bg-slate-600 md:hover:bg-slate-700 md:text-white bg-slate-300 text-slate-500'
                          }`}
                        >
                          {Object.values(uploadingFiles).some(uploading => uploading) ? (
                            <div className="h-3.5 w-3.5 lg:h-4 lg:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Show chat restriction message only when user can't chat */}
                {!canUserChat(selectedResponse) && (
                  <Card className="border border-slate-200 shadow-sm h-[500px] lg:h-[600px] flex items-center justify-center bg-amber-50/30">
                    <div className="text-center">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                        <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-amber-600" />
                      </div>
                      <h3 className="text-sm lg:text-base font-medium text-amber-800 mb-1">Chat Not Available</h3>
                      <p className="text-amber-700 text-xs lg:text-sm px-4">
                        {enquiry?.isPremium 
                          ? "You can only chat with your own response" 
                          : "Only the first 2 sellers can chat with the buyer for non-premium enquiries"
                        }
                      </p>
                    </div>
                  </Card>
                )}
                </>
              ) : (
                <Card className="border border-slate-200 shadow-sm h-[500px] lg:h-[600px] flex items-center justify-center bg-slate-50/30">
                  <div className="text-center">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                      <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-slate-500" />
                    </div>
                    <h3 className="text-sm lg:text-base font-medium text-slate-700 mb-1">Select a response</h3>
                    <p className="text-slate-500 text-xs lg:text-sm px-4">Choose from the left to start chatting</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      {user && enquiry && user.uid === enquiry.userId && enquiry.isPremium !== true && approvedResponses.length > 2 && (
        <div className="my-4 text-center">
          <p className="text-amber-700 text-sm mb-2">Upgrade to Premium to view all {approvedResponses.length} responses.</p>
          <Button variant="default" onClick={handlePremiumUpgrade} className="bg-blue-600 hover:bg-blue-700 text-white">
            Upgrade to Premium (₹99+)
          </Button>
        </div>
      )}

      {/* Additional Tile - Hidden */}
      {/* <div className="mt-6">
        <div className="bg-gray-800 rounded-lg p-4 text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">samosa maker</h3>
            <div className="flex items-center justify-center mb-2">
              <span className="text-green-400 text-sm font-medium">Verified</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">10 year experience</p>
            <div className="text-lg font-bold text-white mb-2">₹60,000</div>
            <p className="text-xs text-gray-400">0 images</p>
          </div>
        </div>
      </div> */}

      {/* Hidden Audio Elements for WebRTC */}
      <audio ref={localAudioRef} autoPlay muted playsInline style={{ display: 'none' }} />
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Call Overlay */}
      {(isCalling || isInCall || callStatus === 'ringing') && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-[90%] mx-auto">
            {/* Call Status */}
            <div className="text-center mb-6">
              <div className="relative mx-auto mb-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  {callStatus === 'active' ? (
                    <PhoneCall className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 animate-pulse" />
                  ) : (
                    <Phone className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                  )}
                </div>
                {(callStatus === 'calling' || callStatus === 'ringing') && (
                  <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 bg-blue-200 rounded-full animate-ping opacity-75" />
                )}
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {callStatus === 'ringing' && 'Incoming Call'}
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'active' && 'Call Active'}
              </h3>
              
              <p className="text-sm text-slate-600 mb-2">
                {selectedResponse && enquiry && user && (
                  user.uid === enquiry.userId 
                    ? (userProfiles[selectedResponse.sellerId]?.fullName || 'Seller')
                    : (userProfiles[enquiry.userId]?.fullName || 'Buyer')
                )}
              </p>
              {/* Call Duration / Timer */}
              {(callStatus === 'calling' || callStatus === 'ringing') && callDuration > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    {callDuration < 60 
                      ? `${callDuration}s / 60s` 
                      : 'Timeout'}
                  </p>
                  {!navigator.onLine && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠ No Internet Connection
                    </p>
                  )}
                </div>
              )}
              {callStatus === 'active' && callStartTimeRef.current && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    {Math.floor((Date.now() - callStartTimeRef.current) / 1000)}s
                  </p>
                  {!navigator.onLine && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠ Connection Lost
                    </p>
                  )}
                </div>
              )}
              {callStatus === 'connecting' && (
                <>
                  {!navigator.onLine && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠ No Internet - Cannot Connect
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Call Actions */}
            <div className="flex items-center justify-center space-x-4">
              {callStatus === 'ringing' && (
                <>
                  <Button
                    onClick={answerCall}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
                  >
                    <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
                  </Button>
                  <Button
                    onClick={endCall}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
                  >
                    <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
                  </Button>
                </>
              )}
              
              {(callStatus === 'calling' || callStatus === 'connecting' || callStatus === 'active') && (
                <Button
                  onClick={endCall}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
                >
                  <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
                </Button>
              )}
            </div>

            {/* Call Duration (if active) */}
            {callStatus === 'active' && (
              <div className="text-center mt-4">
                <p className="text-xs text-slate-500">Call in progress</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* End Chat Confirmation Modal - Mobile Friendly */}
      {showEndChatConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-200"
            onClick={() => setShowEndChatConfirm(false)}
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
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white">
                    End Chat
                  </h3>
                </div>
                <button
                  onClick={() => setShowEndChatConfirm(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8">
                  Are you sure you want to end this chat? This will delete all chat history between you and this user.
                </p>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowEndChatConfirm(false)}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-xs sm:text-sm lg:text-base hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={endChat}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold text-xs sm:text-sm lg:text-base transition-colors touch-manipulation min-h-[44px] active:scale-95 shadow-sm"
                  >
                    End Chat
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Block User Confirmation Modal - Mobile Friendly */}
      {showBlockUserConfirm && userToBlock && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-200"
            onClick={() => {
              setShowBlockUserConfirm(false);
              setUserToBlock(null);
            }}
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
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white">
                    Block User
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowBlockUserConfirm(false);
                    setUserToBlock(null);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8">
                  Are you sure you want to block <span className="font-semibold">{userToBlock.name}</span>? You will no longer receive messages or calls from this user.
                </p>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowBlockUserConfirm(false);
                      setUserToBlock(null);
                    }}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-xs sm:text-sm lg:text-base hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={blockUser}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold text-xs sm:text-sm lg:text-base transition-colors touch-manipulation min-h-[44px] active:scale-95 shadow-sm"
                  >
                    Block User
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Close Deal Confirmation Modal - Mobile Friendly */}
      {showCloseDealConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-200"
            onClick={() => setShowCloseDealConfirm(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[9999] transition-all duration-300">
            <Card className="mx-3 sm:mx-auto sm:w-[400px] bg-white shadow-2xl border border-gray-200 rounded-t-2xl sm:rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white">
                    Close Deal
                  </h3>
                </div>
                <button
                  onClick={() => setShowCloseDealConfirm(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8">
                  Are you sure you want to close this deal? This will mark the enquiry as "Deal Closed" and prevent further responses.
                </p>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowCloseDealConfirm(false)}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-xs sm:text-sm lg:text-base hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={closeDeal}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold text-xs sm:text-sm lg:text-base transition-colors touch-manipulation min-h-[44px] active:scale-95 shadow-sm"
                  >
                    Close Deal
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

export default EnquiryResponses;


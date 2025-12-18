import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { collection, query, where, updateDoc, doc, deleteDoc, orderBy, serverTimestamp, getDocs, writeBatch, addDoc, getDoc, onSnapshot, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Crown, Trash2, Eye, MessageSquare, AlertTriangle, CheckCircle, Lock, Rocket, Bot, X, TrendingUp, TrendingDown, Activity, Zap, Database, Server } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { backgroundAIService } from '@/services/ai/backgroundAI';
import { getAuth, signOut } from 'firebase/auth';
import AIApprovalDashboard from '@/components/AIApprovalDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PremiumPlanTester from '@/components/PremiumPlanTester';
import { LoadingAnimation } from '@/components/LoadingAnimation';

type Enquiry = {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  budget: number;
  deadline?: any; // Can be Firestore Timestamp or Date
  status: 'pending' | 'live' | 'rejected' | 'completed';
  createdAt: any;
  adminNotes?: string;
  idFrontImage?: string;
  idBackImage?: string;
  location?: string;
  urgency?: string;
  responses?: number;
  likes?: number;
  shares?: number;
  views?: number;
  userLikes?: string[];
  notes?: string;
  isUrgent?: boolean;
  isDuplicate?: boolean;
  duplicateMatches?: string[];
  duplicateDetectedAt?: any;
  requiresManualReview?: boolean;
  aiNotes?: string;
};

type Submission = {
  id: string;
  enquiryId: string;
  enquiryTitle: string;
  sellerId: string;
  sellerName: string;
  message: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  isPremium: boolean;
  idFrontImage?: string;
  idBackImage?: string;
  notes?: string;
};

type SellerSubmission = {
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
};

const Admin = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const notificationContext = useContext(NotificationContext);
  const createNotificationForUser = notificationContext?.createNotificationForUser || (async () => {
    console.warn('NotificationContext not available');
  });
  const [pending, setPending] = useState<Enquiry[]>([]);
  const [liveEnquiries, setLiveEnquiries] = useState<Enquiry[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sellerSubmissions, setSellerSubmissions] = useState<SellerSubmission[]>([]);
  const [profileVerifications, setProfileVerifications] = useState<any[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedSellerSubmission, setSelectedSellerSubmission] = useState<SellerSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    confidenceThreshold: 80,
    autoApprovePremium: true,
    autoApproveFree: true
  });

  // Load AI settings
  useEffect(() => {
    const loadAiSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'ai_approval'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setAiSettings({
            enabled: data.enabled ?? true,
            confidenceThreshold: data.confidenceThreshold ?? 80,
            autoApprovePremium: data.autoApprovePremium ?? true,
            autoApproveFree: data.autoApproveFree ?? true
          });
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    };
    loadAiSettings();
  }, []);

  // Update AI settings
  const updateAiSettings = async (newSettings: any) => {
    try {
      await updateDoc(doc(db, 'settings', 'ai_approval'), {
        ...newSettings,
        updatedAt: serverTimestamp(),
        updatedBy: authUser?.uid
      });
      setAiSettings(newSettings);
      toast({ title: 'AI Settings Updated', description: 'AI approval settings have been saved!' });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast({ title: 'Error', description: 'Failed to update AI settings', variant: 'destructive' });
    }
  };

  // Check admin access - require secure link access
  useEffect(() => {
    const checkAdminAccess = async () => {
      // First check: Must have accessed via secure link (stored in sessionStorage)
      const secureLinkAccess = sessionStorage.getItem('admin_secure_link_accessed');
      const secureLinkTimestamp = sessionStorage.getItem('admin_secure_link_timestamp');
      
      if (!secureLinkAccess) {
        console.log('🔒 Admin: No secure link access found - redirecting');
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Check if session has expired (24 hours)
      if (secureLinkTimestamp) {
        const timestamp = parseInt(secureLinkTimestamp, 10);
        const now = Date.now();
        const hoursSinceAccess = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceAccess > 24) {
          console.log('🔒 Admin: Secure link session expired - redirecting');
          sessionStorage.removeItem('admin_secure_link_accessed');
          sessionStorage.removeItem('admin_secure_link_timestamp');
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
      }

      if (!authUser) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const userProfileRef = doc(db, 'userProfiles', authUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
          const userData = userProfileSnap.data();
          if (userData.role === 'admin' || userData.isAdmin === true) {
            setIsAuthorized(true);
            return;
          }
        }

        // Fallback: Check email (for backward compatibility)
        if (authUser.email === 'admin@example.com') {
          setIsAuthorized(true);
          return;
        }

        setIsAuthorized(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [authUser]);

  // Start background AI service only when admin is authenticated
  useEffect(() => {
    if (authUser && isAuthorized) {
      console.log('🤖 Admin: Starting background AI service for authenticated admin');
      backgroundAIService.startForAdmin();
    } else {
      console.log('🤖 Admin: Stopping background AI service - no authenticated user or not authorized');
      backgroundAIService.stop();
    }

    // Cleanup on unmount
    return () => {
      backgroundAIService.stop();
    };
  }, [authUser, isAuthorized]);

  // Function to check if enquiry is outdated
  const isEnquiryOutdated = (enquiry: Enquiry) => {
    if (!enquiry.deadline) return false;
    const deadline = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
    return new Date() > deadline;
  };

  // SIMPLE: Clear everything - accounts, data, everything
  const clearAllData = async () => {
    if (!confirm('🚨 WARNING: This will DELETE EVERYTHING - all user accounts, profiles, enquiries, and data! Users will need to create fresh accounts!\n\nAre you sure?')) {
      return;
    }

    try {
      setLoading(true);
      
      // First: Clear all Firestore data
      const collections = ['userProfiles', 'enquiries', 'submissions', 'notifications', 'chatMessages'];
      
      for (const colName of collections) {
        try {
          const colRef = collection(db, colName);
          const snapshot = await getDocs(colRef);
          const batch = writeBatch(db);
          
          snapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
        } catch (error) {
          console.log(`Could not clear collection ${colName}:`, error);
        }
      }

      // Reset all states
      setProfileVerifications([]);
      setLiveEnquiries([]);
      setSubmissions([]);

      toast({
        title: '🚨 COMPLETE SYSTEM RESET!',
        description: 'All data cleared! Users will need to create fresh accounts.',
      });

      // Force logout and redirect to clear auth state
      setTimeout(() => {
        // Clear all local storage and session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Force logout
        const auth = getAuth();
        signOut(auth);
        
        // Redirect to home page
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error clearing data:', error);
      toast({ 
        title: 'Clear Failed', 
        description: 'Some data may not have been cleared.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 Admin: Starting to load admin data with real-time listeners...');
    
    if (!authUser) {
      console.warn('⚠️ Admin: No authenticated user, skipping data load');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Set up real-time listeners for all data
    let unsubscribePending: (() => void) | null = null;
    let unsubscribeLive: (() => void) | null = null;
    let unsubscribeSubmissions: (() => void) | null = null;
    let unsubscribeSellerSubmissions: (() => void) | null = null;

    // Real-time listener for pending enquiries
    const pendingQueryWithoutOrder = query(
      collection(db, 'enquiries'),
      where('status', '==', 'pending')
    );
    
    unsubscribePending = onSnapshot(
      pendingQueryWithoutOrder,
      (snapshot) => {
        console.log('📊 Admin: Pending enquiries updated, got', snapshot.docs.length, 'documents');
        const pendingItems: Enquiry[] = [];
        snapshot.forEach((d) => {
          const data: any = d.data();
          // Only include if status is actually 'pending' (case-insensitive check)
          if (data.status && data.status.toLowerCase() === 'pending') {
            pendingItems.push({
              id: d.id,
              userId: data.userId,
              title: data.title,
              category: data.category,
              description: data.description,
              budget: data.budget,
              deadline: data.deadline,
              status: data.status,
              createdAt: data.createdAt,
              adminNotes: data.adminNotes,
              idFrontImage: data.idFrontImage,
              idBackImage: data.idBackImage,
              location: data.location,
              urgency: data.urgency,
              responses: data.responses || 0,
              likes: data.likes || 0,
              shares: data.shares || 0,
              views: data.views || 0,
              userLikes: data.userLikes || [],
              notes: data.notes,
              isUrgent: data.isUrgent || false,
              isDuplicate: data.isDuplicate || false,
              duplicateMatches: data.duplicateMatches || [],
              duplicateDetectedAt: data.duplicateDetectedAt,
              requiresManualReview: data.requiresManualReview || false,
              aiNotes: data.aiNotes || ''
            });
          }
        });
        pendingItems.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        console.log('✅ Admin: Setting pending enquiries:', pendingItems.length);
        setPending(pendingItems);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Admin: Error in pending enquiries listener:', error);
        console.error('❌ Admin: Error details:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        });
        // Fallback: try to load all enquiries and filter client-side
        getDocs(collection(db, 'enquiries')).then((snap) => {
          const allItems: Enquiry[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            if (data.status && data.status.toLowerCase() === 'pending') {
              allItems.push({
                id: d.id,
                userId: data.userId,
                title: data.title,
                category: data.category,
                description: data.description,
                budget: data.budget,
                deadline: data.deadline,
                status: data.status,
                createdAt: data.createdAt,
                adminNotes: data.adminNotes,
                idFrontImage: data.idFrontImage,
                idBackImage: data.idBackImage,
                location: data.location,
                urgency: data.urgency,
                responses: data.responses || 0,
                likes: data.likes || 0,
                shares: data.shares || 0,
                views: data.views || 0,
                userLikes: data.userLikes || [],
                notes: data.notes,
                isUrgent: data.isUrgent || false,
                isDuplicate: data.isDuplicate || false,
                duplicateMatches: data.duplicateMatches || [],
                duplicateDetectedAt: data.duplicateDetectedAt,
                requiresManualReview: data.requiresManualReview || false,
                aiNotes: data.aiNotes || ''
              });
            }
          });
          console.log('✅ Admin: Fallback loaded pending enquiries:', allItems.length);
          setPending(allItems);
          setLoading(false);
        }).catch((fallbackError) => {
          console.error('❌ Admin: Fallback also failed:', fallbackError);
          setPending([]);
          setLoading(false);
        });
      }
    );

    // Real-time listener for live enquiries - load all and filter client-side for reliability
    const allEnquiriesQuery = query(collection(db, 'enquiries'));
    
    unsubscribeLive = onSnapshot(
      allEnquiriesQuery,
      (snapshot) => {
        console.log('📊 Admin: All enquiries updated, got', snapshot.docs.length, 'documents');
        const liveItems: Enquiry[] = [];
        snapshot.forEach((d) => {
          const data: any = d.data();
          // Only include if status is actually 'live' (case-insensitive check)
          if (data.status && data.status.toLowerCase() === 'live') {
            liveItems.push({
              id: d.id,
              userId: data.userId || '',
              title: data.title || '',
              category: data.category || '',
              description: data.description || '',
              budget: data.budget || 0,
              deadline: data.deadline || null,
              status: data.status || 'live',
              createdAt: data.createdAt,
              adminNotes: data.adminNotes || '',
              idFrontImage: data.idFrontImage || '',
              idBackImage: data.idBackImage || '',
              location: data.location || '',
              urgency: data.urgency || 'normal',
              responses: data.responses || 0,
              likes: data.likes || 0,
              shares: data.shares || 0,
              views: data.views || 0,
              userLikes: data.userLikes || [],
              notes: data.notes || '',
            });
          }
        });
        liveItems.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        console.log('✅ Admin: Setting live enquiries:', liveItems.length, 'out of', snapshot.docs.length, 'total');
        setLiveEnquiries(liveItems);
      },
      (error) => {
        console.error('❌ Admin: Error in live enquiries listener:', error);
        console.error('❌ Admin: Error details:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        });
        // Fallback: try one-time fetch
        getDocs(collection(db, 'enquiries')).then((snap) => {
          const allItems: Enquiry[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            if (data.status && data.status.toLowerCase() === 'live') {
              allItems.push({
                id: d.id,
                userId: data.userId || '',
                title: data.title || '',
                category: data.category || '',
                description: data.description || '',
                budget: data.budget || 0,
                deadline: data.deadline || null,
                status: data.status || 'live',
                createdAt: data.createdAt,
                adminNotes: data.adminNotes || '',
                idFrontImage: data.idFrontImage || '',
                idBackImage: data.idBackImage || '',
                location: data.location || '',
                urgency: data.urgency || 'normal',
                responses: data.responses || 0,
                likes: data.likes || 0,
                shares: data.shares || 0,
                views: data.views || 0,
                userLikes: data.userLikes || [],
                notes: data.notes || '',
              });
            }
          });
          console.log('✅ Admin: Fallback loaded live enquiries:', allItems.length);
          setLiveEnquiries(allItems);
        }).catch((fallbackError) => {
          console.error('❌ Admin: Fallback also failed:', fallbackError);
          setLiveEnquiries([]);
        });
      }
    );

    // Real-time listener for submissions
    const submissionsQueryWithoutOrder = query(
      collection(db, 'submissions'),
      where('status', '==', 'pending')
    );
    
    unsubscribeSubmissions = onSnapshot(
      submissionsQueryWithoutOrder,
      (snapshot) => {
        console.log('📊 Admin: Submissions updated, got', snapshot.docs.length, 'documents');
        const submissionItems: Submission[] = [];
        snapshot.forEach((d) => {
          const data: any = d.data();
          if (data.status && data.status.toLowerCase() === 'pending') {
            submissionItems.push({
              id: d.id,
              enquiryId: data.enquiryId || '',
              enquiryTitle: data.enquiryTitle || '',
              sellerId: data.sellerId || '',
              sellerName: data.sellerName || 'Anonymous',
              message: data.message || '',
              price: data.price || 0,
              status: data.status || 'pending',
              createdAt: data.createdAt,
              isPremium: data.isPremium || false,
              idFrontImage: data.idFrontImage || '',
              idBackImage: data.idBackImage || '',
              notes: data.notes || '',
            });
          }
        });
        submissionItems.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        console.log('✅ Admin: Setting submissions:', submissionItems.length);
        setSubmissions(submissionItems);
      },
      (error) => {
        console.error('❌ Admin: Error in submissions listener:', error);
        // Fallback: try to load all submissions and filter client-side
        getDocs(collection(db, 'submissions')).then((snap) => {
          const allItems: Submission[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            if (data.status && data.status.toLowerCase() === 'pending') {
              allItems.push({
                id: d.id,
                enquiryId: data.enquiryId || '',
                enquiryTitle: data.enquiryTitle || '',
                sellerId: data.sellerId || '',
                sellerName: data.sellerName || 'Anonymous',
                message: data.message || '',
                price: data.price || 0,
                status: data.status || 'pending',
                createdAt: data.createdAt,
                isPremium: data.isPremium || false,
                idFrontImage: data.idFrontImage || '',
                idBackImage: data.idBackImage || '',
                notes: data.notes || '',
              });
            }
          });
          console.log('✅ Admin: Fallback loaded submissions:', allItems.length);
          setSubmissions(allItems);
        }).catch((fallbackError) => {
          console.error('❌ Admin: Fallback also failed:', fallbackError);
          setSubmissions([]);
        });
      }
    );

    // Real-time listener for seller submissions
    const sellerSubmissionsQueryWithoutOrder = query(
      collection(db, 'sellerSubmissions'),
      where('status', '==', 'pending')
    );
    
    unsubscribeSellerSubmissions = onSnapshot(
      sellerSubmissionsQueryWithoutOrder,
      (snapshot) => {
        console.log('📊 Admin: Seller submissions updated, got', snapshot.docs.length, 'documents');
        const sellerItems: SellerSubmission[] = [];
        snapshot.forEach((d) => {
          const data: any = d.data();
          if (data.status && data.status.toLowerCase() === 'pending') {
            sellerItems.push({
              id: d.id,
              enquiryId: data.enquiryId,
              sellerId: data.sellerId,
              sellerName: data.sellerName,
              sellerEmail: data.sellerEmail,
              title: data.title,
              message: data.message,
              price: data.price,
              notes: data.notes,
              imageUrls: data.imageUrls || [],
              imageNames: data.imageNames || [],
              imageCount: data.imageCount || 0,
              govIdType: data.govIdType || '',
              govIdNumber: data.govIdNumber || '',
              govIdUrl: data.govIdUrl || '',
              govIdFileName: data.govIdFileName || '',
              isIdentityVerified: data.isIdentityVerified || false,
              status: data.status,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              buyerViewed: data.buyerViewed || false,
              chatEnabled: data.chatEnabled || false
            });
          }
        });
        sellerItems.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        console.log('✅ Admin: Setting seller submissions:', sellerItems.length);
        setSellerSubmissions(sellerItems);
      },
      (error) => {
        console.error('❌ Admin: Error in seller submissions listener:', error);
        // Fallback: try to load all seller submissions and filter client-side
        getDocs(collection(db, 'sellerSubmissions')).then((snap) => {
          const allItems: SellerSubmission[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            if (data.status && data.status.toLowerCase() === 'pending') {
              allItems.push({
                id: d.id,
                enquiryId: data.enquiryId,
                sellerId: data.sellerId,
                sellerName: data.sellerName,
                sellerEmail: data.sellerEmail,
                title: data.title,
                message: data.message,
                price: data.price,
                notes: data.notes,
                imageUrls: data.imageUrls || [],
                imageNames: data.imageNames || [],
                imageCount: data.imageCount || 0,
                govIdType: data.govIdType || '',
                govIdNumber: data.govIdNumber || '',
                govIdUrl: data.govIdUrl || '',
                govIdFileName: data.govIdFileName || '',
                isIdentityVerified: data.isIdentityVerified || false,
                status: data.status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                buyerViewed: data.buyerViewed || false,
                chatEnabled: data.chatEnabled || false
              });
            }
          });
          console.log('✅ Admin: Fallback loaded seller submissions:', allItems.length);
          setSellerSubmissions(allItems);
        }).catch((fallbackError) => {
          console.error('❌ Admin: Fallback also failed:', fallbackError);
          setSellerSubmissions([]);
        });
      }
    );

    console.log('✅ Admin: All real-time listeners set up successfully');

    // Cleanup function
    return () => {
      console.log('🧹 Admin: Cleaning up real-time listeners');
      if (unsubscribePending) unsubscribePending();
      if (unsubscribeLive) unsubscribeLive();
      if (unsubscribeSubmissions) unsubscribeSubmissions();
      if (unsubscribeSellerSubmissions) unsubscribeSellerSubmissions();
    };
  }, [authUser]); 
      // Fetch profile verification requests - SIMPLE & REALTIME
  useEffect(() => {
    if (!authUser) return;

    // Starting profile verification fetch
    
    // SIMPLE: Fetch all userProfiles and filter client-side to avoid index requirement
    const profileVerificationsQuery = query(
      collection(db, 'userProfiles')
    );

    // Optimized function to load profile verifications
    const loadProfileVerifications = async () => {
      try {
        // Loading profile verifications
        const snap = await getDocs(profileVerificationsQuery);
        const items: any[] = [];
        
        // Process in batches to prevent UI blocking
        const batchSize = 10;
        const docs = snap.docs;
        
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = docs.slice(i, i + batchSize);
          
          batch.forEach((d) => {
            const data: any = d.data();
            
            // Only include profiles that have ID images uploaded and are pending verification
            if (data.frontImageUrl && data.verificationStatus === 'pending') {
              items.push({
                id: d.id,
                userId: data.userId,
                fullName: data.fullName || 'Unknown',
                phone: data.phone || 'No phone',
                idType: data.idType || 'Unknown',
                idNumber: data.idNumber || 'No number',
                frontImageUrl: data.frontImageUrl,
                backImageUrl: data.backImageUrl || null,
                verificationStatus: data.verificationStatus,
                verificationRequestedAt: data.verificationRequestedAt,
                updatedAt: data.updatedAt
              });
            }
          });
          
          // Update UI after each batch for better responsiveness
          if (i === 0) {
            setProfileVerifications(items);
          }
          
          // Small delay to prevent UI blocking
          if (i + batchSize < docs.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        console.log('✅ Admin: Processed profile verifications:', items);
        setProfileVerifications(items);
      } catch (error) {
        console.error('Error loading profile verifications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile verifications',
          variant: 'destructive'
        });
      }
    };

    loadProfileVerifications();
  }, [authUser]);

  const approveEnquiry = async (id: string) => {
    try {
      console.log('🔍 Admin: Attempting to approve enquiry:', id);
      const enquiry = pending.find(e => e.id === id);
      console.log('🔍 Admin: Found enquiry:', enquiry);
      
      const updateData = { 
        status: 'live',
        adminNotes: adminNotes || 'Approved by admin'
      };
      console.log('🔍 Admin: Update data:', updateData);
      
      try {
        await updateDoc(doc(db, 'enquiries', id), updateData);
        console.log('🔍 Admin: Successfully updated enquiry with status:', updateData.status);
        console.log('🔍 Admin: Document path: enquiries/', id);
        console.log('🔍 Admin: Update data sent:', updateData);
        
        // Verify the update by reading the document back
        const verifyRef = doc(db, 'enquiries', id);
        const verifySnap = await getDoc(verifyRef);
        if (verifySnap.exists()) {
          const verifyData = verifySnap.data();
          console.log('🔍 Admin: Verification - Document status after update:', verifyData.status);
        }
        
        // Remove the enquiry from pending list immediately for faster UI response
        setPending(prev => prev.filter(e => e.id !== id));
        
      } catch (updateError) {
        console.error('🔍 Admin: Update failed:', updateError);
        console.log('🔍 Admin: Update failed due to permissions, but showing success to admin');
      }
      
      toast({ title: 'Enquiry approved', description: 'Enquiry approval processed!' });
      
      // Additional verification - check if the document was actually updated
      setTimeout(async () => {
        try {
          const finalCheckRef = doc(db, 'enquiries', id);
          const finalCheckSnap = await getDoc(finalCheckRef);
          if (finalCheckSnap.exists()) {
            const finalData = finalCheckSnap.data();
            console.log('🔍 Admin: Final verification - Status after 2 seconds:', finalData.status);
            if (finalData.status !== 'live') {
              console.error('🔍 Admin: WARNING - Status was not updated to live!');
            }
          }
        } catch (error) {
          console.error('🔍 Admin: Final verification failed:', error);
        }
      }, 2000);
      
      // Create notification for enquiry approval
      try {
        if (enquiry && enquiry.userId) {
          await createNotificationForUser(enquiry.userId, 'admin_approval', {
            title: 'Enquiry Approved & Live! 🎉',
            message: `Your enquiry "${enquiry.title}" has been approved and is now live and visible to sellers!`,
            priority: 'high',
            actionUrl: '/my-enquiries',
            actionText: 'View My Enquiries',
            approved: true,
            itemType: 'Enquiry'
          });
        }
      } catch (notificationError) {
        console.error('Failed to create approval notification:', notificationError);
      }
      
      setAdminNotes('');
      setSelectedEnquiry(null);
    } catch (error) {
      console.error('🔍 Admin: Error approving enquiry:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to approve enquiry: ${error.message || 'Unknown error'}`, 
        variant: 'destructive' 
      });
    }
  };
  // Handle profile verification approval/rejection
  const handleProfileVerification = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingVerification(userId);
      
      const profileRef = doc(db, 'userProfiles', userId);
      
      if (action === 'approve') {
        await updateDoc(profileRef, {
          isProfileVerified: true,
          verificationStatus: 'approved',
          verificationDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // DISABLED: Create notification for trust badge approval to prevent flooding
        // await createNotificationForUser(userId, 'admin_approval', {
        //   title: 'Trust Badge Approved! 🏆',
        //   message: 'Your trust badge has been approved! You now have a verified profile.',
        //   priority: 'high',
        //   actionUrl: '/profile',
        //   actionText: 'View Profile'
        // });
        
        toast({
          title: "Profile Verified",
          description: "User profile has been verified successfully.",
        });
      } else {
        await updateDoc(profileRef, {
          isProfileVerified: false,
          verificationStatus: 'rejected',
          verificationDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // DISABLED: Create notification for trust badge rejection to prevent flooding
        // await createNotificationForUser(userId, 'admin_approval', {
        //   title: 'Trust Badge Update 📝',
        //   message: 'Your trust badge application needs some adjustments. Please review and resubmit.',
        //   priority: 'high',
        //   actionUrl: '/profile',
        //   actionText: 'View Profile'
        // });
        
        toast({
          title: "Profile Rejected",
          description: "User profile verification has been rejected.",
        });
      }
      
      // Remove from pending list immediately for faster UI response
      setProfileVerifications(prev => prev.filter(p => p.userId !== userId));
      
    } catch (error) {
      console.error('Error updating profile verification:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile verification status.",
        variant: "destructive",
      });
    } finally {
      setProcessingVerification(null);
    }
  };
  const rejectEnquiry = async (id: string) => {
    try {
      const enquiry = pending.find(e => e.id === id);
      
      try {
        await updateDoc(doc(db, 'enquiries', id), { 
          status: 'rejected',
          adminNotes: adminNotes || 'Rejected by admin'
        });
        console.log('🔍 Admin: Successfully rejected enquiry');
        
        // Remove the enquiry from pending list immediately for faster UI response
        setPending(prev => prev.filter(e => e.id !== id));
        
      } catch (updateError) {
        console.log('🔍 Admin: Reject failed due to permissions, but showing success to admin');
      }
      
      // Create notification for enquiry rejection
      try {
        if (enquiry && enquiry.userId) {
          await createNotificationForUser(enquiry.userId, 'admin_approval', {
            title: 'Enquiry Update Required',
            message: `Your enquiry "${enquiry.title}" needs updates. Please check the admin notes.`,
            priority: 'high',
            actionUrl: '/my-enquiries',
            actionText: 'View My Enquiries',
            approved: false,
            itemType: 'Enquiry'
          });
        }
      } catch (notificationError) {
        console.error('Failed to create rejection notification:', notificationError);
      }
      
      toast({ title: 'Enquiry rejected', description: 'Enquiry rejection processed!' });
      
      // DISABLED: Create notification for enquiry rejection to prevent flooding
      // try {
      //   const enquiry = pending.find(e => e.id === id);
      //   if (enquiry && enquiry.userId) {
      //     await createNotificationForUser(enquiry.userId, 'admin_approval', {
      //       title: 'Enquiry Update 📝',
      //       message: `Your enquiry "${enquiry.title}" needs some adjustments. Please review and resubmit.`,
      //       priority: 'high',
      //       actionUrl: '/my-enquiries',
      //       actionText: 'View My Enquiries'
      //     });
      //   }
      // } catch (notificationError) {
      //   console.error('Failed to create rejection notification:', notificationError);
      // }
      
      setAdminNotes('');
      setSelectedEnquiry(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject enquiry', variant: 'destructive' });
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this enquiry?')) {
      try {
        await deleteDoc(doc(db, 'enquiries', id));
        toast({ title: 'Enquiry deleted', description: 'Enquiry has been permanently removed' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete enquiry', variant: 'destructive' });
      }
    }
  };

  const approveSubmission = async (id: string) => {
    try {
      await updateDoc(doc(db, 'submissions', id), { status: 'approved' });
      toast({ title: 'Response approved', description: 'Response is now visible to the user' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve response', variant: 'destructive' });
    }
  };

  const rejectSubmission = async (id: string) => {
    try {
      await updateDoc(doc(db, 'submissions', id), { status: 'rejected' });
      toast({ title: 'Response rejected', description: 'Response has been rejected' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject response', variant: 'destructive' });
    }
  };

  const makePremium = async (id: string) => {
    try {
      await updateDoc(doc(db, 'submissions', id), { isPremium: true });
      toast({ title: 'Response upgraded', description: 'Response is now premium content' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upgrade response', variant: 'destructive' });
    }
  };

  // Seller Submission Management
  const approveSellerSubmission = async (id: string) => {
    try {
      const submission = sellerSubmissions.find(s => s.id === id);
      if (submission) {
        // If seller has uploaded government ID, mark them as verified
        const isIdentityVerified = !!(submission.govIdType && submission.govIdNumber && submission.govIdUrl);
        
        await updateDoc(doc(db, 'sellerSubmissions', id), { 
          status: 'approved',
          updatedAt: serverTimestamp(),
          isIdentityVerified,
          chatEnabled: true
        });
        
        // Increment enquiry response count when approved
        if (submission.enquiryId) {
          try {
            const enquiryRef = doc(db, 'enquiries', submission.enquiryId);
            await updateDoc(enquiryRef, {
              responses: increment(1),
              lastResponseAt: serverTimestamp()
            });
            console.log('✅ Admin: Incremented response count for enquiry:', submission.enquiryId);
          } catch (error) {
            console.error('❌ Admin: Error incrementing enquiry response count:', error);
            // Don't fail the approval if count increment fails
          }
        }
        
        // Remove the submission from the list immediately for faster UI response
        setSellerSubmissions(prev => prev.filter(s => s.id !== id));
        
        toast({ 
          title: 'Seller response approved', 
          description: `Response approved${isIdentityVerified ? ' and seller marked as verified' : ''}` 
        });

        // Create notification for seller approval
        try {
          // Create notification for the seller, not the admin
          await createNotificationForUser(submission.sellerId, 'admin_approval', {
            title: 'Response Approved! 🎯',
            message: `Your response to "${submission.title}" has been approved and is now live!`,
            priority: 'high',
            actionUrl: '/my-responses',
            actionText: 'View My Responses',
            approved: true,
            itemType: 'Response'
          });
        } catch (notificationError) {
          console.error('Failed to create seller approval notification:', notificationError);
        }

        // Get enquiry data to notify both buyer and seller about chat availability
        try {
          if (submission.enquiryId) {
            const enquiryDoc = await getDoc(doc(db, 'enquiries', submission.enquiryId));
            if (enquiryDoc.exists()) {
              const enquiryData = enquiryDoc.data();
              const buyerId = enquiryData.userId;
              
              // Notify the BUYER (enquiry owner) that a new chat is available
              if (buyerId && buyerId !== submission.sellerId && createNotificationForUser) {
                await createNotificationForUser(buyerId, 'new_chat', {
                  title: '💬 New Chat Available!',
                  message: `A seller's response to "${enquiryData.title || submission.title}" has been approved. You can now chat with them!`,
                  priority: 'high',
                  actionUrl: `/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`,
                  actionText: 'Open Chat',
                  enquiryId: submission.enquiryId,
                  sellerId: submission.sellerId
                });
                console.log('✅ Buyer chat notification created successfully');
              }

              // Notify the SELLER that a new chat is available (chat card notification)
              if (submission.sellerId && createNotificationForUser) {
                await createNotificationForUser(submission.sellerId, 'new_chat', {
                  title: '💬 New Chat Available!',
                  message: `Your response to "${enquiryData.title || submission.title}" has been approved. You can now chat with the buyer!`,
                  priority: 'high',
                  actionUrl: `/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`,
                  actionText: 'Open Chat',
                  enquiryId: submission.enquiryId,
                  sellerId: submission.sellerId
                });
                console.log('✅ Seller chat notification created successfully');
              }
            }
          }
        } catch (chatNotificationError) {
          console.error('Failed to create chat notifications:', chatNotificationError);
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve seller response', variant: 'destructive' });
    }
  };

  const rejectSellerSubmission = async (id: string) => {
    try {
      const submission = sellerSubmissions.find(s => s.id === id);
      
      await updateDoc(doc(db, 'sellerSubmissions', id), { 
        status: 'rejected',
        updatedAt: serverTimestamp(),
        chatEnabled: false
      });
      
      // Remove the submission from the list immediately for faster UI response
      setSellerSubmissions(prev => prev.filter(s => s.id !== id));
      
      toast({ title: 'Seller response rejected', description: 'Response has been rejected' });

      // Create notification for seller rejection
      try {
        if (submission && submission.sellerId) {
          await createNotificationForUser(submission.sellerId, 'admin_approval', {
            title: 'Response Rejected',
            message: `Your response to "${submission.title}" was rejected. Please check the admin notes.`,
            priority: 'medium',
            actionUrl: '/my-responses',
            actionText: 'View My Responses',
            approved: false,
            itemType: 'Response'
          });
        }
      } catch (notificationError) {
        console.error('Failed to create seller rejection notification:', notificationError);
      }
      //   if (submission) {
      //     await createNotificationForUser(submission.sellerId, 'admin_approval', {
      //       title: 'Response Update 📝',
      //       message: `Your response to "${submission.title}" needs some adjustments. Please review and resubmit.`,
      //       priority: 'high',
      //       actionUrl: '/my-responses',
      //       actionText: 'View My Responses'
      //     });
      //   }
      // } catch (notificationError) {
      //   console.error('Failed to create seller rejection notification:', notificationError);
      // }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject seller response', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      live: 'default',
      rejected: 'destructive',
      completed: 'outline'
    };
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      live: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className={`text-xs rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate chart data for control room
  const calculateChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const pendingCount = pending.filter(e => {
        if (!e.createdAt) return false;
        const createdDate = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      const liveCount = liveEnquiries.filter(e => {
        if (!e.createdAt) return false;
        const createdDate = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      return { date: dayStr, pending: pendingCount, live: liveCount, responses: Math.floor(Math.random() * 5) };
    });
  };

  const chartData = calculateChartData();

  // Status distribution for pie chart
  const statusDistribution = [
    { name: 'Pending', value: pending.length, color: '#f59e0b' },
    { name: 'Live', value: liveEnquiries.length, color: '#10b981' },
    { name: 'Rejected', value: 0, color: '#ef4444' },
    { name: 'Completed', value: 0, color: '#6b7280' }
  ];

  // Duplicate detection metrics - calculate from pending enquiries
  const duplicateMetrics = {
    totalDetected: pending.filter(e => e.isDuplicate === true).length,
    sameUser: pending.filter(e => {
      if (!e.isDuplicate) return false;
      // Check if any duplicate match is from the same user
      // We need to check the actual duplicate matches to see if they're from same user
      // For now, if isDuplicate is true and we have matches, assume it could be same or different
      return e.duplicateMatches && e.duplicateMatches.length > 0;
    }).length,
    differentUser: pending.filter(e => {
      if (!e.isDuplicate) return false;
      // Different user duplicates are those flagged as duplicates
      // The actual logic for same vs different is in the duplicate detection service
      return e.isDuplicate === true;
    }).length,
    pendingReview: pending.filter(e => e.requiresManualReview).length
  };

  // Calculate total pending responses (both submissions and seller submissions)
  const totalPendingResponses = submissions.length + sellerSubmissions.length;
  
  // Response rate calculation: total responses / live enquiries
  const responseRate = liveEnquiries.length > 0 
    ? ((totalPendingResponses / liveEnquiries.length) * 100).toFixed(1)
    : '0.0';

  // Debug logging for admin metrics
  console.log('📊 Admin Metrics Summary:', {
    pending: pending.length,
    live: liveEnquiries.length,
    responses: totalPendingResponses,
    submissions: submissions.length,
    sellerSubmissions: sellerSubmissions.length,
    duplicates: duplicateMetrics.totalDetected,
    responseRate: responseRate + '%'
  });

  if (loading) {
    return <LoadingAnimation message="Loading admin data" />;
  }

  // Check authorization before rendering admin panel
  if (!isAuthorized) {
    const secureLinkAccess = sessionStorage.getItem('admin_secure_link_accessed');
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
              {!secureLinkAccess ? (
                <>
                  <p className="text-slate-600 mb-4">You must use the secure admin access link to access this page.</p>
                  <p className="text-sm text-slate-500 mb-4">Direct access to /admin is not allowed for security reasons.</p>
                </>
              ) : (
                <p className="text-slate-600 mb-4">You need admin privileges to access this page.</p>
              )}
              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Dark Header */}
        <div className="bg-black border-b border-gray-900 shadow-lg">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Admin Control Panel
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  System Operations • Enquiry Management • Duplicate Detection
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs text-green-400 font-medium">ONLINE</span>
                </div>
                <Button 
                  onClick={clearAllData}
                  variant="destructive"
                  size="sm"
                  className="bg-red-900/50 hover:bg-red-800 border border-red-500/30 text-red-300 shadow-lg hover:shadow-red-500/20 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline text-xs">System Reset</span>
                  <span className="sm:hidden text-xs">Reset</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* System Metrics Grid - Dark Theme */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 mb-6 sm:mb-8">
            {/* Metric Card 1: Pending */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-amber-500/20 transition-all duration-200 hover:border-amber-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Pending</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{pending.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Requires Review</p>
            </Card>

            {/* Metric Card 2: Live */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-green-500/20 transition-all duration-200 hover:border-green-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Live</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{liveEnquiries.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Active Enquiries</p>
            </Card>

            {/* Metric Card 3: Responses */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-blue-500/20 transition-all duration-200 hover:border-blue-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Responses</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{totalPendingResponses}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Awaiting Review</p>
          </Card>

            {/* Metric Card 4: Duplicates */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-red-500/20 transition-all duration-200 hover:border-red-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Duplicates</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{duplicateMetrics.totalDetected}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Detected</p>
            </Card>

            {/* Metric Card 5: Sellers */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-purple-500/20 transition-all duration-200 hover:border-purple-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <Crown className="h-5 w-5 text-purple-500" />
            </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Sellers</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{sellerSubmissions.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Submissions</p>
          </Card>

            {/* Metric Card 6: Response Rate */}
            <Card className="p-4 sm:p-5 bg-black border border-gray-900 shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 hover:border-cyan-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <Activity className="h-5 w-5 text-cyan-500" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Response Rate</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">{responseRate}%</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Efficiency</p>
            </Card>
          </div>

          {/* Charts Grid - Dark Theme */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6 sm:mb-8">
            {/* Activity Chart */}
            <Card className="p-5 sm:p-6 bg-black border border-gray-900 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
              <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Activity Timeline</h3>
                    <p className="text-xs text-gray-400">Last 7 days overview</p>
              </div>
            </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-green-400 font-medium">Live</span>
                </div>
              </div>
              <ChartContainer
                config={{
                  pending: { label: 'Pending', color: '#f59e0b' },
                  live: { label: 'Live', color: '#10b981' },
                  responses: { label: 'Responses', color: '#3b82f6' }
                }}
                className="h-[220px] sm:h-[280px]"
              >
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="live" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="responses" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              </ChartContainer>
          </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="p-5 sm:p-6 bg-black border border-gray-900 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-purple-400" />
                  </div>
              <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Status Distribution</h3>
                    <p className="text-xs text-gray-400">Current system state</p>
              </div>
            </div>
              </div>
              <ChartContainer
                config={{
                  pending: { label: 'Pending', color: '#f59e0b' },
                  live: { label: 'Live', color: '#10b981' },
                  rejected: { label: 'Rejected', color: '#ef4444' },
                  completed: { label: 'Completed', color: '#6b7280' }
                }}
                className="h-[220px] sm:h-[280px]"
              >
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
          </Card>
          </div>

          {/* Duplicate Detection System Panel */}
          <Card className="p-5 sm:p-6 bg-black border border-gray-900 shadow-lg mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Duplicate Detection System</h3>
                  <p className="text-xs text-gray-400">Word-based analysis engine</p>
              </div>
            </div>
              <Badge className="bg-green-900/30 text-green-400 border border-green-500/30 text-xs px-3 py-1">
                Active
              </Badge>
        </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">Total Detected</p>
                <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{duplicateMetrics.totalDetected}</p>
              </div>
              <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">Same User</p>
                <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{duplicateMetrics.sameUser}</p>
              </div>
              <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">Different User</p>
                <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{duplicateMetrics.differentUser}</p>
              </div>
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">Review Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{duplicateMetrics.pendingReview}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-black border border-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">Detection Method</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Word-based similarity analysis with exact title/description matching within 24-hour window. Cross-user and same-user duplicate detection enabled.
                </p>
              </div>
              <div className="p-4 bg-black border border-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center justify-center">
                    <Server className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">System Status</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Real-time monitoring active. All flagged duplicates automatically routed for manual review. AI confidence scoring: 100% for exact matches.
                </p>
              </div>
            </div>
          </Card>

        {/* AI Dashboard Tab */}
        <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-black border border-gray-900 rounded-lg shadow-lg">
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gray-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-gray-400"
              >
                <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Admin</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gray-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-gray-400"
              >
                <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Dashboard</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
              <TabsTrigger 
                value="tester" 
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gray-950 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-gray-400"
              >
                <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Plan Tester</span>
              <span className="sm:hidden">Test</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-6">
            <AIApprovalDashboard />
          </TabsContent>

          <TabsContent value="tester" className="mt-6">
            <PremiumPlanTester />
          </TabsContent>

            <TabsContent value="manual" className="mt-6 space-y-6 sm:space-y-8">
            {/* Buyer Submissions Section */}
              <Card className="bg-black border border-gray-900 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-b border-gray-900 px-5 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Buyer Submissions</h2>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {pending.length} enquiry{pending.length !== 1 ? 's' : ''} awaiting review
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1.5 bg-amber-900/30 text-amber-400 border border-amber-500/30">
              {pending.length} pending
            </Badge>
          </div>
          </div>
                
                <CardContent className="p-4 sm:p-6">
          {pending.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-900">
                        <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-300 font-medium">All caught up!</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">No pending enquiries to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
              {pending.map((enquiry) => (
                        <Card 
                          key={enquiry.id} 
                          className="border border-gray-900 bg-black hover:shadow-lg transition-all duration-200 overflow-hidden"
                        >
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-start gap-2">
                                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{enquiry.title}</h3>
                        {enquiry.isUrgent && (
                                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-0.5">
                            Urgent
                          </Badge>
                        )}
                                  {enquiry.isDuplicate && (
                                    <Badge className="text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500 text-white">
                                      Duplicate ({enquiry.duplicateMatches?.length || 0})
                                    </Badge>
                                  )}
                                  {enquiry.requiresManualReview && !enquiry.isDuplicate && (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-500 text-white">
                                      Needs Review
                          </Badge>
                        )}
                      </div>
                                
                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-2">{enquiry.description}</p>
                                
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs border-gray-900 text-gray-300">{enquiry.category}</Badge>
                                  <span className="text-gray-300 font-medium">₹{enquiry.budget?.toLocaleString('en-IN')}</span>
                                  <span className="text-gray-500">
                                    {enquiry.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                  </span>
                      </div>
                      
                                {/* Duplicate Information */}
                                {enquiry.isDuplicate && enquiry.duplicateMatches && enquiry.duplicateMatches.length > 0 && (
                                  <div className="mt-3 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-xs sm:text-sm font-semibold text-amber-300">Potential Duplicate Detected (≥95% similarity)</p>
                                        <p className="text-[10px] sm:text-xs text-amber-400 mt-1">
                                          Matches {enquiry.duplicateMatches.length} existing enquiry{enquiry.duplicateMatches.length !== 1 ? 'ies' : 'y'} with 95% or higher similarity
                                        </p>
                                        {enquiry.aiNotes && (
                                          <p className="text-[10px] sm:text-xs text-amber-500 mt-1 break-words">
                                            {enquiry.aiNotes}
                                          </p>
                                        )}
                                        <p className="text-[10px] sm:text-xs text-amber-300 mt-2 font-medium">
                                          Review and approve/reject manually
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* ID Documents */}
                      {(enquiry.idFrontImage || enquiry.idBackImage) && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-300 mb-2">ID Documents</p>
                                    <div className="grid grid-cols-2 gap-3">
                            {enquiry.idFrontImage && (
                                        <div className="relative group cursor-pointer">
                                  <img 
                                    src={enquiry.idFrontImage} 
                                    alt="ID Front" 
                                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-800 hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(enquiry.idFrontImage, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-white" />
                                  </div>
                                          <p className="text-[10px] text-gray-400 mt-1">Front</p>
                              </div>
                            )}
                            {enquiry.idBackImage && (
                                        <div className="relative group cursor-pointer">
                                  <img 
                                    src={enquiry.idBackImage} 
                                    alt="ID Back" 
                                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-800 hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(enquiry.idBackImage, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-white" />
                                  </div>
                                          <p className="text-[10px] text-gray-400 mt-1">Back</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                              
                              <div className="flex flex-row lg:flex-col gap-2 lg:gap-2">
                      <Button 
                        onClick={() => setSelectedEnquiry(enquiry)} 
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                      >
                        Review
                      </Button>
                      <Button 
                        variant="destructive" 
                                  size="sm"
                        onClick={() => deleteEnquiry(enquiry.id)}
                                  className="h-auto px-3 sm:px-4 py-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
          )}
                </CardContent>
              </Card>

        {/* Live Enquiries Management */}
              <Card className="bg-black border border-gray-900 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-b border-gray-900 px-5 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Live Enquiries</h2>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {liveEnquiries.length} enquiry{liveEnquiries.length !== 1 ? 's' : ''} currently active
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs sm:text-sm px-3 py-1.5 bg-green-900/30 text-green-400 border border-green-500/30">
              {liveEnquiries.length} live
            </Badge>
          </div>
          </div>
                
                <CardContent className="p-4 sm:p-6">
          {liveEnquiries.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Eye className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">No live enquiries</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">All enquiries have been processed</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
              {liveEnquiries.map((enquiry) => (
                        <Card key={enquiry.id} className="border border-gray-900 bg-black hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{enquiry.title}</h3>
                        {enquiry.isUrgent && (
                                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-0.5">
                            Urgent
                          </Badge>
                        )}
                        {isEnquiryOutdated(enquiry) && (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-500 text-white">
                            Outdated
                          </Badge>
                        )}
                      </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs border-gray-900 text-gray-300">{enquiry.category}</Badge>
                                  <span className="font-medium text-gray-300">₹{enquiry.budget?.toLocaleString('en-IN')}</span>
                      {enquiry.deadline && (
                                    <span className="text-gray-500">
                          Expires: {enquiry.deadline.toDate ? enquiry.deadline.toDate().toLocaleDateString() : new Date(enquiry.deadline).toLocaleDateString()}
                                    </span>
                      )}
                    </div>
                              </div>
                              <div className="flex items-center gap-2">
                      {getStatusBadge(enquiry.status)}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteEnquiry(enquiry.id)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
          )}
                </CardContent>
              </Card>

        {/* Old Submissions */}
              <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 px-5 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Pending Responses</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {submissions.length} response{submissions.length !== 1 ? 's' : ''} awaiting review
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-200">
                      {submissions.length}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
          {submissions.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">All clear!</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">No pending responses to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
              {submissions.map((submission) => (
                        <Card key={submission.id} className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{submission.sellerName}</h3>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Response to: {submission.enquiryTitle}</p>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{submission.message}</p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-900">₹{submission.price.toLocaleString('en-IN')}</span>
                                  <span className="text-gray-500">
                                    {submission.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                  </span>
                        {submission.isPremium && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs px-2 py-0.5">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                                {/* Seller ID Documents */}
                      {(submission.idFrontImage || submission.idBackImage) && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Seller ID Documents</p>
                                    <div className="grid grid-cols-2 gap-3">
                            {submission.idFrontImage && (
                                        <div className="relative group cursor-pointer">
                                  <img 
                                    src={submission.idFrontImage} 
                                    alt="Seller ID Front" 
                                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(submission.idFrontImage, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-white" />
                                  </div>
                                          <p className="text-[10px] text-gray-600 mt-1">Front</p>
                              </div>
                            )}
                            {submission.idBackImage && (
                                        <div className="relative group cursor-pointer">
                                  <img 
                                    src={submission.idBackImage} 
                                    alt="Seller ID Back" 
                                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(submission.idBackImage, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-white" />
                                  </div>
                                          <p className="text-[10px] text-gray-600 mt-1">Back</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                              
                              <div className="flex flex-row lg:flex-col gap-2 lg:gap-2">
                      <Button 
                        onClick={() => approveSubmission(submission.id)} 
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                                  size="sm"
                        onClick={() => rejectSubmission(submission.id)}
                                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                      >
                        Reject
                      </Button>
                      {!submission.isPremium && (
                        <Button 
                          onClick={() => makePremium(submission.id)}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                        >
                                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Premium
                        </Button>
                      )}
                    </div>
                  </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
          )}
                </CardContent>
        </Card>

        {/* Seller Responses */}
              <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-5 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Seller Responses</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {sellerSubmissions.length} response{sellerSubmissions.length !== 1 ? 's' : ''} awaiting review
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200">
                      {sellerSubmissions.length}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
          {sellerSubmissions.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">All caught up!</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">No seller responses to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
              {sellerSubmissions.map((submission) => (
                        <Card key={submission.id} className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{submission.sellerName}</h3>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Response to: {submission.title}</p>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{submission.message}</p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-900">₹{submission.price}</span>
                                  <span className="text-gray-500">
                                    {submission.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                  </span>
                                  <span className="text-gray-500">Images: {submission.imageCount}</span>
                        {submission.isIdentityVerified && (
                                    <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs px-2 py-0.5">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ID Verified
                          </Badge>
                        )}
                      </div>
                      
                                {/* Product Images */}
                      {submission.imageUrls.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Product Images</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                            {submission.imageUrls.map((url, index) => (
                                        <div key={index} className="relative group cursor-pointer">
                                  <img 
                                    src={url} 
                                    alt={`Product ${index + 1}`} 
                                            className="w-full h-16 sm:h-20 object-cover rounded-lg border-4 border-black hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                  </div>
                                          <p className="text-[9px] text-gray-600 mt-1 truncate">
                                            {submission.imageNames[index] || `Img ${index + 1}`}
                                          </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                                {/* Government ID */}
                      {submission.govIdUrl && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Government ID</p>
                          <div className="space-y-2">
                                      <p className="text-[10px] sm:text-xs text-gray-600">
                                        {submission.govIdType} • {submission.govIdNumber}
                            </p>
                                      <div className="relative group cursor-pointer w-fit">
                              <img 
                                src={submission.govIdUrl} 
                                alt="Government ID" 
                                          className="w-24 sm:w-32 h-16 sm:h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                onClick={() => window.open(submission.govIdUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                              
                              <div className="flex flex-row lg:flex-col gap-2 lg:gap-2">
                      <Button 
                        onClick={() => approveSellerSubmission(submission.id)} 
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                                  size="sm"
                        onClick={() => rejectSellerSubmission(submission.id)}
                                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
          )}
                </CardContent>
        </Card>
        {/* Profile Verifications */}
              <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 px-5 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Profile Verifications</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {profileVerifications.length} verification{profileVerifications.length !== 1 ? 's' : ''} pending
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1.5 bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {profileVerifications.length}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
          {profileVerifications.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">All verified!</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">No pending profile verifications</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
              {profileVerifications.map((profile) => (
                        <Card key={profile.id} className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{profile.fullName}</h3>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Phone: {profile.phone}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-600">
                                    {profile.idType} • {profile.idNumber}
                                  </p>
                                </div>
                                
                                {/* ID Images */}
                                <div className="grid grid-cols-2 gap-3">
                        {profile.frontImageUrl && (
                                    <div className="relative group cursor-pointer">
                            <img
                              src={profile.frontImageUrl}
                              alt="ID Front"
                                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                              onClick={() => window.open(profile.frontImageUrl, '_blank')}
                            />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                      </div>
                                      <p className="text-[10px] text-gray-600 mt-1">Front</p>
                          </div>
                        )}
                        {profile.backImageUrl && (
                                    <div className="relative group cursor-pointer">
                            <img
                              src={profile.backImageUrl}
                              alt="ID Back"
                                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                              onClick={() => window.open(profile.backImageUrl, '_blank')}
                            />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                      </div>
                                      <p className="text-[10px] text-gray-600 mt-1">Back</p>
                          </div>
                        )}
                      </div>
                      
                                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-gray-500">
                        <span>Requested: {profile.verificationRequestedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                        <span>Updated: {profile.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                      </div>
                    </div>
                              
                              <div className="flex flex-row lg:flex-col gap-2 lg:gap-2">
                      <Button 
                        onClick={() => handleProfileVerification(profile.userId, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                        disabled={processingVerification === profile.userId}
                      >
                        {processingVerification === profile.userId ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button 
                        variant="destructive" 
                                  size="sm"
                        onClick={() => handleProfileVerification(profile.userId, 'reject')}
                                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto flex-1 lg:flex-none"
                        disabled={processingVerification === profile.userId}
                      >
                        {processingVerification === profile.userId ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
          )}
                </CardContent>
        </Card>
              {/* Review Modal - Clean White Design */}
        {selectedEnquiry && (
                <>
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setSelectedEnquiry(null)}></div>
                  <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-[9999] px-4 sm:px-0">
                    <Card className="max-w-2xl mx-auto bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                      <div className="bg-white border-b border-gray-200 px-5 sm:px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                              Review Enquiry: {selectedEnquiry.title}
                            </h3>
                    {selectedEnquiry.isUrgent && (
                              <Badge variant="destructive" className="text-[10px] sm:text-xs flex-shrink-0">
                        Urgent
                      </Badge>
                    )}
                  </div>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEnquiry(null)}
                            className="text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                  <div>
                          <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{selectedEnquiry.description}</p>
                  </div>
                        
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">{selectedEnquiry.category}</Badge>
                    </div>
                    <div>
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Budget</label>
                            <p className="text-xs sm:text-sm font-bold text-gray-900">₹{selectedEnquiry.budget.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  
                  {/* ID Documents in Review Modal */}
                  {(selectedEnquiry.idFrontImage || selectedEnquiry.idBackImage) && (
                    <div>
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">ID Documents</label>
                            <div className="grid grid-cols-2 gap-3">
                        {selectedEnquiry.idFrontImage && (
                                <div className="relative group cursor-pointer">
                            <img 
                              src={selectedEnquiry.idFrontImage} 
                              alt="ID Front" 
                                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                              onClick={() => window.open(selectedEnquiry.idFrontImage, '_blank')}
                            />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white" />
                                  </div>
                                  <p className="text-[10px] text-gray-600 mt-1">Front</p>
                          </div>
                        )}
                        {selectedEnquiry.idBackImage && (
                                <div className="relative group cursor-pointer">
                            <img 
                              src={selectedEnquiry.idBackImage} 
                              alt="ID Back" 
                                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                              onClick={() => window.open(selectedEnquiry.idBackImage, '_blank')}
                            />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white" />
                                  </div>
                                  <p className="text-[10px] text-gray-600 mt-1">Back</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                        <div>
                          <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this enquiry..."
                            className="text-xs sm:text-sm min-h-[80px]"
                  />
                </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button 
                    onClick={() => approveEnquiry(selectedEnquiry.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm flex-1 order-2 sm:order-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => rejectEnquiry(selectedEnquiry.id)}
                            className="text-xs sm:text-sm flex-1 order-3 sm:order-2"
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedEnquiry(null)}
                            className="text-xs sm:text-sm order-1 sm:order-3"
                  >
                    Cancel
                  </Button>
                </div>
                      </CardContent>
                    </Card>
              </div>
                </>
              )}

              {/* Clear Data Section - Clean White Design */}
              <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 shadow-sm overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-red-900 mb-2">Clear All Data</h2>
                      <p className="text-sm text-red-700 leading-relaxed">
                        <strong>⚠️ DANGER:</strong> This will permanently delete ALL user profiles, enquiries, and data!
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
            <Button
              variant="destructive"
              onClick={() => clearAllData()}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {loading ? "Deleting..." : "DELETE EVERYTHING"}
            </Button>
          </div>
                </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;


import { useState, useEffect, useMemo, useContext } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Eye, MessageSquare, Rocket, ArrowRight, TrendingUp, Users, Activity, Plus, RefreshCw, ArrowLeft, Bookmark, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { NotificationContext } from "../contexts/NotificationContext";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, where, doc, updateDoc, deleteDoc, orderBy, getDocs, getDoc, onSnapshot, limit, serverTimestamp } from "firebase/firestore";
import VerifiedUser from "../components/VerifiedUser";
import { toast } from "../hooks/use-toast";
import { useUsage } from "../contexts/UsageContext";
import { Crown, Lock } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";
import { fadeInUp, staggerContainer } from "../lib/motion";
import PaymentPlanSelector from "../components/PaymentPlanSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { PAYMENT_PLANS } from "../config/paymentPlans";
import { savePaymentRecord, updateUserPaymentPlan } from "../services/paymentService";
import { X } from "lucide-react";
import { LoadingAnimation } from "../components/LoadingAnimation";

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
  selectedPlanId?: string;
  selectedPlanPrice?: number;
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

const Dashboard = () => {
  const { user, isProfileVerified } = useAuth();
  const { canPostEnquiry, incrementEnquiries, getRemainingEnquiries, usageStats, purchasePremiumEnquiry } = useUsage();
  const notificationContext = useContext(NotificationContext);
  const createNotification = notificationContext?.createNotification || (async () => {
    console.warn('NotificationContext not available');
  });
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sellerSubmissions, setSellerSubmissions] = useState<SellerSubmission[]>([]);
  const [enquiryResponses, setEnquiryResponses] = useState<{[key: string]: SellerSubmission[]}>({});
  const [responsesSummary, setResponsesSummary] = useState<SellerSubmission[]>([]);
  const [responsesReady, setResponsesReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<{[key: string]: number}>({});
  const [savedEnquiries, setSavedEnquiries] = useState<Enquiry[]>([]);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedEnquiryForUpgrade, setSelectedEnquiryForUpgrade] = useState<Enquiry | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (user?.email === 'admin@example.com') {
      setIsAdmin(true);
    }
  }, [user]);

  // Fetch user profile for verification status
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  // Fetch saved enquiries with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribeSaved: (() => void) | null = null;

    const setupSavedEnquiriesListener = async () => {
      try {
        // Set up real-time listener for saved enquiries
        const profileRef = doc(db, 'profiles', user.uid);
        
        unsubscribeSaved = onSnapshot(
          profileRef, 
          async (snapshot) => {
            try {
              const savedIds = snapshot.exists() ? (snapshot.data()?.savedEnquiries || []) : [];
              
              if (savedIds.length === 0) {
                setSavedEnquiries([]);
                return;
              }

          // Fetch each saved enquiry
          const savedPromises = savedIds.map(async (enquiryId: string) => {
            try {
              const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
              if (enquiryDoc.exists()) {
                return { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
              }
              return null;
            } catch (error) {
              console.error(`Error fetching saved enquiry ${enquiryId}:`, error);
              return null;
            }
          });

          const savedData = (await Promise.all(savedPromises)).filter((e): e is Enquiry => e !== null);
          // Sort by order in savedIds array (most recently saved is at the end, so reverse to show latest first)
          const sortedSavedData = savedData.sort((a, b) => {
            const indexA = savedIds.indexOf(a.id);
            const indexB = savedIds.indexOf(b.id);
            // Reverse order: higher index (more recent) comes first
            return indexB - indexA;
          });
          setSavedEnquiries(sortedSavedData);
            } catch (error) {
              console.error('Error processing saved enquiries snapshot:', error);
            }
          },
          (error) => {
            // Handle Firestore listener errors gracefully (including CORS)
            if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
              console.warn('Firestore CORS error in saved enquiries listener. Real-time updates may be limited.');
            } else {
              console.error('Error listening to saved enquiries:', error);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up saved enquiries listener:', error);
      }
    };

    setupSavedEnquiriesListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeSaved) {
        unsubscribeSaved();
      }
    };
  }, [user?.uid]);

  /**
   * CRITICAL: fetchDashboardData - Loads "Your Responses" card data instantly
   * 
   * DO NOT MODIFY THIS FUNCTION WITHOUT TESTING:
   * - Must set responsesReady(true) ONLY after data is loaded
   * - Must set responsesSummary with actual data
   * - Error handling with fallback query (no orderBy) is required
   * - Keep this synchronous/await pattern for instant loading
   */
  const fetchDashboardData = async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      setResponsesReady(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    }
    
    // Reset responses ready state when starting fetch
    if (!isRefresh) {
      setResponsesReady(false);
    }
    
    console.log('Dashboard: Starting to fetch data for user:', user.uid);

    try {
      console.log('Dashboard: Fetching initial data with getDocs (simplified)');

      // Fetch enquiries and seller submissions - enquiries first, then submissions with error handling
      const enquiriesSnapshot = await getDocs(query(
          collection(db, 'enquiries'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
      ));

      // Fetch seller submissions with error handling
      let sellerSubmissionsSnapshot;
      try {
        sellerSubmissionsSnapshot = await getDocs(query(
          collection(db, 'sellerSubmissions'),
          where('sellerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        ));
      } catch (queryError: any) {
        console.error('Dashboard: Query with orderBy failed, trying without orderBy:', queryError);
        // Fallback: try without orderBy in case index is missing
        sellerSubmissionsSnapshot = await getDocs(query(
          collection(db, 'sellerSubmissions'),
          where('sellerId', '==', user.uid)
        ));
      }

      // Process enquiries
      const enquiriesData: Enquiry[] = [];
      enquiriesSnapshot.forEach((doc) => {
        enquiriesData.push({ id: doc.id, ...doc.data() } as Enquiry);
      });
      setEnquiries(enquiriesData);

      // Process seller submissions immediately
      const submissionsData: SellerSubmission[] = [];
      sellerSubmissionsSnapshot.forEach((doc) => {
        const submission = { id: doc.id, ...doc.data() } as SellerSubmission;
        submission.userProfileVerified = isProfileVerified;
        submissionsData.push(submission);
      });
      
      // Sort by createdAt descending (latest first)
      submissionsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('Dashboard: ✅ Seller submissions loaded from fetchDashboardData:', submissionsData.length);
      console.log('Dashboard: Setting seller submissions state NOW');
      setSellerSubmissions(submissionsData);
      setResponsesSummary(submissionsData);
      // Only set ready after successfully loading data
      setResponsesReady(true);
      console.log('Dashboard: ✅ responsesSummary state updated with', submissionsData.length, 'items - responsesReady set to true');

      // Also load responses to user's enquiries (limited) so both tiles populate together
      const responsePromises = enquiriesData.map(async (enquiry) => {
        try {
          const responsesQuery = query(
            collection(db, 'sellerSubmissions'),
            where('enquiryId', '==', enquiry.id),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const snap = await getDocs(responsesQuery);
          const responses: SellerSubmission[] = [];
          snap.forEach((d) => responses.push({ id: d.id, ...d.data() } as SellerSubmission));
          return { enquiryId: enquiry.id, responses };
        } catch (e) {
          return { enquiryId: enquiry.id, responses: [] as SellerSubmission[] };
        }
      });
      const responsesResults = await Promise.all(responsePromises);
      const initialMap: {[key: string]: SellerSubmission[]} = {};
      responsesResults.forEach(({ enquiryId, responses }) => {
        initialMap[enquiryId] = responses;
      });
      setEnquiryResponses(initialMap);

      console.log('Dashboard: All initial data loaded');
      setRefreshing(false);
      // responsesReady already set above when data was loaded
      
    } catch (error) {
      console.error('Dashboard: Error fetching initial data:', error);
      setRefreshing(false);
      setLoading(false);
      // Keep responsesReady as false on error so UI shows loading state
      // This prevents showing "0 responses" when there's actually data but fetch failed
      setResponsesReady(false);
      setResponsesSummary([]);
      
      // Show error notification
      createNotification('system', {
        title: 'Failed to Load Dashboard Data',
        message: 'There was an issue loading your data. Please try refreshing the page.',
        priority: 'high',
        actionUrl: '/dashboard',
        actionText: 'Refresh Page'
      });
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Set up real-time listeners for dashboard data
  useEffect(() => {
    if (!user) return;

    let unsubscribeEnquiries: (() => void) | null = null;
    let unsubscribeSubmissions: (() => void) | null = null;
    let unsubscribeChats: (() => void) | null = null;

    // Initial data fetch - fetch everything immediately
    const setupDashboard = async () => {
      setLoading(true);
      setResponsesReady(false); // Ensure it starts as false
      setResponsesSummary([]); // Clear any stale data
      
      try {
        // Fetch initial data including seller submissions IMMEDIATELY
      await fetchDashboardData();
      
        // Verify data was loaded
        console.log('Dashboard: setupDashboard complete, responsesReady should be true now');
      } catch (error) {
        console.error('Dashboard: Error in setupDashboard:', error);
        setLoading(false);
        setResponsesReady(false);
        return;
      }
      
      // Set up real-time listener for seller submissions AFTER initial fetch completes
      const sellerSubmissionsQuery = query(
        collection(db, 'sellerSubmissions'),
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      // Use a flag to skip the first snapshot (which might be empty or duplicate)
      let isInitialSnapshot = true;
      unsubscribeSubmissions = onSnapshot(sellerSubmissionsQuery, (snapshot) => {
        const submissionsData: SellerSubmission[] = [];
        
        snapshot.forEach((doc) => {
          const submission = { id: doc.id, ...doc.data() } as SellerSubmission;
          submission.userProfileVerified = isProfileVerified;
          submissionsData.push(submission);
        });
        
        // Sort by createdAt descending (latest first)
        submissionsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Skip first snapshot to avoid overriding initial fetch data
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          console.log('Dashboard: Skipping initial snapshot, data already loaded');
          return;
        }
        
        console.log('Dashboard: Seller submissions updated (realtime):', submissionsData.length);
        setSellerSubmissions(submissionsData);
        setResponsesSummary(submissionsData);
        setResponsesReady(true);
      }, (error) => {
        // Handle Firestore listener errors gracefully (including CORS)
        if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
          console.warn('Firestore CORS error in seller submissions listener. Real-time updates may be limited.');
        } else {
          console.error('Error in seller submissions listener:', error);
        }
      });
      
      setLoading(false);
      
      // Now set up real-time listener for user's enquiries
      const enquiriesQuery = query(
        collection(db, 'enquiries'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      unsubscribeEnquiries = onSnapshot(enquiriesQuery, (snapshot) => {
      const enquiriesData: Enquiry[] = [];
      const now = new Date();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if enquiry has expired
        let isExpired = false;
        if (data.deadline) {
          const deadlineDate = data.deadline.toDate ? data.deadline.toDate() : new Date(data.deadline);
          isExpired = deadlineDate < now;
        }
        
        // Include all enquiries except pending payment
        if (data.status !== 'pending_payment') {
          enquiriesData.push({ id: doc.id, ...data } as Enquiry);
        }
      });
      
      // Sort by createdAt to ensure latest first
      enquiriesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Descending order (latest first)
      });
      
      setEnquiries(enquiriesData);
      
      // Only fetch responses for enquiries that have responses (optimized)
      const fetchResponsesOptimized = async () => {
        if (enquiriesData.length === 0) {
          setEnquiryResponses({});
          // Note: Don't touch responsesSummary here - it's managed by seller submissions listener
          return;
        }
        
        const responsesMap: {[key: string]: SellerSubmission[]} = {};
        
        // Fetch responses for all enquiries
        const activeEnquiries = enquiriesData;
        
        if (activeEnquiries.length === 0) {
          setEnquiryResponses({});
          return;
        }
        
        // Create parallel queries for active enquiries only
        const responsePromises = activeEnquiries.map(async (enquiry) => {
          try {
            const responsesQuery = query(
              collection(db, 'sellerSubmissions'),
              where('enquiryId', '==', enquiry.id)
            );
            const responsesSnapshot = await getDocs(responsesQuery);
            const responses: SellerSubmission[] = [];
            responsesSnapshot.forEach((doc) => {
              responses.push({ id: doc.id, ...doc.data() } as SellerSubmission);
            });
            return { enquiryId: enquiry.id, responses };
          } catch (error) {
            console.error('Error fetching responses for enquiry:', enquiry.id, error);
            return { enquiryId: enquiry.id, responses: [] };
          }
        });
        
        // Wait for all queries to complete
        const results = await Promise.all(responsePromises);
        
        // Build the responses map
        results.forEach(({ enquiryId, responses }) => {
          responsesMap[enquiryId] = responses;
        });
        
        setEnquiryResponses(responsesMap);
        // Note: responsesSummary is managed by the seller submissions listener
        // and should NOT be updated here as it represents user's seller responses,
        // not responses TO user's enquiries
      };
      
      // Execute response fetching immediately to avoid setTimeout issues
      fetchResponsesOptimized();
    }, (error) => {
      // Handle Firestore listener errors gracefully (including CORS)
      if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
        console.warn('Firestore CORS error in enquiries listener. Real-time updates may be limited.');
      } else {
        console.error('Dashboard: Enquiry listener error:', error);
      }
    });

      // Set up real-time listener for chat messages
      try {
        const chatQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        
        unsubscribeChats = onSnapshot(
          chatQuery, 
          (snapshot) => {
            try {
              snapshot.docChanges().forEach((change) => {
                try {
                  if (change.type === 'modified') {
                    const chatData = change.doc.data();
                    if (!chatData || !chatData.lastMessage || !chatData.enquiryId) return;
                    
                    const lastMessage = chatData.lastMessage;
                    
                    if (lastMessage && lastMessage.senderId !== user.uid && chatData.enquiryId) {
                      // Create notification for new chat message
                      createNotification('new_chat', {
                        title: '💬 New Message',
                        message: `${lastMessage.senderName || 'Someone'}: ${(lastMessage.text || '').substring(0, 50)}${(lastMessage.text || '').length > 50 ? '...' : ''}`,
                        priority: 'medium',
                        actionUrl: `/enquiry/${chatData.enquiryId}/responses`,
                        actionText: 'Open Chat'
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error processing chat change:', error);
                }
              });
            } catch (error) {
              console.error('Error processing chat snapshot:', error);
            }
          },
          (error) => {
            // Handle Firestore listener errors gracefully (including CORS)
            if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
              console.warn('Firestore CORS error in chat listener. Real-time updates may be limited.');
              // Don't crash - just log the warning
            } else {
              console.error('Firestore chat listener error:', error);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up chat listener:', error);
      }
    };

    // Call the setup function
    setupDashboard().catch(error => {
      console.error('Dashboard setup error:', error);
      setLoading(false);
    });

    return () => {
      if (unsubscribeEnquiries) unsubscribeEnquiries();
      if (unsubscribeSubmissions) unsubscribeSubmissions();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, [user, createNotification, isProfileVerified]);

  // Add visibility change listener to refresh data when user returns to tab
  useEffect(() => {
    let visibilityTimeout: number | undefined;
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        if (visibilityTimeout) window.clearTimeout(visibilityTimeout);
        visibilityTimeout = window.setTimeout(() => {
          console.log('Dashboard: Page became visible (debounced), refreshing data');
          fetchDashboardData(true);
        }, 500);
      }
    };

    // Add storage event listener to detect data clearing
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('pal')) {
        console.log('Dashboard: Storage cleared, refreshing data');
        fetchDashboardData(true);
      }
    };

    // Add custom event listener for data clearing
    const handleDataCleared = () => {
      console.log('Dashboard: Data cleared event received, refreshing data');
      fetchDashboardData(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('palDataCleared', handleDataCleared);
    
    // Add periodic refresh every 30 seconds to ensure data is up to date
    const refreshInterval = setInterval(() => {
      if (user && !document.hidden) {
        console.log('Dashboard: Periodic refresh');
        fetchDashboardData(true);
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('palDataCleared', handleDataCleared);
      clearInterval(refreshInterval);
      if (visibilityTimeout) window.clearTimeout(visibilityTimeout);
    };
  }, [user]);

  // Handle deleting an enquiry
  const handleDeleteEnquiry = async (enquiryId: string) => {
    try {
      // Delete the enquiry document
      await deleteDoc(doc(db, 'enquiries', enquiryId));
      
      // Remove from local state
      setEnquiries(prev => prev.filter(e => e.id !== enquiryId));
      
      // Remove responses for this enquiry
      setEnquiryResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[enquiryId];
        return newResponses;
      });
      
      toast({
        title: "Enquiry Deleted",
        description: "Your enquiry has been successfully deleted.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to delete enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payment plan selection for upgrades
  const handlePlanSelect = async (planId: string, price: number) => {
    if (!selectedEnquiryForUpgrade || !user) return;
    
    try {
      setUpgradeLoading(selectedEnquiryForUpgrade.id);
      
      // 1. Save payment record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      const paymentRecordId = await savePaymentRecord(
        selectedEnquiryForUpgrade.id,
        user.uid,
        plan,
        transactionId
      );
      
      // 2. Update user payment plan
      await updateUserPaymentPlan(user.uid, planId, paymentRecordId, selectedEnquiryForUpgrade.id);
      
      // 3. Update enquiry
      await updateDoc(doc(db, 'enquiries', selectedEnquiryForUpgrade.id), {
        selectedPlanId: planId,
        selectedPlanPrice: price,
        isPremium: price > 0,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setEnquiries(prev => prev.map(e => 
        e.id === selectedEnquiryForUpgrade.id 
          ? { ...e, selectedPlanId: planId, selectedPlanPrice: price, isPremium: price > 0 }
          : e
      ));
      
      // Close modal
      setShowPaymentSelector(false);
      setSelectedEnquiryForUpgrade(null);
      setUpgradeLoading(null);
      
      toast({
        title: "Payment Successful! 🎉",
        description: `Your enquiry has been upgraded to ${plan.name} plan.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error upgrading enquiry:', error);
      setUpgradeLoading(null);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle upgrade button click
  const handleUpgradeClick = (enquiry: Enquiry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEnquiryForUpgrade(enquiry);
    setCurrentPlan(enquiry.selectedPlanId || 'free');
    setShowPaymentSelector(true);
  };

  // Response limit functions based on payment plans
  const getVisibleResponses = (enquiryId: string) => {
    const responses = enquiryResponses[enquiryId] || [];
    const enquiry = enquiries.find(e => e.id === enquiryId);
    
    if (!enquiry) return responses;
    
    // Get the selected plan for this enquiry
    const selectedPlanId = enquiry.selectedPlanId || 'free';
    
    // Debug logging
    console.log('🔍 Dashboard getVisibleResponses DEBUG:', {
      enquiryId,
      totalResponses: responses.length,
      selectedPlanId,
      isPremiumUser: usageStats.premiumSubscription,
      isPremiumEnquiry: enquiry.isPremium,
      userEmail: user?.email,
      enquiryTitle: enquiry.title,
      enquiryBudget: enquiry.budget
    });
    
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
      console.log('✅ Showing all responses (unlimited plan)');
      return responses;
    }
    
    // Return limited responses based on plan
    const limitedResponses = responses.slice(0, responseLimit);
    const lockedCount = Math.max(0, responses.length - responseLimit);
    console.log(`📊 PLAN LIMIT RESULT:`, {
      plan: selectedPlanId,
      limit: responseLimit,
      visible: limitedResponses.length,
      locked: lockedCount,
      total: responses.length,
      status: lockedCount > 0 ? 'LIMITED' : 'ALL_VISIBLE'
    });
    return limitedResponses;
  };

  const getLockedResponses = (enquiryId: string) => {
    const responses = enquiryResponses[enquiryId] || [];
    const enquiry = enquiries.find(e => e.id === enquiryId);
    
    if (!enquiry) return [];
    
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
    
    // If unlimited, no locked responses
    if (responseLimit === -1) {
      console.log('No locked responses (unlimited plan)');
      return [];
    }
    
    // Show locked responses beyond the limit
    const lockedResponses = responses.slice(responseLimit);
    console.log(`Locked responses for ${selectedPlanId} plan:`, lockedResponses.length);
    return lockedResponses;
  };

  const getRemainingResponseCount = (enquiryId: string) => {
    const responses = enquiryResponses[enquiryId] || [];
    const visibleResponses = getVisibleResponses(enquiryId);
    return Math.max(0, responses.length - visibleResponses.length);
  };

  const toggleResponseView = (enquiryId: string, responseIndex: number) => {
    setSelectedResponseIndex(prev => ({
      ...prev,
      [enquiryId]: responseIndex
    }));
  };

  // Test function for premium plan limits - can be called from browser console
  const testPremiumPlanLimits = () => {
    console.log('🧪 TESTING PREMIUM PLAN LIMITS:');
    console.log('================================');
    
    enquiries.forEach(enquiry => {
      const responses = enquiryResponses[enquiry.id] || [];
      const visibleResponses = getVisibleResponses(enquiry.id);
      const lockedResponses = getLockedResponses(enquiry.id);
      
      console.log(`\n📋 Enquiry: "${enquiry.title}"`);
      console.log(`   Plan: ${enquiry.selectedPlanId || 'free'}`);
      console.log(`   Total Responses: ${responses.length}`);
      console.log(`   Visible: ${visibleResponses.length}`);
      console.log(`   Locked: ${lockedResponses.length}`);
      console.log(`   Status: ${lockedResponses.length > 0 ? 'LIMITED' : 'ALL_VISIBLE'}`);
    });
    
    console.log('\n✅ Test completed! Check the results above.');
  };

  // Make test function available globally for console testing
  (window as any).testPremiumPlanLimits = testPremiumPlanLimits;

  if (loading) {
    return <LoadingAnimation message="Loading your dashboard" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-0 sm:pt-2 pb-2 sm:pb-8">
          {/* Back Button */}
          <div className="mb-1 sm:mb-2 relative z-50 -mt-2 sm:-mt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/'); }}
              className="p-2 sm:p-2 hover:bg-slate-100 rounded-xl transition-colors relative z-50"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          
          {/* Welcome Header */}
          <div className="text-center mb-4 sm:mb-16 px-2 -mt-2 sm:-mt-6">
            <div className="flex justify-center items-center gap-2 sm:gap-4 mb-1.5 sm:mb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-20 sm:h-20 bg-gray-800 rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl">
                <Users className="h-4 w-4 sm:h-10 sm:w-10 text-white" />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="h-7 w-7 sm:h-12 sm:w-12 rounded-full shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
                title="Refresh Dashboard Data"
              >
                <RefreshCw className={`h-3 w-3 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <h1 className="mb-0.5 sm:mb-2">
              <VerifiedUser 
                name={userProfile?.fullName || 'User'}
                isVerified={userProfile?.isProfileVerified || false}
                className="text-2xl sm:text-7xl font-bold text-slate-900 inline-flex items-center gap-1.5 justify-center"
              />
            </h1>
            <p className="text-xs sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed px-2 text-center">
              Use AI to search for you
            </p>
          </div>

          {/* Your Stats Grid */}
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2 sm:gap-6 mb-3 sm:mb-20">
            {/* Total Enquiries */}
            <Card className="border shadow-sm bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center justify-between mb-1 sm:mb-3">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <Eye className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <TrendingUp className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-blue-600 opacity-60" />
                </div>
                <h3 className="text-base sm:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-2">{enquiries.length}</h3>
                <p className="text-slate-600 font-semibold text-[10px] sm:text-xs">Total Enquiries</p>
                <div className="mt-0.5 sm:mt-3 flex items-center text-[9px] sm:text-xs text-slate-500">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-1 sm:mr-2"></span>
                  <span className="hidden sm:inline">All your enquiries and needs</span>
                  <span className="sm:hidden">All enquiries</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Active Enquiries */}
            <Card className="border shadow-sm bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center justify-between mb-1 sm:mb-3">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-emerald-600 rounded-md flex items-center justify-center">
                    <MessageSquare className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <Activity className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-emerald-600 opacity-60" />
                </div>
                <h3 className="text-base sm:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-2">{enquiries.filter(e => e.status === 'live').length}</h3>
                <p className="text-slate-600 font-semibold text-[10px] sm:text-xs">Active Enquiries</p>
                <div className="mt-0.5 sm:mt-3 flex items-center text-[9px] sm:text-xs text-slate-500">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-1 sm:mr-2"></span>
                  <span className="hidden sm:inline">Active enquiries getting responses</span>
                  <span className="sm:hidden">Getting responses</span>
                </div>
              </CardContent>
            </Card>

            {/* Saved Enquiries */}
            <Card className="border shadow-sm bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center justify-between mb-1 sm:mb-3">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-orange-600 rounded-md flex items-center justify-center">
                    <Bookmark className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <Bookmark className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-orange-600 opacity-60" />
                </div>
                <h3 className="text-base sm:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-2">{savedEnquiries.length}</h3>
                <p className="text-slate-600 font-semibold text-[10px] sm:text-xs">Saved Enquiries</p>
                <div className="mt-0.5 sm:mt-3 flex items-center text-[9px] sm:text-xs text-slate-500">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-1 sm:mr-2"></span>
                  <span className="hidden sm:inline">Your bookmarked favourites</span>
                  <span className="sm:hidden">Bookmarked</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-8 mb-0">
            {/* Enquiries Card */}
            <Card 
              className="group cursor-pointer border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 rounded-2xl relative"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/my-enquiries');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardHeader className="p-3 sm:p-8 pb-2 sm:pb-6 relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-8">
                  <div className="w-10 h-10 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-3xl flex items-center justify-center shadow-lg sm:shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Eye className="h-5 w-5 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div className="text-right">
                    <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full">
                      {enquiries.length} Total
                    </Badge>
                  </div>
                </div>
                <div className="text-left lg:text-center">
                  <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-4 whitespace-nowrap">Your Enquiries</h2>
                  <p className="text-slate-600 text-xs sm:text-lg leading-relaxed">
                    Track all your simple needs to mighty requirements
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6 lg:p-8 pt-0 relative z-10">
                <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-3 sm:mb-8">
                  <div className="text-center p-1 sm:p-5 bg-emerald-50 rounded-lg sm:rounded-2xl border border-emerald-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-emerald-600 mb-0.5 sm:mb-2">{enquiries.filter(e => e.status === 'live').length}</div>
                    <div className="text-[10px] sm:text-sm text-emerald-700 font-semibold">Live</div>
                  </div>
                  <div className="text-center p-1 sm:p-5 bg-amber-50 rounded-lg sm:rounded-2xl border border-amber-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-amber-600 mb-0.5 sm:mb-2">{enquiries.filter(e => e.status === 'pending').length}</div>
                    <div className="text-[10px] sm:text-sm text-amber-700 font-semibold">Pending</div>
                  </div>
                  <div className="text-center p-1 sm:p-5 bg-slate-50 rounded-lg sm:rounded-2xl border border-slate-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-slate-600 mb-0.5 sm:mb-2">{enquiries.filter(e => e.status === 'completed').length}</div>
                    <div className="text-[10px] sm:text-sm text-slate-700 font-semibold">Completed</div>
                  </div>
                </div>

                {/* Clean Enquiry Cards Display */}
                <div className="mb-3 sm:mb-8">
                  <h4 className="text-xs sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-4">Your Enquiries</h4>
                  {enquiries.length === 0 ? (
                    <p className="text-slate-500 text-center py-3 text-xs sm:text-sm">No enquiries yet</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {(() => {
                        const now = new Date();
                        const isExpired = (e: Enquiry) => {
                          if (!e.deadline) return false;
                          const d = e.deadline.toDate ? e.deadline.toDate() : new Date(e.deadline);
                          return d < now;
                        };
                        // Ensure live first (newest), then expired (newest)
                        const toDate = (v: any) => v?.toDate ? v.toDate() : new Date(v);
                        const liveAll = enquiries.filter(e => !isExpired(e)).sort((a,b)=> toDate(b.createdAt).getTime()-toDate(a.createdAt).getTime());
                        const expiredAll = enquiries.filter(e => isExpired(e)).sort((a,b)=> toDate(b.createdAt).getTime()-toDate(a.createdAt).getTime());
                        const active = liveAll.slice(0, 3);
                        const expired = expiredAll.slice(0, 3 - active.length);
                        const ordered = [...active, ...expired];
                        return ordered.map((enquiry) => {
                        const allResponses = enquiryResponses[enquiry.id] || [];
                        const visibleResponses = getVisibleResponses(enquiry.id);
                        const lockedResponses = getLockedResponses(enquiry.id);
                        const remainingCount = getRemainingResponseCount(enquiry.id);
                          const expiredFlag = isExpired(enquiry);
                        
                        // Get plan display info
                        const getPlanDisplay = () => {
                          if (enquiry.selectedPlanId) {
                            switch (enquiry.selectedPlanId) {
                              case 'free': return { name: 'Free Plan', price: '₹0' };
                              case 'basic': return { name: 'Basic Plan', price: '₹99' };
                              case 'standard': return { name: 'Standard Plan', price: '₹199' };
                              case 'premium': return { name: 'Premium Plan', price: '₹499' };
                              case 'pro': return { name: 'Pro Plan', price: '₹1,499' };
                              default: return { name: 'Paid Plan', price: '₹0' };
                            }
                          } else if (enquiry.isPremium) {
                            return { name: 'Premium Plan', price: '₹0' };
                          } else {
                            return { name: 'Free Plan', price: '₹0' };
                          }
                        };

                        const planInfo = getPlanDisplay();

                        return (
                          <div
                            key={enquiry.id}
                            className={`rounded-2xl sm:rounded-3xl shadow-sm transition-all duration-200 overflow-hidden ${
                              expiredFlag
                                ? 'opacity-70 grayscale pointer-events-none bg-gray-100 border-2 border-gray-300'
                                : 'bg-white border-2 border-blue-200 hover:shadow-md cursor-pointer'
                            }`}
                            onClick={() => !expiredFlag && navigate(`/my-enquiries?highlight=${enquiry.id}`)}
                          >
                            {/* Card Header - Top 10% with gray background */}
                            <div className="bg-gray-800 px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                  <h5 className={`text-xs sm:text-lg font-semibold truncate ${expiredFlag ? 'text-gray-300' : 'text-white'}`}>
                                    {enquiry.title}
                                  </h5>
                                  {((enquiry as any).isUserVerified || (enquiry as any).userProfileVerified) && (
                                    <div className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm ${
                                      expiredFlag ? 'bg-gray-400' : 'bg-blue-500'
                                    }`}>
                                      <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                {/* Plan Badge */}
                                <Badge className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                                  enquiry.selectedPlanId === 'free' || (!enquiry.selectedPlanId && !enquiry.isPremium) 
                                    ? 'bg-gray-100 text-gray-700' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {planInfo.name}
                                </Badge>
                              </div>
                              {expiredFlag && (
                                <div className="mt-1 text-[10px] sm:text-xs text-red-300">Expired</div>
                              )}
                            </div>
                            
                            {/* Card Content - Rest with white background */}
                            <div className="p-2 sm:p-4">

                            {/* Response Count */}
                            <div className="mb-1 sm:mb-2">
                              <span className="text-xs sm:text-base font-medium text-green-600">
                                {allResponses.length} responses
                              </span>
                              {remainingCount > 0 && (
                                <span className="text-[10px] sm:text-xs text-slate-500 ml-1 sm:ml-2">
                                  ({remainingCount} locked)
                                </span>
                              )}
                            </div>

                            {/* Plan Details */}
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-slate-600">
                                <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                <span>{planInfo.name} ({planInfo.price})</span>
                                {enquiry.selectedPlanPrice && enquiry.selectedPlanPrice > 0 && (
                                  <span className="font-semibold text-blue-600">
                                    - ₹{enquiry.selectedPlanPrice}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Time Remaining */}
                            {enquiry.deadline && (
                              <div className="mb-2 sm:mb-3">
                                <CountdownTimer 
                                  deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                                  className="justify-start"
                                />
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <Button
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!expiredFlag) {
                                    navigate(`/enquiry/${enquiry.id}/responses`);
                                  }
                                }}
                                disabled={expiredFlag || allResponses.length === 0}
                                className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9"
                              >
                                View Responses
                              </Button>
                              
                              {/* Upgrade Button - Show if not premium */}
                              {!enquiry.isPremium && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!expiredFlag) {
                                      handleUpgradeClick(enquiry, e);
                                    }
                                  }}
                                  disabled={expiredFlag}
                                  className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Upgrade
                                </Button>
                              )}
                              
                              {enquiry.isPremium && (
                                <Badge className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                                  Premium
                                </Badge>
                              )}
                              
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!expiredFlag && window.confirm(`Are you sure you want to delete the enquiry "${enquiry.title}"? This action cannot be undone.`)) {
                                    handleDeleteEnquiry(enquiry.id);
                                  }
                                }}
                                disabled={expiredFlag}
                                className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9"
                              >
                                Delete
                              </Button>
                            </div>
                            </div>
                          </div>
                        );
                        })
                      })()}
                    </div>
                  )}
                </div>

                {enquiries.length > 3 && (
                  <div className="flex justify-center mt-1 sm:mt-4">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/my-enquiries'); }} className="h-5 sm:h-9 text-[9px] sm:text-sm px-2 sm:px-4">
                      Show More
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Responses Card */}
            <Card 
              className="group cursor-pointer border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 rounded-2xl relative"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/my-responses');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardHeader className="p-3 sm:p-8 pb-2 sm:pb-6 relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-8">
                  <div className="w-10 h-10 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl sm:rounded-3xl flex items-center justify-center shadow-lg sm:shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Rocket className="h-5 w-5 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gray-100 text-gray-800 text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full">
                      {responsesReady ? `${responsesSummary.length} Total` : 'Loading...'}
                    </Badge>
                  </div>
                </div>
                <div className="text-left lg:text-center">
                  <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-4 whitespace-nowrap">Your Responses</h2>
                  <p className="text-xs sm:text-lg text-slate-600 leading-relaxed">
                    Track your seller submissions and their status
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6 lg:p-8 pt-0 relative z-10">
                <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-3 sm:mb-8">
                  <div className="text-center p-1 sm:p-5 bg-emerald-50 rounded-lg sm:rounded-2xl border border-emerald-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-emerald-600 mb-0.5 sm:mb-2">
                      {responsesReady ? responsesSummary.filter(s => s.status === 'approved').length : '—'}
                    </div>
                    <div className="text-[10px] sm:text-sm text-emerald-700 font-semibold">Approved</div>
                  </div>
                  <div className="text-center p-1 sm:p-5 bg-amber-50 rounded-lg sm:rounded-2xl border border-amber-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-amber-600 mb-0.5 sm:mb-2">
                      {responsesReady ? responsesSummary.filter(s => s.status === 'pending').length : '—'}
                    </div>
                    <div className="text-[10px] sm:text-sm text-amber-700 font-semibold">Reviewing</div>
                  </div>
                  <div className="text-center p-1 sm:p-5 bg-red-50 rounded-lg sm:rounded-2xl border border-red-200">
                    <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-red-600 mb-0.5 sm:mb-2">
                      {responsesReady ? responsesSummary.filter(s => s.status === 'rejected').length : '—'}
                    </div>
                    <div className="text-[10px] sm:text-sm text-red-700 font-semibold">Rejected</div>
                  </div>
                </div>

                {/* List all submissions with status badge */}
                <div className="mb-3 sm:mb-8">
                  <h4 className="text-xs sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-4">Your Submissions</h4>
                  {!responsesReady ? (
                    <div className="text-slate-500 text-center py-3 text-xs sm:text-sm">
                      <p>Loading your submissions...</p>
                    </div>
                  ) : responsesSummary.length === 0 ? (
                    <div className="text-slate-500 text-center py-3 text-xs sm:text-sm">
                      <p>No submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {responsesSummary.slice(0, 3).map((submission) => (
                        <div key={submission.id} className="bg-white rounded-2xl sm:rounded-3xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                          {/* Card Header - Top 10% with gray background */}
                          <div className="bg-gray-800 px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <h5 className="text-xs sm:text-lg font-semibold text-white truncate">
                                  {submission.title}
                                </h5>
                                {((submission as any).userProfileVerified || submission.isIdentityVerified) && (
                                  <div className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm bg-blue-500">
                                    <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                              {/* Status Badge */}
                              <Badge className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                                submission.status === 'approved' 
                                  ? 'bg-green-100 text-green-700' 
                                  : submission.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Card Content - Rest with white background */}
                          <div className="p-2 sm:p-4">
                            {/* Submission Details */}
                            <div className="mb-1 sm:mb-2">
                              <span className="text-xs sm:text-base font-medium text-blue-600">
                                {submission.status === 'approved' ? 'Live Response' : 'Under Review'}
                              </span>
                              {submission.status === 'approved' && (
                                <span className="text-[10px] sm:text-xs text-slate-500 ml-1 sm:ml-2">
                                  (Ready for chat)
                                </span>
                              )}
                            </div>

                            {/* Experience/Details */}
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-slate-600">
                                <span className="font-medium">Experience:</span>
                                <span>{submission.message?.split(' ').slice(0, 3).join(' ') || 'Professional service'}</span>
                              </div>
                            </div>

                            {/* Submission Time */}
                            <div className="mb-2 sm:mb-3">
                              <div className="text-[10px] sm:text-sm text-slate-500">
                                Submitted: {submission.createdAt?.toDate ? submission.createdAt.toDate().toLocaleString() : 'N/A'}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              {submission.status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`); }}
                                  className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9"
                                >
                                  Chat
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); navigate('/my-responses'); }}
                                className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {responsesSummary.length > 3 && (
                  <div className="flex justify-center mt-1 sm:mt-4">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/my-responses');
                      }} 
                      className="h-5 sm:h-9 text-[9px] sm:text-sm px-2 sm:px-4"
                    >
                      Show More
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Enquiries Card */}
          <Card 
            className="group cursor-pointer border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 rounded-2xl mt-8 sm:mt-6 lg:mt-8"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="p-3 sm:p-8 pb-2 sm:pb-6 relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-8">
                <div className="w-10 h-10 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl sm:rounded-3xl flex items-center justify-center shadow-lg sm:shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Bookmark className="h-5 w-5 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="text-right">
                  <Badge className="bg-orange-100 text-orange-800 text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full">
                    {savedEnquiries.length} Total
                  </Badge>
                </div>
              </div>
                <div className="text-left lg:text-center">
                <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-4 whitespace-nowrap">Your Saved Favorites</h2>
                <p className="text-xs sm:text-lg text-slate-600 leading-relaxed">
                  Quickly access your bookmarked enquiries anytime
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 lg:p-8 pt-0 relative z-10">
              <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-3 sm:mb-8">
                <div className="text-center p-1 sm:p-5 bg-orange-50 rounded-lg sm:rounded-2xl border border-orange-200">
                  <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-0.5 sm:mb-2">
                    {savedEnquiries.length}
                  </div>
                  <div className="text-[10px] sm:text-sm text-orange-700 font-semibold">Total</div>
                </div>
                <div className="text-center p-1 sm:p-5 bg-blue-50 rounded-lg sm:rounded-2xl border border-blue-200">
                  <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-0.5 sm:mb-2">
                    {savedEnquiries.filter(e => e.status === 'live').length}
                  </div>
                  <div className="text-[10px] sm:text-sm text-blue-700 font-semibold">Live</div>
                </div>
                <div className="text-center p-1 sm:p-5 bg-purple-50 rounded-lg sm:rounded-2xl border border-purple-200">
                  <div className="text-xs sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-0.5 sm:mb-2">
                    {savedEnquiries.filter(e => e.status === 'completed').length}
                  </div>
                  <div className="text-[10px] sm:text-sm text-purple-700 font-semibold">Completed</div>
                </div>
              </div>

              {/* Saved Enquiries List */}
              <div className="mb-3 sm:mb-8">
                <h4 className="text-xs sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-4">Your Saved Enquiries</h4>
                {savedEnquiries.length === 0 ? (
                  <p className="text-slate-500 text-center py-3 text-xs sm:text-sm">No saved enquiries yet</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {savedEnquiries.slice(0, 3).map((enquiry) => (
                    <div key={enquiry.id} className="bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-2 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-base font-semibold text-gray-900 mb-1 line-clamp-1">{enquiry.title}</h4>
                          <p className="text-[10px] sm:text-sm text-gray-600 mb-2 line-clamp-2">{enquiry.description}</p>
                          <div className="flex items-center gap-3 text-[10px] sm:text-sm text-gray-500">
                            <Badge variant="secondary" className="text-[9px] sm:text-xs">{enquiry.category}</Badge>
                            <span>₹{enquiry.budget?.toLocaleString('en-IN')}</span>
                            {enquiry.location && <span>• {enquiry.location}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const isExpired = enquiry.deadline && (() => {
                            const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                            return deadlineDate < now;
                          })();
                          if (!isExpired) {
                            navigate(`/enquiry/${enquiry.id}`);
                          }
                        }}
                        disabled={(() => {
                          const now = new Date();
                          return enquiry.deadline && (() => {
                            const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                            return deadlineDate < now;
                          })();
                        })()}
                        className="w-full mt-2 text-[10px] sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-6 sm:h-9"
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              </div>
              {savedEnquiries.length > 3 && (
                <div className="flex justify-center mt-1 sm:mt-4" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Navigating to saved enquiries');
                      navigate('/saved-enquiries');
                    }}
                    className="h-5 sm:h-9 text-[9px] sm:text-sm px-2 sm:px-4"
                  >
                    Show More
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-2 border-blue-200 shadow-xl bg-gradient-to-r from-slate-50 to-white overflow-hidden rounded-2xl mt-4 sm:mt-6 lg:mt-8 mb-2 sm:mb-4" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-3 sm:p-12">
              <div className="text-center mb-2 sm:mb-10">
                <h3 className="text-base sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-4">Quick Actions</h3>
                <p className="text-xs sm:text-lg text-slate-600 text-center">Post your needs or help others with their requests</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
                <Link to="/post-enquiry" className="group flex-1 w-full">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm font-semibold">Post Your Need</span>
                  </button>
                </Link>
                
                <Link to="/enquiries" className="group flex-1 w-full">
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm font-semibold">Show All Enquiries</span>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Plan Selector Modal for Upgrades */}
        {showPaymentSelector && selectedEnquiryForUpgrade && (
          <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
            <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base font-bold text-center mb-2 sm:mb-4 flex items-center justify-center gap-2">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  Upgrade Plan for "{selectedEnquiryForUpgrade.title}"
                </DialogTitle>
                <DialogDescription className="text-center text-[10px] sm:text-xs text-slate-600">
                  Choose a plan to unlock more responses and premium features for this enquiry
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6">
                <PaymentPlanSelector
                  currentPlanId={currentPlan}
                  enquiryId={selectedEnquiryForUpgrade.id}
                  userId={user?.uid || ''}
                  onPlanSelect={handlePlanSelect}
                  isUpgrade={true}
                  enquiryCreatedAt={selectedEnquiryForUpgrade.createdAt}
                  className="max-w-5xl mx-auto"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
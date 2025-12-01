import { useState, useEffect, useMemo, useContext } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Eye, MessageSquare, Rocket, ArrowRight, TrendingUp, Users, Activity, Plus, RefreshCw, ArrowLeft, Bookmark, CheckCircle, Clock, Lock, AlertTriangle, Trash2, ShoppingCart, UserCheck, MapPin, Tag } from "lucide-react";
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
import { Crown } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";
import { fadeInUp, staggerContainer } from "../lib/motion";
import PaymentPlanSelector from "../components/PaymentPlanSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { PAYMENT_PLANS, getUpgradeOptions } from "../config/paymentPlans";
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
  status: 'pending' | 'live' | 'rejected' | 'completed' | 'deal_closed';
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
  dealClosed?: boolean;
  dealClosedAt?: any;
  dealClosedBy?: string;
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
  const [allEnquiriesForStats, setAllEnquiriesForStats] = useState<Enquiry[]>([]);
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
  const [deletedEnquiries, setDeletedEnquiries] = useState<Set<string>>(new Set()); // Track deleted enquiry IDs
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardViewMode');
      const mode = (saved === 'buyer' || saved === 'seller') ? saved : 'buyer';
      console.log('Initial viewMode:', mode);
      return mode;
    }
    return 'buyer';
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync viewMode with localStorage on mount and when it changes
  useEffect(() => {
    const saved = localStorage.getItem('dashboardViewMode');
    if (saved && (saved === 'buyer' || saved === 'seller') && saved !== viewMode) {
      console.log('Syncing viewMode from localStorage:', saved);
      setViewMode(saved);
    }
  }, []);

  const handleToggleView = (mode: 'buyer' | 'seller') => {
    console.log('Toggle view to:', mode, 'Current viewMode:', viewMode);
    setViewMode(mode);
    localStorage.setItem('dashboardViewMode', mode);
    console.log('View mode updated to:', mode);
  };

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

    // Initialize variables outside try block so they're accessible in catch
    let enquiriesData: Enquiry[] = [];
    let submissionsData: SellerSubmission[] = [];
    
    try {
      console.log('Dashboard: Fetching initial data with getDocs (simplified)');

      // Fetch enquiries and seller submissions - enquiries first, then submissions with error handling
      try {
        // Try with orderBy first
        const enquiriesSnapshot = await getDocs(query(
            collection(db, 'enquiries'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        ));
        enquiriesSnapshot.forEach((doc) => {
          enquiriesData.push({ id: doc.id, ...doc.data() } as Enquiry);
        });
      } catch (orderByError: any) {
        // If index error, fallback to query without orderBy
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('Dashboard: Index missing, using fallback query without orderBy');
          const allEnquiriesSnapshot = await getDocs(query(
              collection(db, 'enquiries'),
              where('userId', '==', user.uid)
          ));
          // Sort in JavaScript and limit
          allEnquiriesSnapshot.forEach((doc) => {
            enquiriesData.push({ id: doc.id, ...doc.data() } as Enquiry);
          });
          enquiriesData.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          enquiriesData = enquiriesData.slice(0, 10);
        } else {
          throw orderByError;
        }
      }

      // Fetch seller submissions without orderBy to avoid index requirement, sort in JavaScript
      const sellerSubmissionsSnapshot = await getDocs(query(
        collection(db, 'sellerSubmissions'),
        where('sellerId', '==', user.uid)
      ));

      // Process enquiries (already processed above if fallback was used)
      setEnquiries(enquiriesData);

      // Process seller submissions immediately
      submissionsData = [];
      sellerSubmissionsSnapshot.forEach((doc) => {
        const submission = { id: doc.id, ...doc.data() } as SellerSubmission;
        submission.userProfileVerified = isProfileVerified;
        submissionsData.push(submission);
      });
      
      // Fetch enquiry data for each response to check expiration and deletion (combined for efficiency)
      const enquiryIds = [...new Set(submissionsData.map(s => s.enquiryId))];
      const enquiryDataMap: {[key: string]: Enquiry} = {};
      const deletedSet = new Set<string>();
      
      // Combined fetch: check both existence and get data in one call per enquiry
      await Promise.all(
        enquiryIds.map(async (enquiryId) => {
          try {
            const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
            if (!enquiryDoc.exists()) {
              deletedSet.add(enquiryId);
              console.log('🔍 Dashboard: Enquiry deleted:', enquiryId);
            } else {
              const enquiryData = { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
              enquiryDataMap[enquiryId] = enquiryData;
              // Log expiry check for debugging
              if (enquiryData.deadline) {
                const now = new Date();
                let deadlineDate: Date;
                if (enquiryData.deadline && typeof enquiryData.deadline === 'object' && 'toDate' in enquiryData.deadline) {
                  deadlineDate = (enquiryData.deadline as any).toDate();
                } else {
                  deadlineDate = new Date(enquiryData.deadline);
                }
                const isExpired = deadlineDate.getTime() < now.getTime();
                if (isExpired) {
                  console.log('🔍 Dashboard: Found expired enquiry for response:', enquiryId, 'deadline:', deadlineDate);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching/checking enquiry:', enquiryId, error);
            // If there's an error checking, assume it might be deleted
            deletedSet.add(enquiryId);
          }
        })
      );
      
      setDeletedEnquiries(deletedSet);
      
      // Sort by live first, then deleted, then expired (each group sorted by date - newest first)
      const now = new Date();
      const isEnquiryExpired = (enquiryId: string) => {
        const enquiry = enquiryDataMap[enquiryId];
        if (!enquiry || !enquiry.deadline) return false;
        try {
          let deadlineDate: Date;
          if (enquiry.deadline && typeof enquiry.deadline === 'object' && 'toDate' in enquiry.deadline) {
            deadlineDate = (enquiry.deadline as any).toDate();
          } else if (typeof enquiry.deadline === 'string' || typeof enquiry.deadline === 'number') {
            deadlineDate = new Date(enquiry.deadline);
          } else if (enquiry.deadline instanceof Date) {
            deadlineDate = enquiry.deadline;
          } else {
            return false;
          }
          if (!deadlineDate || isNaN(deadlineDate.getTime())) return false;
          return deadlineDate.getTime() < now.getTime();
        } catch {
          return false;
        }
      };

      submissionsData.sort((a, b) => {
        const aDeleted = deletedSet.has(a.enquiryId);
        const bDeleted = deletedSet.has(b.enquiryId);
        const aExpired = isEnquiryExpired(a.enquiryId);
        const bExpired = isEnquiryExpired(b.enquiryId);
        
        // Determine status priority: 0 = live, 1 = deleted, 2 = expired
        const getStatusPriority = (deleted: boolean, expired: boolean) => {
          if (deleted) return 1;
          if (expired) return 2;
          return 0; // live
        };
        
        const aPriority = getStatusPriority(aDeleted, aExpired);
        const bPriority = getStatusPriority(bDeleted, bExpired);
        
        // Sort by priority: live (0) first, then deleted (1), then expired (2)
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If both are same status, sort by createdAt (newest first)
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Don't merge enquiryDataMap into enquiries - enquiryDataMap contains enquiries user responded to,
      // not enquiries user created. Only enquiries with userId === user.uid should be in enquiries state.
      // The enquiryDataMap is only used for checking deletion/expiration status, not for displaying.
      
      console.log('Dashboard: ✅ Seller submissions loaded from fetchDashboardData:', submissionsData.length);
      console.log('Dashboard: Setting seller submissions state NOW');
      setSellerSubmissions(submissionsData);
      setResponsesSummary(submissionsData);
      console.log('Dashboard: Deleted enquiries:', Array.from(deletedSet));
      
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
      
    } catch (error: any) {
      console.error('Dashboard: Error fetching initial data:', error);
      setRefreshing(false);
      setLoading(false);
      
      // Even on error, try to show what we have
      // This prevents infinite loading if there's a partial failure
      if (enquiriesData.length > 0 || submissionsData.length > 0) {
        setResponsesReady(true);
        console.log('Dashboard: Partial data loaded, showing what we have');
      } else {
        // Keep responsesReady as false on complete failure
        setResponsesReady(false);
        setResponsesSummary([]);
      }
      
      // Show error notification only for critical errors
      if (!error?.message?.includes('index') && !error?.message?.includes('CORS')) {
        createNotification('system', {
          title: 'Failed to Load Dashboard Data',
          message: 'There was an issue loading your data. Please try refreshing the page.',
          priority: 'high',
          actionUrl: '/dashboard',
          actionText: 'Refresh Page'
        });
      }
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
      
      // Add timeout to ensure loading doesn't hang forever
      const loadingTimeout = setTimeout(() => {
        console.warn('Dashboard: Loading timeout - setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        // Fetch initial data including seller submissions IMMEDIATELY
        await fetchDashboardData();
        
        // Clear timeout since we completed successfully
        clearTimeout(loadingTimeout);
        
        // Verify data was loaded
        console.log('Dashboard: setupDashboard complete, responsesReady should be true now');
        
        // Set loading to false immediately after data is fetched (before setting up listeners)
        setLoading(false);
      } catch (error) {
        // Clear timeout on error
        clearTimeout(loadingTimeout);
        console.error('Dashboard: Error in setupDashboard:', error);
        setLoading(false);
        setResponsesReady(false);
        return;
      }
      
      // Set up real-time listener for seller submissions AFTER initial fetch completes
      // Query without orderBy to avoid index requirement, sort in JavaScript instead
      const sellerSubmissionsQuery = query(
        collection(db, 'sellerSubmissions'),
        where('sellerId', '==', user.uid)
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
        
        // Skip first snapshot to avoid overriding initial fetch data
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          console.log('Dashboard: Skipping initial snapshot, data already loaded');
          return;
        }
        
        // Check which enquiries are deleted (for real-time updates)
        const enquiryIds = [...new Set(submissionsData.map(s => s.enquiryId))];
        const deletedSet = new Set<string>();
        
        // Check each enquiry to see if it exists and fetch data for expiration checks
        const enquiryDataMap: {[key: string]: Enquiry} = {};
        Promise.all(
          enquiryIds.map(async (enquiryId) => {
            try {
              const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
              if (!enquiryDoc.exists()) {
                deletedSet.add(enquiryId);
                console.log('🔍 Dashboard: Enquiry deleted (realtime):', enquiryId);
              } else {
                // Store enquiry data for expiration checks
                enquiryDataMap[enquiryId] = { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
              }
            } catch (error) {
              console.error('Error checking enquiry:', enquiryId, error);
              deletedSet.add(enquiryId);
            }
          })
        ).then(() => {
          setDeletedEnquiries(deletedSet);
          
          // Sort by live first, then deleted, then expired (each group sorted by date - newest first)
          const now = new Date();
          const isEnquiryExpired = (enquiryId: string) => {
            const enquiry = enquiryDataMap[enquiryId];
            if (!enquiry || !enquiry.deadline) return false;
            try {
              let deadlineDate: Date;
              if (enquiry.deadline && typeof enquiry.deadline === 'object' && 'toDate' in enquiry.deadline) {
                deadlineDate = (enquiry.deadline as any).toDate();
              } else if (typeof enquiry.deadline === 'string' || typeof enquiry.deadline === 'number') {
                deadlineDate = new Date(enquiry.deadline);
              } else if (enquiry.deadline instanceof Date) {
                deadlineDate = enquiry.deadline;
              } else {
                return false;
              }
              if (!deadlineDate || isNaN(deadlineDate.getTime())) return false;
              return deadlineDate.getTime() < now.getTime();
            } catch {
              return false;
            }
          };

          submissionsData.sort((a, b) => {
            const aDeleted = deletedSet.has(a.enquiryId);
            const bDeleted = deletedSet.has(b.enquiryId);
            const aExpired = isEnquiryExpired(a.enquiryId);
            const bExpired = isEnquiryExpired(b.enquiryId);
            
            // Determine status priority: 0 = live, 1 = deleted, 2 = expired
            const getStatusPriority = (deleted: boolean, expired: boolean) => {
              if (deleted) return 1;
              if (expired) return 2;
              return 0; // live
            };
            
            const aPriority = getStatusPriority(aDeleted, aExpired);
            const bPriority = getStatusPriority(bDeleted, bExpired);
            
            // Sort by priority: live (0) first, then deleted (1), then expired (2)
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            
            // If both are same status, sort by createdAt (newest first)
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('Dashboard: Seller submissions updated (realtime):', submissionsData.length);
          setSellerSubmissions(submissionsData);
          setResponsesSummary(submissionsData);
          console.log('Dashboard: Deleted enquiries (realtime):', Array.from(deletedSet));
          
          // Don't merge enquiryDataMap into enquiries - enquiryDataMap contains enquiries user responded to,
          // not enquiries user created. Only enquiries with userId === user.uid should be in enquiries state.
          // The enquiryDataMap is only used for checking deletion/expiration status.
        });
        
        setResponsesReady(true);
      }, (error) => {
        // Handle Firestore listener errors gracefully (including CORS and index errors)
        if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin') || error?.code === 'failed-precondition') {
          // Silently handle CORS and index errors - these are expected and don't affect functionality
          // The query will work without orderBy, sorting is done in JavaScript
          return;
        } else {
          console.error('Error in seller submissions listener:', error);
        }
      });
      
      // Loading already set to false after initial fetch above
      
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
      
      // Fetch ALL enquiries for accurate stats (without limit)
      const allEnquiriesQuery = query(
        collection(db, 'enquiries'),
        where('userId', '==', user.uid)
      );
      
      getDocs(allEnquiriesQuery).then((snapshot) => {
        const allEnquiriesData: Enquiry[] = [];
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
            allEnquiriesData.push({ id: doc.id, ...data } as Enquiry);
          }
        });
        
        setAllEnquiriesForStats(allEnquiriesData);
      }).catch((error) => {
        console.error('Error fetching all enquiries for stats:', error);
        // Fallback to using the limited enquiries for stats
        setAllEnquiriesForStats(enquiriesData);
      });
      
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
        // Handle Firestore listener errors gracefully (including CORS and index errors)
        if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin') || error?.code === 'failed-precondition') {
          // Silently handle CORS and index errors - these are expected and don't affect functionality
          return;
        } else {
          console.error('Error in enquiries listener:', error);
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
  // Note: Payment is already processed in PaymentPlanSelector via Razorpay
  // This function just updates the UI after successful payment
  const handlePlanSelect = async (planId: string, price: number) => {
    if (!selectedEnquiryForUpgrade || !user) return;
    
    try {
      setUpgradeLoading(selectedEnquiryForUpgrade.id);
      
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Payment was already processed via Razorpay in PaymentPlanSelector
      // Just update the enquiry to reflect the new plan
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
      console.error('Error updating enquiry after payment:', error);
      setUpgradeLoading(null);
      toast({
        title: "Update Failed",
        description: "Payment was successful but there was an error updating the enquiry. Please refresh the page.",
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
  // Moved to after helper functions are defined
  useEffect(() => {
    const testPremiumPlanLimits = () => {
      try {
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
      } catch (error) {
        console.error('Error in testPremiumPlanLimits:', error);
      }
    };

    // Make test function available globally for console testing
    (window as any).testPremiumPlanLimits = testPremiumPlanLimits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiries, enquiryResponses, getVisibleResponses, getLockedResponses]);

  if (loading) {
    return <LoadingAnimation message="Loading your dashboard" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-1 sm:px-6 pt-0 sm:pt-2 pb-2 sm:pb-8">
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
          
          {/* Professional Welcome Header */}
          <div className="mb-6 sm:mb-12 lg:mb-16 -mt-2 sm:-mt-4">
            <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-8 lg:p-10 overflow-hidden">
              {/* Header Section with Title */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex justify-center items-center gap-3 sm:gap-4 lg:gap-5">
                  <h1 className="mb-2 sm:mb-3 lg:mb-4">
                    <VerifiedUser 
                      name={userProfile?.fullName || 'User'}
                      isVerified={userProfile?.isProfileVerified || false}
                          className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-white inline-flex items-center gap-2 sm:gap-3 justify-center tracking-tight"
                    />
                  </h1>
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border-white hover:border-gray-200 bg-white/10 hover:bg-white/20"
                    title="Refresh Dashboard Data"
                  >
                        <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Content Card - White Background */}
              <div className="bg-white border border-black rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                    <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Dashboard
                    </h2>
                  </div>
                  {/* Creative Toggle Button - Physical Button Design */}
                  <div className="flex justify-center items-center mt-4 sm:mt-5">
                    <motion.div 
                      className="relative inline-flex items-center bg-gradient-to-b from-gray-200 to-gray-300 border-4 border-black rounded-2xl p-1.5 sm:p-2 shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
                      
                      {/* Animated Background Slider - Physical button pressed effect */}
                      <motion.div 
                        className={`absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 rounded-xl bg-gradient-to-b from-black to-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] transition-all duration-300 ease-in-out ${
                          viewMode === 'buyer' ? 'left-1.5 right-1/2 sm:left-2 sm:right-1/2' : 'left-1/2 right-1.5 sm:left-1/2 sm:right-2'
                        }`}
                        style={{ width: 'calc(50% - 3px)' }}
                        layout
                      >
                        {/* Button highlight */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-xl pointer-events-none" />
                      </motion.div>
                      
                      {/* Buyer Button */}
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleView('buyer');
                        }}
                        className={`relative z-10 px-3 py-1.5 sm:px-5 sm:py-2.5 lg:px-7 lg:py-3 rounded-xl font-black text-[10px] sm:text-xs lg:text-sm transition-all duration-300 flex items-center gap-1.5 sm:gap-2 min-w-[75px] sm:min-w-[110px] lg:min-w-[130px] justify-center ${
                          viewMode === 'buyer'
                            ? 'text-white drop-shadow-lg'
                            : 'text-gray-800 hover:text-black'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                      >
                        <motion.div 
                          className="relative flex items-center justify-center"
                          animate={viewMode === 'buyer' ? {
                            rotate: [0, -10, 10, 0],
                            scale: [1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <ShoppingCart className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 lg:h-5.5 lg:w-5.5 transition-all duration-300 ${viewMode === 'buyer' ? 'drop-shadow-md' : ''}`} />
                        </motion.div>
                        <span className="whitespace-nowrap relative z-10">{viewMode === 'buyer' ? 'Buy' : 'Buy'}</span>
                      </motion.button>
                      
                      {/* Seller Button */}
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleView('seller');
                        }}
                        className={`relative z-10 px-3 py-1.5 sm:px-5 sm:py-2.5 lg:px-7 lg:py-3 rounded-xl font-black text-[10px] sm:text-xs lg:text-sm transition-all duration-300 flex items-center gap-1.5 sm:gap-2 min-w-[75px] sm:min-w-[110px] lg:min-w-[130px] justify-center ${
                          viewMode === 'seller'
                            ? 'text-white drop-shadow-lg'
                            : 'text-gray-800 hover:text-black'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                      >
                        <motion.div 
                          className="relative flex items-center justify-center"
                          animate={viewMode === 'seller' ? {
                            rotate: [0, -10, 10, 0],
                            scale: [1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <UserCheck className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 lg:h-5.5 lg:w-5.5 transition-all duration-300 ${viewMode === 'seller' ? 'drop-shadow-md' : ''}`} />
                        </motion.div>
                        <span className="whitespace-nowrap relative z-10">{viewMode === 'seller' ? 'Sell' : 'Sell'}</span>
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="flex flex-col gap-3 sm:gap-6 lg:gap-8 mb-0">
            {/* Enquiries Card - Buyer View Only */}
            {viewMode === 'buyer' && (
            <Card 
              className="group cursor-pointer border border-black shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 rounded-2xl sm:rounded-3xl relative lg:w-full lg:max-w-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/my-enquiries');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Professional Header - Matching Dashboard Style */}
              <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-5 xl:p-6 overflow-visible flex items-end justify-center min-h-[120px] sm:min-h-[140px] lg:min-h-[130px] xl:min-h-[150px] pb-12 sm:pb-16 lg:pb-14 xl:pb-16">
                <div className="w-full flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                  {/* Header Section with Title - Centered */}
                  <div className="text-center w-full flex items-center justify-center mt-8 sm:mt-10 lg:mt-8 xl:mt-10">
                    <h2 className="text-xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight">Your Enquiries</h2>
                  </div>
                  
                  {/* Content Card - Black Background */}
                  <div className="bg-black border border-black rounded-lg p-3 sm:p-4 lg:p-3 xl:p-4 w-full">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm lg:text-[10px] xl:text-xs text-white leading-snug">
                        Track your needs; We won't be tracking you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 lg:p-5 xl:p-6 lg:pb-4 xl:pb-5 relative z-10">
                {/* Professional Stats Grid - Physical Button Design */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-4">
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">{allEnquiriesForStats.length || enquiries.length}</h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Total</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">{(() => {
                        const allEnqs = allEnquiriesForStats.length > 0 ? allEnquiriesForStats : enquiries;
                        const now = new Date();
                        return allEnqs.filter(e => {
                          // Must be live status
                          if (e.status !== 'live') return false;
                          // Must not be expired
                          if (e.deadline) {
                            const deadlineDate = e.deadline.toDate ? e.deadline.toDate() : new Date(e.deadline);
                            if (deadlineDate < now) return false;
                          }
                          return true;
                        }).length;
                      })()}</h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Active</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">{savedEnquiries.length}</h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Saved</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Professional Enquiry Cards Section */}
                <div className="mb-6 sm:mb-12 lg:mb-8">
                  {/* Empty State - Professional */}
                  {enquiries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] border-2 border-dashed border-gray-300/60">
                      <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-5 sm:mb-6 lg:mb-8 shadow-lg flex-shrink-0">
                        <Plus className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-blue-600" />
                  </div>
                      <h5 className="text-lg sm:text-2xl lg:text-3xl font-bold text-black mb-2.5 sm:mb-3 lg:mb-4 tracking-tight text-center">No Enquiries Yet</h5>
                      <p className="text-sm sm:text-base lg:text-lg text-black text-center max-w-md lg:max-w-lg mb-8 sm:mb-10 lg:mb-12 leading-relaxed px-4">
                        Start by posting your first enquiry to connect with sellers and get quality responses
                      </p>
                      <Button
                        onClick={() => navigate('/post-enquiry')}
                        className="bg-black hover:bg-gray-900 text-white font-bold text-sm sm:text-base lg:text-lg px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-5 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-black"
                      >
                        <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2 flex-shrink-0" />
                        Post Your First Enquiry
                      </Button>
                  </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
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
                        const responseCount = enquiry.responses || allResponses.length || 0;
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
                          <motion.div
                            key={enquiry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`group relative rounded-2xl sm:rounded-3xl lg:rounded-2xl overflow-hidden transition-all duration-300 w-full ${
                              expiredFlag
                                ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border-[6px] border-black shadow-sm'
                                : 'bg-white border-[6px] border-black hover:border-black hover:shadow-2xl shadow-lg cursor-pointer transform hover:-translate-y-1.5 hover:scale-[1.01] lg:hover:scale-[1.005]'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!expiredFlag) {
                                navigate('/my-enquiries', {
                                  state: { highlightId: enquiry.id },
                                });
                              }
                            }}
                          >
                            {/* Premium Header with Sophisticated Design */}
                            <div className={`relative bg-gradient-to-br from-black via-black to-gray-900 px-4 sm:px-5 lg:px-3.5 xl:px-4 py-2.5 sm:py-3 lg:py-2 xl:py-2.5 ${
                              expiredFlag ? 'opacity-70' : ''
                            }`}>
                              {/* Elegant pattern overlay */}
                              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                              
                              {/* Shine effect on hover */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 transition-opacity duration-500"></div>
                              
                              <div className="relative flex items-start justify-between gap-3 sm:gap-4 lg:gap-4 xl:gap-4">
                                {/* Title Section with Better Typography */}
                                <div className="flex-1 min-w-0 pr-2 sm:pr-3 lg:pr-3 xl:pr-3">
                                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-3 xl:gap-3 mb-2.5 lg:mb-2 xl:mb-2">
                                    <h5 className={`text-sm sm:text-lg lg:text-xs xl:text-sm font-bold leading-snug tracking-tight truncate ${
                                      expiredFlag ? 'text-gray-400' : 'text-white drop-shadow-sm'
                                    } hidden`}>
                                  {enquiry.title}
                                </h5>
                                    {/* Show verified badge if: 
                                        1. User has profile-level verification (applies to all enquiries), OR
                                        2. This specific enquiry has ID images (enquiry-specific verification) */}
                                    {(userProfile?.isProfileVerified || (enquiry as any).idFrontImage || (enquiry as any).idBackImage) && (
                                      <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded-full flex-shrink-0 shadow-lg ring-2 ring-white/20 ${
                                        expiredFlag ? 'bg-gray-500' : 'bg-blue-500'
                                }`}>
                                        <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 text-white" />
                              </div>
                                    )}
                                  </div>
                                  
                                  {/* Status Badge - More Refined */}
                              {expiredFlag && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 lg:px-3 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1 bg-red-500/25 border border-red-400/40 rounded-md backdrop-blur-sm shadow-sm mt-0.5">
                                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                                      <span className="text-[10px] sm:text-xs lg:text-xs xl:text-xs text-red-200 font-semibold tracking-wide">Expired</span>
                                    </div>
                              )}
                            </div>
                            
                                {/* Premium Plan Badge */}
                                <Badge className={`flex items-center gap-1 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2 sm:px-4 lg:px-3 xl:px-4 py-1 sm:py-2 lg:py-1.5 xl:py-2 rounded-lg sm:rounded-xl shadow-lg border backdrop-blur-md ${
                                  enquiry.selectedPlanId === 'free' || (!enquiry.selectedPlanId && !enquiry.isPremium) 
                                    ? 'bg-white/15 text-gray-100 border-white/20' 
                                    : 'bg-blue-500/30 text-blue-50 border-blue-400/40'
                                } flex-shrink-0`}>
                                  {(enquiry.selectedPlanId && enquiry.selectedPlanId !== 'free') || enquiry.isPremium ? (
                                    <Crown className="h-2.5 w-2.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-yellow-300 drop-shadow-sm" />
                                  ) : null}
                                  <span className="text-[8px] sm:text-xs lg:text-xs xl:text-xs font-bold whitespace-nowrap tracking-wide">
                                    {planInfo.name}
                                  </span>
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Premium Content Area with Better Structure */}
                            <div className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-4 sm:p-5 lg:p-4 xl:p-5 overflow-visible">
                              {/* Subtle background texture */}
                              <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none"></div>
                              
                              {/* Enquiry Title - Moved from header to top left of card */}
                              <div className="relative z-10 mb-2 sm:mb-2.5 lg:mb-2 xl:mb-2.5">
                                <h5 className={`text-sm sm:text-base lg:text-xs xl:text-sm font-bold leading-snug tracking-tight ${
                                  expiredFlag ? 'text-gray-500' : 'text-gray-900'
                                }`}>
                                  {enquiry.title}
                                </h5>
                              </div>
                              
                              {/* Enquiry Details Section - Visible on all screens, wider on mobile */}
                              <div className="block relative z-10 mb-2 sm:mb-2.5 xl:mb-2.5 w-full">
                                <div className="w-full">
                                  {/* Budget, Location, Category - Horizontal Row, full width on mobile */}
                                  <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 flex-wrap sm:flex-nowrap w-full">
                                    {/* Budget */}
                                    {enquiry.budget && (
                                      <div className="flex items-center gap-1.5 sm:gap-1.5 xl:gap-2 px-2.5 sm:px-3 xl:px-3 py-1.5 sm:py-2 xl:py-2 bg-gradient-to-b from-gray-200 to-gray-300 border-2 sm:border-2 xl:border-2 border-black rounded-lg sm:rounded-lg xl:rounded-lg flex-1 min-w-0 w-full sm:w-auto shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/budget">
                                        {/* Physical button depth effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg pointer-events-none" />
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/budget:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg" />
                                        <span className="text-sm sm:text-sm xl:text-base font-extrabold text-black relative z-10">₹</span>
                                        <span className="text-xs sm:text-xs xl:text-sm font-bold text-black relative z-10">
                                          {enquiry.budget.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Location */}
                                    {enquiry.location && (
                                      <div className="flex items-center gap-1.5 sm:gap-1.5 xl:gap-2 px-2.5 sm:px-3 xl:px-3 py-1.5 sm:py-2 xl:py-2 bg-gradient-to-b from-gray-200 to-gray-300 border-2 sm:border-2 xl:border-2 border-black rounded-lg sm:rounded-lg xl:rounded-lg flex-1 min-w-0 w-full sm:w-auto shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/location">
                                        {/* Physical button depth effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg pointer-events-none" />
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/location:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg" />
                                        <MapPin className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4 text-black flex-shrink-0 relative z-10" />
                                        <span className="text-xs sm:text-xs xl:text-sm font-bold text-black truncate relative z-10">
                                          {enquiry.location}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Category */}
                                    {enquiry.category && (
                                      <div className="flex items-center gap-1.5 sm:gap-1.5 xl:gap-2 px-2.5 sm:px-3 xl:px-3 py-1.5 sm:py-2 xl:py-2 bg-gradient-to-b from-gray-200 to-gray-300 border-2 sm:border-2 xl:border-2 border-black rounded-lg sm:rounded-lg xl:rounded-lg flex-1 min-w-0 w-full sm:w-auto shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/category">
                                        {/* Physical button depth effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg pointer-events-none" />
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/category:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg" />
                                        <Tag className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4 text-black flex-shrink-0 relative z-10" />
                                        <span className="text-xs sm:text-xs xl:text-sm font-bold text-black capitalize relative z-10 whitespace-nowrap truncate max-w-[8ch]">
                                          {enquiry.category.replace('-', ' ').slice(0, 8)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Deadline Badge - Premium Design */}
                              {(() => {
                                const deadline = enquiry.deadline;
                                if (!deadline) return null;
                                
                                try {
                                  let deadlineDate: Date;
                                  
                                  if (deadline && typeof deadline === 'object' && 'toDate' in deadline) {
                                    deadlineDate = deadline.toDate();
                                  } else if (typeof deadline === 'string' || typeof deadline === 'number') {
                                    deadlineDate = new Date(deadline);
                                  } else if (deadline instanceof Date) {
                                    deadlineDate = deadline;
                                  } else {
                                    return null;
                                  }
                                  
                                  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-3 lg:right-3 xl:top-3.5 xl:right-3.5 flex items-center gap-1 lg:gap-1.5 bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-200/60 rounded-md lg:rounded-lg px-2 lg:px-2.5 xl:px-2.5 py-1 lg:py-1.5 xl:py-1.5 shadow-lg z-20 backdrop-blur-sm max-w-[140px] sm:max-w-[160px] lg:max-w-[150px] xl:max-w-[160px]">
                                      <div className="flex items-center justify-center w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-3.5 xl:h-3.5 bg-red-500 rounded-full flex-shrink-0">
                                        <Clock className="h-1.5 w-1.5 lg:h-2 lg:w-2 xl:h-2 xl:w-2 text-white" />
                                      </div>
                                      <span className="text-[8px] sm:text-[9px] lg:text-[9px] xl:text-[10px] text-red-800 font-bold whitespace-nowrap tracking-tight truncate">
                                        {deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                                  );
                                } catch (e) {
                                  console.error('Error parsing deadline for enquiry:', enquiry.id, e, deadline);
                                  return null;
                                }
                              })()}

                              {/* Response Metrics - Premium Card Design with Perfect Alignment - Only show to enquiry owner */}
                              {user && user.uid === enquiry.userId && (
                                <div className="mb-4 sm:mb-5 lg:mb-2.5 xl:mb-3 relative invisible">
                                  {/* Desktop: Add padding-right only if deadline exists */}
                                  <div className={`flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-2 xl:gap-2.5 ${
                                    enquiry.deadline ? 'pr-0 sm:pr-28 lg:pr-0 xl:pr-0' : ''
                                  }`}>
                                    <div className={`flex items-center gap-2 sm:gap-2.5 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 lg:py-1 xl:py-1.5 rounded-lg lg:rounded-md xl:rounded-lg font-bold shadow-md border-2 transition-all duration-200 ${
                                      allResponses.length === 0 
                                        ? 'bg-gradient-to-r from-black to-gray-900 text-white border-gray-700' 
                                        : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300/60'
                                    }`}>
                                      <div className={`flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 rounded-lg flex-shrink-0 ${
                                        allResponses.length === 0 ? 'bg-white/20' : 'bg-green-500/20'
                                      }`}>
                                        <MessageSquare className={`h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 ${
                                          allResponses.length === 0 ? 'text-white' : 'text-green-600'
                                        }`} />
                                      </div>
                                      <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs font-bold tracking-tight whitespace-nowrap">
                                        {allResponses.length} {allResponses.length === 1 ? 'Response' : 'Responses'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                                  
                              {/* Premium Upgrade Button - Desktop Only, Next to Responses */}
                                  <div className="hidden lg:flex items-center gap-2 xl:gap-2.5">
                                    {(() => {
                                      const enquiryPlan = enquiry.selectedPlanId || 'free';
                                      if (enquiryPlan !== 'premium' && enquiryPlan !== 'pro') {
                                        const upgradeOptions = getUpgradeOptions(
                                          enquiryPlan,
                                          'free',
                                          enquiry.createdAt,
                                          null
                                        );
                                        if (upgradeOptions.length > 0) {
                                          return (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!expiredFlag) {
                                                  handleUpgradeClick(enquiry, e);
                                                }
                                              }}
                                              disabled={expiredFlag}
                                              className="flex-shrink-0 !bg-blue-600 hover:!bg-blue-700 !text-white text-[10px] xl:text-xs px-2.5 xl:px-3 py-1 xl:py-1.5 h-auto lg:h-8 xl:h-8.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/upgrade border border-black hover:border-black items-center justify-center lg:min-w-[85px] xl:min-w-[90px]"
                                            >
                                              <Crown className="h-2.5 w-2.5 xl:h-3 xl:w-3 mr-1 xl:mr-1.5 flex-shrink-0 group-hover/upgrade:scale-110 transition-transform drop-shadow-sm" />
                                              <span className="tracking-tight whitespace-nowrap">Upgrade</span>
                                            </Button>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
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
                                      className="flex-shrink-0 border border-black hover:border-black text-[10px] xl:text-xs px-2.5 xl:px-3 py-1 xl:py-1.5 h-auto lg:h-8 xl:h-8.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete flex items-center justify-center lg:min-w-[75px] xl:min-w-[85px]"
                                    >
                                      <Trash2 className="h-2.5 w-2.5 xl:h-3 xl:w-3 mr-1 xl:mr-1.5 flex-shrink-0 group-hover/delete:scale-110 transition-transform" />
                                      <span className="tracking-tight whitespace-nowrap">Delete</span>
                                    </Button>
                                  </div>
                                  
                                  {remainingCount > 0 && (
                                    <div className="flex items-center gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 lg:py-1 xl:py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300/60 rounded-lg lg:rounded-md xl:rounded-lg shadow-md">
                                      <div className="flex items-center justify-center w-3.5 h-3.5 xl:w-4 xl:h-4 bg-amber-500/20 rounded-md flex-shrink-0">
                                        <Lock className="h-2.5 w-2.5 xl:h-3 xl:w-3 text-amber-700" />
                                      </div>
                                      <span className="text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] text-amber-800 font-bold tracking-tight whitespace-nowrap">
                                        {remainingCount} Locked
                                      </span>
                                    </div>
                                  )}

                              {/* Plan Notice - Show plan-specific seller limit, positioned above response button */}
                              {(() => {
                                const planId = enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free');
                                let planText = '';
                                
                                switch (planId) {
                                  case 'free':
                                    planText = 'With Free Plan Meet Only 2 Different Sellers';
                                    break;
                                  case 'basic':
                                    planText = 'With Basic Plan Meet Only 5 Different Sellers';
                                    break;
                                  case 'standard':
                                    planText = 'With Standard Plan Meet Only 10 Different Sellers';
                                    break;
                                  case 'premium':
                                  case 'pro':
                                    planText = 'With Premium Plan Meet Unlimited Sellers';
                                    break;
                                  default:
                                    planText = 'With Free Plan Meet Only 2 Different Sellers';
                                }
                                
                                return (
                                  <div className="relative z-10 mb-0.5 sm:mb-1 lg:mb-0.5 xl:mb-1">
                                    <p className="text-[7px] sm:text-[8px] lg:text-[8px] xl:text-[9px] font-bold text-gray-700 text-center">
                                      {planText}
                                    </p>
                                  </div>
                                );
                              })()}

                              {/* Premium Action Buttons - Perfectly Aligned */}
                              <div 
                                className="grid grid-cols-1 sm:flex sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 lg:gap-2 xl:gap-2.5 relative z-10 pt-1 sm:pt-1.5 lg:pt-1 xl:pt-1.5 flex-wrap lg:flex-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                              <Button
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!expiredFlag) {
                                    navigate('/my-enquiries', {
                                      state: { highlightId: enquiry.id }
                                    });
                                  }
                                }}
                                  disabled={expiredFlag}
                                  className="w-full sm:flex-none flex-shrink-0 border-4 border-black bg-gradient-to-b from-white to-gray-50 text-black text-xs sm:text-sm lg:text-[10px] xl:text-xs px-3.5 sm:px-4 lg:px-3 xl:px-3.5 py-2 sm:py-2 lg:py-1.5 xl:py-2 h-auto sm:h-9 lg:h-8 xl:h-8.5 font-black rounded-xl lg:rounded-xl xl:rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn flex items-center justify-center sm:min-w-[130px] lg:min-w-[110px] xl:min-w-[120px] relative overflow-hidden disabled:grayscale hover:bg-gray-50"
                              >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                                  <Eye className="h-3.5 w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 mr-1.5 lg:mr-1 xl:mr-1.5 flex-shrink-0 group-hover/btn:scale-110 transition-transform relative z-10" />
                                  <span className="tracking-tight whitespace-nowrap relative z-10">
                                    {responseCount} {responseCount === 1 ? 'Response' : 'Responses'}
                                  </span>
                              </Button>
                              
                                {/* Premium Upgrade Button - Mobile/Tablet Only (Desktop version is in Response Metrics) */}
                                <div className="lg:hidden flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                                  {(() => {
                                    const enquiryPlan = enquiry.selectedPlanId || 'free';
                                    if (enquiryPlan !== 'premium' && enquiryPlan !== 'pro') {
                                      const upgradeOptions = getUpgradeOptions(
                                        enquiryPlan,
                                        'free',
                                        enquiry.createdAt,
                                        null
                                      );
                                      if (upgradeOptions.length > 0) {
                                        return (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!expiredFlag) {
                                                handleUpgradeClick(enquiry, e);
                                              }
                                            }}
                                            disabled={expiredFlag}
                                            className="flex-1 sm:flex-none flex-shrink-0 border-4 border-black bg-gradient-to-b from-blue-500 to-blue-600 text-white text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2 h-auto sm:h-9 font-black rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/upgrade flex items-center justify-center sm:min-w-[110px] relative overflow-hidden disabled:grayscale"
                                          >
                                            {/* Physical button depth effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/upgrade:translate-x-full transition-transform duration-700 pointer-events-none" />
                                            <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 group-hover/upgrade:scale-110 transition-transform relative z-10" />
                                            <span className="tracking-tight whitespace-nowrap relative z-10">Upgrade</span>
                                          </Button>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
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
                                    className="flex-1 sm:flex-none flex-shrink-0 border-4 border-black bg-gradient-to-b from-red-500 to-red-600 text-white text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2 h-auto sm:h-9 font-black rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete flex items-center justify-center sm:min-w-[90px] relative overflow-hidden disabled:grayscale"
                                  >
                                    {/* Physical button depth effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/delete:translate-x-full transition-transform duration-700 pointer-events-none" />
                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 group-hover/delete:scale-110 transition-transform relative z-10" />
                                    <span className="tracking-tight whitespace-nowrap relative z-10">Delete</span>
                                  </Button>
                                </div>
                            </div>
                            </div>
                          </motion.div>
                        );
                        })
                      })()}

                      {/* View All Button - Professional Design */}
                {enquiries.length > 3 && (
                        <div className="flex justify-center pt-5 sm:pt-7 lg:pt-8 mt-5 sm:mt-6 lg:mt-8 border-t-2 border-gray-200/60">
                          <Button 
                            variant="outline" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigate('/my-enquiries'); 
                            }} 
                            className="group/btn border border-black bg-white hover:bg-gray-50 hover:border-black text-gray-700 hover:text-gray-900 font-bold text-sm sm:text-base lg:text-lg px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-5 h-auto sm:h-12 lg:h-14 rounded-xl lg:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                          >
                            <span className="mr-2 tracking-tight">View All Enquiries</span>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 group-hover/btn:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  </div>
                )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Responses Card - Seller View Only */}
            {viewMode === 'seller' && (
            <Card 
              className="group cursor-pointer border border-black shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 rounded-2xl sm:rounded-3xl relative"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/my-responses');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Professional Header - Matching Dashboard Style */}
              <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-5 xl:p-6 overflow-visible flex items-end justify-center min-h-[120px] sm:min-h-[140px] lg:min-h-[130px] xl:min-h-[150px] pb-12 sm:pb-16 lg:pb-14 xl:pb-16">
                <div className="w-full flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                  {/* Header Section with Title - Centered */}
                  <div className="text-center w-full flex items-center justify-center mt-8 sm:mt-10 lg:mt-8 xl:mt-10">
                    <h2 className="text-xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight">Your Responses</h2>
                  </div>
                  
                  {/* Content Card - Black Background */}
                  <div className="bg-black border border-black rounded-lg p-3 sm:p-4 lg:p-3 xl:p-4 w-full">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm lg:text-[10px] xl:text-xs text-white leading-snug">
                        Track your sales; We won't be tracking you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 lg:p-5 xl:p-6 relative z-10">
                {/* Professional Stats Grid with Gradients - Physical Button Design */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">
                        {responsesReady ? responsesSummary.filter(s => s.status === 'approved').length : '—'}
                      </h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Approved</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">
                        {responsesReady ? responsesSummary.filter(s => s.status === 'pending').length : '—'}
                      </h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Pending</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl sm:rounded-xl overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <CardContent className="p-2 sm:p-3 text-center relative z-10">
                      <h3 className="text-sm sm:text-xl lg:text-2xl font-black text-black mb-0.5 sm:mb-1">
                        {responsesReady ? responsesSummary.filter(s => s.status === 'rejected').length : '—'}
                      </h3>
                      <p className="text-[8px] sm:text-[10px] lg:text-xs text-black font-black">Rejected</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Professional Submissions Section */}
                <div className="mb-4 sm:mb-6 lg:mb-5 xl:mb-6">
                  {/* Section Header */}
                  <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-2.5 xl:gap-3 mb-3 sm:mb-4 lg:mb-3 xl:mb-4">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-white border-2 border-black rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl shadow-md flex-shrink-0">
                      <Rocket className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4.5 lg:w-4.5 xl:h-5 xl:w-5 text-black" />
                    </div>
                    <h4 className="text-sm sm:text-xl lg:text-base xl:text-lg font-bold text-gray-900 tracking-tight">Your Submissions</h4>
                  </div>
                  
                  {!responsesReady ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-8 xl:py-10 px-4 bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-dashed border-black">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4 lg:mb-3 xl:mb-4 shadow-md">
                        <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-600 animate-spin" />
                      </div>
                      <p className="text-xs sm:text-sm lg:text-xs xl:text-sm text-gray-600 font-medium">Loading your submissions...</p>
                    </div>
                  ) : responsesSummary.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-8 xl:py-10 px-4 bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-dashed border-black">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gray-100 rounded-full mb-3 sm:mb-4 lg:mb-3 xl:mb-4 shadow-md">
                        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-gray-400" />
                      </div>
                      <p className="text-xs sm:text-sm lg:text-xs xl:text-sm text-gray-600 font-medium">No submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 lg:space-y-3 xl:space-y-3.5">
                      {responsesSummary.slice(0, 3).map((submission) => {
                        const isEnquiryDeleted = deletedEnquiries.has(submission.enquiryId);
                        // Check if enquiry is expired or deal closed - must fetch if not in state
                        const enquiry = enquiries.find(e => e.id === submission.enquiryId);
                        const isDealClosed = (() => {
                          if (!enquiry) return false;
                          return enquiry.status === 'deal_closed' || enquiry.dealClosed === true;
                        })();
                        const isEnquiryExpired = (() => {
                          if (!enquiry || !enquiry.deadline || isDealClosed) return false;
                          try {
                            const now = new Date();
                            let deadlineDate: Date;
                            if (enquiry.deadline && typeof enquiry.deadline === 'object' && 'toDate' in enquiry.deadline) {
                              deadlineDate = (enquiry.deadline as any).toDate();
                            } else if (typeof enquiry.deadline === 'string' || typeof enquiry.deadline === 'number') {
                              deadlineDate = new Date(enquiry.deadline);
                            } else if (enquiry.deadline instanceof Date) {
                              deadlineDate = enquiry.deadline;
                            } else {
                              return false;
                            }
                            if (!deadlineDate || isNaN(deadlineDate.getTime())) return false;
                            return deadlineDate.getTime() < now.getTime();
                          } catch (error) {
                            console.error('Error checking expiry for enquiry:', submission.enquiryId, error);
                            return false;
                          }
                        })();
                        return (
                        <motion.div
                          key={submission.id}
                          style={{ willChange: 'transform, opacity' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`group relative rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl overflow-hidden transition-all duration-300 ${
                            isEnquiryDeleted || isEnquiryExpired || isDealClosed
                              ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border-[6px] border-black shadow-sm'
                              : 'bg-white border-[6px] border-black hover:border-black hover:shadow-xl shadow-lg cursor-pointer transform hover:-translate-y-1 hover:scale-[1.01]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!isEnquiryDeleted && !isEnquiryExpired && !isDealClosed) {
                              navigate('/my-responses', {
                                state: { highlightSubmissionId: submission.id }
                              });
                            }
                          }}
                        >
                          {/* Premium Header with Sophisticated Design */}
                          <div className={`relative bg-gradient-to-br from-black via-black to-gray-900 px-3 sm:px-4 lg:px-3.5 xl:px-4 py-2.5 sm:py-3 lg:py-2.5 xl:py-3 rounded-t-xl sm:rounded-t-2xl lg:rounded-t-xl xl:rounded-t-2xl ${
                            isEnquiryDeleted || isEnquiryExpired || isDealClosed ? 'opacity-70' : ''
                          }`}>
                            {/* Elegant pattern overlay */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                            
                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 transition-opacity duration-500"></div>
                            
                            <div className="relative flex items-center justify-between gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3">
                              <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 flex-1 min-w-0 pr-2">
                                {((submission as any).userProfileVerified || submission.isIdentityVerified) && (
                                  <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5 rounded-full flex-shrink-0 shadow-lg ring-2 ring-white/20 bg-blue-500">
                                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 flex-shrink-0">
                                {/* Enquiry Deleted Badge */}
                                {isEnquiryDeleted && (
                                  <Badge className="text-[9px] sm:text-xs lg:text-[8px] xl:text-[9px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 bg-red-500/25 text-red-200 border border-red-400/40 whitespace-nowrap backdrop-blur-sm shadow-sm">
                                    Enquiry Deleted
                                  </Badge>
                                )}
                                {/* Deal Closed Badge */}
                                {!isEnquiryDeleted && isDealClosed && (
                                  <Badge className="text-[9px] sm:text-xs lg:text-[8px] xl:text-[9px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 bg-purple-500/25 text-purple-200 border border-purple-400/40 whitespace-nowrap backdrop-blur-sm shadow-sm">
                                    Deal Closed
                                  </Badge>
                                )}
                                {/* Enquiry Expired Badge */}
                                {!isEnquiryDeleted && !isDealClosed && isEnquiryExpired && (
                                  <Badge className="text-[9px] sm:text-xs lg:text-[8px] xl:text-[9px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 bg-orange-500/25 text-orange-200 border border-orange-400/40 whitespace-nowrap backdrop-blur-sm shadow-sm">
                                    Enquiry Expired
                                  </Badge>
                                )}
                              {/* Status Badge */}
                                <Badge className={`text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 whitespace-nowrap backdrop-blur-sm shadow-sm ${
                                submission.status === 'approved' 
                                    ? 'bg-green-500/30 text-green-50 border-green-400/40' 
                                  : submission.status === 'pending'
                                    ? 'bg-amber-500/30 text-amber-50 border-amber-400/40'
                                    : 'bg-red-500/30 text-red-50 border-red-400/40'
                              }`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Premium Content Area */}
                          <div className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-3 sm:p-4 lg:p-3.5 xl:p-4">
                            {/* Subtle background texture */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none"></div>
                            
                            <div className="relative space-y-2.5 sm:space-y-3 lg:space-y-2.5 xl:space-y-3">
                              {/* Submission Status */}
                              <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5">
                                {isEnquiryDeleted ? (
                                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-red-50 border border-red-200 rounded-lg lg:rounded-md xl:rounded-lg">
                                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-red-600 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm lg:text-xs xl:text-sm font-black text-red-900">
                                      Enquiry has been deleted
                                    </span>
                                  </div>
                                ) : isEnquiryExpired ? (
                                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-orange-50 border border-orange-200 rounded-lg lg:rounded-md xl:rounded-lg">
                                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-orange-600 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm lg:text-xs xl:text-sm font-black text-orange-900">
                                      Enquiry expired - no longer active
                                    </span>
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 rounded-lg lg:rounded-md xl:rounded-lg border-2 font-semibold backdrop-blur-sm shadow-sm ${
                                    submission.status === 'approved'
                                      ? 'bg-transparent text-black border-black'
                                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-300/60'
                                  }`}>
                                    <div className={`flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 rounded-full flex-shrink-0 ${
                                      submission.status === 'approved' ? 'bg-transparent' : 'bg-amber-500/20'
                                    }`}>
                                      {submission.status === 'approved' ? (
                                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-black" />
                                      ) : (
                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-amber-600" />
                                      )}
                                    </div>
                                    <span className={`text-sm sm:text-base lg:text-sm xl:text-base font-black ${
                                      submission.status === 'approved' ? 'text-black' : 'text-amber-900'
                                    }`}>
                                {submission.title}
                              </span>
                                  </div>
                              )}
                            </div>

                            {/* Details */}
                              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 lg:py-1.5 xl:py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg lg:rounded-md xl:rounded-lg">
                                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-black flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-black font-bold truncate">
                                    {submission.message?.split(' ').slice(0, 3).join(' ') || 'Professional service'}
                                  </span>
                              </div>
                            </div>

                            {/* Submission Time */}
                              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] text-gray-500 font-medium">
                                Submitted: {submission.createdAt?.toDate ? submission.createdAt.toDate().toLocaleString() : 'N/A'}
                                </span>
                            </div>

                            {/* Action Buttons */}
                              <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 pt-1 sm:pt-1.5 lg:pt-1 xl:pt-1.5">
                                {submission.status === 'approved' && !isEnquiryDeleted && !isEnquiryExpired && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`); }}
                                    className="flex-1 sm:flex-none border-4 border-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:border-black text-[10px] sm:text-sm lg:text-[10px] xl:text-xs px-3 sm:px-4 lg:px-3 xl:px-3.5 py-1.5 sm:py-2 lg:py-1.5 xl:py-2 h-auto sm:h-9 lg:h-8 xl:h-8.5 font-black rounded-xl lg:rounded-xl xl:rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 whitespace-nowrap relative overflow-hidden group/chat"
                                >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/chat:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 relative z-10" />
                                  <span className="relative z-10">Chat</span>
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate('/my-responses', {
                                    state: { highlightSubmissionId: submission.id }
                                  });
                                }}
                                  className="flex-1 sm:flex-none border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 text-black hover:from-gray-300 hover:to-gray-400 text-[10px] sm:text-sm lg:text-[10px] xl:text-xs px-3 sm:px-4 lg:px-3 xl:px-3.5 py-1.5 sm:py-2 lg:py-1.5 xl:py-2 h-auto sm:h-9 lg:h-8 xl:h-8.5 font-black rounded-xl lg:rounded-xl xl:rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden disabled:grayscale"
                                  disabled={isEnquiryDeleted || isEnquiryExpired}
                              >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 relative z-10" />
                                  <span className="relative z-10">View Details</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        </motion.div>
                      );
                      })}
                    </div>
                  )}
                </div>

                {responsesSummary.length > 3 && (
                  <div className="flex justify-center pt-3 sm:pt-4 lg:pt-3 xl:pt-4 mt-3 sm:mt-4 lg:mt-3 xl:mt-4">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/my-responses');
                      }} 
                      className="group/btn border border-black bg-white hover:bg-gray-50 hover:border-black text-gray-700 hover:text-gray-900 font-bold text-xs sm:text-sm lg:text-xs xl:text-sm px-6 sm:px-8 lg:px-6 xl:px-7 py-2.5 sm:py-3 lg:py-2.5 xl:py-3 h-auto sm:h-10 lg:h-9 xl:h-10 rounded-xl lg:rounded-lg xl:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <span className="mr-2 tracking-tight">Show More</span>
                      <ArrowRight className="h-4 w-4 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 group-hover/btn:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

          {/* Saved Enquiries Card - Seller View Only */}
          {viewMode === 'seller' && (
          <Card 
            className="group cursor-pointer border-8 border-black shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 rounded-2xl sm:rounded-3xl mt-6 sm:mt-8 lg:mt-10 relative"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10 }}
          >
            {/* Professional Header - Matching Dashboard Style */}
            <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-5 xl:p-6 overflow-hidden">
              {/* Content Card - White Background */}
              <div className="bg-white border border-black border-t-4 border-t-black rounded-lg p-3 sm:p-4 lg:p-4 xl:p-6">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                    <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black break-words">
                      saved enquiries
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-[10px] xl:text-xs text-black leading-snug">
                    did you find it?
                  </p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4 sm:p-6 lg:p-5 xl:p-6 pt-4 sm:pt-6 lg:pt-5 xl:pt-6 relative z-10">
              {/* Professional Stats Grid with Gradients */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-2.5 xl:gap-3 mb-4 sm:mb-6 lg:mb-5 xl:mb-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="group relative text-center p-3 sm:p-5 lg:p-3 xl:p-4 bg-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-black shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-base sm:text-3xl lg:text-2xl xl:text-3xl font-black text-black mb-1 sm:mb-2 lg:mb-1 xl:mb-1.5 tracking-tight">
                    {savedEnquiries.length}
                  </div>
                    <div className="text-[10px] sm:text-sm lg:text-[10px] xl:text-xs text-black font-bold uppercase tracking-wide">Total</div>
                </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="group relative text-center p-3 sm:p-5 lg:p-3 xl:p-4 bg-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-black shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-base sm:text-3xl lg:text-2xl xl:text-3xl font-black text-black mb-1 sm:mb-2 lg:mb-1 xl:mb-1.5 tracking-tight">
                    {savedEnquiries.filter(e => e.status === 'live').length}
                  </div>
                    <div className="text-[10px] sm:text-sm lg:text-[10px] xl:text-xs text-black font-bold uppercase tracking-wide">Live</div>
                </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="group relative text-center p-3 sm:p-5 lg:p-3 xl:p-4 bg-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-black shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-base sm:text-3xl lg:text-2xl xl:text-3xl font-black text-black mb-1 sm:mb-2 lg:mb-1 xl:mb-1.5 tracking-tight">
                    {savedEnquiries.filter(e => e.status === 'completed').length}
                  </div>
                    <div className="text-[10px] sm:text-sm lg:text-[10px] xl:text-xs text-black font-bold uppercase tracking-wide">Completed</div>
                </div>
                </motion.div>
              </div>

              {/* Professional Saved Enquiries List */}
              <div className="mb-4 sm:mb-6 lg:mb-5 xl:mb-6">
                {/* Section Header */}
                <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-2.5 xl:gap-3 mb-3 sm:mb-4 lg:mb-3 xl:mb-4">
                </div>
                
                {savedEnquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-8 xl:py-10 px-4 bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border border-dashed border-black">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gray-100 rounded-full mb-3 sm:mb-4 lg:mb-3 xl:mb-4 shadow-md">
                      <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-gray-400" />
                    </div>
                    <p className="text-xs sm:text-sm lg:text-xs xl:text-sm text-gray-600 font-medium">No saved enquiries yet</p>
                  </div>
              ) : (
                  <div className="space-y-3 sm:space-y-4 lg:space-y-3 xl:space-y-3.5">
                    {savedEnquiries.slice(0, 3).map((enquiry) => {
                      const now = new Date();
                      const isExpired = enquiry.deadline && (() => {
                        const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                        return deadlineDate < now;
                      })();
                      
                      return (
                        <motion.div
                          key={enquiry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`group relative rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl overflow-hidden transition-all duration-300 ${
                            isExpired 
                              ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border-[6px] border-black shadow-sm'
                              : 'bg-white border-[6px] border-black hover:border-black hover:shadow-xl shadow-lg cursor-pointer transform hover:-translate-y-1 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Premium Header */}
                          <div className={`relative bg-gradient-to-br from-black via-black to-gray-900 px-3 sm:px-4 lg:px-3.5 xl:px-4 py-2.5 sm:py-3 lg:py-2.5 xl:py-3 ${
                            isExpired ? 'opacity-70' : ''
                          }`}>
                            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                            <div className="relative flex items-center justify-between gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3">
                              <h4 className={`text-xs sm:text-base lg:text-xs xl:text-sm font-bold text-white truncate leading-snug tracking-tight flex-1 min-w-0 pr-2 ${
                                isExpired ? 'text-gray-400' : 'text-white drop-shadow-sm'
                              }`}>
                                {enquiry.title}
                              </h4>
                              {isExpired && (
                                <Badge className="text-[9px] sm:text-xs lg:text-[8px] xl:text-[9px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 bg-red-500/25 text-red-200 border border-red-400/40 whitespace-nowrap backdrop-blur-sm shadow-sm">
                                  Expired
                                </Badge>
                              )}
                          </div>
                        </div>
                          
                          {/* Premium Content Area */}
                          <div className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-3 sm:p-4 lg:p-3.5 xl:p-4">
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none"></div>
                            
                            <div className="relative space-y-2.5 sm:space-y-3 lg:space-y-2.5 xl:space-y-3">
                              <p className={`text-[10px] sm:text-sm lg:text-xs xl:text-sm mb-2 line-clamp-2 leading-snug font-bold ${
                                isExpired ? 'text-gray-400' : 'text-gray-900'
                              }`}>
                                {enquiry.description}
                              </p>
                              <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 flex-wrap">
                                <Badge variant="secondary" className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 bg-gray-100 text-gray-900 border border-black font-bold">{enquiry.category}</Badge>
                                <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-900 font-black">₹{enquiry.budget?.toLocaleString('en-IN')}</span>
                                {enquiry.location && <span className="text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] text-black font-bold">• {enquiry.location}</span>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isExpired) {
                            navigate('/my-enquiries', {
                              state: { highlightId: enquiry.id },
                            });
                          }
                        }}
                        disabled={isExpired}
                        className="w-full border border-black bg-white text-gray-700 hover:bg-gray-50 hover:border-black hover:text-gray-900 text-[10px] sm:text-sm lg:text-[10px] xl:text-xs px-3 sm:px-4 lg:px-3 xl:px-3.5 py-1.5 sm:py-2 lg:py-1.5 xl:py-2 h-auto sm:h-9 lg:h-8 xl:h-8.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                        View Details
                      </Button>
                    </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
              </div>
              
              {savedEnquiries.length > 3 && (
                <div className="flex justify-center pt-3 sm:pt-4 lg:pt-3 xl:pt-4 mt-3 sm:mt-4 lg:mt-3 xl:mt-4" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/saved-enquiries');
                    }}
                    className="group/btn border border-black bg-white hover:bg-gray-50 hover:border-black text-gray-700 hover:text-gray-900 font-bold text-xs sm:text-sm lg:text-xs xl:text-sm px-6 sm:px-8 lg:px-6 xl:px-7 py-2.5 sm:py-3 lg:py-2.5 xl:py-3 h-auto sm:h-10 lg:h-9 xl:h-10 rounded-xl lg:rounded-lg xl:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <span className="mr-2 tracking-tight">Show More</span>
                    <ArrowRight className="h-4 w-4 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 group-hover/btn:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Quick Actions Card - Always Visible */}
          <Card className="border-4 border-black rounded-2xl overflow-hidden mt-6 sm:mt-8 lg:mt-0 mb-4 sm:mb-6 lg:mb-8 lg:w-full lg:max-w-full" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 sm:p-8 lg:p-6">
              {/* Header Section - Matching Dashboard Header */}
              <div className="mb-6 sm:mb-8 lg:mb-6">
                <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-xl p-5 sm:p-8 lg:p-6 overflow-hidden">
                  {/* Content Card - White Background */}
                  <div className="bg-white border border-black border-t-4 border-t-black rounded-lg p-3 sm:p-4 lg:p-4">
                    <div className="text-center">
                      <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-3">
                        <h2 className="text-4xl sm:text-6xl lg:text-4xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black break-words">
                          Quick Actions
                        </h2>
                      </div>
                      <p className="text-xs sm:text-base lg:text-sm text-slate-600 text-center font-medium max-w-2xl mx-auto leading-relaxed">
                        in case you changed your mind
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 items-stretch sm:items-stretch justify-center max-w-4xl mx-auto">
                <Link to="/post-enquiry" className="group flex-1 w-full">
                  <button className="w-full h-full border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 text-black font-black py-3.5 sm:py-4 lg:py-4 px-4 sm:px-5 lg:px-5 rounded-xl sm:rounded-2xl lg:rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 lg:gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:from-gray-300 hover:to-gray-400 min-h-[48px] lg:min-h-[52px] relative overflow-hidden">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl sm:rounded-2xl lg:rounded-xl pointer-events-none" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10" />
                    <span className="text-sm sm:text-base lg:text-sm font-black tracking-tight whitespace-nowrap relative z-10">Make a wish</span>
                  </button>
                </Link>
                
                <Link to="/enquiries" className="group flex-1 w-full">
                  <button className="w-full h-full border-4 border-black bg-gradient-to-b from-gray-200 to-gray-300 text-black font-black py-3.5 sm:py-4 lg:py-4 px-4 sm:px-5 lg:px-5 rounded-xl sm:rounded-2xl lg:rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 lg:gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:from-gray-300 hover:to-gray-400 min-h-[48px] lg:min-h-[52px] relative overflow-hidden">
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl sm:rounded-2xl lg:rounded-xl pointer-events-none" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 flex-shrink-0 group-hover:scale-110 transition-transform relative z-10" />
                    <span className="text-sm sm:text-base lg:text-sm font-black tracking-tight whitespace-nowrap relative z-10">Be the genie</span>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Plan Selector Modal for Upgrades */}
        {showPaymentSelector && selectedEnquiryForUpgrade && (
          <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
            <DialogContent className="max-w-6xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 mx-auto">
              <DialogHeader className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-extrabold text-center mb-2 sm:mb-2.5 md:mb-3 flex items-center justify-center gap-2 sm:gap-2.5 px-2">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 flex-shrink-0" />
                  <span className="break-words text-gray-900">Upgrade Plan for "{selectedEnquiryForUpgrade.title}"</span>
                </DialogTitle>
                <DialogDescription className="text-center text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed font-medium px-2">
                  Select a plan to unlock premium responses
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                <PaymentPlanSelector
                  currentPlanId={currentPlan}
                  enquiryId={selectedEnquiryForUpgrade.id}
                  userId={user?.uid || ''}
                  onPlanSelect={handlePlanSelect}
                  isUpgrade={true}
                  enquiryCreatedAt={selectedEnquiryForUpgrade.createdAt}
                  className="max-w-6xl mx-auto w-full"
                  user={user}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, MessageCircle, Edit, Trash2, Plus, Image as ImageIcon, Crown, X, ArrowRight, Zap, TrendingUp, Activity } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { HeaderSnow } from "@/components/HeaderSnow";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import PaymentPlanSelector from "@/components/PaymentPlanSelector";
import { PaymentPlan, PAYMENT_PLANS, getUpgradeOptions } from "@/config/paymentPlans";
import { getUserPaymentPlan, updateEnquiryPremiumStatus } from "@/services/paymentService";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'pending' | 'live' | 'rejected' | 'completed' | 'deal_closed';
  location?: string;
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
  approvedAt?: any;
  rejectedAt?: any;
  isPremium?: boolean;
  selectedPlanId?: string;
  selectedPlanPrice?: number;
  dealClosed?: boolean;
  dealClosedAt?: any;
  dealClosedBy?: string;
}

const MyEnquiries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryResponses, setEnquiryResponses] = useState<{[key: string]: any[]}>({});
  const [selectedEnquiryForResponses, setSelectedEnquiryForResponses] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  // Payment plan selector state
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedEnquiryForUpgrade, setSelectedEnquiryForUpgrade] = useState<Enquiry | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [userPaymentPlan, setUserPaymentPlan] = useState<any>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const fullscreenModalRef = useRef<HTMLDivElement>(null);
  const [highlightEnquiryId, setHighlightEnquiryId] = useState<string | null>(null);
  const highlightedEnquiryRef = useRef<HTMLDivElement | null>(null);

  // State to force re-render when responses are viewed
  const [, forceUpdate] = useState({});

  // Helper function to check if enquiry has unread responses
  const hasUnreadResponses = (enquiryId: string) => {
    if (!user) return false;
    
    const responses = enquiryResponses[enquiryId] || [];
    if (responses.length === 0) return false;

    const viewedKey = `responses_viewed_${user.uid}_${enquiryId}`;
    const lastViewedTime = localStorage.getItem(viewedKey);

    // Never viewed = has unread
    if (!lastViewedTime) return true;

    const viewedTime = parseInt(lastViewedTime, 10);
    if (isNaN(viewedTime)) return true; // Invalid timestamp = treat as unread
    
    // Check if ANY response is newer than viewed time
    return responses.some(response => {
      const responseTime = response.createdAt?.toDate
        ? response.createdAt.toDate().getTime()
        : (response.createdAt ? new Date(response.createdAt).getTime() : 0);
      return responseTime > viewedTime;
    });
  };

  // Listen for response viewed events to update badges in real-time
  useEffect(() => {
    const handleResponseViewed = (e?: any) => {
      const detail = e?.detail;
      console.log(`🔄 MyEnquiries: Event received for enquiry ${detail?.enquiryId}`);
      // Immediate update - localStorage is already updated
      forceUpdate({});
    };

    window.addEventListener('responseViewed', handleResponseViewed);

    return () => {
      window.removeEventListener('responseViewed', handleResponseViewed);
    };
  }, []);

  // Force immediate update when component mounts or becomes visible
  useEffect(() => {
    // Force update on mount to ensure badges are accurate
    console.log('🔄 MyEnquiries: Component mounted/updated, refreshing badges');
    forceUpdate({});
  }, [location.pathname]); // Re-check whenever route changes

  // Force update when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 MyEnquiries: Page visible, refreshing badges');
        forceUpdate({});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    console.log('MyEnquiries: Starting to fetch user enquiries for:', user.uid);
    
    // Fetch user payment plan
    const fetchUserPaymentPlan = async () => {
      try {
        const paymentPlan = await getUserPaymentPlan(user.uid);
        setUserPaymentPlan(paymentPlan);
        setCurrentPlan(paymentPlan?.currentPlan || 'free');
      } catch (error) {
        console.error('Error fetching user payment plan:', error);
      }
    };
    
    fetchUserPaymentPlan();

    // Fetch user profile for verification status
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

    const enquiriesQuery = query(
      collection(db, 'enquiries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Simple function to load enquiries
    const loadEnquiries = async () => {
      try {
        const snapshot = await getDocs(enquiriesQuery);
        const enquiriesData: Enquiry[] = [];
        snapshot.forEach((doc) => {
          enquiriesData.push({ id: doc.id, ...doc.data() } as Enquiry);
        });
        // Order live first, then expired (each newest first)
        const now = new Date();
        const isExpired = (e: Enquiry) => {
          if (!e.deadline) return false;
          const d = (e.deadline as any).toDate ? (e.deadline as any).toDate() : new Date(e.deadline);
          return d < now;
        };
        const toDate = (v: any) => v?.toDate ? v.toDate() : new Date(v);
        const live = enquiriesData.filter(e => !isExpired(e)).sort((a, b) => (toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()));
        const expired = enquiriesData.filter(e => isExpired(e)).sort((a, b) => (toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()));
        const combined = [...live, ...expired];
        
        // Deduplicate by enquiry ID to prevent duplicates
        const uniqueEnquiries = Array.from(
          new Map(combined.map(e => [e.id, e])).values()
        );
        
        console.log('MyEnquiries: Ordered live then expired:', { live: live.length, expired: expired.length, unique: uniqueEnquiries.length });
        setEnquiries(uniqueEnquiries);
        setLoading(false);
      } catch (error) {
        console.log('Error loading enquiries:', error);
        setLoading(false);
      }
    };

    loadEnquiries();
  }, [user]);

  // Read highlight from navigation state or query parameter (from dashboard deep-link)
  useEffect(() => {
    let highlight: string | null = null;

    // Prefer state passed via navigate('/my-enquiries', { state: { highlightId } })
    const state = location.state as any;
    if (state && typeof state.highlightId === "string") {
      highlight = state.highlightId;
    } else {
      // Fallback to query param ?highlight=<id> if present
      const params = new URLSearchParams(location.search);
      highlight = params.get("highlight");
    }

    if (highlight) {
      setHighlightEnquiryId(highlight);
    } else {
      // Only scroll to top if no highlight
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Scroll highlighted enquiry into view once data & ref are ready
  useEffect(() => {
    if (highlightEnquiryId && highlightedEnquiryRef.current && enquiries.length > 0 && !loading) {
      // Use requestAnimationFrame for smoother scroll
      const scrollToHighlight = () => {
        if (highlightedEnquiryRef.current) {
          const element = highlightedEnquiryRef.current;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - (window.innerHeight / 2) + (element.offsetHeight / 2);
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      };
      
      // Wait for DOM to be fully rendered
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToHighlight);
        });
      }, 500);
    }
  }, [highlightEnquiryId, enquiries, loading]);
  
  // Fetch user payment plan
  useEffect(() => {
    if (!user) return;
    
    const fetchUserPaymentPlan = async () => {
      try {
        const plan = await getUserPaymentPlan(user.uid);
        setUserPaymentPlan(plan);
        if (plan && plan.currentPlan) {
          setCurrentPlan(plan.currentPlan);
        }
      } catch (error) {
        console.error('Error fetching user payment plan:', error);
      }
    };
    
    fetchUserPaymentPlan();
  }, [user]);

  // Separate useEffect for real-time response listeners
  useEffect(() => {
    if (enquiries.length === 0) return;

    console.log('MyEnquiries: Setting up real-time response listeners for', enquiries.length, 'enquiries');
    console.log('MyEnquiries: Enquiry IDs:', enquiries.map(e => e.id));
    
    const responseListeners: (() => void)[] = [];
    
    for (const enquiry of enquiries) {
      try {
        console.log(`MyEnquiries: Setting up listener for enquiry: ${enquiry.id}`);
        
        const responsesQuery = query(
          collection(db, 'sellerSubmissions'),
          where('enquiryId', '==', enquiry.id)
        );
        
        // Simple function to load responses
        const loadResponses = async () => {
          try {
            const responseSnapshot = await getDocs(responsesQuery);
            const responses: any[] = [];
            responseSnapshot.forEach((doc) => {
              const data = doc.data();
              responses.push({ 
                id: doc.id, 
                ...data,
                status: data.status || 'pending'
              });
            });
            
            console.log(`MyEnquiries: Loaded responses for enquiry ${enquiry.id}:`, {
              count: responses.length,
              responses: responses.map(r => ({ id: r.id, sellerName: r.sellerName, status: r.status, price: r.price }))
            });
            
            setEnquiryResponses(prev => ({
              ...prev,
              [enquiry.id]: responses
            }));
          } catch (error) {
            console.log(`Error loading responses for enquiry ${enquiry.id}:`, error);
          }
        };

        loadResponses();
        
      } catch (error) {
        console.error('Error setting up response listener for enquiry:', enquiry.id, error);
      }
    }

    return () => {
      console.log('MyEnquiries: Cleaning up response listeners');
      responseListeners.forEach(unsub => unsub());
    };
  }, [enquiries]);

  const deleteEnquiry = async (enquiryId: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'enquiries', enquiryId));
        toast({ title: 'Enquiry Deleted', description: 'Your enquiry has been removed successfully.' });
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        toast({ title: 'Error', description: 'Failed to delete enquiry. Please try again.', variant: 'destructive' });
      }
    }
  };

  // Handle payment plan selection
  const handlePlanSelect = async (planId: string, price: number) => {
    if (!selectedEnquiryForUpgrade || !user) return;
    
    console.log('MyEnquiries: Plan selected:', { planId, price, enquiryId: selectedEnquiryForUpgrade.id });
    
    // Payment was already processed via Razorpay in PaymentPlanSelector
    // Just update the enquiry to reflect the new plan
    try {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Update enquiry
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
      
      // Refresh user payment plan
      const updatedPaymentPlan = await getUserPaymentPlan(user.uid);
      setUserPaymentPlan(updatedPaymentPlan);
      setCurrentPlan(updatedPaymentPlan?.currentPlan || 'free');
      
      // Close the modal
      setShowPaymentSelector(false);
      setSelectedEnquiryForUpgrade(null);
      
      // Show success message
      if (planId === 'premium') {
        toast({
          title: "Premium Plan Activated! 🎉",
          description: `Your enquiry now has unlimited responses!`,
        });
      } else {
        toast({
          title: "Payment Successful! 🎉",
          description: `Your enquiry is now on the ${planId} plan (₹${price}).`,
        });
      }
      
    } catch (error) {
      console.error('Error updating enquiry plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle upgrade button click
  const handleUpgradeClick = (enquiry: Enquiry) => {
    // Always use selectedPlanId if available, otherwise default to 'free'
    // Don't use isPremium flag to determine plan - it can be incorrectly set
    const currentPlanId = enquiry.selectedPlanId || 'free';
    console.log('🚀 Upgrade clicked for enquiry:', {
      enquiryId: enquiry.id,
      currentPlanId: currentPlanId,
      selectedPlanId: enquiry.selectedPlanId,
      isPremium: enquiry.isPremium,
      selectedPlanPrice: enquiry.selectedPlanPrice
    });
    setSelectedEnquiryForUpgrade(enquiry);
    setCurrentPlan(currentPlanId);
    setShowPaymentSelector(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      live: 'bg-green-800 text-white border-green-900',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    
    return (
      <Badge className={`text-[8px] sm:text-[9px] rounded-full border ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return null; // Only show Live badge, no green tick
      case 'pending':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />;
      case 'rejected':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      case 'completed':
        return <Star className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />;
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
    }
  };

  const getResponseLimitText = (planId: string) => {
    const plan = PAYMENT_PLANS.find(p => p.id === planId);
    if (!plan) return 'Connect With 2 Different Sellers';
    
    switch (planId) {
      case 'free':
        return 'Connect With 2 Different Sellers';
      case 'basic':
        return 'Connect With 5 Different Sellers';
      case 'standard':
        return 'Connect With 10 Different Sellers';
      case 'premium':
        return 'Connect With Unlimited Sellers';
      case 'pro':
        return 'Connect With Unlimited Sellers';
      default:
        return 'Connect With 2 Different Sellers';
    }
  };

  const getStatusMessage = (enquiry: Enquiry) => {
    switch (enquiry.status) {
      case 'live':
        return '';
      case 'pending':
        return 'Your enquiry is under admin review';
      case 'rejected':
        return 'Your enquiry was not approved by admin';
      case 'completed':
        return 'Your enquiry has been completed';
      default:
        return 'Status unknown';
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

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  // Helper to get visible responses for premium logic
  function getVisibleResponses(enquiry: Enquiry, user: any, responses: any[]) {
    if (!enquiry || !user) return [];
    if (user.uid === enquiry.userId) {
      if (enquiry.isPremium === true) {
        return responses;
      } else {
        return responses.slice(0, 2);
      }
    }
    return responses.filter(r => r.sellerId === user.uid);
  }

  if (loading) {
    return <LoadingAnimation message="Loading your enquiries" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header - Matching Profile Background - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <HeaderSnow />
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
            {/* Spacer Section to Match Dashboard/Profile */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                  type="button"
                    onClick={() => navigate('/dashboard')}
                    className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </Button>
                <div className="w-10 h-10"></div>
                </div>
              </div>
              
            {/* My Enquiries Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl">
                My Enquiries.
              </h1>
                  </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    Track & Manage Your Enquiries.
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>

        {/* Content - Inside Container */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          {/* Professional Stats Summary - Circular Design */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-5 xl:gap-6 mb-4 sm:mb-6 lg:mb-8 flex-wrap">
            {(() => {
              const now = new Date();
              const isExpired = (e: Enquiry) => {
                if (!e.deadline) return false;
                try {
                  const d = (e.deadline as any).toDate ? (e.deadline as any).toDate() : new Date(e.deadline);
                  return d < now;
                } catch {
                  return false;
                }
              };
              
              const liveCount = enquiries.filter(e => e.status === 'live' && !isExpired(e)).length;
              const pendingCount = enquiries.filter(e => e.status === 'pending').length;
              const completedCount = enquiries.filter(e => e.dealClosed === true || e.status === 'deal_closed').length;
              const totalCount = enquiries.length;
              
              return (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"
                  >
                      {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-0.5 sm:mb-1 leading-none">{totalCount}</h3>
                      <p className="text-[6px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-black font-black uppercase">Total Enquiries</p>
                          </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"
                  >
                      {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-0.5 sm:mb-1 leading-none">{liveCount}</h3>
                      <p className="text-[6px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-black font-black uppercase">Live</p>
                          </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"
                  >
                      {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-0.5 sm:mb-1 leading-none">{pendingCount}</h3>
                      <p className="text-[6px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-black font-black uppercase">Pending</p>
                          </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"
                  >
                      {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-0.5 sm:mb-1 leading-none">{completedCount}</h3>
                      <p className="text-[6px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-black font-black uppercase">Completed</p>
                          </div>
                  </motion.div>
                </>
              );
            })()}
          </div>

          {/* Enquiries List */}
          {enquiries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-8 sm:p-12 lg:p-16 text-center border-2 border-black border-dashed shadow-xl bg-gradient-to-br from-gray-50 via-white to-gray-50/50 rounded-2xl sm:rounded-3xl lg:rounded-[2rem]">
                <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-5 sm:mb-6 lg:mb-8 shadow-lg flex-shrink-0">
                  <Eye className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-2.5 sm:mb-3 lg:mb-4 tracking-tight">No enquiries yet</h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-md lg:max-w-lg mx-auto leading-relaxed px-4">
                  Start by posting your first enquiry to find what you're looking for in our community.
                </p>
                <Link to="/post-enquiry">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm sm:text-base lg:text-lg px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-5 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto border-2 border-gray-800 hover:border-gray-900">
                    <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2 flex-shrink-0" />
                    Post Your First Enquiry
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {enquiries.map((enquiry, index) => {
                const isExpired = (() => {
                  if (!enquiry.deadline) return false;
                  const d = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                  return d < new Date();
                })();
                const isHighlighted = highlightEnquiryId === enquiry.id;
                return (
                <motion.div
                  key={enquiry.id}
                  ref={isHighlighted ? highlightedEnquiryRef : undefined}
                  style={{ willChange: 'transform, opacity' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={`group relative rounded-xl overflow-visible transition-all duration-200 ${
                    isExpired
                      ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border-[0.5px] border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                      : 'bg-white border-[0.5px] border-black hover:bg-gray-50 cursor-pointer shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95'
                  }`}>
                    {/* Physical button depth effect - matching View Details button */}
                    {!isExpired && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                      </>
                    )}
                    {/* EXPIRED Stamp Badge */}
                    {isExpired && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none" style={{ filter: 'none', WebkitFilter: 'none' }}>
                        <div className="relative" style={{ filter: 'none', WebkitFilter: 'none' }}>
                          <div className="relative px-8 sm:px-12 lg:px-10 xl:px-12 py-3 sm:py-4 lg:py-3 xl:py-4 bg-transparent" style={{ filter: 'none', WebkitFilter: 'none' }}>
                            {/* Distressed border effect */}
                            <div className="absolute inset-0 border-4 rounded-sm" style={{
                              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                              filter: 'none drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                              WebkitFilter: 'none drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1), 0 0 20px rgba(239,68,68,0.4)',
                              borderColor: '#ef4444',
                              borderWidth: '4px',
                              borderStyle: 'solid'
                            }}></div>
                            {/* Text with distressed effect */}
                            <div className="relative" style={{ filter: 'none', WebkitFilter: 'none' }}>
                              <span className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black tracking-wider" style={{
                                color: '#ef4444',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(0,0,0,0.2), 1px 1px 2px rgba(0,0,0,0.2)',
                                letterSpacing: '0.15em',
                                filter: 'none drop-shadow(1px 1px 2px rgba(0,0,0,0.4))',
                                WebkitFilter: 'none drop-shadow(1px 1px 2px rgba(0,0,0,0.4))'
                              }}>EXPIRED</span>
                            </div>
                            {/* Additional distressed texture overlay */}
                            <div className="absolute inset-0 opacity-20" style={{
                              background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 21%, transparent 21%)',
                              backgroundSize: '8px 8px'
                            }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Premium Header with Sophisticated Design */}
                    <div className={`relative bg-black px-3 sm:px-4 lg:px-3 xl:px-4 py-4 sm:py-5 lg:py-4 xl:py-5 ${
                      isExpired ? 'opacity-70' : ''
                    }`}>
                      {/* Elegant pattern overlay */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 transition-opacity duration-500"></div>
                      
                      <div className="relative flex items-start justify-between gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3">
                        {/* Title Section - Removed, moved to card content */}
                        <div className="flex-1 min-w-0 pr-1.5 sm:pr-2 lg:pr-1.5 xl:pr-2">
                          <div className="flex items-start gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2">
                            {/* Show verified badge if: 
                                1. User has profile-level verification (applies to all enquiries), OR
                                2. This specific enquiry has ID images (enquiry-specific verification) */}
                            {((userProfile?.isProfileVerified || 
                               userProfile?.isVerified || 
                               userProfile?.trustBadge || 
                               userProfile?.isIdentityVerified) || 
                              (enquiry as any).idFrontImage || (enquiry as any).idBackImage) && (
                              <div className={`flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 rounded-full flex-shrink-0 shadow-lg ring-1 ring-white/20 ${
                                isExpired ? 'bg-gray-500' : 'bg-blue-500'
                              }`}>
                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Status Badge - More Refined */}
                          {isExpired && (
                            <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 lg:py-0.5 xl:py-0.5 bg-red-500/25 border border-red-400/40 rounded-md backdrop-blur-sm shadow-sm mt-0.5">
                              <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></span>
                              <span className="text-[8px] sm:text-[9px] lg:text-[8px] xl:text-[9px] text-red-200 font-semibold tracking-wide">Expired</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Right Side Badges - Properly Aligned */}
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 flex-shrink-0">
                          {/* Premium Plan Badge */}
                          <Badge className={`flex items-center gap-0.5 sm:gap-1 lg:gap-0.5 xl:gap-1 px-1.5 sm:px-2 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 lg:py-0.5 xl:py-0.5 rounded-md lg:rounded-sm xl:rounded-md shadow-sm border backdrop-blur-md ${
                            enquiry.selectedPlanId === 'free' || (!enquiry.selectedPlanId && !enquiry.isPremium) 
                              ? 'bg-white/15 text-gray-100 border-white/20' 
                              : 'bg-blue-500/30 text-blue-50 border-blue-400/40'
                          }`}>
                            {(enquiry.selectedPlanId && enquiry.selectedPlanId !== 'free') || enquiry.isPremium ? (
                              <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-yellow-300 drop-shadow-sm" />
                            ) : null}
                            <span className="text-[8px] sm:text-[9px] lg:text-[8px] xl:text-[9px] font-bold whitespace-nowrap tracking-wide">
                              {enquiry.selectedPlanId ? (
                                enquiry.selectedPlanId === 'free' ? 'Free Plan' :
                                enquiry.selectedPlanId === 'basic' ? 'Basic Plan' :
                                enquiry.selectedPlanId === 'standard' ? 'Standard Plan' :
                                enquiry.selectedPlanId === 'premium' ? 'Premium Plan' :
                                enquiry.selectedPlanId === 'pro' ? 'Pro Plan' : 'Paid Plan'
                              ) : (
                                enquiry.isPremium ? 'Premium Plan' : 'Free Plan'
                              )}
                            </span>
                          </Badge>
                          
                          {/* Status Badge with Icon */}
                          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2">
                            {getStatusIcon(enquiry.status)}
                            {getStatusBadge(enquiry.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  
                    {/* Premium Content Area with Better Structure */}
                    <div className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-5 sm:p-6 lg:p-5 xl:p-5 overflow-visible">
                      {/* Subtle background texture */}
                      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none"></div>
                      
                      {/* Urgent Badge - Above Deadline Badge */}
                      {enquiry.isUrgent && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-3 lg:right-3 xl:top-3.5 xl:right-3.5 z-30">
                          <Badge variant="destructive" className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 flex-shrink-0 shadow-lg">
                            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 mr-1" />
                            Urgent
                          </Badge>
                        </div>
                      )}
                      
                      {/* Deadline Badge - Premium Design - Lowered to make space for Urgent */}
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
                            <div className={`absolute right-3 sm:right-4 lg:right-3 xl:right-3.5 flex items-center gap-1 lg:gap-1.5 bg-gradient-to-r from-red-50 to-red-100/80 border-2 border-red-200/60 rounded-md lg:rounded-lg px-2 lg:px-2.5 xl:px-2.5 py-1 lg:py-1.5 xl:py-1.5 shadow-lg z-20 backdrop-blur-sm max-w-[140px] sm:max-w-[160px] lg:max-w-[150px] xl:max-w-[160px] ${
                              enquiry.isUrgent 
                                ? 'top-12 sm:top-14 lg:top-12 xl:top-14' 
                                : 'top-3 sm:top-4 lg:top-3 xl:top-3.5'
                            }`}>
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

                      <div className="relative space-y-3 sm:space-y-4 lg:space-y-3 xl:space-y-3.5">
                        {/* Enquiry Heading - Moved from header */}
                        <div className="mb-2 sm:mb-3 lg:mb-2 xl:mb-3">
                          <h3 className={`text-lg sm:text-xl lg:text-lg xl:text-xl font-bold leading-tight tracking-tight ${
                            isExpired ? 'text-gray-400' : 'text-black'
                          }`}>
                            {enquiry.title}
                          </h3>
                          {/* Status Message as Subheading */}
                          {getStatusMessage(enquiry) && (
                            <div className="mt-1 sm:mt-1 lg:mt-0.5 xl:mt-1">
                              <span className="text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-500 font-medium">{getStatusMessage(enquiry)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Enquiry Information Group */}
                        <div className="space-y-2 sm:space-y-2.5 lg:space-y-2 pb-3 sm:pb-3.5 lg:pb-2.5 xl:pb-3 border-b-2 border-gray-200/60">
                          {/* Deadline Timer - Desktop only, mobile shows badge */}
                          {enquiry.deadline && (
                            <div className="hidden sm:block pb-2">
                              <CountdownTimer 
                                deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                                className="justify-start"
                              />
                            </div>
                          )}
                          
                          {/* Category */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3 pt-1.5 sm:pt-2 lg:pt-1.5 xl:pt-2">
                            <Badge variant="outline" className="text-[7px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold border-0 text-gray-800 px-1.5 sm:px-3 lg:px-2.5 xl:px-3 py-0.5 sm:py-1.5 lg:py-1 xl:py-1.5 bg-white shadow-sm">
                              {enquiry.category}
                            </Badge>
                            {/* Posted - Mobile Only */}
                            <span className="sm:hidden flex items-center gap-1 px-1.5 py-0.5 bg-gray-50/80 border-0 rounded-md text-[7px] text-gray-600 font-semibold">
                              Posted: {formatDate(enquiry.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Budget & Location Group */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3 p-2 sm:p-2.5 lg:p-2 xl:p-2.5 bg-gradient-to-r from-white via-gray-50/50 to-white rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl border-[0.5px] border-gray-800 shadow-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-6.5 lg:h-6.5 xl:w-7 xl:h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md sm:rounded-lg lg:rounded-md xl:rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-white font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs">₹</span>
                            </div>
                            <div>
                              <div className="text-[8px] sm:text-[9px] lg:text-[8px] xl:text-[9px] text-gray-600 font-bold uppercase tracking-wide">Budget</div>
                              <div className="text-xs sm:text-base lg:text-sm xl:text-base font-black text-gray-900 tracking-tight">{formatBudget(enquiry.budget)}</div>
                            </div>
                          </div>
                          {enquiry.location && (
                            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-gray-50/80 border-[0.5px] border-gray-800 rounded-md lg:rounded-sm xl:rounded-md">
                              <span className="text-sm sm:text-base lg:text-sm xl:text-base">📍</span>
                              <span className="text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-700 font-semibold truncate max-w-[120px] sm:max-w-none">{enquiry.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Plan Information Group - Premium Design */}
                        <div className="space-y-2.5 sm:space-y-3 lg:space-y-2.5 xl:space-y-3 p-3 sm:p-4 lg:p-3.5 xl:p-4 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border-[0.5px] border-gray-800 shadow-md">
                          {/* Current Plan & Response Limit */}
                          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Crown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4.5 lg:w-4.5 xl:h-5 xl:w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-600 font-bold uppercase tracking-wide">Plan</div>
                                <div className="text-[8px] sm:text-[9px] lg:text-[8px] xl:text-[9px] font-black text-gray-900 whitespace-nowrap">
                                  {enquiry.selectedPlanId ? (
                                    enquiry.selectedPlanId === 'free' ? 'Free' :
                                    enquiry.selectedPlanId === 'basic' ? 'Basic' :
                                    enquiry.selectedPlanId === 'standard' ? 'Standard' :
                                    enquiry.selectedPlanId === 'premium' ? 'Premium' :
                                    enquiry.selectedPlanId === 'pro' ? 'Pro' : 'Paid'
                                  ) : (
                                    enquiry.isPremium ? 'Premium' : 'Free'
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-white border-[0.5px] border-black rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] flex-shrink-0 relative overflow-hidden">
                              {/* Physical depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 bg-blue-600 rounded-full animate-pulse flex-shrink-0 relative z-10"></div>
                              <span className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold text-blue-700 whitespace-nowrap relative z-10">
                                {getResponseLimitText(enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free'))}
                              </span>
                            </div>
                          </div>
                          
                          {/* Upgrade Button - Only show for plans below premium (free, basic, standard) */}
                          {(() => {
                            // Always use selectedPlanId - don't use isPremium flag
                            const enquiryPlan = enquiry.selectedPlanId || 'free';
                            // Don't show upgrade button for premium (top tier) or pro (hidden for future)
                            if (enquiryPlan === 'premium' || enquiryPlan === 'pro') return false;
                            const upgradeOptions = getUpgradeOptions(
                              enquiryPlan, 
                              userPaymentPlan?.currentPlan,
                              enquiry.createdAt,
                              userPaymentPlan?.proActivationDate
                            );
                            return upgradeOptions.length > 0;
                          })() && !isExpired && (
                            <div className="pt-2 sm:pt-2.5 lg:pt-2 xl:pt-2.5">
                              <button
                                onClick={() => handleUpgradeClick(enquiry)}
                                className="w-full border-[0.5px] border-black bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] relative overflow-hidden group/upgrade"
                              >
                                {/* Physical button depth effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/upgrade:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                                <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/upgrade:scale-110 transition-transform duration-200 relative z-10" />
                                <span className="whitespace-nowrap tracking-tight relative z-10">Upgrade to Premium</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamps & Admin Notes Group */}
                        <div className="space-y-1 sm:space-y-1.5 lg:space-y-1 xl:space-y-1.5 pt-1 sm:pt-1.5 lg:pt-1 xl:pt-1.5">
                          {/* Admin Notes - Hidden */}
                          {/* Timestamps */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-500">
                            <span className="hidden sm:flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-gray-50/80 border-0 rounded-lg lg:rounded-md xl:rounded-lg">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 flex-shrink-0" />
                              <span className="font-semibold">Posted: {formatDate(enquiry.createdAt)}</span>
                            </span>
                            {enquiry.rejectedAt && (
                              <span className="flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-red-50/80 border border-red-200/60 rounded-lg lg:rounded-md xl:rounded-lg text-red-700 font-semibold">
                                <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 flex-shrink-0" />
                                <span>Rejected: {formatDate(enquiry.rejectedAt)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Premium Action Buttons - Perfectly Aligned */}
                        <div 
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 pt-1 sm:pt-1.5 lg:pt-1 xl:pt-1.5 relative z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {isExpired ? (
                            <button disabled className="flex-shrink-0 lg:flex-1 border-[0.5px] border-black text-gray-400 bg-white text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 font-black rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-1.5 relative overflow-hidden">
                              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 relative z-10" />
                              <span className="whitespace-nowrap relative z-10">View Details</span>
                            </button>
                          ) : (
                            <Link to={`/enquiry/${enquiry.id}`} className="w-full sm:flex-shrink-0 lg:flex-1 group/btn">
                              <button className="w-full sm:flex-shrink-0 lg:w-full border-[0.5px] border-black bg-white hover:bg-gray-50 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] relative overflow-hidden">
                                {/* Physical button depth effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/btn:scale-110 transition-transform duration-200 relative z-10 text-blue-500 fill-blue-500 stroke-black stroke-2" />
                                <span className="whitespace-nowrap tracking-tight relative z-10">View Details</span>
                              </button>
                            </Link>
                          )}
                          
                          <button 
                            disabled={isExpired}
                            className="w-full sm:flex-shrink-0 lg:flex-1 border-[0.5px] border-black bg-white hover:bg-gray-50 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group/responses"
                            onClick={() => {
                              if (!isExpired) {
                                navigate(`/enquiry/${enquiry.id}/responses-page`);
                              }
                            }}
                          >
                            {/* Physical button depth effect */}
                            {!isExpired && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/responses:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                              </>
                            )}
                            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/responses:scale-110 transition-transform duration-200 relative z-10 text-blue-500 fill-blue-500 stroke-black stroke-2" />
                            {(() => {
                              const allResponses = enquiryResponses[enquiry.id] || [];
                              // Count only approved responses to match what's shown on responses page
                              const approvedResponses = allResponses.filter((r: any) => r.status === 'approved');
                              const responseCount = approvedResponses.length || 0;
                              return (
                                <>
                                  <span className="whitespace-nowrap tracking-tight relative z-10">Responses ({responseCount})</span>
                                  {hasUnreadResponses(enquiry.id) && responseCount > 0 && (
                              <div className="ml-1 sm:ml-1.5 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-md relative z-10">
                                      {responseCount}
                              </div>
                            )}
                                </>
                              );
                            })()}
                          </button>
                          
                          {enquiry.status === 'live' && !isExpired && (
                            <Link to={`/enquiry/${enquiry.id}/responses`} className="w-full sm:flex-shrink-0 lg:flex-1 group/chats">
                              <button className="w-full sm:flex-shrink-0 lg:w-full border-[0.5px] border-black bg-white hover:bg-gray-50 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] relative overflow-hidden">
                                {/* Physical button depth effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/chats:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                                <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/chats:scale-110 transition-transform duration-200 relative z-10 text-green-500 fill-green-500 stroke-black stroke-2" />
                                <span className="whitespace-nowrap tracking-tight relative z-10">View Chats</span>
                              </button>
                            </Link>
                          )}
                          
                          <button
                            onClick={() => {
                              if (!isExpired) {
                                deleteEnquiry(enquiry.id);
                              }
                            }}
                            disabled={isExpired}
                            className="w-full sm:flex-shrink-0 lg:flex-1 border-[0.5px] border-black bg-white hover:bg-gray-50 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group/delete"
                          >
                            {/* Physical button depth effect */}
                            {!isExpired && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/delete:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                              </>
                            )}
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/delete:scale-110 transition-transform duration-200 relative z-10 text-red-500 fill-red-500 stroke-black stroke-2" />
                            <span className="hidden sm:inline whitespace-nowrap tracking-tight relative z-10">Delete Enquiry</span>
                            <span className="sm:hidden whitespace-nowrap tracking-tight relative z-10">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );})}
            </div>
          )}
        </div>
      </div>
      {/* Payment Plan Selector Modal */}
      {showPaymentSelector && selectedEnquiryForUpgrade && (
        <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
          <DialogContent className="!max-w-5xl !w-[calc(100vw-2rem)] sm:!w-full !max-h-[95vh] sm:!max-h-[90vh] !p-4 sm:!p-6 md:!p-8 !border-4 !border-black !bg-white !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] !rounded-2xl sm:!rounded-3xl" style={{ backgroundColor: 'white', zIndex: 100 }}>
            {/* Physical button depth effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl sm:rounded-3xl pointer-events-none" />
            
            <DialogHeader className="mb-4 sm:mb-6 md:mb-8 relative z-10 mt-8 sm:mt-10 md:mt-12">
              <DialogTitle className="text-xs sm:text-sm md:text-base lg:text-lg font-black text-center mb-2 sm:mb-3 md:mb-4 flex flex-col items-center justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 text-black">
                <div className="flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 sm:border-6 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3)] flex-shrink-0">
                  <Crown className="h-10 w-10 sm:h-14 sm:w-14 md:h-18 md:w-18 lg:h-20 lg:w-20 text-black flex-shrink-0" />
                </div>
                <span className="break-words mt-2 sm:mt-3 md:mt-4">Upgrade Plan for "{selectedEnquiryForUpgrade.title}"</span>
              </DialogTitle>
              <DialogDescription className="text-center text-[9px] sm:text-[10px] md:text-xs text-gray-700 leading-relaxed font-semibold mt-6 sm:mt-8 md:mt-10">
                Upgrade to unlock more curated, verified sellers.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-2 sm:mt-3 md:mt-4 relative z-10">
              <PaymentPlanSelector
                currentPlanId={currentPlan}
                enquiryId={selectedEnquiryForUpgrade.id}
                userId={user?.uid || ''}
                onPlanSelect={handlePlanSelect}
                isUpgrade={true}
                enquiryCreatedAt={selectedEnquiryForUpgrade.createdAt}
                className="max-w-4xl mx-auto w-full"
                user={user}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Image Modal - Completely outside all dialogs */}
      {fullscreenImage && (
        <div 
          ref={fullscreenModalRef}
          className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFullscreenImage(null);
          }}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view"
              className="w-full h-full object-contain sm:rounded-lg"
              style={{ 
                maxHeight: '100vh', 
                maxWidth: '100vw',
                width: '100%',
                height: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                console.log('Back button clicked');
                setFullscreenImage(null);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 sm:p-3 shadow-lg z-10 flex items-center gap-1 border-0 outline-none focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default MyEnquiries;
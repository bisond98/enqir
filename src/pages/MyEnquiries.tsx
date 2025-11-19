import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Edit, Trash2, Plus, Image as ImageIcon, Crown, X, ArrowRight, Zap, TrendingUp, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
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
  status: 'pending' | 'live' | 'rejected' | 'completed';
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
}

const MyEnquiries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const fullscreenModalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
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
      live: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    
    return (
      <Badge className={`text-[10px] sm:text-xs rounded-full border ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />;
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
    if (!plan) return 'Shows 2 responses';
    
    switch (planId) {
      case 'free':
        return 'Shows 2 responses';
      case 'basic':
        return 'Shows 5 responses';
      case 'standard':
        return 'Shows 10 responses';
      case 'premium':
        return 'Shows unlimited responses';
      case 'pro':
        return 'Shows unlimited responses';
      default:
        return 'Shows 2 responses';
    }
  };

  const getStatusMessage = (enquiry: Enquiry) => {
    switch (enquiry.status) {
      case 'live':
        return 'Your enquiry is live and receiving responses from sellers';
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          {/* Professional Header - Matching Dashboard Style */}
          <div className="mb-6 sm:mb-12 lg:mb-16">
            <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-8 lg:p-10 overflow-hidden">
              {/* Header Section with Back Button */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </Button>
                </div>
              </div>
              
              {/* Content Card - White Background */}
              <div className="bg-white border border-gray-800 rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                    <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Enquiries
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
                    Track & manage your fuckiin' enquiries
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Post New Enquiry Button */}
          <div className="flex justify-center mb-6 sm:mb-10 lg:mb-12">
            <Link to="/post-enquiry" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white px-6 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg font-black shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-gray-800 hover:border-gray-900 flex items-center justify-center gap-2 sm:gap-3">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>post a fu**in' need</span>
              </Button>
            </Link>
          </div>

          {/* Professional Stats Summary with Animations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-10 lg:mb-12">
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
              const pendingCount = enquiries.filter(e => e.status === 'pending' && !isExpired(e)).length;
              const completedCount = enquiries.filter(e => e.status === 'completed' || isExpired(e)).length;
              const totalCount = enquiries.length;
              
              return (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="group p-4 sm:p-6 lg:p-8 text-center border-2 border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-default hover:scale-105">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-blue-600 mb-2 sm:mb-3 tracking-tight">{totalCount}</div>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-700 font-bold uppercase tracking-wider">Total Enquiries</p>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Card className="group p-4 sm:p-6 lg:p-8 text-center border-2 border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-default hover:scale-105">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-emerald-600 mb-2 sm:mb-3 tracking-tight">{liveCount}</div>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-700 font-bold uppercase tracking-wider">Live</p>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Card className="group p-4 sm:p-6 lg:p-8 text-center border-2 border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-default hover:scale-105">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Clock className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-amber-600 mb-2 sm:mb-3 tracking-tight">{pendingCount}</div>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-700 font-bold uppercase tracking-wider">Pending</p>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Card className="group p-4 sm:p-6 lg:p-8 text-center border-2 border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-default hover:scale-105">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Star className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-600 mb-2 sm:mb-3 tracking-tight">{completedCount}</div>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-700 font-bold uppercase tracking-wider">Completed</p>
                    </Card>
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
              <Card className="p-8 sm:p-12 lg:p-16 text-center border-2 border-gray-800 border-dashed shadow-xl bg-gradient-to-br from-gray-50 via-white to-gray-50/50 rounded-2xl sm:rounded-3xl lg:rounded-[2rem]">
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
                return (
                <motion.div
                  key={enquiry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={`group relative rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden transition-all duration-300 ${
                    isExpired
                      ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-800 shadow-sm'
                      : 'bg-white border-2 border-gray-800 hover:border-gray-900 hover:shadow-2xl shadow-lg cursor-pointer transform hover:-translate-y-1.5 hover:scale-[1.01] lg:hover:scale-[1.02]'
                  }`}>
                    {/* Premium Header with Sophisticated Design */}
                    <div className={`relative bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 px-5 sm:px-6 lg:px-4 xl:px-4 py-4 sm:py-5 lg:py-3 xl:py-3.5 ${
                      isExpired ? 'opacity-70' : ''
                    }`}>
                      {/* Elegant pattern overlay */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 transition-opacity duration-500"></div>
                      
                      <div className="relative flex items-start justify-between gap-3 sm:gap-4 lg:gap-3 xl:gap-3.5">
                        {/* Title Section with Better Typography */}
                        <div className="flex-1 min-w-0 pr-2 sm:pr-3 lg:pr-2 xl:pr-2.5">
                          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-2 xl:gap-2.5 mb-2.5 lg:mb-1.5 xl:mb-2">
                            {getStatusIcon(enquiry.status)}
                            <h3 className={`text-sm sm:text-lg lg:text-sm xl:text-base font-bold truncate leading-snug tracking-tight ${
                              isExpired ? 'text-gray-400' : 'text-white drop-shadow-sm'
                            }`}>
                              {enquiry.title}
                            </h3>
                            {((enquiry as any).isUserVerified || (enquiry as any).userProfileVerified) && (
                              <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5 rounded-full flex-shrink-0 shadow-lg ring-2 ring-white/20 ${
                                isExpired ? 'bg-gray-500' : 'bg-blue-500'
                              }`}>
                                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Status Badge - More Refined */}
                          {isExpired && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-0.5 xl:py-1 bg-red-500/25 border border-red-400/40 rounded-md lg:rounded-md xl:rounded-md backdrop-blur-sm shadow-sm mt-0.5 lg:mt-0.5 xl:mt-0.5">
                              <span className="w-1.5 h-1.5 lg:w-1.5 lg:h-1.5 xl:w-1.5 xl:h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                              <span className="text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] text-red-200 font-semibold tracking-wide">Expired</span>
                            </div>
                          )}
                          
                          {/* Status Message */}
                          <div className="mt-2 sm:mt-2.5 lg:mt-1.5 xl:mt-2">
                            <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-300 font-semibold opacity-95">{getStatusMessage(enquiry)}</span>
                          </div>
                        </div>
                        
                        {/* Premium Plan Badge */}
                        <Badge className={`flex items-center gap-1.5 sm:gap-2 lg:gap-1 xl:gap-1.5 px-3 sm:px-4 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 lg:py-1 xl:py-1.5 rounded-xl lg:rounded-md xl:rounded-lg shadow-lg border backdrop-blur-md ${
                          enquiry.selectedPlanId === 'free' || (!enquiry.selectedPlanId && !enquiry.isPremium) 
                            ? 'bg-white/15 text-gray-100 border-white/20' 
                            : 'bg-blue-500/30 text-blue-50 border-blue-400/40'
                        } flex-shrink-0`}>
                          {(enquiry.selectedPlanId && enquiry.selectedPlanId !== 'free') || enquiry.isPremium ? (
                            <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 text-yellow-300 drop-shadow-sm" />
                          ) : null}
                          <span className="text-[10px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold whitespace-nowrap tracking-wide">
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
                        
                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {getStatusBadge(enquiry.status)}
                        </div>
                      </div>
                    </div>
                  
                    {/* Premium Content Area with Better Structure */}
                    <div className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-5 sm:p-6 lg:p-4 xl:p-4">
                      {/* Subtle background texture */}
                      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none"></div>
                      
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

                      <div className="relative space-y-3 sm:space-y-4 lg:space-y-3 xl:space-y-3.5">
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
                          
                          {/* Description */}
                          <div className="flex items-start gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5">
                            {enquiry.isUrgent && (
                              <Badge variant="destructive" className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-0.5 sm:py-1 lg:py-0.5 xl:py-0.5 flex-shrink-0">
                                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 mr-1" />
                                Urgent
                              </Badge>
                            )}
                            <p className={`text-xs sm:text-sm lg:text-xs xl:text-sm text-gray-900 leading-snug line-clamp-2 font-semibold flex-1 ${enquiry.deadline ? 'pr-0 sm:pr-28 lg:pr-28 xl:pr-32' : ''}`}>
                              {enquiry.description}
                            </p>
                          </div>
                          
                          {/* Stats & Category */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-2.5 xl:gap-3 pt-1.5 sm:pt-2 lg:pt-1.5 xl:pt-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/60 rounded-lg lg:rounded-md xl:rounded-lg shadow-sm">
                              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-700 font-bold">{enquiry.responses || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/60 rounded-lg lg:rounded-md xl:rounded-lg shadow-sm">
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-gray-600 flex-shrink-0" />
                              <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-700 font-bold">{enquiry.views || 0}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold border-2 border-gray-300/80 text-gray-800 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-white shadow-sm">
                              {enquiry.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Budget & Location Group */}
                        <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-3 xl:gap-4 p-3 sm:p-4 lg:p-3 xl:p-3.5 bg-gradient-to-r from-white via-gray-50/50 to-white rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border-2 border-gray-800 shadow-md">
                          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                              <span className="text-white font-black text-xs sm:text-sm lg:text-xs xl:text-sm">₹</span>
                            </div>
                            <div>
                              <div className="text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-600 font-bold uppercase tracking-wide">Budget</div>
                              <div className="text-sm sm:text-lg lg:text-base xl:text-lg font-black text-gray-900 tracking-tight">{formatBudget(enquiry.budget)}</div>
                            </div>
                          </div>
                          {enquiry.location && (
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 lg:py-1.5 xl:py-2 bg-gray-50/80 border-2 border-gray-800 rounded-lg lg:rounded-md xl:rounded-lg">
                              <span className="text-base sm:text-lg lg:text-base xl:text-lg">📍</span>
                              <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-700 font-semibold truncate max-w-[120px] sm:max-w-none">{enquiry.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Plan Information Group - Premium Design */}
                        <div className="space-y-2.5 sm:space-y-3 lg:space-y-2.5 xl:space-y-3 p-3 sm:p-4 lg:p-3.5 xl:p-4 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 rounded-xl sm:rounded-2xl lg:rounded-xl xl:rounded-2xl border-2 border-gray-800 shadow-md">
                          {/* Current Plan & Response Limit */}
                          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Crown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4.5 lg:w-4.5 xl:h-5 xl:w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-600 font-bold uppercase tracking-wide">Plan</div>
                                <div className="text-xs sm:text-sm lg:text-xs xl:text-sm font-black text-gray-900 truncate">
                                  {enquiry.selectedPlanId ? (
                                    enquiry.selectedPlanId === 'free' ? 'Free' :
                                    enquiry.selectedPlanId === 'basic' ? 'Basic (₹99)' :
                                    enquiry.selectedPlanId === 'standard' ? 'Standard (₹199)' :
                                    enquiry.selectedPlanId === 'premium' ? 'Premium (₹499)' :
                                    enquiry.selectedPlanId === 'pro' ? 'Pro (₹1,499)' : 'Paid'
                                  ) : (
                                    enquiry.isPremium ? 'Premium (Legacy)' : 'Free'
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 xl:gap-2 px-2.5 sm:px-3 lg:px-2.5 xl:px-3 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-blue-100/80 border-2 border-gray-800 rounded-lg lg:rounded-md xl:rounded-lg flex-shrink-0">
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 bg-blue-600 rounded-full animate-pulse flex-shrink-0"></div>
                              <span className="text-[9px] sm:text-xs lg:text-[9px] xl:text-[10px] font-bold text-blue-700 whitespace-nowrap">
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
                            <div className="pt-2 sm:pt-2.5 lg:pt-2 xl:pt-2.5 border-t-2 border-blue-200/60">
                              <Button
                                onClick={() => handleUpgradeClick(enquiry)}
                                className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2.5 lg:py-2 xl:py-2.5 font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg lg:rounded-md xl:rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-gray-800 hover:border-gray-900"
                                size="sm"
                              >
                                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
                                Upgrade to Premium
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Timestamps & Admin Notes Group */}
                        <div className="space-y-2.5 sm:space-y-3 lg:space-y-2.5 xl:space-y-3 pt-2.5 sm:pt-3 lg:pt-2.5 xl:pt-3 border-t-2 border-gray-200/60">
                          {/* Admin Notes */}
                          {enquiry.adminNotes && (
                            <div className="p-3 sm:p-3.5 lg:p-3 xl:p-3.5 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl shadow-sm">
                              <div className="flex items-start gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-6 lg:h-6 xl:w-7 xl:h-7 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs font-bold text-gray-900 mb-1 sm:mb-1.5 lg:mb-1 xl:mb-1.5">Admin Notes:</h4>
                                  <p className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-gray-700 leading-snug">{enquiry.adminNotes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Timestamps */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-gray-500">
                            <span className="flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-gray-50/80 border border-gray-200/60 rounded-lg lg:rounded-md xl:rounded-lg">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 flex-shrink-0" />
                              <span className="font-semibold">Created: {formatDate(enquiry.createdAt)}</span>
                            </span>
                            {enquiry.approvedAt && (
                              <span className="flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5 px-2 sm:px-2.5 lg:px-2 xl:px-2.5 py-1 sm:py-1.5 lg:py-1 xl:py-1.5 bg-green-50/80 border border-green-200/60 rounded-lg lg:rounded-md xl:rounded-lg text-green-700 font-semibold">
                                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 flex-shrink-0" />
                                <span>Approved: {formatDate(enquiry.approvedAt)}</span>
                              </span>
                            )}
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
                          className="grid grid-cols-1 sm:flex sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 lg:gap-2 xl:gap-2.5 pt-3 sm:pt-3.5 lg:pt-3 xl:pt-3.5 border-t-2 border-gray-200/60 relative z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {isExpired ? (
                            <Button variant="outline" size="sm" disabled className="w-full sm:flex-none border-2 border-gray-800 text-gray-400 bg-gray-100 text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2 lg:py-1.5 xl:py-2 px-3 sm:px-4 lg:px-3 xl:px-3.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0" />
                              <span className="whitespace-nowrap">View Details</span>
                            </Button>
                          ) : (
                            <Link to={`/enquiry/${enquiry.id}`} className="w-full sm:flex-none min-w-[110px] sm:min-w-[130px] lg:min-w-[110px] xl:min-w-[120px]">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto border-2 border-gray-800 hover:border-gray-900 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2 lg:py-1.5 xl:py-2 px-3 sm:px-4 lg:px-3 xl:px-3.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group/btn">
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 group-hover/btn:scale-110 transition-transform" />
                                <span className="whitespace-nowrap tracking-tight">View Details</span>
                              </Button>
                            </Link>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isExpired}
                            className="w-full sm:flex-none min-w-[110px] sm:min-w-[140px] lg:min-w-[120px] xl:min-w-[130px] border-2 border-gray-800 hover:border-gray-900 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2 lg:py-1.5 xl:py-2 px-3 sm:px-4 lg:px-3 xl:px-3.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group/responses"
                            onClick={() => {
                              if (!isExpired) {
                                navigate(`/enquiry/${enquiry.id}/responses-page`);
                              }
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 group-hover/responses:scale-110 transition-transform" />
                            <span className="whitespace-nowrap tracking-tight">Responses ({enquiryResponses[enquiry.id]?.length || 0})</span>
                          </Button>
                          
                          {enquiry.status === 'live' && !isExpired && (
                            <Link to={`/enquiry/${enquiry.id}/responses`} className="w-full sm:flex-none min-w-[100px] sm:min-w-[120px] lg:min-w-[100px] xl:min-w-[110px]">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto border-2 border-gray-800 hover:border-gray-900 bg-white text-gray-700 hover:bg-gray-50 hover:text-emerald-700 text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2 lg:py-1.5 xl:py-2 px-3 sm:px-4 lg:px-3 xl:px-3.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group/chats">
                                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 group-hover/chats:scale-110 transition-transform" />
                                <span className="whitespace-nowrap tracking-tight">View Chats</span>
                              </Button>
                            </Link>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!isExpired) {
                                deleteEnquiry(enquiry.id);
                              }
                            }}
                            disabled={isExpired}
                            className="w-full sm:flex-none border-2 border-gray-800 hover:border-gray-900 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-2 sm:py-2 lg:py-1.5 xl:py-2 px-3 sm:px-4 lg:px-3 xl:px-3.5 font-bold rounded-lg lg:rounded-md xl:rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group/delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 mr-1.5 sm:mr-2 lg:mr-1.5 xl:mr-2 flex-shrink-0 group-hover/delete:scale-110 transition-transform" />
                            <span className="hidden sm:inline whitespace-nowrap tracking-tight">Delete Enquiry</span>
                            <span className="sm:hidden whitespace-nowrap tracking-tight">Delete</span>
                          </Button>
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
          <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 mx-auto">
            <DialogHeader className="mb-4 sm:mb-6 md:mb-8">
              <DialogTitle className="text-sm sm:text-base md:text-lg font-bold text-center mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                <span className="break-words">Upgrade Plan for "{selectedEnquiryForUpgrade.title}"</span>
              </DialogTitle>
              <DialogDescription className="text-center text-[11px] sm:text-xs md:text-sm text-slate-600 leading-relaxed">
                Select a plan to unlock premium responses
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-2 sm:mt-3 md:mt-4">
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

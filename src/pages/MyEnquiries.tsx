import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Edit, Trash2, Plus, Image as ImageIcon, Crown, X, ArrowRight } from "lucide-react";
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
        console.log('MyEnquiries: Ordered live then expired:', { live: live.length, expired: expired.length });
        setEnquiries(combined);
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
    
    // Update the enquiry in the database
    try {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { updateUserPaymentPlan, savePaymentRecord } = await import('@/services/paymentService');
      
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
    const currentPlanId = enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free');
    console.log('🚀 Upgrade clicked for enquiry:', {
      enquiryId: enquiry.id,
      currentPlanId: currentPlanId,
      selectedPlanId: enquiry.selectedPlanId,
      isPremium: enquiry.isPremium
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
        <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8">
          {/* Header with gray background */}
          <div className="mb-3 sm:mb-8 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 border-gray-700">
            {/* Header Section - Top 10% with gray background */}
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-3 py-3 sm:px-6 sm:py-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg text-white font-bold"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="text-center flex-1">
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                    Your Enquiries
                  </h1>
                </div>
                <div className="w-8 sm:w-10"></div> {/* Spacer for balance */}
              </div>
              <p className="text-gray-200 text-[10px] sm:text-xs lg:text-sm max-w-2xl mx-auto leading-relaxed text-center font-medium">
                Manage and track your requests
              </p>
            </div>
          </div>

          {/* Post New Enquiry Button */}
          <div className="flex justify-center mb-3 sm:mb-8">
            <Link to="/post-enquiry" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-black shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Post New Enquiry
              </Button>
            </Link>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-5 mb-3 sm:mb-8">
            <Card className="p-2.5 sm:p-6 text-center border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
              <div className="text-xl sm:text-4xl font-black text-blue-600 mb-1 sm:mb-2">{enquiries.length}</div>
              <p className="text-[9px] sm:text-sm text-gray-700 font-black uppercase tracking-wider">Total Enquiries</p>
            </Card>
            <Card className="p-2.5 sm:p-6 text-center border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
              <div className="text-xl sm:text-4xl font-black text-green-600 mb-1 sm:mb-2">{enquiries.filter(e => e.status === 'live').length}</div>
              <p className="text-[9px] sm:text-sm text-gray-700 font-black uppercase tracking-wider">Live</p>
            </Card>
            <Card className="p-2.5 sm:p-6 text-center border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
              <div className="text-xl sm:text-4xl font-black text-yellow-600 mb-1 sm:mb-2">{enquiries.filter(e => e.status === 'pending').length}</div>
              <p className="text-[9px] sm:text-sm text-gray-700 font-black uppercase tracking-wider">Pending</p>
            </Card>
            <Card className="p-2.5 sm:p-6 text-center border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
              <div className="text-xl sm:text-4xl font-black text-gray-600 mb-1 sm:mb-2">{enquiries.filter(e => e.status === 'completed').length}</div>
              <p className="text-[9px] sm:text-sm text-gray-700 font-black uppercase tracking-wider">Completed</p>
            </Card>
          </div>

          {/* Enquiries List */}
          {enquiries.length === 0 ? (
            <Card className="p-6 sm:p-12 text-center border-0 shadow-lg rounded-2xl">
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Eye className="h-6 w-6 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">No enquiries yet</h3>
              <p className="text-xs sm:text-base text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
                Start by posting your first enquiry to find what you're looking for in our community.
              </p>
              <Link to="/post-enquiry">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-base">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Post Your First Enquiry
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2.5 sm:space-y-6">
              {enquiries.map((enquiry) => {
                const isExpired = (() => {
                  if (!enquiry.deadline) return false;
                  const d = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                  return d < new Date();
                })();
                return (
                <Card key={enquiry.id} className={`${isExpired ? 'opacity-70 bg-gray-100 border-2 sm:border-4 border-gray-400 grayscale' : 'border-2 sm:border-4 border-blue-300'} shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                  {/* Card Header - Compact gray background */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-2.5 py-2 sm:px-6 sm:py-4 border-b-2 border-gray-700">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
                        {getStatusIcon(enquiry.status)}
                        <h3 className={`text-[11px] sm:text-lg font-black truncate ${isExpired ? 'text-gray-300' : 'text-white'} drop-shadow-sm`}>
                          {enquiry.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {isExpired && (
                          <Badge variant="outline" className="text-[8px] sm:text-xs text-gray-500 border border-gray-400 font-bold">Expired</Badge>
                        )}
                        {getStatusBadge(enquiry.status)}
                      </div>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <span className="text-[9px] sm:text-xs text-white font-bold opacity-95">{getStatusMessage(enquiry)}</span>
                    </div>
                  </div>
                  
                  {/* Card Content - Rest with white background */}
                  <CardContent className="p-2 sm:p-4 space-y-2 sm:space-y-3">

                    {/* Enquiry Information Group */}
                    <div className="space-y-1.5 sm:space-y-2 pb-2 border-b border-gray-200">
                      {/* Deadline Timer */}
                      {enquiry.deadline && (
                        <div className="pb-1.5">
                          <CountdownTimer 
                            deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                            className="justify-start"
                          />
                        </div>
                      )}
                      
                      {/* Description */}
                      {enquiry.isUrgent && (
                        <Badge variant="destructive" className="text-[8px] sm:text-xs font-bold mb-1">
                          ⚡ Urgent
                        </Badge>
                      )}
                      <p className="text-[10px] sm:text-sm text-gray-900 leading-snug line-clamp-2 font-bold">{enquiry.description}</p>
                      
                      {/* Stats & Category */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-1">
                        <span className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-black">
                          <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                          <span>{enquiry.responses || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-black">
                          <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
                          <span>{enquiry.views || 0}</span>
                        </span>
                        <Badge variant="outline" className="text-[8px] sm:text-xs font-black border border-gray-300 text-gray-800 px-1.5 py-0">
                          {enquiry.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Budget & Location Group */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-black text-[9px] sm:text-xs">₹</span>
                        </div>
                        <div>
                          <div className="text-[8px] sm:text-[9px] text-gray-600 font-bold">Budget</div>
                          <div className="text-xs sm:text-base font-black text-gray-900">{formatBudget(enquiry.budget)}</div>
                        </div>
                      </div>
                      {enquiry.location && (
                        <div className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-bold">
                          <span className="text-sm">📍</span>
                          <span className="truncate max-w-[120px] sm:max-w-none">{enquiry.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Plan Information Group - All plan data together */}
                    <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                      {/* Current Plan & Response Limit */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase">Plan</div>
                            <div className="text-[10px] sm:text-xs font-black text-gray-900 truncate">
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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                          <span className="text-[9px] sm:text-xs font-black text-blue-700">
                            {getResponseLimitText(enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free'))}
                          </span>
                        </div>
                      </div>

                      {/* Plan Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {enquiry.selectedPlanId && enquiry.selectedPlanId !== 'free' && (
                            <Badge className={`${
                              enquiry.selectedPlanId === 'basic' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              enquiry.selectedPlanId === 'standard' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              enquiry.selectedPlanId === 'premium' ? 'bg-blue-600 text-white border-blue-700' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            } text-[8px] sm:text-xs font-black border shadow-sm px-1.5 py-0`}>
                              {enquiry.selectedPlanId === 'basic' ? 'Basic' :
                               enquiry.selectedPlanId === 'standard' ? 'Standard' :
                               enquiry.selectedPlanId === 'premium' ? 'Premium' :
                               enquiry.selectedPlanId === 'pro' ? 'Pro' : 'Paid'}
                            </Badge>
                          )}
                          {!enquiry.selectedPlanId && enquiry.isPremium && (
                            <Badge className="bg-blue-600 text-white text-[8px] sm:text-xs font-black border border-blue-700 shadow-sm px-1.5 py-0">
                              Premium
                            </Badge>
                          )}
                          {!enquiry.selectedPlanId && !enquiry.isPremium && (
                            <Badge className="bg-gray-100 text-gray-800 text-[8px] sm:text-xs font-black border border-gray-300 shadow-sm px-1.5 py-0">
                              Free
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Upgrade Button - Only show for plans below premium (free, basic, standard) */}
                      {(() => {
                        const enquiryPlan = enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free');
                        // Don't show upgrade button for premium (top tier) or pro (hidden for future)
                        if (enquiryPlan === 'premium' || enquiryPlan === 'pro') return false;
                        const upgradeOptions = getUpgradeOptions(
                          enquiryPlan, 
                          userPaymentPlan?.currentPlan,
                          enquiry.createdAt,
                          userPaymentPlan?.proActivationDate
                        );
                        return upgradeOptions.length > 0;
                      })() && (
                        <div className="pt-1.5 border-t border-gray-200">
                          <Button
                            onClick={() => handleUpgradeClick(enquiry)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[9px] sm:text-xs py-1.5 sm:py-2 font-black shadow-md hover:shadow-lg transition-all duration-200 rounded"
                            size="sm"
                          >
                            <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                            Upgrade to Premium
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Timestamps & Admin Notes Group */}
                    <div className="space-y-1.5 pt-1.5 border-t border-gray-200">
                      {/* Admin Notes */}
                      {enquiry.adminNotes && (
                        <div className="p-2 bg-yellow-50 border-l-2 border-yellow-500 rounded">
                          <div className="flex items-start space-x-1.5">
                            <div className="w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[8px] font-bold">!</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[9px] font-bold text-gray-900 mb-0.5">Admin Notes:</h4>
                              <p className="text-gray-700 text-[9px] leading-tight">{enquiry.adminNotes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[8px] sm:text-[9px] text-gray-500">
                        <span className="flex items-center space-x-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="font-medium">Created: {formatDate(enquiry.createdAt)}</span>
                        </span>
                        {enquiry.approvedAt && (
                          <span className="flex items-center space-x-0.5 text-green-600 font-medium">
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span>Approved: {formatDate(enquiry.approvedAt)}</span>
                          </span>
                        )}
                        {enquiry.rejectedAt && (
                          <span className="flex items-center space-x-0.5 text-red-600 font-medium">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Rejected: {formatDate(enquiry.rejectedAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 border-t-2 border-gray-200 bg-gray-50 rounded-lg p-2 shadow-sm">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                        <Link to={`/enquiry/${enquiry.id}`} className="flex-1 sm:flex-none min-w-[100px]">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto border border-blue-400 text-blue-800 hover:bg-blue-100 hover:border-blue-500 text-[9px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 font-black shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                            <span className="whitespace-nowrap">View Details</span>
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 sm:flex-none min-w-[110px] sm:min-w-[140px] w-full sm:w-auto border border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400 text-[9px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 font-black shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                          onClick={() => navigate(`/enquiry/${enquiry.id}/responses-page`)}
                        >
                          <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                          <span className="whitespace-nowrap text-[8px] sm:text-xs">Responses ({enquiryResponses[enquiry.id]?.length || 0})</span>
                        </Button>
                        {enquiry.status === 'live' && (
                          <Link to={`/enquiry/${enquiry.id}/responses`} className="flex-1 sm:flex-none min-w-[100px]">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto border border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400 text-[9px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 font-black shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                              <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                              <span className="whitespace-nowrap">View Chats</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex justify-center sm:justify-end pt-1 border-t border-gray-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEnquiry(enquiry.id)}
                          className="border border-red-400 text-red-800 hover:bg-red-100 hover:border-red-500 text-[9px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 font-black shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">Delete Enquiry</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );})}
            </div>
          )}
        </div>
      </div>
      {/* Payment Plan Selector Modal */}
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

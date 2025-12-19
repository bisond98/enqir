import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Image as ImageIcon, Crown, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Filter } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot, updateDoc, getDoc as firestoreGetDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import PaymentPlanSelector from "@/components/PaymentPlanSelector";
import { PaymentPlan, PAYMENT_PLANS } from "@/config/paymentPlans";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  deadline: any;
  status: string;
  isUrgent: boolean;
  isPremium: boolean;
  selectedPlanId?: string;
  userId: string;
  createdAt: any;
  responses: number;
  likes: number;
  views: number;
  userLikes: string[];
  userProfileVerified: boolean;
  idFrontImage: string;
  idBackImage: string;
}

interface Response {
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
  userVerified?: boolean;
  isProfileVerified?: boolean;
  userProfileVerified?: boolean;
}

const EnquiryResponsesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enquiryId } = useParams<{ enquiryId: string }>();
  
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fullscreenModalRef = useRef<HTMLDivElement>(null);
  // User profiles for trust badge checking
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  
  // Payment plan selector state
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedEnquiryForUpgrade, setSelectedEnquiryForUpgrade] = useState<Enquiry | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  
  // Sorting state - default to oldest first (first come first)
  const [sortBy, setSortBy] = useState<'default' | 'price-high' | 'price-low' | 'newest' | 'oldest'>('oldest');
  // Filter state for trust-badged responses
  const [showOnlyTrustBadged, setShowOnlyTrustBadged] = useState(false);
  // Control dropdown open state to prevent auto-opening on mobile
  const [isTrustBadgeDropdownOpen, setIsTrustBadgeDropdownOpen] = useState(false);

  const sortResponses = (responses: Response[], sortType: string) => {
    console.log('🔍 SortResponses called:', { sortType, responseCount: responses.length, responses: responses.map(r => ({ id: r.id, price: r.price })) });
    const sorted = [...responses];
    
    switch (sortType) {
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.-]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.-]/g, '') || '0');
          console.log('Price high sort:', { priceA, priceB, result: priceB - priceA });
          return priceB - priceA;
        });
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.-]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.-]/g, '') || '0');
          console.log('Price low sort:', { priceA, priceB, result: priceA - priceB });
          return priceA - priceB;
        });
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          console.log('Newest sort:', { dateA: dateA.getTime(), dateB: dateB.getTime(), result: dateB.getTime() - dateA.getTime() });
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          console.log('Oldest sort:', { dateA: dateA.getTime(), dateB: dateB.getTime(), result: dateA.getTime() - dateB.getTime() });
          return dateA.getTime() - dateB.getTime();
        });
      case 'default':
      default:
        // Default: Show in submission order (first submitted first)
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          console.log('Default sort:', { dateA: dateA.getTime(), dateB: dateB.getTime(), result: dateA.getTime() - dateB.getTime() });
          return dateA.getTime() - dateB.getTime();
        });
    }
  };

  // Calculate visible responses with current sorting using useMemo for reactivity
  const visibleResponses = useMemo(() => {
    console.log('🔍 VisibleResponses useMemo called:', { enquiry: enquiry?.title, user: user?.uid, responsesCount: responses.length, sortBy });
    if (!enquiry || !user) return [];
    
    let filteredResponses = responses;
    
    // If user is the enquiry owner (buyer), apply plan limits based on their selected plan
    if (enquiry.userId === user.uid) {
      const planId = enquiry.selectedPlanId || 'free';
      
      // Determine response limit based on plan
      let responseLimit = 2; // Default free plan
      
      switch (planId) {
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
      
      // Apply limit
      if (responseLimit === -1) {
        filteredResponses = responses; // Unlimited for premium/pro
      } else {
        filteredResponses = responses.slice(0, responseLimit);
        console.log(`🔒 EnquiryResponsesPage: Limiting to ${responseLimit} responses for ${planId} plan`);
      }
    } else {
      // For sellers or other users, filter to only their own responses
      filteredResponses = responses.filter(r => r.sellerId === user.uid);
    }
    
    // Apply trust badge filter if enabled
    if (showOnlyTrustBadged) {
      filteredResponses = filteredResponses.filter(response => {
        // Check if response has trust badge (same logic as in card display)
        return (
          (userProfiles[response.sellerId]?.isProfileVerified || 
           userProfiles[response.sellerId]?.isVerified || 
           userProfiles[response.sellerId]?.trustBadge || 
           userProfiles[response.sellerId]?.isIdentityVerified) || 
          (response as any).userProfileVerified || 
          (response as any).isProfileVerified ||
          (response as any).userVerified ||
          response.isIdentityVerified ||
          (response as any).govIdUrl
        );
      });
    }
    
    // Apply sorting
    return sortResponses(filteredResponses, sortBy);
  }, [enquiry, user, responses, sortBy, showOnlyTrustBadged, userProfiles]);

  // Debug logging (can be removed in production)
  console.log('EnquiryResponsesPage: Debug info:', {
    enquiry: enquiry?.title,
    enquiryId,
    responsesCount: responses.length,
    visibleResponsesCount: visibleResponses.length,
    user: user?.uid,
    isOwner: enquiry?.userId === user?.uid,
    sortBy,
    sortedResponses: visibleResponses.map(r => ({ id: r.id, price: r.price, createdAt: r.createdAt }))
  });

  useEffect(() => {
    if (!user || !enquiryId) return;

    const loadEnquiryAndResponses = async () => {
      setLoading(true);
      try {
        // Load enquiry details
        const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
        if (enquiryDoc.exists()) {
          const enquiryData = { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
          setEnquiry(enquiryData);
          // Always use selectedPlanId if available, otherwise default to 'free'
          // Don't use isPremium flag to determine plan - it can be incorrectly set
          setCurrentPlan(enquiryData.selectedPlanId || 'free');

          // Set up real-time response listener - remove orderBy to avoid index requirement
          const responsesQuery = query(
            collection(db, 'sellerSubmissions'),
            where('enquiryId', '==', enquiryId)
          );
          
          const unsubscribe = onSnapshot(
            responsesQuery, 
            (snapshot) => {
              try {
                const responsesData = snapshot.docs.map(doc => {
                  try {
                    const data = doc.data();
                    if (!data) return null;
                    
                    // Remove sellerEmail from response data to protect privacy
                    const { sellerEmail, ...responseDataWithoutEmail } = data;
                    
                    // Sanitize sellerName to remove email addresses if present
                    const sanitizedSellerName = data.sellerName && (data.sellerName.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.sellerName))
                      ? data.sellerName.split('@')[0].charAt(0).toUpperCase() + data.sellerName.split('@')[0].slice(1) || 'Seller'
                      : data.sellerName;
                    
                    return {
                      id: doc.id,
                      ...responseDataWithoutEmail,
                      sellerName: sanitizedSellerName,
                      status: data.status || 'pending'
                    } as Response;
                  } catch (error) {
                    console.error('Error processing response doc:', error);
                    return null;
                  }
                }).filter(Boolean) as Response[];
                
                console.log('EnquiryResponsesPage: Loaded responses:', responsesData.length);
                setResponses(responsesData);
              } catch (error) {
                console.error('Error processing snapshot:', error);
                // Don't crash - just log the error
              }
            },
            (error) => {
              // Handle Firestore listener errors gracefully (including CORS)
              if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
                console.warn('Firestore CORS error detected. This may be due to network configuration.');
                console.warn('The app will continue to work, but real-time updates may be limited.');
                // Don't crash - just log the warning
              } else {
                console.error('Firestore listener error:', error);
              }
              // Continue loading with empty responses instead of crashing
              setResponses([]);
            }
          );

          // Cleanup listener on unmount
          return () => unsubscribe();
        } else {
          toast({
            title: "Enquiry not found",
            description: "This enquiry may have been deleted.",
            variant: "destructive"
          });
          navigate('/my-enquiries');
        }
      } catch (error) {
        console.error('Error loading enquiry and responses:', error);
        toast({
          title: "Error",
          description: "Failed to load enquiry details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadEnquiryAndResponses();
  }, [user, enquiryId, navigate]);

  // Load user profiles for trust badge checking
  useEffect(() => {
    if (responses.length === 0) return;

    let isMounted = true;

    const fetchUserProfiles = async () => {
      try {
        const sellerIds = Array.from(new Set(responses.map(r => r.sellerId).filter(Boolean)));
        if (sellerIds.length === 0) return;

        const profiles: {[key: string]: any} = {};

        // Batch fetch profiles for better performance
        const profilePromises = sellerIds.map(async (sellerId) => {
          try {
            // Try 'userProfiles' first
            let profileDoc = await getDoc(doc(db, 'userProfiles', sellerId));
            if (!profileDoc.exists()) {
              // Fallback to 'profiles' collection
              profileDoc = await getDoc(doc(db, 'profiles', sellerId));
            }
            if (profileDoc.exists()) {
              return { sellerId, data: profileDoc.data() };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user profile for ${sellerId}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(profilePromises);
        
        if (isMounted) {
          results.forEach((result) => {
            if (result) {
              profiles[result.sellerId] = result.data;
            }
          });
          setUserProfiles(profiles);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        if (isMounted) {
          setUserProfiles({});
        }
      }
    };

    fetchUserProfiles();

    return () => {
      isMounted = false;
    };
  }, [responses]);

  const handleUpgradeClick = (enquiry: Enquiry) => {
    setSelectedEnquiryForUpgrade(enquiry);
    // Always use selectedPlanId if available, otherwise default to 'free'
    // Don't use isPremium flag to determine plan - it can be incorrectly set
    setCurrentPlan(enquiry.selectedPlanId || 'free');
    setShowPaymentSelector(true);
  };

  const handlePlanSelect = async (planId: string, price: number) => {
    if (!selectedEnquiryForUpgrade || !user) return;

    try {
      // Payment was already processed via Razorpay in PaymentPlanSelector
      // Just update the enquiry to reflect the new plan
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      const enquiryRef = doc(db, 'enquiries', selectedEnquiryForUpgrade.id);
      await updateDoc(enquiryRef, {
        selectedPlanId: planId,
        selectedPlanPrice: price,
        isPremium: price > 0
      });

      toast({
        title: "Payment Successful! 🎉",
        description: `Your enquiry has been upgraded to ${plan.name} plan.`,
      });

      setShowPaymentSelector(false);
      setSelectedEnquiryForUpgrade(null);
      
      // Reload the page to reflect the updated plan
      window.location.reload();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Update Failed",
        description: "Payment was successful but there was an error updating the enquiry. Please refresh the page.",
        variant: "destructive"
      });
    }
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

  const getStatusMessage = (enquiry: Enquiry) => {
    switch (enquiry.status) {
      case 'live':
        return 'Your enquiry is live and receiving responses from sellers';
      case 'pending':
        return 'Your enquiry is under review and will be live soon';
      case 'rejected':
        return 'Your enquiry was rejected. Please check the guidelines and try again';
      case 'completed':
        return 'This enquiry has been completed';
      default:
        return 'Enquiry status unknown';
    }
  };

  // Generate seller code from sellerId
  const getSellerCode = (sellerId: string | undefined | null): string => {
    if (!sellerId) return 'User #0000';
    
    // Generate a consistent code from sellerId
    // Take first 4 characters of the ID and convert to a number, then format as 4-digit code
    const hash = sellerId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Generate a 4-digit code (0000-9999)
    const code = (hash % 10000).toString().padStart(4, '0');
    return `User #${code}`;
  };
  
  // Get seller code initial for avatar
  const getSellerCodeInitial = (sellerId: string | undefined | null): string => {
    if (!sellerId) return '#';
    const code = getSellerCode(sellerId);
    // Return the last digit for more variety (e.g., "9" from "User #2349")
    const codeNumber = code.replace('User #', '');
    return codeNumber.charAt(codeNumber.length - 1) || '#';
  };

  if (loading) {
    return <LoadingAnimation message="Loading enquiry responses" />;
  }

  if (!enquiry) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enquiry Not Found</h2>
            <p className="text-gray-600 mb-6">This enquiry may have been deleted or doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Enquiries
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Profile Page Style - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate('/my-enquiries')}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </Button>
                <div className="w-10 h-10"></div>
              </div>
        </div>

            {/* Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl">
                Responses to "{enquiry.title}".
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  View and manage responses from sellers for this enquiry.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8 bg-white text-gray-900 min-h-screen">
        {/* Sorting Controls - Simple Design */}
        {responses.length > 0 && (
          <div className="mb-3 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Amount Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-[0.5px] border-black rounded-lg sm:rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 h-auto bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-black font-black transition-all duration-200 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/amount"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/amount:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                  <div className="flex items-center justify-between w-full gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-black" />
                      <span className="font-black text-xs sm:text-sm text-black">Amount</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-black" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-56 bg-white border-4 border-black rounded-lg shadow-xl">
                <DropdownMenuItem
                  onClick={() => {
                    console.log('🔍 Price high sort clicked');
                    setSortBy('price-high');
                  }}
                  className={`cursor-pointer px-4 py-2.5 ${
                    sortBy === 'price-high' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDown className={`h-4 w-4 ${sortBy === 'price-high' ? 'text-white' : 'text-black'}`} />
                    <span className={`font-bold text-sm ${sortBy === 'price-high' ? 'text-white' : 'text-black'}`}>
                      Highest to Lowest
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    console.log('🔍 Price low sort clicked');
                    setSortBy('price-low');
                  }}
                  className={`cursor-pointer px-4 py-2.5 ${
                    sortBy === 'price-low' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUp className={`h-4 w-4 ${sortBy === 'price-low' ? 'text-white' : 'text-black'}`} />
                    <span className={`font-bold text-sm ${sortBy === 'price-low' ? 'text-white' : 'text-black'}`}>
                      Lowest to Highest
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Date Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-[0.5px] border-black rounded-lg sm:rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 h-auto bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-black font-black transition-all duration-200 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/date"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/date:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                  <div className="flex items-center justify-between w-full gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-black" />
                      <span className="font-black text-xs sm:text-sm text-black">Date</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-black" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-56 bg-white border-4 border-black rounded-lg shadow-xl">
                <DropdownMenuItem
                  onClick={() => {
                    console.log('🔍 Newest sort clicked');
                    setSortBy('newest');
                  }}
                  className={`cursor-pointer px-4 py-2.5 ${
                    sortBy === 'newest' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${sortBy === 'newest' ? 'text-white' : 'text-black'}`} />
                    <span className={`font-bold text-sm ${sortBy === 'newest' ? 'text-white' : 'text-black'}`}>
                      Newest First
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    console.log('🔍 Oldest sort clicked');
                    setSortBy('oldest');
                  }}
                  className={`cursor-pointer px-4 py-2.5 ${
                    sortBy === 'oldest' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${sortBy === 'oldest' ? 'text-white' : 'text-black'}`} />
                    <span className={`font-bold text-sm ${sortBy === 'oldest' ? 'text-white' : 'text-black'}`}>
                      Oldest First
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Trust Badge Filter */}
            <DropdownMenu 
              open={isTrustBadgeDropdownOpen} 
              onOpenChange={setIsTrustBadgeDropdownOpen}
              modal={true}
            >
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 sm:p-2 rounded-full transition-all duration-300 hover:bg-gray-100 flex items-center justify-center"
                  title={showOnlyTrustBadged ? "Click to remove filter" : "Filter trust-badged responses"}
                >
                  <motion.div
                    animate={{
                      rotate: showOnlyTrustBadged ? 0 : 0,
                      scale: showOnlyTrustBadged ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Filter 
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors duration-300"
                    style={{
                      fill: showOnlyTrustBadged ? '#3b82f6' : '#000000',
                      color: showOnlyTrustBadged ? '#3b82f6' : '#000000'
                    }}
                  />
                  </motion.div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={`w-40 sm:w-48 border-2 rounded-xl shadow-xl p-2 transition-all duration-200 ease-in-out ${
                  showOnlyTrustBadged 
                    ? "bg-[#800020] border-[#6b0019]" 
                    : "bg-blue-600 border-blue-700"
                }`}
                sideOffset={8}
              >
                <DropdownMenuCheckboxItem
                  checked={showOnlyTrustBadged}
                  onCheckedChange={(checked) => {
                    setShowOnlyTrustBadged(checked);
                    // Close dropdown after selection for better UX
                    setTimeout(() => setIsTrustBadgeDropdownOpen(false), 150);
                  }}
                  className={`cursor-pointer rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 font-medium text-xs sm:text-sm text-white flex items-center justify-center text-center [&>span]:hidden transition-colors duration-150 ${
                    showOnlyTrustBadged 
                      ? "hover:bg-[#6b0019] hover:text-white focus:bg-[#6b0019] focus:text-white" 
                      : "hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white"
                  }`}
                >
                  {showOnlyTrustBadged ? "Cancel filter" : "Trust badge only"}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="space-y-3 sm:space-y-5 lg:space-y-8">
          <AnimatePresence mode="popLayout" initial={false}>
          {visibleResponses.length > 0 ? (
            visibleResponses.map((response, index) => (
                <motion.div 
                key={response.id} 
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 },
                    y: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 },
                    scale: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 },
                    layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 'auto', 
                    transformStyle: 'preserve-3d'
                  }}
                className="group/card border border-black bg-white rounded-2xl border-gray-200/80 bg-gradient-to-br from-white via-white to-gray-50/40 border-2 shadow-[0_12px_24px_rgba(0,0,0,0.15),0_6px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-[2px] active:scale-[0.99] sm:transition-all sm:duration-200 sm:hover:shadow-[0_16px_32px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] sm:hover:-translate-y-1 sm:hover:scale-[1.02] sm:active:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] sm:active:translate-y-[2px] sm:active:scale-[0.99] overflow-hidden relative"
              >
                {/* Trust-Conveying Background Sketches - Covering entire card */}
                <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ zIndex: 1 }}>
                  <svg viewBox="0 0 400 600" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                    {/* Trust flow connection lines */}
                    <path d="M50 80 Q200 50 350 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600"/>
                    <path d="M50 220 Q200 250 350 220" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600"/>
                    <path d="M50 350 Q200 380 350 350" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600"/>
                    <path d="M50 480 Q200 510 350 480" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600"/>
                    <path d="M200 80 L200 120" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" className="text-blue-500"/>
                    <path d="M200 180 L200 220" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" className="text-blue-500"/>
                    <path d="M200 310 L200 350" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" className="text-blue-500"/>
                    <path d="M200 440 L200 480" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" className="text-blue-500"/>
                    
                    {/* Buyer icon with trust indicator (top left) */}
                    <circle cx="50" cy="80" r="12" stroke="currentColor" strokeWidth="2" className="text-gray-800"/>
                    <path d="M50 68 L50 55 M45 63 L55 63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-800"/>
                    {/* Trust checkmark near buyer */}
                    <circle cx="70" cy="70" r="6" fill="currentColor" className="text-blue-600"/>
                    <path d="M67 70 L69 72 L73 68" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Seller icon with trust indicator (top right) */}
                    <circle cx="350" cy="80" r="12" stroke="currentColor" strokeWidth="2" className="text-gray-800"/>
                    <path d="M350 68 L350 55 M345 63 L355 63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-800"/>
                    {/* Trust checkmark near seller */}
                    <circle cx="330" cy="70" r="6" fill="currentColor" className="text-blue-600"/>
                    <path d="M327 70 L329 72 L333 68" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Enquiry box with verification badge (top center) */}
                    <rect x="170" y="40" width="60" height="35" stroke="currentColor" strokeWidth="2" rx="4" className="text-gray-800"/>
                    <path d="M175 52 L225 52 M175 60 L210 60" stroke="currentColor" strokeWidth="1.5" className="text-gray-800"/>
                    {/* Verification badge on enquiry */}
                    <circle cx="220" cy="45" r="5" fill="currentColor" className="text-green-600"/>
                    <path d="M218 45 L219.5 46.5 L222 44" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Large Trust badge (center) - More prominent */}
                    <circle cx="200" cy="300" r="14" stroke="currentColor" strokeWidth="3" className="text-blue-600"/>
                    <circle cx="200" cy="300" r="10" fill="currentColor" className="text-blue-600"/>
                    <path d="M196 300 L199 303 L204 297" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Additional trust badge (bottom center) */}
                    <circle cx="200" cy="500" r="12" stroke="currentColor" strokeWidth="2.5" className="text-blue-600"/>
                    <circle cx="200" cy="500" r="8" fill="currentColor" className="text-blue-600"/>
                    <path d="M197 500 L199.5 502.5 L203 498" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Shield icons for trust (scattered throughout) */}
                    <path d="M80 150 L80 170 L90 175 L100 170 L100 150 Q100 145 90 140 Q80 145 80 150 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" className="text-blue-600"/>
                    <path d="M85 150 L85 165 L90 168 L95 165 L95 150" stroke="white" strokeWidth="1" fill="white" fillOpacity="0.3"/>
                    
                    <path d="M320 150 L320 170 L330 175 L340 170 L340 150 Q340 145 330 140 Q320 145 320 150 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" className="text-blue-600"/>
                    <path d="M325 150 L325 165 L330 168 L335 165 L335 150" stroke="white" strokeWidth="1" fill="white" fillOpacity="0.3"/>
                    
                    <path d="M80 380 L80 400 L90 405 L100 400 L100 380 Q100 375 90 370 Q80 375 80 380 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" className="text-blue-600"/>
                    <path d="M85 380 L85 395 L90 398 L95 395 L95 380" stroke="white" strokeWidth="1" fill="white" fillOpacity="0.3"/>
                    
                    <path d="M320 380 L320 400 L330 405 L340 400 L340 380 Q340 375 330 370 Q320 375 320 380 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" className="text-blue-600"/>
                    <path d="M325 380 L325 395 L330 398 L335 395 L335 380" stroke="white" strokeWidth="1" fill="white" fillOpacity="0.3"/>
                    
                    {/* Additional trust checkmarks scattered */}
                    <circle cx="120" cy="120" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M118 120 L119.5 121.5 L122 119" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="280" cy="120" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M278 120 L279.5 121.5 L282 119" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="150" cy="200" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M148 200 L149.5 201.5 L152 199" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="250" cy="200" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M248 200 L249.5 201.5 L252 199" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="120" cy="350" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M118 350 L119.5 351.5 L122 349" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="280" cy="350" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M278 350 L279.5 351.5 L282 349" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="150" cy="430" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M148 430 L149.5 431.5 L152 429" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    <circle cx="250" cy="430" r="5" fill="currentColor" className="text-green-500"/>
                    <path d="M248 430 L249.5 431.5 L252 429" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Verification lock icons */}
                    <rect x="60" y="190" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-blue-600"/>
                    <path d="M64 190 L64 185 Q64 183 66 183 Q68 183 68 185 L68 190" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-600"/>
                    
                    <rect x="332" y="190" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-blue-600"/>
                    <path d="M336 190 L336 185 Q336 183 338 183 Q340 183 340 185 L340 190" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-600"/>
                    
                    <rect x="60" y="420" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-blue-600"/>
                    <path d="M64 420 L64 415 Q64 413 66 413 Q68 413 68 415 L68 420" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-600"/>
                    
                    <rect x="332" y="420" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-blue-600"/>
                    <path d="M336 420 L336 415 Q336 413 338 413 Q340 413 340 415 L340 420" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-600"/>
                    
                    {/* Decorative trust dots */}
                    <circle cx="100" cy="140" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="300" cy="140" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="180" cy="180" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="220" cy="180" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="100" cy="340" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="300" cy="340" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="180" cy="380" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="220" cy="380" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="100" cy="460" r="3" fill="currentColor" className="text-blue-500"/>
                    <circle cx="300" cy="460" r="3" fill="currentColor" className="text-blue-500"/>
                  </svg>
                </div>
                
                {/* Card Header - Mobile optimized */}
                <div className="bg-black px-3 py-2.5 sm:px-4 sm:py-3 lg:px-8 lg:py-5 border-b border-gray-800 relative z-20">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                      <div className="bg-blue-600 text-white rounded-lg sm:rounded-xl w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 flex items-center justify-center font-black text-xs sm:text-sm lg:text-lg flex-shrink-0 shadow-lg ring-1 sm:ring-2 ring-blue-400/50">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-gray-300 font-medium">
                            {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + response.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-300 font-medium hidden sm:block">Response #{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Trust Badge - Right side of card */}
                      {((userProfiles[response.sellerId]?.isProfileVerified || 
                         userProfiles[response.sellerId]?.isVerified || 
                         userProfiles[response.sellerId]?.trustBadge || 
                         userProfiles[response.sellerId]?.isIdentityVerified) || 
                        (response as any).userProfileVerified || 
                        (response as any).isProfileVerified ||
                        (response as any).userVerified ||
                        response.isIdentityVerified ||
                        (response as any).govIdUrl) && (
                        <div className="bg-blue-600 rounded-full p-1 sm:p-1.5 ring-2 sm:ring-4 ring-blue-600 shadow-md sm:shadow-lg flex-shrink-0">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                      )}
                      <Badge 
                        variant={response.status === 'approved' ? 'default' : response.status === 'rejected' ? 'destructive' : 'secondary'}
                        className={`text-[9px] sm:text-[10px] lg:text-sm px-2 sm:px-4 lg:px-5 py-1 sm:py-1.5 lg:py-2 font-bold flex-shrink-0 shadow-md ${
                          response.status === 'approved' 
                            ? 'bg-green-600 hover:bg-green-700 text-white border border-green-500 sm:border-2' 
                            : response.status === 'rejected'
                            ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 sm:border-2'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-400 sm:border-2'
                        }`}
                      >
                        {response.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Card Content - Mobile optimized spacing */}
                <div className="p-3 sm:p-5 lg:p-8 xl:p-10 space-y-3 sm:space-y-4 lg:space-y-7 relative z-10 bg-white">
                
                {/* Seller Info & Price Group - Mobile optimized */}
                <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-5 lg:pb-6 relative">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6 relative z-10">
                    {/* Seller Info - Mobile optimized */}
                    <div className="flex items-center flex-1 min-w-0 w-full lg:w-auto">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <h4 className="font-black text-[10px] sm:text-xs lg:text-sm text-black truncate border border-black rounded px-2 py-1">{getSellerCode(response.sellerId)}</h4>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-black">Seller {index + 1}/{visibleResponses.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Seller's Quote - Mobile optimized */}
                    <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-9 flex-shrink-0 w-full lg:w-auto mt-6 sm:mt-8 lg:mt-10 transform-gpu transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-2 hover:rotate-[0.5deg] group/quote z-20"
                      style={{
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.1)',
                        transformStyle: 'preserve-3d',
                        perspective: '1000px'
                      }}
                    >
                      {/* 3D Border Effect */}
                      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-gray-300/50" 
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.15)'
                        }}
                      />
                      
                      {/* Top highlight for 3D effect */}
                      <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                      
                      {/* Side highlights for depth */}
                      <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-2xl sm:rounded-l-3xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                      <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-2xl sm:rounded-r-3xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                      
                      {/* Bottom shadow for depth */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl sm:rounded-b-3xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                      
                      {/* Inner depth shadow */}
                      <div className="absolute inset-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center min-h-full py-4 sm:py-6 lg:py-8">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 tracking-tight drop-shadow-sm flex items-center"
                            style={{
                              transform: 'translateZ(10px)',
                              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >Seller {index + 1} offer</span>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600 mx-2 sm:mx-3 lg:mx-4 flex-shrink-0" style={{ transform: 'translateZ(10px)' }} />
                          <div className="flex items-center space-x-1 sm:space-x-1.5">
                            <div className="relative w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.9)] ring-2 ring-gray-300/50 transform group-hover/quote:scale-110 transition-transform duration-300"
                              style={{
                                transform: 'translateZ(10px)'
                              }}
                            >
                              <span className="text-gray-800 text-xs sm:text-sm lg:text-base font-black drop-shadow-sm">₹</span>
                            </div>
                            <p className="font-black text-3xl sm:text-5xl lg:text-7xl xl:text-8xl text-black leading-none transform group-hover/quote:scale-105 transition-transform duration-300"
                              style={{
                                transform: 'translateZ(15px)',
                                textShadow: '0 4px 8px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)'
                              }}
                            >
                              {response.price?.includes('₹') ? response.price.replace('₹', '') : response.price || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/0 via-gray-100/0 to-gray-200/0 group-hover/quote:from-white/20 group-hover/quote:via-gray-100/10 group-hover/quote:to-gray-200/10 transition-all duration-500 pointer-events-none" />
                    </div>
                  </div>
                  
                </div>

                {/* Message & Notes Group - Mobile optimized */}
                <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-5 lg:pb-6">
                  {/* Message Section - Mobile optimized */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-sm sm:hover:shadow-md transition-shadow duration-200 border border-gray-300">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm lg:text-lg font-black text-black">Message from the seller</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
                      <p className="text-xs sm:text-sm lg:text-lg text-black font-medium leading-relaxed">{response.message || 'No message provided'}</p>
                    </div>
                  </div>
                  
                  {/* Additional Notes - Mobile optimized */}
                  {response.notes && (
                    <div className="bg-white border-[0.5px] border-black rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md">
                          <div className="w-5 h-5 sm:w-6 sm:w-6 bg-yellow-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-black">📝</span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-lg font-black text-black">Additional Notes</span>
                      </div>
                      <div className="bg-yellow-50 border-[0.5px] border-black rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
                        <p className="text-[10px] sm:text-xs lg:text-base text-black leading-relaxed font-medium">{response.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Images Section - Mobile optimized grid */}
                {response.imageUrls && response.imageUrls.length > 0 && (
                  <div className="pb-3 sm:pb-5 lg:pb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm lg:text-lg font-black text-black">Images ({response.imageUrls.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                      {response.imageUrls.map((imageUrl, imgIndex) => (
                        <div 
                          key={imgIndex} 
                          className="relative group cursor-pointer rounded-lg sm:rounded-xl overflow-hidden shadow-md sm:shadow-lg lg:hover:shadow-2xl transition-all duration-300 sm:hover:-translate-y-1 lg:hover:-translate-y-2 border-[0.5px] border-black"
                          onClick={() => {
                            console.log('Image clicked:', imageUrl);
                            setFullscreenImage(imageUrl);
                          }}
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Response image ${imgIndex + 1}`}
                            className="w-full h-20 sm:h-24 lg:h-32 xl:h-40 object-cover transition-transform duration-300 sm:group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 sm:pb-3">
                            <div className="bg-white rounded-full p-2 sm:p-3 transform translate-y-2 sm:translate-y-4 sm:group-hover:translate-y-0 transition-transform duration-300 shadow-lg sm:shadow-xl">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-black" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Footer Section - Mobile optimized */}
                <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2 lg:pt-3">
                  {/* Security message */}
                  <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-600 text-center font-normal mb-2 sm:mb-3">
                    Finalize deals securely, with optional contact exchange through encrypted chat.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="invisible text-[10px] sm:text-xs lg:text-base text-gray-600 flex items-center space-x-1.5 sm:space-x-2 bg-white border-[0.5px] border-black rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 shadow-sm w-full sm:w-auto pointer-events-none">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-[10px] sm:text-xs lg:text-sm">Submitted: {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/enquiry/${enquiry.id}/responses?sellerId=${response.sellerId}`)}
                    className="w-full sm:w-auto border-[0.5px] border-black bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] text-white px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 sm:hover:scale-105 active:scale-95 relative overflow-hidden group/startchat min-touch"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full sm:group-hover/startchat:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-1.5 sm:mr-2 flex-shrink-0 sm:group-hover/startchat:scale-110 transition-transform duration-200 relative z-10" />
                    <span className="whitespace-nowrap tracking-tight relative z-10">Start Chat</span>
                  </Button>
                </div>
                </div>
              </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-center py-6 sm:py-10 bg-white rounded-lg border-2 border-gray-200 shadow-md"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                {showOnlyTrustBadged ? (
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                ) : (
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                )}
              </div>
              {showOnlyTrustBadged ? (
                <>
                  <h3 className="text-base sm:text-xl font-black text-gray-900 mb-2">No Trust-Badged Sellers Yet</h3>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-4 max-w-md mx-auto leading-relaxed">
                    Don't worry! More verified sellers are joining every day. Check back soon or view all responses to see what's available now.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowOnlyTrustBadged(false)}
                    className="mt-4 border-[0.5px] border-black rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-black font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    View All Responses
                  </Button>
                  {user && enquiry && user.uid === enquiry.userId && (
                    <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-500 mt-4">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>Waiting for verified sellers to respond...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-base sm:text-xl font-black text-gray-900 mb-2">No Responses Yet</h3>
                  <p className="text-xs sm:text-sm text-gray-700 mb-4 max-w-md mx-auto leading-relaxed">
                    {user && enquiry && user.uid === enquiry.userId
                      ? "Your enquiry hasn't received any approved responses yet. Sellers are reviewing your request and will respond soon."
                      : "Be the first to respond to this enquiry!"}
                  </p>
                  {user && enquiry && user.uid === enquiry.userId && (
                    <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>Searching for matching sellers...</span>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {(() => {
          // Don't show unlock message for premium plans (top tier) or pro plans (hidden for future)
          // Always use selectedPlanId - don't use isPremium flag
          const enquiryPlan = enquiry?.selectedPlanId || 'free';
          const isPremiumOrPro = enquiryPlan === 'premium' || enquiryPlan === 'pro';
          
          // Only show for plans below premium (free, basic, standard)
          if (!user || !enquiry || user.uid !== enquiry.userId || isPremiumOrPro) {
            return null;
          }
          
          const currentPlan = PAYMENT_PLANS.find(p => p.id === enquiryPlan);
          const responseLimit = currentPlan?.responses || 2;
          
          // Only show if there are more responses than the limit
          if ((responses.length || 0) <= responseLimit) {
            return null;
          }
          
          return (
            <div className="my-3 sm:my-6 text-center bg-white border-2 border-blue-200 rounded-lg p-3 sm:p-5 flex flex-col items-center shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600 mr-2" />
                <span className="text-sm sm:text-lg font-black text-gray-900">Unlock All Responses</span>
              </div>
              <p className="text-gray-700 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
                Only the first {responseLimit} responses are visible for your current plan.<br />
                Upgrade to a higher plan to view all {responses.length} responses.
              </p>
              {(() => {
                const isExpired = enquiry.deadline && (() => {
                  const now = new Date();
                  const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                  return deadlineDate < now;
                })();
                
                return (
              <Button
                variant="default"
                    disabled={isExpired}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs mt-1 sm:mt-2 py-2 sm:py-3 text-xs sm:text-base font-black rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (!isExpired) {
                        handleUpgradeClick(enquiry);
                      }
                    }}
              >
                    {isExpired ? 'Enquiry Expired' : 'Upgrade Plan'}
              </Button>
                );
              })()}
            </div>
          );
        })()}
      </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          ref={fullscreenModalRef}
          className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-0 sm:p-4"
          onClick={() => setFullscreenImage(null)}
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
                setFullscreenImage(null);
              }}
              className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 sm:p-3 shadow-lg z-10 flex items-center gap-1 border-0 outline-none focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Plan Selector Dialog */}
      {showPaymentSelector && selectedEnquiryForUpgrade && (
        <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
          <DialogContent className="max-w-6xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 mx-auto">
            <DialogHeader className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <DialogTitle className="text-base sm:text-lg md:text-xl font-extrabold text-center mb-2 sm:mb-2.5 md:mb-3 flex items-center justify-center gap-2 sm:gap-2.5 px-2">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 flex-shrink-0" />
                <span className="break-words text-gray-900">Upgrade Your Enquiry Plan</span>
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
    </Layout>
  );
};

export default EnquiryResponsesPage;
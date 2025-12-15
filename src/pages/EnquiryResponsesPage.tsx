import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Eye, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Image as ImageIcon, Crown, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
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
    
    // Apply sorting
    return sortResponses(filteredResponses, sortBy);
  }, [enquiry, user, responses, sortBy]);

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

  // Sanitize seller name to remove email addresses and protect privacy
  const sanitizeSellerName = (name: string | undefined | null): string => {
    if (!name) return 'Seller';
    
    // Check if the name contains an email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(name.trim())) {
      // If it's an email, extract the part before @ or return generic name
      const namePart = name.split('@')[0];
      // Capitalize first letter and return
      return namePart.charAt(0).toUpperCase() + namePart.slice(1) || 'Seller';
    }
    
    // If it contains @ symbol but not a full email, sanitize it
    if (name.includes('@')) {
      const sanitized = name.split('@')[0];
      return sanitized.charAt(0).toUpperCase() + sanitized.slice(1) || 'Seller';
    }
    
    return name;
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
        {visibleResponses.length > 1 && (
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
          </div>
        )}

        <div className="space-y-3 sm:space-y-5 lg:space-y-8">
          {visibleResponses.length > 0 ? (
            visibleResponses.map((response, index) => (
              <div 
                key={response.id} 
                className="group/card bg-white border-[0.5px] border-black rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm sm:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] sm:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 sm:hover:-translate-y-1"
              >
                {/* Card Header - Mobile optimized */}
                <div className="bg-black px-3 py-2.5 sm:px-4 sm:py-3 lg:px-8 lg:py-5 border-b border-gray-800 relative z-20">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                      <div className="bg-blue-600 text-white rounded-lg sm:rounded-xl w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 flex items-center justify-center font-black text-xs sm:text-sm lg:text-lg flex-shrink-0 shadow-lg ring-1 sm:ring-2 ring-blue-400/50">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm lg:text-lg font-bold text-white block leading-tight">Seller {index + 1} of {visibleResponses.length}</span>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-300 font-medium hidden sm:block">Response #{index + 1}</span>
                      </div>
                    </div>
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
                
                {/* Card Content - Mobile optimized spacing */}
                <div className="p-3 sm:p-5 lg:p-8 xl:p-10 space-y-3 sm:space-y-4 lg:space-y-7 relative z-10 bg-white">
                
                {/* Seller Info & Price Group - Mobile optimized */}
                <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-5 lg:pb-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6">
                    {/* Seller Info - Mobile optimized */}
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full lg:w-auto">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg sm:shadow-xl flex-shrink-0 ring-2 sm:ring-4 ring-blue-100">
                          <span className="text-white font-black text-lg sm:text-xl lg:text-3xl">
                            {sanitizeSellerName(response.sellerName).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {((userProfiles[response.sellerId]?.isProfileVerified || 
                           userProfiles[response.sellerId]?.isVerified || 
                           userProfiles[response.sellerId]?.trustBadge || 
                           userProfiles[response.sellerId]?.isIdentityVerified) || 
                          (response as any).userProfileVerified || 
                          (response as any).isProfileVerified ||
                          (response as any).userVerified ||
                          response.isIdentityVerified) && (
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-white rounded-full p-0.5 sm:p-1 ring-2 sm:ring-4 ring-white shadow-md sm:shadow-lg">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <h4 className="font-black text-sm sm:text-base lg:text-xl text-black truncate">{sanitizeSellerName(response.sellerName)}</h4>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">
                            {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Quote - Mobile optimized */}
                    <div className="bg-white border-[0.5px] border-black rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-7 flex-shrink-0 w-full lg:w-auto shadow-md sm:shadow-lg lg:hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                        <div className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md">
                          <span className="text-white text-xs sm:text-sm lg:text-base font-black">₹</span>
                        </div>
                        <span className="text-[10px] sm:text-xs lg:text-base font-bold text-black">Price Quote</span>
                      </div>
                      <p className="font-black text-2xl sm:text-3xl lg:text-5xl xl:text-6xl text-black leading-none">
                        {response.price?.includes('₹') ? response.price : `₹${response.price || 'N/A'}`}
                      </p>
                    </div>
                  </div>
                  
                </div>

                {/* Message & Notes Group - Mobile optimized */}
                <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-5 lg:pb-6">
                  {/* Message Section - Mobile optimized */}
                  <div className="bg-white border-[0.5px] border-black rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm lg:text-lg font-black text-black">Message</span>
                    </div>
                    <div className="bg-gray-50 border-[0.5px] border-black rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-5 lg:pt-6">
                  <div className="text-[10px] sm:text-xs lg:text-base text-gray-600 flex items-center space-x-1.5 sm:space-x-2 bg-white border-[0.5px] border-black rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 shadow-sm w-full sm:w-auto">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-[10px] sm:text-xs lg:text-sm">Submitted: {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/enquiry/${enquiry.id}/responses?sellerId=${response.sellerId}`)}
                    className="w-full sm:w-auto border-[0.5px] border-black bg-gradient-to-r from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 sm:hover:scale-105 active:scale-95 relative overflow-hidden group/startchat min-touch"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full sm:group-hover/startchat:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-1.5 sm:mr-2 flex-shrink-0 sm:group-hover/startchat:scale-110 transition-transform duration-200 relative z-10" />
                    <span className="whitespace-nowrap tracking-tight relative z-10">Start Chat</span>
                  </Button>
                </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-10 bg-white rounded-lg border-2 border-gray-200 shadow-md">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
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
            </div>
          )}
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
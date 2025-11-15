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
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
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
  
  // Payment plan selector state
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedEnquiryForUpgrade, setSelectedEnquiryForUpgrade] = useState<Enquiry | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  
  // Sorting state - default to newest first
  const [sortBy, setSortBy] = useState<'default' | 'price-high' | 'price-low' | 'newest' | 'oldest'>('newest');

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
          setCurrentPlan(enquiryData.selectedPlanId || (enquiryData.isPremium ? 'premium' : 'free'));

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

  const handleUpgradeClick = (enquiry: Enquiry) => {
    setSelectedEnquiryForUpgrade(enquiry);
    setCurrentPlan(enquiry.selectedPlanId || (enquiry.isPremium ? 'premium' : 'free'));
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
      <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8 bg-white text-gray-900 min-h-screen">
        <div className="flex items-center mb-3 sm:mb-6">
          <Button variant="ghost" onClick={() => window.history.back()} className="text-gray-700 hover:bg-gray-100 p-1.5 sm:p-2">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-base">Back</span>
          </Button>
        </div>

        {/* Header with gray background */}
        <div className="mb-3 sm:mb-6 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 border-gray-700">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-3 py-3 sm:px-6 sm:py-6">
            <h2 className="text-lg sm:text-3xl font-black text-white mb-1 sm:mb-2 tracking-tight">Responses to "{enquiry.title}"</h2>
            <p className="text-gray-200 mb-0 sm:mb-6 text-[10px] sm:text-base font-medium">View and manage responses from sellers for this enquiry</p>
          </div>
        </div>
        
        {/* Sorting Controls - Mobile Optimized */}
        {visibleResponses.length > 1 && (
          <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-1.5 sm:space-y-0">
              <h3 className="text-white font-bold text-xs sm:text-base">Sort Responses</h3>
              <span className="text-gray-300 text-[10px] sm:text-sm font-medium">{visibleResponses.length} responses</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-[10px] sm:text-xs bg-gray-700 border-gray-600 text-white hover:bg-gray-600 h-7 sm:h-9"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sort by Amount</span>
                    <span className="sm:hidden">Amount</span>
                    <ChevronDown className="h-3 w-3 ml-1 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full sm:w-56 bg-gray-800 border-gray-600">
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('🔍 Price high sort clicked');
                      setSortBy('price-high');
                    }}
                    className="text-white hover:bg-gray-700 cursor-pointer text-xs sm:text-sm"
                  >
                    <ArrowDown className="h-3 w-3 mr-2" />
                    Highest to Lowest
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('🔍 Price low sort clicked');
                      setSortBy('price-low');
                    }}
                    className="text-white hover:bg-gray-700 cursor-pointer text-xs sm:text-sm"
                  >
                    <ArrowUp className="h-3 w-3 mr-2" />
                    Lowest to Highest
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-[10px] sm:text-xs bg-gray-700 border-gray-600 text-white hover:bg-gray-600 h-7 sm:h-9"
                  >
                    <Clock className="h-3 w-3 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sort by Date</span>
                    <span className="sm:hidden">Date</span>
                    <ChevronDown className="h-3 w-3 ml-1 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full sm:w-56 bg-gray-800 border-gray-600">
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('🔍 Newest sort clicked');
                      setSortBy('newest');
                    }}
                    className="text-white hover:bg-gray-700 cursor-pointer text-xs sm:text-sm"
                  >
                    <Clock className="h-3 w-3 mr-2" />
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('🔍 Oldest sort clicked');
                      setSortBy('oldest');
                    }}
                    className="text-white hover:bg-gray-700 cursor-pointer text-xs sm:text-sm"
                  >
                    <Clock className="h-3 w-3 mr-2" />
                    Oldest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        <div className="space-y-2.5 sm:space-y-6">
          {visibleResponses.length > 0 ? (
            visibleResponses.map((response, index) => (
              <div key={response.id} className="border-2 sm:border-4 border-blue-300 rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Card Header - Compact gray background */}
                <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-3 py-2 sm:px-6 sm:py-4 border-b-2 border-gray-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-black text-[10px] sm:text-sm flex-shrink-0">
                        #{index + 1}
                      </div>
                      <span className="text-[10px] sm:text-sm font-bold text-white">Response {index + 1} of {visibleResponses.length}</span>
                    </div>
                    <Badge 
                      variant={response.status === 'approved' ? 'default' : response.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-[9px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 font-black flex-shrink-0"
                    >
                      {response.status || 'pending'}
                    </Badge>
                  </div>
                </div>
                
                {/* Card Content - Compact white background */}
                <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-4">
                
                {/* Seller Info & Price Group */}
                <div className="space-y-2 pb-2 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-black text-xs sm:text-sm">
                          {sanitizeSellerName(response.sellerName).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs sm:text-sm text-gray-900 truncate">{sanitizeSellerName(response.sellerName)}</h4>
                        <div className="flex items-center space-x-1.5">
                          {((response as any).userProfileVerified || response.isIdentityVerified) && (
                            <div className="flex items-center space-x-0.5">
                              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                              <span className="text-[9px] sm:text-xs font-bold text-blue-600">Trust Badge</span>
                            </div>
                          )}
                          <span className="text-[9px] sm:text-xs text-gray-500">
                            {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Quote - Compact */}
                    <div className="bg-white border border-gray-200 rounded-lg p-2 flex-shrink-0">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-black">₹</span>
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-bold text-gray-600">Price</span>
                      </div>
                      <p className="font-black text-sm sm:text-lg text-blue-600">
                        {response.price?.includes('₹') ? response.price : `₹${response.price || 'N/A'}`}
                      </p>
                    </div>
                  </div>
                  
                </div>

                {/* Message & Notes Group */}
                <div className="space-y-2 pb-2 border-b border-gray-200">
                  {/* Message Section */}
                  <div>
                    <div className="flex items-center space-x-1.5 mb-1.5">
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-[9px] sm:text-xs font-black text-gray-700">Message</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <p className="text-[10px] sm:text-xs text-gray-900 leading-snug">{response.message || 'No message provided'}</p>
                    </div>
                  </div>
                  
                  {/* Additional Notes */}
                  {response.notes && (
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-black">📝</span>
                        </div>
                        <span className="text-[9px] sm:text-xs font-black text-gray-700">Additional Notes</span>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <p className="text-[10px] sm:text-xs text-gray-900 leading-snug">{response.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Images Section */}
                {response.imageUrls && response.imageUrls.length > 0 && (
                  <div className="pb-2 border-b border-gray-200">
                    <div className="flex items-center space-x-1.5 mb-2">
                      <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-[9px] sm:text-xs font-black text-gray-700">Images ({response.imageUrls.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {response.imageUrls.map((imageUrl, imgIndex) => (
                        <div 
                          key={imgIndex} 
                          className="relative group cursor-pointer"
                          onClick={() => {
                            console.log('Image clicked:', imageUrl);
                            setFullscreenImage(imageUrl);
                          }}
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Response image ${imgIndex + 1}`}
                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-300 hover:border-blue-500 transition-all duration-200 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-white rounded-full p-1.5">
                                <Eye className="h-3 w-3 text-gray-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Footer Section - Timestamp & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <div className="text-[9px] sm:text-xs text-gray-500 flex items-center space-x-1">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>Submitted: {response.createdAt?.toDate ? response.createdAt.toDate().toLocaleString() : 'N/A'}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/enquiry/${enquiry.id}/responses?sellerId=${response.sellerId}`)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-xs font-black shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Start Chat
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
          const enquiryPlan = enquiry?.selectedPlanId || (enquiry?.isPremium ? 'premium' : 'free');
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
              <p className="text-gray-700 text-xs sm:text-base font-bold mb-2 sm:mb-3">
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
          <DialogContent className="max-w-5xl w-[calc(100vw-1rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-5 md:p-6">
            <DialogHeader className="mb-3 sm:mb-5 md:mb-6 px-1 sm:px-0">
              <DialogTitle className="text-sm sm:text-base md:text-lg font-bold text-center mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                <span className="break-words">Upgrade Your Enquiry Plan</span>
              </DialogTitle>
              <DialogDescription className="text-center text-[11px] sm:text-xs md:text-sm text-slate-600 leading-relaxed px-1 sm:px-0">
                Select a plan to unlock premium responses
              </DialogDescription>
            </DialogHeader>
            <div className="mt-1 sm:mt-2 md:mt-4 -mx-1 sm:mx-0">
              <PaymentPlanSelector
                currentPlanId={currentPlan}
                enquiryId={selectedEnquiryForUpgrade.id}
                userId={user?.uid || ''}
                onPlanSelect={handlePlanSelect}
                isUpgrade={true}
                enquiryCreatedAt={selectedEnquiryForUpgrade.createdAt}
                className="max-w-4xl mx-auto"
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

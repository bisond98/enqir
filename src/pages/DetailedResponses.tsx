import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Shield, ImageIcon, Crown, Lock, Eye, Star, Clock, User, CheckCircle, X } from "lucide-react";
import Layout from "@/components/Layout";
import { getPrivacyProtectedName, isUserVerified } from "@/utils/privacy";
import VerificationBadge from "@/components/VerificationBadge";
import PaymentPlanSelector from "@/components/PaymentPlanSelector";
import { processPayment, savePaymentRecord, updateEnquiryPremiumStatus, updateUserPaymentPlan, getUserPaymentPlan, canViewAllResponses, getResponseViewLimit } from "@/services/paymentService";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string | null;
  createdAt: any;
  status: string;
  userId: string;
  isPremium: boolean;
  selectedPlanId?: string;
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
  imageUrls: string[];
  imageCount: number;
  isIdentityVerified: boolean;
  createdAt: any;
}

const DetailedResponses = () => {
  const { enquiryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewResponse, canViewAllResponses, getResponseViewLimit } = useUsage();
  
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [responses, setResponses] = useState<SellerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});

  // Handle payment plan selection
  const handlePlanSelect = async (planId: string, price: number) => {
    if (!enquiry || !user) return;
    
    try {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { PAYMENT_PLANS } = await import('@/config/paymentPlans');
      
      // Payment was already processed via Razorpay in PaymentPlanSelector
      // Just update the enquiry to reflect the new plan
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Update enquiry
      const enquiryRef = doc(db, 'enquiries', enquiry.id);
      await updateDoc(enquiryRef, {
        selectedPlanId: planId,
        selectedPlanPrice: price,
        isPremium: price > 0,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setCurrentPlan(planId);
      setEnquiry({ ...enquiry, selectedPlanId: planId, isPremium: price > 0 });
      setShowPaymentSelector(false);
      
      // Reload the page to reflect the updated plan
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  // Fetch enquiry data
  useEffect(() => {
    if (!enquiryId || !user) return;

    const fetchEnquiry = async () => {
      try {
        const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
        if (enquiryDoc.exists()) {
          const enquiryData = enquiryDoc.data() as Enquiry;
          setEnquiry(enquiryData);
          // Set current plan from enquiry data
          setCurrentPlan(enquiryData.selectedPlanId || 'free');
          console.log('📋 Enquiry loaded - Current plan:', enquiryData.selectedPlanId || 'free');
          console.log('📋 Enquiry data:', {
            id: enquiryData.id,
            isPremium: enquiryData.isPremium,
            selectedPlanId: enquiryData.selectedPlanId,
            title: enquiryData.title
          });
        }
      } catch (error) {
        console.error('Error fetching enquiry:', error);
      }
    };

    fetchEnquiry();
  }, [enquiryId, user]);

  // Fetch responses
  useEffect(() => {
    if (!enquiryId) return;

    const responsesQuery = query(
      collection(db, 'sellerSubmissions'),
      where('enquiryId', '==', enquiryId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(responsesQuery, (snapshot) => {
      const responsesData: SellerSubmission[] = [];
      snapshot.forEach((doc) => {
        responsesData.push({ id: doc.id, ...doc.data() } as SellerSubmission);
      });
      setResponses(responsesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [enquiryId]);

  // Fetch user profiles
  useEffect(() => {
    if (responses.length === 0) return;

    const fetchProfiles = async () => {
      const profiles: {[key: string]: any} = {};
      
      for (const response of responses) {
        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', response.sellerId));
          if (profileDoc.exists()) {
            profiles[response.sellerId] = profileDoc.data();
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
      
      setUserProfiles(profiles);
    };

    fetchProfiles();
  }, [responses]);

  const getVisibleResponses = () => {
    if (!enquiry || !user) return [];
    
    console.log('DetailedResponses: getVisibleResponses debug:', {
      enquiryId: enquiry.id,
      selectedPlanId: enquiry.selectedPlanId,
      isPremium: enquiry.isPremium,
      totalResponses: responses.length,
      userIsOwner: user.uid === enquiry.userId,
      userRole: user.uid === enquiry.userId ? 'buyer' : 'seller'
    });
    
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
        console.log('DetailedResponses: Unlimited plan - returning all responses:', responses.length);
        return responses;
      }
      
      // Return limited responses based on plan
      const limitedResponses = responses.slice(0, responseLimit);
      console.log(`DetailedResponses: ${selectedPlanId} plan - returning ${limitedResponses.length} responses (limit: ${responseLimit})`);
      return limitedResponses;
    }
    
    console.log('DetailedResponses: Seller view - returning own responses');
    return responses.filter(response => response.sellerId === user.uid);
  };


  const handleChatClick = (response: SellerSubmission) => {
    navigate(`/enquiry/${enquiryId}/responses?sellerId=${response.sellerId}`);
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (loading) {
    return <LoadingAnimation message="Loading responses" />;
  }

  if (!enquiry) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Enquiry Not Found</h2>
            <p className="text-slate-600 mb-6">The enquiry you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Enquiries
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const visibleResponses = getVisibleResponses();

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
          {/* Header Section */}
          <div className="mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/my-enquiries')}
                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Enquiry Summary Card - Matching Dashboard Style */}
            <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-6">
              {/* Card Header - Gray Background */}
              <div className="bg-gray-800 px-2 sm:px-4 py-2 sm:py-3">
                <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {enquiry.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-300">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{responses.length} responses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <span>{visibleResponses.length} available</span>
                  </div>
                  {enquiry.isPremium && (
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                      <span className="text-yellow-300">Premium</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Content - White Background */}
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Description</h3>
                    <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed">{enquiry.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-slate-500">Budget:</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600">₹{enquiry.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-slate-500">Category:</span>
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-700">
                        {enquiry.category}
                      </Badge>
                    </div>
                    {enquiry.deadline && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs text-slate-500">Deadline:</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-700">{new Date(enquiry.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {user && enquiry.userId === user.uid && !enquiry.isPremium && (
                    <div className="pt-2 sm:pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => setShowPaymentSelector(true)}
                        className="w-full sm:w-auto h-8 sm:h-9 text-[10px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4"
                        size="sm"
                      >
                        <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                        Upgrade Plan
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Plan Selector - Only show for enquiry owner if not premium */}
            {user && enquiry && user.uid === enquiry.userId && !enquiry.isPremium && (
              <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl mb-3 sm:mb-6">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="text-center mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                      Unlock More Responses
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-600">
                      You're seeing {visibleResponses.length} of {responses.length} responses. Upgrade to see all.
                    </p>
                  </div>
                  
                  <PaymentPlanSelector
                    currentPlanId={currentPlan}
                    enquiryId={enquiry.id}
                    userId={user.uid}
                    onPlanSelect={handlePlanSelect}
                    isUpgrade={true}
                    enquiryCreatedAt={enquiry.createdAt}
                    className="max-w-4xl mx-auto"
                    user={user}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Responses Section */}
          {visibleResponses.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-base sm:text-xl font-bold text-slate-900">Seller Responses</h2>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-600">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{visibleResponses.length} available</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {visibleResponses.map((response, index) => (
                  <Card key={response.id} className="border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl sm:rounded-2xl overflow-hidden">
                    {/* Header - Gray Background */}
                    <div className="bg-gray-800 px-2 sm:px-3 py-2 sm:py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{response.title}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] sm:text-[10px] text-gray-300 truncate">by {response.sellerName || 'Anonymous'}</span>
                              {((response as any).userProfileVerified || response.isIdentityVerified) && (
                                <div className="flex items-center space-x-0.5">
                                  <CheckCircle className="h-3 w-3 text-blue-600" />
                                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-600">Trust Badge</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base sm:text-lg font-bold text-emerald-400">₹{response.price}</div>
                          <div className="text-[9px] sm:text-[10px] text-gray-400">Starting price</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content - White Background */}
                    <CardContent className="p-3 sm:p-4">
                      {/* Message */}
                      <p className="text-[10px] sm:text-xs text-slate-600 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">{response.message}</p>
                      
                      {/* Images Preview */}
                      {response.imageUrls.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-600">
                              {response.imageUrls.length} image{response.imageUrls.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {response.imageUrls.map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="aspect-square bg-slate-100 rounded-md sm:rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(imageUrl)}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Product ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Image load error:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="pt-2 sm:pt-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-500">
                          <span>{new Date(response.createdAt.toDate()).toLocaleDateString()}</span>
                        </div>
                        <Button
                          onClick={() => handleChatClick(response)}
                          size="sm"
                          className="h-7 sm:h-8 text-[9px] sm:text-[10px] bg-gray-800 hover:bg-gray-900 text-white px-2 sm:px-3"
                        >
                          <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* No Responses */
            <div className="text-center py-8 sm:py-12">
              <div className="max-w-md mx-auto px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2">No Responses Yet</h3>
                <p className="text-[11px] sm:text-sm text-slate-600 mb-4 leading-relaxed">
                  We're still pushing your enquiry to the right sellers. Check back soon for responses!
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Searching for matching sellers...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Plan Selector Modal */}
      {showPaymentSelector && enquiry && (
        <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
          <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="mb-4 sm:mb-6">
              <DialogTitle className="text-base sm:text-lg font-bold text-center mb-2 sm:mb-3">
                Choose Your Plan
              </DialogTitle>
              <DialogDescription className="text-center text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upgrade your enquiry to unlock more responses and premium features
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-2 sm:mt-4">
              <PaymentPlanSelector
                currentPlanId={currentPlan}
                enquiryId={enquiry.id}
                userId={user.uid}
                onPlanSelect={handlePlanSelect}
                isUpgrade={true}
                enquiryCreatedAt={enquiry.createdAt}
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

export default DetailedResponses;

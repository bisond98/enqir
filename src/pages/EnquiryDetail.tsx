import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Tag, 
  Clock, 
  User, 
  Shield, 
  MessageSquare,
  Eye,
  Share2,
  Crown,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  Bookmark,
  ImageIcon
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import PaymentPlanSelector from '@/components/PaymentPlanSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PAYMENT_PLANS, getUpgradeOptions } from '@/config/paymentPlans';

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  categories: string[];
  budget: number;
  location: string;
  deadline: any;
  status: 'pending' | 'live' | 'rejected' | 'completed';
  createdAt: any;
  userId: string;
  responses: number;
  likes: number;
  shares: number;
  views: number;
  userLikes: string[];
  isPremium: boolean;
  isUrgent: boolean;
  notes?: string;
  adminNotes?: string;
  approvedAt?: any;
  approvedBy?: string;
  approvalMethod?: string;
  aiNotes?: string;
  userProfileVerified?: boolean;
  isIdentityVerified?: boolean;
  selectedPlanId?: string;
  referenceImages?: string[];
}

interface UserProfile {
  displayName: string;
  email: string;
  isVerified: boolean;
  isProfileVerified?: boolean;
  trustBadge?: boolean;
  isIdentityVerified?: boolean;
  profilePicture?: string;
  location?: string;
  joinedAt: any;
}

// Helper to get visible responses for premium logic
function getVisibleResponses(enquiry: Enquiry | null, user: any, responses: any[]) {
  if (!enquiry || !user) return [];
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
      return responses;
    }
    
    // Return limited responses based on plan
    return responses.slice(0, responseLimit);
  }
  return responses.filter(r => r.sellerId === user.uid);
}

const EnquiryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [savedEnquiries, setSavedEnquiries] = useState<string[]>([]);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    if (!id) return;
    loadEnquiryDetails();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update meta tags for social sharing when enquiry loads
  useEffect(() => {
    if (!enquiry) return;

    const url = `${window.location.origin}/enquiry/${enquiry.id}`;
    const title = `${enquiry.title} | Enqir.in`;
    const description = enquiry.description || 'View this enquiry on Enqir.in - Trust-Based Marketplace';
    
    // Use enquiry's first reference image if available, otherwise use enqir.in default og-image
    // ALWAYS use enqir.in domain for og-image to ensure correct branding (never lovable)
    let image = '';
    if (enquiry.referenceImages && enquiry.referenceImages.length > 0) {
      image = enquiry.referenceImages[0];
    } else {
      // Always use enqir.in domain for default og-image (black and white branding)
      // This ensures no lovable branding appears, even on localhost
      image = 'https://enqir.in/og-image.png';
    }

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      if (content) {
        meta.setAttribute('content', content);
      } else {
        // Remove meta tag if content is empty
        meta.remove();
      }
    };

    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'Enqir.in');
    // Always set og:image - use enquiry image if available, otherwise use enqir.in default
    updateMetaTag('og:image', image);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', enquiry.referenceImages && enquiry.referenceImages.length > 0 ? enquiry.title : 'Enqir.in - Trust-Based Marketplace');

    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:image', image, false);

    // Update page title
    document.title = title;

    // Cleanup function to restore default meta tags
    return () => {
      updateMetaTag('og:title', 'Enqir.in - Trust-Based Marketplace');
      updateMetaTag('og:description', 'A trust-based platform connecting verified buyers and sellers for rare items, antiques, services, and more.');
      updateMetaTag('og:url', window.location.origin);
      // Always use enqir.in domain for default og-image (never lovable)
      updateMetaTag('og:image', 'https://enqir.in/og-image.png');
      document.title = 'Enqir.in';
    };
  }, [enquiry]);

  // Load saved enquiries
  useEffect(() => {
    if (!user?.uid) return;

    const loadSavedEnquiries = async () => {
      try {
        const userProfile = await getDoc(doc(db, 'profiles', user.uid));
        if (userProfile.exists()) {
          const data = userProfile.data();
          setSavedEnquiries(data.savedEnquiries || []);
        }
      } catch (error) {
        console.error('Error loading saved enquiries:', error);
      }
    };

    loadSavedEnquiries();
  }, [user?.uid]);

  const loadEnquiryDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch enquiry details
      const enquiryDoc = await getDoc(doc(db, 'enquiries', id!));
      if (!enquiryDoc.exists()) {
        toast({
          title: "Enquiry Not Found",
          description: "This enquiry may have been removed or doesn't exist.",
          variant: "destructive",
        });
        navigate('/enquiries');
        return;
      }

      const enquiryData = { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
      setEnquiry(enquiryData);
      setCurrentPlan(enquiryData.selectedPlanId || 'free');

      // Increment view count (with error handling)
      try {
        await updateDoc(doc(db, 'enquiries', id!), {
          views: increment(1)
        });
      } catch (viewError) {
        console.warn('Failed to increment view count:', viewError);
        // Don't show error to user for view count increment failure
      }

      // Fetch user profile - check both 'userProfiles' and 'profiles' collections
      if (enquiryData.userId) {
        // Try 'userProfiles' first (same as EnquiryWall)
        let userDoc = await getDoc(doc(db, 'userProfiles', enquiryData.userId));
        if (!userDoc.exists()) {
          // Fallback to 'profiles' collection
          userDoc = await getDoc(doc(db, 'profiles', enquiryData.userId));
        }
        if (userDoc.exists()) {
          setUserProfile({ ...userDoc.data() } as UserProfile);
        }
      }

    } catch (error: any) {
      console.error('Error loading enquiry details:', error);
      
      // Handle specific error types
      if (error?.code === 'permission-denied') {
        toast({
          title: "Sign in for free to sell",
          description: "You already found the demand!",
          variant: "default",
          className: "bg-white border-black border-8 text-black shadow-lg max-w-sm mx-auto sm:max-w-md",
          action: (
            <button 
              onClick={() => navigate('/signin')}
              className="bg-black hover:bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          ),
        });
      } else if (error?.code === 'not-found') {
        toast({
          title: "Enquiry Not Found",
          description: "This enquiry may have been removed or doesn't exist.",
          variant: "destructive",
        });
        navigate('/enquiries');
      } else {
        toast({
          title: "Error",
          description: "Failed to load enquiry details. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !enquiry) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save enquiries.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userRef = doc(db, 'profiles', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Toggle saved state
      if (savedEnquiries.includes(enquiry.id)) {
        // Remove from saved
        setSavedEnquiries(savedEnquiries.filter(id => id !== enquiry.id));
        
        // Update user's saved enquiries in Firestore
        if (userDoc.exists()) {
          await updateDoc(userRef, {
            savedEnquiries: arrayRemove(enquiry.id)
          });
        } else {
          await setDoc(userRef, {
            savedEnquiries: []
          });
        }
        
        toast({
          title: "Removed from Saved",
          description: "This enquiry has been removed from your saved list.",
        });
      } else {
        // Add to saved
        setSavedEnquiries([...savedEnquiries, enquiry.id]);
        
        // Update user's saved enquiries in Firestore
        if (userDoc.exists()) {
          await updateDoc(userRef, {
            savedEnquiries: arrayUnion(enquiry.id)
          });
        } else {
          await setDoc(userRef, {
            savedEnquiries: [enquiry.id]
          });
        }
        
        toast({
          title: "Saved!",
          description: "This enquiry has been saved to your list.",
        });
      }
    } catch (error) {
      console.error('Error updating save:', error);
      toast({
        title: "Error",
        description: "Failed to save enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRespond = () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to respond to this enquiry.",
        variant: "destructive",
      });
      navigate('/signin');
      return;
    }

    setResponding(true);
    navigate(`/respond/${enquiry?.id}`);
  };

  const handleShare = async () => {
    if (!enquiry) return;
    
    try {
      // Update share count
      await updateDoc(doc(db, 'enquiries', enquiry.id), {
        shares: increment(1)
      });
      
      setEnquiry(prev => prev ? { ...prev, shares: (prev.shares || 0) + 1 } : null);
      
      const url = `${window.location.origin}/enquiry/${enquiry.id}`;
      const shareData = {
        title: enquiry.title,
        text: enquiry.description || enquiry.title,
        url: url
      };
      
      // Try Web Share API first (works on mobile and modern browsers)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          toast({
            title: "Shared!",
            description: "Enquiry shared successfully.",
          });
          return;
        } catch (shareError: any) {
          // User cancelled or share failed, fall through to clipboard
          if (shareError.name !== 'AbortError') {
            console.log('Web Share API failed, trying clipboard:', shareError);
          } else {
            // User cancelled, don't show error
            return;
          }
        }
      }
      
      // Fallback to clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link Copied!",
            description: "Enquiry link has been copied to your clipboard.",
          });
          return;
        } catch (clipboardError) {
          console.log('Clipboard API failed, using fallback:', clipboardError);
        }
      }
      
      // Final fallback: Show URL in a prompt or create a temporary input
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(input);
        
        if (successful) {
          toast({
            title: "Link Copied!",
            description: "Enquiry link has been copied to your clipboard.",
          });
        } else {
          // Show URL in toast for manual copying
          toast({
            title: "Copy Link",
            description: url,
            duration: 10000,
          });
        }
      } catch (fallbackError) {
        document.body.removeChild(input);
        // Show URL in toast for manual copying
        toast({
          title: "Copy Link",
          description: url,
          duration: 10000,
        });
      }
    } catch (err) {
      console.error('Error sharing enquiry:', err);
      toast({
        title: "Error",
        description: "Failed to share enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payment plan selection for upgrades
  const handlePlanSelect = async (planId: string, price: number) => {
    if (!enquiry || !user) return;
    
    try {
      const plan = PAYMENT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Payment was already processed via Razorpay in PaymentPlanSelector
      // Just update the enquiry to reflect the new plan
      await updateDoc(doc(db, 'enquiries', enquiry.id), {
        selectedPlanId: planId,
        selectedPlanPrice: price,
        isPremium: price > 0,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setEnquiry({ ...enquiry, selectedPlanId: planId, isPremium: price > 0 });
      setShowPaymentSelector(false);
      
      toast({
        title: "Payment Successful! 🎉",
        description: `Your enquiry has been upgraded to ${plan.name} plan.`,
      });
      
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

  // Handle upgrade button click
  const handleUpgradeClick = () => {
    if (!enquiry) return;
    setCurrentPlan(enquiry.selectedPlanId || 'free');
    setShowPaymentSelector(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeadlineShort = (deadline: any) => {
    if (!deadline) return null;
    try {
      const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
      // Format as MM/DD/YYYY (e.g., 12/3/2024)
      const month = deadlineDate.getMonth() + 1;
      const day = deadlineDate.getDate();
      const year = deadlineDate.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return null;
    }
  };

  const formatDeadlineReadable = (deadline: any) => {
    if (!deadline) return null;
    try {
      const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[deadlineDate.getMonth()];
      const day = deadlineDate.getDate();
      const year = deadlineDate.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return null;
    }
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  // Helper function to filter admin notes - hide technical details
  const formatAdminNotes = (notes: string | undefined): string | null => {
    if (!notes) return null;
    // If it contains auto-approval info, show only "Auto-approved by AI"
    if (notes.toLowerCase().includes('auto-approved') || notes.toLowerCase().includes('ai approved')) {
      return 'Auto-approved by AI';
    }
    // Otherwise, show the original note
    return notes;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'live') {
      return (
        <Badge className="relative text-[8px] sm:text-[9px] px-2 sm:px-2.5 py-1 sm:py-1 rounded-full border-2 border-green-900 bg-green-800 text-white font-bold shadow-lg overflow-hidden group">
          {/* Animated glow effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-green-800/0 via-white/10 to-green-800/0 animate-pulse"></span>
          <span className="relative flex items-center gap-1 sm:gap-1.5 z-10">
            {/* Pulsing dot indicator */}
            <span className="relative flex items-center justify-center">
              <span className="absolute w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75"></span>
              <span className="relative w-1 h-1 bg-white rounded-full"></span>
            </span>
            <span className="font-extrabold tracking-wide drop-shadow-sm">LIVE</span>
          </span>
        </Badge>
      );
    }
    
    const variants = {
      pending: 'bg-white text-black border-white',
      rejected: 'bg-white text-black border-white',
      completed: 'bg-white text-black border-white'
    };
    
    return (
      <Badge className={`text-[8px] sm:text-[9px] rounded-full border-2 ${variants[status as keyof typeof variants] || 'bg-white text-black border-white'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading enquiry details" />;
  }

  if (!enquiry) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
          <div className="text-center w-full max-w-sm mx-auto">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-black mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Enquiry Not Found</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed px-2">
              The enquiry you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/my-enquiries')} 
              size="sm" 
              className="h-9 sm:h-10 text-xs sm:text-sm px-4 sm:px-6 bg-black hover:bg-gray-900 text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Back to My Enquiries
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header - Matching Profile Background - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate(-1)}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
                <div className="w-10 h-10"></div>
              </div>
              </div>
              
            {/* Enquiry Title Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-normal text-white tracking-tighter text-center drop-shadow-2xl break-words max-w-full">
                {enquiry.title}
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  {/* Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-5">
                    {/* Show verified badge if: 
                        1. User has profile-level verification (applies to all enquiries), OR
                        2. This specific enquiry has ID images (enquiry-specific verification) */}
                    {(userProfile?.isVerified || userProfile?.isProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                      <div title="Verified Enquiry" className="flex-shrink-0">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                    {user && user.uid === enquiry.userId && enquiry.isPremium && (
                    <Badge className="bg-white text-black border-white border-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] shadow-sm">
                        <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Premium
                      </Badge>
                    )}
                    {enquiry.isUrgent && (
                    <Badge className="bg-white text-black border-white border-2 px-2 sm:px-2 py-1 text-xs sm:text-xs shadow-sm">
                        <Clock className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    {getStatusBadge(enquiry.status)}
                  </div>
                  
                  {/* Deadline Row - Creative Design */}
                  {enquiry.deadline && (
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-normal text-gray-300">before</span>
                    <div className="inline-flex items-center gap-2 sm:gap-3 bg-gray-900 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 shadow-sm">
                        {/* Countdown Timer with Icon */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300" />
                          <CountdownTimer 
                            deadline={enquiry.deadline} 
                            showIcon={false} 
                          className="[&_*]:!text-white [&_*]:!border-gray-600 [&_*]:!bg-gray-800 [&_*]:!font-semibold" 
                          />
                        </div>
                        
                        {/* Date Separator and Display */}
                        {formatDeadlineReadable(enquiry.deadline) && (
                          <>
                          <div className="hidden sm:block w-px h-4 sm:h-5 bg-gray-600"></div>
                          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm md:text-base font-medium text-gray-300">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                              <span>{formatDeadlineReadable(enquiry.deadline)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        {/* Content - Inside Container */}
        <div className="max-w-[95rem] mx-auto px-2 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Enquiry Card - Professional Design */}
          <Card className="border-0 shadow-lg rounded-3xl sm:rounded-2xl overflow-hidden bg-white mb-5 sm:mb-6 w-full">
              {/* Card Content - Enhanced White Background */}
              <CardContent className="p-5 sm:p-5 lg:p-6">
                <div className="space-y-4 sm:space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-3">Description</h3>
                    <p className="text-sm sm:text-sm md:text-base text-slate-700 leading-relaxed" style={{ lineHeight: '1.7' }}>{enquiry.description}</p>
                  </div>
                  
                  {/* Reference Images Section - Only on Detailed Page */}
                  {enquiry.referenceImages && enquiry.referenceImages.length > 0 && (
                    <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-4 border-black">
                      <h3 className="text-sm sm:text-sm font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2.5">
                        <ImageIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                        Reference Images ({enquiry.referenceImages.length})
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mb-4 leading-relaxed">
                        Images provided by the buyer to help sellers understand their requirements
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {enquiry.referenceImages.map((imageUrl, index) => (
                          <div 
                            key={index} 
                            className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden border-4 border-black hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                            onClick={() => window.open(imageUrl, '_blank')}
                          >
                            <img
                              src={imageUrl}
                              alt={`Reference image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white rounded-full p-2 shadow-lg">
                                  <Eye className="h-4 w-4 text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Enquiry Details - Professional Design */}
              <Card className="border border-black shadow-lg rounded-3xl sm:rounded-2xl bg-white">
                {/* Card Header - Black Background */}
                <div className="bg-black px-4 sm:px-4 py-3.5 sm:py-4 rounded-t-3xl sm:rounded-t-2xl">
                  <h2 className="text-sm sm:text-sm md:text-base font-bold text-white flex items-center gap-2.5">
                    <Tag className="h-4 w-4 sm:h-4 sm:w-4" />
                    Enquiry Details
                  </h2>
                </div>
                
                {/* Card Content - Enhanced White Background */}
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group/budget">
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/budget:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                      <div className="flex items-center gap-3 sm:gap-3 relative z-10">
                        <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <IndianRupee className="h-6 w-6 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Budget</p>
                          <p className="text-base sm:text-base md:text-lg font-bold text-black break-words leading-tight">{formatBudget(enquiry.budget)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group/location">
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/location:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                      <div className="flex items-center gap-3 sm:gap-3 relative z-10">
                        <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MapPin className="h-6 w-6 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Location</p>
                          <p className="text-sm sm:text-sm md:text-base font-bold text-black break-words leading-tight">{enquiry.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group/category">
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/category:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                      <div className="flex items-center gap-3 sm:gap-3 relative z-10">
                        <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Tag className="h-6 w-6 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Category</p>
                          <Badge variant="secondary" className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1 bg-white text-black border-black border-2 font-semibold">
                            {enquiry.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group/deadline">
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/deadline:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                      <div className="flex items-center gap-3 sm:gap-3 relative z-10">
                        <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Calendar className="h-6 w-6 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] sm:text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Deadline</p>
                          <div className="text-sm sm:text-sm md:text-base font-bold text-black leading-tight">
                            {enquiry.deadline ? (
                              <CountdownTimer deadline={enquiry.deadline} />
                            ) : (
                              <span className="text-gray-500 text-xs sm:text-xs">No deadline</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {enquiry.createdAt && (
                      <div className="bg-white rounded-xl p-3.5 sm:p-4 border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group/posted">
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/posted:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                        <div className="flex items-center gap-3 sm:gap-3 relative z-10">
                          <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Clock className="h-6 w-6 sm:h-6 sm:w-6 text-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Posted</p>
                            <p className="text-xs sm:text-sm md:text-base font-bold text-black break-words leading-tight">
                              {formatDate(enquiry.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {enquiry.notes && (
                    <div className="mt-5 sm:mt-5 pt-5 sm:pt-5 border-t-4 border-black">
                      <p className="text-sm sm:text-sm font-bold text-slate-800 mb-3 sm:mb-3 flex items-center gap-2.5">
                        <MessageSquare className="h-4 w-4 sm:h-4 sm:w-4" />
                        Additional Notes
                      </p>
                      <p className="text-sm sm:text-sm md:text-base text-slate-700 leading-relaxed" style={{ lineHeight: '1.7' }}>{enquiry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Information (if available) */}
              {/*
              {(enquiry.adminNotes || enquiry.aiNotes) && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-6 bg-gradient-to-r from-amber-50 to-orange-50">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-amber-600" />
                      </div>
                      Admin Information
                    </h2>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {formatAdminNotes(enquiry.adminNotes) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                        <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Notes
                        </p>
                        <p className="text-blue-800 leading-relaxed">{formatAdminNotes(enquiry.adminNotes)}</p>
                      </div>
                    )}
                    {enquiry.aiNotes && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                        <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          AI Analysis
                        </p>
                        <p className="text-green-800 leading-relaxed text-sm">{enquiry.aiNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              */}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Action Buttons - Professional Design */}
              <Card className="border border-black shadow-lg rounded-3xl sm:rounded-2xl bg-white">
                {/* Card Header - Black Background */}
                <div className="bg-black px-5 sm:px-4 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl">
                  <h3 className="text-sm sm:text-sm md:text-base font-bold text-white">
                    {user && enquiry.userId === user.uid ? 'Your Enquiry' : 'Ready to Respond?'}
                  </h3>
                </div>
                
                {/* Card Content - Enhanced White Background */}
                <CardContent className="p-5 sm:p-5">
                  <div className="space-y-4">
                    {user && enquiry.userId === user.uid ? (
                      <div className="space-y-3">
                        <p className="text-xs sm:text-xs text-gray-600 mb-4 leading-relaxed">View responses and manage from dashboard</p>
                        <Button
                          disabled
                          className="w-full h-12 sm:h-11 text-sm sm:text-sm bg-black text-white cursor-not-allowed min-h-[44px] rounded-xl font-semibold"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Your Enquiry
                        </Button>
                        <Button
                          onClick={() => navigate('/dashboard')}
                          variant="outline"
                          className="w-full h-12 sm:h-11 text-sm sm:text-sm border-4 border-black bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 min-h-[44px] rounded-xl font-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/viewdashboard"
                        >
                          {/* Physical button depth effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/viewdashboard:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                          <span className="relative z-10">View Dashboard</span>
                        </Button>
                        
                        {/* Upgrade Button - Only show for plans below premium (free, basic, standard) */}
                        {(() => {
                          // Always use selectedPlanId - don't use isPremium flag
                          const enquiryPlan = enquiry.selectedPlanId || 'free';
                          // Don't show upgrade button for premium (top tier) or pro (hidden for future)
                          if (enquiryPlan === 'premium' || enquiryPlan === 'pro') return false;
                          const upgradeOptions = getUpgradeOptions(
                            enquiryPlan, 
                            'free', // User payment plan - can be enhanced later
                            enquiry.createdAt,
                            null // Pro activation date
                          );
                          return upgradeOptions.length > 0;
                        })() && (() => {
                          const isExpired = enquiry.deadline && (() => {
                            const now = new Date();
                            const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                            return deadlineDate < now;
                          })();
                          return !isExpired;
                        })() && (
                          <div className="pt-3">
                            <Button
                              onClick={handleUpgradeClick}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-xs py-2.5 sm:py-2 font-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 rounded-xl min-h-[44px] hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/upgrade border-4 border-black"
                              size="sm"
                            >
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/upgrade:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                              <Crown className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1.5 relative z-10" />
                              <span className="relative z-10">Upgrade to Premium</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      (() => {
                        const isExpired = enquiry.deadline && (() => {
                          const now = new Date();
                          const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                          return deadlineDate < now;
                        })();
                        
                        return (
                          <Button
                            onClick={handleRespond}
                            disabled={responding || enquiry.status !== 'live' || isExpired}
                            className="w-full h-12 sm:h-11 text-sm sm:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {responding ? 'Opening...' : isExpired ? 'Enquiry Expired' : 'Respond to Enquiry'}
                          </Button>
                        );
                      })()
                    )}
                    
                    <div className="flex gap-3 sm:gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        className={`flex-1 h-12 sm:h-11 text-sm sm:text-sm border-4 border-black min-h-[44px] rounded-xl font-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/save ${
                          savedEnquiries.includes(enquiry.id) 
                            ? 'bg-gradient-to-b from-black to-gray-900 text-white hover:from-gray-900 hover:to-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)]' 
                            : 'bg-gradient-to-b from-white to-gray-50 text-black hover:from-gray-50 hover:to-gray-100 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)]'
                        }`}
                      >
                        {/* Physical button depth effect */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${savedEnquiries.includes(enquiry.id) ? 'from-white/30' : 'from-white/20'} to-transparent rounded-xl pointer-events-none`} />
                        {/* Shimmer effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${savedEnquiries.includes(enquiry.id) ? 'via-white/30' : 'via-white/20'} to-transparent -translate-x-full group-hover/save:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl`} />
                        <Bookmark className={`h-4 w-4 mr-1.5 relative z-10 ${savedEnquiries.includes(enquiry.id) ? 'fill-current' : ''}`} />
                        <span className="relative z-10">{savedEnquiries.includes(enquiry.id) ? 'Saved' : 'Save'}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 sm:h-11 text-sm sm:text-sm border-4 border-black bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 min-h-[44px] rounded-xl font-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/share"
                        onClick={handleShare}
                      >
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/share:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                        <Share2 className="h-4 w-4 mr-1.5 relative z-10" />
                        <span className="relative z-10">Share</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Profile - Professional Design */}
              {userProfile && (
                <Card className="border-4 border-black shadow-lg rounded-3xl sm:rounded-2xl bg-white">
                  {/* Card Header - Black Background */}
                  <div className="bg-black px-5 sm:px-4 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl">
                    <h3 className="text-sm sm:text-sm md:text-base font-bold text-white flex items-center gap-2.5">
                      <User className="h-4 w-4 sm:h-4 sm:w-4" />
                      Posted by
                    </h3>
                  </div>
                  
                  {/* Card Content - Enhanced White Background */}
                  <CardContent className="p-5 sm:p-5">
                    <div className="flex items-center gap-4 sm:gap-4 mb-5">
                      <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-base flex-shrink-0 shadow-md">
                        {userProfile.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base sm:text-base text-gray-900 truncate mb-1.5">{userProfile.displayName || 'User'}</p>
                        {/* Show trust badge if: 
                            1. User has profile-level verification (same logic as dashboard/enquiry wall), OR
                            2. This specific enquiry has ID images (enquiry-specific verification) */}
                        {(userProfile.isProfileVerified || enquiry.idFrontImage || enquiry.idBackImage || userProfile.isVerified || userProfile.trustBadge || userProfile.isIdentityVerified) && (
                          <div className="flex items-center gap-2 text-black text-xs sm:text-xs font-semibold">
                            <CheckCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-600" />
                            <span className="text-blue-600 font-bold">Trust Badge</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {userProfile.location && (
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-4 border-black shadow-sm">
                        <div className="flex items-center gap-2.5 text-gray-700">
                          <MapPin className="h-4 w-4 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-semibold text-sm sm:text-sm truncate">{userProfile.location}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Payment Plan Selector Modal for Upgrades */}
        {showPaymentSelector && enquiry && (
          <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
            <DialogContent className="max-w-6xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 mx-auto">
              <DialogHeader className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-extrabold text-center mb-2 sm:mb-2.5 md:mb-3 flex items-center justify-center gap-2 sm:gap-2.5 px-2">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-black flex-shrink-0" />
                  <span className="break-words text-gray-900">Upgrade Plan for "{enquiry.title}"</span>
                </DialogTitle>
                <DialogDescription className="text-center text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed font-medium px-2">
                  Select a plan to unlock premium responses
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                <PaymentPlanSelector
                  currentPlanId={currentPlan}
                  enquiryId={enquiry.id}
                  userId={user?.uid || ''}
                  onPlanSelect={handlePlanSelect}
                  isUpgrade={true}
                  enquiryCreatedAt={enquiry.createdAt}
                  className="max-w-6xl mx-auto w-full"
                  user={user}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default EnquiryDetail;







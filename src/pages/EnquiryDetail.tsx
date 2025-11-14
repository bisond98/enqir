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
  Bookmark
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';

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
}

interface UserProfile {
  displayName: string;
  email: string;
  isVerified: boolean;
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

  useEffect(() => {
    if (!id) return;
    loadEnquiryDetails();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      // Increment view count (with error handling)
      try {
        await updateDoc(doc(db, 'enquiries', id!), {
          views: increment(1)
        });
      } catch (viewError) {
        console.warn('Failed to increment view count:', viewError);
        // Don't show error to user for view count increment failure
      }

      // Fetch user profile
      if (enquiryData.userId) {
        const userDoc = await getDoc(doc(db, 'profiles', enquiryData.userId));
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
          className: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-800 shadow-lg max-w-sm mx-auto sm:max-w-md",
          action: (
            <button 
              onClick={() => navigate('/signin')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
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
      await updateDoc(doc(db, 'enquiries', enquiry.id), {
        shares: increment(1)
      });
      
      setEnquiry(prev => prev ? { ...prev, shares: (prev.shares || 0) + 1 } : null);
      
      // Copy link to clipboard
      const url = `${window.location.origin}/enquiry/${enquiry.id}`;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Link Copied!",
        description: "Enquiry link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Error sharing enquiry:', err);
      toast({
        title: "Error",
        description: "Failed to share enquiry. Please try again.",
        variant: "destructive",
      });
    }
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

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      live: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <Badge className={`text-xs rounded-full border ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
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
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Enquiry Not Found</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed px-2">
              The enquiry you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/my-enquiries')} 
              size="sm" 
              className="h-9 sm:h-10 text-xs sm:text-sm px-4 sm:px-6 bg-gray-800 hover:bg-gray-900 text-white"
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-3 sm:mb-4 p-2 hover:bg-slate-100 rounded-lg h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            {/* Enquiry Card - Matching Dashboard Style */}
            <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl overflow-hidden">
              {/* Card Header - Gray Background */}
              <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {getStatusBadge(enquiry.status)}
                  {(enquiry.userProfileVerified || enquiry.isIdentityVerified) && (
                    <div title="Verified Enquiry" className="flex-shrink-0">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                    </div>
                  )}
                  {user && user.uid === enquiry.userId && enquiry.isPremium && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                      <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {enquiry.isUrgent && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white leading-tight">
                  {enquiry.title}
                </h1>
              </div>
              
              {/* Card Content - White Background */}
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Description</h3>
                    <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">{enquiry.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Enquiry Details */}
              <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl">
                {/* Card Header - Gray Background */}
                <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
                  <h2 className="text-xs sm:text-sm md:text-base font-semibold text-white flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Enquiry Details
                  </h2>
                </div>
                
                {/* Card Content - White Background */}
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs text-gray-600 mb-1">Budget</p>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-green-600">{formatBudget(enquiry.budget)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs text-gray-600 mb-1">Location</p>
                          <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 truncate">{enquiry.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs text-gray-600 mb-1">Category</p>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 text-gray-700">
                            {enquiry.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs text-gray-600 mb-1">Deadline</p>
                          <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">
                            {enquiry.deadline ? (
                              <CountdownTimer deadline={enquiry.deadline} />
                            ) : (
                              <span className="text-gray-500 text-[11px] sm:text-xs">No deadline</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {enquiry.notes && (
                    <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Additional Notes
                      </p>
                      <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">{enquiry.notes}</p>
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
                    {enquiry.adminNotes && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                        <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Notes
                        </p>
                        <p className="text-blue-800 leading-relaxed">{enquiry.adminNotes}</p>
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
              {/* Action Buttons */}
              <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl">
                {/* Card Header - Gray Background */}
                <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white">
                    {user && enquiry.userId === user.uid ? 'Your Enquiry' : 'Ready to Respond?'}
                  </h3>
                </div>
                
                {/* Card Content - White Background */}
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-4">
                    {user && enquiry.userId === user.uid ? (
                      <div className="space-y-3">
                        <p className="text-[11px] sm:text-xs text-gray-600 mb-3">View responses and manage from dashboard</p>
                        <Button
                          disabled
                          className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-gray-100 text-gray-500 cursor-not-allowed min-h-[44px]"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Your Enquiry
                        </Button>
                        <Button
                          onClick={() => navigate('/dashboard')}
                          variant="outline"
                          className="w-full h-10 sm:h-11 text-xs sm:text-sm border-gray-300 min-h-[44px]"
                        >
                          View Dashboard
                        </Button>
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
                            className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {responding ? 'Opening...' : isExpired ? 'Enquiry Expired' : 'Respond to Enquiry'}
                          </Button>
                        );
                      })()
                    )}
                    
                    <div className="flex gap-2.5 sm:gap-3 pt-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        className={`flex-1 h-10 sm:h-11 text-xs sm:text-sm border-gray-300 min-h-[44px] ${
                          savedEnquiries.includes(enquiry.id) 
                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                            : ''
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 mr-1.5 ${savedEnquiries.includes(enquiry.id) ? 'fill-current' : ''}`} />
                        {savedEnquiries.includes(enquiry.id) ? 'Saved' : 'Save'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 sm:h-11 text-xs sm:text-sm border-gray-300 min-h-[44px]"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-1.5" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Profile */}
              {userProfile && (
                <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl">
                  {/* Card Header - Gray Background */}
                  <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white flex items-center gap-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Posted by
                    </h3>
                  </div>
                  
                  {/* Card Content - White Background */}
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                        {userProfile.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 truncate mb-1">{userProfile.displayName || 'User'}</p>
                        {userProfile.isVerified ? (
                          <div className="flex items-center gap-1.5 text-blue-600 text-[11px] sm:text-xs font-medium">
                            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            Trust Badge
                          </div>
                        ) : (
                          <div className="text-gray-500 text-[11px] sm:text-xs">Regular User</div>
                        )}
                      </div>
                    </div>
                    {userProfile.location && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm truncate">{userProfile.location}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnquiryDetail;







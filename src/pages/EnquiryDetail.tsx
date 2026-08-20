import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading enquiry details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!enquiry) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enquiry Not Found</h2>
            <p className="text-gray-600 mb-4">This enquiry may have been removed or doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Enquiries
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Enquiries
            </Button>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    {getStatusBadge(enquiry.status)}
                    {/* Blue tick for verified, always visible */}
                    {(enquiry.userProfileVerified || enquiry.isIdentityVerified) && (
                      <CheckCircle className="h-5 w-5 text-blue-500" title="Verified Enquiry" />
                    )}
                    {/* Premium badge only for owner */}
                    {user && user.uid === enquiry.userId && enquiry.isPremium && (
                      <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 px-2 sm:px-3 py-1 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {enquiry.isUrgent && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 px-2 sm:px-3 py-1 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight flex items-center gap-2">
                    {enquiry.title}
                    {(enquiry.userProfileVerified || enquiry.isIdentityVerified) && (
                      <CheckCircle className="h-5 w-5 text-blue-500" title="Verified Enquiry" />
                    )}
                  </h1>
                  <div className="bg-slate-50/50 rounded-xl p-4 sm:p-6 border border-slate-200/50">
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{enquiry.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enquiry Details */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-6 bg-gradient-to-r from-pal-blue/5 to-blue-50/50">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-pal-blue/10 rounded-lg flex items-center justify-center">
                      <Tag className="h-5 w-5 text-pal-blue" />
                    </div>
                    Enquiry Details
                  </h2>
                </CardHeader>
                <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">Budget</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-800">{formatBudget(enquiry.budget)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 sm:p-6 border border-blue-200/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Location</p>
                          <p className="text-base sm:text-lg font-bold text-blue-800">{enquiry.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</p>
                          <p className="text-base sm:text-lg font-bold text-gray-800">{enquiry.category}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-orange-200/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1">Deadline</p>
                          <div className="text-base sm:text-lg font-bold text-orange-800">
                            {enquiry.deadline && (enquiry.deadline instanceof Date || enquiry.deadline?.toDate || typeof enquiry.deadline === 'string' || typeof enquiry.deadline === 'number') ? (
                              <CountdownTimer deadline={enquiry.deadline} />
                            ) : (
                              <span className="text-gray-500">No deadline set</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {enquiry.notes && (
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200/50">
                      <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Additional Notes
                      </p>
                      <p className="text-slate-700 leading-relaxed">{enquiry.notes}</p>
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
            <div className="space-y-6">
              {/* Action Buttons */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      {user && enquiry.userId === user.uid ? (
                        <>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your Enquiry</h3>
                          <p className="text-gray-600 text-xs sm:text-sm">This is your enquiry. You can view responses and manage it from your dashboard.</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Ready to Respond?</h3>
                          <p className="text-gray-600 text-xs sm:text-sm">Connect with the buyer and provide your solution</p>
                        </>
                      )}
                    </div>
                    
                    {user && enquiry.userId === user.uid ? (
                      <div className="space-y-3">
                        <Button
                          disabled
                          className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gray-100 text-gray-500 cursor-not-allowed"
                        >
                          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                          Your Enquiry
                        </Button>
                        <Button
                          onClick={() => navigate('/dashboard')}
                          variant="outline"
                          className="w-full h-10 sm:h-12 text-sm sm:text-base"
                        >
                          View Dashboard
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleRespond}
                        disabled={responding || enquiry.status !== 'live'}
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-pal-blue to-blue-600 hover:from-pal-blue/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                        {responding ? 'Opening...' : 'Respond to Enquiry'}
                      </Button>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        className={`flex-1 h-10 sm:h-12 border-2 transition-all duration-200 ${
                          savedEnquiries.includes(enquiry.id) 
                            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                            : 'hover:bg-blue-50 hover:border-blue-200'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${savedEnquiries.includes(enquiry.id) ? 'fill-current' : ''}`} />
                        {savedEnquiries.includes(enquiry.id) ? 'Saved' : 'Save'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 sm:h-12 border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* User Profile */}
              {userProfile && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                    <h3 className="text-lg font-bold flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      Posted by
                    </h3>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                        {userProfile.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base sm:text-lg text-gray-900">{userProfile.displayName || 'User'}</p>
                        {userProfile.isVerified ? (
                          <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm font-medium">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            Verified User
                          </div>
                        ) : (
                          <div className="text-gray-500 text-xs sm:text-sm">Regular User</div>
                        )}
                      </div>
                    </div>
                    {userProfile.location && (
                      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/50">
                        <div className="flex items-center gap-2 sm:gap-3 text-slate-700">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                          <span className="font-medium text-sm sm:text-base">{userProfile.location}</span>
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







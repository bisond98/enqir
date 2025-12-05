import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Rocket, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Eye, Shield, ImageIcon, Trash2, Search } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface SellerSubmission {
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
  // Verification fields
  userProfileVerified?: boolean; // For profile-level verification
}

interface Enquiry {
  id: string;
  title: string;
  budget: number;
  category: string;
  userId: string;
  deadline?: any;
  createdAt?: any;
}

const MyResponses = () => {
  const { user, isProfileVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sellerSubmissions, setSellerSubmissions] = useState<SellerSubmission[]>([]);
  const [enquiries, setEnquiries] = useState<{ [key: string]: Enquiry }>({});
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [highlightSubmissionId, setHighlightSubmissionId] = useState<string | null>(null);
  const highlightedSubmissionRef = useRef<HTMLDivElement | null>(null);

  // Read highlight from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state && typeof state.highlightSubmissionId === 'string') {
      setHighlightSubmissionId(state.highlightSubmissionId);
    } else {
      // Only scroll to top if no highlight
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Scroll highlighted submission into view once data & ref are ready
  useEffect(() => {
    if (highlightSubmissionId && highlightedSubmissionRef.current && sellerSubmissions.length > 0 && !loading) {
      // Use requestAnimationFrame for smoother scroll
      const scrollToHighlight = () => {
        if (highlightedSubmissionRef.current) {
          const element = highlightedSubmissionRef.current;
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
  }, [highlightSubmissionId, sellerSubmissions, loading]);

  useEffect(() => {
    if (!user?.uid) return;
    window.scrollTo(0, 0);
    setLoading(true);
    console.log('MyResponses: Current user:', user.uid);

    // Real-time listener for seller submissions (like Dashboard)
    // Try with orderBy first, fallback without if index missing
    const sellerSubmissionsQueryWithOrder = query(
      collection(db, 'sellerSubmissions'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const sellerSubmissionsQueryWithoutOrder = query(
      collection(db, 'sellerSubmissions'),
      where('sellerId', '==', user.uid)
    );
    
    let unsubscribe: (() => void) | null = null;
    
    // Try with orderBy first
    const tryWithOrder = () => {
      console.log('MyResponses: Attempting query with orderBy...');
      unsubscribe = onSnapshot(
        sellerSubmissionsQueryWithOrder,
        (snapshot) => {
          console.log('✅ MyResponses: Query with orderBy succeeded');
          processSubmissions(snapshot);
        },
        (error: any) => {
          // If index error, fallback to query without orderBy
          if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn("⚠️ MyResponses: Firestore index missing, using fallback query:", error);
            tryWithoutOrder();
          } else {
            console.error("❌ MyResponses: Error loading seller submissions:", error);
            // Try fallback even on other errors
            tryWithoutOrder();
          }
        }
      );
    };
    
    // Fallback without orderBy
    const tryWithoutOrder = () => {
      console.log('MyResponses: Attempting fallback query without orderBy...');
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      unsubscribe = onSnapshot(
        sellerSubmissionsQueryWithoutOrder,
        (snapshot) => {
          console.log('✅ MyResponses: Fallback query succeeded');
          processSubmissions(snapshot);
        },
        (error) => {
          console.error("❌ MyResponses: Error loading seller submissions (fallback):", error);
          setLoading(false);
        }
      );
    };
    
    // Process submissions data
    const processSubmissions = (snapshot: any) => {
      try {
        console.log('📊 MyResponses: Received snapshot with', snapshot.docs.length, 'documents');
        
      const submissionsData: SellerSubmission[] = [];
      snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 MyResponses: Processing submission', doc.id, 'status:', data.status, 'enquiryId:', data.enquiryId);
          const submissionData = { id: doc.id, ...data } as SellerSubmission;
        submissionData.userProfileVerified = isProfileVerified;
        submissionsData.push(submissionData);
      });
        
        console.log('📊 MyResponses: Total submissions from query:', submissionsData.length);
        
        // Sort by createdAt in JavaScript (will be re-sorted after enquiries are loaded)
      submissionsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
        
        console.log('📊 MyResponses: Final submissions to display:', submissionsData.length);
        console.log('📊 MyResponses: Sample submission IDs:', submissionsData.slice(0, 5).map(s => ({ id: s.id, status: s.status, enquiryId: s.enquiryId })));
        
      setSellerSubmissions(submissionsData);
      setLoading(false);
      } catch (error) {
        console.error("❌ MyResponses: Error processing submissions:", error);
      setLoading(false);
      }
    };
    
    // Start with orderBy query
    tryWithOrder();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, isProfileVerified]);

  // Fetch enquiry details for each submission (optimized)
  useEffect(() => {
    console.log('MyResponses: Seller submissions:', sellerSubmissions);
    if (sellerSubmissions.length === 0) return;

    const loadEnquiries = async () => {
      const enquiryIds = [...new Set(sellerSubmissions.map(s => s.enquiryId))];
      const enquiriesData: { [key: string]: Enquiry } = {};

      try {
        // Use Promise.all for parallel fetching
        const enquiryPromises = enquiryIds.map(async (enquiryId) => {
          try {
            const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
            if (enquiryDoc.exists()) {
              return { id: enquiryId, ...enquiryDoc.data() } as Enquiry;
            }
            return null;
          } catch (error) {
            console.error('Error fetching enquiry:', enquiryId, error);
            return null;
          }
        });

        const enquiryResults = await Promise.all(enquiryPromises);
        
        // Filter out null results and build enquiries object
        enquiryResults.forEach((enquiry) => {
          if (enquiry) {
            enquiriesData[enquiry.id] = enquiry;
          }
        });

        console.log('MyResponses: Loaded enquiries:', Object.keys(enquiriesData).length);
        setEnquiries(enquiriesData);
      } catch (error) {
        console.error('Error loading enquiries:', error);
      }
    };

    loadEnquiries();
  }, [sellerSubmissions]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={`text-xs rounded-full border ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusMessage = (submission: SellerSubmission) => {
    const enquiry = enquiries[submission.enquiryId];
    
    // Check if enquiry is expired
    if (enquiry && enquiry.deadline) {
      const now = new Date();
      const deadline = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
      if (deadline < now) {
        return 'Enquiry expired - no longer active';
      }
    }
    
    switch (submission.status) {
      case 'approved':
        return 'Approved! Buyer can see your offer.';
      case 'pending':
        return 'Under admin review';
      case 'rejected':
        return 'Not approved by admin';
      default:
        return 'Status unknown';
    }
  };

  // Helper function to check if an enquiry is expired
  const isEnquiryExpired = (enquiryId: string) => {
    const enquiry = enquiries[enquiryId];
    if (!enquiry || !enquiry.deadline) return false;
    
    const now = new Date();
    const deadline = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
    return deadline < now;
  };

  // Sort responses: live first, then deleted, then expired (each group sorted by date - newest first)
  const sortedSubmissions = useMemo(() => {
    return [...sellerSubmissions].sort((a, b) => {
      const aDeleted = !enquiries[a.enquiryId]; // Enquiry is deleted if it doesn't exist
      const bDeleted = !enquiries[b.enquiryId];
      const aExpired = isEnquiryExpired(a.enquiryId);
      const bExpired = isEnquiryExpired(b.enquiryId);
      
      // Determine status priority: 0 = live, 1 = deleted, 2 = expired
      const getStatusPriority = (deleted: boolean, expired: boolean) => {
        if (deleted) return 1;
        if (expired) return 2;
        return 0; // live
      };
      
      const aPriority = getStatusPriority(aDeleted, aExpired);
      const bPriority = getStatusPriority(bDeleted, bExpired);
      
      // Sort by priority: live (0) first, then deleted (1), then expired (2)
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If both are same status, sort by createdAt (newest first)
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [sellerSubmissions, enquiries]);

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

  const deleteResponse = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'sellerSubmissions', submissionId));
        toast({ title: 'Response Deleted', description: 'Your response has been removed successfully.' });
      } catch (error) {
        console.error('Error deleting response:', error);
        toast({ title: 'Error', description: 'Failed to delete response. Please try again.', variant: 'destructive' });
      }
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-gray-800 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading your account...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return <LoadingAnimation message="Loading your responses" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Profile Page Style - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => window.history.back()}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
                <div className="w-10 h-10"></div>
              </div>
            </div>
            
            {/* Responses Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-normal text-white tracking-tighter text-center drop-shadow-2xl">
                Responses.
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  Track & manage your responses like the FBI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Inside Container */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">

          {/* Stats Summary - Circular Design */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-[70px] h-[70px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-black text-black mb-0.5 leading-none">
                  {sellerSubmissions.length}
                </h3>
                <p className="text-[7px] sm:text-[8px] lg:text-[10px] xl:text-xs text-black font-black uppercase">Total</p>
              </div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-[70px] h-[70px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-black text-black mb-0.5 leading-none">
                  {sellerSubmissions.filter(s => s.status === 'approved').length}
                </h3>
                <p className="text-[7px] sm:text-[8px] lg:text-[10px] xl:text-xs text-black font-black uppercase">Approved</p>
              </div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-[70px] h-[70px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-black text-black mb-0.5 leading-none">
                  {sellerSubmissions.filter(s => s.status === 'pending').length}
                </h3>
                <p className="text-[7px] sm:text-[8px] lg:text-[10px] xl:text-xs text-black font-black uppercase">Pending</p>
              </div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-[70px] h-[70px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-black text-black mb-0.5 leading-none">
                  {sellerSubmissions.filter(s => s.status === 'rejected').length}
                </h3>
                <p className="text-[7px] sm:text-[8px] lg:text-[10px] xl:text-xs text-black font-black uppercase">Rejected</p>
              </div>
            </div>
          </div>

          {/* Responses List */}
          {sellerSubmissions.length === 0 ? (
            <Card className="p-12 text-center border border-black shadow-lg">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">You never responded to any enquiry</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                You haven't submitted any responses to buyer enquiries yet. Start helping others by responding to their requests and needs!
              </p>
              <Link to="/enquiries">
                <Button className="bg-black hover:bg-gray-900 text-white px-8 py-3 border border-black hover:border-black">
                  <Rocket className="h-5 w-5 mr-2" />
                  Browse Enquiries
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {(showAll ? sortedSubmissions : sortedSubmissions.slice(0, 7)).map((submission) => {
                const enquiry = enquiries[submission.enquiryId];
                const isEnquiryDeleted = !enquiry; // Enquiry is deleted if it doesn't exist in enquiries object
                const isExpired = isEnquiryExpired(submission.enquiryId);
                const isHighlighted = highlightSubmissionId === submission.id;
                return (
                  <div key={submission.id} ref={isHighlighted ? highlightedSubmissionRef : undefined}>
                  <Card className={`group relative rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-visible transition-all duration-300 ${isExpired || isEnquiryDeleted ? 'opacity-50 grayscale pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-800 shadow-sm' : 'bg-white border border-gray-800 hover:border-gray-900 hover:shadow-2xl shadow-lg cursor-pointer transform hover:-translate-y-1.5 hover:scale-[1.01] lg:hover:scale-[1.02]'}`}>
                    {/* Card Header - Solid black background */}
                    <div className={`relative bg-black px-3 sm:px-4 lg:px-3 xl:px-4 py-4 sm:py-5 lg:py-4 xl:py-5 ${isExpired || isEnquiryDeleted ? 'opacity-70' : ''}`}>
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
                          {isExpired || isEnquiryDeleted ? (
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-300 flex-shrink-0" />
                          ) : (
                            ((submission as any).userProfileVerified || submission.isIdentityVerified) && (
                              <div className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:w-4 rounded-full flex-shrink-0 shadow-sm ${
                                isExpired || isEnquiryDeleted ? 'bg-gray-400' : 'bg-blue-500'
                              }`}>
                                <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                              </div>
                            )
                          )}
                          <h3 className={`hidden sm:block text-base sm:text-xl lg:text-2xl font-black truncate ${isExpired || isEnquiryDeleted ? 'text-gray-300' : 'text-white'} drop-shadow-sm`}>
                            Your Response #{sortedSubmissions.findIndex(s => s.id === submission.id) + 1}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {isEnquiryDeleted && (
                            <Badge variant="outline" className="text-[8px] sm:text-xs text-red-500 border border-red-400 font-bold bg-red-50">Enquiry Deleted</Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="text-[8px] sm:text-xs text-gray-500 border border-gray-400 font-bold">Expired</Badge>
                          )}
                          {submission.status === 'approved' ? (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                          ) : (
                            getStatusBadge(submission.status)
                          )}
                        </div>
                      </div>
                      <div className="mt-1 sm:mt-2 hidden sm:block">
                        <span className={`text-[8px] sm:text-[9px] font-medium opacity-70 ${isExpired || isEnquiryDeleted ? 'text-red-200' : 'text-white'}`}>
                          {isEnquiryDeleted ? 'Enquiry has been deleted' : getStatusMessage(submission)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Content - Rest with white background */}
                    <CardContent className="relative bg-gradient-to-br from-white via-white to-gray-50/30 p-5 sm:p-6 lg:p-5 xl:p-5 overflow-visible space-y-3 sm:space-y-4">

                      {/* Response Information Group */}
                      <div className="space-y-1.5 sm:space-y-2 pb-2 pt-3 sm:pt-0">
                        {/* Response Title */}
                        <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-900 leading-snug line-clamp-2 font-bold text-center">{submission.title}</p>
                        
                        {/* Response Message */}
                        <p className="text-[8px] sm:text-[10px] text-gray-700 leading-snug line-clamp-2 text-center">{submission.message}</p>
                        
                        {/* Stats & Details */}
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
                          {submission.govIdUrl && (
                            <span className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-black">
                              <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                              <span>ID Verified</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {submission.notes && (
                        <div className="p-2.5 sm:p-3 md:p-4 bg-slate-50 border border-black rounded-lg">
                          <h4 className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-800 mb-1 sm:mb-1.5 md:mb-2">Additional Notes:</h4>
                          <p className="text-[11px] sm:text-xs md:text-sm text-slate-700 leading-relaxed">{submission.notes}</p>
                        </div>
                      )}

                      {/* Timestamps - Desktop Only */}
                      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 md:gap-4 text-[8px] sm:text-[9px] md:text-[10px] text-slate-500 pt-8 sm:pt-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-slate-600">Submitted: {formatDate(submission.createdAt)}</span>
                        </div>
                        {/* Updated timestamp intentionally hidden as requested */}
                      </div>

                      {/* Bottom Section - Budget Tile & Buttons */}
                      <div className="mt-6 lg:mt-8 space-y-3">
                        {/* Enquiry Context - Budget & Seller Amount Group */}
                        {enquiry && (
                          <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-white rounded shadow-sm">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-black text-[9px] sm:text-xs">₹</span>
                              </div>
                              <div>
                                <div className="text-[8px] sm:text-[9px] text-gray-600 font-bold">Enquiry Budget</div>
                                <div className="text-xs sm:text-base font-black text-gray-900">{formatBudget(enquiry.budget)}</div>
                              </div>
                            </div>
                            {submission.price && (
                              <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-black text-[9px] sm:text-xs">₹</span>
                                </div>
                                <div>
                                  <div className="text-[8px] sm:text-[9px] text-gray-600 font-bold">Your Amount</div>
                                  <div className="text-xs sm:text-base font-black text-gray-900">{submission.price}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status-specific Actions */}
                        {!isExpired && !isEnquiryDeleted && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5 lg:gap-2 xl:gap-2.5 pt-1 sm:pt-1.5 lg:pt-1 xl:pt-1.5">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">{enquiry && (
                              <Link 
                                to={`/enquiry/${enquiry.id}`}
                                onClick={(e) => {
                                  if (isExpired || isEnquiryDeleted) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                                className="w-full sm:flex-shrink-0 lg:flex-1 group/btn"
                              >
                                <button 
                                  disabled={isExpired || isEnquiryDeleted}
                                  className="w-full sm:flex-shrink-0 lg:w-full border-2 sm:border-4 border-black bg-gray-100 hover:bg-gray-200 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/btn:scale-110 transition-transform duration-200 relative z-10 text-blue-500 fill-blue-500 stroke-black stroke-2" />
                                  <span className="whitespace-nowrap tracking-tight relative z-10">View Enquiry</span>
                                </button>
                              </Link>
                            )}
                            
                            {submission.status === 'approved' && !isEnquiryDeleted && (
                              <Link 
                                to={`/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`}
                                className="w-full sm:flex-shrink-0 lg:flex-1 group/chat"
                                onClick={(e) => {
                                  if (isExpired || isEnquiryDeleted) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <button 
                                  disabled={isExpired || isEnquiryDeleted}
                                  className="w-full sm:flex-shrink-0 lg:w-full border-2 sm:border-4 border-black bg-gray-100 hover:bg-gray-200 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/chat:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                                  <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/chat:scale-110 transition-transform duration-200 relative z-10 text-emerald-500 fill-emerald-500 stroke-black stroke-2" />
                                  <span className="whitespace-nowrap tracking-tight relative z-10">Talk To The Buyer</span>
                              </button>
                            </Link>
                          )}
                          
                          {submission.status === 'rejected' && (
                              <Link 
                                to="/enquiries"
                                className="w-full sm:flex-shrink-0 lg:flex-1 group/browse"
                                onClick={(e) => {
                                  if (isExpired) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <button 
                                  disabled={isExpired}
                                  className="w-full sm:flex-shrink-0 lg:w-full border-2 sm:border-4 border-black bg-gray-100 hover:bg-gray-200 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                >
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/browse:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                                  <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/browse:scale-110 transition-transform duration-200 relative z-10 text-orange-500 fill-orange-500 stroke-black stroke-2" />
                                  <span className="whitespace-nowrap tracking-tight relative z-10">Submit New Response</span>
                                </button>
                            </Link>
                          )}
                          
                          <button
                            onClick={() => {
                              if (!isExpired && !isEnquiryDeleted) {
                                deleteResponse(submission.id);
                              }
                            }}
                            disabled={isExpired || isEnquiryDeleted}
                            className="w-full sm:flex-shrink-0 lg:flex-1 border-2 sm:border-4 border-black bg-gray-100 hover:bg-gray-200 text-black font-black text-[10px] sm:text-xs lg:text-[10px] xl:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 lg:px-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group/delete"
                          >
                            {/* Physical button depth effect */}
                            {!isExpired && !isEnquiryDeleted && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/delete:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                              </>
                            )}
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0 group-hover/delete:scale-110 transition-transform duration-200 relative z-10 text-red-500 fill-red-500 stroke-black stroke-2" />
                            <span className="whitespace-nowrap tracking-tight relative z-10">Delete</span>
                          </button>
                        </div>
                        
                          {submission.buyerViewed && (
                            <div className="text-xs sm:text-sm text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span>Buyer has viewed</span>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                );
              })}
              {sortedSubmissions.length > 7 && (
                <div className="flex justify-center pt-4">
                  {!showAll ? (
                    <Button
                      onClick={() => setShowAll(true)}
                      variant="outline"
                      className="border border-black hover:border-black text-gray-700 hover:bg-gray-50 text-sm sm:text-base px-6 py-2.5 sm:py-3 h-10 sm:h-11"
                    >
                      View More ({sortedSubmissions.length - 7} more)
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowAll(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      variant="outline"
                      className="border border-black hover:border-black text-gray-700 hover:bg-gray-50 text-sm sm:text-base px-6 py-2.5 sm:py-3 h-10 sm:h-11"
                    >
                      View Less
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyResponses;
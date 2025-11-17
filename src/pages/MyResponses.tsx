import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Rocket, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Eye, Shield, ImageIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, onSnapshot } from "firebase/firestore";
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
  const [sellerSubmissions, setSellerSubmissions] = useState<SellerSubmission[]>([]);
  const [enquiries, setEnquiries] = useState<{ [key: string]: Enquiry }>({});
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Sort responses: live first, then expired
  const sortedSubmissions = useMemo(() => {
    return [...sellerSubmissions].sort((a, b) => {
      const aExpired = isEnquiryExpired(a.enquiryId);
      const bExpired = isEnquiryExpired(b.enquiryId);
      
      // Live enquiries first
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with gray background */}
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            {/* Header Section - Top 10% with gray background */}
            <div className="bg-gray-800 px-4 sm:px-6 py-5 sm:py-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-700 rounded-lg text-white flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-center flex-1 px-2 sm:px-4 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2 sm:mb-3">
                    Your Responses
                  </h1>
                  <p className="text-gray-300 text-[11px] sm:text-xs md:text-sm font-medium max-w-2xl mx-auto leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    Track your submissions and status
                  </p>
                </div>
                <div className="w-10 flex-shrink-0"></div> {/* Spacer for balance */}
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Card className="p-3 text-center border border-gray-200 shadow-lg bg-white">
              <div className="text-xl font-bold text-gray-800 mb-1">{sellerSubmissions.length}</div>
              <p className="text-xs text-gray-600 font-medium">Total Responses</p>
            </Card>
            <Card className="p-3 text-center border border-gray-200 shadow-lg bg-white">
              <div className="text-xl font-bold text-emerald-600 mb-1">{sellerSubmissions.filter(s => s.status === 'approved').length}</div>
              <p className="text-xs text-gray-600 font-medium">Approved</p>
            </Card>
            <Card className="p-3 text-center border border-gray-200 shadow-lg bg-white">
              <div className="text-xl font-bold text-amber-600 mb-1">{sellerSubmissions.filter(s => s.status === 'pending').length}</div>
              <p className="text-xs text-gray-600 font-medium">Under Review</p>
            </Card>
            <Card className="p-3 text-center border border-gray-200 shadow-lg bg-white">
              <div className="text-xl font-bold text-red-600 mb-1">{sellerSubmissions.filter(s => s.status === 'rejected').length}</div>
              <p className="text-xs text-gray-600 font-medium">Rejected</p>
            </Card>
          </div>

          {/* Responses List */}
          {sellerSubmissions.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-lg">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">You never responded to any enquiry</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                You haven't submitted any responses to buyer enquiries yet. Start helping others by responding to their requests and needs!
              </p>
              <Link to="/enquiries">
                <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3">
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
                return (
                  <Card key={submission.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${isExpired || isEnquiryDeleted ? 'opacity-60 grayscale pointer-events-none' : ''}`}>
                    {/* Card Header - Compact gray background */}
                    <div className={`bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-2.5 py-2 sm:px-6 sm:py-4 border-b-2 border-gray-700 ${isExpired || isEnquiryDeleted ? 'opacity-70' : ''}`}>
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
                          {isExpired || isEnquiryDeleted ? <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-300 flex-shrink-0" /> : <div className="flex-shrink-0">{getStatusIcon(submission.status)}</div>}
                          <h3 className={`text-[11px] sm:text-lg font-black truncate ${isExpired || isEnquiryDeleted ? 'text-gray-300' : 'text-white'} drop-shadow-sm`}>
                            Your Response #{sortedSubmissions.findIndex(s => s.id === submission.id) + 1}
                          </h3>
                          {((submission as any).userProfileVerified || submission.isIdentityVerified) && (
                            <div className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:w-4 rounded-full flex-shrink-0 shadow-sm ${
                              isExpired || isEnquiryDeleted ? 'bg-gray-400' : 'bg-blue-500'
                            }`}>
                              <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                            </div>
                          )}
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
                      <div className="mt-1 sm:mt-2">
                        <span className={`text-[9px] sm:text-xs font-bold opacity-95 ${isExpired || isEnquiryDeleted ? 'text-red-200' : 'text-white'}`}>
                          {isEnquiryDeleted ? 'Enquiry has been deleted' : getStatusMessage(submission)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Content - Rest with white background */}
                    <CardContent className="p-2 sm:p-4 space-y-2 sm:space-y-3">

                      {/* Response Information Group */}
                      <div className="space-y-1.5 sm:space-y-2 pb-2 border-b border-gray-200">
                        {/* Response Title */}
                        <p className="text-[10px] sm:text-sm text-gray-900 leading-snug line-clamp-2 font-bold">{submission.title}</p>
                        
                        {/* Response Message */}
                        <p className="text-[10px] sm:text-sm text-gray-700 leading-snug line-clamp-2">{submission.message}</p>
                        
                        {/* Stats & Details */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-1">
                          <span className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-black">
                            <ImageIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                            <span>{submission.imageCount || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-[9px] sm:text-xs text-gray-700 font-black">
                            <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                            <span>{submission.price?.toString().startsWith('₹') ? submission.price : `₹${submission.price}`}</span>
                          </span>
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
                        <div className="p-2.5 sm:p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <h4 className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-800 mb-1 sm:mb-1.5 md:mb-2">Additional Notes:</h4>
                          <p className="text-[11px] sm:text-xs md:text-sm text-slate-700 leading-relaxed">{submission.notes}</p>
                        </div>
                      )}

                      {/* Enquiry Context - Budget & Category Group */}
                      {enquiry && (
                        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-black text-[9px] sm:text-xs">₹</span>
                            </div>
                            <div>
                              <div className="text-[8px] sm:text-[9px] text-gray-600 font-bold">Enquiry Budget</div>
                              <div className="text-xs sm:text-base font-black text-gray-900">{formatBudget(enquiry.budget)}</div>
                            </div>
                          </div>
                          {enquiry.category && (
                            <Badge variant="outline" className="text-[8px] sm:text-xs font-black border border-gray-300 text-gray-800 px-1.5 py-0">
                              {enquiry.category}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* View Enquiry Button */}
                      {enquiry && !isExpired && !isEnquiryDeleted && (
                        <div className="pt-2">
                          <Link 
                            to={`/enquiry/${enquiry.id}`}
                            onClick={(e) => {
                              if (isExpired || isEnquiryDeleted) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                            className="block"
                          >
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={isExpired || isEnquiryDeleted}
                              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-[9px] sm:text-xs font-black h-7 sm:h-8"
                              onClick={(e) => {
                                if (isExpired || isEnquiryDeleted) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                              View Enquiry
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 md:gap-4 text-[10px] sm:text-[11px] md:text-xs text-slate-500 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-slate-600">Submitted: {formatDate(submission.createdAt)}</span>
                        </div>
                        {submission.updatedAt && submission.updatedAt !== submission.createdAt && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                            <span className="text-slate-600">Updated: {formatDate(submission.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Status-specific Actions */}
                      {!isExpired && !isEnquiryDeleted && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2 border-t border-slate-200">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                            {submission.status === 'approved' && !isEnquiryDeleted && (
                              <Link 
                                to={`/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`}
                                className="flex-1 sm:flex-initial"
                                onClick={(e) => {
                                  if (isExpired || isEnquiryDeleted) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={isExpired || isEnquiryDeleted}
                                  className="w-full sm:w-auto border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white text-xs sm:text-sm h-9 sm:h-10"
                                  onClick={(e) => {
                                    if (isExpired || isEnquiryDeleted) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }
                                  }}
                                >
                                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-white" />
                                  Chat Available
                                </Button>
                              </Link>
                            )}
                            {submission.status === 'rejected' && (
                              <Link 
                                to="/enquiries"
                                className="flex-1 sm:flex-initial"
                                onClick={(e) => {
                                  if (isExpired) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={isExpired}
                                  className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm h-9 sm:h-10"
                                  onClick={(e) => {
                                    if (isExpired) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }
                                  }}
                                >
                                  <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                  Submit New Response
                                </Button>
                              </Link>
                            )}
                          </div>
                          
                          {submission.buyerViewed && (
                            <div className="text-xs sm:text-sm text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span>Buyer has viewed</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {sortedSubmissions.length > 7 && (
                <div className="flex justify-center pt-4">
                  {!showAll ? (
                    <Button
                      onClick={() => setShowAll(true)}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base px-6 py-2.5 sm:py-3 h-10 sm:h-11"
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base px-6 py-2.5 sm:py-3 h-10 sm:h-11"
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

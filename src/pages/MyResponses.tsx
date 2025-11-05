import { useState, useEffect } from "react";
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    window.scrollTo(0, 0);
    setLoading(true);
    console.log('MyResponses: Current user:', user.uid);

    // Real-time listener for seller submissions (like Dashboard)
    const sellerSubmissionsQuery = query(
      collection(db, 'sellerSubmissions'),
      where('sellerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(sellerSubmissionsQuery, (snapshot) => {
      const submissionsData: SellerSubmission[] = [];
      snapshot.forEach((doc) => {
        const submissionData = { id: doc.id, ...doc.data() } as SellerSubmission;
        submissionData.userProfileVerified = isProfileVerified;
        submissionsData.push(submissionData);
      });
      // Sort by createdAt in JavaScript
      submissionsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setSellerSubmissions(submissionsData);
      setLoading(false);
      console.log('MyResponses: Real-time seller submissions:', submissionsData.length);
    }, (error) => {
      console.log('Error loading seller submissions (real-time):', error);
      setLoading(false);
    });
    return () => unsubscribe();
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
            <div className="bg-gray-800 px-6 py-6">
              <div className="flex items-start justify-between mb-4">
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-700 rounded-lg text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-center flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight whitespace-nowrap">
                    Your Responses
                  </h1>
                </div>
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>
              <p className="text-gray-300 text-xs lg:text-sm max-w-2xl mx-auto leading-relaxed text-center">
                Track your seller submissions and their status
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Card className="p-3 text-center border-0 shadow-lg bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="text-xl font-bold text-white mb-1">{sellerSubmissions.length}</div>
              <p className="text-xs text-gray-100 font-medium">Total Responses</p>
            </Card>
            <Card className="p-3 text-center border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="text-xl font-bold text-emerald-600 mb-1">{sellerSubmissions.filter(s => s.status === 'approved').length}</div>
              <p className="text-xs text-emerald-700 font-medium">Approved</p>
            </Card>
            <Card className="p-3 text-center border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <div className="text-xl font-bold text-amber-600 mb-1">{sellerSubmissions.filter(s => s.status === 'pending').length}</div>
              <p className="text-xs text-amber-700 font-medium">Under Review</p>
            </Card>
            <Card className="p-3 text-center border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-xl font-bold text-red-600 mb-1">{sellerSubmissions.filter(s => s.status === 'rejected').length}</div>
              <p className="text-xs text-red-700 font-medium">Rejected</p>
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
            <div className="space-y-6">
              {sellerSubmissions.map((submission) => {
                const enquiry = enquiries[submission.enquiryId];
                const isExpired = isEnquiryExpired(submission.enquiryId);
                return (
                  <Card key={submission.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>
                    {/* Card Header - Top 10% with gray background (or red if expired) */}
                    <div className={`px-6 py-4 ${isExpired ? 'bg-red-900' : 'bg-gray-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isExpired ? <AlertTriangle className="h-4 w-4 text-red-300" /> : getStatusIcon(submission.status)}
                          <h3 className="text-lg font-semibold text-white truncate">
                            {submission.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isExpired && (
                            <Badge className="text-xs bg-red-100 text-red-800 border-red-300">
                              Expired
                            </Badge>
                          )}
                          {getStatusBadge(submission.status)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs sm:text-sm ${isExpired ? 'text-red-200' : 'text-gray-300'}`}>
                          {getStatusMessage(submission)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Content - Rest with white background */}
                    <CardContent className="p-6">

                      {/* Response Details */}
                      <div className="mb-4">
                        {/* SIMPLE: Show "Verified" for any type of verification */}
                        {(submission.userProfileVerified || submission.isIdentityVerified) && (
                          <div className="mb-3">
                            <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                              <Shield className="h-3 w-3 mr-1" />
                              Trusted User
                            </Badge>
                          </div>
                        )}
                        <p className="text-slate-600 mb-3 line-clamp-2">{submission.message}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center space-x-1">
                            <ImageIcon className="h-4 w-4" />
                            <span>{submission.imageCount} images</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>₹{submission.price}</span>
                          </span>
                          {submission.govIdUrl && (
                            <span className="flex items-center space-x-1">
                              <Shield className="h-4 w-4" />
                              <span>ID Uploaded</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Enquiry Context */}
                      {enquiry && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-semibold text-blue-800 mb-2">Responding to:</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-blue-900 font-medium text-sm sm:text-base">{enquiry.title}</p>
                              <p className="text-blue-700 text-xs sm:text-sm">Budget: {formatBudget(enquiry.budget)} • {enquiry.category}</p>
                            </div>
                            <Link to={`/enquiry/${enquiry.id}`}>
                              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                View Enquiry
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Additional Notes */}
                      {submission.notes && (
                        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-slate-800 mb-2">Additional Notes:</h4>
                          <p className="text-slate-700 text-sm">{submission.notes}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          <span className="text-slate-600">Submitted: {formatDate(submission.createdAt)}</span>
                        </div>
                        {submission.updatedAt && submission.updatedAt !== submission.createdAt && (
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span className="text-slate-600">Updated: {formatDate(submission.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Status-specific Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                          {submission.status === 'approved' && (
                            <Link to={`/enquiry/${submission.enquiryId}/responses?sellerId=${submission.sellerId}`}>
                              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chat Available
                              </Button>
                            </Link>
                          )}
                          {submission.status === 'rejected' && (
                            <Link to="/enquiries">
                              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Rocket className="h-4 w-4 mr-2" />
                                Submit New Response
                              </Button>
                            </Link>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-500">
                          {submission.buyerViewed && (
                            <span className="text-emerald-600">✓ Buyer has viewed</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyResponses;

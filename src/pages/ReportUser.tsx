import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { db } from "@/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  "User is scamming",
  "User not updating",
  "Inappropriate behavior",
  "Spam or fake account",
  "Harassment or abuse",
  "Other"
];

export default function ReportUser() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId');
  const sellerId = searchParams.get('sellerId');
  const userName = searchParams.get('userName');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportedUser, setReportedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'userProfiles', userId));
        if (userDoc.exists()) {
          setReportedUser(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [userId]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({ 
        title: 'Error', 
        description: 'Please select a reason for reporting', 
        variant: 'destructive' 
      });
      return;
    }

    if (!user?.uid || !userId) return;

    setSubmitting(true);
    
    try {
      // Get reported user's name
      const reportedUserName = userName || reportedUser?.fullName || reportedUser?.email || userId;
      
      // Get reporter's name
      const reporterDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      const reporterName = reporterDoc.exists() 
        ? (reporterDoc.data().fullName || reporterDoc.data().email || user.uid)
        : user.uid;

      // Get enquiry title if available
      let enquiryTitle = '';
      if (enquiryId) {
        try {
          const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
          if (enquiryDoc.exists()) {
            enquiryTitle = enquiryDoc.data().title || '';
          }
        } catch (err) {
          console.error('Error fetching enquiry:', err);
        }
      }

      // Create report document - NEW COLLECTION, doesn't affect existing data
      await addDoc(collection(db, 'userReports'), {
        reportedUserId: userId,
        reportedUserName: reportedUserName,
        reportedBy: user.uid,
        reporterName: reporterName,
        reason: selectedReason,
        reportDetails: reportDetails || null,
        enquiryId: enquiryId || null,
        enquiryTitle: enquiryTitle || null,
        sellerId: sellerId || null,
        timestamp: serverTimestamp(),
        status: 'pending',
        reviewed: false,
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: null
      });

      toast({ 
        title: 'Report Submitted', 
        description: 'Thank you for reporting. We will review this report.' 
      });
      
      // Navigate back to chat - doesn't affect chat state
      if (enquiryId && sellerId) {
        navigate(`/enquiry/${enquiryId}/responses?sellerId=${sellerId}`);
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to submit report. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8">
          <Card className="border-[0.5px] border-black shadow-lg">
            <CardHeader className="bg-black text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-white">
                    Report User
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] sm:text-xs text-gray-700 mb-1">
                  Reporting: <span className="font-semibold">{userName || reportedUser?.fullName || userId}</span>
                </p>
                {enquiryId && (
                  <p className="text-[9px] sm:text-[10px] text-gray-500">
                    Related to enquiry: {enquiryId}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <p className="text-xs sm:text-sm text-gray-700 mb-4 font-medium">
                  Please select a reason for reporting this user:
                </p>
                
                <div className="space-y-2 mb-4">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg border-[0.5px] transition-all duration-200 relative overflow-hidden group ${
                        selectedReason === reason
                          ? 'border-red-600 bg-gradient-to-br from-red-50 to-red-100 text-red-900 shadow-[0_4px_0_0_rgba(220,38,38,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                          : 'border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-gray-400 hover:from-gray-50 hover:to-gray-100 text-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.1)] active:scale-[0.98]'
                      }`}
                    >
                      {/* Gradient overlay for selected state */}
                      {selectedReason === reason && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-lg pointer-events-none" />
                      )}
                      {/* Shimmer effect on hover */}
                      {selectedReason !== reason && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg" />
                      )}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="font-semibold text-sm sm:text-base">{reason}</span>
                        {selectedReason === reason && (
                          <CheckCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Always show text field for additional details */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details (Optional)
                </label>
                <div className="relative">
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any additional information about this report..."
                    className="w-full border border-black focus-visible:border-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base min-h-[120px] rounded-none transition-all duration-300 min-touch pl-4 pr-4 py-3 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                    style={{ fontSize: '16px' }}
                    maxLength={500}
                  />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reportDetails.length}/500 characters
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-2 border-gray-300"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedReason || submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


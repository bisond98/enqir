import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bookmark } from "lucide-react";
import { db } from "@/firebase";
import { collection, query, where, doc, getDoc, orderBy } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location?: string;
  status: 'pending' | 'live' | 'rejected' | 'completed';
  createdAt: any;
  userId: string;
  deadline?: any;
}

const SavedEnquiries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedEnquiries, setSavedEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const setupSavedEnquiriesListener = () => {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        
        const unsubscribe = onSnapshot(profileRef, async (snapshot) => {
          const savedIds = snapshot.exists() ? (snapshot.data()?.savedEnquiries || []) : [];
          
          if (savedIds.length === 0) {
            setSavedEnquiries([]);
            setLoading(false);
            return;
          }

          const savedPromises = savedIds.map(async (enquiryId: string) => {
            try {
              const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
              if (enquiryDoc.exists()) {
                return { id: enquiryDoc.id, ...enquiryDoc.data() } as Enquiry;
              }
              return null;
            } catch (error) {
              console.error(`Error fetching saved enquiry ${enquiryId}:`, error);
              return null;
            }
          });

          const savedData = (await Promise.all(savedPromises)).filter((e): e is Enquiry => e !== null);
          setSavedEnquiries(savedData);
          setLoading(false);
        }, (error) => {
          console.error('Error listening to saved enquiries:', error);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up saved enquiries listener:', error);
        setLoading(false);
      }
    };

    setupSavedEnquiriesListener();
  }, [user?.uid]);

  // Sort saved enquiries: live first, then expired
  const sortedSavedEnquiries = useMemo(() => {
    return [...savedEnquiries].sort((a, b) => {
      const now = new Date();
      
      // Check if expired
      const aExpired = a.deadline && (() => {
        const deadlineDate = a.deadline.toDate ? a.deadline.toDate() : new Date(a.deadline);
        return deadlineDate < now;
      })();
      
      const bExpired = b.deadline && (() => {
        const deadlineDate = b.deadline.toDate ? b.deadline.toDate() : new Date(b.deadline);
        return deadlineDate < now;
      })();
      
      // Live enquiries first
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      
      // If both are same status, sort by createdAt (newest first)
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [savedEnquiries]);

  if (loading) {
    return <LoadingAnimation message="Loading saved enquiries" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              onTouchEnd={() => navigate('/dashboard')}
              className="mb-6 text-slate-600 hover:text-slate-900 transition-colors h-12 px-4 touch-manipulation text-sm font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/30">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Bookmark className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  📌 Your Saved Favorites
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Quickly access your bookmarked enquiries anytime
                </p>
              </div>
            </div>
          </div>

          {/* Saved Enquiries List */}
          {savedEnquiries.length === 0 ? (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-8 sm:py-24">
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Bookmark className="h-6 w-6 sm:h-10 sm:w-10 text-gray-500" />
                </div>
                <h2 className="text-base sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">No saved enquiries yet</h2>
                <p className="text-xs sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto">Start saving enquiries you're interested in to access them quickly later</p>
                <Button 
                  onClick={() => navigate('/enquiries')}
                  onTouchEnd={() => navigate('/enquiries')}
                  size="lg"
                  className="h-10 sm:h-14 px-4 sm:px-8 text-xs sm:text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Browse Enquiries
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {sortedSavedEnquiries.map((enquiry) => {
                const isExpired = enquiry.deadline && (() => {
                  const now = new Date();
                  const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
                  return deadlineDate < now;
                })();
                
                return (
                <Card 
                  key={enquiry.id} 
                  className={`transition-all duration-300 touch-manipulation border-0 bg-white/90 backdrop-blur-sm shadow-lg ${
                    isExpired 
                      ? 'opacity-70 grayscale cursor-not-allowed' 
                      : 'hover:shadow-xl cursor-pointer hover:scale-[1.01] sm:hover:scale-[1.02]'
                  }`}
                  onClick={() => {
                    if (!isExpired) {
                      navigate(`/enquiry/${enquiry.id}`);
                    }
                  }}
                  onTouchEnd={() => {
                    if (!isExpired) {
                      navigate(`/enquiry/${enquiry.id}`);
                    }
                  }}
                >
                  <CardContent className="p-3 sm:p-8">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className={`text-sm sm:text-xl font-bold mb-2 sm:mb-3 line-clamp-2 leading-tight ${
                          isExpired ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {enquiry.title}
                        </h3>
                        <p className={`text-xs sm:text-base mb-3 sm:mb-4 line-clamp-3 leading-relaxed ${
                          isExpired ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {enquiry.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <Badge variant="secondary" className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 font-medium ${
                          isExpired ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {enquiry.category}
                        </Badge>
                        <div className={`text-xs sm:text-sm font-semibold ${
                          isExpired ? 'text-gray-500' : 'text-green-600'
                        }`}>
                          ₹{enquiry.budget?.toLocaleString('en-IN')}
                        </div>
                        {enquiry.location && (
                          <div className={`text-xs sm:text-sm flex items-center ${
                            isExpired ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            📍 {enquiry.location}
                          </div>
                        )}
                        {isExpired && (
                          <Badge variant="outline" className="text-xs sm:text-sm text-gray-500 border-gray-400">
                            Expired
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        disabled={isExpired}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isExpired) {
                            navigate(`/enquiry/${enquiry.id}`);
                          }
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          if (!isExpired) {
                            navigate(`/enquiry/${enquiry.id}`);
                          }
                        }}
                        className={`w-full h-10 sm:h-12 text-xs sm:text-base font-medium border-2 transition-all duration-200 ${
                          isExpired 
                            ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SavedEnquiries;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Shield, CheckCircle, ArrowLeft, Crown, Send, Upload, ChevronDown, X, Bot } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useUsage } from "@/contexts/UsageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, limit, getDocs, updateDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/integrations/cloudinary";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { realtimeAI } from "@/services/ai/realtimeAI";
import VerificationStatus from "@/components/VerificationStatus";
import TimeLimitSelector from "@/components/TimeLimitSelector";
import PaymentPlanSelector from "@/components/PaymentPlanSelector";
import { PAYMENT_PLANS, PaymentPlan } from "@/config/paymentPlans";
import { processPayment, savePaymentRecord, updateUserPaymentPlan } from "@/services/paymentService";
// PRO PLAN - KEPT FOR FUTURE UPDATES
// import { getUserPaymentPlan, hasProEnquiriesRemaining, decrementProEnquiriesRemaining, getProEnquiriesRemaining } from "@/services/paymentService";

export default function PostEnquiry() {
  const { user, isProfileVerified, profileVerificationStatus, loading: authLoading } = useAuth();
  
  // Debug profile verification status
  // Helper function to determine if user is verified
  // Both manual and AI verification should work the same way
  const isUserVerified = isProfileVerified || 
                        profileVerificationStatus === 'approved' || 
                        profileVerificationStatus === 'verified' ||
                        profileVerificationStatus === 'completed';
  
  useEffect(() => {
    console.log('🔍 PostEnquiry Debug:', {
      isProfileVerified,
      profileVerificationStatus,
      isUserVerified,
      authLoading,
      userId: user?.uid,
      shouldShowID: !isUserVerified
    });
    
    // PRO PLAN STATUS CHECK - KEPT FOR FUTURE UPDATES
    // Check if user has Pro plan with remaining enquiries
    /* const checkProStatus = async () => {
      if (user?.uid) {
        const hasRemaining = await hasProEnquiriesRemaining(user.uid);
        const remainingCount = await getProEnquiriesRemaining(user.uid);
        
        console.log('✅ Pro Status Check:', { hasRemaining, remainingCount });
        
        setHasProRemaining(hasRemaining);
        setProRemainingCount(remainingCount);
        
        // If user has Pro enquiries remaining, auto-select Premium plan (not Pro)
        // because Pro enquiries automatically get premium features
        if (hasRemaining) {
          const premiumPlan = PAYMENT_PLANS.find(plan => plan.id === 'premium');
          if (premiumPlan) {
            setSelectedPlan(premiumPlan);
          }
        }
      }
    };
    
    checkProStatus();
    
    // Also check Pro status when page gains focus (user returns from upgrade)
    const handleFocus = () => {
      console.log('📍 Page focused, rechecking Pro status...');
      checkProStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    }; */
  }, [isProfileVerified, profileVerificationStatus, isUserVerified, authLoading, user?.uid]);
  const { canPostEnquiry, incrementEnquiries, getRemainingEnquiries } = useUsage();
  const { createNotification } = useNotifications();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // PRO PLAN - KEPT FOR FUTURE UPDATES
  // const [hasProRemaining, setHasProRemaining] = useState(false);
  // const [proRemainingCount, setProRemainingCount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
  const [idBackImage, setIdBackImage] = useState<File | null>(null);
  const [idUploadLoading, setIdUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | null>(null);
  const [enquiryStatus, setEnquiryStatus] = useState<string>('pending');
  const [isEnquiryApproved, setIsEnquiryApproved] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  
  // AI Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const handlePayment = async () => {
    if (!selectedPlan || !user?.uid) return;
    
    // Prevent double submission
    if (loading || paymentLoading || isSubmitted) {
      console.warn('⚠️ Payment blocked: Already processing or already submitted');
      return;
    }
    
    setPaymentStep('processing');
    setPaymentLoading(true);
    
    try {
      // Process payment using payment service
      const paymentResult = await processPayment(
        'temp-enquiry-id', // Will be updated after enquiry is created
        user.uid,
        selectedPlan,
        paymentDetails
      );
      
      // Check if payment actually succeeded
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
      console.log('✅ Razorpay payment completed successfully:', paymentResult.transactionId);
      setPaymentStep('success');
      
      // Submit enquiry after successful payment
      setTimeout(async () => {
        // Prevent double submission
        if (isSubmitted) {
          console.warn('⚠️ Enquiry creation blocked: Already submitted');
          setPaymentLoading(false);
          setShowPaymentModal(false);
          return;
        }
        
        try {
          setLoading(true);
          
          // Create enquiry data
          const enquiryData: any = {
            title: title.trim(),
            description: description.trim(),
            category: selectedCategories.length > 0 ? selectedCategories[0] : 'other',
            categories: selectedCategories.length > 0 ? selectedCategories : ['other'],
            budget: budget ? parseFloat(budget.replace(/[^\d]/g, '')) : null,
            location: location.trim(),
            deadline: deadline,
            isUrgent: deadline ? (() => {
              const now = new Date();
              const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
              return diffHours < 72;
            })() : false,
            status: "live",
            isPremium: selectedPlan.price > 0,
            selectedPlanId: selectedPlan.id,
            selectedPlanPrice: selectedPlan.price,
            paymentStatus: "completed",
            createdAt: serverTimestamp(),
            userId: user?.uid,
            userEmail: user?.email,
            userName: user?.displayName || user?.email?.split('@')[0],
            notes: notes.trim() || null,
            governmentIdFront: null,
            governmentIdBack: null,
            isUserVerified: isUserVerified,
            profileVerificationStatus: profileVerificationStatus
          };

          // Add enquiry to database
          const docRef = await addDoc(collection(db, "enquiries"), enquiryData);
          const enquiryId = docRef.id;
          console.log('Premium enquiry saved successfully with ID:', enquiryId);
          
          // Save payment record with actual enquiry ID
          const paymentRecordId = await savePaymentRecord(
            enquiryId,
            user.uid,
            selectedPlan,
            paymentResult.transactionId || ''
          );
          
          // Update user payment plan
          await updateUserPaymentPlan(user.uid, selectedPlan.id, paymentRecordId, enquiryId);
          
          // PRO PLAN LOGIC - KEPT FOR FUTURE UPDATES
          // If Pro plan was selected, refresh Pro status and count
          // if (selectedPlan.id === 'pro') {
          //   const hasRemaining = await hasProEnquiriesRemaining(user.uid);
          //   const remainingCount = await getProEnquiriesRemaining(user.uid);
          //   setHasProRemaining(hasRemaining);
          //   setProRemainingCount(remainingCount);
          //   // Trigger a window event to refresh Layout component's Pro badge
          //   window.dispatchEvent(new Event('payment-success'));
          // }
          
          setSubmittedEnquiryId(enquiryId);
          setEnquiryStatus('live');
          setIsEnquiryApproved(true);
          
          // Mark as submitted
          incrementEnquiries();
          setIsSubmitted(true);
          setIsPaymentSuccessful(true);
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your premium enquiry is now live!",
          });
          
        } catch (error) {
          console.error('Error creating premium enquiry:', error);
          toast({
            title: "Error",
            description: "Failed to create enquiry. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        
        setPaymentLoading(false);
        setShowPaymentModal(false);
        setPaymentStep('form');
        setPaymentDetails({ cardNumber: '', expiryDate: '', cvv: '', name: '' });
      }, 1000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStep('failed');
      setPaymentLoading(false);
    }
  };

  const resetPaymentModal = () => {
    setPaymentStep('form');
    setPaymentLoading(false);
    setPaymentDetails({ cardNumber: '', expiryDate: '', cvv: '', name: '' });
    setShowPaymentModal(false);
  };

  // Direct payment handler - skips custom card form, goes straight to Razorpay checkout
  const handleDirectPayment = async (): Promise<void> => {
    if (!selectedPlan || !user?.uid) {
      console.error('❌ Cannot process payment: Missing plan or user', { selectedPlan, user: !!user });
      toast({
        title: "Error",
        description: "Please select a plan and ensure you're signed in.",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent double submission
    if (loading || paymentLoading || isSubmitted) {
      console.warn('⚠️ Payment blocked: Already processing or already submitted', { loading, paymentLoading, isSubmitted });
      return;
    }
    
    console.log('🚀 Starting direct payment process...', {
      planId: selectedPlan.id,
      planPrice: selectedPlan.price,
      userId: user.uid
    });
    
    setPaymentLoading(true);
    
    try {
      // Process payment directly with Razorpay (no custom card form needed - Razorpay has its own)
      console.log('💳 Calling processPayment...');
      const paymentResult = await processPayment(
        'temp-enquiry-id', // Will be updated after enquiry is created
        user.uid,
        selectedPlan,
        {
          // Use user's info from Firebase auth - Razorpay will show its own card form
          name: user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
          contact: '', // Optional
        }
      );
      
      console.log('📊 Payment result received:', paymentResult);
      
      // Check if payment actually succeeded
      if (!paymentResult.success) {
        console.error('❌ Payment failed:', paymentResult.error);
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
      console.log('✅ Razorpay payment completed successfully:', paymentResult.transactionId);
      
      // Submit enquiry after successful payment
      setTimeout(async () => {
        // Prevent double submission
        if (isSubmitted) {
          console.warn('⚠️ Enquiry creation blocked: Already submitted');
          setPaymentLoading(false);
          return;
        }
        
        try {
          setLoading(true);
          
          // Create enquiry data
          const enquiryData: any = {
            title: title.trim(),
            description: description.trim(),
            category: selectedCategories.length > 0 ? selectedCategories[0] : 'other',
            categories: selectedCategories.length > 0 ? selectedCategories : ['other'],
            budget: budget ? parseFloat(budget.replace(/[^\d]/g, '')) : null,
            location: location.trim(),
            deadline: deadline,
            isUrgent: deadline ? (() => {
              const now = new Date();
              const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
              return diffHours < 72;
            })() : false,
            status: "live",
            isPremium: selectedPlan.price > 0,
            selectedPlanId: selectedPlan.id,
            selectedPlanPrice: selectedPlan.price,
            paymentStatus: "completed",
            createdAt: serverTimestamp(),
            userId: user?.uid,
            userEmail: user?.email,
            userName: user?.displayName || user?.email?.split('@')[0],
            notes: notes.trim() || null,
            governmentIdFront: null,
            governmentIdBack: null,
            isUserVerified: isUserVerified,
            profileVerificationStatus: profileVerificationStatus
          };

          // Add enquiry to database
          const docRef = await addDoc(collection(db, "enquiries"), enquiryData);
          const enquiryId = docRef.id;
          console.log('Premium enquiry saved successfully with ID:', enquiryId);
          
          // Save payment record with actual enquiry ID
          const paymentRecordId = await savePaymentRecord(
            enquiryId,
            user.uid,
            selectedPlan,
            paymentResult.transactionId || ''
          );
          
          // Update user payment plan
          await updateUserPaymentPlan(user.uid, selectedPlan.id, paymentRecordId, enquiryId);
          
          setSubmittedEnquiryId(enquiryId);
          setEnquiryStatus('live');
          setIsEnquiryApproved(true);
          
          // Mark as submitted
          incrementEnquiries();
          setIsSubmitted(true);
          setIsPaymentSuccessful(true);
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your premium enquiry is now live!",
          });
          
        } catch (error) {
          console.error('Error creating premium enquiry:', error);
          toast({
            title: "Error",
            description: "Failed to create enquiry. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        
        setPaymentLoading(false);
      }, 1000); */
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        selectedPlan,
        userId: user?.uid
      });
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again. Check console for details.",
        variant: "destructive",
      });
      setPaymentLoading(false);
    }
  };

  const handleSubmitAfterPayment = async () => {
    // Prevent double submission
    if (loading || isSubmitted) {
      console.warn('⚠️ Submit after payment blocked: Already submitting or already submitted');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create enquiry data
      const enquiryData: any = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategories.length > 0 ? selectedCategories[0] : 'other',
        categories: selectedCategories.length > 0 ? selectedCategories : ['other'],
        budget: budget ? parseFloat(budget.replace(/[^\d]/g, '')) : null,
        location: location.trim(),
        deadline: deadline,
        isUrgent: deadline ? (() => {
          const now = new Date();
          const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours < 72;
        })() : false,
        status: "pending", // Start as pending for admin verification
        isPremium: selectedPlan.price > 0,
        selectedPlanId: selectedPlan.id,
        selectedPlanPrice: selectedPlan.price,
        paymentStatus: "completed",
        createdAt: serverTimestamp(),
        userId: user?.uid,
        userEmail: user?.email,
        userName: user?.displayName || user?.email?.split('@')[0],
        notes: notes.trim() || null,
        governmentIdFront: null,
        governmentIdBack: null,
        isUserVerified: isUserVerified,
        profileVerificationStatus: profileVerificationStatus
      };

      // Add enquiry to database
      const docRef = await addDoc(collection(db, "enquiries"), enquiryData);
      console.log('Premium enquiry saved successfully with ID:', docRef.id);
      console.log('Premium enquiry data:', enquiryData);
      setSubmittedEnquiryId(docRef.id);
      setEnquiryStatus('pending');
      setIsEnquiryApproved(false);
      
      // Mark as submitted
      incrementEnquiries();
      setIsSubmitted(true);
      setIsPaymentSuccessful(true);
      
      toast({
        title: "Payment Successful! 🎉",
        description: "Your premium enquiry is being processed...",
      });
      
      // Process through AI approval system (same as free submission)
      console.log('🤖 Processing premium enquiry through AI approval system...');
      
      try {
        const { enquiryApprovalAI } = await import('@/services/ai/enquiryApproval');
        
        const enquiryForAI = {
          id: docRef.id,
          title: enquiryData.title,
          description: enquiryData.description,
          category: enquiryData.category,
          budget: enquiryData.budget,
          location: enquiryData.location,
          deadline: enquiryData.deadline,
          isPremium: true,
          userId: user.uid,
          createdAt: enquiryData.createdAt
        };
        
        const aiApproved = await enquiryApprovalAI.processEnquiry(docRef.id, enquiryForAI);
        
        if (aiApproved) {
          // AI approved - update status to live
          await updateDoc(doc(db, "enquiries", docRef.id), {
            status: 'live',
            adminNotes: 'AI Approved - High quality enquiry'
          });
          setEnquiryStatus('live');
          setIsEnquiryApproved(true);
          
          console.log('✅ Premium enquiry approved by AI');
        } else {
          // AI rejected - keep as pending for manual review
          setEnquiryStatus('pending');
          console.log('📋 Premium enquiry sent to manual review');
        }
        
      } catch (error) {
        console.error('❌ AI processing failed for premium enquiry:', error);
        setEnquiryStatus('pending');
      }
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error creating premium enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to create enquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/signin', { 
        state: { 
          message: 'Please sign in to post an enquiry',
          redirectTo: '/post-enquiry'
        }
      });
      return;
    }
  }, [user, navigate]);


  // Test database connection on component mount
  useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        console.log('Testing database connection...');
        const testQuery = query(collection(db, "enquiries"), limit(1));
        const testSnapshot = await getDocs(testQuery);
        console.log('Database connection successful, found', testSnapshot.size, 'documents');
      } catch (error) {
        console.error('Database connection failed:', error);
        alert('Database connection failed. Please check your internet connection and try again.');
      }
    };
    
    if (user) {
      testDatabaseConnection();
    }
  }, [user]);

  // REAL-TIME LISTENER for enquiry status updates (works for both free and premium)
  useEffect(() => {
    if (!submittedEnquiryId) {
      console.log('❌ No submittedEnquiryId, skipping real-time listener setup');
      return;
    }

    console.log('🚀 Setting up REAL-TIME listener for enquiry:', submittedEnquiryId);
    console.log('🚀 This works for BOTH free and premium submissions');
    
    // Scroll to top when success page loads
    window.scrollTo(0, 0);
    
    const enquiryRef = doc(db, "enquiries", submittedEnquiryId);
    let pollInterval: NodeJS.Timeout;
    let hasNavigatedFlag = false;
    let pollCount = 0;
    let lastStatus = 'pending';
    
    // More frequent polling for faster response
    pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`🔄 POLLING ATTEMPT #${pollCount} for enquiry:`, submittedEnquiryId);
      
      if (hasNavigatedFlag) {
        console.log('🛑 Navigation already triggered, stopping polling');
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const docSnap = await getDoc(enquiryRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentStatus = data.status;
          console.log('🔄 POLLING CHECK #' + pollCount + ' - Current status:', currentStatus, 'Previous:', lastStatus);
          
          // Update last status for comparison
          lastStatus = currentStatus;
          setEnquiryStatus(currentStatus);
          
          if (currentStatus === 'live' || currentStatus === 'approved') {
            hasNavigatedFlag = true;
            setIsEnquiryApproved(true);
            console.log('✅✅✅ ENQUIRY APPROVED! Auto-navigating to live enquiries page...');
            console.log('✅✅✅ Status changed from pending to', currentStatus);
            
            // Clear the polling interval immediately
            clearInterval(pollInterval);
            
            // Show success message
            toast({
              title: "Enquiry Approved! 🎉",
              description: "Your enquiry is now live and visible to sellers!",
            });
            
            // Navigate immediately without delay
            console.log('🚀🚀🚀 NAVIGATING TO LIVE ENQUIRIES NOW...');
            navigate("/enquiries");
            
          } else if (currentStatus === 'rejected') {
            hasNavigatedFlag = true;
            console.log('❌❌❌ ENQUIRY REJECTED! Auto-navigating to dashboard...');
            
            // Clear the polling interval immediately
            clearInterval(pollInterval);
            
            // Show rejection message
            toast({
              title: "Enquiry Rejected",
              description: "Your enquiry was not approved. Check your dashboard for details.",
              variant: "destructive",
            });
            
            // Navigate immediately without delay
            console.log('🚀🚀🚀 NAVIGATING TO DASHBOARD NOW...');
            navigate("/dashboard");
            
          } else {
            // Update status without navigating
            console.log('📊 Status update:', currentStatus, '(no navigation needed)');
          }
        } else {
          console.log('❌ Document not found for enquiry:', submittedEnquiryId);
        }
      } catch (error) {
        console.error('❌ Error in polling check #' + pollCount + ':', error);
      }
    }, 1000); // Check every 1 second for even faster response

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up enquiry status listener and polling');
      clearInterval(pollInterval);
    };
  }, [submittedEnquiryId, navigate]); // Only depend on submittedEnquiryId and navigate

  // Show loading or redirect if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pal-blue mx-auto mb-4"></div>
            <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Complete Payment</h2>
                <button
                  onClick={resetPaymentModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {paymentStep === 'form' && (
                <div className="space-y-4">
                  {/* Payment Details */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">
                        {selectedPlan?.name || 'Premium Enquiry'}
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{selectedPlan?.price || 0}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {selectedPlan?.description || 'Premium enquiry benefits'}
                    </p>
                  </div>

                  {/* Payment Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
                          }}
                          maxLength={5}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={paymentDetails.name}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Test Payment Notice */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-xs">🧪</span>
                      </div>
                      <div>
                        <p className="font-medium text-yellow-800 text-sm">Test Mode</p>
                        <p className="text-yellow-700 text-[10px] sm:text-xs whitespace-nowrap">Test mode - any card works</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={resetPaymentModal}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={paymentLoading || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.name}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {paymentLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Pay ₹${selectedPlan?.price || 0}`
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Processing Payment</h3>
                  <p className="text-slate-600">Please wait while we process your payment...</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-green-600">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-600">Your premium enquiry is now ready to be submitted.</p>
                </div>
              )}

              {paymentStep === 'failed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-pal-blue/10 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-pal-blue">✗</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Failed</h3>
                  <p className="text-slate-600 mb-4">Something went wrong. Please try again.</p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={resetPaymentModal}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setPaymentStep('form')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


  let categories = [
    // Professional & Business
    { value: "jobs", label: "Jobs & Employment", group: "Professional" },
    { value: "professional-services", label: "Professional Services", group: "Professional" },
    { value: "real-estate", label: "Real Estate", group: "Professional" },
    { value: "real-estate-services", label: "Real Estate Services", group: "Professional" },
    { value: "legal-financial", label: "Legal & Financial", group: "Professional" },
    { value: "marketing-advertising", label: "Marketing & Advertising", group: "Professional" },
    { value: "insurance-services", label: "Insurance Services", group: "Professional" },
    { value: "government-public", label: "Government & Public", group: "Professional" },
    { value: "non-profit-charity", label: "Non-Profit & Charity", group: "Professional" },
    // Products & Collectibles
    { value: "antiques", label: "Antiques", group: "Products" },
    { value: "art", label: "Art & Artifacts", group: "Products" },
    { value: "automobile", label: "Automobile", group: "Products" },
    { value: "books-publications", label: "Books & Publications", group: "Products" },
    { value: "collectibles", label: "Collectibles", group: "Products" },
    { value: "electronics-gadgets", label: "Electronics & Gadgets", group: "Products" },
    { value: "fashion-apparel", label: "Fashion & Apparel", group: "Products" },
    { value: "home-furniture", label: "Home & Furniture", group: "Products" },
    { value: "jewelry-accessories", label: "Jewelry & Accessories", group: "Products" },
    { value: "memorabilia", label: "Memorabilia", group: "Products" },
    { value: "sneakers", label: "Sneakers", group: "Products" },
    { value: "souvenir", label: "Souvenir", group: "Products" },
    { value: "thrift", label: "Thrift", group: "Products" },
    { value: "vintage", label: "Vintage Items", group: "Products" },
    // Lifestyle & Services
    { value: "agriculture-farming", label: "Agriculture & Farming", group: "Lifestyle" },
    { value: "childcare-family", label: "Childcare & Family", group: "Lifestyle" },
    { value: "education-training", label: "Education & Training", group: "Lifestyle" },
    { value: "entertainment-media", label: "Entertainment & Media", group: "Lifestyle" },
    { value: "events-entertainment", label: "Events & Entertainment", group: "Lifestyle" },
    { value: "food-beverage", label: "Food & Beverage", group: "Lifestyle" },
    { value: "gaming-recreation", label: "Gaming & Recreation", group: "Lifestyle" },
    { value: "health-beauty", label: "Health & Beauty", group: "Lifestyle" },
    { value: "pets", label: "Pets & Animals", group: "Lifestyle" },
    { value: "sports-outdoor", label: "Sports & Outdoor", group: "Lifestyle" },
    { value: "travel-tourism", label: "Travel & Tourism", group: "Lifestyle" },
    { value: "wedding-events", label: "Wedding & Events", group: "Lifestyle" },
    // Technology & Innovation
    { value: "technology", label: "Technology", group: "Technology" },
    { value: "renewable-energy", label: "Renewable Energy", group: "Technology" },
    // Industrial & Construction
    { value: "construction-renovation", label: "Construction & Renovation", group: "Industrial" },
    { value: "raw-materials-industrial", label: "Raw Materials & Industrial", group: "Industrial" },
    { value: "transportation-logistics", label: "Transportation & Logistics", group: "Industrial" },
    { value: "waste-management", label: "Waste Management", group: "Industrial" },
    // Security & Safety
    { value: "security-safety", label: "Security & Safety", group: "Security" },
    // 'Other' will be added last
    { value: "other", label: "Other", group: "Other" }
  ];
  // Sort all except 'Other' alphabetically, then add 'Other' at the end
  categories = [
    ...categories.filter(cat => cat.value !== 'other').sort((a, b) => a.label.localeCompare(b.label)),
    categories.find(cat => cat.value === 'other')
  ];

  const remainingEnquiries = getRemainingEnquiries();

  // Handle multiple category selection (max 3)
  const handleCategoryToggle = (categoryValue: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryValue)) {
        return prev.filter(cat => cat !== categoryValue);
      } else if (prev.length < 3) {
        return [...prev, categoryValue];
      } else {
        // Already at max limit, don't add more
        return prev;
      }
    });
  };

  // AI Location suggestions function
  const generateLocationSuggestions = (input: string) => {
    const commonLocations = [
      // --- States & Union Territories ---
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
      "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
      // --- Major Cities ---
      "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivali", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Navi Mumbai", "Solapur", "Vijayawada", "Ranchi", "Chandigarh", "Mysore", "Jodhpur", "Guwahati", "Jabalpur", "Gwalior", "Noida", "Coimbatore", "Kochi", "Bhubaneswar", "Dehradun", "Amritsar", "Allahabad", "Howrah", "Rourkela", "Dhanbad", "Asansol", "Nanded", "Kolhapur", "Ajmer", "Guntur", "Salem", "Warangal", "Udaipur", "Tiruchirappalli", "Kozhikode", "Thrissur", "Alappuzha", "Vellore", "Tirunelveli", "Kollam", "Kottayam", "Palakkad", "Malappuram", "Kannur", "Pathanamthitta", "Ernakulam", "Wayanad", "Idukki",
      // --- Sample Districts/Towns (add more as needed) ---
      "Aligarh", "Ambala", "Bareilly", "Belgaum", "Bhavnagar", "Bilaspur", "Cuttack", "Durgapur", "Gaya", "Gorakhpur", "Hubli", "Jamnagar", "Jhansi", "Kakinada", "Kharagpur", "Kurnool", "Mathura", "Moradabad", "Muzaffarnagar", "Muzaffarpur", "Nellore", "Panipat", "Rohtak", "Saharanpur", "Sangli", "Shimla", "Siliguri", "Tirupati", "Ujjain", "Vellore", "Vijayanagaram", "Yamunanagar",
      // --- Global/Remote/Anywhere ---
      "Anywhere", "Everywhere", "Remote", "Work from Home", "Online", "Virtual", "Global", "International"
    ];
    
    if (!input.trim()) {
      setLocationSuggestions([]);
      return;
    }
    
    const filtered = commonLocations.filter(loc => 
      loc.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 12); // Show up to 12 suggestions
    
    setLocationSuggestions(filtered);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    generateLocationSuggestions(value);
    setShowLocationSuggestions(true);
  };

  const selectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission - CRITICAL FIX
    if (loading || isSubmitted) {
      console.warn('⚠️ Submission blocked: Already submitting or already submitted');
      return;
    }
    
    console.log('🚀 FORM SUBMITTED! 🚀');
    console.log('Form submission started');
    console.log('Form data:', { title, description, category, budget, location, deadline, notes });
    console.log('ID images:', { idFrontImage: !!idFrontImage, idBackImage: !!idBackImage });
    console.log('Current loading state:', loading);
    console.log('Current selectedPlan:', selectedPlan);
    
    if (!user) {
      alert('Please sign in to post an enquiry.');
      return;
    }
    
    if (!canPostEnquiry()) {
      console.log('Cannot post enquiry - usage limit reached');
      setShowUpgrade(true);
      return;
    }

    // Validate required fields
    if (!title.trim() || !description.trim() || (selectedCategories.length === 0 && !category) || !budget.trim() || !location.trim()) {
      alert('Please fill in all required fields (title, description, categories, budget, location).');
      return;
    }

    // Check if premium option is selected
    console.log('Checking premium status:', { selectedPlan, planId: selectedPlan?.id, planPrice: selectedPlan?.price });
    
    // If premium option is selected, go directly to Razorpay checkout (Razorpay has its own card form)
    if (selectedPlan && selectedPlan.price > 0) {
      console.log('💳 Premium plan selected - Opening Razorpay checkout directly (Razorpay has built-in card form)');
      console.log('💳 Plan details:', { id: selectedPlan.id, name: selectedPlan.name, price: selectedPlan.price });
      
      // CRITICAL: Prevent form submission and wait for payment
      // Call handleDirectPayment and wait for it to complete
      // The payment handler will create the enquiry after successful payment
      try {
        await handleDirectPayment();
        // If payment succeeds, handleDirectPayment will create the enquiry
        // So we should return here to prevent double submission
        return;
      } catch (error) {
        console.error('❌ Error in handleDirectPayment:', error);
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : "Failed to open payment gateway. Please try again.",
          variant: "destructive",
        });
        // Don't submit enquiry if payment failed
        return;
      }
    }
    
    // PRO PLAN LOGIC - KEPT FOR FUTURE UPDATES
    // If premium option is selected AND user doesn't have Pro remaining, show payment modal first
    // Pro users with remaining enquiries get premium features automatically without payment
    // if (selectedPlan && selectedPlan.price > 0 && !hasProRemaining) {
    //   console.log('💳 Opening payment modal for premium enquiry (Pro depleted or no Pro plan)');
    //   setShowPaymentModal(true);
    //   return; // Don't submit enquiry yet
    // }
    // If Pro user has remaining enquiries, skip payment and proceed directly
    // if (hasProRemaining) {
    //   console.log(`🎯 Pro user with ${proRemainingCount} enquiries remaining - skipping payment, proceeding directly`);
    // }

    // ID images are only needed for non-verified users
    // Trust badge verified users don't need to upload ID
    
    try {
      setLoading(true);
      
      let idFrontUrl = null;
      let idBackUrl = null;
      
      // Only process ID upload for non-verified users
      if (!isUserVerified && (idFrontImage || idBackImage)) {
        console.log('Starting ID image upload for non-verified user...');
        setIdUploadLoading(true);
        setUploadStage('Uploading ID documents...');
        setUploadProgress(0);
        try {
          if (idFrontImage) {
            setUploadStage('Uploading front ID to Cloudinary...');
            setUploadProgress(25);
            idFrontUrl = await uploadToCloudinary(idFrontImage);
            console.log('Front ID uploaded to Cloudinary');
          }
          
          if (idBackImage) {
            setUploadStage('Uploading back ID to Cloudinary...');
            setUploadProgress(50);
            idBackUrl = await uploadToCloudinary(idBackImage);
            console.log('Back ID uploaded to Cloudinary');
          }
          
          setUploadProgress(75);
          setUploadStage('ID documents uploaded successfully!');
        } catch (uploadError) {
          console.error('Error uploading ID documents:', uploadError);
          setUploadStage(`Upload failed: ${uploadError}`);
          throw new Error(`Failed to upload ID documents: ${uploadError}`);
        }
      } else if (isProfileVerified) {
        console.log('User is verified - skipping ID upload');
        setUploadStage('User verified - no ID upload needed');
        setUploadProgress(100);
      } else {
        console.log('No ID images to upload');
        setUploadStage('No ID images provided');
        setUploadProgress(100);
      }
      
      console.log('Now saving to Firestore...');
      setUploadStage('Saving enquiry to database...');
      setUploadProgress(90);
      
      // PRO PLAN AUTO-ENQUIRY LOGIC - KEPT FOR FUTURE UPDATES
      // Determine if this is a Pro auto-enquiry and decrement count
      // let isAutoProEnquiry = false;
      // if (hasProRemaining) {
      //   isAutoProEnquiry = true;
      //   // Decrement Pro count
      //   await decrementProEnquiriesRemaining(user.uid);
      //   // Refresh Pro status and count
      //   const remainingCount = await getProEnquiriesRemaining(user.uid);
      //   const hasRemaining = await hasProEnquiriesRemaining(user.uid);
      //   setProRemainingCount(remainingCount);
      //   setHasProRemaining(hasRemaining);
      //   // Trigger event to refresh Layout component's Pro badge
      //   window.dispatchEvent(new Event('payment-success'));
      // }
      const isAutoProEnquiry = false; // Always false now since Pro is disabled
      
      // Only include government ID fields if they exist
      const enquiryData: any = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategories.length > 0 ? selectedCategories[0] : 'other', // Primary category (first selected)
        categories: selectedCategories.length > 0 ? selectedCategories : ['other'], // All selected categories
        budget: budget ? parseFloat(budget.replace(/[^\d]/g, '')) : null,
        location: location.trim(),
        deadline: deadline,
        isUrgent: deadline ? (() => {
          const now = new Date();
          const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours < 72; // Less than 3 days is considered urgent
        })() : false,
        status: selectedPlan && selectedPlan.price > 0 ? "pending_payment" : (isUserVerified ? "live" : "pending"),
        isPremium: isAutoProEnquiry || (selectedPlan ? selectedPlan.price > 0 : false),
        selectedPlanId: isAutoProEnquiry ? 'premium' : (selectedPlan?.id || 'free'), // Pro enquiries get premium features
        selectedPlanPrice: isAutoProEnquiry ? 0 : (selectedPlan?.price || 0), // No charge for Pro auto-enquiries
        isAutoProEnquiry: isAutoProEnquiry, // Flag to identify Pro auto-enquiries
        paymentStatus: selectedPlan && selectedPlan.price > 0 ? "pending" : "completed",
        createdAt: serverTimestamp(),
        userId: user.uid,
        responses: 0,
        likes: 0,
        shares: 0,
        views: 0,
        userLikes: [],
        notes: notes.trim(),
        userVerified: isUserVerified, // Pass verification status to AI
        isProfileVerified: isUserVerified
      };

      // Only add government ID fields if they exist
      if (idFrontUrl) {
        enquiryData.idFrontImage = idFrontUrl;
      }
      if (idBackUrl) {
        enquiryData.idBackImage = idBackUrl;
      }
      
      console.log('Saving enquiry data:', enquiryData);
      
      // Final check before submission to prevent duplicates
      if (isSubmitted) {
        console.warn('⚠️ Duplicate submission prevented: Already submitted');
        setLoading(false);
        return;
      }
      
      try {
        const docRef = await addDoc(collection(db, "enquiries"), enquiryData);
        console.log('Enquiry saved successfully with ID:', docRef.id);
        // Mark as submitted immediately after successful creation to prevent duplicates
        setIsSubmitted(true);
        setSubmittedEnquiryId(docRef.id);
        setEnquiryStatus('pending');
        setIsEnquiryApproved(false);
        setUploadProgress(100);
        setUploadStage('Enquiry submitted successfully!');
        
        // This code should not be reached for premium enquiries
        // Premium enquiries are handled before this point
        
        // Process through AI approval system for free enquiries
        console.log('🤖 Processing free enquiry through AI approval system...');
        
        try {
          const { enquiryApprovalAI } = await import('@/services/ai/enquiryApproval');
          
          const enquiryForAI = {
            id: docRef.id,
            title: enquiryData.title,
            description: enquiryData.description,
            category: enquiryData.category,
            budget: enquiryData.budget,
            location: enquiryData.location,
            deadline: enquiryData.deadline,
            isPremium: false,
            userId: user.uid,
            createdAt: enquiryData.createdAt
          };
          
          const aiApproved = await enquiryApprovalAI.processEnquiry(docRef.id, enquiryForAI);
          
          if (aiApproved) {
            // AI approved - update status to live
            await updateDoc(doc(db, "enquiries", docRef.id), {
              status: 'live',
              adminNotes: 'AI Approved - High quality enquiry'
            });
            setEnquiryStatus('live');
            setIsEnquiryApproved(true);
            
            console.log('✅ Free enquiry approved by AI');
            
            toast({
              title: "Enquiry Posted Successfully! 🎉",
              description: "Your enquiry is now live and visible to sellers.",
              variant: "default",
            });
          } else {
            // AI rejected or flagged - keep as pending for manual review
            setEnquiryStatus('pending');
            console.log('📋 Free enquiry sent to manual review');
            
            // Check if it was flagged as duplicate
            const enquiryDoc = await getDoc(doc(db, "enquiries", docRef.id));
            const enquiryStatus = enquiryDoc.data();
            
            if (enquiryStatus?.isDuplicate) {
              toast({
                title: "Duplicate Detected",
                description: "Your enquiry appears similar to existing ones. It's under review by our team.",
                variant: "default",
              });
            } else {
              toast({
                title: "Under Review",
                description: "Your enquiry is being reviewed. You'll be notified once it's approved.",
                variant: "default",
              });
            }
          }
          
        } catch (error) {
          console.error('❌ AI processing failed for free enquiry:', error);
          setEnquiryStatus('pending');
          
          toast({
            title: "Enquiry Submitted",
            description: "Your enquiry is being reviewed. You'll be notified once it's approved.",
            variant: "default",
          });
        }
        
        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        incrementEnquiries();
        setIsSubmitted(true);
        
        // DISABLED: Create notification for enquiry submission to prevent flooding
        // try {
        //   await createNotification('enquiry_update', {
        //     title: 'Enquiry Submitted Successfully! 🎉',
        //     message: isUserVerified 
        //       ? 'Your enquiry is now live and visible to sellers!' 
        //       : 'Your enquiry has been submitted and is under review. You will be notified when it goes live!',
        //     priority: 'high',
        //     actionUrl: '/my-enquiries',
        //     actionText: 'View My Enquiries'
        //   });
        // } catch (notificationError) {
        //   console.error('Failed to create notification:', notificationError);
        // }
        
        // 🤖 AI Processing - Skip for verified users, they're already auto-approved
        if (isUserVerified) {
          console.log('✅ Trust Badge User: Enquiry automatically approved and made live!');
          // Auto-navigate verified users to live enquiries page
          setTimeout(() => {
            navigate("/enquiries");
          }, 3000);
        } else {
          // Process the enquiry with AI in real-time (non-blocking)
          console.log('🤖 PostEnquiry: Starting AI processing for enquiry:', docRef.id, 'User verified:', isProfileVerified);
          realtimeAI.processEnquirySubmission(docRef.id, enquiryData)
            .then((result) => {
              if (result.success) {
                console.log('✅ AI: Enquiry auto-approved and made live instantly!');
              } else if (result.action === 'flagged') {
                console.log('⏳ AI: Enquiry flagged for manual review');
              } else {
                console.log('❌ AI: Enquiry auto-rejected');
              }
            })
            .catch((error) => {
              console.error('🤖 AI: Error processing enquiry:', error);
              // AI processing failure doesn't affect user experience
            });
        }
        
        // Don't reset form immediately - show verification status first
        // setTitle("");
        // setDescription("");
        // setCategory("");
        // setBudget("");
        // setLocation("");
        // setDeadline(null);
        // setNotes("");
        // setIdFrontImage(null);
        // setIdBackImage(null);
      } catch (dbError) {
        console.error('Error saving to Firestore:', dbError);
        throw new Error(`Failed to save enquiry to database: ${dbError}`);
      }
    } catch (err: any) {
      console.error('Error submitting enquiry:', err);
      alert(`Failed to submit enquiry: ${err?.message || 'Unknown error occurred'}. Please try again.`);
    } finally {
      setLoading(false);
      setIdUploadLoading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  // Scroll to top when success page is shown
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo(0, 0);
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Header Section - Gray Background */}
            <div className="mb-4 sm:mb-6">
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto p-3 sm:p-4 bg-white/10 rounded-full w-fit mb-3 sm:mb-4">
                    <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-400" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    Enquiry Sent for Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed px-2">
                    Our AI system will review your enquiry and make it live shortly
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6">
              {/* AI Processing Status - Card Header */}
              <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-white">
                    AI Processing Active
                  </span>
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                </div>
              </div>
              
              {/* Card Content */}
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4 text-center">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-green-700">
                      Auto-redirect when approved
                    </p>
                    <p className="text-[10px] sm:text-xs text-green-600">
                      Watching for updates every second
                    </p>
                  </div>
                  
                  {/* Privacy Statement */}
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-medium">
                        Your personal details remain private
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/enquiries" className="flex-1">
                <Button 
                  variant="default" 
                  className="w-full h-11 sm:h-10 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                >
                  Browse Other Enquiries
                </Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full h-11 sm:h-10 text-sm sm:text-base font-semibold border-gray-300 min-h-[44px]"
                >
                  View My Dashboard
                </Button>
              </Link>
            </div>
            
            {/* Debug info */}
            {submittedEnquiryId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <p className="text-sm text-gray-700 mb-3 font-semibold">
                  🔍 Debug Information
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Enquiry ID:</strong> {submittedEnquiryId}</p>
                  <p><strong>Current Status:</strong> {enquiryStatus}</p>
                  <p><strong>Real-time monitoring:</strong> {submittedEnquiryId ? '✅ Active' : '❌ Inactive'}</p>
                  <p><strong>isSubmitted:</strong> {isSubmitted ? '✅ True' : '❌ False'}</p>
                  <p><strong>isEnquiryApproved:</strong> {isEnquiryApproved ? '✅ True' : '❌ False'}</p>
                </div>
                
                {/* Manual test button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      console.log('🧪 MANUAL TEST: Checking enquiry status...');
                      try {
                        const enquiryRef = doc(db, "enquiries", submittedEnquiryId);
                        const docSnap = await getDoc(enquiryRef);
                        if (docSnap.exists()) {
                          const data = docSnap.data();
                          console.log('🧪 MANUAL TEST: Current status:', data.status);
                          console.log('🧪 MANUAL TEST: Full data:', data);
                          toast({
                            title: "Manual Check Complete",
                            description: `Status: ${data.status}`,
                          });
                        } else {
                          console.log('🧪 MANUAL TEST: Document not found');
                          toast({
                            title: "Document Not Found",
                            description: "Enquiry document not found in database",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error('🧪 MANUAL TEST ERROR:', error);
                        toast({
                          title: "Check Failed",
                          description: "Error checking enquiry status",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    🧪 Manual Status Check
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-6 lg:py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header - Minimal */}
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
                  <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    Post Enquiry
                  </h1>
                </div>
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>
              <p className="text-gray-300 text-[10px] sm:text-xs lg:text-sm max-w-2xl mx-auto text-center whitespace-nowrap">
                AI matches you with verified sellers
              </p>
            </div>
          </div>

          {/* Success Message */}
          {isSubmitted && (
            <Card className="border-2 border-blue-200 shadow-sm mb-6 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Enquiry Posted Successfully!
                </h3>
                <p className="text-[10px] sm:text-sm text-green-700 mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
                  Sent for verification - You'll get notified
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/dashboard">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      View Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Post Another Enquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Form - Minimal Design */}
          {!isSubmitted && (
            <Card className="border-2 border-blue-200 shadow-sm rounded-2xl">
              <CardContent className="p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title - Minimal */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                      {category === "jobs" ? "Job Title" : "What you need"} *
                    </Label>
                    <Input
                      id="title"
                      placeholder={category === "jobs" ? "e.g., Senior Web Developer" : "e.g., Vintage Toyota Car"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 sm:h-11 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400 min-touch pl-4 pr-4"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  {/* Multiple Categories - Enhanced */}
                  <div className="space-y-3">
                  <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Choose Categories *
                    </Label>
                      <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        💡 Select up to 3 categories for better reach
                      </p>
                    </div>
                    
                    {/* Multiple Category Selection - Mobile-Friendly Sheet */}
                    <div className="space-y-2">
                      {/* Mobile: Use Sheet (bottom drawer), Desktop: Use Popover */}
                      <div className="block sm:hidden">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between min-h-[48px] h-auto py-3 px-4 border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-base ${
                                selectedCategories.length === 0 ? 'border-pal-blue/30 bg-pal-blue/5' : ''
                              }`}
                            >
                              <div className="flex flex-wrap gap-1.5 flex-1 text-left items-center min-w-0">
                                {selectedCategories.length === 0 ? (
                                  <span className="text-base text-slate-500">Select categories...</span>
                                ) : (
                                  selectedCategories.map((catValue) => {
                                    const cat = categories.find(c => c.value === catValue);
                                    return (
                                      <Badge 
                                        key={catValue} 
                                        variant="secondary" 
                                        className="text-xs px-2.5 py-1 whitespace-nowrap flex-shrink-0"
                                      >
                                        {cat?.label}
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>
                              <ChevronDown className="ml-2 h-5 w-5 flex-shrink-0" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-[80vh] max-h-[600px] p-0">
                            <SheetHeader className="px-4 pt-4 pb-2 border-b">
                              <SheetTitle className="text-lg font-semibold text-left">Select Categories</SheetTitle>
                              <p className="text-sm text-slate-500 text-left">Choose up to 3 categories</p>
                            </SheetHeader>
                            <div className="overflow-y-auto h-full pb-4">
                              <div className="px-2 py-2">
                                {categories.map((cat) => {
                                  const isSelected = selectedCategories.includes(cat.value);
                                  const isDisabled = !isSelected && selectedCategories.length >= 3;
                                  
                                  return (
                                    <div 
                                      key={cat.value} 
                                      className={`flex items-center space-x-3 p-4 min-h-[56px] active:bg-slate-100 rounded-lg transition-colors ${
                                        isDisabled ? 'opacity-50' : ''
                                      }`}
                                      onClick={() => !isDisabled && handleCategoryToggle(cat.value)}
                                    >
                                      <Checkbox
                                        id={`mobile-${cat.value}`}
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onCheckedChange={() => handleCategoryToggle(cat.value)}
                                        className="h-5 w-5"
                                      />
                                      <Label
                                        htmlFor={`mobile-${cat.value}`}
                                        className={`text-base flex-1 cursor-pointer ${
                                          isDisabled ? 'text-slate-400' : 'text-slate-700'
                                        }`}
                                      >
                                        {cat.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                              {selectedCategories.length >= 3 && (
                                <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 sticky bottom-0">
                                  <p className="text-sm text-blue-600 font-medium text-center">
                                    ✅ Max 3 categories selected
                                  </p>
                                </div>
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      
                      {/* Desktop: Use Popover */}
                      <div className="hidden sm:block">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between min-h-[44px] h-auto py-2 px-3 border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                                selectedCategories.length === 0 ? 'border-pal-blue/30 bg-pal-blue/5' : ''
                              }`}
                            >
                              <div className="flex flex-wrap gap-1.5 flex-1 text-left items-center min-w-0">
                                {selectedCategories.length === 0 ? (
                                  <span className="text-sm text-slate-500">Select categories...</span>
                                ) : (
                                  selectedCategories.map((catValue) => {
                                    const cat = categories.find(c => c.value === catValue);
                                    return (
                                      <Badge 
                                        key={catValue} 
                                        variant="secondary" 
                                        className="text-xs px-2 py-0.5 whitespace-nowrap flex-shrink-0"
                                      >
                                        {cat?.label}
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>
                              <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[100vw] p-0" align="start">
                            <div className="max-h-60 overflow-y-auto">
                              {categories.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.value);
                                const isDisabled = !isSelected && selectedCategories.length >= 3;
                                
                                return (
                                  <div 
                                    key={cat.value} 
                                    className={`flex items-center space-x-2 p-3 hover:bg-slate-50 ${
                                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    <Checkbox
                                      id={cat.value}
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onCheckedChange={() => handleCategoryToggle(cat.value)}
                                    />
                                    <Label
                                      htmlFor={cat.value}
                                      className={`text-sm flex-1 ${
                                        isDisabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'
                                      }`}
                                    >
                                      {cat.label}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                            {selectedCategories.length >= 3 && (
                              <div className="p-3 bg-blue-50 border-t border-blue-200">
                                <p className="text-xs text-blue-600 whitespace-nowrap">
                                  ✅ Max 3 categories selected
                                </p>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {selectedCategories.length === 0 && (
                        <p className="text-[10px] sm:text-xs text-pal-blue whitespace-nowrap">
                          ⚠️ Select at least one category
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description - Minimal */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                      {selectedCategories.includes("jobs") ? "Job Description" : "Description"} *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={selectedCategories.includes("jobs") ? "Job responsibilities, requirements, experience needed..." : "Specifications, requirements, timeline..."}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 resize-none text-base min-h-[120px] min-touch"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  {/* Budget & Location - Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-sm font-medium text-slate-700">
                        {selectedCategories.includes("jobs") ? "Salary (₹)" : "Budget (₹)"} *
                      </Label>
                      <Input
                        id="budget"
                        placeholder={selectedCategories.includes("jobs") ? "50,000/month" : "50,000"}
                        value={budget}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          const numericValue = value.replace(/,/g, '');
                          if (numericValue === '' || /^\d+$/.test(numericValue)) {
                            const formattedValue = numericValue === '' ? '' : parseInt(numericValue).toLocaleString('en-IN');
                            setBudget(formattedValue);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value && !e.target.value.startsWith('₹')) {
                            setBudget('₹' + e.target.value);
                          }
                        }}
                        className="h-12 sm:h-11 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400 min-touch pl-4 pr-4"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                        Location *
                      </Label>
                      <div className="relative">
                      <Input
                        id="location"
                          placeholder="Anywhere"
                        value={location}
                          onChange={handleLocationChange}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        className="h-12 sm:h-11 text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400 min-touch pl-4 pr-4"
                        style={{ fontSize: '16px' }}
                        required
                      />
                        
                        {/* AI Location Suggestions Dropdown */}
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectLocation(suggestion)}
                                className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none text-xs sm:text-sm"
                              >
                                <span className="font-medium">{suggestion}</span>
                                {(suggestion === "Anywhere" || suggestion === "Everywhere") && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                    Global
                                  </span>
                                )}
                              </button>
                            ))}
                            </div>
                            )}
                          </div>
                    </div>
                  </div>

                  {/* Time Limit & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <TimeLimitSelector
                        value={deadline}
                        onChange={setDeadline}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional requirements or preferences..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 resize-none text-base pl-4 pr-4 py-3"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Payment Plan Selection */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* PRO PLAN ACTIVE BADGE - KEPT FOR FUTURE UPDATES */}
                    {/* {hasProRemaining ? (
                      <div className="p-3 sm:p-4 bg-gray-800 border-2 border-gray-700 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white text-sm sm:text-base">Pro Plan Active</h3>
                            <Badge className="bg-gray-700 text-white text-xs px-2 py-0.5">
                              {proRemainingCount} Left
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : ( */}
                    <div className="space-y-2">
                      <Label className="text-[11px] sm:text-xs font-medium text-slate-700">
                        Choose Your Plan (Optional)
                      </Label>
                      
                      <PaymentPlanSelector
                        currentPlanId={selectedPlan?.id || 'free'}
                        enquiryId="new-enquiry"
                        userId={user?.uid || ''}
                        onPlanSelect={(planId, price) => {
                          const plan = PAYMENT_PLANS.find(p => p.id === planId);
                          setSelectedPlan(plan || null);
                        }}
                        isUpgrade={false}
                        className="max-w-4xl mx-auto"
                      />
                    </div>

                    {selectedPlan && selectedPlan.price > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-xs">💎</span>
                          </div>
                          <div className="text-[10px] sm:text-sm text-blue-800">
                            <p className="font-medium mb-1 whitespace-nowrap">{selectedPlan.name} Plan Benefits:</p>
                            <ul className="text-[10px] sm:text-xs space-y-1 text-blue-700">
                              {selectedPlan.features.map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Government ID - Only show for non-verified users */}
                  {!authLoading && !isUserVerified && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-slate-600" />
                      <Label className="text-sm font-medium text-slate-700">
                        ID Verification (Optional)
                      </Label>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        {idFrontImage || idBackImage ? (
                          "✓ ID uploaded - pending verification"
                        ) : (
                          "Upload ID to build trust"
                        )}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Front ID */}
                      <div className="space-y-2">
                        <Label htmlFor="idFront" className="text-xs font-medium text-slate-600">
                          Front Side
                        </Label>
                        <div className="relative">
                          <input
                            type="file"
                            id="idFront"
                            accept="image/*"
                            onChange={(e) => setIdFrontImage(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label
                            htmlFor="idFront"
                            className={`block w-full h-20 border border-dashed rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                              idFrontImage
                                ? 'border-green-300 bg-green-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {idFrontImage ? (
                              <div className="space-y-1">
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                <p className="text-[10px] sm:text-xs text-green-700 font-medium whitespace-nowrap">Uploaded</p>
                                <p className="text-[10px] sm:text-xs text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">{idFrontImage.name}</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mx-auto" />
                                <p className="text-[10px] sm:text-sm text-muted-foreground font-medium whitespace-nowrap">Click to upload</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Front side of ID</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Back ID */}
                      <div className="space-y-2">
                        <Label htmlFor="idBack" className="text-xs font-medium text-slate-600">
                          Back Side
                        </Label>
                        <div className="relative">
                          <input
                            type="file"
                            id="idBack"
                            accept="image/*"
                            onChange={(e) => setIdBackImage(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label
                            htmlFor="idBack"
                            className={`block w-full h-20 border border-dashed rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                              idBackImage
                                ? 'border-green-300 bg-green-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {idBackImage ? (
                              <div className="space-y-1">
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                <p className="text-[10px] sm:text-xs text-green-700 font-medium whitespace-nowrap">Uploaded</p>
                                <p className="text-[10px] sm:text-xs text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">{idBackImage.name}</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Upload className="h-4 w-4 text-slate-400 mx-auto" />
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium whitespace-nowrap">Click to upload</p>
                                <p className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">Back side</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Trust Badge Status - Show for verified users */}
                  {!authLoading && isUserVerified && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Label className="text-sm font-medium text-green-700">
                          Trust Badge Verified
                        </Label>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-[11px] sm:text-xs text-green-700 whitespace-nowrap">
                          ✓ Trust badge verified - no ID upload needed
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress - Only show for non-verified users */}
                  {!authLoading && !isUserVerified && idUploadLoading && (
                    <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {uploadStage}
                        </span>
                        <span className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-pal-blue h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}


                  {/* Submit Button - Minimal */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={loading || idUploadLoading}
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        'Post Enquiry'
                      )}
                    </Button>
                    
                    {loading && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium text-slate-700">
                            {idUploadLoading ? 'Uploading ID...' : 'Submitting enquiry...'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-slate-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                </form>
              </CardContent>
            </Card>
          )}

          {/* Real-time Verification Status */}
          {submittedEnquiryId && (
            <Card className="mt-6 border-2 border-blue-200 bg-green-50/50 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {isPaymentSuccessful ? "🎉 Payment Successful!" : "🎉 Enquiry Submitted Successfully!"}
                  </h3>
                  <p className="text-sm text-green-700">
                    {isPaymentSuccessful 
                      ? "Your premium enquiry is now under review. Check the status below:"
                      : isUserVerified
                        ? "Your enquiry is automatically approved and live thanks to your trust badge!"
                        : "Your enquiry is being processed by AI. Check the status below:"
                    }
                  </p>
                </div>

                {/* Real-time Status Display */}
                <div className="bg-white border border-green-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      enquiryStatus === 'live' || enquiryStatus === 'approved' 
                        ? 'bg-green-500' 
                        : enquiryStatus === 'rejected'
                        ? 'bg-pal-blue'
                        : 'bg-yellow-500'
                    }`}>
                      {enquiryStatus === 'live' || enquiryStatus === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : enquiryStatus === 'rejected' ? (
                        <X className="h-5 w-5 text-white" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">
                        {enquiryStatus === 'live' || enquiryStatus === 'approved' 
                          ? '✅ Enquiry Approved!' 
                          : enquiryStatus === 'rejected'
                          ? '❌ Enquiry Rejected'
                          : '⏳ Processing...'
                        }
                      </h4>
                      <p className="text-sm text-slate-600">
                        {enquiryStatus === 'live' || enquiryStatus === 'approved' 
                          ? 'Your enquiry is now live and visible to sellers!'
                          : enquiryStatus === 'rejected'
                          ? 'Your enquiry was not approved. Please check the requirements and try again.'
                          : 'Our AI is reviewing your enquiry. This usually takes a few seconds...'
                        }
                      </p>
                    </div>
                  </div>
                  
                {/* Real-time status indicator */}
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="whitespace-nowrap">Real-time updates active</span>
                  </div>
                </div>
                
                {/* Debug: Manual status check button */}
                <div className="mt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (submittedEnquiryId) {
                        try {
                          const enquiryRef = doc(db, "enquiries", submittedEnquiryId);
                          const docSnap = await getDoc(enquiryRef);
                          if (docSnap.exists()) {
                            const data = docSnap.data();
                            console.log('Manual status check:', data.status);
                            setEnquiryStatus(data.status);
                            toast({
                              title: "Status Check",
                              description: `Current status: ${data.status}`,
                            });
                          }
                        } catch (error) {
                          console.error('Manual status check failed:', error);
                        }
                      }
                    }}
                    className="text-xs"
                  >
                    Check Status Manually
                  </Button>
                </div>
                </div>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmittedEnquiryId(null);
                      setEnquiryStatus('pending');
                      setIsEnquiryApproved(false);
                      setIsPaymentSuccessful(false);
                      // Reset form
                      setTitle("");
                      setDescription("");
                      setCategory("");
                      setBudget("");
                      setLocation("");
                      setDeadline(null);
                      setSelectedPlan(null);
                      setNotes("");
                      setIdFrontImage(null);
                      setIdBackImage(null);
                    }}
                    className="mr-3"
                  >
                    Submit Another
                  </Button>
                  <Button
                    onClick={() => navigate("/enquiries")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View Live Enquiries
                  </Button>
                </div>

                {/* Auto-navigate when approved */}
                {(enquiryStatus === 'live' || enquiryStatus === 'approved') && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-green-600">
                      Redirecting to live enquiries page in 3 seconds...
                    </p>
                  </div>
                )}
                
                {/* Auto-navigate when rejected */}
                {enquiryStatus === 'rejected' && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-red-600">
                      Redirecting to dashboard in 3 seconds...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upgrade Prompt */}
          {showUpgrade && (
            <UpgradePrompt
              type="enquiry"
              onUpgrade={() => {
                setShowUpgrade(false);
                // In real app, this would activate premium features
                alert('Premium features activated! You can now post unlimited enquiries.');
              }}
            />
          )}
        </div>
      </div>

        {/* Simplified Payment Modal */}
        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPaymentModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">💳 Test Payment</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-800">Amount: ₹{selectedPlan?.price || 0}</p>
                <p className="text-sm text-blue-600">
                  {selectedPlan?.name || 'Premium Enquiry'}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  🧪 Test Mode - Payment will always succeed
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <input 
                  type="text" 
                  placeholder="Card Number: 1234 5678 9012 3456"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-base"
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
                    }}
                    maxLength={5}
                    className="flex-1 p-2 border border-gray-300 rounded text-xs sm:text-base"
                  />
                  <input 
                    type="text" 
                    placeholder="CVV"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded text-xs sm:text-base"
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Cardholder Name"
                  value={paymentDetails.name}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-xs sm:text-base"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentStep('form');
                    setPaymentDetails({ cardNumber: '', expiryDate: '', cvv: '', name: '' });
                  }}
                  className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.name}
                  className="flex-1 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        )}

    </Layout>
  );
};
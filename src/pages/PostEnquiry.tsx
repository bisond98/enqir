import { useState, useEffect, useRef } from "react";
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
import { CalendarIcon, Shield, CheckCircle, ArrowLeft, Crown, Send, Upload, ChevronDown, X, Bot, Loader2, Camera } from "lucide-react";
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
import { uploadToCloudinary, uploadToCloudinaryUnsigned } from "@/integrations/cloudinary";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { realtimeAI } from "@/services/ai/realtimeAI";
import VerificationStatus from "@/components/VerificationStatus";
import { verifyIdNumberMatch } from '@/services/ai/idVerification';
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
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [idVerificationResult, setIdVerificationResult] = useState<{matches: boolean; error?: string; extractedNumber?: string} | null>(null);
  const [idErrors, setIdErrors] = useState<{[key: string]: string}>({});
  const idVerificationCardRef = useRef<HTMLDivElement>(null);
  const [idUploadLoading, setIdUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | null>(null);
  const [enquiryStatus, setEnquiryStatus] = useState<string>('pending');
  const [isEnquiryApproved, setIsEnquiryApproved] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  
  // Reference images (optional for buyers)
  const [referenceImageFiles, setReferenceImageFiles] = useState<(File | null)[]>(Array(5).fill(null));
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>(Array(5).fill(""));
  const [referenceUploadProgresses, setReferenceUploadProgresses] = useState<number[]>(Array(5).fill(0));
  
  // AI Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Camera state for ID upload
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraVideoRef, setCameraVideoRef] = useState<HTMLVideoElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

          // Add reference images if any exist
          const validReferenceImages1 = referenceImageUrls.filter(url => url.trim() !== "");
          if (validReferenceImages1.length > 0) {
            enquiryData.referenceImages = validReferenceImages1;
          }

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
          description: "Awesome! Your premium enquiry is now live and ready to get responses!",
          variant: "success",
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
    
    // Store timeout ID to clear it if payment completes/errors before timeout
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Process payment directly with Razorpay (no custom card form needed - Razorpay has its own)
      console.log('💳 Calling processPayment...');
      
      // Start payment process - Razorpay will open in a popup
      const paymentPromise = processPayment(
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
      
      // Stop showing loading once Razorpay popup opens (give it a moment to open)
      loadingTimeout = setTimeout(() => {
        setPaymentLoading(false);
        loadingTimeout = null;
      }, 1000); // 1 second should be enough for Razorpay to open
      
      // Wait for payment to complete
      const paymentResult = await paymentPromise;
      
      // Clear timeout since payment completed
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      console.log('📊 Payment result received:', paymentResult);
      
      // Check if payment actually succeeded
      if (!paymentResult.success) {
        console.error('❌ Payment failed:', paymentResult.error);
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
      console.log('✅ Razorpay payment completed successfully:', paymentResult.transactionId);
      
      // Create enquiry immediately after successful payment
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

        // Add reference images if any exist
        const validReferenceImages2 = referenceImageUrls.filter(url => url.trim() !== "");
        if (validReferenceImages2.length > 0) {
          enquiryData.referenceImages = validReferenceImages2;
        }

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
          description: "Awesome! Your premium enquiry is now live and ready to get responses!",
          variant: "success",
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
        setPaymentLoading(false);
      }
      
    } catch (error) {
      // Clear timeout if error occurs
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      console.error('❌ Payment failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        selectedPlan,
        userId: user?.uid
      });
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : '';
      const isCancelled = errorMsg.includes('cancel') || errorMsg.includes('user closed');
      
      toast({
        title: isCancelled 
          ? "Payment Cancelled 🚫" 
          : "Oops! Payment Didn't Go Through 💳",
        description: isCancelled
          ? "No worries! You cancelled it - your money stays safe. Come back when ready!"
          : "Something went wrong with the payment. Don't worry, your money is safe! Give it another shot?",
        variant: isCancelled ? "cancelled" : "destructive",
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

      // Add reference images if any exist
      const validReferenceImages3 = referenceImageUrls.filter(url => url.trim() !== "");
      if (validReferenceImages3.length > 0) {
        enquiryData.referenceImages = validReferenceImages3;
      }

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
          description: "Awesome! Your premium enquiry is being processed and will be live soon!",
          variant: "success",
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

  // Categories array - defined before return
  let categories = [
    // Professional & Business
    { value: "jobs", label: "Jobs & Employment", group: "Professional" },
    { value: "professional-services", label: "Professional Services", group: "Professional" },
    { value: "business", label: "Business", group: "Professional" },
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
    { value: "baby-kids", label: "Baby & Kids", group: "Products" },
    { value: "bags-luggage", label: "Bags & Luggage", group: "Products" },
    { value: "beauty-products", label: "Beauty", group: "Products" },
    { value: "bicycles", label: "Bicycles", group: "Products" },
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
    { value: "musical-instruments", label: "Musical Instruments", group: "Products" },
    { value: "tools-equipment", label: "Tools & Equipment", group: "Products" },
    { value: "appliances", label: "Appliances", group: "Products" },
    { value: "photography-cameras", label: "Photography & Cameras", group: "Products" },
    { value: "fitness-gym-equipment", label: "Fitness & Gym Equipment", group: "Products" },
    { value: "kitchen-dining", label: "Kitchen & Dining", group: "Products" },
    { value: "garden-outdoor", label: "Garden & Outdoor", group: "Products" },
    { value: "office-supplies", label: "Office Supplies", group: "Products" },
    { value: "medical-equipment", label: "Medical Equipment", group: "Products" },
    { value: "musical-accessories", label: "Musical Accessories", group: "Products" },
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
    { value: "repair-services", label: "Repair Services", group: "Lifestyle" },
    { value: "cleaning-services", label: "Cleaning Services", group: "Lifestyle" },
    { value: "musical-services", label: "Musical Services", group: "Lifestyle" },
    { value: "tutoring-lessons", label: "Tutoring & Lessons", group: "Lifestyle" },
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

  // Compress image for faster upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        console.warn('Canvas context not available, using original file');
        resolve(file);
        return;
      }
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 1920px width/height)
          const maxWidth = 1920;
          const maxHeight = 1920;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85 // Quality: 85%
          );
        } catch (error) {
          console.error('Error compressing image:', error);
          resolve(file); // Fallback to original file
        }
      };
      
      img.onerror = () => {
        console.warn('Image load error, using original file');
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Camera functions for ID upload
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: isMobile 
          ? { 
              facingMode: 'environment',
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            }
          : {
              facingMode: 'user',
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setShowCameraModal(true);
      
      setTimeout(() => {
        if (cameraVideoRef && stream) {
          cameraVideoRef.srcObject = stream;
          cameraVideoRef.play().catch(err => console.error('Video play error:', err));
        }
      }, 100);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = "Please allow camera access to take ID photos.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found. Please connect a camera device.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: "Camera Access Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (cameraVideoRef) {
      cameraVideoRef.srcObject = null;
    }
    setShowCameraModal(false);
    setCapturedImage(null);
    setIsUploadingPhoto(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef || !cameraStream) return;
    
    try {
      const canvas = document.createElement('canvas');
      const video = cameraVideoRef;
      
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
          }
        }, 'image/jpeg', 0.95);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const useCapturedPhoto = async () => {
    if (!capturedImage) return;
    
    setIsUploadingPhoto(true);
    
    try {
      // Convert blob URL to File (exactly like file upload)
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `id-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Upload to Cloudinary (same as file upload)
      const uploadedUrl = await uploadToCloudinaryUnsigned(file);
      
      // Set state exactly like file upload does
      setIdFrontImage(file);
      setIdFrontUrl(uploadedUrl);
      setIdErrors(prev => ({ ...prev, idFront: "" }));
      setIdVerificationResult(null);
      
      // Close camera modal after successful upload
      stopCamera();
      
      toast({
        title: "Photo Uploaded",
        description: "ID photo captured and uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading captured photo:', error);
      setIsUploadingPhoto(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload captured photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (cameraVideoRef) {
        cameraVideoRef.srcObject = null;
      }
    };
  }, [cameraStream]);

  // Handle reference image upload
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Image must be less than 5MB. Please choose a smaller image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Update the specific image file
    const newImageFiles = [...referenceImageFiles];
    newImageFiles[index] = file;
    setReferenceImageFiles(newImageFiles);
    
    // Upload to Cloudinary immediately
    const newProgresses = [...referenceUploadProgresses];
    newProgresses[index] = 25;
    setReferenceUploadProgresses(newProgresses);

    try {
      // Compress image for faster upload
      const compressedFile = await compressImage(file);
      newProgresses[index] = 50;
      setReferenceUploadProgresses(newProgresses);
      
      const uploadedUrl = await uploadToCloudinaryUnsigned(compressedFile);
      
      newProgresses[index] = 100;
      setReferenceUploadProgresses(newProgresses);
      
      const newImageUrls = [...referenceImageUrls];
      newImageUrls[index] = uploadedUrl;
      setReferenceImageUrls(newImageUrls);
      
      toast({
        title: "Image uploaded",
        description: "Reference image uploaded successfully",
      });
    } catch (uploadError: any) {
      // Reset progress on error
      newProgresses[index] = 0;
      setReferenceUploadProgresses(newProgresses);
      
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : 'Failed to upload image. Please try again.';
      
      toast({
        title: "Upload Failed 📤",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Remove the file from the input so user can try again
      const fileInput = document.getElementById(`reference-image-${index}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    const newImageFiles = [...referenceImageFiles];
    const newImageUrls = [...referenceImageUrls];
    const newProgresses = [...referenceUploadProgresses];
    
    newImageFiles[index] = null;
    newImageUrls[index] = "";
    newProgresses[index] = 0;
    
    setReferenceImageFiles(newImageFiles);
    setReferenceImageUrls(newImageUrls);
    setReferenceUploadProgresses(newProgresses);
    
    toast({
      title: "Image removed",
      description: "Reference image has been removed",
    });
  };

  // Real-time ID number validation
  const validateIdNumber = (value: string, type: string) => {
    if (!type) return;
    
    const cleanIdNumber = value.replace(/[\s-]/g, '').toUpperCase();
    
    if (!cleanIdNumber) {
      setIdErrors(prev => ({ ...prev, idNumber: "" }));
      return;
    }
    
    let error = "";
    
    if (type === 'aadhaar') {
      if (!/^\d+$/.test(cleanIdNumber)) {
        error = "Aadhaar number must contain only digits";
      } else if (cleanIdNumber.length !== 12) {
        error = `Aadhaar number must be exactly 12 digits (current: ${cleanIdNumber.length})`;
      }
    } else if (type === 'pan') {
      if (cleanIdNumber.length !== 10) {
        error = `PAN must be exactly 10 characters (current: ${cleanIdNumber.length})`;
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber)) {
        error = "PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)";
      }
    } else if (type === 'passport') {
      if (cleanIdNumber.length !== 8) {
        error = `Passport number must be exactly 8 characters (current: ${cleanIdNumber.length})`;
      } else if (!/^[A-Z]{1}[0-9]{7}$/.test(cleanIdNumber)) {
        error = "Passport format: 1 letter + 7 digits (e.g., A1234567)";
      }
    } else if (type === 'driving_license') {
      if (cleanIdNumber.length < 10 || cleanIdNumber.length > 15) {
        error = `Driving License must be 10-15 characters (current: ${cleanIdNumber.length})`;
      } else if (!/^[A-Z0-9]+$/.test(cleanIdNumber)) {
        error = "Driving License must contain only letters and numbers";
      }
    } else if (type === 'voter_id') {
      if (cleanIdNumber.length !== 10) {
        error = `Voter ID must be exactly 10 characters (current: ${cleanIdNumber.length})`;
      } else if (!/^[A-Z0-9]+$/.test(cleanIdNumber)) {
        error = "Voter ID must contain only letters and numbers";
      }
    }
    
    if (error) {
      setIdErrors(prev => ({ ...prev, idNumber: error }));
    } else {
      setIdErrors(prev => ({ ...prev, idNumber: "" }));
    }
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
    
    // Validate ID if provided
    if (!isUserVerified && (idFrontImage || idBackImage)) {
      const newErrors: {[key: string]: string} = {};
      if (!idType.trim()) {
        newErrors.idType = "Please select an ID type";
      }
      if (!idNumber.trim()) {
        newErrors.idNumber = "ID number is required when uploading ID";
      } else {
        const cleanIdNumber = idNumber.replace(/[\s-]/g, '').toUpperCase();
        if (idType === 'aadhaar') {
          if (!/^\d{12}$/.test(cleanIdNumber)) {
            newErrors.idNumber = "Aadhaar number must be exactly 12 digits";
          }
        } else if (idType === 'pan') {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber)) {
            newErrors.idNumber = "PAN must be 10 characters: 5 letters + 4 digits + 1 letter";
          }
        } else if (idType === 'passport') {
          if (!/^[A-Z]{1}[0-9]{7}$/.test(cleanIdNumber)) {
            newErrors.idNumber = "Passport number must be 8 characters: 1 letter + 7 digits";
          }
        } else if (idType === 'driving_license') {
          if (cleanIdNumber.length < 10 || cleanIdNumber.length > 15 || !/^[A-Z0-9]{10,15}$/.test(cleanIdNumber)) {
            newErrors.idNumber = "Driving License must be 10-15 alphanumeric characters";
          }
        } else if (idType === 'voter_id') {
          if (cleanIdNumber.length !== 10 || !/^[A-Z0-9]{10}$/.test(cleanIdNumber)) {
            newErrors.idNumber = "Voter ID must be exactly 10 alphanumeric characters";
          }
        }
      }
      if (Object.keys(newErrors).length > 0) {
        setIdErrors(newErrors);
        toast({
          title: "ID Validation Error",
          description: "Please fix the ID information errors before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      // ID verification is optional - users can post enquiry without it
      // If ID images are uploaded but verification failed, still allow submission (optional feature)
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
        setUploadStage('Uploading...');
        setUploadProgress(0);
        try {
          // Upload both images in parallel for faster processing
          const uploadPromises: Promise<string | null>[] = [];
          
          if (idFrontImage) {
            uploadPromises.push(uploadToCloudinary(idFrontImage));
          } else {
            uploadPromises.push(Promise.resolve(null));
          }
          
          if (idBackImage) {
            uploadPromises.push(uploadToCloudinary(idBackImage));
          } else {
            uploadPromises.push(Promise.resolve(null));
          }
          
          // Wait for both uploads to complete in parallel
          const [frontResult, backResult] = await Promise.all(uploadPromises);
          idFrontUrl = frontResult;
          idBackUrl = backResult;
          
          setUploadProgress(100);
          console.log('ID images uploaded to Cloudinary (parallel upload)');
          
          setUploadProgress(75);
          setUploadStage('Uploading...');
        } catch (uploadError: any) {
          console.error('Error uploading ID documents:', uploadError);
          const errorMessage = uploadError instanceof Error 
            ? uploadError.message 
            : `Failed to upload ID documents: ${uploadError}`;
          
          setUploadStage(`Upload failed: ${errorMessage}`);
          setIdUploadLoading(false);
          
          // Show user-friendly error toast
          toast({
            title: "Upload Failed 📤",
            description: errorMessage,
            variant: "destructive",
          });
          
          throw uploadError;
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
      setUploadStage('Uploading...');
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
      
      // Add reference images if any exist
      const validReferenceImages = referenceImageUrls.filter(url => url.trim() !== "");
      if (validReferenceImages.length > 0) {
        enquiryData.referenceImages = validReferenceImages;
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
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        
        // Check for specific Firebase errors
        if (errorMessage.includes('permission-denied')) {
          throw new Error('You don\'t have permission to create enquiries. Please check your account.');
        } else if (errorMessage.includes('network') || errorMessage.includes('unavailable')) {
          throw new Error('Network connection issue. Please check your internet and try again.');
        } else {
          throw new Error(`Failed to save enquiry: ${errorMessage}. Please try again.`);
        }
      }
    } catch (err: any) {
      console.error('Error submitting enquiry:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      
      // Use toast instead of alert for better UX
      toast({
        title: "Failed to Submit Enquiry",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
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

  // Scroll to ID verification card when verification is successful
  useEffect(() => {
    if (idVerificationResult?.matches && idVerificationCardRef.current) {
      // Small delay to ensure the card is rendered
      setTimeout(() => {
        idVerificationCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }, 100);
    }
  }, [idVerificationResult?.matches]);

  // Countdown timer for verification
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (verifyingId) {
      interval = setInterval(() => {
        setTotalElapsedSeconds((prev) => {
          const newTotal = prev + 1;
          
          // After 120 seconds total, stop incrementing
          if (newTotal >= 120) {
            return 120;
          }
          
          // If we've completed 60 seconds, restart countdown to 60
          if (newTotal === 60) {
            setVerificationCountdown(60);
          }
          
          // Update countdown based on which minute we're in
          if (newTotal < 60) {
            setVerificationCountdown(60 - newTotal);
          } else {
            setVerificationCountdown(120 - newTotal);
          }
          
          return newTotal;
        });
      }, 1000);
    } else {
      // Reset when verification stops
      setVerificationCountdown(60);
      setTotalElapsedSeconds(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [verifyingId]);

  if (isSubmitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Header Section - Gray Background */}
            <div className="mb-4 sm:mb-6">
              <div className="bg-black rounded-lg p-4 sm:p-6">
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
            <Card className="border-2 border-blue-200 shadow-sm rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 lg:min-h-[150px]">
              {/* AI Processing Status - Card Header */}
              <div className="bg-black px-3 sm:px-4 py-3 sm:py-4 lg:px-4 lg:py-3">
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
              <CardContent className="p-4 sm:p-6 lg:p-5 lg:pt-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-6 sm:py-8 lg:py-10">
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Matching Dashboard Style */}
          <div className="mb-6 sm:mb-12 lg:mb-16 -mt-2 sm:-mt-4">
            <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-8 lg:p-10 overflow-hidden">
              {/* Back Button */}
              <div className="mb-1 sm:mb-2 relative z-50 -mt-2 sm:-mt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => window.history.back()}
                  className="p-2 sm:p-2 hover:bg-slate-100 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
              
              {/* Content Card - White Background */}
              <div className="bg-white border border-black rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                    <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Post Enquiry
                    </h2>
                  </div>
                  <p className="text-[10px] sm:text-base lg:text-sm xl:text-base text-slate-600 text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    From hobbies to necessities, from needs to requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message - Enhanced Professional Design */}
          {isSubmitted && (
            <Card className="border-2 border-green-200 shadow-lg mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-50 to-white overflow-hidden lg:min-h-[200px]">
              <CardContent className="p-6 sm:p-8 lg:p-6 lg:pt-5 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2 sm:mb-3">
                  Enquiry Posted Successfully! 🎉
                </h3>
                <p className="text-sm sm:text-base text-green-700 mb-6 sm:mb-7 max-w-md mx-auto">
                  Sent for verification - You'll get notified
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                      View Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                    className="border-2 border-green-300 text-green-700 hover:bg-green-50 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Post Another Enquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Form - Professional Enhanced Design */}
          {!isSubmitted && (
            <Card className="border-4 border-black shadow-xl rounded-2xl sm:rounded-3xl bg-white overflow-hidden lg:min-h-[300px]">
              <CardContent className="p-5 sm:p-6 lg:p-6 lg:pt-5">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7 lg:space-y-6">
                  {/* Title - Enhanced Professional Input */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <Label htmlFor="title" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-blue-600">*</span>
                      {category === "jobs" ? "Job Title" : "From a 4 a.m. tea spot to a piece of the moon."}
                    </Label>
                    <Input
                      id="title"
                      placeholder={category === "jobs" ? "e.g., Senior Web Developer" : "e.g., Vintage Toyota Car"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                          className="h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-2 focus:ring-black rounded-xl transition-all duration-200 min-touch pl-4 pr-4 bg-white hover:border-black"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  {/* Multiple Categories - Enhanced Professional Design */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-2.5">
                      <Label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600">*</span>
                        Choose Categories
                      </Label>
                    </div>
                    
                    {/* Multiple Category Selection - Enhanced Mobile-Friendly Sheet */}
                    <div className="space-y-2.5">
                      {/* Mobile: Use Sheet (bottom drawer), Desktop: Use Popover */}
                      <div className="block sm:hidden">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between min-h-[52px] h-auto py-3.5 px-4 border rounded-xl transition-all duration-200 text-base font-medium ${
                                selectedCategories.length === 0 
                                  ? 'border-black bg-blue-50/50 hover:bg-blue-50 hover:border-black focus:border-black focus:ring-2 focus:ring-black' 
                                  : 'border-black bg-white hover:border-black focus:border-black focus:ring-2 focus:ring-black'
                              }`}
                            >
                              <div className="flex flex-wrap gap-1.5 flex-1 text-left items-center min-w-0">
                                {selectedCategories.length === 0 ? (
                                  <span className="text-xs text-slate-500">Select categories...</span>
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
                          <SheetContent side="bottom" className="h-[85vh] max-h-[700px] p-0 flex flex-col border-2 border-black">
                            <SheetHeader className="px-4 pt-4 pb-3 flex-shrink-0">
                              <SheetTitle className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black text-left w-full">Categories</SheetTitle>
                              <p className="text-xs text-slate-500 text-left mt-1 sm:ml-0 ml-[0.15em]">upto 3.</p>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                              <div className="px-2 py-2 pb-20">
                                {categories.map((cat) => {
                                  const isSelected = selectedCategories.includes(cat.value);
                                  const isDisabled = !isSelected && selectedCategories.length >= 3;
                                  
                                  return (
                                    <div 
                                      key={cat.value} 
                                      className={`flex items-center space-x-3 p-4 min-h-[56px] active:bg-slate-100 rounded-lg transition-colors border-2 border-gray-400 mb-2 last:mb-0 ${
                                        isDisabled ? 'opacity-50' : ''
                                      }`}
                                      onClick={() => !isDisabled && handleCategoryToggle(cat.value)}
                                    >
                                      <div 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (!isDisabled) {
                                            handleCategoryToggle(cat.value);
                                          }
                                        }}
                                        onTouchStart={(e) => {
                                          e.stopPropagation();
                                          if (!isDisabled) {
                                            handleCategoryToggle(cat.value);
                                          }
                                        }}
                                        className="cursor-pointer touch-manipulation flex items-center justify-center min-w-[24px] min-h-[24px] -ml-1"
                                        style={{ pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
                                      >
                                        <Checkbox
                                          id={`mobile-${cat.value}`}
                                          checked={isSelected}
                                          disabled={isDisabled}
                                          onCheckedChange={() => handleCategoryToggle(cat.value)}
                                          className="h-3 w-3 border-2 border-black rounded-sm data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black transition-all duration-200 [&>span>svg]:h-2.5 [&>span>svg]:w-2.5 pointer-events-none"
                                        />
                                      </div>
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
                            </div>
                            {selectedCategories.length >= 3 && (
                              <div className="px-4 py-3 bg-black border-t border-black flex-shrink-0">
                                <p className="text-xs text-white font-semibold text-center">
                                  Nothing can be more categorised.
                                </p>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      </div>
                      
                      {/* Desktop: Use Popover - Enhanced */}
                      <div className="hidden sm:block">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between min-h-[48px] h-auto py-2.5 px-4 border rounded-xl transition-all duration-200 font-medium ${
                                selectedCategories.length === 0 
                                  ? 'border-black bg-blue-50/50 hover:bg-blue-50 hover:border-black focus:border-black focus:ring-2 focus:ring-black' 
                                  : 'border-black bg-white hover:border-black focus:border-black focus:ring-2 focus:ring-black'
                              }`}
                            >
                              <div className="flex flex-wrap gap-1.5 flex-1 text-left items-center min-w-0">
                                {selectedCategories.length === 0 ? (
                                  <span className="text-xs text-slate-500">Select categories...</span>
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
                          <PopoverContent 
                            className="w-[var(--radix-popover-trigger-width)] max-w-[100vw] p-0 sm:max-w-sm" 
                            align="start"
                            side="bottom"
                            sideOffset={4}
                            alignOffset={0}
                            avoidCollisions={true}
                            collisionPadding={8}
                          >
                            <div className="max-h-[calc(100vh-120px)] sm:max-h-60 overflow-y-auto overscroll-contain pb-4">
                              {categories.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.value);
                                const isDisabled = !isSelected && selectedCategories.length >= 3;
                                
                                return (
                                  <div 
                                    key={cat.value} 
                                    className={`flex items-center space-x-2 p-3 sm:p-3 hover:bg-slate-50 min-h-[44px] touch-manipulation border-2 border-gray-400 mb-2 last:mb-0 ${
                                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!isDisabled) {
                                          handleCategoryToggle(cat.value);
                                        }
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation();
                                        if (!isDisabled) {
                                          handleCategoryToggle(cat.value);
                                        }
                                      }}
                                      className="cursor-pointer touch-manipulation flex items-center justify-center min-w-[24px] min-h-[24px] -ml-1"
                                      style={{ pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
                                    >
                                      <Checkbox
                                        id={cat.value}
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onCheckedChange={() => handleCategoryToggle(cat.value)}
                                        className="h-3 w-3 border-2 border-black rounded-sm data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black transition-all duration-200 [&>span>svg]:h-2.5 [&>span>svg]:w-2.5 pointer-events-none"
                                      />
                                    </div>
                                    <Label
                                      htmlFor={cat.value}
                                      className={`text-sm sm:text-sm flex-1 cursor-pointer ${
                                        isDisabled ? 'cursor-not-allowed text-slate-400' : 'text-slate-700'
                                      }`}
                                    >
                                      {cat.label}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                            {selectedCategories.length >= 3 && (
                              <div className="p-3 bg-black border-t border-black">
                                <p className="text-xs text-white font-semibold whitespace-nowrap">
                                  Nothing can be more categorised.
                                </p>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {selectedCategories.length === 0 && (
                        <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                          Select at least one category
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description - Enhanced Professional Textarea */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-blue-600">*</span>
                      {selectedCategories.includes("jobs") ? "Job Description" : "explain"}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={selectedCategories.includes("jobs") ? "Job responsibilities, requirements, experience needed..." : "Specifications, requirements, timeline..."}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="border border-black focus:border-black focus:ring-2 focus:ring-black resize-none text-base min-h-[140px] sm:min-h-[150px] rounded-xl transition-all duration-200 min-touch pl-4 pr-4 py-3 bg-white hover:border-black"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  {/* Reference Images (Optional) - Professional Design */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-slate-500" />
                      Reference Images (Optional)
                    </Label>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                      What if they end up misunderstanding you?
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="relative">
                          <label
                            htmlFor={`reference-image-${index}`}
                            className={`flex flex-col items-center justify-center w-full h-28 sm:h-32 lg:h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                              referenceImageUrls[index]
                                ? 'border-green-300 bg-green-50 hover:border-green-400'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                            } ${loading || idUploadLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              id={`reference-image-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleReferenceImageUpload(e, index)}
                              disabled={loading || idUploadLoading}
                            />
                            
                            {referenceImageUrls[index] ? (
                              <div className="relative w-full h-full rounded-lg overflow-hidden group">
                                <img
                                  src={referenceImageUrls[index]}
                                  alt={`Reference ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeReferenceImage(index);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                                  disabled={loading || idUploadLoading}
                                >
                                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                                {referenceUploadProgresses[index] > 0 && referenceUploadProgresses[index] < 100 && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] sm:text-xs p-1 text-center">
                                    {referenceUploadProgresses[index]}%
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-3 sm:p-4">
                                {referenceUploadProgresses[index] > 0 && referenceUploadProgresses[index] < 100 ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mb-2"></div>
                                    <p className="text-[10px] sm:text-xs text-slate-600">Uploading...</p>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 mb-1.5 sm:mb-2" />
                                    <p className="text-[10px] sm:text-xs text-slate-700 font-semibold text-center">Add Image</p>
                                  </>
                                )}
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget & Location - Enhanced Side by Side Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                    <div className="space-y-2.5 sm:space-y-3">
                      <Label htmlFor="budget" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600">*</span>
                        {selectedCategories.includes("jobs") ? "Salary (₹)" : "Budget (₹)"}
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
                        className="h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-2 focus:ring-black rounded-xl transition-all duration-200 min-touch pl-4 pr-4 bg-white hover:border-black"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                      <Label htmlFor="location" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600">*</span>
                        Location
                      </Label>
                      <div className="relative">
                        <Input
                          id="location"
                          placeholder="Anywhere"
                          value={location}
                          onChange={handleLocationChange}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                          className="h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-2 focus:ring-black rounded-xl transition-all duration-200 min-touch pl-4 pr-4 bg-white hover:border-black"
                          style={{ fontSize: '16px' }}
                          required
                        />
                        
                        {/* AI Location Suggestions Dropdown - Enhanced */}
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectLocation(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm sm:text-base font-medium transition-colors duration-150 border-b border-slate-100 last:border-b-0"
                              >
                                <span className="text-slate-800">{suggestion}</span>
                                {(suggestion === "Anywhere" || suggestion === "Everywhere") && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
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

                  {/* Time Limit & Notes - Enhanced Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                    <div className="space-y-2.5 sm:space-y-3">
                      <TimeLimitSelector
                        value={deadline}
                        onChange={setDeadline}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                      <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-slate-800">
                        Notes <span className="text-slate-500 font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional requirements or preferences..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="border border-black focus:border-black focus:ring-2 focus:ring-black resize-none text-base rounded-xl transition-all duration-200 min-touch pl-4 pr-4 py-3 bg-white hover:border-black"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Payment Plan Selection - Enhanced Professional Design */}
                  <div className="space-y-4 sm:space-y-5">
                    {/* PRO PLAN ACTIVE BADGE - KEPT FOR FUTURE UPDATES */}
                    {/* {hasProRemaining ? (
                      <div className="p-3 sm:p-4 bg-black border-2 border-gray-700 rounded-xl shadow-sm">
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
                    <div className="space-y-3">
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
                  </div>

                  {/* Government ID - Enhanced Professional Design for Non-Verified Users */}
                  {!authLoading && !isUserVerified && (
                  <div ref={idVerificationCardRef} className="relative space-y-4 sm:space-y-5 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-black rounded-xl">
                    {/* Loading Animation - Distorted Blue Tick Forming (Same as Profile Page) */}
                    {verifyingId && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl z-50 p-6 sm:p-8 overflow-hidden">
                        {/* Moving Tick - All Over Card */}
                        <div 
                          className="absolute w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56"
                          style={{
                            animation: 'tickMoveAround 8s ease-in-out infinite',
                            WebkitAnimation: 'tickMoveAround 8s ease-in-out infinite',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                        >
                          {/* Bright Bold Distorted Tick */}
                          <svg 
                            className="w-full h-full text-blue-400 drop-shadow-2xl"
                            viewBox="0 0 100 100"
                            style={{
                              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))',
                              animation: 'tickForming 2s ease-in-out infinite',
                              WebkitAnimation: 'tickForming 2s ease-in-out infinite'
                            }}
                          >
                            {/* Bold Distorted Tick */}
                            <path
                              d="M 20 50 L 40 70 L 80 30"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="100"
                              style={{
                                strokeDashoffset: '100',
                                animation: 'tickDraw 2s ease-in-out infinite',
                                WebkitAnimation: 'tickDraw 2s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 8px currentColor)'
                              }}
                            />
                            {/* Bold Pulsing Circles */}
                            <circle
                              cx="20"
                              cy="50"
                              r="5"
                              fill="currentColor"
                              style={{
                                animation: 'pulse 1.5s ease-in-out infinite',
                                WebkitAnimation: 'pulse 1.5s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 6px currentColor)'
                              }}
                            />
                            <circle
                              cx="40"
                              cy="70"
                              r="5"
                              fill="currentColor"
                              style={{
                                animation: 'pulse 1.5s ease-in-out infinite 0.3s',
                                WebkitAnimation: 'pulse 1.5s ease-in-out infinite 0.3s',
                                filter: 'drop-shadow(0 0 6px currentColor)'
                              }}
                            />
                            <circle
                              cx="80"
                              cy="30"
                              r="5"
                              fill="currentColor"
                              style={{
                                animation: 'pulse 1.5s ease-in-out infinite 0.6s',
                                WebkitAnimation: 'pulse 1.5s ease-in-out infinite 0.6s',
                                filter: 'drop-shadow(0 0 6px currentColor)'
                              }}
                            />
                          </svg>
                          
                          {/* Bright Glowing Background */}
                          <div 
                            className="absolute inset-0 rounded-full bg-blue-300 opacity-50 blur-xl"
                            style={{
                              animation: 'pulseGlow 2s ease-in-out infinite',
                              WebkitAnimation: 'pulseGlow 2s ease-in-out infinite',
                              transform: 'scale(1.3)',
                              WebkitTransform: 'scale(1.3)'
                            }}
                          ></div>
                        </div>
                        
                        {/* Countdown Text - Fixed Position */}
                        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg">
                            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                            <span className="text-sm sm:text-base font-bold tabular-nums">
                              {verificationCountdown}s
                            </span>
                          </div>
                          <p className="mt-3 text-xs sm:text-sm text-gray-600 font-medium">
                            Verifying your ID...
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <h3 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black text-left break-words">
                          <span className="block">Trust</span>
                          <span className="block">Badge</span>
                        </h3>
                        <span className="text-xs sm:text-sm text-black font-bold flex-shrink-0">(optional)</span>
                      </div>
                      <p className="text-xs sm:text-xs text-slate-500 text-left mt-1">
                        <span className="text-[9px] sm:text-xs text-blue-600 font-medium">Blue Badge For This Enquiry.</span>
                      </p>
                    </div>
                    {idVerificationResult?.matches ? (
                      <div className="p-6 sm:p-8 bg-white rounded-lg flex flex-col items-center justify-center text-center overflow-visible">
                        <div 
                          className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center mb-4 sm:mb-5 shadow-lg relative"
                          style={{
                            animation: 'circleReconstruct 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, pulseGlow 2.5s ease-in-out infinite 1.5s, float 3s ease-in-out infinite 2.5s',
                            WebkitAnimation: 'circleReconstruct 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, pulseGlow 2.5s ease-in-out infinite 1.5s, float 3s ease-in-out infinite 2.5s',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)',
                            willChange: 'transform, box-shadow, border-radius'
                          }}
                        >
                          {/* Particle effects - deconstructed pieces assembling */}
                          {[...Array(6)].map((_, i) => {
                            const angle = (i * 60) * Math.PI / 180;
                            const distance = 45;
                            return (
                              <div
                                key={i}
                                className="absolute w-3 h-3 bg-blue-400 rounded-full"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                                  WebkitTransform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                                  animation: `particleAssemble 1.2s ease-out ${i * 0.1}s forwards`,
                                  WebkitAnimation: `particleAssemble 1.2s ease-out ${i * 0.1}s forwards`,
                                  transformOrigin: 'center',
                                  WebkitTransformOrigin: 'center',
                                  willChange: 'transform, opacity'
                                }}
                              />
                            );
                          })}
                          <CheckCircle 
                            className="h-16 w-16 sm:h-20 sm:w-20 text-white relative z-10 drop-shadow-lg"
                            style={{
                              animation: 'checkmarkReconstruct 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both',
                              WebkitAnimation: 'checkmarkReconstruct 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both',
                              transform: 'translateZ(0)',
                              WebkitTransform: 'translateZ(0)',
                              willChange: 'transform, opacity'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* ID Type and Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2.5">
                        <Label htmlFor="idType" className="text-xs sm:text-sm font-semibold text-slate-700">
                          ID Document Type
                        </Label>
                        <Select value={idType} onValueChange={(value) => {
                          setIdType(value);
                          if (idNumber && value) {
                            validateIdNumber(idNumber, value);
                          } else {
                            setIdErrors(prev => ({ ...prev, idNumber: "" }));
                          }
                          setIdVerificationResult(null);
                        }} disabled={verifyingId}>
                          <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black" disabled={verifyingId}>
                            <SelectValue placeholder="Select ID Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="driving_license">Driving License</SelectItem>
                            <SelectItem value="voter_id">Voter ID Card</SelectItem>
                          </SelectContent>
                        </Select>
                        {idErrors.idType && (
                          <span className="text-xs text-red-500 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            {idErrors.idType}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2.5">
                        <Label htmlFor="idNumber" className="text-xs sm:text-sm font-semibold text-slate-700">
                          ID Number
                        </Label>
                        <Input
                          id="idNumber"
                          placeholder={idType === 'aadhaar' ? "Enter 12 digits (e.g., 1234 5678 9012)" : "Enter ID number"}
                          value={idNumber}
                          onChange={(e) => {
                            let value = e.target.value.toUpperCase();
                            
                            // Auto-format Aadhaar: add space after every 4 digits
                            if (idType === 'aadhaar') {
                              // Remove all spaces first
                              const digitsOnly = value.replace(/\s/g, '');
                              // Add space after every 4 digits
                              value = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
                            }
                            
                            setIdNumber(value);
                            if (idType) {
                              validateIdNumber(value, idType);
                            }
                            setIdVerificationResult(null);
                          }}
                          className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black"
                          disabled={verifyingId}
                        />
                        {idErrors.idNumber && !idVerificationResult && (
                          <span className="text-xs text-red-500 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            {idErrors.idNumber}
                          </span>
                        )}
                        {/* ID Verification Status */}
                        {verifyingId && (
                          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mt-2 p-4 sm:p-6 bg-black rounded-lg w-full">
                            {totalElapsedSeconds >= 120 ? (
                              <span className="text-base sm:text-lg font-bold text-white text-center">Refresh</span>
                            ) : (
                              <>
                                <span className="text-xs sm:text-sm font-medium text-white">Verifying</span>
                                <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-none">
                                  <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                                    {Math.floor(verificationCountdown / 60)}:{(verificationCountdown % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {idVerificationResult && !verifyingId && (
                          <div className={`flex items-start gap-1.5 sm:gap-2 mt-1 ${
                            idVerificationResult.matches ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {idVerificationResult.matches ? (
                              <>
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                                <span className="break-words text-[10px] sm:text-sm">✓ ID number verified successfully</span>
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                                <span className="break-words leading-relaxed text-[10px] sm:text-sm">{idVerificationResult.error}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* ID Upload - Only show when not verified */}
                    <div className="space-y-2.5">
                      <Label htmlFor="idFront" className="text-xs sm:text-sm font-semibold text-slate-700">
                        ID Document
                      </Label>
                      
                      {/* Upload Button - Shows native mobile options (Choose image, Take photo, etc.) */}
                      {!(idFrontImage || idFrontUrl) && (
                        <div className="mb-3 sm:mb-2">
                          <input
                            type="file"
                            id="idFront"
                            accept="image/*"
                            disabled={verifyingId}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIdFrontImage(file);
                              setIdErrors(prev => ({ ...prev, idFront: "" }));
                              setIdVerificationResult(null);
                              
                              try {
                                const uploadedUrl = await uploadToCloudinaryUnsigned(file);
                                setIdFrontUrl(uploadedUrl);
                              } catch (error) {
                                console.error('Error uploading ID:', error);
                                toast({
                                  title: "Upload Failed",
                                  description: "Failed to upload image. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="hidden"
                          />
                          
                          {/* Upload Button - Full Width */}
                          <label
                            htmlFor="idFront"
                            className={`w-full h-14 border-2 border-dashed rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer touch-manipulation shadow-sm ${
                              verifyingId
                                ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                                : 'border-black bg-white hover:border-black hover:bg-blue-50/30 active:bg-blue-100 active:scale-[0.98]'
                            }`}
                            onClick={(e) => {
                              if (verifyingId) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Upload className="h-5 w-5 text-slate-600" />
                              <span className="text-sm text-slate-700 font-semibold">Upload</span>
                            </div>
                          </label>
                        </div>
                      )}
                      
                      {/* Image Upload Status - Text Only */}
                      {(idFrontImage || idFrontUrl) && (
                        <div className="w-full border-2 rounded-xl p-4 sm:p-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#003300', borderColor: '#002200' }}>
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                            <span className="text-sm sm:text-base font-semibold text-white">Image uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIdFrontImage(null);
                              setIdFrontUrl("");
                              setIdVerificationResult(null);
                            }}
                            className="rounded-lg p-1.5 sm:p-2 hover:opacity-90 active:opacity-80 transition-colors touch-manipulation shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            style={{ backgroundColor: '#800020', color: 'white', borderColor: '#6b0019' }}
                            disabled={verifyingId}
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Verify Button - Show when image is uploaded but not yet verified */}
                    {(idFrontImage || idFrontUrl) && idType && idNumber && (!idVerificationResult || !idVerificationResult.matches) && (
                      <div className="mt-4 sm:mt-5">
                        <Button
                          type="button"
                          onClick={async () => {
                            // Check if required fields are filled
                            if (!idType) {
                              toast({
                                title: "ID Type Required",
                                description: "Please select an ID document type.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!idNumber || idNumber.trim() === '') {
                              toast({
                                title: "ID Number Required",
                                description: "Please enter your ID number.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate format first
                            const newErrors: {[key: string]: string} = {};
                            const cleanIdNumber = idNumber.replace(/[\s-]/g, '').toUpperCase();
                            
                            if (idType === 'aadhaar') {
                              if (!/^\d{12}$/.test(cleanIdNumber)) {
                                newErrors.idNumber = "Aadhaar number must be exactly 12 digits";
                              }
                            } else if (idType === 'pan') {
                              if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber)) {
                                newErrors.idNumber = "PAN must be 10 characters: 5 letters + 4 digits + 1 letter";
                              }
                            } else if (idType === 'passport') {
                              if (!/^[A-Z]{1}[0-9]{7}$/.test(cleanIdNumber)) {
                                newErrors.idNumber = "Passport number must be 8 characters: 1 letter + 7 digits";
                              }
                            } else if (idType === 'driving_license') {
                              if (cleanIdNumber.length < 10 || cleanIdNumber.length > 15 || !/^[A-Z0-9]{10,15}$/.test(cleanIdNumber)) {
                                newErrors.idNumber = "Driving License must be 10-15 alphanumeric characters";
                              }
                            } else if (idType === 'voter_id') {
                              if (cleanIdNumber.length !== 10 || !/^[A-Z0-9]{10}$/.test(cleanIdNumber)) {
                                newErrors.idNumber = "Voter ID must be exactly 10 alphanumeric characters";
                              }
                            }
                            
                            if (Object.keys(newErrors).length > 0) {
                              setIdErrors(newErrors);
                              toast({
                                title: "ID Validation Error",
                                description: "Please fix the ID information errors before verifying.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Set verifying state and clear errors
                            setVerifyingId(true);
                            setVerificationCountdown(60); // Reset countdown to 60 seconds
                            setIdErrors(prev => ({ ...prev, idNumber: "" }));
                            
                            try {
                              // Upload image if not already uploaded
                              let frontImageUrl: string | null = null;
                              
                              if (idFrontImage && !idFrontUrl) {
                                frontImageUrl = await uploadToCloudinaryUnsigned(idFrontImage);
                                setIdFrontUrl(frontImageUrl);
                              } else {
                                frontImageUrl = idFrontUrl || null;
                              }
                              
                              // Ensure we have an image URL
                              if (!frontImageUrl) {
                                toast({
                                  title: "Upload Error",
                                  description: "Failed to upload ID image. Please try again.",
                                  variant: "destructive",
                                });
                                setVerifyingId(false);
                                return;
                              }
                              
                              const verification = await verifyIdNumberMatch(
                                frontImageUrl,
                                idNumber,
                                idType
                              );
                              
                              setIdVerificationResult(verification);
                              
                              if (!verification.matches) {
                                setIdErrors(prev => ({ 
                                  ...prev, 
                                  idNumber: verification.error || 'ID number does not match the image(s)' 
                                }));
                                toast({
                                  title: "ID Verification Failed",
                                  description: verification.error || "ID number does not match the uploaded image(s). Please ensure the number you entered matches the number visible in the image.",
                                  variant: "destructive",
                                });
                              } else {
                                setIdErrors(prev => ({ ...prev, idNumber: "" }));
                                toast({
                                  title: "Verification Successful",
                                  description: "Your ID has been verified! You can now post your enquiry.",
                                });
                              }
                            } catch (error) {
                              console.error('Error verifying ID:', error);
                              toast({
                                title: "Verification Error",
                                description: "Failed to verify ID number. Please ensure the image is clear and the ID number is visible.",
                                variant: "destructive",
                              });
                            } finally {
                              // Always clear verifying state, even if there's an error or early return
                              setVerifyingId(false);
                            }
                          }}
                          disabled={!idType || !idNumber || (!idFrontImage && !idFrontUrl) || verifyingId}
                          className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyingId ? (
                            <>
                              <div 
                                className="h-4 w-4 sm:h-5 sm:w-5 mr-2 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                                style={{
                                  animation: 'spin 1s linear infinite',
                                  WebkitAnimation: 'spin 1s linear infinite'
                                }}
                              ></div>
                              Verifying ID...
                            </>
                          ) : idVerificationResult?.matches ? (
                            <>
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              ID Verified ✓
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Get Trust Badge
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                  )}

                  {/* Trust Badge Status - Enhanced for Verified Users */}
                  {!authLoading && isUserVerified && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100/30 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-700" />
                        </div>
                        <Label className="text-sm sm:text-base font-semibold text-green-800">
                          Trust Badge Verified
                        </Label>
                      </div>
                      <div className="p-3 sm:p-4 bg-white border-2 border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <span>Trust badge verified - no ID upload needed</span>
                        </p>
                      </div>
                    </div>
                  )}



                  {/* Submit Button - Enhanced Professional Design */}
                  <div className="pt-6 sm:pt-8 border-t-2 border-slate-100">
                    <Button
                      type="submit"
                      disabled={
                        loading || 
                        idUploadLoading || 
                        paymentLoading
                        // ID verification is optional - not required for submission
                      }
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] border-2 border-black"
                    >
                      {paymentLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Opening Razorpay...</span>
                        </span>
                      ) : loading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting enquiry...</span>
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Send className="h-5 w-5" />
                          Post Enquiry
                        </span>
                      )}
                    </Button>
                    
                    {loading && (
                      <div className="mt-5 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-xl">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" style={{ animation: 'spin 1s linear infinite', WebkitAnimation: 'spin 1s linear infinite' }}></div>
                          <span className="text-sm sm:text-base font-semibold text-black">
                            Submitting enquiry...
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 sm:h-3 shadow-inner">
                          <div 
                            className="bg-black h-2.5 sm:h-3 rounded-full transition-all duration-300 shadow-sm"
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

          {/* Real-time Verification Status - Enhanced Professional Design */}
          {submittedEnquiryId && (
            <Card className="mt-6 sm:mt-8 border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden lg:min-h-[200px]">
              <CardContent className="p-6 sm:p-8 lg:p-6 lg:pt-5">
                <div className="text-center mb-5 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl sm:text-3xl">🎉</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-3">
                    {isPaymentSuccessful ? "Payment Successful!" : "Enquiry Submitted Successfully!"}
                  </h3>
                  <p className="text-sm sm:text-base text-green-700 max-w-2xl mx-auto leading-relaxed">
                    {isPaymentSuccessful 
                      ? "Your premium enquiry is now under review. Check the status below:"
                      : isUserVerified
                        ? "Your enquiry is automatically approved and live thanks to your trust badge!"
                        : "Your enquiry is being processed by AI. Check the status below:"
                    }
                  </p>
                </div>

                {/* Real-time Status Display - Enhanced */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-5 sm:p-6 mb-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                      enquiryStatus === 'live' || enquiryStatus === 'approved' 
                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                        : enquiryStatus === 'rejected'
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    }`}>
                      {enquiryStatus === 'live' || enquiryStatus === 'approved' ? (
                        <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      ) : enquiryStatus === 'rejected' ? (
                        <X className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base sm:text-lg text-slate-800 mb-1.5">
                        {enquiryStatus === 'live' || enquiryStatus === 'approved' 
                          ? '✅ Enquiry Approved!' 
                          : enquiryStatus === 'rejected'
                          ? '❌ Enquiry Rejected'
                          : '⏳ Processing...'
                        }
                      </h4>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {enquiryStatus === 'live' || enquiryStatus === 'approved' 
                          ? 'Your enquiry is now live and visible to sellers!'
                          : enquiryStatus === 'rejected'
                          ? 'Your enquiry was not approved. Please check the requirements and try again.'
                          : 'Our AI is reviewing your enquiry. This usually takes a few seconds...'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Real-time status indicator - Enhanced */}
                  <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-center">
                    <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                      <span>Real-time updates active</span>
                    </div>
                  </div>
                </div>
                
                {/* Debug: Manual status check button - Enhanced */}
                <div className="mt-4 text-center">
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
                    className="text-xs sm:text-sm border-2 border-slate-300 hover:border-slate-400 rounded-lg px-4 py-2"
                  >
                    Check Status Manually
                  </Button>
                </div>
                
                <div className="mt-6 sm:mt-8 text-center flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
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
                      // Clear reference images
                      setReferenceImageFiles(Array(5).fill(null));
                      setReferenceImageUrls(Array(5).fill(""));
                      setReferenceUploadProgresses(Array(5).fill(0));
                    }}
                    className="border-2 border-green-300 text-green-700 hover:bg-green-50 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Submit Another
                  </Button>
                  <Button
                    onClick={() => navigate("/enquiries")}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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

      {/* Camera Modal - Mobile Optimized */}
      {showCameraModal && (
        <div 
          className={`fixed inset-0 bg-black ${isMobile ? 'bg-opacity-100' : 'bg-opacity-90'} z-50 flex items-center justify-center ${isMobile ? 'p-0' : 'p-2 sm:p-4'}`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUploadingPhoto && !isMobile) {
              stopCamera();
            }
          }}
        >
          <div className={`${isMobile ? 'w-full h-full rounded-none' : 'bg-white rounded-xl max-w-2xl w-full max-h-[90vh]'} overflow-hidden flex flex-col`}>
            {/* Header - Mobile Optimized */}
            <div className={`flex items-center justify-between ${isMobile ? 'p-4 bg-black/80 backdrop-blur-sm' : 'p-3 sm:p-4 border-b bg-white'}`}>
              <h3 className={`${isMobile ? 'text-lg text-white' : 'text-base sm:text-lg font-bold text-black'}`}>
                {isMobile ? '📷 Take ID Photo' : 'Take ID Photo'}
              </h3>
              <button
                onClick={stopCamera}
                disabled={isUploadingPhoto}
                className={`${isMobile ? 'p-3 bg-white/20 hover:bg-white/30 active:bg-white/40' : 'p-2 hover:bg-gray-100 active:bg-gray-200'} rounded-full transition-colors touch-manipulation disabled:opacity-50`}
                aria-label="Close camera"
              >
                <X className={`h-6 w-6 ${isMobile ? 'text-white' : 'text-gray-600'}`} />
              </button>
            </div>
            
            {/* Camera Preview - Mobile Optimized */}
            <div className={`relative flex-1 bg-black flex items-center justify-center ${isMobile ? 'h-[calc(100vh-180px)]' : 'min-h-[300px] sm:min-h-[400px]'}`}>
              {!capturedImage ? (
                <>
                  <video
                    ref={(el) => {
                      setCameraVideoRef(el);
                      if (el && cameraStream) {
                        el.srcObject = cameraStream;
                        el.play().catch(err => console.error('Video play error:', err));
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ 
                      maxHeight: isMobile ? '100%' : '80vh',
                      transform: isMobile ? 'scaleX(-1)' : 'none'
                    }}
                  />
                  
                  {/* Capture Button - Mobile Optimized */}
                  <div className={`absolute ${isMobile ? 'bottom-6' : 'bottom-4 sm:bottom-8'} left-1/2 transform -translate-x-1/2 z-10`}>
                    <button
                      onClick={capturePhoto}
                      className={`${isMobile ? 'w-20 h-20 border-[5px]' : 'w-16 h-16 sm:w-20 sm:h-20 border-4'} bg-white rounded-full border-gray-300 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform touch-manipulation shadow-2xl`}
                      aria-label="Capture photo"
                    >
                      <div className={`${isMobile ? 'w-14 h-14 border-[3px]' : 'w-12 h-12 sm:w-14 sm:h-14 border-2'} bg-white rounded-full border-gray-400`}></div>
                    </button>
                  </div>
                  
                  {/* Instructions Overlay - Mobile Optimized */}
                  {isMobile && (
                    <div className="absolute top-6 left-4 right-4 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-sm text-white text-sm px-4 py-3 rounded-xl border border-white/20">
                      <p className="text-center font-medium">📄 Position your ID clearly in the frame</p>
                      <p className="text-center text-xs mt-1 text-white/80">Make sure all text is visible and readable</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={capturedImage}
                    alt="Captured ID"
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: isMobile ? '100%' : '80vh' }}
                  />
                  
                  {/* Upload Progress - Mobile Optimized */}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
                      <p className="text-white text-base font-semibold">Uploading photo...</p>
                      <p className="text-white/70 text-sm mt-1">Please wait</p>
                    </div>
                  )}
                  
                  {/* Action Buttons - Mobile Optimized */}
                  {!isUploadingPhoto && (
                    <div className={`absolute ${isMobile ? 'bottom-6 left-4 right-4' : 'bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2'} flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-3 sm:gap-4'} ${isMobile ? 'w-auto' : 'w-full sm:w-auto'} ${isMobile ? '' : 'px-4 sm:px-0'}`}>
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          if (cameraVideoRef && cameraStream) {
                            cameraVideoRef.srcObject = cameraStream;
                            cameraVideoRef.play().catch(err => console.error('Video play error:', err));
                          }
                        }}
                        className={`${isMobile ? 'w-full h-14 text-base font-semibold' : 'w-full sm:w-auto px-6 py-3 text-sm sm:text-base'} bg-gray-700/90 backdrop-blur-sm text-white rounded-xl hover:bg-gray-800 active:bg-gray-900 transition-colors font-medium touch-manipulation shadow-lg border border-white/10`}
                      >
                        🔄 Retake
                      </button>
                      <button
                        onClick={useCapturedPhoto}
                        className={`${isMobile ? 'w-full h-14 text-base font-semibold' : 'w-full sm:w-auto px-6 py-3 text-sm sm:text-base'} bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation shadow-lg`}
                      >
                        ✅ Use Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Instructions Footer - Mobile Optimized */}
            <div className={`${isMobile ? 'p-4 bg-black/80 backdrop-blur-sm border-t border-white/10' : 'p-3 sm:p-4 bg-gray-50 border-t'}`}>
              <p className={`${isMobile ? 'text-sm text-white/90' : 'text-xs sm:text-sm text-gray-600'} text-center font-medium`}>
                {isUploadingPhoto 
                  ? "⏳ Uploading your photo, please wait..."
                  : !capturedImage 
                    ? (isMobile 
                        ? "👆 Tap the white button below to capture your ID"
                        : "Position your ID document clearly in the frame and click the capture button")
                    : (isMobile
                        ? "👀 Review your photo. Tap 'Use Photo' to upload, or 'Retake' to try again."
                        : "Review your photo. Click 'Use Photo' to upload, or 'Retake' to try again.")
                }
              </p>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};
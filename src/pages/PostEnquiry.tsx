import { useState, useEffect, useRef, useMemo } from "react";
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
import { CalendarIcon, Shield, CheckCircle, ArrowLeft, Crown, Send, Upload, ChevronDown, X, Bot, Loader2, Pen, Rocket, Check, Briefcase, User, Wrench, Tractor, Landmark, Palette, Car, Baby, BookOpen, Flower2, Bike, Users, Trophy, HardHat, GraduationCap, Monitor, Film, PartyPopper, Shirt, UtensilsCrossed, Gamepad2, Building2, HeartPulse, Sofa, ShieldCheck, Gem, Scale, Megaphone, Stamp, HandHeart, PawPrint, Factory, Home, Truck, Zap, Lock, MapPin, Mic, Camera, Dumbbell, TreePine, FileText, Sparkles, MoreHorizontal, Music, ChevronRight, ChevronLeft, IndianRupee, Search, Type, AlignLeft, LayoutGrid, Package, Tag, CheckCircle2, LogIn, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useUsage } from "@/contexts/UsageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, limit, getDocs, updateDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { uploadToCloudinary, uploadToCloudinaryUnsigned } from "@/integrations/cloudinary";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { realtimeAI } from "@/services/ai/realtimeAI";
import VerificationStatus from "@/components/VerificationStatus";
import TimeLimitSelector from "@/components/TimeLimitSelector";
import { PAYMENT_PLANS, PaymentPlan } from "@/config/paymentPlans";
import { processPayment, savePaymentRecord, updateUserPaymentPlan } from "@/services/paymentService";
import { verifyIdNumberMatch } from '@/services/ai/idVerification';
import { useToast } from "@/components/ui/use-toast";
// PRO PLAN - KEPT FOR FUTURE UPDATES
// import { getUserPaymentPlan, hasProEnquiriesRemaining, decrementProEnquiriesRemaining, getProEnquiriesRemaining } from "@/services/paymentService";

const STEPS = [
  { key: 'title', label: 'What are you looking for?' },
  { key: 'category', label: 'What Are You Looking For?', description: 'Pick what fits best' },
  { key: 'description', label: 'Description', description: 'Tell sellers more' },
  { key: 'location', label: 'Location', description: 'Where do you need it?' },
  { key: 'budget', label: 'Budget', description: 'Set your numbers' },
  { key: 'deadline', label: 'Deadline & Notes', description: 'When do you need it?' },
  { key: 'extras', label: 'Photos & Verify', description: 'Finish strong' },
] as const;

const ENQUIRY_STORAGE_KEY = 'post_enquiry_draft';

export default function PostEnquiry() {
  // Version: 3.0 - Multi-step wizard (matching sell listing flow)
  const { user, isProfileVerified, profileVerificationStatus, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  // Force component remount on version change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('PostEnquiry v2.1 loaded - Categories: Business, Personal, Service at top');
    }
  }, []);


  
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
  const totalSteps = STEPS.length;
  const [step, setStep] = useState(() => {
    // If returning from profile verification, jump to last step
    const draft = localStorage.getItem(ENQUIRY_STORAGE_KEY);
    if (draft) return STEPS.length - 1;
    return 0;
  });
  const [animDir, setAnimDir] = useState<'up' | 'down'>('up');
  const [catPage, setCatPage] = useState(0);
  const [catSearch, setCatSearch] = useState('');
  const CATS_PER_PAGE = 10;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesPopoverOpen, setCategoriesPopoverOpen] = useState(false);
  const [categoriesSheetOpen, setCategoriesSheetOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(() => PAYMENT_PLANS.find(p => p.id === 'premium') || null);
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
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [idUploadLoading, setIdUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | null>(null);
  const [enquiryStatus, setEnquiryStatus] = useState<string>('pending');
  const [isEnquiryApproved, setIsEnquiryApproved] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  
  // Trust Badge Verification States (matching SellerResponse)
  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [govIdUrl, setGovIdUrl] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [idVerificationResult, setIdVerificationResult] = useState<{matches: boolean; error?: string; extractedNumber?: string} | null>(null);
  const [idErrors, setIdErrors] = useState<{[key: string]: string}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const idVerificationCardRef = useRef<HTMLDivElement>(null);
  const inlineVerificationRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Reference images (optional for buyers, up to 5)
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // AI Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Scroll to ID verification card when verification is successful
  useEffect(() => {
    if (idVerificationResult?.matches && idVerificationCardRef.current) {
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
          
          if (newTotal >= 120) {
            return 120;
          }
          
          if (newTotal === 60) {
            setVerificationCountdown(60);
          }
          
          if (newTotal < 60) {
            setVerificationCountdown(60 - newTotal);
          } else {
            setVerificationCountdown(120 - newTotal);
          }
          
          return newTotal;
        });
      }, 1000);
    } else {
      setVerificationCountdown(60);
      setTotalElapsedSeconds(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [verifyingId]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [
      title.trim(),
      description.trim(),
      (selectedCategories.length > 0 || category.trim()),
      budget.trim(),
      location.trim(),
      deadline !== null
    ];
    const completed = requiredFields.filter(field => field).length;
    const progress = (completed / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [title, description, selectedCategories, category, budget, location, deadline]);

  // Restore form from localStorage if returning from profile verification
  useEffect(() => {
    const draft = localStorage.getItem(ENQUIRY_STORAGE_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.selectedCategories) setSelectedCategories(d.selectedCategories);
        if (d.budget) setBudget(d.budget);
        if (d.location) setLocation(d.location);
        if (d.deadline) setDeadline(new Date(d.deadline));
        if (d.notes) setNotes(d.notes);
        if (d.referenceImageUrls) setReferenceImageUrls(d.referenceImageUrls);
        if (d.selectedPlanId) {
          const plan = PAYMENT_PLANS.find(p => p.id === d.selectedPlanId);
          if (plan) setSelectedPlan(plan);
        }
      } catch {}
      localStorage.removeItem(ENQUIRY_STORAGE_KEY);
      // Scroll down to publish button after restoring
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Scroll to top on step change
  const scrollToInput = () => {
    requestAnimationFrame(() => {
      const el = document.getElementById('step-top');
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - 20, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Step validation
  const canAdvanceFromStep = (s: number): boolean => {
     switch (s) {
       case 0:
         if (!title.trim()) {
           toast({ title: 'Add a title', description: 'Buyers need a clear name.', variant: 'destructive' as any });
           return false;
         }
         return true;
       case 1:
         if (selectedCategories.length === 0) {
           toast({ title: 'Select a category', description: 'Pick at least one category.', variant: 'destructive' as any });
           return false;
         }
         return true;
      case 2:
        if (!description.trim()) {
          toast({ title: 'Add a description', description: 'A few sentences help sellers decide.', variant: 'destructive' as any });
          return false;
        }
        return true;
      case 3:
        if (!location.trim()) {
          toast({ title: 'Add a location', description: 'Where do you need this?', variant: 'destructive' as any });
          return false;
        }
        return true;
      case 4:
        if (!budget.trim()) {
          toast({ title: 'Add a budget', description: 'Set your budget in INR.', variant: 'destructive' as any });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    setAnimDir('up');
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    scrollToInput();
  };

  const goBack = () => {
    setAnimDir('down');
    setStep((prev) => Math.max(prev - 1, 0));
    scrollToInput();
  };

  // Real-time ID number validation
  const validateIdNumber = (value: string, type: string) => {
    if (!type) return;
    
    const cleanIdNumber = value.replace(/[\s-]/g, '').toUpperCase();
    
    if (!cleanIdNumber) {
      setErrors(prev => ({ ...prev, govIdNumber: "" }));
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
      setErrors(prev => ({ ...prev, govIdNumber: error }));
    } else {
      setErrors(prev => ({ ...prev, govIdNumber: "" }));
    }
  };

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
            console.log('🚀🚀🚀 NAVIGATING TO DASHBOARD WITH BUYER MODE NOW...');
            navigate("/dashboard?mode=buyer");
            
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
            console.log('🚀🚀🚀 NAVIGATING TO DASHBOARD WITH BUYER MODE NOW...');
            navigate("/dashboard?mode=buyer");
            
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
  const notAuth = !user ? (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pal-blue mx-auto mb-4"></div>
          <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">Redirecting to sign in...</p>
        </div>
      </div>
    </Layout>
  ) : null;
  if (!user) return notAuth;

  // Categories array - matching EnquiryWall.tsx with main categories at top
  let categories = [
    // Main categories at the top
    { value: "business", label: "Business", group: "Main" },
    { value: "personal", label: "Personal", group: "Main" },
    { value: "service", label: "Service", group: "Main" },
    // Rest of categories
    { value: "agriculture-farming", label: "Agriculture", group: "Lifestyle" },
    { value: "antiques", label: "Antiques", group: "Products" },
    { value: "art", label: "Art", group: "Products" },
    { value: "automobile", label: "Automobile", group: "Products" },
    { value: "baby-kids", label: "Baby & Kids", group: "Products" },
    { value: "bags-luggage", label: "Bags & Luggage", group: "Products" },
    { value: "books-publications", label: "Books", group: "Products" },
    { value: "beauty-products", label: "Beauty", group: "Products" },
    { value: "bicycles", label: "Bicycles", group: "Products" },
    { value: "childcare-family", label: "Childcare", group: "Lifestyle" },
    { value: "collectibles", label: "Collectibles", group: "Products" },
    { value: "construction-renovation", label: "Construction", group: "Industrial" },
    { value: "education-training", label: "Education", group: "Lifestyle" },
    { value: "electronics-gadgets", label: "Electronics", group: "Products" },
    { value: "entertainment-media", label: "Entertainment", group: "Lifestyle" },
    { value: "events-entertainment", label: "Events", group: "Lifestyle" },
    { value: "fashion-apparel", label: "Fashion", group: "Products" },
    { value: "food-beverage", label: "Food", group: "Lifestyle" },
    { value: "gaming-recreation", label: "Gaming", group: "Lifestyle" },
    { value: "government-public", label: "Government", group: "Professional" },
    { value: "health-beauty", label: "Health", group: "Lifestyle" },
    { value: "home-furniture", label: "Home", group: "Products" },
    { value: "insurance-services", label: "Insurance", group: "Professional" },
    { value: "jobs", label: "Jobs", group: "Professional" },
    { value: "jewelry-accessories", label: "Jewelry", group: "Products" },
    { value: "legal-financial", label: "Legal", group: "Professional" },
    { value: "marketing-advertising", label: "Marketing", group: "Professional" },
    { value: "memorabilia", label: "Memorabilia", group: "Products" },
    { value: "non-profit-charity", label: "Non-Profit", group: "Professional" },
    { value: "pets", label: "Pets", group: "Lifestyle" },
    { value: "raw-materials-industrial", label: "Industrial", group: "Industrial" },
    { value: "real-estate", label: "Real Estate", group: "Professional" },
    { value: "real-estate-services", label: "Real Estate Services", group: "Professional" },
    { value: "renewable-energy", label: "Renewable Energy", group: "Technology" },
    { value: "security-safety", label: "Security", group: "Security" },
    { value: "sneakers", label: "Sneakers", group: "Products" },
    { value: "souvenir", label: "Souvenir", group: "Products" },
    { value: "sports-outdoor", label: "Sports", group: "Lifestyle" },
    { value: "technology", label: "Technology", group: "Technology" },
    { value: "thrift", label: "Thrift", group: "Products" },
    { value: "transportation-logistics", label: "Transportation", group: "Industrial" },
    { value: "travel-tourism", label: "Travel", group: "Lifestyle" },
    { value: "vintage", label: "Vintage", group: "Products" },
    { value: "waste-management", label: "Waste Management", group: "Industrial" },
    { value: "wedding-events", label: "Wedding", group: "Lifestyle" },
    { value: "musical-instruments", label: "Musical Instruments", group: "Products" },
    { value: "tools-equipment", label: "Tools & Equipment", group: "Products" },
    { value: "appliances", label: "Appliances", group: "Products" },
    { value: "photography-cameras", label: "Photography & Cameras", group: "Products" },
    { value: "fitness-gym-equipment", label: "Fitness & Gym Equipment", group: "Products" },
    { value: "kitchen-dining", label: "Kitchen & Dining", group: "Products" },
    { value: "garden-outdoor", label: "Garden & Outdoor", group: "Products" },
    { value: "office-supplies", label: "Office Supplies", group: "Products" },
    { value: "repair-services", label: "Repair Services", group: "Professional" },
    { value: "cleaning-services", label: "Cleaning Services", group: "Professional" },
    { value: "musical-services", label: "Musical Services", group: "Professional" },
    { value: "tutoring-lessons", label: "Tutoring & Lessons", group: "Professional" },
    { value: "medical-equipment", label: "Medical Equipment", group: "Products" },
    { value: "musical-accessories", label: "Musical Accessories", group: "Products" },
    { value: "other", label: "Other", group: "Other" }
  ];
  
  // Category icon mapping
  const categoryIcons: Record<string, any> = {
    "business": Briefcase,
    "personal": User,
    "service": Wrench,
    "agriculture-farming": Tractor,
    "antiques": Landmark,
    "art": Palette,
    "automobile": Car,
    "baby-kids": Baby,
    "bags-luggage": Briefcase,
    "books-publications": BookOpen,
    "beauty-products": Flower2,
    "bicycles": Bike,
    "childcare-family": Users,
    "collectibles": Trophy,
    "construction-renovation": HardHat,
    "education-training": GraduationCap,
    "electronics-gadgets": Monitor,
    "entertainment-media": Film,
    "events-entertainment": PartyPopper,
    "fashion-apparel": Shirt,
    "food-beverage": UtensilsCrossed,
    "gaming-recreation": Gamepad2,
    "government-public": Building2,
    "health-beauty": HeartPulse,
    "home-furniture": Sofa,
    "insurance-services": ShieldCheck,
    "jobs": Briefcase,
    "jewelry-accessories": Gem,
    "legal-financial": Scale,
    "marketing-advertising": Megaphone,
    "memorabilia": Stamp,
    "non-profit-charity": HandHeart,
    "pets": PawPrint,
    "raw-materials-industrial": Factory,
    "real-estate": Home,
    "real-estate-services": Home,
    "renewable-energy": Zap,
    "security-safety": Lock,
    "sneakers": Gem,
    "souvenir": MapPin,
    "sports-outdoor": Dumbbell,
    "technology": Monitor,
    "thrift": Shirt,
    "transportation-logistics": Truck,
    "travel-tourism": MapPin,
    "vintage": Landmark,
    "waste-management": Factory,
    "wedding-events": PartyPopper,
    "musical-instruments": Mic,
    "tools-equipment": Wrench,
    "appliances": Sofa,
    "photography-cameras": Camera,
    "fitness-gym-equipment": Dumbbell,
    "kitchen-dining": UtensilsCrossed,
    "garden-outdoor": TreePine,
    "office-supplies": FileText,
    "repair-services": Wrench,
    "cleaning-services": Sparkles,
    "musical-services": Mic,
    "tutoring-lessons": GraduationCap,
    "medical-equipment": HeartPulse,
    "musical-accessories": Music,
    "other": MoreHorizontal,
  };

  // Keep main categories at top, sort the rest alphabetically, then add 'Other' at the end
  const mainCategories = categories.filter(cat => ['business', 'personal', 'service'].includes(cat.value));
  const otherCategories = categories.filter(cat => !['business', 'personal', 'service', 'other'].includes(cat.value));
  const otherCategory = categories.find(cat => cat.value === 'other');
  categories = [
    ...mainCategories,
    ...otherCategories.sort((a, b) => a.label.localeCompare(b.label)),
    otherCategory
  ].filter(Boolean);
  
  // Debug: Verify categories are sorted correctly (v2.0)
  if (typeof window !== 'undefined') {
    console.log('PostEnquiry v2.0 - Categories sorted:', categories.slice(0, 5).map(c => c.label));
    console.log('Total categories:', categories.length);
  }

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

  // Handle reference image upload (batch, matching CreateListing style)
  const [referenceUploadProgresses, setReferenceUploadProgresses] = useState<number[]>([]);

  const onAddReferenceImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (referenceImageUrls.length >= 5) {
      toast({ title: 'Image limit reached', description: 'You can upload up to 5 images only.', variant: 'destructive' });
      return;
    }
    setUploadingImages(true);
    try {
      const urls: string[] = [];
      const remainingSlots = 5 - referenceImageUrls.length;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);

      // Add placeholder progress entries
      const startIdx = referenceImageUrls.length;
      setReferenceUploadProgresses(prev => [...prev, ...selectedFiles.map(() => 0)]);

      for (let i = 0; i < selectedFiles.length; i++) {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setReferenceUploadProgresses(prev => {
            const next = [...prev];
            const idx = startIdx + i;
            if (next[idx] < 90) next[idx] = next[idx] + Math.floor(Math.random() * 15) + 5;
            return next;
          });
        }, 200);

        const url = await uploadToCloudinaryUnsigned(selectedFiles[i]);

        clearInterval(progressInterval);
        setReferenceUploadProgresses(prev => {
          const next = [...prev];
          next[startIdx + i] = 100;
          return next;
        });
        urls.push(url);
      }
      if (files.length > selectedFiles.length) {
        toast({ title: 'Only 5 images allowed', description: 'Extra selected images were skipped.' });
      }
      setReferenceImageUrls(prev => [...prev, ...urls].slice(0, 5));
      // Clear progress after a short delay
      setTimeout(() => setReferenceUploadProgresses([]), 1000);
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload one or more images.', variant: 'destructive' });
      setReferenceUploadProgresses([]);
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    setReferenceImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualStatusCheck = async () => {
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
    
    // Payment required for all enquiries (no free tier)

    // Validate required fields
    if (!title.trim() || !description.trim() || (selectedCategories.length === 0 && !category) || !budget.trim() || !location.trim()) {
      alert('Please fill in all required fields (title, description, categories, budget, location).');
      return;
    }

    // ALL enquiries require ₹10 Razorpay payment before posting
    // handleDirectPayment manages its own loading/error states
    console.log('💳 Opening Razorpay checkout - ₹10 payment required for all enquiries');
    console.log('💳 Plan details:', { id: selectedPlan?.id, name: selectedPlan?.name, price: selectedPlan?.price });
    
    try {
      await handleDirectPayment();
    } catch (error) {
      console.error('❌ Error in handleDirectPayment:', error);
    }
    // Always return — handleDirectPayment creates the enquiry on success
    // and shows error toasts on failure. Never post without payment.
    return;
    
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
      
      let idFrontUrlFinal = null;
      let idBackUrlFinal = null;
      
      // 🚀 CRITICAL FIX: Check for ID upload attempt BEFORE upload processing
      // This ensures trust badge shows even if upload fails silently in production
      const hasIdUploadAttempt = !!(idFrontImage || idBackImage || idFrontUrl || idBackUrl);
      
      // Only process ID upload for non-verified users
      // Check if ID URL is already set (from trust badge verification) or if we need to upload
      if (!isUserVerified && hasIdUploadAttempt) {
        console.log('Starting ID image upload for non-verified user...');
        setIdUploadLoading(true);
        setUploadStage('Uploading ID documents...');
        setUploadProgress(0);
        try {
          // Use existing URL if available (from trust badge verification), otherwise upload the image
          if (idFrontUrl) {
            console.log('Front ID URL already exists, using existing URL');
            idFrontUrlFinal = idFrontUrl; // Use existing URL from state
            setUploadProgress(25);
          } else if (idFrontImage) {
            setUploadStage('Uploading front ID to Cloudinary...');
            setUploadProgress(25);
            idFrontUrlFinal = await uploadToCloudinary(idFrontImage);
            console.log('Front ID uploaded to Cloudinary');
          }
          
          // Back image is optional - only upload if provided
          if (idBackUrl) {
            console.log('Back ID URL already exists, using existing URL');
            idBackUrlFinal = idBackUrl; // Use existing URL from state
            setUploadProgress(50);
          } else if (idBackImage) {
            setUploadStage('Uploading back ID to Cloudinary...');
            setUploadProgress(50);
            idBackUrlFinal = await uploadToCloudinary(idBackImage);
            console.log('Back ID uploaded to Cloudinary');
          }
          
          setUploadProgress(75);
          setUploadStage('ID documents uploaded successfully!');
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
          
          // 🚀 CRITICAL FIX: Don't throw error - continue with enquiry creation
          // Trust badge will still show because hasIdUploadAttempt is true
          // This ensures enquiry is created even if upload fails in production
          console.warn('⚠️ ID upload failed, but continuing with enquiry creation. Trust badge will still show.');
          // DO NOT throw uploadError - let enquiry be created with trust badge
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
        isProfileVerified: isUserVerified,
        // 🛡️ PROTECTED: Trust Badge Fix - userProfileVerified field is REQUIRED for trust badge display in enquiry cards
        // 🚀 CRITICAL FIX: Set immediately based on ID upload attempt, BEFORE upload processing
        // This ensures trust badge ALWAYS shows if ID was uploaded, regardless of upload success/failure
        // DO NOT REMOVE OR MODIFY THIS FIELD - It's checked in Landing.tsx trust badge condition
        userProfileVerified: isUserVerified || hasIdUploadAttempt // Set immediately when ID detected
      };

      // Only add government ID fields if they exist
      // If ID images are uploaded through the form, mark this enquiry as verified
      // 🛡️ PROTECTED: Trust Badge Production Fix - DO NOT REMOVE OR MODIFY
      // This fix ensures trust badge shows even if Cloudinary upload fails silently in production
      
      // 🚀 CRITICAL FIX: Ensure flags are set even if upload failed or returned null
      // This is a safety net to ensure trust badge always shows when ID was attempted
      if (hasIdUploadAttempt) {
        enquiryData.isProfileVerified = true;
        enquiryData.userVerified = true;
        enquiryData.userProfileVerified = true;
        console.log('✅ ID upload detected - trust badge flags set');
      }
      
      // Add ID image URLs if upload succeeded
      if (idFrontUrlFinal || idBackUrlFinal) {
        if (idFrontUrlFinal) {
          enquiryData.idFrontImage = idFrontUrlFinal;
        }
        if (idBackUrlFinal) {
          enquiryData.idBackImage = idBackUrlFinal;
        }
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
          // Auto-navigate verified users to dashboard with buyer mode
          setTimeout(() => {
            navigate("/dashboard?mode=buyer");
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
              <div className="bg-black rounded-lg p-4 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto p-3 sm:p-4 bg-white/10 rounded-full w-fit mb-3 sm:mb-4">
                    <Rocket className="h-8 w-8 sm:h-12 sm:w-12 text-green-400" />
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
              <div className="bg-black px-3 sm:px-4 py-3 sm:py-4">
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
                    onClick={handleManualStatusCheck}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header - Matching Live Enquiries - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
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
              
            {/* Post Enquiry Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                      <Pen className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
                      Post Your Enquiry.
              </h1>
                  </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    What in the world are you looking for?
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>

        <div className="max-w-4xl mx-auto px-1 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Success Message - Enhanced Professional Design */}
          {isSubmitted && (
            <Card className="border-2 border-green-200 shadow-lg mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-50 to-white overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
                  <Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
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

          {/* Main Form - Multi-step wizard (matching sell listing) */}
          {!isSubmitted && (
            <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="space-y-2 border-b border-black/10 pb-4 px-5 sm:px-6 lg:px-8 pt-4">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((step + 1) / totalSteps) * 100}%`,
                      backgroundColor: ((step + 1) / totalSteps) < 0.5 ? '#ef4444' : ((step + 1) / totalSteps) < 0.8 ? '#22c55e' : '#15803d'
                    }}
                  />
                </div>
              </div>

              <CardContent className="pt-6 sm:pt-8 pb-6 min-h-[320px] sm:min-h-[360px] flex flex-col">
                {/* Step Icon */}
                <div id="step-top">
                  <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)] bg-black text-white">
                    {step === 0 ? <Search className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     step === 1 ? <LayoutGrid className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     step === 2 ? <AlignLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     step === 3 ? <MapPin className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     step === 4 ? <IndianRupee className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     step === 5 ? <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} /> :
                     <Upload className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />}
                  </div>
                </div>

                {/* Step Title */}
                <div id="step-title" className="text-center mb-6">
                  <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">{STEPS[step].label}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">{STEPS[step].description}</p>
                </div>

                {/* Step Content */}
                <div key={step} className="flex-1 space-y-4" style={{ animation: animDir === "up" ? "stepSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "stepSlideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>

                  {/* Step 0: Title */}
                  {step === 0 && (
                    <div className="space-y-2 max-w-lg mx-auto w-full">
                      
                      <Input
                        id="enquiry-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Land Cruiser Prado 70th Anniversary Edition"
                        className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 placeholder:text-slate-400 placeholder:text-[10px]"
                        maxLength={50}
                        autoFocus
                      />

                    </div>
                  )}

                  {/* Step 1: Category (swipeable horizontal pages) */}
                  {step === 1 && (() => {
                    const filteredCategories = catSearch.trim()
                      ? categories.filter(c => c.label.toLowerCase().includes(catSearch.toLowerCase()))
                      : categories;
                    const isSearching = catSearch.trim().length > 0;
                    const totalPages = Math.ceil(filteredCategories.length / CATS_PER_PAGE);
                    const pagedCategories = isSearching
                      ? filteredCategories
                      : filteredCategories.slice(catPage * CATS_PER_PAGE, (catPage + 1) * CATS_PER_PAGE);
                    return (
                      <div className="max-w-2xl mx-auto w-full">
                        {/* Search bar */}
                        <div className="mb-4">
                          <div className="relative overflow-hidden rounded-xl">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5-5m0 0a7 7 0 10-9.9-9.9 7 7 0 009.9 9.9z" /></svg>
                            </div>
                            <input
                              type="text"
                              value={catSearch}
                              onChange={(e) => { setCatSearch(e.target.value); setCatPage(0); }}
                              placeholder="Search categories..."
                              className="w-full h-10 sm:h-11 text-sm border-2 border-gray-800 rounded-xl pr-10 placeholder:text-gray-400 transition-all"
                              style={{ paddingLeft: '2.75rem', outline: 'none' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'black'; e.currentTarget.style.boxShadow = '0 0 0 2px black'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                            />
                            {catSearch && (
                              <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); setCatSearch(''); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Category Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {pagedCategories.map((cat) => {
                            const Icon = categoryIcons[cat.value] ?? LayoutGrid;
                            const selected = selectedCategories.includes(cat.value);
                            const isDisabled = !selected && selectedCategories.length >= 3;
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => !isDisabled && handleCategoryToggle(cat.value)}
                                className={cn(
                                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation',
                                  selected
                                    ? 'border-black bg-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.35)]'
                                    : isDisabled
                                      ? 'opacity-40 border-black/20 bg-white text-black'
                                      : 'border-black/20 bg-white text-black hover:border-black hover:bg-slate-50 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]'
                                )}
                              >
                                <div className={cn(
                                  'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border',
                                  selected ? 'border-white/30 bg-white/10' : 'border-black/10 bg-slate-50'
                                )}>
                                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                                </div>
                                <span className="text-[10px] sm:text-xs font-black leading-tight">{cat.label}</span>
                                {selected && <Check className="h-4 w-4 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* No results message */}
                        {isSearching && pagedCategories.length === 0 && (
                          <div className="text-center py-6">
                            <div className="flex flex-col items-center gap-2 mt-2">
                              <span className="text-[11px] font-bold text-black">Please choose</span>
                              {(() => {
                                const Icon = categoryIcons['other'] ?? LayoutGrid;
                                const selected = selectedCategories.includes('other');
                                const isDisabled = !selected && selectedCategories.length >= 3;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => !isDisabled && handleCategoryToggle('other')}
                                    className={cn(
                                      'flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation',
                                      selected
                                        ? 'border-black bg-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.35)]'
                                        : isDisabled
                                          ? 'opacity-40 border-black/20 bg-white text-black'
                                          : 'border-black/20 bg-white text-black hover:border-black hover:bg-slate-50 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]'
                                    )}
                                  >
                                    <div className={cn(
                                      'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border',
                                      selected ? 'border-white/30 bg-white/10' : 'border-black/10 bg-slate-50'
                                    )}>
                                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-black leading-tight">Other</span>
                                    {selected && <Check className="h-4 w-4 shrink-0" />}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Swipe hint */}
                        {!isSearching && totalPages > 1 && (
                          <p className="text-[10px] text-slate-400 text-center mt-3">
                            Swipe or tap arrows for more categories
                          </p>
                        )}                         {/* Pagination - prev/next text buttons */}
                         {!isSearching && totalPages > 1 && (
                           <div className="flex items-center justify-between mt-4">
                             <button
                               type="button"
                               onClick={() => setCatPage(p => Math.max(0, p - 1))}
                               disabled={catPage === 0}
                               className="flex items-center gap-1 px-3 py-2 text-xs font-bold border-2 border-black rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white active:scale-95 transition-all"
                             >
                               <ChevronLeft className="h-3 w-3" />
                               Prev
                             </button>
                             <span className="text-[11px] font-bold text-gray-500">
                               {catPage + 1} / {totalPages}
                             </span>
                             <button
                               type="button"
                               onClick={() => setCatPage(p => Math.min(totalPages - 1, p + 1))}
                               disabled={catPage === totalPages - 1}
                               className="flex items-center gap-1 px-3 py-2 text-xs font-bold border-2 border-black rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white active:scale-95 transition-all"
                             >
                               Next
                               <ChevronRight className="h-3 w-3" />
                             </button>
                           </div>
                         )}
                      </div>
                    );
                  })()}

                  {/* Step 2: Description */}
                  {step === 2 && (
                    <div className="space-y-2 max-w-lg mx-auto w-full">
                      <Label htmlFor="enquiry-desc" className="text-[10px] sm:text-xs font-bold">Description</Label>
                      <Textarea
                        id="enquiry-desc"
                        value={description}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) setDescription(e.target.value);
                        }}
                        placeholder="Specifications, requirements, timeline..."
                        maxLength={500}
                        className="rounded-2xl min-h-[160px] sm:min-h-[180px] text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 py-3 placeholder:text-slate-400 placeholder:text-[10px] resize-y"
                        autoFocus
                      />
                      <p className="text-[11px] text-slate-500 text-right">{description.length}/500</p>
                    </div>
                  )}

                  {/* Step 3: Location */}
                  {step === 3 && (
                    <div className="max-w-xl mx-auto w-full space-y-3">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                          <MapPin className="h-5 w-5 text-red-500" />
                        </div>
                        <Input
                          value={location}
                          onChange={handleLocationChange}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                          placeholder="Search location..."
                          className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-10 pr-4 placeholder:text-slate-400"
                          style={{ fontSize: '16px' }}
                        />
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectLocation(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm sm:text-base font-medium transition-colors duration-150 border-b border-slate-100 last:border-b-0"
                              >
                                <span className="text-slate-800">{suggestion}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Budget */}
                  {step === 4 && (
                    <div className="max-w-md mx-auto w-full space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="enquiry-budget" className="text-[10px] sm:text-xs font-bold flex items-center gap-2">
                          <IndianRupee className="h-3.5 w-3.5" />
                          Budget (INR)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500 z-10">₹</span>
                          <Input
                            id="enquiry-budget"
                            value={budget}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,]/g, '');
                              const numericValue = value.replace(/,/g, '');
                              if (numericValue === '' || /^\d+$/.test(numericValue)) {
                                const formattedValue = numericValue === '' ? '' : parseInt(numericValue).toLocaleString('en-IN');
                                setBudget(formattedValue);
                              }
                            }}
                            placeholder="50,000"
                            inputMode="decimal"
                            className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-8 pr-4 placeholder:text-slate-400 placeholder:text-[10px] font-bold text-lg"
                            autoFocus
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Deadline & Notes */}
                  {step === 5 && (
                    <div className="max-w-lg mx-auto w-full space-y-6">
                      <div className="space-y-2">
                        <TimeLimitSelector value={deadline} onChange={setDeadline} className="w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enquiry-notes" className="text-[10px] sm:text-xs font-bold">
                          Notes <span className="text-gray-600 font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                          id="enquiry-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Additional requirements or preferences..."
                          className="rounded-2xl min-h-[120px] text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 py-3 placeholder:text-slate-400 placeholder:text-[10px] resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 6: Photos & Verify */}
                  {step === 6 && (
                    <div className="max-w-lg mx-auto w-full space-y-6">
                      {/* Reference Images (matching CreateListing style) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold flex items-center gap-2">
                          <Upload className="h-3.5 w-3.5" />
                          Show your need (optional)
                        </Label>
                        {referenceImageUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {referenceImageUrls.map((url, i) => (
                              <div key={i} className="relative group">
                                <img src={url} alt={`Image ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-black/10" />
                                <button
                                  type="button"
                                  onClick={() => removeReferenceImage(i)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {referenceImageUrls.length < 5 && (
                          <div className="rounded-xl border-2 border-dashed border-black/30 bg-slate-50/80 p-4">
                            <Input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => onAddReferenceImages(e.target.files)}
                              disabled={uploadingImages || referenceImageUrls.length >= 5}
                              className="cursor-pointer text-sm"
                            />
                            <p className="text-[11px] text-slate-600 mt-2">{referenceImageUrls.length}/5 images</p>
                            {uploadingImages && referenceUploadProgresses.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {referenceUploadProgresses.map((p, i) => (
                                  <div key={i} className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-black h-1.5 rounded-full transition-all duration-200"
                                      style={{ width: `${p}%` }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>



                      {/* Profile Verification */}
                      {!authLoading && !isUserVerified && (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem(ENQUIRY_STORAGE_KEY, JSON.stringify({
                                title, description, selectedCategories, budget, location,
                                deadline: deadline?.toISOString(), notes,
                                referenceImageUrls, selectedPlanId: selectedPlan?.id
                              }));
                              navigate('/profile?returnTo=/post-enquiry');
                            }}
                            className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all group shadow-[0_4px_0_0_rgba(37,99,235,0.4)] active:shadow-[0_2px_0_0_rgba(37,99,235,0.4)] active:translate-y-0.5"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs sm:text-sm font-bold text-white">Verify Your Profile <span className="text-blue-200 font-normal">(Optional)</span></p>
                              <p className="text-[10px] sm:text-[11px] text-blue-100">Get a trust badge</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white/70 flex-shrink-0" />
                          </button>
                        </div>
                      )}
                      {!authLoading && isUserVerified && (
                        <div>
                          <div className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1a2744]">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs sm:text-sm font-bold text-white">Profile Verified ✓</p>
                              <p className="text-[10px] sm:text-[11px] text-blue-100">Your enquiry will show a trust badge.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enquiry Preview */}
                      <div className="rounded-xl border-2 border-black bg-white p-3 sm:p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Title</span>
                          <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{title || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Category</span>
                          <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{selectedCategories.map(c => categories.find(cat => cat.value === c)?.label).join(', ') || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Location</span>
                          <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{location || '—'}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Budget</span>
                          <span className="text-sm sm:text-base font-black text-black">{budget ? `₹${budget}` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Posting Fee */}
                {step === totalSteps - 1 && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5c0a0a]">
                      <IndianRupee className="h-4 w-4 text-white" />
                      <span className="text-xs font-bold text-white">We don't offer free listings to waste your time.</span>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 0}
                    className="!bg-white hover:!bg-gray-50 !text-black !rounded-2xl !border-[0.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group font-black h-11 sm:h-12"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                    <ChevronLeft className="h-4 w-4 mr-1 relative z-10" />
                    <span className="relative z-10">Back</span>
                  </Button>
                  {step < totalSteps - 1 ? (
                    <Button type="button" onClick={goNext} className="!bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group font-black h-11 sm:h-12 px-6">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                      <span className="relative z-10">Next</span>
                      <ChevronRight className="h-4 w-4 ml-1 relative z-10" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSubmit(new Event('submit') as any)}
                      disabled={loading || idUploadLoading || paymentLoading}
                      className="!w-full !h-16 !text-lg !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
                    >
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                      <span className="relative z-10">{paymentLoading ? 'Opening Razorpay…' : loading ? 'Posting…' : 'Post Enquiry'}</span>
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          )}

          {/* Real-time Verification Status */}
          {submittedEnquiryId && (
            <Card className="mt-6 sm:mt-8 border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
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
                        <Rocket className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
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
                      setReferenceImageUrls([]);
                      setReferenceUploadProgresses([]);
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

    </Layout>
  );
};
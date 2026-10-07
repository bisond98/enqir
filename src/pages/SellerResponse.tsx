import { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Shield, ShieldCheck, CheckCircle, Clock, AlertTriangle, Star, FileText, X, ChevronRight, Verified, Eye, Check, File, Lock, ImageIcon, Phone, Sparkles, Loader2 } from "lucide-react";
import { buildResponseDescription } from "@/services/ai/descriptionAssistant";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingAnimation from "@/components/LoadingAnimation";

import { NotificationContext } from "@/contexts/NotificationContext";
import { db } from "@/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs, onSnapshot, increment } from "firebase/firestore";
import { uploadToCloudinaryUnsigned, uploadToCloudinaryAuto } from "@/integrations/cloudinary";
import { processPayment } from "@/services/paymentService";
import { PAYMENT_PLANS } from "@/config/paymentPlans";
import { realtimeAI } from "@/services/ai/realtimeAI";
import { useToast } from "@/components/ui/use-toast";

interface Enquiry {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  budget: number;
  deadline: string | null;
  createdAt: any;
  status: string;
  responses?: number;
  lastResponseAt?: any;
  idFrontImage?: string | null;
  idBackImage?: string | null;
  details?: { jobDirection?: string } | null;
}

interface SellerSubmission {
  id?: string;
  enquiryId: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  title: string;
  message: string;
  price: string;
  notes: string;
  /** Seller's contact mobile number (e.g. "+91 98765 43210") — never displayed on the page, only revealed via the call popup to paid buyers. */
  mobileNumber?: string | null;
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
  userVerified?: boolean;
  isProfileVerified?: boolean;
  /** True when the seller ticked "Accept" to charge exactly the buyer's budget */
  budgetAccepted?: boolean;
}

const SellerResponse = () => {
  const { enquiryId } = useParams();
  const navigate = useNavigate();
  const notificationContext = useContext(NotificationContext);
  const { toast } = useToast();
  const createNotification = notificationContext?.createNotification || (async () => {
    console.warn('NotificationContext not available');
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // AI description assistant — pen icon in the description box. Typed text is
  // grammar-corrected in place; an empty box gets the seller-voice opener
  // ("I have the '<enquiry title>' you're looking for. Let's close the deal.").
  // Applied directly, no suggestion tile. Never buyer phrasing.
  const [aiGenerating, setAiGenerating] = useState(false);

  const runDescriptionAI = () => {
    setAiGenerating(true);
    setTimeout(() => {
      try {
        const result = buildResponseDescription(description, title);
        if (result) setDescription(result.slice(0, 500));
      } catch {
        // keep the user's text untouched on failure
      } finally {
        setAiGenerating(false);
      }
    }, 250);
  };
  const [price, setPrice] = useState("");
  // Ticked when the seller accepts the buyer's budget exactly — fills the price
  // field with the enquiry budget and flags the submission for display pages
  const [budgetAccepted, setBudgetAccepted] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // Original filenames for uploaded files (matters for resumes on hiring forms)
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
                        const submitButtonRef = useRef<HTMLDivElement>(null);

  // ID verification state
  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [govIdUrl, setGovIdUrl] = useState("");
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [idVerificationResult, setIdVerificationResult] = useState<{matches: boolean; error?: string; extractedNumber?: string} | null>(null);
  const idVerificationCardRef = useRef<HTMLDivElement>(null);


  // Restore form data from localStorage if returning from profile verification
  useEffect(() => {
    const draft = localStorage.getItem('seller_response_draft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.price) setPrice(data.price);
        if (data.notes) setNotes(data.notes);
        if (data.imageUrls) setImages((data.imageUrls || []).slice(0, 5));
        // Scroll to submit button after restoring
        setTimeout(() => {
          submitButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      } catch {}
      localStorage.removeItem('seller_response_draft');
    }
  }, []);  // Scroll to ID verification card when verification is successful
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
  
  // New state for front and back images (matching buyer form)
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
  const [idBackImage, setIdBackImage] = useState<File | null>(null);
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [idErrors, setIdErrors] = useState<{[key: string]: string}>({});
  
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

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  // Job enquiries talk about salary, not budget/price
  const isJobEnquiry = !!enquiry && (enquiry.category === 'jobs' || enquiry.category === 'job' || enquiry.category.toLowerCase().includes('job'));
  // Hiring enquiries collect a resume from respondents; other jobs keep photo wording
  const isHiringEnquiry = isJobEnquiry && enquiry?.details?.jobDirection === 'hiring';
  const [loading, setLoading] = useState(true);
  const [isOwnEnquiry, setIsOwnEnquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Synchronous re-entry lock: prevents double-tap / double-fired payment callback
  // from creating two submission documents (state updates are async, refs are not)
  const submitLockRef = useRef(false);
  const responseImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);

  // Contact mobile number (optional) — shown only to paid users via the call popup
  const [mobileNumber, setMobileNumber] = useState("");
  // Country code for the mobile number (default: India +91)
  const [countryCode, setCountryCode] = useState('+91');
  const [existingSubmission, setExistingSubmission] = useState<SellerSubmission | null>(null);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  // Design-preview mode: /seller-response/:id?preview=success renders the success
  // screen without auth/payment (countdown frozen) — used only for styling previews
  const isPreviewSuccess = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'success';
  const { user: authUser, isProfileVerified, profileVerificationStatus, loading: authLoading } = useAuth();
  // const { createNotification } = useNotifications();

  // Helper function to determine if user is verified
  // Both manual and AI verification should work the same way
  const isUserVerified = isProfileVerified || 
                        profileVerificationStatus === 'approved' || 
                        profileVerificationStatus === 'verified' ||
                        profileVerificationStatus === 'completed';

  // Debug profile verification status
  useEffect(() => {
    console.log('🔍 SellerResponse Debug:', {
      isProfileVerified,
      profileVerificationStatus,
      isUserVerified,
      authLoading,
      userId: authUser?.uid
    });
  }, [isProfileVerified, profileVerificationStatus, isUserVerified, authLoading, authUser?.uid]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [description, price]; // Removed title since it's auto-filled
    const completed = requiredFields.filter(field => field.trim().length > 0).length;
    const progress = (completed / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [description, price]);

  // Fetch enquiry data and check if user owns it.
  // Wait for authLoading first: on a fresh app open Firebase takes a moment to
  // restore the persisted session — fetching before that would wrongly treat a
  // signed-in user as signed-out (blank form state, wrong redirects).
  useEffect(() => {
    if (authLoading) return;
    const fetchEnquiry = async () => {
      if (!enquiryId || !authUser) return;

      try {
        const enquiryDoc = await getDoc(doc(db, 'enquiries', enquiryId));
        if (enquiryDoc.exists()) {
          const enquiryData = enquiryDoc.data() as Enquiry;
          setEnquiry(enquiryData);
          
          // Auto-fill the title with enquiry title
          setTitle(enquiryData.title);
          
          // Check if this is the user's own enquiry
          if (enquiryData.userId === authUser.uid) {
            setIsOwnEnquiry(true);
          }
        } else {
          // Enquiry not found
          navigate('/enquiries');
        }
      } catch (error) {
        console.error('Error fetching enquiry:', error);
        navigate('/enquiries');      } finally {
        setLoading(false);
      }

    };

    fetchEnquiry();
  }, [enquiryId, authUser, authLoading, navigate]);

  // Listen for admin status changes on the submission
  useEffect(() => {
    if (!submissionId || !authUser) return;

    const submissionRef = doc(db, 'sellerSubmissions', submissionId);
    const unsubscribe = onSnapshot(submissionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const status = data.status;
        setAdminStatus(status);
        
        if (status === 'approved') {
          setIsApproved(true);
          setIsRejected(false);
        } else if (status === 'rejected') {
          setIsRejected(true);
          setIsApproved(false);
        } else {
          setIsApproved(false);
          setIsRejected(false);
        }
      }
    });

    return () => unsubscribe();
  }, [submissionId, authUser]);

  // Check if user has already submitted a response to this enquiry
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!enquiryId || !authUser) return;

      try {
        const submissionsQuery = query(
          collection(db, 'sellerSubmissions'),
          where('enquiryId', '==', enquiryId),
          where('sellerId', '==', authUser.uid)
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        if (!submissionsSnapshot.empty) {
          const submission = submissionsSnapshot.docs[0].data() as SellerSubmission;
          const submissionDocId = submissionsSnapshot.docs[0].id;
          setExistingSubmission(submission);
          setSubmissionId(submissionDocId);
          setHasAlreadySubmitted(true);
          console.log('User has already submitted to this enquiry:', submission);
        }
      } catch (error) {
        console.error('Error checking existing submission:', error);
      }
    };

    checkExistingSubmission();
  }, [enquiryId, authUser]);

  // Redirect if user tries to respond to their own enquiry
  useEffect(() => {
    if (isOwnEnquiry) {
      navigate('/dashboard');
    }
  }, [isOwnEnquiry, navigate]);

  // Always scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when success page is shown
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

  // Auto-redirect to dashboard after 5 seconds when submitted
  useEffect(() => {
    if (isSubmitted) {
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            console.log('🔄 Auto-redirecting to dashboard');
            navigate('/dashboard?mode=seller');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isSubmitted, navigate]);

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

  // Validation function
  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Image compression timed out, using original file');
        resolve(file);
      }, 8000);
      const cleanup = () => clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        if (!ctx) { cleanup(); resolve(file); return; }
        img.onload = () => {
          try {
            const maxWidth = 1200;
            const maxHeight = 1200;
            let { width, height } = img;
            if (width > maxWidth || height > maxHeight) {
              if (width > height) { height = (height * maxWidth) / width; width = maxWidth; }
              else { width = (width * maxHeight) / height; height = maxHeight; }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              cleanup();
              if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              else resolve(file);
            }, 'image/jpeg', 0.85);
          } catch { cleanup(); resolve(file); }
        };
        img.onerror = () => { cleanup(); resolve(file); };
        img.src = URL.createObjectURL(file);
      } catch { cleanup(); resolve(file); }
    });
  };

  const validateForm = () => {
    console.log('Validation started');
    console.log('title:', title, 'length:', title.length);
    console.log('description:', description, 'length:', description.length);
    console.log('price:', price);
    
    const newErrors: {[key: string]: string} = {};
    
    // Title is auto-filled from enquiry, no validation needed
    
    if (!description.trim()) {
      newErrors.description = "Description is required";
      console.log('Description validation failed - empty');
    }
    
    if (!price.trim()) {
      newErrors.price = "Price is required";
      console.log('Price validation failed - empty');
    } else {
      const numPrice = parseFloat(price.replace(/[^\d]/g, ''));
      console.log('Parsed price:', numPrice);
      if (numPrice <= 0) {
        newErrors.price = "Price must be greater than 0";
        console.log('Price validation failed - <= 0');
      }
    }

    // Image validation (optional)
    const validImageUrls = images.filter(url => url && url.trim() !== "");
    // Images are now optional - no validation required

    // Government ID validation (optional, but if started, must be complete)
    const hasGovIdData = govIdType.trim() || govIdNumber.trim() || govIdFile || govIdUrl || idFrontImage || idFrontUrl;
    
    if (hasGovIdData) {
      if (!govIdType.trim()) {
        newErrors.govIdType = "Please select an ID type";
      }
      
      if (!govIdNumber.trim()) {
        newErrors.govIdNumber = "ID number is required when uploading ID";
      } else {
        const cleanIdNumber = govIdNumber.replace(/[\s-]/g, '').toUpperCase();
        if (govIdType === 'aadhaar') {
          if (!/^\d{12}$/.test(cleanIdNumber)) {
            newErrors.govIdNumber = "Aadhaar number must be exactly 12 digits";
          }
        } else if (govIdType === 'pan') {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanIdNumber)) {
            newErrors.govIdNumber = "PAN must be 10 characters: 5 letters + 4 digits + 1 letter";
          }
        } else if (govIdType === 'passport') {
          if (!/^[A-Z]{1}[0-9]{7}$/.test(cleanIdNumber)) {
            newErrors.govIdNumber = "Passport number must be 8 characters: 1 letter + 7 digits";
          }
        } else if (govIdType === 'driving_license') {
          if (cleanIdNumber.length < 10 || cleanIdNumber.length > 15 || !/^[A-Z0-9]{10,15}$/.test(cleanIdNumber)) {
            newErrors.govIdNumber = "Driving License must be 10-15 alphanumeric characters";
          }
        } else if (govIdType === 'voter_id') {
          if (cleanIdNumber.length !== 10 || !/^[A-Z0-9]{10}$/.test(cleanIdNumber)) {
            newErrors.govIdNumber = "Voter ID must be exactly 10 alphanumeric characters";
          }
        } else {
          if (cleanIdNumber.length < 8) {
            newErrors.govIdNumber = "ID number must be at least 8 characters";
          }
        }
      }

      if (!govIdFile && !govIdUrl && !idFrontImage && !idFrontUrl) {
        newErrors.govId = "Please upload your government ID document";
      }
      
      // Check OCR verification if image is uploaded
      // ID verification is optional - don't block submission if not verified
      const hasIdImages = idFrontUrl || govIdUrl;
      if (hasIdImages && (!idVerificationResult || !idVerificationResult.matches)) {
        // Don't block submission - ID verification is optional for seller responses
        // Just log it, but don't add to errors
        console.log('ID verification not complete, but allowing submission (optional)');
      }
    }
    
    console.log('Validation errors:', newErrors);
    console.log('Validation result:', Object.keys(newErrors).length === 0);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  // Image upload — same proven flow as the sell form (CreateListing): raw file to
  // Cloudinary, no canvas compression, append-style with per-file progress bars.
  const onAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length >= 5) {
      toast({ title: isHiringEnquiry ? 'File limit reached' : 'Image limit reached', description: isHiringEnquiry ? 'You can upload up to 5 files only.' : 'You can upload up to 5 images only.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      const remainingSlots = 5 - images.length;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);

      // Add placeholder progress entries
      const startIdx = images.length;
      setUploadProgresses(prev => [...prev, ...selectedFiles.map(() => 0)]);

      for (let i = 0; i < selectedFiles.length; i++) {
        // Simulated progress tick (same as sell form)
        const progressInterval = setInterval(() => {
          setUploadProgresses(prev => {
            const next = [...prev];
            const idx = startIdx + i;
            if (next[idx] < 90) next[idx] = next[idx] + Math.floor(Math.random() * 15) + 5;
            return next;
          });
        }, 200);

        // Resume attachments (hiring enquiries) can be PDF/DOC — route them
        // through the auto uploader, which skips image compression and posts
        // to Cloudinary's /auto endpoint. Image files keep the exact existing path.
        const isResumeFile = isHiringEnquiry && !selectedFiles[i].type.startsWith('image/');
        const url = isResumeFile
          ? await uploadToCloudinaryAuto(selectedFiles[i])
          : await uploadToCloudinaryUnsigned(selectedFiles[i]);

        clearInterval(progressInterval);
        setUploadProgresses(prev => {
          const next = [...prev];
          next[startIdx + i] = 100;
          return next;
        });
        urls.push(url);
      }
      // Track the original filenames of any non-image attachments (resumes)
      // so they can be stored alongside the response
      setFileNames(prev => [...prev, ...selectedFiles.filter(f => !f.type.startsWith('image/')).map(f => f.name)].slice(0, 5));
      if (files.length > selectedFiles.length) {
        toast({ title: isHiringEnquiry ? 'Only 5 files allowed' : 'Only 5 images allowed', description: `Only ${remainingSlots} more ${isHiringEnquiry ? 'file' + (remainingSlots === 1 ? '' : 's') : 'image' + (remainingSlots === 1 ? '' : 's')} could be added — extra selected ${isHiringEnquiry ? 'files' : 'images'} were skipped.` });
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
      // Clear progress after a short delay
      setTimeout(() => setUploadProgresses([]), 1000);
    } catch {
      toast({ title: 'Upload failed', description: isHiringEnquiry ? 'Could not upload one or more files.' : 'Could not upload one or more images.', variant: 'destructive' });
      setUploadProgresses([]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleGovIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, govId: "ID document must be less than 10MB" }));
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, govId: "Please upload a valid image or PDF file" }));
      return;
    }

    setGovIdFile(file);
    setErrors(prev => ({ ...prev, govId: "" }));
    setIdVerificationResult(null);

    try {
      setGovIdProgress(25);
      const compressedFile = await compressImage(file);
      const uploadedUrl = await uploadToCloudinaryUnsigned(compressedFile);
      setGovIdProgress(100);
      setGovIdUrl(uploadedUrl);
      // Don't verify automatically - wait for verify button click
    } catch (error) {
      console.error('Error uploading government ID:', error);
      setGovIdProgress(0);
      setErrors(prev => ({ ...prev, govId: "Failed to upload ID document. Please try again." }));
    }
  };

  const removeGovId = () => {
    setGovIdFile(null);
    setGovIdUrl("");
    setGovIdProgress(0);
    setErrors(prev => ({ ...prev, govId: "" }));
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
      // Keep backward compatibility with govIdUrl
      if (!govIdUrl) setGovIdUrl(uploadedUrl);
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Re-entry lock: block a second submit before the first finishes (synchronous, unlike state)
    if (submitLockRef.current) {
      console.log('Form submission blocked: already submitting');
      return;
    }
    submitLockRef.current = true;

    console.log('Form submission started');
    console.log('enquiry:', enquiry);
    console.log('isOwnEnquiry:', isOwnEnquiry);
    console.log('enquiryId:', enquiryId);
    console.log('authUser:', authUser);
    console.log('price:', price);
    console.log('description:', description);
    
    if (!enquiry) {
      console.log('Form submission blocked: no enquiry');
      toast({
        title: "Error",
        description: "Enquiry not found. Please refresh the page.",
        variant: "destructive",
      });
      submitLockRef.current = false;
      return;
    }
    
    if (isOwnEnquiry) {
      console.log('Form submission blocked: own enquiry');
      toast({
        title: "Error",
        description: "You cannot respond to your own enquiry.",
        variant: "destructive",
      });
      submitLockRef.current = false;
      return;
    }
    
    if (!authUser) {
      console.log('Form submission blocked: no user');
      toast({
        title: "Error",
        description: "Please sign in to submit an offer.",
        variant: "destructive",
      });
      submitLockRef.current = false;
      return;
    }
    
    // Validate form before submission
    console.log('Validating form...');
    const validationResult = validateForm();
    console.log('Validation result:', validationResult);
    console.log('Current errors:', errors);
    
    if (!validationResult) {
      console.log('Form validation failed');
      // Show specific error messages
      const errorMessages = Object.values(errors).filter(msg => msg && !msg.includes('verify ID number')).join(', ');
      if (errorMessages) {
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      }
      submitLockRef.current = false;
      return;
    }
    console.log('Form validation passed');
    
    // ID verification is optional - don't block submission if verification hasn't been done
    // Only verify if user explicitly wants to (has uploaded images and entered details)
    const hasIdImages = idFrontUrl || govIdUrl;
    const hasIdData = govIdType && govIdNumber;
    
    // If user has uploaded ID images and entered details, but hasn't verified yet, allow submission anyway
    // ID verification is optional for seller responses
    if (hasIdImages && hasIdData && (!idVerificationResult || !idVerificationResult.matches)) {
      console.log('ID verification not complete, but allowing submission (optional)');
      // Don't block - just continue with submission
    }

    // ALL offers require ₹10 Razorpay payment before submitting
    const offerPlan = PAYMENT_PLANS.find(p => p.id === 'premium');
    if (!offerPlan) {
      toast({ title: 'Error', description: 'Payment plan not found.', variant: 'destructive' });
      submitLockRef.current = false;
      return;
    }

    setSubmitting(true);

    try {
      console.log('💳 Opening Razorpay checkout...');
      const paymentResult = await processPayment(
        enquiryId,
        authUser.uid,
        offerPlan,
        {
          name: authUser.displayName || authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          contact: '',
        }
      );

      if (!paymentResult.success) {
        console.error('❌ Payment failed:', paymentResult.error);
        toast({
          title: 'Payment Unsuccessful',
          description: paymentResult.error || 'Payment failed. Offer not submitted.',
          variant: 'destructive',
        });
        setSubmitting(false);
        submitLockRef.current = false;
        return;
      }

      console.log('✅ Payment successful!');

      // Show success screen immediately
      setSubmitting(false);
      setIsSubmitted(true);
      // Flag the dashboard to show the one-time scam-alert caution popup after this successful submission
      try {
        sessionStorage.setItem('scamAlertAfterSubmit', JSON.stringify({ enquiryId: enquiryId, sellerId: authUser?.uid || '' }));
      } catch {}
      // Redirect happens via the visible 5s countdown effect (below) — no extra timer here
      // to avoid two competing navigations firing at different times.

      // Save to Firebase in background (fire-and-forget)
      (async () => {
        try {
          console.log('📤 Saving offer to Firebase...');

        const validImageUrls = images.filter(url => url && url.trim() !== "");
        // Keep the real filename for resume attachments; fall back to the old
        // generated names for plain image responses (unchanged behaviour)
        const validImageNames = isHiringEnquiry && fileNames.length === validImageUrls.length
          ? fileNames
          : validImageUrls.map((_, i) => `image-${i + 1}.jpg`);

        const responseData: SellerSubmission = {
          enquiryId: enquiryId!,
          sellerId: authUser?.uid || "",
          sellerName: authUser?.displayName || "A user",
          sellerEmail: authUser?.email || "",
          title: title.trim(),
          message: description.trim(),
          price: price.trim(),
          notes: notes.trim(),
          mobileNumber: mobileNumber.trim() ? `${countryCode} ${mobileNumber.trim()}` : null,
          imageUrls: validImageUrls,
          imageNames: validImageNames,
          imageCount: validImageUrls.length,
          govIdType: govIdType.trim(),
          govIdNumber: govIdNumber.trim(),
          govIdUrl: idFrontUrl || govIdUrl || "",
          govIdFileName: idFrontImage?.name || govIdFile?.name || "",
          isIdentityVerified: isUserVerified || !!(govIdType && govIdNumber && (idFrontUrl || govIdUrl)),
          status: "approved" as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          buyerViewed: false,
          chatEnabled: false,
          userVerified: isUserVerified || !!(govIdType && govIdNumber && (idFrontUrl || govIdUrl)),
          isProfileVerified: isUserVerified || !!(govIdType && govIdNumber && (idFrontUrl || govIdUrl)),
          budgetAccepted: budgetAccepted && !!enquiry?.budget
        };

        const docRef = await addDoc(collection(db, "sellerSubmissions"), responseData);
        console.log('✅ Offer saved with ID:', docRef.id);
        trackResponseSubmitted(enquiryId!, docRef.id);

        // AI Processing
        if (!isUserVerified) {
          realtimeAI.processSellerResponse(docRef.id, responseData).catch(() => {});
        }

        // Notifications
        try {
          await createNotification('new_response', {
            title: 'Response Submitted Successfully! 🎯',
            message: `Your offer for "${enquiry?.title}" has been submitted and is now live!`,
            priority: 'high',
            actionUrl: '/my-responses',
            actionText: 'View My Responses'
          });
        } catch {}

        // Notify buyer
        if (enquiry?.userId && enquiry.userId !== authUser?.uid && notificationContext?.createNotificationForUser) {
          try {
            await notificationContext.createNotificationForUser(
              enquiry.userId,
              'new_response',
              {
                title: '🎯 New Response to Your Enquiry!',
                message: `${authUser?.displayName || 'A user'} responded to "${enquiry.title}"`,
                priority: 'high',
                actionUrl: `/enquiry/${enquiryId}/responses?sellerId=${authUser?.uid}`,
                actionText: 'View Response',
                enquiryId: enquiryId,
                sellerId: authUser?.uid,
                sellerName: authUser?.displayName || 'A user'
              }
            );
          } catch {}
        }
      } catch (err) {
        console.error('❌ Background submission error:', err);
      }
    })();

    } catch (error) {
      console.error('Error submitting response:', error);
      setErrors({ submit: 'Failed to submit response. Please check your connection and try again.' });
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No deadline';
    
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      // String or number timestamp
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state — also covers the session-restore window on fresh app open
  if (isPreviewSuccess) {
    // fall through to the success screen below without any auth gating
  } else if (authLoading || loading) {
    return <LoadingAnimation message="Loading enquiry" />;
  }

  // Redirect if own enquiry (skipped in design-preview mode)
  if (isOwnEnquiry && !isPreviewSuccess) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Cannot Respond to Your Own Enquiry</h2>
            <p className="text-muted-foreground mb-6">
              You cannot respond to enquiries that you posted yourself.
            </p>
            <div className="space-x-4">
              <Link to="/enquiries">
                <Button variant="default">Browse Other Enquiries</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Enquiry not found (skipped in design-preview mode — no real enquiry there)
  if (!enquiry && !isPreviewSuccess) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Enquiry Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The enquiry you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/enquiries">
              <Button variant="default">Browse Enquiries</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

    if (isSubmitted || isPreviewSuccess) {
    return (
      <Layout>
        <div className="w-full bg-white">
          <Card className="w-full border-0 sm:border-[0.5px] sm:border-black shadow-none sm:shadow-lg rounded-none sm:rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0 sm:p-6 lg:p-8 text-center relative min-h-screen flex flex-col">
              {/* Countdown Container - Like Profile Verification */}
              <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
                {/* Moving Tick - All Over Screen */}
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

                {/* Countdown - Large Transparent Overlapping */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className="text-[160px] sm:text-[240px] lg:text-[300px] font-black text-black tabular-nums animate-pulse select-none"
                    style={{
                      WebkitTextStroke: '1px #000000'
                    } as React.CSSProperties}
                  >
                    {redirectCountdown}
                  </div>
                </div>

                {/* Content Stack - Above the Countdown */}
                <div className="absolute top-10 sm:top-16 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center space-y-2 sm:space-y-4 w-full px-4">
                  {/* Heading */}
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none text-black drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    Offer Submitted
                  </h1>

                  {/* Subheading */}
                  <p className="text-xs sm:text-sm lg:text-base text-gray-700 font-semibold">
                    Your offer is under review
                  </p>
                </div>
              </div>

              {/* Business-model doodle (from Enter Phone page) - low opacity, behind the countdown number */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[45%] -translate-y-1/2 flex justify-center pointer-events-none select-none opacity-20 z-0" aria-hidden="true">
                <svg className="w-[min(85vw,420px)] max-w-none aspect-square" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  {/* Central hub rings */}
                  <g transform="translate(200, 200)" opacity="0.85">
                    <circle cx="0" cy="0" r="34" fill="none" stroke="#111827" strokeWidth="2" />
                    <circle cx="0" cy="0" r="27" fill="none" stroke="#111827" strokeWidth="1.2" opacity="0.7" />
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#111827" strokeWidth="1" opacity="0.85" />
                  </g>

                  {/* Top - User with Smartphone */}
                  <g transform="translate(200, 80)" opacity="0.95">
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#111827" strokeWidth="2" />
                    <circle cx="-3" cy="-2" r="1.5" fill="#111827" />
                    <circle cx="3" cy="-2" r="1.5" fill="#111827" />
                    <path d="M-2 3 Q0 4 2 3" stroke="#111827" strokeWidth="1.2" fill="none" />
                    <rect x="-8" y="8" width="16" height="20" fill="none" stroke="#111827" strokeWidth="1" rx="2" />
                    <rect x="-6" y="12" width="12" height="8" fill="#111827" opacity="0.85" />
                    <text x="0" y="42" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">User</text>
                  </g>

                  {/* Left - AI Processing Center */}
                  <g transform="translate(100, 200)" opacity="0.95">
                    <rect x="-15" y="-12" width="30" height="24" fill="none" stroke="#111827" strokeWidth="2" rx="3" />
                    <circle cx="-6" cy="0" r="2" fill="#111827" />
                    <circle cx="0" cy="0" r="2" fill="#111827" />
                    <circle cx="6" cy="0" r="2" fill="#111827" />
                    <path d="M-4 -6 L4 6 M4 -6 L-4 6" stroke="#111827" strokeWidth="1" opacity="0.9" />
                    <text x="0" y="-18" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">AI Engine</text>
                    <path d="M-20 -5 L-15 -5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                    <path d="M-20 0 L-15 0" stroke="#111827" strokeWidth="1" opacity="0.7" />
                    <path d="M-20 5 L-15 5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                    <path d="M15 -5 L20 -5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                    <path d="M15 0 L20 0" stroke="#111827" strokeWidth="1" opacity="0.7" />
                    <path d="M15 5 L20 5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                  </g>

                  {/* Right - Matching Network */}
                  <g transform="translate(300, 200)" opacity="0.95">
                    <circle cx="0" cy="0" r="15" fill="none" stroke="#111827" strokeWidth="2" />
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#111827" strokeWidth="1.2" opacity="0.7" />
                    <circle cx="0" cy="0" r="5" fill="none" stroke="#111827" strokeWidth="1" opacity="0.85" />
                    <circle cx="0" cy="0" r="2" fill="#111827" />
                    <text x="0" y="-20" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">Match</text>
                    <circle cx="-12" cy="-8" r="2" fill="#111827" opacity="0.9" />
                    <circle cx="12" cy="-8" r="2" fill="#111827" opacity="0.9" />
                    <circle cx="-12" cy="8" r="2" fill="#111827" opacity="0.9" />
                    <circle cx="12" cy="8" r="2" fill="#111827" opacity="0.9" />
                    <path d="M-12 -8 L-5 -3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                    <path d="M12 -8 L5 -3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                    <path d="M-12 8 L-5 3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                    <path d="M12 8 L5 3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                  </g>

                  {/* Bottom - Success Celebration */}
                  <g transform="translate(200, 320)" opacity="0.95">
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#111827" strokeWidth="2" />
                    <path d="M-6 0 L-2 4 L6 -2" stroke="#111827" strokeWidth="2.5" fill="none" />
                    <text x="0" y="-22" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">Success!</text>
                    <path d="M-20 -8 L-18 -6 L-16 -8 L-18 -10 Z" fill="#111827" opacity="0.9" />
                    <path d="M20 -8 L22 -6 L24 -8 L22 -10 Z" fill="#111827" opacity="0.9" />
                    <path d="M-20 8 L-18 10 L-16 8 L-18 6 Z" fill="#111827" opacity="0.9" />
                    <path d="M20 8 L22 10 L24 8 L22 6 Z" fill="#111827" opacity="0.9" />
                  </g>

                  {/* Animated flow lines with arrowheads */}
                  <path d="M200 112 L200 166" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" />
                  </path>
                  <path d="M130 200 L166 200" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="0.5s" />
                  </path>
                  <path d="M234 200 L270 200" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1s" />
                  </path>
                  <path d="M200 234 L200 288" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1.5s" />
                  </path>
                  <path d="M118 218 L172 262" stroke="#111827" strokeWidth="2" fill="none" opacity="0.75" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2s" />
                  </path>
                  <path d="M282 218 L228 262" stroke="#111827" strokeWidth="2" fill="none" opacity="0.75" markerEnd="url(#offer-submitted-arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2.5s" />
                  </path>

                  {/* Feature satellites: Secure / Fast / Chat / Quality */}
                  {[
                    { x: 150, y: 120, emoji: "🔒", label: "Secure" },
                    { x: 250, y: 120, emoji: "⚡", label: "Fast" },
                    { x: 150, y: 280, emoji: "💬", label: "Chat" },
                    { x: 250, y: 280, emoji: "⭐", label: "Quality" },
                  ].map((s) => (
                    <g key={s.label} transform={`translate(${s.x}, ${s.y})`} opacity="0.85">
                      <circle cx="0" cy="0" r="8" fill="#111827" />
                      <text x="0" y="2" textAnchor="middle" fontSize="7" fill="white">{s.emoji}</text>
                      <text x="0" y="17" textAnchor="middle" fontSize="6" fill="#1F2937">{s.label}</text>
                    </g>
                  ))}

                  {/* Arrowhead marker */}
                  <defs>
                    <marker id="offer-submitted-arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#111827" />
                    </marker>
                  </defs>
                </svg>
              </div>

              {/* Don't Press Back - Red Chip */}
              <div className="relative z-10 flex justify-center -translate-y-16 sm:-translate-y-24">
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-[0_3px_0_0_rgba(0,0,0,0.3)]">
                  Don't press back
                </span>
              </div>
                
                {/* Action Buttons */}
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 lg:gap-4 xl:gap-5 mt-2 sm:mt-4 -translate-y-16 sm:-translate-y-24 px-4 sm:px-0">
                  <Link to="/dashboard" className="flex-1">
                    <Button
                      variant="default"
                      className="!w-full !h-14 sm:!h-16 !text-base sm:!text-lg !font-black !bg-gradient-to-b !from-blue-500 !to-blue-700 hover:!from-blue-500 hover:!to-blue-700 !text-white !rounded-xl !border !border-black relative overflow-hidden transition-all !duration-200 !shadow-[0_5px_0_0_rgba(0,0,0,0.85),0_8px_12px_rgba(0,0,0,0.25)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.85),0_10px_16px_rgba(0,0,0,0.28)] hover:!translate-y-[-1px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85),0_3px_6px_rgba(0,0,0,0.20)] active:!translate-y-[4px] touch-manipulation select-none flex items-center justify-center"
                    >
                      <span className="relative z-10">Go to Dashboard</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Enhanced Header */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
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
            
            {/* Sell Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white tracking-tighter text-center drop-shadow-2xl dashboard-header-no-emoji">
                <span className="bg-gradient-to-r from-white via-white to-blue-300 bg-clip-text text-transparent">Sell.</span>
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/90 max-w-2xl mx-auto px-2">
                  Share your offer for: <span className="font-semibold">"{enquiry?.title}".</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-1 sm:px-6 lg:px-8 py-12">
          
          {/* Security Badges */}
          <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-5 text-[9px] sm:text-sm lg:text-base text-gray-700">
                <div className="flex items-center">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-1.5 flex-shrink-0 text-gray-600" />
              <span className="font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center">
              <Verified className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-1.5 flex-shrink-0 text-gray-600" />
              <span className="font-medium">Admin Reviewed</span>
                </div>
                <div className="flex items-center">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-1.5 flex-shrink-0 text-gray-600" />
              <span className="font-medium">Confidential</span>
          </div>
        </div>
          
          {/* Already Submitted Message */}
          {hasAlreadySubmitted && existingSubmission && (
            <Card className="mb-6 sm:mb-8 border-4 border-black bg-white rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-5 text-center">
                    You've Already Submitted an Offer
                  </h3>
                  
                  {/* Offer Details */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-5 text-left">
                    <h4 className="text-[10px] sm:text-xs font-medium text-gray-600 mb-3 text-center">Your Submitted Offer</h4>
                    <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-semibold text-gray-900">{existingSubmission.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge 
                          variant={existingSubmission.status === 'approved' ? 'default' : existingSubmission.status === 'rejected' ? 'destructive' : 'secondary'} 
                          className={`ml-2 text-[10px] sm:text-xs ${existingSubmission.status === 'approved' ? 'bg-green-950 text-white hover:bg-green-950' : ''}`}
                        >
                          {existingSubmission.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="text-gray-900 font-medium">
                          {existingSubmission.createdAt?.toDate ? existingSubmission.createdAt.toDate().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <Link to="/dashboard" className="flex-1">
                      <Button className="relative w-full !rounded-2xl !border-[0.5px] !border-black/20 bg-black hover:bg-gray-900 text-white font-semibold py-3 !text-sm !h-12 shadow-[0_8px_0_0_rgba(0,0,0,0.25)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.25)] active:translate-y-[4px] transition-all duration-200 overflow-hidden">
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
                        <span className="relative">View Dashboard</span>
                      </Button>
                    </Link>
                    <Link to="/enquiries" className="flex-1">
                      <Button variant="outline" className="relative w-full !rounded-2xl !border-[0.5px] !border-gray-300 text-gray-700 hover:bg-gray-50 !text-sm !h-12 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.15),inset_0_-2px_4px_rgba(0,0,0,0.04)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:translate-y-[4px] transition-all duration-200 overflow-hidden">
                        <span className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-black/5 pointer-events-none" />
                        <span className="relative">Find More Requests</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Enquiry Display */}
          <Card className="mb-6 sm:mb-8 card-premium overflow-hidden border-2 border-black rounded-2xl">
            <CardHeader className="bg-black p-2.5 sm:p-3">
              {/* Title and Category Row */}
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 sm:gap-3">
                {enquiry.idFrontImage || enquiry.idBackImage ? (
                    <>
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                      <span className="text-[9px] sm:text-[10px] text-white font-medium">
                        Trust badge
                      </span>
                    </>
                ) : (
                  <p className="text-[11px] sm:text-xs font-semibold text-white">
                    Enquiry Details
                  </p>
                )}
                </div>
                <Badge variant="secondary" className="bg-white/90 text-gray-800 text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {enquiry.category}
                </Badge>
              </div>

              {/* Date and Status Row */}
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                {/* Date */}
                <div className="flex items-center text-[9px] sm:text-[10px] text-gray-300">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                  {enquiry.createdAt && (
                    <span>Posted {formatDate(enquiry.createdAt.toDate().toISOString())}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3">
              <div className="space-y-2 sm:space-y-2.5">
                {/* Title and Description Section */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-start gap-1.5">
                    <span className="text-xs sm:text-sm flex-shrink-0">🎯</span> 
                    <span>Need: {enquiry.title}</span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed pl-5 sm:pl-6">
                    {enquiry.description}
                  </p>
                </div>
                
                  {/* Deadline */}
                  {enquiry.deadline && (
                  <div className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border-[0.5px] shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)]" style={{ backgroundColor: '#800020', borderColor: '#6b0019' }}>
                    <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white mr-2 flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] text-white font-bold">
                        Deadline: {formatDate(enquiry.deadline)}
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Response Form */}
          {!hasAlreadySubmitted && (
            <Card className="mb-6 sm:mb-8 card-premium overflow-hidden border border-black rounded-2xl">
            <CardHeader className="bg-black p-3 sm:p-4">
              {/* Title and Category Row */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Your Offer
              </p>
            </div>
                <Badge variant="secondary" className="bg-white/90 text-gray-800 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full">
                  Offer
                </Badge>
              </div>

              {/* Subtitle Row */}
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center text-[10px] sm:text-xs text-gray-300">
                  <span>Your product, your rules, you're the king.</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{errors.submit}</span>
                  </div>
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Response Title */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-xs sm:text-sm font-black text-black flex items-center">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 text-black" />
                  <span className="text-black">
                    <span className="hidden sm:inline">Response Title *</span>
                    <span className="sm:hidden">Title *</span>
                  </span>
                </Label>
                <div className="relative">
                <Input
                  id="title"
                  value={title}
                  readOnly
                  disabled
                    className="rounded-[12px] h-11 sm:h-12 min-h-[44px] w-full text-sm text-center font-semibold bg-white border-[1.5px] border-slate-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] transition-all duration-200 min-touch pl-4 pr-4 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] text-slate-900 cursor-not-allowed"
                    style={{ fontSize: '15px' }}
                  required
                />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
              </div>

              {/* Enhanced Product Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-xs sm:text-sm font-black text-black flex items-center whitespace-nowrap">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 text-black flex-shrink-0" />
                  <span className="text-black">
                    Detailed Description *
                  </span>
                  <span className="text-[10px] sm:text-sm text-black invisible ml-2 whitespace-nowrap">
                    Explain it like to a 5 year-old.
                  </span>
                </Label>
                <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Describe your offer…"
                  value={description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 500) {
                      setDescription(value);
                    }
                  }}
                  maxLength={500}
                    className={`min-h-[140px] text-base rounded-[12px] w-full font-medium bg-white border-[1.5px] border-slate-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] transition-all duration-200 min-touch pl-4 pr-4 placeholder:text-gray-400 placeholder:font-medium placeholder:text-[11px] text-slate-900 touch-manipulation ${errors.description ? '!border-red-500 focus-visible:!border-red-500' : ''}`}
                    style={{ fontSize: '16px' }}
                />
                  {/* AI golden-sparkle icon — tap to generate (empty) or grammar-correct (typed). No background. */}
                  <button
                    type="button"
                    onClick={runDescriptionAI}
                    disabled={aiGenerating}
                    aria-label="AI description assistant"
                    className="absolute right-3 bottom-3 z-20 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-60 touch-manipulation bg-transparent"
                    style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, padding: 0 }}
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-3 w-3 text-black animate-spin" />
                    ) : (
                      <Sparkles
                        className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                        style={{
                          color: '#F5B301',
                          fill: '#F5B301',
                          filter: 'drop-shadow(0 0 4px rgba(245,179,1,0.55))',
                        }}
                      />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Price Field */}
              <div className="space-y-3">
                {/* Enquiry Budget Display */}
                {enquiry && (
                  <>
                    <Label className="text-xs sm:text-sm font-black text-black flex items-center">
                      <span className="text-sm sm:text-base mr-2 sm:mr-2.5 text-black">₹</span>
                      <span className="text-black">
                        {isJobEnquiry ? 'Salary Offered' : "Buyer's Budget"}
                      </span>
                    </Label>
                    <div className="relative border-4 rounded-lg px-3 sm:px-4 py-3 sm:py-4 mb-3" style={{ backgroundColor: '#800020', borderColor: '#6b0019' }}>
                      <div className="flex flex-row items-center justify-between gap-2 pr-20">
                        <span className="text-lg sm:text-xl font-bold text-white">₹{enquiry.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                      </div>
                      {/* Accept button — fills the price with the buyer's exact budget,
                          pinned to the true vertical centre of the card */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!budgetAccepted) {
                            setBudgetAccepted(true);
                            setPrice('₹' + enquiry.budget.toLocaleString('en-IN'));
                            setErrors((prev) => ({ ...prev, price: undefined }));
                          } else {
                            setBudgetAccepted(false);
                            setPrice('');
                          }
                        }}
                        aria-pressed={budgetAccepted}
                        aria-label="Accept buyer's budget"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-150 active:translate-y-[calc(-50%+1px)] ${
                          budgetAccepted
                            ? 'bg-emerald-500 shadow-[0_2px_0_0_rgba(0,0,0,0.25)]'
                            : 'bg-white hover:bg-gray-100 shadow-[0_2px_0_0_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        <span className={`text-[10px] sm:text-xs font-bold ${budgetAccepted ? 'text-white' : 'text-black'}`}>
                          {budgetAccepted ? 'Accepted' : 'Accept'}
                        </span>
                      </button>
                    </div>
                  </>
                )}

                <Label htmlFor="price" className="text-xs sm:text-sm font-black text-black flex items-center">
                  <span className="text-sm sm:text-base mr-2 sm:mr-2.5 text-black">₹</span>
                  <span className="text-black">
                    {isJobEnquiry ? 'Salary Expectation *' : 'Your Price *'}
                  </span>
                </Label>

                <div className="relative">
                <Input
                  id="price"
                    placeholder="Enter amount (e.g., 50000)"
                  value={price}
                  onChange={(e) => {
                    // Remove non-numeric characters and format with commas
                    const value = e.target.value.replace(/[^\d]/g, '');
                    // Manual edit means a custom amount — clear the Accept tick
                    if (budgetAccepted) setBudgetAccepted(false);
                    if (value) {
                      const num = parseInt(value);
                      setPrice(num.toLocaleString('en-IN'));
                    } else {
                      setPrice('');
                    }
                  }}
                  onBlur={(e) => {
                    // Add ₹ symbol when leaving the field
                    if (e.target.value && !e.target.value.startsWith('₹')) {
                      setPrice('₹' + e.target.value);
                    }
                  }}
                    className={`h-12 sm:h-14 text-base rounded-[12px] w-full font-medium bg-white border-[1.5px] border-slate-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] transition-all duration-200 min-touch pl-4 pr-14 placeholder:text-gray-400 placeholder:font-medium placeholder:text-[11px] text-slate-900 text-lg font-semibold touch-manipulation ${errors.price ? '!border-red-500 focus-visible:!border-red-500' : ''}`}
                    style={{ fontSize: '16px' }}
                  required
                />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-sm text-black">INR</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {errors.price && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.price}
                    </span>
                  )}
                  <span className="text-[8px] sm:text-sm text-black ml-auto invisible">
                    Attracts buyers. Ahhh… Whatever -Your Product, Your Price
                  </span>
                </div>
              </div>

              {/* Form Progress Indicator */}
              <div className="pt-4 space-y-3 !border-0 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">Form Completion</h3>
                  <span className={`text-[10px] sm:text-xs ${formProgress === 100 ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                    {Math.round(formProgress)}% Complete
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className={`h-full transition-all ${formProgress === 100 ? 'bg-green-600' : 'bg-primary'}`}
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
              </div>

              {/* Separator */}
              <Separator className="my-12 sm:my-16 bg-gray-300 h-[2px] hidden" />

              {/* Enhanced 5-Slot Image Upload */}
              <div className="space-y-6">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                    <h3 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      {isHiringEnquiry ? 'Upload Resume' : 'Product Images'}
                    </h3>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">(optional)</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-black">
                    Show Them Who You Are And What You've Got.
                  </p>
                </div>

                {/* Image upload UI — identical to the sell form's Photos (up to 5) */}
                <div className="space-y-2">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {images.map((url, i) => (
                        <div key={i} className="relative group">
                          {isHiringEnquiry && !/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url) ? (
                            /* Resume/document attachment — icon tile, not an <img> */
                            <div className="w-full h-20 rounded-lg border border-black/10 bg-slate-100 flex flex-col items-center justify-center gap-0.5">
                              <FileText className="h-6 w-6 text-slate-600" />
                              <span className="text-[8px] font-semibold text-slate-600 truncate max-w-[90%] px-1">
                                {fileNames[i] || 'Document'}
                              </span>
                            </div>
                          ) : (
                            <img src={url} alt={`Image ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-black/10" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length < 5 && (
                  <div className="rounded-xl border-2 border-dashed border-black/30 bg-slate-50/80 p-4">
                    <input
                      id="response-images"
                      ref={responseImageInputRef}
                      type="file"
                      multiple={images.length < 4}
                      accept={isHiringEnquiry ? 'image/*,.pdf,.doc,.docx' : 'image/*'}
                      onChange={(e) => { onAddImages(e.target.files); if (responseImageInputRef.current) responseImageInputRef.current.value = ''; }}
                      disabled={uploading || images.length >= 5}
                      className="hidden"
                    />
                    <label
                      htmlFor="response-images"
                      className="block w-full text-center !rounded-xl !border !border-black bg-blue-600 hover:bg-blue-700 text-white !transition-all !duration-200 py-3 text-sm font-black cursor-pointer !shadow-[0_5px_0_0_rgba(0,0,0,0.85),0_8px_12px_rgba(0,0,0,0.25)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.85),0_10px_16px_rgba(0,0,0,0.28)] hover:!translate-y-[-1px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85),0_3px_6px_rgba(0,0,0,0.20)] active:!translate-y-[4px] touch-manipulation select-none"
                    >
                      {isHiringEnquiry
                        ? (images.length === 0 ? 'Choose Resume' : 'Add More Files')
                        : (images.length === 0 ? 'Choose Image' : 'Add More Images')}
                    </label>
                    <p className="text-[9px] text-slate-400 mt-2 text-right">{images.length}/5 {isHiringEnquiry ? 'files' : 'images'}</p>
                    {uploading && uploadProgresses.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadProgresses.map((p, i) => (
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

                {/* Image requirement error */}
                {errors.images && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-700">Image Requirement:</span>
                    </div>
                    <p className="text-xs text-red-600">{errors.images}</p>
                  </div>
                )}
                
                {/* Display any image errors - Hide while uploading or if successfully uploaded */}
                {(() => {
                  const imageErrors = Object.entries(errors)
                    .filter(([key]) => key.startsWith('image_'))
                    .filter(([key]) => {
                      const isUploading = uploading;
                      const isUploaded = images.length > 0;
                      // Only show error if not uploading and not successfully uploaded
                      return !isUploading && !isUploaded;
                    });
                  
                  return imageErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-red-700">Image Upload Issues:</span>
                      </div>
                      <div className="text-xs text-red-600">
                        {imageErrors.map(([key, message]) => {
                          const slotNumber = key.split('_')[1];
                          return (
                            <p key={key}>Image {parseInt(slotNumber) + 1}: {message}</p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Separator */}
              <Separator className="my-8" />

              {/* Profile Verification */}
              <div className="space-y-4">
                {!authLoading && isUserVerified ? (
                  <div className="p-3 sm:p-4 border border-black rounded-xl text-center" style={{ backgroundColor: '#004d00', borderColor: '#003300' }}>
                    <div className="inline-flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                      <Badge variant="secondary" className="bg-transparent text-white border-transparent text-[10px] sm:text-xs px-2 py-0.5">
                        <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        Profile Verified — Trust Badge Active
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Save form data to localStorage before redirect
                      localStorage.setItem('seller_response_draft', JSON.stringify({
                        enquiryId: enquiryId,
                        title,
                        description,
                        price,
                        notes,
                        mobileNumber,
                        imageUrls: images,
                      }));
                      navigate(`/profile?returnTo=/respond/${enquiryId}`);
                    }}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 !rounded-2xl !border-[1.5px] !border-black !bg-blue-600 hover:!bg-blue-700 !transition-all !duration-150 group !shadow-[0_4px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[3px] touch-manipulation select-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs sm:text-sm font-bold text-white">Verify Your Profile</p>
                      <p className="text-[10px] sm:text-[11px] text-blue-100">Get a trust badge for this response</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/70 flex-shrink-0" />
                  </button>
                )}
              </div>

              {/* Contact Mobile Number (optional) — shown only to paid buyers via the call popup */}
              <div className="mt-6">
                <Label htmlFor="response-mobile" className="text-xs font-bold flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  Mobile Number <span className="text-[9px] text-slate-500 font-normal">(Optional)</span>
                </Label>
                <div className="flex gap-1.5 mt-1.5">
                  <select
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="!h-12 sm:!h-14 shrink-0 !w-[76px] pl-2 pr-0.5 !rounded-[12px] !border-[1.5px] !border-slate-200 bg-white text-slate-900 !text-xs !font-black focus:outline-none focus:!border-black !transition-all !duration-200 !shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] touch-manipulation appearance-none text-center"
                  >
                    {[
                      ['+91', '🇮🇳 +91'], ['+1', '🇺🇸 +1'], ['+44', '🇬🇧 +44'], ['+61', '🇦🇺 +61'],
                      ['+971', '🇦🇪 +971'], ['+966', '🇸🇦 +966'], ['+65', '🇸🇬 +65'], ['+60', '🇲🇾 +60'],
                      ['+49', '🇩🇪 +49'], ['+33', '🇫🇷 +33'], ['+81', '🇯🇵 +81'], ['+82', '🇰🇷 +82'],
                      ['+86', '🇨🇳 +86'], ['+55', '🇧🇷 +55'], ['+27', '🇿🇦 +27'], ['+94', '🇱🇰 +94'],
                      ['+880', '🇧🇩 +880'], ['+92', '🇵🇰 +92'], ['+977', '🇳🇵 +977'], ['+20', '🇪🇬 +20'],
                      ['+234', '🇳🇬 +234'], ['+7', '🇷🇺 +7'], ['+39', '🇮🇹 +39'], ['+34', '🇪🇸 +34'],
                    ].map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input
                    id="response-mobile"
                    type="tel"
                    inputMode="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      // Digits and spaces only (country code handled by the dropdown); India +91 limited to 10 digits
                      const digitsOnly = e.target.value.replace(/[^\d ]/g, '');
                      if (countryCode === '+91') {
                        const digitCount = digitsOnly.replace(/ /g, '').length;
                        if (digitCount >= 10 && e.target.value.length > mobileNumber.length && !/\d/.test(e.target.value.slice(-1))) return;
                        setMobileNumber(digitsOnly.replace(/(\d{5})(?=\d)/g, '$1 ').slice(0, 11));
                      } else {
                        setMobileNumber(digitsOnly);
                      }
                    }}
                    maxLength={countryCode === '+91' ? 11 : 14}
                    placeholder={countryCode === '+91' ? '98765 43210' : 'Mobile number'}
                    className="flex-1 min-w-0 !h-12 sm:!h-14 px-4 !rounded-[12px] !border-[1.5px] !border-slate-200 bg-white text-slate-900 !text-base !font-medium shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus:!border-black focus:outline-none focus:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] !transition-all !duration-200 placeholder:text-gray-400 placeholder:font-medium placeholder:text-[11px] touch-manipulation select-none"
                  />
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-medium mt-1.5 text-right">
                  Connect with privacy
                </p>
              </div>

              {/* Enhanced Submit Button */}
              <div ref={submitButtonRef} className="pt-6 space-y-4">
                <Button
                  type="submit"
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    console.log('Price:', price);
                    console.log('Submitting:', submitting);
                    console.log('Button disabled:', !price || submitting);
                    if (!price) {
                      e.preventDefault();
                      toast({
                        title: "Price Required",
                        description: "Please enter a price for your offer.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className={`!w-full !h-16 !text-lg !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed !relative !overflow-hidden touch-manipulation select-none ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={!price || submitting}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="text-white">Opening Razorpay...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <span className="text-white">Connect</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-[7px] sm:text-[9px] text-center text-slate-400 font-medium">
                  We do not offer anything for free to make you the product.
                </p>
              </div>
            </form>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

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

export default SellerResponse;


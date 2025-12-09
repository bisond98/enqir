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
import { ArrowLeft, Upload, Shield, CheckCircle, Clock, AlertTriangle, UserCheck, Star, Verified, Lock, Eye, ImageIcon, FileText, Loader2, X, Camera, Rocket, Check } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { db } from "@/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs, onSnapshot, increment } from "firebase/firestore";
import { uploadToCloudinaryUnsigned } from "@/integrations/cloudinary";
import { realtimeAI } from "@/services/ai/realtimeAI";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { verifyIdNumberMatch } from '@/services/ai/idVerification';
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
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(5).fill(null));
  const [imageUrls, setImageUrls] = useState<string[]>(Array(5).fill(""));
  const [uploadProgresses, setUploadProgresses] = useState<number[]>(Array(5).fill(0));
  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [govIdUrl, setGovIdUrl] = useState("");
  const [govIdProgress, setGovIdProgress] = useState(0);
  const [verifyingId, setVerifyingId] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [idVerificationResult, setIdVerificationResult] = useState<{matches: boolean; error?: string; extractedNumber?: string} | null>(null);
  const idVerificationCardRef = useRef<HTMLDivElement>(null);
  const inlineVerificationRef = useRef<HTMLDivElement>(null);
  
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
  const [loading, setLoading] = useState(true);
  const [isOwnEnquiry, setIsOwnEnquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<SellerSubmission | null>(null);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
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

  // Fetch enquiry data and check if user owns it
  useEffect(() => {
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
        navigate('/enquiries');
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiry();
  }, [enquiryId, authUser, navigate]);

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
            navigate('/dashboard');
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
          // Calculate new dimensions (max 1200px width)
          const maxWidth = 1200;
          const maxHeight = 1200;
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
          
          // Set white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              console.warn('Failed to create blob, using original file');
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        } catch (error) {
          console.error('Error compressing image:', error);
          resolve(file);
        }
      };
      
      img.onerror = () => {
        console.error('Error loading image for compression');
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
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
    const validImageUrls = imageUrls.filter(url => url.trim() !== "");
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
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [`image_${index}`]: "Image must be less than 5MB" }));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, [`image_${index}`]: "Please upload a valid image file" }));
      return;
    }

    // Update the specific image file
    const newImageFiles = [...imageFiles];
    newImageFiles[index] = file;
    setImageFiles(newImageFiles);
    
    // Clear any previous errors for this slot
    setErrors(prev => ({ ...prev, [`image_${index}`]: "" }));

    // Upload to Cloudinary immediately for preview
    try {
      // Update progress for this specific slot
      const newProgresses = [...uploadProgresses];
      newProgresses[index] = 25;
      setUploadProgresses(newProgresses);

      // Compress image for faster upload
      const compressedFile = await compressImage(file);
      const uploadedUrl = await uploadToCloudinaryUnsigned(compressedFile);
      
      // Update progress to complete
      newProgresses[index] = 100;
      setUploadProgresses(newProgresses);
      
      // Update the specific image URL
      const newImageUrls = [...imageUrls];
      newImageUrls[index] = uploadedUrl;
      setImageUrls(newImageUrls);
      
      // Clear any error for this image since upload was successful
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`image_${index}`];
        return newErrors;
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      // Reset progress for this slot
      const newProgresses = [...uploadProgresses];
      newProgresses[index] = 0;
      setUploadProgresses(newProgresses);
      setErrors(prev => ({ ...prev, [`image_${index}`]: "Failed to upload image. Please try again." }));
    }
  };

  const removeImage = (index: number) => {
    const newImageFiles = [...imageFiles];
    const newImageUrls = [...imageUrls];
    const newProgresses = [...uploadProgresses];
    
    newImageFiles[index] = null;
    newImageUrls[index] = "";
    newProgresses[index] = 0;
    
    setImageFiles(newImageFiles);
    setImageUrls(newImageUrls);
    setUploadProgresses(newProgresses);
    setErrors(prev => ({ ...prev, [`image_${index}`]: "" }));
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
      return;
    }
    
    if (isOwnEnquiry) {
      console.log('Form submission blocked: own enquiry');
      toast({
        title: "Error",
        description: "You cannot respond to your own enquiry.",
        variant: "destructive",
      });
      return;
    }
    
    if (!authUser) {
      console.log('Form submission blocked: no user');
      toast({
        title: "Error",
        description: "Please sign in to submit an offer.",
        variant: "destructive",
      });
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

    setSubmitting(true);
    
    try {
      // Filter out null/empty images and create arrays of URLs and names
      const validImageUrls = imageUrls.filter(url => url.trim() !== "");
      const validImageNames = imageFiles
        .filter((file, index) => file !== null && imageUrls[index] !== "")
        .map(file => file?.name || "");

      const responseData: SellerSubmission = {
        enquiryId: enquiryId!,
        sellerId: authUser?.uid || "",
        sellerName: authUser?.displayName || authUser?.email || "Anonymous Seller",
        sellerEmail: authUser?.email || "",
        title: title.trim(),
        message: description.trim(),
        price: price.trim(),
        notes: notes.trim(),
        imageUrls: validImageUrls,
        imageNames: validImageNames,
        imageCount: validImageUrls.length,
        govIdType: govIdType.trim(),
        govIdNumber: govIdNumber.trim(),
        govIdUrl: idFrontUrl || govIdUrl || "", // Use front image URL if available, fallback to govIdUrl
        govIdFileName: idFrontImage?.name || govIdFile?.name || "",
        isIdentityVerified: isUserVerified || !!(govIdType && govIdNumber && (idFrontUrl || govIdUrl)),
        status: isUserVerified ? "approved" as const : "pending" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        buyerViewed: false,
        chatEnabled: false,
        userVerified: isUserVerified,
        isProfileVerified: isUserVerified
      };

      console.log('Submitting seller response:', responseData);
      
      // Save to sellerSubmissions collection
      const docRef = await addDoc(collection(db, "sellerSubmissions"), responseData);
      console.log('Seller response saved with ID:', docRef.id);
      
      // Set submission ID for real-time tracking
      setSubmissionId(docRef.id);
      
      // 🤖 AI Processing - Skip for verified users, process for non-verified
      if (isUserVerified) {
        console.log('✅ Trust Badge User: Seller response automatically approved and made live!');
        
        // Increment enquiry response count when verified user's response is auto-approved
        if (enquiry) {
          try {
            const enquiryRef = doc(db, 'enquiries', enquiryId!);
            await updateDoc(enquiryRef, {
              responses: increment(1),
              lastResponseAt: serverTimestamp()
            });
            console.log('✅ SellerResponse: Incremented response count for verified user auto-approval');
          } catch (error) {
            console.error('❌ SellerResponse: Error incrementing enquiry response count:', error);
            // Don't fail the submission if count increment fails
          }
        }
      } else {
        console.log('🤖 SellerResponse: Starting AI processing for response:', docRef.id);
        realtimeAI.processSellerResponse(docRef.id, responseData)
          .then((result) => {
            if (result.success) {
              console.log('✅ AI: Seller response auto-approved instantly!');
            } else if (result.action === 'flagged') {
              console.log('⏳ AI: Seller response flagged for manual review');
            } else {
              console.log('❌ AI: Seller response auto-rejected');
            }
          })
          .catch((error) => {
            console.error('🤖 AI: Error processing seller response:', error);
            // AI processing failure doesn't affect user experience
          });
      }
      
      // Note: Response count is incremented only when response is approved (in realtimeAI.ts or Admin.tsx)
      // Set submitted state first
      setIsSubmitted(true);
      setSubmitting(false);
      
      // Create notification for seller (response confirmation)
      try {
        await createNotification('new_response', {
          title: 'Response Submitted Successfully! 🎯',
          message: `Your offer for "${enquiry?.title}" has been submitted and is ${isUserVerified ? 'now live!' : 'under review.'}`,
          priority: 'high',
          actionUrl: '/my-responses',
          actionText: 'View My Responses'
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }
      
      // Notify the buyer (enquiry owner) about the new response
      if (enquiry?.userId && enquiry.userId !== authUser?.uid && notificationContext?.createNotificationForUser) {
        try {
          await notificationContext.createNotificationForUser(
            enquiry.userId,
            'new_response',
            {
              title: '🎯 New Response to Your Enquiry!',
              message: `${authUser?.displayName || 'A seller'} responded to "${enquiry.title}"`,
              priority: 'high',
              actionUrl: `/enquiry/${enquiryId}/responses?sellerId=${authUser?.uid}`,
              actionText: 'View Response',
              enquiryId: enquiryId,
              sellerId: authUser?.uid,
              sellerName: authUser?.displayName || authUser?.email || 'Anonymous Seller'
            }
          );
          console.log('✅ Buyer notification created successfully');
        } catch (notificationError) {
          console.error('Failed to create buyer notification:', notificationError);
        }
      }
      
      // Success page will be shown, no need to scroll
      //   updateType: 'new response submitted'
      // });
    } catch (error) {
      console.error('Error submitting response:', error);
      setErrors({ submit: 'Failed to submit response. Please check your connection and try again.' });
      setIsSubmitted(false); // Reset submitted state on error
    } finally {
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

  // Loading state
  if (loading) {
    return <LoadingAnimation message="Loading enquiry" />;
  }

  // Redirect if own enquiry
  if (isOwnEnquiry) {
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

  // Enquiry not found
  if (!enquiry) {
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

    if (isSubmitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 sm:py-12 px-4">
          <div className="max-w-md lg:max-w-2xl xl:max-w-3xl w-full">
            <Card className="border-4 border-black shadow-xl">
              <CardContent className="p-6 sm:p-8 lg:p-12 xl:p-16 text-center">
                {/* Success Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 xl:mb-10">
                  <Rocket className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-green-600" />
                </div>
                
                {/* Main Content */}
                <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black mb-4 lg:mb-6 xl:mb-8">
                  Offer Submitted
                </h1>
                
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-black mb-6 lg:mb-8 xl:mb-10">
                  {isUserVerified ? 'Your offer is now live and visible to buyers' : 'Your offer is under review'}
                </p>
                
                {/* Status Badge */}
                {isUserVerified && (
                  <div className="inline-flex items-center px-3 py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg font-medium mb-6 lg:mb-8 xl:mb-10 border-2 border-blue-200">
                    <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-1.5 text-blue-500" />
                    Verified User
                  </div>
                )}
                
                {/* Next Steps - Simplified */}
                <div className="bg-gray-50 rounded-lg p-4 sm:p-5 lg:p-8 xl:p-10 mb-6 lg:mb-8 xl:mb-10 text-left border-2 border-black">
                  <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-black leading-relaxed">
                    {isUserVerified 
                      ? 'Your offer is immediately visible to buyers. They can contact you directly through the platform.'
                      : 'Our admin team will review your offer. You\'ll be notified once it\'s approved.'}
                  </p>
                </div>
                
                {/* Redirect Info - Minimal */}
                <p className="text-xs sm:text-sm lg:text-base text-black mb-6 lg:mb-8 xl:mb-10">
                  Redirecting in {redirectCountdown} seconds...
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 xl:gap-5">
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full bg-black hover:bg-gray-900 text-white text-sm lg:text-base xl:text-lg py-2.5 lg:py-3 xl:py-4 border-2 border-black">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link to="/enquiries" className="flex-1">
                    <Button variant="outline" className="w-full border-2 border-black text-black hover:bg-gray-50 text-sm lg:text-base xl:text-lg py-2.5 lg:py-3 xl:py-4">
                      Browse Enquiries
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Enhanced Header */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
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
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-normal text-white tracking-tighter text-center drop-shadow-2xl">
                Sell.
              </h1>
            </div>
            
            <div className="text-center mb-3 sm:mb-4 lg:mb-6">
              <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/90 max-w-2xl mx-auto px-2">
                Share your offer for: <span className="font-semibold">"{enquiry?.title}".</span>
              </p>
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
                        <span className="font-semibold text-gray-900">₹{existingSubmission.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge 
                          variant={existingSubmission.status === 'approved' ? 'default' : existingSubmission.status === 'rejected' ? 'destructive' : 'secondary'} 
                          className="ml-2 text-[10px] sm:text-xs"
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
                      <Button className="w-full bg-black hover:bg-gray-900 text-white text-xs sm:text-sm py-2.5">
                        View Dashboard
                      </Button>
                    </Link>
                    <Link to="/enquiries" className="flex-1">
                      <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm py-2.5">
                        Find More Requests
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Enquiry Display */}
          <Card className="mb-6 sm:mb-8 card-premium overflow-hidden border-[0.5px] border-black rounded-2xl">
            <CardHeader className="bg-black p-3 sm:p-4">
              {/* Title and Category Row */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                {enquiry.idFrontImage || enquiry.idBackImage ? (
                    <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      <span className="text-[10px] sm:text-xs text-white font-medium">
                        Trust badge
                      </span>
                    </>
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Enquiry Details
                  </p>
                )}
                </div>
                <Badge variant="secondary" className="bg-white/90 text-gray-800 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full">
                  {enquiry.category}
                </Badge>
              </div>

              {/* Date and Status Row */}
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                {/* Date */}
                <div className="flex items-center text-[10px] sm:text-xs text-gray-300">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                  {enquiry.createdAt && (
                    <span>Posted {formatDate(enquiry.createdAt.toDate().toISOString())}</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center text-[10px] sm:text-xs text-green-400">
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                  Live & Active
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Title and Description Section */}
                <div className="space-y-2 sm:space-y-2.5">
                  <h3 className="text-sm sm:text-lg font-bold text-gray-800 flex items-start gap-2">
                    <span className="text-base sm:text-xl flex-shrink-0">🎯</span> 
                    <span>Need: {enquiry.title}</span>
                  </h3>
                  <p className="text-[11px] sm:text-sm text-gray-600 leading-relaxed pl-6 sm:pl-8">
                    {enquiry.description}
                  </p>
                </div>
                
                  {/* Deadline */}
                  {enquiry.deadline && (
                  <div className="flex items-center px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg border-[0.5px] shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)]" style={{ backgroundColor: '#800020', borderColor: '#6b0019' }}>
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white mr-2 flex-shrink-0" />
                    <span className="text-[11px] sm:text-xs text-white font-bold">
                        Deadline: {formatDate(enquiry.deadline)}
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Response Form */}
          {!hasAlreadySubmitted && (
            <Card className="mb-6 sm:mb-8 card-premium overflow-hidden border-[0.5px] border-black rounded-2xl">
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
                <Label htmlFor="title" className="text-sm sm:text-lg font-black text-black flex items-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-black" />
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
                    className="h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch pl-4 pr-4 bg-gradient-to-br from-gray-100 to-gray-200 cursor-not-allowed shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10 font-bold text-lg"
                    style={{ fontSize: '16px' }}
                    required
                  />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
              </div>

              {/* Enhanced Product Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base sm:text-lg font-black text-black flex items-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-black" />
                  <span className="text-black">
                    Detailed Description *
                  </span>
                </Label>
                <p className="text-[10px] sm:text-sm text-black">
                  Explain it like to a 5 year-old.
                </p>
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Tell buyers about your product/service, pricing, availability, and any other important details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`min-h-[140px] text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch pl-4 pr-4 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10 ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    style={{ fontSize: '16px' }}
                  />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.description}
                    </span>
                  )}
                  <span className="text-xs text-black ml-auto">
                    {description.length}/500
                  </span>
                </div>
              </div>

              {/* Enhanced Price Field */}
              <div className="space-y-3">
                <Label htmlFor="price" className="text-sm sm:text-lg font-black text-black flex items-center">
                  <span className="text-lg sm:text-2xl mr-2 sm:mr-3 text-black">₹</span>
                  <span className="text-black">
                    Your Price *
                  </span>
                </Label>
                
                {/* Enquiry Budget Display */}
                {enquiry && (
                  <div className="border-4 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1 mb-3" style={{ backgroundColor: '#800020', borderColor: '#6b0019' }}>
                    <div className="flex flex-row items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-xs text-white font-semibold">Buyer's Budget:</span>
                      <span className="text-sm sm:text-base font-bold text-white">₹{enquiry.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/90 mt-1 sm:mt-0.5">
                      Remember, you're here to close a deal.
                    </p>
                  </div>
                )}
                
                <div className="relative">
                  <Input
                    id="price"
                    placeholder="Enter amount (e.g., 50000)"
                    value={price}
                    onChange={(e) => {
                      // Remove non-numeric characters and format with commas
                      const value = e.target.value.replace(/[^\d]/g, '');
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
                    className={`h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch pl-4 pr-4 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10 text-lg font-semibold ${errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
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
                  <span className="text-[8px] sm:text-sm text-black ml-auto">
                    Attracts buyers. Ahhh… Whatever -Your Product, Your Price
                  </span>
                </div>
              </div>

              {/* Form Progress Indicator */}
              <div className="pt-4 space-y-3 border-4 border-black rounded-lg p-4">
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
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Fill in the details and price to share your offer
                </p>
              </div>

              {/* Separator */}
              <Separator className="my-12 sm:my-16 bg-gray-300 h-[2px]" />

              {/* Enhanced Additional Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm sm:text-lg font-black text-black flex items-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-black" />
                  <span className="text-black">
                    Additional Information (Optional)
                  </span>
                </Label>
                <p className="text-[8px] sm:text-sm text-black">
                  Payment Terms, Delivery Details, Warranties, Or Any Special Conditions
                </p>
                <div className="relative">
                  <Textarea
                    id="notes"
                    placeholder="• Payment terms (cash, installments, etc.)&#10;• Delivery/pickup details&#10;• Warranty or return policy&#10;• Special conditions or requirements"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch pl-4 pr-4 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                    style={{ fontSize: '16px' }}
                  />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
                <span className="text-[10px] sm:text-xs text-black">
                  {notes.length}/300 characters
                </span>
              </div>

              {/* Separator */}
              <Separator className="my-8" />

              {/* Enhanced 5-Slot Image Upload */}
              <div className="space-y-6">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                    <h3 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Product Images
                    </h3>
                    <span className="text-xs sm:text-sm text-black font-medium">(optional)</span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-black">
                    Show Them Who You Are And What You've Got.
                  </p>
                  <div className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-black font-medium">
                    {imageUrls.filter(url => url.trim() !== "").length}/5 images uploaded
                  </div>
                </div>
                
                {/* 5-Slot Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="relative">
                      <label
                        htmlFor={`image-${index}`}
                        className={`flex flex-col items-center justify-center w-full h-28 sm:h-32 lg:h-36 border-[0.5px] border-black rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                          imageUrls[index]
                            ? 'border-green-300 bg-green-50 hover:border-green-400'
                            : 'bg-white hover:bg-gray-50 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                        }`}
                      >
                        {/* Physical button depth effect */}
                        {!imageUrls[index] && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                          </>
                        )}
                        <input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, index)}
                          className="hidden"
                        />
                        
                        {imageUrls[index] ? (
                          // Image Preview
                          <div className="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-4">
                            <div className="flex flex-col items-center justify-center">
                              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-1.5 sm:mb-2 relative z-10" />
                              <p className="text-[10px] sm:text-xs text-black font-black text-center relative z-10 mb-1">Image uploaded</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg z-20"
                            >
                              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                            {uploadProgresses[index] > 0 && uploadProgresses[index] < 100 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] sm:text-xs p-1 text-center">
                                {uploadProgresses[index]}%
                              </div>
                            )}
                          </div>
                        ) : (
                          // Upload Area
                          <div className="flex flex-col items-center justify-center p-3 sm:p-4">
                            {uploadProgresses[index] > 0 && uploadProgresses[index] < 100 ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mb-2"></div>
                                <p className="text-[10px] sm:text-xs text-slate-600">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-black mb-1.5 sm:mb-2 relative z-10" />
                                <p className="text-[8px] sm:text-[9px] text-black font-black text-center relative z-10">Add Image</p>
                              </>
                            )}
                            {uploadProgresses[index] > 0 && uploadProgresses[index] < 100 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] sm:text-xs p-1 text-center">
                                {uploadProgresses[index]}%
                              </div>
                            )}
                          </div>
                        )}
                      </label>
                      
                      {/* Error Message */}
                      {errors[`image_${index}`] && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[10px] p-1 text-center rounded-b-xl">
                          Error
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Upload Guidelines */}
                {/*
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ImageIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Image Guidelines:</p>
                      <ul className="space-y-0.5">
                        <li>• Use clear, well-lit photos showing different angles</li>
                        <li>• First image will be used as the main product image</li>
                        <li>• JPEG, PNG, WebP formats supported (Max 5MB each)</li>
                        <li>• Higher quality images get better buyer response</li>
                      </ul>
                    </div>
                  </div>
                </div>
                */}
                
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
                      const slotNumber = parseInt(key.split('_')[1]);
                      const isUploading = uploadProgresses[slotNumber] > 0 && uploadProgresses[slotNumber] < 100;
                      const isUploaded = imageUrls[slotNumber] && imageUrls[slotNumber].length > 0;
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

              {/* Profile Verification Status */}
              <div className="space-y-6">
                  {/* Show Verified Profile Badge */}
                  {!authLoading && isUserVerified ? (
                    <div className="p-3 sm:p-4 border border-black rounded-lg text-center" style={{ backgroundColor: '#004d00', borderColor: '#003300' }}>
                      <div className="inline-flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                        <Badge variant="secondary" className="bg-transparent text-white border-transparent text-[10px] sm:text-xs px-2 py-0.5">
                          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          You Already Have a Trust Badge
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    /* Show ID Upload for Unverified Users */
                    <>
                    </>
                  )}

                {/* ID Upload Form - Only show for unverified users - Matching Buyer Form Design */}
                {!authLoading && !isUserVerified && (
                  <div ref={idVerificationCardRef} className={`relative space-y-4 sm:space-y-5 p-4 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-50 to-white ${verifyingId ? 'border-0' : 'border-2 border-black'} rounded-xl w-full max-w-full overflow-visible`}>
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
                        
                        {/* Countdown - Large Transparent Overlapping */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div 
                            className="text-[120px] sm:text-[180px] lg:text-[220px] font-black text-white/20 tabular-nums animate-pulse select-none"
                            style={{
                              WebkitTextStroke: '1px #000000'
                            } as React.CSSProperties}
                          >
                            {verificationCountdown}
                          </div>
                        </div>
                        
                        {/* Verifying Text - Bottom */}
                        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center w-full px-6">
                          <p className="text-sm sm:text-base text-gray-700 font-semibold mb-1">
                            Verifying your ID...
                          </p>
                          <p className="text-[7px] sm:text-[10px] text-gray-600 font-medium leading-tight">
                            Your ID remains securely encrypted and will be verified within a few minutes.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1 w-full">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 flex-1 min-w-0 pr-2">
                        <h3 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black text-left break-words">
                          <span className="block">Trust</span>
                          <span className="block">Badge</span>
                        </h3>
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-black flex items-center">
                              <span className="text-black">(</span><CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-blue-600" /><span className="text-black">)</span>
                            </span>
                            <span className="text-[6px] sm:text-[7px] text-blue-600 font-medium whitespace-nowrap">Blue Badge For This Response.</span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-black font-bold flex-shrink-0 text-right mt-1 sm:mt-2">
                          (optional)
                        </span>
                      </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                          <div className="space-y-2.5 w-full">
                            <Label htmlFor="govIdType" className="text-xs sm:text-sm font-semibold text-slate-700">
                              ID Document Type
                            </Label>
                            <div className="relative">
                              <Select value={govIdType} onValueChange={(value) => {
                                setGovIdType(value);
                                if (govIdNumber && value) {
                                  validateIdNumber(govIdNumber, value);
                                } else {
                                  setErrors(prev => ({ ...prev, govIdNumber: "" }));
                                }
                                setIdVerificationResult(null);
                              }} disabled={verifyingId}>
                                <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border border-black focus:border-black focus:ring-black w-full relative z-10 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]" disabled={verifyingId}>
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
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-md pointer-events-none z-0" />
                            </div>
                            {errors.govIdType && (
                              <span className="text-xs text-red-500 flex items-center">
                                <X className="h-3 w-3 mr-1" />
                                {errors.govIdType}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2.5 w-full">
                            <Label htmlFor="govIdNumber" className="text-xs sm:text-sm font-semibold text-slate-700">
                              ID Number
                            </Label>
                            <div className="relative">
                              <Input
                                id="govIdNumber"
                                placeholder={govIdType === 'aadhaar' ? "Enter 12 digits (e.g., 1234 5678 9012)" : "Enter ID number"}
                                value={govIdNumber}
                                onChange={(e) => {
                                  let value = e.target.value.toUpperCase();
                                  
                                  // Auto-format Aadhaar: add space after every 4 digits
                                  if (govIdType === 'aadhaar') {
                                    // Remove all spaces first
                                    const digitsOnly = value.replace(/\s/g, '');
                                    // Add space after every 4 digits
                                    value = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
                                  }
                                  
                                  setGovIdNumber(value);
                                  // Clear verification result when user changes the ID number
                                  setIdVerificationResult(null);
                                  // Clear any existing errors for ID number
                                  setErrors(prev => ({ ...prev, govIdNumber: "" }));
                                  // Validate the new value
                                  if (govIdType) {
                                    validateIdNumber(value, govIdType);
                                  }
                                }}
                                className="h-10 sm:h-12 text-xs sm:text-sm border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch pl-4 pr-4 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] w-full relative z-10"
                                disabled={verifyingId}
                              />
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                            </div>
                            {errors.govIdNumber && !idVerificationResult && (
                              <span className="text-xs text-red-500 flex items-center">
                                <X className="h-3 w-3 mr-1" />
                                {errors.govIdNumber}
                              </span>
                            )}
                            {/* ID Verification Status */}
                            {verifyingId && (
                              <div ref={inlineVerificationRef} className="flex flex-col items-center justify-center gap-3 sm:gap-4 mt-2 p-4 sm:p-6 bg-black rounded-lg w-full">
                                {totalElapsedSeconds >= 120 ? (
                                  <span className="text-base sm:text-lg font-bold text-white text-center">Refresh</span>
                                ) : (
                                  <>
                                    <span className="text-xs sm:text-sm font-medium text-white mb-2">Verifying</span>
                                    <div className="bg-white/20 backdrop-blur-sm p-4 sm:p-5 rounded-lg">
                                      <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums animate-pulse">
                                        {verificationCountdown}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            {idVerificationResult && !verifyingId && (
                              <div className={`flex items-start gap-1.5 sm:gap-2 mt-1 ${
                                idVerificationResult.matches ? 'text-blue-600' : 'text-red-600'
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
                        
                        {/* ID Upload - Side by Side on Mobile */}
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
                                  // Keep backward compatibility with govIdUrl
                                  if (!govIdUrl) setGovIdUrl(uploadedUrl);
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
                            
                              {/* Upload Button - Full Width with Black Border */}
                            <label
                              htmlFor="idFront"
                                className={`w-full h-14 border border-black rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer touch-manipulation relative overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] ${
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
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none z-0" />
                              <div className="flex items-center gap-2 relative z-10">
                                <Upload className="h-5 w-5 text-slate-600" />
                                <span className="text-sm text-slate-700 font-semibold">Upload</span>
                              </div>
                            </label>
                              </div>
                          )}
                          
                          {/* Image Upload Status - Sleek Design */}
                          {(idFrontImage || idFrontUrl) && (
                            <div className="w-full border-[0.5px] border-black rounded-xl p-2 sm:p-5 flex items-center justify-between shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 bg-gradient-to-r from-black via-gray-900 to-black relative overflow-hidden">
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none z-0" />
                              <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0 relative z-10">
                                {/* Success Icon with Animation */}
                                <div className="flex-shrink-0 w-6 h-6 sm:w-11 sm:h-11 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                                  <CheckCircle className="h-3.5 w-3.5 sm:h-6 sm:w-6 text-white animate-pulse" style={{ animationDuration: '2s' }} />
                              </div>
                                
                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] sm:text-lg font-bold text-white truncate leading-tight">ID Image Uploaded</p>
                                  <p className="text-[8px] sm:text-sm text-gray-300 mt-0">Ready for verification</p>
                                </div>
                              </div>
                              
                              {/* Remove Button - Sleek Design */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIdFrontImage(null);
                                  setIdFrontUrl("");
                                  if (govIdUrl === idFrontUrl) setGovIdUrl("");
                                  setIdVerificationResult(null);
                                }}
                                className="flex-shrink-0 ml-1.5 sm:ml-3 rounded-lg p-1.5 sm:p-3 hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group relative z-10"
                                style={{ backgroundColor: '#dc2626' }}
                                disabled={verifyingId}
                                aria-label="Remove image"
                              >
                                <X className="h-3.5 w-3.5 sm:h-6 sm:w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Upload ID for Trust Badge Button */}
                        {(idFrontImage || idFrontUrl) && govIdType && govIdNumber && (!idVerificationResult || !idVerificationResult.matches) && (
                          <div className="mt-4 sm:mt-5">
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!govIdType) {
                                  toast({
                                    title: "ID Type Required",
                                    description: "Please select an ID document type.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                if (!govIdNumber || govIdNumber.trim() === '') {
                                  toast({
                                    title: "ID Number Required",
                                    description: "Please enter your ID number.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                setVerifyingId(true);
                                setVerificationCountdown(60); // Reset countdown to 60 seconds
                                setErrors(prev => ({ ...prev, govIdNumber: "" }));
                                
                                // Scroll inline verification countdown into view on mobile (non-intrusive)
                                setTimeout(() => {
                                  if (inlineVerificationRef.current) {
                                    inlineVerificationRef.current.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'center',
                                      inline: 'nearest'
                                    });
                                  }
                                }, 200);
                                
                                try {
                                  // Upload image if not already uploaded
                                  let frontImageUrl: string | null = null;
                                  
                                  if (idFrontImage && !idFrontUrl) {
                                    frontImageUrl = await uploadToCloudinaryUnsigned(idFrontImage);
                                    setIdFrontUrl(frontImageUrl);
                                  } else {
                                    frontImageUrl = idFrontUrl || null;
                                  }
                                  
                                  // Use front image for backward compatibility with govIdUrl
                                  if (frontImageUrl && !govIdUrl) setGovIdUrl(frontImageUrl);
                                  
                                  if (!frontImageUrl) {
                                    toast({
                                      title: "Upload Error",
                                      description: "Failed to upload ID image. Please try again.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const verification = await verifyIdNumberMatch(
                                    frontImageUrl,
                                    govIdNumber,
                                    govIdType
                                  );
                                  
                                  setIdVerificationResult(verification);
                                  
                                  if (!verification.matches) {
                                    setErrors(prev => ({ 
                                      ...prev, 
                                      govIdNumber: verification.error || 'ID number does not match the image(s)' 
                                    }));
                                    toast({
                                      title: "ID Verification Failed",
                                      description: verification.error || "ID number does not match the uploaded image(s).",
                                      variant: "destructive",
                                    });
                                  } else {
                                    setErrors(prev => ({ ...prev, govIdNumber: "" }));
                                    toast({
                                      title: "Verification Successful",
                                      description: "Your ID has been verified!",
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error verifying ID:', error);
                                  toast({
                                    title: "Verification Error",
                                    description: "Failed to verify ID number. Please try again.",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setVerifyingId(false);
                                }
                              }}
                              disabled={!govIdType || !govIdNumber || (!idFrontImage && !idFrontUrl) || verifyingId}
                              className="!w-full !h-12 sm:!h-14 !text-sm sm:!text-base !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
                            >
                              {/* Physical button depth effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                              {verifyingId ? (
                                <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                                  {/* Countdown Square - No Borders */}
                                  <div className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-2.5 rounded-lg">
                                    <span className="text-2xl sm:text-2xl font-bold text-white tabular-nums animate-pulse">
                                      {verificationCountdown}
                                    </span>
                                  </div>
                                  <span className="text-white font-semibold text-sm sm:text-base">Verifying ID...</span>
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                  <span className="text-white">Upload ID for Trust Badge</span>
                                </span>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

              </div>

              {/* Enhanced Submit Button */}
              <div className="pt-6 space-y-4">
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
                  className={`!w-full !h-16 !text-lg !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={!price || submitting}
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="text-white">Submitting Response...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <CheckCircle className="h-5 w-5 text-white" />
                      <span className="text-white">Submit Offer</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-[8px] sm:text-[10px] text-center text-muted-foreground">
                  By submitting, you agree to our terms and confirm all information is accurate
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


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
import { ArrowLeft, Upload, Shield, CheckCircle, Clock, AlertTriangle, UserCheck, Star, Verified, Lock, Eye, ImageIcon, FileText, Loader2, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { db } from "@/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
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
      
      // Update the enquiry to increment response count
      if (enquiry) {
        const enquiryRef = doc(db, 'enquiries', enquiryId!);
        await updateDoc(enquiryRef, {
          responses: (enquiry.responses || 0) + 1,
          lastResponseAt: serverTimestamp()
        });
      }
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
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-green-600" />
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
                  <div className="inline-flex items-center px-3 py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 bg-green-50 text-green-700 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg font-medium mb-6 lg:mb-8 xl:mb-10 border-2 border-green-200">
                    <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 mr-1.5" />
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
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <button onClick={() => window.history.back()} className="inline-flex items-center text-[10px] sm:text-xs lg:text-sm text-white/80 hover:text-white transition-all">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Back to Enquiries
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-white mb-2 sm:mb-3 lg:mb-4 px-2">
                SELL
              </h1>
              <p className="text-[11px] sm:text-sm lg:text-lg text-white/90 max-w-2xl mx-auto px-2 mb-3 sm:mb-4 lg:mb-6">
                Share your offer for: <span className="font-semibold">"{enquiry?.title}"</span>
              </p>
              <div className="mt-3 sm:mt-4 lg:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 text-[10px] sm:text-xs lg:text-sm text-white/80 px-2">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center">
                  <Verified className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span>Admin Reviewed</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span>Confidential</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Already Submitted Message */}
          {hasAlreadySubmitted && existingSubmission && (
            <Card className="mb-6 sm:mb-8 border-4 border-black bg-white rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">
                    You've Already Submitted an Offer
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-5">
                    You have already submitted an offer for this enquiry
                  </p>
                  
                  {/* Offer Details */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-5 text-left">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3">Your Submitted Offer</h4>
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
          <Card className="mb-6 sm:mb-8 card-premium overflow-hidden border-4 border-black rounded-2xl">
            <CardHeader className="bg-black p-3 sm:p-4">
              {/* Title and Category Row */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                {enquiry.idFrontImage || enquiry.idBackImage ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Enquiry Details
                  </p>
                )}
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
                
                {/* Deadline and Trust Badge */}
                <div className="space-y-2 sm:space-y-2.5">
                  {/* Deadline */}
                  {enquiry.deadline && (
                    <div className="flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 mr-1.5 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs text-red-700 font-medium">
                        Deadline: {formatDate(enquiry.deadline)}
                      </span>
                    </div>
                  )}
                  
                  {/* Trust Badge */}
                  {enquiry.idFrontImage ? (
                    <div className="flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs text-blue-700 font-medium">
                        This buyer has a trust badge
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Response Form */}
          {!hasAlreadySubmitted && (
            <Card className="card-premium overflow-hidden border-4 border-black rounded-2xl">
            <CardHeader className="bg-black border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-pal-blue rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Your Offer</h2>
              <p className="text-[10px] sm:text-base text-gray-300">
                    Your product, your rules, you're the king.
              </p>
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
                <Input
                  id="title"
                  value={title}
                  readOnly
                  disabled
                  className="h-12 input-touch font-bold text-lg bg-gray-100 cursor-not-allowed border-4 border-black"
                  required
                />
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
                <Textarea
                  id="description"
                  placeholder="Tell buyers about your product/service, pricing, availability, and any other important details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`min-h-[140px] input-touch placeholder:text-[8px] sm:placeholder:text-sm border-4 ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-black focus:border-black'}`}
                />
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
                  <div className="border-4 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1 mb-3" style={{ backgroundColor: '#ef4444', borderColor: '#dc2626' }}>
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
                    className={`h-12 text-lg font-semibold input-touch border-4 ${errors.price ? 'border-red-500 focus:border-red-500' : 'border-black focus:border-black'}`}
                  required
                />
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
                    Attracts buyers. Ahhh… whatever -your product, your price - you're the king.
                  </span>
                </div>
              </div>

              {/* Separator */}
              <Separator className="my-8" />

              {/* Enhanced Additional Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm sm:text-lg font-black text-black flex items-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-black" />
                  <span className="text-black">
                    Additional Information (Optional)
                  </span>
                </Label>
                <p className="text-[8px] sm:text-sm text-black">
                  Include payment terms, delivery details, warranties, or any special conditions
                </p>
                <Textarea
                  id="notes"
                  placeholder="• Payment terms (cash, installments, etc.)&#10;• Delivery/pickup details&#10;• Warranty or return policy&#10;• Special conditions or requirements"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] input-touch placeholder:text-[8px] sm:placeholder:text-sm border-4 border-black focus:border-black"
                />
                <span className="text-[10px] sm:text-xs text-black">
                  {notes.length}/300 characters
                </span>
              </div>

              {/* Separator */}
              <Separator className="my-8" />

              {/* Enhanced 5-Slot Image Upload */}
              <div className="space-y-6">
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
                    <h3 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                      Product Images
                    </h3>
                    <span className="text-xs sm:text-sm text-black font-medium">(optional)</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-black">
                    Show them who you are and what you've got.
                  </p>
                  <div className="mt-2 text-[10px] sm:text-xs text-black font-medium">
                    {imageUrls.filter(url => url.trim() !== "").length}/5 images uploaded
                  </div>
                </div>
                
                {/* 5-Slot Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="aspect-square">
                      <div className={`
                        relative h-full border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300
                        ${imageUrls[index] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-pal-blue hover:bg-pal-blue/5'}
                      `}>
                        {imageUrls[index] ? (
                          // Image Preview
                          <div className="relative h-full group">
                            <img 
                              src={imageUrls[index]} 
                              alt={`Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image display error:', imageUrls[index]);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                type="button" 
                                variant="destructive"
                                size="sm"
                                className="text-xs"
                                onClick={() => removeImage(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ) : (
                          // Upload Area
                          <div className="h-full flex flex-col items-center justify-center p-3 text-center">
                            <div className={`
                              w-8 h-8 mb-2 rounded-full flex items-center justify-center
                              ${uploadProgresses[index] > 0 ? 'bg-pal-blue' : 'bg-gray-100'}
                            `}>
                              {uploadProgresses[index] > 0 && uploadProgresses[index] < 100 ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <Upload className={`h-4 w-4 ${uploadProgresses[index] > 0 ? 'text-white' : 'text-gray-400'}`} />
                              )}
                            </div>
                            
                <Input
                              id={`image-${index}`}
                  type="file"
                  accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              className="hidden"
                            />
                            <Label 
                              htmlFor={`image-${index}`} 
                              className="cursor-pointer text-xs text-pal-blue hover:text-pal-blue-dark font-medium"
                            >
                              Add Image {index + 1}
                            </Label>
                            
                            {/* Upload Progress */}
                            {uploadProgresses[index] > 0 && uploadProgresses[index] < 100 && (
                              <div className="mt-2 w-full">
                                <Progress value={uploadProgresses[index]} className="h-1" />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {uploadProgresses[index]}%
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {errors[`image_${index}`] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[10px] p-1 text-center">
                            Error
                          </div>
                        )}
                      </div>
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
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-semibold text-xs sm:text-base">Profile Verified</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-green-700 mb-2 sm:mb-2.5">
                        Already verified. No ID upload needed.
                      </p>
                      <div className="inline-flex">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-[10px] sm:text-xs px-2 py-0.5">
                          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          Verified Response
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    /* Show ID Upload for Unverified Users */
                    <>
                      {govIdType && govIdNumber && (govIdUrl || idFrontUrl) && !idVerificationResult?.matches && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          ✓ Trust Badge Pending: Your ID will be verified when admin approves • You'll get trust badge benefits!
                        </p>
                      )}
                      {govIdType && govIdNumber && (govIdUrl || idFrontUrl) && !idVerificationResult?.matches && (
                        <div className="mt-1 flex items-center justify-center space-x-1">
                          <Verified className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          <span className="text-xs sm:text-xs text-green-600 font-medium">
                            Trust badge pending
                          </span>
                        </div>
                      )}
                    </>
                  )}

                {/* ID Upload Form - Only show for unverified users - Matching Buyer Form Design */}
                {!authLoading && !isUserVerified && (
                  <div ref={idVerificationCardRef} className="space-y-4 sm:space-y-5 p-8 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-50 to-white border-2 border-black rounded-xl w-full max-w-full overflow-visible">
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <h3 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black text-left break-words">
                          <span className="block">Trust</span>
                          <span className="block">Badge</span>
                        </h3>
                        <span className="text-xs sm:text-sm text-black font-bold flex-shrink-0">(optional)</span>
                      </div>
                      <p className="text-xs sm:text-xs text-slate-500 text-left mt-1">
                        <span className="text-[9px] sm:text-xs text-blue-600 font-medium">Blue tick only for this response.</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                          <div className="space-y-2.5 w-full">
                            <Label htmlFor="govIdType" className="text-xs sm:text-sm font-semibold text-slate-700">
                              ID Document Type
                            </Label>
                            <Select value={govIdType} onValueChange={(value) => {
                              setGovIdType(value);
                              if (govIdNumber && value) {
                                validateIdNumber(govIdNumber, value);
                              } else {
                                setErrors(prev => ({ ...prev, govIdNumber: "" }));
                              }
                              setIdVerificationResult(null);
                            }} disabled={verifyingId}>
                              <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black w-full" disabled={verifyingId}>
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
                              className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black w-full"
                              disabled={verifyingId}
                            />
                            {errors.govIdNumber && !idVerificationResult && (
                              <span className="text-xs text-red-500 flex items-center">
                                <X className="h-3 w-3 mr-1" />
                                {errors.govIdNumber}
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
                        
                        {/* ID Upload */}
                        <div className="space-y-2.5">
                          <Label htmlFor="idFront" className="text-xs sm:text-sm font-semibold text-slate-700">
                            ID Document
                          </Label>
                            <div className="relative">
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
                              <label
                                htmlFor="idFront"
                                className={`block w-full h-28 sm:h-32 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center text-center ${
                                  verifyingId
                                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                                    : idFrontImage || idFrontUrl
                                    ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md cursor-pointer'
                                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
                                }`}
                                onClick={(e) => {
                                  if (verifyingId) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {idFrontImage || idFrontUrl ? (
                                  <div className="space-y-2 px-3">
                                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 mx-auto" />
                                    <p className="text-xs sm:text-sm text-green-700 font-semibold">Uploaded</p>
                                    <p className="text-[10px] sm:text-xs text-green-600 truncate max-w-full">{idFrontImage?.name || 'Front ID'}</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2 px-3">
                                    <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-slate-500 mx-auto" />
                                    <p className="text-xs sm:text-sm text-slate-700 font-semibold">Click to upload</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Upload your ID document</p>
                                  </div>
                                )}
                              </label>
                            </div>
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
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                  Upload ID for Trust Badge
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

              </div>

              {/* Form Progress Indicator */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">Form Completion</h3>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{Math.round(formProgress)}% Complete</span>
                </div>
                <Progress value={formProgress} className="h-2" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Fill in the details and price to share your offer (title is auto-filled)
                </p>
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
                  className={`w-full h-16 text-lg font-bold rounded-xl btn-primary transition-all transform hover:scale-[1.02] ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={!price || submitting}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting Response...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Submit Offer</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                  By submitting, you agree to our terms and confirm all information is accurate
                </p>
              </div>
            </form>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerResponse;


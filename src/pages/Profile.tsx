import React, { useState, useEffect, useContext, useRef } from "react";
import { flushSync } from "react-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shield, User, Camera, CheckCircle, XCircle, Edit, Save, Trash2, Loader2, X, Tag, MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { db } from "@/firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, orderBy, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";
import { uploadToCloudinary, uploadToCloudinaryUnsigned } from "@/integrations/cloudinary";
import { realtimeAI } from "@/services/ai/realtimeAI";
import VerificationStatus from "@/components/VerificationStatus";
import { verifyIdNumberMatch, verifyIdNumberMatchBothSides } from '@/services/ai/idVerification';
import SecurityDashboard from "@/components/SecurityDashboard";
import { LoadingAnimation } from "@/components/LoadingAnimation";

const Profile = () => {
  const { user: authUser } = useAuth();
  const notificationContext = useContext(NotificationContext);
  const createNotification = notificationContext?.createNotification || (async () => {
    console.warn('NotificationContext not available');
  });
  
  // Profile states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // ID upload states
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [idVerificationResult, setIdVerificationResult] = useState<{matches: boolean; error?: string; extractedNumber?: string} | null>(null);
  const [idErrors, setIdErrors] = useState<{[key: string]: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedProfileId, setSubmittedProfileId] = useState<string | null>(null);
  const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const inlineVerificationRef = useRef<HTMLDivElement>(null);

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

  // SecurityDashboard data states
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [sellerSubmissions, setSellerSubmissions] = useState<any[]>([]);

  // Country codes for phone selection
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+66", country: "Thailand", flag: "🇹🇭" },
    { code: "+63", country: "Philippines", flag: "🇵🇭" },
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+34", country: "Spain", flag: "🇪🇸" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+216", country: "Tunisia", flag: "🇹🇳" }
  ];

  // Countdown timer for verification
  useEffect(() => {
    if (!verifyingId) {
      // Reset countdown when not verifying
      setVerificationCountdown(60);
      return;
    }

    // Ensure countdown starts at 60 when verification begins
    setVerificationCountdown(60);

    // Start countdown timer immediately - update every second
    const interval = setInterval(() => {
      setVerificationCountdown((prev) => {
        if (prev <= 1) {
          return 60; // Reset to 60 seconds if verification is still running
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verifyingId]);

  // Load profile data with REAL-TIME listener
  useEffect(() => {
    if (!authUser) return;
    
    console.log('🔄 Profile: Setting up real-time profile listener for:', authUser.uid);
    
    const profileRef = doc(db, 'userProfiles', authUser.uid);
    const unsubscribe = onSnapshot(profileRef, (profileDoc) => {
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log('🔄 Profile: Profile data updated (REALTIME):', profileData);
        setFullName(profileData.fullName || "");
        setPhone(profileData.phone || "");
        setCountryCode(profileData.countryCode || "+91");
        setIsProfileVerified(profileData.isProfileVerified || false);
        setVerificationStatus(profileData.verificationStatus || null);
      } else {
        console.log('🔄 Profile: No profile found, setting defaults');
        setIsProfileVerified(false);
        setVerificationStatus(null);
      }
    }, (error) => {
      console.error('Error in profile listener:', error);
      setIsProfileVerified(false);
      setVerificationStatus(null);
    });
    
    return () => {
      console.log('🔄 Profile: Cleaning up profile listener');
      unsubscribe();
    };
  }, [authUser]);

  // Load SecurityDashboard data
  useEffect(() => {
    if (!authUser) return;
    
    const loadSecurityData = async () => {
      try {
        // Load user's enquiries
        const enquiriesQuery = query(
          collection(db, 'enquiries'),
          where('userId', '==', authUser.uid),
          orderBy('createdAt', 'desc')
        );
        const enquiriesSnapshot = await getDocs(enquiriesQuery);
        const enquiriesData = enquiriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEnquiries(enquiriesData);

        // Load user's seller submissions
        const submissionsQuery = query(
          collection(db, 'sellerSubmissions'),
          where('sellerId', '==', authUser.uid),
          orderBy('createdAt', 'desc')
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSellerSubmissions(submissionsData);
      } catch (error) {
        console.error('Error loading security data:', error);
      }
    };
    
    loadSecurityData();
  }, [authUser]);

  // Handle profile save
  const handleProfileSave = async () => {
    if (!authUser || !fullName.trim() || !phone.trim()) return;
    
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        userId: authUser.uid,
        fullName: fullName.trim(),
        phone: phone.trim(),
        countryCode: countryCode,
        isProfileVerified: isProfileVerified,
        verificationStatus: verificationStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Exit edit mode after successful save
      setIsEditingProfile(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle edit button click
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // Handle trust badge removal click - opens confirmation dialog
  const handleRemoveTrustBadgeClick = () => {
    setShowRemoveConfirmDialog(true);
  };

  // Handle trust badge removal confirmation
  const handleRemoveTrustBadge = async () => {
    if (!authUser) return;

    setIsRemoving(true);
    try {
      const profileRef = doc(db, 'userProfiles', authUser.uid);
      // Use updateDoc with deleteField to properly remove fields
      await updateDoc(profileRef, {
        isProfileVerified: false,
        verificationStatus: deleteField(),
        idType: deleteField(),
        idNumber: deleteField(),
        frontImageUrl: deleteField(),
        backImageUrl: deleteField(),
        verificationRequestedAt: deleteField(),
        verificationDate: deleteField(),
        updatedAt: serverTimestamp()
      });

      // Close dialog
      setShowRemoveConfirmDialog(false);
      setIsRemoving(false);

      toast({
        title: "Trust Badge Removed",
        description: "Your trust badge has been removed. You'll need to re-upload your ID to get the trust badge again.",
      });
    } catch (error) {
      console.error('Error removing trust badge:', error);
      setIsRemoving(false);
      toast({
        title: "Removal Failed",
        description: "Failed to remove trust badge. Please try again.",
        variant: "destructive",
      });
    }
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
      setIdFront(file);
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

  // Handle ID upload - SIMPLE APPROACH
  const handleIdUpload = async () => {
    if (!idFrontUrl || !idType || !idNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload front ID image.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate ID format FIRST
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
        description: "Please fix the ID information errors before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if verification has passed (required before upload)
    if (!idFrontUrl) {
      toast({
        title: "Image Required",
        description: "Please upload the ID image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!idVerificationResult || !idVerificationResult.matches) {
      toast({
        title: "Verification Required",
        description: "Please verify your ID first by clicking the 'Verify' button.",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting ID upload process...');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Use existing idFrontUrl (already uploaded during image upload)
      const frontImageUrl = idFrontUrl;
      
      if (!frontImageUrl) {
        toast({
          title: "Image Required",
          description: "Please upload the ID image first.",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
      
      console.log('✅ Using existing uploaded image:', frontImageUrl);
      setUploadProgress(75);

      console.log('💾 Storing verification data in Firestore...');
      setUploadProgress(90);

      // SIMPLE: Update userProfiles collection with verification request
      const profileData = {
        userId: authUser.uid,
        fullName: fullName || authUser.displayName || "",
        phone: phone || "",
        isProfileVerified: false,
        verificationStatus: 'pending',
        idType: idType,
        idNumber: idNumber,
        frontImageUrl: frontImageUrl,
        backImageUrl: null, // Removed back image requirement
        // Store OCR verification result - MANDATORY for AI approval
        ocrVerification: {
          verified: idVerificationResult?.matches === true,
          matches: idVerificationResult?.matches === true,
          extractedNumber: idVerificationResult?.extractedNumber || null,
          confidence: idVerificationResult?.confidence || 0,
          error: idVerificationResult?.error || null,
          verifiedAt: serverTimestamp()
        },
        verificationRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📝 Profile data to store:', profileData);

      const profileRef = doc(db, 'userProfiles', authUser.uid);
      await setDoc(profileRef, profileData, { merge: true });
      console.log('✅ Profile verification request stored successfully in userProfiles');
      setSubmittedProfileId(authUser.uid);

      // 🤖 AI Processing - Runs in background without interrupting user experience
      // Process the profile verification with AI in real-time (non-blocking)
      console.log('🤖 Profile: Starting AI processing for profile verification:', authUser.uid);
      realtimeAI.processProfileVerification(authUser.uid, profileData, { front: frontImageUrl, back: null })
        .then((result) => {
          if (result.success) {
            console.log('✅ AI: Profile auto-verified instantly!');
            // Create notification for successful verification
            createNotification('achievement', {
              title: '🎉 Trust Badge Verified!',
              message: 'Your profile has been verified and you now have a trust badge!',
              priority: 'high',
              actionUrl: '/profile',
              actionText: 'View Profile'
            });
          } else if (result.action === 'flagged') {
            console.log('⏳ AI: Profile flagged for manual review');
            // Create notification for manual review
            createNotification('enquiry_update', {
              title: '⏳ Trust Badge Under Review',
              message: 'Your profile verification is being reviewed by our team. You will be notified when approved.',
              priority: 'medium',
              actionUrl: '/profile',
              actionText: 'View Profile'
            });
          } else {
            console.log('❌ AI: Profile auto-rejected');
            // Create notification for rejection
            createNotification('enquiry_update', {
              title: '❌ Trust Badge Not Approved',
              message: 'Your profile verification was not approved. Please try again with clearer ID images.',
              priority: 'medium',
              actionUrl: '/profile',
              actionText: 'Try Again'
            });
          }
        })
        .catch((error) => {
          console.error('🤖 AI: Error processing profile verification:', error);
          // Create notification for error
          createNotification('enquiry_update', {
            title: '❌ Verification Error',
            message: 'There was an error processing your verification. Please try again.',
            priority: 'medium',
            actionUrl: '/profile',
            actionText: 'Try Again'
          });
        });

      // Update local state
      setVerificationStatus('pending');
      setIsProfileVerified(false);

      setUploadProgress(100);
      toast({
        title: "ID Upload Successful!",
        description: "Your ID has been uploaded and is pending admin review. You'll get a verified badge once approved.",
      });

      // Reset form
      setIdFront(null);
      setIdType("");
      setIdNumber("");

      console.log('🎉 ID upload process completed successfully!');

    } catch (error) {
      console.error('❌ Error uploading ID:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Keep progress at 100 for a moment to show completion
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  if (!authUser) {
    return <LoadingAnimation message="Loading your profile" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Seller Form Background - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
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
            
            {/* Profile Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-base sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight text-center">
                    Profile
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <h2 className="text-[10px] sm:text-xs lg:text-sm font-bold text-white tracking-tight inline-flex items-center gap-2 sm:gap-3">
                    {fullName || authUser.displayName || "User"}
                    {isProfileVerified && (
                      <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white" />
                    )}
                  </h2>
                </div>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  {authUser.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form - Inside Container */}
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Profile Form */}
        <Card className="mt-6 sm:mt-8 border-4 border-black lg:min-h-[200px]">
          <CardHeader className="p-4 sm:p-6 lg:p-5 lg:pb-4">
            <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">It's better to know you better if you're here to scam others</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-5 lg:pt-4">
            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-8 sm:h-10 border-2 border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                  disabled={!isEditingProfile}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-slate-700">Phone Number *</Label>
                <div className="flex gap-1 sm:gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode} disabled={!isEditingProfile}>
                    <SelectTrigger className="w-14 sm:w-16 h-8 sm:h-10 border-2 border-black focus:border-black focus:ring-black" disabled={!isEditingProfile}>
                      <SelectValue placeholder="Code">
                        {countryCode && (
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-xs">{countryCodes.find(c => c.code === countryCode)?.flag}</span>
                            <span className="font-medium text-[10px] sm:text-xs">{countryCode}</span>
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm">{country.flag}</span>
                            <span className="font-medium text-xs sm:text-sm">{country.code}</span>
                            <span className="text-[10px] sm:text-xs text-slate-500">{country.country}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1 h-8 sm:h-10 border-2 border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                    disabled={!isEditingProfile}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-1 sm:space-x-2">
              {isEditingProfile ? (
                <Button 
                  onClick={handleProfileSave}
                  disabled={!fullName.trim() || !phone.trim()}
                  variant="outline"
                  className="h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 !bg-white !text-black !border-black hover:!bg-white hover:!text-black focus:!bg-white focus:!text-black active:!bg-white disabled:!bg-gray-100 disabled:!text-gray-400"
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-black" />
                  Save Changes
                </Button>
              ) : null}
              {!isEditingProfile ? (
                <Button 
                  onClick={handleEditProfile}
                  variant="outline"
                  className="h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 border-4 border-black bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-black font-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/edit rounded-lg sm:rounded-xl"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/edit:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-black relative z-10" />
                  <span className="relative z-10">Edit</span>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Trust Badge Section - SIMPLE & CLEAN */}
        <Card className="mt-4 sm:mt-6 border-4 border-black shadow-lg rounded-3xl sm:rounded-2xl bg-white lg:min-h-[200px]">
          {/* Card Header - Black Background */}
          <div className="bg-black px-4 sm:px-4 py-3.5 sm:py-4 lg:px-5 lg:py-4 rounded-t-3xl sm:rounded-t-2xl">
            <h2 className="text-sm sm:text-sm md:text-base font-bold text-white flex items-center gap-2.5">
              <Shield className="h-4 w-4 sm:h-4 sm:w-4" />
              Trust Badge (Optional)
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-300 mt-1.5">
              Make all enquires and responses verified.
            </p>
          </div>
          {/* Card Content - Enhanced White Background */}
          <CardContent className="p-4 sm:p-5 lg:p-5 lg:pt-4 space-y-4 sm:space-y-6 lg:space-y-4 relative">
            
            {/* Loading Animation - Distorted Blue Tick Forming */}
            {verifyingId && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-b-3xl sm:rounded-b-2xl z-50 p-6 sm:p-8 overflow-hidden">
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
            
            {/* VERIFIED PROFILE - Show only success message */}
            {verificationStatus === 'approved' && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-4 border-blue-500 rounded-t-none rounded-b-xl text-center -m-4 sm:-m-5 lg:-m-5 lg:-mt-4 p-4 sm:p-5 lg:p-5 lg:pt-4">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-400 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-white mb-2">Profile Verified!</h3>
                <div className="mt-3 sm:mt-4">
                  <Badge variant="secondary" className="bg-blue-400 text-white border-blue-300 text-xs sm:text-sm">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Verified Profile
                  </Badge>
                </div>
                <div className="mt-4 sm:mt-5">
                  <Button
                    onClick={handleRemoveTrustBadgeClick}
                    variant="outline"
                    className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 !bg-red-600 !text-white !border-red-800 hover:!bg-red-700"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-white" />
                    Remove Trust Badge
                  </Button>
                </div>
              </div>
            )}

            {/* PENDING VERIFICATION */}
            {verificationStatus === 'pending' && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 sm:p-6 text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-[20px] border-yellow-500 border-t-transparent"></div>
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-yellow-800 mb-2">Verification Pending</h3>
                <p className="text-yellow-700 text-xs sm:text-sm">
                  Your ID has been uploaded and is under admin review.
                </p>
                <div className="mt-4 sm:mt-5">
                  <Button
                    onClick={handleRemoveTrustBadgeClick}
                    variant="outline"
                    className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 !bg-red-600 !text-white !border-red-800 hover:!bg-red-700"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-white" />
                    Remove Trust Badge
                  </Button>
                </div>
              </div>
            )}

            {/* REJECTED VERIFICATION - Only show if image is actually unclear/blurry (OCR error indicates unclear image) */}
            {verificationStatus === 'rejected' && 
             (!idVerificationResult || !idVerificationResult.matches) && 
             idVerificationResult?.error && 
             (idVerificationResult.error.toLowerCase().includes('unclear') || 
              idVerificationResult.error.toLowerCase().includes('blur') ||
              idVerificationResult.error.toLowerCase().includes('not clear') ||
              idVerificationResult.error.toLowerCase().includes('image quality')) && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 sm:p-6 text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-red-800 mb-2">Verification Rejected</h3>
                <p className="text-red-700 text-xs sm:text-sm">
                  Your trust badge request was rejected. Please upload a clearer image and try again.
                </p>
              </div>
            )}

            {/* ID VERIFICATION SUCCESS - Deconstructed Blue Tick Animation */}
            {idVerificationResult && idVerificationResult.matches && !verifyingId && verificationStatus !== 'approved' && (
              <div className="p-6 sm:p-8 bg-white rounded-lg flex flex-col items-center justify-center text-center overflow-visible mb-4 sm:mb-6">
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center mb-4 sm:mb-5 shadow-lg relative rounded-full"
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
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter leading-none font-heading text-black mb-2">
                  ID Verified Successfully!
                </h3>
              </div>
            )}

            {/* UPLOAD FORM - Hide after profile is verified or when verification succeeds (only show for unverified users) */}
            {!isProfileVerified && 
             verificationStatus !== 'approved' && 
             verificationStatus !== 'verified' && 
             verificationStatus !== 'completed' && 
             !(idVerificationResult && idVerificationResult.matches && !verifyingId) &&
             (!verificationStatus || verificationStatus === 'rejected') ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idType" className="text-xs sm:text-sm">ID Type</Label>
                        <Select value={idType} onValueChange={(value) => {
                          setIdType(value);
                          if (idNumber && value) {
                            validateIdNumber(idNumber, value);
                          } else {
                            setIdErrors(prev => ({ ...prev, idNumber: "" }));
                          }
                          setIdVerificationResult(null);
                        }} disabled={verifyingId || isUploading}>
                      <SelectTrigger className="h-8 sm:h-10 border border-black focus:border-black focus:ring-black" disabled={verifyingId || isUploading}>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="voter_id">Voter ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idNumber" className="text-xs sm:text-sm">ID Number</Label>
                    <Input
                      id="idNumber"
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
                      placeholder={idType === 'aadhaar' ? "Enter 12 digits (e.g., 1234 5678 9012)" : "Enter ID number"}
                      className="h-8 sm:h-10 border-2 border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                      disabled={verifyingId || isUploading}
                    />
                    {idErrors.idNumber && !idVerificationResult && (
                      <span className="text-xs text-red-500 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        {idErrors.idNumber}
                      </span>
                    )}
                    {/* ID Verification Status - Enhanced Design */}
                    {verifyingId && (
                      <div ref={inlineVerificationRef} className="mt-2 sm:mt-3 p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Animated Spinner */}
                          <div className="relative flex-shrink-0">
                        <div 
                              className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-blue-200 border-t-blue-600 rounded-full flex-shrink-0"
                          style={{
                                animation: 'spin 0.8s linear infinite',
                                WebkitAnimation: 'spin 0.8s linear infinite'
                          }}
                        ></div>
                            <div 
                              className="absolute inset-0 h-8 w-8 sm:h-10 sm:w-10 border-4 border-transparent border-r-purple-500 rounded-full opacity-50"
                              style={{
                                animation: 'spin 1.2s linear infinite reverse',
                                WebkitAnimation: 'spin 1.2s linear infinite reverse'
                              }}
                            ></div>
                          </div>
                          
                          {/* Text and Countdown */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-semibold text-blue-700">
                                Verifying ID number with image...
                              </span>
                              {/* Animated Countdown Badge */}
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-600 text-white rounded-full shadow-sm">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-[10px] sm:text-xs font-bold tabular-nums">
                                  {verificationCountdown}s
                                </span>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${((60 - verificationCountdown) / 60) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {idVerificationResult && !verifyingId && !idVerificationResult.matches && (
                      <div className="flex items-start gap-1.5 sm:gap-2 mt-1 text-red-600">
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words leading-relaxed text-[10px] sm:text-sm">{idVerificationResult.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Upload - Single Slot with Camera */}
                <div className="space-y-2.5">
                  <Label htmlFor="idFront" className="text-xs sm:text-sm font-semibold text-slate-700">
                    ID Document *
                  </Label>
                  
                  {/* Upload Button - Shows native mobile options (Choose image, Take photo, etc.) */}
                  <div className="mb-3 sm:mb-2">
                    <input
                      type="file"
                      id="idFront"
                      accept="image/*"
                      disabled={verifyingId || isUploading || (idFront || idFrontUrl)}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIdFront(file);
                        setIdErrors(prev => ({ ...prev, idFront: "" }));
                        setIdVerificationResult(null);
                        
                        try {
                          const uploadedUrl = await uploadToCloudinaryUnsigned(file);
                          setIdFrontUrl(uploadedUrl);
                          setIdVerificationResult(null);
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
                        verifyingId || isUploading || (idFront || idFrontUrl)
                          ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                          : 'border-black bg-white hover:border-black hover:bg-blue-50/30 active:bg-blue-100 active:scale-[0.98]'
                      }`}
                      onClick={(e) => {
                        if (verifyingId || isUploading || (idFront || idFrontUrl)) {
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
                  
                  {/* Image Upload Status - Text Only */}
                  {(idFront || idFrontUrl) && (
                    <div className="w-full border-2 rounded-xl p-4 sm:p-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                        <span className="text-sm sm:text-base font-semibold text-white">Image uploaded</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIdFront(null);
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

                {/* Improved Progress Bar */}
                {uploadProgress > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="mb-2">
                      <div className="flex justify-between text-xs sm:text-sm text-blue-700 mb-1">
                        <span className="font-bold">Uploading ID...</span>
                        <span className="font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-[20px] border-blue-500 border-t-transparent"></div>
                      <span className="font-bold">
                        {uploadProgress < 25 && "Preparing upload..."}
                        {uploadProgress >= 25 && uploadProgress < 75 && "Uploading ID..."}
                        {uploadProgress >= 75 && uploadProgress < 100 && "Saving to database..."}
                        {uploadProgress === 100 && "Upload complete!"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Combined Verify & Upload Button */}
                <Button
                  onClick={async () => {
                    // If verification hasn't passed, verify first
                    if (!idVerificationResult || !idVerificationResult.matches) {
                      // Verify step - check if we have file or URL
                      if ((!idFront && !idFrontUrl) || !idType || !idNumber) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all required fields and upload ID image.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // CRITICAL: Set countdown and disable button FIRST - before any async operations
                      // This ensures immediate UI feedback
                      flushSync(() => {
                        setVerificationCountdown(60);
                        setVerifyingId(true);
                        setIdErrors(prev => ({ ...prev, idNumber: "" }));
                        setIdVerificationResult(null);
                      });
                      
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
                      
                      // Now do async operations (upload image if needed)
                      let imageUrl = idFrontUrl;
                      if (!imageUrl && idFront) {
                        try {
                          imageUrl = await uploadToCloudinaryUnsigned(idFront);
                          setIdFrontUrl(imageUrl);
                        } catch (error) {
                          console.error('Error uploading ID:', error);
                          setVerifyingId(false);
                          setVerificationCountdown(60);
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload image. Please try again.",
                            variant: "destructive",
                          });
                          return;
                        }
                      }
                      
                      if (!imageUrl) {
                        setVerifyingId(false);
                        setVerificationCountdown(60);
                        toast({
                          title: "Image Required",
                          description: "Please upload the ID image first.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validate format
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
                        setVerifyingId(false);
                        setVerificationCountdown(60);
                        setIdErrors(newErrors);
                        toast({
                          title: "ID Validation Error",
                          description: "Please fix the ID information errors before verifying.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        const verification = await verifyIdNumberMatch(
                          imageUrl,
                          idNumber,
                          idType
                        );
                        
                        setIdVerificationResult(verification);
                        
                        if (!verification.matches) {
                          setIdErrors(prev => ({ 
                            ...prev, 
                            idNumber: verification.error || 'ID number does not match the image' 
                          }));
                          toast({
                            title: "Verification Failed",
                            description: verification.error || "ID number does not match the uploaded image.",
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Verification Successful",
                            description: "ID Verified Successfully! Click Get Trust Badge Now",
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
                        setVerificationCountdown(60);
                      }
                    } else {
                      // Verification passed - user clicked button again to upload
                      // This is a SEPARATE click - only upload, do NOT verify again
                      handleIdUpload();
                    }
                  }}
                  disabled={
                    !idType || 
                    !idNumber || 
                    (!idFront && !idFrontUrl) || 
                    isUploading || 
                    verifyingId ||
                    (idErrors.idNumber && idErrors.idNumber.length > 0)
                  }
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm bg-black hover:bg-gray-900 text-white font-black rounded-2xl border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                  {verifyingId ? (
                    <>
                      <div 
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-white border-t-transparent rounded-full flex-shrink-0 relative z-10"
                        style={{
                          animation: 'spin 1s linear infinite',
                          WebkitAnimation: 'spin 1s linear infinite'
                        }}
                      ></div>
                      <span className="relative z-10">Verifying...</span>
                    </>
                  ) : isUploading ? (
                    <>
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 relative z-10" />
                      <span className="relative z-10">Uploading...</span>
                    </>
                  ) : (idVerificationResult && idVerificationResult.matches) ? (
                    <>
                      <span className="relative z-10">Get Trust Badge</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 relative z-10" />
                      <span className="relative z-10">Verify</span>
                    </>
                  )}
                </Button>

              </>
            ) : null}

            {/* Upload Button - Show when verification succeeds */}
            {idVerificationResult && idVerificationResult.matches && !verifyingId && verificationStatus !== 'approved' && (
              <Button
                onClick={handleIdUpload}
                disabled={isUploading}
                className="w-full h-8 sm:h-10 text-xs sm:text-sm mt-4 bg-black hover:bg-gray-900 text-white font-black rounded-2xl border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                {/* Physical button depth effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                {isUploading ? (
                  <>
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 relative z-10" />
                    <span className="relative z-10">Uploading...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Get Trust Badge</span>
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security Dashboard */}
        <SecurityDashboard
          enquiries={enquiries}
          sellerSubmissions={sellerSubmissions}
          className="mt-4 sm:mt-6"
        />

        </div>
      </div>

      {/* Remove Trust Badge Confirmation Dialog */}
      <Dialog open={showRemoveConfirmDialog} onOpenChange={setShowRemoveConfirmDialog}>
        <DialogContent className="w-[90%] max-w-[90%] sm:max-w-md sm:w-auto p-3 sm:p-6 border-8 border-black !mx-0">
          <DialogHeader className="space-y-1.5 sm:space-y-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 sm:h-7 sm:w-7 text-red-600" />
            </div>
            <DialogTitle className="text-sm sm:text-lg font-bold text-center">
              Remove Trust Badge?
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-sm text-center text-gray-600 leading-relaxed">
              Are you sure you want to remove your trust badge? This will:
              <ul className="mt-1.5 sm:mt-3 space-y-0.5 sm:space-y-1.5 text-left list-disc list-inside text-[10px] sm:text-sm">
                <li>Delete your ID information</li>
                <li>Remove the blue verified icon from all your enquiries</li>
                <li>Require you to re-upload your ID to get the trust badge again</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-6">
            <Button
              onClick={() => setShowRemoveConfirmDialog(false)}
              variant="outline"
              className="w-full sm:w-auto h-8 sm:h-10 text-[10px] sm:text-sm px-3 sm:px-6 !bg-white !text-black !border-black hover:!bg-gray-50"
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveTrustBadge}
              variant="destructive"
              className="w-full sm:w-auto h-8 sm:h-10 text-[10px] sm:text-sm px-3 sm:px-6 !bg-red-600 !text-white hover:!bg-red-700 !border-2 !border-red-800"
              style={{ backgroundColor: '#dc2626', borderColor: '#991b1b' }}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <span className="mr-2">Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Remove Trust Badge
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default Profile;


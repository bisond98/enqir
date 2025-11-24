import React, { useState, useEffect, useContext } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shield, User, Camera, CheckCircle, XCircle, Edit, Save, Trash2, Loader2 } from "lucide-react";
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

  // AUTO-VERIFY: Automatically verify ID when number, type, and images are available (Profile page only)
  // Stop auto-verifying if previous verification was successful OR failed (don't keep retrying)
  useEffect(() => {
    if (!idNumber || !idType || (!idFrontUrl && !idBackUrl) || verifyingId) return;
    
    // Don't auto-verify again if previous verification already has a result (success or failure)
    // Only verify if there's no previous result or if user changed something
    if (idVerificationResult) {
      // If verification was successful, don't verify again
      if (idVerificationResult.matches) {
        return;
      }
      // If verification failed, also don't auto-verify again (user needs to fix manually)
      if (!idVerificationResult.matches) {
        return;
      }
    }
    
    // Debounce: Wait 800ms after user stops typing/changing
    const timeoutId = setTimeout(async () => {
      if (idNumber.trim() && idType && (idFrontUrl || idBackUrl) && !verifyingId) {
        // Double-check: Don't verify if there's already a result
        if (idVerificationResult) {
          return;
        }
        
        setVerifyingId(true);
        try {
          const verification = await verifyIdNumberMatchBothSides(
            idFrontUrl,
            idBackUrl,
            idNumber,
            idType
          );
          setIdVerificationResult(verification);
          
          if (!verification.matches) {
            setIdErrors(prev => ({ 
              ...prev, 
              idNumber: verification.error || 'ID details does not match.' 
            }));
          } else {
            setIdErrors(prev => ({ ...prev, idNumber: "" }));
          }
        } catch (error) {
          console.error('Error auto-verifying ID:', error);
        } finally {
          // Always clear verifying state, even if there's an error
          setVerifyingId(false);
        }
      }
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [idNumber, idType, idFrontUrl, idBackUrl, verifyingId]);

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

  // Handle ID upload - SIMPLE APPROACH
  const handleIdUpload = async () => {
    if (!idFront || !idType || !idNumber) {
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
    
    // REQUIRED: OCR verification must pass before upload
    if (!idFrontUrl) {
      toast({
        title: "Image Not Verified",
        description: "Please upload the ID image first. It will be automatically verified.",
        variant: "destructive",
      });
      return;
    }
    
    // MANDATORY: OCR verification must pass before upload
    if (!idFrontUrl) {
      toast({
        title: "Image Required",
        description: "Please upload the ID image first. It will be automatically verified.",
        variant: "destructive",
      });
      return;
    }
    
    // If not verified yet, verify now (check both front and back)
    if (!idVerificationResult) {
      setVerifyingId(true);
      try {
        const verification = await verifyIdNumberMatchBothSides(
          idFrontUrl,
          idBackUrl,
          idNumber,
          idType
        );
        setIdVerificationResult(verification);
        setVerifyingId(false);
        
        if (!verification.matches) {
          toast({
            title: "ID Verification Failed",
            description: verification.error || "ID number does not match the uploaded image(s). The ID number should be visible on either the front or back side.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error verifying ID:', error);
        setVerifyingId(false);
        toast({
          title: "Verification Error",
          description: "Failed to verify ID number. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else if (!idVerificationResult.matches) {
      // Verification was done but failed
      toast({
        title: "ID Verification Failed",
        description: idVerificationResult.error || "ID number does not match the uploaded image. Please check and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting ID upload process...');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      let frontImageUrl = idFrontUrl;
      
      if (!frontImageUrl) {
        console.log('📤 Uploading front ID to Cloudinary...');
        setUploadProgress(25);
        
        // Upload front ID image to Cloudinary (use unsigned for consistency with enquiry form)
        frontImageUrl = await uploadToCloudinaryUnsigned(idFront);
        
        // Verify after upload if not already verified
        if (frontImageUrl) {
          setVerifyingId(true);
          const verification = await verifyIdNumberMatch(frontImageUrl, idNumber, idType);
          setIdVerificationResult(verification);
          
          if (!verification.matches) {
            setVerifyingId(false);
            setIsUploading(false);
            setUploadProgress(0);
            toast({
              title: "ID Verification Failed",
              description: verification.error || "ID number does not match the uploaded image. Please check and try again.",
              variant: "destructive",
            });
            return;
          }
          setVerifyingId(false);
        }
      }
      console.log('✅ Front ID uploaded and verified:', frontImageUrl);
      setUploadProgress(50);

      // Upload back ID image if provided (optional)
      let backImageUrl = idBackUrl;
      if (idBack && !idBackUrl) {
        console.log('📤 Uploading back ID to Cloudinary...');
        setUploadProgress(75);
        backImageUrl = await uploadToCloudinaryUnsigned(idBack);
        setIdBackUrl(backImageUrl);
        console.log('✅ Back ID uploaded to Cloudinary:', backImageUrl);
        
        // Re-verify with both images after back upload
        if (frontImageUrl && backImageUrl) {
          setVerifyingId(true);
          const verification = await verifyIdNumberMatchBothSides(
            frontImageUrl,
            backImageUrl,
            idNumber,
            idType
          );
          setIdVerificationResult(verification);
          setVerifyingId(false);
          
          if (!verification.matches) {
            setIsUploading(false);
            setUploadProgress(0);
            toast({
              title: "ID Verification Failed",
              description: verification.error || "ID number does not match the uploaded image(s). The ID number should be visible on either the front or back side.",
              variant: "destructive",
            });
            return;
          }
        }
      }

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
        backImageUrl: backImageUrl,
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
      realtimeAI.processProfileVerification(authUser.uid, profileData, { front: frontImageUrl, back: backImageUrl })
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
      setIdBack(null);
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
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-[20px] border-pal-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground font-bold">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Profile Header - Matching Dashboard Style */}
        <div className="mb-6 sm:mb-12 lg:mb-16 -mt-2 sm:-mt-4">
          <div className="relative bg-black border border-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-8 lg:p-10 overflow-hidden">
            {/* Header Section with Title */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex justify-center items-center gap-3 sm:gap-4 lg:gap-5">
                <h1 className="mb-2 sm:mb-3 lg:mb-4 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-white inline-flex items-center gap-2 sm:gap-3 justify-center tracking-tight">
                  {fullName || authUser.displayName || "Profile"}
                  {isProfileVerified && (
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  )}
                </h1>
              </div>
            </div>
            
            {/* Content Card - White Background */}
            <div className="bg-white border border-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
                  <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">
                    Profile
                  </h2>
                </div>
                <p className="text-xs sm:text-base lg:text-lg xl:text-xl text-slate-600 text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  {authUser.email}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                  className="h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 !bg-white !text-black !border-black hover:!bg-white hover:!text-black focus:!bg-white focus:!text-black active:!bg-white"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-black" />
                  Edit
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
              They made everything feel untrustful without a blue tick.
            </p>
          </div>
          {/* Card Content - Enhanced White Background */}
          <CardContent className="p-4 sm:p-5 lg:p-5 lg:pt-4 space-y-4 sm:space-y-6 lg:space-y-4">
            
            {/* VERIFIED PROFILE - Show only success message */}
            {verificationStatus === 'approved' && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-4 border-blue-500 rounded-t-none rounded-b-xl text-center -m-4 sm:-m-5 lg:-m-5 lg:-mt-4 p-4 sm:p-5 lg:p-5 lg:pt-4">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-400 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-white mb-2">Profile Verified!</h3>
                <p className="text-blue-50 text-[10px] sm:text-xs">
                  Congratulations! Your profile has been verified and you now have a verified badge.
                </p>
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

            {/* UPLOAD FORM - Hide after profile is verified (only show for unverified users) */}
            {!isProfileVerified && 
             verificationStatus !== 'approved' && 
             verificationStatus !== 'verified' && 
             verificationStatus !== 'completed' && 
             (!verificationStatus || verificationStatus === 'rejected' || (idVerificationResult && idVerificationResult.matches)) ? (
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
                        }}>
                      <SelectTrigger className="h-8 sm:h-10 border border-black focus:border-black focus:ring-black">
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
                    />
                    {idErrors.idNumber && !idVerificationResult && (
                      <span className="text-xs text-red-500 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        {idErrors.idNumber}
                      </span>
                    )}
                    {/* ID Verification Status */}
                    {verifyingId && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 mt-1">
                        <div 
                          className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0"
                          style={{
                            animation: 'spin 1s linear infinite',
                            WebkitAnimation: 'spin 1s linear infinite'
                          }}
                        ></div>
                        <span>Verifying ID number with image...</span>
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
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                            <span className="break-words leading-relaxed text-[10px] sm:text-sm">{idVerificationResult.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idFront" className="text-xs sm:text-sm">Front Side *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-pal-blue transition-colors">
                      <input
                        id="idFront"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIdFront(file);
                          setIdErrors(prev => ({ ...prev, idFront: "" }));
                          setIdVerificationResult(null);
                          
                          // Upload image but don't verify yet - wait for verify button
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
                      <Label htmlFor="idFront" className="cursor-pointer">
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {idFront ? idFront.name : "Click to upload front side"}
                          </span>
                        </div>
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idBack" className="text-xs sm:text-sm">Back Side (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-pal-blue transition-colors">
                      <input
                        id="idBack"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Label htmlFor="idBack" className="cursor-pointer">
                        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {idBack ? idBack.name : "Click to upload back side"}
                          </span>
                        </div>
                      </Label>
                    </div>
                  </div>
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
                        {uploadProgress >= 25 && uploadProgress < 50 && "Uploading front ID..."}
                        {uploadProgress >= 50 && uploadProgress < 75 && "Uploading back ID..."}
                        {uploadProgress >= 75 && uploadProgress < 100 && "Saving to database..."}
                        {uploadProgress === 100 && "Upload complete!"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Combined Verify & Upload Button */}
                <Button
                  onClick={async () => {
                    // First verify, then upload if verification passes
                    if (!idFront || !idType || !idNumber) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in all required fields and upload front ID image.",
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
                        description: "Please fix the ID information errors before uploading.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Verify OCR if image is already uploaded
                    if (idFrontUrl || idBackUrl) {
                      setVerifyingId(true);
                      setIdErrors(prev => ({ ...prev, idNumber: "" }));
                      
                      try {
                        const verification = await verifyIdNumberMatchBothSides(
                          idFrontUrl,
                          idBackUrl,
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
                            title: "Verification Failed",
                            description: verification.error || "ID number does not match the uploaded image(s).",
                            variant: "destructive",
                          });
                          return;
                        }
                      } catch (error) {
                        console.error('Error verifying ID:', error);
                        toast({
                          title: "Verification Error",
                          description: "Failed to verify ID number. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      } finally {
                        // Always clear verifying state
                        setVerifyingId(false);
                      }
                    }
                    
                    // If verification passed or no image uploaded yet, proceed with upload
                    handleIdUpload();
                  }}
                  disabled={
                    !idType || 
                    !idNumber || 
                    !idFront || 
                    isUploading || 
                    verifyingId ||
                    (idErrors.idNumber && idErrors.idNumber.length > 0) || 
                    !idVerificationResult || 
                    !idVerificationResult.matches
                  }
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                >
                  {verifyingId ? (
                    <>
                      <div 
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                        style={{
                          animation: 'spin 1s linear infinite',
                          WebkitAnimation: 'spin 1s linear infinite'
                        }}
                      ></div>
                      Verifying...
                    </>
                  ) : isUploading ? (
                    <>
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Uploading...
                    </>
                  ) : !idVerificationResult || !idVerificationResult.matches ? (
                    <>
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Verify ID First
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Upload ID for Trust Badge
                    </>
                  )}
                </Button>

              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Security Dashboard */}
        <SecurityDashboard
          enquiries={enquiries}
          sellerSubmissions={sellerSubmissions}
          className="mt-4 sm:mt-6"
        />

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
    </Layout>
  );
};

export default Profile;


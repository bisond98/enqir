import React, { useState, useEffect, useContext } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shield, User, Camera, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { db } from "@/firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";
import { uploadToCloudinary } from "@/integrations/cloudinary";
import { realtimeAI } from "@/services/ai/realtimeAI";
import VerificationStatus from "@/components/VerificationStatus";
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
  
  // ID upload states
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedProfileId, setSubmittedProfileId] = useState<string | null>(null);

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

    console.log('🚀 Starting ID upload process...');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      console.log('📤 Uploading front ID to Cloudinary...');
      setUploadProgress(25);
      
      // Upload front ID image to Cloudinary
      const frontImageUrl = await uploadToCloudinary(idFront);
      console.log('✅ Front ID uploaded to Cloudinary:', frontImageUrl);
      setUploadProgress(50);

      // Upload back ID image if provided (optional)
      let backImageUrl = null;
      if (idBack) {
        console.log('📤 Uploading back ID to Cloudinary...');
        setUploadProgress(75);
        backImageUrl = await uploadToCloudinary(idBack);
        console.log('✅ Back ID uploaded to Cloudinary:', backImageUrl);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pal-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
        <Card className="mt-6 sm:mt-8 border border-black">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">It's better to know you better if you're here to scam others</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-8 sm:h-10 border border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-slate-700">Phone Number *</Label>
                <div className="flex gap-1 sm:gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-14 sm:w-16 h-8 sm:h-10 border border-black focus:border-black focus:ring-black">
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
                    className="flex-1 h-8 sm:h-10 border border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-1 sm:space-x-2">
              <Button 
                onClick={handleProfileSave}
                disabled={!fullName.trim() || !phone.trim()}
                className="h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badge Section - SIMPLE & CLEAN */}
        <Card className="mt-4 sm:mt-6 border border-black shadow-lg rounded-3xl sm:rounded-2xl bg-white">
          {/* Card Header - Black Background */}
          <div className="bg-black px-4 sm:px-4 py-3.5 sm:py-4 rounded-t-3xl sm:rounded-t-2xl">
            <h2 className="text-sm sm:text-sm md:text-base font-bold text-white flex items-center gap-2.5">
              <Shield className="h-4 w-4 sm:h-4 sm:w-4" />
              Trust Badge (Optional)
            </h2>
            <p className="text-xs sm:text-xs text-gray-300 mt-1.5">
              The world isn't exactly a trust-friendly place, but relax, you'll have a blue tick
            </p>
          </div>
          {/* Card Content - Enhanced White Background */}
          <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
            
            {/* VERIFIED PROFILE - Show only success message */}
            {verificationStatus === 'approved' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6 text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-green-800 mb-2">Profile Verified!</h3>
                <p className="text-green-700 text-xs sm:text-sm">
                  Congratulations! Your profile has been verified and you now have a verified badge.
                </p>
                <div className="mt-3 sm:mt-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Verified Profile
                  </Badge>
                </div>
              </div>
            )}

            {/* PENDING VERIFICATION */}
            {verificationStatus === 'pending' && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 sm:p-6 text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-yellow-500 border-t-transparent"></div>
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-yellow-800 mb-2">Verification Pending</h3>
                <p className="text-yellow-700 text-xs sm:text-sm">
                  Your ID has been uploaded and is under admin review.
                </p>
              </div>
            )}

            {/* REJECTED VERIFICATION */}
            {verificationStatus === 'rejected' && (
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

            {/* UPLOAD FORM - Only show for unverified users */}
            {!verificationStatus || verificationStatus === 'rejected' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idType" className="text-xs sm:text-sm">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger className="h-8 sm:h-10 border border-black focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idNumber" className="text-xs sm:text-sm">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Enter ID number"
                      className="h-8 sm:h-10 border border-black focus:border-black focus:ring-black text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="idFront" className="text-xs sm:text-sm">Front Side *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-pal-blue transition-colors">
                      <input
                        id="idFront"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIdFront(e.target.files?.[0] || null)}
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
                        <span>Uploading ID...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-500 border-t-transparent"></div>
                      <span>
                        {uploadProgress < 25 && "Preparing upload..."}
                        {uploadProgress >= 25 && uploadProgress < 50 && "Uploading front ID..."}
                        {uploadProgress >= 50 && uploadProgress < 75 && "Uploading back ID..."}
                        {uploadProgress >= 75 && uploadProgress < 100 && "Saving to database..."}
                        {uploadProgress === 100 && "Upload complete!"}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleIdUpload}
                  disabled={!idType || !idNumber || !idFront || isUploading}
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isUploading ? "Uploading..." : "Upload ID for Trust Badge"}
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
    </Layout>
  );
};

export default Profile;


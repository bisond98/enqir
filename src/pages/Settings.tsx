import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Shield, 
  CreditCard, 
  Globe, 
  Eye, 
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Crown,
  Mic,
  MicOff,
  Smartphone,
  Hand,
  Volume2,
  Wifi,
  WifiOff,
  Zap,
  History,
  Calendar
} from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useUsage } from "@/contexts/UsageContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { db } from "@/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { formatIndianCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PurchaseHistory {
  id: string;
  enquiryId: string;
  planId: string;
  planPrice: number;
  responsesUnlocked: number;
  isUnlimited: boolean;
  purchasedAt: Date;
  isActive: boolean;
  paymentMethod: string;
  transactionId: string;
  enquiryTitle?: string;
}

const Settings = () => {
  const { user } = useUsage();
  const { user: authUser, deleteAccount } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showContactInfo: true,
    dataCollection: true
  });
  
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  });
  
  const [aiFeatures, setAiFeatures] = useState({
    voiceCommands: true,
    touchGestures: true,
    mobileOptimization: true,
    isRecording: false
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || authUser?.displayName || "",
    email: user?.email || authUser?.email || "",
    role: "buyer",
    bio: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authUser?.uid) return;
      
      try {
        const profileRef = doc(db, 'userProfiles', authUser.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileData({
            name: data.fullName || authUser.displayName || "",
            email: authUser.email || "",
            role: data.role || "buyer",
            bio: data.bio || ""
          });
          setPrivacy({
            profileVisibility: data.profileVisibility || 'public',
            showContactInfo: data.showContactInfo !== false,
            dataCollection: data.dataCollection !== false
          });
          setPreferences({
            language: data.language || 'en',
            timezone: data.timezone || 'Asia/Kolkata',
            currency: data.currency || 'INR'
          });
          setAiFeatures({
            voiceCommands: data.voiceCommands !== false,
            touchGestures: data.touchGestures !== false,
            mobileOptimization: data.mobileOptimization !== false,
            isRecording: false
          });
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [authUser?.uid]);

  // Save profile settings
  const saveProfile = async () => {
    if (!authUser?.uid) return;
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        userId: authUser.uid,
        fullName: profileData.name,
        email: profileData.email,
        role: profileData.role,
        bio: profileData.bio,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save privacy settings
  const savePrivacy = async () => {
    if (!authUser?.uid) return;
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        profileVisibility: privacy.profileVisibility,
        showContactInfo: privacy.showContactInfo,
        dataCollection: privacy.dataCollection,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy settings have been saved.",
      });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!authUser?.uid) return;
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        language: preferences.language,
        timezone: preferences.timezone,
        currency: preferences.currency,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save AI features
  const saveAIFeatures = async () => {
    if (!authUser?.uid) return;
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        voiceCommands: aiFeatures.voiceCommands,
        touchGestures: aiFeatures.touchGestures,
        mobileOptimization: aiFeatures.mobileOptimization,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "AI Features Updated",
        description: "Your AI feature settings have been saved.",
      });
    } catch (error) {
      console.error('Failed to save AI features:', error);
      toast({
        title: "Error",
        description: "Failed to save AI features. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch premium purchase history
  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      if (!authUser?.uid) return;
      
      setLoadingHistory(true);
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userId', '==', authUser.uid),
          orderBy('purchasedAt', 'desc')
        );
        
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const purchases: PurchaseHistory[] = [];
        
        for (const docSnap of paymentsSnapshot.docs) {
          const data = docSnap.data();
          const purchase: PurchaseHistory = {
            id: docSnap.id,
            enquiryId: data.enquiryId || '',
            planId: data.planId || '',
            planPrice: data.planPrice || 0,
            responsesUnlocked: data.responsesUnlocked || 0,
            isUnlimited: data.isUnlimited || false,
            purchasedAt: data.purchasedAt?.toDate() || new Date(),
            isActive: data.isActive !== false,
            paymentMethod: data.paymentMethod || 'card',
            transactionId: data.transactionId || ''
          };
          
          // Try to get enquiry title
          try {
            const enquiryRef = doc(db, 'enquiries', purchase.enquiryId);
            const enquiryDoc = await getDoc(enquiryRef);
            if (enquiryDoc.exists()) {
              purchase.enquiryTitle = enquiryDoc.data()?.title || 'Untitled Enquiry';
            }
          } catch (error) {
            console.warn('Could not fetch enquiry title:', error);
          }
          
          purchases.push(purchase);
        }
        
        setPurchaseHistory(purchases);
      } catch (error) {
        console.error('Failed to fetch purchase history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchPurchaseHistory();
  }, [authUser?.uid]);
  
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account preferences and platform settings
            </p>
          </div>
          
          <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 overflow-x-auto sm:overflow-visible">
              <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-3">Profile</TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs sm:text-sm px-2 sm:px-3">Privacy</TabsTrigger>
              <TabsTrigger value="premium" className="text-xs sm:text-sm px-2 sm:px-3">Premium History</TabsTrigger>
              <TabsTrigger value="preferences" className="text-xs sm:text-sm px-2 sm:px-3">Preferences</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs sm:text-sm px-2 sm:px-3">AI Features</TabsTrigger>
            </TabsList>
            
            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                  <h2 className="text-lg sm:text-xl font-semibold">Profile Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input 
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        value={profileData.email}
                        type="email"
                        disabled
                        className="opacity-60"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select 
                      value={profileData.role}
                      onValueChange={(value) => setProfileData({ ...profileData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 border border-border rounded-md bg-background"
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Credit-Based User
                    </Badge>
                    <Badge variant="outline" className="text-xs text-pal-blue">
                      <Check className="h-3 w-3 mr-1" />
                      Pay-per-Use
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => setProfileData({
                        name: user?.name || authUser?.displayName || "",
                        email: user?.email || authUser?.email || "",
                        role: "buyer",
                        bio: ""
                      })}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="w-full sm:w-auto bg-pal-blue hover:bg-pal-blue-dark"
                      onClick={saveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                  <h2 className="text-lg sm:text-xl font-semibold">Privacy & Security</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="text-sm font-medium block mb-2">Profile Visibility</label>
                    <Select value={privacy.profileVisibility} onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="verified">Verified Users Only</SelectItem>
                        <SelectItem value="private">Private - Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-medium">Show Contact Information</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Allow verified users to see your contact details</p>
                    </div>
                    <Switch 
                      checked={privacy.showContactInfo}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showContactInfo: checked }))}
                      className="sm:ml-4"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-medium">Data Collection</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Allow PAL to collect analytics for improving your experience</p>
                    </div>
                    <Switch 
                      checked={privacy.dataCollection}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, dataCollection: checked }))}
                      className="sm:ml-4"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm sm:text-base font-medium">Data Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <Button variant="outline" className="flex items-center justify-center sm:justify-start w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View My Data
                      </Button>
                      <Button variant="outline" className="flex items-center justify-center sm:justify-start w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center sm:justify-start w-full text-destructive hover:text-destructive sm:col-span-2 md:col-span-1"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
                    <Button 
                      className="w-full sm:w-auto bg-pal-blue hover:bg-pal-blue-dark"
                      onClick={savePrivacy}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Privacy Settings"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            {/* Premium Purchase History */}
            <TabsContent value="premium" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                  <h2 className="text-lg sm:text-xl font-semibold">Premium Purchase History</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading purchase history...</div>
                    </div>
                  ) : purchaseHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-sm sm:text-base font-medium text-foreground mb-2">No Premium Purchases Yet</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Your premium purchase history will appear here once you make a purchase.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchaseHistory.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:border-border transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-pal-blue/10 rounded-lg flex-shrink-0">
                                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                                      {purchase.planId.charAt(0).toUpperCase() + purchase.planId.slice(1)} Plan
                                    </h3>
                                    {purchase.isActive && (
                                      <Badge variant="default" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                  {purchase.enquiryTitle && (
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                                      {purchase.enquiryTitle}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {purchase.purchasedAt.toLocaleDateString('en-IN', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    {purchase.responsesUnlocked > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {purchase.isUnlimited ? 'Unlimited' : `${purchase.responsesUnlocked} Responses`}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {purchase.transactionId ? `TXN: ${purchase.transactionId.slice(-8)}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-lg sm:text-xl font-bold text-foreground">
                                {formatIndianCurrency(purchase.planPrice)}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {purchase.paymentMethod === 'card' ? 'Card' : purchase.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {purchaseHistory.length > 0 && (
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full sm:w-auto flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Download All Receipts
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            {/* Preferences */}
            <TabsContent value="preferences" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                  <h2 className="text-lg sm:text-xl font-semibold">Platform Preferences</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language</label>
                      <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                          <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                          <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata)</SelectItem>
                          <SelectItem value="Asia/Mumbai">IST (Asia/Mumbai)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <Select value={preferences.currency} onValueChange={(value) => setPreferences(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                        <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm sm:text-base font-medium">Danger Zone</h3>
                    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-destructive">Delete Account</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="mt-3 w-full sm:w-auto"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            Delete My Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
                    <Button 
                      className="w-full sm:w-auto bg-pal-blue hover:bg-pal-blue-dark"
                      onClick={savePreferences}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            {/* AI Features Settings */}
            <TabsContent value="ai" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-pal-blue" />
                  <h2 className="text-lg sm:text-xl font-semibold">AI Features & Mobile Controls</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Voice Commands */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-medium">Voice Commands</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Use voice to control the app</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:ml-4">
                      <Switch 
                        checked={aiFeatures.voiceCommands}
                        onCheckedChange={(checked) => setAiFeatures(prev => ({ ...prev, voiceCommands: checked }))}
                      />
                      {aiFeatures.voiceCommands && (
                        <Button
                          size="sm"
                          variant={aiFeatures.isRecording ? "destructive" : "default"}
                          onClick={() => setAiFeatures(prev => ({ ...prev, isRecording: !prev.isRecording }))}
                          className="ml-2"
                        >
                          {aiFeatures.isRecording ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                          {aiFeatures.isRecording ? 'Stop' : 'Test'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Touch Gestures */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Hand className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-medium">Touch Gestures</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Swipe and tap gestures for navigation</p>
                      </div>
                    </div>
                    <Switch 
                      checked={aiFeatures.touchGestures}
                      onCheckedChange={(checked) => setAiFeatures(prev => ({ ...prev, touchGestures: checked }))}
                      className="sm:ml-4"
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Mobile Optimization */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-gray-800" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-medium">Mobile Optimization</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Enhanced mobile experience and performance</p>
                      </div>
                    </div>
                    <Switch 
                      checked={aiFeatures.mobileOptimization}
                      onCheckedChange={(checked) => setAiFeatures(prev => ({ ...prev, mobileOptimization: checked }))}
                      className="sm:ml-4"
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Voice Commands Instructions */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-green-800 mb-3 flex items-center">
                      <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Voice Commands
                    </h4>
                    <ul className="text-xs sm:text-sm text-green-700 space-y-1">
                      <li>• <strong>"Search for enquiries"</strong> - Find requests</li>
                      <li>• <strong>"Post new enquiry"</strong> - Create new post</li>
                      <li>• <strong>"Show dashboard"</strong> - Go to dashboard</li>
                      <li>• <strong>"Show my responses"</strong> - View responses</li>
                    </ul>
                  </div>
                  
                  {/* Touch Gestures Instructions */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-3 flex items-center">
                      <Hand className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Touch Gestures
                    </h4>
                    <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                      <li>• <strong>Swipe left/right:</strong> Navigate between items</li>
                      <li>• <strong>Swipe up/down:</strong> Refresh/load more</li>
                      <li>• <strong>Long press:</strong> Context menu</li>
                      <li>• <strong>Double tap:</strong> Quick action</li>
                    </ul>
                  </div>
                  
                  {/* AI Status */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-800 mb-3 flex items-center">
                      <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      AI Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Voice Commands</span>
                        <Badge variant={aiFeatures.voiceCommands ? "default" : "secondary"} className="text-xs">
                          {aiFeatures.voiceCommands ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Touch Gestures</span>
                        <Badge variant={aiFeatures.touchGestures ? "default" : "secondary"} className="text-xs">
                          {aiFeatures.touchGestures ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Mobile Optimization</span>
                        <Badge variant={aiFeatures.mobileOptimization ? "default" : "secondary"} className="text-xs">
                          {aiFeatures.mobileOptimization ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Network Status</span>
                        <Badge variant="outline" className="text-xs">Online</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => setAiFeatures({
                        voiceCommands: true,
                        touchGestures: true,
                        mobileOptimization: true,
                        isRecording: false
                      })}
                    >
                      Reset to Default
                    </Button>
                    <Button 
                      className="w-full sm:w-auto bg-pal-blue hover:bg-pal-blue-dark"
                      onClick={saveAIFeatures}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteAccount}
        userName={user?.displayName || undefined}
      />
    </Layout>
  );
};

export default Settings;
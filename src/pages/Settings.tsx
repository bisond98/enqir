import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Trash2,
  Bell,
  BellOff,
  Key,
  ArrowLeft,
  Settings as SettingsIcon
} from "lucide-react";
import Layout from "@/components/Layout";
import { HeaderSnow } from "@/components/HeaderSnow";
import { useUsage } from "@/contexts/UsageContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast, updateNotificationPreferenceCache } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useUsage();
  const { user: authUser, deleteAccount, sendPasswordResetEmail } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    dataCollection: true,
    notificationsEnabled: true
  });

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authUser?.uid) return;
      
      try {
        const profileRef = doc(db, 'userProfiles', authUser.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setPrivacy({
            profileVisibility: data.profileVisibility || 'public',
            dataCollection: data.dataCollection !== false,
            notificationsEnabled: data.notificationsEnabled !== false
          });
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [authUser?.uid]);

  // Save privacy settings automatically when changed
  const savePrivacySetting = async (field: string, value: any) => {
    if (!authUser?.uid) return;
    
    try {
      await setDoc(doc(db, 'userProfiles', authUser.uid), {
        [field]: value,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update notification preference cache immediately if it's the notifications field
      if (field === 'notificationsEnabled') {
        updateNotificationPreferenceCache(authUser.uid, value);
      }
    } catch (error) {
      console.error(`Failed to save ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to save ${field}. Please try again.`,
        variant: "destructive",
        forceShow: true // Always show error toasts
      });
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Profile Background - Full Width */}
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
            
            {/* Settings Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
                Settings.
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
              Manage your account preferences and platform settings.
            </p>
                </div>
              </div>
            </div>
          </div>
          </div>
          
        {/* Content - Inside Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Privacy Settings */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 border-4 border-black">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-sm font-medium block mb-2 text-black">Profile Visibility</label>
                  <Select 
                    value={privacy.profileVisibility} 
                    onValueChange={(value) => {
                      setPrivacy(prev => ({ ...prev, profileVisibility: value }));
                      savePrivacySetting('profileVisibility', value);
                    }}
                  >
                    <SelectTrigger className="border-2 border-black focus:border-black focus:ring-black text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs sm:text-sm">
                      <SelectItem value="public" className="text-xs sm:text-sm">Public - Anyone can see</SelectItem>
                      <SelectItem value="verified" className="text-xs sm:text-sm">Verified Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-black">Data Collection</h3>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Allow Enqir.in to collect analytics for improving your experience</p>
                  </div>
                  <Switch 
                    checked={privacy.dataCollection}
                    onCheckedChange={(checked) => {
                      setPrivacy(prev => ({ ...prev, dataCollection: checked }));
                      savePrivacySetting('dataCollection', checked);
                    }}
                    className="sm:ml-4 data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                  />
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {privacy.notificationsEnabled ? (
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                      ) : (
                        <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                      )}
                      <h3 className="text-sm sm:text-base font-medium text-black">Notifications</h3>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Receive notifications about enquiries, responses, and updates</p>
                  </div>
                  <Switch 
                    checked={privacy.notificationsEnabled}
                    onCheckedChange={(checked) => {
                      setPrivacy(prev => ({ ...prev, notificationsEnabled: checked }));
                      // Save to Firestore immediately
                      savePrivacySetting('notificationsEnabled', checked);
                      // Update cache immediately when toggled
                      if (authUser?.uid) {
                        updateNotificationPreferenceCache(authUser.uid, checked);
                      }
                      if (!checked) {
                        toast({
                          title: "Notifications Turned Off",
                          description: "You will no longer receive notifications about enquiries, responses, and updates.",
                          forceShow: true // Always show this toast even when turning off
                        });
                      }
                    }}
                    className="sm:ml-4 data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-medium text-black">Account Security</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center sm:justify-start w-full border-2 border-black text-xs sm:text-sm"
                      onClick={async () => {
                        if (!authUser?.email) {
                          toast({
                            title: "Error",
                            description: "Email address not found. Please contact support.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        setIsResettingPassword(true);
                        try {
                          const result = await sendPasswordResetEmail(authUser.email);
                          if (!result.error) {
                            toast({
                              title: "Password Reset Email Sent",
                              description: `We've sent a password reset link to ${authUser.email}. Please check your inbox and spam folder.`,
                            });
                          } else {
                            toast({
                              title: "Error",
                              description: result.error.message || "Failed to send password reset email. Please try again.",
                              variant: "destructive",
                            });
                          }
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to send password reset email. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsResettingPassword(false);
                        }
                      }}
                      disabled={isResettingPassword}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {isResettingPassword ? "Sending..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-medium text-black">Account Management</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center sm:justify-start w-full text-destructive hover:text-destructive border-2 border-black text-xs sm:text-sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
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

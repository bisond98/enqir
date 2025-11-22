import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Eye, 
  Download,
  Trash2,
  Bell,
  BellOff
} from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useUsage } from "@/contexts/UsageContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast, updateNotificationPreferenceCache } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useUsage();
  const { user: authUser, deleteAccount } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center items-center mb-3 sm:mb-4 lg:mb-5">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black">Settings</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Manage your account preferences and platform settings
            </p>
          </div>
          
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
                    <SelectTrigger className="border-2 border-black focus:border-black focus:ring-black">
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
                    <h3 className="text-sm sm:text-base font-medium text-black">Data Collection</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Allow Enqir.in to collect analytics for improving your experience</p>
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
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Receive notifications about enquiries, responses, and updates</p>
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
                  <h3 className="text-sm sm:text-base font-medium text-black">Data Management</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <Button variant="outline" className="flex items-center justify-center sm:justify-start w-full border-2 border-black">
                      <Eye className="h-4 w-4 mr-2" />
                      View My Data
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center sm:justify-start w-full border-2 border-black">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center sm:justify-start w-full text-destructive hover:text-destructive sm:col-span-2 md:col-span-1 border-2 border-black"
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

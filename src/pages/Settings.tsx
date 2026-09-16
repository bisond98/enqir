import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Shield, 
  Trash2,
  Key,
  ArrowLeft,
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import Layout from "@/components/Layout";
import { useUsage } from "@/contexts/UsageContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import SignOutDialog from "@/components/SignOutDialog";

const Settings = () => {
  const { user } = useUsage();
  const { user: authUser, deleteAccount, sendPasswordResetEmail, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
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
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 text-blue-400" />
                <span className="bg-gradient-to-r from-white via-white to-blue-300 bg-clip-text text-transparent">Settings.</span>
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
                {/* Log Out - styled like the Connect button */}
                <Button
                  type="button"
                  onClick={() => setShowSignOutDialog(true)}
                  className="!w-full !h-16 !text-lg !font-black !bg-none !bg-red-600 hover:!bg-red-700 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <LogOut className="h-5 w-5 text-white" />
                    <span className="text-white">Log Out</span>
                  </div>
                </Button>
                
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-medium text-black">Account Security</h3>
                  <div className="space-y-3">
                    <Button 
                      type="button"
                      className="!w-full !h-14 !text-base !font-black !bg-none !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
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
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                      <div className="flex items-center justify-center space-x-2 relative z-10">
                        <Key className="h-5 w-5 text-white" />
                        <span className="text-white">{isResettingPassword ? "Sending..." : "Reset Password"}</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-medium text-black">Account Management</h3>
                  <Button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="!w-full !h-14 !text-base !font-black !bg-none !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <Trash2 className="h-5 w-5 text-white" />
                      <span className="text-white">Delete Account</span>
                    </div>
                  </Button>
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

      {/* Sign Out Confirmation Dialog */}
      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={signOut}
      />
    </Layout>
  );
};

export default Settings;

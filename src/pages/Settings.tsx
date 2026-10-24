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
import { friendlyError } from "@/utils/friendlyError";
import { toast } from "@/hooks/use-toast";

// Icon chip + title + one-line description used at the top of each card.
// Defined at module scope so toggling "Sending..." never remounts the headers.
const SectionHeader = ({ icon, title, description, iconClass }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconClass: string;
}) => (
  <div className="flex items-start gap-3 mb-4 sm:mb-5">
    <span className={`w-10 h-10 rounded-xl border-2 border-black shadow-[0_3px_0_0_rgba(0,0,0,0.85)] flex items-center justify-center flex-shrink-0 ${iconClass}`}>
      {icon}
    </span>
    <div className="min-w-0">
      <h3 className="text-base sm:text-lg font-black text-black tracking-tight leading-tight">{title}</h3>
      <p className="text-xs sm:text-[13px] text-gray-500 leading-snug mt-0.5">{description}</p>
    </div>
  </div>
);

const Settings = () => {
  const { user } = useUsage();
  const { user: authUser, deleteAccount, sendPasswordResetEmail, signOut, savedFullName, savedUsername } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Shared card shell — one consistent container for every settings group:
  // thick black border + hard bottom shadow, matching the app's neobrutalist
  // button/card language.
  const sectionCard = "bg-white border-2 border-black rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.85)] p-4 sm:p-6";

  // Action buttons take the Profile page's mobile-number input geometry:
  // 12px radius, 1.5px border, input height, the same layered lift shadow
  // on hover and the same focus ring. Button colours are unchanged — each
  // action keeps its original background, text and icon colour.
  const fieldLikeBtn =
    "!w-full !bg-none !h-10 sm:!h-12 !min-h-[44px] !rounded-[12px] !border-[1.5px] !border-black !text-sm sm:!text-base !font-bold " +
    "!shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] " +
    "hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] " +
    "focus-visible:!ring-3 focus-visible:!ring-black/15 " +
    "active:!translate-y-[2px] active:!scale-100 hover:!translate-y-0 active:!shadow-[0_1px_0_0_rgba(0,0,0,0.14),0_0_6px_rgba(0,0,0,0.07),0_3px_8px_rgba(0,0,0,0.1)] " +
    "!transition-all !duration-200";

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
            
            {/* Subtitle in Black Header */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[11px] sm:text-xs text-white/75 text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  Manage your account preferences and platform settings.
                </p>
              </div>
            </div>
          </div>
        </div>
          
        {/* Content — three grouped sections, safest actions first, destructive last */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-4 sm:space-y-6">

            {/* Account Security */}
            <Card className={sectionCard}>
              <SectionHeader
                icon={<Key className="h-5 w-5 text-white" />}
                iconClass="bg-blue-600"
                title="Account Security"
                description="We'll email you a secure link to reset your password."
              />
              <Button
                type="button"
                className={`${fieldLikeBtn} !bg-blue-600 hover:!bg-blue-700 !text-white`}
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
                        description: friendlyError(result.error, "Failed to send password reset email. Please try again."),
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: friendlyError(error, "Failed to send password reset email. Please try again."),
                      variant: "destructive",
                    });
                  } finally {
                    setIsResettingPassword(false);
                  }
                }}
                disabled={isResettingPassword}
              >
                <div className="flex items-center justify-center gap-2">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <span>{isResettingPassword ? "Sending..." : "Reset Password"}</span>
                </div>
              </Button>
            </Card>

            {/* Session — Log Out (styled like the Connect button) */}
            <Card className={sectionCard}>
              <SectionHeader
                icon={<LogOut className="h-5 w-5 text-white" />}
                iconClass="bg-black"
                title="Session"
                description="Sign out of your account on this device."
              />
              <Button
                type="button"
                onClick={() => setShowSignOutDialog(true)}
                className={`${fieldLikeBtn} !bg-red-600 hover:!bg-red-700 !text-white`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <span>Log Out</span>
                </div>
              </Button>
            </Card>

            {/* Account Management — destructive actions last */}
            <Card className="p-4 sm:p-6 border-2 border-black rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.85)] bg-red-50/60">
              <SectionHeader
                icon={<Trash2 className="h-5 w-5 text-white" />}
                iconClass="bg-red-600"
                title="Account Management"
                description="Permanently delete your account and all of its data."
              />
              <Button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className={`${fieldLikeBtn} !bg-black hover:!bg-gray-900 !text-white`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <span>Delete Account</span>
                </div>
              </Button>
            </Card>

          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteAccount}
        userName={savedUsername || savedFullName || authUser?.displayName || undefined}
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

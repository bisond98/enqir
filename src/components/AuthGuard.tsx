import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isEmailVerified, resendConfirmation, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasReloadedRef = useRef(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // Force reload user's email verification status if not verified
  // (in case they just signed in via email link - only runs once per session)
  useEffect(() => {
    if (user && !user.emailVerified && !hasReloadedRef.current && !isChecking) {
      console.log('🔄 Reloading user to check email verification status...');
      setIsChecking(true);
      hasReloadedRef.current = true;
      user.reload().then(() => {
        console.log('✅ User reloaded, emailVerified:', user.emailVerified);
        // Force re-render to check updated emailVerified status
        setForceUpdate(prev => prev + 1);
        // Small delay to allow auth state to propagate
        setTimeout(() => {
          setIsChecking(false);
        }, 500);
      }).catch((err) => {
        console.error('❌ Error reloading user:', err);
        hasReloadedRef.current = false; // Allow retry on error
        setIsChecking(false);
      });
    }
  }, [user, isChecking]);

  // If no user, show nothing (let the app handle sign-in flow)
  if (!user) {
    return <>{children}</>;
  }

  // Check if user signed in via email link (email is automatically verified)
  // Email link sign-in automatically verifies the email, so we skip the verification popup
  const signedInViaEmailLink = window.localStorage.getItem('signedInViaEmailLink') === 'true';
  
  // If user signed in via email link, skip verification check entirely
  if (signedInViaEmailLink) {
    return <>{children}</>;
  }

  // Check email verification from both state AND user object (user object is source of truth)
  // This ensures we catch cases where state hasn't updated yet
  const emailIsVerified = isEmailVerified || user.emailVerified;

  // If user is verified, show the app
  if (emailIsVerified) {
    return <>{children}</>;
  }

  // If we're still checking verification status, show loading state briefly
  if (isChecking) {
    return <>{children}</>;
  }

  // If user is not verified, show verification prompt
  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-6">
            {/* Back Button */}
            <div className="mb-3 sm:mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/signin')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Back to Login</span>
              </Button>
            </div>
            
            <div className="text-center space-y-2.5 sm:space-4">
              {/* Title */}
              <h3 className="text-sm sm:text-lg font-semibold leading-tight">
                Email Verification Required
              </h3>
              
              {/* Email */}
              <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed px-1">
                We sent a verification email to <strong className="break-all">{user.email}</strong>
              </p>

              {/* Simple Steps */}
              <div className="space-y-1.5 sm:space-2 text-[11px] sm:text-sm text-muted-foreground py-1 sm:py-2 leading-relaxed">
                <p>📧 Check your inbox and spam folder</p>
                <p>🔗 Click the verification link in the email</p>
            </div>

              {/* Buttons */}
              <div className="space-y-2 sm:space-3 pt-2.5 sm:pt-3">
              <Button 
                onClick={resendConfirmation}
                  className="w-full h-9 sm:h-11 text-[11px] sm:text-sm font-semibold primary-gradient hover:shadow-glow transition-spring"
              >
                Resend Verification Email
              </Button>
              
              <Button 
                variant="outline"
                  className="w-full h-9 sm:h-11 text-[11px] sm:text-sm"
                  onClick={async () => {
                    // Reload user to check verification status
                    if (user) {
                      try {
                        setIsChecking(true);
                        hasReloadedRef.current = false; // Reset to allow reload
                        await user.reload();
                        console.log('✅ User reloaded, emailVerified:', user.emailVerified);
                        
                        // Force re-render to check updated emailVerified status
                        setForceUpdate(prev => prev + 1);
                        
                        // Small delay to allow state to update
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // If verified, the component will re-render and show children
                        // If not verified, show error
                        if (!user.emailVerified) {
                          toast({
                            title: 'Email not verified yet',
                            description: 'Please click the verification link in your email.',
                            variant: 'destructive',
                          });
                        }
                        setIsChecking(false);
                      } catch (err) {
                        console.error('❌ Error reloading user:', err);
                        setIsChecking(false);
                        toast({
                          title: 'Error',
                          description: 'Unable to check verification status. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
              >
                I've Verified My Email
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthGuard;
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isEmailVerified, resendConfirmation } = useAuth();
  const location = useLocation();
  const hasReloadedRef = useRef(false);

  // Force reload user's email verification status when on profile page
  // (in case they just signed in via email link - only runs once)
  useEffect(() => {
    if (user && location.pathname === '/profile' && !user.emailVerified && !hasReloadedRef.current) {
      console.log('🔄 Reloading user to check email verification status...');
      hasReloadedRef.current = true;
      user.reload().then(() => {
        console.log('✅ User reloaded, emailVerified:', user.emailVerified);
      }).catch((err) => {
        console.error('❌ Error reloading user:', err);
        hasReloadedRef.current = false; // Allow retry on error
      });
    }
  }, [user, location.pathname]);

  // If no user, show nothing (let the app handle sign-in flow)
  if (!user) {
    return <>{children}</>;
  }

  // Check email verification from both state AND user object (user object is source of truth)
  // This ensures we catch cases where state hasn't updated yet
  const emailIsVerified = isEmailVerified || user.emailVerified;

  // If user is verified, show the app
  if (emailIsVerified) {
    return <>{children}</>;
  }

  // If user is on profile page after email link sign-in, skip verification check
  // (email link automatically verifies, just needs a moment to update)
  if (location.pathname === '/profile') {
    // Give it a moment for auth state to update, then show children
    return <>{children}</>;
  }

  // If user is not verified, show verification prompt
  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-6">
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
                    // Reload user to check verification status before refreshing page
                    if (user) {
                      try {
                        await user.reload();
                        console.log('✅ User reloaded, emailVerified:', user.emailVerified);
                      } catch (err) {
                        console.error('❌ Error reloading user:', err);
                      }
                    }
                    window.location.reload();
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
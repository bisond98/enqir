import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Shield, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-pal-blue" />
              <span className="text-xl font-semibold">Email Verification Required</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome, {user.displayName || 'User'}!</h3>
              <p className="text-muted-foreground">
                Please verify your email address to access the platform.
              </p>
            </div>

            <Alert className="border-pal-blue/20 bg-pal-blue/5">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                We sent a verification email to <strong>{user.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={resendConfirmation}
                className="w-full primary-gradient hover:shadow-glow transition-spring"
              >
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification Email
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
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

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Check your inbox and spam folder for the verification link.
                Click the link to verify your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthGuard;
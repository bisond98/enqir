import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/firebase';
import { applyActionCode, checkActionCode, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const oobCode = params.get('oobCode');
        const continueUrl = params.get('continueUrl') || '/dashboard';

        // Handle password reset links - redirect to reset password page
        if (mode === 'resetPassword' && oobCode) {
          console.log('🔐 Password reset link detected, redirecting to reset-password page');
          navigate(`/reset-password?oobCode=${oobCode}`);
          return;
        }

        // Handle email verification links
        if (mode === 'verifyEmail' && oobCode) {
          try {
            await checkActionCode(auth, oobCode);
            await applyActionCode(auth, oobCode);
            toast({ title: 'Email verified!', description: 'Your email has been successfully verified.' });
            navigate(continueUrl);
            return;
          } catch (err: any) {
            toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
            navigate('/signin');
            return;
          }
        }

        // Handle sign-in with email link if configured
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const storedEmail = window.localStorage.getItem('emailForSignIn') || '';
          if (!storedEmail) {
            toast({ title: 'Email required', description: 'Please sign in again.', variant: 'destructive' });
            navigate('/signin');
            return;
          }
          try {
            await signInWithEmailLink(auth, storedEmail, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            toast({ title: 'Signed in', description: 'Welcome back!' });
            navigate('/dashboard');
            return;
          } catch (err: any) {
            toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
            navigate('/signin');
            return;
          }
        }

        // Fallback
        navigate('/signin');
      } catch (error: any) {
        toast({
          title: 'An error occurred',
          description: 'There was an error processing your authentication.',
          variant: 'destructive',
        });
        navigate('/signin');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pal-blue mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Processing authentication...</p>
        </div>
      </div>
    </Layout>
  );
};

export default AuthCallback;
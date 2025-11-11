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

        console.log('🔍 Auth Callback - Full URL:', window.location.href);
        console.log('🔍 Auth Callback - Mode:', mode);
        console.log('🔍 Auth Callback - oobCode:', oobCode);
        console.log('🔍 Auth Callback - All params:', Object.fromEntries(params));
        console.log('🔍 Auth Callback - isSignInWithEmailLink:', isSignInWithEmailLink(auth, window.location.href));
        console.log('🔍 Auth Callback - localStorage email:', window.localStorage.getItem('emailForSignIn'));

        // Handle password reset links - redirect to reset password page
        if (mode === 'resetPassword' && oobCode) {
          console.log('🔐 Password reset link detected, redirecting to reset-password page');
          navigate(`/reset-password?oobCode=${oobCode}`);
          return;
        }

        // Handle sign-in with email link FIRST (from signup - automatically signs user in)
        // This must be checked BEFORE verifyEmail to properly handle email link authentication
        const isEmailLink = isSignInWithEmailLink(auth, window.location.href);
        console.log('🔗 Is email link?', isEmailLink);
        
        if (isEmailLink) {
          console.log('✅ Email link authentication detected!');
          let email = window.localStorage.getItem('emailForSignIn');
          console.log('📧 Email from localStorage:', email);
          
          if (!email && oobCode) {
            // Try to get email from action code if available
            console.log('🔍 Trying to get email from oobCode...');
            try {
              const actionCodeInfo = await checkActionCode(auth, oobCode);
              email = actionCodeInfo.data.email;
              console.log('✅ Got email from oobCode:', email);
            } catch (err) {
              console.error('❌ Could not get email from action code:', err);
            }
          }
          
          if (!email) {
            console.error('❌ No email found - cannot complete sign-in');
            toast({ 
              title: 'Email required', 
              description: 'Please provide your email address to complete sign-in.', 
              variant: 'destructive' 
            });
            navigate('/signin');
            return;
          }

          try {
            console.log('🔐 Attempting to sign in with email link...');
            // Sign in with email link (automatically verifies email and signs user in)
            const result = await signInWithEmailLink(auth, email, window.location.href);
            console.log('✅ Sign-in successful!', result.user.email);
            window.localStorage.removeItem('emailForSignIn');
            toast({ 
              title: 'Signed in successfully!', 
              description: 'Your email has been verified and you are now signed in.' 
            });
            // Redirect to profile page
            console.log('🔄 Redirecting to /profile...');
            navigate('/profile');
            return;
          } catch (err: any) {
            console.error('❌ Sign-in with email link error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            toast({ 
              title: 'Sign-in failed', 
              description: err.message || 'Unable to sign in. Please try again.', 
              variant: 'destructive' 
            });
            navigate('/signin');
            return;
          }
        }

        // Handle old email verification links (fallback for old verification method)
        if (mode === 'verifyEmail' && oobCode) {
          try {
            // Get email from action code before applying it
            const actionCodeInfo = await checkActionCode(auth, oobCode);
            const email = actionCodeInfo.data.email;
            
            // Apply the verification
            await applyActionCode(auth, oobCode);
            
            // Check if user is already signed in (from signup)
            if (auth.currentUser && auth.currentUser.email === email) {
              // User is already signed in, just verified email - redirect to profile
              toast({ 
                title: 'Email verified!', 
                description: 'Your email has been successfully verified. Welcome!' 
              });
              navigate('/profile');
              return;
            }
            
            // If user is not signed in, we can't automatically sign them in without password
            // But we can redirect them to sign in with a pre-filled email
            toast({ 
              title: 'Email verified!', 
              description: 'Your email has been successfully verified. Please sign in to continue.' 
            });
            navigate(`/signin?email=${encodeURIComponent(email)}`);
            return;
          } catch (err: any) {
            toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
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
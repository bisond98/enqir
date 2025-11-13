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
          
          // For email link sign-in, we MUST use the email from localStorage
          // This is the email that was used when sendSignInLinkToEmail was called
          // checkActionCode doesn't work reliably for email link sign-in
          const email = window.localStorage.getItem('emailForSignIn');
          console.log('📧 Email from localStorage:', email);
          
          if (!email) {
            console.error('❌ No email found in localStorage - user might be on different device/browser');
            toast({ 
              title: 'Email required', 
              description: 'Please enter the email address you used to sign up to complete sign-in.', 
              variant: 'destructive' 
            });
            // Redirect to sign-in page with email prompt
            // Store the callback URL so we can retry after getting email
            window.localStorage.setItem('pendingEmailLink', window.location.href);
            navigate('/signin?emailLink=true');
            return;
          }

          try {
            console.log('🔐 Attempting to sign in with email link...');
            console.log('📧 Using email:', email);
            console.log('🔗 Using URL:', window.location.href);
            
            // Sign in with email link (automatically verifies email and signs user in)
            // The email MUST match exactly what was used in sendSignInLinkToEmail
            const result = await signInWithEmailLink(auth, email, window.location.href);
            console.log('✅ Sign-in successful!', result.user.email);
            
            // Reload user to ensure emailVerified status is updated
            await result.user.reload();
            console.log('✅ User reloaded, emailVerified:', result.user.emailVerified);
            
            // Mark that user signed in via email link (email is automatically verified)
            window.localStorage.setItem('signedInViaEmailLink', 'true');
            window.localStorage.removeItem('emailForSignIn');
            window.localStorage.removeItem('pendingEmailLink'); // Clear any pending link
            
            toast({ 
              title: 'Signed in successfully!', 
              description: 'Your email has been verified and you are now signed in.' 
            });
            // Redirect to profile page immediately
            console.log('🔄 Redirecting to /profile...');
            navigate('/profile', { replace: true });
            return;
          } catch (err: any) {
            console.error('❌ Sign-in with email link error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            console.error('Email used:', email);
            console.error('URL used:', window.location.href);
            
            // If email mismatch, the email in localStorage doesn't match the link
            if (err.code === 'auth/invalid-email' || err.message?.includes('does not match')) {
              console.log('🔄 Email mismatch - localStorage email does not match link email');
              toast({ 
                title: 'Email mismatch', 
                description: 'The email in this link doesn\'t match. Please enter the email address you used to sign up.', 
                variant: 'destructive' 
              });
              // Store the callback URL and redirect to sign-in to get correct email
              window.localStorage.setItem('pendingEmailLink', window.location.href);
              navigate('/signin?emailLink=true');
              return;
            }
            
            toast({ 
              title: 'Sign-in failed', 
              description: err.message || 'Unable to sign in. Please try signing up again or use the sign-in page.', 
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
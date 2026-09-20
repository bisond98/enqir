import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

// Inline brand icons
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const MobileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SignInOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signInWithGoogle, signInWithApple } = useAuth();

  // Already signed in and verified? Go straight through.
  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnAfterSignIn') || '/dashboard';
    if (user && !authLoading && user.emailVerified) {
      sessionStorage.removeItem('returnAfterSignIn');
      navigate(returnTo, { replace: true });
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const dest = sessionStorage.getItem('returnAfterSignIn') || returnTo;
      if (firebaseUser && firebaseUser.emailVerified && !authLoading) {
        sessionStorage.removeItem('returnAfterSignIn');
        navigate(dest, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [user, authLoading, navigate]);

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  const handleApple = async () => {
    await signInWithApple();
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-white via-gray-50 to-gray-100">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Welcome to <span className="text-blue-600">Enqir</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 font-medium">
            Sign in or create an account — pick your way
          </p>
        </div>

        {/* Provider buttons */}
        <div className="w-full max-w-sm space-y-3.5">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-white text-gray-900 font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Apple */}
          <button
            onClick={handleApple}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-black text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.45)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.45)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <AppleIcon />
            Sign in with Apple
          </button>

          {/* Mobile */}
          <button
            onClick={() => navigate('/signin/mobile', { state: (location.state as any) || undefined })}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-blue-600 text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <MobileIcon />
            Continue with Mobile
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1.5" aria-hidden="true">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Email */}
          <button
            onClick={() => navigate('/signin/email', { state: (location.state as any) || undefined })}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-gray-800 bg-gray-50 text-gray-900 font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.35)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.35)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <MailIcon />
            Continue with Email
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-600">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
        </p>
      </div>
    </Layout>
  );
};

export default SignInOptions;

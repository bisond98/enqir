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

/**
 * Exact copy of the homescreen "minimal professional sketch" story doodle
 * (the one drawn around the logo on the landing page), reused here so the
 * sign-up page carries the same brand story:
 * User → AI Engine → Match → Success, with animated flow lines.
 */
const HomescreenSketchDoodle = () => (
  <div className="relative pointer-events-none opacity-30">
    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* Central Hub - Logo Area */}
      <g transform="translate(200, 200)" opacity="0.8">
        <circle cx="0" cy="0" r="25" fill="none" stroke="#6B7280" strokeWidth="2"/>
        <circle cx="0" cy="0" r="20" fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="0" cy="0" r="15" fill="none" stroke="#6B7280" strokeWidth="1" opacity="0.5"/>
      </g>

      {/* Top - User with Smartphone */}
      <g transform="translate(200, 80)" opacity="0.8">
        <circle cx="0" cy="0" r="12" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
        <circle cx="-3" cy="-2" r="1.5" fill="#6B7280"/>
        <circle cx="3" cy="-2" r="1.5" fill="#6B7280"/>
        <path d="M-2 3 Q0 4 2 3" stroke="#6B7280" strokeWidth="1.2" fill="none"/>
        <rect x="-8" y="8" width="16" height="20" fill="none" stroke="#6B7280" strokeWidth="1" rx="2"/>
        <rect x="-6" y="12" width="12" height="8" fill="#6B7280" opacity="0.3"/>
        <text x="0" y="35" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">User</text>
      </g>

      {/* Left - AI Processing Center */}
      <g transform="translate(100, 200)" opacity="0.8">
        <rect x="-15" y="-12" width="30" height="24" fill="none" stroke="#6B7280" strokeWidth="1.5" rx="3"/>
        <circle cx="-6" cy="0" r="2" fill="#6B7280"/>
        <circle cx="0" cy="0" r="2" fill="#6B7280"/>
        <circle cx="6" cy="0" r="2" fill="#6B7280"/>
        <path d="M-4 -6 L4 6 M4 -6 L-4 6" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
        <text x="0" y="25" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">AI Engine</text>
        {/* Processing lines */}
        <path d="M-20 -5 L-15 -5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
        <path d="M-20 0 L-15 0" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
        <path d="M-20 5 L-15 5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
        <path d="M15 -5 L20 -5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
        <path d="M15 0 L20 0" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
        <path d="M15 5 L20 5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
      </g>

      {/* Right - Matching Network */}
      <g transform="translate(300, 200)" opacity="0.8">
        <circle cx="0" cy="0" r="15" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="10" fill="none" stroke="#6B7280" strokeWidth="1.2" opacity="0.7"/>
        <circle cx="0" cy="0" r="5" fill="none" stroke="#6B7280" strokeWidth="1" opacity="0.5"/>
        <circle cx="0" cy="0" r="2" fill="#6B7280"/>
        <text x="0" y="22" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">Match</text>
        {/* Network nodes */}
        <circle cx="-12" cy="-8" r="2" fill="#6B7280" opacity="0.6"/>
        <circle cx="12" cy="-8" r="2" fill="#6B7280" opacity="0.6"/>
        <circle cx="-12" cy="8" r="2" fill="#6B7280" opacity="0.6"/>
        <circle cx="12" cy="8" r="2" fill="#6B7280" opacity="0.6"/>
        <path d="M-12 -8 L-5 -3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
        <path d="M12 -8 L5 -3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
        <path d="M-12 8 L-5 3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
        <path d="M12 8 L5 3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
      </g>

      {/* Bottom - Success Celebration */}
      <g transform="translate(200, 320)" opacity="0.8">
        <circle cx="0" cy="0" r="16" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
        <path d="M-6 0 L-2 4 L6 -2" stroke="#6B7280" strokeWidth="2.5" fill="none"/>
        <text x="0" y="25" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">Success!</text>
        {/* Celebration elements */}
        <path d="M-20 -8 L-18 -6 L-16 -8 L-18 -10 Z" fill="#6B7280" opacity="0.6"/>
        <path d="M20 -8 L22 -6 L24 -8 L22 -10 Z" fill="#6B7280" opacity="0.6"/>
        <path d="M-20 8 L-18 10 L-16 8 L-18 6 Z" fill="#6B7280" opacity="0.6"/>
        <path d="M20 8 L22 10 L24 8 L22 6 Z" fill="#6B7280" opacity="0.6"/>
      </g>

      {/* Dynamic Flow Lines */}
      <path d="M200 92 L200 175" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#signin-arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M130 200 L175 200" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#signin-arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="0.5s"/>
      </path>
      <path d="M225 200 L270 200" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#signin-arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1s"/>
      </path>
      <path d="M100 225 L175 275" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#signin-arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1.5s"/>
      </path>
      <path d="M300 225 L225 275" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#signin-arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2s"/>
      </path>

      {/* Feature Icons Around the Hub */}
      <g transform="translate(150, 120)" opacity="0.6">
        <circle cx="0" cy="0" r="8" fill="#6B7280"/>
        <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">🔒</text>
        <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Secure</text>
      </g>

      <g transform="translate(250, 120)" opacity="0.6">
        <circle cx="0" cy="0" r="8" fill="#6B7280"/>
        <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">⚡</text>
        <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Fast</text>
      </g>

      <g transform="translate(150, 280)" opacity="0.6">
        <circle cx="0" cy="0" r="8" fill="#6B7280"/>
        <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">💬</text>
        <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Chat</text>
      </g>

      <g transform="translate(250, 280)" opacity="0.6">
        <circle cx="0" cy="0" r="8" fill="#6B7280"/>
        <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">⭐</text>
        <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Quality</text>
      </g>

      {/* Corner Decorative Elements */}
      <g transform="translate(60, 60)" opacity="0.4">
        <circle cx="0" cy="0" r="4" fill="#6B7280"/>
        <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">💡</text>
      </g>

      <g transform="translate(340, 60)" opacity="0.4">
        <circle cx="0" cy="0" r="4" fill="#6B7280"/>
        <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">🎯</text>
      </g>

      <g transform="translate(60, 340)" opacity="0.4">
        <circle cx="0" cy="0" r="4" fill="#6B7280"/>
        <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">💰</text>
      </g>

      <g transform="translate(340, 340)" opacity="0.4">
        <circle cx="0" cy="0" r="4" fill="#6B7280"/>
        <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">🎉</text>
      </g>

      {/* Arrow marker definition */}
      <defs>
        <marker id="signin-arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6B7280"/>
        </marker>
      </defs>
    </svg>
  </div>
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
      <div className="relative min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 pt-20 pb-20 sm:pt-10 sm:pb-10 bg-gradient-to-b from-white via-gray-50 to-gray-100 overflow-x-hidden">

        {/* Heading layered over the homescreen story doodle — same composition as the landing page,
            where the sketch wraps around the brand at the center hub */}
        <div className="relative z-10 w-full h-44 sm:h-96 max-w-[24rem] sm:max-w-md mx-auto mb-4 sm:mb-5 -translate-y-[7rem]">
          <HomescreenSketchDoodle />

          {/* Heading text just above the centre of the doodle */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center translate-y-24 text-center">
            <h1 className="flex items-baseline justify-center gap-1 flex-wrap">
              <span className="text-8xl sm:text-9xl font-extrabold tracking-tight text-blue-600">Enqir</span>
            </h1>
            <p className="mt-3 text-[10px] sm:text-sm text-black font-bold">
              The AI-powered trusted marketplace
            </p>
          </div>
        </div>

        {/* Provider buttons — pushed to the lower part of the screen on mobile, heading stays put */}
        <div className="relative z-10 w-full max-w-sm space-y-3 sm:space-y-3.5 mt-auto sm:mt-0 -translate-y-[4.75rem]">
          {/* Mobile */}
          <button
            onClick={() => navigate('/signin/mobile', { state: (location.state as any) || undefined })}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-blue-600 text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <MobileIcon />
            Continue with Mobile
          </button>

          {/* Email */}
          <button
            onClick={() => navigate('/signin/email', { state: (location.state as any) || undefined })}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-white text-gray-900 font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <MailIcon />
            Continue with Email
          </button>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-white text-gray-900 font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1.5" aria-hidden="true">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Apple */}
          <button
            onClick={handleApple}
            className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-black text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.45)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.45)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer"
          >
            <AppleIcon />
            Sign in with Apple
          </button>
        </div>

        {/* Footer */}
        <p className="relative z-10 mt-5 sm:mt-8 text-[10px] text-gray-500 font-medium text-center max-w-xs -translate-y-[4.75rem]">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline text-blue-600/90 hover:text-blue-700">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline text-blue-600/90 hover:text-blue-700">Privacy Policy</a>
        </p>
      </div>
    </Layout>
  );
};

export default SignInOptions;

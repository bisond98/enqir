import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  // Already signed in and verified? Go straight through.
  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnAfterSignIn') || '/';
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

  return (
    <Layout>
      <div className="relative min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 pt-20 pb-20 sm:pt-10 sm:pb-10 bg-gradient-to-b from-white via-gray-50 to-gray-100 overflow-x-hidden">

        {/* Heading layered over the homescreen story doodle — same composition as the landing page,
            where the sketch wraps around the brand at the center hub */}
        <div className="relative z-10 w-full h-44 sm:h-96 max-w-[24rem] sm:max-w-md mx-auto mb-4 sm:mb-5 -translate-y-[7rem]">
          {/* Story doodle — pushed to the LOWER part of the block so it sits
              beneath the wordmark instead of cluttering it */}
          <div className="absolute inset-x-0 top-56 sm:top-80 bottom-0 flex justify-center">
            <div className="w-4/5 sm:w-3/4 h-full">
              <HomescreenSketchDoodle />
            </div>
          </div>

          {/* Heading text — absolutely positioned exactly where it was before:
              vertically centered in the block, nudged down 24 (translate-y-24) */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center translate-y-24 text-center">
            <h1 className="flex items-baseline justify-center gap-1 flex-wrap">
              <span className="relative text-8xl sm:text-9xl font-extrabold tracking-tight text-gray-950 inline-flex items-center justify-center px-8 sm:px-12 py-8 sm:py-10 select-none">
                {/* Painterly brush swash — a semi-transparent grey wash behind the wordmark,
                    strong enough to read against the page's white-to-grey gradient */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 640 260"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="brushSwashSignup" x1="0" y1="0" x2="1" y2="0.6">
                      <stop offset="0%" stopColor="#e2e5e9" />
                      <stop offset="50%" stopColor="#d8dce1" />
                      <stop offset="100%" stopColor="#ccd1d7" />
                    </linearGradient>
                  </defs>
                  {/* The stroke: thick in the middle, tapering to a fine point on both ends —
                      the way a flat brush deposits paint in one confident pass */}
                  <path
                    d="M18 158
                       C 40 120, 96 96, 168 92
                       C 250 86, 330 60, 420 62
                       C 500 64, 570 84, 614 108
                       C 620 112, 620 120, 610 126
                       C 560 158, 470 178, 380 182
                       C 290 186, 190 192, 112 184
                       C 66 180, 30 172, 18 158 Z"
                    fill="url(#brushSwashSignup)"
                  />
                  {/* A single lighter pass underneath — like the brush was reloaded once */}
                  <path
                    d="M60 150 C 170 118, 330 96, 520 108"
                    stroke="#f2f3f5"
                    strokeWidth="16"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                  {/* One fine darker edge at the tail — the dry end of the stroke */}
                  <path
                    d="M96 182 C 180 194, 300 192, 420 178"
                    stroke="#c3c8ce"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                </svg>
                <span className="relative z-10">Enqir</span>
              </span>
            </h1>
            <p className="-mt-4 text-[10px] sm:text-sm text-black font-bold">
              The AI-powered trust-based marketplace
            </p>
          </div>
        </div>

        {/* Provider buttons — pushed to the lower part of the screen on mobile, heading stays put.
            Card styled like the Enter-Phone-Number page's form card (border, shadow stack, padding). */}
        <div className="relative z-10 w-full max-w-sm mt-auto sm:mt-0 -translate-y-[3rem]">
          <div className="border-[0.25px] border-black/30 bg-white/95 backdrop-blur-sm rounded-3xl px-7 py-9 sm:px-10 sm:py-12 shadow-[0_2px_0_0_rgba(0,0,0,0.09),0_0_14px_rgba(0,0,0,0.08),0_10px_26px_rgba(0,0,0,0.14)]">
            <div className="w-full space-y-4">
          {/* Mobile */}
          <button
            onClick={() => navigate('/signin/mobile', { state: (location.state as any) || undefined })}
            className="w-full h-14 sm:h-16 min-h-[52px] flex items-center justify-center gap-3 border border-slate-300 bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-base sm:text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.18),0_6px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.12)] hover:translate-y-[-1px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.18),0_3px_6px_rgba(0,0,0,0.10)] active:translate-y-[2px] transition-all duration-200 transform cursor-pointer"
          >
            <MobileIcon />
            Continue with Mobile
          </button>

          {/* Email */}
          <button
            onClick={() => navigate('/signin/email', { state: (location.state as any) || undefined })}
            className="w-full h-14 sm:h-16 min-h-[52px] flex items-center justify-center gap-3 border border-slate-300 bg-gradient-to-b from-white to-slate-100 text-gray-900 font-bold text-base sm:text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.12),0_6px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.10)] hover:translate-y-[-1px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08)] active:translate-y-[2px] transition-all duration-200 transform cursor-pointer"
          >
            <MailIcon />
            Continue with Email
          </button>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full h-14 sm:h-16 min-h-[52px] flex items-center justify-center gap-3 border border-slate-300 bg-gradient-to-b from-white to-slate-100 text-gray-900 font-bold text-base sm:text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.12),0_6px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.10)] hover:translate-y-[-1px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08)] active:translate-y-[2px] transition-all duration-200 transform cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>
            </div>
          </div>
        </div>

        {/* Footer — horizontally centered regardless of max-width */}
        <p className="relative z-10 mt-3 sm:mt-6 text-[8px] text-gray-500 font-medium text-center w-full max-w-xs mx-auto -translate-y-[3rem]">
          By continuing you agree to our{' '}
          <Link to="/terms-and-conditions" className="underline text-blue-600/90 hover:text-blue-700">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy-policy" className="underline text-blue-600/90 hover:text-blue-700">Privacy Policy</Link>
        </p>
      </div>
    </Layout>
  );
};

export default SignInOptions;

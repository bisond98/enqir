import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { ArrowLeft, Phone, Loader2 } from "lucide-react";
import { friendlyError } from "@/utils/friendlyError";

// This page is locked to Indian numbers only
const INDIA_CODE = "+91";
const INDIA_MAX_DIGITS = 10;
const formatDigits = (d: string) => d.replace(/(\d{5})(?=\d)/, "$1 ");
const maxDigits = INDIA_MAX_DIGITS;

// Hand-drawn 2D doodles themed on Enqir: enquiries, chats, AI, verified sellers, payments & services
const DoodleAI = () => (
  <svg viewBox="0 0 64 64" className="w-9 h-9 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="18" y="24" width="28" height="22" rx="6" />
    <circle cx="27" cy="34" r="2" fill="currentColor" stroke="none" />
    <circle cx="37" cy="34" r="2" fill="currentColor" stroke="none" />
    <path d="M28 41c2.5 2 5.5 2 8 0" />
    <path d="M32 24v-5" />
    <circle cx="32" cy="16" r="2.5" />
    <path d="M50 8l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
    <path d="M11 40l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </svg>
);

const DoodleChat = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 18c0-4 3-7 7-7h26c4 0 7 3 7 7v14c0 4-3 7-7 7H29l-10 9v-9h-2c-3 0-5-3-5-7z" />
    <circle cx="25" cy="25" r="2" fill="currentColor" stroke="none" />
    <circle cx="32" cy="25" r="2" fill="currentColor" stroke="none" />
    <circle cx="39" cy="25" r="2" fill="#000000" stroke="none" />
  </svg>
);

const DoodleWrench = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M45 11a11 11 0 0 0-14 14L14 42a5.5 5.5 0 0 0 8 8l17-17a11 11 0 0 0 14-14l-7 7-6-1-1-6z" />
  </svg>
);

const DoodleRupee = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="19" />
    <path d="M24 22h16M24 28h16M30 22c6 0 9 2 9 6s-3 6-9 6l11 10" />
  </svg>
);

const DoodleShield = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 10l16 6v12c0 12-8 20-16 24-8-4-16-12-16-24V16z" />
    <path d="M25 32l5 5 10-11" />
  </svg>
);

const DoodleEnquiry = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10h20l10 10v34H16z" />
    <path d="M36 10v10h10" />
    <path d="M23 30h16M23 36h16M23 42h9" />
    <path d="M47 51l7-7 4 4-7 7-5 1z" />
  </svg>
);

const DoodleSparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l2.5 7.5L26 14l-7.5 2.5L16 24l-2.5-7.5L6 14l7.5-2.5z" />
  </svg>
);

const DoodlePadlock = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="18" y="28" width="28" height="24" rx="6" />
    <path d="M24 28v-6a8 8 0 0 1 16 0v6" />
    <circle cx="32" cy="38" r="2.5" fill="currentColor" stroke="none" />
    <path d="M32 40v5" />
  </svg>
);

const DoodleConnected = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="6" />
    <rect x="42" y="42" width="12" height="12" rx="3" />
    <path d="M20 20l22 22" />
    <path d="M38 12h8a6 6 0 0 1 6 6v8" strokeDasharray="3 4" />
    <path d="M26 52h-8a6 6 0 0 1-6-6v-8" strokeDasharray="3 4" />
  </svg>
);

const DoodleHandshake = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 26l10-6 12 4 12-4 10 6" />
    <path d="M16 20v16l10 8c2 1.5 4 1 5.5-.5L42 34c1.5-1.5 1-4-1-5" />
    <path d="M16 36h-6V20" />
    <path d="M48 20v16h-6" />
    <path d="M28 30l4 4M34 28l4 4" />
  </svg>
);

const DoodleFingerprint = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20a17 17 0 0 1 24 0" />
    <path d="M16 28a21 21 0 0 1 32 0" />
    <path d="M22 34a14 14 0 0 1 20 0" />
    <path d="M27 40a8 8 0 0 1 10 0" />
    <path d="M32 46v4" />
  </svg>
);

const DoodleKey = () => (
  <svg viewBox="0 0 64 64" className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="20" cy="24" r="9" />
    <circle cx="20" cy="24" r="3" />
    <path d="M26 30l22 22M42 46l4-4M36 40l4-4" />
  </svg>
);

const DoodleCloudLock = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 40a10 10 0 0 1-2-19.8A14 14 0 0 1 43 15a11 11 0 0 1 5 21" />
    <rect x="25" y="38" width="14" height="12" rx="3" />
    <path d="M28 38v-3a4 4 0 0 1 8 0v3" />
    <circle cx="32" cy="43.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const DoodleChip = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="20" y="20" width="24" height="24" rx="4" />
    <rect x="27" y="27" width="10" height="10" rx="2" />
    <path d="M26 20v-6M32 20v-6M38 20v-6M26 50v-6M32 50v-6M38 50v-6M20 26h-6M20 32h-6M20 38h-6M50 26h-6M50 32h-6M50 38h-6" />
  </svg>
);

const DoodleWifi = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 26a30 30 0 0 1 44 0" />
    <path d="M17 34a20 20 0 0 1 30 0" />
    <path d="M24 42a11 11 0 0 1 16 0" />
    <circle cx="32" cy="50" r="2.5" fill="#000000" />
  </svg>
);

const DoodleEyeScan = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 32c6-10 15-16 26-16s20 6 26 16c-6 10-15 16-26 16S12 42 6 32z" />
    <circle cx="32" cy="32" r="7" />
    <circle cx="32" cy="32" r="2" fill="#000000" />
  </svg>
);

const DoodleBolt = () => (
  <svg viewBox="0 0 64 64" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M34 6L16 36h12l-4 22 22-32H34z" />
  </svg>
);

const DoodleStar = () => (
  <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l3 7 7 1-5 5 1.5 7-6.5-3.5L9.5 23 11 16 6 11l7-1z" />
  </svg>
);

const DoodlePlus = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M16 7v18M7 16h18" />
  </svg>
);

const DoodleRing = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="16" cy="16" r="10" />
  </svg>
);

const DoodlePhone = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="22" y="8" width="20" height="48" rx="5" />
    <path d="M28 13h8" />
    <circle cx="32" cy="49" r="2.5" fill="#000000" />
  </svg>
);

const DoodleLocation = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 56s16-14 16-27A16 16 0 0 0 16 29c0 13 16 27 16 27z" />
    <circle cx="32" cy="28" r="6" />
  </svg>
);

const DoodleCamera = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="20" width="44" height="30" rx="6" />
    <circle cx="32" cy="35" r="9" />
    <path d="M24 20l3-6h10l3 6" />
    <circle cx="32" cy="35" r="3" fill="#000000" />
  </svg>
);

const DoodleStarBadge = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="26" r="14" />
    <path d="M32 19l2.5 5 5.5.8-4 4 1 5.5-5-2.7-5 2.7 1-5.5-4-4 5.5-.8z" />
    <path d="M25 39l-4 17 11-6 11 6-4-17" />
  </svg>
);

const DoodleEnvelope = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="12" y="18" width="40" height="28" rx="5" />
    <path d="M12 22l20 14 20-14" />
  </svg>
);

const DoodleClock = () => (
  <svg viewBox="0 0 64 64" className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="20" />
    <path d="M32 20v12l8 6" />
  </svg>
);

const DoodleHeart = () => (
  <svg viewBox="0 0 64 64" className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 52S12 40 12 26a10 10 0 0 1 20-3 10 10 0 0 1 20 3c0 14-20 26-20 26z" />
    <path d="M22 26h6l3-4 4 8 3-4h6" />
  </svg>
);

const DoodleGlobe = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="20" />
    <ellipse cx="32" cy="32" rx="9" ry="20" />
    <path d="M12 32h40M15 22h34M15 42h34" />
    <circle cx="46" cy="18" r="3" />
  </svg>
);

const SignInMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, sendPhoneOTP, verifyPhoneOTP } = useAuth();

  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otp = otpDigits.join("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const RESEND_SECONDS = 60;
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mobile keypad scroll fix: while the keyboard is open the browser scrolls
  // the window to reveal the input; when it dismisses, some browsers leave the
  // window scrolled. Since this page is designed to fit the viewport, any
  // scroll offset is wrong — snap back to the top whenever the viewport
  // resizes back to full height (keyboard closed).
  useEffect(() => {
    const check = () => {
      const vv = window.visualViewport;
      const keyboardOpen = vv ? vv.height < window.innerHeight * 0.85 : false;
      if (!keyboardOpen && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.visualViewport?.addEventListener('resize', check);
    window.addEventListener('resize', check);
    check();
    return () => {
      window.visualViewport?.removeEventListener('resize', check);
      window.removeEventListener('resize', check);
    };
  }, []);

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

  // Focus first OTP box when entering OTP stage
  useEffect(() => {
    if (stage === 'otp') {
      otpRefs.current[0]?.focus();
      setResendSeconds(RESEND_SECONDS);
    }
  }, [stage]);

  // Count down the resend timer while on the OTP stage
  useEffect(() => {
    if (stage !== 'otp' || resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [stage, resendSeconds]);

  // OTP box helpers
  const setOtpDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    setOtpDigits(digits.split("").concat(Array(6 - digits.length).fill("")));
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSendOtp = async () => {
    setError("");
    const digits = phoneDigits.replace(/\D/g, "");
    if (digits.length !== maxDigits) {
      setError(`Please enter a valid ${maxDigits}-digit mobile number.`);
      return;
    }      setLoading(true);
      try {
        const result = await sendPhoneOTP(`${INDIA_CODE}${digits}`);
        if (result?.error) {
          setError(friendlyError(result.error, "Failed to send OTP. Please try again."));
          return false;
        } else if (result?.verificationId) {
          setVerificationId(result.verificationId);
          setStage("otp");
          return true;
        }
        return false;
      } finally {
        setLoading(false);
      }
    };

  const handleResend = async () => {
    const ok = await handleSendOtp();
    if (ok) {
      setResendSeconds(RESEND_SECONDS);
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const code = otp;
    if (code.length < 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (!verificationId) {
      setError("Session expired. Please request a new OTP.");
      setStage("phone");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyPhoneOTP(code, verificationId);
      if (result?.error) {
        setError(friendlyError(result.error, "OTP verification failed. Please try again."));
      } else {
        const returnTo = sessionStorage.getItem('returnAfterSignIn');
        sessionStorage.removeItem('returnAfterSignIn');
        navigate(returnTo || '/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Required invisible reCAPTCHA anchor for Firebase phone auth */}
      <div id="recaptcha-container" />

      <div className="relative min-h-[100dvh] flex flex-col items-center justify-start px-4 pt-14 sm:pt-16 pb-10 bg-gradient-to-b from-white via-gray-50 to-gray-100 overflow-hidden">
        {/* Brand header — same as the sign-up (sign-in options) page */}
        <style>{`@keyframes doodleFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
          .doodle-float { animation: doodleFloat 5s ease-in-out infinite; }
          .doodle-float-slow { animation: doodleFloat 7s ease-in-out 1.2s infinite; }`}</style>
        <div className="text-center mb-6 sm:mb-8 select-none relative inline-flex items-center justify-center px-8 sm:px-12 py-8 sm:py-10">
          {/* Painterly brush swash — single tapered stroke, like a spot illustration in a print design */}
          <svg
            aria-hidden="true"
            viewBox="0 0 640 260"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="brushSwash" x1="0" y1="0" x2="1" y2="0.6">
                <stop offset="0%" stopColor="#eceef0" />
                <stop offset="50%" stopColor="#e4e7ea" />
                <stop offset="100%" stopColor="#dcdfE3" />
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
              fill="url(#brushSwash)"
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
              stroke="#d2d6da"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.45"
            />
          </svg>
          <span className="relative text-8xl sm:text-9xl font-extrabold tracking-tight text-gray-950">Enqir</span>
        </div>
        {/* Back — pinned to the top of the page, just below the app header */}
        <button
          onClick={() => navigate('/signin')}
          aria-label="Back to sign-in options"
          className="absolute top-3 left-4 inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer z-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-sm -mt-6 sm:-mt-8">

          {/* Heading — phone stage keeps its input as the label; OTP stage shows the chip */}
          <div className="text-center mb-8">
            {stage !== 'phone' && (
              <>
                <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-900">
                  <Phone className="h-3.5 w-3.5 fill-gray-900" />
                  Enter the OTP
                </span>
                <p className="mt-2 text-xs text-gray-500 font-medium">
                  {`Sent to ${INDIA_CODE} ${formatDigits(phoneDigits)}`}
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white text-center">
              {error}
            </div>
          )}

          {/* Form card — same card as the email login/sign-up page */}
          <div className="border-[0.25px] border-black/30 bg-white/95 backdrop-blur-sm rounded-3xl px-7 py-9 sm:px-10 sm:py-12">
          {stage === 'phone' ? (
            <div className="space-y-4">
              {/* Phone input row */}
              <div className="flex gap-2">
                {/* Country code — locked to India for this page */}
                <div
                  className="h-12 sm:h-14 min-h-[48px] shrink-0 rounded-[12px] border-[1.5px] border-slate-200 bg-white text-gray-900 flex items-center px-3 text-sm font-bold select-none shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)] focus-within:border-black focus-within:ring-3 focus-within:ring-black/15 transition-all duration-200"
                  aria-label="Country code (India only)"
                >
                  🇮🇳 +91
                </div>

                {/* Number input — "Enter your phone number" with call icon lives inside the field */}
                <div className="relative flex-1 min-w-0">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 fill-gray-900 text-gray-900 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-label="Enter your phone number"
                    placeholder="Enter your phone number"
                    value={phoneDigits}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
                      setPhoneDigits(formatDigits(digits));
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
                    className="w-full h-12 sm:h-14 min-h-[48px] rounded-[12px] border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-base font-medium text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)] focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_3px_10px_rgba(0,0,0,0.15)] focus:outline-none transition-all duration-200 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] placeholder:text-center"
                    style={{ fontSize: '16px' }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Send OTP button */}
              <button
                onClick={handleSendOtp}
                disabled={loading || phoneDigits.replace(/\D/g, "").length !== maxDigits}
                className="w-full h-14 sm:h-16 min-h-[52px] flex items-center justify-center gap-3 border border-slate-300 bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-base sm:text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.18),0_6px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.12)] hover:translate-y-[-1px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.18),0_3px_6px_rgba(0,0,0,0.10)] active:translate-y-[2px] transition-all duration-200 transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* OTP input — one box per digit */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`OTP digit ${i + 1}`}
                    value={digit}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
                      if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus();
                      if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus();
                      if (e.key === 'Enter') handleVerifyOtp();
                    }}
                    className="w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-[0.5px] border-black bg-white text-center text-2xl font-bold text-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] focus:outline-none"
                    style={{ fontSize: '24px' }}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\D/g, "").length < 6}
                className="w-full h-14 sm:h-16 min-h-[52px] flex items-center justify-center gap-3 border border-slate-300 bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-base sm:text-lg rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.18),0_6px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.12)] hover:translate-y-[-1px] active:shadow-[0_2px_0_0_rgba(0,0,0,0.18),0_3px_6px_rgba(0,0,0,0.10)] active:translate-y-[2px] transition-all duration-200 transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              {/* Resend OTP with countdown */}
              <button
                onClick={handleResend}
                disabled={loading || resendSeconds > 0}
                className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            </div>
          )}
          </div>

          {/* Business-model doodle — same sketch that used to sit behind the header,
              now placed below the card at the same size */}
          <div className="-mt-10 pt-0 flex justify-center pointer-events-none select-none" aria-hidden="true">
            <svg className="w-[min(86vw,400px)] max-w-none aspect-square" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              {/* Central hub rings */}
              <g transform="translate(200, 200)" opacity="0.85">
                <circle cx="0" cy="0" r="34" fill="none" stroke="#111827" strokeWidth="2" />
                <circle cx="0" cy="0" r="27" fill="none" stroke="#111827" strokeWidth="1.2" opacity="0.7" />
                <circle cx="0" cy="0" r="20" fill="none" stroke="#111827" strokeWidth="1" opacity="0.85" />
              </g>

              {/* Top - User with Smartphone */}
              <g transform="translate(200, 80)" opacity="0.95">
                <circle cx="0" cy="0" r="12" fill="none" stroke="#111827" strokeWidth="2" />
                <circle cx="-3" cy="-2" r="1.5" fill="#111827" />
                <circle cx="3" cy="-2" r="1.5" fill="#111827" />
                <path d="M-2 3 Q0 4 2 3" stroke="#111827" strokeWidth="1.2" fill="none" />
                <rect x="-8" y="8" width="16" height="20" fill="none" stroke="#111827" strokeWidth="1" rx="2" />
                <rect x="-6" y="12" width="12" height="8" fill="#111827" opacity="0.85" />
                <text x="0" y="42" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">User</text>
              </g>

              {/* Left - AI Processing Center */}
              <g transform="translate(100, 200)" opacity="0.95">
                <rect x="-15" y="-12" width="30" height="24" fill="none" stroke="#111827" strokeWidth="2" rx="3" />
                <circle cx="-6" cy="0" r="2" fill="#111827" />
                <circle cx="0" cy="0" r="2" fill="#111827" />
                <circle cx="6" cy="0" r="2" fill="#111827" />
                <path d="M-4 -6 L4 6 M4 -6 L-4 6" stroke="#111827" strokeWidth="1" opacity="0.9" />
                <text x="0" y="-18" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">AI Engine</text>
                <path d="M-20 -5 L-15 -5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                <path d="M-20 0 L-15 0" stroke="#111827" strokeWidth="1" opacity="0.7" />
                <path d="M-20 5 L-15 5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                <path d="M15 -5 L20 -5" stroke="#111827" strokeWidth="1" opacity="0.7" />
                <path d="M15 0 L20 0" stroke="#111827" strokeWidth="1" opacity="0.7" />
                <path d="M15 5 L20 5" stroke="#111827" strokeWidth="1" opacity="0.7" />
              </g>

              {/* Right - Matching Network */}
              <g transform="translate(300, 200)" opacity="0.95">
                <circle cx="0" cy="0" r="15" fill="none" stroke="#111827" strokeWidth="2" />
                <circle cx="0" cy="0" r="10" fill="none" stroke="#111827" strokeWidth="1.2" opacity="0.7" />
                <circle cx="0" cy="0" r="5" fill="none" stroke="#111827" strokeWidth="1" opacity="0.85" />
                <circle cx="0" cy="0" r="2" fill="#111827" />
                <text x="0" y="-20" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">Match</text>
                <circle cx="-12" cy="-8" r="2" fill="#111827" opacity="0.9" />
                <circle cx="12" cy="-8" r="2" fill="#111827" opacity="0.9" />
                <circle cx="-12" cy="8" r="2" fill="#111827" opacity="0.9" />
                <circle cx="12" cy="8" r="2" fill="#111827" opacity="0.9" />
                <path d="M-12 -8 L-5 -3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                <path d="M12 -8 L5 -3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                <path d="M-12 8 L-5 3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
                <path d="M12 8 L5 3" stroke="#111827" strokeWidth="0.8" opacity="0.7" />
              </g>

              {/* Bottom - Success Celebration */}
              <g transform="translate(200, 320)" opacity="0.95">
                <circle cx="0" cy="0" r="16" fill="none" stroke="#111827" strokeWidth="2" />
                <path d="M-6 0 L-2 4 L6 -2" stroke="#111827" strokeWidth="2.5" fill="none" />
                <text x="0" y="-22" textAnchor="middle" fontSize="9" fill="#1F2937" fontWeight="500">Success!</text>
                <path d="M-20 -8 L-18 -6 L-16 -8 L-18 -10 Z" fill="#111827" opacity="0.9" />
                <path d="M20 -8 L22 -6 L24 -8 L22 -10 Z" fill="#111827" opacity="0.9" />
                <path d="M-20 8 L-18 10 L-16 8 L-18 6 Z" fill="#111827" opacity="0.9" />
                <path d="M20 8 L22 10 L24 8 L22 6 Z" fill="#111827" opacity="0.9" />
              </g>

              {/* Animated flow lines with arrowheads */}
              <path d="M200 112 L200 166" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" />
              </path>
              <path d="M130 200 L166 200" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="0.5s" />
              </path>
              <path d="M234 200 L270 200" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1s" />
              </path>
              <path d="M200 234 L200 288" stroke="#111827" strokeWidth="2" fill="none" opacity="0.9" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1.5s" />
              </path>
              <path d="M118 218 L172 262" stroke="#111827" strokeWidth="2" fill="none" opacity="0.75" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2s" />
              </path>
              <path d="M282 218 L228 262" stroke="#111827" strokeWidth="2" fill="none" opacity="0.75" markerEnd="url(#signin-mobile-arrowhead)">
                <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2.5s" />
              </path>

              {/* Feature satellites: Secure / Fast / Chat / Quality */}
              {[
                { x: 150, y: 120, emoji: "🔒", label: "Secure" },
                { x: 250, y: 120, emoji: "⚡", label: "Fast" },
                { x: 150, y: 280, emoji: "💬", label: "Chat" },
                { x: 250, y: 280, emoji: "⭐", label: "Quality" },
              ].map((s) => (
                <g key={s.label} transform={`translate(${s.x}, ${s.y})`} opacity="0.85">
                  <circle cx="0" cy="0" r="8" fill="#111827" />
                  <text x="0" y="2" textAnchor="middle" fontSize="7" fill="white">{s.emoji}</text>
                  <text x="0" y="17" textAnchor="middle" fontSize="6" fill="#1F2937">{s.label}</text>
                </g>
              ))}

              {/* Arrowhead marker */}
              <defs>
                <marker id="signin-mobile-arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#111827" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignInMobile;

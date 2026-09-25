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
        navigate(returnTo || '/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Required invisible reCAPTCHA anchor for Firebase phone auth */}
      <div id="recaptcha-container" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-white via-gray-50 to-gray-100 overflow-hidden">
        {/* Decorative 2D doodles — Enqir theme */}
        <style>{`@keyframes doodleFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
          .doodle-float { animation: doodleFloat 5s ease-in-out infinite; }
          .doodle-float-slow { animation: doodleFloat 7s ease-in-out 1.2s infinite; }`}</style>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-[60%] right-[4%] rotate-6 text-gray-900/80 doodle-float"><DoodleAI /></div>
          <div className="absolute top-[8%] right-[6%] rotate-6 text-gray-900/80 doodle-float-slow"><DoodleChat /></div>
          <div className="absolute top-[38%] left-[4%] rotate-[-10deg] text-gray-900/70 doodle-float-slow"><DoodleWrench /></div>
          <div className="absolute top-[36%] right-[5%] rotate-[8deg] text-gray-900/70 doodle-float"><DoodleRupee /></div>
          <div className="absolute bottom-[10%] left-[8%] rotate-6 text-gray-900/70 doodle-float-slow"><DoodleShield /></div>
          <div className="absolute bottom-[12%] right-[8%] -rotate-6 text-gray-900/80 doodle-float"><DoodleEnquiry /></div>
          <div className="absolute top-[3%] left-[6%] text-gray-900 rotate-12"><DoodleSparkle className="w-4 h-4" /></div>
          <div className="absolute bottom-[40%] left-[6%] text-gray-900 -rotate-12"><DoodleSparkle className="w-3 h-3" /></div>
          <div className="absolute top-[55%] left-[13%] text-gray-900/50 rotate-45"><DoodleSparkle className="w-2.5 h-2.5" /></div>
          <div className="absolute top-[60%] right-[14%] text-gray-900/50 -rotate-12"><DoodleSparkle className="w-2.5 h-2.5" /></div>
          <div className="absolute top-[13%] right-[28%] -rotate-6 text-gray-900/70 doodle-float hidden sm:block"><DoodleCloudLock /></div>
          <div className="absolute bottom-[30%] right-[4%] rotate-[10deg] text-gray-900/70 doodle-float hidden sm:block"><DoodleConnected /></div>
          <div className="absolute bottom-[28%] left-[3%] -rotate-8 text-gray-900/70 doodle-float-slow"><DoodleHandshake /></div>
          <div className="absolute bottom-[6%] right-[28%] -rotate-6 text-gray-900/60 doodle-float-slow"><DoodleFingerprint /></div>
          <div className="absolute top-[42%] left-[14%] rotate-12 text-gray-900/65 doodle-float"><DoodleKey /></div>
          <div className="absolute top-[30%] right-[24%] -rotate-6 text-gray-900/75 doodle-float-slow hidden sm:block"><DoodlePadlock /></div>
          <div className="absolute top-[47%] right-[4%] rotate-6 text-gray-900/70 doodle-float-slow hidden sm:block"><DoodleChip /></div>
          <div className="absolute bottom-[24%] left-[4%] -rotate-8 text-gray-900/65 doodle-float"><DoodleWifi /></div>
          <div className="absolute top-[2%] right-[30%] rotate-6 text-gray-900/60 doodle-float-slow"><DoodleEyeScan /></div>
          <div className="absolute bottom-[16%] left-[28%] rotate-12 text-gray-900 doodle-float"><DoodleBolt /></div>
          <div className="absolute top-[72%] right-[22%] -rotate-8 text-gray-900/60 doodle-float-slow"><DoodleGlobe /></div>
          <div className="absolute top-[24%] left-[2%] -rotate-10 text-gray-900/60 doodle-float-slow"><DoodlePhone /></div>
          <div className="absolute top-[16%] left-[42%] rotate-6 text-gray-900/60 doodle-float"><DoodleLocation /></div>
          <div className="absolute top-[38%] right-[2%] -rotate-8 text-gray-900/60 doodle-float-slow"><DoodleCamera /></div>
          <div className="absolute top-[58%] left-[2%] rotate-6 text-gray-900/60 doodle-float"><DoodleStarBadge /></div>
          <div className="absolute top-[76%] right-[38%] rotate-8 text-gray-900/55 doodle-float-slow"><DoodleEnvelope /></div>
          <div className="absolute top-[4%] right-[46%] -rotate-8 text-gray-900/60 doodle-float"><DoodleClock /></div>
          <div className="absolute bottom-[4%] left-[36%] rotate-6 text-gray-900/60 doodle-float-slow"><DoodleHeart /></div>
          <div className="absolute top-[30%] left-[10%] text-gray-900 rotate-12"><DoodlePlus className="w-3.5 h-3.5" /></div>
          <div className="absolute bottom-[44%] right-[8%] text-gray-900 -rotate-6"><DoodlePlus className="w-3 h-3" /></div>
          <div className="absolute top-[48%] right-[16%] text-gray-900/50 rotate-45"><DoodlePlus className="w-2.5 h-2.5" /></div>
          <div className="absolute bottom-[18%] right-[16%] text-gray-900 rotate-12"><DoodleRing className="w-3 h-3" /></div>
          <div className="absolute top-[10%] left-[16%] text-gray-900/45 -rotate-12"><DoodleRing className="w-2.5 h-2.5" /></div>
          <div className="absolute top-[66%] left-[8%] text-gray-900 rotate-45"><DoodleStar /></div>
          <div className="absolute top-[20%] right-[12%] text-gray-900/50 rotate-12"><DoodleStar /></div>
          <div className="absolute bottom-[8%] right-[46%] text-gray-900/45 -rotate-12"><DoodlePlus className="w-2.5 h-2.5" /></div>
        </div>

        <div className="relative w-full max-w-sm">
          {/* Back */}
          <button
            onClick={() => navigate('/signin')}
            aria-label="Back to sign-in options"
            className="mb-6 inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer -translate-y-[12rem]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Heading */}
          <div className="text-center mb-8 -translate-y-[3cm]">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl border-2 border-black bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.85)]">
              <Phone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {stage === 'phone' ? 'Enter your phone number' : 'Enter the OTP'}
            </h1>
            {stage !== 'phone' && (
              <p className="mt-2 text-xs text-gray-500 font-medium">
                {`Sent to ${INDIA_CODE} ${formatDigits(phoneDigits)}`}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {stage === 'phone' ? (
            <div className="space-y-4 -translate-y-[3.5cm]">
              {/* Phone input row */}
              <div className="flex gap-2">
                {/* Country code — locked to India for this page */}
                <div
                  className="h-12 sm:h-14 shrink-0 rounded-2xl border-2 border-black bg-white text-gray-900 flex items-center px-3 text-sm font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.85)] select-none"
                  aria-label="Country code (India only)"
                >
                  🇮🇳 +91
                </div>

                {/* Number input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder={`${maxDigits}-digit number`}
                  value={phoneDigits}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
                    setPhoneDigits(formatDigits(digits));
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
                  className="flex-1 min-w-0 h-12 sm:h-14 rounded-2xl border-2 border-black bg-white px-4 text-base font-semibold text-gray-900 placeholder:text-slate-400 placeholder:font-normal shadow-[0_4px_0_0_rgba(0,0,0,0.85)] focus:outline-none"
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
              </div>

              {/* Send OTP button */}
              <button
                onClick={handleSendOtp}
                disabled={loading || phoneDigits.replace(/\D/g, "").length !== maxDigits}
                className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-2 rounded-2xl border-2 border-black bg-blue-600 text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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

              {/* Footer switch to email */}
              <p className="text-center text-xs text-gray-400">
                Prefer email?{' '}
                <Link
                  to="/signin/email"
                  state={(location.state as any) || undefined}
                  className="font-semibold text-gray-600 underline hover:text-gray-900"
                >
                  Continue with Email
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* OTP input — one box per digit */}
              <div className="flex gap-2 justify-center -translate-y-[2cm]" onPaste={handleOtpPaste}>
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
                    className="w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-black bg-white text-center text-2xl font-bold text-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] focus:outline-none"
                    style={{ fontSize: '24px' }}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\D/g, "").length < 6}
                className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-2 -mt-[2.2cm] rounded-xl border-2 border-black bg-blue-600 text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
                className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:no-underline"
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SignInMobile;

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";

// Country codes offered (India default)
const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", maxDigits: 10, format: (d: string) => d.replace(/(\d{5})(?=\d)/, "$1 ") },
  { code: "+1", label: "🇺🇸 +1", maxDigits: 10, format: (d: string) => d.replace(/(\d{3})(?=\d)/, "$1 ").replace(/(\d{3}) (?=\d)/, "$1 ") },
  { code: "+44", label: "🇬🇧 +44", maxDigits: 10, format: (d: string) => d },
  { code: "+971", label: "🇦🇪 +971", maxDigits: 9, format: (d: string) => d },
  { code: "+966", label: "🇸🇦 +966", maxDigits: 9, format: (d: string) => d },
  { code: "+65", label: "🇸🇬 +65", maxDigits: 8, format: (d: string) => d },
];

const SignInMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, sendPhoneOTP, verifyPhoneOTP } = useAuth();

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
  const maxDigits = selectedCountry.maxDigits;
  const formatDigits = (d: string) => (selectedCountry.format ? selectedCountry.format(d) : d);

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

  // Focus OTP input when entering OTP stage
  useEffect(() => {
    if (stage === 'otp') otpRef.current?.focus();
  }, [stage]);

  const handleSendOtp = async () => {
    setError("");
    const digits = phoneDigits.replace(/\D/g, "");
    if (digits.length !== maxDigits) {
      setError(`Please enter a valid ${maxDigits}-digit mobile number.`);
      return;
    }
    setLoading(true);
    try {
      const result = await sendPhoneOTP(`${countryCode}${digits}`);
      if (result?.error) {
        setError(result.error.message || "Failed to send OTP. Please try again.");
      } else if (result?.verificationId) {
        setVerificationId(result.verificationId);
        setStage("otp");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const code = otp.replace(/\D/g, "");
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
        setError(result.error.message || "OTP verification failed. Please try again.");
      } else {
        const returnTo = sessionStorage.getItem('returnAfterSignIn');
        sessionStorage.removeItem('returnAfterSignIn');
        navigate(returnTo || '/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStage("phone");
    setOtp("");
    setVerificationId(null);
    setError("");
  };

  return (
    <Layout>
      {/* Required invisible reCAPTCHA anchor for Firebase phone auth */}
      <div id="recaptcha-container" />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <div className="w-full max-w-sm">
          {/* Back */}
          <button
            onClick={() => navigate('/signin')}
            aria-label="Back to sign-in options"
            className="mb-6 inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl border-2 border-black bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.85)]">
              <Phone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {stage === 'phone' ? 'Continue with Mobile' : 'Enter the OTP'}
            </h1>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {stage === 'phone'
                ? 'We\'ll text you a one-time code to verify'
                : `Sent to ${countryCode} ${formatDigits(phoneDigits)}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {stage === 'phone' ? (
            <div className="space-y-4">
              {/* Phone input row */}
              <div className="flex gap-2">
                {/* Country code select */}
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    const next = COUNTRY_CODES.find((c) => c.code === e.target.value);
                    const digits = phoneDigits.replace(/\D/g, "").slice(0, next?.maxDigits || 10);
                    setPhoneDigits(formatDigits(digits));
                  }}
                  className="h-12 sm:h-14 shrink-0 w-[108px] rounded-xl border-2 border-black bg-white px-2 text-sm font-bold text-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] focus:outline-none cursor-pointer"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>

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
                  className="flex-1 min-w-0 h-12 sm:h-14 rounded-xl border-2 border-black bg-white px-4 text-base font-semibold text-gray-900 placeholder:text-slate-400 placeholder:font-normal shadow-[0_4px_0_0_rgba(0,0,0,0.3)] focus:outline-none"
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
              </div>

              {/* Send OTP button */}
              <button
                onClick={handleSendOtp}
                disabled={loading || phoneDigits.replace(/\D/g, "").length !== maxDigits}
                className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-black text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.45)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.45)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? 'Sending…' : 'Send OTP'}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your number is never shown publicly
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* OTP input */}
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
                className="w-full h-14 sm:h-16 rounded-xl border-2 border-black bg-white px-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] focus:outline-none"
                style={{ fontSize: '24px' }}
              />

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\D/g, "").length < 6}
                className="w-full h-13 sm:h-14 min-h-[52px] flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-blue-600 text-white font-bold text-base transition-all duration-150 shadow-[0_4px_0_0_rgba(0,0,0,0.85)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.85)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              {/* Change number */}
              <button
                onClick={handleChangeNumber}
                className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Change number / resend
              </button>
            </div>
          )}

          {/* Footer switch to email */}
          <p className="mt-8 text-center text-xs text-gray-400">
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
      </div>
    </Layout>
  );
};

export default SignInMobile;

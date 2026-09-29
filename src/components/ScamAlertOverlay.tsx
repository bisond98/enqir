import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ScamAlertOverlayProps {
  /** Unique key for per-response dont-show-again persistence (e.g. `${enquiryId}:${sellerId}`) */
  dismissKey: string;
  /** Called when the overlay is dismissed (manually, auto, or dont-show-again) — continue the pending action here */
  onContinue: () => void;
  /** Optional storage namespace so buyer and seller flows keep separate dismissal lists */
  storageKey?: string;
  /** Auto-dismiss countdown in ms (default 10000) */
  durationMs?: number;
}

const SCAM_ALERT_IMG = "/scam-alert.png";

/**
 * Scam-alert caution overlay — shown before Call/Chat (and after successful
 * response submission). Exact replica of the OTP sign-in page header (brush
 * swash + Enqir wordmark) above the scam alert image, red X close, 10s
 * auto-dismiss with a smooth left-to-right black progress bar that freezes
 * while pressed, tap-outside close, and per-key dont-show-again persisted in
 * localStorage.
 */
const ScamAlertOverlay = ({ dismissKey, onContinue, storageKey = "scamAlertDismissedKeys", durationMs = 10000 }: ScamAlertOverlayProps) => {
  // Per-key dont-show-again: keys whose scam alert was dismissed by the user
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { return new Set<string>(); }
  });
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Press-and-hold pauses the auto-dismiss countdown; releasing resumes it
  const remainingRef = useRef<number>(durationMs);
  const lastTickRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);

  // Persist a key to the dont-show-again list (per key, permanently in this browser).
  // localStorage is written synchronously here — NOT inside the state updater — because
  // the overlay unmounts in the same batch (parent clears the pending action), and React
  // drops queued updaters of unmounted components, which silently skipped the save.
  const dismissForKey = (key: string) => {
    setDismissedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!stored.includes(key)) {
        localStorage.setItem(storageKey, JSON.stringify([...stored, key]));
      }
    } catch {}
  };

  // Guard against calling onContinue twice (e.g. dont-show-again then unmount)
  const continuedRef = useRef<boolean>(false);

  const close = (dontShowAgain = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (dontShowAgain) dismissForKey(dismissKey);
    if (!continuedRef.current) {
      continuedRef.current = true;
      onContinue();
    }
  };

  useEffect(() => {
    if (dismissedKeys.has(dismissKey)) {
      // Already dismissed permanently for this key — skip straight through
      if (!continuedRef.current) {
        continuedRef.current = true;
        onContinue();
      }
      return;
    }
    remainingRef.current = durationMs;
    pausedRef.current = false;
    lastTickRef.current = Date.now();
    setProgress(100);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (!pausedRef.current) {
        remainingRef.current = Math.max(0, remainingRef.current - (now - lastTickRef.current));
        setProgress(Math.round((remainingRef.current / durationMs) * 100));
        if (remainingRef.current <= 0) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          close(false);
          return;
        }
      }
      lastTickRef.current = now;
    }, 50);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissKey]);

  // Clean up the timer if the page unmounts while the overlay is open
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Hold the overlay → freeze the countdown; release → resume with the remaining time
  const pauseTimer = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
  };
  const resumeTimer = () => {
    if (!pausedRef.current) return;
    lastTickRef.current = Date.now();
    pausedRef.current = false;
  };

  // Never render when the key was already dismissed permanently
  if (dismissedKeys.has(dismissKey)) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => close(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={pauseTimer}
        onPointerUp={resumeTimer}
        onPointerLeave={resumeTimer}
        onPointerCancel={resumeTimer}
      >
        {/* Black countdown bar — fills left→right as the auto-dismiss approaches (freezes while held); sits slightly below the top border */}
        <div className="px-4 pt-2">
          <div className="h-1.5 w-full bg-gray-200 overflow-hidden rounded-full">
            <div
              className="h-full bg-black rounded-full"
              style={{ width: `${100 - progress}%`, transition: "width 120ms linear" }}
            />
          </div>
        </div>
        {/* Red close icon — no padding background, top-right corner */}
        <button
          type="button"
          onClick={() => close(false)}
          className="absolute top-2 right-2 z-10 p-1.5 text-red-600 hover:text-red-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
        </button>
        {/* Brand heading — exact replica of the OTP sign-in page header (brush swash + Enqir wordmark), centered */}
        <div className="w-full flex justify-center">
          <div className="text-center select-none relative inline-flex items-center justify-center px-8 sm:px-12 py-8 sm:py-10">
            {/* Painterly brush swash — same tapered stroke as the OTP page */}
            <svg
              aria-hidden="true"
              viewBox="0 0 640 260"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="brushSwashScamShared" x1="0" y1="0" x2="1" y2="0.6">
                  <stop offset="0%" stopColor="#eceef0" />
                  <stop offset="50%" stopColor="#e4e7ea" />
                  <stop offset="100%" stopColor="#dcdfE3" />
                </linearGradient>
              </defs>
              <path
                d="M18 158
                   C 40 120, 96 96, 168 92
                   C 250 86, 330 60, 420 62
                   C 500 64, 570 84, 614 108
                   C 620 112, 620 120, 610 126
                   C 560 158, 470 178, 380 182
                   C 290 186, 190 192, 112 184
                   C 66 180, 30 172, 18 158 Z"
                fill="url(#brushSwashScamShared)"
              />
              <path
                d="M60 150 C 170 118, 330 96, 520 108"
                stroke="#f2f3f5"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
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
        </div>
        <img src={SCAM_ALERT_IMG} alt="Scam Alert — safety precautions before contacting a seller" className="w-full h-auto max-h-[48vh] object-contain mx-auto" />
        {/* Dont-show-again — red chip, placed high for comfortable mobile tapping */}
        <div className="py-3 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close(true);
            }}
            className="rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-6 py-3 shadow-[0_4px_0_0_rgba(0,0,0,0.25)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.25)] active:translate-y-[3px] transition-all min-touch"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScamAlertOverlay;

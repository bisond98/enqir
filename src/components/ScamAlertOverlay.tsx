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
 * response submission). Poster image only (brand heading removed), red X
 * close, 10s
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
        <img src={SCAM_ALERT_IMG} alt="Scam Alert — safety precautions before contacting a seller" className="w-full h-auto max-h-[70vh] object-contain mx-auto" />
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

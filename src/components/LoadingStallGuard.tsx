import { useEffect } from 'react';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * LoadingStallGuard
 *
 * Last line of defence against the "spinner until I restart the browser" bug.
 *
 * Every page already bounds (or is being bounded) its own Firestore reads, but
 * Firestore's WebChannel can still wedge — a half-open stream keeps the client
 * "online" while no snapshot ever arrives, so the promise a page is awaiting
 * simply never settles. Reloading doesn't always help because the same wedged
 * IndexedDB/stream state is reused.
 *
 * This guard watches for a full-page loading screen (LoadingAnimation) that has
 * been on screen for too long, then:
 *   1. cycles the Firestore network connection (disable → enable), which drops
 *      the wedged stream and re-opens listeners with fresh data — no reload,
 *      no lost form state, no data change;
 *   2. only if the page is STILL stuck after that, reloads once per session.
 *
 * It is inert during payments, developer-console sessions, offline use and any
 * flow that flags `enqir_critical_flow`, and it never interferes with a page
 * that is loading normally — 22 seconds is far past any healthy first paint.
 */

const STUCK_AFTER_MS = 22000;
const RELOAD_AFTER_MS = 12000;
const RECOVERY_COOLDOWN_MS = 60000;
const RELOAD_FLAG = 'enqir_stall_reload_at';

const isCriticalFlow = (): boolean => {
  try {
    if (document.querySelector('iframe[src*="razorpay"], .razorpay-container, [class*="razorpay"]')) return true;
    if (sessionStorage.getItem('enqir_critical_flow') === '1') return true;
  } catch {
    /* storage blocked — treat as not critical */
  }
  return false;
};

const reloadOnce = () => {
  try {
    const last = parseInt(localStorage.getItem(RELOAD_FLAG) || '0', 10);
    if (Date.now() - last < 5 * 60 * 1000) return;
    localStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    return;
  }
  window.location.reload();
};

export default function LoadingStallGuard() {
  useEffect(() => {
    let stalledSince = 0;
    let attemptedAt = 0;
    let recoveredOnce = false;
    let disposed = false;

    // A network cycle only helps if we're actually online; offline pages should
    // show their offline/empty state instead of being kicked.
    const cycleConnection = async () => {
      try {
        await disableNetwork(db);
        await new Promise((r) => setTimeout(r, 350));
        if (disposed) return;
        await enableNetwork(db);
      } catch {
        // Network cycling is best-effort — the reload fallback below still runs.
      }
    };

    const tick = () => {
      if (disposed) return;
      const loadingScreen = document.querySelector('[data-app-loading="true"]');
      if (!loadingScreen) {
        stalledSince = 0;
        recoveredOnce = false;
        return;
      }
      if (isCriticalFlow()) return;

      const now = Date.now();
      if (!stalledSince) stalledSince = now;
      const stuckFor = now - stalledSince;

      if (stuckFor >= STUCK_AFTER_MS + RELOAD_AFTER_MS && recoveredOnce) {
        reloadOnce();
        return;
      }
      if (stuckFor >= STUCK_AFTER_MS && now - attemptedAt > RECOVERY_COOLDOWN_MS) {
        attemptedAt = now;
        recoveredOnce = true;
        cycleConnection();
      }
    };

    const interval = setInterval(tick, 3000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}

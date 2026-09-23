import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * StaleBundleRefresher
 *
 * After every deploy, tabs that were already open keep referencing OLD JS
 * chunk filenames. On the next navigation, a lazy import requests a chunk
 * that no longer exists — the SPA fallback returns index.html for it and the
 * browser throws "Importing a module script failed" (the full-screen error
 * users saw mid-session, often right after paying).
 *
 * Fix: remember the deploy's index.html hash at load time. On every route
 * change, re-fetch index.html (tiny, cached-busting) and compare. If the
 * hash changed, a new deploy happened — reload ONCE to pick up the fresh
 * bundle before the user hits a dead chunk. Skipped while a payment or
 * other critical flow is in progress so we never interrupt a transaction.
 */
const DEPLOY_HASH_KEY = 'enqir_deploy_hash';
const RELOADED_AT_KEY = 'enqir_deploy_reload_at';

const fetchDeployHash = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/?_deployCheck=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/assets\/js\/index-[^"]+\.js/);
    return m ? m[0] : null;
  } catch {
    return null;
  }
};

const isCriticalFlowInProgress = (): boolean => {
  // Never reload mid-payment or mid-form: check for Razorpay iframe/modal
  if (document.querySelector('iframe[src*="razorpay"], .razorpay-container, [class*="razorpay"]')) return true;
  // Check sessionStorage flag set by flows that must not be interrupted
  return sessionStorage.getItem('enqir_critical_flow') === '1';
};

export default function StaleBundleRefresher() {
  const location = useLocation();

  useEffect(() => {
    // Record the hash on first mount (no fetch needed — we're running it)
    if (!sessionStorage.getItem(DEPLOY_HASH_KEY)) {
      fetchDeployHash().then((hash) => {
        if (hash) sessionStorage.setItem(DEPLOY_HASH_KEY, hash);
      });
      return;
    }

    // On subsequent navigations, check for a new deploy (throttled: at most
    // once every 60s across all route changes)
    const lastCheck = parseInt(sessionStorage.getItem('enqir_deploy_check_at') || '0', 10);
    if (Date.now() - lastCheck < 60_000) return;
    sessionStorage.setItem('enqir_deploy_check_at', String(Date.now()));

    fetchDeployHash().then((hash) => {
      if (!hash) return;
      const known = sessionStorage.getItem(DEPLOY_HASH_KEY);
      if (known && known !== hash) {
        // New deploy detected. Reload once per deploy, and never mid-payment.
        const lastReload = parseInt(localStorage.getItem(RELOADED_AT_KEY) || '0', 10);
        const reloadedForThisDeploy = sessionStorage.getItem('enqir_reloaded_for') === hash;
        if (!reloadedForThisDeploy && Date.now() - lastReload > 10_000 && !isCriticalFlowInProgress()) {
          sessionStorage.setItem('enqir_reloaded_for', hash);
          localStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
          window.location.reload();
        } else {
          // Even if we can't reload now, remember the new hash so the next
          // navigation (after the critical flow) triggers the refresh.
          sessionStorage.setItem(DEPLOY_HASH_KEY, hash);
        }
      } else if (!known) {
        sessionStorage.setItem(DEPLOY_HASH_KEY, hash);
      }
    });
  }, [location.pathname]);

  return null;
}

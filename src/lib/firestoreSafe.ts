// Firestore hardening helpers — the global fix for "stuck loading" bugs.
//
// Why this exists: Firestore (googleapis) can occasionally respond slowly or
// stall on flaky networks. Any UI flow that `await`s a Firestore call without
// a timeout can hang forever with a spinner (we saw this on email sign-in,
// OTP verification, and the dashboard). These helpers guarantee that can't
// happen again.
//
// Rules of thumb:
// - READS (getDoc/getDocs): use `firestoreGet(...)` — 8s timeout, then throw
//   so callers fall into their existing catch/error paths.
// - WRITES that block UI (setDoc/updateDoc/deleteDoc before showing success):
//   use `firestoreWrite(...)` — 8s timeout.
// - WRITES that are just persistence/cleanup: don't await them at all — fire
//   and forget with `firestoreWriteBackground(...)` and let them land later.

const DEFAULT_TIMEOUT_MS = 8000;

export const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
  label = 'Firestore operation',
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/** Timed read — throws on stall so callers can show an error / fallback. */
export const firestoreGet = <T>(promise: Promise<T>, label = 'Firestore read', ms = DEFAULT_TIMEOUT_MS) =>
  withTimeout(promise, ms, label);

/** Timed write — throws on stall. Use when the UI must confirm the write. */
export const firestoreWrite = <T>(promise: Promise<T>, label = 'Firestore write', ms = DEFAULT_TIMEOUT_MS) =>
  withTimeout(promise, ms, label);

/**
 * Background write — never throws into the caller, never blocks the UI.
 * Logs a warning if it fails or stalls. Use for persistence/cleanup writes
 * that must not gate sign-in or navigation.
 */
export const firestoreWriteBackground = <T>(promise: Promise<T>, label = 'Firestore background write', ms = DEFAULT_TIMEOUT_MS) => {
  withTimeout(promise, ms, label).catch((error) => {
    // eslint-disable-next-line no-console
    console.warn(`${label} delayed/failed (non-blocking):`, error);
  });
};

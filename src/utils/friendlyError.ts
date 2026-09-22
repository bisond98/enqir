/**
 * friendlyError — converts technical Firebase/Firestore/network error objects
 * into plain-English sentences safe to show to end users.
 *
 * Usage:
 *   import { friendlyError } from '@/utils/friendlyError';
 *   toast({ title: 'Sign-in failed', description: friendlyError(error), variant: 'destructive' });
 *
 * The raw error is still logged by the caller (console.error) for debugging.
 */

const FRIENDLY_MESSAGES: Array<{ match: RegExp; message: string }> = [
  // Auth: credentials & account state
  { match: /invalid-credential|wrong-password|user-not-found|invalid-login-credentials/i, message: 'Incorrect email or password. Please try again.' },
  { match: /email-already-in-use|already-exists/i, message: 'An account with this email already exists. Try signing in instead.' },
  { match: /weak-password/i, message: 'That password is too weak. Please choose a stronger one.' },
  { match: /too-many-requests/i, message: 'Too many attempts. Please wait a moment and try again.' },
  { match: /user-disabled/i, message: 'This account has been disabled. Please contact support.' },
  { match: /user-token-expired|invalid-user-token/i, message: 'Your session expired. Please sign in again.' },
  { match: /requires-recent-login/i, message: 'Please sign in again to continue.' },
  { match: /invalid-verification-code|invalid-code/i, message: 'That code is incorrect. Please check and try again.' },
  { match: /invalid-phone-number/i, message: 'That phone number doesn\'t look right. Please check and try again.' },
  { match: /quota-exceeded|resource-exhausted/i, message: 'The service is busy right now. Please try again in a few minutes.' },
  { match: /operation-not-allowed|admin-restricted-operation/i, message: 'This sign-in method isn\'t available right now.' },
  { match: /expired-action-code|invalid-action-code/i, message: 'This link has expired or was already used. Please request a new one.' },
  { match: /missing-verification-?id|missing-verification-code/i, message: 'Something went wrong with verification. Please start again.' },

  // Network / connectivity
  { match: /network-request-failed|network error|failed to fetch|fetch failed|offline|internet disconnected|err_internet/i, message: 'You seem to be offline. Check your internet connection and try again.' },
  { match: /timeout|timed?\s?out/i, message: 'The request took too long. Please try again.' },

  // Permissions / server-side
  { match: /permission-denied|not allowed|access denied|unauthorized|access-control/i, message: 'You don\'t have access to do that.' },
  { match: /not[- ]found/i, message: 'We couldn\'t find what you\'re looking for. It may have been removed.' },
  { match: /unavailable|unknown error occurred.*firestore|internal/i, message: 'The service is having trouble right now. Please try again shortly.' },

  // Payment
  { match: /razorpay|payment/i, message: 'Payment couldn\'t be completed. Please try again.' },

  // Storage / uploads
  { match: /storage\/|upload/i, message: 'Upload failed. Please check your connection and try again.' },
];

// Last-resort phrases that appear in generic Error.message strings
const GENERIC_PATTERNS: Array<{ match: RegExp; message: string }> = [
  { match: /cancelled|canceled|user closed|user-cancelled/i, message: '' }, // handled by callers that special-case cancels
];

/**
 * Returns a plain-English message for the given error.
 * Always falls back to something safe and non-technical.
 */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  let text = '';
  let code = '';
  if (typeof error === 'string') {
    text = error;
  } else {
    const err = error as { message?: string; code?: string };
    text = err.message || '';
    code = err.code || '';
  }

  const haystack = `${code} ${text}`;

  for (const { match, message } of FRIENDLY_MESSAGES) {
    if (match.test(haystack)) return message;
  }
  for (const { match } of GENERIC_PATTERNS) {
    if (match.test(haystack)) return fallback;
  }

  // If the message is short and already human-readable (no jargon/brackets/codes),
  // let it through — some errors are crafted by our own code with good copy.
  const looksTechnical =
    /\[|firebase|firestore|auth\/|storage\/|http\s?\d|status code|exception|stack|json|undefined|null|cors/i.test(text) ||
    text.length > 140;

  if (text && !looksTechnical) return text;

  return fallback;
}

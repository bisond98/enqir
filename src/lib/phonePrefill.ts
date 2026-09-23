// Helpers to prefill the forms' contact-mobile input from the signed-in
// user's Firebase phone-auth number (user.phoneNumber, e.g. "+919747460245").

/**
 * Match the longest known country-code dial prefix against a phone number.
 * Returns the matched code (e.g. "+91") and the remaining national digits,
 * or null when no known prefix matches.
 */
const KNOWN_DIAL_CODES = [
  // Longest codes first so +91x-style ambiguities resolve correctly
  '+353', '+351', '+316', '+880', '+977', '+975', '+960', '+852', '+886',
  '+673', '+91', '+92', '+94', '+60', '+61', '+62', '+63', '+65', '+66',
  '+81', '+82', '+84', '+86', '+20', '+27', '+31', '+32', '+33', '+34',
  '+39', '+41', '+43', '+44', '+48', '+49', '+52', '+54', '+55', '+7',
  '+1',
];

export function splitE164Phone(e164: string): { code: string; national: string } | null {
  const digits = (e164 || '').replace(/[^\d]/g, '');
  if (!digits) return null;
  const withPlus = `+${digits}`;
  for (const code of KNOWN_DIAL_CODES) {
    if (withPlus.startsWith(code)) {
      const national = withPlus.slice(code.length).replace(/\D/g, '');
      if (national) return { code, national };
    }
  }
  return null;
}

/**
 * Format a national number for the form input — India numbers get the same
 * 5-digit spacing the input applies while typing ("97474 60245").
 */
export function formatNationalForInput(national: string, code: string): string {
  if (code === '+91') {
    return national.replace(/\D/g, '').slice(0, 10).replace(/(\d{5})(?=\d)/g, '$1 ');
  }
  return national.replace(/[^\d ]/g, '');
}

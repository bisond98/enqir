// Privacy protection utilities for hiding sensitive user information

/**
 * Generate a random user code for privacy protection
 * @param userId - The user's ID
 * @returns A formatted user code like "User 321"
 */
export function generateUserCode(userId: string): string {
  // Create a simple hash from the userId to get a consistent number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and get last 3 digits
  const userNumber = Math.abs(hash) % 1000;
  return `User ${userNumber}`;
}

/**
 * Get privacy-protected name for display
 * @param userProfile - User profile object
 * @param userId - User's ID
 * @returns Display name or generated user code
 */
export function getPrivacyProtectedName(userProfile: any, userId: string): string {
  if (!userProfile) {
    return generateUserCode(userId);
  }
  
  // If user has a display name, use it
  if (userProfile.displayName) {
    return userProfile.displayName;
  }
  
  // If user has full name, use it
  if (userProfile.fullName) {
    return userProfile.fullName;
  }
  
  // Fallback to generated user code
  return generateUserCode(userId);
}

/**
 * Hide email address for privacy
 * @param email - Email address to hide
 * @returns Hidden email (e.g., "u***@example.com")
 */
export function hideEmail(email: string): string {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const hiddenUsername = username.length > 1 
    ? username[0] + '*'.repeat(username.length - 1)
    : username;
  
  return `${hiddenUsername}@${domain}`;
}

/**
 * Hide phone number for privacy
 * @param phone - Phone number to hide
 * @returns Hidden phone (e.g., "+91 ******1234")
 */
export function hidePhone(phone: string): string {
  if (!phone) return '';
  
  if (phone.length <= 4) return phone;
  
  const visibleDigits = phone.slice(-4);
  const hiddenDigits = '*'.repeat(phone.length - 4);
  
  return phone.replace(visibleDigits, hiddenDigits) + visibleDigits;
}

/**
 * Check if user is verified/trusted
 * @param userProfile - User profile object
 * @returns Boolean indicating if user is verified
 */
export function isUserVerified(userProfile: any): boolean {
  if (!userProfile) return false;
  
  return userProfile.isVerified === true || 
         userProfile.trustBadge === true ||
         userProfile.isIdentityVerified === true;
}

/**
 * Get safe console log data (removes sensitive information)
 * @param data - Data to log
 * @returns Sanitized data for console logging
 */
export function getSafeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const safeData = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['email', 'phone', 'phoneNumber', 'idNumber', 'address', 'password'];
  sensitiveFields.forEach(field => {
    if (safeData[field]) {
      safeData[field] = '[HIDDEN]';
    }
  });
  
  return safeData;
}


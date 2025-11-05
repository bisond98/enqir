/**
 * Microphone Permission Utilities
 * Handles checking and requesting microphone permissions across different browsers
 */

export type MicrophonePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';

/**
 * Detect the browser type
 */
export const detectBrowser = (): BrowserType => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'chrome';
  }
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari';
  }
  if (userAgent.includes('firefox')) {
    return 'firefox';
  }
  if (userAgent.includes('edg')) {
    return 'edge';
  }
  
  return 'unknown';
};

/**
 * Check microphone permission status
 * Returns 'granted', 'denied', 'prompt', or 'unavailable'
 */
export const checkMicrophonePermission = async (): Promise<MicrophonePermissionStatus> => {
  try {
    // Check if Permissions API is available
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback: Try to request permission directly
      // This will show the browser prompt if permission hasn't been set
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return 'denied';
        }
        return 'prompt';
      }
    }

    // Use Permissions API
    const result = await navigator.permissions.query({ 
      name: 'microphone' as PermissionName 
    });
    
    return result.state as MicrophonePermissionStatus;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    // Fallback: Assume prompt (permission not yet requested)
    return 'prompt';
  }
};

/**
 * Request microphone permission
 * This will trigger the browser's native permission prompt
 */
export const requestMicrophonePermission = async (): Promise<MicrophonePermissionStatus> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Stop the stream immediately (we just needed permission)
    stream.getTracks().forEach(track => track.stop());
    
    return 'granted';
  } catch (error: any) {
    console.error('Error requesting microphone permission:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'denied';
    }
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'unavailable';
    }
    
    return 'prompt';
  }
};

/**
 * Get browser-specific instructions for enabling microphone permission
 */
export const getBrowserInstructions = (browser: BrowserType): string => {
  switch (browser) {
    case 'chrome':
      return 'Click the lock icon (🔒) in the address bar → Site settings → Microphone → Allow';
    case 'safari':
      return 'Safari → Settings → Websites → Microphone → Find "enqir.in" → Allow';
    case 'firefox':
      return 'Click the lock icon (🔒) in the address bar → Permissions → Microphone → Allow';
    case 'edge':
      return 'Click the lock icon (🔒) in the address bar → Permissions → Microphone → Allow';
    default:
      return 'Go to your browser settings → Privacy → Site permissions → Microphone → Allow for this site';
  }
};


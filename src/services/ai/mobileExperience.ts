// AI-Powered Mobile Experience Service
// Provides touch gestures, voice commands, and mobile optimization

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'longPress' | 'doubleTap' | 'rotate';
  direction?: 'left' | 'right' | 'up' | 'down';
  intensity?: number; // 0-1
  duration?: number; // milliseconds
  coordinates?: { x: number; y: number };
}

export interface VoiceCommand {
  command: string;
  confidence: number; // 0-1
  action: string;
  parameters?: any;
  fallback?: string;
}

export interface MobileAIConfig {
  enableTouchGestures: boolean;
  enableVoiceCommands: boolean;
  enableOfflineAI: boolean;
  enableMobileOptimization: boolean;
  touchSensitivity: number; // 0-1
  voiceRecognitionThreshold: number; // 0-1
  offlineCacheSize: number; // MB
  mobilePerformanceMode: 'low' | 'medium' | 'high';
}

export interface MobileAIState {
  isTouchEnabled: boolean;
  isVoiceEnabled: boolean;
  isOfflineMode: boolean;
  currentGesture: TouchGesture | null;
  lastVoiceCommand: VoiceCommand | null;
  performanceMode: string;
  networkStatus: 'online' | 'offline' | 'poor';
}

const DEFAULT_CONFIG: MobileAIConfig = {
  enableTouchGestures: true,
  enableVoiceCommands: true,
  enableOfflineAI: true,
  enableMobileOptimization: true,
  touchSensitivity: 0.7,
  voiceRecognitionThreshold: 0.6,
  offlineCacheSize: 50, // 50MB
  mobilePerformanceMode: 'medium'
};

// Initialize mobile AI experience
export const initializeMobileAI = async (config: Partial<MobileAIConfig> = {}): Promise<boolean> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Check device capabilities
    const deviceCapabilities = await checkDeviceCapabilities();
    
    // Enable features based on device support
    if (!deviceCapabilities.touchSupport) {
      finalConfig.enableTouchGestures = false;
    }
    
    if (!deviceCapabilities.voiceSupport) {
      finalConfig.enableVoiceCommands = false;
    }
    
    // Initialize offline AI cache
    if (finalConfig.enableOfflineAI) {
      await initializeOfflineCache(finalConfig.offlineCacheSize);
    }
    
    // Set mobile performance mode
    await setMobilePerformanceMode(finalConfig.mobilePerformanceMode);
    
    console.log('📱 Mobile AI Experience initialized:', finalConfig);
    return true;
    
  } catch (error) {
    console.error('Mobile AI initialization failed:', error);
    return false;
  }
};

// Check device capabilities
const checkDeviceCapabilities = async (): Promise<{
  touchSupport: boolean;
  voiceSupport: boolean;
  offlineSupport: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
}> => {
  try {
    // Check touch support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check voice support
    const voiceSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    // Check offline support
    const offlineSupport = 'serviceWorker' in navigator;
    
    // Determine performance level based on device
    let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
    
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 8) {
        performanceLevel = 'high';
      } else if (navigator.hardwareConcurrency >= 4) {
        performanceLevel = 'medium';
      } else {
        performanceLevel = 'low';
      }
    }
    
    return {
      touchSupport,
      voiceSupport,
      offlineSupport,
      performanceLevel
    };
    
  } catch (error) {
    console.error('Device capability check failed:', error);
    return {
      touchSupport: false,
      voiceSupport: false,
      offlineSupport: false,
      performanceLevel: 'medium'
    };
  }
};

// Initialize offline AI cache
const initializeOfflineCache = async (cacheSize: number): Promise<void> => {
  try {
    if ('caches' in window) {
      const cache = await caches.open('ai-offline-cache');
      console.log('📱 Offline AI cache initialized with size:', cacheSize, 'MB');
    }
  } catch (error) {
    console.error('Offline cache initialization failed:', error);
  }
};

// Set mobile performance mode
const setMobilePerformanceMode = async (mode: string): Promise<void> => {
  try {
    // Adjust AI processing based on performance mode
    switch (mode) {
      case 'low':
        // Use lightweight AI models
        console.log('📱 Mobile AI: Low performance mode enabled');
        break;
      case 'high':
        // Use full AI capabilities
        console.log('📱 Mobile AI: High performance mode enabled');
        break;
      default:
        // Balanced mode
        console.log('📱 Mobile AI: Balanced performance mode enabled');
    }
  } catch (error) {
    console.error('Performance mode setting failed:', error);
  }
};

// Touch gesture recognition
export const recognizeTouchGesture = async (
  event: any,
  config: Partial<MobileAIConfig> = {}
): Promise<TouchGesture | null> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (!finalConfig.enableTouchGestures) {
      return null;
    }
    
    // Check if TouchEvent is available in the environment
    if (typeof TouchEvent === 'undefined') {
      console.warn('TouchEvent not available in this environment');
      return null;
    }
    
    // Convert mouse events to touch-like events for desktop testing
    const touchData = extractTouchData(event);
    
    // Analyze gesture based on touch data
    const gesture = analyzeTouchData(touchData, finalConfig.touchSensitivity);
    
    if (gesture) {
      console.log('📱 Touch gesture recognized:', gesture);
    }
    
    return gesture;
    
  } catch (error) {
    console.error('Touch gesture recognition failed:', error);
    return null;
  }
};

// Extract touch data from events
const extractTouchData = (event: any): {
  startTime: number;
  endTime: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  distance: number;
  velocity: number;
} => {
  try {
    let startX = 0, startY = 0, endX = 0, endY = 0;
    let startTime = 0, endTime = 0;
    
    // Check if TouchEvent is available and event is TouchEvent
    if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
      if (event.touches.length > 0) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startTime = event.timeStamp;
      }
      
      if (event.changedTouches.length > 0) {
        endX = event.changedTouches[0].clientX;
        endY = event.changedTouches[0].clientY;
        endTime = event.timeStamp;
      }
    } else if (event instanceof MouseEvent) {
      startX = event.clientX;
      startY = event.clientY;
      startTime = event.timeStamp;
      endX = event.clientX;
      endY = event.clientY;
      endTime = event.timeStamp;
    }
    
    const duration = endTime - startTime;
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const velocity = distance / Math.max(duration, 1);
    
    return {
      startTime,
      endTime,
      startX,
      startY,
      endX,
      endY,
      duration,
      distance,
      velocity
    };
    
  } catch (error) {
    console.error('Touch data extraction failed:', error);
    return {
      startTime: 0,
      endTime: 0,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      duration: 0,
      distance: 0,
      velocity: 0
    };
  }
};

// Analyze touch data to determine gesture
const analyzeTouchData = (
  touchData: any,
  sensitivity: number
): TouchGesture | null => {
  try {
    const { duration, distance, velocity } = touchData;
    
    // Swipe detection
    if (distance > 50 * sensitivity && duration < 500) {
      const deltaX = touchData.endX - touchData.startX;
      const deltaY = touchData.endY - touchData.startY;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return {
          type: 'swipe',
          direction: deltaX > 0 ? 'right' : 'left',
          intensity: Math.min(1, Math.abs(deltaX) / 200),
          duration,
          coordinates: { x: touchData.endX, y: touchData.endY }
        };
      } else {
        return {
          type: 'swipe',
          direction: deltaY > 0 ? 'down' : 'up',
          intensity: Math.min(1, Math.abs(deltaY) / 200),
          duration,
          coordinates: { x: touchData.endX, y: touchData.endY }
        };
      }
    }
    
    // Long press detection
    if (duration > 500 * sensitivity && distance < 10) {
      return {
        type: 'longPress',
        intensity: Math.min(1, duration / 1000),
        duration,
        coordinates: { x: touchData.endX, y: touchData.endY }
      };
    }
    
    // Double tap detection (simplified)
    if (duration < 200 && distance < 10) {
      return {
        type: 'doubleTap',
        intensity: 1,
        duration,
        coordinates: { x: touchData.endX, y: touchData.endY }
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Touch data analysis failed:', error);
    return null;
  }
};

// Voice command recognition
export const recognizeVoiceCommand = async (
  audioBlob: Blob,
  config: Partial<MobileAIConfig> = {}
): Promise<VoiceCommand | null> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (!finalConfig.enableVoiceCommands) {
      return null;
    }
    
    // Simulate voice recognition (in real implementation, use Web Speech API)
    const command = await simulateVoiceRecognition(audioBlob, finalConfig.voiceRecognitionThreshold);
    
    if (command) {
      console.log('📱 Voice command recognized:', command);
    }
    
    return command;
    
  } catch (error) {
    console.error('Voice command recognition failed:', error);
    return null;
  }
};

// Simulate voice recognition (placeholder for real implementation)
const simulateVoiceRecognition = async (
  audioBlob: Blob,
  threshold: number
): Promise<VoiceCommand | null> => {
  try {
    // In real implementation, this would use Web Speech API
    // For now, return a simulated command based on audio properties
    
    const audioSize = audioBlob.size;
    const duration = audioSize / 16000; // Rough estimate based on typical audio bitrate
    
    // Simulate different commands based on audio characteristics
    let command = '';
    let action = '';
    let confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
    
    if (duration > 2) {
      command = 'search for enquiries';
      action = 'search';
    } else if (duration > 1) {
      command = 'post new enquiry';
      action = 'post';
    } else {
      command = 'show dashboard';
      action = 'navigate';
    }
    
    // Apply confidence threshold
    if (confidence < threshold) {
      return null;
    }
    
    return {
      command,
      confidence,
      action,
      parameters: { duration, audioSize },
      fallback: 'Please try speaking more clearly'
    };
    
  } catch (error) {
    console.error('Voice recognition simulation failed:', error);
    return null;
  }
};

// Get mobile-optimized AI configuration
export const getMobileAIConfig = (config: Partial<MobileAIConfig> = {}): MobileAIConfig => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Adjust configuration based on device capabilities
    if (window.innerWidth < 768) {
      // Mobile device optimizations
      finalConfig.mobilePerformanceMode = 'low';
      finalConfig.offlineCacheSize = 25; // Smaller cache for mobile
      finalConfig.touchSensitivity = 0.8; // Higher touch sensitivity
    }
    
    return finalConfig;
    
  } catch (error) {
    console.error('Mobile AI config generation failed:', error);
    return DEFAULT_CONFIG;
  }
};

// Check network status
export const getNetworkStatus = (): 'online' | 'offline' | 'poor' => {
  try {
    if (!navigator.onLine) {
      return 'offline';
    }
    
    // Check connection quality (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'poor';
      }
    }
    
    return 'online';
    
  } catch (error) {
    console.error('Network status check failed:', error);
    return 'online';
  }
};

// Get mobile AI state
export const getMobileAIState = (config: Partial<MobileAIConfig> = {}): MobileAIState => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const networkStatus = getNetworkStatus();
    
    return {
      isTouchEnabled: finalConfig.enableTouchGestures,
      isVoiceEnabled: finalConfig.enableVoiceCommands,
      isOfflineMode: networkStatus === 'offline' && finalConfig.enableOfflineAI,
      currentGesture: null,
      lastVoiceCommand: null,
      performanceMode: finalConfig.mobilePerformanceMode,
      networkStatus
    };
    
  } catch (error) {
    console.error('Mobile AI state generation failed:', error);
    return {
      isTouchEnabled: false,
      isVoiceEnabled: false,
      isOfflineMode: false,
      currentGesture: null,
      lastVoiceCommand: null,
      performanceMode: 'medium',
      networkStatus: 'online'
    };
  }
};

// Execute AI action based on mobile input
export const executeMobileAIAction = async (
  input: TouchGesture | VoiceCommand,
  config: Partial<MobileAIConfig> = {}
): Promise<{ success: boolean; action: string; result?: any }> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (input.type === 'swipe') {
      // Handle swipe gestures
      switch (input.direction) {
        case 'left':
          return { success: true, action: 'next_item', result: 'Swiped left to next item' };
        case 'right':
          return { success: true, action: 'previous_item', result: 'Swiped right to previous item' };
        case 'up':
          return { success: true, action: 'refresh', result: 'Swiped up to refresh' };
        case 'down':
          return { success: true, action: 'load_more', result: 'Swiped down to load more' };
        default:
          return { success: false, action: 'unknown_swipe' };
      }
    }
    
    if (input.type === 'longPress') {
      return { success: true, action: 'context_menu', result: 'Long press for context menu' };
    }
    
    if (input.type === 'doubleTap') {
      return { success: true, action: 'quick_action', result: 'Double tap for quick action' };
    }
    
    if ('command' in input) {
      // Handle voice commands
      switch (input.action) {
        case 'search':
          return { success: true, action: 'search', result: `Searching for: ${input.command}` };
        case 'post':
          return { success: true, action: 'navigate', result: 'Navigating to post enquiry' };
        case 'navigate':
          return { success: true, action: 'navigate', result: `Navigating to: ${input.command}` };
        default:
          return { success: false, action: 'unknown_voice_command' };
      }
    }
    
    return { success: false, action: 'unknown_input' };
    
  } catch (error) {
    console.error('Mobile AI action execution failed:', error);
    return { success: false, action: 'execution_error' };
  }
};

// Export default configuration
export { DEFAULT_CONFIG as MOBILE_AI_CONFIG };






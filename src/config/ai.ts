// AI Configuration - Mobile Optimized
// Centralized control for all AI features

export const AI_CONFIG = {
  // Smart Search Settings
  search: {
    enabled: true,
    mobileOptimized: true,
    suggestionLimit: 5, // Mobile-friendly limit
    trendingLimit: 6,   // Mobile-friendly limit
    debounceMs: 300,    // Mobile typing optimization
  },
  
  // Auto-Complete Settings
  autocomplete: {
    enabled: true,
    mobileOptimized: true,
    minChars: 2,        // Start suggesting after 2 chars
    maxSuggestions: 4,  // Mobile-friendly limit
    debounceMs: 200,    // Fast response on mobile
  },
  
  // Chat Enhancement Settings
  chat: {
    enabled: true,
    mobileOptimized: true,
    smartReplies: true,
    sentimentAnalysis: true,
    translation: false,  // Disabled for performance
  },
  
  // Image Intelligence Settings
  image: {
    enabled: true,
    mobileOptimized: true,
    autoCategorization: true,
    duplicateDetection: true,
    maxImageSize: 5 * 1024 * 1024, // 5MB for mobile
  },
  
  // Analytics Settings
  analytics: {
    enabled: true,
    mobileOptimized: true,
    realTimeUpdates: true,
    performanceMode: true, // Optimize for mobile
  },
  
  // Security Settings
  security: {
    enabled: true,
    mobileOptimized: true,
    spamDetection: true,
    riskScoring: true,
    trustIndicators: true,
  },
  
  // Content Generation Settings
  content: {
    enabled: true,
    mobileOptimized: true,
    smartTitles: true,
    tagSuggestions: true,
    descriptionTemplates: true,
  },
  
  // Performance Settings
  performance: {
    mobileFirst: true,
    lazyLoading: true,
    progressiveEnhancement: true,
    fallbackMode: true, // Always have fallback
  }
};

// AI Services Configuration
export const AI_SERVICES = {
  // External AI services (if needed later)
  openai: {
    enabled: false, // Disabled for now - using local AI
    apiKey: '',
    endpoint: ''
  },
  
  // Local AI services
  local: {
    smartSearch: true,
    autocomplete: true,
    imageRecognition: true,
    sentimentAnalysis: true,
    contentGeneration: true
  }
};

// Mobile-specific AI settings
export const MOBILE_AI_CONFIG = {
  touchOptimized: true,
  gestureSupport: true,
  voiceInput: true,
  cameraIntegration: true,
  responsiveUI: true,
  performanceMode: true
};

// Get AI feature status
export const getAIStatus = (feature: keyof typeof AI_CONFIG) => {
  return AI_CONFIG[feature].enabled;
};

// Toggle AI features
export const toggleAIFeature = (feature: keyof typeof AI_CONFIG) => {
  AI_CONFIG[feature].enabled = !AI_CONFIG[feature].enabled;
  return AI_CONFIG[feature].enabled;
};

// Get AI configuration with SAFETY CHECKS
export const getAIConfig = () => {
  try {
    // SAFETY CHECK: Validate configuration
    if (!AI_CONFIG || typeof AI_CONFIG !== 'object') {
      console.warn('AI_CONFIG is invalid, using fallback configuration');
      return getFallbackAIConfig();
    }

    return {
      ...AI_CONFIG,
      mobile: MOBILE_AI_CONFIG,
      services: AI_SERVICES
    };
  } catch (error) {
    console.error('Error getting AI config, using fallback:', error);
    return getFallbackAIConfig();
  }
};

// SAFETY FALLBACK: Minimal AI configuration that won't break the app
export const getFallbackAIConfig = () => {
  return {
    search: {
      enabled: false, // Disable AI search on error
      mobileOptimized: true,
      suggestionLimit: 0,
      trendingLimit: 0,
      debounceMs: 300,
    },
    autocomplete: {
      enabled: false, // Disable AI autocomplete on error
      mobileOptimized: true,
      minChars: 2,
      maxSuggestions: 0,
      debounceMs: 200,
    },
    chat: {
      enabled: false, // Disable AI chat on error
      mobileOptimized: true,
      smartReplies: false,
      sentimentAnalysis: false,
      translation: false,
    },
    image: {
      enabled: false, // Disable AI image features on error
      mobileOptimized: true,
      autoCategorization: false,
      duplicateDetection: false,
      maxImageSize: 5 * 1024 * 1024,
    },
    analytics: {
      enabled: false, // Disable AI analytics on error
      mobileOptimized: true,
      realTimeUpdates: false,
      performanceMode: true,
    },
    security: {
      enabled: false, // Disable AI security on error
      mobileOptimized: true,
      spamDetection: false,
      riskScoring: false,
      trustIndicators: false,
    },
    content: {
      enabled: false, // Disable AI content generation on error
      mobileOptimized: true,
      smartTitles: false,
      tagSuggestions: false,
      descriptionTemplates: false,
    },
    performance: {
      mobileFirst: true,
      lazyLoading: true,
      progressiveEnhancement: true,
      fallbackMode: true, // Always have fallback
    }
  };
};

// Check if device is mobile for AI optimization
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get optimized AI settings for current device
export const getOptimizedAIConfig = () => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    return {
      ...AI_CONFIG,
      search: { ...AI_CONFIG.search, suggestionLimit: 3, trendingLimit: 4 },
      autocomplete: { ...AI_CONFIG.autocomplete, maxSuggestions: 3 },
      performance: { ...AI_CONFIG.performance, mobileFirst: true }
    };
  }
  
  return AI_CONFIG;
};

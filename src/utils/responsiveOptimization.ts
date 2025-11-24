/**
 * Responsive Design Optimization Utilities
 * Ensures consistent mobile and desktop experience across the app
 */

// Standard breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Minimum touch target size (iOS/Android guidelines)
export const MIN_TOUCH_TARGET = 44;

// Responsive spacing scale
export const SPACING = {
  mobile: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  desktop: {
    xs: '0.75rem',   // 12px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
  },
} as const;

// Typography scale for responsive design
export const TYPOGRAPHY = {
  mobile: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
  },
  desktop: {
    xs: 'text-sm',      // 14px
    sm: 'text-base',    // 16px
    base: 'text-lg',    // 18px
    lg: 'text-xl',      // 20px
    xl: 'text-2xl',     // 24px
    '2xl': 'text-3xl',  // 30px
    '3xl': 'text-4xl',  // 36px
  },
} as const;

/**
 * Get responsive class names for common patterns
 */
export const getResponsiveClasses = {
  // Container padding
  containerPadding: 'px-3 sm:px-4 md:px-6 lg:px-8',
  
  // Section padding
  sectionPadding: 'py-4 sm:py-6 md:py-8 lg:py-12',
  
  // Card padding
  cardPadding: 'p-3 sm:p-4 md:p-6 lg:p-8',
  
  // Gap spacing
  gap: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6',
  
  // Grid columns
  gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  
  // Touch-friendly button
  touchButton: 'min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 sm:py-3',
  
  // Responsive text
  text: 'text-sm sm:text-base md:text-lg',
  heading: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  
  // Safe area handling
  safeArea: 'safe-area-top safe-area-bottom safe-area-left safe-area-right',
} as const;

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Check if device is desktop
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};





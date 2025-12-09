/**
 * Analytics utility for tracking user events
 * Supports Google Analytics and custom event tracking
 */

// Google Analytics Measurement ID (replace with your actual ID)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    console.log('Analytics: GA_MEASUREMENT_ID not configured');
    return;
  }

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
    });
  `;
  document.head.appendChild(script2);
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  if ((window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: {
    category?: string;
    action?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: eventParams?.category || 'general',
      event_label: eventParams?.label,
      value: eventParams?.value,
      ...eventParams,
    });
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('📊 Analytics Event:', eventName, eventParams);
  }
};

/**
 * Track enquiry posted
 */
export const trackEnquiryPosted = (enquiryId: string, category: string, isPremium: boolean) => {
  trackEvent('enquiry_posted', {
    category: 'enquiry',
    action: 'post',
    label: category,
    enquiry_id: enquiryId,
    is_premium: isPremium,
  });
};

/**
 * Track response submitted
 */
export const trackResponseSubmitted = (enquiryId: string, responseId: string) => {
  trackEvent('response_submitted', {
    category: 'response',
    action: 'submit',
    enquiry_id: enquiryId,
    response_id: responseId,
  });
};

/**
 * Track user sign up
 */
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', {
    category: 'user',
    action: 'sign_up',
    method: method,
  });
};

/**
 * Track user sign in
 */
export const trackSignIn = (method: string) => {
  trackEvent('sign_in', {
    category: 'user',
    action: 'sign_in',
    method: method,
  });
};

/**
 * Track payment initiated
 */
export const trackPaymentInitiated = (planId: string, amount: number) => {
  trackEvent('payment_initiated', {
    category: 'payment',
    action: 'initiate',
    plan_id: planId,
    value: amount,
  });
};

/**
 * Track payment completed
 */
export const trackPaymentCompleted = (planId: string, amount: number, transactionId?: string) => {
  trackEvent('payment_completed', {
    category: 'payment',
    action: 'complete',
    plan_id: planId,
    value: amount,
    transaction_id: transactionId,
  });
};

/**
 * Track search performed
 */
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    category: 'search',
    action: 'search',
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track button click
 */
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('button_click', {
    category: 'engagement',
    action: 'click',
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};


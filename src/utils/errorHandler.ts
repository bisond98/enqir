/**
 * Comprehensive Error Handling Utility
 * Provides consistent error handling across the app
 */

import { toast } from "@/hooks/use-toast";

export interface AppError extends Error {
  code?: string;
  userMessage?: string;
  context?: string;
  retryable?: boolean;
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: unknown, context?: string): string => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Firebase/Firestore errors
    if (errorMessage.includes('permission-denied') || errorMessage.includes('permission denied')) {
      return 'You don\'t have permission to perform this action. Please check your account access.';
    }
    
    if (errorMessage.includes('unavailable') || errorMessage.includes('network')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    
    if (errorMessage.includes('not-found') || errorMessage.includes('not found')) {
      return 'The requested item could not be found. It may have been deleted.';
    }
    
    if (errorMessage.includes('already-exists') || errorMessage.includes('already exists')) {
      return 'This item already exists. Please check and try again.';
    }
    
    if (errorMessage.includes('failed-precondition') || errorMessage.includes('index')) {
      return 'Database configuration issue. Please refresh the page.';
    }
    
    if (errorMessage.includes('cancelled') || errorMessage.includes('cancel')) {
      return 'Operation was cancelled.';
    }
    
    if (errorMessage.includes('deadline-exceeded') || errorMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (errorMessage.includes('unauthenticated') || errorMessage.includes('auth')) {
      return 'Please sign in to continue.';
    }
    
    // Generic error with context
    if (context) {
      return `Failed to ${context}. ${error.message}`;
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return context 
    ? `Failed to ${context}. Please try again.`
    : 'An unexpected error occurred. Please try again.';
};

/**
 * Handle error with toast notification
 */
export const handleError = (
  error: unknown,
  options?: {
    context?: string;
    showToast?: boolean;
    fallbackMessage?: string;
    onError?: (error: AppError) => void;
  }
): AppError => {
  const {
    context,
    showToast = true,
    fallbackMessage,
    onError
  } = options || {};
  
  let appError: AppError;
  
  if (error instanceof Error) {
    appError = {
      ...error,
      name: error.name,
      message: error.message,
      userMessage: getUserFriendlyMessage(error, context),
      context,
      retryable: isRetryableError(error)
    };
  } else {
    appError = {
      name: 'UnknownError',
      message: 'An unknown error occurred',
      userMessage: fallbackMessage || getUserFriendlyMessage(error, context),
      context,
      retryable: false
    };
  }
  
  // Log error for debugging
  console.error(`[ErrorHandler] ${context || 'Error'}:`, {
    error: appError,
    message: appError.message,
    code: appError.code,
    context: appError.context,
    stack: appError.stack
  });
  
  // Show toast notification
  if (showToast) {
    toast({
      title: "Error",
      description: appError.userMessage || appError.message,
      variant: "destructive",
      duration: 5000
    });
  }
  
  // Call custom error handler if provided
  if (onError) {
    onError(appError);
  }
  
  return appError;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const retryableErrors = [
      'network',
      'unavailable',
      'timeout',
      'deadline-exceeded',
      'cors',
      'connection'
    ];
    
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }
  
  return false;
};

/**
 * Safe async wrapper with error handling
 */
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  options?: {
    context?: string;
    fallback?: T;
    showToast?: boolean;
    onError?: (error: AppError) => void;
  }
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, {
      context: options?.context,
      showToast: options?.showToast,
      onError: options?.onError
    });
    
    return options?.fallback ?? null;
  }
};

/**
 * Safe Firebase operation wrapper
 */
export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  options?: {
    context?: string;
    fallback?: T;
    showToast?: boolean;
  }
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    // Handle Firebase-specific errors
    let userMessage = getUserFriendlyMessage(error, options?.context);
    
    // Firebase error codes
    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          userMessage = 'You don\'t have permission to perform this action.';
          break;
        case 'unavailable':
          userMessage = 'Service temporarily unavailable. Please try again.';
          break;
        case 'deadline-exceeded':
          userMessage = 'Request timed out. Please try again.';
          break;
        case 'not-found':
          userMessage = 'The requested item was not found.';
          break;
        case 'already-exists':
          userMessage = 'This item already exists.';
          break;
        case 'failed-precondition':
          userMessage = 'Database configuration issue. Please refresh.';
          break;
        case 'cancelled':
          userMessage = 'Operation was cancelled.';
          break;
        default:
          userMessage = getUserFriendlyMessage(error, options?.context);
      }
    }
    
    if (options?.showToast !== false) {
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
        duration: 5000
      });
    }
    
    console.error(`[Firebase] ${options?.context || 'Operation'} failed:`, {
      code: error?.code,
      message: error?.message,
      error
    });
    
    return options?.fallback ?? null;
  }
};

/**
 * Retry operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    context?: string;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    context = 'Operation',
    onRetry
  } = options || {};
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`[Retry] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe operation with automatic retry and error handling
 * Non-intrusive by default - only shows toasts if explicitly requested
 */
export const safeOperationWithRetry = async <T>(
  operation: () => Promise<T>,
  options?: {
    context?: string;
    maxRetries?: number;
    fallback?: T;
    showToast?: boolean;
    silent?: boolean; // If true, no logs or toasts
  }
): Promise<T | null> => {
  const {
    context = 'Operation',
    maxRetries = 2,
    fallback,
    showToast = false, // Default to false to avoid interrupting user
    silent = false
  } = options || {};

  try {
    return await retryOperation(operation, {
      maxRetries,
      context,
      onRetry: (attempt, error) => {
        // Only log retries if not silent
        if (!silent) {
          console.warn(`[Retry] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1})`);
        }
        // Only show toast if explicitly requested and on first retry
        if (showToast && attempt === 1 && !silent) {
          toast({
            title: "Retrying...",
            description: `Connection issue detected. Retrying ${context.toLowerCase()}...`,
            duration: 2000
          });
        }
      }
    });
  } catch (error) {
    // Only handle error if not silent
    if (!silent) {
      handleError(error, {
        context,
        showToast,
        fallbackMessage: `Failed to ${context.toLowerCase()}. Please try again.`
      });
    }
    return fallback ?? null;
  }
};









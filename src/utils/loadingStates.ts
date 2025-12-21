/**
 * Loading state management utilities
 * Provides smooth loading transitions
 */

import { useState, useCallback } from "react";

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
}

export function useLoadingState() {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, retryCount: 0 });
  }, []);

  const incrementRetry = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    reset,
    incrementRetry
  };
}

/**
 * Smooth transition wrapper for async operations
 */
export async function withSmoothTransition<T>(
  operation: () => Promise<T>,
  onStart?: () => void,
  onComplete?: () => void,
  minDelay: number = 300
): Promise<T> {
  const startTime = Date.now();
  
  if (onStart) {
    onStart();
  }

  try {
    const result = await operation();
    
    // Ensure minimum delay for smooth transition
    const elapsed = Date.now() - startTime;
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
    }
    
    if (onComplete) {
      onComplete();
    }
    
    return result;
  } catch (error) {
    if (onComplete) {
      onComplete();
    }
    throw error;
  }
}


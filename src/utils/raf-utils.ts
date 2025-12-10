/**
 * RequestAnimationFrame utilities for smooth performance
 */

/**
 * Throttle function calls using requestAnimationFrame
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Debounce function calls using requestAnimationFrame
 */
export function rafDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 16
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
      timeoutId = null;
    }, delay);
  };
}

/**
 * Batch multiple updates into a single requestAnimationFrame
 */
export function createBatchUpdate() {
  let rafId: number | null = null;
  const callbacks: Set<() => void> = new Set();

  return function batchUpdate(callback: () => void) {
    callbacks.add(callback);

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        callbacks.forEach(cb => cb());
        callbacks.clear();
        rafId = null;
      });
    }
  };
}

/**
 * Smooth scroll with requestAnimationFrame
 */
export function smoothScroll(
  element: HTMLElement | Window,
  options: { top?: number; left?: number; behavior?: ScrollBehavior } = {}
): void {
  const defaultOptions = {
    top: 0,
    left: 0,
    behavior: 'smooth' as ScrollBehavior,
  };

  requestAnimationFrame(() => {
    if (element === window) {
      window.scrollTo({ ...defaultOptions, ...options });
    } else {
      (element as HTMLElement).scrollTo({ ...defaultOptions, ...options });
    }
  });
}


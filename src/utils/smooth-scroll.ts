/**
 * Smooth scroll utility with performance optimizations
 */

/**
 * Smoothly scroll to an element with requestAnimationFrame for better performance
 */
export function smoothScrollTo(
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = {}
): void {
  if (!element) return;

  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
  };

  // Use requestAnimationFrame for smoother scrolling
  requestAnimationFrame(() => {
    element.scrollIntoView({ ...defaultOptions, ...options });
  });
}

/**
 * Smoothly scroll to top of page
 */
export function smoothScrollToTop(): void {
  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

/**
 * Smoothly scroll to a specific position
 */
export function smoothScrollToPosition(
  x: number,
  y: number,
  element?: HTMLElement
): void {
  const target = element || window;
  requestAnimationFrame(() => {
    if (element) {
      element.scrollTo({ left: x, top: y, behavior: 'smooth' });
    } else {
      window.scrollTo({ left: x, top: y, behavior: 'smooth' });
    }
  });
}

/**
 * Throttled scroll handler for better performance
 */
export function createSmoothScrollHandler(
  callback: () => void,
  delay: number = 16
): () => void {
  let lastCall = 0;
  let rafId: number | null = null;

  return () => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(callback);
    }
  };
}


import { useEffect, useRef } from 'react';

/**
 * Performance optimization hook
 * Handles common performance optimizations like scroll optimization, 
 * image preloading, and viewport management
 */
export function usePerformanceOptimizations() {
  const scrollOptimizedRef = useRef<Set<HTMLElement>>(new Set());

  useEffect(() => {
    // Optimize scroll performance for all scrollable containers
    const optimizeScrollContainers = () => {
      const scrollContainers = document.querySelectorAll(
        '.overflow-auto, .overflow-y-auto, .overflow-x-auto, [class*="overflow"]'
      );

      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement && !scrollOptimizedRef.current.has(container)) {
          container.style.willChange = 'scroll-position';
          container.style.webkitOverflowScrolling = 'touch';
          scrollOptimizedRef.current.add(container);
        }
      });
    };

    // Run on mount and after a short delay to catch dynamically added elements
    optimizeScrollContainers();
    const timeoutId = setTimeout(optimizeScrollContainers, 1000);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup will-change for better performance
      scrollOptimizedRef.current.forEach((container) => {
        container.style.willChange = 'auto';
      });
      scrollOptimizedRef.current.clear();
    };
  }, []);

  // Optimize images
  useEffect(() => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    images.forEach((img) => imageObserver.observe(img));

    return () => {
      images.forEach((img) => imageObserver.unobserve(img));
    };
  }, []);
}

/**
 * Hook to prevent layout shifts
 * Adds proper dimensions to images and other content
 */
export function usePreventLayoutShift() {
  useEffect(() => {
    // Add aspect ratio to images without dimensions
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.addEventListener('load', function onLoad() {
          if (this.naturalWidth && this.naturalHeight) {
            const aspectRatio = this.naturalHeight / this.naturalWidth;
            this.style.aspectRatio = `${this.naturalWidth} / ${this.naturalHeight}`;
            this.removeEventListener('load', onLoad);
          }
        });
      }
    });
  }, []);
}






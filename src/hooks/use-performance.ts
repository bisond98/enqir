import { useEffect, useRef } from 'react';

/**
 * Performance optimization hook
 * Handles common performance optimizations like scroll optimization, 
 * image preloading, and viewport management
 * 
 * NOTE: Removed will-change: scroll-position on all overflow containers
 * as it creates unnecessary compositor layers and hurts GPU memory.
 * Modern browsers already optimize scroll performance automatically.
 */
export function usePerformanceOptimizations() {
  // Optimize images via IntersectionObserver (native lazy loading fallback)
  useEffect(() => {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;

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
      { rootMargin: '200px' } // Start loading 200px before visible
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
    const images = document.querySelectorAll('img:not([width]):not([height])');
    const cleanup: (() => void)[] = [];
    
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        const onLoad = () => {
          if (img.naturalWidth && img.naturalHeight) {
            img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          }
          img.removeEventListener('load', onLoad);
        };
        img.addEventListener('load', onLoad);
        cleanup.push(() => img.removeEventListener('load', onLoad));
      }
    });

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, []);
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip scrolling on HelpGuide page to allow animations to play
    if (pathname === '/help-guide') {
      return;
    }

    // Smooth scroll to top when pathname changes
    const scrollToTop = () => {
      const startPosition = window.pageYOffset;
      const startTime = performance.now();
      const duration = 400; // milliseconds

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition * (1 - eased));
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToTop, 50);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};

export default ScrollToTop;


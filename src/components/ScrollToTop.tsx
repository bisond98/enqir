import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll to top when pathname changes
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };
    
    // Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      scrollToTop();
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;


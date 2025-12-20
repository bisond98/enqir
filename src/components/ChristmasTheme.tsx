import { useEffect, useState } from 'react';

export const ChristmasTheme = ({ children }: { children: React.ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [isLandingPage, setIsLandingPage] = useState(false);

  useEffect(() => {
    // Auto-activate between Dec 1 - Jan 7
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const shouldActivate = (month === 11 && day >= 1) || (month === 0 && day <= 7);
    
    // Check localStorage for manual override
    const saved = localStorage.getItem('christmasTheme');
    if (saved !== null) {
      setIsActive(saved === 'true');
    } else {
      setIsActive(shouldActivate);
    }
    
    // Check if we're on landing page using window.location
    const checkLandingPage = () => {
      setIsLandingPage(window.location.pathname === '/');
    };
    
    checkLandingPage();
    
    // Listen for route changes
    const handlePopState = () => {
      checkLandingPage();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Check periodically in case of programmatic navigation
    const interval = setInterval(checkLandingPage, 100);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Auto-activate between Dec 1 - Jan 7
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const shouldActivate = (month === 11 && day >= 1) || (month === 0 && day <= 7);
    
    // Check localStorage for manual override
    const saved = localStorage.getItem('christmasTheme');
    if (saved !== null) {
      setIsActive(saved === 'true');
    } else {
      setIsActive(shouldActivate);
    }
  }, []);

  if (!isActive) return <>{children}</>;

  return (
    <div className={`christmas-theme ${isLandingPage ? 'full-screen-snow' : 'header-only-snow'}`}>
      {/* Full screen snowflakes - only on landing page */}
      {isLandingPage && (
        <div className="snowflakes" aria-hidden="true">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="snowflake" 
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 5}s`,
                fontSize: `${8 + Math.random() * 8}px`
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}
      
      {/* Subtle border decorations */}
      <div className="christmas-border-top"></div>
      <div className="christmas-border-bottom"></div>
      
      {children}
    </div>
  );
};


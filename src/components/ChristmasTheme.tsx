import { useEffect, useState, useMemo } from 'react';

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

  // Memoize snowflake data to ensure consistency across environments
  // Use a seeded random function for consistent results
  const seededRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };

  const landingSnowflakes = useMemo(() => {
    const random = seededRandom(54321); // Fixed seed for consistency (different from header)
    return [...Array(50)].map((_, i) => ({
      id: i,
      left: random() * 100,
      animationDelay: random() * 5,
      animationDuration: 3 + random() * 5,
      fontSize: 2 + random() * 2 // Reduced to 2-4px
    }));
  }, []); // Empty dependency array - only generate once

  if (!isActive) return <>{children}</>;

  return (
    <div className={`christmas-theme ${isLandingPage ? 'full-screen-snow' : 'header-only-snow'}`}>
      {/* Full screen snowflakes - only on landing page */}
      {isLandingPage && (
        <div className="snowflakes" aria-hidden="true">
          {landingSnowflakes.map((snowflake) => (
            <div 
              key={snowflake.id} 
              className="snowflake" 
              style={{
                left: `${snowflake.left}%`,
                animationDelay: `${snowflake.animationDelay}s`,
                animationDuration: `${snowflake.animationDuration}s`,
                fontSize: `${snowflake.fontSize}px`
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


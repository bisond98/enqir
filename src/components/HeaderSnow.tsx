import { useMemo } from 'react';

export const HeaderSnow = () => {
  // Memoize snowflake data to ensure consistency across environments
  // Use a seeded random function for consistent results
  const seededRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };

  const snowflakes = useMemo(() => {
    const random = seededRandom(12345); // Fixed seed for consistency
    return [...Array(40)].map((_, i) => ({
      id: i,
      left: random() * 100,
      animationDelay: random() * 6,
      animationDuration: 3 + random() * 5,
      fontSize: 2 + random() * 2 // Reduced to 2-4px
    }));
  }, []); // Empty dependency array - only generate once

  return (
    <div className="header-snowflakes" aria-hidden="true">
      {snowflakes.map((snowflake) => (
        <div 
          key={snowflake.id} 
          className="header-snowflake" 
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
  );
};


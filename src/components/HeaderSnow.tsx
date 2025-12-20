import { useMemo } from 'react';

export const HeaderSnow = () => {
  // Memoize snowflake data to ensure consistency across environments
  const snowflakes = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 6,
      animationDuration: 3 + Math.random() * 5,
      fontSize: 8 + Math.random() * 10
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


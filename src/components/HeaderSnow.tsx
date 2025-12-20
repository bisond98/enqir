export const HeaderSnow = () => {
  return (
    <div className="header-snowflakes" aria-hidden="true">
      {[...Array(40)].map((_, i) => (
        <div 
          key={i} 
          className="header-snowflake" 
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${3 + Math.random() * 5}s`,
            fontSize: `${8 + Math.random() * 10}px`
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};


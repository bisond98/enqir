/**
 * FloatingRobot — the same robot mascot from the sign-in / help-guide pages,
 * packaged as a reusable, self-contained component. All animations (floating
 * body/head, blinking eyes, swinging arms, pulsing shadow) run inside the SVG,
 * so no external state or CSS is needed. Size it via the `size` prop.
 */
import { useEffect, useRef, useMemo } from 'react';

const FloatingRobot = ({ size = 56, className = '' }: { size?: number; className?: string }) => {
  // Unique gradient/filter IDs per instance so multiple robots can coexist.
  // useMemo keeps IDs stable across re-renders (a new random ID on every render
  // would remount the SVG defs and can make the robot flash/disappear).
  const uid = useMemo(() => `fr${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className={className} style={{ width: size, height: size, pointerEvents: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ overflow: 'visible', background: 'transparent', display: 'block' }}
      >
        <defs>
          <filter id={`cyan-glow-${uid}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`whiteMatte-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#fafafa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`lightGrey-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 0.4 }} />
            <stop offset="50%" style={{ stopColor: '#e8e8e8', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: '#d8d8d8', stopOpacity: 0.3 }} />
          </linearGradient>
          <radialGradient id={`cyanGlow-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: '#00e5ff', stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: '#00d4ff', stopOpacity: 0.95 }} />
            <stop offset="70%" style={{ stopColor: '#00b8d4', stopOpacity: 0.85 }} />
            <stop offset="100%" style={{ stopColor: '#0097a7', stopOpacity: 0.6 }} />
          </radialGradient>
          <radialGradient id={`eyeHighlight-${uid}`} cx="30%" cy="30%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Soft floating shadow */}
        <ellipse cx="50" cy="95" rx="18" ry="4" fill="#000000" opacity="0.08">
          <animate attributeName="rx" values="18;20;18" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" />
          <animate attributeName="opacity" values="0.08;0.1;0.08" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" />
        </ellipse>

        {/* Body */}
        <g>
          <ellipse cx="50" cy="65" rx="18" ry="20" fill="#4a5568" stroke="#2d3748" strokeWidth="0.5" />
          <ellipse cx="50" cy="65" rx="16" ry="18" fill="#718096" />
          <rect x="32" y="60" width="36" height="4" rx="1" fill="#1a1a1a" opacity="0.9" />
          <rect x="47" y="60" width="6" height="4" rx="0.5" fill="#00bcd4" stroke="#0097a7" strokeWidth="0.3" />
          <rect x="38" y="55" width="24" height="6" rx="1.5" fill="#1a1a1a" opacity="0.7" />
          <text x="50" y="59" fontSize="3.5" fill="#ffffff" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.95">
            ENQIR
          </text>
          <circle cx="50" cy="68" r="1.6" fill="#00bcd4" opacity="0.9">
            <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="72" r="1.6" fill="#00bcd4" opacity="0.9">
            <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          {/* Body float */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-2.5; 0,0"
            dur="5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            keyTimes="0;0.5;1"
          />
        </g>

        {/* Arms */}
        <g>
          {/* Left arm + hand */}
          <g>
            <ellipse cx="28" cy="62" rx="5" ry="10" fill={`url(#whiteMatte-${uid})`} transform="rotate(-15 28 62)" />
            <circle cx="24" cy="70" r="3.5" fill={`url(#whiteMatte-${uid})`} />
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-15 28 62; -28 28 62; -15 28 62"
              dur="4s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
              keyTimes="0;0.5;1"
            />
          </g>
          {/* Right arm + hand */}
          <g>
            <ellipse cx="72" cy="62" rx="5" ry="10" fill={`url(#lightGrey-${uid})`} transform="rotate(15 72 62)" />
            <circle cx="76" cy="70" r="3.5" fill={`url(#whiteMatte-${uid})`} />
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="15 72 62; 28 72 62; 15 72 62"
              dur="4s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
              keyTimes="0;0.5;1"
              begin="2s"
            />
          </g>
        </g>

        {/* Head */}
        <g>
          <ellipse cx="50" cy="30" rx="18" ry="20" fill={`url(#whiteMatte-${uid})`} stroke="none" />
          <ellipse cx="50" cy="30" rx="16" ry="18" fill={`url(#lightGrey-${uid})`} />
          <line x1="50" y1="8" x2="50" y2="12" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="8" r="3" fill="#00bcd4" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Face screen */}
          <ellipse cx="50" cy="32" rx="14" ry="16" fill="#1a1a1a" opacity="0.96" />
          <ellipse cx="50" cy="29" rx="9" ry="6" fill={`url(#eyeHighlight-${uid})`} opacity="0.15" />
          {/* Eyes */}
          <ellipse cx="44" cy="29" rx="4" ry="5" fill={`url(#cyanGlow-${uid})`} style={{ filter: `url(#cyan-glow-${uid})` }}>
            <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" />
          </ellipse>
          <ellipse cx="56" cy="29" rx="4" ry="5" fill={`url(#cyanGlow-${uid})`} style={{ filter: `url(#cyan-glow-${uid})` }}>
            <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s" />
          </ellipse>
          <ellipse cx="44.8" cy="28" rx="1.4" ry="1.8" fill={`url(#eyeHighlight-${uid})`} />
          <ellipse cx="55.2" cy="28" rx="1.4" ry="1.8" fill={`url(#eyeHighlight-${uid})`} />
          {/* Blink — a full-width lid rect that sweeps down over the eyes */}
          <rect x="36" y="25" width="28" height="0.01" fill="#1a1a1a" rx="2">
            <animate attributeName="height" values="0.01;0.01;14;0.01;0.01" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.48;0.5;0.52;1" />
          </rect>
          {/* Head float (offset phase) */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-2; 0,0"
            dur="5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            keyTimes="0;0.5;1"
            begin="0.8s"
          />
        </g>
      </svg>
    </div>
  );
};

export default FloatingRobot;

/**
 * RoamingFloatingRobot — the same mascot, but it glides to a new random spot
 * across the viewport every few seconds (like the sign-in page robot that
 * wanders around the card). Fixed position, floats above page content, no
 * pointer events so it never blocks taps.
 */
export const RoamingFloatingRobot = ({ size = 56, avoidSelector }: { size?: number; avoidSelector?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;

    const intersectsAvoid = (x: number, y: number): boolean => {
      if (!avoidSelector) return false;
      const zone = document.querySelector(avoidSelector);
      if (!zone) return false;
      const r = zone.getBoundingClientRect();
      // Robot box overlaps the avoid zone (with a little padding)
      return x < r.right + 8 && x + size > r.left - 8 && y < r.bottom + 8 && y + size > r.top - 8;
    };

    const move = () => {
      if (!alive || !ref.current) return;
      const margin = 48;
      const maxX = Math.max(window.innerWidth - margin * 2 - size, 0);
      const maxY = Math.max(window.innerHeight - margin * 2 - size, 0);
      // Try a few times to land in the open (not behind cards/titles);
      // if every try overlaps, take the last one anyway so it keeps moving.
      let x = 0;
      let y = 0;
      for (let attempt = 0; attempt < 12; attempt++) {
        x = margin + Math.random() * maxX;
        y = margin + Math.random() * maxY;
        if (!intersectsAvoid(x, y)) break;
      }
      ref.current.style.left = `${x}px`;
      ref.current.style.top = `${y}px`;
    };

    move();
    const id = window.setInterval(move, 6500);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [size, avoidSelector]);

  return (
    <div
      ref={ref}
      className="fixed z-0 pointer-events-none"
      style={{
        transition: 'left 5.5s cubic-bezier(0.45, 0, 0.55, 1), top 5.5s cubic-bezier(0.45, 0, 0.55, 1)',
        willChange: 'left, top',
      }}
    >
      <FloatingRobot size={size} className="animate-[float_5s_ease-in-out_infinite]" />
    </div>
  );
};

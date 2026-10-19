import React from 'react';

/**
 * RouteFallback — Suspense fallback for lazy route chunks (first boot +
 * every route change).
 *
 * Full white page with the Enqir wordmark and the spinner beside it —
 * replaces the old bare spinner + "Loading" screen. Still a tiny static
 * render: no animation library, near-zero cost.
 *
 * Purely visual: no routing, data, or page logic is affected.
 */
export const RouteFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`min-h-screen flex items-center justify-center bg-white ${className}`}
    role="status"
    aria-label="Loading"
  >
    <div className="flex items-center gap-4 sm:gap-6 px-4">
      <span className="text-7xl sm:text-9xl font-extrabold tracking-tight text-gray-950 leading-none select-none">
        Enqir
      </span>
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full border-[3px] border-gray-300 border-t-black animate-spin"
        style={{ willChange: 'transform' }}
      />
    </div>
  </div>
);

export default RouteFallback;

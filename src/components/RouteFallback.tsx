import React from 'react';

/**
 * RouteFallback — lightweight Suspense fallback for lazy route chunks.
 *
 * Replaces the full-page LoadingAnimation (large SVG scene + framer-motion)
 * in the router-level Suspense boundary. That heavy component was
 * re-rendered on every route change while a page chunk downloaded, causing
 * a visible flash of a complex animation before each page. This fallback is
 * a tiny, static, centered spinner — same brand styling (black on light),
 * no animation library, near-zero render cost.
 *
 * Purely visual: no routing, data, or page logic is affected.
 */
export const RouteFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`min-h-[60vh] flex items-center justify-center bg-slate-50 ${className}`}
    role="status"
    aria-label="Loading"
  >
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-8 h-8 rounded-full border-[3px] border-gray-300 border-t-black animate-spin"
        style={{ willChange: 'transform' }}
      />
      <span className="text-xs font-bold font-chip tracking-tight text-gray-500">Loading</span>
    </div>
  </div>
);

export default RouteFallback;

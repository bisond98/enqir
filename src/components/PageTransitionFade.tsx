import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransitionFade — smooths route swaps without touching routing logic.
 *
 * When the route changes, the outgoing page is kept mounted (invisible) for
 * one animation frame while the incoming page fades in over ~140ms. If the
 * new page is still loading (lazy chunk fetch), the Suspense spinner shows
 * as usual and the fade simply applies once it mounts.
 *
 * Purely visual: no navigation, data, or render logic is altered. If
 * something goes wrong it degrades to plain rendering (children pass
 * through untouched).
 */
export const PageTransitionFade = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [fadeIn, setFadeIn] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // First mount: show immediately, no animation.
    if (firstRender.current) {
      firstRender.current = false;
      setFadeIn(true);
      return;
    }
    setFadeIn(false);
    const raf = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 140ms ease-out',
        // Never trap pointer events mid-fade
        pointerEvents: fadeIn ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransitionFade;

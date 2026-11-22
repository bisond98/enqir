/**
 * One rule for the post-enquiry wizard's automatic scrolling: once a phone user
 * has touched, scrolled, swiped or typed, the page must never move on its own
 * again. Before that first touch the wizard may still reveal its heading, but
 * after it, scrolling belongs entirely to the finger.
 */

let userInteracted = false;
let installed = false;

const markInteracted = () => {
  userInteracted = true;
};

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // Capture phase so the flag is set before any bubbling handler can scroll.
  const opts: AddEventListenerOptions = { passive: true, capture: true };
  window.addEventListener('touchstart', markInteracted, opts);
  window.addEventListener('touchmove', markInteracted, opts);
  window.addEventListener('pointerdown', markInteracted, opts);
  window.addEventListener('wheel', markInteracted, opts);
  window.addEventListener('keydown', markInteracted, opts);
  // Deliberately no 'scroll' listener: our own reveal scroll fires one too, and
  // that would switch the guard off before the user ever moved the page.
}

install();

/** True while automatic scrolling is still allowed (desktop, or an untouched phone). */
export function canAutoScroll(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth >= 640) return true;
  return !userInteracted;
}

/**
 * Puts the step heading (`#step-top`) at the top of the viewport and keeps it
 * there while the page is still settling, so a form tab opens already scrolled
 * to its title instead of on the marketing block above it.
 *
 * Instant on mobile rather than smooth: a smooth animation started before the
 * last chunk, image or font lands finishes somewhere else — that is how the
 * heading used to drift back off screen. The retries below re-assert the
 * position through those late layout shifts, and every one of them gives way
 * the moment the page belongs to the finger.
 */
export function revealStepTop(anchorId = 'step-top', offset = 10): void {
  if (typeof window === 'undefined') return;
  const smooth = window.innerWidth >= 640;
  const apply = () => {
    if (!canAutoScroll()) return;
    const el = document.getElementById(anchorId);
    if (!el) return;
    const top = Math.max(0, Math.round(window.scrollY + el.getBoundingClientRect().top - offset));
    if (Math.abs(top - window.scrollY) <= 1) return;
    window.scrollTo({
      top,
      behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior),
    });
  };
  apply();
  // Retries cover everything that lands after the first frame: the sign-in
  // restore that swaps the loading screen for the form, the step animation,
  // lazy chunks, images and fonts. Each attempt is a no-op once the heading is
  // already in place, and all of them stop as soon as the page is touched.
  for (const ms of [120, 320, 650, 1000, 1500, 2200, 3000]) {
    window.setTimeout(apply, ms);
  }
}

/** Called when the wizard mounts so a fresh visit starts with the reveal intact. */
export function resetAutoScrollGuard(): void {
  userInteracted = false;
}

/** Focus-driven jumps count as automatic scrolling on the same terms. */
export const canAutoFocus = canAutoScroll;

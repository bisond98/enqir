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

/** Called when the wizard mounts so a fresh visit starts with the reveal intact. */
export function resetAutoScrollGuard(): void {
  userInteracted = false;
}

/** Focus-driven jumps count as automatic scrolling on the same terms. */
export const canAutoFocus = canAutoScroll;

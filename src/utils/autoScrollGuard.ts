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
  //
  // On a phone the window is longer because the wizard can mount well after
  // this call: a form that waits on the restored session only paints its
  // heading seconds in, and the list used to run out before it existed — which
  // is why a tab could still open on the middle of its content. Nothing extra
  // happens on desktop, where the short list is enough and smooth scrolling
  // makes a late re-assertion more noticeable.
  const retries = smooth
    ? [120, 320, 650, 1000, 1500, 2200, 3000]
    : [120, 320, 650, 1000, 1500, 2200, 3000, 4200, 5600, 7000];
  for (const ms of retries) {
    window.setTimeout(apply, ms);
  }
}

/** Called when the wizard mounts so a fresh visit starts with the reveal intact. */
export function resetAutoScrollGuard(): void {
  userInteracted = false;
}

/**
 * Moving to another step is a deliberate move to a new tab, not the page
 * wandering on its own: the new tab opens on its title even though the tap
 * that got us here already counted as interaction. Without this the wizard
 * kept the previous step's scroll offset, so the Description tab opened with
 * the big empty textarea at the top and its heading scrolled away above it.
 *
 * The guard is re-armed straight after, so the first touch, swipe or key the
 * user makes on the new tab stops every one of the reveal's retries.
 */
export function revealNewStep(anchorId = 'step-top', offset = 10): void {
  resetAutoScrollGuard();
  revealStepTop(anchorId, offset);
}

/**
 * Puts the page back at the very top — black header, heading and step bar —
 * rather than parking the new step on its first field. Uses the same retries
 * as revealStepTop so late layout shifts cannot leave the tab half scrolled,
 * and stops the moment the user takes over the page.
 */
export function revealPageTop(): void {
  if (typeof window === 'undefined') return;
  const apply = () => {
    if (!canAutoScroll()) return;
    if (window.scrollY <= 0) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  apply();
  const retries = [120, 320, 650, 1000, 1500, 2200, 3000];
  for (const ms of retries) {
    window.setTimeout(apply, ms);
  }
}

/** A step change opens the new tab at the top, with the reveal re-armed. */
export function revealNewPageTop(): void {
  resetAutoScrollGuard();
  revealPageTop();
}

/** Focus-driven jumps count as automatic scrolling on the same terms. */
export const canAutoFocus = canAutoScroll;

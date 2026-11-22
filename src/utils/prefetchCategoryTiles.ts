/**
 * Category tiles are CSS background images, so the browser only starts fetching
 * one when its tile is first painted — which is why the grid used to pop in a
 * few seconds after the form appeared. Warming the first page as soon as the
 * form mounts (and the rest when the browser is idle) means the pictures are
 * already cached by the time the category step is shown.
 */
import { APP_CATEGORIES } from '@/constants/categories';
import { CATEGORY_TILE_IMAGES } from '@/constants/categoryTileImages';

const warmed = new Set<string>();

function warm(urls: string[]) {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (!url || warmed.has(url)) return;
    warmed.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
}

const isMain = (value: string) => ['business', 'personal', 'service'].includes(value);

/** The two grids order their tiles differently, so warm what each shows first. */
const firstPageUrls = () => {
  const mains = APP_CATEGORIES.filter((c) => isMain(c.value));
  const rest = APP_CATEGORIES.filter((c) => !isMain(c.value) && c.value !== 'other').sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  const other = APP_CATEGORIES.filter((c) => c.value === 'other');
  const enquiryOrder = [...mains, ...rest, ...other]; // post-enquiry form
  const sellOrder = APP_CATEGORIES; // sell listing form
  const urls = [...enquiryOrder.slice(0, 10), ...sellOrder.slice(0, 10)]
    .map((c) => CATEGORY_TILE_IMAGES[c.value])
    .filter(Boolean);
  return Array.from(new Set(urls));
};

const restUrls = () => {
  const first = firstPageUrls();
  return Object.values(CATEGORY_TILE_IMAGES).filter((url) => !first.includes(url));
};

/** Called when either form mounts. */
export function prefetchCategoryTiles(): void {
  if (typeof window === 'undefined') return;
  const conn = (navigator as any).connection as
    | { saveData?: boolean; effectiveType?: string }
    | undefined;
  if (conn?.saveData) return;

  warm(firstPageUrls());

  // Two more pages are warmed on a decent connection, and only once the
  // browser has nothing more important to do — not the whole set, which would
  // spend mobile data on categories most people never page to.
  const slow = conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g';
  if (slow) return;
  const nextPages = restUrls().slice(0, 20);
  const idle = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => void)
    | undefined;
  if (idle) idle(() => warm(nextPages), { timeout: 4000 });
  else window.setTimeout(() => warm(nextPages), 2500);
}

// Brand and model search keywords for the category search in the Post Enquiry
// and Sell New forms. Every word here comes from the exact lists those forms
// already render in their brand/model dropdowns, so anything a user can pick is
// also a word that finds its category: "casio" → Watches, "macbook" → Laptops,
// "apple" → Laptops, Mobiles and Watches.
//
// Nothing else is derived — no new brands or models are introduced here.

import { LAPTOP_BRAND_OPTIONS, getLaptopModels } from './laptopCatalog';
import { WATCH_BRAND_OPTIONS, getWatchModels } from './watchCatalog';
import { CAMERA_BRAND_OPTIONS, getCameraModelUnion } from './cameraCatalog';
import { AUDIO_BRAND_OPTIONS, getAudioModelUnion } from './audioCatalog';
import {
  CAR_BRANDS,
  BIKE_BRANDS,
  MOBILE_BRANDS,
  SNEAKER_BRANDS,
  VEHICLE_BRANDS,
} from '@/modules/sell/categoryBrands';

const modelsOf = (brands: string[], getModels: (brand: string) => string[]): string[] =>
  brands.flatMap((brand) => getModels(brand));

/** People type joined brand names either way — "OnePlus" or "one plus" — so
 *  every keyword is also offered with its camel-case humps split apart. */
const withSpacedVariants = (words: string[]): string[] => {
  const out: string[] = [];
  for (const word of words) {
    out.push(word);
    const spaced = word.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
    if (spaced !== word) out.push(spaced);
  }
  return Array.from(new Set(out));
};

const CAMERA_MODELS = getCameraModelUnion();

export const CATEGORY_BRAND_KEYWORDS: Record<string, string[]> = {
  mobiles: withSpacedVariants([...MOBILE_BRANDS]),
  // OnePlus, boAt, Noise, Samsung sell earphones as well as phones, and the
  // Electronics dropdown carries an "Audio & Headphones" option, so the same
  // brands find it too (Mobiles still leads — see the brand tier in
  // categories.ts).
  electronics: withSpacedVariants([...MOBILE_BRANDS]),
  laptops: withSpacedVariants([...LAPTOP_BRAND_OPTIONS, ...modelsOf(LAPTOP_BRAND_OPTIONS, getLaptopModels)]),
  watches: withSpacedVariants([...WATCH_BRAND_OPTIONS, ...modelsOf(WATCH_BRAND_OPTIONS, getWatchModels)]),
  // Audio & Headphones: its own brand list plus every model, so "airpods pro"
  // or "wh-1000xm5" finds the category too.
  'audio-headphones': withSpacedVariants([...AUDIO_BRAND_OPTIONS, ...getAudioModelUnion()]),
  // Cameras are reachable through all three legacy/photography category values.
  camera: [...CAMERA_BRAND_OPTIONS, ...CAMERA_MODELS],
  photography: [...CAMERA_BRAND_OPTIONS, ...CAMERA_MODELS],
  'photography-cameras': [...CAMERA_BRAND_OPTIONS, ...CAMERA_MODELS],
  car: withSpacedVariants([...CAR_BRANDS, ...VEHICLE_BRANDS]),
  bike: withSpacedVariants([...BIKE_BRANDS]),
  vehicles: withSpacedVariants([...VEHICLE_BRANDS, ...CAR_BRANDS]),
  sneakers: withSpacedVariants([...SNEAKER_BRANDS]),
};

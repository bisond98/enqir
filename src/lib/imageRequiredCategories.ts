// Categories where uploading at least 1 image is REQUIRED when creating a
// listing (sell form) or posting an enquiry (buy form). These are physical
// items a buyer needs to see. All other categories (jobs, services,
// intangibles) keep images optional.

export const IMAGE_REQUIRED_CATEGORIES = new Set<string>([
  // Vehicles
  'car',
  'bike',
  'vehicles',
  'automobile',
  'bicycles',
  // Electronics
  'mobiles',
  'laptops',
  'electronics',
  'photography-cameras',
  'appliances',
  'technology',
  'gaming-recreation',
  // Physical goods
  'furniture',
  'home',
  'fashion',
  'sneakers',
  'jewelry-accessories',
  'bags-luggage',
  'beauty-products',
  'musical-instruments',
  'sports-outdoor',
  'fitness-gym-equipment',
  'kitchen-dining',
  'garden-outdoor',
  'tools-equipment',
  'books-publications',
  'baby-kids',
  'pets',
  'medical-equipment',
  'office-supplies',
  'raw-materials-industrial',
  'antiques',
  'collectibles',
  'memorabilia',
  'vintage',
  'thrift',
  'art',
  'souvenir',
  // Gray-area categories confirmed as requiring images
  'real-estate',
  'real-estate-services',
  'food-beverage',
  'agriculture-farming',
]);

/** True if ANY of the given categories requires an image. */
export function categoriesRequireImage(cats: string[] | string | undefined | null): boolean {
  if (!cats) return false;
  const list = Array.isArray(cats) ? cats : [cats];
  return list.some((c) => IMAGE_REQUIRED_CATEGORIES.has(c));
}

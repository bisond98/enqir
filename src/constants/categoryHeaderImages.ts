// ── Category header photos for the dashboard enquiry tiles ───────────────────
// Each enquiry's dashboard tile paints a dark, Indian-market photo behind its
// black header. Keywords are matched loosely against the enquiry's category so
// new subcategories keep working; anything unknown falls back to the generic
// building shot.
const HEADER_DIR = '/images/headers';

const KEYWORD_IMAGES: { keywords: string[]; image: string }[] = [
  // Vehicles — Indian hatchback / motorcycle
  { keywords: ['car', 'suv', 'taxi', 'auto', 'vehicle', 'transport'], image: `${HEADER_DIR}/car.jpg` },
  { keywords: ['bike', 'bicycle', 'scooter', 'motorcycle', 'two-wheeler'], image: `${HEADER_DIR}/bike.jpg` },

  // Property — Indian apartments, hostels, rentals
  {
    keywords: ['property', 'real-estate', 'real estate', 'rent', 'rental', 'hostel', 'flat', 'apartment', 'pg', 'land', 'house', 'villa', 'commercial-space'],
    image: `${HEADER_DIR}/property.jpg`,
  },

  // Electronics & tech
  {
    keywords: ['electronic', 'mobile', 'phone', 'laptop', 'computer', 'audio', 'headphone', 'camera', 'gaming', 'tech', 'appliance', 'television', 'security'],
    image: `${HEADER_DIR}/electronics.jpg`,
  },

  // Home & furniture
  {
    keywords: ['home', 'furniture', 'kitchen', 'dining', 'garden', 'interior', 'decor', 'mattress', 'office-supplies'],
    image: `${HEADER_DIR}/home.jpg`,
  },

  // Fashion & lifestyle
  {
    keywords: ['fashion', 'saree', 'clothing', 'apparel', 'thrift', 'sneaker', 'shoe', 'watch', 'jewel', 'bag', 'accessor', 'vintage', 'art', 'collectible'],
    image: `${HEADER_DIR}/fashion.jpg`,
  },

  // Food, agriculture & pets
  {
    keywords: ['food', 'beverage', 'restaurant', 'catering', 'agriculture', 'farming', 'grocery', 'vegetable', 'dairy', 'pet', 'bakery'],
    image: `${HEADER_DIR}/food.jpg`,
  },

  // Jobs, study & desk work
  {
    keywords: ['job', 'hiring', 'work', 'employment', 'study', 'education', 'tuition', 'book', 'business', 'service', 'legal', 'finance', 'marketing', 'insurance', 'consult', 'event', 'travel', 'media', 'music'],
    image: `${HEADER_DIR}/office.jpg`,
  },
];

/** Dark Indian-market header photo for an enquiry category. */
export const getCategoryHeaderImage = (category?: string | null): string => {
  const key = String(category || '').trim().toLowerCase();
  if (key) {
    for (const entry of KEYWORD_IMAGES) {
      if (entry.keywords.some((word) => key.includes(word))) return entry.image;
    }
  }
  return `${HEADER_DIR}/default.jpg`;
};

export default getCategoryHeaderImage;

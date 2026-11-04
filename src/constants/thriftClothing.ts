// Thrift-only dropdowns for the Description step of both forms
// (Post Enquiry and Sell New Listing).
//
// Flow: Gender -> Type -> Item.
// The item list is per gender (as specified): every type shows the same
// gender list, so the Type pick is recorded rather than used as a filter.
// Values are stored on the doc's `details` map as thriftGender / thriftType /
// thriftItem, alongside the other category-specific fields.

export interface ThriftGender {
  value: string;
  label: string;
}

export const THRIFT_GENDERS: ThriftGender[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
];

// Middle dropdown — appears once a gender is picked.
export const THRIFT_TYPES = [
  'Clothing',
  'Footwear',
  'Bags',
  'Accessories',
  'Watches',
  'Jewellery',
  'Other',
];

const MALE_ITEMS = [
  'T-Shirts', 'Shirts', 'Polo Shirts', 'Jeans', 'Trousers', 'Shorts', 'Jackets',
  'Hoodies', 'Sweatshirts', 'Sweaters', 'Coats', 'Suits & Blazers', 'Tracksuits',
  'Sneakers', 'Formal Shoes', 'Casual Shoes', 'Boots', 'Sandals & Slippers',
  'Jerseys', 'Tank Tops', 'Vests', 'Cargo Pants', 'Joggers', 'Chinos',
  'Innerwear', 'Sleepwear', 'Activewear', 'Traditional Wear', 'Ethnic Wear',
  'Denim Wear', 'Caps & Hats', 'Belts', 'Other',
];

const FEMALE_ITEMS = [
  'T-Shirts', 'Tops', 'Blouses', 'Shirts', 'Crop Tops', 'Tank Tops',
  'Camisoles', 'Jeans', 'Trousers', 'Wide-Leg Pants', 'Cargo Pants',
  'Leggings', 'Joggers', 'Shorts', 'Skirts', 'Mini Dresses', 'Midi Dresses',
  'Maxi Dresses', 'Casual Dresses', 'Party Dresses', 'Jumpsuits', 'Rompers',
  'Jackets', 'Denim Jackets', 'Leather Jackets', 'Blazers', 'Coats', 'Hoodies',
  'Sweatshirts', 'Sweaters', 'Cardigans', 'Knitwear', 'Tracksuits',
  'Activewear', 'Sportswear', 'Formal Wear', 'Nightwear', 'Sleepwear',
  'Lingerie', 'Swimwear', 'Sarees', 'Kurtis', 'Kurtas', 'Salwar Suits',
  'Anarkali Suits', 'Lehengas', 'Dupattas', 'Ethnic Skirts', 'Palazzo Pants',
  'Traditional Blouses', 'Maternity Wear', 'Other',
];

const UNISEX_ITEMS = [
  'T-Shirts', 'Graphic T-Shirts', 'Oversized T-Shirts', 'Shirts',
  'Oversized Shirts', 'Polo Shirts', 'Tank Tops', 'Crop Tops',
  'Long-Sleeve Tops', 'Jeans', 'Baggy Jeans', 'Straight-Leg Jeans',
  'Trousers', 'Wide-Leg Trousers', 'Cargo Pants', 'Joggers', 'Sweatpants',
  'Shorts', 'Denim Shorts', 'Cargo Shorts', 'Jackets', 'Denim Jackets',
  'Leather Jackets', 'Bomber Jackets', 'Windbreakers', 'Varsity Jackets',
  'Track Jackets', 'Hoodies', 'Zip-Up Hoodies', 'Sweatshirts',
  'Crewneck Sweatshirts', 'Sweaters', 'Cardigans', 'Knitwear', 'Coats',
  'Blazers', 'Tracksuits', 'Jerseys', 'Football Jerseys', 'Basketball Jerseys',
  'Sportswear', 'Activewear', 'Tracksuit Bottoms', 'Overalls & Dungarees',
  'Jumpsuits', 'Rompers', 'Vintage Clothing', 'Streetwear', 'Workwear',
  'Denim Wear', 'Rainwear', 'Thermal Wear', 'Sleepwear', 'Swimwear',
  'Traditional Wear', 'Costumes & Themed Clothing', 'Other',
];

export const THRIFT_ITEMS: Record<string, string[]> = {
  male: MALE_ITEMS,
  female: FEMALE_ITEMS,
  unisex: UNISEX_ITEMS,
};

// Footwear has its own list per gender (shoes differ far more than tops do).
// Any type without a dedicated list falls back to the gender list above.
const MALE_FOOTWEAR = [
  'Sneakers', 'Casual Shoes', 'Running Shoes', 'Sports Shoes',
  'Basketball Shoes', 'Football Boots', 'Skate Shoes', 'Training Shoes',
  'Walking Shoes', 'Formal Shoes', 'Oxford Shoes', 'Derby Shoes', 'Loafers',
  'Monk Strap Shoes', 'Brogues', 'Boots', 'Chelsea Boots', 'Ankle Boots',
  'Combat Boots', 'Work Boots', 'Hiking Boots', 'Chukka Boots',
  'Desert Boots', 'Sandals', 'Slides', 'Flip-Flops', 'Slippers', 'Clogs',
  'Espadrilles', 'Moccasins', 'Driving Shoes', 'Vintage Footwear', 'Other',
];

const FEMALE_FOOTWEAR = [
  'Sneakers', 'Casual Shoes', 'Running Shoes', 'Sports Shoes',
  'Walking Shoes', 'Training Shoes', 'Skate Shoes', 'Basketball Shoes',
  'Football Boots', 'Formal Shoes', 'Loafers', 'Ballet Flats', 'Flat Shoes',
  'Mary Jane Shoes', 'Oxford Shoes', 'Heels', 'High Heels', 'Block Heels',
  'Stiletto Heels', 'Kitten Heels', 'Wedges', 'Platform Shoes', 'Pumps',
  'Boots', 'Ankle Boots', 'Knee-High Boots', 'Thigh-High Boots',
  'Chelsea Boots', 'Combat Boots', 'Sandals', 'Flat Sandals',
  'Heeled Sandals', 'Gladiator Sandals', 'Slides', 'Flip-Flops', 'Slippers',
  'Clogs', 'Espadrilles', 'Mules', 'Moccasins', 'Driving Shoes',
  'Bridal Footwear', 'Ethnic Footwear', 'Juttis', 'Mojaris',
  'Kolhapuri Chappals', 'Vintage Footwear', 'Other',
];

const UNISEX_FOOTWEAR = [
  'Sneakers', 'Casual Shoes', 'Running Shoes', 'Sports Shoes',
  'Walking Shoes', 'Training Shoes', 'Basketball Shoes', 'Football Boots',
  'Skate Shoes', 'Tennis Shoes', 'Hiking Shoes', 'Trail Running Shoes',
  'Canvas Shoes', 'Slip-On Shoes', 'High-Top Sneakers', 'Low-Top Sneakers',
  'Retro Sneakers', 'Vintage Sneakers', 'Formal Shoes', 'Loafers',
  'Moccasins', 'Oxford Shoes', 'Derby Shoes', 'Boots', 'Ankle Boots',
  'Chelsea Boots', 'Combat Boots', 'Hiking Boots', 'Work Boots', 'Sandals',
  'Slides', 'Flip-Flops', 'Slippers', 'Clogs', 'Crocs-Style Clogs',
  'Espadrilles', 'Mules', 'Platform Shoes', 'Driving Shoes', 'Water Shoes',
  'Other',
];

const MALE_BAGS = [
  'Backpacks', 'Laptop Backpacks', 'School Backpacks', 'Travel Backpacks',
  'Messenger Bags', 'Sling Bags', 'Crossbody Bags', 'Shoulder Bags',
  'Tote Bags', 'Duffel Bags', 'Gym Bags', 'Sports Bags', 'Travel Bags',
  'Duffle Backpacks', 'Laptop Bags', 'Briefcases', 'Office Bags',
  'Satchel Bags', 'Waist Bags', 'Belt Bags', 'Fanny Packs', 'Waist Pouches',
  'Camera Bags', 'Utility Bags', 'Tactical Bags', 'Hiking Bags',
  'Camping Backpacks', 'Rucksacks', 'Dry Bags', 'Weekend Bags',
  'Garment Bags', 'Toiletry Bags', 'Wash Bags', 'Wallets', 'Card Holders',
  'Coin Pouches', 'Clutches', 'Vintage Bags', 'Other',
];

const FEMALE_BAGS = [
  'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Sling Bags', 'Tote Bags',
  'Mini Bags', 'Satchel Bags', 'Hobo Bags', 'Bucket Bags', 'Clutch Bags',
  'Evening Bags', 'Party Bags', 'Wallets', 'Card Holders', 'Coin Purses',
  'Pouches', 'Wristlets', 'Backpacks', 'Mini Backpacks', 'Travel Backpacks',
  'Laptop Bags', 'Messenger Bags', 'Duffel Bags', 'Gym Bags', 'Travel Bags',
  'Weekender Bags', 'Beach Bags', 'Basket Bags', 'Straw Bags', 'Woven Bags',
  'Quilted Bags', 'Frame Bags', 'Top-Handle Bags', 'Doctor Bags',
  'Baguette Bags', 'Crescent Bags', 'Belt Bags', 'Waist Bags',
  'Fanny Packs', 'Diaper Bags', 'Garment Bags', 'Cosmetic Bags',
  'Makeup Bags', 'Toiletry Bags', 'Camera Bags', 'Laptop Sleeves',
  'Vintage Bags', 'Other',
];

const UNISEX_BAGS = [
  'Backpacks', 'Vintage Backpacks', 'Canvas Backpacks', 'Leather Backpacks',
  'Hiking Backpacks', 'Travel Backpacks', 'Rucksacks', 'Messenger Bags',
  'Crossbody Bags', 'Sling Bags', 'Shoulder Bags', 'Tote Bags',
  'Canvas Tote Bags', 'Duffel Bags', 'Vintage Duffel Bags', 'Gym Bags',
  'Sports Bags', 'Travel Bags', 'Weekender Bags', 'Laptop Bags', 'Briefcases',
  'Satchel Bags', 'School Bags', 'Camera Bags', 'Waist Bags', 'Fanny Packs',
  'Belt Bags', 'Utility Bags', 'Military / Tactical Bags',
  'Hiking / Outdoor Bags', 'Dry Bags', 'Bucket Bags', 'Clutch Bags', 'Wallets',
  'Vintage Wallets', 'Coin Pouches', 'Card Holders', 'Pouches',
  'Toiletry Bags', 'Cosmetic Bags', 'Garment Bags', 'Beach Bags',
  'Basket Bags', 'Woven Bags', 'Collectible Bags', 'Other',
];

const MALE_ACCESSORIES = [
  'Vintage Watches', 'Pre-owned Watches', 'Sunglasses', 'Eyeglasses / Frames',
  'Leather Belts', 'Vintage Belts', 'Baseball Caps', 'Snapback Caps',
  'Vintage Caps', 'Beanies', 'Bucket Hats', 'Vintage Hats',
  'Scarves & Mufflers', 'Vintage Ties', 'Bow Ties', 'Cufflinks', 'Bracelets',
  'Vintage Bracelets', 'Necklaces & Chains', 'Rings', 'Pendants', 'Earrings',
  'Vintage Jewellery', 'Leather Wallets', 'Vintage Wallets', 'Card Holders',
  'Suspenders', 'Bandanas', 'Gloves',
  'Keychains & Collectible Keyrings', 'Vintage Brooches & Pins',
  'Collectible Fashion Accessories', 'Other',
];

const FEMALE_ACCESSORIES = [
  'Pre-owned Watches', 'Vintage Watches', 'Sunglasses',
  'Eyeglasses / Frames', 'Belts', 'Vintage Belts', 'Hair Clips', 'Hair Claws',
  'Hair Bands', 'Headbands', 'Scrunchies', 'Barrettes', 'Hair Pins', 'Hats',
  'Baseball Caps', 'Bucket Hats', 'Beanies', 'Scarves', 'Shawls', 'Stoles',
  'Gloves', 'Jewellery', 'Vintage Jewellery', 'Necklaces', 'Chains',
  'Pendants', 'Earrings', 'Hoops', 'Stud Earrings', 'Rings', 'Bracelets',
  'Bangles', 'Anklets', 'Brooches', 'Jewellery Sets', 'Vintage Jewellery Sets',
  'Lockets', 'Chokers', 'Cuff Bracelets', 'Wallets', 'Card Holders',
  'Coin Purses', 'Keychains & Collectible Keyrings', 'Hand Fans',
  'Gloves & Arm Warmers', 'Bandanas', 'Vintage Fashion Accessories',
  'Collectible Accessories', 'Other',
];

// 'Cufflinks' appears twice in the supplied unisex list; kept once so the
// dropdown has no duplicate option (and React keeps unique keys).
const UNISEX_ACCESSORIES = [
  'Vintage Watches', 'Pre-owned Watches', 'Sunglasses',
  'Eyeglasses / Frames', 'Belts', 'Vintage Belts', 'Baseball Caps',
  'Snapback Caps', 'Bucket Hats', 'Beanies', 'Vintage Hats', 'Scarves',
  'Bandanas', 'Shawls', 'Gloves', 'Bracelets', 'Vintage Bracelets',
  'Necklaces', 'Chains', 'Pendants', 'Rings', 'Earrings', 'Jewellery Sets',
  'Brooches & Pins', 'Lockets', 'Chokers', 'Anklets', 'Cufflinks', 'Wallets',
  'Vintage Wallets', 'Card Holders', 'Coin Purses',
  'Keychains & Collectible Keyrings', 'Hair Clips & Accessories',
  'Headbands', 'Hair Bands', 'Hair Pins', 'Suspenders', 'Ties & Bow Ties',
  'Pocket Squares', 'Collectible Fashion Accessories',
  'Vintage Fashion Accessories', 'Other',
];

const MALE_WATCHES = [
  'Analog Watches', 'Digital Watches', 'Chronograph Watches',
  'Automatic Watches', 'Mechanical Watches', 'Quartz Watches',
  'Vintage Watches', 'Dress Watches', 'Sports Watches', 'Diver Watches',
  'Field Watches', 'Pilot Watches', 'Military Watches', 'Racing Watches',
  'Smartwatches', 'Hybrid Watches', 'Skeleton Watches', 'Pocket Watches',
  'Luxury Watches', 'Limited Edition Watches', 'Collectible Watches', 'Other',
];

const FEMALE_WATCHES = [
  'Analog Watches', 'Digital Watches', 'Quartz Watches', 'Automatic Watches',
  'Mechanical Watches', 'Vintage Watches', 'Dress Watches', 'Casual Watches',
  'Sports Watches', 'Chronograph Watches', 'Diver Watches', 'Smartwatches',
  'Hybrid Watches', 'Bracelet Watches', 'Bangle Watches', 'Pendant Watches',
  'Mini Watches', 'Square Dial Watches', 'Oval Dial Watches',
  'Rectangular Dial Watches', 'Luxury Watches', 'Limited Edition Watches',
  'Collectible Watches', 'Other',
];

const UNISEX_WATCHES = [
  'Analog Watches', 'Digital Watches', 'Quartz Watches', 'Automatic Watches',
  'Mechanical Watches', 'Vintage Watches', 'Dress Watches', 'Casual Watches',
  'Sports Watches', 'Chronograph Watches', 'Diver Watches', 'Field Watches',
  'Pilot Watches', 'Military Watches', 'Smartwatches', 'Hybrid Watches',
  'Skeleton Watches', 'Pocket Watches', 'Bracelet Watches',
  'Square Dial Watches', 'Round Dial Watches', 'Rectangular Dial Watches',
  'Tonneau Dial Watches', 'Luxury Watches', 'Limited Edition Watches',
  'Collectible Watches', 'Other',
];

const MALE_JEWELLERY = [
  'Necklaces', 'Chains', 'Pendants', 'Lockets', 'Bracelets',
  'Chain Bracelets', 'Cuff Bracelets', 'Rings', 'Signet Rings',
  'Statement Rings', 'Earrings', 'Stud Earrings', 'Hoop Earrings',
  'Ear Cuffs', 'Brooches', 'Lapel Pins', 'Tie Pins', 'Cufflinks',
  'Jewellery Sets', 'Anklets', 'Vintage Jewellery', 'Antique Jewellery',
  'Handmade Jewellery', 'Collectible Jewellery', 'Other',
];

const FEMALE_JEWELLERY = [
  'Necklaces', 'Chains', 'Pendants', 'Lockets', 'Chokers',
  'Statement Necklaces', 'Layered Necklaces', 'Bracelets', 'Bangles',
  'Cuff Bracelets', 'Charm Bracelets', 'Rings', 'Statement Rings',
  'Cocktail Rings', 'Engagement Rings', 'Earrings', 'Stud Earrings',
  'Hoop Earrings', 'Drop Earrings', 'Dangle Earrings', 'Jhumkas',
  'Ear Cuffs', 'Anklets', 'Toe Rings', 'Brooches', 'Jewellery Sets',
  'Bridal Jewellery', 'Hair Jewellery', 'Nose Rings & Studs', 'Maang Tikka',
  'Matha Patti', 'Waist Chains', 'Vintage Jewellery', 'Antique Jewellery',
  'Handmade Jewellery', 'Collectible Jewellery', 'Other',
];

const UNISEX_JEWELLERY = [
  'Necklaces', 'Chains', 'Pendants', 'Lockets', 'Chokers', 'Bracelets',
  'Chain Bracelets', 'Cuff Bracelets', 'Charm Bracelets', 'Rings',
  'Signet Rings', 'Statement Rings', 'Earrings', 'Stud Earrings',
  'Hoop Earrings', 'Drop Earrings', 'Ear Cuffs', 'Anklets', 'Brooches',
  'Pins & Badges', 'Cufflinks', 'Tie Pins', 'Nose Rings & Studs',
  'Jewellery Sets', 'Beaded Jewellery', 'Handmade Jewellery',
  'Vintage Jewellery', 'Antique Jewellery', 'Tribal Jewellery',
  'Religious Jewellery', 'Gothic Jewellery', 'Punk Jewellery',
  'Collectible Jewellery', 'Other',
];

// Items that differ by type. Anything missing here uses THRIFT_ITEMS[gender]
// as the fallback — as of the Jewellery lists, every type is fully split.
export const THRIFT_TYPE_ITEMS: Record<string, Record<string, string[]>> = {
  male: { Footwear: MALE_FOOTWEAR, Bags: MALE_BAGS, Accessories: MALE_ACCESSORIES, Watches: MALE_WATCHES, Jewellery: MALE_JEWELLERY },
  female: { Footwear: FEMALE_FOOTWEAR, Bags: FEMALE_BAGS, Accessories: FEMALE_ACCESSORIES, Watches: FEMALE_WATCHES, Jewellery: FEMALE_JEWELLERY },
  unisex: { Footwear: UNISEX_FOOTWEAR, Bags: UNISEX_BAGS, Accessories: UNISEX_ACCESSORIES, Watches: UNISEX_WATCHES, Jewellery: UNISEX_JEWELLERY },
};

// Sizes depend on the picked Type (not the gender): a shirt size means nothing
// for a bag, and watches are measured in millimetres.
const CLOTHING_SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL / 2XL', '3XL', '4XL', '5XL',
  'Free Size', 'One Size', 'Custom / Altered Size', 'No Size Label', 'Other',
];

const FOOTWEAR_SIZES = [
  'UK 2', 'UK 2.5', 'UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5',
  'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5',
  'UK 10', 'UK 10.5', 'UK 11', 'UK 11.5', 'UK 12', 'UK 13', 'UK 14', 'UK 15',
];

const BAG_SIZES = [
  'Mini', 'Small', 'Medium', 'Large', 'Extra Large', 'Oversized',
  'One Size', 'No Size Label', 'Other',
];

const ACCESSORY_SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL / 2XL', '3XL', '4XL', 'Adjustable',
  'Free Size', 'One Size', 'Custom Size', 'No Size Label', 'Other',
];

const WATCH_SIZES = [
  'Extra Small (Under 26 mm)', 'Small (26–32 mm)', 'Medium (33–38 mm)',
  'Large (39–42 mm)', 'Extra Large (43–46 mm)', 'Oversized (47 mm+)',
  'No Size Label', 'Other',
];

const JEWELLERY_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'Adjustable', 'One Size', 'Free Size',
  'Custom Size', 'No Size Label', 'Other',
];

export const THRIFT_SIZES: Record<string, string[]> = {
  Clothing: CLOTHING_SIZES,
  Footwear: FOOTWEAR_SIZES,
  Bags: BAG_SIZES,
  Accessories: ACCESSORY_SIZES,
  Watches: WATCH_SIZES,
  Jewellery: JEWELLERY_SIZES,
};

/** Sizes for the picked type; empty until a type with sizes is chosen. */
export function thriftSizesFor(type: string): string[] {
  return THRIFT_SIZES[(type || '').trim()] ?? [];
}

/**
 * Items for the picked gender. Empty until a gender is chosen, so the third
 * dropdown only appears once there is something to choose from.
 */
export function thriftItemsFor(gender: string, type?: string): string[] {
  // Accepts the label ('Male') or the raw value ('male'), so a stored value
  // and the dropdown option never have to agree on casing.
  const key = (gender || '').trim().toLowerCase();
  if (type) {
    const byType = THRIFT_TYPE_ITEMS[key];
    if (byType && byType[type]) return byType[type];
  }
  return THRIFT_ITEMS[key] ?? [];
}

/** 'male' -> 'Male', for labels and summary rows. */
export function thriftGenderLabel(gender: string): string {
  return THRIFT_GENDERS.find((g) => g.value === gender)?.label ?? gender;
}

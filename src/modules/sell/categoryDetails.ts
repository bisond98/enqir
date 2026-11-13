import { TOOLS_EQUIPMENT_SUBCATEGORIES } from '@/constants/categories';
import { TRANSPORTATION_SUBCATEGORIES } from '@/constants/categories';
import { TRAVEL_SUBCATEGORIES } from '@/constants/categories';
import { TUTORING_SUBCATEGORIES } from '@/constants/categories';
import { VINTAGE_SUBCATEGORIES } from '@/constants/categories';
import { WASTE_MANAGEMENT_SUBCATEGORIES } from '@/constants/categories';
import { WEDDING_SUBCATEGORIES } from '@/constants/categories';
import { TECHNOLOGY_SUBCATEGORIES } from '@/constants/categories';
import { SPORTS_SUBCATEGORIES } from '@/constants/categories';
import { SOUVENIRS_SUBCATEGORIES } from '@/constants/categories';
import { SECURITY_SUBCATEGORIES } from '@/constants/categories';
import { RENEWABLE_ENERGY_SUBCATEGORIES } from '@/constants/categories';
import { REAL_ESTATE_SERVICES_SUBCATEGORIES } from '@/constants/categories';
import { PHOTOGRAPHY_SUBCATEGORIES } from '@/constants/categories';
import { CAMERA_BRAND_OPTIONS } from '@/constants/cameraCatalog';
import { LAPTOP_BRAND_OPTIONS } from '@/constants/laptopCatalog';
import { WATCH_BRAND_OPTIONS } from '@/constants/watchCatalog';
// Category-specific detail fields shown dynamically in the Create Listing form.
// Each field declares which step it belongs to ('title' | 'description' | 'details' | 'price')
// so inputs never overcrowd — they slot into the existing flow.
// Values are stored as a flat `details` map on the listing document.

import { CAR_BRANDS, BIKE_BRANDS, SNEAKER_BRANDS, VEHICLE_BRANDS, VEHICLE_TYPES } from './categoryBrands';
import { ACCOMMODATION_SUBTYPES, GENDER_RELEVANT_ACCOMMODATION_TYPES, REPAIR_SERVICE_TYPES, CLEANING_SERVICE_TYPES, ELECTRONICS_SUBCATEGORIES, AGRICULTURE_SUBCATEGORIES, ANTIQUES_SUBCATEGORIES, APPLIANCE_SUBCATEGORIES, ART_SUBCATEGORIES, BABY_KIDS_SUBCATEGORIES, BAGS_LUGGAGE_SUBCATEGORIES, BEAUTY_SUBCATEGORIES, BICYCLES_SUBCATEGORIES, BOOKS_SUBCATEGORIES, CHILDCARE_SUBCATEGORIES, COLLECTIBLES_SUBCATEGORIES, CONSTRUCTION_SUBCATEGORIES, EDUCATION_SUBCATEGORIES, ENTERTAINMENT_SUBCATEGORIES, EVENTS_SUBCATEGORIES, FASHION_SUBCATEGORIES, FITNESS_SUBCATEGORIES, FOOD_SUBCATEGORIES, FURNITURE_SUBCATEGORIES, GAMING_SUBCATEGORIES, GARDEN_SUBCATEGORIES, GOVERNMENT_SUBCATEGORIES, HEALTH_SUBCATEGORIES, HOME_SUBCATEGORIES, INDUSTRIAL_SUBCATEGORIES, INSURANCE_SUBCATEGORIES, JEWELLERY_SUBCATEGORIES, KITCHEN_DINING_SUBCATEGORIES, LEGAL_SUBCATEGORIES, MARKETING_SUBCATEGORIES, MEDICAL_EQUIPMENT_SUBCATEGORIES, MEMORABILIA_SUBCATEGORIES, MUSICAL_ACCESSORIES_SUBCATEGORIES, MUSICAL_INSTRUMENTS_SUBCATEGORIES, MUSICAL_SERVICES_SUBCATEGORIES, NON_PROFIT_SUBCATEGORIES } from '@/constants/categories';
import { THRIFT_GENDERS, THRIFT_TYPES } from '@/constants/thriftClothing';

// Sneaker sizes — US and UK scales. Adults get the full run; Kids get the
// children's range. 'Other' always last so users can enter odd sizes.
export const SNEAKER_SIZES_ADULTS = [
  'US 4', 'US 4.5', 'US 5', 'US 5.5', 'US 6', 'US 6.5', 'US 7', 'US 7.5',
  'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 11.5',
  'US 12', 'US 13', 'US 14',
  'UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5',
  'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 11',
  'UK 12', 'UK 13',
  'Other',
];
export const SNEAKER_SIZES_KIDS = [
  'US 10.5K', 'US 11K', 'US 11.5K', 'US 12K', 'US 12.5K', 'US 13K',
  'US 13.5K', 'US 1Y', 'US 1.5Y', 'US 2Y', 'US 2.5Y', 'US 3Y',
  'UK 2', 'UK 2.5', 'UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5',
  'UK 6',
  'Other',
];

// Condition grade for the Condition step of the sell form. The New/Used chips
// above it are the coarse pick; this is the actual wear grade the buyer reads.
export const PRODUCT_CONDITIONS = [
  'Brand New with Tags – Unused, original tags attached',
  'Brand New with Tags (0% wear)',
  'Brand New without Tags (0% wear)',
  'Open Box (0% use)',
  'New with Minor Defects (0% use)',
  'Like New (0–2% wear)',
  'Excellent (2–5% wear)',
  'Very Good (5–10% wear)',
  'Good (10–20% wear)',
  'Fair (20–40% wear)',
  'Heavily Used (40%+ wear)',
  'Vintage – Excellent (Minimal age wear)',
  'Vintage – Good (Visible age wear)',
  'Restored / Refurbished',
  'Altered / Modified',
  'Incomplete (Missing parts)',
  'Damaged but Usable',
  'For Repair',
  'For Parts / Collectors',
];

// Simple yes/no dropdown shown next to the condition grade.
export const VISIBLE_DAMAGE_OPTIONS = ['Yes', 'No'];

// What kind of damage, how bad, and whether the item still works.
export const DAMAGE_TYPES = [
  'Scratch',
  'Stain',
  'Tear',
  'Crack',
  'Dent',
  'Discoloration',
  'Missing Part',
  'Other',
];

export const DAMAGE_SEVERITIES = ['Minor', 'Moderate', 'Major'];

export const FUNCTIONAL_STATUSES = [
  'Fully Functional',
  'Partially Functional',
  'Not Functional',
  'Not Applicable',
];

export type CategoryDetailsStep = 'title' | 'description' | 'details' | 'price';

export interface CategoryDetailField {
  key: string;
  label: string;
  placeholder?: string;
  type: 'select' | 'number' | 'text' | 'land-area';
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
  typeable?: boolean;
  step: CategoryDetailsStep;
}

// Unit options for composite 'land-area' fields (number input + unit dropdown).
export const LAND_AREA_UNITS = ['Cents', 'Acre', 'Hectare', 'Sqft'];

// Indian RTO registration state codes (all states + union territories),
// shown as "CODE — State" so sellers can pick easily; the chip displays the full selection.
const REGISTRATION_STATES = [
  'AP — Andhra Pradesh', 'AR — Arunachal Pradesh', 'AS — Assam', 'BR — Bihar',
  'CG — Chhattisgarh', 'GA — Goa', 'GJ — Gujarat', 'HR — Haryana',
  'HP — Himachal Pradesh', 'JH — Jharkhand', 'JK — Jammu & Kashmir',
  'KA — Karnataka', 'KL — Kerala', 'LA — Ladakh',
  'MP — Madhya Pradesh', 'MH — Maharashtra', 'MN — Manipur', 'ML — Meghalaya',
  'MZ — Mizoram', 'NL — Nagaland', 'DL — Delhi', 'OD — Odisha',
  'PY — Puducherry', 'PB — Punjab', 'RJ — Rajasthan', 'SK — Sikkim',
  'TN — Tamil Nadu', 'TS — Telangana', 'TR — Tripura', 'UP — Uttar Pradesh',
  'UK — Uttarakhand', 'WB — West Bengal', 'AN — Andaman & Nicobar Islands',
  'CH — Chandigarh', 'DNHDD — Dadra & Nagar Haveli and Daman & Diu',
];

export type CategoryDetailsConfig = Record<string, CategoryDetailField[]>;

const MOBILE_BRANDS = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Realme', 'Vivo', 'Oppo',
  'Motorola', 'Nothing', 'Google Pixel', 'Nokia', 'iQOO', 'Asus', 'Infinix', 'Tecno', 'Other',
];

// Keys must match the laptop catalogue, so the Model dropdown can cascade from
// whatever brand the seller picked.
const LAPTOP_BRANDS = LAPTOP_BRAND_OPTIONS;

const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

export const CATEGORY_DETAILS: CategoryDetailsConfig = {
  car: [
    { key: 'brand', label: 'Brand', type: 'select', options: CAR_BRANDS, placeholder: 'Select brand', step: 'title' },
    // Title step renders type:'select' as a native dropdown (the 2-option
    // toggle only exists in the description step), so moving it here both
    // converts transmission to a dropdown and places it under Brand.
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], placeholder: 'Select transmission', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year of manufacture', typeable: true, step: 'title' },
    { key: 'variant', label: 'Variant', type: 'text', placeholder: 'e.g., VXI, ZXI (O), LXI CNG', step: 'title' },
    { key: 'fuel', label: 'Fuel type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], placeholder: 'Select fuel', step: 'description' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'Kilometers driven', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
    { key: 'accidentHistory', label: 'Accident history', type: 'select', options: ['No accidents', 'Minor accidents', 'Major accidents'], placeholder: 'Select accident history', step: 'details' },
    { key: 'registrationState', label: 'Registration state', type: 'select', options: REGISTRATION_STATES, placeholder: 'Registration state (e.g., KL, TN)', step: 'details' },
  ],
  vehicles: [
    // Vehicle type (truck, lorry, pickup, tractor …) sits before Brand, then the
    // maker list covers cars, trucks, earthmovers and tractors.
    { key: 'vehicleType', label: 'Type', type: 'select', options: VEHICLE_TYPES, placeholder: 'Select type', step: 'title' },
    { key: 'brand', label: 'Brand', type: 'select', options: VEHICLE_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year', typeable: true, step: 'title' },
    { key: 'variant', label: 'Variant', type: 'text', placeholder: 'e.g., VXI, ZXI (O), LXI CNG', step: 'title' },
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], placeholder: 'Select transmission', step: 'description' },
    { key: 'fuel', label: 'Fuel type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], placeholder: 'Select fuel', step: 'description' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'Kilometers driven', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
    { key: 'accidentHistory', label: 'Accident history', type: 'select', options: ['No accidents', 'Minor accidents', 'Major accidents'], placeholder: 'Select accident history', step: 'details' },
    { key: 'registrationState', label: 'Registration state', type: 'select', options: REGISTRATION_STATES, placeholder: 'Registration state (e.g., KL, TN)', step: 'details' },
  ],
  bike: [
    { key: 'brand', label: 'Brand', type: 'select', options: BIKE_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year', typeable: true, step: 'title' },
    { key: 'variant', label: 'Variant', type: 'text', placeholder: 'e.g., 350 Standard, Dual Channel ABS', step: 'title' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'Kilometers driven', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
    { key: 'accidentHistory', label: 'Accident history', type: 'select', options: ['No accidents', 'Minor accidents', 'Major accidents'], placeholder: 'Select accident history', step: 'details' },
    { key: 'registrationState', label: 'Registration state', type: 'select', options: REGISTRATION_STATES, placeholder: 'Registration state (e.g., KL, TN)', step: 'details' },
  ],
  mobiles: [
    { key: 'brand', label: 'Brand', type: 'select', options: MOBILE_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'storage', label: 'Storage', type: 'select', options: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], placeholder: 'Select storage', step: 'title' },
    { key: 'warranty', label: 'Warranty', type: 'select', options: ['Expired', 'Under warranty'], placeholder: 'Select warranty', step: 'details' },
  ],
  // Kitchen & Dining: the 27 subcategories, picked on the Title tab.
  // Non-profit: picked on the Title tab, same 23 as post enquiry.
  'non-profit-charity': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...NON_PROFIT_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Musical services: picked on the Title tab, same 23 as post enquiry.
  'musical-services': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MUSICAL_SERVICES_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Musical instruments: picked on the Title tab, same 21 as post enquiry.
  'musical-instruments': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MUSICAL_INSTRUMENTS_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Musical accessories: picked on the Title tab, same 20 as post enquiry.
  'musical-accessories': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MUSICAL_ACCESSORIES_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Memorabilia: picked on the Title tab, same 22 as post enquiry.
  'memorabilia': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MEMORABILIA_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Medical equipment: picked on the Title tab, same 29 as post enquiry.
  'medical-equipment': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MEDICAL_EQUIPMENT_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Marketing: services picked on the Title tab, same 30 as post enquiry.
  'marketing-advertising': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...MARKETING_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Legal: services picked on the Title tab, same 28 as post enquiry.
  'legal-financial': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...LEGAL_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  'kitchen-dining': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...KITCHEN_DINING_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Tools & equipment: picked on the Title tab, same 21 as post enquiry.
  'tools-equipment': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...TOOLS_EQUIPMENT_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Technology: picked on the Title tab, same 19 as post enquiry.
  'technology': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...TECHNOLOGY_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Sports: picked on the Title tab, same 27 as post enquiry.
  'sports-outdoor': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...SPORTS_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Souvenirs: picked on the Title tab, same 18 as post enquiry.
  'souvenir': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...SOUVENIRS_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Security: picked on the Title tab, same 23 as post enquiry.
  'security-safety': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...SECURITY_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Renewable energy: picked on the Title tab, same 20 as post enquiry.
  'renewable-energy': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...RENEWABLE_ENERGY_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Real estate services: picked on the Title tab, same 24 as post enquiry.
  'real-estate-services': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...REAL_ESTATE_SERVICES_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Photography: services picked on the Title tab, same 25 as post enquiry.
  'photography': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...PHOTOGRAPHY_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Transportation: picked on the Title tab, same 21 as post enquiry.
  'transportation-logistics': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...TRANSPORTATION_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Travel: picked on the Title tab, same 24 as post enquiry.
  'travel-tourism': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...TRAVEL_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Tutoring: picked on the Title tab, same 24 as post enquiry.
  'tutoring-lessons': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...TUTORING_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Vintage: picked on the Title tab, same 21 as post enquiry.
  vintage: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...VINTAGE_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Waste management: picked on the Title tab, same 22 as post enquiry.
  'waste-management': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...WASTE_MANAGEMENT_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Wedding: picked on the Title tab, same 24 as post enquiry.
  'wedding-events': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...WEDDING_SUBCATEGORIES], placeholder: 'Select', step: 'title' },
  ],
  // Watches: brand -> model on the Title tab, same cascade as laptops/camera.
  // Model options follow the picked brand; CreateListing resolves them with
  // getWatchModels().
  watches: [
    { key: 'brand', label: 'Brand', type: 'select', options: [...WATCH_BRAND_OPTIONS, 'Other'], placeholder: 'Brand', step: 'title' },
    { key: 'model', label: 'Model', type: 'select', options: [], placeholder: 'Model', step: 'title' },
  ],
  // Camera: brand -> model on the Title tab, same cascade as laptops.
  camera: [
    { key: 'brand', label: 'Brand', type: 'select', options: [...CAMERA_BRAND_OPTIONS], placeholder: 'Brand', step: 'title' },
    { key: 'model', label: 'Model', type: 'select', options: [], placeholder: 'Model', step: 'title' },
  ],
  laptops: [
    { key: 'brand', label: 'Brand', type: 'select', options: LAPTOP_BRANDS, placeholder: 'Select brand', step: 'title' },
    // Model options follow the picked brand (Apple -> MacBooks); CreateListing
    // resolves them with getLaptopModels().
    { key: 'model', label: 'Model', type: 'select', options: [], placeholder: 'Model', step: 'title' },
    // Processor options follow the brand picked on the Title tab (Apple -> M-series,
    // Windows brands -> Intel / AMD / Snapdragon); CreateListing resolves them.
    { key: 'processor', label: 'Processor', type: 'select', options: [], placeholder: 'Select processor', step: 'description' },
    // Storage follows the brand + model picked on the Title tab (same catalogue
    // the post-enquiry form uses), so only sizes that model came in are offered.
    { key: 'storage', label: 'Storage', type: 'select', options: [], placeholder: 'Select storage', step: 'description' },

  ],
  jobs: [
    { key: 'experience', label: 'Experience required', type: 'select', options: ['Fresher', '0-1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'], placeholder: 'Select experience', step: 'description' },
    { key: 'jobType', label: 'Job type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], placeholder: 'Select job type', step: 'description' },
    { key: 'workMode', label: 'Work mode', type: 'select', options: ['Work from office', 'Work from home', 'Hybrid'], placeholder: 'Select work mode', step: 'description' },
    { key: 'salaryPeriod', label: 'Salary period', type: 'select', options: ['Per month', 'Per year', 'Per hour', 'Per day', 'Per week', 'Other'], placeholder: 'Select salary period', step: 'price' },
  ],
  accommodations: [
    { key: 'accommodationType', label: 'Stay type', type: 'select', options: ACCOMMODATION_SUBTYPES.map(s => s.label), placeholder: 'Select stay type', step: 'title' },
    { key: 'listingFor', label: 'Listing for', type: 'select', options: ['Rent', 'Sale', 'Lease'], placeholder: 'Select', step: 'title' },
    { key: 'genderPreference', label: 'Gender preference', type: 'select', options: ['Any', 'Male only', 'Female only', 'Mixed'], placeholder: 'Select gender preference', step: 'description' },
    { key: 'furnishing', label: 'Furnishing', type: 'select', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], placeholder: 'Select furnishing', step: 'details' },
  ],
  'real-estate': [
    { key: 'landArea', label: 'Land / Plot', type: 'land-area', options: ['Cents', 'Acre', 'Hectare'], placeholder: 'e.g., 25', step: 'description' },
    { key: 'builtUpArea', label: 'Buildings / Commercial', type: 'land-area', options: ['Sqft'], placeholder: 'e.g., 1200', step: 'description' },
    { key: 'houseArea', label: 'House / Flat', type: 'land-area', options: ['Sqft'], placeholder: 'e.g., 1500', step: 'description' },
    { key: 'houseBhk', label: 'BHK', type: 'select', options: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'], placeholder: 'BHK', step: 'description' },
    { key: 'otherArea', label: 'Others', type: 'land-area', options: ['Cents', 'Acre', 'Hectare', 'Sqft'], placeholder: 'e.g., 500', step: 'description' },
    { key: 'furnishing', label: 'Furnishing', type: 'select', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], placeholder: 'Select furnishing', step: 'details' },
    { key: 'facing', label: 'Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'], placeholder: 'Select facing', step: 'details' },
  ],
  service: [
    { key: 'repairType', label: 'Service type', type: 'select', options: [...REPAIR_SERVICE_TYPES], placeholder: 'Select service type', step: 'title' },
    { key: 'serviceMode', label: 'Service mode', type: 'select', options: ['At my location', 'Pick up & fix', 'Anywhere'], placeholder: 'Select service mode', step: 'description' },
    { key: 'experience', label: 'Experience', type: 'select', options: ['Fresher', '1-3 years', '3-5 years', '5-10 years', '10+ years'], placeholder: 'Select experience', step: 'details' },
  ],
  'cleaning-services': [
    { key: 'cleaningTypes', label: 'Cleaning types', type: 'select', options: [...CLEANING_SERVICE_TYPES], placeholder: 'Select cleaning types', step: 'description' },
  ],
  sneakers: [
    { key: 'sneakerBrand', label: 'Brand', type: 'select', options: SNEAKER_BRANDS, placeholder: 'Select brand', step: 'description' },
    { key: 'sneakerAudience', label: 'Audience', type: 'select', options: ['Adults', 'Kids'], placeholder: 'Select audience', step: 'description' },
    { key: 'sneakerSize', label: 'Size', type: 'select', options: [], placeholder: 'Select size', step: 'description' },
  ],
  // Electronics: the subcategory dropdown in the Description step. The labels
  // are shared with the Post Enquiry form so both store the same string.
  electronics: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...ELECTRONICS_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Agriculture: same shared subcategory dropdown as Electronics.
  'agriculture-farming': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...AGRICULTURE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Antiques: same shared subcategory dropdown as Electronics and Agriculture.
  antiques: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...ANTIQUES_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Appliances: same shared subcategory dropdown as the other product categories.
  appliances: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...APPLIANCE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Art: same shared subcategory dropdown as the other product categories.
  art: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...ART_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Baby & Kids: same shared subcategory dropdown as the other product categories.
  'baby-kids': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...BABY_KIDS_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Bags & Luggage: same shared subcategory dropdown as the other product categories.
  'bags-luggage': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...BAGS_LUGGAGE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Beauty: same shared subcategory dropdown as the other product categories.
  'beauty-products': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...BEAUTY_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Bicycles: same shared subcategory dropdown as the other product categories.
  bicycles: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...BICYCLES_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Books: same shared subcategory dropdown as the other product categories.
  'books-publications': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...BOOKS_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Childcare: same shared subcategory dropdown as the other categories.
  'childcare-family': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...CHILDCARE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Collectibles: same shared subcategory dropdown as the other product categories.
  collectibles: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...COLLECTIBLES_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Construction: same shared subcategory dropdown as the other categories.
  'construction-renovation': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...CONSTRUCTION_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Education: same shared subcategory dropdown as the other categories.
  'education-training': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...EDUCATION_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Entertainment: same shared subcategory dropdown as the other categories.
  'entertainment-media': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...ENTERTAINMENT_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Events: same shared subcategory dropdown as the other categories.
  'events-entertainment': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...EVENTS_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Fashion: same shared subcategory dropdown as the other categories.
  fashion: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...FASHION_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Fitness & Gym: same shared subcategory dropdown as the other categories.
  'fitness-gym-equipment': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...FITNESS_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Food: same shared subcategory dropdown as the other categories.
  'food-beverage': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...FOOD_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Furniture: same shared subcategory dropdown as the other categories.
  furniture: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...FURNITURE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Gaming: same shared subcategory dropdown as the other categories.
  'gaming-recreation': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...GAMING_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Garden & Outdoor: same shared subcategory dropdown as the other categories.
  'garden-outdoor': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...GARDEN_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Government: same shared subcategory dropdown as the other categories.
  'government-public': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...GOVERNMENT_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Health: same shared subcategory dropdown as the other categories.
  'health-beauty': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...HEALTH_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Home: same shared subcategory dropdown as the other categories.
  home: [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...HOME_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Industrial: same shared subcategory dropdown as the other categories.
  'raw-materials-industrial': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...INDUSTRIAL_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Insurance: same shared subcategory dropdown as the other categories.
  'insurance-services': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...INSURANCE_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Jewellery: same shared subcategory dropdown as the other categories.
  'jewelry-accessories': [
    { key: 'subcategory', label: 'Subcategory', type: 'select', options: [...JEWELLERY_SUBCATEGORIES], placeholder: 'Select subcategory', step: 'description' },
  ],
  // Thrift: three linked dropdowns in the Description step. The Item options
  // depend on the picked gender, so CreateListing resolves them with
  // thriftItemsFor() instead of listing 140 strings here.
  thrift: [
    { key: 'thriftGender', label: 'Gender', type: 'select', options: THRIFT_GENDERS.map(g => g.value), placeholder: 'Select gender', step: 'description' },
    { key: 'thriftType', label: 'Type', type: 'select', options: [...THRIFT_TYPES], placeholder: 'Select type', step: 'description' },
    { key: 'thriftItem', label: 'Item', type: 'select', options: [], placeholder: 'Select item', step: 'description' },
    { key: 'thriftSize', label: 'Size', type: 'select', options: [], placeholder: 'Select size', step: 'description' },
  ],
};

export function fieldsForCategoryStep(category: string | undefined, step: CategoryDetailsStep): CategoryDetailField[] {
  if (!category) return [];
  return (CATEGORY_DETAILS[category] ?? []).filter((f) => f.step === step);
}

/**
 * Sneaker size options depend on the chosen audience (Adults / Kids).
 * Returns the size list for the current audience selection.
 */
export function sneakerSizeOptions(details: Record<string, string>): string[] {
  return details['sneakerAudience'] === 'Kids' ? SNEAKER_SIZES_KIDS : SNEAKER_SIZES_ADULTS;
}

/**
 * Hide the gender-preference field unless the chosen accommodation subtype is
 * a shared-living one (hostel, dormitory, PG, lodging, private room).
 * Used by CreateListing when rendering the dynamic category fields.
 */
export function isFieldHiddenForDetails(field: CategoryDetailField, details: Record<string, string>): boolean {
  if (field.key === 'genderPreference' && details['accommodationType']) {
    const match = ACCOMMODATION_SUBTYPES.find(s => s.label === details['accommodationType']);
    return !match || !GENDER_RELEVANT_ACCOMMODATION_TYPES.has(match.value);
  }
  // Thrift: Type appears only after a gender is picked, Item after a type.
  if (field.key === 'thriftType') return !details['thriftGender'];
  if (field.key === 'thriftItem') return !details['thriftType'];
  return false;
}

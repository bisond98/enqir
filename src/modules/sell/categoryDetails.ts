// Category-specific detail fields shown dynamically in the Create Listing form.
// Each field declares which step it belongs to ('title' | 'description' | 'details' | 'price')
// so inputs never overcrowd — they slot into the existing flow.
// Values are stored as a flat `details` map on the listing document.

import { CAR_BRANDS, BIKE_BRANDS } from './categoryBrands';
import { ACCOMMODATION_SUBTYPES, GENDER_RELEVANT_ACCOMMODATION_TYPES, REPAIR_SERVICE_TYPES } from '@/constants/categories';

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

const LAPTOP_BRANDS = [
  'Apple MacBook', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI',
  'Microsoft Surface', 'Samsung', 'Mi', 'Infinix', 'Alienware', 'Razer', 'Other',
];

const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

export const CATEGORY_DETAILS: CategoryDetailsConfig = {
  car: [
    { key: 'brand', label: 'Brand', type: 'select', options: CAR_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year', typeable: true, step: 'title' },
    { key: 'variant', label: 'Variant', type: 'text', placeholder: 'e.g., VXI, ZXI (O), LXI CNG', step: 'title' },
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], placeholder: 'Select transmission', step: 'description' },
    { key: 'fuel', label: 'Fuel type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], placeholder: 'Select fuel', step: 'description' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'Kilometers driven', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
    { key: 'accidentHistory', label: 'Accident history', type: 'select', options: ['No accidents', 'Minor accidents', 'Major accidents'], placeholder: 'Select accident history', step: 'details' },
    { key: 'registrationState', label: 'Registration state', type: 'select', options: REGISTRATION_STATES, placeholder: 'Registration state (e.g., KL, TN)', step: 'details' },
  ],
  vehicles: [
    { key: 'brand', label: 'Brand', type: 'select', options: CAR_BRANDS, placeholder: 'Select brand', step: 'title' },
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
  laptops: [
    { key: 'brand', label: 'Brand', type: 'select', options: LAPTOP_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'], placeholder: 'Select RAM', step: 'description' },
    { key: 'processor', label: 'Processor', type: 'select', options: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'], placeholder: 'Select processor', step: 'description' },
    { key: 'storage', label: 'Storage', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB'], placeholder: 'Select storage', step: 'details' },
  ],
  jobs: [
    { key: 'experience', label: 'Experience required', type: 'select', options: ['Fresher', '0-1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'], placeholder: 'Select experience', step: 'description' },
    { key: 'jobType', label: 'Job type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], placeholder: 'Select job type', step: 'description' },
    { key: 'workMode', label: 'Work mode', type: 'select', options: ['Work from office', 'Work from home', 'Hybrid'], placeholder: 'Select work mode', step: 'description' },
    { key: 'salaryPeriod', label: 'Salary period', type: 'select', options: ['Per month', 'Per year', 'Per hour', 'Per day'], placeholder: 'Select salary period', step: 'price' },
  ],
  accommodations: [
    { key: 'accommodationType', label: 'Stay type', type: 'select', options: ACCOMMODATION_SUBTYPES.map(s => s.label), placeholder: 'Select stay type', step: 'title' },
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
    { key: 'listingFor', label: 'Listed for', type: 'select', options: ['Sale', 'Rent', 'Lease'], placeholder: 'Select listing type', step: 'price' },
  ],
  service: [
    { key: 'repairType', label: 'Service type', type: 'select', options: [...REPAIR_SERVICE_TYPES], placeholder: 'Select service type', step: 'title' },
    { key: 'serviceMode', label: 'Service mode', type: 'select', options: ['At my location', 'Pick up & fix', 'Anywhere'], placeholder: 'Select service mode', step: 'description' },
    { key: 'experience', label: 'Experience', type: 'select', options: ['Fresher', '1-3 years', '3-5 years', '5-10 years', '10+ years'], placeholder: 'Select experience', step: 'details' },
  ],
};

export function fieldsForCategoryStep(category: string | undefined, step: CategoryDetailsStep): CategoryDetailField[] {
  if (!category) return [];
  return (CATEGORY_DETAILS[category] ?? []).filter((f) => f.step === step);
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
  return false;
}

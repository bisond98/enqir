// Category-specific detail fields shown dynamically in the Create Listing form.
// Each field declares which step it belongs to ('title' | 'description' | 'details' | 'price')
// so inputs never overcrowd — they slot into the existing flow.
// Values are stored as a flat `details` map on the listing document.

export type CategoryDetailsStep = 'title' | 'description' | 'details' | 'price';

export interface CategoryDetailField {
  key: string;
  label: string;
  placeholder?: string;
  type: 'select' | 'number';
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
  typeable?: boolean;
  step: CategoryDetailsStep;
}

export type CategoryDetailsConfig = Record<string, CategoryDetailField[]>;

const CAR_BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia',
  'Renault', 'Nissan', 'MG', 'Volkswagen', 'Skoda', 'Jeep', 'Citroën',
  'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Jaguar', 'Land Rover', 'Porsche',
  'Lexus', 'Isuzu', 'Force', 'Datsun', 'Fiat', 'Chevrolet', 'Ford',
  'Hindustan Motors', 'Opel', 'Rolls-Royce', 'Bentley', 'Ferrari', 'Lamborghini', 'Other',
];

const BIKE_BRANDS = [
  'Hero', 'Bajaj', 'TVS', 'Honda', 'Royal Enfield', 'Yamaha', 'Suzuki',
  'KTM', 'Mahindra', 'Jawa', 'Yezdi', 'Ather', 'Ola Electric', 'Revolt',
  'Harley-Davidson', 'Kawasaki', 'Ducati', 'Benelli', 'UM', 'Other',
];

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
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], placeholder: 'Select transmission', step: 'description' },
    { key: 'fuel', label: 'Fuel type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], placeholder: 'Select fuel', step: 'description' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'e.g., 45,000', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
  ],
  vehicles: [
    { key: 'brand', label: 'Brand', type: 'select', options: CAR_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year', typeable: true, step: 'title' },
    { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], placeholder: 'Select transmission', step: 'description' },
    { key: 'fuel', label: 'Fuel type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], placeholder: 'Select fuel', step: 'description' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'e.g., 45,000', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
  ],
  bike: [
    { key: 'brand', label: 'Brand', type: 'select', options: BIKE_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'year', label: 'Year of manufacture', type: 'select', options: YEARS, placeholder: 'Year', typeable: true, step: 'title' },
    { key: 'kmsDriven', label: 'Kilometers driven', type: 'number', placeholder: 'e.g., 12,000', suffix: 'km', min: 0, step: 'details' },
    { key: 'ownership', label: 'Ownership', type: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4+ owner'], placeholder: 'Select owner', step: 'details' },
  ],
  mobiles: [
    { key: 'brand', label: 'Brand', type: 'select', options: MOBILE_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'storage', label: 'Storage', type: 'select', options: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], placeholder: 'Select storage', step: 'description' },
    { key: 'warranty', label: 'Warranty', type: 'select', options: ['Expired', 'Under warranty'], placeholder: 'Select warranty', step: 'details' },
  ],
  laptops: [
    { key: 'brand', label: 'Brand', type: 'select', options: LAPTOP_BRANDS, placeholder: 'Select brand', step: 'title' },
    { key: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'], placeholder: 'Select RAM', step: 'description' },
    { key: 'processor', label: 'Processor', type: 'select', options: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4'], placeholder: 'Select processor', step: 'description' },
    { key: 'storage', label: 'Storage', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB'], placeholder: 'Select storage', step: 'details' },
  ],
  jobs: [
    { key: 'experience', label: 'Experience required', type: 'select', options: ['Fresher', '0-1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'], placeholder: 'Select experience', step: 'title' },
    { key: 'jobType', label: 'Job type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'], placeholder: 'Select job type', step: 'description' },
    { key: 'workMode', label: 'Work mode', type: 'select', options: ['Work from office', 'Work from home', 'Hybrid'], placeholder: 'Select work mode', step: 'details' },
    { key: 'salaryPeriod', label: 'Salary period', type: 'select', options: ['Per month', 'Per year', 'Per hour', 'Per day'], placeholder: 'Select salary period', step: 'price' },
  ],
  'real-estate': [
    { key: 'bhk', label: 'Configuration', type: 'select', options: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK', 'Plot', 'Commercial'], placeholder: 'Select configuration', step: 'title' },
    { key: 'carpetArea', label: 'Carpet area', type: 'number', placeholder: 'e.g., 1,200', suffix: 'sqft', min: 0, step: 'description' },
    { key: 'furnishing', label: 'Furnishing', type: 'select', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], placeholder: 'Select furnishing', step: 'details' },
    { key: 'facing', label: 'Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'], placeholder: 'Select facing', step: 'details' },
    { key: 'listingFor', label: 'Listed for', type: 'select', options: ['Sale', 'Rent', 'Lease'], placeholder: 'Select listing type', step: 'price' },
  ],
};

export function fieldsForCategoryStep(category: string | undefined, step: CategoryDetailsStep): CategoryDetailField[] {
  if (!category) return [];
  return (CATEGORY_DETAILS[category] ?? []).filter((f) => f.step === step);
}

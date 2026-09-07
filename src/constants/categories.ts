// Single source of truth for categories across the app.
// Both the Sell form (CreateListing) and the Post Enquiry form (PostEnquiry)
// use this exact list — same categories, same count, same order.
// Main categories (Business / Personal / Service) always sit on top,
// followed by the most-used product categories.

export interface AppCategory {
  value: string;
  label: string;
}

export const APP_CATEGORIES: AppCategory[] = [
  // Main categories (always on top)
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal' },
  { value: 'service', label: 'Service' },
  // Popular product categories
  { value: 'electronics', label: 'Electronics' },
  { value: 'mobiles', label: 'Mobiles' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'home', label: 'Home' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'automobile', label: 'Automobile' },
  // Everything else
  { value: 'agriculture-farming', label: 'Agriculture' },
  { value: 'antiques', label: 'Antiques' },
  { value: 'art', label: 'Art' },
  { value: 'baby-kids', label: 'Baby & Kids' },
  { value: 'bags-luggage', label: 'Bags & Luggage' },
  { value: 'books-publications', label: 'Books' },
  { value: 'beauty-products', label: 'Beauty' },
  { value: 'bicycles', label: 'Bicycles' },
  { value: 'childcare-family', label: 'Childcare' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'construction-renovation', label: 'Construction' },
  { value: 'education-training', label: 'Education' },
  { value: 'entertainment-media', label: 'Entertainment' },
  { value: 'events-entertainment', label: 'Events' },
  { value: 'food-beverage', label: 'Food' },
  { value: 'gaming-recreation', label: 'Gaming' },
  { value: 'government-public', label: 'Government' },
  { value: 'health-beauty', label: 'Health' },
  { value: 'insurance-services', label: 'Insurance' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'jewelry-accessories', label: 'Jewelry' },
  { value: 'legal-financial', label: 'Legal' },
  { value: 'marketing-advertising', label: 'Marketing' },
  { value: 'memorabilia', label: 'Memorabilia' },
  { value: 'musical-instruments', label: 'Musical Instruments' },
  { value: 'musical-accessories', label: 'Musical Accessories' },
  { value: 'musical-services', label: 'Musical Services' },
  { value: 'non-profit-charity', label: 'Non-Profit' },
  { value: 'office-supplies', label: 'Office Supplies' },
  { value: 'pets', label: 'Pets' },
  { value: 'photography-cameras', label: 'Photography & Cameras' },
  { value: 'fitness-gym-equipment', label: 'Fitness & Gym Equipment' },
  { value: 'garden-outdoor', label: 'Garden & Outdoor' },
  { value: 'kitchen-dining', label: 'Kitchen & Dining' },
  { value: 'raw-materials-industrial', label: 'Industrial' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'real-estate-services', label: 'Real Estate Services' },
  { value: 'renewable-energy', label: 'Renewable Energy' },
  { value: 'repair-services', label: 'Repair Services' },
  { value: 'cleaning-services', label: 'Cleaning Services' },
  { value: 'security-safety', label: 'Security' },
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'souvenir', label: 'Souvenir' },
  { value: 'sports-outdoor', label: 'Sports' },
  { value: 'thrift', label: 'Thrift' },
  { value: 'technology', label: 'Technology' },
  { value: 'tools-equipment', label: 'Tools & Equipment' },
  { value: 'transportation-logistics', label: 'Transportation' },
  { value: 'travel-tourism', label: 'Travel' },
  { value: 'tutoring-lessons', label: 'Tutoring & Lessons' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'waste-management', label: 'Waste Management' },
  { value: 'wedding-events', label: 'Wedding' },
  { value: 'medical-equipment', label: 'Medical Equipment' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'other', label: 'Other' },
];

// Legacy category values used by older posts in the database.
// Kept here so display/matching code can recognise them even though
// they no longer appear in the pickers.
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'electronics-gadgets': 'electronics',
  'fashion-apparel': 'fashion',
  'home-furniture': 'home',
  'services': 'service',
};

// Single source of truth for categories across the app.
// Both the Sell form (CreateListing) and the Post Enquiry form (PostEnquiry)
// use this exact list — same categories, same count, same order.
// Main categories (Business / Personal / Service) always sit on top,
// followed by the most-used product categories.

import { THRIFT_SEARCH_ITEMS } from './thriftClothing';

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
  { value: 'bike', label: 'Motorcycle' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'home', label: 'Home' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'vehicles', label: 'Vehicles' },
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
  { value: 'accommodations', label: 'Accommodations' },
  { value: 'wedding-events', label: 'Wedding' },
  { value: 'medical-equipment', label: 'Medical Equipment' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'other', label: 'Other' },
];

// Accommodation subtypes — shown as a dropdown when the Accommodations
// category is selected in the Post Enquiry or Sell form.
// Stored on the doc as details.accommodationType (the value string).
export interface AccommodationSubtype {
  value: string;
  label: string;
}

export const ACCOMMODATION_SUBTYPES: AccommodationSubtype[] = [
  { value: 'campsite', label: 'Campsite / Eco-stay' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'flat-apartment', label: 'Flat / Apartment' },
  { value: 'guest-house', label: 'Guest House' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'house', label: 'House' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'motel', label: 'Motel' },
  { value: 'pg', label: 'PG (Paying Guest)' },
  { value: 'private-room', label: 'Private Room' },
  { value: 'resort', label: 'Resort' },
  { value: 'service-apartment', label: 'Service Apartment' },
  { value: 'villa', label: 'Villa' },
];

// Shared-living subtypes where a gender preference is relevant — these get
// the gender selector (any / male / female / mixed) in the forms.
export const GENDER_RELEVANT_ACCOMMODATION_TYPES = new Set([
  'hostel',
  'dormitory',
  'pg',
  'lodging',
  'private-room',
]);

export const ACCOMMODATION_GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male only' },
  { value: 'female', label: 'Female only' },
  { value: 'mixed', label: 'Mixed' },
] as const;

// Repair / home-service types — shared by the Post Enquiry dropdown and the
// Sell form's repair-services detail fields so both stay in sync.
export const REPAIR_SERVICE_TYPES = [
  'AC repair & service',
  'Bike / scooter service',
  'Borewell drilling & repair',
  'Car detailing & wash',
  'Carpenter',
  'CCTV installation',
  'Chimney / hob repair',
  'Denting & painting (vehicle)',
  'Electrician',
  'EV charger installation',
  'False ceiling & gypsum work',
  'Fridge / Refrigerator repair',
  'Furniture assembly',
  'Geyser / water heater repair',
  'Home salon (beauty at home)',
  'Interior design & modular kitchen',
  'Inverter / battery service',
  'Laptop / Computer repair',
  'Laundry & ironing',
  'Locksmith',
  'Mechanic (vehicle)',
  'Mehndi artist',
  'Microwave / oven repair',
  'Mobile repair',
  'Movers & packers (local shifting)',
  'Painting',
  'Pest control',
  'Photography / videography',
  'Plastering & masonry',
  'Plumber',
  'Septic / sewage tank cleaning',
  'Solar panel installation & service',
  'Tailoring & stitching',
  'Tile & marble work',
  'TV repair',
  'Tyre repair & replacement',
  'Washing machine repair',
  'Water purifier (RO) service',
  'Water tank / well cleaning',
  'Welding & fabrication',
  'Woodwork / furniture making',
  'Other',
] as const;

// Cleaning types offered as the subtype dropdown when Cleaning Services is
// the chosen category (Post Enquiry + Sell form). Stored on the document as
// `cleaningTypes` — a comma-joined label string, exactly like repairType.
export const CLEANING_SERVICE_TYPES: string[] = [
  // Homes & interiors
  'House & deep cleaning',
  'Kitchen cleaning',
  'Bathroom & toilet cleaning',
  'Sofa shampooing & cleaning',
  'Carpet & rug cleaning',
  'Mattress cleaning',
  'Curtain & blinds cleaning',
  'Glass & window cleaning',
  'Floor scrubbing & polishing',
  'Wall & facade cleaning',
  'Chimney & exhaust cleaning',
  // Tanks & drains
  'Water tank cleaning (overhead & underground)',
  'Septic tank cleaning',
  'Drain & pipeline cleaning',
  'Terrace / roof cleaning',
  // Commercial & other
  'Office & commercial space cleaning',
  'Construction & post-renovation cleaning',
  'Sanitization & disinfection',
  'Housekeeping & maid service',
];

// Electronics subcategory — the dropdown shown in the Description step of both
// the Post Enquiry and Sell forms when Electronics is the chosen category.
// Stored on the document as details.subcategory (the label string).
export const ELECTRONICS_SUBCATEGORIES: string[] = [
  'Audio & Headphones',
  'Automotive Electronic Components',
  'Aerospace & Aviation Electronics',
  'Batteries & Battery Technology',
  'Broadcasting & Radio Equipment',
  'Cameras & Photography',
  'Car Electronics',
  'Computer Components',
  'Computers & Laptops',
  'Drones & Robotics',
  'Electronic Accessories',
  'Electronic Components & DIY',
  'Electronic Learning & Educational Kits',
  'Electronic Manufacturing Equipment',
  'Electronic Test & Measurement Equipment',
  'Gaming & Consoles',
  'Industrial Electronics & Automation',
  'Marine & Navigation Electronics',
  'Medical Electronics & Equipment',
  'Mobiles & Smartphones',
  'Monitors & Displays',
  'Musical Instruments & Electronic Equipment',
  'Navigation & GPS Equipment',
  'Networking & Connectivity',
  'Other Electronics & Specialized Equipment',
  'Power & Backup Electronics',
  'Printers & Office Electronics',
  'Renewable Energy Electronics',
  'Scientific & Laboratory Electronics',
  'Security & Surveillance',
  'Semiconductor & Chip Equipment',
  'Smart Home & Automation',
  'Smartwatches & Wearables',
  'Speakers & Sound Systems',
  'Storage & Memory',
  'Telecommunication Infrastructure Equipment',
  'Telephones & Communication',
  'TVs & Home Entertainment',
  'Vending Machines & Automated Equipment',
];

// Agriculture subcategory — the dropdown shown in the Description step of both
// forms when Agriculture is the chosen category. Stored as details.subcategory.
export const AGRICULTURE_SUBCATEGORIES: string[] = [
  'Agricultural Chemicals & Crop Protection',
  'Agricultural Consultancy & Services',
  'Agricultural Equipment & Tools',
  'Agricultural Infrastructure & Structures',
  'Agricultural Machinery & Tractors',
  'Agricultural Technology & Automation',
  'Animal Feed & Nutrition',
  'Aquaculture & Fish Farming',
  'Beekeeping & Apiculture',
  'Dairy Farming & Equipment',
  'Farm Buildings & Storage',
  'Farm Vehicles & Transport',
  'Farming Supplies & Consumables',
  'Fertilizers & Soil Nutrients',
  'Floriculture & Flower Farming',
  'Forestry & Timber Farming',
  'Fruits & Fruit Farming',
  'Gardening & Horticulture',
  'Greenhouses & Hydroponics',
  'Irrigation & Water Management',
  'Livestock & Animal Farming',
  'Organic & Natural Farming',
  'Poultry Farming & Equipment',
  'Seeds, Bulbs & Saplings',
  'Soil Testing & Agricultural Laboratories',
  'Spices & Plantation Crops',
  'Sustainable & Precision Agriculture',
  'Veterinary Products & Equipment',
  'Waste Management & Composting',
  'Water Pumps & Agricultural Motors',
  'Weeding, Harvesting & Post-Harvest Equipment',
  'Other Agriculture & Specialized Equipment',
];

// Antiques subcategory — the dropdown shown in the Description step of both
// forms when Antiques is the chosen category. Stored as details.subcategory.
export const ANTIQUES_SUBCATEGORIES: string[] = [
  'Antique Arms & Armour',
  'Antique Books & Manuscripts',
  'Antique Clocks & Watches',
  'Antique Coins & Currency',
  'Antique Furniture',
  'Antique Maps & Globes',
  'Antique Musical Instruments',
  'Antique Photographs & Cameras',
  'Antique Scientific Instruments',
  'Antique Silverware & Metalware',
  'Antique Textiles & Fabrics',
  'Antique Toys & Games',
  'Architectural Salvage & Collectibles',
  'Art & Sculptures',
  'Ceramics, Pottery & Porcelain',
  'Colonial & Historical Collectibles',
  'Ethnic & Tribal Artefacts',
  'Glassware & Crystal',
  'Historical Memorabilia',
  'Jewellery & Gemstones',
  'Maritime & Nautical Antiques',
  'Military & War Memorabilia',
  'Religious & Spiritual Artefacts',
  'Rugs, Carpets & Tapestries',
  'Home Décor',
  'Lighting & Lamps',
  'Tools & Industrial Collectibles',
  'Other Antiques & Rare Collectibles',
];

// Appliances subcategory — the dropdown shown in the Description step of both
// forms when Appliances is the chosen category. Stored as details.subcategory.
export const APPLIANCE_SUBCATEGORIES: string[] = [
  'Air Conditioners',
  'Air Coolers',
  'Air Purifiers & Humidifiers',
  'Baking & Cooking Appliances',
  'Blenders, Mixers & Grinders',
  'Cleaning Appliances',
  'Coffee & Tea Makers',
  'Dishwashers',
  'Fans & Ventilation',
  'Food Processors & Choppers',
  'Freezers & Deep Freezers',
  'Heaters & Geysers',
  'Irons & Garment Care',
  'Kitchen Appliances',
  'Microwaves & Ovens',
  'Refrigerators',
  'Rice Cookers & Electric Cookers',
  'Small Kitchen Appliances',
  'Televisions & Entertainment Appliances',
  'Vacuum Cleaners',
  'Washing Machines & Dryers',
  'Water Dispensers & Purifiers',
  'Water Heaters',
  'Other Appliances & Specialized Equipment',
];

// Art subcategory — the dropdown shown in the Description step of both forms
// when Art is the chosen category. Stored as details.subcategory.
export const ART_SUBCATEGORIES: string[] = [
  'Abstract Art',
  'Acrylic Paintings',
  'Architectural Art',
  'Art Collectibles & Memorabilia',
  'Calligraphy & Lettering',
  'Canvas Paintings',
  'Ceramic & Pottery Art',
  'Contemporary Art',
  'Digital Art',
  'Drawings & Illustrations',
  'Folk & Traditional Art',
  'Glass Art',
  'Graffiti & Street Art',
  'Installation Art',
  'Mixed Media Art',
  'Murals & Wall Art',
  'Oil Paintings',
  'Photography Art',
  'Prints & Posters',
  'Religious & Spiritual Art',
  'Sculptures & Statues',
  'Textile & Fabric Art',
  'Tribal & Indigenous Art',
  'Watercolour Paintings',
  'Wood & Metal Art',
  'Other Art & Specialized Creations',
];

// Baby & Kids subcategory — the dropdown shown in the Description step of both
// forms when Baby & Kids is the chosen category. Stored as details.subcategory.
export const BABY_KIDS_SUBCATEGORIES: string[] = [
  'Baby Bathing & Skincare',
  'Baby Carriers & Slings',
  'Baby Clothing & Accessories',
  'Baby Feeding & Nursing',
  'Baby Furniture',
  'Baby Health & Safety',
  'Baby Monitors & Electronics',
  'Baby Toys & Play Equipment',
  'Bouncers, Rockers & Swings',
  'Car Seats & Travel Systems',
  'Diapers & Changing Supplies',
  'Educational Toys & Learning Materials',
  "Kids' Clothing & Accessories",
  "Kids' Furniture & Room Décor",
  "Kids' Footwear",
  "Kids' Outdoor & Sports Equipment",
  "Kids' School Supplies & Stationery",
  "Kids' Toys, Games & Puzzles",
  'Maternity & Pregnancy Products',
  'Nursery Bedding & Accessories',
  'Potty Training & Toileting',
  'Prams, Strollers & Pushchairs',
  "Ride-On Toys & Kids' Vehicles",
  'Safety Gates & Childproofing',
  'Special Needs & Adaptive Products',
  'Other Baby & Kids Products',
];

// Bags & Luggage subcategory — the dropdown shown in the Description step of
// both forms when Bags & Luggage is the chosen category.
export const BAGS_LUGGAGE_SUBCATEGORIES: string[] = [
  'Backpacks',
  'Briefcases & Laptop Bags',
  'Camera & Equipment Bags',
  'Clutches & Evening Bags',
  'Crossbody Bags',
  'Duffel & Gym Bags',
  'Handbags & Purses',
  'Hiking & Trekking Backpacks',
  "Kids' Bags",
  'Luggage Sets',
  'Messenger Bags',
  'School Bags',
  'Shoulder Bags',
  'Suitcases & Trolley Bags',
  'Travel Accessories',
  'Travel Backpacks',
  'Tote Bags',
  'Wallets & Card Holders',
  'Waist Bags & Belt Bags',
  'Work & Business Bags',
  'Waterproof & Dry Bags',
  'Weekender Bags',
  'Other Bags & Specialized Luggage',
];

// Beauty subcategory — the dropdown shown in the Description step of both forms
// when Beauty is the chosen category. Stored as details.subcategory.
export const BEAUTY_SUBCATEGORIES: string[] = [
  'Bath & Body Care',
  'Beauty Appliances & Electrical Tools',
  'Beauty Accessories & Tools',
  'Body Fragrances & Perfumes',
  'Cosmetics & Makeup',
  'Eyebrow & Eyelash Products',
  'Facial Skincare',
  'Hair Care & Styling',
  'Hair Extensions & Wigs',
  'Hair Removal & Shaving',
  'Manicure & Pedicure',
  "Men's Grooming",
  'Nail Care & Nail Art',
  'Oral Care & Hygiene',
  'Personal Care Products',
  'Salon & Professional Beauty Equipment',
  'Skin Treatments & Serums',
  'Spa & Massage Products',
  'Sun Care & Tanning',
  'Beauty Gift Sets & Kits',
  'Other Beauty & Personal Care Products',
];

// Bicycles subcategory — the dropdown shown in the Description step of both
// forms when Bicycles is the chosen category. Stored as details.subcategory.
export const BICYCLES_SUBCATEGORIES: string[] = [
  'BMX Bicycles',
  'Cargo Bicycles',
  "Children's Bicycles",
  'Cruiser Bicycles',
  'Electric Bicycles (E-Bikes)',
  'Folding Bicycles',
  'Hybrid Bicycles',
  'Mountain Bicycles (MTB)',
  'Road Bicycles',
  'Single-Speed & Fixed-Gear Bicycles',
  'Tandem Bicycles',
  'Touring Bicycles',
  'Track & Racing Bicycles',
  'Tricycles',
  'Adaptive & Special Needs Bicycles',
  'Bicycle Frames & Framesets',
  'Bicycle Parts & Components',
  'Bicycle Accessories & Safety Gear',
  'Bicycle Storage & Carriers',
  'Bicycle Repair & Maintenance Equipment',
  'Other Bicycles & Specialized Cycling Equipment',
];

// Books subcategory — the dropdown shown in the Description step of both forms
// when Books is the chosen category. Stored as details.subcategory.
export const BOOKS_SUBCATEGORIES: string[] = [
  'Academic & Educational Books',
  'Art, Design & Photography Books',
  'Biographies & Autobiographies',
  'Business & Economics',
  "Children's Books",
  'Comics, Manga & Graphic Novels',
  'Cookbooks, Food & Nutrition',
  'Crime, Mystery & Thriller',
  'Dictionaries & Reference Books',
  'Engineering & Technology',
  'Fiction & Literature',
  'Health, Fitness & Wellness',
  'History & Politics',
  'Hobby, Crafts & DIY',
  'Language & Linguistics',
  'Law & Legal Studies',
  'Lifestyle & Self-Help',
  'Mathematics & Statistics',
  'Medical & Healthcare Books',
  'Philosophy & Psychology',
  'Poetry & Drama',
  'Religion & Spirituality',
  'Romance',
  'Science & Nature',
  'Science Fiction & Fantasy',
  'School & College Textbooks',
  'Social Sciences & Sociology',
  'Sports & Recreation',
  'Travel & Geography',
  'Young Adult (YA) Books',
  'Magazines, Journals & Periodicals',
  'Rare, Antique & Collectible Books',
  'Other Books & Specialized Publications',
];

// Childcare subcategory — the dropdown shown in the Description step of both
// forms when Childcare is the chosen category. Stored as details.subcategory.
export const CHILDCARE_SUBCATEGORIES: string[] = [
  'Babysitting Services',
  'Child Development & Early Learning',
  'Child Safety & Protection',
  'Childcare Centres & Daycare',
  "Children's Health & Wellness Services",
  "Children's Special Needs Care",
  'Educational & Learning Support',
  'Infant Care Services',
  'Kindergarten & Preschool Services',
  'Nanny & Au Pair Services',
  'Newborn Care Services',
  'Parenting Support & Guidance',
  'Playgroups & Activity Centres',
  'School Transportation & Pick-up Services',
  'Sleep Training & Sleep Support',
  'Tutoring & Academic Assistance',
  'Other Childcare Services',
];

// Collectibles subcategory — the dropdown shown in the Description step of both
// forms when Collectibles is the chosen category. Stored as details.subcategory.
export const COLLECTIBLES_SUBCATEGORIES: string[] = [
  'Action Figures & Figurines',
  'Anime & Manga Collectibles',
  'Autographs & Signed Memorabilia',
  'Banknotes & Paper Currency',
  'Coins & Medals',
  'Comic Books & Collectible Comics',
  'Die-Cast Models & Miniatures',
  'Dolls & Dollhouses',
  'Entertainment & Movie Memorabilia',
  'Historical Memorabilia',
  'LEGO & Building Sets',
  'Limited Edition & Special Releases',
  'Model Cars, Bikes & Aircraft',
  'Music Memorabilia',
  'Pins, Badges & Patches',
  'Postcards & Greeting Cards',
  'Rare Books & Manuscripts',
  'Sports Cards & Memorabilia',
  'Stamps & Philately',
  'Trading Cards & Card Games',
  'Vintage Advertising & Promotional Items',
  'Vintage Toys & Games',
  'Video Game Collectibles',
  'Comic & Pop Culture Merchandise',
  'Fossils, Minerals & Gemstones',
  'Militaria & War Collectibles',
  'Retro Technology & Gadgets',
  'Toy Trains & Railway Collectibles',
  'Breweriana & Bottle Collectibles',
  'Other Collectibles & Rare Finds',
];

// Construction subcategory — the dropdown shown in the Description step of both
// forms when Construction is the chosen category. Stored as details.subcategory.
export const CONSTRUCTION_SUBCATEGORIES: string[] = [
  'Apartments & Flats',
  'Residential Houses & Villas',
  'Residential Plots & Land',
  'Commercial Buildings & Spaces',
  'Shops & Retail Spaces',
  'Office Spaces & Workspaces',
  'Co-working & Shared Spaces',
  'Industrial Buildings & Factories',
  'Warehouses & Godowns',
  'Hotels, Resorts & Hospitality Properties',
  'Agricultural Buildings & Farmhouses',
  'Institutional & Educational Buildings',
  'Hospitals & Healthcare Buildings',
  'Religious & Community Buildings',
  'Parking Spaces & Garages',
  'New Construction Projects',
  'Real Estate Development',
  'Land Development & Plot Development',
  'Building Renovation & Remodeling',
  'Interior Design & Fit-Out',
  'Modular & Prefabricated Construction',
  'Smart Buildings & Home Automation',
  'Green & Sustainable Construction',
  'Infrastructure & Civil Engineering',
  'Building Materials & Supplies',
  'Cement, Concrete & Aggregates',
  'Bricks, Blocks & Stone',
  'Steel, Metal & Fabrication',
  'Timber & Wood Materials',
  'Roofing & Waterproofing Materials',
  'Flooring, Tiles & Wall Finishes',
  'Doors, Windows & Glass',
  'Plumbing & Sanitary Supplies',
  'Electrical Materials & Supplies',
  'Paints, Coatings & Construction Chemicals',
  'Hardware & Building Fittings',
  'Construction Machinery & Heavy Equipment',
  'Earthmoving & Excavation Equipment',
  'Cranes & Lifting Equipment',
  'Concrete & Road Construction Machinery',
  'Scaffolding, Shuttering & Formwork',
  'Construction Tools & Power Tools',
  'Surveying & Measuring Equipment',
  '3D Printing & Robotic Construction',
  'Construction Safety Equipment',
  'Architects & Architectural Services',
  'Civil & Structural Engineering',
  'Interior Designers & Consultants',
  'Building Contractors & Construction Companies',
  'Construction Project Management',
  'Electrical & Plumbing Contractors',
  'Carpentry, Masonry & Fabrication Services',
  'Painting, Flooring & Finishing Services',
  'HVAC & Fire Safety Services',
  'Solar & Renewable Energy Installation',
  'Land Surveying & Soil Testing',
  'Demolition & Site Clearance',
  'Construction Labour & Workforce',
  'Construction Equipment Rental & Leasing',
  'Building Maintenance & Facility Management',
  'Other Construction & Specialized Services',
];

// Education subcategory — the dropdown shown in the Description step of both
// forms when Education is the chosen category. Stored as details.subcategory.
export const EDUCATION_SUBCATEGORIES: string[] = [
  'Online Learning & E-Learning',
  'EdTech & Educational Technology',
  'AI & Emerging Technology Education',
  'Coding, Programming & Software Development',
  'Data Science & Artificial Intelligence',
  'Digital Marketing & Business Skills',
  'Entrepreneurship & Startup Education',
  'Design, Animation & Multimedia',
  'Gaming & Game Development',
  'Robotics & STEM Education',
  'Language Learning & Communication',
  'Professional & Career Development',
  'Competitive Exam Preparation',
  'Government Exam Coaching',
  'Entrance Exam Coaching',
  'School Education',
  'Preschool & Early Childhood Education',
  'Primary & Secondary Education',
  'Higher Secondary Education',
  'Undergraduate & Degree Programs',
  "Postgraduate & Master's Programs",
  'Doctoral & Research Programs',
  'Engineering & Technical Education',
  'Medical & Healthcare Education',
  'Commerce, Finance & Accounting Education',
  'Law & Legal Education',
  'Management & Business Administration',
  'Science & Mathematics Education',
  'Arts, Humanities & Social Sciences',
  'Vocational & Skill Development',
  'Industrial & Technical Training',
  'ITI & Polytechnic Education',
  'Diploma & Certificate Courses',
  'Distance & Open Education',
  'Special Education & Inclusive Learning',
  'Music, Dance & Performing Arts Education',
  'Fine Arts & Creative Education',
  'Sports & Physical Education',
  'Driving & Vehicle Training',
  'Aviation & Maritime Education',
  'Agriculture & Veterinary Education',
  'Environmental & Sustainability Education',
  'Religious & Spiritual Education',
  'Study Abroad & International Education',
  'Educational Institutions & Schools',
  'Colleges & Universities',
  'Coaching Centres & Training Institutes',
  'Libraries & Learning Resources',
  'Educational Books & Study Materials',
  'Educational Equipment & Supplies',
  'Tutoring & Private Teaching',
  'Other Education & Specialized Learning',
];

// Entertainment subcategory — the dropdown shown in the Description step of both
// forms when Entertainment is the chosen category. Stored as details.subcategory.
export const ENTERTAINMENT_SUBCATEGORIES: string[] = [
  'Online Entertainment & Streaming',
  'Gaming & Esports',
  'Digital Content Creation',
  'Influencer & Creator Services',
  'Social Media Entertainment',
  'Virtual Reality & Augmented Reality Entertainment',
  'Animation & VFX',
  'Films & Cinema',
  'Web Series & Television',
  'Music & Music Production',
  'Live Music & Concerts',
  'DJ & Electronic Music',
  'Dance & Choreography',
  'Theatre & Performing Arts',
  'Comedy & Stand-up',
  'Podcasts & Audio Entertainment',
  'Photography & Videography',
  'Celebrity & Artist Management',
  'Talent & Artist Booking',
  'Event Entertainment & Production',
  'Festivals & Cultural Events',
  'Fairs, Exhibitions & Shows',
  'Nightlife & Club Entertainment',
  'Karaoke & Music Lounges',
  'Amusement & Theme Parks',
  'Adventure & Recreational Entertainment',
  'Indoor Games & Entertainment Centres',
  'Outdoor Games & Recreational Activities',
  'Board Games & Tabletop Entertainment',
  'Toys, Hobbies & Recreational Entertainment',
  'Magic Shows & Illusionists',
  'Circus & Special Performances',
  'Celebrity Meetups & Fan Experiences',
  'Wedding & Private Event Entertainment',
  'Traditional & Folk Entertainment',
  'Cultural & Heritage Performances',
  'Radio & Broadcasting',
  'Entertainment Equipment & Rentals',
  'Other Entertainment & Specialized Activities',
];

// Events subcategory — the dropdown shown in the Description step of both forms
// when Events is the chosen category. Stored as details.subcategory.
export const EVENTS_SUBCATEGORIES: string[] = [
  'AI, Technology & Startup Events',
  'Gaming & Esports Events',
  'Music Festivals & Concerts',
  'Film Festivals & Screenings',
  'Art & Creative Exhibitions',
  'Fashion Shows & Fashion Events',
  'Influencer & Creator Meetups',
  'Comic-Con, Anime & Pop Culture Events',
  'Sports Events & Tournaments',
  'Adventure & Outdoor Events',
  'Business & Networking Events',
  'Startup & Entrepreneurship Events',
  'Corporate Events & Conferences',
  'Trade Shows & Expos',
  'Industry & Professional Exhibitions',
  'Educational Events & Workshops',
  'Career Fairs & Job Events',
  'Science & Innovation Exhibitions',
  'Cultural & Heritage Events',
  'Religious & Spiritual Events',
  'Traditional & Folk Festivals',
  'Food & Culinary Festivals',
  'Wine & Beverage Events',
  'Book Fairs & Literary Events',
  'Theatre & Performing Arts',
  'Comedy & Stand-up Shows',
  'Dance & Cultural Performances',
  'Weddings & Engagements',
  'Birthday & Private Parties',
  "Family & Kids' Events",
  'College & Campus Events',
  'Community & Social Gatherings',
  'Charity & Fundraising Events',
  'Political & Public Events',
  'Award Shows & Ceremonies',
  'Fashion, Beauty & Lifestyle Expos',
  'Automobile & Motorcycle Events',
  'Real Estate & Property Exhibitions',
  'Agriculture & Rural Events',
  'Government & Public Awareness Events',
  'Virtual & Hybrid Events',
  'Other Events & Specialized Gatherings',
];

// Fashion subcategory — the dropdown shown in the Description step of both forms
// when Fashion is the chosen category. Stored as details.subcategory.
export const FASHION_SUBCATEGORIES: string[] = [
  'Streetwear & Urban Fashion',
  'Sneakers & Fashion Footwear',
  'Luxury & Designer Fashion',
  'Sustainable & Ethical Fashion',
  'Fast Fashion',
  "Men's Clothing",
  "Women's Clothing",
  'Unisex Clothing',
  "Kids' & Baby Clothing",
  'Ethnic & Traditional Wear',
  'Western Wear',
  'Indo-Western Fashion',
  'Sportswear & Activewear',
  'Athleisure',
  'Casual Wear',
  'Formal & Business Wear',
  'Party & Occasion Wear',
  'Wedding & Bridal Wear',
  'Maternity Wear',
  'Innerwear & Lingerie',
  'Sleepwear & Loungewear',
  'Winterwear & Outerwear',
  'Plus-Size Fashion',
  'Modest Fashion',
  'Vintage & Retro Fashion',
  'Thrift & Pre-Owned Fashion',
  'Bags & Fashion Accessories',
  'Watches & Wearable Accessories',
  'Jewellery & Fashion Jewellery',
  'Eyewear & Sunglasses',
  'Belts, Hats & Headwear',
  'Fashion Fabrics & Textiles',
  'Tailoring & Custom-Made Clothing',
  'Fashion Design & Styling Services',
  'Fashion Modelling & Talent',
  'Fashion Technology & Wearables',
  'Costume & Performance Wear',
  'Uniforms & Workwear',
  'Fashion Manufacturing & Wholesale',
  'Other Fashion & Specialized Apparel',
];

// Fitness & Gym subcategory — the dropdown shown in the Description step of both
// forms when Fitness & Gym Equipment is the chosen category.
export const FITNESS_SUBCATEGORIES: string[] = [
  'Fitness Trackers & Smart Fitness Devices',
  'Home Fitness & Workout Equipment',
  'Commercial Gym Equipment',
  'Strength Training Equipment',
  'Weightlifting & Powerlifting Equipment',
  'Cardio & Aerobic Equipment',
  'Treadmills & Walking Pads',
  'Exercise Bikes & Spin Bikes',
  'Cross Trainers & Ellipticals',
  'Rowing & Ski Training Machines',
  'Functional Training & CrossFit Equipment',
  'Dumbbells, Barbells & Weight Plates',
  'Gym Benches, Racks & Smith Machines',
  'Cable Machines & Multi-Gyms',
  'Resistance Bands & Suspension Trainers',
  'Yoga & Pilates Equipment',
  'Meditation & Recovery Equipment',
  'Boxing & Martial Arts Equipment',
  'Sports Training & Conditioning Equipment',
  'Gym Flooring & Infrastructure',
  'Gym Accessories & Workout Gear',
  'Fitness Clothing & Activewear',
  'Sports Nutrition & Fitness Supplements',
  'Weight Management & Bodybuilding Equipment',
  'Physiotherapy & Rehabilitation Equipment',
  'Outdoor Fitness & Calisthenics Equipment',
  'Gym Setup, Installation & Maintenance',
  'Gym Equipment Rental & Leasing',
  'Personal Training & Fitness Coaching',
  'Group Fitness & Workout Classes',
  'Yoga, Pilates & Meditation Services',
  'Dance Fitness & Aerobics',
  'CrossFit & Functional Fitness Training',
  'Strength & Conditioning Coaching',
  'Sports Performance & Athletic Training',
  'Fitness Centres & Gym Memberships',
  "Women's Fitness & Training",
  'Senior Fitness & Mobility Training',
  'Other Fitness & Gym Equipment / Services',
];

// Food subcategory — the dropdown shown in the Description step of both forms
// when Food is the chosen category. Stored as details.subcategory.
export const FOOD_SUBCATEGORIES: string[] = [
  'Organic & Natural Foods',
  'Plant-Based & Vegan Foods',
  'Health Foods & Superfoods',
  'Protein & High-Protein Foods',
  'Ready-to-Eat & Instant Foods',
  'Packaged & Processed Foods',
  'Frozen & Refrigerated Foods',
  'Fresh Fruits',
  'Fresh Vegetables',
  'Meat & Poultry',
  'Fish & Seafood',
  'Eggs & Dairy Products',
  'Rice, Grains & Cereals',
  'Pulses, Lentils & Beans',
  'Flour, Atta & Baking Ingredients',
  'Spices & Masalas',
  'Oils, Ghee & Cooking Fats',
  'Nuts, Seeds & Dry Fruits',
  'Snacks & Savouries',
  'Sweets, Chocolates & Confectionery',
  'Bakery & Bread Products',
  'Cakes & Desserts',
  'Pickles, Chutneys & Sauces',
  'Traditional & Regional Indian Foods',
  'Kerala & South Indian Specialities',
  'North Indian & Regional Specialities',
  'International & Imported Foods',
  'Baby & Infant Foods',
  'Dietary & Special-Requirement Foods',
  'Gluten-Free & Allergy-Friendly Foods',
  'Gourmet & Premium Foods',
  'Food Ingredients & Bulk Supplies',
  'Catering & Institutional Food Supplies',
  'Restaurant & Hotel Food Supplies',
  'Farm-Fresh & Direct-From-Farmer Produce',
  'Food Hampers & Gift Boxes',
  'Other Food Products & Specialized Supplies',
];

// Furniture subcategory — the dropdown shown in the Description step of both
// forms when Furniture is the chosen category. Stored as details.subcategory.
export const FURNITURE_SUBCATEGORIES: string[] = [
  'Smart Furniture & Tech-Integrated Furniture',
  'Modular Furniture',
  'Space-Saving & Multifunctional Furniture',
  'Home Furniture',
  'Living Room Furniture',
  'Bedroom Furniture',
  'Dining Room Furniture',
  'Kitchen Furniture & Cabinets',
  'Office & Work-from-Home Furniture',
  'Study & Educational Furniture',
  'Gaming Furniture',
  'Outdoor & Garden Furniture',
  'Balcony & Patio Furniture',
  'Commercial & Retail Furniture',
  'Hotel & Hospitality Furniture',
  'Restaurant & Café Furniture',
  'Industrial & Warehouse Furniture',
  'School & Institutional Furniture',
  'Hospital & Healthcare Furniture',
  "Baby & Kids' Furniture",
  'Wardrobes & Storage Furniture',
  'Beds, Mattresses & Bed Frames',
  'Sofas, Recliners & Seating',
  'Tables & Desks',
  'Chairs & Stools',
  'Shelving, Racks & Bookcases',
  'Shoe Racks & Organisers',
  'Bathroom Furniture',
  'Prayer Room & Pooja Furniture',
  'Traditional Indian Furniture',
  'Antique & Vintage Furniture',
  'Custom-Made & Bespoke Furniture',
  'Furniture Components & Hardware',
  'Furniture Materials & Supplies',
  'Furniture Restoration & Repair',
  'Furniture Rental & Leasing',
  'Other Furniture & Specialized Furnishings',
];

// Gaming subcategory — the dropdown shown in the Description step of both forms
// when Gaming is the chosen category. Stored as details.subcategory.
export const GAMING_SUBCATEGORIES: string[] = [
  'PC Gaming',
  'Console Gaming',
  'Mobile Gaming',
  'Cloud Gaming',
  'VR & AR Gaming',
  'Handheld Gaming Devices',
  'Gaming Laptops & PCs',
  'Gaming Consoles',
  'Gaming Monitors & Displays',
  'Gaming Accessories & Peripherals',
  'Gaming Controllers & Gamepads',
  'Gaming Keyboards & Mice',
  'Gaming Headsets & Audio',
  'Gaming Chairs & Desks',
  'Gaming Components & Hardware',
  'Gaming Storage & Networking',
  'Gaming Cameras & Streaming Equipment',
  'Gaming Software & Digital Games',
  'Physical Video Games & Game Discs',
  'In-Game Items & Virtual Goods',
  'Esports & Competitive Gaming',
  'Game Development & Design',
  'Game Testing & Quality Assurance',
  'Gaming Content Creation & Streaming',
  'Gaming Tournaments & Events',
  'Gaming Coaching & Training',
  'Board Games & Strategy Games',
  'Card Games & Trading Card Games',
  'Tabletop & Role-Playing Games',
  'Arcade Games & Machines',
  'Retro & Classic Gaming',
  'Gaming Merchandise & Collectibles',
  'Gaming Lounges & Centres',
  'Gaming Cafés & Esports Arenas',
  'Game Rental & Equipment Leasing',
  'Other Gaming & Specialized Equipment',
];

// Garden & Outdoor subcategory — the dropdown shown in the Description step of
// both forms when Garden & Outdoor is the chosen category.
export const GARDEN_SUBCATEGORIES: string[] = [
  'Smart Gardening & Automated Irrigation',
  'Vertical Gardening & Terrace Gardening',
  'Balcony & Indoor Gardening',
  'Home Gardening Supplies',
  'Garden Plants, Seeds & Saplings',
  'Pots, Planters & Garden Containers',
  'Soil, Compost & Growing Media',
  'Fertilizers & Plant Nutrition',
  'Gardening Tools & Equipment',
  'Lawn Care & Landscaping Equipment',
  'Irrigation & Watering Systems',
  'Hydroponics & Aquaponics',
  'Organic Gardening & Farming',
  'Greenhouses & Shade Nets',
  'Garden Décor & Ornaments',
  'Outdoor Furniture',
  'Patio, Balcony & Decking',
  'Gazebos, Pergolas & Outdoor Structures',
  'Outdoor Lighting & Solar Lighting',
  'Outdoor Cooking & Barbecue Equipment',
  'Swimming Pools & Accessories',
  'Fountains, Ponds & Water Features',
  'Outdoor Play Equipment',
  'Camping & Outdoor Recreation',
  'Outdoor Sports & Fitness Equipment',
  'Bird Feeding & Birdhouses',
  'Pest & Weed Control',
  'Garden Fencing & Boundaries',
  'Landscaping Materials & Supplies',
  'Outdoor Storage & Sheds',
  'Garden Maintenance & Landscaping Services',
  'Tree Care & Arboriculture',
  'Other Garden & Outdoor Products & Services',
];

// Government subcategory — the dropdown shown in the Description step of both
// forms when Government is the chosen category. Stored as details.subcategory.
export const GOVERNMENT_SUBCATEGORIES: string[] = [
  'Government Jobs & Recruitment',
  'Government Tenders & Contracts',
  'Public Procurement & Supplies',
  'Government Projects & Infrastructure',
  'Government Schemes & Subsidies',
  'Public Services & Citizen Services',
  'Government Departments & Ministries',
  'Central Government Services',
  'State Government Services',
  'Local Government & Panchayat Services',
  'Municipal & Corporation Services',
  'Public Sector Undertakings (PSUs)',
  'Government Auctions & E-Auctions',
  'Government Land & Property',
  'Government Housing & Accommodation',
  'Public Transport & Mobility Services',
  'Public Healthcare Services',
  'Public Education & Institutions',
  'Defence & Military Services',
  'Police & Law Enforcement',
  'Courts & Legal Administration',
  'Public Safety & Emergency Services',
  'Taxation & Revenue Services',
  'Licences, Permits & Registrations',
  'Public Utilities & Essential Services',
  'Government Grants & Funding',
  'Research & Development Institutions',
  'Government Training & Skill Development',
  'Public Welfare & Social Security',
  'Environmental & Forest Services',
  'Agriculture & Rural Development Services',
  'Public Data, Digital Services & E-Governance',
  'Public Notices & Announcements',
  'Government Events & Public Consultations',
  'Other Government Services & Opportunities',
];

// Health subcategory — the dropdown shown in the Description step of both forms
// when Health is the chosen category. Stored as details.subcategory.
export const HEALTH_SUBCATEGORIES: string[] = [
  'Digital Health & Telemedicine',
  'Health Technology & Medical AI',
  'Mental Health & Counselling',
  'Fitness, Wellness & Preventive Healthcare',
  'Nutrition & Dietetics',
  'Hospitals & Multispeciality Clinics',
  'Clinics & Medical Centres',
  'Doctors & Medical Specialists',
  'Dental Care & Dentistry',
  'Eye Care & Optometry',
  'Skin Care & Dermatology',
  'Physiotherapy & Rehabilitation',
  'Ayurveda & Traditional Medicine',
  'Homeopathy',
  'Siddha & Unani Medicine',
  'Yoga & Meditation',
  'Alternative & Holistic Healthcare',
  "Women's Healthcare",
  'Pregnancy, Maternity & Fertility Care',
  'Child & Paediatric Healthcare',
  "Men's Healthcare",
  'Senior & Geriatric Healthcare',
  'Veterinary Healthcare',
  'Diagnostic Laboratories & Testing',
  'Medical Imaging & Radiology',
  'Blood Banks & Organ Donation Services',
  'Pharmacies & Medical Stores',
  'Medicines & Pharmaceutical Products',
  'Medical Equipment & Devices',
  'Surgical Instruments & Supplies',
  'Mobility & Assistive Healthcare Products',
  'Home Healthcare & Nursing Services',
  'Emergency & Ambulance Services',
  'Occupational & Workplace Health',
  'Public Health & Community Healthcare',
  'Health Insurance & Medical Financing',
  'Medical Education & Training',
  'Healthcare Consultancy & Management',
  'Medical Tourism & Healthcare Travel',
  'Other Health & Specialized Medical Services',
];

// Home subcategory — the dropdown shown in the Description step of both forms
// when Home is the chosen category. Stored as details.subcategory.
export const HOME_SUBCATEGORIES: string[] = [
  'Smart Home & Home Automation',
  'Home Security & Surveillance',
  'Home Improvement & Renovation',
  'Home Décor & Interior Styling',
  'Home Furniture & Furnishings',
  'Kitchen & Dining',
  'Home Appliances',
  'Home Electronics & Entertainment',
  'Home Lighting & Electricals',
  'Home Storage & Organisation',
  'Cleaning & Household Supplies',
  'Bedding, Bedsheets & Linen',
  'Mattresses & Pillows',
  'Bath & Bathroom Accessories',
  'Curtains, Blinds & Window Treatments',
  'Carpets, Rugs & Floor Coverings',
  'Wall Décor & Art',
  'Kitchenware & Cookware',
  'Tableware & Serveware',
  'Home Textiles & Soft Furnishings',
  'Gardening & Indoor Plants',
  'Balcony & Outdoor Living',
  'Pooja Room & Religious Supplies',
  'Home Fragrances & Aromatherapy',
  'Pest Control & Home Hygiene',
  'Water Purifiers & Water Storage',
  'Home Repair & Maintenance',
  'Plumbing & Sanitary Supplies',
  'Electrical Supplies & Accessories',
  'Home Construction Materials',
  'Doors, Windows & Hardware',
  'Modular Kitchens & Wardrobes',
  'Home Office & Study Spaces',
  "Kids' Room & Nursery",
  'Pet-Friendly Home Products',
  'Home Safety & Accessibility',
  'Home Moving, Packing & Relocation',
  'Home Rental & Household Services',
  'Other Home Products & Specialized Supplies',
];

// Industrial subcategory — the dropdown shown in the Description step of both
// forms when Industrial is the chosen category. Stored as details.subcategory.
export const INDUSTRIAL_SUBCATEGORIES: string[] = [
  'Industrial Automation & Robotics',
  'AI, IoT & Smart Manufacturing',
  'Industrial Machinery & Equipment',
  'Manufacturing & Production Equipment',
  'Factory Setup & Infrastructure',
  'Industrial Electrical Equipment',
  'Motors, Drives & Generators',
  'Pumps, Valves & Compressors',
  'Hydraulic & Pneumatic Systems',
  'Material Handling & Lifting Equipment',
  'Cranes, Hoists & Winches',
  'Conveyors & Conveyor Systems',
  'Packaging & Processing Machinery',
  'Food Processing & Packaging Equipment',
  'Pharmaceutical & Medical Manufacturing Equipment',
  'Chemical & Petrochemical Equipment',
  'Textile & Garment Manufacturing Equipment',
  'Printing & Paper Industry Equipment',
  'Plastic & Rubber Processing Machinery',
  'Metalworking & Fabrication Machinery',
  'CNC, Laser Cutting & 3D Printing Equipment',
  'Welding & Soldering Equipment',
  'Woodworking & Furniture Manufacturing Equipment',
  'Construction & Mining Machinery',
  'Agricultural & Farming Machinery',
  'Mining & Mineral Processing Equipment',
  'Oil, Gas & Energy Industry Equipment',
  'Renewable Energy & Solar Equipment',
  'Water Treatment & Wastewater Systems',
  'Pollution Control & Environmental Equipment',
  'Industrial Refrigeration & HVAC Systems',
  'Boilers, Furnaces & Thermal Equipment',
  'Industrial Safety & Fire Protection',
  'Laboratory, Testing & Measurement Equipment',
  'Quality Control & Inspection Systems',
  'Industrial Tools & Consumables',
  'Bearings, Gears & Power Transmission',
  'Industrial Raw Materials & Chemicals',
  'Industrial Storage & Warehouse Systems',
  'Factory Maintenance & Repair Services',
  'Industrial Installation & Commissioning',
  'Industrial Engineering & Consultancy',
  'Industrial Automation Software & Systems',
  'Industrial Equipment Rental & Leasing',
  'Industrial Scrap, Recycling & Waste Management',
  'Industrial Training & Technical Services',
  'Other Industrial Products & Specialized Equipment',
];

// Categories where a New/Used condition makes no sense — properties, stays,
// pure services and perishables. The Sell form hides its condition selector
// for these and stores condition as empty.
export const NO_CONDITION_CATEGORIES = new Set([
  'real-estate',
  'service',
  'services',
  'pets',
  'accommodations',
  'food-beverage',
  'travel-tourism',
  'education-training',
  'tutoring-lessons',
  'wedding-events',
  'childcare-family',
  'health-beauty',
  // New/Used never shows for these anywhere (form selector, preview chip,
  // listing-detail and marketplace badges — including older listings that
  // already stored a condition).
  'books-publications',
  'antiques',
  'events-entertainment',
  'legal-financial',
  'marketing-advertising',
  'souvenir',
  'sneakers',
  'thrift',
  'transportation-logistics',
  'waste-management',
  'vintage',
  'agriculture-farming',
  'entertainment-media',
  'renewable-energy',
  'technology',
]);

// Legacy category values used by older posts in the database.
// Kept here so display/matching code can recognise them even though
// they no longer appear in the pickers.
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'electronics-gadgets': 'electronics',
  'fashion-apparel': 'fashion',
  'home-furniture': 'home',
  'services': 'service',
  'repair-services': 'service',
  'automobile': 'vehicles',
};

// Category search synonyms — common words people type into category search
// that don't appear in the label ("shoes" → Sneakers, "phone" → Mobiles, ...).
// Shared by the Post Enquiry and Sell category pickers.
/** Words people type for second-hand apparel and goods. They point at
 * Thrift and at Fashion: Thrift leads (the item is second-hand), Fashion
 * follows just behind it. */
const SECOND_HAND_WORDS: string[] = [
    'second hand', 'secondhand', 'used', 'pre owned', 'preowned', 'preloved',
    'pre-loved', 'thrifted', 'thrifting', 'thrift', 'thrift shop', 'thrift store',
    'resale', 'resell',
    'clothing', 'clothes', 'apparel', 'garment', 'garments', 'outfit', 'outfits', 'fashion',
    'footwear', 'shoe', 'shoes', 'sneaker', 'sneakers', 'sandal', 'sandals', 'heels',
    'slipper', 'slippers', 'chappal', 'chappals', 'boots', 'loafers', 'flip flops',
    'bag', 'bags', 'handbag', 'handbags', 'backpack', 'clutch', 'purse', 'wallet',
    'wallets', 'luggage', 'accessory', 'accessories', 'belt', 'belts', 'scarf',
    'scarves', 'cap', 'caps', 'sunglasses',
    'watch', 'watches', 'wristwatch',
    'jewellery', 'jewelry', 'jewel', 'jewels', 'ring', 'rings', 'necklace', 'earring',
    'earrings', 'bangle', 'bangles', 'bracelet', 'anklet', 'pendant',
    'saree', 'sari', 'kurta', 'kurti', 'lehenga', 'dupatta', 'shirt', 'shirts',
    'tshirt', 't-shirt', 'jeans', 'trouser', 'trousers', 'dress', 'dresses', 'skirt',
    'jacket', 'jackets', 'sweater', 'sweatshirt', 'hoodie',
];

/** Single-word Thrift items (Saree, Clutch) are matched as ordinary
 * synonyms; multi-word items are matched as phrases in matchStrength. */
const THRIFT_SINGLE_WORD_ITEMS = THRIFT_SEARCH_ITEMS.filter((item) => !item.includes(' '));

export const CATEGORY_SEARCH_SYNONYMS: Record<string, string[]> = {
  // Every repair/home-service type is a search keyword for Service, so typing
  // "plumber" or "ac repair" in the category search surfaces Service. Direct
  // category matches (e.g. "mobile" → Mobiles) still outrank it because label
  // matches score better than synonym matches in matchStrength().
  service: REPAIR_SERVICE_TYPES.filter(t => t !== 'Other').map(t => t.toLowerCase()),
  sneakers: ['shoe', 'shoes', 'footwear', 'trainers', 'sports shoes', 'running shoes'],
  fashion: ['clothes', 'clothing', 'apparel', 'dress', 'saree', 'sari', 'kurti', 'shirt', 'tshirt', 't-shirt', 'jeans', 'churidar', 'lehenga'],
  mobiles: ['phone', 'phones', 'smartphone', 'mobile phone', 'iphone', 'android', 'redmi', 'samsung phone', 'vivo', 'oppo', 'realme', 'oneplus'],
  laptops: ['computer', 'notebook', 'macbook', 'laptop', 'desktop', 'pc', 'imac'],
  electronics: ['tv', 'headphones', 'earphones', 'speaker', 'gadget', 'airpods', 'earbuds', 'headphone', 'smartwatch', 'smart watch', 'led tv', 'home theatre', 'soundbar', 'printer', 'projector'],
  bicycles: ['cycle', 'cycles', 'bicycle', 'bicycles', 'mtb', 'gear cycle'],
  car: ['vehicle', 'four wheeler', 'four-wheeler', '4 wheeler', '4-wheeler', 'car', 'cars', 'sedan', 'suv', 'hatchback'],
  vehicles: ['vehicle', 'vehicles', 'car', 'cars', 'four wheeler', 'four-wheeler', '4 wheeler', '4-wheeler', 'bike', 'motorcycle', 'two wheeler', 'auto rickshaw', 'autorickshaw', 'rikshaw', 'tempo', 'van', 'truck', 'lorry', 'bus', 'jeep', 'automobile', 'automobiles'],
  bike: ['motorcycle', 'motorcycles', 'motorbike', 'motorbikes', 'bike', 'bikes', 'scooter', 'scooters', 'two-wheeler', 'two wheeler', '2 wheeler', 'scooty', 'royal enfield', 'bullet', 'activa'],
  furniture: ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'sofa set', 'dining table', 'mattress', 'study table', 'office chair', 'cot'],
  home: ['home appliance', 'household', 'interior', 'home decor', 'curtain', 'fan', 'cooler', 'home items'],
  'real-estate': ['flat', 'apartment', 'house', 'plot', 'land', 'property', 'stay', 'staying', 'lodge', 'hostel', 'motel', 'resort', 'homestay', 'guest house', 'pg', 'paying guest', 'room', 'accommodation', 'shop', 'commercial space', 'office space', 'godown', 'warehouse', 'showroom', 'building'],
  accommodations: ['stay', 'staying', 'lodge', 'lodging', 'hostel', 'motel', 'resort', 'homestay', 'villa', 'cottage', 'guest house', 'campsite', 'dormitory', 'pg', 'paying guest', 'service apartment', 'private room', 'room', 'hotel', 'accommodation', 'short stay', 'rent', 'room rent', 'hostel room', 'eco stay', 'farm stay'],
  appliances: ['fridge', 'refrigerator', 'washing machine', 'microwave', 'ac', 'air conditioner', 'inverter', 'water purifier', 'chimney', 'geyser'],
  'sports-outdoor': ['gym', 'fitness', 'cricket', 'badminton', 'football', 'bat', 'racket', 'skates', 'sports equipment'],
  'baby-kids': ['toys', 'stroller', 'pram', 'cradle', 'diaper', 'kids cycle', 'baby items', 'kids clothes'],
  pets: ['dog', 'cat', 'puppy', 'kitten', 'cow', 'goat', 'hen', 'bird', 'fish tank', 'aquarium', 'pet food'],
  'photography-cameras': ['dslr', 'camera lens', 'gopro', 'camera', 'tripod', 'drone'],
  'musical-instruments': ['guitar', 'piano', 'drums', 'keyboard', 'violin', 'flute', 'tabla', 'harmonium'],
  gaming: ['playstation', 'ps5', 'ps4', 'xbox', 'console'],
  jobs: ['job', 'vacancy', 'vacancies', 'hiring', 'naukri', 'recruitment', 'part time job', 'full time job', 'work', 'employment', 'staff needed'],
  'health-beauty': ['cosmetics', 'makeup', 'skincare', 'salon', 'parlour', 'beauty parlour', 'gym membership', 'wellness'],
  'beauty-products': ['cosmetics', 'makeup', 'skincare', 'salon', 'parlour', 'lipstick', 'perfume'],
  'fitness-gym-equipment': ['dumbbell', 'dumbbells', 'treadmill', 'gym setup', 'weights', 'barbell', 'exercise cycle', 'gym equipment'],
  'education-training': ['tuition', 'tuitions', 'tutor', 'classes', 'coaching', 'coaching centre', 'spoken english', 'training institute', 'study abroad'],
  'tutoring-lessons': ['tuition', 'tutor', 'classes', 'coaching', 'home tuition', 'online classes', 'spoken english', 'music teacher'],
  'cleaning-services': [
    'maid', 'house cleaning', 'housekeeping', 'deep cleaning', 'sofa cleaning', 'pest control',
    // Every dropdown option is a search keyword: typing any cleaning type
    // ("septic tank cleaning", "floor polishing", …) finds Cleaning Services
    // so it can lead the results, followed by Service.
    ...CLEANING_SERVICE_TYPES.filter(t => t !== 'Other').map(t => t.toLowerCase()),
  ],
  'construction-renovation': ['builder', 'contractor', 'renovation', 'interior work', 'painting', 'civil work'],
  'events-entertainment': ['birthday', 'party', 'event management', 'stage', 'decorator', 'anchor', 'band'],
  'wedding-events': ['marriage', 'wedding hall', 'catering', 'wedding photographer', 'bridal makeup', 'mehndi'],
  'food-beverage': ['tiffin', 'catering', 'home food', 'bakery', 'cake', 'food delivery', 'breakfast', 'meals'],
  'transportation-logistics': ['movers', 'packers and movers', 'tempo', 'goods transport', 'shifting', 'logistics', 'delivery service', 'lorry', 'taxi', 'cab', 'cab service', 'taxi service'],
  'travel-tourism': ['tour package', 'taxi', 'cab', 'tempo traveller', 'travel agency', 'rental', 'trip'],
  'agriculture-farming': ['tractor', 'farm equipment', 'farming', 'livestock', 'poultry', 'seeds', 'fertilizer', 'coconut', 'rubber', 'arecanut'],
  'tools-equipment': ['drill machine', 'welding', 'generator', 'power tools', 'grinder', 'cutting machine'],
  'medical-equipment': ['wheelchair', 'hospital bed', 'oxygen cylinder', 'nebulizer', 'walker', 'bp monitor', 'glucometer'],
  'office-supplies': ['printer', 'xerox machine', 'office chair', 'office table', 'stationery', 'photocopier'],
  'raw-materials-industrial': ['industrial materials', 'raw materials', 'scrap', 'steel', 'cement'],
  'legal-financial': ['lawyer', 'advocate', 'chartered accountant', 'loan', 'tax filing'],
  'insurance-services': ['insurance', 'life insurance', 'term plan', 'policy'],
  'marketing-advertising': ['digital marketing', 'advertising', 'seo', 'social media marketing', 'branding'],
  'security-safety': ['cctv', 'security camera', 'security guard', 'alarm', 'door lock'],
  'renewable-energy': ['solar', 'solar panel', 'solar inverter', 'solar water heater'],
  'garden-outdoor': ['plants', 'garden tools', 'lawn', 'pots', 'seeds'],
  'kitchen-dining': ['cookware', 'mixie', 'mixer grinder', 'gas stove', 'induction', 'dining set', 'utensils'],
  'bags-luggage': ['bag', 'backpack', 'suitcase', 'trolley bag', 'travel bag', 'laptop bag'],
  'books-publications': ['book', 'books', 'textbook', 'novel', 'magazine', 'study material'],
  'jewelry-accessories': ['jewellery', 'gold', 'ring', 'necklace', 'chain', 'bangle', 'earring'],
  'childcare-family': ['babysitter', 'nanny', 'day care', 'daycare', 'elder care'],
  'entertainment-media': ['band', 'dj', 'orchestra', 'media', 'photography service'],
  'antiques': ['antique', 'vintage items', 'old coins', 'rare items'],
  'collectibles': ['coins', 'stamps', 'collectible', 'figurine'],
  'memorabilia': ['signed', 'autograph', 'memorabilia'],
  'vintage': ['vintage', 'retro', 'old items'],
  // Thrift is a second-hand catch-all, so the words people actually type for
  // its types and items should also offer it next to the specific category:
  // "shoes" still shows Sneakers first, with Thrift right beneath it. The
  // matcher only looks at whole words (or whole phrases), so these stay safe.
  'thrift': [
    ...SECOND_HAND_WORDS,
    ...THRIFT_SINGLE_WORD_ITEMS,
  ],
  'waste-management': ['scrap dealer', 'waste collection', 'recycling', 'garbage'],
  'government-public': ['government', 'public sector', 'psc'],
  'non-profit-charity': ['charity', 'ngo', 'donation', 'volunteer'],
  'technology': ['tech', 'software', 'app development', 'website', 'it services'],
  'business': ['business for sale', 'franchise', 'partnership', 'investor'],
  'art': ['painting', 'artwork', 'sketch', 'portrait'],
};

/**
 * Levenshtein edit distance, capped at `max` — returns `max + 1` once the
 * distance provably exceeds max, so it stays fast for short strings.
 */
function boundedLevenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Lowercase and collapse punctuation (&, -, /, parentheses) to single
 *  spaces so phrase matching ignores formatting: "House & deep cleaning"
 *  === "house deep cleaning". */
function normalizeWords(s: string): string {
  return s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** normalizeWords plus a trailing-plural strip per word, so a typed "office
 * bags" matches the item "Office Bags". "ss" endings (Dress) are left alone. */
function singularWords(s: string): string {
  return normalizeWords(s)
    .split(' ')
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ');
}

/** Match strength for a query against a category's label / value / synonyms.
 * Lower is better: 0 = whole-word match on the label ("car" → Car),
 * 1 = whole-word match on value or a synonym, 2 = query starts the word
 * (only for 4+ letter queries, so "car" ≠ "care"), 3+ = fuzzy typo match.
 * -1 = no match. Used to rank categories so exact hits always come first. */
function matchStrength(c: AppCategory, q: string): number {
  const labelLower = c.label.toLowerCase();
  const labelWords = labelLower.split(/[^a-z0-9]+/).filter(Boolean);
  const synStrings = [
    c.value,
    ...(CATEGORY_SEARCH_SYNONYMS[c.value] ?? []),
  ];
  const otherWords = synStrings.flatMap(s => s.toLowerCase().split(/[^a-z0-9]+/)).filter(Boolean);
  // Normalized copies so "Construction & post-renovation cleaning" matches
  // "construction post renovation cleaning" (typed hyphens/& count as spaces).
  const qNorm = normalizeWords(q);
  const labelNorm = normalizeWords(labelLower);
  const normSyn = synStrings.map(normalizeWords);

  if (labelWords.includes(q)) return 0;
  // Exact whole-word label hit ranks best, then a label word starting with
  // the query, then exact synonym hits (includes service-type keywords like
  // "plumber"), then phrase/prefix matches. Keeping direct category matches
  // ahead of service-keyword matches means "mobile" shows Mobiles first and
  // Service (via "Mobile repair") second.
  if (q.length >= 3 && labelWords.some(w => w.startsWith(q))) return 1;
  if (otherWords.includes(q)) return 2;
  // Multi-word synonyms/phrases: "four wheeler" should match the full phrase,
  // not just its individual words.
  if (qNorm.includes(' ')) {
    // Phrase matches carry a specificity tie-break: the shortest synonym
    // containing the query wins ties, so "tank cleaning" resolves to Cleaning
    // Services' "water tank cleaning" rather than Service's longer repair
    // phrase "septic / sewage tank cleaning".
    let phraseLen = Infinity;
    for (const s of normSyn) if (s.includes(qNorm)) phraseLen = Math.min(phraseLen, s.length);
    if (phraseLen < Infinity) return 3 + Math.min(phraseLen, 999) / 1000;
    if (labelNorm.includes(qNorm)) return 1;
  }

  // Prefix matching from 3 letters on labels (so "agr" finds Agriculture),
  // but synonyms need 4+ letters (so "car" doesn't match "care"/"carpenter").
  if (q.length >= 4 && otherWords.some(w => w.startsWith(q))) return 4;
  // All query words present in this category's vocabulary, in any order —
  // catches partial phrases like "floor polishing" or "post renovation
  // cleaning" without weakening any of the single-word rankings above.
  if (qNorm.includes(' ')) {
    const qWords = qNorm.split(' ').filter(w => w.length >= 3);
    const bag = new Set([...labelWords, ...otherWords]);
    if (qWords.length > 0 && qWords.every(w => bag.has(w))) return 5;
  }
  // Second-hand vocabulary: any Thrift type or item name ("office bags",
  // "briefcases", "kolhapuri chappals") points at Thrift and at Fashion, which
  // is where most apparel shoppers look. Phrase/plural insensitive, so a bare
  // "office" stays in Office Supplies. Thrift leads because the item is a
  // Thrift item; Fashion follows immediately after.
  if (c.value === 'thrift' || c.value === 'fashion') {
    const qSing = singularWords(qNorm);
    const itemHit =
      THRIFT_SEARCH_ITEMS.some(item => singularWords(normalizeWords(item)) === qSing) ||
      SECOND_HAND_WORDS.some(w => singularWords(normalizeWords(w)) === qSing);
    if (itemHit) return c.value === 'thrift' ? 3.5 : 3.6;
  }
  return -1;
}

// Service-type categories that lead category-search results when the query
// does not directly match a non-service category ("water tank cleaning",
// "carpenter"). This order is the order users see them in the dropdown.
export const SERVICE_PRIORITY_CATEGORIES: string[] = [
  'service',
  'musical-services',
  'real-estate-services',
  'cleaning-services',
];

/**
 * Filter categories by a search query, matching label, value, and synonyms.
 * Used by the category pickers so words like "shoes" find Sneakers.
 *
 * Results are ranked by match strength (exact label match → synonym match →
 * prefix match), then padded with fuzzy near-matches and finally the three
 * main categories (Service / Business / Personal) as catch-alls so users
 * always have somewhere to post — e.g. "taxi" shows Travel, Transportation
 * AND Service.
 */
export function filterCategoriesBySearch<T extends AppCategory>(categories: T[], query: string, minResults = 3): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  const scored: Array<{ c: T; s: number }> = [];
  for (const c of categories) {
    const s = matchStrength(c, q);
    if (s >= 0) scored.push({ c, s });
  }
  scored.sort((a, b) => a.s - b.s);
  const direct = scored.map(x => x.c);

  const chosen = new Set(direct.map(c => c.value));
  let result: T[] = [...direct];

  // Tier 2: fuzzy near-matches (typos / close spellings), only for queries of
  // 4+ chars, and only against words of 5+ chars so short words like "tax"
  // or "shop" don't fuzzy-match unrelated queries ("taxi", "shoe").
  if (result.length < minResults && q.length >= 4) {
    const threshold = Math.min(2, Math.floor(q.length / 4));
    const wordsOf = (c: AppCategory): string[] => {
      const words = c.label.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 5);
      for (const syn of CATEGORY_SEARCH_SYNONYMS[c.value] ?? []) {
        words.push(...syn.split(/[^a-z0-9]+/).filter(w => w.length >= 5));
      }
      return words;
    };
    const fuzzy = categories
      .filter(c => !chosen.has(c.value))
      .map(c => {
        let best = Infinity;
        for (const w of wordsOf(c)) best = Math.min(best, boundedLevenshtein(q, w, threshold));
        return { c, best };
      })
      .filter(x => x.best <= threshold)
      .sort((a, b) => a.best - b.best);
    for (const f of fuzzy) {
      if (result.length >= minResults) break;
      chosen.add(f.c.value);
      result.push(f.c);
    }
  }

  // Tier 3: main categories as catch-alls so users always have a fallback.
  for (const mainValue of ['service', 'business', 'personal']) {
    if (result.length >= minResults) break;
    const main = categories.find(c => c.value === mainValue);
    if (main && !chosen.has(main.value)) {
      chosen.add(main.value);
      result.push(main);
    }
  }

  // Service-type queries ("water tank cleaning", "carpenter") never name a
  // product category directly. When only service-group categories matched —
  // or nothing matched at all — lead the dropdown with the service categories
  // in canonical order: Service, Musical Services, Real Estate Services,
  // Cleaning Services. Product queries ("mobile", "shoes") match a non-service
  // category directly and keep their natural ranking untouched.
  const priorityValues = new Set<string>(SERVICE_PRIORITY_CATEGORIES);
  const hasNonServiceDirect = scored.some(x => !priorityValues.has(x.c.value));
  if (!hasNonServiceDirect) {
    const priority = SERVICE_PRIORITY_CATEGORIES
      .map(v => categories.find(c => c.value === v))
      .filter((c): c is T => Boolean(c));
    // Service-group members already in the results keep their matched order
    // (so "cleaning" still leads with Cleaning Services), then the rest of the
    // group in canonical order, then everything else below them.
    const groupInResult = result.filter(c => priorityValues.has(c.value));
    const groupPresent = new Set(groupInResult.map(c => c.value));
    const groupMissing = priority.filter(c => !groupPresent.has(c.value));
    result = [...groupInResult, ...groupMissing, ...result.filter(c => !priorityValues.has(c.value))];
  }
  return result;
}

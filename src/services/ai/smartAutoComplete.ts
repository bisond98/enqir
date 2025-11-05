// AI Smart Auto-Complete Service - Mobile Optimized
// Provides intelligent suggestions for form fields based on existing data

export interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  status: string;
  createdAt: any;
  userId: string;
  userProfileVerified?: boolean;
  idFrontImage?: string;
  idBackImage?: string;
  isUrgent?: boolean;
  likes?: number;
  userLikes?: string[];
}

// Smart Title Suggestions
export const getSmartTitleSuggestions = (
  input: string, 
  existingEnquiries: Enquiry[], 
  userHistory: Enquiry[] = []
): string[] => {
  try {
    if (!input.trim() || input.length < 2) return [];

    const suggestions = new Set<string>();
    const searchTerm = input.toLowerCase();

    // Get suggestions from existing enquiries
    existingEnquiries.forEach(enquiry => {
      if (enquiry.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(enquiry.title);
      }
    });

    // Get suggestions from user history (prioritize)
    userHistory.forEach(enquiry => {
      if (enquiry.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(enquiry.title);
      }
    });

    // Generate smart variations
    const commonPatterns = [
      `Looking for ${input}`,
      `Need ${input}`,
      `Want ${input}`,
      `Searching for ${input}`,
      `Help with ${input}`,
      `${input} needed`,
      `${input} required`,
      `${input} wanted`
    ];

    commonPatterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(searchTerm)) {
        suggestions.add(pattern);
      }
    });

    return Array.from(suggestions).slice(0, 8); // Mobile-friendly limit
  } catch (error) {
    console.error('Smart title suggestions failed:', error);
    return [];
  }
};

// Smart Category Suggestions
export const getSmartCategorySuggestions = (
  input: string, 
  existingEnquiries: Enquiry[]
): string[] => {
  try {
    if (!input.trim() || input.length < 2) return [];

    const suggestions = new Set<string>();
    const searchTerm = input.toLowerCase();

    // Get suggestions from existing categories
    existingEnquiries.forEach(enquiry => {
      if (enquiry.category.toLowerCase().includes(searchTerm)) {
        suggestions.add(enquiry.category);
      }
    });

    // Smart category matching
    const categoryKeywords: { [key: string]: string[] } = {
      'household': ['Household & Personal', 'Home & Garden', 'Cleaning', 'Kitchen'],
      'personal': ['Personal Care', 'Health & Beauty', 'Fashion', 'Accessories'],
      'community': ['Community Help', 'Volunteer', 'Local Services', 'Neighborhood'],
      'services': ['Services & Skills', 'Professional Services', 'Tutoring', 'Repairs'],
      'collectibles': ['Collectibles & Hobbies', 'Antiques', 'Vintage', 'Collector Items'],
      'transportation': ['Transportation', 'Cars', 'Bikes', 'Public Transport'],
      'pets': ['Pet Sitting & Care', 'Pet Services', 'Animal Care', 'Pet Supplies'],
      'moving': ['Moving & Help', 'Relocation', 'Packing', 'Transportation'],
      'jobs': ['Jobs & Help', 'Employment', 'Work', 'Career'],
      'housing': ['Housing & Property', 'Real Estate', 'Rent', 'Buy']
    };

    // Check for keyword matches
    Object.entries(categoryKeywords).forEach(([keyword, categories]) => {
      if (keyword.includes(searchTerm) || searchTerm.includes(keyword)) {
        categories.forEach(cat => suggestions.add(cat));
      }
    });

    return Array.from(suggestions).slice(0, 6); // Mobile-friendly limit
  } catch (error) {
    console.error('Smart category suggestions failed:', error);
    return [];
  }
};

// Smart Budget Suggestions
export const getSmartBudgetSuggestions = (
  input: string, 
  existingEnquiries: Enquiry[]
): string[] => {
  try {
    if (!input.trim()) return [];

    const suggestions = new Set<string>();
    const searchTerm = input.toLowerCase();

    // Get budget patterns from existing enquiries
    existingEnquiries.forEach(enquiry => {
      if (enquiry.budget.toLowerCase().includes(searchTerm)) {
        suggestions.add(enquiry.budget);
      }
    });

    // Smart budget patterns - INR (Indian Rupees)
    const budgetPatterns = [
      'Under ₹1,000',
      '₹1,000 - ₹2,500',
      '₹2,500 - ₹5,000',
      '₹5,000 - ₹10,000',
      '₹10,000 - ₹25,000',
      '₹25,000 - ₹50,000',
      '₹50,000 - ₹1,00,000',
      'Over ₹1,00,000',
      'Negotiable',
      'Market Rate',
      'Flexible',
      'Open to offers'
    ];

    budgetPatterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(searchTerm)) {
        suggestions.add(pattern);
      }
    });

    // Generate smart variations based on input - INR
    if (searchTerm.includes('under') || searchTerm.includes('less')) {
      suggestions.add('Under ₹2,500');
      suggestions.add('Under ₹5,000');
    }

    if (searchTerm.includes('over') || searchTerm.includes('more')) {
      suggestions.add('Over ₹25,000');
      suggestions.add('Over ₹50,000');
    }

    if (searchTerm.includes('flex') || searchTerm.includes('negot')) {
      suggestions.add('Flexible');
      suggestions.add('Negotiable');
    }

    return Array.from(suggestions).slice(0, 5); // Mobile-friendly limit
  } catch (error) {
    console.error('Smart budget suggestions failed:', error);
    return [];
  }
};

// Smart Location Suggestions
export const getSmartLocationSuggestions = (
  input: string, 
  existingEnquiries: Enquiry[]
): string[] => {
  try {
    if (!input.trim() || input.length < 2) return [];

    const suggestions = new Set<string>();
    const searchTerm = input.toLowerCase();

    // Get suggestions from existing locations
    existingEnquiries.forEach(enquiry => {
      if (enquiry.location.toLowerCase().includes(searchTerm)) {
        suggestions.add(enquiry.location);
      }
    });

    // Comprehensive Indian locations - States, Districts, Cities
    const indianLocations = [
      // Major Metropolitan Cities
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
      'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
      'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
      'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
      'Varanasi', 'Srinagar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Ranchi', 'Coimbatore',
      
      // All States and Union Territories
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
      'West Bengal', 'Delhi', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu',
      'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands',
      
      // Major Districts and Cities by State
      // Maharashtra
      'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
      'Amravati', 'Nanded', 'Sangli', 'Satara', 'Ratnagiri', 'Sindhudurg', 'Gadchiroli',
      'Chandrapur', 'Yavatmal', 'Washim', 'Hingoli', 'Parbhani', 'Jalna', 'Beed', 'Latur',
      'Osmanabad', 'Nanded', 'Buldhana', 'Akola', 'Wardha', 'Gondia', 'Bhandara',
      
      // Karnataka
      'Bangalore', 'Mysore', 'Hubli-Dharwad', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere',
      'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hassan', 'Mandya',
      'Chitradurga', 'Kolar', 'Tumkur', 'Chikmagalur', 'Kodagu', 'Dakshina Kannada',
      
      // Tamil Nadu
      'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Vellore', 'Erode',
      'Tiruppur', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga',
      'Pudukkottai', 'Nagapattinam', 'Namakkal', 'Karur', 'Tiruvannamalai', 'Villupuram',
      'Cuddalore', 'Perambalur', 'Ariyalur', 'Kanchipuram', 'Tiruvallur', 'Vellore',
      
      // Kerala
      'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha',
      'Palakkad', 'Kottayam', 'Kannur', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Malappuram',
      'Kasaragod', 'Ernakulam', 'Kottayam', 'Alappuzha', 'Pathanamthitta', 'Idukki',
      
      // Uttar Pradesh
      'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly',
      'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Lakhimpur',
      'Jhansi', 'Ballia', 'Azamgarh', 'Rampur', 'Shahjahanpur', 'Budaun', 'Etawah',
      
      // Gujarat
      'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
      'Anand', 'Bharuch', 'Gandhinagar', 'Kheda', 'Mehsana', 'Patan', 'Banaskantha',
      'Sabarkantha', 'Panchmahal', 'Dahod', 'Valsad', 'Navsari', 'Tapi', 'Dang',
      
      // Rajasthan
      'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar',
      'Sikar', 'Sri Ganganagar', 'Hanumangarh', 'Churu', 'Jhunjhunu', 'Nagaur', 'Pali',
      'Rajsamand', 'Banswara', 'Dungarpur', 'Udaipur', 'Chittorgarh', 'Bundi', 'Tonk',
      
      // Madhya Pradesh
      'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna',
      'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Khargone',
      'Barwani', 'Dhar', 'Jhabua', 'Alirajpur', 'Shahdol', 'Anuppur', 'Dindori',
      
      // West Bengal
      'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda',
      'Birbhum', 'Bankura', 'Purulia', 'Hooghly', 'Nadia', 'Murshidabad', 'Cooch Behar',
      'Jalpaiguri', 'Darjeeling', 'North 24 Parganas', 'South 24 Parganas', 'East Midnapore',
      'West Midnapore', 'Purba Bardhaman', 'Paschim Bardhaman',
      
      // Telangana
      'Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Adilabad', 'Khammam', 'Nalgonda',
      'Medak', 'Rangareddy', 'Mahbubnagar', 'Nalgonda', 'Yadadri Bhuvanagiri', 'Suryapet',
      'Jangaon', 'Jayashankar Bhupalpally', 'Mulugu', 'Bhadradri Kothagudem', 'Kumuram Bheem',
      'Mancherial', 'Peddapalli', 'Rajanna Sircilla', 'Siddipet', 'Vikarabad', 'Wanaparthy',
      
      // Andhra Pradesh
      'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Anantapur', 'Kadapa',
      'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'East Godavari', 'West Godavari',
      'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Anantapur', 'Kurnool',
      
      // Bihar
      'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai',
      'Katihar', 'Munger', 'Chapra', 'Sitamarhi', 'Motihari', 'Siwan', 'Hajipur', 'Samastipur',
      'Bettiah', 'Buxar', 'Bhabua', 'Aurangabad', 'Nawada', 'Jamui', 'Jehanabad', 'Arwal',
      
      // Punjab
      'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Moga',
      'Firozpur', 'Sangrur', 'Faridkot', 'Fatehgarh Sahib', 'Mansa', 'Barnala', 'Muktsar',
      'Tarn Taran', 'Kapurthala', 'Gurdaspur', 'Rupnagar', 'Mohali', 'Pathankot',
      
      // Haryana
      'Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
      'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Fatehabad', 'Jind', 'Kaithal',
      'Rewari', 'Mahendragarh', 'Bhiwani', 'Fatehabad', 'Jhajjar', 'Charkhi Dadri',
      
      // Odisha
      'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore',
      'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Sundargarh', 'Deogarh', 'Jharsuguda',
      'Sambalpur', 'Jharsuguda', 'Bargarh', 'Bolangir', 'Nuapada', 'Kalahandi', 'Rayagada',
      'Koraput', 'Malkangiri', 'Nabarangpur', 'Kandhamal', 'Boudh', 'Subarnapur', 'Angul',
      'Dhenkanal', 'Jajpur', 'Kendujhar', 'Mayurbhanj', 'Balasore', 'Bhadrak', 'Kendrapara',
      'Jagatsinghpur', 'Puri', 'Khordha', 'Nayagarh', 'Ganjam', 'Gajapati', 'Kandhamal',
      
      // Assam
      'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tinsukia', 'Tezpur', 'Nagaon',
      'Barpeta', 'Dhubri', 'Goalpara', 'Bongaigaon', 'Kokrajhar', 'Dhubri', 'South Salmara',
      'Barpeta', 'Nalbari', 'Baksa', 'Chirang', 'Udalguri', 'Darrang', 'Sonitpur',
      'Lakhimpur', 'Dhemaji', 'Tinsukia', 'Dibrugarh', 'Sivasagar', 'Jorhat', 'Golaghat',
      'Karbi Anglong', 'Dima Hasao', 'Cachar', 'Karimganj', 'Hailakandi',
      
      // Jharkhand
      'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Giridih', 'Kodarma',
      'Chatra', 'Palamu', 'Garhwa', 'Deoghar', 'Godda', 'Sahibganj', 'Pakur', 'Dumka',
      'Jamtara', 'Pakur', 'Sahebganj', 'Godda', 'Deoghar', 'Dumka', 'Jamtara', 'Pakur',
      'Sahebganj', 'Godda', 'Deoghar', 'Dumka', 'Jamtara', 'Pakur', 'Sahebganj', 'Godda',
      
      // Chhattisgarh
      'Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur',
      'Ambikapur', 'Mahasamund', 'Gariaband', 'Dhamtari', 'Balod', 'Bemetara', 'Balodabazar',
      'Gariaband', 'Dhamtari', 'Balod', 'Bemetara', 'Balodabazar', 'Gariaband', 'Dhamtari',
      'Balod', 'Bemetara', 'Balodabazar', 'Gariaband', 'Dhamtari', 'Balod', 'Bemetara',
      
      // Himachal Pradesh
      'Shimla', 'Mandi', 'Solan', 'Kangra', 'Una', 'Hamirpur', 'Bilaspur', 'Chamba',
      'Kullu', 'Kinnaur', 'Lahaul and Spiti', 'Sirmaur', 'Kangra', 'Una', 'Hamirpur',
      'Bilaspur', 'Chamba', 'Kullu', 'Kinnaur', 'Lahaul and Spiti', 'Sirmaur',
      
      // Uttarakhand
      'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh',
      'Mussoorie', 'Nainital', 'Almora', 'Pithoragarh', 'Champawat', 'Bageshwar', 'Chamoli',
      'Rudraprayag', 'Tehri Garhwal', 'Uttarkashi', 'Pauri Garhwal', 'Dehradun',
      
      // Goa
      'Panaji', 'Margao', 'Mapusa', 'Ponda', 'Mormugao', 'Pernem', 'Bardez', 'Salcete',
      'Tiswadi', 'Bicholim', 'Sattari', 'Ponda', 'Mormugao', 'Pernem', 'Bardez',
      
      // North Eastern States
      'Imphal', 'Aizawl', 'Kohima', 'Shillong', 'Agartala', 'Itanagar', 'Gangtok',
      'Dimapur', 'Kohima', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek',
      'Kiphire', 'Longleng', 'Peren', 'Mon', 'Kiphire', 'Longleng', 'Peren', 'Mon',
      
      // Union Territories
      'Port Blair', 'Kavaratti', 'Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Chandigarh',
      'Daman', 'Diu', 'Silvassa', 'Dadra', 'Nagar Haveli'
    ];

    // Add Indian locations that match the search term
    indianLocations.forEach(location => {
      if (location.toLowerCase().includes(searchTerm)) {
        suggestions.add(location);
      }
    });

    // Smart location patterns
    const locationPatterns = [
      'Local',
      'Nearby',
      'Same City',
      'Within 10 miles',
      'Within 25 miles',
      'Remote',
      'Online',
      'Anywhere',
      'Flexible location'
    ];

    locationPatterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(searchTerm)) {
        suggestions.add(pattern);
      }
    });

    // Generate smart variations based on input
    if (searchTerm.includes('local') || searchTerm.includes('near')) {
      suggestions.add('Local');
      suggestions.add('Nearby');
      suggestions.add('Same City');
    }

    if (searchTerm.includes('remote') || searchTerm.includes('online')) {
      suggestions.add('Remote');
      suggestions.add('Online');
      suggestions.add('Anywhere');
    }

    if (searchTerm.includes('flex') || searchTerm.includes('any')) {
      suggestions.add('Flexible location');
      suggestions.add('Anywhere');
    }

    // Add common location variations
    if (searchTerm.includes('kerala')) {
      suggestions.add('Kerala');
      suggestions.add('Kochi, Kerala');
      suggestions.add('Thiruvananthapuram, Kerala');
      suggestions.add('Kozhikode, Kerala');
      suggestions.add('Remote (Kerala)');
    }

    if (searchTerm.includes('mumbai')) {
      suggestions.add('Mumbai');
      suggestions.add('Mumbai, Maharashtra');
      suggestions.add('Local (Mumbai)');
      suggestions.add('Remote (Mumbai)');
    }

    if (searchTerm.includes('delhi')) {
      suggestions.add('Delhi');
      suggestions.add('New Delhi');
      suggestions.add('Delhi NCR');
      suggestions.add('Local (Delhi)');
      suggestions.add('Remote (Delhi)');
    }

    if (searchTerm.includes('bangalore')) {
      suggestions.add('Bangalore');
      suggestions.add('Bengaluru');
      suggestions.add('Bangalore, Karnataka');
      suggestions.add('Local (Bangalore)');
      suggestions.add('Remote (Bangalore)');
    }

    return Array.from(suggestions).slice(0, 12); // Increased limit for comprehensive coverage
  } catch (error) {
    console.error('Smart location suggestions failed:', error);
    return [];
  }
};

// Description Templates
export const getDescriptionTemplates = (
  input: string, 
  field: string
): string[] => {
  try {
    if (!input.trim() || input.length < 2) return [];

    const suggestions = new Set<string>();
    const searchTerm = input.toLowerCase();

    // Description templates based on keywords
    const descriptionTemplates: { [key: string]: string[] } = {
      'urgent': [
        'Urgent need - looking for quick response',
        'Need this ASAP - urgent situation',
        'Time-sensitive request - please respond quickly'
      ],
      'flexible': [
        'Flexible on timing and details',
        'Open to suggestions and alternatives',
        'Flexible requirements - willing to work with you'
      ],
      'professional': [
        'Professional service required',
        'Looking for experienced provider',
        'High-quality work expected'
      ],
      'casual': [
        'Casual request - no rush',
        'Simple need - basic service okay',
        'Relaxed timeline - whenever convenient'
      ],
      'quality': [
        'Quality is important',
        'Looking for best available option',
        'Willing to pay more for quality'
      ],
      'budget': [
        'Budget-friendly options preferred',
        'Looking for good value',
        'Cost-effective solutions needed'
      ]
    };

    // Check for keyword matches
    Object.entries(descriptionTemplates).forEach(([keyword, templates]) => {
      if (keyword.includes(searchTerm) || searchTerm.includes(keyword)) {
        templates.forEach(template => suggestions.add(template));
      }
    });

    // Generate smart variations
    if (searchTerm.includes('need') || searchTerm.includes('want')) {
      suggestions.add('I need this item/service for...');
      suggestions.add('Looking for someone who can provide...');
    }

    if (searchTerm.includes('help') || searchTerm.includes('assist')) {
      suggestions.add('Need help with this task...');
      suggestions.add('Looking for assistance with...');
    }

    return Array.from(suggestions).slice(0, 5); // Mobile-friendly limit
  } catch (error) {
    console.error('Description templates failed:', error);
    return [];
  }
};

// Get related data for enhanced suggestions
export const getRelatedData = (
  field: string, 
  value: string, 
  existingEnquiries: Enquiry[]
): any => {
  try {
    if (!value.trim()) return null;

    const searchTerm = value.toLowerCase();
    const related = existingEnquiries.filter(enquiry => {
      switch (field) {
        case 'title':
          return enquiry.title.toLowerCase().includes(searchTerm);
        case 'category':
          return enquiry.category.toLowerCase().includes(searchTerm);
        case 'location':
          return enquiry.location.toLowerCase().includes(searchTerm);
        default:
          return false;
      }
    });

    return {
      count: related.length,
      averageBudget: related.length > 0 
        ? related.reduce((sum, e) => sum + (parseInt(e.budget.replace(/\D/g, '')) || 0), 0) / related.length
        : 0,
      popularLocations: [...new Set(related.map(e => e.location))].slice(0, 3),
      similarCategories: [...new Set(related.map(e => e.category))].slice(0, 3)
    };
  } catch (error) {
    console.error('Related data failed:', error);
    return null;
  }
};

// AI-powered keyword search service
export interface KeywordMapping {
  keyword: string;
  category: string;
  synonyms?: string[];
}

export const keywordMappings: KeywordMapping[] = [
  // Automobile
  { keyword: 'car', category: 'automobile' },
  { keyword: 'vehicle', category: 'automobile' },
  { keyword: 'auto', category: 'automobile' },
  { keyword: 'automobile', category: 'automobile' },
  { keyword: 'bike', category: 'automobile' },
  { keyword: 'motorcycle', category: 'automobile' },
  { keyword: 'truck', category: 'automobile' },
  { keyword: 'scooter', category: 'automobile' },
  { keyword: 'bus', category: 'automobile' },
  { keyword: 'van', category: 'automobile' },
  
  // Fashion/Thrift
  { keyword: 'jacket', category: 'thrift' },
  { keyword: 'clothing', category: 'thrift' },
  { keyword: 'fashion', category: 'thrift' },
  { keyword: 'dress', category: 'thrift' },
  { keyword: 'shirt', category: 'thrift' },
  { keyword: 'pants', category: 'thrift' },
  { keyword: 'shoes', category: 'thrift' },
  { keyword: 'accessories', category: 'thrift' },
  { keyword: 'bag', category: 'thrift' },
  { keyword: 'jewelry', category: 'thrift' },
  
  // Electronics
  { keyword: 'phone', category: 'electronics' },
  { keyword: 'laptop', category: 'electronics' },
  { keyword: 'computer', category: 'electronics' },
  { keyword: 'gadget', category: 'electronics' },
  { keyword: 'tech', category: 'electronics' },
  { keyword: 'mobile', category: 'electronics' },
  { keyword: 'tablet', category: 'electronics' },
  { keyword: 'camera', category: 'electronics' },
  { keyword: 'headphones', category: 'electronics' },
  { keyword: 'speaker', category: 'electronics' },
  
  // Food/Catering
  { keyword: 'food', category: 'catering' },
  { keyword: 'catering', category: 'catering' },
  { keyword: 'restaurant', category: 'catering' },
  { keyword: 'meal', category: 'catering' },
  { keyword: 'cooking', category: 'catering' },
  { keyword: 'kitchen', category: 'catering' },
  { keyword: 'cafe', category: 'catering' },
  { keyword: 'bakery', category: 'catering' },
  { keyword: 'delivery', category: 'catering' },
  
  // Jobs
  { keyword: 'job', category: 'jobs' },
  { keyword: 'work', category: 'jobs' },
  { keyword: 'employment', category: 'jobs' },
  { keyword: 'career', category: 'jobs' },
  { keyword: 'position', category: 'jobs' },
  { keyword: 'hiring', category: 'jobs' },
  { keyword: 'recruitment', category: 'jobs' },
  { keyword: 'vacancy', category: 'jobs' },
  { keyword: 'staff', category: 'jobs' },
  { keyword: 'employee', category: 'jobs' },
  
  // Real Estate
  { keyword: 'house', category: 'real-estate' },
  { keyword: 'property', category: 'real-estate' },
  { keyword: 'rent', category: 'real-estate' },
  { keyword: 'buy', category: 'real-estate' },
  { keyword: 'apartment', category: 'real-estate' },
  { keyword: 'home', category: 'real-estate' },
  { keyword: 'flat', category: 'real-estate' },
  { keyword: 'villa', category: 'real-estate' },
  { keyword: 'land', category: 'real-estate' },
  { keyword: 'plot', category: 'real-estate' },
  
  // Raw Materials
  { keyword: 'materials', category: 'raw-materials-industrial' },
  { keyword: 'industrial', category: 'raw-materials-industrial' },
  { keyword: 'manufacturing', category: 'raw-materials-industrial' },
  { keyword: 'supplies', category: 'raw-materials-industrial' },
  { keyword: 'components', category: 'raw-materials-industrial' },
  { keyword: 'parts', category: 'raw-materials-industrial' },
  { keyword: 'equipment', category: 'raw-materials-industrial' },
  { keyword: 'machinery', category: 'raw-materials-industrial' },
  { keyword: 'tools', category: 'raw-materials-industrial' },
  { keyword: 'hardware', category: 'raw-materials-industrial' },
  { keyword: 'fuel', category: 'raw-materials-industrial' },
  { keyword: 'oil', category: 'raw-materials-industrial' },
  { keyword: 'crude oil', category: 'raw-materials-industrial' },
  { keyword: 'petroleum', category: 'raw-materials-industrial' },
  { keyword: 'diesel', category: 'raw-materials-industrial' },
  { keyword: 'gas', category: 'raw-materials-industrial' },
  { keyword: 'petrol', category: 'raw-materials-industrial' },
  { keyword: 'chemicals', category: 'raw-materials-industrial' },
  { keyword: 'steel', category: 'raw-materials-industrial' },
  { keyword: 'metal', category: 'raw-materials-industrial' },
  { keyword: 'plastic', category: 'raw-materials-industrial' },
  { keyword: 'rubber', category: 'raw-materials-industrial' },
  { keyword: 'cement', category: 'raw-materials-industrial' },
  { keyword: 'lumber', category: 'raw-materials-industrial' },
  { keyword: 'timber', category: 'raw-materials-industrial' },
  
  // Construction
  { keyword: 'construction', category: 'construction' },
  { keyword: 'building', category: 'construction' },
  { keyword: 'contractor', category: 'construction' },
  { keyword: 'renovation', category: 'construction' },
  { keyword: 'repair', category: 'construction' },
  { keyword: 'maintenance', category: 'construction' },
  { keyword: 'plumbing', category: 'construction' },
  { keyword: 'electrical', category: 'construction' },
  { keyword: 'painting', category: 'construction' },
  { keyword: 'roofing', category: 'construction' },
  
  // Healthcare
  { keyword: 'healthcare', category: 'healthcare' },
  { keyword: 'medical', category: 'healthcare' },
  { keyword: 'doctor', category: 'healthcare' },
  { keyword: 'nurse', category: 'healthcare' },
  { keyword: 'hospital', category: 'healthcare' },
  { keyword: 'clinic', category: 'healthcare' },
  { keyword: 'pharmacy', category: 'healthcare' },
  { keyword: 'therapy', category: 'healthcare' },
  { keyword: 'wellness', category: 'healthcare' },
  { keyword: 'fitness', category: 'healthcare' },
  
  // Education
  { keyword: 'education', category: 'education' },
  { keyword: 'school', category: 'education' },
  { keyword: 'college', category: 'education' },
  { keyword: 'university', category: 'education' },
  { keyword: 'tutoring', category: 'education' },
  { keyword: 'training', category: 'education' },
  { keyword: 'course', category: 'education' },
  { keyword: 'teacher', category: 'education' },
  { keyword: 'tuition', category: 'education' },
  { keyword: 'learning', category: 'education' },
  
  // Events
  { keyword: 'events', category: 'wedding-events' },
  { keyword: 'wedding', category: 'wedding-events' },
  { keyword: 'party', category: 'wedding-events' },
  { keyword: 'celebration', category: 'wedding-events' },
  { keyword: 'function', category: 'wedding-events' },
  { keyword: 'ceremony', category: 'wedding-events' },
  { keyword: 'reception', category: 'wedding-events' },
  { keyword: 'anniversary', category: 'wedding-events' },
  { keyword: 'birthday', category: 'wedding-events' },
  { keyword: 'festival', category: 'wedding-events' },
  
  // Waste Management
  { keyword: 'waste', category: 'waste-management' },
  { keyword: 'recycling', category: 'waste-management' },
  { keyword: 'garbage', category: 'waste-management' },
  { keyword: 'trash', category: 'waste-management' },
  { keyword: 'disposal', category: 'waste-management' },
  { keyword: 'cleaning', category: 'waste-management' },
  { keyword: 'hygiene', category: 'waste-management' },
  { keyword: 'sanitation', category: 'waste-management' },
  { keyword: 'environment', category: 'waste-management' },
  
  // Other
  { keyword: 'service', category: 'other' },
  { keyword: 'help', category: 'other' },
  { keyword: 'support', category: 'other' },
  { keyword: 'consultation', category: 'other' },
  { keyword: 'assistance', category: 'other' },
  { keyword: 'general', category: 'other' }
];

export class KeywordSearchService {
  private static normalizeKeyword(keyword: string): string {
    return keyword.toLowerCase().trim();
  }

  static getCategoryForKeyword(searchTerm: string): string | null {
    const normalizedTerm = this.normalizeKeyword(searchTerm);
    
    // Exact match only - no partial matching to prevent cross-contamination
    const exactMatch = keywordMappings.find(
      mapping => this.normalizeKeyword(mapping.keyword) === normalizedTerm
    );
    
    if (exactMatch) {
      return exactMatch.category;
    }
    
    // No partial matching to prevent "fuel" matching with other words
    return null;
  }

  static getSearchSuggestions(partialKeyword: string, limit: number = 5): string[] {
    const normalizedPartial = this.normalizeKeyword(partialKeyword);
    
    if (normalizedPartial.length < 2) return [];
    
    const suggestions = keywordMappings
      .filter(mapping => 
        this.normalizeKeyword(mapping.keyword).includes(normalizedPartial) ||
        normalizedPartial.includes(this.normalizeKeyword(mapping.keyword))
      )
      .map(mapping => mapping.keyword)
      .slice(0, limit);
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  static searchEnquiries(enquiries: any[], searchTerm: string): {
    results: any[];
    searchedCategory: string | null;
    noResultsInCategory: boolean;
    showAllFallback: boolean;
  } {
    const searchedCategory = this.getCategoryForKeyword(searchTerm);
    
    if (!searchedCategory) {
      // Unknown keyword - show all enquiries
      return {
        results: enquiries,
        searchedCategory: null,
        noResultsInCategory: false,
        showAllFallback: true
      };
    }
    
    // Filter enquiries by category
    const categoryResults = enquiries.filter(enquiry => 
      enquiry.category === searchedCategory || 
      (enquiry.categories && enquiry.categories.includes(searchedCategory))
    );
    
    if (categoryResults.length === 0) {
      // No results in category - show message + all enquiries
      return {
        results: enquiries,
        searchedCategory,
        noResultsInCategory: true,
        showAllFallback: true
      };
    }
    
    return {
      results: categoryResults,
      searchedCategory,
      noResultsInCategory: false,
      showAllFallback: false
    };
  }
}

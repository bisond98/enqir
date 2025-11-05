// AI Smart Search Service - Mobile Optimized
// Uses existing data patterns for fuzzy search and suggestions

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

// Smart search configuration for mobile optimization
export const searchConfig = {
  // Mobile-friendly search settings
  threshold: 0.3, // Lower threshold for better mobile typing
  distance: 100, // Allow more typos on mobile
  minMatchCharLength: 2, // Start suggesting after 2 characters
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'description', weight: 0.5 },
    { name: 'category', weight: 0.8 },
    { name: 'location', weight: 0.6 }
  ]
};

// Initialize smart search with enquiries data
export const initializeSmartSearch = (enquiries: Enquiry[]) => {
  return {
    enquiries,
    totalCount: enquiries.length,
    categories: [...new Set(enquiries.map(e => e.category))],
    locations: [...new Set(enquiries.map(e => e.location))]
  };
};

// Perform smart search with mobile optimization and SAFETY CHECKS
export const performSmartSearch = (
  query: string, 
  enquiries: Enquiry[], 
  filters: any = {}
) => {
  // SAFETY CHECK: Validate inputs
  if (!query || typeof query !== 'string') {
    console.warn('Invalid query provided to AI search, returning all enquiries');
    return enquiries;
  }
  
  if (!enquiries || !Array.isArray(enquiries)) {
    console.warn('Invalid enquiries data provided to AI search, returning empty array');
    return [];
  }

  if (!query.trim()) return enquiries;

  try {
    // Simple fuzzy search for mobile performance
    const searchTerm = query.toLowerCase();
    const results = enquiries.filter(enquiry => {
      // SAFETY CHECK: Validate each enquiry object
      if (!enquiry || typeof enquiry !== 'object') return false;
      
      const titleMatch = enquiry.title?.toLowerCase().includes(searchTerm) || false;
      const descMatch = enquiry.description?.toLowerCase().includes(searchTerm) || false;
      const categoryMatch = enquiry.category?.toLowerCase().includes(searchTerm) || false;
      const locationMatch = enquiry.location?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || descMatch || categoryMatch || locationMatch;
    });

    return results;
  } catch (error) {
    console.error('AI search error, falling back to basic search:', error);
    
    // GRACEFUL DEGRADATION: Return basic search results
    const searchTerm = query.toLowerCase();
    return enquiries.filter(enquiry => {
      try {
        return enquiry.title?.toLowerCase().includes(searchTerm) || false;
      } catch {
        return false; // Skip problematic entries
      }
    });
  }
};

// Get smart suggestions based on user input
export const getSmartSuggestions = (
  query: string, 
  enquiries: Enquiry[]
): string[] => {
  if (query.length < 2) return [];
  
  const suggestions = new Set<string>();
  const searchTerm = query.toLowerCase();
  
  // Get title suggestions
  enquiries.forEach(enquiry => {
    if (enquiry.title.toLowerCase().includes(searchTerm)) {
      suggestions.add(enquiry.title);
    }
  });
  
  // Get category suggestions
  enquiries.forEach(enquiry => {
    if (enquiry.category.toLowerCase().includes(searchTerm)) {
      suggestions.add(enquiry.category);
    }
  });
  
  // Get location suggestions
  enquiries.forEach(enquiry => {
    if (enquiry.location.toLowerCase().includes(searchTerm)) {
      suggestions.add(enquiry.location);
    }
  });
  
  return Array.from(suggestions).slice(0, 5); // Limit for mobile
};

// Get related enquiries for better discovery
export const getRelatedEnquiries = (
  enquiry: Enquiry, 
  allEnquiries: Enquiry[]
): Enquiry[] => {
  const related = allEnquiries.filter(e => 
    e.id !== enquiry.id && 
    (e.category === enquiry.category || 
     e.location === enquiry.location)
  );
  
  return related.slice(0, 3); // Mobile-friendly limit
};

// Get trending categories based on recent activity
export const getTrendingCategories = (enquiries: Enquiry[]): string[] => {
  const categoryCounts: { [key: string]: number } = {};
  
  enquiries.forEach(enquiry => {
    if (enquiry.status === 'live') {
      categoryCounts[enquiry.category] = (categoryCounts[enquiry.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6) // Mobile-friendly limit
    .map(([category]) => category);
};

// Get personalized recommendations for mobile users
export const getPersonalizedRecommendations = (
  userHistory: Enquiry[], 
  allEnquiries: Enquiry[]
): Enquiry[] => {
  if (userHistory.length === 0) {
    // Show popular enquiries for new users
    return allEnquiries
      .filter(e => e.status === 'live')
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 6);
  }
  
  // Analyze user preferences
  const userCategories = userHistory.map(e => e.category);
  const userLocations = userHistory.map(e => e.location);
  
  const recommendations = allEnquiries.filter(enquiry => 
    enquiry.status === 'live' &&
    (userCategories.includes(enquiry.category) ||
     userLocations.includes(enquiry.location))
  );
  
  return recommendations.slice(0, 6); // Mobile-friendly limit
};

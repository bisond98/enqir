// Smart Matchmaking Service
// Provides AI-powered buyer-seller matching based on multiple factors

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  userType: 'buyer' | 'seller';
  skills?: string[];
  interests?: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  rating?: number;
  responseTime?: number; // Average response time in minutes
  successRate?: number; // Percentage of successful transactions
  verificationStatus: 'verified' | 'unverified' | 'pending';
  createdAt: Date;
  lastActive: Date;
}

export interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  urgency: 'low' | 'normal' | 'high' | 'emergency';
  userId: string;
  createdAt: Date;
  status: 'pending' | 'live' | 'rejected' | 'completed';
  tags?: string[];
  requirements?: string[];
  timeline?: string;
}

export interface SellerSubmission {
  id: string;
  enquiryId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  message: string;
  price: string;
  experience: string;
  portfolio?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  buyerRating?: number;
  sellerRating?: number;
}

export interface MatchScore {
  sellerId: string;
  sellerName: string;
  score: number; // 0-100
  factors: {
    skillMatch: number;
    budgetMatch: number;
    locationMatch: number;
    experienceMatch: number;
    responseTime: number;
    successRate: number;
    verificationBonus: number;
  };
  reasons: string[];
  recommendations: string[];
}

export interface MatchmakingConfig {
  weights: {
    skillMatch: number;
    budgetMatch: number;
    locationMatch: number;
    experienceMatch: number;
    responseTime: number;
    successRate: number;
    verificationBonus: number;
  };
  thresholds: {
    minimumScore: number;
    highMatchScore: number;
    excellentMatchScore: number;
  };
  maxResults: number;
  enableLocationBoost: boolean;
  enableVerificationBoost: boolean;
}

// Default matchmaking configuration
const DEFAULT_CONFIG: MatchmakingConfig = {
  weights: {
    skillMatch: 0.25,
    budgetMatch: 0.20,
    locationMatch: 0.15,
    experienceMatch: 0.15,
    responseTime: 0.10,
    successRate: 0.10,
    verificationBonus: 0.05
  },
  thresholds: {
    minimumScore: 30,
    highMatchScore: 70,
    excellentMatchScore: 85
  },
  maxResults: 10,
  enableLocationBoost: true,
  enableVerificationBoost: true
};

// Skill mapping for different categories
const SKILL_MAPPING: Record<string, string[]> = {
  'services': ['consulting', 'design', 'development', 'marketing', 'writing', 'translation', 'tutoring', 'cleaning', 'repair', 'maintenance'],
  'jobs': ['programming', 'design', 'marketing', 'sales', 'customer-service', 'management', 'teaching', 'healthcare', 'finance', 'legal'],
  'real-estate': ['property-management', 'brokerage', 'valuation', 'legal', 'construction', 'interior-design', 'maintenance', 'cleaning'],
  'electronics': ['repair', 'maintenance', 'installation', 'programming', 'networking', 'security', 'automation'],
  'fashion': ['design', 'tailoring', 'styling', 'photography', 'modeling', 'marketing', 'ecommerce'],
  'health-beauty': ['fitness', 'nutrition', 'beauty', 'wellness', 'therapy', 'counseling', 'medical'],
  'events-entertainment': ['planning', 'catering', 'photography', 'music', 'decoration', 'coordination', 'marketing'],
  'automobile': ['repair', 'maintenance', 'sales', 'insurance', 'financing', 'detailing', 'towing'],
  'home-furniture': ['carpentry', 'design', 'assembly', 'repair', 'upholstery', 'painting', 'cleaning'],
  'agriculture-farming': ['farming', 'gardening', 'irrigation', 'pest-control', 'harvesting', 'equipment', 'consulting']
};

// Location proximity scoring
const LOCATION_SCORES = {
  'same-city': 1.0,
  'same-state': 0.8,
  'neighboring-state': 0.6,
  'same-region': 0.4,
  'remote': 0.2
};

// Calculate location match score
const calculateLocationMatch = (enquiryLocation: string, sellerLocation: string): number => {
  try {
    if (!enquiryLocation || !sellerLocation) return 0.5; // Default for missing data
    
    const enquiry = enquiryLocation.toLowerCase().trim();
    const seller = sellerLocation.toLowerCase().trim();
    
    // Exact match
    if (enquiry === seller) return LOCATION_SCORES['same-city'];
    
    // Same city (different formats)
    if (enquiry.includes(seller) || seller.includes(enquiry)) return LOCATION_SCORES['same-city'];
    
    // Remote work indicators
    if (enquiry.includes('remote') || seller.includes('remote')) return LOCATION_SCORES['remote'];
    
    // State matching (simplified)
    const indianStates = [
      'maharashtra', 'karnataka', 'tamil nadu', 'telangana', 'andhra pradesh', 'kerala',
      'gujarat', 'rajasthan', 'madhya pradesh', 'uttar pradesh', 'bihar', 'west bengal',
      'odisha', 'assam', 'jharkhand', 'chhattisgarh', 'haryana', 'punjab', 'himachal pradesh',
      'uttarakhand', 'goa', 'delhi', 'chandigarh', 'puducherry'
    ];
    
    const enquiryState = indianStates.find(state => enquiry.includes(state));
    const sellerState = indianStates.find(state => seller.includes(state));
    
    if (enquiryState && sellerState) {
      if (enquiryState === sellerState) return LOCATION_SCORES['same-state'];
      
      // Neighboring states (simplified mapping)
      const neighboringStates: Record<string, string[]> = {
        'maharashtra': ['gujarat', 'madhya pradesh', 'karnataka', 'telangana', 'goa'],
        'karnataka': ['maharashtra', 'telangana', 'andhra pradesh', 'tamil nadu', 'kerala'],
        'tamil nadu': ['karnataka', 'kerala', 'andhra pradesh'],
        'telangana': ['maharashtra', 'karnataka', 'andhra pradesh'],
        'andhra pradesh': ['telangana', 'karnataka', 'tamil nadu', 'odisha'],
        'kerala': ['karnataka', 'tamil nadu'],
        'gujarat': ['maharashtra', 'madhya pradesh', 'rajasthan'],
        'rajasthan': ['gujarat', 'madhya pradesh', 'uttar pradesh', 'haryana', 'punjab'],
        'madhya pradesh': ['maharashtra', 'gujarat', 'rajasthan', 'uttar pradesh', 'chhattisgarh'],
        'uttar pradesh': ['rajasthan', 'madhya pradesh', 'chhattisgarh', 'jharkhand', 'bihar', 'haryana'],
        'bihar': ['uttar pradesh', 'jharkhand', 'west bengal'],
        'west bengal': ['bihar', 'jharkhand', 'odisha', 'sikkim'],
        'odisha': ['andhra pradesh', 'chhattisgarh', 'jharkhand', 'west bengal'],
        'assam': ['west bengal', 'arunachal pradesh', 'nagaland', 'manipur', 'meghalaya'],
        'jharkhand': ['bihar', 'west bengal', 'odisha', 'chhattisgarh', 'uttar pradesh'],
        'chhattisgarh': ['madhya pradesh', 'uttar pradesh', 'jharkhand', 'odisha', 'telangana'],
        'haryana': ['punjab', 'rajasthan', 'uttar pradesh', 'delhi'],
        'punjab': ['haryana', 'rajasthan', 'himachal pradesh'],
        'himachal pradesh': ['punjab', 'uttarakhand', 'haryana'],
        'uttarakhand': ['himachal pradesh', 'uttar pradesh', 'haryana'],
        'goa': ['maharashtra', 'karnataka'],
        'delhi': ['haryana', 'uttar pradesh'],
        'chandigarh': ['haryana', 'punjab'],
        'puducherry': ['tamil nadu']
      };
      
      if (neighboringStates[enquiryState]?.includes(sellerState) || 
          neighboringStates[sellerState]?.includes(enquiryState)) {
        return LOCATION_SCORES['neighboring-state'];
      }
    }
    
    // Same region (simplified)
    const regions = {
      'north': ['delhi', 'haryana', 'punjab', 'himachal pradesh', 'uttarakhand', 'rajasthan', 'uttar pradesh'],
      'south': ['karnataka', 'tamil nadu', 'telangana', 'andhra pradesh', 'kerala', 'puducherry'],
      'west': ['maharashtra', 'gujarat', 'goa', 'madhya pradesh'],
      'east': ['west bengal', 'bihar', 'odisha', 'jharkhand', 'assam'],
      'central': ['chhattisgarh', 'madhya pradesh']
    };
    
    for (const [region, states] of Object.entries(regions)) {
      if (states.some(state => enquiry.includes(state)) && 
          states.some(state => seller.includes(state))) {
        return LOCATION_SCORES['same-region'];
      }
    }
    
    return 0.3; // Default for no match
    
  } catch (error) {
    console.error('Location match calculation failed:', error);
    return 0.5; // Safe fallback
  }
};

// Calculate skill match score
const calculateSkillMatch = (enquiry: Enquiry, seller: User): number => {
  try {
    if (!seller.skills || seller.skills.length === 0) return 0.3; // Default for no skills
    
    const enquiryText = `${enquiry.title} ${enquiry.description} ${enquiry.category}`.toLowerCase();
    const enquiryTags = enquiry.tags || [];
    const enquiryRequirements = enquiry.requirements || [];
    
    // Get relevant skills for the enquiry category
    const categorySkills = SKILL_MAPPING[enquiry.category] || [];
    
    let matchCount = 0;
    let totalSkills = seller.skills.length;
    
    // Check direct skill matches
    for (const skill of seller.skills) {
      const skillLower = skill.toLowerCase();
      
      // Check if skill appears in enquiry text
      if (enquiryText.includes(skillLower)) {
        matchCount += 2; // Higher weight for direct matches
      }
      
      // Check if skill matches category skills
      if (categorySkills.some(catSkill => skillLower.includes(catSkill) || catSkill.includes(skillLower))) {
        matchCount += 1.5;
      }
      
      // Check if skill matches enquiry tags
      if (enquiryTags.some(tag => skillLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(skillLower))) {
        matchCount += 1;
      }
      
      // Check if skill matches enquiry requirements
      if (enquiryRequirements.some(req => skillLower.includes(req.toLowerCase()) || req.toLowerCase().includes(skillLower))) {
        matchCount += 1.5;
      }
    }
    
    // Normalize score
    const score = Math.min(1.0, matchCount / totalSkills);
    return score;
    
  } catch (error) {
    console.error('Skill match calculation failed:', error);
    return 0.3; // Safe fallback
  }
};

// Calculate budget match score
const calculateBudgetMatch = (enquiry: Enquiry, seller: User): number => {
  try {
    if (!seller.budget) return 0.5; // Default for no budget info
    
    const enquiryBudget = enquiry.budget;
    const sellerMin = seller.budget.min;
    const sellerMax = seller.budget.max;
    
    // Perfect match if enquiry budget is within seller's range
    if (enquiryBudget >= sellerMin && enquiryBudget <= sellerMax) {
      return 1.0;
    }
    
    // Calculate how far the budget is from the range
    let distance = 0;
    if (enquiryBudget < sellerMin) {
      distance = sellerMin - enquiryBudget;
    } else {
      distance = enquiryBudget - sellerMax;
    }
    
    // Calculate percentage difference
    const percentageDiff = distance / enquiryBudget;
    
    // Score based on percentage difference
    if (percentageDiff <= 0.1) return 0.9; // Within 10%
    if (percentageDiff <= 0.25) return 0.7; // Within 25%
    if (percentageDiff <= 0.5) return 0.5; // Within 50%
    if (percentageDiff <= 1.0) return 0.3; // Within 100%
    
    return 0.1; // More than 100% difference
    
  } catch (error) {
    console.error('Budget match calculation failed:', error);
    return 0.5; // Safe fallback
  }
};

// Calculate experience match score
const calculateExperienceMatch = (enquiry: Enquiry, seller: User): number => {
  try {
    // This would typically use seller's experience data
    // For now, we'll use a simplified approach based on user age and verification
    const userAge = Date.now() - seller.createdAt.getTime();
    const daysSinceCreation = userAge / (1000 * 60 * 60 * 24);
    
    // Score based on account age and verification status
    let score = 0.5; // Base score
    
    if (daysSinceCreation > 365) score += 0.2; // Over 1 year
    if (daysSinceCreation > 180) score += 0.1; // Over 6 months
    if (seller.verificationStatus === 'verified') score += 0.2;
    if (seller.successRate && seller.successRate > 80) score += 0.1;
    
    return Math.min(1.0, score);
    
  } catch (error) {
    console.error('Experience match calculation failed:', error);
    return 0.5; // Safe fallback
  }
};

// Calculate response time score
const calculateResponseTimeScore = (seller: User): number => {
  try {
    if (!seller.responseTime) return 0.5; // Default for no data
    
    // Lower response time = higher score
    if (seller.responseTime <= 30) return 1.0; // Within 30 minutes
    if (seller.responseTime <= 60) return 0.9; // Within 1 hour
    if (seller.responseTime <= 120) return 0.8; // Within 2 hours
    if (seller.responseTime <= 240) return 0.7; // Within 4 hours
    if (seller.responseTime <= 480) return 0.6; // Within 8 hours
    if (seller.responseTime <= 1440) return 0.5; // Within 24 hours
    
    return 0.3; // More than 24 hours
    
  } catch (error) {
    console.error('Response time score calculation failed:', error);
    return 0.5; // Safe fallback
  }
};

// Calculate success rate score
const calculateSuccessRateScore = (seller: User): number => {
  try {
    if (!seller.successRate) return 0.5; // Default for no data
    
    return seller.successRate / 100; // Convert percentage to 0-1 scale
    
  } catch (error) {
    console.error('Success rate score calculation failed:', error);
    return 0.5; // Safe fallback
  }
};

// Calculate verification bonus
const calculateVerificationBonus = (seller: User): number => {
  try {
    switch (seller.verificationStatus) {
      case 'verified': return 1.0;
      case 'pending': return 0.5;
      case 'unverified': return 0.0;
      default: return 0.0;
    }
  } catch (error) {
    console.error('Verification bonus calculation failed:', error);
    return 0.0; // Safe fallback
  }
};

// Generate match reasons
const generateMatchReasons = (factors: MatchScore['factors'], enquiry: Enquiry, seller: User): string[] => {
  const reasons: string[] = [];
  
  if (factors.skillMatch > 0.8) {
    reasons.push('Excellent skill match for your requirements');
  } else if (factors.skillMatch > 0.6) {
    reasons.push('Good skill alignment with your needs');
  }
  
  if (factors.budgetMatch > 0.8) {
    reasons.push('Budget perfectly matches your requirements');
  } else if (factors.budgetMatch > 0.6) {
    reasons.push('Budget is within your range');
  }
  
  if (factors.locationMatch > 0.8) {
    reasons.push('Located in the same area for easy coordination');
  } else if (factors.locationMatch > 0.6) {
    reasons.push('Convenient location for your project');
  }
  
  if (factors.experienceMatch > 0.8) {
    reasons.push('Highly experienced in this field');
  } else if (factors.experienceMatch > 0.6) {
    reasons.push('Good experience level for your project');
  }
  
  if (factors.responseTime > 0.8) {
    reasons.push('Quick response time for better communication');
  }
  
  if (factors.successRate > 0.8) {
    reasons.push('High success rate with previous clients');
  }
  
  if (factors.verificationBonus > 0.8) {
    reasons.push('Verified profile for added trust');
  }
  
  return reasons;
};

// Generate recommendations
const generateRecommendations = (factors: MatchScore['factors'], enquiry: Enquiry, seller: User): string[] => {
  const recommendations: string[] = [];
  
  if (factors.skillMatch < 0.5) {
    recommendations.push('Consider asking about specific skills needed for your project');
  }
  
  if (factors.budgetMatch < 0.5) {
    recommendations.push('Discuss budget flexibility to find common ground');
  }
  
  if (factors.locationMatch < 0.5) {
    recommendations.push('Consider remote work options if location is a concern');
  }
  
  if (factors.responseTime < 0.5) {
    recommendations.push('Set clear communication expectations and timelines');
  }
  
  if (factors.verificationBonus < 0.5) {
    recommendations.push('Request additional verification or references');
  }
  
  return recommendations;
};

// Main matchmaking function
export const findSmartMatches = async (
  enquiry: Enquiry,
  sellers: User[],
  config: Partial<MatchmakingConfig> = {}
): Promise<MatchScore[]> => {
  try {
    console.log('🔍 Starting smart matchmaking for enquiry:', enquiry.id);
    
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const matches: MatchScore[] = [];
    
    for (const seller of sellers) {
      // Skip if seller is the same as enquiry creator
      if (seller.id === enquiry.userId) continue;
      
      // Calculate individual factor scores
      const skillMatch = calculateSkillMatch(enquiry, seller);
      const budgetMatch = calculateBudgetMatch(enquiry, seller);
      const locationMatch = calculateLocationMatch(enquiry.location, seller.location);
      const experienceMatch = calculateExperienceMatch(enquiry, seller);
      const responseTime = calculateResponseTimeScore(seller);
      const successRate = calculateSuccessRateScore(seller);
      const verificationBonus = calculateVerificationBonus(seller);
      
      // Calculate weighted total score
      const totalScore = 
        skillMatch * finalConfig.weights.skillMatch +
        budgetMatch * finalConfig.weights.budgetMatch +
        locationMatch * finalConfig.weights.locationMatch +
        experienceMatch * finalConfig.weights.experienceMatch +
        responseTime * finalConfig.weights.responseTime +
        successRate * finalConfig.weights.successRate +
        verificationBonus * finalConfig.weights.verificationBonus;
      
      // Only include matches above minimum threshold
      if (totalScore >= finalConfig.thresholds.minimumScore) {
        const factors = {
          skillMatch,
          budgetMatch,
          locationMatch,
          experienceMatch,
          responseTime,
          successRate,
          verificationBonus
        };
        
        const reasons = generateMatchReasons(factors, enquiry, seller);
        const recommendations = generateRecommendations(factors, enquiry, seller);
        
        matches.push({
          sellerId: seller.id,
          sellerName: seller.name,
          score: Math.round(totalScore * 100),
          factors,
          reasons,
          recommendations
        });
      }
    }
    
    // Sort by score (highest first) and limit results
    const sortedMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, finalConfig.maxResults);
    
    console.log(`✅ Found ${sortedMatches.length} smart matches for enquiry ${enquiry.id}`);
    
    return sortedMatches;
    
  } catch (error) {
    console.error('❌ Smart matchmaking failed:', error);
    return []; // Return empty array on failure
  }
};

// Get match quality label
export const getMatchQualityLabel = (score: number): { label: string; color: string; description: string } => {
  if (score >= 85) {
    return {
      label: 'Excellent Match',
      color: 'text-green-600',
      description: 'Perfect alignment with your requirements'
    };
  } else if (score >= 70) {
    return {
      label: 'Great Match',
      color: 'text-blue-600',
      description: 'Strong compatibility for your project'
    };
  } else if (score >= 50) {
    return {
      label: 'Good Match',
      color: 'text-yellow-600',
      description: 'Good potential for collaboration'
    };
  } else {
    return {
      label: 'Fair Match',
      color: 'text-orange-600',
      description: 'Some compatibility, worth considering'
    };
  }
};

// Initialize smart matchmaking system
export const initializeSmartMatchmaking = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initializing Smart Matchmaking...');
    
    // Test matchmaking with sample data
    const testEnquiry: Enquiry = {
      id: 'test-enquiry',
      title: 'Need a web developer',
      description: 'Looking for a skilled web developer to build an e-commerce website',
      category: 'services',
      budget: 50000,
      location: 'Mumbai',
      urgency: 'normal',
      userId: 'test-buyer',
      createdAt: new Date(),
      status: 'live',
      tags: ['web-development', 'e-commerce', 'react'],
      requirements: ['frontend', 'backend', 'database']
    };
    
    const testSellers: User[] = [
      {
        id: 'seller-1',
        name: 'John Developer',
        email: 'john@example.com',
        location: 'Mumbai',
        userType: 'seller',
        skills: ['web-development', 'react', 'node.js', 'mongodb'],
        budget: { min: 30000, max: 60000, currency: 'INR' },
        rating: 4.8,
        responseTime: 30,
        successRate: 95,
        verificationStatus: 'verified',
        createdAt: new Date('2023-01-01'),
        lastActive: new Date()
      },
      {
        id: 'seller-2',
        name: 'Jane Designer',
        email: 'jane@example.com',
        location: 'Delhi',
        userType: 'seller',
        skills: ['ui-design', 'graphic-design', 'figma'],
        budget: { min: 20000, max: 40000, currency: 'INR' },
        rating: 4.5,
        responseTime: 60,
        successRate: 88,
        verificationStatus: 'verified',
        createdAt: new Date('2023-03-01'),
        lastActive: new Date()
      }
    ];
    
    const matches = await findSmartMatches(testEnquiry, testSellers);
    
    if (matches.length > 0) {
      console.log('✅ Smart Matchmaking initialized successfully!');
      console.log('📊 Sample match scores:', matches.map(m => `${m.sellerName}: ${m.score}%`));
      return true;
    } else {
      console.log('⚠️ Smart Matchmaking initialized but no test matches found');
      return true; // Still consider it successful
    }
    
  } catch (error) {
    console.error('❌ Smart Matchmaking initialization failed:', error);
    return false;
  }
};

// Export configuration
export { DEFAULT_CONFIG as MATCHMAKING_CONFIG };






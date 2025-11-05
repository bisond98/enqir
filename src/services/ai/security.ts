// AI-Powered Security & Trust Service
// Provides fraud detection, behavioral analysis, and trust scoring

export interface SecurityScore {
  overall: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  confidence: number; // 0-1
  riskFactors: RiskFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface RiskFactor {
  type: 'behavior' | 'transaction' | 'verification' | 'pattern' | 'location';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  evidence: string[];
  mitigation: string;
}

export interface TrustLevel {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  score: number; // 0-100
  requirements: string[];
  benefits: string[];
  nextLevel: string;
}

export interface BehavioralPattern {
  type: 'normal' | 'suspicious' | 'anomalous';
  confidence: number;
  description: string;
  indicators: string[];
  riskScore: number;
}

export interface SecurityConfig {
  enableFraudDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableTrustScoring: boolean;
  enableRealTimeMonitoring: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  updateInterval: number; // milliseconds
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableFraudDetection: true,
  enableBehavioralAnalysis: true,
  enableTrustScoring: true,
  enableRealTimeMonitoring: true,
  riskThresholds: {
    low: 30,
    medium: 60,
    high: 80,
    critical: 90
  },
  updateInterval: 30000 // 30 seconds
};

// Initialize security service
export const initializeSecurity = async (config: Partial<SecurityConfig> = {}): Promise<boolean> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    console.log('🛡️ Security service initialized with config:', finalConfig);
    return true;
  } catch (error) {
    console.error('Security service initialization failed:', error);
    return false;
  }
};

// Analyze user behavior patterns
export const analyzeBehavioralPatterns = async (
  userData: any,
  activityHistory: any[],
  config: Partial<SecurityConfig> = {}
): Promise<BehavioralPattern> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (!finalConfig.enableBehavioralAnalysis) {
      return {
        type: 'normal',
        confidence: 0.5,
        description: 'Behavioral analysis disabled',
        indicators: ['Analysis not available'],
        riskScore: 0
      };
    }

    // Analyze posting patterns
    const postingFrequency = analyzePostingFrequency(activityHistory);
    const responsePatterns = analyzeResponsePatterns(activityHistory);
    const locationPatterns = analyzeLocationPatterns(activityHistory);
    const timePatterns = analyzeTimePatterns(activityHistory);

    // Calculate overall risk score
    const riskScore = calculateBehavioralRisk(
      postingFrequency,
      responsePatterns,
      locationPatterns,
      timePatterns
    );

    // Determine pattern type
    let type: 'normal' | 'suspicious' | 'anomalous' = 'normal';
    if (riskScore > finalConfig.riskThresholds.high) {
      type = 'anomalous';
    } else if (riskScore > finalConfig.riskThresholds.medium) {
      type = 'suspicious';
    }

    return {
      type,
      confidence: Math.min(0.9, 0.5 + (riskScore / 100) * 0.4),
      description: generateBehavioralDescription(type, riskScore),
      indicators: generateBehavioralIndicators(
        postingFrequency,
        responsePatterns,
        locationPatterns,
        timePatterns
      ),
      riskScore
    };

  } catch (error) {
    console.error('Behavioral analysis failed:', error);
    return {
      type: 'normal',
      confidence: 0.3,
      description: 'Unable to analyze behavior patterns',
      indicators: ['Analysis failed'],
      riskScore: 0
    };
  }
};

// Detect fraud patterns
export const detectFraudPatterns = async (
  userData: any,
  transactions: any[],
  config: Partial<SecurityConfig> = {}
): Promise<RiskFactor[]> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (!finalConfig.enableFraudDetection) {
      return [];
    }

    const riskFactors: RiskFactor[] = [];

    // Check for rapid posting patterns
    const rapidPosting = detectRapidPosting(transactions);
    if (rapidPosting.risk > 0) {
      riskFactors.push({
        type: 'behavior',
        severity: rapidPosting.severity,
        description: 'Unusual posting frequency detected',
        confidence: rapidPosting.confidence,
        evidence: rapidPosting.evidence,
        mitigation: 'Consider spacing out posts and verify account activity'
      });
    }

    // Check for location anomalies
    const locationAnomalies = detectLocationAnomalies(transactions);
    if (locationAnomalies.risk > 0) {
      riskFactors.push({
        type: 'location',
        severity: locationAnomalies.severity,
        description: 'Suspicious location patterns detected',
        confidence: locationAnomalies.confidence,
        evidence: locationAnomalies.evidence,
        mitigation: 'Verify account location and report if unauthorized'
      });
    }

    // Check for verification inconsistencies
    const verificationIssues = detectVerificationIssues(userData, transactions);
    if (verificationIssues.risk > 0) {
      riskFactors.push({
        type: 'verification',
        severity: verificationIssues.severity,
        description: 'Verification inconsistencies detected',
        confidence: verificationIssues.confidence,
        evidence: verificationIssues.evidence,
        mitigation: 'Complete ID verification and contact support if needed'
      });
    }

    return riskFactors;

  } catch (error) {
    console.error('Fraud detection failed:', error);
    return [];
  }
};

// Calculate trust level and score
export const calculateTrustLevel = async (
  userData: any,
  activityHistory: any[],
  verificationStatus: any,
  config: Partial<SecurityConfig> = {}
): Promise<TrustLevel> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (!finalConfig.enableTrustScoring) {
      return {
        level: 'Bronze',
        score: 0,
        requirements: ['Trust scoring disabled'],
        benefits: ['Basic platform access'],
        nextLevel: 'Enable trust scoring for benefits'
      };
    }

    // Calculate trust score based on multiple factors
    const verificationScore = calculateVerificationScore(verificationStatus);
    const activityScore = calculateActivityScore(activityHistory);
    const communityScore = calculateCommunityScore(activityHistory);
    const securityScore = calculateSecurityScore(userData);

    const totalScore = Math.round(
      (verificationScore * 0.3) +
      (activityScore * 0.3) +
      (communityScore * 0.2) +
      (securityScore * 0.2)
    );

    // Determine trust level
    let level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    if (totalScore >= 90) {
      level = 'Platinum';
    } else if (totalScore >= 75) {
      level = 'Gold';
    } else if (totalScore >= 50) {
      level = 'Silver';
    } else {
      level = 'Bronze';
    }

    return {
      level,
      score: totalScore,
      requirements: getTrustLevelRequirements(level),
      benefits: getTrustLevelBenefits(level),
      nextLevel: getNextLevelRequirements(level, totalScore)
    };

  } catch (error) {
    console.error('Trust level calculation failed:', error);
    return {
      level: 'Bronze',
      score: 0,
      requirements: ['Unable to calculate trust level'],
      benefits: ['Basic platform access'],
      nextLevel: 'Contact support for assistance'
    };
  }
};

// Get comprehensive security assessment
export const getSecurityAssessment = async (
  userData: any,
  activityHistory: any[],
  transactions: any[],
  config: Partial<SecurityConfig> = {}
): Promise<SecurityScore> => {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Get all security data
    const behavioralPatterns = await analyzeBehavioralPatterns(userData, activityHistory, finalConfig);
    const fraudPatterns = await detectFraudPatterns(userData, transactions, finalConfig);
    const trustLevel = await calculateTrustLevel(userData, activityHistory, userData.verification, finalConfig);

    // Calculate overall security score
    const securityScore = Math.max(0, 100 - (behavioralPatterns.riskScore + (fraudPatterns.length * 10)));

    // Determine overall risk level
    let overall: 'low' | 'medium' | 'high' | 'critical';
    if (securityScore >= 80) {
      overall = 'low';
    } else if (securityScore >= 60) {
      overall = 'medium';
    } else if (securityScore >= 40) {
      overall = 'high';
    } else {
      overall = 'critical';
    }

    // Generate recommendations
    const recommendations = generateSecurityRecommendations(
      behavioralPatterns,
      fraudPatterns,
      trustLevel,
      securityScore
    );

    return {
      overall,
      score: securityScore,
      confidence: Math.min(0.95, 0.7 + (securityScore / 100) * 0.25),
      riskFactors: fraudPatterns,
      recommendations,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Security assessment failed:', error);
    return {
      overall: 'medium',
      score: 50,
      confidence: 0.3,
      riskFactors: [],
      recommendations: ['Unable to complete security assessment. Contact support if needed.'],
      lastUpdated: new Date()
    };
  }
};

// Helper functions for behavioral analysis
const analyzePostingFrequency = (activityHistory: any[]) => {
  try {
    const recentPosts = activityHistory
      .filter(activity => activity.type === 'enquiry_posted')
      .slice(-10); // Last 10 posts

    if (recentPosts.length < 2) return { frequency: 'normal', risk: 0 };

    const timeBetweenPosts = recentPosts.map((post, index) => {
      if (index === 0) return 0;
      return post.timestamp - recentPosts[index - 1].timestamp;
    }).slice(1);

    const avgTimeBetween = timeBetweenPosts.reduce((a, b) => a + b, 0) / timeBetweenPosts.length;
    const minTime = Math.min(...timeBetweenPosts);

    // Detect rapid posting (less than 5 minutes between posts)
    if (minTime < 300000) { // 5 minutes in milliseconds
      return { frequency: 'rapid', risk: 0.7 };
    }

    // Detect very frequent posting (less than 1 hour average)
    if (avgTimeBetween < 3600000) { // 1 hour in milliseconds
      return { frequency: 'frequent', risk: 0.4 };
    }

    return { frequency: 'normal', risk: 0 };
  } catch (error) {
    return { frequency: 'unknown', risk: 0 };
  }
};

const analyzeResponsePatterns = (activityHistory: any[]) => {
  try {
    const responses = activityHistory.filter(activity => activity.type === 'response_submitted');
    
    if (responses.length === 0) return { pattern: 'no_responses', risk: 0.1 };

    // Check for very rapid responses (less than 2 minutes after enquiry)
    const rapidResponses = responses.filter(response => {
      const enquiry = activityHistory.find(a => 
        a.type === 'enquiry_posted' && a.enquiryId === response.enquiryId
      );
      if (!enquiry) return false;
      return (response.timestamp - enquiry.timestamp) < 120000; // 2 minutes
    });

    if (rapidResponses.length > responses.length * 0.5) {
      return { pattern: 'rapid_responses', risk: 0.6 };
    }

    return { pattern: 'normal', risk: 0 };
  } catch (error) {
    return { pattern: 'unknown', risk: 0 };
  }
};

const analyzeLocationPatterns = (activityHistory: any[]) => {
  try {
    const locations = activityHistory
      .filter(activity => activity.location)
      .map(activity => activity.location);

    if (locations.length < 2) return { pattern: 'single_location', risk: 0 };

    const uniqueLocations = new Set(locations);
    const locationVariety = uniqueLocations.size / locations.length;

    // High variety might indicate travel or multiple users
    if (locationVariety > 0.8 && locations.length > 5) {
      return { pattern: 'high_variety', risk: 0.3 };
    }

    return { pattern: 'normal', risk: 0 };
  } catch (error) {
    return { pattern: 'unknown', risk: 0 };
  }
};

const analyzeTimePatterns = (activityHistory: any[]) => {
  try {
    const activities = activityHistory
      .filter(activity => activity.timestamp)
      .map(activity => new Date(activity.timestamp).getHours());

    if (activities.length < 5) return { pattern: 'insufficient_data', risk: 0 };

    // Check for 24/7 activity (activity in all 6-hour blocks)
    const timeBlocks = [0, 6, 12, 18];
    const activeBlocks = timeBlocks.filter(block => 
      activities.some(hour => hour >= block && hour < block + 6)
    );

    if (activeBlocks.length === 4) {
      return { pattern: '24_7_activity', risk: 0.5 };
    }

    return { pattern: 'normal', risk: 0 };
  } catch (error) {
    return { pattern: 'unknown', risk: 0 };
  }
};

const calculateBehavioralRisk = (
  posting: any,
  responses: any,
  location: any,
  time: any
): number => {
  try {
    const risks = [posting.risk, responses.risk, location.risk, time.risk];
    const totalRisk = risks.reduce((sum, risk) => sum + risk, 0);
    return Math.min(100, totalRisk * 100);
  } catch (error) {
    return 0;
  }
};

// Helper functions for fraud detection
const detectRapidPosting = (transactions: any[]) => {
  try {
    const recentPosts = transactions
      .filter(t => t.type === 'enquiry_posted')
      .slice(-5);

    if (recentPosts.length < 2) return { risk: 0, severity: 'low', confidence: 0, evidence: [] };

    const timeBetweenPosts = recentPosts.map((post, index) => {
      if (index === 0) return 0;
      return post.timestamp - recentPosts[index - 1].timestamp;
    }).slice(1);

    const minTime = Math.min(...timeBetweenPosts);
    
    if (minTime < 60000) { // Less than 1 minute
      return {
        risk: 0.9,
        severity: 'critical',
        confidence: 0.8,
        evidence: [`Posts made ${Math.round(minTime / 1000)} seconds apart`]
      };
    } else if (minTime < 300000) { // Less than 5 minutes
      return {
        risk: 0.6,
        severity: 'high',
        confidence: 0.7,
        evidence: [`Posts made ${Math.round(minTime / 60000)} minutes apart`]
      };
    }

    return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
  } catch (error) {
    return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
  }
};

const detectLocationAnomalies = (transactions: any[]) => {
  try {
    const locations = transactions
      .filter(t => t.location)
      .map(t => t.location);

    if (locations.length < 2) return { risk: 0, severity: 'low', confidence: 0, evidence: [] };

    const uniqueLocations = new Set(locations);
    
    if (uniqueLocations.size > 3 && locations.length < 10) {
      return {
        risk: 0.5,
        severity: 'medium',
        confidence: 0.6,
        evidence: [`Activity from ${uniqueLocations.size} different locations`]
      };
    }

    return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
  } catch (error) {
    return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
  }
};

const detectVerificationIssues = (userData: any, transactions: any[]) => {
  try {
    const issues: string[] = [];
    let risk = 0;

    // Check if user has verification but recent activity suggests issues
    if (userData.verification?.status === 'verified' && transactions.length > 0) {
      const recentActivity = transactions.slice(-5);
      const unverifiedActivity = recentActivity.filter(t => !t.verificationStatus);
      
      if (unverifiedActivity.length > recentActivity.length * 0.6) {
        issues.push('Recent activity lacks verification');
        risk += 0.3;
      }
    }

    // Check for verification status changes
    if (userData.verification?.status === 'pending' && transactions.length > 10) {
      issues.push('High activity with pending verification');
      risk += 0.4;
    }

    if (risk === 0) {
      return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
    }

    const severity: 'low' | 'medium' | 'high' | 'critical' = 
      risk > 0.6 ? 'high' : risk > 0.3 ? 'medium' : 'low';

    return {
      risk,
      severity,
      confidence: Math.min(0.8, risk + 0.3),
      evidence: issues
    };
  } catch (error) {
    return { risk: 0, severity: 'low', confidence: 0, evidence: [] };
  }
};

// Helper functions for trust scoring
const calculateVerificationScore = (verificationStatus: any): number => {
  try {
    if (!verificationStatus) return 0;
    
    switch (verificationStatus.status) {
      case 'verified': return 100;
      case 'pending': return 50;
      case 'rejected': return 0;
      default: return 25;
    }
  } catch (error) {
    return 0;
  }
};

const calculateActivityScore = (activityHistory: any[]): number => {
  try {
    if (activityHistory.length === 0) return 0;
    
    const totalActivities = activityHistory.length;
    const recentActivities = activityHistory.filter(activity => {
      const daysAgo = (Date.now() - activity.timestamp) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30; // Last 30 days
    }).length;

    // Score based on activity consistency
    const consistencyScore = Math.min(100, (recentActivities / Math.max(1, totalActivities / 3)) * 100);
    const volumeScore = Math.min(100, Math.min(totalActivities * 2, 100));
    
    return Math.round((consistencyScore + volumeScore) / 2);
  } catch (error) {
    return 0;
  }
};

const calculateCommunityScore = (activityHistory: any[]): number => {
  try {
    const responses = activityHistory.filter(a => a.type === 'response_submitted').length;
    const enquiries = activityHistory.filter(a => a.type === 'enquiry_posted').length;
    
    if (enquiries === 0) return 0;
    
    const responseRatio = responses / enquiries;
    return Math.min(100, Math.round(responseRatio * 100));
  } catch (error) {
    return 0;
  }
};

const calculateSecurityScore = (userData: any): number => {
  try {
    let score = 50; // Base score
    
    // Add points for security features
    if (userData.emailVerified) score += 20;
    if (userData.phoneVerified) score += 15;
    if (userData.verification?.status === 'verified') score += 15;
    
    return Math.min(100, score);
  } catch (error) {
    return 50;
  }
};

// Helper functions for trust levels
const getTrustLevelRequirements = (level: string): string[] => {
  switch (level) {
    case 'Platinum':
      return ['Complete ID verification', '100+ successful transactions', 'Excellent community rating'];
    case 'Gold':
      return ['ID verification', '50+ successful transactions', 'Good community rating'];
    case 'Silver':
      return ['Basic verification', '25+ successful transactions', 'Positive community rating'];
    default:
      return ['Complete profile', 'Start posting enquiries', 'Build community reputation'];
  }
};

const getTrustLevelBenefits = (level: string): string[] => {
  switch (level) {
    case 'Platinum':
      return ['Priority support', 'Advanced features access', 'Trusted seller badge', 'Faster response times'];
    case 'Gold':
      return ['Enhanced features', 'Trusted user badge', 'Better visibility', 'Community recognition'];
    case 'Silver':
      return ['Standard features', 'User badge', 'Platform access', 'Community participation'];
    default:
      return ['Basic platform access', 'Post enquiries', 'Respond to others', 'Build reputation'];
  }
};

const getNextLevelRequirements = (currentLevel: string, currentScore: number): string => {
  switch (currentLevel) {
    case 'Bronze':
      return 'Complete ID verification and post 10+ enquiries to reach Silver';
    case 'Silver':
      return 'Maintain positive rating and complete 25+ transactions to reach Gold';
    case 'Gold':
      return 'Achieve excellent community rating and 100+ transactions to reach Platinum';
    default:
      return 'You have reached the highest trust level!';
  }
};

// Helper functions for recommendations
const generateBehavioralDescription = (type: string, riskScore: number): string => {
  switch (type) {
    case 'anomalous':
      return 'Unusual activity patterns detected that may require attention';
    case 'suspicious':
      return 'Some activity patterns suggest potential concerns';
    default:
      return 'User behavior appears normal and consistent';
  }
};

const generateBehavioralIndicators = (
  posting: any,
  responses: any,
  location: any,
  time: any
): string[] => {
  const indicators: string[] = [];
  
  if (posting.risk > 0) indicators.push(`Posting frequency: ${posting.frequency}`);
  if (responses.risk > 0) indicators.push(`Response patterns: ${responses.pattern}`);
  if (location.risk > 0) indicators.push(`Location patterns: ${location.pattern}`);
  if (time.risk > 0) indicators.push(`Time patterns: ${time.pattern}`);
  
  return indicators.length > 0 ? indicators : ['All behavioral indicators normal'];
};

const generateSecurityRecommendations = (
  behavioral: any,
  fraud: any[],
  trust: any,
  securityScore: number
): string[] => {
  const recommendations: string[] = [];
  
  if (behavioral.type === 'anomalous') {
    recommendations.push('Review recent account activity for unusual patterns');
  }
  
  if (fraud.length > 0) {
    recommendations.push('Address identified security concerns promptly');
  }
  
  if (trust.score < 50) {
    recommendations.push('Complete ID verification to improve trust level');
  }
  
  if (securityScore < 60) {
    recommendations.push('Enable two-factor authentication for enhanced security');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your account security is in good standing');
  }
  
  return recommendations;
};

// Export default configuration
export { DEFAULT_CONFIG as SECURITY_CONFIG };






import { db } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface DuplicateMatch {
  enquiryId: string;
  userId: string;
  title: string;
  description: string;
  createdAt: any;
  isSameUser: boolean;
  similarity: number; // Similarity percentage (0-100)
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
  confidence: number;
  reason: string;
}

export class DuplicateDetectionService {
  private static instance: DuplicateDetectionService;
  private readonly TIME_WINDOW_HOURS = 24;
  // AI Intelligence: Use 98% similarity threshold for same user accounts
  // Only flag enquiries from the same account that are 98%+ similar
  private readonly SAME_USER_THRESHOLD = 0.98; // 98% similarity for same user (AI-based detection)
  private readonly DIFFERENT_USER_THRESHOLD = 1.0; // Different users: exact match only (or don't flag)

  public static getInstance(): DuplicateDetectionService {
    if (!DuplicateDetectionService.instance) {
      DuplicateDetectionService.instance = new DuplicateDetectionService();
    }
    return DuplicateDetectionService.instance;
  }

  /**
   * Check for duplicate enquiries in the last 24 hours
   * A duplicate is defined as: same title, same description, same budget, same category, same location
   */
  async checkForDuplicates(
    title: string,
    description: string,
    userId: string,
    excludeEnquiryId?: string, // Exclude current enquiry from duplicate check
    budget?: number | string, // Budget/price to compare
    category?: string, // Category to compare
    location?: string // Location to compare
  ): Promise<DuplicateCheckResult> {
    try {
      console.log('🔍 Duplicate Detection: Checking for duplicates...', { 
        title: title.substring(0, 30), 
        userId,
        excludeEnquiryId: excludeEnquiryId || 'none',
        budget,
        category,
        location
      });

      // Calculate 24 hours ago timestamp
      const timestamp24HoursAgo = Timestamp.fromDate(
        new Date(Date.now() - this.TIME_WINDOW_HOURS * 60 * 60 * 1000)
      );

      // Query enquiries from last 24 hours
      const enquiriesQuery = query(
        collection(db, 'enquiries'),
        where('createdAt', '>=', timestamp24HoursAgo)
      );

      const querySnapshot = await getDocs(enquiriesQuery);
      const matches: DuplicateMatch[] = [];

      // Check each enquiry for similarity with different thresholds based on user
      querySnapshot.forEach((doc) => {
        const enquiry = doc.data();
        
        // CRITICAL: Skip the current enquiry itself (prevents self-matching)
        if (excludeEnquiryId && doc.id === excludeEnquiryId) {
          console.log('🔍 Duplicate Detection: Skipping current enquiry:', doc.id);
          return;
        }
        
        // Skip if it's a test enquiry or already rejected
        if (enquiry.status === 'rejected' || enquiry.status === 'deleted') {
          return;
        }

        // AI Intelligence: Calculate comprehensive similarity across ALL fields
        const isSameUser = enquiry.userId === userId;
        
        // Only check similarity for same user accounts (different users are not flagged)
        if (!isSameUser) {
          return; // Skip different user enquiries - don't flag them
        }
        
        // Calculate overall similarity including ALL fields: title, description, budget, category, location
        const overallSimilarity = this.calculateOverallSimilarity(
          title,
          description,
          budget,
          category,
          location,
          enquiry.title,
          enquiry.description,
          enquiry.budget,
          enquiry.category,
          enquiry.location
        );
        
        // Normalize text for exact comparison
        const normalize = (text: string): string => {
          return text
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');
        };
        
        const normTitle1 = normalize(title);
        const normTitle2 = normalize(enquiry.title);
        const normDesc1 = normalize(description);
        const normDesc2 = normalize(enquiry.description);
        
        // Check if title and description match exactly
        const titleMatches = normTitle1 === normTitle2;
        const descriptionMatches = normDesc1 === normDesc2;
        
        // Check budget/price match (convert to number for comparison)
        // CRITICAL: Only match if BOTH budgets are provided and equal
        // If either is missing, don't consider it a match (stricter)
        const normalizeBudget = (budgetValue: number | string | undefined): number | null => {
          if (budgetValue === undefined || budgetValue === null || budgetValue === '') return null;
          if (typeof budgetValue === 'string') {
            // Remove currency symbols and commas, extract number
            const numStr = budgetValue.replace(/[₹,\s]/g, '').trim();
            const num = parseFloat(numStr);
            return isNaN(num) ? null : num;
          }
          return budgetValue;
        };
        
        const currentBudget = normalizeBudget(budget);
        const enquiryBudget = normalizeBudget(enquiry.budget);
        // Budget matches ONLY if both are provided and equal (stricter - no match if either is null)
        const budgetMatches = currentBudget !== null && enquiryBudget !== null && currentBudget === enquiryBudget;
        
        // Check category match (normalize for comparison)
        // CRITICAL: Only match if BOTH categories are provided and equal
        const normalizeCategory = (cat: string | undefined): string | null => {
          if (!cat || cat.trim() === '') return null;
          return cat.trim().toLowerCase();
        };
        
        const currentCategory = normalizeCategory(category);
        const enquiryCategory = normalizeCategory(enquiry.category);
        // Category matches ONLY if both are provided and equal (stricter)
        const categoryMatches = currentCategory !== null && enquiryCategory !== null && currentCategory === enquiryCategory;
        
        // Check location match (normalize for comparison)
        // CRITICAL: Only match if BOTH locations are provided and equal
        const normalizeLocation = (loc: string | undefined): string | null => {
          if (!loc || loc.trim() === '') return null;
          return loc.trim().toLowerCase();
        };
        
        const currentLocation = normalizeLocation(location);
        const enquiryLocation = normalizeLocation(enquiry.location);
        // Location matches ONLY if both are provided and equal (stricter)
        const locationMatches = currentLocation !== null && enquiryLocation !== null && currentLocation === enquiryLocation;
        
        // STRICT: Only flag if overall similarity (ALL fields combined) is 98% or higher
        const similarityPercentage = overallSimilarity * 100;
        const shouldFlag = overallSimilarity >= this.SAME_USER_THRESHOLD; // Strict 98% threshold
        
        if (shouldFlag) {
          console.log('🤖 AI Duplicate Detection: Same user enquiry flagged for 98%+ overall similarity:', {
            enquiryId: doc.id,
            overallSimilarity: Math.round(similarityPercentage),
            threshold: Math.round(this.SAME_USER_THRESHOLD * 100),
            title1: title.substring(0, 50),
            title2: enquiry.title.substring(0, 50),
            desc1: description.substring(0, 50),
            desc2: enquiry.description.substring(0, 50),
            budget1: budget,
            budget2: enquiry.budget,
            category1: category,
            category2: enquiry.category,
            location1: location,
            location2: enquiry.location
          });
        } else if (overallSimilarity >= 0.90) {
          // Log near-misses for debugging (90-98% range)
          console.log('🔍 AI Duplicate Detection: Same user enquiry below 98% threshold:', {
            enquiryId: doc.id,
            overallSimilarity: Math.round(similarityPercentage),
            threshold: Math.round(this.SAME_USER_THRESHOLD * 100),
            reason: 'Overall similarity must be 98%+ to flag'
          });
        }
        
        if (shouldFlag) {
          const similarityPercentage = Math.round(overallSimilarity * 100);
          console.log('✅ AI Duplicate Detection: Match found and flagged (98%+ overall similarity)!', {
            enquiryId: doc.id,
            isSameUser: true,
            overallSimilarity: similarityPercentage,
            threshold: Math.round(this.SAME_USER_THRESHOLD * 100)
          });
          matches.push({
            enquiryId: doc.id,
            userId: enquiry.userId,
            title: enquiry.title,
            description: enquiry.description,
            createdAt: enquiry.createdAt,
            isSameUser: true,
            similarity: similarityPercentage // Store as percentage (0-100)
          });
        }
      });

      // Sort matches by similarity (highest first)
      matches.sort((a, b) => b.similarity - a.similarity);

      // Only flag as duplicate if we have matches that meet the strict criteria
      const isDuplicate = matches.length > 0;
      const confidence = isDuplicate ? Math.round(matches[0].similarity) : 0; // Use highest similarity as confidence

      let reason = '';
      if (isDuplicate) {
        const sameUserMatches = matches.filter(m => m.isSameUser);
        const differentUserMatches = matches.filter(m => !m.isSameUser);
        
        if (sameUserMatches.length > 0) {
          // AI Intelligence: Flag based on 98%+ similarity from same account
          const highestSimilarity = sameUserMatches[0].similarity;
          reason = `AI detected ${sameUserMatches.length} similar enquiry(ies) from your account (${Math.round(highestSimilarity)}% similarity). Flagged for manual review to prevent duplicates.`;
        } else if (differentUserMatches.length > 0) {
          // Different user matches (if enabled)
          reason = `Duplicate detected: ${differentUserMatches.length} exact match(es) from different account(s).`;
        } else {
          reason = `Duplicate detected: ${matches.length} similar enquiry(ies) found.`;
        }
      } else {
        reason = 'No duplicates found - enquiry is unique';
      }

      console.log('🔍 Duplicate Detection Result:', {
        isDuplicate,
        matchCount: matches.length,
        reason,
        matches: matches.map(m => ({
          enquiryId: m.enquiryId,
          isSameUser: m.isSameUser,
          similarity: m.similarity
        }))
      });
      
      // CRITICAL: Log if no duplicates found to help debug false positives
      if (!isDuplicate) {
        console.log('✅ Duplicate Detection: No duplicates found. Enquiry is unique and should be approved.');
      }

      return {
        isDuplicate,
        matches,
        confidence,
        reason
      };

    } catch (error) {
      console.error('🔍 Duplicate Detection Error:', error);
      // On error, don't block submission - return no duplicates
      return {
        isDuplicate: false,
        matches: [],
        confidence: 0,
        reason: 'Duplicate check failed - proceeding with normal review'
      };
    }
  }

  /**
   * STRICT: Calculate overall similarity across ALL fields (title, description, budget, category, location)
   * Only flags if overall similarity is 98%+ (combining all fields)
   * Returns a value between 0 and 1 (1 = identical, 0 = completely different)
   */
  private calculateOverallSimilarity(
    title1: string,
    description1: string,
    budget1: number | string | undefined,
    category1: string | undefined,
    location1: string | undefined,
    title2: string,
    description2: string,
    budget2: number | string | undefined,
    category2: string | undefined,
    location2: string | undefined
  ): number {
    // Calculate text similarity (title + description) - 60% weight
    const textSimilarity = this.calculateTextSimilarity(title1, description1, title2, description2);
    
    // Calculate budget similarity - 15% weight
    const budgetSimilarity = this.calculateBudgetSimilarity(budget1, budget2);
    
    // Calculate category similarity - 10% weight
    const categorySimilarity = this.calculateCategorySimilarity(category1, category2);
    
    // Calculate location similarity - 15% weight
    const locationSimilarity = this.calculateLocationSimilarity(location1, location2);
    
    // Overall similarity: weighted combination of ALL fields
    const overallSimilarity = (textSimilarity * 0.60) + 
                               (budgetSimilarity * 0.15) + 
                               (categorySimilarity * 0.10) + 
                               (locationSimilarity * 0.15);
    
    return Math.min(1.0, Math.max(0.0, overallSimilarity)); // Clamp between 0 and 1
  }
  
  /**
   * Calculate text similarity (title + description)
   */
  private calculateTextSimilarity(
    title1: string,
    description1: string,
    title2: string,
    description2: string
  ): number {
    // Advanced normalization: preserve semantic meaning while normalizing
    const normalize = (text: string): string => {
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s]/g, ' '); // Replace punctuation with space (preserve word boundaries)
    };

    const normTitle1 = normalize(title1);
    const normTitle2 = normalize(title2);
    const normDesc1 = normalize(description1);
    const normDesc2 = normalize(description2);

    // AI Intelligence: Use multiple similarity algorithms and combine them
    // 1. Character-level similarity (Levenshtein)
    const titleCharSimilarity = this.calculateStringSimilarity(normTitle1, normTitle2);
    const descCharSimilarity = this.calculateStringSimilarity(normDesc1, normDesc2);
    
    // 2. Word-level similarity (Jaccard similarity on words)
    const titleWordSimilarity = this.calculateWordSimilarity(normTitle1, normTitle2);
    const descWordSimilarity = this.calculateWordSimilarity(normDesc1, normDesc2);
    
    // 3. Semantic similarity (common words, word order, length ratio)
    const titleSemanticSimilarity = this.calculateSemanticSimilarity(normTitle1, normTitle2);
    const descSemanticSimilarity = this.calculateSemanticSimilarity(normDesc1, normDesc2);

    // Combine multiple similarity metrics for AI intelligence
    // Title: 30% character, 40% word, 30% semantic
    const titleSimilarity = (titleCharSimilarity * 0.3) + (titleWordSimilarity * 0.4) + (titleSemanticSimilarity * 0.3);
    
    // Description: 20% character, 50% word, 30% semantic (descriptions benefit more from word-level)
    const descSimilarity = (descCharSimilarity * 0.2) + (descWordSimilarity * 0.5) + (descSemanticSimilarity * 0.3);

    // Overall: 40% title, 60% description (descriptions are more important for duplicate detection)
    const overallSimilarity = (titleSimilarity * 0.4) + (descSimilarity * 0.6);

    return Math.min(1.0, Math.max(0.0, overallSimilarity)); // Clamp between 0 and 1
  }
  
  /**
   * AI Intelligence: Calculate word-level similarity using Jaccard similarity
   * Compares sets of words to find semantic overlap
   */
  private calculateWordSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 0));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 0));
    
    if (words1.size === 0 && words2.size === 0) return 1.0;
    if (words1.size === 0 || words2.size === 0) return 0.0;
    
    // Calculate intersection (common words)
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    
    // Calculate union (all unique words)
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity = intersection / union
    return intersection.size / union.size;
  }
  
  /**
   * AI Intelligence: Calculate semantic similarity
   * Considers: common words ratio, word order similarity, length similarity
   */
  private calculateSemanticSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const words1 = str1.split(/\s+/).filter(w => w.length > 0);
    const words2 = str2.split(/\s+/).filter(w => w.length > 0);
    
    // Common words ratio
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const commonWords = new Set([...words1].filter(w => set2.has(w)));
    const commonRatio = (commonWords.size * 2) / (words1.length + words2.length);
    
    // Length similarity (shorter/longer ratio)
    const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
    
    // Word order similarity (sequence matching)
    let orderSimilarity = 0;
    if (words1.length > 0 && words2.length > 0) {
      let matches = 0;
      const minLength = Math.min(words1.length, words2.length);
      for (let i = 0; i < minLength; i++) {
        if (words1[i] === words2[i]) matches++;
      }
      orderSimilarity = matches / minLength;
    }
    
    // Combine: 50% common words, 30% length, 20% order
    return (commonRatio * 0.5) + (lengthRatio * 0.3) + (orderSimilarity * 0.2);
  }
  
  /**
   * Calculate budget/price similarity
   * Returns 1.0 if both match exactly, 0.0 if different or missing
   */
  private calculateBudgetSimilarity(
    budget1: number | string | undefined,
    budget2: number | string | undefined
  ): number {
    // Normalize budgets
    const normalizeBudget = (budgetValue: number | string | undefined): number | null => {
      if (budgetValue === undefined || budgetValue === null || budgetValue === '') return null;
      if (typeof budgetValue === 'string') {
        const numStr = budgetValue.replace(/[₹,\s]/g, '').trim();
        const num = parseFloat(numStr);
        return isNaN(num) ? null : num;
      }
      return budgetValue;
    };
    
    const normBudget1 = normalizeBudget(budget1);
    const normBudget2 = normalizeBudget(budget2);
    
    // If both are missing, consider it neutral (0.5 similarity)
    if (normBudget1 === null && normBudget2 === null) return 0.5;
    
    // If one is missing, penalize (0.3 similarity)
    if (normBudget1 === null || normBudget2 === null) return 0.3;
    
    // If both match exactly, return 1.0
    if (normBudget1 === normBudget2) return 1.0;
    
    // If different, calculate percentage difference
    const maxBudget = Math.max(normBudget1, normBudget2);
    const minBudget = Math.min(normBudget1, normBudget2);
    const difference = (maxBudget - minBudget) / maxBudget;
    
    // Return similarity based on difference (if within 5%, consider similar)
    if (difference <= 0.05) return 0.8; // 95%+ match
    if (difference <= 0.10) return 0.6; // 90%+ match
    return 0.0; // Different budgets
  }
  
  /**
   * Calculate category similarity
   * Returns 1.0 if both match exactly, 0.0 if different
   */
  private calculateCategorySimilarity(
    category1: string | undefined,
    category2: string | undefined
  ): number {
    if (!category1 && !category2) return 0.5; // Both missing = neutral
    if (!category1 || !category2) return 0.3; // One missing = penalize
    
    const norm1 = category1.trim().toLowerCase();
    const norm2 = category2.trim().toLowerCase();
    
    return norm1 === norm2 ? 1.0 : 0.0; // Exact match only
  }
  
  /**
   * Calculate location similarity
   * Returns 1.0 if both match exactly, 0.0 if different
   */
  private calculateLocationSimilarity(
    location1: string | undefined,
    location2: string | undefined
  ): number {
    if (!location1 && !location2) return 0.5; // Both missing = neutral
    if (!location1 || !location2) return 0.3; // One missing = penalize
    
    const norm1 = location1.trim().toLowerCase();
    const norm2 = location2.trim().toLowerCase();
    
    // Exact match
    if (norm1 === norm2) return 1.0;
    
    // Check if one contains the other (e.g., "Mumbai" vs "Mumbai, Maharashtra")
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    return 0.0; // Different locations
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns a value between 0 and 1 (1 = identical, 0 = completely different)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Use longest common subsequence ratio for better performance
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;

    // Calculate edit distance
    const distance = this.levenshteinDistance(longer, shorter);
    const maxLength = Math.max(str1.length, str2.length);
    
    // Similarity = 1 - (distance / maxLength)
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get duplicate enquiry IDs as array
   */
  getDuplicateIds(matches: DuplicateMatch[]): string[] {
    return matches.map(m => m.enquiryId);
  }

  /**
   * Format duplicate reason for admin notes
   */
  formatDuplicateReason(result: DuplicateCheckResult): string {
    if (!result.isDuplicate) {
      return '';
    }

    const matchIds = this.getDuplicateIds(result.matches).join(', ');
    return `${result.reason}. Match IDs: ${matchIds}`;
  }
}

export const duplicateDetectionService = DuplicateDetectionService.getInstance();






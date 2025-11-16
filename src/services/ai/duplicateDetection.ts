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
  // CRITICAL: We now require EXACT matches (100%) for all fields
  // Similarity is still calculated but only used for logging
  private readonly SAME_USER_THRESHOLD = 1.0; // 100% exact match required (changed from 99%)
  private readonly DIFFERENT_USER_THRESHOLD = 1.0; // 100% exact match for different users

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

        // Check for similarity in title and description
        const similarity = this.calculateSimilarity(title, description, enquiry.title, enquiry.description);
        const isSameUser = enquiry.userId === userId;
        
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
        
        // Determine if this is a duplicate based on user and field matches
        // CRITICAL: For a duplicate, ALL fields must match (title, description, budget, category, location)
        // If any field is missing on either side, it's NOT a duplicate
        let shouldFlag = false;
        
        if (isSameUser) {
          // Same user: Title AND description must match EXACTLY (100% match, not 99%)
          // AND budget, category, location must ALL be provided and match
          // If any field is missing, it's NOT a duplicate
          const textMatches = titleMatches && descriptionMatches; // Must be exact match
          shouldFlag = textMatches && budgetMatches && categoryMatches && locationMatches;
          
          if (textMatches && !shouldFlag) {
            console.log('🔍 Duplicate Detection: Same user enquiry matches text but not all fields:', {
              enquiryId: doc.id,
              titleMatches,
              descriptionMatches,
              budgetMatches: budgetMatches ? 'YES' : `NO (current: ${currentBudget}, existing: ${enquiryBudget})`,
              categoryMatches: categoryMatches ? 'YES' : `NO (current: ${currentCategory}, existing: ${enquiryCategory})`,
              locationMatches: locationMatches ? 'YES' : `NO (current: ${currentLocation}, existing: ${enquiryLocation})`,
              similarity: Math.round(similarity * 100)
            });
          }
        } else {
          // Different user: ALL fields must match EXACTLY (100% match)
          // Title, description, budget, category, and location must ALL be provided and identical
          // If any field is missing on either side, it's NOT a duplicate
          shouldFlag = titleMatches && descriptionMatches && budgetMatches && categoryMatches && locationMatches;
          
          if ((titleMatches || descriptionMatches) && !shouldFlag) {
            console.log('🔍 Duplicate Detection: Different user enquiry partial match but not all fields:', {
              enquiryId: doc.id,
              titleMatches,
              descriptionMatches,
              budgetMatches: budgetMatches ? 'YES' : `NO (current: ${currentBudget}, existing: ${enquiryBudget})`,
              categoryMatches: categoryMatches ? 'YES' : `NO (current: ${currentCategory}, existing: ${enquiryCategory})`,
              locationMatches: locationMatches ? 'YES' : `NO (current: ${currentLocation}, existing: ${enquiryLocation})`
            });
          }
        }
        
        if (shouldFlag) {
          console.log('🔍 Duplicate Detection: Match found!', {
            enquiryId: doc.id,
            isSameUser,
            titleMatches,
            descriptionMatches,
            budgetMatches,
            categoryMatches,
            locationMatches,
            similarity: Math.round(similarity * 100)
          });
          matches.push({
            enquiryId: doc.id,
            userId: enquiry.userId,
            title: enquiry.title,
            description: enquiry.description,
            createdAt: enquiry.createdAt,
            isSameUser: isSameUser,
            similarity: Math.round(similarity * 100) // Convert to percentage
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
        
        if (sameUserMatches.length > 0 && differentUserMatches.length > 0) {
          reason = `Duplicate detected: ${sameUserMatches.length} from same account, ${differentUserMatches.length} exact match(es) from different account(s). All fields (title, description, budget, category, location) match exactly.`;
        } else if (sameUserMatches.length > 0) {
          reason = `Duplicate detected: ${sameUserMatches.length} enquiry(ies) from same account. All fields (title, description, budget, category, location) match exactly.`;
        } else {
          reason = `Duplicate detected: ${differentUserMatches.length} exact match(es) from different account(s). All fields (title, description, budget, category, location) match exactly.`;
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
   * Calculate similarity between two enquiries (0-1 scale)
   * Uses weighted average: 40% title, 60% description
   */
  private calculateSimilarity(
    title1: string,
    description1: string,
    title2: string,
    description2: string
  ): number {
    const normalize = (text: string): string => {
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[^\w\s]/g, ''); // Remove punctuation for better matching
    };

    const normTitle1 = normalize(title1);
    const normTitle2 = normalize(title2);
    const normDesc1 = normalize(description1);
    const normDesc2 = normalize(description2);

    // Calculate title similarity
    const titleSimilarity = this.calculateStringSimilarity(normTitle1, normTitle2);
    
    // Calculate description similarity
    const descSimilarity = this.calculateStringSimilarity(normDesc1, normDesc2);

    // Weighted average: 40% title, 60% description
    const overallSimilarity = (titleSimilarity * 0.4) + (descSimilarity * 0.6);

    return overallSimilarity;
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






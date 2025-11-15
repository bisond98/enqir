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
  private readonly SAME_USER_THRESHOLD = 0.99; // 99% similarity for same user
  private readonly DIFFERENT_USER_THRESHOLD = 1.0; // 100% exact match for different users

  public static getInstance(): DuplicateDetectionService {
    if (!DuplicateDetectionService.instance) {
      DuplicateDetectionService.instance = new DuplicateDetectionService();
    }
    return DuplicateDetectionService.instance;
  }

  /**
   * Check for duplicate enquiries in the last 24 hours
   */
  async checkForDuplicates(
    title: string,
    description: string,
    userId: string
  ): Promise<DuplicateCheckResult> {
    try {
      console.log('🔍 Duplicate Detection: Checking for duplicates...', { title: title.substring(0, 30), userId });

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
        
        // Skip if it's a test enquiry or already rejected
        if (enquiry.status === 'rejected' || enquiry.status === 'deleted') {
          return;
        }

        // Check for similarity
        const similarity = this.calculateSimilarity(title, description, enquiry.title, enquiry.description);
        const isSameUser = enquiry.userId === userId;
        
        // Apply different thresholds:
        // - Same user: 99% similarity
        // - Different user: 100% exact match only
        const threshold = isSameUser ? this.SAME_USER_THRESHOLD : this.DIFFERENT_USER_THRESHOLD;
        
        if (similarity >= threshold) {
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
        const highestSimilarity = matches[0].similarity;
        
        if (sameUserMatches.length > 0 && differentUserMatches.length > 0) {
          reason = `Duplicate detected: ${sameUserMatches.length} from same account (≥99%), ${differentUserMatches.length} exact match(es) from different account(s)`;
        } else if (sameUserMatches.length > 0) {
          reason = `Duplicate detected: ${sameUserMatches.length} similar enquiry(ies) from same account (≥99% similarity)`;
        } else {
          reason = `Duplicate detected: ${differentUserMatches.length} exact match(es) from different account(s)`;
        }
      } else {
        reason = 'No duplicates found';
      }

      console.log('🔍 Duplicate Detection Result:', {
        isDuplicate,
        matchCount: matches.length,
        reason
      });

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






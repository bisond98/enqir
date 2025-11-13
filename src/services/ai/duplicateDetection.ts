import { db } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface DuplicateMatch {
  enquiryId: string;
  userId: string;
  title: string;
  description: string;
  createdAt: any;
  isSameUser: boolean;
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

      // Check each enquiry for exact match
      querySnapshot.forEach((doc) => {
        const enquiry = doc.data();
        
        // Skip if it's a test enquiry or already rejected
        if (enquiry.status === 'rejected' || enquiry.status === 'deleted') {
          return;
        }

        // Check for exact duplicate
        if (this.isExactDuplicate(title, description, enquiry.title, enquiry.description)) {
          matches.push({
            enquiryId: doc.id,
            userId: enquiry.userId,
            title: enquiry.title,
            description: enquiry.description,
            createdAt: enquiry.createdAt,
            isSameUser: enquiry.userId === userId
          });
        }
      });

      const isDuplicate = matches.length > 0;
      const confidence = isDuplicate ? 100 : 0; // Exact match = 100% confidence

      let reason = '';
      if (isDuplicate) {
        const sameUserMatches = matches.filter(m => m.isSameUser).length;
        const differentUserMatches = matches.filter(m => !m.isSameUser).length;
        
        if (sameUserMatches > 0 && differentUserMatches > 0) {
          reason = `Exact duplicate detected: ${sameUserMatches} from same user, ${differentUserMatches} from different users`;
        } else if (sameUserMatches > 0) {
          reason = `Exact duplicate detected: ${sameUserMatches} identical enquiry(ies) from same user`;
        } else {
          reason = `Exact duplicate detected: ${differentUserMatches} identical enquiry(ies) from different user(s)`;
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
   * Check if two enquiries are exact duplicates
   * Case-insensitive, trimmed, normalized whitespace
   */
  private isExactDuplicate(
    title1: string,
    description1: string,
    title2: string,
    description2: string
  ): boolean {
    const normalize = (text: string): string => {
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
    };

    const titleMatch = normalize(title1) === normalize(title2);
    const descriptionMatch = normalize(description1) === normalize(description2);

    return titleMatch && descriptionMatch;
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






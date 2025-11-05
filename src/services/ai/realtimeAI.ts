import { db } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { autoApprovalAI } from './autoApproval';
import { aiActivityLogger } from './aiActivityLogger';

interface AIProcessingResult {
  success: boolean;
  action: 'approved' | 'flagged' | 'rejected';
  confidence: number;
  reason: string;
  processingTime: number;
}

class RealtimeAIService {
  private isAIModeEnabled = true; // Default to AI mode
  private processingQueue = new Set<string>();
  private readonly MAX_PROCESSING_TIME = 5000; // 5 seconds max

  /**
   * Enable or disable AI mode
   */
  setAIMode(enabled: boolean) {
    this.isAIModeEnabled = enabled;
    console.log(`🤖 Realtime AI: Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Check if AI mode is enabled
   */
  isAIModeActive(): boolean {
    return this.isAIModeEnabled;
  }

  /**
   * Process enquiry submission in real-time
   */
  async processEnquirySubmission(enquiryId: string, enquiryData: any): Promise<AIProcessingResult> {
    console.log('🤖 Realtime AI: Processing enquiry submission:', enquiryId, 'AI Mode:', this.isAIModeEnabled);
    
    if (!this.isAIModeEnabled) {
      console.log('🤖 Realtime AI: AI mode disabled, skipping processing');
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI mode disabled - requires manual review',
        processingTime: 0
      };
    }

    if (this.processingQueue.has(`enquiry-${enquiryId}`)) {
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'Already processing',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    this.processingQueue.add(`enquiry-${enquiryId}`);

    try {
      console.log('🤖 Realtime AI: Processing enquiry submission:', enquiryId);

      // Get AI analysis result
      const result = await autoApprovalAI.approveEnquiry(enquiryData);
      const processingTime = Date.now() - startTime;

      // Execute the decision immediately
      let success = false;
      let action: 'approved' | 'flagged' | 'rejected' = 'flagged';

      if (result.approved) {
        // Auto-approve and make live instantly
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          status: 'live',
          adminNotes: `Auto-approved by AI: ${result.reason}`,
          aiApproval: {
            approved: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'approved', result.confidence, result.reason, result.aiAnalysis);

        success = true;
        action = 'approved';
        console.log('✅ Realtime AI: Enquiry auto-approved and made live:', enquiryId);

      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          adminNotes: `AI flagged for review: ${result.reason}`,
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'flagged', result.confidence, result.reason, result.aiAnalysis);

        action = 'flagged';
        console.log('⏳ Realtime AI: Enquiry flagged for review:', enquiryId);

      } else {
        // Auto-reject
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          status: 'rejected',
          adminNotes: `Auto-rejected by AI: ${result.reason}`,
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'rejected', result.confidence, result.reason, result.aiAnalysis);

        action = 'rejected';
        console.log('❌ Realtime AI: Enquiry auto-rejected:', enquiryId);
      }

      return {
        success,
        action,
        confidence: result.confidence,
        reason: result.reason,
        processingTime
      };

    } catch (error) {
      console.error('❌ Realtime AI: Error processing enquiry:', enquiryId, error);
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI processing failed - requires manual review',
        processingTime: Date.now() - startTime
      };
    } finally {
      this.processingQueue.delete(`enquiry-${enquiryId}`);
    }
  }

  /**
   * Process profile verification submission in real-time
   */
  async processProfileVerification(userId: string, profileData: any, idImages: { front: string; back?: string }): Promise<AIProcessingResult> {
    console.log('🤖 Realtime AI: Processing profile verification:', userId, 'AI Mode:', this.isAIModeEnabled);
    
    if (!this.isAIModeEnabled) {
      console.log('🤖 Realtime AI: AI mode disabled, skipping processing');
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI mode disabled - requires manual review',
        processingTime: 0
      };
    }

    if (this.processingQueue.has(`profile-${userId}`)) {
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'Already processing',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    this.processingQueue.add(`profile-${userId}`);

    try {
      console.log('🤖 Realtime AI: Processing profile verification:', userId);

      // Get AI analysis result
      const result = await autoApprovalAI.verifyProfile(profileData, idImages);
      const processingTime = Date.now() - startTime;

      // Execute the decision immediately
      let success = false;
      let action: 'approved' | 'flagged' | 'rejected' = 'flagged';

      if (result.verified) {
        // Auto-verify instantly
        await updateDoc(doc(db, 'userProfiles', userId), {
          isProfileVerified: true,
          verificationStatus: 'approved',
          verificationDate: serverTimestamp(),
          aiVerification: {
            verified: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'approved', result.confidence, result.reason, result.aiAnalysis);

        success = true;
        action = 'approved';
        console.log('✅ Realtime AI: Profile auto-verified:', userId);

      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'userProfiles', userId), {
          verificationStatus: 'pending',
          aiVerification: {
            verified: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'flagged', result.confidence, result.reason, result.aiAnalysis);

        action = 'flagged';
        console.log('⏳ Realtime AI: Profile flagged for review:', userId);

      } else {
        // Auto-reject
        await updateDoc(doc(db, 'userProfiles', userId), {
          isProfileVerified: false,
          verificationStatus: 'rejected',
          verificationDate: serverTimestamp(),
          aiVerification: {
            verified: false,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'rejected', result.confidence, result.reason, result.aiAnalysis);

        action = 'rejected';
        console.log('❌ Realtime AI: Profile auto-rejected:', userId);
      }

      return {
        success,
        action,
        confidence: result.confidence,
        reason: result.reason,
        processingTime
      };

    } catch (error) {
      console.error('❌ Realtime AI: Error processing profile:', userId, error);
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI processing failed - requires manual review',
        processingTime: Date.now() - startTime
      };
    } finally {
      this.processingQueue.delete(`profile-${userId}`);
    }
  }

  /**
   * Process seller response submission in real-time
   */
  async processSellerResponse(responseId: string, responseData: any): Promise<AIProcessingResult> {
    console.log('🤖 Realtime AI: Processing seller response:', responseId, 'AI Mode:', this.isAIModeEnabled);
    
    if (!this.isAIModeEnabled) {
      console.log('🤖 Realtime AI: AI mode disabled, skipping processing');
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI mode disabled - requires manual review',
        processingTime: 0
      };
    }

    if (this.processingQueue.has(`response-${responseId}`)) {
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'Already processing',
        processingTime: 0
      };
    }

    const startTime = Date.now();
    this.processingQueue.add(`response-${responseId}`);

    try {
      console.log('🤖 Realtime AI: Processing seller response:', responseId);

      // Get AI analysis result
      const result = await autoApprovalAI.approveSellerResponse(responseData);
      const processingTime = Date.now() - startTime;

      // Execute the decision immediately
      let success = false;
      let action: 'approved' | 'flagged' | 'rejected' = 'flagged';

      if (result.approved) {
        // Auto-approve instantly
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'approved',
          updatedAt: serverTimestamp(),
          aiApproval: {
            approved: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          }
        });

        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'approved', result.confidence, result.reason, result.aiAnalysis);

        success = true;
        action = 'approved';
        console.log('✅ Realtime AI: Seller response auto-approved:', responseId);

      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'pending',
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          },
          updatedAt: serverTimestamp()
        });

        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'flagged', result.confidence, result.reason, result.aiAnalysis);

        action = 'flagged';
        console.log('⏳ Realtime AI: Seller response flagged for review:', responseId);

      } else {
        // Auto-reject
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'rejected',
          updatedAt: serverTimestamp(),
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis,
            processingTime
          }
        });

        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'rejected', result.confidence, result.reason, result.aiAnalysis);

        action = 'rejected';
        console.log('❌ Realtime AI: Seller response auto-rejected:', responseId);
      }

      return {
        success,
        action,
        confidence: result.confidence,
        reason: result.reason,
        processingTime
      };

    } catch (error) {
      console.error('❌ Realtime AI: Error processing seller response:', responseId, error);
      return {
        success: false,
        action: 'flagged',
        confidence: 0,
        reason: 'AI processing failed - requires manual review',
        processingTime: Date.now() - startTime
      };
    } finally {
      this.processingQueue.delete(`response-${responseId}`);
    }
  }

  /**
   * Get current processing status
   */
  getProcessingStatus() {
    return {
      isAIModeEnabled: this.isAIModeEnabled,
      processingQueue: Array.from(this.processingQueue),
      queueSize: this.processingQueue.size
    };
  }
}

// Create singleton instance
export const realtimeAI = new RealtimeAIService();

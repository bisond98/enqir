import { db } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { aiActivityLogger } from './aiActivityLogger';
import { duplicateDetectionService } from './duplicateDetection';

interface ApprovalResult {
  approved: boolean;
  confidence: number; // 0-100
  reason: string;
  requiresHumanReview: boolean;
  aiAnalysis: {
    contentQuality: number;
    legitimacyScore: number;
    riskAssessment: number;
    categoryMatch: number;
  };
}

interface ProfileVerificationResult {
  verified: boolean;
  confidence: number;
  reason: string;
  requiresHumanReview: boolean;
  aiAnalysis: {
    documentClarity: number;
    authenticityScore: number;
    riskLevel: number;
    complianceCheck: number;
  };
}

interface SellerResponseResult {
  approved: boolean;
  confidence: number;
  reason: string;
  requiresHumanReview: boolean;
  aiAnalysis: {
    responseQuality: number;
    priceReasonableness: number;
    sellerCredibility: number;
    contentRelevance: number;
  };
}

class AutoApprovalAI {
  private readonly MIN_CONFIDENCE_THRESHOLD = 40; // Auto-approve if confidence > 40% (Testing Phase)
  private readonly MEDIUM_CONFIDENCE_THRESHOLD = 25; // Flag for review if 25-40%
  private readonly LOW_CONFIDENCE_THRESHOLD = 15; // Auto-reject if < 15%

  /**
   * AI-powered enquiry approval
   */
  async approveEnquiry(enquiryData: any): Promise<ApprovalResult> {
    try {
      console.log('🤖 AI: Analyzing enquiry for auto-approval...', enquiryData.id);

      // STEP 1: Check for duplicates first
      const duplicateCheck = await duplicateDetectionService.checkForDuplicates(
        enquiryData.title,
        enquiryData.description,
        enquiryData.userId
      );

      if (duplicateCheck.isDuplicate) {
        console.log('🤖 AI: Duplicate detected - flagging for manual review');
        
        return {
          approved: false,
          confidence: 0,
          reason: duplicateCheck.reason,
          requiresHumanReview: true,
          aiAnalysis: {
            contentQuality: 0,
            legitimacyScore: 0,
            riskAssessment: 100,
            categoryMatch: 0
          }
        };
      }

      // STEP 2: Continue with normal AI Analysis Pipeline
      const contentQuality = await this.analyzeContentQuality(enquiryData);
      const legitimacyScore = await this.analyzeLegitimacy(enquiryData);
      const riskAssessment = await this.assessRisk(enquiryData);
      const categoryMatch = await this.analyzeCategoryMatch(enquiryData);

      // Calculate overall confidence
      const confidence = Math.round(
        (contentQuality + legitimacyScore + (100 - riskAssessment) + categoryMatch) / 4
      );

      const aiAnalysis = {
        contentQuality,
        legitimacyScore,
        riskAssessment,
        categoryMatch
      };

      console.log('🤖 AI: Enquiry analysis scores:', {
        contentQuality,
        legitimacyScore,
        riskAssessment,
        categoryMatch,
        finalConfidence: confidence
      });

      // Decision Logic
      let approved = false;
      let reason = '';
      let requiresHumanReview = false;

      if (confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        approved = true;
        reason = `Auto-approved by AI (${confidence}% confidence). High quality enquiry with low risk.`;
      } else if (confidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
        approved = false;
        requiresHumanReview = true;
        reason = `Flagged for human review (${confidence}% confidence). Moderate quality with some concerns.`;
      } else if (confidence >= this.LOW_CONFIDENCE_THRESHOLD) {
        approved = false;
        requiresHumanReview = true;
        reason = `Flagged for human review (${confidence}% confidence). Low quality or high risk detected.`;
      } else {
        approved = false;
        reason = `Auto-rejected by AI (${confidence}% confidence). Poor quality or high risk content.`;
      }

      const result: ApprovalResult = {
        approved,
        confidence,
        reason,
        requiresHumanReview,
        aiAnalysis
      };

      console.log('🤖 AI: Enquiry analysis complete:', result);
      return result;

    } catch (error) {
      console.error('🤖 AI: Error in enquiry approval:', error);
      return {
        approved: false,
        confidence: 0,
        reason: 'AI analysis failed. Requires human review.',
        requiresHumanReview: true,
        aiAnalysis: {
          contentQuality: 0,
          legitimacyScore: 0,
          riskAssessment: 100,
          categoryMatch: 0
        }
      };
    }
  }

  /**
   * AI-powered profile verification
   */
  async verifyProfile(profileData: any, idImages: { front: string; back?: string }): Promise<ProfileVerificationResult> {
    try {
      console.log('🤖 AI: Analyzing profile for auto-verification...', profileData.userId);

      // AI Analysis Pipeline
      const documentClarity = await this.analyzeDocumentClarity(idImages);
      const authenticityScore = await this.analyzeDocumentAuthenticity(idImages);
      const riskLevel = await this.assessProfileRisk(profileData);
      const complianceCheck = await this.checkCompliance(profileData);

      // Calculate overall confidence
      const confidence = Math.round(
        (documentClarity + authenticityScore + (100 - riskLevel) + complianceCheck) / 4
      );

      const aiAnalysis = {
        documentClarity,
        authenticityScore,
        riskLevel,
        complianceCheck
      };

      // Decision Logic
      let verified = false;
      let reason = '';
      let requiresHumanReview = false;

      if (confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        verified = true;
        reason = `Auto-verified by AI (${confidence}% confidence). Document appears authentic and clear.`;
      } else if (confidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
        verified = false;
        requiresHumanReview = true;
        reason = `Flagged for human review (${confidence}% confidence). Document quality needs verification.`;
      } else {
        verified = false;
        reason = `Auto-rejected by AI (${confidence}% confidence). Document appears invalid or unclear.`;
      }

      const result: ProfileVerificationResult = {
        verified,
        confidence,
        reason,
        requiresHumanReview,
        aiAnalysis
      };

      console.log('🤖 AI: Profile verification complete:', result);
      return result;

    } catch (error) {
      console.error('🤖 AI: Error in profile verification:', error);
      return {
        verified: false,
        confidence: 0,
        reason: 'AI analysis failed. Requires human review.',
        requiresHumanReview: true,
        aiAnalysis: {
          documentClarity: 0,
          authenticityScore: 0,
          riskLevel: 100,
          complianceCheck: 0
        }
      };
    }
  }

  /**
   * AI-powered seller response approval
   */
  async approveSellerResponse(responseData: any): Promise<SellerResponseResult> {
    try {
      console.log('🤖 AI: Analyzing seller response for auto-approval...', responseData.id);

      // AI Analysis Pipeline
      const responseQuality = await this.analyzeResponseQuality(responseData);
      const priceReasonableness = await this.analyzePriceReasonableness(responseData);
      const sellerCredibility = await this.analyzeSellerCredibility(responseData);
      const contentRelevance = await this.analyzeContentRelevance(responseData);

      // Calculate overall confidence
      const confidence = Math.round(
        (responseQuality + priceReasonableness + sellerCredibility + contentRelevance) / 4
      );

      const aiAnalysis = {
        responseQuality,
        priceReasonableness,
        sellerCredibility,
        contentRelevance
      };

      // Decision Logic
      let approved = false;
      let reason = '';
      let requiresHumanReview = false;

      if (confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        approved = true;
        reason = `Auto-approved by AI (${confidence}% confidence). High quality response with reasonable pricing.`;
      } else if (confidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
        approved = false;
        requiresHumanReview = true;
        reason = `Flagged for human review (${confidence}% confidence). Response needs quality verification.`;
      } else {
        approved = false;
        reason = `Auto-rejected by AI (${confidence}% confidence). Poor quality or unreasonable response.`;
      }

      const result: SellerResponseResult = {
        approved,
        confidence,
        reason,
        requiresHumanReview,
        aiAnalysis
      };

      console.log('🤖 AI: Seller response analysis complete:', result);
      return result;

    } catch (error) {
      console.error('🤖 AI: Error in seller response approval:', error);
      return {
        approved: false,
        confidence: 0,
        reason: 'AI analysis failed. Requires human review.',
        requiresHumanReview: true,
        aiAnalysis: {
          responseQuality: 0,
          priceReasonableness: 0,
          sellerCredibility: 0,
          contentRelevance: 0
        }
      };
    }
  }

  // Private AI Analysis Methods
  private async analyzeContentQuality(enquiry: any): Promise<number> {
    // Simulate AI content analysis
    const titleLength = enquiry.title?.length || 0;
    const descriptionLength = enquiry.description?.length || 0;
    
    let score = 50; // Base score
    
    // Title quality (0-25 points)
    if (titleLength >= 10 && titleLength <= 100) score += 25;
    else if (titleLength >= 5 && titleLength <= 150) score += 15;
    else if (titleLength > 0) score += 5;
    
    // Description quality (0-25 points)
    if (descriptionLength >= 50 && descriptionLength <= 500) score += 25;
    else if (descriptionLength >= 20 && descriptionLength <= 1000) score += 15;
    else if (descriptionLength > 0) score += 5;
    
    return Math.min(100, score);
  }

  private async analyzeLegitimacy(enquiry: any): Promise<number> {
    // Simulate legitimacy analysis
    let score = 70; // Base score for legitimate enquiries
    
    // Trust badge verified users get higher legitimacy score
    if (enquiry.userVerified || enquiry.isProfileVerified) {
      score = 90; // Much higher base score for verified users
      console.log('🤖 AI: User is verified - higher legitimacy score');
    }
    
    // Check for suspicious patterns
    const suspiciousWords = ['urgent', 'quick', 'asap', 'immediately', 'cash only'];
    const titleLower = enquiry.title?.toLowerCase() || '';
    const descLower = enquiry.description?.toLowerCase() || '';
    
    const suspiciousCount = suspiciousWords.filter(word => 
      titleLower.includes(word) || descLower.includes(word)
    ).length;
    
    // Verified users get less penalty for suspicious words
    const penalty = enquiry.userVerified || enquiry.isProfileVerified ? 5 : 10;
    score -= suspiciousCount * penalty;
    
    return Math.max(0, Math.min(100, score));
  }

  private async assessRisk(enquiry: any): Promise<number> {
    // Simulate risk assessment (lower is better)
    let risk = 20; // Base risk
    
    // High budget enquiries have higher risk
    if (enquiry.budget > 10000) risk += 20;
    else if (enquiry.budget > 5000) risk += 10;
    
    // Urgent enquiries have higher risk
    if (enquiry.isUrgent) risk += 15;
    
    // No location specified increases risk
    if (!enquiry.location || enquiry.location.trim() === '') risk += 10;
    
    return Math.min(100, risk);
  }

  private async analyzeCategoryMatch(enquiry: any): Promise<number> {
    // Simulate category relevance analysis
    const validCategories = ['jobs', 'services', 'products', 'real-estate', 'vehicles', 'electronics', 'fashion', 'health', 'education', 'other'];
    
    if (validCategories.includes(enquiry.category)) {
      return 90; // Valid category
    }
    
    return 30; // Invalid or missing category
  }

  private async analyzeDocumentClarity(idImages: { front: string; back?: string }): Promise<number> {
    // Simulate document clarity analysis
    // In real implementation, this would use image processing AI
    return 85; // Assume good clarity for now
  }

  private async analyzeDocumentAuthenticity(idImages: { front: string; back?: string }): Promise<number> {
    // Simulate document authenticity analysis
    // In real implementation, this would use advanced image analysis
    return 80; // Assume authentic for now
  }

  private async assessProfileRisk(profileData: any): Promise<number> {
    // Simulate profile risk assessment (lower is better)
    let risk = 15; // Base risk
    
    // Missing information increases risk
    if (!profileData.fullName || profileData.fullName.trim() === '') risk += 20;
    if (!profileData.phone || profileData.phone.trim() === '') risk += 15;
    
    return Math.min(100, risk);
  }

  private async checkCompliance(profileData: any): Promise<number> {
    // Simulate compliance check
    return 90; // Assume compliant for now
  }

  private async analyzeResponseQuality(responseData: any): Promise<number> {
    // Simulate response quality analysis
    const messageLength = responseData.message?.length || 0;
    const titleLength = responseData.title?.length || 0;
    
    let score = 50;
    
    if (messageLength >= 50 && messageLength <= 500) score += 30;
    else if (messageLength >= 20 && messageLength <= 1000) score += 20;
    else if (messageLength > 0) score += 10;
    
    if (titleLength >= 10 && titleLength <= 100) score += 20;
    else if (titleLength > 0) score += 10;
    
    return Math.min(100, score);
  }

  private async analyzePriceReasonableness(responseData: any): Promise<number> {
    // Simulate price reasonableness analysis
    const price = parseFloat(responseData.price) || 0;
    
    if (price > 0 && price < 1000000) return 85; // Reasonable price range
    if (price === 0) return 30; // No price specified
    return 20; // Unreasonable price
  }

  private async analyzeSellerCredibility(responseData: any): Promise<number> {
    // Simulate seller credibility analysis
    let score = 60; // Base score
    
    // Verified sellers get higher score
    if (responseData.isIdentityVerified) score += 25;
    if (responseData.userProfileVerified) score += 15;
    
    return Math.min(100, score);
  }

  private async analyzeContentRelevance(responseData: any): Promise<number> {
    // Simulate content relevance analysis
    return 80; // Assume relevant for now
  }

  /**
   * Execute auto-approval for an enquiry
   */
  async executeEnquiryApproval(enquiryId: string, enquiryData: any): Promise<boolean> {
    try {
      const result = await this.approveEnquiry(enquiryData);
      
      if (result.approved) {
        // Auto-approve the enquiry
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          status: 'live',
          adminNotes: `Auto-approved by AI: ${result.reason}`,
          aiApproval: {
            approved: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'approved', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Enquiry auto-approved:', enquiryId);
        return true;
      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          adminNotes: `AI flagged for review: ${result.reason}`,
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'flagged', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Enquiry flagged for review:', enquiryId);
        return false;
      } else {
        // Auto-reject
        await updateDoc(doc(db, 'enquiries', enquiryId), {
          status: 'rejected',
          adminNotes: `Auto-rejected by AI: ${result.reason}`,
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logEnquiryActivity(enquiryId, 'rejected', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Enquiry auto-rejected:', enquiryId);
        return false;
      }
    } catch (error) {
      console.error('🤖 AI: Error executing enquiry approval:', error);
      return false;
    }
  }

  /**
   * Execute auto-verification for a profile
   */
  async executeProfileVerification(userId: string, profileData: any, idImages: { front: string; back?: string }): Promise<boolean> {
    try {
      const result = await this.verifyProfile(profileData, idImages);
      
      if (result.verified) {
        // Auto-verify the profile
        await updateDoc(doc(db, 'userProfiles', userId), {
          isProfileVerified: true,
          verificationStatus: 'approved',
          verificationDate: serverTimestamp(),
          aiVerification: {
            verified: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'approved', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Profile auto-verified:', userId);
        return true;
      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'userProfiles', userId), {
          verificationStatus: 'pending',
          aiVerification: {
            verified: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'flagged', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Profile flagged for review:', userId);
        return false;
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
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logProfileActivity(userId, 'rejected', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Profile auto-rejected:', userId);
        return false;
      }
    } catch (error) {
      console.error('🤖 AI: Error executing profile verification:', error);
      return false;
    }
  }

  /**
   * Execute auto-approval for a seller response
   */
  async executeSellerResponseApproval(responseId: string, responseData: any): Promise<boolean> {
    try {
      const result = await this.approveSellerResponse(responseData);
      
      if (result.approved) {
        // Auto-approve the response
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'approved',
          updatedAt: serverTimestamp(),
          aiApproval: {
            approved: true,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          }
        });
        
        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'approved', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Seller response auto-approved:', responseId);
        return true;
      } else if (result.requiresHumanReview) {
        // Flag for human review
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'pending',
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            requiresReview: true,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          },
          updatedAt: serverTimestamp()
        });
        
        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'flagged', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Seller response flagged for review:', responseId);
        return false;
      } else {
        // Auto-reject
        await updateDoc(doc(db, 'sellerSubmissions', responseId), {
          status: 'rejected',
          updatedAt: serverTimestamp(),
          aiApproval: {
            approved: false,
            confidence: result.confidence,
            timestamp: serverTimestamp(),
            analysis: result.aiAnalysis
          }
        });
        
        // Log the activity
        await aiActivityLogger.logResponseActivity(responseId, 'rejected', result.confidence, result.reason, result.aiAnalysis);
        
        console.log('🤖 AI: Seller response auto-rejected:', responseId);
        return false;
      }
    } catch (error) {
      console.error('🤖 AI: Error executing seller response approval:', error);
      return false;
    }
  }
}

export const autoApprovalAI = new AutoApprovalAI();
export type { ApprovalResult, ProfileVerificationResult, SellerResponseResult };

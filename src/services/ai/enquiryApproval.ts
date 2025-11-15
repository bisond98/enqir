import { db } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { duplicateDetectionService } from './duplicateDetection';

export interface EnquiryData {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location?: string;
  deadline?: any;
  isPremium: boolean;
  userId: string;
  createdAt: any;
}

export interface AIApprovalResult {
  approved: boolean;
  confidence: number;
  reason: string;
  aiNotes?: string;
  isDuplicate?: boolean;
  duplicateMatches?: string[];
}

export class EnquiryApprovalAI {
  private static instance: EnquiryApprovalAI;
  
  public static getInstance(): EnquiryApprovalAI {
    if (!EnquiryApprovalAI.instance) {
      EnquiryApprovalAI.instance = new EnquiryApprovalAI();
    }
    return EnquiryApprovalAI.instance;
  }

  /**
   * Analyze enquiry and determine if it should be auto-approved
   */
  async analyzeEnquiry(enquiry: EnquiryData): Promise<AIApprovalResult> {
    try {
      console.log('🤖 AI: Analyzing enquiry:', enquiry.title);
      
      // STEP 1: Check for duplicates first
      const duplicateCheck = await duplicateDetectionService.checkForDuplicates(
        enquiry.title,
        enquiry.description,
        enquiry.userId
      );

      if (duplicateCheck.isDuplicate) {
        console.log('🤖 AI: Duplicate detected - flagging for manual review');
        const duplicateIds = duplicateDetectionService.getDuplicateIds(duplicateCheck.matches);
        
        return {
          approved: false,
          confidence: 0,
          reason: 'Potential duplicate enquiry detected - requires manual review',
          aiNotes: duplicateDetectionService.formatDuplicateReason(duplicateCheck),
          isDuplicate: true,
          duplicateMatches: duplicateIds
        };
      }
      
      // STEP 2: Continue with normal AI Analysis
      const analysis = {
        hasValidTitle: this.validateTitle(enquiry.title),
        hasValidDescription: this.validateDescription(enquiry.description),
        hasValidCategory: this.validateCategory(enquiry.category),
        hasValidBudget: this.validateBudget(enquiry.budget),
        hasValidLocation: this.validateLocation(enquiry.location),
        isNotSpam: this.detectSpam(enquiry.title, enquiry.description),
        isNotInappropriate: this.detectInappropriateContent(enquiry.title, enquiry.description),
        hasReasonableDeadline: this.validateDeadline(enquiry.deadline),
        isComplete: this.checkCompleteness(enquiry)
      };

      console.log('🤖 AI: Analysis results:', analysis);

      // Calculate confidence score
      const confidence = this.calculateConfidence(analysis);
      
      // Determine approval
      const approved = confidence >= 0.8; // 80% confidence threshold
      
      const reason = this.generateReason(analysis, confidence);
      
      console.log(`🤖 AI: Decision - Approved: ${approved}, Confidence: ${confidence}%, Reason: ${reason}`);
      
      return {
        approved,
        confidence,
        reason,
        aiNotes: `AI Analysis: ${Object.entries(analysis).map(([key, value]) => `${key}: ${value}`).join(', ')}`,
        isDuplicate: false,
        duplicateMatches: []
      };
      
    } catch (error) {
      console.error('🤖 AI: Error analyzing enquiry:', error);
      return {
        approved: false,
        confidence: 0,
        reason: 'AI analysis failed - requires manual review',
        aiNotes: `AI Error: ${error}`,
        isDuplicate: false,
        duplicateMatches: []
      };
    }
  }

  /**
   * Process enquiry through AI approval system
   */
  async processEnquiry(enquiryId: string, enquiry: EnquiryData): Promise<boolean> {
    try {
      console.log('🤖 AI: Processing enquiry for approval:', enquiryId);
      
      // Check if AI approval is enabled
      const aiEnabled = await this.isAIEnabled();
      if (!aiEnabled) {
        console.log('🤖 AI: AI approval is disabled - sending to manual review');
        await this.sendToManualReview(enquiryId, 'AI approval disabled');
        return false;
      }

      // Analyze enquiry
      const result = await this.analyzeEnquiry(enquiry);
      
      if (result.approved) {
        // Auto-approve
        await this.autoApproveEnquiry(enquiryId, result);
        console.log('🤖 AI: Enquiry auto-approved by AI');
        return true;
      } else {
        // Send to manual review
        await this.sendToManualReview(
          enquiryId, 
          result.reason, 
          result.aiNotes, 
          result.isDuplicate, 
          result.duplicateMatches
        );
        console.log('🤖 AI: Enquiry sent to manual review');
        return false;
      }
      
    } catch (error) {
      console.error('🤖 AI: Error processing enquiry:', error);
      await this.sendToManualReview(enquiryId, 'AI processing error');
      return false;
    }
  }

  /**
   * Auto-approve enquiry
   */
  private async autoApproveEnquiry(enquiryId: string, result: AIApprovalResult): Promise<void> {
    await updateDoc(doc(db, 'enquiries', enquiryId), {
      status: 'live',
      adminNotes: `AI Approved (${result.confidence}% confidence) - ${result.reason}`,
      aiNotes: result.aiNotes,
      approvedAt: serverTimestamp(),
      approvedBy: 'AI',
      approvalMethod: 'ai'
    });
  }

  /**
   * Send enquiry to manual review
   */
  private async sendToManualReview(enquiryId: string, reason: string, aiNotes?: string, isDuplicate?: boolean, duplicateMatches?: string[]): Promise<void> {
    const updateData: any = {
      status: 'pending',
      adminNotes: `Manual review required - ${reason}`,
      aiNotes: aiNotes,
      requiresManualReview: true,
      aiRejectionReason: reason,
      updatedAt: serverTimestamp()
    };

    // Add duplicate flags if applicable
    if (isDuplicate && duplicateMatches) {
      updateData.isDuplicate = true;
      updateData.duplicateMatches = duplicateMatches;
      updateData.duplicateDetectedAt = serverTimestamp();
    }

    try {
      await updateDoc(doc(db, 'enquiries', enquiryId), updateData);
      console.log('✅ Enquiry sent to manual review:', enquiryId, { isDuplicate, duplicateMatches: duplicateMatches?.length || 0 });
    } catch (error) {
      console.error('❌ Error sending enquiry to manual review:', enquiryId, error);
      throw error;
    }
  }

  /**
   * Check if AI approval is enabled
   */
  private async isAIEnabled(): Promise<boolean> {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'ai_approval'));
      if (settingsDoc.exists()) {
        return settingsDoc.data().enabled ?? true;
      }
      return true; // Default to enabled
    } catch (error) {
      console.error('🤖 AI: Error checking AI settings:', error);
      return true; // Default to enabled
    }
  }

  // Validation methods
  private validateTitle(title: string): boolean {
    return title && title.trim().length >= 10 && title.trim().length <= 200;
  }

  private validateDescription(description: string): boolean {
    return description && description.trim().length >= 20 && description.trim().length <= 2000;
  }

  private validateCategory(category: string): boolean {
    const validCategories = ['Electronics', 'Fashion', 'Home & Garden', 'Automotive', 'Sports', 'Books', 'Toys', 'Health', 'Beauty', 'Other'];
    return validCategories.includes(category);
  }

  private validateBudget(budget: number): boolean {
    return budget && budget > 0 && budget <= 1000000; // Max 10 lakh
  }

  private validateLocation(location?: string): boolean {
    if (!location) return true; // Location is optional
    return location.trim().length >= 2 && location.trim().length <= 100;
  }

  private detectSpam(title: string, description: string): boolean {
    const spamKeywords = ['free', 'urgent', 'quick', 'easy money', 'get rich', 'click here', 'buy now'];
    const text = (title + ' ' + description).toLowerCase();
    return !spamKeywords.some(keyword => text.includes(keyword));
  }

  private detectInappropriateContent(title: string, description: string): boolean {
    const inappropriateKeywords = ['adult', 'explicit', 'illegal', 'fraud', 'scam'];
    const text = (title + ' ' + description).toLowerCase();
    return !inappropriateKeywords.some(keyword => text.includes(keyword));
  }

  private validateDeadline(deadline?: any): boolean {
    if (!deadline) return true; // Deadline is optional
    const now = new Date();
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return deadlineDate > now;
  }

  private checkCompleteness(enquiry: EnquiryData): boolean {
    return !!(enquiry.title && enquiry.description && enquiry.category && enquiry.budget);
  }

  private calculateConfidence(analysis: any): number {
    const weights = {
      hasValidTitle: 0.15,
      hasValidDescription: 0.20,
      hasValidCategory: 0.10,
      hasValidBudget: 0.15,
      hasValidLocation: 0.05,
      isNotSpam: 0.15,
      isNotInappropriate: 0.15,
      hasReasonableDeadline: 0.05
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key]) {
        score += weight;
      }
    });

    return Math.round(score * 100);
  }

  private generateReason(analysis: any, confidence: number): string {
    const issues = [];
    
    if (!analysis.hasValidTitle) issues.push('Invalid title');
    if (!analysis.hasValidDescription) issues.push('Invalid description');
    if (!analysis.hasValidCategory) issues.push('Invalid category');
    if (!analysis.hasValidBudget) issues.push('Invalid budget');
    if (!analysis.isNotSpam) issues.push('Potential spam detected');
    if (!analysis.isNotInappropriate) issues.push('Inappropriate content detected');
    if (!analysis.hasReasonableDeadline) issues.push('Invalid deadline');
    if (!analysis.isComplete) issues.push('Incomplete information');

    if (issues.length === 0) {
      return `High quality enquiry (${confidence}% confidence)`;
    } else {
      return `Issues detected: ${issues.join(', ')}`;
    }
  }
}

export const enquiryApprovalAI = EnquiryApprovalAI.getInstance();

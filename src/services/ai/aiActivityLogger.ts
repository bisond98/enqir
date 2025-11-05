import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AIActivity {
  type: 'enquiry' | 'profile' | 'response';
  action: 'approved' | 'flagged' | 'rejected';
  itemId: string;
  confidence: number;
  reason: string;
  analysis?: any;
  timestamp?: any;
}

class AIActivityLogger {
  /**
   * Log an AI activity to the database
   */
  async logActivity(activity: AIActivity): Promise<void> {
    try {
      await addDoc(collection(db, 'aiActivities'), {
        ...activity,
        timestamp: serverTimestamp()
      });
      
      console.log('🤖 AI Activity logged:', activity);
    } catch (error) {
      console.error('❌ Error logging AI activity:', error);
    }
  }

  /**
   * Log enquiry approval activity
   */
  async logEnquiryActivity(
    enquiryId: string, 
    action: 'approved' | 'flagged' | 'rejected', 
    confidence: number, 
    reason: string,
    analysis?: any
  ): Promise<void> {
    await this.logActivity({
      type: 'enquiry',
      action,
      itemId: enquiryId,
      confidence,
      reason,
      analysis
    });
  }

  /**
   * Log profile verification activity
   */
  async logProfileActivity(
    userId: string, 
    action: 'approved' | 'flagged' | 'rejected', 
    confidence: number, 
    reason: string,
    analysis?: any
  ): Promise<void> {
    await this.logActivity({
      type: 'profile',
      action,
      itemId: userId,
      confidence,
      reason,
      analysis
    });
  }

  /**
   * Log seller response activity
   */
  async logResponseActivity(
    responseId: string, 
    action: 'approved' | 'flagged' | 'rejected', 
    confidence: number, 
    reason: string,
    analysis?: any
  ): Promise<void> {
    await this.logActivity({
      type: 'response',
      action,
      itemId: responseId,
      confidence,
      reason,
      analysis
    });
  }
}

export const aiActivityLogger = new AIActivityLogger();





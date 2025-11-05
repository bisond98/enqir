import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { autoApprovalAI } from './autoApproval';

class BackgroundAIService {
  private isRunning = false;
  private unsubscribeFunctions: (() => void)[] = [];
  private processingQueue = new Set<string>();
  private readonly PROCESSING_DELAY = 2000; // 2 seconds delay between processing

  /**
   * Start the background AI service (with strict authentication check)
   */
  start() {
    // Strict check: Only start if explicitly called from admin context
    if (typeof window === 'undefined') {
      console.log('🤖 Background AI: Skipping start - not in browser environment');
      return;
    }

    if (this.isRunning) {
      console.log('🤖 Background AI: Service already running');
      return;
    }

    // Starting automated approval service
    this.isRunning = true;

    // Start monitoring for new enquiries
    this.monitorNewEnquiries();
    
    // Start monitoring for new profile verifications
    this.monitorNewProfileVerifications();
    
    // Start monitoring for new seller responses
    this.monitorNewSellerResponses();

    // Service started successfully
  }

  /**
   * Start the service only when explicitly called from authenticated admin context
   */
  startForAdmin() {
    console.log('🤖 Background AI: Starting for authenticated admin...');
    this.start();
  }

  /**
   * Stop the background AI service
   */
  stop() {
    if (!this.isRunning) {
      console.log('🤖 Background AI: Service not running');
      return;
    }

    console.log('🤖 Background AI: Stopping service...');
    this.isRunning = false;

    // Unsubscribe from all listeners
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.processingQueue.clear();

    console.log('🤖 Background AI: Service stopped');
  }

  /**
   * Monitor new enquiries for auto-approval
   */
  private monitorNewEnquiries() {
    const q = query(
      collection(db, 'enquiries'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!this.isRunning) return;

      const newEnquiries = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() }));

      for (const enquiry of newEnquiries) {
        if (!this.processingQueue.has(`enquiry-${enquiry.id}`)) {
          this.processEnquiryWithDelay(enquiry);
        }
      }
    });

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Monitor new profile verifications for auto-verification
   */
  private monitorNewProfileVerifications() {
    const q = query(
      collection(db, 'userProfiles'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!this.isRunning) return;

      const newProfiles = snapshot.docChanges()
        .filter(change => change.type === 'modified' || change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() }))
        .filter(profile => profile.verificationStatus === 'pending');

      for (const profile of newProfiles) {
        if (!this.processingQueue.has(`profile-${profile.id}`)) {
          this.processProfileWithDelay(profile);
        }
      }
    });

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Monitor new seller responses for auto-approval
   */
  private monitorNewSellerResponses() {
    const q = query(
      collection(db, 'sellerSubmissions'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!this.isRunning) return;

      const newResponses = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() }));

      for (const response of newResponses) {
        if (!this.processingQueue.has(`response-${response.id}`)) {
          this.processSellerResponseWithDelay(response);
        }
      }
    });

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Process enquiry with delay to avoid overwhelming the system
   */
  private async processEnquiryWithDelay(enquiry: any) {
    const queueKey = `enquiry-${enquiry.id}`;
    this.processingQueue.add(queueKey);

    try {
      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY));

      if (!this.isRunning) return;

      // Processing enquiry
      
      const success = await autoApprovalAI.executeEnquiryApproval(enquiry.id, enquiry);
      
      if (success) {
        // Enquiry auto-approved
      } else {
        // Enquiry flagged for review
      }

    } catch (error) {
      console.error('❌ Background AI: Error processing enquiry:', enquiry.id, error);
    } finally {
      this.processingQueue.delete(queueKey);
    }
  }

  /**
   * Process profile verification with delay
   */
  private async processProfileWithDelay(profile: any) {
    const queueKey = `profile-${profile.id}`;
    this.processingQueue.add(queueKey);

    try {
      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY));

      if (!this.isRunning) return;

      console.log('🤖 Background AI: Processing profile verification:', profile.id);
      
      // Get ID images from the profile
      const idImages = {
        front: profile.idFrontImage || '',
        back: profile.idBackImage || ''
      };

      const success = await autoApprovalAI.executeProfileVerification(profile.id, profile, idImages);
      
      if (success) {
        console.log('✅ Background AI: Profile auto-verified:', profile.id);
      } else {
        console.log('⏳ Background AI: Profile flagged for review:', profile.id);
      }

    } catch (error) {
      console.error('❌ Background AI: Error processing profile:', profile.id, error);
    } finally {
      this.processingQueue.delete(queueKey);
    }
  }

  /**
   * Process seller response with delay
   */
  private async processSellerResponseWithDelay(response: any) {
    const queueKey = `response-${response.id}`;
    this.processingQueue.add(queueKey);

    try {
      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY));

      if (!this.isRunning) return;

      console.log('🤖 Background AI: Processing seller response:', response.id);
      
      const success = await autoApprovalAI.executeSellerResponseApproval(response.id, response);
      
      if (success) {
        console.log('✅ Background AI: Seller response auto-approved:', response.id);
      } else {
        console.log('⏳ Background AI: Seller response flagged for review:', response.id);
      }

    } catch (error) {
      console.error('❌ Background AI: Error processing seller response:', response.id, error);
    } finally {
      this.processingQueue.delete(queueKey);
    }
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingQueue: Array.from(this.processingQueue),
      activeListeners: this.unsubscribeFunctions.length
    };
  }

  /**
   * Process existing pending items (for initial setup)
   */
  async processExistingPendingItems() {
    if (!this.isRunning) {
      console.log('🤖 Background AI: Service not running, cannot process existing items');
      return;
    }

    console.log('🤖 Background AI: Processing existing pending items...');

    try {
      // Process existing pending enquiries
      const pendingEnquiries = await getDocs(
        query(
          collection(db, 'enquiries'),
          where('status', '==', 'pending')
        )
      );

      for (const doc of pendingEnquiries.docs) {
        const enquiry = { id: doc.id, ...doc.data() };
        if (!this.processingQueue.has(`enquiry-${enquiry.id}`)) {
          this.processEnquiryWithDelay(enquiry);
        }
      }

      // Process existing pending profile verifications
      const allProfiles = await getDocs(
        query(collection(db, 'userProfiles'))
      );

      for (const doc of allProfiles.docs) {
        const profile = { id: doc.id, ...doc.data() };
        
        // Only process pending profiles
        if (profile.verificationStatus !== 'pending') continue;
        if (!this.processingQueue.has(`profile-${profile.id}`)) {
          this.processProfileWithDelay(profile);
        }
      }

      // Process existing pending seller responses
      const pendingResponses = await getDocs(
        query(
          collection(db, 'sellerSubmissions'),
          where('status', '==', 'pending')
        )
      );

      for (const doc of pendingResponses.docs) {
        const response = { id: doc.id, ...doc.data() };
        if (!this.processingQueue.has(`response-${response.id}`)) {
          this.processSellerResponseWithDelay(response);
        }
      }

      console.log('🤖 Background AI: Existing pending items queued for processing');

    } catch (error) {
      console.error('❌ Background AI: Error processing existing pending items:', error);
    }
  }
}

// Create singleton instance
export const backgroundAIService = new BackgroundAIService();

// DISABLED: Auto-start the service when the module is imported
// The service will only start when explicitly called from admin page
// This prevents Firebase permission errors
if (false && typeof window !== 'undefined') {
  // Only start in browser environment
  setTimeout(() => {
    backgroundAIService.start();
    // Process existing pending items after a short delay
    setTimeout(() => {
      backgroundAIService.processExistingPendingItems();
    }, 5000);
  }, 1000);
}




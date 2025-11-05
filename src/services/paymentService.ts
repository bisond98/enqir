import { db } from '@/firebase';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp, arrayUnion, deleteField } from 'firebase/firestore';
import { PaymentPlan } from '@/config/paymentPlans';

export interface PaymentRecord {
  id: string;
  enquiryId: string;
  userId: string;
  planId: string;
  planPrice: number;
  responsesUnlocked: number;
  isUnlimited: boolean;
  purchasedAt: Date;
  isActive: boolean;
  paymentMethod: string;
  transactionId: string;
}

export interface UserPaymentPlan {
  userId: string;
  currentPlan: string;
  proEnquiriesRemaining?: number;
  proActivationDate?: any; // Timestamp when Pro was activated
  proActivationEnquiryId?: string; // Enquiry ID that activated Pro
  totalSpent: number;
  lastUpgrade?: Date;
  activePayments: string[]; // Array of payment record IDs
}

// Simulate payment processing with dummy gateway - Always succeeds for testing
export const processPayment = async (
  enquiryId: string,
  userId: string,
  plan: PaymentPlan,
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    name: string;
  }
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Simulate payment processing delay (1 second for testing)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Always succeed for testing
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Payment processed successfully:', {
      enquiryId,
      userId,
      planId: plan.id,
      amount: plan.price,
      transactionId
    });
    
    return {
      success: true,
      transactionId
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: 'Payment processing failed. Please try again.'
    };
  }
};

// Save payment record to Firestore
export const savePaymentRecord = async (
  enquiryId: string,
  userId: string,
  plan: PaymentPlan,
  transactionId: string
): Promise<string> => {
  try {
    const paymentRecord: Omit<PaymentRecord, 'id'> = {
      enquiryId,
      userId,
      planId: plan.id,
      planPrice: plan.price,
      responsesUnlocked: plan.responses,
      isUnlimited: plan.responses === -1,
      purchasedAt: new Date(),
      isActive: true,
      paymentMethod: 'card',
      transactionId
    };

    const paymentRef = doc(db, 'payments', `${enquiryId}_${userId}_${Date.now()}`);
    await setDoc(paymentRef, {
      ...paymentRecord,
      purchasedAt: serverTimestamp()
    });

    return paymentRef.id;
  } catch (error) {
    console.error('Error saving payment record:', error);
    throw new Error('Failed to save payment record');
  }
};

// Update enquiry premium status
export const updateEnquiryPremiumStatus = async (
  enquiryId: string,
  isPremium: boolean,
  planId?: string
): Promise<void> => {
  try {
    const enquiryRef = doc(db, 'enquiries', enquiryId);
    await updateDoc(enquiryRef, {
      isPremium,
      premiumPlan: planId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating enquiry premium status:', error);
    throw new Error('Failed to update enquiry premium status');
  }
};

// Update user payment plan
export const updateUserPaymentPlan = async (
  userId: string,
  planId: string,
  paymentRecordId: string,
  enquiryId?: string
): Promise<void> => {
  try {
    const userPaymentRef = doc(db, 'userPayments', userId);
    const userPaymentDoc = await getDoc(userPaymentRef);
    
    if (userPaymentDoc.exists()) {
      const userData = userPaymentDoc.data() as UserPaymentPlan;
      const updateData: any = {
        currentPlan: planId,
        lastUpgrade: serverTimestamp(),
        activePayments: arrayUnion(paymentRecordId)
      };
      
      // PRO PLAN LOGIC - KEPT FOR FUTURE UPDATES
      // Handle Pro plan special case
      // if (planId === 'pro') {
      //   // Set or reset proEnquiriesRemaining to 10 (includes current enquiry)
      //   updateData.proEnquiriesRemaining = 10;
      //   updateData.proActivationDate = serverTimestamp();
      //   if (enquiryId) {
      //     updateData.proActivationEnquiryId = enquiryId;
      //   }
      //   console.log('🎯 Pro Plan Activated! Setting proEnquiriesRemaining to 10 for user:', userId);
      // } else if (userData.currentPlan === 'pro' && planId !== 'pro') {
      //   // If downgrading from Pro, remove the remaining count
      //   updateData.proEnquiriesRemaining = deleteField();
      //   updateData.proActivationDate = deleteField();
      //   updateData.proActivationEnquiryId = deleteField();
      // }
      
      await updateDoc(userPaymentRef, updateData);
      console.log('✅ User payment plan updated successfully:', { userId, planId, proEnquiriesRemaining: updateData.proEnquiriesRemaining });
    } else {
      // Create new user payment plan
      const newPlanData: any = {
        userId,
        currentPlan: planId,
        totalSpent: 0, // Will be calculated from payment records
        lastUpgrade: serverTimestamp(),
        activePayments: [paymentRecordId]
      };
      
      // PRO PLAN LOGIC - KEPT FOR FUTURE UPDATES
      // Only add Pro-specific fields if it's a Pro plan
      // if (planId === 'pro') {
      //   newPlanData.proEnquiriesRemaining = 10; // 10 total including current
      //   newPlanData.proActivationDate = serverTimestamp();
      //   if (enquiryId) {
      //     newPlanData.proActivationEnquiryId = enquiryId;
      //   }
      //   console.log('🎯 Pro Plan Activated! Creating new plan with proEnquiriesRemaining: 10 for user:', userId);
      // }
      
      await setDoc(userPaymentRef, newPlanData);
      console.log('✅ User payment plan created successfully:', { userId, planId, proEnquiriesRemaining: newPlanData.proEnquiriesRemaining });
    }
  } catch (error) {
    console.error('Error updating user payment plan:', error);
    throw new Error('Failed to update user payment plan');
  }
};

// Get user's current payment plan
export const getUserPaymentPlan = async (userId: string): Promise<UserPaymentPlan | null> => {
  try {
    const userPaymentRef = doc(db, 'userPayments', userId);
    const userPaymentDoc = await getDoc(userPaymentRef);
    
    if (userPaymentDoc.exists()) {
      const data = userPaymentDoc.data() as UserPaymentPlan;
      console.log('📊 User Payment Plan:', { 
        userId, 
        currentPlan: data.currentPlan, 
        proEnquiriesRemaining: data.proEnquiriesRemaining,
        hasProActivation: !!data.proActivationDate 
      });
      return data;
    }
    
    console.log('📊 No payment plan found for user:', userId);
    return null;
  } catch (error) {
    console.error('Error getting user payment plan:', error);
    return null;
  }
};

// Get payment records for an enquiry
export const getEnquiryPayments = async (enquiryId: string): Promise<PaymentRecord[]> => {
  try {
    // This would typically query the payments collection
    // For now, return empty array as we're using dummy data
    return [];
  } catch (error) {
    console.error('Error getting enquiry payments:', error);
    return [];
  }
};

// Check if user can view all responses for an enquiry
export const canViewAllResponses = (
  enquiry: any,
  user: any,
  userPaymentPlan: UserPaymentPlan | null
): boolean => {
  // If user is the enquiry owner
  if (user && enquiry && user.uid === enquiry.userId) {
    // Check if enquiry is premium
    if (enquiry.isPremium) {
      return true;
    }
    
    // Check if user has a paid plan for this enquiry
    if (userPaymentPlan && userPaymentPlan.currentPlan !== 'free') {
      return true;
    }
    
    return false;
  }
  
  // If user is a seller, they can only see their own responses
  return false;
};

// Get response view limit based on plan
export const getResponseViewLimit = (
  enquiry: any,
  user: any,
  userPaymentPlan: UserPaymentPlan | null
): number => {
  // If user is the enquiry owner
  if (user && enquiry && user.uid === enquiry.userId) {
    // Get the selected plan for this enquiry
    const selectedPlanId = enquiry.selectedPlanId || 'free';
    
    // Determine response limit based on plan
    switch (selectedPlanId) {
      case 'free':
        return 2;
      case 'basic':
        return 5;
      case 'standard':
        return 10;
      case 'premium':
      case 'pro':
        return -1; // Unlimited
      default:
        return 2; // Default free plan
    }
  }
  
  // If user is a seller, they can only see their own responses
  return 1;
};

// Decrement Pro enquiries remaining count when a new enquiry is created
export const decrementProEnquiriesRemaining = async (userId: string): Promise<boolean> => {
  try {
    const userPaymentRef = doc(db, 'userPayments', userId);
    const userPaymentDoc = await getDoc(userPaymentRef);
    
    if (userPaymentDoc.exists()) {
      const userData = userPaymentDoc.data() as UserPaymentPlan;
      
      // Check if user has Pro plan with remaining enquiries
      if (userData.currentPlan === 'pro' && userData.proEnquiriesRemaining && userData.proEnquiriesRemaining > 0) {
        // Decrement the count
        await updateDoc(userPaymentRef, {
          proEnquiriesRemaining: userData.proEnquiriesRemaining - 1
        });
        return true; // Successfully decremented
      }
    }
    
    return false; // No Pro plan or no remaining enquiries
  } catch (error) {
    console.error('Error decrementing Pro enquiries remaining:', error);
    return false;
  }
};

// Check if user has Pro enquiries remaining
export const hasProEnquiriesRemaining = async (userId: string): Promise<boolean> => {
  try {
    const userPaymentPlan = await getUserPaymentPlan(userId);
    return !!(userPaymentPlan && 
              userPaymentPlan.currentPlan === 'pro' && 
              userPaymentPlan.proEnquiriesRemaining && 
              userPaymentPlan.proEnquiriesRemaining > 0);
  } catch (error) {
    console.error('Error checking Pro enquiries remaining:', error);
    return false;
  }
};

// Get Pro enquiries remaining count
export const getProEnquiriesRemaining = async (userId: string): Promise<number> => {
  try {
    const userPaymentPlan = await getUserPaymentPlan(userId);
    if (userPaymentPlan && 
        userPaymentPlan.currentPlan === 'pro' && 
        userPaymentPlan.proEnquiriesRemaining) {
      return userPaymentPlan.proEnquiriesRemaining;
    }
    return 0;
  } catch (error) {
    console.error('Error getting Pro enquiries remaining:', error);
    return 0;
  }
};

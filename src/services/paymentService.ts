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

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay script dynamically
const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

// Create Razorpay order via Firebase Cloud Functions
const createRazorpayOrder = async (
  amount: number,
  enquiryId: string,
  userId: string,
  planId: string
): Promise<{ orderId: string; amount: number; currency: string }> => {
  try {
    // Use Firebase Cloud Functions URL
    const functionsUrl = 'https://us-central1-pal-519d0.cloudfunctions.net';
    const orderUrl = `${functionsUrl}/createRazorpayOrder`;
    
    console.log('🌐 Creating Razorpay order:', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      functionsUrl,
      orderUrl,
      amount,
      enquiryId,
      userId,
      planId
    });
    
    // Validate amount before sending
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount: Amount must be greater than 0');
    }
    
    // Round amount to 2 decimal places first to avoid floating point issues
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Ensure minimum amount (Razorpay minimum is 1 rupee = 100 paise)
    // Convert to paise - multiply by 100 and round to integer
    const amountInPaise = Math.round(roundedAmount * 100);
    if (amountInPaise < 100) {
      throw new Error('Amount too small: Minimum amount is ₹1');
    }
    
    const requestBody = {
      amount: amountInPaise, // Convert to paise
      currency: 'INR',
      enquiryId,
      userId,
      planId,
    };
    
    console.log('📡 Creating order via Cloud Functions:', orderUrl);
    console.log('📦 Request body:', requestBody);
    console.log('💰 Amount details:', { 
      originalAmount: amount, 
      roundedAmount, 
      amountInPaise, 
      currency: 'INR',
      amountInRupees: (amountInPaise / 100).toFixed(2)
    });
    
    const response = await fetch(orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Get response text first to see what we're dealing with
    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response text:', responseText);

    if (!response.ok) {
      let errorMessage = 'Failed to create order';
      let errorDetails: any = {};
      
      try {
        errorDetails = JSON.parse(responseText);
        errorMessage = errorDetails.error || errorDetails.details || errorDetails.message || `Server error (${response.status})`;
        console.error('❌ Order creation error details:', errorDetails);
      } catch (e) {
        // If response is not JSON, use the text
        errorMessage = responseText || `Server error (${response.status}). Please check Firebase Functions configuration.`;
        console.error('❌ Order creation error (non-JSON):', responseText);
      }
      
      // More specific error message
      if (response.status === 500) {
        errorMessage = `Server error: ${errorMessage}. Please check Firebase Functions logs and ensure Razorpay credentials are configured.`;
      }
      
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Order created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment via Firebase Cloud Functions
const verifyRazorpayPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  enquiryId: string,
  userId: string,
  planId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use Firebase Cloud Functions URL
    const functionsUrl = 'https://us-central1-pal-519d0.cloudfunctions.net';
    const verifyUrl = `${functionsUrl}/verifyRazorpayPayment`;
    console.log('🔍 Verifying payment via Cloud Functions:', verifyUrl);
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        enquiryId,
        userId,
        planId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Payment verification failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
};

// Process payment with Razorpay integration
export const processPayment = async (
  enquiryId: string,
  userId: string,
  plan: PaymentPlan,
  paymentDetails: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    name?: string;
    email?: string;
    contact?: string;
  }
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    console.log('🚀 Starting Razorpay payment process...');

    // Load Razorpay script
    await loadRazorpayScript();
    console.log('✅ Razorpay script loaded');

    // Create order via backend
    const order = await createRazorpayOrder(plan.price, enquiryId, userId, plan.id);
    console.log('✅ Razorpay order created:', order.orderId);

    // Get Razorpay Key ID
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (!razorpayKeyId) {
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const errorMessage = isProduction
        ? 'Razorpay Key ID not configured. Please add VITE_RAZORPAY_KEY_ID in Vercel Dashboard → Settings → Environment Variables.'
        : 'Razorpay Key ID not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file.';
      console.error('❌ Razorpay Configuration Error:', errorMessage);
      console.error('📍 Current hostname:', window.location.hostname);
      console.error('📍 Environment check:', {
        isProduction,
        hasKeyId: !!razorpayKeyId,
        envKeys: Object.keys(import.meta.env).filter(key => key.includes('RAZORPAY') || key.includes('VITE'))
      });
      throw new Error(errorMessage);
    }
    
    console.log('✅ Razorpay Key ID loaded:', razorpayKeyId.substring(0, 10) + '...');

    // Initialize Razorpay checkout
    return new Promise((resolve) => {
      // CRITICAL: Remove any blocking overlays and ensure body scroll is enabled
      // Hide all app overlays that might block Razorpay
      const hideAppOverlays = () => {
        // Hide Radix dialog overlays
        const radixOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        radixOverlays.forEach(overlay => {
          (overlay as HTMLElement).style.display = 'none';
          (overlay as HTMLElement).style.pointerEvents = 'none';
        });
        
        // Hide any fixed overlays with z-50 or lower (but not Razorpay itself)
        const appOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
        appOverlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          // Skip Razorpay elements
          if (el.classList.contains('razorpay-container') || 
              el.closest('.razorpay-container') || 
              el.querySelector('[class*="razorpay"]')) {
            return;
          }
          const zIndex = window.getComputedStyle(el).zIndex;
          if (zIndex && parseInt(zIndex) < 10000) {
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
          }
        });
      };
      
      // Restore app overlays function
      const restoreAppOverlays = () => {
        const radixOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        radixOverlays.forEach(overlay => {
          (overlay as HTMLElement).style.display = '';
          (overlay as HTMLElement).style.pointerEvents = '';
        });
        const appOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
        appOverlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          // Skip Razorpay elements
          if (el.classList.contains('razorpay-container') || 
              el.closest('.razorpay-container') || 
              el.querySelector('[class*="razorpay"]')) {
            return;
          }
          el.style.display = '';
          el.style.pointerEvents = '';
        });
      };
      
      // Ensure body scroll is NOT locked
      document.body.style.overflow = '';
      document.body.style.overflowY = 'auto';
      document.body.style.position = 'relative';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = 'auto';
      
      // Hide app overlays
      hideAppOverlays();
      
      // Add a history entry so we can detect back button press
      const state = { razorpayModal: true };
      window.history.pushState(state, '', window.location.href);
      
      let razorpayInstance: any = null;
      
      // Handle browser back button to close Razorpay modal
      const handlePopState = (event: PopStateEvent) => {
        console.log('⚠️ Browser back button pressed - closing Razorpay modal');
        window.removeEventListener('popstate', handlePopState);
        // Restore app overlays
        restoreAppOverlays();
        // Close the Razorpay modal if it's open
        if (razorpayInstance) {
          try {
            razorpayInstance.close();
          } catch (e) {
            console.log('Razorpay modal already closed');
          }
        }
        resolve({
          success: false,
          error: 'Payment cancelled by user',
        });
      };
      
      window.addEventListener('popstate', handlePopState);
      
      const options = {
        key: razorpayKeyId,
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'Enqir',
        description: `${plan.name} Plan - ${plan.responses === -1 ? 'Unlimited' : plan.responses} responses`,
        order_id: order.orderId,
        handler: async function (response: any) {
          console.log('💳 Payment completed, verifying...', response);
          
          // Restore app overlays
          restoreAppOverlays();
          
          // Remove back button listener on successful payment
          window.removeEventListener('popstate', handlePopState);
          
          try {
            // Verify payment on backend
            const verifyResult = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
      enquiryId,
      userId,
              plan.id,
              plan.price
            );

            if (verifyResult.success) {
              console.log('✅ Payment verified successfully');
              resolve({
                success: true,
                transactionId: response.razorpay_payment_id,
              });
            } else {
              console.error('❌ Payment verification failed:', verifyResult.error);
              resolve({
                success: false,
                error: verifyResult.error || 'Payment verification failed',
              });
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            resolve({
              success: false,
              error: 'Payment verification failed. Please contact support.',
            });
          }
        },
        prefill: {
          name: paymentDetails.name || '',
          email: paymentDetails.email || '',
          contact: paymentDetails.contact || '',
        },
        theme: {
          color: '#2563eb', // Blue color matching your app
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ Payment cancelled by user (close button or ESC)');
            // Restore app overlays
            restoreAppOverlays();
            // Restore body scroll when modal is dismissed
            document.body.style.overflow = '';
            document.body.style.overflowY = 'auto';
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowY = 'auto';
            // Remove back button listener when modal is dismissed
            window.removeEventListener('popstate', handlePopState);
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
          escape: true, // Allow ESC key to close
          backdropclose: true, // Allow clicking outside to close
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      console.log('🔧 Creating Razorpay instance...');
      razorpayInstance = new window.Razorpay(options);
      console.log('✅ Razorpay instance created');
      
      // CRITICAL: Wait a moment for Razorpay to initialize, then ensure it's on top and interactive
      setTimeout(() => {
        console.log('🔧 Ensuring Razorpay modal is visible and interactive...');
        // Ensure Razorpay modal has highest z-index and is interactive
        const razorpayElements = document.querySelectorAll('.razorpay-container, [class*="razorpay"], iframe[src*="razorpay"]');
        console.log('🔍 Found Razorpay elements:', razorpayElements.length);
        razorpayElements.forEach((element) => {
          const el = element as HTMLElement;
          el.style.zIndex = '99999';
          el.style.pointerEvents = 'auto';
          el.style.position = 'fixed';
          // Ensure all child elements are interactive
          const inputs = el.querySelectorAll('input, button, select, a, [role="button"]');
          inputs.forEach((input) => {
            (input as HTMLElement).style.pointerEvents = 'auto';
            (input as HTMLElement).style.touchAction = 'manipulation';
            (input as HTMLElement).style.cursor = 'pointer';
          });
        });
        
        // Ensure body scroll is still enabled
        document.body.style.overflow = '';
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowY = 'auto';
      }, 200);
      
      console.log('🚀 Opening Razorpay modal...');
      try {
        razorpayInstance.open();
        console.log('✅ Razorpay modal opened successfully');
      } catch (openError) {
        console.error('❌ Error opening Razorpay modal:', openError);
        restoreAppOverlays();
        window.removeEventListener('popstate', handlePopState);
        resolve({
          success: false,
          error: 'Failed to open payment gateway. Please try again.',
        });
      }
    });
  } catch (error) {
    console.error('❌ Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed. Please try again.',
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

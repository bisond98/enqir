import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, CheckCircle } from 'lucide-react';
import { PaymentPlan, PAYMENT_PLANS, getUpgradeOptions } from '@/config/paymentPlans';
import PaymentModal from './PaymentModal';
import { useToast } from '@/hooks/use-toast';
// PRO PLAN - KEPT FOR FUTURE UPDATES
import { getUserPaymentPlan, hasProEnquiriesRemaining } from '@/services/paymentService';

interface PaymentPlanSelectorProps {
  currentPlanId?: string;
  enquiryId: string;
  userId: string;
  onPlanSelect: (planId: string, price: number) => void;
  isUpgrade?: boolean;
  enquiryCreatedAt?: any; // For determining if enquiry is old vs new for Pro users
  className?: string;
  user?: any; // User object for payment processing
}

const PaymentPlanSelector: React.FC<PaymentPlanSelectorProps> = ({
  currentPlanId = 'free',
  enquiryId,
  userId,
  onPlanSelect,
  isUpgrade = false,
  enquiryCreatedAt,
  className = '',
  user
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<PaymentPlan | null>(null);
  const [hasProRemaining, setHasProRemaining] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userCurrentPlan, setUserCurrentPlan] = useState<string>('free');
  const [proActivationDate, setProActivationDate] = useState<any>(null);
  const { toast } = useToast();

  // Check if user has Pro plan with remaining enquiries
  useEffect(() => {
    const checkProStatus = async () => {
      setIsLoading(true);
      
      // Get user payment plan
      const userPaymentPlan = await getUserPaymentPlan(userId);
      if (userPaymentPlan) {
        setUserCurrentPlan(userPaymentPlan.currentPlan);
        setProActivationDate(userPaymentPlan.proActivationDate);
      }
      
      if (!isUpgrade) {
        const hasRemaining = await hasProEnquiriesRemaining(userId);
        setHasProRemaining(hasRemaining);
        
        // If user has Pro enquiries remaining, auto-select Premium (not Pro) 
        // because new enquiries automatically get premium features
        if (hasRemaining) {
          const premiumPlan = PAYMENT_PLANS.find(plan => plan.id === 'premium');
          if (premiumPlan) {
            setSelectedPlan('premium');
            // Auto-select Premium plan without payment
            setTimeout(() => onPlanSelect('premium', 0), 0);
          }
        }
      }
      setIsLoading(false);
    };
    
    checkProStatus();
  }, [userId, isUpgrade, onPlanSelect]);

  // Get available plans based on whether it's an upgrade or initial selection
  let availablePlans = isUpgrade 
    ? getUpgradeOptions(currentPlanId, userCurrentPlan, enquiryCreatedAt, proActivationDate)
    : hasProRemaining ? [] : PAYMENT_PLANS;

  // Ensure Premium is always available when upgrading from Basic or Standard
  if (isUpgrade && (currentPlanId === 'basic' || currentPlanId === 'standard')) {
    const premiumPlan = PAYMENT_PLANS.find(p => p.id === 'premium');
    if (premiumPlan && !availablePlans.find(p => p.id === 'premium')) {
      console.log('⚠️ Premium plan not in available plans, adding it explicitly');
      availablePlans = [...availablePlans, premiumPlan];
    }
  }

  // Get current plan price for upgrade calculations
  // IMPORTANT: Always get from PAYMENT_PLANS first to ensure correct price
  const currentPlanObj = PAYMENT_PLANS.find(p => p.id === currentPlanId) || availablePlans.find(p => p.id === currentPlanId);
  const currentPlanPrice = currentPlanObj?.price ?? 0;

  // Debug logging
  console.log('🔍 PaymentPlanSelector Debug:', {
    currentPlanId,
    currentPlanPrice,
    isUpgrade,
    availablePlansCount: availablePlans.length,
    availablePlans: availablePlans.map(p => ({ id: p.id, name: p.name, price: p.price })),
    allPlans: PAYMENT_PLANS.map(p => ({ id: p.id, price: p.price }))
  });

  const handlePlanSelect = (plan: PaymentPlan) => {
    setSelectedPlan(plan.id);
    setSelectedPlanData(plan);
    
    // If it's a free plan, call onPlanSelect directly
    if (plan.price === 0) {
      onPlanSelect(plan.id, plan.price);
    }
    // For upgrades, just select the plan - payment will happen when clicking "Upgrade Now"
    // For new enquiries, just select the plan - payment will happen on form submit
  };

  // Handle payment processing when "Upgrade Now" is clicked
  const handleUpgradeNow = async () => {
    const plan = availablePlans.find(p => p.id === selectedPlan);
    if (!plan || !user) return;
    
    try {
      const { processPayment } = await import('@/services/paymentService');
      
      // Calculate price difference for upgrade
      const priceDifference = plan.price - currentPlanPrice;
      const finalPrice = priceDifference > 0 ? priceDifference : plan.price;
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedFinalPrice = Math.round(finalPrice * 100) / 100;
      
      // Validate amount - must be greater than 0
      if (roundedFinalPrice <= 0) {
        console.warn('⚠️ Invalid upgrade amount:', { planPrice: plan.price, currentPlanPrice, priceDifference, finalPrice, roundedFinalPrice });
        throw new Error('Invalid upgrade amount. Please select a higher plan.');
      }
      
      // Ensure minimum amount (Razorpay minimum is 1 rupee = 100 paise)
      if (roundedFinalPrice < 1) {
        throw new Error('Upgrade amount is too small. Minimum amount is ₹1.');
      }
      
      console.log('🚀 Processing upgrade payment...', {
        planId: plan.id,
        planPrice: plan.price,
        currentPlanPrice,
        priceDifference,
        finalPrice,
        roundedFinalPrice,
        enquiryId
      });
      
      // Create plan with adjusted price for upgrade (use rounded price)
      const planForPayment = { ...plan, price: roundedFinalPrice };
      
      // Process payment directly - Razorpay will open
      const paymentResult = await processPayment(
        enquiryId,
        userId,
        planForPayment,
        {
          // Use user's info from Firebase auth - Razorpay will show its own card form
          name: user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
          contact: '', // Optional
        }
      );
      
      // CRITICAL: Check if payment actually succeeded - DO NOT proceed if payment failed
      if (!paymentResult.success) {
        const errorMsg = paymentResult.error || 'Payment failed. Razorpay did not complete successfully.';
        console.error('❌ Payment failed - NOT proceeding with upgrade:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // CRITICAL: Must have transaction ID from Razorpay
      if (!paymentResult.transactionId) {
        console.error('❌ No transaction ID - NOT proceeding with upgrade');
        throw new Error('Payment verification failed. No transaction ID received from Razorpay.');
      }
      
      console.log('✅ Razorpay payment completed successfully:', paymentResult.transactionId);
      
      // Save payment record and update enquiry after successful Razorpay payment
      try {
        const { savePaymentRecord, updateEnquiryPremiumStatus, updateUserPaymentPlan } = await import('@/services/paymentService');
        
        // Save payment record with REAL transaction ID from Razorpay
        const paymentRecordId = await savePaymentRecord(
          enquiryId,
          userId,
          plan,
          paymentResult.transactionId
        );
        
        // Update enquiry premium status
        await updateEnquiryPremiumStatus(enquiryId, true, plan.id);
        
        // Update user payment plan
        await updateUserPaymentPlan(userId, plan.id, paymentRecordId, enquiryId);
        
        console.log('✅ Payment record saved and enquiry updated');
      } catch (error) {
        console.error('❌ Error saving payment record:', error);
        // Still call onPlanSelect so the UI updates, but log the error
      }
      
      // Call onPlanSelect with the plan details after successful payment
      onPlanSelect(plan.id, plan.price);
    } catch (error: any) {
      console.error('❌ Error processing upgrade payment:', error);
      // CRITICAL: Do NOT call onPlanSelect - payment failed!
      // Show error to user and do NOT proceed with upgrade
      const errorMessage = error?.message || 'Payment failed. Please try again.';
      console.error('🚫 Upgrade blocked - payment failed:', errorMessage);
      
      // Show error toast to user
      toast({
        title: 'Payment Failed',
        description: errorMessage.includes('Server error') 
          ? 'Unable to connect to payment server. Please check your internet connection and try again.'
          : errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = (planId: string, price: number) => {
    onPlanSelect(planId, price);
    setShowPaymentModal(false);
  };

  const getPlanIcon = (plan: PaymentPlan) => {
    if (plan.isPro) return <Crown className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-yellow-500" />;
    if (plan.isPopular) return <Star className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-500" />;
    return <Zap className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-gray-400" />;
  };

  const getPlanBadge = (plan: PaymentPlan) => {
    if (plan.isPro) return <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 h-5 sm:h-5 font-semibold">Pro</Badge>;
    if (plan.isPopular) return <Badge className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 h-5 sm:h-5 font-semibold">Popular</Badge>;
    return null;
  };

  // PRO PLAN CHECK - KEPT FOR FUTURE UPDATES
  // If user has Pro remaining and it's not an upgrade, don't render the component at all
  // if (hasProRemaining && !isUpgrade) {
  //   return null;
  // }

  return (
    <div className={`space-y-2.5 sm:space-y-3 md:space-y-4 ${className}`}>
      <div className="text-center mb-2.5 sm:mb-4 md:mb-5 px-1 sm:px-0">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2">
          {isUpgrade ? 'Upgrade Your Plan' : 'Choose Your Plan'}
        </h3>
        <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 leading-relaxed px-2 sm:px-0">
          {isUpgrade 
            ? 'Unlock premium responses' 
            : 'Select the plan that works best for you'
          }
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3 md:space-y-2.5 min-h-[120px]">
        {availablePlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all duration-200 overflow-hidden ${
              selectedPlan === plan.id
                ? 'ring-2 ring-blue-500 shadow-lg border-2 border-blue-400'
                : 'hover:shadow-md'
            } ${
              plan.isPopular 
                ? 'border border-blue-200 bg-blue-50/30' 
                : 'border border-gray-200'
            }`}
          >
            {/* Card Header */}
            <div className="bg-gray-800 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 h-auto min-h-[50px] sm:min-h-[52px] md:min-h-[48px] flex items-center">
              <div className="flex items-center justify-between w-full gap-1.5 sm:gap-2">
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getPlanIcon(plan)}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white flex items-center gap-1 sm:gap-1.5">
                      <span className="truncate">{plan.name}</span>
                      {getPlanBadge(plan)}
                    </h3>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-1 sm:ml-0">
                  <div className="text-sm sm:text-base md:text-lg font-semibold text-white whitespace-nowrap">
                    ₹{plan.price}
                  </div>
                  {plan.price > 0 && (
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-300 whitespace-nowrap">per enquiry</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Card Content */}
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              {/* Description */}
              <div className="mb-2 sm:mb-2.5 md:mb-2 text-center">
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-700 leading-relaxed">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-1.5 sm:space-y-2 md:space-y-1.5 mb-2.5 sm:mb-3 md:mb-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-1.5 sm:space-x-2">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] sm:text-xs md:text-sm text-gray-700 leading-relaxed flex-1">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <div className="mt-2.5 sm:mt-3 md:mt-2.5 pt-2.5 sm:pt-3 md:pt-2 border-t border-gray-200">
                <Button
                  size="sm"
                  className={`w-full h-9 sm:h-8 text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-[32px] ${
                    selectedPlan === plan.id
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                  } px-3 sm:px-4`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan);
                  }}
                >
                  {selectedPlan === plan.id ? '✓ Selected' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan !== currentPlanId && (() => {
        const selectedPlanObj = availablePlans.find(p => p.id === selectedPlan);
        if (!selectedPlanObj) return null;
        
        // Calculate price difference for upgrade
        const priceDifference = selectedPlanObj.price - currentPlanPrice;
        const finalPrice = isUpgrade && priceDifference > 0 ? priceDifference : selectedPlanObj.price;
        // Round to avoid floating point issues
        const roundedFinalPrice = Math.round(finalPrice * 100) / 100;
        
        return (
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 mb-1 sm:mb-1.5">
                  {isUpgrade ? 'Upgrade Confirmation' : 'Plan Selected'}
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-blue-700 leading-relaxed">
                  {isUpgrade 
                    ? (
                      <>
                        <span className="block sm:inline">You will be charged </span>
                        <span className="font-bold">₹{roundedFinalPrice}</span>
                        <span className="block sm:inline sm:ml-1"> for the upgrade</span>
                        <span className="hidden sm:inline"> ({selectedPlanObj.name}: ₹{selectedPlanObj.price} - Current: ₹{currentPlanPrice})</span>
                      </>
                    )
                    : `Proceed to payment to activate ${selectedPlanObj.name} plan (₹${selectedPlanObj.price})`
                  }
                </p>
              </div>
              <Button
                size="sm"
                className="h-10 sm:h-9 md:h-8 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 flex-shrink-0 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isUpgrade && user) {
                    // For upgrades, process payment via Razorpay
                    handleUpgradeNow();
                  } else {
                    // For new enquiries, just call onPlanSelect
                    onPlanSelect(selectedPlanObj.id, selectedPlanObj.price);
                  }
                }}
              >
                {isUpgrade ? 'Upgrade Now' : 'Continue'}
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {selectedPlanData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedPlan={selectedPlanData}
          enquiryId={enquiryId}
          userId={userId}
          onPaymentSuccess={handlePaymentSuccess}
          isUpgrade={isUpgrade}
          currentPlanPrice={currentPlanPrice}
        />
      )}
    </div>
  );
};

export default PaymentPlanSelector;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, CheckCircle, Loader2 } from 'lucide-react';
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
  squareCards?: boolean; // When true, render plan cards with square corners (no rounding)
}

const PaymentPlanSelector: React.FC<PaymentPlanSelectorProps> = ({
  currentPlanId = 'free',
  enquiryId,
  userId,
  onPlanSelect,
  isUpgrade = false,
  enquiryCreatedAt,
  className = '',
  user,
  squareCards = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<PaymentPlan | null>(null);
  const [hasProRemaining, setHasProRemaining] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
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

  // Handle payment processing when plan is selected for upgrade
  const handleUpgradeNow = async (planId?: string) => {
    const planToUse = planId 
      ? availablePlans.find(p => p.id === planId)
      : availablePlans.find(p => p.id === selectedPlan);
    const plan = planToUse;
    if (!plan || !user || isProcessingPayment) return;
    
    try {
      setIsProcessingPayment(true);
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
      
      // Update selected plan state
      setSelectedPlan(plan.id);
      setSelectedPlanData(plan);
      
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
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePlanSelect = (plan: PaymentPlan) => {
    setSelectedPlan(plan.id);
    setSelectedPlanData(plan);
    
    // IMPORTANT: When isUpgrade=false (new enquiry), NEVER process payment here
    // Payment will only happen when user clicks "Post Enquiry" button in the form
    // For free plans, call immediately
    // For paid plans in new enquiries, just store the selection - payment happens on form submit
    // For upgrades with paid plans, process payment immediately when selecting
    if (plan.price === 0 || !isUpgrade) {
      // Just notify parent of selection - NO payment processing
      onPlanSelect(plan.id, plan.price);
    } else if (isUpgrade && plan.price > 0 && user) {
      // For upgrades with paid plans, process payment immediately
      handleUpgradeNow(plan.id);
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
    <div className={`space-y-2.5 sm:space-y-3 md:space-y-4 w-full pb-8 sm:pb-10 md:pb-12 ${className}`}>
      <div className="text-center mb-3 sm:mb-4 md:mb-5 min-h-[60px] sm:min-h-0 hidden">
        <h3 className="hidden text-base sm:text-lg md:text-xl lg:text-2xl font-black text-black mb-2 sm:mb-2.5 md:mb-3">
          {isUpgrade ? 'Upgrade Your Plan' : 'Choose Your Plan'}
        </h3>
        <p className="hidden text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed font-semibold">
          {isUpgrade 
            ? 'Unlock premium responses' 
            : 'Your call — upgrade enquiries anytime from the dashboard.'
          }
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3 md:space-y-2.5 min-h-[120px]">
        {availablePlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all duration-200 overflow-hidden group/plan ${
              selectedPlan === plan.id
                ? 'border-[0.5px] border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                : 'border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
            } ${
              plan.isPopular 
                ? 'bg-gradient-to-br from-blue-50 via-white to-blue-50/50' 
                : 'bg-gradient-to-br from-white via-white to-gray-50'
            } ${squareCards ? 'rounded-none' : 'rounded-xl sm:rounded-2xl'} hover:scale-[1.02] active:scale-[0.98]`}
          >
            {/* Physical button depth effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl sm:rounded-2xl pointer-events-none" />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/plan:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl sm:rounded-2xl" />
            {/* Card Header */}
            <div className="bg-black px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 h-auto min-h-[50px] sm:min-h-[52px] md:min-h-[48px] flex items-center relative z-10">
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
            <CardContent className="p-3 sm:p-3 md:p-4 relative z-10">
              {/* Description */}
              <div className="mb-3 sm:mb-2.5 md:mb-2 text-center">
                <p className="text-[10px] sm:text-[10px] md:text-xs text-black leading-relaxed font-black">{plan.description}</p>
              </div>

              {/* Features - Optimized for Mobile */}
              <div className="space-y-2 sm:space-y-1.5 md:space-y-1.5 mb-3 sm:mb-3 md:mb-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-1.5">
                    <Check className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] sm:text-[10px] md:text-xs text-gray-700 leading-relaxed flex-1 break-words">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <div className="mt-2.5 sm:mt-3 md:mt-2.5 pt-2.5 sm:pt-3 md:pt-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingPayment}
                  className={`w-full h-9 sm:h-10 md:h-9 text-xs sm:text-sm font-black min-h-[44px] sm:min-h-[40px] relative overflow-hidden group/select border-[0.5px] border-black transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                      : 'bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)]'
                  } px-3 sm:px-4 rounded-lg sm:rounded-xl`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isProcessingPayment) {
                      // For upgrades with paid plans, this will trigger payment immediately
                      // For new enquiries, this just selects the plan
                      handlePlanSelect(plan);
                    }
                  }}
                >
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/select:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl" />
                  <span className="relative z-10">
                    {isProcessingPayment && selectedPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : selectedPlan === plan.id ? '✓ Selected' : 'Select'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


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

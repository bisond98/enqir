import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, CheckCircle } from 'lucide-react';
import { PaymentPlan, PAYMENT_PLANS, getUpgradeOptions } from '@/config/paymentPlans';
import PaymentModal from './PaymentModal';
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
}

const PaymentPlanSelector: React.FC<PaymentPlanSelectorProps> = ({
  currentPlanId = 'free',
  enquiryId,
  userId,
  onPlanSelect,
  isUpgrade = false,
  enquiryCreatedAt,
  className = ''
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<PaymentPlan | null>(null);
  const [hasProRemaining, setHasProRemaining] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userCurrentPlan, setUserCurrentPlan] = useState<string>('free');
  const [proActivationDate, setProActivationDate] = useState<any>(null);

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

  // Debug logging
  console.log('🔍 PaymentPlanSelector Debug:', {
    currentPlanId,
    isUpgrade,
    availablePlansCount: availablePlans.length,
    availablePlans: availablePlans.map(p => ({ id: p.id, name: p.name, price: p.price }))
  });

  const handlePlanSelect = (plan: PaymentPlan) => {
    setSelectedPlan(plan.id);
    setSelectedPlanData(plan);
    
    // If it's a free plan, call onPlanSelect directly
    if (plan.price === 0) {
      onPlanSelect(plan.id, plan.price);
    } else if (isUpgrade) {
      // For upgrades, show payment modal immediately
      setShowPaymentModal(true);
    } else {
      // For new enquiries, just select the plan - payment will happen on form submit
      onPlanSelect(plan.id, plan.price);
    }
  };

  const handlePaymentSuccess = (planId: string, price: number) => {
    onPlanSelect(planId, price);
    setShowPaymentModal(false);
  };

  const currentPlan = availablePlans.find(plan => plan.id === currentPlanId);
  const currentPlanPrice = currentPlan?.price || 0;

  const getPlanIcon = (plan: PaymentPlan) => {
    if (plan.isPro) return <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" />;
    if (plan.isPopular) return <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />;
    return <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />;
  };

  const getPlanBadge = (plan: PaymentPlan) => {
    if (plan.isPro) return <Badge className="bg-yellow-100 text-yellow-800 text-[8px] sm:text-[9px] px-0.5 py-0 h-3.5 sm:h-4">Pro</Badge>;
    if (plan.isPopular) return <Badge className="bg-blue-100 text-blue-800 text-[8px] sm:text-[9px] px-0.5 py-0 h-3.5 sm:h-4">Popular</Badge>;
    return null;
  };

  // PRO PLAN CHECK - KEPT FOR FUTURE UPDATES
  // If user has Pro remaining and it's not an upgrade, don't render the component at all
  // if (hasProRemaining && !isUpgrade) {
  //   return null;
  // }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
          {isUpgrade ? 'Upgrade Your Plan' : 'Choose Your Plan'}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600">
          {isUpgrade 
            ? 'Unlock more responses for this enquiry' 
            : 'Select the plan that works best for you'
          }
        </p>
      </div>

      <div className="space-y-1.5 sm:space-y-2 min-h-[120px]">
        {availablePlans.length === 0 && isUpgrade && (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're Already at the Top! 🎉</h3>
            <p className="text-gray-600 text-center max-w-md">
              {currentPlanId === 'pro' 
                ? 'Your enquiry has Pro features with unlimited responses. This is the highest tier!'
                : 'Your enquiry already has Premium features with unlimited responses. Enjoy full access to all seller responses!'}
            </p>
          </div>
        )}
        
        {availablePlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
              selectedPlan === plan.id
                ? 'ring-2 ring-blue-500 shadow-md border-blue-300'
                : 'hover:shadow-sm'
            } ${
              plan.isPopular ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
            }`}
            onClick={() => handlePlanSelect(plan)}
          >
            {/* Card Header - Ultra Compact with gray background */}
            <div className="bg-gray-800 px-2.5 sm:px-3 py-2 h-auto min-h-[42px] flex items-center">
              <div className="flex items-center justify-between w-full gap-1.5">
                <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getPlanIcon(plan)}
                  </div>
                  <h3 className="text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1 truncate">
                    {plan.name}
                    {getPlanBadge(plan)}
                  </h3>
                </div>
                <div className="text-right flex-shrink-0 ml-1.5">
                  <div className="text-xs sm:text-sm font-bold text-white">
                    ₹{plan.price}
                  </div>
                  {plan.price > 0 && (
                    <div className="text-[9px] text-gray-300">per enquiry</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Card Content - Ultra Compact with white background */}
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Left side - Plan info */}
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <input
                    type="radio"
                    name="paymentPlan"
                    checked={selectedPlan === plan.id}
                    onChange={() => handlePlanSelect(plan)}
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] text-gray-600 truncate">{plan.description}</p>
                  </div>
                </div>

                {/* Center - Features (Desktop only) */}
                <div className="hidden lg:flex flex-1 justify-center max-w-md">
                  <div className="space-y-0.5">
                    {plan.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <Check className="h-2 w-2 text-green-500 flex-shrink-0" />
                        <span className="text-[9px] sm:text-[10px] text-gray-700 truncate">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 2 && (
                      <div className="text-[9px] sm:text-[10px] text-gray-500 ml-3">
                        +{plan.features.length - 2} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Button */}
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    className={`h-6 sm:h-7 text-[9px] sm:text-[10px] ${
                      selectedPlan === plan.id
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } px-2 sm:px-3`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan);
                    }}
                  >
                    <span className="hidden sm:inline">
                      {selectedPlan === plan.id ? 'Selected' : 'Select'}
                    </span>
                    <span className="sm:hidden">
                      {selectedPlan === plan.id ? '✓' : 'Select'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Mobile features - shown on small screens */}
              <div className="sm:hidden mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-1">
                      <Check className="h-2 w-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[10px] text-gray-700 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan !== currentPlanId && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-blue-900">
                {isUpgrade ? 'Upgrade Confirmation' : 'Plan Selected'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-blue-700">
                {isUpgrade 
                  ? 'You will be charged the difference for the upgrade'
                  : 'Proceed to payment to activate this plan'
                }
              </p>
            </div>
            <Button
              size="sm"
              className="h-6 sm:h-7 text-[9px] sm:text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3 flex-shrink-0"
              onClick={() => {
                const plan = availablePlans.find(p => p.id === selectedPlan);
                if (plan) {
                  onPlanSelect(plan.id, plan.price);
                }
              }}
            >
              {isUpgrade ? 'Upgrade Now' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

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

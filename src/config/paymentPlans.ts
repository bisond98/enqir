export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  responses: number; // -1 means unlimited
  description: string;
  features: string[];
  isPopular?: boolean;
  isPro?: boolean;
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    responses: 2,
    description: 'AI-powered smart matching with verified sellers',
    features: ['Unlock 2 AI-ranked seller responses', 'Smart seller matching', 'Mobile-optimized experience']
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    responses: 5,
    description: 'Unlock more AI-curated quality responses',
    features: ['Unlock 5 AI-ranked seller responses', 'Priority AI matching', 'Smart response filtering']
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 199,
    responses: 10,
    description: 'AI-powered premium access to top sellers',
    features: ['Unlock 10 AI-ranked seller responses', 'Advanced AI recommendations', 'AI-powered search filters']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499,
    responses: -1, // unlimited
    description: 'Unlimited AI-matched seller connections',
    features: ['Unlock ALL AI-ranked seller responses', 'Exclusive premium sellers', 'Priority AI processing'],
    isPopular: true
  }
  // PRO PLAN - KEPT FOR FUTURE UPDATES
  // {
  //   id: 'pro',
  //   name: 'Pro',
  //   price: 1499,
  //   responses: -1, // unlimited
  //   description: 'Next 10 enquiries get unlimited AI-matched responses',
  //   features: ['🎉 10 enquiries with unlimited responses', '🤖 Dedicated AI matching', '⚡ Instant auto-premium activation'],
  //   isPro: true
  // }
];

export const getUpgradeOptions = (
  currentPlanId: string, 
  userCurrentPlan?: string, 
  enquiryCreatedAt?: any,
  proActivationDate?: any // Kept for future Pro plan updates
): PaymentPlan[] => {
  console.log('🔍 getUpgradeOptions called with:', { currentPlanId, userCurrentPlan });
  
  // Premium is now the highest tier - no upgrades available
  if (currentPlanId === 'premium') {
    console.log('⚠️ Already premium, no upgrades available');
    return [];
  }
  
  const currentPlanIndex = PAYMENT_PLANS.findIndex(plan => plan.id === currentPlanId);
  if (currentPlanIndex === -1) {
    console.log('⚠️ Current plan not found, returning all paid plans');
    return PAYMENT_PLANS.filter(p => p.id !== 'free');
  }
  
  const currentPlan = PAYMENT_PLANS[currentPlanIndex];
  const currentPlanPrice = currentPlan.price;
  
  console.log('📊 Current plan details:', { 
    id: currentPlan.id, 
    name: currentPlan.name, 
    price: currentPlanPrice 
  });
  
  // Get all plans higher than current (excluding Pro - kept for future updates)
  // This allows jumping directly from basic to premium
  let availablePlans = PAYMENT_PLANS.filter(plan => {
    const isHigher = plan.price > currentPlanPrice;
    const isNotPro = plan.id !== 'pro';
    const isNotFree = plan.id !== 'free';
    const isNotCurrent = plan.id !== currentPlanId;
    return isHigher && isNotPro && isNotFree && isNotCurrent;
  });
  
  console.log('✅ Available upgrade plans:', availablePlans.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price
  })));
  
  // PRO PLAN LOGIC - KEPT FOR FUTURE UPDATES
  // If enquiry is already Pro, no upgrades available (highest tier)
  // if (currentPlanId === 'pro') return [];
  // If enquiry is Premium, only allow upgrade to Pro if user has NEVER activated Pro before
  // if (currentPlanId === 'premium') {
  //   if (proActivationDate) return [];
  //   return PAYMENT_PLANS.filter(plan => plan.id === 'pro');
  // }
  // If user has already activated Pro before, exclude Pro from all upgrade options
  // if (proActivationDate) {
  //   availablePlans = availablePlans.filter(plan => plan.id !== 'pro');
  // }
  
  return availablePlans;
};

export const getPlanById = (planId: string): PaymentPlan | undefined => {
  return PAYMENT_PLANS.find(plan => plan.id === planId);
};

export const getPlanByPrice = (price: number): PaymentPlan | undefined => {
  return PAYMENT_PLANS.find(plan => plan.price === price);
};

export const getResponsesText = (responses: number): string => {
  if (responses === -1) return 'Unlimited';
  return `${responses} ${responses === 1 ? 'response' : 'responses'}`;
};

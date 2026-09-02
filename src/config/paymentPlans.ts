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
    id: 'premium',
    name: 'Premium',
    price: 10,
    responses: -1,
    description: 'Post your enquiry to connect with sellers',
    features: ['Post your enquiry', 'Connect with all sellers', 'AI-powered matching'],
    isPopular: true
  }
];

export const getUpgradeOptions = (
  currentPlanId: string,
  userCurrentPlan?: string,
  enquiryCreatedAt?: any,
  proActivationDate?: any
): PaymentPlan[] => {
  return [];
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

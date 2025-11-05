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

export interface EnquiryPayment {
  enquiryId: string;
  userId: string;
  planId: string;
  planPrice: number;
  responsesUnlocked: number;
  isUnlimited: boolean;
  purchasedAt: Date;
  isActive: boolean;
}

export interface UserPaymentPlan {
  userId: string;
  currentPlan: string; // planId
  proEnquiriesRemaining?: number; // for Pro plan
  totalSpent: number;
  lastUpgrade?: Date;
}

export interface PaymentUpgrade {
  fromPlanId: string;
  toPlanId: string;
  priceDifference: number;
  enquiryId: string;
  userId: string;
  upgradedAt: Date;
}

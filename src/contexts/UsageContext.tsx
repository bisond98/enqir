import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User as FirebaseUser } from 'firebase/auth';

interface UsageStats {
  enquiriesPosted: number;
  supplierSubmissions: number;
  responseViewsUsed: { [enquiryId: string]: number };
  purchasedCredits: {
    enquiries: number;
    submissions: number;
    responseViews: number;
  };
  premiumSubscription: boolean;
  premiumSubscriptionExpiry?: Date;
  premiumEnquiries: string[]; // Array of enquiry IDs that have been upgraded to premium
  monthlyEnquiriesUsed: number; // For monthly subscription tracking
  premiumPackPurchased: boolean; // Whether user has purchased the 10 Premium Enquiries Pack
  premiumPackEnquiriesUsed: number; // Number of premium enquiries used from the pack
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'supplier' | 'both';
}

interface UsageContextType {
  user: User | null;
  usageStats: UsageStats;
  setUser: (user: User | null) => void;
  canPostEnquiry: () => boolean;
  canSubmitResponse: () => boolean;
  canViewResponse: (enquiryId: string) => boolean;
  canViewAllResponses: (enquiryId: string) => boolean;
  getResponseViewLimit: (enquiryId: string) => { canView: number; total: number; isPremium: boolean };
  incrementEnquiries: () => void;
  incrementSubmissions: () => void;
  incrementResponseViews: (enquiryId: string) => void;
  getRemainingEnquiries: () => number;
  getRemainingSubmissions: () => number;
  getRemainingResponseViews: (enquiryId: string) => number;
  purchaseCredits: (type: 'enquiries' | 'submissions' | 'responseViews', amount: number) => void;
  getAvailableCredits: (type: 'enquiries' | 'submissions' | 'responseViews') => number;
  purchasePremiumEnquiry: (enquiryId: string) => void;
  purchaseMonthlySubscription: () => void;
  purchasePremiumPack: () => void;
  getRemainingPremiumPackEnquiries: () => number;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

// No mock users in production; default to null

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safely get auth user with error handling
  let authUser = null;
  try {
    const { user } = useAuth();
    authUser = user;
  } catch (error) {
    // AuthProvider not ready yet during hot reload, continue with null user
    console.warn('UsageProvider: AuthProvider not ready yet, continuing with null user');
  }
  const [user, setUser] = useState<User | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    enquiriesPosted: 0,
    supplierSubmissions: 0,
    responseViewsUsed: {},
    purchasedCredits: {
      enquiries: 0,
      submissions: 0,
      responseViews: 0
    },
    premiumSubscription: false,
    premiumEnquiries: [],
    monthlyEnquiriesUsed: 0,
    premiumPackPurchased: false,
    premiumPackEnquiriesUsed: 0
  });

  // Load from localStorage when auth user changes (per-user storage)
  useEffect(() => {
    if (!authUser) {
      return;
    }
    const storageKey = `palUsageStats:${authUser.uid}`;
    const savedStats = localStorage.getItem(storageKey);
    if (savedStats) {
      setUsageStats(JSON.parse(savedStats));
    } else {
      // Fresh account defaults
      setUsageStats({
        enquiriesPosted: 0,
        supplierSubmissions: 0,
        responseViewsUsed: {},
        purchasedCredits: { enquiries: 0, submissions: 0, responseViews: 0 },
        premiumSubscription: false,
        premiumEnquiries: [],
        monthlyEnquiriesUsed: 0,
        premiumPackPurchased: false,
        premiumPackEnquiriesUsed: 0
      });
    }
  }, [authUser]);

  // Sync usage user with Firebase auth user
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.uid,
        email: authUser.email || '',
        name: authUser.displayName || authUser.email || 'User',
        role: 'both',
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  // Save to localStorage when stats change (per-user key)
  useEffect(() => {
    if (!authUser) return;
    const storageKey = `palUsageStats:${authUser.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(usageStats));
  }, [usageStats, authUser]);

  const canPostEnquiry = (): boolean => {
    if (!user) return false;
    // Unlimited free enquiries for buyers
    return true;
  };

  const canSubmitResponse = (): boolean => {
    if (!user) return false;
    const freeLimit = 5;
    const totalAvailable = freeLimit + usageStats.purchasedCredits.submissions;
    return usageStats.supplierSubmissions < totalAvailable;
  };

  const canViewResponse = (enquiryId: string): boolean => {
    if (!user) return false;
    const freeLimit = 2;
    const viewsForEnquiry = usageStats.responseViewsUsed[enquiryId] || 0;
    return viewsForEnquiry < freeLimit;
  };

  const canViewAllResponses = (enquiryId: string): boolean => {
    if (!user) return false;
    // Check if user has premium subscription or has paid for this specific enquiry
    return usageStats.premiumSubscription || usageStats.premiumEnquiries?.includes(enquiryId) || false;
  };

  const getResponseViewLimit = (enquiryId: string): { canView: number; total: number; isPremium: boolean } => {
    if (!user) return { canView: 0, total: 0, isPremium: false };
    
    const freeLimit = 2;
    const viewsForEnquiry = usageStats.responseViewsUsed[enquiryId] || 0;
    const isPremium = usageStats.premiumSubscription || usageStats.premiumEnquiries?.includes(enquiryId) || false;
    
    if (isPremium) {
      return { canView: 999, total: 999, isPremium: true };
    }
    
    return { 
      canView: Math.max(0, freeLimit - viewsForEnquiry), 
      total: freeLimit, 
      isPremium: false 
    };
  };

  const incrementEnquiries = () => {
    setUsageStats(prev => ({
      ...prev,
      enquiriesPosted: prev.enquiriesPosted + 1
    }));
  };

  const incrementSubmissions = () => {
    setUsageStats(prev => ({
      ...prev,
      supplierSubmissions: prev.supplierSubmissions + 1
    }));
  };

  const incrementResponseViews = (enquiryId: string) => {
    setUsageStats(prev => ({
      ...prev,
      responseViewsUsed: {
        ...prev.responseViewsUsed,
        [enquiryId]: (prev.responseViewsUsed[enquiryId] || 0) + 1
      }
    }));
  };

  const getRemainingEnquiries = (): number => {
    if (!user) return 0;
    const freeLimit = 5;
    const totalAvailable = freeLimit + usageStats.purchasedCredits.enquiries;
    return Math.max(0, totalAvailable - usageStats.enquiriesPosted);
  };

  const getRemainingSubmissions = (): number => {
    if (!user) return 0;
    const freeLimit = 5;
    const totalAvailable = freeLimit + usageStats.purchasedCredits.submissions;
    return Math.max(0, totalAvailable - usageStats.supplierSubmissions);
  };

  const getRemainingResponseViews = (enquiryId: string): number => {
    if (!user) return 0;
    const freeLimit = 2;
    const totalViewsUsed = Object.values(usageStats.responseViewsUsed).reduce((sum, views) => sum + views, 0);
    const totalAvailable = freeLimit + usageStats.purchasedCredits.responseViews;
    return Math.max(0, totalAvailable - totalViewsUsed);
  };

  const purchaseCredits = (type: 'enquiries' | 'submissions' | 'responseViews', amount: number) => {
    setUsageStats(prev => ({
      ...prev,
      purchasedCredits: {
        ...prev.purchasedCredits,
        [type]: prev.purchasedCredits[type] + amount
      }
    }));
  };

  const getAvailableCredits = (type: 'enquiries' | 'submissions' | 'responseViews'): number => {
    if (!user) return 0;
    switch (type) {
      case 'enquiries':
        return 5 + usageStats.purchasedCredits.enquiries;
      case 'submissions':
        return 5 + usageStats.purchasedCredits.submissions;
      case 'responseViews':
        return 2 + usageStats.purchasedCredits.responseViews;
      default:
        return 0;
    }
  };

  const purchasePremiumEnquiry = (enquiryId: string) => {
    console.log('UsageContext: Purchasing premium for enquiry:', enquiryId);
    setUsageStats(prev => {
      // Prevent duplicates
      if (prev.premiumEnquiries.includes(enquiryId)) {
        console.log('UsageContext: Enquiry already premium, skipping');
        return prev;
      }
      const newStats = {
        ...prev,
        premiumEnquiries: [...prev.premiumEnquiries, enquiryId]
      };
      console.log('UsageContext: Updated premiumEnquiries:', newStats.premiumEnquiries);
      return newStats;
    });
  };

  const purchaseMonthlySubscription = () => {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    setUsageStats(prev => ({
      ...prev,
      premiumSubscription: true,
      premiumSubscriptionExpiry: expiryDate,
      monthlyEnquiriesUsed: 0
    }));
  };

  const purchasePremiumPack = () => {
    setUsageStats(prev => ({
      ...prev,
      premiumPackPurchased: true,
      premiumPackEnquiriesUsed: 0
    }));
  };

  const getRemainingPremiumPackEnquiries = () => {
    if (!usageStats.premiumPackPurchased) return 0;
    return 10 - usageStats.premiumPackEnquiriesUsed;
  };

  return (
    <UsageContext.Provider
      value={{
        user,
        usageStats,
        setUser,
        canPostEnquiry,
        canSubmitResponse,
        canViewResponse,
        canViewAllResponses,
        getResponseViewLimit,
        incrementEnquiries,
        incrementSubmissions,
        incrementResponseViews,
        getRemainingEnquiries,
        getRemainingSubmissions,
        getRemainingResponseViews,
        purchaseCredits,
        getAvailableCredits,
        purchasePremiumEnquiry,
        purchaseMonthlySubscription,
        purchasePremiumPack,
        getRemainingPremiumPackEnquiries,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};
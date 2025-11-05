import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

interface MockAuthContextType {
  user: MockUser | null;
  loading: boolean;
  isEmailVerified: boolean;
  isProfileVerified: boolean;
  profileVerificationStatus: string | null;
  showWelcomePopup: boolean;
  signUp: (identifier: string, password: string, userData?: { full_name?: string; first_name?: string; last_name?: string }) => Promise<{ error: any | null; requiresVerification?: boolean }>;
  signIn: (identifier: string, password: string) => Promise<{ error: any | null; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmation: () => Promise<{ error: any | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any | null }>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<{ error: any | null }>;
  verifyPhoneOTP: (otp: string, verificationId: string) => Promise<{ error: any | null }>;
  sendPhoneOTP: (phoneNumber: string) => Promise<{ error: any | null; verificationId?: string }>;
  deleteAccount: () => Promise<{ error: any | null }>;
  closeWelcomePopup: () => void;
  clearAuthState: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isProfileVerified, setIsProfileVerified] = useState<boolean>(false);
  const [profileVerificationStatus, setProfileVerificationStatus] = useState<string | null>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false);

  // Helper function to detect if input is email or phone
  const isEmail = (identifier: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  };

  const signUp = async (identifier: string, password: string, userData?: { full_name?: string; first_name?: string; last_name?: string }) => {
    try {
      setLoading(true);
      
      if (isEmail(identifier)) {
        // Simulate email signup
        const mockUser: MockUser = {
          uid: `mock_${Date.now()}`,
          email: identifier,
          displayName: userData?.full_name || 'Mock User',
          emailVerified: false
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        
        toast({
          title: 'Mock Account Created!',
          description: `Mock account created for ${identifier}. This is for testing only.`,
        });

        setLoading(false);
        return { error: null, requiresVerification: false };
      } else {
        toast({
          title: 'Phone authentication disabled',
          description: 'Please use email authentication in mock mode.',
          variant: 'destructive',
        });
        setLoading(false);
        return { error: new Error('Phone authentication disabled') };
      }
    } catch (error: any) {
      toast({
        title: 'Mock sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('🔧 Mock sign-in for:', identifier);
      setLoading(true);
      
      if (isEmail(identifier)) {
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          const mockUser = JSON.parse(storedUser);
          if (mockUser.email === identifier) {
            setUser(mockUser);
            setIsEmailVerified(true);
            setShowWelcomePopup(true);
            setLoading(false);
            return { error: null };
          }
        }
        
        // Create a new mock user if none exists
        const mockUser: MockUser = {
          uid: `mock_${Date.now()}`,
          email: identifier,
          displayName: 'Mock User',
          emailVerified: true
        };
        
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        setUser(mockUser);
        setIsEmailVerified(true);
        setShowWelcomePopup(true);
        setLoading(false);
        return { error: null };
      } else {
        toast({
          title: 'Phone authentication disabled',
          description: 'Please use email authentication in mock mode.',
          variant: 'destructive',
        });
        setLoading(false);
        return { error: new Error('Phone authentication disabled') };
      }
    } catch (error: any) {
      console.error("🔧 Mock signIn error:", error);
      toast({
        title: 'Mock sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔧 Mock sign-out');
      localStorage.removeItem('mockUser');
      setUser(null);
      setIsEmailVerified(false);
      setIsProfileVerified(false);
      setProfileVerificationStatus(null);
      setShowWelcomePopup(false);
      
      toast({ title: 'Mock signed out', description: 'You have been signed out from mock authentication.' });
      
      // Redirect to landing page
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error: any) {
      console.error('🔧 Mock sign-out error:', error);
      toast({
        title: 'Mock sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  const clearAuthState = () => {
    console.log('🔧 Clearing mock authentication state');
    setUser(null);
    setIsEmailVerified(false);
    setIsProfileVerified(false);
    setProfileVerificationStatus(null);
    setShowWelcomePopup(false);
    setLoading(false);
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const mockUser = JSON.parse(storedUser);
      setUser(mockUser);
      setIsEmailVerified(mockUser.emailVerified);
    }
  }, []);

  // Mock implementations for other methods
  const resendConfirmation = async () => {
    toast({ title: 'Mock email sent', description: 'Mock verification email resent.' });
    return { error: null };
  };

  const sendPasswordResetEmail = async (email: string) => {
    toast({ title: 'Mock password reset email sent', description: 'Mock password reset email sent.' });
    return { error: null };
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
    toast({ title: 'Mock password reset successful', description: 'Mock password reset successful.' });
    return { error: null };
  };

  const sendPhoneOTP = async (phoneNumber: string) => {
    toast({ title: 'Mock OTP sent', description: 'Mock OTP sent to phone number.' });
    return { error: null, verificationId: 'mock_verification_id' };
  };

  const verifyPhoneOTP = async (otp: string, verificationId: string) => {
    toast({ title: 'Mock phone verified', description: 'Mock phone number verified.' });
    return { error: null };
  };

  const deleteAccount = async () => {
    localStorage.removeItem('mockUser');
    setUser(null);
    toast({ title: 'Mock account deleted', description: 'Mock account deleted successfully.' });
    window.location.href = '/';
    return { error: null };
  };

  return (
    <MockAuthContext.Provider value={{ 
      user, 
      loading, 
      isEmailVerified,
      isProfileVerified,
      profileVerificationStatus,
      showWelcomePopup,
      signUp, 
      signIn, 
      signOut, 
      resendConfirmation,
      sendPasswordResetEmail,
      confirmPasswordReset,
      sendPhoneOTP,
      verifyPhoneOTP,
      deleteAccount,
      closeWelcomePopup,
      clearAuthState
    }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

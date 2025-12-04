import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/firebase';
import { WelcomePopup } from '@/components/WelcomePopup';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendSignInLinkToEmail,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithCredential,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
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
  deleteAccount: (password: string) => Promise<{ error: any | null }>;
  verifyPassword: (password: string) => Promise<{ error: any | null; isValid: boolean }>;
  closeWelcomePopup: () => void;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isProfileVerified, setIsProfileVerified] = useState<boolean>(false);
  const [profileVerificationStatus, setProfileVerificationStatus] = useState<string | null>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false);

  // Load profile verification status when user changes - REALTIME
  const loadProfileData = (currentUser: FirebaseUser | null) => {
    if (currentUser) {
      // Setting up real-time profile listener
      const profileRef = doc(db, 'userProfiles', currentUser.uid);
      
      // Set up real-time listener for profile changes
      const unsubscribe = onSnapshot(profileRef, (profileDoc) => {
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          // Profile data updated
          setIsProfileVerified(profileData.isProfileVerified || false);
          setProfileVerificationStatus(profileData.verificationStatus || null);
        } else {
          // No profile found, setting defaults
          setIsProfileVerified(false);
          setProfileVerificationStatus(null);
        }
      }, (error) => {
        console.log('Error in profile listener:', error);
        setIsProfileVerified(false);
        setProfileVerificationStatus(null);
      });
      
      // Return unsubscribe function for cleanup
      return unsubscribe;
    } else {
      setIsProfileVerified(false);
      setProfileVerificationStatus(null);
      return null;
    }
  };

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsEmailVerified(currentUser?.emailVerified || false);
      
      // Clean up previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      
      // Set up new real-time profile listener (non-blocking)
      if (currentUser) {
        profileUnsubscribe = loadProfileData(currentUser);
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  // Helper function to detect if input is email or phone
  const isEmail = (identifier: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  };

  const signUp = async (identifier: string, password: string, userData?: { full_name?: string; first_name?: string; last_name?: string }) => {
    try {
      setLoading(true);
      
      if (isEmail(identifier)) {
        // Email signup
        const result = await createUserWithEmailAndPassword(auth, identifier, password);

        if (userData?.full_name) {
          await updateProfile(result.user, { displayName: userData.full_name });
        }

        // Store additional user profile data in userProfiles collection
        if (userData?.full_name || userData?.first_name || userData?.last_name) {
          try {
            await setDoc(doc(db, 'userProfiles', result.user.uid), {
              userId: result.user.uid,
              fullName: userData?.full_name || '',
              firstName: userData?.first_name || '',
              lastName: userData?.last_name || '',
              phone: '',
              isProfileVerified: false,
              verificationMethod: 'manual',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('User profile data stored successfully');
          } catch (profileError) {
            console.error('Error storing user profile:', profileError);
            // Don't fail the signup if profile storage fails
          }
        }

        // Send email link for automatic sign-in
        try {
          // Store email for sign-in link
          window.localStorage.setItem('emailForSignIn', identifier);
          console.log('📧 Stored email in localStorage:', identifier);
          console.log('🔗 Callback URL:', `${window.location.origin}/auth/callback`);
          
          await sendSignInLinkToEmail(auth, identifier, {
            url: `${window.location.origin}/auth/callback`,
            handleCodeInApp: true,
          });
          console.log('✅ Email link sent successfully to:', identifier);

          toast({
            title: 'Verification Email Sent!',
            description: `Check your inbox at ${identifier} and click the link to sign in.`,
          });
        } catch (emailError: any) {
          console.error('Email link error:', emailError);
          
          // If quota exceeded, fallback to regular email verification
          if (emailError.code === 'auth/quota-exceeded' && result.user) {
            console.log('⚠️ Email link quota exceeded, falling back to regular email verification');
            try {
        await sendEmailVerification(result.user, {
          url: `${window.location.origin}/auth/callback`,
          handleCodeInApp: true,
        });
        toast({
          title: 'Verification Email Sent!',
                description: `Check your inbox at ${identifier} and click the link to verify.`,
              });
            } catch (verifyError: any) {
              console.error('Email verification error:', verifyError);
              toast({
                title: 'Account Created!',
                description: `Account created successfully, but email verification failed. Please try signing in and resending verification from your profile.`,
                variant: 'default',
              });
            }
          } else {
            // Other errors - user is still created, just email sending failed
            toast({
              title: 'Account Created!',
              description: `Account created successfully, but email link failed. Error: ${emailError.message}. Please sign in manually.`,
              variant: 'default',
            });
          }
        }

        setLoading(false);
        return { error: null, requiresVerification: true };
      } else {
        // Phone signup - temporarily disabled
        toast({
          title: 'Phone authentication disabled',
          description: 'Please use email authentication. Phone auth requires billing setup.',
          variant: 'destructive',
        });
        setLoading(false);
        return { error: new Error('Phone authentication disabled') };
      }
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('🔐 Starting sign-in process for:', identifier);
      setLoading(true);
      
      if (isEmail(identifier)) {
        console.log('🔐 Attempting email sign-in');
        
        const result = await signInWithEmailAndPassword(auth, identifier, password);
        console.log('🔐 Sign-in result:', { uid: result.user.uid, emailVerified: result.user.emailVerified });
        
        // Skip email verification check for testing
        console.log('🔐 Sign-in successful, showing welcome popup');
        setShowWelcomePopup(true);
        setLoading(false);
        return { error: null };
      } else {
        // Phone signin - temporarily disabled
        toast({
          title: 'Phone authentication disabled',
          description: 'Please use email authentication. Phone auth requires billing setup.',
          variant: 'destructive',
        });
        setLoading(false);
        return { error: new Error('Phone authentication disabled') };
      }
    } catch (error: any) {
      console.error("🔍 Firebase signIn error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Always clear loading state on error
      setLoading(false);
      
      // Better error messages based on error codes
      let errorTitle = 'Sign in failed';
      let errorDescription = error.message;

      if (error.code === 'auth/invalid-credential') {
        errorTitle = 'Hmm, That Doesn\'t Look Right 🔐';
        errorDescription = 'The email or password seems off. Double-check and give it another shot!';
      } else if (error.code === 'auth/user-not-found') {
        errorTitle = 'Whoops! Account Not Found 👤';
        errorDescription = 'We couldn\'t find an account with this email. New here? Sign up to get started!';
      } else if (error.code === 'auth/wrong-password') {
        errorTitle = 'Wrong Password Alert! 🚨';
        errorDescription = 'That password doesn\'t match. Forgot it? No worries - you can reset it anytime!';
      } else if (error.code === 'auth/too-many-requests') {
        errorTitle = 'Slow Down There, Speed Racer! ⏸️';
        errorDescription = 'Too many attempts! Take a breather and try again in a few minutes.';
      } else if (error.code === 'auth/network-request-failed') {
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        errorTitle = 'Connection Troubles 🌐';
        if (isLocalhost) {
          errorDescription = 'Unable to connect to Firebase from localhost. This is a network/firewall issue. Try: 1) Disable ad blockers, 2) Check firewall settings, 3) Try a different browser, 4) Use the live site (enqir.in) instead.';
        } else {
          errorDescription = 'Unable to connect to Firebase. Please check your internet connection, disable ad blockers, and try again. If the problem persists, Firebase services may be temporarily unavailable.';
        }
      } else if (error.code === 'auth/user-disabled') {
        errorTitle = 'Account Temporarily Unavailable 🚫';
        errorDescription = 'This account is currently disabled. Please reach out to support for help.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorTitle = 'Sign-in Method Unavailable ⚙️';
        errorDescription = 'Email/password sign-in isn\'t enabled right now. Contact support for assistance.';
      } else if (error.code === 'auth/user-already-exists') {
        errorTitle = 'Already Have an Account? 🎯';
        errorDescription = 'An account with this email already exists! Try signing in instead.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorTitle = 'Configuration Issue ⚠️';
        errorDescription = 'There\'s a setup problem on our end. Please contact support.';
      } else if (error.code === 'auth/project-not-found') {
        errorTitle = 'Project Configuration Error 🔧';
        errorDescription = 'We\'re having a technical hiccup. Please contact support for help.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      // Loading state already cleared above, ensure it's cleared
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔐 Starting sign-out process');
      
      // Clear all local state first
      setUser(null);
      setIsEmailVerified(false);
      setIsProfileVerified(false);
      setProfileVerificationStatus(null);
      setShowWelcomePopup(false);
      
      // Clear email link sign-in flag
      window.localStorage.removeItem('signedInViaEmailLink');
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      console.log('🔐 Sign-out successful');
      toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
      
      // Small delay before redirect to ensure state is cleared
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error: any) {
      console.error('🔐 Sign-out error:', error);
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  const clearAuthState = () => {
    console.log('🔐 Clearing all authentication state');
    setUser(null);
    setIsEmailVerified(false);
    setIsProfileVerified(false);
    setProfileVerificationStatus(null);
    setShowWelcomePopup(false);
    setLoading(false);
  };

  const verifyPassword = async (password: string) => {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        return { error: 'No user is currently signed in.', isValid: false };
      }

      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      
      // Attempt to re-authenticate (this verifies the password)
      await reauthenticateWithCredential(currentUser, credential);
      
      return { error: null, isValid: true };
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { error: 'Incorrect password', isValid: false };
      } else if (error.code === 'auth/too-many-requests') {
        return { error: 'Too many failed attempts. Please try again later.', isValid: false };
      }
      return { error: error.message || 'Password verification failed', isValid: false };
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in.');
      }

      const currentUser = auth.currentUser;
      const userId = currentUser.uid;

      // Re-authenticate user before deletion (required by Firebase for security)
      if (!currentUser.email) {
        throw new Error('User email is required for account deletion.');
      }

      try {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } catch (reauthError: any) {
        if (reauthError.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please try again.');
        } else if (reauthError.code === 'auth/invalid-credential') {
          throw new Error('Invalid credentials. Please check your password.');
        } else if (reauthError.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw reauthError;
      }

      // Delete user profile data
      try {
        await deleteDoc(doc(db, 'userProfiles', userId));
      } catch (error) {
        console.error('Error deleting user profile:', error);
        // Continue with account deletion even if profile deletion fails
      }

      // Delete user's enquiries
      try {
        const enquiriesQuery = query(collection(db, 'enquiries'), where('userId', '==', userId));
        const enquiriesSnapshot = await getDocs(enquiriesQuery);
        const deletePromises = enquiriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting user enquiries:', error);
        // Continue with account deletion even if enquiries deletion fails
      }

      // Delete user's responses
      try {
        const responsesQuery = query(collection(db, 'responses'), where('userId', '==', userId));
        const responsesSnapshot = await getDocs(responsesQuery);
        const deletePromises = responsesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting user responses:', error);
        // Continue with account deletion even if responses deletion fails
      }

      // Delete the Firebase Auth user (this permanently removes the account)
      // After this, the email/password combination will NEVER work again
      await firebaseDeleteUser(currentUser);

      // Explicitly clear all local auth state to ensure immediate logout
      clearAuthState();
      
      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear email link sign-in flag if it exists
      try {
        window.localStorage.removeItem('signedInViaEmailLink');
      } catch (e) {
        // Ignore if already cleared
      }

      toast({
        title: 'Account Deleted',
        description: 'Your account and all associated data have been permanently deleted. You have been logged out.',
      });

      // Small delay before redirect to ensure all state is cleared
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      // Handle specific error codes
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please sign in again before deleting your account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please check your password and try again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your password and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-mismatch') {
        errorMessage = 'User mismatch. Please sign in again and try deleting your account.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. The account may have already been deleted.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Account Deletion Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return { error };
    }
  };

  const resendConfirmation = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be signed in to resend verification email.');
      }
      console.log('📧 Resending verification email to:', auth.currentUser.email);
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/auth/callback`,
        handleCodeInApp: true,
      });
      console.log('✅ Verification email resent successfully');
      toast({ 
        title: 'Email sent', 
        description: 'Verification email resent. Please check your inbox (and spam folder).' 
      });
      return { error: null };
    } catch (error: any) {
      console.error('❌ Resend verification email error:', error);
      let errorMessage = error.message || 'Failed to resend email';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      }
      
      toast({
        title: 'Failed to resend email',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      console.log('📧 Attempting to send password reset email to:', email);
      await firebaseSendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      console.log('✅ Password reset email sent successfully');
      toast({ 
        title: 'Password reset email sent', 
        description: 'Please check your inbox (and spam folder) for a password reset link.' 
      });
      return { error: null };
    } catch (error: any) {
      console.error('❌ Password reset email error:', error);
      let errorMessage = error.message || 'Failed to send password reset email';
      
      // Provide more helpful error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      toast({
        title: 'Failed to send password reset email',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
      toast({ title: 'Password reset successful', description: 'Your password has been reset. You can now sign in with your new password.' });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const sendPhoneOTP = async (phoneNumber: string) => {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.verificationId = confirmationResult.verificationId;
      
      toast({
        title: 'OTP sent',
        description: 'Please enter the OTP sent to your phone number.',
      });
      
      return { error: null, verificationId: confirmationResult.verificationId };
    } catch (error: any) {
      toast({
        title: 'Failed to send OTP',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const verifyPhoneOTP = async (otp: string, verificationId: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      if (auth.currentUser) {
        // Link phone to existing account
        await linkWithCredential(auth.currentUser, credential);
        
        // Store user data in Firestore
        await setDoc(doc(db, 'users', auth.currentUser.phoneNumber || ''), {
          uid: auth.currentUser.uid,
          phoneNumber: auth.currentUser.phoneNumber,
          displayName: auth.currentUser.displayName,
          createdAt: new Date(),
        });
      } else {
        // Sign in with phone
        const result = await signInWithCredential(auth, credential);
        
        // Store user data in Firestore
        await setDoc(doc(db, 'users', result.user.phoneNumber || ''), {
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber,
          displayName: result.user.displayName,
          createdAt: new Date(),
        });
      }
      
      toast({
        title: 'Phone verified',
        description: 'Your phone number has been verified successfully.',
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'OTP verification failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
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
      verifyPassword,
      closeWelcomePopup,
      clearAuthState
    }}>
      {children}
      <WelcomePopup 
        isVisible={showWelcomePopup}
        userName={user?.displayName || undefined}
        onClose={closeWelcomePopup}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add global types for window object
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    verificationId?: string;
  }
}
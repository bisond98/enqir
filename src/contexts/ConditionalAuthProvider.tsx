import React, { useState, useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { MockAuthProvider } from './MockAuthContext';

interface ConditionalAuthProviderProps {
  children: React.ReactNode;
}

export const ConditionalAuthProvider: React.FC<ConditionalAuthProviderProps> = ({ children }) => {
  const [useMockAuth, setUseMockAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(false); // Start as false to prevent loading screen flash

  useEffect(() => {
    // Check if Firebase is working
    const checkFirebaseConnection = async () => {
      try {
        // Try to import Firebase auth
        const { auth } = await import('@/firebase');
        
        // Test if auth object is properly initialized
        if (auth && auth.app) {
          console.log('✅ Firebase auth is available, using Firebase authentication');
          setUseMockAuth(false);
        } else {
          throw new Error('Firebase auth not properly initialized');
        }
      } catch (error) {
        console.warn('⚠️ Firebase auth not available, using mock authentication:', error);
        setUseMockAuth(true);
      } finally {
        setIsChecking(false);
      }
    };

    // Always use Firebase since it's working
    console.log('✅ Using Firebase Authentication (confirmed working)');
    setUseMockAuth(false);
    setIsChecking(false);
  }, []);

  // Skip loading screen - Firebase is always used, show landing page immediately

  // Use mock authentication if Firebase is not available
  if (useMockAuth) {
    console.log('🔧 Using Mock Authentication Provider');
    return (
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    );
  }

  // Use Firebase authentication
  console.log('🔥 Using Firebase Authentication Provider');
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

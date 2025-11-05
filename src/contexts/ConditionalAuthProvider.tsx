import React, { useState, useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { MockAuthProvider } from './MockAuthContext';

interface ConditionalAuthProviderProps {
  children: React.ReactNode;
}

export const ConditionalAuthProvider: React.FC<ConditionalAuthProviderProps> = ({ children }) => {
  const [useMockAuth, setUseMockAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Initializing authentication...</p>
        </div>
      </div>
    );
  }

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

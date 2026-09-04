import React, { useState, useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { MockAuthProvider } from './MockAuthContext';

interface ConditionalAuthProviderProps {
  children: React.ReactNode;
}

export const ConditionalAuthProvider: React.FC<ConditionalAuthProviderProps> = ({ children }) => {
  // Always use Firebase since it's confirmed working — skip async check for faster startup
  const [useMockAuth] = useState(false);
  const [isChecking] = useState(false);

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

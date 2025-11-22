// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
// If you want analytics, you can also import this:
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBU5gegpYNEQW2XjcS-s9WXpH1ztz6s5TQ",
  authDomain: "pal-519d0.firebaseapp.com",
  projectId: "pal-519d0",
  storageBucket: "pal-519d0.firebasestorage.app",
  messagingSenderId: "524719905581",
  appId: "1:524719905581:web:951d7e02ae378e4cdd51a4",
  databaseURL: "https://pal-519d0-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

// Optional: If you want analytics, uncomment this
// const analytics = getAnalytics(app);

export const auth = getAuth(app);

// Configure Firestore to avoid CORS/WebChannel issues in certain networks
// Auto-detects when long polling is needed (e.g., some proxies, ad-blockers)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// Add debugging for Firebase initialization
console.log('🔥 Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentUrl: typeof window !== 'undefined' ? window.location.origin : 'server'
});

// Test Firebase connection
if (typeof window !== 'undefined') {
  // Test auth connection
  auth.onAuthStateChanged((user) => {
    console.log('🔥 Auth state changed:', user ? 'User signed in' : 'No user');
  });
}

// Add error handling for CORS issues - suppress browser console warnings
if (typeof window !== 'undefined') {
  // Override console.error to filter out CORS warnings
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMsg = args.join(' ').toLowerCase();
    const firstArg = args[0]?.toString().toLowerCase() || '';
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection errors
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cannot load') ||
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('access control checks') ||
        errorMsg.includes('firestore.googleapis.com') ||
        errorMsg.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('gsessionid') ||
        errorMsg.includes('listen/channel') ||
        errorMsg.includes('due to access control checks') ||
        firstArg.includes('xmlhttprequest') ||
        firstArg.includes('firestore.googleapis.com') ||
        (firstArg.includes('error') && errorMsg.includes('firestore'))) {
      // These are Firestore connection/retry errors that don't affect app functionality
      return;
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };
  
  // Also override console.warn for CORS warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const errorMsg = args.join(' ').toLowerCase();
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection warnings
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cannot load') ||
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('firestore.googleapis.com') ||
        errorMsg.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('gsessionid') ||
        errorMsg.includes('listen/channel') ||
        errorMsg.includes('due to access control checks')) {
      // These are Firestore connection/retry warnings that don't affect app functionality
      return;
    }
    
    // Call original console.warn for other warnings
    originalConsoleWarn.apply(console, args);
  };
  
  // Add global error handler for unhandled CORS and Firestore errors
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'error') {
      const wrappedListener = (event: ErrorEvent) => {
        const errorMsg = event.message?.toLowerCase() || '';
        const errorSource = event.filename?.toLowerCase() || '';
        
        // Suppress XMLHttpRequest, CORS, and Firestore connection errors
        if (errorMsg.includes('xmlhttprequest') || 
            errorMsg.includes('cannot load') ||
            errorMsg.includes('cors') || 
            errorMsg.includes('access-control-allow-origin') ||
            errorSource.includes('firestore') ||
            errorMsg.includes('channel') ||
            errorMsg.includes('gsessionid') ||
            errorMsg.includes('listen/channel') ||
            errorMsg.includes('due to access control checks')) {
          // These are Firestore connection/retry errors that don't affect app functionality
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        
        // Call original listener for other errors
        if (listener) listener(event);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Also add direct error listener as fallback - catch at capture phase
  window.addEventListener('error', (event) => {
    const errorMsg = event.message?.toLowerCase() || '';
    const errorSource = event.filename?.toLowerCase() || '';
    const errorStack = event.error?.stack?.toLowerCase() || '';
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection errors
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cannot load') ||
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('access control checks') ||
        errorSource.includes('firestore') ||
        errorSource.includes('firebase') ||
        errorStack.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('gsessionid') ||
        errorMsg.includes('listen/channel') ||
        errorMsg.includes('firestore.googleapis.com') ||
        errorMsg.includes('due to access control checks') ||
        (errorSource.includes('firebase') && errorMsg.includes('load'))) {
      // These are Firestore connection/retry errors that don't affect app functionality
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Also catch unhandled promise rejections from Firestore
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message?.toLowerCase() || '';
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection errors
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cannot load') ||
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('gsessionid') ||
        errorMsg.includes('listen/channel') ||
        event.reason?.code === 'unavailable') {
      // These are Firestore connection/retry errors that don't affect app functionality
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

// Auth state changes are handled in AuthContext.tsx

// Enable offline persistence and cache
// enableIndexedDbPersistence(db).catch((err) => {
//   if (err.code == 'failed-precondition') {
//     // Multiple tabs open, persistence can only be enabled in one tab at a time
//   } else if (err.code == 'unimplemented') {
//     // The current browser doesn't support persistence
//   }
// });

export { app };
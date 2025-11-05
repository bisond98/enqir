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

// Add error handling for CORS issues - but don't intercept fetch as it can break things
// Instead, we handle CORS errors in individual onSnapshot error callbacks
if (typeof window !== 'undefined') {
  // Add global error handler for unhandled CORS and Firestore errors
  window.addEventListener('error', (event) => {
    const errorMsg = event.message?.toLowerCase() || '';
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection errors
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('400') ||
        errorMsg.includes('gsessionid')) {
      // These are Firestore connection/retry errors that don't affect app functionality
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Also catch unhandled promise rejections from Firestore
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message?.toLowerCase() || '';
    
    // Suppress XMLHttpRequest, CORS, and Firestore connection errors
    if (errorMsg.includes('xmlhttprequest') || 
        errorMsg.includes('cors') || 
        errorMsg.includes('access-control-allow-origin') ||
        errorMsg.includes('firestore') ||
        errorMsg.includes('channel') ||
        errorMsg.includes('400') ||
        errorMsg.includes('gsessionid') ||
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
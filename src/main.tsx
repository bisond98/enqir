import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for unhandled promise rejections (non-intrusive)
// Only logs errors that aren't already handled by firebase.ts error suppression
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error && typeof error === 'object') {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    // Don't interfere with Firebase error suppression (handled in firebase.ts)
    if (errorMessage.includes('firestore') || 
        errorMessage.includes('firebase') ||
        errorMessage.includes('channel') ||
        errorMessage.includes('connection') ||
        errorCode.includes('firestore') ||
        errorCode.includes('firebase')) {
      // Let firebase.ts handle these
      return;
    }
    
    // Only log critical unhandled rejections that aren't Firebase-related
    // Don't show toast to avoid interrupting user experience
    console.error('[Unhandled Rejection]', error);
  }
}, { passive: true });

// Global error handler for uncaught errors (non-intrusive)
// Only logs errors that aren't already handled
window.addEventListener('error', (event) => {
  // Don't interfere with existing error handlers
  // Just log for debugging, don't show toasts or prevent default
  if (event.error && !event.error.handled) {
    const errorMsg = event.message?.toLowerCase() || '';
    const errorSource = event.filename?.toLowerCase() || '';
    
    // Skip Firebase/Firestore errors (handled in firebase.ts)
    if (errorMsg.includes('firestore') || 
        errorMsg.includes('firebase') ||
        errorSource.includes('firestore') ||
        errorSource.includes('firebase')) {
      return;
    }
    
    // Only log non-Firebase errors for debugging
    console.error('[Uncaught Error]', event.error);
  }
}, { passive: true });

// Render app with error boundary at root
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);

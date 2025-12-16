import { app } from "./firebase";

console.log("✅ Firebase is connected:", app);

// Initialize AI Services
import "./services/ai";
console.log("🤖 AI Services: Automated approval system initialized");
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { UsageProvider } from "./contexts/UsageContext";
import { ConditionalAuthProvider } from "./contexts/ConditionalAuthProvider";
import { NotificationProvider } from "./contexts/NotificationContext";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import EnquiryWall from "./pages/EnquiryWall";
import PostEnquiry from "./pages/PostEnquiry";
import SellerResponse from "./pages/SellerResponse";
import MyEnquiries from "./pages/MyEnquiries";
import MyResponses from "./pages/MyResponses";
import SavedEnquiries from "./pages/SavedEnquiries";
import EnquiryResponses from "./pages/EnquiryResponses";
import DetailedResponses from "./pages/DetailedResponses";
import EnquiryResponsesPage from "./pages/EnquiryResponsesPage";
import EnquiryDetail from "./pages/EnquiryDetail";
import DataClear from "./pages/DataClear";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminAccess from "./pages/AdminAccess";
import PremiumTestDataGenerator from "./components/PremiumTestDataGenerator";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";
import AllChats from "./pages/AllChats";
import HelpGuide from "./pages/HelpGuide";
import MyChats from "./pages/MyChats";

const queryClient = new QueryClient();

// Global fix to ensure body scroll is always enabled
if (typeof window !== 'undefined') {
  // Ensure body can scroll
  const ensureScroll = () => {
    // CRITICAL: Don't interfere if Razorpay modal is open
    const razorpayModal = document.querySelector('.razorpay-container, [class*="razorpay"], iframe[src*="razorpay"]');
    if (razorpayModal) {
      // Razorpay is open - don't touch anything, let Razorpay manage its own state
      return;
    }
    
    // Only restore scroll if no Radix dialog is open AND no Razorpay
    if (document.body.style.overflow === 'hidden' && !document.querySelector('[data-radix-dialog-overlay][data-state="open"]')) {
      document.body.style.overflow = '';
      document.body.style.overflowY = 'auto';
    }
    if (document.documentElement.style.overflow === 'hidden' && !document.querySelector('[data-radix-dialog-overlay][data-state="open"]')) {
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = 'auto';
    }
  };
  
  // Check periodically and on focus (optimized with throttled requestAnimationFrame)
  let lastCheck = 0;
  const throttleDelay = 1000; // Check every 1 second (same as original interval)
  let rafId: number | null = null;
  
  const checkScrollThrottled = (timestamp: number) => {
    if (timestamp - lastCheck >= throttleDelay) {
      ensureScroll();
      lastCheck = timestamp;
    }
    rafId = requestAnimationFrame(checkScrollThrottled);
  };
  
  // Start the throttled animation frame loop
  rafId = requestAnimationFrame(checkScrollThrottled);
  
  window.addEventListener('focus', ensureScroll);
  window.addEventListener('load', ensureScroll);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  });
}

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConditionalAuthProvider>
            <NotificationProvider>
              <UsageProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
                  <Route path="/dashboard" element={<ErrorBoundary><AuthGuard><Dashboard /></AuthGuard></ErrorBoundary>} />
                  <Route path="/enquiries" element={<ErrorBoundary><EnquiryWall /></ErrorBoundary>} />
                  <Route path="/browse" element={<ErrorBoundary><EnquiryWall /></ErrorBoundary>} />
                  <Route path="/post-enquiry" element={<ErrorBoundary><AuthGuard><PostEnquiry /></AuthGuard></ErrorBoundary>} />
                  <Route path="/respond/:enquiryId" element={<ErrorBoundary><AuthGuard><SellerResponse /></AuthGuard></ErrorBoundary>} />
                         <Route path="/my-enquiries" element={<ErrorBoundary><AuthGuard><MyEnquiries /></AuthGuard></ErrorBoundary>} />
                         <Route path="/my-responses" element={<ErrorBoundary><AuthGuard><MyResponses /></AuthGuard></ErrorBoundary>} />
                         <Route path="/saved-enquiries" element={<ErrorBoundary><AuthGuard><SavedEnquiries /></AuthGuard></ErrorBoundary>} />
                         <Route path="/enquiry/:enquiryId/responses" element={<ErrorBoundary><AuthGuard><EnquiryResponses /></AuthGuard></ErrorBoundary>} />
                         <Route path="/enquiry/:enquiryId/responses-page" element={<ErrorBoundary><AuthGuard><EnquiryResponsesPage /></AuthGuard></ErrorBoundary>} />
                         <Route path="/enquiry/:enquiryId/detailed-responses" element={<ErrorBoundary><AuthGuard><DetailedResponses /></AuthGuard></ErrorBoundary>} />
                  <Route path="/enquiry/:id" element={<ErrorBoundary><EnquiryDetail /></ErrorBoundary>} />
                  <Route path="/data-clear" element={<DataClear />} />
                  <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                  <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                  <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/admin/access/:secretToken" element={<AdminAccess />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/test-premium" element={<PremiumTestDataGenerator />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/contact-us" element={<ContactUs />} />
                  <Route path="/help-guide" element={<ErrorBoundary><HelpGuide /></ErrorBoundary>} />
                  <Route path="/my-chats" element={<ErrorBoundary><AuthGuard><MyChats /></AuthGuard></ErrorBoundary>} />
                  <Route path="/all-chats" element={<ErrorBoundary><AuthGuard><AllChats /></AuthGuard></ErrorBoundary>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </UsageProvider>
          </NotificationProvider>
        </ConditionalAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

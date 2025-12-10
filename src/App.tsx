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
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect } from "react";
import { trackPageView } from "./utils/analytics";
import { UsageProvider } from "./contexts/UsageContext";
import { ConditionalAuthProvider } from "./contexts/ConditionalAuthProvider";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChatProvider } from "./contexts/ChatContext";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
// Lazy load pages for better performance and code splitting
import { lazy, Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner";

// Critical pages loaded immediately (above the fold)
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import EnquiryWall from "./pages/EnquiryWall";
import EnquiryDetail from "./pages/EnquiryDetail";

// Lazy load other pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PostEnquiry = lazy(() => import("./pages/PostEnquiry"));
const SellerResponse = lazy(() => import("./pages/SellerResponse"));
const MyEnquiries = lazy(() => import("./pages/MyEnquiries"));
const MyResponses = lazy(() => import("./pages/MyResponses"));
const SavedEnquiries = lazy(() => import("./pages/SavedEnquiries"));
const MyChats = lazy(() => import("./pages/MyChats"));
const AllChats = lazy(() => import("./pages/AllChats"));
const EnquiryResponses = lazy(() => import("./pages/EnquiryResponses"));
const DetailedResponses = lazy(() => import("./pages/DetailedResponses"));
const EnquiryResponsesPage = lazy(() => import("./pages/EnquiryResponsesPage"));
const DataClear = lazy(() => import("./pages/DataClear"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const PremiumTestDataGenerator = lazy(() => import("./components/PremiumTestDataGenerator"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const ReportUser = lazy(() => import("./pages/ReportUser"));

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
              <ChatProvider>
                <UsageProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <ScrollToTop />
                <Suspense fallback={<LoadingSpinner />}>
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
                    <Route path="/notifications" element={<ErrorBoundary><AuthGuard><Notifications /></AuthGuard></ErrorBoundary>} />
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
                    <Route path="/report-user/:userId" element={<ErrorBoundary><AuthGuard><ReportUser /></AuthGuard></ErrorBoundary>} />
                    <Route path="/my-chats" element={<ErrorBoundary><AuthGuard><MyChats /></AuthGuard></ErrorBoundary>} />
                    <Route path="/all-chats" element={<ErrorBoundary><AuthGuard><AllChats /></AuthGuard></ErrorBoundary>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
                </UsageProvider>
              </ChatProvider>
            </NotificationProvider>
        </ConditionalAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

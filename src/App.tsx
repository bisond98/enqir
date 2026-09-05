import { app } from "./firebase";

// Defer AI Services initialization to after first paint (not critical for initial render)
if (typeof window !== 'undefined') {
  const loadAIServices = () => import("./services/ai");
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadAIServices, { timeout: 5000 });
  } else {
    setTimeout(loadAIServices, 1000);
  }
}
// Preload the Razorpay checkout script ONCE (single central place) while the
// browser is idle, so the checkout opens instantly on any payment page — the
// script is fetched/executed in the background instead of on click.
if (typeof window !== 'undefined') {
  const preloadRazorpay = () =>
    import("./services/paymentService").then((m) => m.preloadRazorpayScript());
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadRazorpay, { timeout: 10000 });
  } else {
    setTimeout(preloadRazorpay, 4000);
  }
}
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
import { ChristmasTheme } from "./components/ChristmasTheme";
import "./styles/christmas.css";
import { lazy, Suspense } from "react";

// Lazy-loaded pages — each gets its own chunk, loaded on demand
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EnquiryWall = lazy(() => import("./pages/EnquiryWall"));
const PostEnquiry = lazy(() => import("./pages/PostEnquiry"));
const SellerResponse = lazy(() => import("./pages/SellerResponse"));
const MyEnquiries = lazy(() => import("./pages/MyEnquiries"));
const MyResponses = lazy(() => import("./pages/MyResponses"));
const SavedEnquiries = lazy(() => import("./pages/SavedEnquiries"));
const EnquiryResponses = lazy(() => import("./pages/EnquiryResponses"));
const DetailedResponses = lazy(() => import("./pages/DetailedResponses"));
const EnquiryResponsesPage = lazy(() => import("./pages/EnquiryResponsesPage"));
const EnquiryDetail = lazy(() => import("./pages/EnquiryDetail"));
const DataClear = lazy(() => import("./pages/DataClear"));
const Profile = lazy(() => import("./pages/Profile"));
const SignIn = lazy(() => import("./pages/SignIn"));
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
const AllChats = lazy(() => import("./pages/AllChats"));
const HelpGuide = lazy(() => import("./pages/HelpGuide"));
const MyChats = lazy(() => import("./pages/MyChats"));
const ReportUser = lazy(() => import("./pages/ReportUser"));
const SellHome = lazy(() => import("./modules/sell/pages/SellHome"));
const CreateListing = lazy(() => import("./modules/sell/pages/CreateListing"));
const Marketplace = lazy(() => import("./modules/sell/pages/Marketplace"));
const ListingDetail = lazy(() => import("./modules/sell/pages/ListingDetail"));
const ListingChat = lazy(() => import("./modules/sell/pages/ListingChat"));
const SellerDashboard = lazy(() => import("./modules/sell/pages/SellerDashboard"));
// 🛡️ PROTECTED: ChatProvider - DO NOT REMOVE - Required for MyChats and AllChats
import { ChatProvider } from "./contexts/ChatContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary re-fetches
      gcTime: 10 * 60 * 1000, // 10 minutes - keep cached data longer
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1, // Only retry once on failure
    },
  },
});

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
  
  // Check periodically and on focus — use setInterval instead of requestAnimationFrame
  // RAF fires ~60x/sec even when throttled; setInterval avoids waking the renderer
  const scrollCheckInterval = setInterval(ensureScroll, 2000);
  
  window.addEventListener('focus', ensureScroll);
  window.addEventListener('load', ensureScroll);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(scrollCheckInterval);
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
                {/* 🛡️ PROTECTED: ChatProvider wrapper - DO NOT REMOVE - Required for useChats hook */}
              <ChatProvider>
                  <ChristmasTheme>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                  <ScrollToTop />
                  <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>}>
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
                  {/* Sell Listing Engine (isolated module) */}
                  <Route path="/sell" element={<ErrorBoundary><SellHome /></ErrorBoundary>} />
                  <Route path="/sell/marketplace" element={<ErrorBoundary><Marketplace /></ErrorBoundary>} />
                  <Route path="/sell/listing/:id" element={<ErrorBoundary><ListingDetail /></ErrorBoundary>} />
                  <Route path="/sell/listing/:id/chat/:buyerId" element={<ErrorBoundary><AuthGuard><ListingChat /></AuthGuard></ErrorBoundary>} />
                  <Route path="/sell/new" element={<ErrorBoundary><AuthGuard><CreateListing /></AuthGuard></ErrorBoundary>} />
                  <Route path="/sell/dashboard" element={<ErrorBoundary><AuthGuard><SellerDashboard /></AuthGuard></ErrorBoundary>} />
                  {/* 🛡️ PROTECTED: My Chats route - DO NOT REMOVE - Fixes 404 error */}
                  <Route path="/my-chats" element={<ErrorBoundary><AuthGuard><MyChats /></AuthGuard></ErrorBoundary>} />
                  {/* 🛡️ PROTECTED: All Chats route - DO NOT REMOVE - Fixes 404 error */}
                  <Route path="/all-chats" element={<ErrorBoundary><AuthGuard><AllChats /></AuthGuard></ErrorBoundary>} />
                  {/* Report User route */}
                  <Route path="/report-user/:userId" element={<ErrorBoundary><AuthGuard><ReportUser /></AuthGuard></ErrorBoundary>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </BrowserRouter>
                  </ChristmasTheme>
                </ChatProvider>
              </UsageProvider>
          </NotificationProvider>
        </ConditionalAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

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
import PremiumTestDataGenerator from "./components/PremiumTestDataGenerator";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";

const queryClient = new QueryClient();

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
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<ErrorBoundary><AuthGuard><Dashboard /></AuthGuard></ErrorBoundary>} />
                  <Route path="/enquiries" element={<EnquiryWall />} />
                  <Route path="/browse" element={<EnquiryWall />} />
                  <Route path="/post-enquiry" element={<AuthGuard><PostEnquiry /></AuthGuard>} />
                  <Route path="/respond/:enquiryId" element={<AuthGuard><SellerResponse /></AuthGuard>} />
                         <Route path="/my-enquiries" element={<AuthGuard><MyEnquiries /></AuthGuard>} />
                         <Route path="/my-responses" element={<AuthGuard><MyResponses /></AuthGuard>} />
                         <Route path="/saved-enquiries" element={<AuthGuard><SavedEnquiries /></AuthGuard>} />
                         <Route path="/enquiry/:enquiryId/responses" element={<AuthGuard><EnquiryResponses /></AuthGuard>} />
                         <Route path="/enquiry/:enquiryId/responses-page" element={<AuthGuard><EnquiryResponsesPage /></AuthGuard>} />
                         <Route path="/enquiry/:enquiryId/detailed-responses" element={<AuthGuard><DetailedResponses /></AuthGuard>} />
                  <Route path="/enquiry/:id" element={<EnquiryDetail />} />
                  <Route path="/data-clear" element={<DataClear />} />
                  <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                  <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                  <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/test-premium" element={<PremiumTestDataGenerator />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/contact-us" element={<ContactUs />} />
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

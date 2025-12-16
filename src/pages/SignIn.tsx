import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { auth } from "@/firebase";
import { signInWithEmailLink, isSignInWithEmailLink, onAuthStateChanged } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const SignIn = () => {
  // Use Firebase authentication directly since it's working
  const { user, signUp, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // STRICT: Redirect if user is already signed in AND verified - check both AuthContext and Firebase directly
  useEffect(() => {
    // Check AuthContext user first - only redirect if email is verified
    if (user && !authLoading && user.emailVerified) {
      console.log('✅ SignIn: User already authenticated and verified, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Also check Firebase auth state directly for immediate detection on refresh
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Only redirect if user is verified
      if (firebaseUser && firebaseUser.emailVerified && !authLoading) {
        console.log('✅ SignIn: Firebase user detected and verified, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    });
    
    return () => unsubscribe();
  }, [user, authLoading, navigate]);
  
  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpIdentifier, setSignUpIdentifier] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailLinkMode, setIsEmailLinkMode] = useState(false);
  const [pendingEmailLink, setPendingEmailLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  
  
  // Pre-fill email from URL parameter (from email verification)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setIdentifier(emailParam);
      setSuccess("Email verified! Please log in to continue.");
    }
    
    // Check if we're completing an email link sign-in
    const emailLinkParam = searchParams.get('emailLink');
    if (emailLinkParam === 'true') {
      const storedLink = window.localStorage.getItem('pendingEmailLink');
      if (storedLink && isSignInWithEmailLink(auth, storedLink)) {
        setIsEmailLinkMode(true);
        setPendingEmailLink(storedLink);
        setError("");
        setSuccess("Please enter the email address you used to sign up to complete log-in.");
      }
    }
  }, [searchParams]);
  
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getFriendlyErrorMessage = (error: any): string => {
    if (!error || !error.code) {
      return "An unexpected error occurred. Please try again.";
    }

    switch (error.code) {
      case 'auth/invalid-credential':
        return "Username and password do not match.";
      case 'auth/user-not-found':
        return "No account found with this email. Please sign up to create an account.";
      case 'auth/wrong-password':
        return "Incorrect password. Please try again or reset your password.";
      case 'auth/too-many-requests':
        return "Too many failed attempts. Please wait a few minutes and try again.";
      case 'auth/network-request-failed':
        return "Network error. Please check your internet connection and try again.";
      case 'auth/user-disabled':
        return "This account has been disabled. Please contact support.";
      case 'auth/operation-not-allowed':
        return "Sign-in method is not available. Please contact support.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/weak-password':
        return "Password is too weak. Please use a stronger password.";
      default:
        return error.message || "Sign in failed. Please try again.";
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Validate email format
      if (!isValidEmail(identifier)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      
      const result = await signIn(identifier, password);
      
      if (!result.error) {
        setLoading(false);
        navigate("/");
      } else {
        // Use friendly error message instead of raw Firebase error
        const friendlyMessage = getFriendlyErrorMessage(result.error);
        setError(friendlyMessage);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      setLoading(false);
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("Attempting sign up with:", signUpIdentifier);
      
      // Validate email format
      if (!isValidEmail(signUpIdentifier)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      
      // Sign up without first/last name
      const result = await signUp(signUpIdentifier, signUpPassword, { 
        full_name: '',
        first_name: '',
        last_name: ''
      });
      console.log("Sign up result:", result);
      
      if (!result.error && result.requiresVerification) {
        // Email signup - show verification message
        setShowVerificationSent(true);
        setSuccess("Account created successfully!");
        setError("");
      } else if (result.error) {
        // Use friendly error message instead of raw Firebase error
        const friendlyMessage = getFriendlyErrorMessage(result.error);
        setError(friendlyMessage);
        setSuccess("");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  console.log("SignIn component rendering, loading:", loading);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl hidden sm:block"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-slate-100/60 rounded-full blur-3xl hidden sm:block"></div>
          <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-blue-100/40 rounded-full blur-3xl hidden sm:block"></div>
        </div>

        <div className="w-full max-w-md lg:max-w-lg relative z-10">
          {/* Clean Header Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10 flex flex-col items-center justify-center">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight drop-shadow-2xl" style={{ textShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)' }}>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>Welcome to</span>{" "}
              <span className="text-blue-600 font-black">Enqir</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>.in</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-[10px] sm:text-xs text-gray-700 px-2 sm:px-4 leading-tight max-w-md mx-auto mb-4 sm:mb-5 font-medium whitespace-nowrap">
              From Hobbies To Wants; From Necessities To Requirements
            </p>
          </div>

          {/* Clean Card */}
          <Card className="shadow-2xl border-[0.5px] border-black bg-white/95 backdrop-blur-sm relative overflow-hidden">
            <CardContent className="px-5 sm:px-7 lg:px-9 pt-7 sm:pt-9 lg:pt-11 pb-7 sm:pb-9 lg:pb-11">
              {/* Error Display */}
              {error && (
                <Alert className="mb-4 sm:mb-6 border border-red-200 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-red-800 ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Display */}
              {success && !showVerificationSent && (
                <Alert className="mb-4 sm:mb-6 border border-green-200 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-green-800 ml-2">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verification Email Sent Section */}
              {showVerificationSent && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-center space-y-3 sm:space-y-4">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full mb-2">
                      <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-green-900">
                      Verification Email Sent!
                    </h3>
                    
                    {/* Email Address */}
                    <p className="text-xs sm:text-sm text-green-800 leading-relaxed px-2 max-w-md mx-auto">
                      Check your inbox at{" "}
                      <span className="font-semibold text-green-900 break-all">{signUpIdentifier}</span>
                      {" "}and click the link to log in.
                    </p>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setShowVerificationSent(false);
                          setSuccess("");
                          setError("");
                        }}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Got it, let me log in
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In / Sign Up Tabs - Clear Selection, Always Visible Text */}
              {!showVerificationSent && (
                <>
              <Tabs defaultValue="signin" value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
                    <TabsList className="relative inline-flex items-center bg-gray-100 border border-gray-300 rounded-2xl p-1.5 sm:p-2 mb-6 sm:mb-8 shadow-sm w-full h-auto grid grid-cols-2 gap-1 overflow-hidden transition-all duration-200">
                      {/* Animated Background Slider - High depth intense dark black selection */}
                      <motion.div 
                        className="absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 rounded-xl pointer-events-none"
                        style={{ 
                          width: 'calc(50% - 4px)',
                          zIndex: 0,
                          backgroundColor: '#000000',
                          background: 'linear-gradient(180deg, #000000 0%, #000000 100%)',
                          boxShadow: '0 6px 0 0 rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
                        }}
                        animate={{
                          x: activeTab === 'signin' ? '4px' : 'calc(100% + 4px)',
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                          mass: 0.5
                        }}
                      >
                        {/* Depth highlight effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                      </motion.div>
                      
                      {/* Log In Button - Text always visible, clear selection */}
                      <TabsTrigger 
                        value="signin" 
                        className="relative h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-colors duration-200 !bg-transparent !border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        style={{
                          zIndex: 10,
                          color: activeTab === 'signin' ? '#ffffff' : '#1f2937',
                        }}
                        aria-label="Switch to Log In"
                      >
                        Log In
                      </TabsTrigger>
                      
                      {/* Sign Up Button - Text always visible, clear selection */}
                      <TabsTrigger 
                        value="signup" 
                        className="relative h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-colors duration-200 !bg-transparent !border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        style={{
                          zIndex: 10,
                          color: activeTab === 'signup' ? '#ffffff' : '#1f2937',
                        }}
                        aria-label="Switch to Sign Up"
                      >
                        Sign Up
                      </TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                    <TabsContent value="signin" className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5">
                        <div className="space-y-2.5">
                          <Label htmlFor="identifier" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Email Address
                          </Label>
                      <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-20 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="identifier"
                          type="email"
                          placeholder="Enter your email address"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px' }}
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>
                        
                        <div className="space-y-2.5">
                          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Password
                          </Label>
                      <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-20 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px' }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl border border-black shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    >
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                          {loading ? (
                        <div className="flex items-center justify-center space-x-3 relative z-10">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-white">Logging in...</span>
                        </div>
                          ) : (
                        <span className="relative z-10">Log In</span>
                          )}
                    </Button>
                  </form>
                  
                      <div className="text-center pt-2">
                        <Link to="/forgot-password" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </TabsContent>

                {/* Sign Up Form */}
                    <TabsContent value="signup" className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                        <div className="space-y-2.5">
                          <Label htmlFor="signup-identifier" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Email Address
                          </Label>
                      <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-20 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="signup-identifier"
                          type="email"
                          placeholder="Enter your email address"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px' }}
                          value={signUpIdentifier}
                          onChange={(e) => setSignUpIdentifier(e.target.value)}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Password
                          </Label>
                      <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-20 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a secure password"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px' }}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl border border-black shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    >
                      {/* Physical button depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                          {loading ? (
                        <div className="flex items-center justify-center space-x-3 relative z-10">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-white">Creating account...</span>
                        </div>
                          ) : (
                        <span className="relative z-10">Create Account</span>
                          )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

                  <Separator className="my-4 sm:my-6" />
              
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-600 leading-relaxed">
                  By continuing, you agree to our{" "}
                      <Link to="/terms-and-conditions" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                      <Link to="/privacy-policy" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
export default SignIn;

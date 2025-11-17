import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  
  // STRICT: Redirect if user is already signed in - check both AuthContext and Firebase directly
  useEffect(() => {
    // Check AuthContext user first
    if (user && !authLoading) {
      console.log('✅ SignIn: User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Also check Firebase auth state directly for immediate detection on refresh
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !authLoading) {
        console.log('✅ SignIn: Firebase user detected, redirecting to dashboard');
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
  
  // Pre-fill email from URL parameter (from email verification)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setIdentifier(emailParam);
      setSuccess("Email verified! Please sign in to continue.");
    }
    
    // Check if we're completing an email link sign-in
    const emailLinkParam = searchParams.get('emailLink');
    if (emailLinkParam === 'true') {
      const storedLink = window.localStorage.getItem('pendingEmailLink');
      if (storedLink && isSignInWithEmailLink(auth, storedLink)) {
        setIsEmailLinkMode(true);
        setPendingEmailLink(storedLink);
        setError("");
        setSuccess("Please enter the email address you used to sign up to complete sign-in.");
      }
    }
  }, [searchParams]);
  
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("🔍 Attempting sign in with:", identifier);
      
      // Validate email format
      if (!isValidEmail(identifier)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      
      console.log("🔍 About to call signIn with:", { identifier, password: "***" });
      
      const result = await signIn(identifier, password);
      console.log("🔍 Sign in result:", result);
      
      if (!result.error) {
        console.log("✅ Sign in successful, navigating to home");
        navigate("/");
      } else {
        console.log("❌ Sign in failed:", result.error.message);
        setError(result.error.message || "Sign in failed");
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
      setError("An unexpected error occurred during sign in");
    } finally {
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
      
      // Construct full name from first and last name
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      const result = await signUp(signUpIdentifier, signUpPassword, { 
        full_name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      console.log("Sign up result:", result);
      
      if (!result.error && result.requiresVerification) {
        // Email signup - show verification message
        setShowVerificationSent(true);
        setSuccess("Account created successfully!");
        setError("");
      } else if (result.error) {
        setError(result.error.message || "Sign up failed");
        setSuccess("");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError("An unexpected error occurred during sign up");
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-4 sm:mb-5 tracking-tight leading-tight">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>Welcome to</span>{" "}
              <span className="text-blue-600 font-black">Enqir</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>.in</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-600 px-2 sm:px-4 leading-relaxed max-w-md mx-auto">
              Sign in to your account or create a new one
            </p>
          </div>

          {/* Clean Card */}
          <Card className="shadow-2xl border border-gray-200/80 bg-white/95 backdrop-blur-sm relative overflow-hidden">
            {/* Subtle top border accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
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
                      {" "}and click the link to sign in.
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
                        Got it, let me sign in
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In / Sign Up Tabs */}
              {!showVerificationSent && (
                <>
              <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 sm:h-13 mb-7 sm:mb-9 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
                      <TabsTrigger 
                        value="signin" 
                        className="text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-100"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-100"
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
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="identifier"
                          type="email"
                          placeholder="Enter your email address"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                        
                        <div className="space-y-2.5">
                          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Password
                          </Label>
                      <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                          className="w-full h-12 sm:h-13 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
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
                        {/* First Name and Last Name - Manual Entry */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2.5">
                            <Label htmlFor="firstName" className="text-xs sm:text-sm font-semibold text-gray-800">
                              First Name *
                            </Label>
                      <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                                id="firstName"
                          type="text"
                                placeholder="First name"
                                className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                          <div className="space-y-2.5">
                            <Label htmlFor="lastName" className="text-xs sm:text-sm font-semibold text-gray-800">
                              Last Name *
                            </Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="lastName"
                          type="text"
                                placeholder="Last name"
                                className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                          value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                        />
                            </div>
                      </div>
                    </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="signup-identifier" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Email Address
                          </Label>
                      <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="signup-identifier"
                          type="email"
                          placeholder="Enter your email address"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                          value={signUpIdentifier}
                          onChange={(e) => setSignUpIdentifier(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold text-gray-800">
                            Password
                          </Label>
                      <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a secure password"
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-13 text-sm sm:text-base bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white rounded-xl transition-all duration-300 hover:border-gray-300"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                          className="w-full h-12 sm:h-13 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Creating account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

                  <Separator className="my-4 sm:my-6" />
              
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
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

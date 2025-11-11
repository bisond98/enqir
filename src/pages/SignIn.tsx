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

const SignIn = () => {
  // Use Firebase authentication directly since it's working
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
  
  // Pre-fill email from URL parameter (from email verification)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setIdentifier(emailParam);
      setSuccess("Email verified! Please sign in to continue.");
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
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pal-blue/5 rounded-full animate-float hidden sm:block"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-pal-blue/10 rounded-full animate-float hidden sm:block" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-pal-blue/5 rounded-full animate-float hidden sm:block" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header Section */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pal-blue/10 to-pal-blue/5 mb-3 sm:mb-6">
              <User className="h-7 w-7 sm:h-10 sm:w-10 text-pal-blue" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">
              Welcome to <span className="text-pal-blue">Enqir</span>
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground px-2">
              Sign in to your account or create a new one
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">
              {/* Error Display */}
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50/80">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-xs sm:text-sm text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Display */}
              {success && !showVerificationSent && (
                <Alert className="mb-4 border-green-200 bg-green-50/80">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-xs sm:text-sm text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verification Email Sent Section */}
              {showVerificationSent && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-6 bg-gradient-to-br from-green-50/80 to-emerald-50/50 rounded-lg border border-green-200">
                  <div className="text-center space-y-2.5 sm:space-4">
                    {/* Title */}
                    <h3 className="text-base sm:text-xl font-bold text-green-800">
                      Verification Email Sent!
                    </h3>
                    
                    {/* Email Address */}
                    <p className="text-xs sm:text-base text-green-700 leading-relaxed px-1">
                      We've sent a verification link to{" "}
                      <span className="font-semibold text-green-800 break-all">{signUpIdentifier}</span>
                    </p>

                    {/* Simple Steps */}
                    <div className="space-y-2.5 sm:space-3 text-xs sm:text-sm text-green-700 pt-1 sm:pt-0">
                      <p className="leading-relaxed">📧 Check your inbox and spam folder</p>
                      <p className="leading-relaxed">🔗 Click the verification link in the email</p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 sm:pt-2">
                      <Button
                        onClick={() => {
                          setShowVerificationSent(false);
                          setSuccess("");
                          setError("");
                        }}
                        className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold primary-gradient hover:shadow-glow transition-spring"
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
                    <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 mb-4 sm:mb-6">
                      <TabsTrigger value="signin" className="text-sm sm:text-base font-semibold">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" className="text-sm sm:text-base font-semibold">Sign Up</TabsTrigger>
                    </TabsList>

                    {/* Sign In Form */}
                    <TabsContent value="signin" className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="identifier" className="text-xs sm:text-sm font-medium text-foreground">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="identifier"
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-11 text-sm font-semibold primary-gradient hover:shadow-glow transition-spring"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                      
                      <div className="text-center">
                        <Link to="/forgot-password" className="text-xs text-pal-blue hover:text-pal-blue/80 hover:underline transition-colors">
                          Forgot your password?
                        </Link>
                      </div>
                    </TabsContent>

                    {/* Sign Up Form */}
                    <TabsContent value="signup" className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                        {/* First Name and Last Name - Manual Entry */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-foreground">
                              First Name *
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="firstName"
                                type="text"
                                placeholder="First name"
                                className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-foreground">
                              Last Name *
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="lastName"
                                type="text"
                                placeholder="Last name"
                                className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-identifier" className="text-xs sm:text-sm font-medium text-foreground">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-identifier"
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                              value={signUpIdentifier}
                              onChange={(e) => setSignUpIdentifier(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium text-foreground">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Create a secure password"
                              className="pl-10 h-11 text-sm border-gray-200 focus:border-pal-blue focus:ring-pal-blue/20"
                              value={signUpPassword}
                              onChange={(e) => setSignUpPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-11 text-sm font-semibold primary-gradient hover:shadow-glow transition-spring"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    <p className="text-xs text-muted-foreground">
                      By continuing, you agree to our{" "}
                      <Link to="/terms-and-conditions" className="font-semibold text-pal-blue hover:text-pal-blue/80 hover:underline transition-colors">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy-policy" className="font-semibold text-pal-blue hover:text-pal-blue/80 hover:underline transition-colors">
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

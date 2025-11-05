import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Lock, User, Info, AlertTriangle } from "lucide-react";

const SignIn = () => {
  // Use Firebase authentication directly since it's working
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  
  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpIdentifier, setSignUpIdentifier] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Auto-extract firstName and lastName when fullName changes
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    
    // Auto-extract firstName and lastName
    const nameParts = value.trim().split(' ');
    if (nameParts.length >= 2) {
      setFirstName(nameParts[0]);
      setLastName(nameParts.slice(1).join(' '));
    } else if (nameParts.length === 1) {
      setFirstName(nameParts[0]);
      setLastName('');
    } else {
      setFirstName('');
      setLastName('');
    }
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
      
      const result = await signUp(signUpIdentifier, signUpPassword, { 
        full_name: fullName,
        first_name: firstName,
        last_name: lastName
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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/20">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              Welcome to <span className="text-blue-600 text-3xl sm:text-5xl">Enqir</span>.in
            </h1>
          </div>

          <Card className="shadow-lg border-2 border-blue-200 rounded-2xl overflow-hidden">
            {/* Card Header - Top 10% with gray background */}
            <CardHeader className="bg-gray-800 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                <span className="text-lg sm:text-xl font-semibold text-white">Secure Access</span>
              </div>
            </CardHeader>
            {/* Card Content - Rest with white background */}
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {/* Error Display */}
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-sm text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Display */}
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verification Sent UI */}
              {showVerificationSent && (
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Verification Email Sent!</h3>
                    <p className="text-green-700 text-sm mb-4">
                      We've sent a verification link to <strong className="text-green-800">{signUpIdentifier}</strong>
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                          <span className="text-lg">📧</span> Check your inbox and spam folder
                        </p>
                        <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                          <span className="text-lg">🔗</span> Click the verification link in the email
                        </p>
                        <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                          <span className="text-lg">✅</span> Then come back here to sign in
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowVerificationSent(false);
                          setSuccess("");
                          setError("");
                        }}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Got it, let me sign in
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate('/signin')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14">
                  <TabsTrigger value="signin" className="text-base sm:text-lg font-semibold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-base sm:text-lg font-semibold">Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                    
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="identifier" className="text-xs sm:text-sm">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="identifier"
                          type="email"
                          placeholder="Enter your email address"
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Use your email address to sign in
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 sm:h-14 primary-gradient hover:shadow-glow transition-spring text-sm sm:text-base font-medium"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                  
                  <div className="mt-3 sm:mt-4 text-center">
                    <Link to="/forgot-password" className="text-xs sm:text-sm text-pal-blue hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">


                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name (e.g., John Smith)"
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                          value={fullName}
                          onChange={handleFullNameChange}
                          required
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        We'll automatically extract your first and last name
                      </p>
                    </div>

                    {/* Auto-extracted First Name and Last Name (Read-only) */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          readOnly
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Auto-extracted
                        </p>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          readOnly
                          disabled
                          className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Auto-extracted
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="signup-identifier" className="text-xs sm:text-sm">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-identifier"
                          type="email"
                          placeholder="Enter your email address"
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                          value={signUpIdentifier}
                          onChange={(e) => setSignUpIdentifier(e.target.value)}
                          required
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        We'll send a verification email to your inbox
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a secure password"
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 sm:h-14 primary-gradient hover:shadow-glow transition-spring text-sm sm:text-base font-medium"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />
              
              <div className="text-center text-xs text-muted-foreground">
                <p>
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="text-pal-blue hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-pal-blue hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
export default SignIn;

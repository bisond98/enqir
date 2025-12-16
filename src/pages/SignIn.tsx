import { useState, useEffect, useRef } from "react";
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
  
  // Robot animation state
  const robotRef = useRef<HTMLDivElement>(null);
  const [robotPosition, setRobotPosition] = useState({ x: 0, y: 0 });
  const [robotAngle, setRobotAngle] = useState(0);
  
  
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

  // Robot animation - moves around within card bounds
  useEffect(() => {
    const cardElement = document.querySelector('.signin-card');
    if (!cardElement || !robotRef.current) return;

    let animationFrameId: number | null = null;
    let isRunning = true;
    let currentPathIndex = 0;
    let pathProgress = 0;
    let lastTimestamp = 0;
    let currentAngle = 0;
    let targetAngle = 0;

    const createRoamingPaths = () => {
      const cardRect = cardElement.getBoundingClientRect();
      const padding = 60;
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;
      const offset = 100; // How far outside the card to go
      
      return [
        // Paths that go outside the card
        { start: { x: -offset, y: cardHeight / 2 }, end: { x: cardWidth + offset, y: cardHeight / 2 } },
        { start: { x: cardWidth + offset, y: cardHeight / 2 }, end: { x: cardWidth / 2, y: -offset } },
        { start: { x: cardWidth / 2, y: -offset }, end: { x: -offset, y: cardHeight / 2 } },
        { start: { x: -offset, y: cardHeight / 2 }, end: { x: cardWidth / 2, y: cardHeight + offset } },
        { start: { x: cardWidth / 2, y: cardHeight + offset }, end: { x: cardWidth + offset, y: cardHeight / 2 } },
        { start: { x: cardWidth + offset, y: cardHeight / 2 }, end: { x: cardWidth / 2, y: cardHeight / 2 } },
        { start: { x: cardWidth / 2, y: cardHeight / 2 }, end: { x: -offset, y: -offset } },
        { start: { x: -offset, y: -offset }, end: { x: cardWidth + offset, y: cardHeight + offset } },
        { start: { x: cardWidth + offset, y: cardHeight + offset }, end: { x: cardWidth / 2, y: cardHeight / 2 } },
        { start: { x: cardWidth / 2, y: cardHeight / 2 }, end: { x: -offset, y: cardHeight / 2 } },
      ];
    };

    let paths = createRoamingPaths();
    let currentPath = paths[currentPathIndex];
    const pathDuration = 4000;
    const rotationSmoothing = 0.12;

    const animate = (timestamp: number) => {
      if (!isRunning || !robotRef.current) return;
      
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaTime = Math.min(timestamp - lastTimestamp, 16.67);
      lastTimestamp = timestamp;
      
      pathProgress += deltaTime / pathDuration;
      
      if (pathProgress >= 1) {
        pathProgress = 0;
        currentPathIndex = (currentPathIndex + 1) % paths.length;
        paths = createRoamingPaths();
        if (currentPathIndex < paths.length) {
          currentPath = paths[currentPathIndex];
        }
      }
      
      const t = pathProgress;
      const easeProgress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const x = currentPath.start.x + (currentPath.end.x - currentPath.start.x) * easeProgress;
      const y = currentPath.start.y + (currentPath.end.y - currentPath.start.y) * easeProgress;
      
      const dx = currentPath.end.x - currentPath.start.x;
      const dy = currentPath.end.y - currentPath.start.y;
      targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      let angleDiff = targetAngle - currentAngle;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      
      currentAngle += angleDiff * rotationSmoothing;
      
      if (currentAngle > 180) currentAngle -= 360;
      if (currentAngle < -180) currentAngle += 360;
      
      setRobotPosition({ x, y });
      setRobotAngle(currentAngle);
      
      if (robotRef.current) {
        robotRef.current.style.left = `${x}px`;
        robotRef.current.style.top = `${y}px`;
        robotRef.current.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation after a short delay
    const startTimeout = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, 500);

    const handleResize = () => {
      paths = createRoamingPaths();
      if (currentPathIndex < paths.length) {
        currentPath = paths[currentPathIndex];
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      clearTimeout(startTimeout);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

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
          <Card className="signin-card shadow-2xl border-[0.5px] border-black bg-white/95 backdrop-blur-sm relative overflow-visible">
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
                      {/* Animated Background Slider - High depth intense dark black selection, no shadow */}
                      <motion.div 
                        className="absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 rounded-xl pointer-events-none"
                        style={{ 
                          width: 'calc(50% - 4px)',
                          zIndex: 0,
                          backgroundColor: '#000000',
                          background: 'linear-gradient(180deg, #000000 0%, #000000 100%)',
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
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px', fontFamily: 'Roboto, sans-serif', outline: 'none', boxShadow: 'none' }}
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.boxShadow = 'none';
                          }}
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
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px', fontFamily: 'Roboto, sans-serif', outline: 'none', boxShadow: 'none' }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.boxShadow = 'none';
                          }}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl border border-black transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
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
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px', fontFamily: 'Roboto, sans-serif', outline: 'none', boxShadow: 'none' }}
                          value={signUpIdentifier}
                          onChange={(e) => setSignUpIdentifier(e.target.value)}
                          onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.boxShadow = 'none';
                          }}
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
                              className="!pl-12 sm:!pl-14 pr-4 h-12 sm:h-14 text-base border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none transition-all duration-300 min-touch bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                          style={{ fontSize: '16px', fontFamily: 'Roboto, sans-serif', outline: 'none', boxShadow: 'none' }}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.boxShadow = 'none';
                          }}
                          required
                        />
                        {/* Physical button depth effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl border border-black transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
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

              {/* Moving Robot Animation - Behind content, doesn't interrupt */}
              <div 
                ref={robotRef}
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  position: 'absolute',
                  left: `${robotPosition.x || 0}px`,
                  top: `${robotPosition.y || 0}px`,
                  width: '80px',
                  height: '80px',
                  transform: `translate(-50%, -50%) rotate(${robotAngle || 0}deg)`,
                  willChange: 'transform',
                  transition: 'none',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  opacity: 1,
                }}
              >
                {/* Same Robot from HelpGuide - Smaller */}
                <svg width="80" height="80" viewBox="0 0 100 100" className="robot-svg" style={{ overflow: 'visible', background: 'transparent' }}>
                  <defs>
                    <filter id="cyan-glow-signin">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="whiteMatte-signin" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#fafafa', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="lightGrey-signin" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 0.4 }} />
                      <stop offset="50%" style={{ stopColor: '#e8e8e8', stopOpacity: 0.5 }} />
                      <stop offset="100%" style={{ stopColor: '#d8d8d8', stopOpacity: 0.3 }} />
                    </linearGradient>
                    <radialGradient id="cyanGlow-signin" cx="50%" cy="50%">
                      <stop offset="0%" style={{ stopColor: '#00e5ff', stopOpacity: 0.6 }} />
                      <stop offset="40%" style={{ stopColor: '#00d4ff', stopOpacity: 0.5 }} />
                      <stop offset="70%" style={{ stopColor: '#00b8d4', stopOpacity: 0.4 }} />
                      <stop offset="100%" style={{ stopColor: '#0097a7', stopOpacity: 0.3 }} />
                    </radialGradient>
                    <radialGradient id="eyeHighlight-signin" cx="30%" cy="30%">
                      <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
                      <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                    </radialGradient>
                  </defs>
                  
                  {/* Soft floating shadow */}
                  <ellipse cx="50" cy="95" rx="18" ry="4" fill="#000000" opacity="0.08">
                    <animate attributeName="rx" values="18;20;18" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    <animate attributeName="opacity" values="0.08;0.1;0.08" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                  </ellipse>
                  
                  {/* Body */}
                  <g id="body-group-signin">
                    <ellipse cx="50" cy="65" rx="18" ry="20" fill="url(#whiteMatte-signin)" stroke="none"/>
                    <ellipse cx="50" cy="65" rx="16" ry="18" fill="url(#lightGrey-signin)"/>
                    <rect x="38" y="58" width="24" height="8" rx="2" fill="#1a1a1a" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;0.65;0.6" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </rect>
                    <text x="50" y="63" fontSize="3" fill="#00d4ff" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;0.7;0.6" dur="3s" repeatCount="indefinite"/>
                      ENQIR
                    </text>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0,0; 0,-2.5; 0,0"
                      dur="5s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      keyTimes="0;0.5;1"
                    />
                  </g>
                  
                  {/* Head */}
                  <g id="head-group-signin">
                    <ellipse cx="50" cy="30" rx="14" ry="16" fill="url(#whiteMatte-signin)" stroke="none"/>
                    <ellipse cx="50" cy="30" rx="12" ry="14" fill="url(#lightGrey-signin)"/>
                    <line x1="50" y1="8" x2="50" y2="11" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                      <animate attributeName="y2" values="11;10.5;11" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </line>
                    <circle cx="50" cy="8" r="1.5" fill="#ffffff" opacity="0.6">
                      <animate attributeName="r" values="1.5;1.8;1.5" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </circle>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0,0; 0,-2; 0,0"
                      dur="5s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      keyTimes="0;0.5;1"
                      begin="0.8s"
                    />
                  </g>
                  
                  {/* Face screen */}
                  <g id="face-screen-signin">
                    <ellipse cx="50" cy="32" rx="12" ry="14" fill="#1a1a1a" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;0.65;0.6" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </ellipse>
                    <ellipse cx="50" cy="28" rx="8" ry="6" fill="url(#eyeHighlight-signin)" opacity="0.1"/>
                    
                    {/* Eyes */}
                    <g id="eyes-group-signin">
                      <ellipse cx="44" cy="28" rx="3.5" ry="4" fill="url(#cyanGlow-signin)" style={{ filter: 'url(#cyan-glow-signin)' }}>
                        <animate attributeName="opacity" values="0.5;0.6;0.5" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                        <animate attributeName="ry" values="4;4.5;4" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </ellipse>
                      <ellipse cx="56" cy="28" rx="3.5" ry="4" fill="url(#cyanGlow-signin)" style={{ filter: 'url(#cyan-glow-signin)' }}>
                        <animate attributeName="opacity" values="0.5;0.6;0.5" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s"/>
                        <animate attributeName="ry" values="4;4.5;4" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s"/>
                      </ellipse>
                      <ellipse cx="45" cy="27" rx="1.2" ry="1.5" fill="url(#eyeHighlight-signin)"/>
                      <ellipse cx="55" cy="27" rx="1.2" ry="1.5" fill="url(#eyeHighlight-signin)"/>
                    </g>
                  </g>
                  
                  {/* Arms */}
                  <g id="arms-group-signin">
                    <g id="left-arm-signin" transform-origin="20 60">
                      <ellipse cx="20" cy="60" rx="5" ry="9" fill="url(#whiteMatte-signin)" stroke="none" transform="rotate(-15 20 60)"/>
                      <ellipse cx="20" cy="60" rx="4" ry="7" fill="url(#lightGrey-signin)" transform="rotate(-15 20 60)"/>
                      <circle cx="16" cy="68" r="3" fill="url(#whiteMatte-signin)">
                        <animate attributeName="r" values="3;3.2;3" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </circle>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="-15 20 60; -25 20 60; -15 20 60"
                        dur="4s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.5;1"
                      />
                    </g>
                    <g id="right-arm-signin" transform-origin="80 60">
                      <ellipse cx="80" cy="60" rx="5" ry="9" fill="url(#whiteMatte-signin)" stroke="none" transform="rotate(15 80 60)"/>
                      <ellipse cx="80" cy="60" rx="4" ry="7" fill="url(#lightGrey-signin)" transform="rotate(15 80 60)"/>
                      <circle cx="84" cy="68" r="3" fill="url(#whiteMatte-signin)">
                        <animate attributeName="r" values="3;3.2;3" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="1.5s"/>
                      </circle>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="15 80 60; 25 80 60; 15 80 60"
                        dur="4s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.5;1"
                        begin="2s"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
export default SignIn;

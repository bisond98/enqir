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
  const [isRobotPaused, setIsRobotPaused] = useState(false);
  const [robotAction, setRobotAction] = useState<'idle' | 'wave' | 'jump' | 'spin' | 'celebrate' | 'lookAround' | 'dance'>('idle');
  const [isPushingText, setIsPushingText] = useState(false);
  const [textPushOffset, setTextPushOffset] = useState({ x: 0, y: 0 });
  
  
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

  // Robot animation - moves around outside card and pauses above welcome text
  useEffect(() => {
    const cardElement = document.querySelector('.signin-card');
    const welcomeElement = document.querySelector('.welcome-heading');
    const containerElement = document.querySelector('.signin-container');
    if (!cardElement || !robotRef.current) return;

    // 🛡️ MOBILE FIX: Cache DOM elements to avoid expensive queries every frame
    let cachedEnqirSpan: HTMLElement | null = null;
    let cacheTimestamp = 0;
    const CACHE_DURATION = 1000; // Refresh cache every second
    const isMobileDevice = window.innerWidth < 640; // Detect mobile once

    let animationFrameId: number | null = null;
    let isRunning = true;
    let currentPathIndex = 0;
    let pathProgress = 0;
    let lastTimestamp = 0;
    let currentAngle = 0;
    let targetAngle = 0;
      let isPaused = false;
      let pauseStartTime = 0;
      let pauseDuration = 1500; // 1.5 second pause to show pushing effort
      // 🛡️ PRODUCTION FIX: Track actual robot position for continuity
      let currentRobotX = 0;
      let currentRobotY = 0;
      
    // 🛡️ MOBILE FIX: Handle page visibility changes (mobile browsers pause when tab hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause animation
        isRunning = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        // Page is visible - resume animation
        isRunning = true;
        lastTimestamp = 0; // Reset to recalculate timing
        // 🛡️ PRODUCTION FIX: Use requestAnimationFrame timestamp for consistency
        // Don't set pathStartTime here - let animate() handle it with proper timestamp
        pathStartTime = 0; // Reset so it gets set properly in animate()
        if (robotRef.current) {
          animationFrameId = requestAnimationFrame(animate);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const createRoamingPaths = () => {
      const cardRect = cardElement.getBoundingClientRect();
      const welcomeRect = welcomeElement?.getBoundingClientRect();
      const containerRect = containerElement?.getBoundingClientRect() || cardRect;
      
      // Calculate positions relative to container (not card)
      const cardLeft = cardRect.left - containerRect.left;
      const cardTop = cardRect.top - containerRect.top;
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;
      const offset = 120; // How far outside the card to go
      
      // Get header boundary - allow robot head to go very high up
      const headerBottom = welcomeRect ? (welcomeRect.bottom - containerRect.top) : 0;
      const headerTop = welcomeRect ? (welcomeRect.top - containerRect.top) : 0;
      const containerTop = containerRect.top - containerRect.top; // Top of container (0)
      // On mobile, get much closer to top
      const isMobile = window.innerWidth < 640;
      // Allow robot head to go very high up - use top of container area
      const minY = containerTop + (isMobile ? 20 : 30); // Very close to top of container
      const maxY = cardTop + cardHeight + offset; // Bottom boundary
      
      // Calculate ALL available space from container top to card - use it fully
      const spaceFromTopToCard = cardTop - containerTop;
      const spaceBetweenTopAndCard = cardTop - minY;
      
      // Use the entire vertical space including very top area - divide into multiple levels
      // Levels that go very high up
      const levelTopY = containerTop + (spaceFromTopToCard * 0.02); // Very top (2% from container top)
      const levelHeaderTopY = headerTop - (isMobile ? 5 : 10); // Above header top
      const levelHeaderY = headerTop + (spaceFromTopToCard * 0.1); // Inside header area (10% from top)
      const level0Y = headerBottom - (isMobile ? 10 : 5); // Right at header bottom or slightly above
      const level1Y = minY + (spaceBetweenTopAndCard * 0.1); // Very close to top (10% of space)
      const level2Y = minY + (spaceBetweenTopAndCard * 0.25); // Close to top (25% of space)
      const level3Y = minY + (spaceBetweenTopAndCard * 0.4); // Lower quarter
      const level4Y = minY + (spaceBetweenTopAndCard * 0.55); // Middle
      const level5Y = minY + (spaceBetweenTopAndCard * 0.7); // Upper half
      const level6Y = minY + (spaceBetweenTopAndCard * 0.85); // Close to card
      const level7Y = minY + (spaceBetweenTopAndCard * 0.95); // Very close to card
      
      // Calculate position near "Enqir" text (centered horizontally, using full space)
      let welcomeX = cardLeft + cardWidth / 2;
      let welcomeY = level4Y; // Use middle level
      
      if (welcomeRect && welcomeElement) {
        // Find the "Enqir" span within the welcome heading
        const enqirSpan = welcomeElement.querySelector('.text-blue-600') as HTMLElement;
        if (enqirSpan) {
          const enqirRect = enqirSpan.getBoundingClientRect();
          const enqirCenterX = enqirRect.left + enqirRect.width / 2 - containerRect.left;
          welcomeX = enqirCenterX;
          welcomeY = level3Y; // Use level 3 for pause position
        } else {
          // Fallback to welcome text center
          const welcomeCenterX = welcomeRect.left + welcomeRect.width / 2 - containerRect.left;
          welcomeX = welcomeCenterX;
          welcomeY = level3Y; // Use level 3 for pause position
        }
      }
      
      // Ensure welcomeY doesn't go too close to bottom
      const constrainedWelcomeY = Math.min(welcomeY, maxY - 40);
      
      // Calculate position to push "Enqir" text - robot should go directly to it
      const pushY = welcomeY - 20; // Position slightly above the text to push it
      
      return [
        // Loop: Go to Enqir text, push it, move away, repeat
        { start: { x: cardLeft - offset, y: cardTop + cardHeight / 2 }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push the text (pause to show effort)
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft + cardWidth + offset, y: cardTop + cardHeight / 2 }, pause: false },
        { start: { x: cardLeft + cardWidth + offset, y: cardTop + cardHeight / 2 }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft - offset, y: cardTop + cardHeight / 2 }, pause: false },
        { start: { x: cardLeft - offset, y: cardTop + cardHeight / 2 }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft + cardWidth / 2, y: maxY }, pause: false },
        { start: { x: cardLeft + cardWidth / 2, y: maxY }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft - offset, y: levelTopY }, pause: false },
        { start: { x: cardLeft - offset, y: levelTopY }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft + cardWidth + offset, y: levelTopY }, pause: false },
        { start: { x: cardLeft + cardWidth + offset, y: levelTopY }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
        { start: { x: welcomeX, y: pushY }, end: { x: cardLeft - offset, y: cardTop + cardHeight / 2 }, pause: false },
        { start: { x: cardLeft - offset, y: cardTop + cardHeight / 2 }, end: { x: welcomeX, y: pushY }, pause: false },
        { start: { x: welcomeX, y: pushY }, end: { x: welcomeX, y: pushY }, pause: true }, // Push again
      ];
    };

    let paths = createRoamingPaths();
    let currentPath = paths[currentPathIndex];
    // 🛡️ MOBILE FIX: Slightly faster on mobile for better performance (use cached isMobileDevice)
    const pathDuration = isMobileDevice ? 3500 : 4000; // 3.5s on mobile, 4s on desktop
    const rotationSmoothing = 0.12;
    // 🛡️ FIX: Track actual start time for consistent timing regardless of frame rate
    let animationStartTime = 0;
    let pathStartTime = 0; // Track when current path started

             const animate = (timestamp: number) => {
             if (!isRunning || !robotRef.current) return;
             
             // 🛡️ FIX: Initialize start time on first frame
             if (animationStartTime === 0) {
               animationStartTime = timestamp;
               pathStartTime = timestamp;
             lastTimestamp = timestamp;
               // 🛡️ PRODUCTION FIX: Initialize robot position from first path
               if (currentPath && currentRobotX === 0 && currentRobotY === 0) {
                 currentRobotX = currentPath.start.x;
                 currentRobotY = currentPath.start.y;
               }
             } else if (lastTimestamp === 0) {
               // 🛡️ MOBILE FIX: Handle case where animation resumes after being paused
               lastTimestamp = timestamp;
               if (pathStartTime === 0) {
                 pathStartTime = timestamp;
               }
             }
             
             // 🛡️ PRODUCTION FIX: Always ensure pathStartTime is valid (safeguard)
             // This prevents animation from getting stuck if pathStartTime is somehow invalid
             if (pathStartTime <= 0 || pathStartTime > timestamp) {
               console.warn('⚠️ Robot animation: Invalid pathStartTime, resetting to current timestamp');
               pathStartTime = timestamp;
             }
             
             // 🛡️ FIX: Use actual elapsed time but clamp to prevent huge jumps when tab returns
             // This ensures consistent animation speed in both localhost and production
             // Allow up to 100ms to handle throttling, but prevent huge jumps that break animation
             const rawDelta = timestamp - lastTimestamp;
             const deltaTime = Math.min(rawDelta, 100); // Clamp to 100ms max per frame
             lastTimestamp = timestamp;
             
             // 🛡️ MOBILE FIX: Cache DOM queries and throttle distance calculations on mobile
             const now = performance.now();
             const shouldCheckDistance = !isMobileDevice || (now - cacheTimestamp) > 200; // Check every 200ms on mobile
             
             if (!cachedEnqirSpan || (now - cacheTimestamp) > CACHE_DURATION) {
               const welcomeEl = document.querySelector('.welcome-heading');
               cachedEnqirSpan = welcomeEl?.querySelector('.enqir-text') as HTMLElement;
               cacheTimestamp = now;
             }
             
             // Check robot position relative to "Enqir" text for HARD push interaction
             // 🛡️ MOBILE FIX: Throttle distance calculations on mobile for better performance
             if (shouldCheckDistance && cachedEnqirSpan && containerElement && robotRef.current) {
               const containerRect = containerElement.getBoundingClientRect();
               const enqirRect = cachedEnqirSpan.getBoundingClientRect();
               const robotRect = robotRef.current.getBoundingClientRect();
               
               const enqirCenterX = enqirRect.left + enqirRect.width / 2 - containerRect.left;
               const enqirCenterY = enqirRect.top + enqirRect.height / 2 - containerRect.top;
               const robotCenterX = robotRect.left + robotRect.width / 2 - containerRect.left;
               const robotCenterY = robotRect.top + robotRect.height / 2 - containerRect.top;
               
               const distance = Math.sqrt(
                 Math.pow(robotCenterX - enqirCenterX, 2) + 
                 Math.pow(robotCenterY - enqirCenterY, 2)
               );
               
               // If robot is within 100px of text, push it HARD with effort
               if (distance < 100) {
                 setIsPushingText(true);
                 const angle = Math.atan2(enqirCenterY - robotCenterY, enqirCenterX - robotCenterX);
                 // Much stronger push - max 25px displacement (was 8px)
                 const pushStrength = Math.max(0, (100 - distance) / 100) * 25;
                 // Add extra force when very close (within 40px)
                 const extraForce = distance < 40 ? (40 - distance) / 40 * 10 : 0;
                 const totalPush = pushStrength + extraForce;
                 
                 setTextPushOffset({
                   x: Math.cos(angle) * totalPush,
                   y: Math.sin(angle) * totalPush
                 });
               } else {
                 setIsPushingText(false);
                 // Slower return - text resists coming back (shows it was pushed hard)
                 setTextPushOffset(prev => ({
                   x: prev.x * 0.92,
                   y: prev.y * 0.92
                 }));
               }
             } else if (!shouldCheckDistance) {
               // 🛡️ MOBILE FIX: Continue text push animation even when distance check is throttled
               // Only update if currently pushing
               setTextPushOffset(prev => {
                 if (Math.abs(prev.x) > 0.1 || Math.abs(prev.y) > 0.1) {
                   return { x: prev.x * 0.98, y: prev.y * 0.98 };
                 }
                 return prev;
               });
             }
      
      // Handle pause state
      if (isPaused) {
        if (pauseStartTime === 0) {
          pauseStartTime = timestamp;
        }
        const pauseElapsed = timestamp - pauseStartTime;
        if (pauseElapsed >= pauseDuration) {
          isPaused = false;
          setIsRobotPaused(false);
          pauseStartTime = 0;
          // 🛡️ FIX: Reset path start time when moving to next path
          pathStartTime = timestamp;
          currentPathIndex = (currentPathIndex + 1) % paths.length;
          paths = createRoamingPaths();
          if (currentPathIndex < paths.length) {
            currentPath = paths[currentPathIndex];
          }
        } else {
          // Keep robot at pause position and trigger blink
          setIsRobotPaused(true);
          // 🛡️ MOBILE FIX: Only continue if visible
          if (isRunning && !document.hidden) {
          animationFrameId = requestAnimationFrame(animate);
          }
          return;
        }
      }
      
      // 🛡️ FIX: Use absolute time-based progress instead of accumulating deltaTime
      // This ensures animation speed is consistent regardless of frame rate (localhost vs production)
      // 🛡️ PRODUCTION FIX: Ensure pathStartTime is always valid
      if (pathStartTime === 0 || pathStartTime > timestamp) {
        pathStartTime = timestamp;
      }
      
      const pathElapsed = timestamp - pathStartTime;
      const pathProgress = Math.min(Math.max(pathElapsed / pathDuration, 0), 1); // Clamp between 0 and 1
      
      if (pathProgress >= 1) {
        // Check if this path should pause
        if (currentPath.pause) {
          isPaused = true;
          setIsRobotPaused(true);
          pauseStartTime = timestamp;
          // Keep pathStartTime as is during pause - don't reset it
        } else {
          // 🛡️ PRODUCTION FIX: Move to next path with proper continuity
          // Store current robot position (at end of path) before changing path
          const currentRobotX = currentPath.end.x;
          const currentRobotY = currentPath.end.y;
          
          // Move to next path
          currentPathIndex = (currentPathIndex + 1) % paths.length;
          
          // 🛡️ PRODUCTION FIX: Only recalculate paths if we've completed a full cycle
          // This prevents unnecessary recalculations that can cause jumps
          if (currentPathIndex === 0) {
          paths = createRoamingPaths();
          }
          
          if (currentPathIndex < paths.length) {
            currentPath = paths[currentPathIndex];
            
            // 🛡️ PRODUCTION FIX: Ensure continuity - new path MUST start from robot's current position
            // This prevents any jumps when transitioning between paths
            // Use actual tracked position, not calculated end position
            if (currentRobotX !== 0 || currentRobotY !== 0) {
              currentPath.start.x = currentRobotX;
              currentPath.start.y = currentRobotY;
            } else {
              // Fallback: use previous end position
              currentPath.start.x = currentRobotX || currentPath.start.x;
              currentPath.start.y = currentRobotY || currentPath.start.y;
            }
            
            // Reset path start time for new path
            pathStartTime = timestamp;
          }
        }
      }
      
      const t = pathProgress;
      const easeProgress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // 🛡️ PRODUCTION FIX: Calculate target position with continuity check
      let targetX: number;
      let targetY: number;
      
      if (isPaused) {
        targetX = currentPath.end.x;
        targetY = currentPath.end.y;
      } else {
        targetX = currentPath.start.x + (currentPath.end.x - currentPath.start.x) * easeProgress;
        targetY = currentPath.start.y + (currentPath.end.y - currentPath.start.y) * easeProgress;
      }
      
      // 🛡️ PRODUCTION FIX: Ensure smooth transition - prevent large jumps
      // Use tracked position instead of state (which might be stale)
      const distance = Math.sqrt(Math.pow(targetX - currentRobotX, 2) + Math.pow(targetY - currentRobotY, 2));
      
      // If jump is too large (>50px), smoothly interpolate to prevent visible jump
      const maxJump = 50;
      let x: number, y: number;
      if (distance > maxJump && pathProgress < 0.1 && currentRobotX !== 0 && currentRobotY !== 0) {
        // Smooth interpolation for first 10% of path to prevent jumps
        const smoothFactor = Math.min(pathProgress * 10, 1); // 0 to 1 over first 10% of path
        x = currentRobotX + (targetX - currentRobotX) * smoothFactor;
        y = currentRobotY + (targetY - currentRobotY) * smoothFactor;
      } else {
        x = targetX;
        y = targetY;
      }
      
      // Update tracked position
      currentRobotX = x;
      currentRobotY = y;
      
      // Keep robot completely upright - no tilting at all
      // Always face forward/horizontal (0 degrees)
      targetAngle = 0;
      currentAngle = 0;
      
      setRobotPosition({ x, y });
      setRobotAngle(currentAngle);
      
      if (robotRef.current) {
        // 🛡️ MOBILE FIX: Use GPU-accelerated transforms for better mobile performance
        robotRef.current.style.left = `${x}px`;
        robotRef.current.style.top = `${y}px`;
        robotRef.current.style.transform = `translate3d(-50%, -50%, 0) rotate(${currentAngle}deg)`;
        robotRef.current.style.willChange = 'transform, left, top';
      }
      
      // 🛡️ MOBILE FIX: Continue animation only if running and visible
      if (isRunning && !document.hidden) {
      animationFrameId = requestAnimationFrame(animate);
      }
    };

    // 🛡️ MOBILE FIX: Start animation after delay, but check if page is visible
    const startTimeout = setTimeout(() => {
      if (isRunning && !document.hidden && robotRef.current) {
        // Reset timing for fresh start
        lastTimestamp = 0;
        pathStartTime = 0;
        animationStartTime = 0;
      animationFrameId = requestAnimationFrame(animate);
      }
    }, 500);

    const handleResize = () => {
      // 🛡️ PRODUCTION FIX: Store current robot position before recalculating paths
      // This ensures continuity when paths are recalculated
      let currentRobotX = robotPosition.x;
      let currentRobotY = robotPosition.y;
      
      // If robot is currently moving, use calculated position
      if (robotRef.current && !isPaused) {
        const currentPathElapsed = performance.now() - pathStartTime;
        const currentPathProgress = Math.min(Math.max(currentPathElapsed / pathDuration, 0), 1);
        const t = currentPathProgress;
        const easeProgress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        currentRobotX = currentPath.start.x + (currentPath.end.x - currentPath.start.x) * easeProgress;
        currentRobotY = currentPath.start.y + (currentPath.end.y - currentPath.start.y) * easeProgress;
      }
      
      // Recalculate paths
      paths = createRoamingPaths();
      if (currentPathIndex < paths.length) {
        currentPath = paths[currentPathIndex];
        
        // 🛡️ PRODUCTION FIX: Adjust current path start to match robot's current position
        // This prevents jumps when viewport is resized
        currentPath.start.x = currentRobotX;
        currentPath.start.y = currentRobotY;
        
        // Reset path timing to continue from current position
        pathStartTime = performance.now();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      clearTimeout(startTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      // 🛡️ MOBILE FIX: Clean up will-change for performance
      if (robotRef.current) {
        robotRef.current.style.willChange = 'auto';
      }
    };
  }, []);

  console.log("SignIn component rendering, loading:", loading);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative" style={{ overflow: 'visible', touchAction: 'pan-y', WebkitTouchCallout: 'none' }}>
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl hidden sm:block"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-slate-100/60 rounded-full blur-3xl hidden sm:block"></div>
          <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-blue-100/40 rounded-full blur-3xl hidden sm:block"></div>
        </div>

        <div className="signin-container w-full max-w-md lg:max-w-lg relative z-10" style={{ overflow: 'visible' }}>
          {/* Clean Header Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10 flex flex-col items-center justify-center" style={{ overflow: 'visible' }}>
            {/* Main Heading */}
            <h1 className="welcome-heading text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight drop-shadow-2xl" style={{ textShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)', overflow: 'visible' }}>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>Welcome to</span>{" "}
              <span 
                className="text-blue-600 font-black enqir-text inline-block" 
                style={{ 
                  transform: `translate3d(${textPushOffset.x}px, ${textPushOffset.y}px, 0) rotate(${textPushOffset.x * 1.2}deg) scale(${1 + Math.abs(textPushOffset.x) * 0.01})`,
                  transformOrigin: 'center center',
                  filter: isPushingText ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none',
                  willChange: 'transform',
                  transition: 'none', // No transition - animation is handled by requestAnimationFrame
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                Enqir
              </span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black" style={{ letterSpacing: '0.02em' }}>.in</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-[10px] sm:text-xs text-gray-700 px-2 sm:px-4 leading-tight max-w-md mx-auto mb-4 sm:mb-5 font-medium whitespace-nowrap">
              The AI Powered Intent-Based Hybrid Commerce to buy & sell
            </p>
          </div>

          {/* Clean Card */}
          <Card className="signin-card shadow-2xl border-[0.5px] border-black bg-white/95 backdrop-blur-sm relative overflow-visible z-10">
            <CardContent className="px-5 sm:px-7 lg:px-9 pt-7 sm:pt-9 lg:pt-11 pb-7 sm:pb-9 lg:pb-11 relative z-10">
              {/* Error Display */}
              {error && (
                <Alert className="mb-4 sm:mb-6 border border-red-200 bg-red-50 rounded-lg relative z-20">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-red-800 ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Display */}
              {success && !showVerificationSent && (
                <Alert className="mb-4 sm:mb-6 border border-green-200 bg-green-50 rounded-lg relative z-20">
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
              <Tabs defaultValue="signin" value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full relative z-20">
                    <TabsList className="relative inline-flex items-center bg-gray-100 border border-gray-300 rounded-2xl p-1.5 sm:p-2 mb-6 sm:mb-8 shadow-sm w-full h-auto grid grid-cols-2 gap-1 overflow-hidden transition-all duration-200 z-20">
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
                        <div className="space-y-2.5 relative z-20">
                          <Label htmlFor="identifier" className="text-xs sm:text-sm font-semibold text-gray-800 relative z-20">
                            Email Address
                          </Label>
                      <div className="relative z-20">
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
                        
                        <div className="space-y-2.5 relative z-20">
                          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-800 relative z-20">
                            Password
                          </Label>
                      <div className="relative z-20">
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
                        <div className="space-y-2.5 relative z-20">
                          <Label htmlFor="signup-identifier" className="text-xs sm:text-sm font-semibold text-gray-800 relative z-20">
                            Email Address
                          </Label>
                      <div className="relative z-20">
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

                        <div className="space-y-2.5 relative z-20">
                          <Label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold text-gray-800 relative z-20">
                            Password
                          </Label>
                      <div className="relative z-20">
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
                      className="w-full h-14 sm:h-16 bg-black hover:bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl border border-black transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group z-20"
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

                  <Separator className="my-4 sm:my-6 relative z-20" />
              
                  <div className="text-center relative z-20">
                    <p className="text-[9px] sm:text-[10px] text-gray-600 leading-relaxed relative z-20">
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

          {/* Moving Robot Animation - Outside card, behind content, doesn't interrupt */}
          <div 
            ref={robotRef}
            className="absolute pointer-events-none z-0"
            style={{
              position: 'absolute',
              left: `${robotPosition.x || 0}px`,
              top: `${robotPosition.y || 0}px`,
              width: '80px',
              height: '80px',
              // 🛡️ MOBILE FIX: GPU acceleration and mobile optimizations
              transform: `translate3d(-50%, -50%, 0) rotate(${robotAngle || 0}deg)`,
              willChange: 'transform, left, top',
              transition: 'none',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: `translate3d(-50%, -50%, 0) rotate(${robotAngle || 0}deg)`,
              touchAction: 'none', // Prevent touch interference on mobile
              opacity: 1,
              // 🛡️ MOBILE FIX: Force GPU layer for smoother animation
              transformStyle: 'preserve-3d',
              perspective: '1000px',
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
                      <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </rect>
                    <text x="50" y="63" fontSize="3" fill="#00d4ff" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
                      ENQIR
                    </text>
                    {/* Dynamic body animations - more frequent and engaging movements */}
                    {/* 🚀 PUSHING: Body leans forward and shakes with pushing effort */}
                    {isPushingText && (
                      <>
                        {/* Body leans forward when pushing - more realistic pushing posture */}
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 65; -8 50 65; -5 50 65; -10 50 65; -6 50 65; -8 50 65; 0 50 65"
                          dur="0.4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                        />
                        {/* Forward lean translation - body moves forward when pushing */}
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 3,2; 5,3; 4,2.5; 5,3; 3,2; 0,0"
                          dur="0.4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                          additive="sum"
                        />
                        {/* Body shakes/vibrates with pushing effort */}
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; -1.5,0; 1.5,0; -1,0; 1,0; -0.5,0; 0,0"
                          dur="0.2s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                        {/* Body compresses slightly when pushing - shows effort */}
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.08,0.95; 1.05,0.97; 1.1,0.94; 1.06,0.96; 1.08,0.95; 1,1"
                          dur="0.4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'jump' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-8; 0,0; 0,-4; 0,0"
                          dur="0.4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.1,0.9; 1,1; 1.05,0.95; 1,1"
                          dur="0.4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'spin' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 65; 180 50 65; 360 50 65"
                          dur="0.6s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.5;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.15,1.15; 1,1"
                          dur="0.6s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.5;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'celebrate' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-8; 0,-4; 0,-6; 0,0; 0,-3; 0,0"
                          dur="0.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.2,1.2; 1.1,1.1; 1.18,1.18; 1,1; 1.08,1.08; 1,1"
                          dur="0.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 65; -5 50 65; 5 50 65; -3 50 65; 3 50 65; 0 50 65"
                          dur="0.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.2;0.4;0.6;0.8;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'dance' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-5; 0,-2; 0,-4; 0,0; 0,-3; 0,0"
                          dur="0.35s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 65; -10 50 65; 10 50 65; -8 50 65; 8 50 65; -5 50 65; 0 50 65"
                          dur="0.35s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.12,0.88; 1,1; 1.08,0.92; 1,1; 1.05,0.95; 1,1"
                          dur="0.35s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {(robotAction === 'idle' || robotAction === 'wave' || robotAction === 'lookAround') && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-4; 0,-1; 0,-3; 0,0; 0,-2; 0,0"
                          dur="1.8s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 65; -3 50 65; 3 50 65; -2 50 65; 2 50 65; -1 50 65; 0 50 65"
                          dur="2s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.06,0.98; 1,1; 1.04,1.02; 1,1; 1.03,0.99; 1,1"
                          dur="1.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          additive="sum"
                        />
                      </>
                    )}
                  </g>
              
                  {/* Head */}
                  <g id="head-group-signin">
                    <ellipse cx="50" cy="30" rx="14" ry="16" fill="url(#whiteMatte-signin)" stroke="none"/>
                    <ellipse cx="50" cy="30" rx="12" ry="14" fill="url(#lightGrey-signin)"/>
                    <line x1="50" y1="8" x2="50" y2="11" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                      <animate attributeName="y2" values="11;9.5;11;10;11" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                    </line>
                    <circle cx="50" cy="8" r="1.5" fill="#ffffff" opacity="0.6">
                      <animate attributeName="r" values="1.5;2.2;1.5;2;1.5" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                    </circle>
                    {/* Dynamic head animations based on action */}
                    {robotAction === 'jump' && (
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,-6; 0,0"
                        dur="0.6s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.5;1"
                      />
                    )}
                    {robotAction === 'spin' && (
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 50 30; 360 50 30"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    )}
                    {robotAction === 'celebrate' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-5; 0,0; 0,-2; 0,0"
                          dur="0.8s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1,1; 1.12,1.12; 1,1"
                          dur="0.8s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.5;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'dance' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-3; 0,0; 0,-1.5; 0,0"
                          dur="0.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 30; -10 50 30; 10 50 30; -10 50 30; 0 50 30"
                          dur="0.5s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                          additive="sum"
                        />
                      </>
                    )}
                    {robotAction === 'lookAround' && (
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 50 30; -15 50 30; 15 50 30; -15 50 30; 0 50 30"
                        dur="2s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.25;0.5;0.75;1"
                      />
                    )}
                    {(robotAction === 'idle' || robotAction === 'wave') && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; 0,-2.5; 0,0"
                          dur="2.2s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.5;1"
                          begin="0.8s"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 50 30; 5 50 30; 0 50 30; -5 50 30; 0 50 30"
                          dur="3s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.25;0.5;0.75;1"
                          begin="1s"
                          additive="sum"
                        />
                      </>
                    )}
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
                    {/* Dynamic eye animations based on action */}
                    {robotAction === 'celebrate' && (
                      <>
                        <animate attributeName="opacity" values="0.5;1;0.5;1;0.5" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                        <animate attributeName="ry" values="4;7;4;7;4" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                        <animate attributeName="rx" values="3.5;5;3.5;5;3.5" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                      </>
                    )}
                    {robotAction === 'lookAround' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; -3,0; 3,0; -2,1; 2,-1; 0,0"
                          dur="2s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.2;0.4;0.6;0.8;1"
                        />
                        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </>
                    )}
                    {(robotAction === 'idle' || robotAction === 'wave' || robotAction === 'jump' || robotAction === 'spin' || robotAction === 'dance') && (
                      <>
                        <animate attributeName="opacity" values="0.5;1;0.5;0.8;0.5" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                        <animate attributeName="ry" values="4;6;4;5.5;4" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                        <animate attributeName="rx" values="3.5;4.5;3.5;4.2;3.5" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1"/>
                      </>
                    )}
                  </ellipse>
                  <ellipse cx="56" cy="28" rx="3.5" ry="4" fill="url(#cyanGlow-signin)" style={{ filter: 'url(#cyan-glow-signin)' }}>
                    {/* Dynamic eye animations based on action */}
                    {robotAction === 'celebrate' && (
                      <>
                        <animate attributeName="opacity" values="0.5;1;0.5;1;0.5" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.2s"/>
                        <animate attributeName="ry" values="4;7;4;7;4" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.2s"/>
                        <animate attributeName="rx" values="3.5;5;3.5;5;3.5" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.2s"/>
                      </>
                    )}
                    {robotAction === 'lookAround' && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="0,0; -3,0; 3,0; -2,1; 2,-1; 0,0"
                          dur="2s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.2;0.4;0.6;0.8;1"
                          begin="0.5s"
                        />
                        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s"/>
                      </>
                    )}
                    {(robotAction === 'idle' || robotAction === 'wave' || robotAction === 'jump' || robotAction === 'spin' || robotAction === 'dance') && (
                      <>
                        <animate attributeName="opacity" values="0.5;1;0.5;0.8;0.5" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.5s"/>
                        <animate attributeName="ry" values="4;6;4;5.5;4" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.5s"/>
                        <animate attributeName="rx" values="3.5;4.5;3.5;4.2;3.5" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.25;0.5;0.75;1" begin="0.5s"/>
                      </>
                    )}
                  </ellipse>
                  {/* Blink animation when paused above text */}
                  {isRobotPaused && (
                    <>
                      <rect x="40" y="26" width="8" height="4" fill="#1a1a1a" rx="2" opacity="0">
                        <animate attributeName="opacity" values="0;0;1;1;0;0" dur="0.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.3;0.35;0.4;0.45;1"/>
                      </rect>
                      <rect x="52" y="26" width="8" height="4" fill="#1a1a1a" rx="2" opacity="0">
                        <animate attributeName="opacity" values="0;0;1;1;0;0" dur="0.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.3;0.35;0.4;0.45;1" begin="0.05s"/>
                      </rect>
                    </>
                  )}
                  {/* Eye movement - looking around more actively */}
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0,0; -2,0; 2,0; -1,1; 1,-1; 0,0"
                    dur="5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                    keyTimes="0;0.2;0.4;0.6;0.8;1"
                  />
                  {/* Wink animation - right eye periodically */}
                  <rect x="52" y="26" width="8" height="4" fill="#1a1a1a" rx="2" opacity="0">
                    <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;1;0;0;0" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.04;0.08;0.12;0.16;0.2;0.24;0.28;0.32;0.36;0.4;0.44;0.48;0.52;0.56;0.6;0.64;0.68;0.72;0.76;0.8;0.82;0.84;0.88;1" begin="2s"/>
                  </rect>
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
                        {/* 🚀 PUSHING: Hand pulses more actively when pushing */}
                        {/* 🧘 RELAXED: Hand is smaller and more subtle when relaxed */}
                        {isPushingText ? (
                          <animate attributeName="r" values="3;4.5;3.5;4;3.2;4.2;3" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"/>
                        ) : (
                          <animate attributeName="r" values="3;3.2;2.8;3.1;2.9;3;3" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"/>
                        )}
                      </circle>
                      {/* Completely different hand movements for each action */}
                      {/* 🚀 PUSHING: Left arm extends forward and pushes with force */}
                      {isPushingText && (
                        <>
                          {/* Arm extends forward (more horizontal) - like actually pushing */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -5 20 60; -8 20 60; -3 20 60; -5 20 60; -8 20 60; -15 20 60"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                          />
                          {/* Forward pushing motion - extends arm forward */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 8,-3; 12,-5; 10,-4; 12,-5; 8,-3; 0,0"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'wave' && (
                        <>
                          {/* Circular waving motion - arm moves in a circle */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -80 20 60; -15 20 60; -80 20 60; -15 20 60"
                            dur="0.5s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                          />
                          {/* Vertical lift and drop for wave effect */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -4,-6; 0,0; -4,-6; 0,0"
                            dur="0.5s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'celebrate' && (
                        <>
                          {/* Upward thrust motion - arms raise high */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -90 20 60; -15 20 60; -90 20 60; -15 20 60"
                            dur="0.35s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                          />
                          {/* Diagonal upward movement */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -5,-8; 0,0; -5,-8; 0,0"
                            dur="0.35s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'dance' && (
                        <>
                          {/* Side-to-side swinging motion */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -40 20 60; 10 20 60; -40 20 60; -15 20 60; -35 20 60; -15 20 60"
                            dur="0.25s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          />
                          {/* Horizontal swinging */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -3,0; 2,0; -3,0; 0,0; -2,0; 0,0"
                            dur="0.25s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'jump' && (
                        <>
                          {/* Arms spread wide during jump */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -45 20 60; -15 20 60"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.5;1"
                          />
                          {/* Outward spread motion */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -3,-4; 0,0"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.5;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'spin' && (
                        <>
                          {/* Arms extend outward during spin */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -30 20 60; -15 20 60; -30 20 60; -15 20 60"
                            dur="0.6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                          />
                          {/* Radial extension */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -2.5,-2.5; 0,0; -2.5,-2.5; 0,0"
                            dur="0.6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'lookAround' && (
                        <>
                          {/* Slow, subtle arm movement while looking */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -25 20 60; -20 20 60; -15 20 60"
                            dur="2s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.33;0.67;1"
                          />
                          {/* Minimal translation */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -0.5,-0.5; 0,0; -0.5,-0.5; 0,0"
                            dur="2s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            additive="sum"
                          />
                        </>
                      )}
                      {/* 🧘 RELAXED: Completely different relaxed arm position when NOT pushing - hangs down naturally */}
                      {!isPushingText && (
                        <>
                          {/* Relaxed hanging arm - MUCH more vertical (hangs down at -30° to -35°) */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="-15 20 60; -30 20 60; -35 20 60; -28 20 60; -32 20 60; -30 20 60; -15 20 60"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                          />
                          {/* Relaxed sway - arm hangs DOWNWARD (positive Y = down) */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -1.5,6; 1,5; -1,7; 0.5,4; -1.2,6.5; 0,0"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            additive="sum"
                          />
                        </>
                      )}
                    </g>
                    <g id="right-arm-signin" transform-origin="80 60">
                      <ellipse cx="80" cy="60" rx="5" ry="9" fill="url(#whiteMatte-signin)" stroke="none" transform="rotate(15 80 60)"/>
                      <ellipse cx="80" cy="60" rx="4" ry="7" fill="url(#lightGrey-signin)" transform="rotate(15 80 60)"/>
                      <circle cx="84" cy="68" r="3" fill="url(#whiteMatte-signin)">
                        {/* 🚀 PUSHING: Hand pulses more actively when pushing - synchronized with left */}
                        {/* 🧘 RELAXED: Hand is smaller and more subtle when relaxed */}
                        {isPushingText ? (
                          <animate attributeName="r" values="3;4.5;3.5;4;3.2;4.2;3" dur="0.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.15;0.3;0.45;0.6;0.75;1" begin="0.2s"/>
                        ) : (
                          <animate attributeName="r" values="3;3.2;2.8;3.1;2.9;3;3" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.17;0.33;0.5;0.67;0.83;1" begin="2.5s"/>
                        )}
                      </circle>
                      {/* Completely different hand movements - right arm */}
                      {/* 🚀 PUSHING: Right arm extends forward and pushes with force - synchronized with left */}
                      {isPushingText && (
                        <>
                          {/* Arm extends forward (more horizontal) - like actually pushing */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 5 80 60; 8 80 60; 3 80 60; 5 80 60; 8 80 60; 15 80 60"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                            begin="0.2s"
                          />
                          {/* Forward pushing motion - extends arm forward */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; -8,-3; -12,-5; -10,-4; -12,-5; -8,-3; 0,0"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.15;0.3;0.45;0.6;0.75;1"
                            begin="0.2s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'wave' && (
                        <>
                          {/* Circular waving motion - opposite direction */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 80 80 60; 15 80 60; 80 80 60; 15 80 60"
                            dur="0.5s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.25s"
                          />
                          {/* Vertical lift and drop - synchronized */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 4,-6; 0,0; 4,-6; 0,0"
                            dur="0.5s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.25s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'celebrate' && (
                        <>
                          {/* Upward thrust - synchronized with left */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 90 80 60; 15 80 60; 90 80 60; 15 80 60"
                            dur="0.35s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.175s"
                          />
                          {/* Diagonal upward movement */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 5,-8; 0,0; 5,-8; 0,0"
                            dur="0.35s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.175s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'dance' && (
                        <>
                          {/* Side-to-side swinging - opposite direction */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 40 80 60; -10 80 60; 40 80 60; 15 80 60; 35 80 60; 15 80 60"
                            dur="0.25s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            begin="0.125s"
                          />
                          {/* Horizontal swinging - opposite */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 3,0; -2,0; 3,0; 0,0; 2,0; 0,0"
                            dur="0.25s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            begin="0.125s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'jump' && (
                        <>
                          {/* Arms spread wide - synchronized */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 45 80 60; 15 80 60"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.5;1"
                            begin="0.2s"
                          />
                          {/* Outward spread motion */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 3,-4; 0,0"
                            dur="0.4s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.5;1"
                            begin="0.2s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'spin' && (
                        <>
                          {/* Arms extend outward - synchronized */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 30 80 60; 15 80 60; 30 80 60; 15 80 60"
                            dur="0.6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.3s"
                          />
                          {/* Radial extension */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 2.5,-2.5; 0,0; 2.5,-2.5; 0,0"
                            dur="0.6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="0.3s"
                            additive="sum"
                          />
                        </>
                      )}
                      {robotAction === 'lookAround' && (
                        <>
                          {/* Slow, subtle arm movement */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 25 80 60; 20 80 60; 15 80 60"
                            dur="2s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.33;0.67;1"
                            begin="1s"
                          />
                          {/* Minimal translation */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 0.5,-0.5; 0,0; 0.5,-0.5; 0,0"
                            dur="2s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.25;0.5;0.75;1"
                            begin="1s"
                            additive="sum"
                          />
                        </>
                      )}
                      {/* 🧘 RELAXED: Completely different relaxed arm position when NOT pushing - right arm hangs down */}
                      {!isPushingText && (
                        <>
                          {/* Relaxed hanging arm - MUCH more vertical (hangs down at 30° to 35°) - mirrors left */}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="15 80 60; 30 80 60; 35 80 60; 28 80 60; 32 80 60; 30 80 60; 15 80 60"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            begin="3s"
                          />
                          {/* Relaxed sway - arm hangs DOWNWARD (positive Y = down, opposite X of left) */}
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0,0; 1.5,6; -1,5; 1,7; -0.5,4; 1.2,6.5; 0,0"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                            keyTimes="0;0.17;0.33;0.5;0.67;0.83;1"
                            begin="3s"
                            additive="sum"
                          />
                        </>
                      )}
                    </g>
                  </g>
            </svg>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default SignIn;

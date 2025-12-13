import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Store, 
  Crown, 
  Shield, 
  MessageSquare, 
  LayoutDashboard, 
  Filter,
  CheckCircle,
  ArrowRight,
  X,
  Search,
  Bot
} from "lucide-react";

const HelpGuide = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(true);
  const noticeRef = useRef<HTMLDivElement>(null);
  const [pathCoords, setPathCoords] = useState({ 
    start: { x: 0, y: 0 }, 
    end: { x: 0, y: 0 },
    control1: { x: 0, y: 0 },
    control2: { x: 0, y: 0 },
    control3: { x: 0, y: 0 },
    control4: { x: 0, y: 0 },
    control5: { x: 0, y: 0 }
  });
  const [robotPosition, setRobotPosition] = useState({ x: 0, y: 0 });
  const robotRef = useRef<HTMLDivElement>(null);

  const sections = [
    {
      id: "ai",
      title: "AI Assistant",
      icon: Bot,
      content: [
        {
          title: "How AI Helps You",
          description: "Our AI automatically finds the best matches, suggests relevant enquiries, and helps you connect faster.",
          steps: [
            "Smart search finds exactly what you need",
            "AI suggests best sellers for your enquiry",
            "Auto-approves quality responses instantly",
            "Filters spam and fake accounts automatically"
          ]
        },
        {
          title: "For Buyers",
          description: "AI shows you the most relevant sellers, verifies their quality, and helps you make better decisions.",
          steps: [
            "See top-rated sellers first",
            "Get quality-verified responses",
            "Smart recommendations based on your needs"
          ]
        },
        {
          title: "For Sellers",
          description: "AI helps your responses get approved faster, matches you with right buyers, and boosts your visibility.",
          steps: [
            "Fast auto-approval for quality responses",
            "Better matching with relevant enquiries",
            "Priority placement for verified sellers"
          ]
        }
      ]
    },
    {
      id: "buyers",
      title: "For Buyers",
      icon: ShoppingCart,
      content: [
        {
          title: "Post What You Need",
          description: "Tell us what you're looking for. Add your budget and location.",
          steps: [
            "Click 'Post Enquiry'",
            "Describe what you need",
            "Set budget and location",
            "Upload ID (optional, for trust badge)",
            "Submit - AI will help match you with sellers"
          ]
        },
        {
          title: "Get Responses",
          description: "Sellers will respond with offers. AI helps show you the best ones first.",
          steps: [
            "Go to 'My Enquiries'",
            "See all seller responses",
            "Check prices and images",
            "Click to chat with sellers"
          ]
        },
        {
          title: "Chat & Close Deal",
          description: "Talk to sellers, ask questions, and finalize your purchase.",
          steps: [
            "Open chat from seller response",
            "Use quick buttons for common questions",
            "Share images or make calls",
            "Agree and close the deal"
          ]
        }
      ]
    },
    {
      id: "sellers",
      title: "For Sellers",
      icon: Store,
      content: [
        {
          title: "Find Opportunities",
          description: "Browse enquiries that match what you sell. AI helps show you the most relevant ones.",
          steps: [
            "Go to 'Live Enquiries'",
            "Search or filter by category",
            "Click to see enquiry details",
            "Check budget and requirements"
          ]
        },
        {
          title: "Send Your Offer",
          description: "Respond with your price, description, and images. AI helps get you approved faster.",
          steps: [
            "Click 'Respond' on enquiry",
            "Add price and description",
            "Upload product images",
            "Upload ID (for trust badge)",
            "Submit - AI auto-approves quality responses"
          ]
        },
        {
          title: "Chat & Sell",
          description: "Buyers will chat with you. Answer questions and close deals.",
          steps: [
            "Buyer starts chat after approval",
            "Use quick buttons for fast replies",
            "Share more details or images",
            "Finalize and complete the sale"
          ]
        }
      ]
    },
    {
      id: "premium",
      title: "Premium",
      icon: Crown,
      content: [
        {
          title: "What You Get",
          description: "Get more visibility and faster results with premium.",
          steps: [
            "Show at top of search results",
            "More views and responses",
            "Priority placement",
            "Premium badge on your profile"
          ]
        },
        {
          title: "How to Upgrade",
          description: "Upgrade from your dashboard in seconds.",
          steps: [
            "Go to Dashboard",
            "Click Premium",
            "Choose plan and pay",
            "Get instant benefits"
          ]
        }
      ]
    },
    {
      id: "trustbadge",
      title: "Trust Badge",
      icon: Shield,
      content: [
        {
          title: "What It Is",
          description: "A blue checkmark that shows you're verified and trusted.",
          steps: [
            "Blue checkmark on your profile",
            "Shows you're verified",
            "Builds trust with others",
            "More responses and better matches"
          ]
        },
        {
          title: "How to Get It",
          description: "Two ways to get trust badge - Profile KYC (for all) or Form upload (for specific enquiry).",
          steps: [
            "Profile KYC: Go to Profile, upload ID (front & back), enter ID number, submit - approved in 24-48 hours",
            "If you add trust badge through KYC in profile, all your enquiries (as buyer) and responses (as seller) automatically get trust badge",
            "You can remove the trust badge from profile anytime you want",
            "Form upload: Trust badges from buyers and sellers forms are only for that particular enquiry"
          ]
        }
      ]
    },
    {
      id: "chat",
      title: "Chat",
      icon: MessageSquare,
      content: [
        {
          title: "How It Works",
          description: "Chat automatically opens when seller response is approved.",
          steps: [
            "Buyer clicks approved response to chat",
            "Send messages, images, or make calls",
            "Use quick buttons for common questions",
            "Agree on terms and close deal"
          ]
        },
        {
          title: "Quick Messages",
          description: "Fast buttons for payment, delivery, quality, meetup questions.",
          steps: [
            "Click quick message buttons",
            "Instant pre-written messages",
            "Saves time on common questions"
          ]
        },
        {
          title: "My Chats",
          description: "See all your conversations in one place.",
          steps: [
            "Go to 'My Chats'",
            "View all conversations",
            "See unread message counts"
          ]
        }
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      content: [
        {
          title: "Your Control Center",
          description: "See everything in one place - enquiries, responses, chats, and stats.",
          steps: [
            "View all your enquiries and responses",
            "Track chats and messages",
            "Manage premium and settings",
            "See notifications and updates"
          ]
        }
      ]
    },
    {
      id: "filtering",
      title: "Search & Filter",
      icon: Filter,
      content: [
        {
          title: "Smart Search",
          description: "AI-powered search finds exactly what you need.",
          steps: [
            "Type in search bar",
            "AI matches title, description, category",
            "See instant results",
            "Click to view details"
          ]
        },
        {
          title: "Trust Badge Filter",
          description: "Show only verified users for extra safety.",
          steps: [
            "Go to 'Live Enquiries'",
            "Click filter icon (left of grid/list)",
            "Select 'Trust badge only'",
            "See only verified users"
          ]
        },
        {
          title: "Other Filters",
          description: "Filter by category or switch between grid/list view.",
          steps: [
            "Use category dropdown to filter",
            "Toggle grid/list view",
            "Find what works best for you"
          ]
        }
      ]
    }
  ];

  // Add/remove global class for chatbot highlighting
  useEffect(() => {
    if (showPath) {
      document.body.classList.add('help-guide-path-active');
    } else {
      document.body.classList.remove('help-guide-path-active');
    }
    return () => {
      document.body.classList.remove('help-guide-path-active');
    };
  }, [showPath]);

  // Dismiss path on scroll
  useEffect(() => {
    if (!showPath) return;

    const handleScroll = () => {
      setShowPath(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [showPath]);

    // Animate robot roaming all over the screen smoothly
    useEffect(() => {
      if (!showPath) {
        setRobotPosition({ x: 0, y: 0 });
        if (robotRef.current) {
          robotRef.current.style.display = 'none';
        }
        return;
      }

      // Start position: at bottom screen border, centered horizontally
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight;
      const visibleHeight = 100; // Only show top 100px initially

      // Initialize robot peeping out from bottom
      setRobotPosition({ x: startX, y: startY });
      if (robotRef.current) {
        robotRef.current.style.display = 'block';
        robotRef.current.style.left = `${startX}px`;
        robotRef.current.style.top = `${startY}px`;
        robotRef.current.style.transform = `translate(-50%, ${-visibleHeight}px) rotate(0deg)`;
        robotRef.current.style.transition = 'none'; // Disable CSS transitions
      }

      let animationFrameId: number | null = null;
      let isRunning = true;
      let currentPathIndex = 0;
      let pathProgress = 0;
      let lastTimestamp = 0;
      let currentAngle = 0; // Track current rotation angle for smooth interpolation
      let targetAngle = 0; // Target angle for smooth rotation
      let currentVisibleHeight = 100; // Track visible height for smooth transitions

      // Define multiple roaming paths across the screen - robot goes outside and enters from outside
      const createRoamingPaths = () => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const padding = 120;
        const isMobile = window.innerWidth < 640;
        const chatbotButtonSize = isMobile ? 48 : 56;
        const chatbotX = screenWidth - (isMobile ? 16 : 24) - (chatbotButtonSize / 2);
        const chatbotY = screenHeight - (isMobile ? 80 : 24) - (chatbotButtonSize / 2);
        
        // Off-screen positions - enough distance to fully exit but not too far
        const offScreenRight = screenWidth + 150;
        const offScreenLeft = -150;
        const offScreenTop = -150;
        const offScreenBottom = screenHeight + 150;
        
        // Define paths ensuring each path's end connects to next path's start
        const path1End = { x: offScreenRight, y: screenHeight / 2 };
        const path2End = { x: screenWidth - padding, y: padding };
        const path3End = { x: screenWidth / 2, y: offScreenTop };
        const path4End = { x: screenWidth / 2, y: screenHeight / 2 };
        const path5End = { x: offScreenLeft, y: screenHeight / 2 };
        const path6End = { x: padding, y: padding };
        const path7End = { x: screenWidth / 2, y: offScreenBottom + 300 };
        const path8End = { x: chatbotX, y: chatbotY };
        const path9End = { x: offScreenRight, y: chatbotY };
        const path10End = { x: screenWidth / 2, y: screenHeight };
        
        return [
          // Path 1: Bottom center -> Exit right off-screen
          { start: path10End, end: path1End, visibleHeight: 200 },
          // Path 2: Enter from right off-screen -> Top right (connects from path1)
          { start: path1End, end: path2End, visibleHeight: 200 },
          // Path 3: Top right -> Exit top off-screen (connects from path2)
          { start: path2End, end: path3End, visibleHeight: 200 },
          // Path 4: Enter from top off-screen -> Center (connects from path3)
          { start: path3End, end: path4End, visibleHeight: 200 },
          // Path 5: Center -> Exit left off-screen (connects from path4)
          { start: path4End, end: path5End, visibleHeight: 200 },
          // Path 6: Enter from left off-screen -> Top left (connects from path5)
          { start: path5End, end: path6End, visibleHeight: 200 },
          // Path 7: Top left -> Exit bottom off-screen (connects from path6, robot fully exits)
          { start: path6End, end: path7End, visibleHeight: 0 },
          // Path 8: Enter from bottom off-screen -> Chat icon (connects from path7)
          { start: path7End, end: path8End, visibleHeight: 200 },
          // Path 9: Chat icon -> Exit right off-screen (connects from path8)
          { start: path8End, end: path9End, visibleHeight: 200 },
          // Path 10: Enter from right off-screen -> Bottom center (connects from path9, loops back to path1)
          { start: path9End, end: path10End, visibleHeight: 100 },
        ];
      };

      let paths = createRoamingPaths();
      let currentPath = paths[currentPathIndex];
      const pathDuration = 3000; // 3 seconds per path segment
      const pauseDuration = 1500; // 1.5 seconds pause at each stop
      const rotationSmoothing = 0.12; // Smoother rotation (lower = smoother)
      const heightSmoothing = 0.1; // Smooth height transitions
      let isPaused = false;
      let pauseStartTime = 0;
      let pauseProgress = 0;

      const animate = (timestamp: number) => {
        if (!isRunning) return;
        
        if (lastTimestamp === 0) lastTimestamp = timestamp;
        const deltaTime = Math.min(timestamp - lastTimestamp, 16.67); // Cap at 60fps
        lastTimestamp = timestamp;
        
        // Handle pause state
        if (isPaused) {
          pauseProgress += deltaTime;
          if (pauseProgress >= pauseDuration) {
            isPaused = false;
            pauseProgress = 0;
            pauseStartTime = 0;
            // Move to next path after pause
            pathProgress = 0;
            const prevPathIndex = currentPathIndex;
            currentPathIndex = (currentPathIndex + 1) % paths.length;
            
            // Recalculate paths on path change (in case window resized)
            paths = createRoamingPaths();
            if (currentPathIndex < paths.length) {
              currentPath = paths[currentPathIndex];
            }
            
            // Ensure position continuity - start new path exactly where previous ended
            if (prevPathIndex < paths.length) {
              const prevPath = paths[prevPathIndex];
              setRobotPosition({ x: prevPath.end.x, y: prevPath.end.y });
            }
          } else {
            // During pause, keep robot at current position
            animationFrameId = requestAnimationFrame(animate);
            return;
          }
        }
        
        // Update path progress
        pathProgress += deltaTime / pathDuration;
        
        if (pathProgress >= 1) {
          // Pause at the end of each path
          isPaused = true;
          pauseStartTime = timestamp;
          pauseProgress = 0;
          pathProgress = 1; // Keep at end position during pause
        }
        
        // Smooth easing function (ease-in-out cubic)
        const t = pathProgress;
        const easeProgress = t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        // Calculate position along current path
        const x = currentPath.start.x + (currentPath.end.x - currentPath.start.x) * easeProgress;
        const y = currentPath.start.y + (currentPath.end.y - currentPath.start.y) * easeProgress;
        
        // Calculate target rotation angle based on movement direction
        // Use velocity-based angle for smoother rotation
        const dx = currentPath.end.x - currentPath.start.x;
        const dy = currentPath.end.y - currentPath.start.y;
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Smoothly interpolate rotation angle for continuous movement
        // Normalize angles to -180 to 180 range for shortest path
        let angleDiff = targetAngle - currentAngle;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        
        // Smooth interpolation towards target angle
        currentAngle += angleDiff * rotationSmoothing;
        
        // Normalize current angle
        if (currentAngle > 180) currentAngle -= 360;
        if (currentAngle < -180) currentAngle += 360;
        
        // Smoothly transition visible height
        const targetHeight = currentPath.visibleHeight;
        currentVisibleHeight += (targetHeight - currentVisibleHeight) * heightSmoothing;
        
        // Update robot position smoothly using transform
        if (robotRef.current) {
          robotRef.current.style.left = `${x}px`;
          robotRef.current.style.top = `${y}px`;
          robotRef.current.style.transform = `translate(-50%, ${-currentVisibleHeight}px) rotate(${currentAngle}deg)`;
        }
        
        setRobotPosition({ x, y });
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);

      // Recalculate paths on window resize
      const handleResize = () => {
        paths = createRoamingPaths();
        if (currentPathIndex < paths.length) {
          currentPath = paths[currentPathIndex];
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        isRunning = false;
        window.removeEventListener('resize', handleResize);
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [showPath]);

  // Calculate path coordinates for arrow
  useEffect(() => {
    if (!showPath || !noticeRef.current) return;
    
    const updatePath = () => {
      const notice = noticeRef.current;
      if (!notice) return;
      
      const noticeRect = notice.getBoundingClientRect();
      // Chatbot is at fixed position: bottom-20 right-4 (mobile) or bottom-6 right-6 (desktop)
      const isMobile = window.innerWidth < 640;
      const chatbotButtonSize = isMobile ? 48 : 56; // w-12 h-12 (48px) or w-14 h-14 (56px)
      const chatbotX = window.innerWidth - (isMobile ? 16 : 24) - (chatbotButtonSize / 2);
      const chatbotY = window.innerHeight - (isMobile ? 80 : 24) - (chatbotButtonSize / 2);
      
      // Ensure start point stays within screen bounds and is clearly visible
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;
      
      // Position robot on top of notice box - center horizontally, feet on top edge
      const startX = noticeRect.left + noticeRect.width / 2; // Center of notice box horizontally
      const startY = noticeRect.top; // Top edge of notice box (feet will touch here)
      
      // Create a highly twisted, hyperbolic path with dramatic curves
      // First control point - extreme curve up and far left (hyperbolic entry)
      const control1X = centerX - 200;
      const control1Y = Math.max(startY - 200, 30);
      
      // Second control point - dramatic twist: goes way right, then curves back
      const control2X = centerX + 180;
      const control2Y = centerY - 150;
      
      // Third control point - hyperbolic curve: loops back left through center
      const control3X = centerX - 150;
      const control3Y = centerY + 120;
      
      // Fourth control point - another dramatic twist: curves right then down
      const control4X = centerX + 120;
      const control4Y = centerY + 100;
      
      // Fifth control point - final hyperbolic curve towards chatbot
      const control5X = chatbotX - 40;
      const control5Y = chatbotY - 100;
      
      setPathCoords({
        start: {
          x: startX, // Start a bit to the right of notice, but within screen bounds
          y: startY // Middle of notice
        },
        end: {
          x: chatbotX,
          y: chatbotY
        },
        control1: {
          x: control1X,
          y: control1Y
        },
        control2: {
          x: control2X,
          y: control2Y
        },
        control3: {
          x: control3X,
          y: control3Y
        },
        control4: {
          x: control4X,
          y: control4Y
        },
        control5: {
          x: control5X,
          y: control5Y
        }
      });
    };
    
    updatePath();
    window.addEventListener('resize', updatePath);
    window.addEventListener('scroll', updatePath);
    
    return () => {
      window.removeEventListener('resize', updatePath);
      window.removeEventListener('scroll', updatePath);
    };
  }, [showPath]);

  return (
    <Layout>
      <div className={`min-h-screen bg-gradient-to-br from-background to-muted/20 ${showPath ? 'help-guide-path-active' : ''}`}>
        {/* Header - Matching Dashboard Style - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10"></div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
              </div>
            </div>
            
            {/* Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
                How to Use Enqir.
              </h1>
            </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  A simple guide to help you close deals at godspeed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enqir Assistant Notice */}
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${showPath ? 'notice-container' : ''}`}>
          <div 
            ref={noticeRef}
            className={`bg-gradient-to-r from-blue-600 to-blue-700 border-[0.5px] border-blue-800 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] rounded-xl px-3 sm:px-6 py-2 sm:py-4 mb-4 sm:mb-6 transition-all duration-300 relative ${
              showPath ? 'notice-highlight z-[70]' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap overflow-hidden">
              <Bot className="h-3 w-3 sm:h-5 sm:w-5 text-white flex-shrink-0" />
              <p className="text-[10px] sm:text-sm font-semibold text-white text-center truncate">
                Got more doubts? Enqir assistant here 24/7 to help!
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* Quick Overview - For Buyers */}
          <Card className="group border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl mb-6 sm:mb-8 overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
            <CardHeader className="bg-black text-white rounded-t-2xl relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white">
                  <ShoppingCart className="h-5 w-5 text-black" />
                </div>
                <CardTitle className="text-base sm:text-lg font-black text-white">
                  For Buyers - How It Works
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="space-y-4">
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    1
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Post Your Enquiry</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Go to "Post Enquiry", fill in what you need, your budget, and location.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    2
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Choose Premium (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Get more than 2 responses from different sellers with different offers. Select what's better for you.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    3
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Add Trust Badge (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Complete KYC in your profile - all your enquiries get trust badge automatically. You can remove it anytime. Or complete KYC in enquiry form for that enquiry only.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    4
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">AI Verifies Instantly</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Our AI verifies your enquiry and matches you with the right sellers automatically.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    5
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Track from Dashboard</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Track all your enquiries from the dashboard.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    6
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Chat & Close Deal</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Chat with sellers for your needs and close the deal.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Overview - For Sellers */}
          <Card className="group border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl mb-6 sm:mb-8 overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
            <CardHeader className="bg-black text-white rounded-t-2xl relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white">
                  <Store className="h-5 w-5 text-black" />
                </div>
                <CardTitle className="text-base sm:text-lg font-black text-white">
                  For Sellers - How It Works
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="space-y-4">
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    1
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Browse Live Enquiries</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Go to "Live Enquiries" and find enquiries that match what you sell.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    2
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Send Your Offer</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Click "Respond" on any enquiry, add your price, description, and upload product images.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    3
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Add Trust Badge (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Complete KYC in your profile - all your responses get trust badge automatically. You can remove it anytime. Or complete KYC in response form for that response only.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    4
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">AI Auto-Approves</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Our AI instantly approves quality responses, so buyers see your offer faster.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    5
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Get Chatted</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Buyers will chat with you about their needs. Answer questions and share details.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    6
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Close the Sale</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Finalize terms with buyers and complete the sale.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(activeSection === section.id ? null : section.id);
                    setTimeout(() => {
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`group relative p-4 rounded-xl border-[0.5px] border-black bg-white transition-all duration-200 text-left overflow-hidden ${
                    activeSection === section.id
                      ? 'shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] scale-105'
                      : 'shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                  <Icon className="h-6 w-6 mb-2 text-black relative z-10" />
                  <p className="text-xs sm:text-sm font-black text-black relative z-10">
                    {section.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sections */}
          <div className="space-y-6 sm:space-y-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  id={section.id}
                  className="border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300"
                >
                  <CardHeader className="bg-black text-white pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-white">
                        <Icon className="h-6 w-6 text-black" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-black text-white">
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {section.content.map((item, index) => (
                      <div key={index} className="border-l-4 border-black pl-4 sm:pl-6">
                        <h3 className="text-lg sm:text-xl font-black text-black mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 mb-4">
                          {item.description}
                        </p>
                        <div className="space-y-2">
                          {item.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-700 flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-8 sm:mt-12">
            <Card className="border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl overflow-hidden">
              <CardHeader className="bg-black text-white rounded-t-2xl">
                <CardTitle className="text-base sm:text-lg font-black text-white text-center">
                  Ready to Get Started?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-700 mb-6">
                  Join thousands of users buying and selling on Enqir
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/post-enquiry')}
                    className="bg-black text-white hover:bg-gray-800 border-[0.5px] border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-200"
                  >
                    Post an Enquiry
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    onClick={() => navigate('/enquiries')}
                    variant="outline"
                    className="border-[0.5px] border-black bg-white text-black hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-200"
                  >
                    Browse Enquiries
                    <Search className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Spotlight Overlay with Arrow Path */}
        {showPath && (
          <>
            {/* Dimming Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 z-[65] transition-opacity duration-300"
              onClick={() => setShowPath(false)}
              onTouchStart={() => setShowPath(false)}
            />
            
            {/* Animated Robot - Creative animated design */}
            {showPath && pathCoords.start.x > 0 && (
              <div 
                className="fixed inset-0 z-[67] pointer-events-none"
                style={{ overflow: 'visible' }}
                onClick={() => setShowPath(false)}
                onTouchStart={() => setShowPath(false)}
              >
                <div 
                  ref={robotRef}
                  className="robot-container relative"
                  style={{
                    position: 'absolute',
                    left: `${robotPosition.x || window.innerWidth / 2}px`,
                    top: `${robotPosition.y || window.innerHeight}px`, // Start at bottom screen border
                    width: '200px',
                    height: '200px',
                    transform: 'translate(-50%, -100px)', // Start with only head/shoulders visible (peeping straight up)
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: 70,
                    willChange: 'transform',
                    transition: 'none', // Disable CSS transitions for smooth animation
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    background: 'transparent',
                    padding: 0,
                    margin: 0
                  }}
                >
                  {/* Cute Floating Robot Mascot - Smooth & Polished */}
                  <svg width="200" height="200" viewBox="0 0 100 100" className="robot-svg" style={{ overflow: 'visible', background: 'transparent' }}>
                    <defs>
                      <filter id="cyan-glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="soft-shadow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feOffset in="coloredBlur" dx="0" dy="3"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.25"/>
                        </feComponentTransfer>
                      </filter>
                      <linearGradient id="whiteMatte" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#fafafa', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
                      </linearGradient>
                      <linearGradient id="lightGrey" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 0.4 }} />
                        <stop offset="50%" style={{ stopColor: '#e8e8e8', stopOpacity: 0.5 }} />
                        <stop offset="100%" style={{ stopColor: '#d8d8d8', stopOpacity: 0.3 }} />
                      </linearGradient>
                      <radialGradient id="cyanGlow" cx="50%" cy="50%">
                        <stop offset="0%" style={{ stopColor: '#00e5ff', stopOpacity: 1 }} />
                        <stop offset="40%" style={{ stopColor: '#00d4ff', stopOpacity: 0.95 }} />
                        <stop offset="70%" style={{ stopColor: '#00b8d4', stopOpacity: 0.85 }} />
                        <stop offset="100%" style={{ stopColor: '#0097a7', stopOpacity: 0.6 }} />
                      </radialGradient>
                      <radialGradient id="eyeHighlight" cx="30%" cy="30%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                      </radialGradient>
                      <clipPath id="faceClip">
                        <ellipse cx="50" cy="32" rx="18" ry="20"/>
                      </clipPath>
                    </defs>
                    
                    {/* Soft floating shadow with smooth animation */}
                    <ellipse cx="50" cy="95" rx="28" ry="6" fill="#000000" opacity="0.12">
                      <animate attributeName="rx" values="28;30;28" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      <animate attributeName="opacity" values="0.12;0.15;0.12" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                    </ellipse>
                    
                    {/* Body - smooth pill-shaped torso, floating */}
                    <g id="body-group">
                      <ellipse cx="50" cy="65" rx="28" ry="32" fill="url(#whiteMatte)" stroke="none"/>
                      <ellipse cx="50" cy="65" rx="26" ry="30" fill="url(#lightGrey)"/>
                      
                      {/* Chest panel with Enqir Assistant - smoother */}
                      <rect x="35" y="58" width="30" height="10" rx="2.5" fill="#1a1a1a" opacity="0.92">
                        <animate attributeName="opacity" values="0.92;0.95;0.92" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </rect>
                      <text x="50" y="64" fontSize="4" fill="#00d4ff" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.95">
                        <animate attributeName="opacity" values="0.95;1;0.95" dur="3s" repeatCount="indefinite"/>
                        ENQIR
                      </text>
                      <text x="50" y="67.5" fontSize="3" fill="#ffffff" textAnchor="middle" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.9">ASSISTANT</text>
                      
                      {/* Body floating animation - smoother easing */}
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,-3.5; 0,0"
                        dur="5s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.5;1"
                      />
                    </g>
                    
                    {/* Head - rounded, soft */}
                    <g id="head-group">
                      <ellipse cx="50" cy="30" rx="22" ry="26" fill="url(#whiteMatte)" stroke="none"/>
                      <ellipse cx="50" cy="30" rx="20" ry="24" fill="url(#lightGrey)"/>
                      
                      {/* Antenna on top - smoother */}
                      <line x1="50" y1="8" x2="50" y2="12" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
                        <animate attributeName="y2" values="12;11.5;12" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </line>
                      <circle cx="50" cy="8" r="2.5" fill="#ffffff">
                        <animate attributeName="r" values="2.5;2.8;2.5" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </circle>
                      
                      {/* Head floating animation - smoother with different phase */}
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,-3; 0,0"
                        dur="5s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                        keyTimes="0;0.5;1"
                        begin="0.8s"
                      />
                    </g>
                    
                    {/* Face screen - oval black glass with subtle shine */}
                    <g id="face-screen">
                      <ellipse cx="50" cy="32" rx="18" ry="20" fill="#1a1a1a" opacity="0.96">
                        <animate attributeName="opacity" values="0.96;0.98;0.96" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                      </ellipse>
                      {/* Subtle screen reflection */}
                      <ellipse cx="50" cy="28" rx="12" ry="8" fill="url(#eyeHighlight)" opacity="0.15"/>
                      
                      {/* Eyes - cyan/teal glowing ovals with smooth animations */}
                      <g id="eyes-group">
                        <ellipse cx="42" cy="28" rx="5.5" ry="6.5" fill="url(#cyanGlow)" style={{ filter: 'url(#cyan-glow)' }}>
                          <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                          <animate attributeName="ry" values="6.5;7;6.5" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                        </ellipse>
                        <ellipse cx="58" cy="28" rx="5.5" ry="6.5" fill="url(#cyanGlow)" style={{ filter: 'url(#cyan-glow)' }}>
                          <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s"/>
                          <animate attributeName="ry" values="6.5;7;6.5" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="0.5s"/>
                        </ellipse>
                        
                        {/* Eye highlights for depth */}
                        <ellipse cx="43" cy="27" rx="2" ry="2.5" fill="url(#eyeHighlight)"/>
                        <ellipse cx="57" cy="27" rx="2" ry="2.5" fill="url(#eyeHighlight)"/>
                        
                        {/* Smooth blink animation - more frequent and visible */}
                        <rect x="36" y="24" width="12" height="8" fill="#1a1a1a" rx="4" opacity="0">
                          <animate attributeName="opacity" values="0;0;0;0;1;1;0;0;0;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.2;0.25;0.27;0.3;0.33;0.35;0.4;0.6;1" begin="1s"/>
                        </rect>
                        <rect x="52" y="24" width="12" height="8" fill="#1a1a1a" rx="4" opacity="0">
                          <animate attributeName="opacity" values="0;0;0;0;1;1;0;0;0;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.2;0.25;0.27;0.3;0.33;0.35;0.4;0.6;1" begin="1.05s"/>
                        </rect>
                        
                        {/* Wink animation - right eye closes while left stays open */}
                        <rect x="52" y="24" width="12" height="8" fill="#1a1a1a" rx="4" opacity="0">
                          <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;1;0;0;0" dur="8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.95;0.97;0.99;1" begin="2s"/>
                        </rect>
                      </g>
                      
                    </g>
                    
                    {/* Arms - short rounded, attached to sides with smooth movement */}
                    <g id="arms-group">
                      {/* Left arm */}
                      <g id="left-arm" transform-origin="25 60">
                        <ellipse cx="25" cy="60" rx="8" ry="14" fill="url(#whiteMatte)" stroke="none" transform="rotate(-15 25 60)"/>
                        <ellipse cx="25" cy="60" rx="6" ry="12" fill="url(#lightGrey)" transform="rotate(-15 25 60)"/>
                        {/* Hand */}
                        <circle cx="20" cy="70" r="5" fill="url(#whiteMatte)">
                          <animate attributeName="r" values="5;5.3;5" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
                        </circle>
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="-15 25 60; -28 25 60; -15 25 60"
                          dur="4s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                          keyTimes="0;0.5;1"
                        />
                      </g>
                      
                      {/* Right arm */}
                      <g id="right-arm" transform-origin="75 60">
                        <ellipse cx="75" cy="60" rx="8" ry="14" fill="url(#whiteMatte)" stroke="none" transform="rotate(15 75 60)"/>
                        <ellipse cx="75" cy="60" rx="6" ry="12" fill="url(#lightGrey)" transform="rotate(15 75 60)"/>
                        {/* Hand */}
                        <circle cx="80" cy="70" r="5" fill="url(#whiteMatte)">
                          <animate attributeName="r" values="5;5.3;5" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" begin="1.5s"/>
                        </circle>
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="15 75 60; 28 75 60; 15 75 60"
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
              </div>
            )}
            
            {/* Arrow Path SVG - Creative Curved Black Line */}
            <div 
              className="fixed inset-0 z-[66] pointer-events-none"
              onClick={() => setShowPath(false)}
              onTouchStart={() => setShowPath(false)}
            >
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <marker
                    id="arrowhead-black"
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 12 6, 0 12"
                      fill="#000000"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  </marker>
                  <filter id="path-glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="start-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Path definition for robot animation - hidden path with multiple hyperbolic curves */}
                <path
                  id="robot-path"
                  d={pathCoords.control5 && pathCoords.control5.x !== undefined
                    ? `M ${pathCoords.start.x} ${pathCoords.start.y} 
                        C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}
                        C ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.control3.x} ${pathCoords.control3.y}
                        C ${pathCoords.control4.x} ${pathCoords.control4.y}, 
                          ${pathCoords.control4.x} ${pathCoords.control4.y}, 
                          ${pathCoords.control4.x} ${pathCoords.control4.y}
                        C ${pathCoords.control5.x} ${pathCoords.control5.y}, 
                          ${pathCoords.control5.x} ${pathCoords.control5.y}, 
                          ${pathCoords.end.x} ${pathCoords.end.y}`
                    : pathCoords.control4 && pathCoords.control4.x !== undefined
                    ? `M ${pathCoords.start.x} ${pathCoords.start.y} 
                        C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}
                        C ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.control3.x} ${pathCoords.control3.y}
                        C ${pathCoords.control4.x} ${pathCoords.control4.y}, 
                          ${pathCoords.control4.x} ${pathCoords.control4.y}, 
                          ${pathCoords.end.x} ${pathCoords.end.y}`
                    : pathCoords.control3 && pathCoords.control3.x !== undefined
                    ? `M ${pathCoords.start.x} ${pathCoords.start.y} 
                        C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}
                        C ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                          ${pathCoords.end.x} ${pathCoords.end.y}`
                    : `M ${pathCoords.start.x} ${pathCoords.start.y} 
                        C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                          ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                          ${pathCoords.end.x} ${pathCoords.end.y}`
                  }
                  fill="none"
                  stroke="transparent"
                  strokeWidth="1"
                />
                
                {/* Creative twisted path through center - longer and more entertaining */}
                {/* White outline for better visibility */}
                <path
                  d={`M ${pathCoords.start.x} ${pathCoords.start.y} 
                      C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                        ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                        ${pathCoords.control2.x} ${pathCoords.control2.y}
                      C ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                        ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                        ${pathCoords.end.x} ${pathCoords.end.y}`}
                  stroke="#ffffff"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray="6,4"
                  style={{
                    animation: 'dash 1.5s linear infinite',
                    filter: 'url(#path-glow)'
                  }}
                />
                {/* Black main line */}
                <path
                  d={`M ${pathCoords.start.x} ${pathCoords.start.y} 
                      C ${pathCoords.control1.x} ${pathCoords.control1.y}, 
                        ${pathCoords.control2.x} ${pathCoords.control2.y}, 
                        ${pathCoords.control2.x} ${pathCoords.control2.y}
                      C ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                        ${pathCoords.control3.x} ${pathCoords.control3.y}, 
                        ${pathCoords.end.x} ${pathCoords.end.y}`}
                  stroke="#000000"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead-black)"
                  strokeDasharray="6,4"
                  style={{
                    animation: 'dash 1.5s linear infinite'
                  }}
                />
              </svg>
            </div>

            {/* Global Styles for Spotlight Effect */}
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -10;
                }
              }
              @keyframes bubblePulse {
                0%, 100% {
                  transform: translate(-50%, 0) scale(1);
                  opacity: 1;
                }
                50% {
                  transform: translate(-50%, -5px) scale(1.05);
                  opacity: 0.9;
                }
              }
              @keyframes pulse-start {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 0.8;
                }
              }
              @keyframes pulse-ring-start {
                0%, 100% {
                  transform: scale(1);
                  opacity: 0.6;
                }
                50% {
                  transform: scale(1.5);
                  opacity: 0.3;
                }
              }
              @keyframes pulse-ring {
                0%, 100% {
                  box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7), 0 0 0 0 rgba(96, 165, 250, 0.7) !important;
                }
                50% {
                  box-shadow: 0 0 0 10px rgba(96, 165, 250, 0), 0 0 0 20px rgba(96, 165, 250, 0) !important;
                }
              }
              /* Highlight notice with same effect as chatbot */
              .notice-highlight {
                animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
                transform: scale(1.15) !important;
                filter: brightness(1.2) drop-shadow(0 0 10px rgba(96, 165, 250, 0.8)) !important;
              }
              /* Highlight chatbot button globally */
              body.help-guide-path-active [class*="fixed"][class*="bottom-20"],
              body.help-guide-path-active [class*="fixed"][class*="bottom-6"] {
                animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
                transform: scale(1.15) !important;
                z-index: 70 !important;
                filter: brightness(1.2) drop-shadow(0 0 10px rgba(96, 165, 250, 0.8)) !important;
              }
              /* Dim all content in HelpGuide except highlighted elements */
              body.help-guide-path-active .help-guide-path-active > * {
                opacity: 0.4;
                transition: opacity 0.3s ease;
              }
              /* Keep notice container and notice bright */
              body.help-guide-path-active .help-guide-path-active .notice-container,
              body.help-guide-path-active .help-guide-path-active .notice-highlight,
              body.help-guide-path-active .help-guide-path-active [class*="z-[70]"],
              body.help-guide-path-active .help-guide-path-active [class*="z-[65]"],
              body.help-guide-path-active .help-guide-path-active [class*="z-[66]"] {
                opacity: 1 !important;
              }
            `}</style>
          </>
        )}
      </div>
    </Layout>
  );
};

export default HelpGuide;

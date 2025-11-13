import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Menu, X, Home, Search, Plus, User, Settings, LogOut, BarChart3, FileText, MessageSquare, ChevronDown, Crown, Moon, Sun } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "./Footer";
import AIChatbot from "./AIChatbot";
import SmartNotifications from "./SmartNotifications";
import { NotificationManager } from "./NotificationManager";
import SignOutDialog from "./SignOutDialog";
import { lazy, Suspense } from "react";
// PRO PLAN - KEPT FOR FUTURE UPDATES
// import { getProEnquiriesRemaining } from "@/services/paymentService";
// import { doc, onSnapshot, getDoc } from "firebase/firestore";
// import { db } from "@/firebase";
import { fadeInUp, staggerContainer } from "@/lib/motion";

// Lazy load Mobile AI Controller to improve performance
const MobileAIController = lazy(() => import("./MobileAIController"));

export default function Layout({ children, showNavigation = true }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // PRO PLAN - KEPT FOR FUTURE UPDATES
  // const [proRemainingCount, setProRemainingCount] = useState<number>(0);
  // const currentUserIdRef = useRef<string | null>(null);

  // PRO PLAN LISTENER - KEPT FOR FUTURE UPDATES
  // Fetch Pro remaining count using real-time Firestore listener
  /* useEffect(() => {
    // Reset count immediately when user changes
    console.log('🔄 Layout: User changed, resetting Pro count. Old user:', currentUserIdRef.current, 'New user:', user?.uid);
    setProRemainingCount(0);
    
    // Update ref with current user ID
    currentUserIdRef.current = user?.uid || null;
    const currentUserId = currentUserIdRef.current;
    
    if (!currentUserId) {
      console.log('🔄 Layout: No user, resetting Pro count to 0');
      return;
    }

    console.log('🔄 Layout: Setting up Pro count listener for user:', currentUserId);
    
    // Reference to user payment document
    const userPaymentRef = doc(db, 'userPayments', currentUserId);
    
    // Helper function to calculate count from Firestore data
    const calculateProCount = (data: any): number => {
      if (!data) {
        console.log('🔍 calculateProCount: No data provided');
        return 0;
      }
      console.log('🔍 calculateProCount: Checking data:', {
        currentPlan: data.currentPlan,
        proEnquiriesRemaining: data.proEnquiriesRemaining,
        type: typeof data.proEnquiriesRemaining
      });
      
      if (data.currentPlan === 'pro' && data.proEnquiriesRemaining !== undefined && data.proEnquiriesRemaining !== null) {
        const count = Number(data.proEnquiriesRemaining);
        const result = count > 0 ? count : 0;
        console.log('🔍 calculateProCount: Result:', result);
        return result;
      }
      console.log('🔍 calculateProCount: Returning 0 (not Pro plan or no remaining)');
      return 0;
    };
    
    // Immediately read directly from Firestore first (fastest and most reliable)
    getDoc(userPaymentRef).then(snapshot => {
      console.log('📖 Layout: Direct Firestore read completed for user:', currentUserId);
      
      // Only proceed if we're still on the same user
      if (currentUserIdRef.current !== currentUserId) {
        console.log('⚠️ Layout: User changed during direct read, ignoring');
        return;
      }
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        const count = calculateProCount(data);
        console.log('⚡ Layout: Direct read result:', {
          userId: currentUserId,
          currentPlan: data.currentPlan,
          proEnquiriesRemaining: data.proEnquiriesRemaining,
          calculatedCount: count,
          rawData: data
        });
        console.log('💾 Layout: Setting initial proRemainingCount to:', count);
        setProRemainingCount(count);
      } else {
        console.log('📊 Layout: No payment plan document found in direct read for user:', currentUserId);
        // Try service function as fallback
        getProEnquiriesRemaining(currentUserId).then(count => {
          if (currentUserIdRef.current === currentUserId) {
            console.log('🔄 Layout: Service function fallback - count:', count);
            setProRemainingCount(count);
          }
        });
      }
    }).catch(error => {
      console.error('❌ Layout: Error in direct Firestore read:', error);
      // Fallback to service function
      getProEnquiriesRemaining(currentUserId).then(count => {
        if (currentUserIdRef.current === currentUserId) {
          console.log('🔄 Layout: Service function fallback after error - count:', count);
          setProRemainingCount(count);
        }
      });
    });
    
    // Use real-time listener to automatically update when payment plan changes
    let isInitialSnapshot = true;
    const unsubscribe = onSnapshot(
      userPaymentRef,
      (snapshot) => {
        // Double-check we're still on the same user using ref
        if (currentUserIdRef.current !== currentUserId) {
          console.log('⚠️ Layout: User changed, ignoring snapshot update. Current:', currentUserIdRef.current, 'Listener:', currentUserId);
          return;
        }
        
        const snapshotType = isInitialSnapshot ? 'INITIAL' : 'UPDATE';
        console.log(`📊 Layout: Payment plan snapshot received (${snapshotType}):`, {
          userId: currentUserId,
          exists: snapshot.exists(),
          metadata: snapshot.metadata
        });
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const count = calculateProCount(data);
          
          console.log('📊 Layout: Payment plan data:', {
            userId: currentUserId,
            snapshotType,
            currentPlan: data.currentPlan,
            proEnquiriesRemaining: data.proEnquiriesRemaining,
            proEnquiriesRemainingType: typeof data.proEnquiriesRemaining,
            calculatedCount: count,
            hasProPlan: data.currentPlan === 'pro',
            hasRemaining: data.proEnquiriesRemaining > 0,
            allDataKeys: Object.keys(data),
            allData: data
          });
          
          console.log('✅ Layout: Pro count calculated from snapshot:', count, 'for user:', currentUserId);
          
          // Only update if we're still on the same user
          if (currentUserIdRef.current === currentUserId) {
            console.log('💾 Layout: Updating proRemainingCount state to:', count, `(${snapshotType} snapshot)`);
            setProRemainingCount(count);
          } else {
            console.log('⚠️ Layout: User changed during snapshot processing, not updating');
          }
        } else {
          console.log(`📊 Layout: No payment plan document found in ${snapshotType} snapshot for user:`, currentUserId);
          if (currentUserIdRef.current === currentUserId) {
            console.log('💾 Layout: Setting count to 0 (no document)');
            setProRemainingCount(0);
          }
        }
        
        // Mark that we've processed the initial snapshot
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          console.log('✅ Layout: Initial snapshot processed, future updates will be marked as UPDATE');
        }
      },
      (error) => {
        console.error('❌ Layout: Error listening to payment plan for user:', currentUserId, error);
        // Fallback: fetch count directly using service function
        getProEnquiriesRemaining(currentUserId).then(count => {
          console.log('🔄 Layout: Fallback Pro count fetched after listener error:', count, 'for user:', currentUserId);
          // Only update if we're still on the same user
          if (currentUserIdRef.current === currentUserId) {
            setProRemainingCount(count);
          }
        }).catch(fallbackError => {
          console.error('❌ Layout: Fallback also failed:', fallbackError);
          // Last resort: try direct Firestore read
          getDoc(userPaymentRef).then(snapshot => {
            if (snapshot.exists() && currentUserIdRef.current === currentUserId) {
              const data = snapshot.data();
              const count = calculateProCount(data);
              console.log('🆘 Layout: Last resort direct read - count:', count);
              setProRemainingCount(count);
            }
          });
        });
      }
    );
    
    return () => {
      console.log('🔄 Layout: Cleaning up Pro count listener for user:', currentUserId);
      unsubscribe();
    };
  }, [user?.uid]); */

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleSignOutClick = () => {
    setShowSignOutDialog(true);
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/enquiries", label: "Browse", icon: Search },
    { path: "/post-enquiry", label: "Post Enquiry", icon: Plus },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 bg-white [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] font-medium px-1.5 py-0.5 ${
                    user.emailVerified 
                      ? "border-green-300 bg-green-50 text-green-700" 
                      : "border-gray-300"
                  }`}>
                    {user.emailVerified ? "✓ Verified" : "⏳ Pending"}
                  </Badge>
                  {/* PRO BADGE - KEPT FOR FUTURE UPDATES */}
                  {/* {proRemainingCount > 0 && (
                    <Badge className="bg-gray-800 text-white text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5">
                      <Crown className="h-3 w-3" />
                      <span>Pro</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{proRemainingCount}</span>
                    </Badge>
                  )} */}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-3 text-sm">Not signed in</p>
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium text-sm h-9 rounded-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Navigation</p>
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                      isActive(item.path)
                          ? "bg-gray-800 text-white shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        isActive(item.path) ? "bg-white/10" : "bg-gray-100 group-hover:bg-gray-200"
                      } transition-colors`}>
                        <Icon className={`h-4 w-4 ${isActive(item.path) ? "text-white" : "text-gray-600"}`} strokeWidth={2.5} />
                      </div>
                      <span className={`font-medium text-sm flex-1 ${isActive(item.path) ? "text-white" : "text-gray-800"}`}>
                        {item.label}
                      </span>
                      {isActive(item.path) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                  </Link>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          {user && (
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-white space-y-2">
              {/* Mobile Notifications */}
              <div className="flex items-center justify-center pb-1">
                <SmartNotifications />
              </div>
              
              {/* Dark Mode Toggle for Mobile */}
              {mounted && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 rounded-lg border-gray-300 hover:bg-gray-50 font-medium text-sm text-gray-700"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2.5 text-gray-600" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2.5 text-gray-600" />
                      Dark Mode
                    </>
                  )}
                </Button>
              )}
              
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start h-10 rounded-lg border-gray-300 hover:bg-gray-50 font-medium text-sm text-gray-700">
                  <Settings className="h-4 w-4 mr-2.5 text-gray-600" />
                  Settings
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOutClick} 
                className="w-full justify-start h-10 rounded-lg border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-medium text-sm"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 safe-area-left safe-area-right">
          <div className="flex h-14 sm:h-20 items-center justify-between min-w-0">
            {/* Logo with Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-0 active:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="hidden sm:flex w-7 h-7 sm:w-10 sm:h-10 bg-gray-800 rounded-lg sm:rounded-xl items-center justify-center shadow-lg">
                  </div>
                        <span className="text-lg sm:text-2xl font-bold text-foreground hidden sm:block">Enqir<span className="text-sm">.in</span></span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/enquiries" className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Enquiries
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/post-enquiry" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Enquiry
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 focus:text-red-700">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                )}
                {!user && (
                  <DropdownMenuItem asChild>
                    <Link to="/signin" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Navigation */}
            {showNavigation && !isMobile && (
              <nav className="hidden md:flex items-center gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 min-h-[44px] ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-pal-blue to-blue-600 text-white shadow-md"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            )}

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
              {user ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Home Icon - Only show when not on home page */}
                  {location.pathname !== "/" && (
                    <Link to="/">
                      <Button variant="ghost" size="sm" className="flex h-7 sm:h-9 px-2 sm:px-3">
                        <Home className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Home</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* PRO BADGE - KEPT FOR FUTURE UPDATES */}
                  {/* Pro Badge */}
                  {/* {proRemainingCount > 0 && (
                    <Badge className="bg-gray-800 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 shadow-md">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Pro</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{proRemainingCount}</span>
                    </Badge>
                  )} */}
                  
                  {/* Smart Notifications */}
                  <SmartNotifications />
                  
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="flex h-7 sm:h-9 px-2 sm:px-3">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Dashboard</span>
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex h-7 sm:h-9 px-2 sm:px-3">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Profile</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOutClick} className="flex h-7 sm:h-9 px-2 sm:px-3">
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                  {/* Home Icon - Only show when not on home page */}
                  {location.pathname !== "/" && (
                    <Link to="/">
                      <Button variant="ghost" size="sm" className="flex h-7 sm:h-9 px-2 sm:px-3">
                        <Home className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Home</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/signin">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signin">
                    <Button size="sm" className="hidden sm:flex">
                      Get Started
                    </Button>
                  </Link>
                  {/* Mobile Get Started Button */}
                  <Link to="/signin" className="sm:hidden">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 h-7">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              {showNavigation && (
                <div className="lg:hidden">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 hover:bg-gray-800/10 rounded-lg transition-all duration-200 active:scale-95"
                        onClick={() => setMobileMenuOpen(true)}
                      >
                        <Menu className="h-5 w-5 text-gray-800 font-bold" strokeWidth={2.5} />
                      </Button>
                    </SheetTrigger>
                    <MobileNavigation />
                  </Sheet>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${isMobile && showNavigation ? 'pb-24 safe-area-bottom' : ''} min-h-screen`}>
        <Suspense fallback={<div className="min-h-screen">{children}</div>}>
          <MobileAIController>
            {children}
          </MobileAIController>
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around py-2 px-1 safe-area-left safe-area-right">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                    isActive(item.path)
                      ? "text-pal-blue bg-pal-blue/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium truncate leading-tight">{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/profile"
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive("/profile")
                  ? "text-pal-blue bg-pal-blue/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate leading-tight">Profile</span>
            </Link>
          </div>
        </div>
      )}


      {/* Footer */}
      <Footer />
      
      {/* Mobile Notification Popups */}
      <NotificationManager />
      
      {/* AI Chatbot - Available on all pages with SAFETY FALLBACK */}
      {(() => {
        try {
          return <AIChatbot />;
        } catch (error) {
          console.error('AI Chatbot failed to load:', error);
          // GRACEFUL DEGRADATION: Don't render chatbot, app continues normally
          return null;
        }
      })()}

      {/* Sign Out Confirmation Dialog */}
      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Menu, X, Home, Search, Plus, User, Settings, LogOut, BarChart3, FileText, MessageSquare, ChevronDown, Crown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "./Footer";
import AIChatbot from "./AIChatbot";
import SmartNotifications from "./SmartNotifications";
import SignOutDialog from "./SignOutDialog";
import { lazy, Suspense } from "react";
import { getProEnquiriesRemaining } from "@/services/paymentService";
import { fadeInUp, staggerContainer } from "@/lib/motion";

// Lazy load Mobile AI Controller to improve performance
const MobileAIController = lazy(() => import("./MobileAIController"));

export default function Layout({ children, showNavigation = true }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [proRemainingCount, setProRemainingCount] = useState<number>(0);

  // Fetch Pro remaining count
  useEffect(() => {
    const fetchProCount = async () => {
      if (user?.uid) {
        const count = await getProEnquiriesRemaining(user.uid);
        setProRemainingCount(count);
      }
    };
    
    fetchProCount();
  }, [user?.uid]);

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
      <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-pal-blue rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm sm:text-base">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {user.emailVerified ? "✓ Verified" : "⏳ Pending"}
                  </Badge>
                  {proRemainingCount > 0 && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-shadow duration-300 glow-effect">
                      <Crown className="h-3 w-3" />
                      <span className="hidden sm:inline">Pro</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">{proRemainingCount}</span>
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3 text-sm sm:text-base">Not signed in</p>
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 sm:p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-pal-blue text-white"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          {user && (
            <div className="p-4 sm:p-6 border-t space-y-3">
              {/* Mobile Notifications */}
              <div className="flex items-center justify-center">
                <SmartNotifications />
              </div>
              
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOutClick} className="w-full justify-start text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4 mr-2" />
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
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-20 items-center justify-between min-w-0">
            {/* Logo with Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 hover:opacity-80 transition-opacity">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-pal-blue to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base sm:text-xl">E</span>
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
                  {/* Pro Badge */}
                  {proRemainingCount > 0 && (
                    <Badge className="bg-gray-800 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 shadow-md">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Pro</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{proRemainingCount}</span>
                    </Badge>
                  )}
                  
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
                <div className="flex items-center space-x-2 sm:space-x-3">
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
                        className="h-8 w-8 p-0 hover:bg-muted/50"
                        onClick={() => setMobileMenuOpen(true)}
                      >
                        <Menu className="h-4 w-4" />
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
      <main className={`flex-1 ${isMobile && showNavigation ? 'pb-24' : ''}`}>
        <Suspense fallback={<div className="min-h-screen">{children}</div>}>
          <MobileAIController>
            {children}
          </MobileAIController>
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50">
          <div className="flex items-center justify-around py-2 px-1">
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
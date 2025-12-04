import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { Menu, X, Home, Search, Plus, User, Settings, LogOut, BarChart3, FileText, MessageSquare, MessageCircle, ChevronDown, Crown, Moon, Sun } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "./Footer";
import AIChatbot from "./AIChatbot";
import SmartNotifications from "./SmartNotifications";
import { NotificationManager } from "./NotificationManager";
import SignOutDialog from "./SignOutDialog";
import { lazy, Suspense } from "react";
// PRO PLAN - KEPT FOR FUTURE UPDATES
// import { getProEnquiriesRemaining } from "@/services/paymentService";
import { collection, query, getDocs, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { usePerformanceOptimizations } from "@/hooks/use-performance";

// Lazy load Mobile AI Controller to improve performance
const MobileAIController = lazy(() => import("./MobileAIController"));

export default function Layout({ children, showNavigation = true }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  // Apply performance optimizations
  usePerformanceOptimizations();
  // Get preloaded chats from context (will be empty array if not available)
  let preloadedChatsContext: { allChats: any[] } | null = null;
  try {
    preloadedChatsContext = useChats();
  } catch {
    // ChatProvider not available yet, will use fallback method
    preloadedChatsContext = null;
  }
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const lastUpdateTimeRef = useRef(0);
  
  // IMPORTANT: Menu state handler with throttling to prevent loop issues
  // The Sheet component can trigger onOpenChange multiple times rapidly,
  // causing a loop where the menu opens and closes repeatedly.
  // Solution: Throttle updates to max once per 300ms and check if state
  // is already the desired value before updating.
  // DO NOT REMOVE THIS THROTTLING - it prevents menu bar loop bugs.
  const handleMenuOpenChange = useCallback((open: boolean) => {
    const now = Date.now();
    // Prevent updates if less than 300ms since last update
    if (now - lastUpdateTimeRef.current < 300) {
      return;
    }
    
    // Use functional update to check current state
    setMobileMenuOpen((current) => {
      // If state is already what we want, don't update
      if (current === open) {
        return current;
      }
      
      lastUpdateTimeRef.current = now;
      return open;
    });
  }, []);
  
  const handleMenuButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    // Only open if enough time has passed and menu is closed
    if (now - lastUpdateTimeRef.current >= 300 && !mobileMenuOpen) {
      lastUpdateTimeRef.current = now;
      setMobileMenuOpen(true);
    }
  }, [mobileMenuOpen]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Count unread chat messages - Optimized version
  useEffect(() => {
    if (!user?.uid) {
      setUnreadChatCount(0);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const countUnreadChats = async () => {
      try {
        // OPTIMIZATION: Use preloaded chat data if available (much faster!)
        // Get fresh preloaded chats from context (may have updated since component render)
        const currentPreloadedChats = preloadedChatsContext?.allChats || [];
        
        if (currentPreloadedChats && currentPreloadedChats.length > 0) {
          // Filter to only active, non-disabled chats
          const activeThreads = currentPreloadedChats.filter(chat => 
            chat.enquiryId && 
            chat.sellerId && 
            !chat.isDisabled
          );
          
          // Create set of thread keys for quick lookup
          const threadKeys = new Set(
            activeThreads.map(chat => `${chat.enquiryId}_${chat.sellerId}`)
          );
          
          // Only fetch messages for these specific threads (much smaller query)
          const chatMessagesQuery = query(collection(db, "chatMessages"));
          const snapshot = await getDocs(chatMessagesQuery);
          
          const threadsWithUnread = new Set<string>();
          
          // Process only messages from user's threads
          snapshot.docs.forEach((docSnap) => {
            const messageData = docSnap.data();
            const enquiryId = messageData.enquiryId;
            const sellerId = messageData.sellerId;
            const senderId = messageData.senderId;
            
            if (!enquiryId || !sellerId || !senderId) return;
            if (messageData.isSystemMessage) return;
            if (senderId === user.uid) return; // Skip own messages
            
            const threadKey = `${enquiryId}_${sellerId}`;
            
            // Only check threads we know the user is involved in
            if (!threadKeys.has(threadKey)) return;
            
            // Check if already marked as unread
            if (threadsWithUnread.has(threadKey)) return;
            
            const readKey = `chat_read_${user.uid}_${threadKey}`;
            const lastViewedTime = localStorage.getItem(readKey);
            
            const messageTime = messageData.timestamp?.toDate 
              ? messageData.timestamp.toDate().getTime() 
              : (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
            
            if (lastViewedTime) {
              const viewedTime = parseInt(lastViewedTime, 10);
              if (messageTime > viewedTime) {
                threadsWithUnread.add(threadKey);
              }
            } else {
              // Never viewed - mark as unread
              threadsWithUnread.add(threadKey);
            }
          });
          
          if (isMounted) {
            setUnreadChatCount(threadsWithUnread.size);
          }
          return; // Exit early - we used preloaded data!
        }
        
        // FALLBACK: Original method if preloaded data not available yet
        // Get all chat messages (filtered client-side for performance)
        const chatMessagesQuery = query(collection(db, "chatMessages"));
        const snapshot = await getDocs(chatMessagesQuery);
        
        // First pass: Filter messages and collect unique enquiry IDs
        const messageThreads = new Map<string, { enquiryId: string; sellerId: string; timestamp: number }>();
        const enquiryIds = new Set<string>();
        
        snapshot.docs.forEach((docSnap) => {
          const messageData = docSnap.data();
          const enquiryId = messageData.enquiryId;
          const sellerId = messageData.sellerId;
          const senderId = messageData.senderId;
          
          if (!enquiryId || !sellerId || !senderId) return;
          if (messageData.isSystemMessage) return;
          if (senderId === user.uid) return; // Skip own messages
          
          const threadKey = `${enquiryId}_${sellerId}`;
          const messageTime = messageData.timestamp?.toDate 
            ? messageData.timestamp.toDate().getTime() 
            : (messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0);
          
          // Check if user has viewed this chat
          const readKey = `chat_read_${user.uid}_${threadKey}`;
          const lastViewedTime = localStorage.getItem(readKey);
          
          if (lastViewedTime) {
            const viewedTime = parseInt(lastViewedTime, 10);
            if (messageTime <= viewedTime) return; // Already viewed
          }
          
          // Track the latest message for this thread
          const existing = messageThreads.get(threadKey);
          if (!existing || messageTime > existing.timestamp) {
            messageThreads.set(threadKey, { enquiryId, sellerId, timestamp: messageTime });
            enquiryIds.add(enquiryId);
          }
        });
        
        if (!isMounted) return;
        
        // Batch fetch all enquiries at once
        const enquiryPromises = Array.from(enquiryIds).map(enquiryId => 
          getDoc(doc(db, "enquiries", enquiryId)).catch(() => null)
        );
        const enquiryDocs = await Promise.all(enquiryPromises);
        
        if (!isMounted) return;
        
        // Create enquiry data map
        const enquiryDataMap = new Map<string, any>();
        enquiryDocs.forEach((enquiryDoc, index) => {
          if (enquiryDoc?.exists()) {
            const enquiryId = Array.from(enquiryIds)[index];
            enquiryDataMap.set(enquiryId, enquiryDoc.data());
          }
        });
        
        // Second pass: Filter threads by user involvement and enquiry status
        const activeChatThreads = new Set<string>();
        const now = new Date();
        
        messageThreads.forEach((thread, threadKey) => {
          const enquiryData = enquiryDataMap.get(thread.enquiryId);
          if (!enquiryData) return; // Enquiry deleted
          
          const buyerId = enquiryData.userId;
          const isUserInvolved = (buyerId === user.uid) || (thread.sellerId === user.uid);
          if (!isUserInvolved) return;
          
          // Check if deal is closed
          if (enquiryData.status === 'deal_closed' || enquiryData.dealClosed === true) return;
          
          // Check if enquiry is expired
          if (enquiryData.deadline) {
            const deadline = enquiryData.deadline?.toDate ? enquiryData.deadline.toDate() : new Date(enquiryData.deadline);
            if (deadline < now) return;
          }
          
          // Check if enquiry status would close the chat
          if (enquiryData.status === 'rejected' || enquiryData.status === 'completed') return;
          
          activeChatThreads.add(threadKey);
        });
        
        if (isMounted) {
          setUnreadChatCount(activeChatThreads.size);
        }
      } catch (error) {
        console.error("Error counting unread chats:", error);
        if (isMounted) {
          setUnreadChatCount(0);
        }
      }
    };

    // Debounced count function to avoid too frequent updates
    const debouncedCount = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        countUnreadChats();
      }, 300); // 300ms debounce
    };

    // Initial count
    countUnreadChats();
    
    // Set up real-time listener for chat messages (with debouncing)
    const unsubscribe = onSnapshot(
      query(collection(db, "chatMessages")),
      () => {
        debouncedCount();
      },
      (error) => {
        console.error("Error listening to chat messages:", error);
      }
    );

    // Listen for chat viewed events
    const handleChatViewed = () => {
      debouncedCount();
    };
    
    window.addEventListener('chatViewed', handleChatViewed);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener('chatViewed', handleChatViewed);
    };
  }, [user?.uid, preloadedChatsContext?.allChats]);

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
    handleMenuOpenChange(false);
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
      <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 bg-white [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b-4 border-black bg-black">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter leading-none font-heading drop-shadow-2xl text-white">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMenuOpenChange(false);
                }}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-colors bg-white"
              >
                <X className="h-4 w-4 text-black" />
              </Button>
            </div>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-black rounded-lg shadow-sm border-2 border-black">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
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
                  <Badge variant="outline" className={`text-[10px] font-medium px-1.5 py-0.5 border-2 ${
                    user.emailVerified 
                      ? "border-green-300 bg-green-50 text-green-700" 
                      : "border-gray-300"
                  }`}>
                    {user.emailVerified ? "✓ Verified" : "⏳ Pending"}
                  </Badge>
                  {/* PRO BADGE - KEPT FOR FUTURE UPDATES */}
                  {/* {proRemainingCount > 0 && (
                    <Badge className="bg-black text-white text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5">
                      <Crown className="h-3 w-3" />
                      <span>Pro</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{proRemainingCount}</span>
                    </Badge>
                  )} */}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-black rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-black">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-3 text-sm">Not signed in</p>
                <Link to="/signin" onClick={() => handleMenuOpenChange(false)}>
                  <Button className="w-full bg-black hover:bg-gray-900 text-white font-medium text-sm h-9 rounded-lg border-2 border-black">
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
                    onClick={() => handleMenuOpenChange(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group border-2 ${
                      isActive(item.path)
                          ? "bg-black text-white shadow-sm border-black"
                          : "hover:bg-gray-50 text-gray-700 border-black"
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
            <div className="p-4 sm:p-5 border-t-4 border-black bg-white space-y-2">
              {/* Mobile Notifications */}
              <div className="flex items-center justify-center pb-1 border-2 border-black rounded-lg p-2">
                <SmartNotifications />
              </div>
              
              {/* Dark Mode Toggle for Mobile */}
              {mounted && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 rounded-lg border-2 border-black hover:bg-gray-50 font-medium text-sm text-gray-700"
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
              
              <Link to="/settings" onClick={() => handleMenuOpenChange(false)}>
                <Button variant="outline" className="w-full justify-start h-10 rounded-lg border-2 border-black hover:bg-gray-50 font-medium text-sm text-gray-700">
                  <Settings className="h-4 w-4 mr-2.5 text-gray-600" />
                  Settings
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOutClick} 
                className="w-full justify-start h-10 rounded-lg border-2 border-red-600 hover:bg-red-50 text-red-600 hover:text-red-700 font-medium text-sm"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
  );

  return (
    <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
        <div className="max-w-4xl mx-auto pl-3 pr-3 sm:px-6 lg:px-8 safe-area-left safe-area-right">
          <div className="relative flex h-14 sm:h-20 items-center justify-between gap-4 min-w-0">
            {/* Desktop Navigation */}
            {showNavigation && !isMobile && (
              <nav className="hidden md:flex items-center gap-2 md:gap-3">
                {navigationItems.filter(item => 
                  item.path !== "/" && item.path !== "/dashboard" && item.path !== "/profile"
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 min-h-[44px] whitespace-nowrap border border-black ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-pal-blue to-blue-600 text-white shadow-md border-black"
                            : "text-black hover:text-black hover:bg-gray-100 hover:shadow-sm"
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
            <div className="flex items-center justify-end gap-2 md:gap-3">
              {user ? (
                <>
                  {/* Desktop-only buttons */}
                  <div className="hidden md:flex items-center gap-2 md:gap-3">
                  {/* Home Icon - Only show when not on home page */}
                  {location.pathname !== "/" && (
                    <Link to="/">
                      <Button variant="ghost" size="sm" className="flex items-center justify-center h-7 sm:h-9 px-3 sm:px-4 md:border md:border-black">
                        <Home className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Home</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="flex items-center justify-center h-7 sm:h-9 px-3 sm:px-4 text-black hover:text-black md:border md:border-black">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Dashboard</span>
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center justify-center h-7 sm:h-9 px-3 sm:px-4 text-black hover:text-black md:border md:border-black">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Profile</span>
                    </Button>
                  </Link>
                    {/* Settings button - hidden on mobile, visible on sm+ */}
                    <Link to="/settings" className="hidden sm:inline-flex">
                      <Button variant="ghost" size="sm" className="flex items-center justify-center h-7 sm:h-9 px-3 sm:px-4 text-black hover:text-black md:border md:border-black">
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Settings</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleSignOutClick} className="flex items-center justify-center h-7 sm:h-9 px-3 sm:px-4 text-black hover:text-black md:border md:border-black">
                      <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Log Out</span>
                    </Button>
                  </div>

                  {/* Mobile: Smart Notifications, Chats, and Menu grouped together */}
                  <div className="flex items-center gap-1 md:gap-3 absolute right-0 md:relative md:right-auto pr-3 sm:pr-0">
                    {/* Smart Notifications */}
                    <SmartNotifications />
                    
                    {/* Dashboard button - visible on mobile */}
                    <Link to="/dashboard" className="md:hidden">
                      <Button variant="ghost" size="sm" className="flex items-center justify-center h-7 sm:h-9 px-2 sm:px-4 text-black hover:text-black md:border md:border-black">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    
                  {/* Chats button – shows all user chats (mobile + desktop) */}
                  <Link to="/my-chats">
                    <Button
                      variant="ghost"
                      size="sm"
                        className="flex items-center justify-center h-7 sm:h-9 px-2 sm:px-4 text-black hover:text-black md:border md:border-black relative"
                    >
                      <div className="relative">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2 rounded-full" />
                        {unreadChatCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                          </span>
                        )}
                      </div>
                      <span className="hidden sm:inline text-xs sm:text-sm">Chats</span>
                    </Button>
                  </Link>

                    {/* Mobile Menu Button */}
                    {showNavigation && (
                      <div className="lg:hidden">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-muted/50"
                          onClick={handleMenuButtonClick}
                        >
                          <Menu className="h-4 w-4" />
                        </Button>
                        <Sheet 
                          open={mobileMenuOpen} 
                          onOpenChange={handleMenuOpenChange}
                          modal={true}
                        >
                          <MobileNavigation />
                        </Sheet>
                      </div>
                    )}
                  </div>
                </>
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
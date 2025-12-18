// 🛡️ PROTECTED FILE - Mobile optimizations, centered descriptions, card styling
// Last Updated: Mobile card optimizations and list view description centering
// DO NOT REVERT: All mobile-specific optimizations are intentional
// 
// 🛡️ PROTECTED: Count calculation fix (prevents count from being capped at 99)
// ⚠️ CRITICAL: Count must be calculated from displayEnquiries filtered to live only
// ⚠️ DO NOT MODIFY: The count calculation useEffect (around line 1049-1096)
// ⚠️ DO NOT REVERT: This fix ensures count matches Load More button and what users see
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, Clock, MessageSquare, ArrowRight, Search, Filter, X, CheckCircle, Grid3X3, List, Check, ArrowLeft, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import newLogo from "@/assets/new-logo.png";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import CountdownTimer from "@/components/CountdownTimer";
import { AISearchService } from "@/services/ai/aiSearchService";
import { formatIndianCurrency } from "@/lib/utils";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { debounce } from "@/utils/performance";

interface Enquiry {
  id: string;
  title: string;
  description: string;
  category: string;
  categories?: string[];
  budget: string;
  location: string;
  userId: string;
  status: string;
  createdAt: any;
  responses: number;
  likes: number;
  userLikes: string[];
  isUrgent: boolean;
  deadline?: any;
  userProfileVerified?: boolean;
  isProfileVerified?: boolean;
  userVerified?: boolean;
  idFrontImage?: string;
  idBackImage?: string;
  dealClosed?: boolean;
  dealClosedAt?: any;
  dealClosedBy?: string;
}

export default function EnquiryWall() {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  // 🛡️ PROTECTED: Live enquiries count - REQUIRED for matching Landing.tsx count
  // DO NOT MODIFY - This count must match Landing.tsx exactly
  const [liveEnquiriesCount, setLiveEnquiriesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showTrustBadgeOnly, setShowTrustBadgeOnly] = useState(false);
  // 🚀 PAGINATION: State for paginated display (10 per page)
  const [displayedEnquiries, setDisplayedEnquiries] = useState<Enquiry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const enquiriesPerPage = 10;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsDropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isClickingSuggestionRef = useRef<boolean>(false);
  const preventSuggestionsRef = useRef<boolean>(false);
  
  // Scroll sound effect refs
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastSoundTimeRef = useRef<number>(0);
  
  // AI Search states
  const [aiSearchResults, setAiSearchResults] = useState<{
    results: Enquiry[];
    searchedCategory: string | null;
    noResultsInCategory: boolean;
    showAllFallback: boolean;
    aiAnalysis: any;
  } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAISearching, setIsAISearching] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const categoryBoxRef = useRef<HTMLDivElement>(null);

  // Real-time expiry check - update every second to automatically disable expired cards
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Handle URL parameters on component mount
  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Show scroll indicator after page loads and category box is rendered
  useEffect(() => {
    if (loading) return;

    // Show indicator after category box is rendered (check multiple times to ensure it's visible)
    const checkAndShow = () => {
      if (categoryBoxRef.current && !hasScrolled) {
        const rect = categoryBoxRef.current.getBoundingClientRect();
        // Check if category box is visible in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setShowScrollIndicator(true);
        }
      }
    };

    // Check immediately and after delays
    checkAndShow();
    const timer1 = setTimeout(checkAndShow, 500);
    const timer2 = setTimeout(checkAndShow, 1000);
    const timer3 = setTimeout(checkAndShow, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [loading, hasScrolled]);

  // Hide scroll indicator when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollIndicator(false);
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Auto-hide after 5 seconds if user hasn't scrolled
    const timer = setTimeout(() => {
      if (!hasScrolled) {
        setShowScrollIndicator(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [hasScrolled]);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both input and dropdown
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(target) &&
        suggestionsDropdownRef.current &&
        !suggestionsDropdownRef.current.contains(target)
      ) {
        setShowSuggestions(false);
        // Clear any pending blur timeout
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
      }
    };

    // Use mousedown and touchstart to catch clicks before blur
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSuggestions]);

  // Lock viewport when suggestions are shown to prevent zoom
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content');
    
    if (showSuggestions) {
      // Lock viewport completely when suggestions are visible
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
      
      // Prevent zoom gestures on body
      document.body.style.touchAction = 'pan-y';
      
      return () => {
        // Restore on cleanup
        if (viewport && originalContent) {
          viewport.setAttribute('content', originalContent);
        }
        document.body.style.touchAction = '';
      };
    }
  }, [showSuggestions]);

  // Initialize audio context for scroll sound (mobile & desktop compatible)
  useEffect(() => {
    // Create audio context immediately (will be resumed on user interaction)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (error) {
      console.log('Audio context creation failed:', error);
    }
    
    // Resume audio context on first user interaction (required for autoplay restrictions)
    const resumeAudio = async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          console.log('Audio context resume failed:', error);
        }
      }
      document.removeEventListener('touchstart', resumeAudio);
      document.removeEventListener('mousedown', resumeAudio);
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('scroll', resumeAudio, true);
    };
    
    // Try to resume on various user interactions
    document.addEventListener('touchstart', resumeAudio, { passive: true, once: true });
    document.addEventListener('mousedown', resumeAudio, { passive: true, once: true });
    document.addEventListener('click', resumeAudio, { passive: true, once: true });
    document.addEventListener('scroll', resumeAudio, { passive: true, once: true, capture: true });
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      document.removeEventListener('touchstart', resumeAudio);
      document.removeEventListener('mousedown', resumeAudio);
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('scroll', resumeAudio, true);
    };
  }, []);

  // iPhone-style tick sound function
  const playTickSound = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const now = Date.now();
    const SOUND_COOLDOWN = 50; // Minimum ms between sounds
    
    // Throttle sounds to prevent too many
    if (now - lastSoundTimeRef.current < SOUND_COOLDOWN) {
      return;
    }
    
    try {
      // Resume context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create a short, sharp click sound like iPhone timer
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // iPhone timer uses a short, sharp click - make it more audible
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher pitch for click
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.03);
      
      // Quick attack and decay - short but audible sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.002); // Quick attack, louder
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03); // Quick decay
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.03); // Slightly longer for better audibility
      
      lastSoundTimeRef.current = now;
    } catch (error) {
      // Silently fail if audio can't play (e.g., autoplay restrictions)
      console.log('Sound playback failed:', error);
    }
  }, []);

  // Add scroll sound effect to categories box (mobile & desktop)
  useEffect(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);
      
      // Only play sound if scrolled enough (prevents sounds on tiny movements)
      if (scrollDelta > 2) {
        // Try to resume audio context if needed
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
        playTickSound();
        lastScrollTopRef.current = currentScrollTop;
      } else {
        lastScrollTopRef.current = currentScrollTop;
      }
    };

    // Works for both touch scrolling (mobile) and mouse wheel/trackpad (desktop)
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen for wheel events on desktop for better responsiveness
    const handleWheel = () => {
      // Trigger scroll handler after a small delay to let scroll position update
      setTimeout(() => {
        handleScroll();
      }, 10);
    };
    
    scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
    
    // Initialize scroll position
    lastScrollTopRef.current = scrollContainer.scrollTop;
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [playTickSound]);

  // Load enquiries with real-time updates (with error handling)
  useEffect(() => {
    setLoading(true);
    
    // 🚀 FIX: Fetch all enquiries - use query without orderBy first to avoid 100 document limit
    // Firestore queries with orderBy may be limited to 100 documents
    // We'll sort client-side to ensure we get ALL documents
    const enquiriesQueryWithoutOrder = query(
      collection(db, "enquiries")
      // No orderBy - gets ALL documents without limit
    );
    
    // Query with orderBy for fallback (if needed, but may be limited to 100)
    const enquiriesQueryWithOrder = query(
      collection(db, "enquiries"),
      orderBy("createdAt", "desc")
    );
    
    let unsubscribe: (() => void) | null = null;
    
    // 🚀 FIX: Try without orderBy first to get ALL documents (no 100 limit)
    const tryWithoutOrder = () => {
      console.log('🔍 EnquiryWall: Attempting query without orderBy to get ALL documents...');
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      unsubscribe = onSnapshot(
        enquiriesQueryWithoutOrder,
        (snapshot) => {
          console.log('✅ EnquiryWall: Query without orderBy succeeded, got', snapshot.docs.length, 'documents');
          if (snapshot.docs.length === 100) {
            console.error('❌ EnquiryWall: Query without orderBy returned exactly 100 documents - snapshot is LIMITED!');
            console.error('❌ EnquiryWall: This means we are NOT getting all documents. Count will be incorrect.');
          } else {
            console.log('✅ EnquiryWall: Query without orderBy got', snapshot.docs.length, 'documents - should be all documents');
          }
          processEnquiries(snapshot);
        },
        (error) => {
          console.error("❌ EnquiryWall: Error loading enquiries (no orderBy):", error);
          // Try with orderBy as fallback
          tryWithOrder();
        }
      );
    };
    
    // Fallback: Try with orderBy if query without orderBy fails
    const tryWithOrder = () => {
      console.log('🔍 EnquiryWall: Attempting query with orderBy (may be limited to 100 docs)...');
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      unsubscribe = onSnapshot(
        enquiriesQueryWithOrder,
        (snapshot) => {
          console.log('✅ EnquiryWall: Query with orderBy succeeded, got', snapshot.docs.length, 'documents');
          if (snapshot.docs.length === 100) {
            console.warn('⚠️ EnquiryWall: Snapshot returned exactly 100 documents - may be limited!');
          }
          processEnquiries(snapshot);
        },
        (error: any) => {
          console.error("❌ EnquiryWall: Error loading enquiries (orderBy):", error);
          setLoading(false);
        }
      );
    };
    
    // Start with query without orderBy to get ALL documents
    tryWithoutOrder();
    
    // Process enquiries data
    const processEnquiries = (snapshot: any) => {
      try {
        console.log('📊 EnquiryWall: Received snapshot with', snapshot.docs.length, 'documents');
        
        const allEnquiriesData = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          console.log('📄 EnquiryWall: Processing enquiry', doc.id, 'status:', data.status);
          return {
            id: doc.id,
            ...data
          };
        }) as Enquiry[];
        
        console.log('📊 EnquiryWall: Total enquiries from query:', allEnquiriesData.length);
        
        // Filter to show enquiries with status='live' OR status='deal_closed' (admin accepted)
        // Use case-insensitive check to catch any variations
        const liveStatusEnquiries = allEnquiriesData.filter(enquiry => {
          const status = (enquiry.status || '').toLowerCase().trim();
          return status === 'live' || status === 'deal_closed';
        });
        
        console.log('📊 EnquiryWall: Enquiries with status=live or deal_closed:', liveStatusEnquiries.length);
        
        // Separate live, expired, and deal closed enquiries
        const now = new Date();
        
        // First, filter out deal closed enquiries (case-insensitive check)
        const dealClosedEnquiries = liveStatusEnquiries.filter(enquiry => {
          const status = (enquiry.status || '').toLowerCase().trim();
          return status === 'deal_closed' || enquiry.dealClosed === true;
        });
        
        // Then filter live and expired from the remaining enquiries
        const activeEnquiries = liveStatusEnquiries.filter(enquiry => {
          const status = (enquiry.status || '').toLowerCase().trim();
          return !(status === 'deal_closed' || enquiry.dealClosed === true);
        });
        
        const liveEnquiries = activeEnquiries.filter(enquiry => {
          if (!enquiry.deadline) return true; // No deadline = live
          try {
            let deadlineDate: Date;
            
            // Handle Firestore Timestamp (has toDate method)
            if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
              deadlineDate = enquiry.deadline.toDate();
            }
            // Handle Firestore Timestamp object (has seconds and nanoseconds)
            else if (enquiry.deadline?.seconds !== undefined) {
              deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
            }
            // Handle Date object
            else if (enquiry.deadline instanceof Date) {
              deadlineDate = enquiry.deadline;
            }
            // Handle string or number
            else {
              deadlineDate = new Date(enquiry.deadline);
            }
            
            if (!deadlineDate || isNaN(deadlineDate.getTime())) {
              return true; // If invalid, assume live
            }
            
            return deadlineDate.getTime() >= now.getTime();
          } catch {
            return true; // If error, assume live
          }
        });
        
        const expiredEnquiries = activeEnquiries.filter(enquiry => {
          if (!enquiry.deadline) return false; // No deadline = not expired
          try {
            let deadlineDate: Date;
            
            // Handle Firestore Timestamp (has toDate method)
            if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
              deadlineDate = enquiry.deadline.toDate();
            }
            // Handle Firestore Timestamp object (has seconds and nanoseconds)
            else if (enquiry.deadline?.seconds !== undefined) {
              deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
            }
            // Handle Date object
            else if (enquiry.deadline instanceof Date) {
              deadlineDate = enquiry.deadline;
            }
            // Handle string or number
            else {
              deadlineDate = new Date(enquiry.deadline);
            }
            
            if (!deadlineDate || isNaN(deadlineDate.getTime())) {
              return false; // If invalid, assume not expired
            }
            
            return deadlineDate.getTime() < now.getTime();
          } catch {
            return false; // If error, assume not expired
          }
        });
        
        console.log('📊 EnquiryWall: Live enquiries (not expired):', liveEnquiries.length, 'Expired:', expiredEnquiries.length, 'Deal Closed:', dealClosedEnquiries.length);
        console.log('📊 EnquiryWall: Snapshot docs count:', snapshot.docs.length, '- If this is 100, snapshot might be limited');
        
        // 🛡️ PROTECTED: DO NOT set count here - it will be calculated from displayEnquiries
        // 🚀 FIX: Don't set count here - it will be calculated from displayEnquiries
        // The count will be set in the useEffect that watches displayEnquiries
        // This ensures count matches what's actually displayed, not just what's in the snapshot
        // ⚠️ CRITICAL: Setting count here causes it to be capped at 99
        // ⚠️ DO NOT REVERT: Count must be calculated from displayEnquiries useEffect (line ~1049)
        
        // Sort live enquiries by date (newest first)
        liveEnquiries.sort((a, b) => {
          try {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          } catch {
            return 0;
          }
        });
        
        // Sort expired enquiries by date (newest first)
        expiredEnquiries.sort((a, b) => {
          try {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          } catch {
            return 0;
          }
        });

        // Sort deal closed enquiries by date (newest first)
        dealClosedEnquiries.sort((a, b) => {
          try {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          } catch {
            return 0;
          }
        });
        
        // Combine: live first, then expired, then deal closed (all already sorted)
        const combinedEnquiries = [...liveEnquiries, ...expiredEnquiries, ...dealClosedEnquiries];
        
        // Deduplicate by enquiry ID to prevent duplicates
        const uniqueEnquiries = Array.from(
          new Map(combinedEnquiries.map(enquiry => [enquiry.id, enquiry])).values()
        );
        
        console.log('📊 EnquiryWall: Final unique enquiries to display:', uniqueEnquiries.length);
        console.log('📊 EnquiryWall: Sample enquiry IDs:', uniqueEnquiries.slice(0, 5).map(e => e.id));
        
        setEnquiries(uniqueEnquiries);
        setLoading(false);
      } catch (error) {
        console.error("❌ EnquiryWall: Error processing enquiries:", error);
        setLoading(false);
      }
    };
    
    // 🚀 FIX: Start with query without orderBy to get ALL documents (no 100 limit)
    tryWithoutOrder();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch user profiles for all enquiry owners to show trust badges (optimized with batching)
  useEffect(() => {
    if (enquiries.length === 0) return;

    let isMounted = true;

    const fetchUserProfiles = async () => {
      try {
        const profiles: {[key: string]: any} = {};
        const userIds = [...new Set(enquiries.map(enquiry => enquiry.userId))];
        
        // Batch fetch profiles for better performance
        const profilePromises = userIds.map(async (userId) => {
          try {
            // Try 'userProfiles' first
            let profileDoc = await getDoc(doc(db, 'userProfiles', userId));
            if (!profileDoc.exists()) {
              // Fallback to 'profiles' collection
              profileDoc = await getDoc(doc(db, 'profiles', userId));
            }
            if (profileDoc.exists()) {
              return { userId, data: profileDoc.data() };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user profile for ${userId}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(profilePromises);
        
        if (isMounted) {
          results.forEach((result) => {
            if (result) {
              profiles[result.userId] = result.data;
            }
          });
          setUserProfiles(profiles);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        if (isMounted) {
          setUserProfiles({});
        }
      }
    };

    fetchUserProfiles();

    return () => {
      isMounted = false;
    };
  }, [enquiries]);

  // AI-powered search function
  const handleAISearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setAiSearchResults(null);
      setIsAISearching(false);
      return;
    }
    
    setIsAISearching(true);
    try {
      const searchResults = await AISearchService.searchEnquiries(enquiries, term);
      setAiSearchResults(searchResults);
    } catch (error) {
      console.error('AI Search Error:', error);
      setAiSearchResults(null);
    } finally {
      setIsAISearching(false);
    }
  }, [enquiries]);

  // Generate suggestions from actual enquiry data
  const generateSuggestions = (searchValue: string): string[] => {
    if (!searchValue.trim() || enquiries.length === 0) return [];
    
    const searchLower = searchValue.toLowerCase();
    const suggestionsSet = new Set<string>();
    
    // Extract unique categories from enquiries
    const categories = new Set<string>();
    enquiries.forEach(enquiry => {
      if (enquiry.category) {
        categories.add(enquiry.category.replace('-', ' '));
      }
      if (enquiry.categories && Array.isArray(enquiry.categories)) {
        enquiry.categories.forEach(cat => {
          if (cat) categories.add(cat.replace('-', ' '));
        });
      }
    });
    
    // Match categories
    categories.forEach(category => {
      const categoryLower = category.toLowerCase();
      if (categoryLower.includes(searchLower) || searchLower.includes(categoryLower)) {
        suggestionsSet.add(category);
      }
    });
    
    // Extract keywords from enquiry titles and descriptions
    const titleWords = new Set<string>();
    const descriptionWords = new Set<string>();
    
    enquiries.forEach(enquiry => {
      // Extract words from title
      if (enquiry.title) {
        enquiry.title.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 3 && word.includes(searchLower)) {
            titleWords.add(word);
          }
        });
      }
      
      // Extract words from description
      if (enquiry.description) {
        enquiry.description.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 3 && word.includes(searchLower)) {
            descriptionWords.add(word);
          }
        });
      }
    });
    
    // Add matching title words
    titleWords.forEach(word => {
      if (suggestionsSet.size < 5) {
        suggestionsSet.add(word);
      }
    });
    
    // Add matching description words if we need more
    descriptionWords.forEach(word => {
      if (suggestionsSet.size < 5) {
        suggestionsSet.add(word);
      }
    });
    
    return Array.from(suggestionsSet).slice(0, 5);
  };

  // Debounced search handler for better performance
  const debouncedSearch = useCallback(
    debounce(async (value: string) => {
      if (value.trim()) {
        // Generate suggestions from actual enquiry data
        const suggestions = generateSuggestions(value);
        setSearchSuggestions(suggestions);
        // Only show suggestions if we're not preventing them (e.g., after selecting a suggestion)
        if (!preventSuggestionsRef.current) {
          setShowSuggestions(suggestions.length > 0);
        }
        
        // Perform AI search - call directly to avoid dependency issues
        if (!value.trim()) {
          setAiSearchResults(null);
          setIsAISearching(false);
          return;
        }
        
        setIsAISearching(true);
        try {
          const searchResults = await AISearchService.searchEnquiries(enquiries, value);
          setAiSearchResults(searchResults);
        } catch (error) {
          console.error('AI Search Error:', error);
          setAiSearchResults(null);
        } finally {
          setIsAISearching(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        setAiSearchResults(null);
      }
    }, 300),
    [enquiries]
  );

  // Handle search input with AI suggestions (optimized with debouncing)
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Find matching category for a suggestion
  const findMatchingCategory = (suggestion: string): string | null => {
    const suggestionLower = suggestion.toLowerCase().replace(/\s+/g, '-');
    
    // Check all available categories
    const allCategories = [
      { value: 'business', label: 'Business' },
      { value: 'personal', label: 'Personal' },
      { value: 'service', label: 'Service' },
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'antiques', label: 'Antiques' },
      { value: 'art', label: 'Art' },
      { value: 'automobile', label: 'Automobile' },
      { value: 'books', label: 'Books' },
      { value: 'baby-kids', label: 'Baby & Kids' },
      { value: 'bags-luggage', label: 'Bags & Luggage' },
      { value: 'beauty-products', label: 'Beauty' },
      { value: 'bicycles', label: 'Bicycles' },
      { value: 'childcare', label: 'Childcare' },
      { value: 'collectibles', label: 'Collectibles' },
      { value: 'construction', label: 'Construction' },
      { value: 'education', label: 'Education' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'events', label: 'Events' },
      { value: 'fashion', label: 'Fashion' },
      { value: 'food', label: 'Food' },
      { value: 'gaming', label: 'Gaming' },
      { value: 'government', label: 'Government' },
      { value: 'health', label: 'Health' },
      { value: 'home', label: 'Home' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'jobs', label: 'Jobs' },
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'legal', label: 'Legal' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'memorabilia', label: 'Memorabilia' },
      { value: 'non-profit', label: 'Non-Profit' },
      { value: 'pets', label: 'Pets' },
      { value: 'products', label: 'Products' },
      { value: 'real-estate', label: 'Real Estate' },
      { value: 'real-estate-services', label: 'Real Estate Services' },
      { value: 'renewable-energy', label: 'Renewable Energy' },
      { value: 'security', label: 'Security' },
      { value: 'sports', label: 'Sports' },
      { value: 'technology', label: 'Technology' },
      { value: 'thrift', label: 'Thrift' },
      { value: 'transportation', label: 'Transportation' },
      { value: 'travel', label: 'Travel' },
      { value: 'vintage', label: 'Vintage' },
      { value: 'waste-management', label: 'Waste Management' },
      { value: 'wedding', label: 'Wedding' },
      { value: 'musical-instruments', label: 'Musical Instruments' },
      { value: 'tools-equipment', label: 'Tools & Equipment' },
      { value: 'appliances', label: 'Appliances' },
      { value: 'photography-cameras', label: 'Photography & Cameras' },
      { value: 'fitness-gym-equipment', label: 'Fitness & Gym Equipment' },
      { value: 'kitchen-dining', label: 'Kitchen & Dining' },
      { value: 'garden-outdoor', label: 'Garden & Outdoor' },
      { value: 'office-supplies', label: 'Office Supplies' },
      { value: 'repair-services', label: 'Repair Services' },
      { value: 'cleaning-services', label: 'Cleaning Services' },
      { value: 'musical-services', label: 'Musical Services' },
      { value: 'tutoring-lessons', label: 'Tutoring & Lessons' },
      { value: 'medical-equipment', label: 'Medical Equipment' },
      { value: 'musical-accessories', label: 'Musical Accessories' },
      { value: 'other', label: 'Other' }
    ];
    
    // Try exact match first
    const exactMatch = allCategories.find(cat => 
      cat.value === suggestionLower || 
      cat.label.toLowerCase() === suggestion.toLowerCase()
    );
    if (exactMatch) return exactMatch.value;
    
    // Try partial match
    const partialMatch = allCategories.find(cat => 
      cat.value.includes(suggestionLower) || 
      suggestionLower.includes(cat.value) ||
      cat.label.toLowerCase().includes(suggestion.toLowerCase()) ||
      suggestion.toLowerCase().includes(cat.label.toLowerCase())
    );
    if (partialMatch) return partialMatch.value;
    
    return null;
  };

  // Handle suggestion click without zoom
  const handleSuggestionClick = (suggestion: string) => {
    // Mark that we're clicking a suggestion to prevent blur handler interference
    isClickingSuggestionRef.current = true;
    
    // Prevent suggestions from showing when debouncedSearch runs
    preventSuggestionsRef.current = true;
    
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // Close suggestions immediately
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    // Pre-calculate category
    const matchingCategory = findMatchingCategory(suggestion);
    
    // Update search term
    setSearchTerm(suggestion);
    
    // Set matching category
    if (matchingCategory) {
      setSelectedCategory(matchingCategory);
    }
    
    // Trigger search (but prevent suggestions from showing)
    handleSearchChange(suggestion);
    
    // Reset the flags after a short delay
    setTimeout(() => {
      isClickingSuggestionRef.current = false;
      preventSuggestionsRef.current = false;
    }, 500);
  };

  // Handle category selection - clear search when "all" is selected
  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    
    // If "all" is selected, clear search and AI results
    if (categoryValue === "all") {
      setSearchTerm("");
      setAiSearchResults(null);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Get final results - Regular search always works, AI search enhances results (memoized for performance)
  const finalResults = useMemo(() => {
    const searchLower = searchTerm?.toLowerCase().trim() || '';
    
    // Always apply regular search filtering first
    let results = enquiries.filter(enquiry => {
      // Enhanced search matching - check multiple fields
      const matchesSearch = !searchLower || (() => {
        // Check title/heading - prioritize exact title matches
        if (enquiry.title) {
          const titleLower = enquiry.title.toLowerCase().trim();
          if (titleLower.includes(searchLower)) return true;
          // Also check if search term matches any word in title
          const titleWords = titleLower.split(/\s+/);
          if (titleWords.some(word => word.includes(searchLower) || searchLower.includes(word))) return true;
        }
        // Check description
        if (enquiry.description && enquiry.description.toLowerCase().includes(searchLower)) return true;
        // Check category
        if (enquiry.category && enquiry.category.toLowerCase().includes(searchLower)) return true;
        // Check categories array
        if (enquiry.categories && Array.isArray(enquiry.categories)) {
          if (enquiry.categories.some(cat => cat && cat.toLowerCase().includes(searchLower))) return true;
        }
        // Check location
        if (enquiry.location && enquiry.location.toLowerCase().includes(searchLower)) return true;
        // Check budget (if search term matches budget string)
        if (enquiry.budget) {
          const budgetStr = typeof enquiry.budget === 'string' ? enquiry.budget : String(enquiry.budget);
          if (budgetStr.includes(searchTerm)) return true;
        }
        return false;
      })();
      
      const matchesCategory = selectedCategory === "all" || 
        enquiry.category === selectedCategory || 
        (enquiry.categories && enquiry.categories.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });
    
    // If AI search is active, combine AI results with regular search results
    // Both work together - regular search for exact matches, AI search for semantic matches
    if (aiSearchResults && aiSearchResults.results && aiSearchResults.results.length > 0) {
      // Combine both results - regular search results first (exact matches), then AI results
      const regularResultIds = new Set(results.map(e => e.id));
      const aiResults = aiSearchResults.results.filter(e => !regularResultIds.has(e.id));
      // Merge: regular search results first (exact matches), then AI results (semantic matches)
      results = [...results, ...aiResults];
    }
    
    // Sort: User's enquiries in selected category first, then others
    if (selectedCategory !== "all") {
      results = [...results].sort((a, b) => {
        // Check if enquiry matches the selected category
        const aMatchesCategory = a.category === selectedCategory || 
          (a.categories && a.categories.includes(selectedCategory));
        const bMatchesCategory = b.category === selectedCategory || 
          (b.categories && b.categories.includes(selectedCategory));
        
        // Check if enquiry belongs to current user
        const aIsUserEnquiry = authUser && a.userId === authUser.uid;
        const bIsUserEnquiry = authUser && b.userId === authUser.uid;
        
        // Priority: User's enquiries in selected category first
        const aIsUserInCategory = aIsUserEnquiry && aMatchesCategory;
        const bIsUserInCategory = bIsUserEnquiry && bMatchesCategory;
        
        if (aIsUserInCategory && !bIsUserInCategory) return -1;
        if (!aIsUserInCategory && bIsUserInCategory) return 1;
        
        // Then: Other enquiries in selected category
        if (aMatchesCategory && !bMatchesCategory) return -1;
        if (!aMatchesCategory && bMatchesCategory) return 1;
        
        return 0;
      });
    }
    
    return results;
  }, [aiSearchResults, enquiries, searchTerm, selectedCategory, authUser]);

  // Memoize filtered enquiries for better performance
  const filteredEnquiries = useMemo(() => {
    return Array.from(
      new Map(finalResults.map(enquiry => [enquiry.id, enquiry])).values()
    );
  }, [finalResults]);

  // Check if we need to show "no enquiries in category" message and fallback to all
  const showCategoryFallback = useMemo(() => {
    return filteredEnquiries.length === 0 && selectedCategory !== "all" && !aiSearchResults;
  }, [filteredEnquiries.length, selectedCategory, aiSearchResults]);
  
  // Count trust badge enquiries from live enquiries
  const trustBadgeEnquiriesCount = useMemo(() => {
    const now = new Date();
    const liveEnquiries = enquiries.filter(enquiry => {
      // Only count live (non-expired) enquiries
      if (!enquiry.deadline) return true;
      try {
        let deadlineDate: Date;
        if (enquiry.deadline?.toDate) {
          deadlineDate = enquiry.deadline.toDate();
        } else if (enquiry.deadline?.seconds !== undefined) {
          deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
        } else if (enquiry.deadline instanceof Date) {
          deadlineDate = enquiry.deadline;
        } else {
          deadlineDate = new Date(enquiry.deadline);
        }
        if (!deadlineDate || isNaN(deadlineDate.getTime())) return true;
        return deadlineDate.getTime() >= now.getTime();
      } catch {
        return true;
      }
    });
    
    // Filter to only trust badge enquiries
    return liveEnquiries.filter(enquiry => {
      const profile = userProfiles[enquiry.userId];
      const hasTrustBadge = 
        profile?.isProfileVerified || 
        profile?.isVerified ||
        profile?.trustBadge ||
        profile?.isIdentityVerified ||
        enquiry.idFrontImage || 
        enquiry.idBackImage ||
        enquiry.isProfileVerified ||
        enquiry.userVerified;
      return hasTrustBadge;
    }).length;
  }, [enquiries, userProfiles]);
  
  // If no enquiries in selected category, show all enquiries as fallback
  const displayEnquiries = useMemo(() => {
    let results = showCategoryFallback ? enquiries : filteredEnquiries;
    
    // Filter by trust badge if enabled - match the exact conditions for blue tick display
    if (showTrustBadgeOnly) {
      results = results.filter(enquiry => {
        const profile = userProfiles[enquiry.userId];
        // Match the exact conditions used to display the blue tick in the card header
        // Grid view: userProfiles[enquiry.userId]?.isProfileVerified || enquiry.idFrontImage || enquiry.idBackImage
        // List view: (userProfiles[enquiry.userId]?.isProfileVerified || userProfiles[enquiry.userId]?.isVerified || userProfiles[enquiry.userId]?.trustBadge || userProfiles[enquiry.userId]?.isIdentityVerified) || enquiry.idFrontImage || enquiry.idBackImage
        const hasTrustBadge = 
          profile?.isProfileVerified || 
          profile?.isVerified ||
          profile?.trustBadge ||
          profile?.isIdentityVerified ||
          enquiry.idFrontImage || 
          enquiry.idBackImage;
        
        return hasTrustBadge;
      });
    }
    
    return results;
  }, [showCategoryFallback, enquiries, filteredEnquiries, showTrustBadgeOnly, userProfiles]);

  // 🚀 PAGINATION: Paginate displayEnquiries to show 10 at a time
  useEffect(() => {
    // Reset pagination when filters change
    const firstPage = displayEnquiries.slice(0, enquiriesPerPage);
    setDisplayedEnquiries(firstPage);
    setCurrentPage(1);
    setHasMore(displayEnquiries.length > enquiriesPerPage);
  }, [displayEnquiries, enquiriesPerPage]);

  // 🛡️ PROTECTED: Count calculation - DO NOT MODIFY
  // 🚀 FIX: Calculate count from displayEnquiries filtered to live only
  // This ensures count matches what's actually available to users (what they can see)
  // displayEnquiries includes all enquiries (live + expired + deal closed) that match filters
  // We need to count only LIVE enquiries from displayEnquiries to match what's available
  // 
  // ⚠️ CRITICAL: This fix prevents count from being capped at 99
  // ⚠️ DO NOT REVERT: Count must be calculated from displayEnquiries, not enquiries state
  // ⚠️ This ensures count matches Load More button and what users actually see
  // 
  // Previous issue: Count showed 99 but Load More showed 127 remaining
  // Root cause: Count was calculated from enquiries state (limited snapshot)
  // Solution: Calculate from displayEnquiries filtered to live only
  useEffect(() => {
    // Count only live (non-expired, non-deal-closed) enquiries from displayEnquiries
    // This ensures count matches what's actually available (matches Load More button logic)
    const now = new Date();
    const liveCount = displayEnquiries.filter(enquiry => {
      // Filter to status='live' or 'deal_closed' first (matches processEnquiries logic)
      const status = (enquiry.status || '').toLowerCase().trim();
      if (status !== 'live' && status !== 'deal_closed') return false;
      
      // Filter out deal closed
      if (status === 'deal_closed' || enquiry.dealClosed === true) return false;
      
      // Filter out expired - use same logic as processEnquiries
      if (!enquiry.deadline) return true; // No deadline = live
      try {
        let deadlineDate: Date;
        if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
          deadlineDate = enquiry.deadline.toDate();
        } else if (enquiry.deadline?.seconds !== undefined) {
          deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
        } else if (enquiry.deadline instanceof Date) {
          deadlineDate = enquiry.deadline;
        } else {
          deadlineDate = new Date(enquiry.deadline);
        }
        if (!deadlineDate || isNaN(deadlineDate.getTime())) return true;
        return deadlineDate.getTime() >= now.getTime();
      } catch {
        return true;
      }
    }).length;
    
    // Always update count from displayEnquiries (matches what users can see)
    console.log('📊 EnquiryWall: Recalculating count from displayEnquiries:', {
      totalDisplayEnquiries: displayEnquiries.length,
      liveCount: liveCount,
      totalEnquiries: enquiries.length,
      displayedEnquiriesLength: displayedEnquiries.length
    });
    
    // 🛡️ PROTECTED: Set count from displayEnquiries - DO NOT CHANGE THIS LOGIC
    // 🚀 FIX: Use the count from displayEnquiries filtered to live only
    // This ensures count matches what's actually available to users
    // ⚠️ CRITICAL: Must use displayEnquiries, not enquiries state
    // ⚠️ DO NOT REVERT: This prevents count from being capped incorrectly
    setLiveEnquiriesCount(liveCount);
  }, [displayEnquiries, enquiries, displayedEnquiries]);

  // 🚀 PAGINATION: Load more function
  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * enquiriesPerPage;
    const endIndex = startIndex + enquiriesPerPage;
    const nextBatch = displayEnquiries.slice(startIndex, endIndex);
    
    if (nextBatch.length > 0) {
      setDisplayedEnquiries(prev => [...prev, ...nextBatch]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < displayEnquiries.length);
    }
  }, [currentPage, displayEnquiries, enquiriesPerPage]);

  // Memoize helper functions for better performance
  const isOwnEnquiry = useCallback((enquiry: Enquiry) => {
    return authUser && enquiry.userId === authUser.uid;
  }, [authUser]);

  // Helper to check if an enquiry is expired (uses currentTime state for real-time updates)
  const isEnquiryOutdated = useCallback((enquiry: Enquiry) => {
    if (!enquiry.deadline) return false;
    
    try {
      let deadlineDate: Date;
      
      // Handle Firestore Timestamp (has toDate method)
      if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
        deadlineDate = enquiry.deadline.toDate();
      }
      // Handle Firestore Timestamp object (has seconds and nanoseconds)
      else if (enquiry.deadline?.seconds !== undefined) {
        deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
      }
      // Handle Date object
      else if (enquiry.deadline instanceof Date) {
        deadlineDate = enquiry.deadline;
      }
      // Handle string or number
      else {
        deadlineDate = new Date(enquiry.deadline);
      }
      
      if (!deadlineDate || isNaN(deadlineDate.getTime())) {
        console.error('Invalid deadline in isEnquiryOutdated for enquiry:', enquiry.id, enquiry.deadline);
        return false; // If invalid, assume not outdated
      }
      
      return currentTime > deadlineDate;
    } catch (error) {
      console.error('Error checking if enquiry is outdated:', error, enquiry.id, enquiry.deadline);
      return false; // If error, assume not outdated
    }
  }, [currentTime]);

  // Helper to check if an enquiry is deal closed (case-insensitive)
  const isDealClosed = useCallback((enquiry: Enquiry) => {
    const status = (enquiry.status || '').toLowerCase().trim();
    return status === 'deal_closed' || enquiry.dealClosed === true;
  }, []);

  // Helper to check if an enquiry is disabled (expired or deal closed)
  const isEnquiryDisabled = useCallback((enquiry: Enquiry) => {
    return isEnquiryOutdated(enquiry) || isDealClosed(enquiry);
  }, [isEnquiryOutdated, isDealClosed]);

  const formatDate = (dateString: string | Date | any) => {
    try {
      let date: Date;
      
      // Handle Firestore Timestamp (has toDate method)
      if (dateString?.toDate && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
      }
      // Handle Firestore Timestamp object (has seconds and nanoseconds)
      else if (dateString?.seconds !== undefined) {
        date = new Date(dateString.seconds * 1000 + (dateString.nanoseconds || 0) / 1000000);
      }
      // Handle Date object
      else if (dateString instanceof Date) {
        date = dateString;
      }
      // Handle string
      else if (typeof dateString === 'string') {
        date = new Date(dateString);
      }
      // Handle number (timestamp)
      else if (typeof dateString === 'number') {
        date = new Date(dateString);
      }
      else {
        console.error('Invalid date format:', dateString, typeof dateString);
        return 'Invalid date';
      }
      
      if (!date || isNaN(date.getTime())) {
        console.error('Invalid date value:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  // Format deadline as simple text (e.g., "13d 16h left")
  const formatDeadlineText = useCallback((deadline: any) => {
    if (!deadline) return '';
    
    let deadlineDate: Date;
    try {
      // Handle Firestore Timestamp (has toDate method)
      if (deadline?.toDate && typeof deadline.toDate === 'function') {
        deadlineDate = deadline.toDate();
      }
      // Handle Firestore Timestamp object (has seconds and nanoseconds)
      else if (deadline?.seconds !== undefined) {
        deadlineDate = new Date(deadline.seconds * 1000 + (deadline.nanoseconds || 0) / 1000000);
      }
      // Handle Date object
      else if (deadline instanceof Date) {
        deadlineDate = deadline;
      }
      // Handle string or number
      else {
        deadlineDate = new Date(deadline);
      }
      
      if (!deadlineDate || isNaN(deadlineDate.getTime())) {
        console.error('Invalid deadline date:', deadline);
        return '';
      }
    } catch (error) {
      console.error('Error parsing deadline:', error, deadline);
      return '';
    }
    
    const diff = deadlineDate.getTime() - currentTime.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m left`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${minutes}m ${seconds}s left`;
    }
  }, [currentTime]);

  // Category-specific sketches function for list view
  const getCategorySketch = (category: string) => {
    const categoryLower = category?.toLowerCase() || '';
    
    // Pets, Animals, Baby & Kids, Childcare
    if (categoryLower.includes('pet') || categoryLower.includes('animal') || categoryLower.includes('baby') ||
        categoryLower.includes('kid') || categoryLower.includes('childcare') || categoryLower.includes('family')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pet face - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <circle cx="0" cy="0" r="15" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="-4" cy="-3" r="2" fill="white"/>
            <circle cx="4" cy="-3" r="2" fill="white"/>
            <path d="M-3 4 Q0 6 3 4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-10 0 L-7 -3 M10 0 L7 -3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Food bowl - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="18" ry="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="0" rx="14" ry="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <circle cx="-6" cy="-2" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="6" cy="-2" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Bone - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="12" ry="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-10" cy="0" r="3" fill="white" opacity="0.8"/>
            <circle cx="10" cy="0" r="3" fill="white" opacity="0.8"/>
          </g>
          
          {/* Leash - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M 0 8 L 0 20" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M -2 20 L 2 20" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Paw print - bottom left */}
          <g transform="translate(120, 220)" opacity="0.5">
            <circle cx="0" cy="0" r="3" fill="white"/>
            <circle cx="-3" cy="3" r="2" fill="white"/>
            <circle cx="3" cy="3" r="2" fill="white"/>
            <circle cx="-2" cy="5" r="1.5" fill="white"/>
            <circle cx="2" cy="5" r="1.5" fill="white"/>
          </g>
          
          {/* Pet house - bottom center */}
          <g transform="translate(200, 240)" opacity="0.6">
            <rect x="-15" y="-8" width="30" height="16" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-15 -8 L0 -18 L15 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-13" rx="5" ry="4" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Paw print - bottom right */}
          <g transform="translate(280, 220)" opacity="0.5">
            <circle cx="0" cy="0" r="3" fill="white"/>
            <circle cx="-3" cy="3" r="2" fill="white"/>
            <circle cx="3" cy="3" r="2" fill="white"/>
            <circle cx="-2" cy="5" r="1.5" fill="white"/>
            <circle cx="2" cy="5" r="1.5" fill="white"/>
          </g>
        </svg>
      );
    }
    
    // Automobile & Transportation
    if (categoryLower.includes('automobile') || categoryLower.includes('vehicle') || categoryLower.includes('car') || 
        categoryLower.includes('transportation') || categoryLower.includes('logistics') || categoryLower.includes('bicycle')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Small car - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-9" y="-3" width="18" height="7" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-9 -3 Q-4 -6 4 -3" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-1" width="4" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="2" y="-1" width="4" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="-4" cy="6" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="6" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Wheel - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -6 L0 6 M-6 0 L6 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Bicycle - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="-4" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 0 L4 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -6 L-4 0 M0 -6 L4 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="-6" width="2" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Car - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-18" y="-6" width="36" height="14" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-18 -6 Q-8 -12 8 -6" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="-12" y="-2" width="8" height="6" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="4" y="-2" width="8" height="6" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-8" cy="12" r="6" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="8" cy="12" r="6" fill="none" stroke="white" strokeWidth="2"/>
          </g>
          
          {/* Traffic sign - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <path d="M-4 -6 L4 -6 L0 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Motorcycle - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="-3" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="3" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -5 L-3 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-0.5" y="-5" width="1" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Gas pump - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-2.5" y="-8" width="5" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -8 L0 -11" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-12" r="1" fill="white" opacity="0.8"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Bicycle - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <circle cx="-8" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="8" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 0 L8 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -12 L-8 0 M0 -12 L8 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-2" y="-12" width="4" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Wheel - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -10 L0 10 M-10 0 L10 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Road - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M-50 0 L50 0" stroke="white" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
            <path d="M-50 8 L50 8" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="4,4"/>
          </g>
          
          {/* Truck - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-12" y="-4" width="24" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-12" y="-8" width="14" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-6" cy="10" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="6" cy="10" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Motorcycle - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <circle cx="-6" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="6" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -10 L-6 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="-10" width="2" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Gas pump - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-5" y="-12" width="10" height="18" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -12 L0 -18" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-20" r="2" fill="white" opacity="0.8"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Traffic sign - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <path d="M-6 -10 L6 -10 L0 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-7" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Speedometer - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -7 L0 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L3 -2" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* License plate - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-8" y="-4" width="16" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -2 L6 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Electronics, Tech, Gaming
    if (categoryLower.includes('electronic') || categoryLower.includes('gaming') || categoryLower.includes('computer') || 
        categoryLower.includes('mobile') || categoryLower.includes('technology') || categoryLower.includes('photography')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Signal waves - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M-6 -5 Q-2 -7 2 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -2 Q-2 -4 2 -2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 1 Q-2 -1 2 1" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Tablet - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-8" y="-9" width="16" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="0" cy="5" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Gaming controller - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <rect x="-7" y="-5" width="14" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-4" cy="0" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="0" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 4 L2 4" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Phone - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-10" y="-18" width="20" height="36" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="-7" y="-14" width="14" height="24" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="10" r="2" fill="white"/>
          </g>
          
          {/* Laptop - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-8" y="-6" width="16" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="-4" width="12" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-8 -6 L-4 -10 L4 -10 L8 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-8" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Camera - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <rect x="-5" y="-7" width="10" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="1.5" fill="white" opacity="0.8"/>
            <path d="M3 -7 L4 -9" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Headphones - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <path d="M-5 -4 Q-2 -5 0 -4 Q2 -5 5 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Signal waves - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M-12 -8 Q-4 -12 4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 -4 Q-4 -8 4 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 0 Q-4 -4 4 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Tablet - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-12" y="-14" width="24" height="28" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-9" y="-11" width="18" height="22" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="0" cy="8" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Circuit board - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-18" y="-10" width="36" height="20" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-14 -6 L14 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-14 0 L14 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-14 6 L14 6" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="-7" cy="-3" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="7" cy="3" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Laptop - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-12" y="-8" width="24" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-10" y="-6" width="20" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-12 -8 L-6 -14 L6 -14 L12 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-11" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Headphones - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-8 -6 Q-4 -8 0 -6 Q4 -8 8 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-6" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="6" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Gaming controller - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-10" y="-6" width="20" height="14" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-5" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="5" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 5 L2 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-3" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Camera - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
            <path d="M4 -8 L5 -10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Smartwatch - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="-6" width="8" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M0 -8 L0 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 6 L0 8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* USB drive - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-4" y="-6" width="8" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-3" y="-6" width="6" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Construction, Real Estate, Home
    if (categoryLower.includes('construction') || categoryLower.includes('real-estate') || categoryLower.includes('building') || 
        categoryLower.includes('home') || categoryLower.includes('renovation')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Hammer - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-4" y="-12" width="8" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -10 L2 -10" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Wrench - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M-6 -4 L6 -4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M0 -4 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Key - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="0" y="-1" width="8" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M6 -1 L6 1" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M5 0 L8 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* House - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-20" y="-15" width="40" height="30" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-20 -15 L0 -30 L20 -15" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="-12" y="-8" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="4" y="-8" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="8" width="12" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="14" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Blueprint - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-8" y="-7" width="16" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -4 L6 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 4 L6 4" stroke="white" strokeWidth="1" fill="none"/>
            <rect x="-4" y="-2" width="6" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Drill - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <rect x="-2" y="-7" width="4" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-8" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -5 L1 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Ruler - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-8" y="-1" width="16" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -1 L-6 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1 L0 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 -1 L6 1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Hammer - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-16" width="12" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -14 L4 -14" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Saw - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-1" y="-12" width="2" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -12 L8 -12" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -8 L4 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Blueprint - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-16" y="-10" width="32" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-13 -7 L13 -7" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-13 0 L13 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-13 7 L13 7" stroke="white" strokeWidth="1" fill="none"/>
            <rect x="-8" y="-5" width="10" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Wrench - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <path d="M-8 -6 L8 -6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M0 -6 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Drill - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-3" y="-10" width="6" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-12" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -6 L1 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Ruler - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-12" y="-1.5" width="24" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-10 -1.5 L-10 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1.5 L0 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M10 -1.5 L10 1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Key - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="0" y="-1.5" width="10" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M6 -1.5 L6 1.5" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Paint brush - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <path d="M0 -10 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -10 L0 -13 L2 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 6 L1 6" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Measuring tape - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -6 L0 6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
        </svg>
      );
    }
    
    // Fashion, Beauty, Jewelry, Apparel
    if (categoryLower.includes('fashion') || categoryLower.includes('beauty') || categoryLower.includes('jewelry') || 
        categoryLower.includes('clothing') || categoryLower.includes('apparel') || categoryLower.includes('accessories') ||
        categoryLower.includes('bags') || categoryLower.includes('luggage') || categoryLower.includes('sneakers')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Jewelry ring - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Perfume bottle - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-2" y="-8" width="4" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -8 Q0 -9 2 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -5 L1 -5" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Lipstick - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <rect x="-2" y="-8" width="4" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -8 L0 -11 L2 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -5 L1 -5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Hanger with shirt - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <path d="M-15 -5 Q0 -10 15 -5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 -5 L0 20" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M0 0 Q-12 5 -15 20 L15 20 Q12 5 0 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Sunglasses - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <circle cx="-2" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="2" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 0 L5 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -3 L-2 3 M2 -3 L2 3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Watch - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -5 L0 -2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L3 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="0.8" fill="white" opacity="0.8"/>
            <rect x="-1" y="-7" width="2" height="1.5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-1" y="5.5" width="2" height="1.5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Handbag - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-5" y="-6" width="10" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -6 L-4 -10 M4 -6 L4 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -10 Q0 -11 4 -10" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Jewelry ring - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <circle cx="0" cy="0" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Perfume bottle - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-3" y="-12" width="6" height="18" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -12 Q0 -15 3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -8 L2 -8" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="4" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Mirror - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="16" ry="22" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="0" rx="10" ry="14" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M-7 -7 L7 7 M7 -7 L-7 7" stroke="white" strokeWidth="1" opacity="0.5"/>
          </g>
          
          {/* Lipstick - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-3" y="-12" width="6" height="18" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -12 L0 -16 L3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -8 L1 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Necklace - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-8 -8 Q0 -12 8 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-10" r="3" fill="white" opacity="0.8"/>
            <path d="M-8 -8 L-8 0 M8 -8 L8 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Handbag - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-8" y="-10" width="16" height="20" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L-6 -16 M6 -10 L6 -16" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -16 Q0 -18 6 -16" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Sneaker - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <path d="M-10 4 Q-6 0 -2 -2 Q0 -3 2 -2 Q6 0 10 4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 2 L6 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 6 L-8 8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Sunglasses - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="-4" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-9 0 L9 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -5 L-4 5 M4 -5 L4 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Watch - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -7 L0 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L4 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
            <rect x="-2" y="-9" width="4" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-2" y="7" width="4" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
        </svg>
      );
    }
    
    // Food, Beverage, Restaurant
    if (categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('catering') || 
        categoryLower.includes('beverage') || categoryLower.includes('kitchen') || categoryLower.includes('dining')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Fork - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1.5 -12 Q-2.5 -9 -1.5 -12" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M-1 -10 Q-2 -7 -1 -10" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8"/>
          </g>
          
          {/* Spoon - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-10" rx="3" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Chef hat - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M-6 -8 Q0 -10 6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-8" width="12" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -5 L4 -5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Plate with food - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <ellipse cx="0" cy="0" rx="20" ry="6" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="0" cy="-8" r="12" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-8" r="6" fill="white" opacity="0.6"/>
          </g>
          
          {/* Cup - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <path d="M-4 -6 L-4 4 L4 4 L4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -6 Q0 -7 4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -4 L3 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pizza slice - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M0 -6 L-5 4 L5 4 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-2" cy="-1" r="1" fill="white" opacity="0.8"/>
            <circle cx="2" cy="0" r="1" fill="white" opacity="0.8"/>
            <circle cx="-1" cy="1" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Burger - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <ellipse cx="0" cy="-4" rx="5" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="0" rx="5" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="4" rx="5" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-2" cy="-2" r="0.8" fill="white" opacity="0.8"/>
            <circle cx="2" cy="2" r="0.8" fill="white" opacity="0.8"/>
          </g>
          
          {/* Fork - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -18 L0 18" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -18 Q-4 -14 -2 -18" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M-1 -16 Q-3 -12 -1 -16" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8"/>
          </g>
          
          {/* Chef hat - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M-10 -12 Q0 -16 10 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-10" y="-12" width="20" height="18" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Spoon - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M0 -18 L0 18" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-16" rx="4" ry="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Knife - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <path d="M0 -15 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -15 L0 -19 L2 -15" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Wine glass - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-3 -12 L-3 8 L3 8 L3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -12 Q0 -15 3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 8 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="12" rx="4" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Cup - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <path d="M-6 -10 L-6 6 L6 6 L6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -10 Q0 -12 6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -6 L4 -6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pizza slice - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <path d="M0 -10 L-8 6 L8 6 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-3" cy="-2" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="3" cy="0" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="-2" cy="2" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Burger - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <ellipse cx="0" cy="-6" rx="8" ry="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="0" rx="8" ry="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="0" cy="6" rx="8" ry="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-3" cy="-3" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="3" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Coffee cup - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <path d="M-5 -10 L-5 6 L5 6 L5 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 -10 Q0 -12 5 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 -8 L8 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Health, Medical, Beauty Products
    if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('pharmacy') ||
        categoryLower.includes('beauty-products')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Pulse/heartbeat - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M-8 -2 Q-2 -4 2 -2 T8 -2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-8 0 Q-2 -2 2 0 T8 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-8 2 Q-2 0 2 2 T8 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Pill bottle - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-4" y="-8" width="8" height="14" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -8 Q0 -9 4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -5 L3 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -2 L3 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Heart - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M0 -4 Q-3 -4 -4 -2 Q-4 0 0 4 Q4 0 4 -2 Q3 -4 0 -4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Medical cross - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-8" y="-20" width="16" height="40" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="-20" y="-8" width="40" height="16" rx="2" fill="none" stroke="white" strokeWidth="2"/>
          </g>
          
          {/* Syringe - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-1" y="-6" width="2" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -6 L0 -8 L1 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-0.5 -3 L0.5 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-0.5 -1 L0.5 -1" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="6" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Bandage - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <rect x="-6" y="-1.5" width="12" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -1.5 L-4 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1.5 L0 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M4 -1.5 L4 1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Thermometer - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-1" y="-10" width="2" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-11" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-0.5 -7 L0.5 -7" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-0.5 -4 L0.5 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pulse/heartbeat - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M-12 -4 Q-4 -8 4 -4 T12 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 0 Q-4 -4 4 0 T12 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 4 Q-4 0 4 4 T12 4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Pill bottle - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-6" y="-12" width="12" height="22" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -12 Q0 -14 6 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -8 L4 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Stethoscope - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 7 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 12 Q0 14 4 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-2.5" cy="12" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="2.5" cy="12" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Syringe - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-2" y="-10" width="4" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -10 L0 -13 L2 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -6 L1 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="8" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Heart - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M0 -6 Q-4 -6 -6 -3 Q-6 0 0 6 Q6 0 6 -3 Q4 -6 0 -6" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Bandage - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-10" y="-2" width="20" height="5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -2 L-6 3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -2 L0 3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 -2 L6 3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Thermometer - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <rect x="-1.5" y="-12" width="3" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-14" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-0.5 -8 L0.5 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-0.5 -4 L0.5 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pills - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="-3" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 0 L-1 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="3" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M3 0 L1 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Face cream jar - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-4" y="-10" width="8" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -10 Q0 -12 4 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-6" r="2" fill="white" opacity="0.8"/>
            <path d="M-2 -2 L2 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Education, Books, Training, Tutoring
    if (categoryLower.includes('education') || categoryLower.includes('book') || categoryLower.includes('learning') ||
        categoryLower.includes('training') || categoryLower.includes('tutoring')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Pencil - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-1" y="-8" width="2" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -8 L0 -11 L1 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 4 L1 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Notebook - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -7 L6 -7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -1 L4 -1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 2 L4 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 5 L4 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Graduation cap - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M-8 -4 Q0 -8 8 -4 L8 0 Q0 -2 -8 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -3 L6 -3" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="-6" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Book - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-18" y="-20" width="36" height="40" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M0 -20 L0 20" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-12 -10 L-2 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 0 L-2 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 10 L-2 10" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Calculator - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="-5" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 -2 L2 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 2 L2 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Globe - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 Q0 -3 6 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 Q0 3 6 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -6 L0 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Ruler - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-8" y="-1" width="16" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -1 L-6 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1 L0 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 -1 L6 1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pencil - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <rect x="-1.5" y="-12" width="3" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1.5 -12 L0 -16 L1.5 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1.5 6 L1.5 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Notebook - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -10 L8 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -6 L6 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 -2 L6 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 2 L6 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 6 L6 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Graduation cap - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M-12 -6 Q0 -12 12 -6 L12 0 Q0 -4 -12 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -5 L8 -5" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="-8" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Calculator - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-3 -4 L3 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 4 L3 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Microscope - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-2" y="-12" width="4" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-14" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 6 L4 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="8" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Ruler - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-12" y="-1.5" width="24" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-10 -1.5 L-10 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1.5 L0 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M10 -1.5 L10 1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Globe - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 0 Q0 -4 8 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 0 Q0 4 8 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Compass - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -7 L0 7 M-7 0 L7 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
            <path d="M0 -7 L0 -4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Eraser - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-5" y="-3" width="10" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -3 L-3 -6 L3 -6 L5 -3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -3 L3 -3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Art, Antiques, Collectibles, Memorabilia, Vintage
    if (categoryLower.includes('art') || categoryLower.includes('antique') || categoryLower.includes('collectible') ||
        categoryLower.includes('memorabilia') || categoryLower.includes('vintage') || categoryLower.includes('souvenir')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Small picture frame - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -10 L0 -15 L8 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Paint brush - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -8 L0 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -8 L0 -11 L2 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 4 L1 4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Palette - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M-6 -4 Q-4 -6 0 -6 Q4 -6 6 -4 L4 4 Q0 6 -4 4 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-3" cy="-3" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="-3" r="1" fill="white" opacity="0.8"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Picture frame - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-20" y="-25" width="40" height="50" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-20 -25 L0 -35 L20 -25" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="-15" y="-20" width="30" height="40" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -15 L8 -15" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 0 L8 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 15 L8 15" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Vintage camera - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-5" y="-6" width="10" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="1.5" fill="white" opacity="0.8"/>
            <path d="M4 -6 L5 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Old lamp - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M0 -8 L0 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-6" rx="4" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -6 Q-2 -8 0 -6 Q2 -8 4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-5" r="1" fill="white" opacity="0.8"/>
            <path d="M-1.5 4 L1.5 4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Trophy - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <circle cx="0" cy="-5" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-3" y="-1" width="6" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="7" width="8" height="1.5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Old lamp (antique) - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -15 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-12" rx="8" ry="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -12 Q-4 -16 0 -12 Q4 -16 8 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-10" r="2" fill="white" opacity="0.8"/>
            <path d="M-3 8 L3 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Vintage car - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-12" y="-4" width="24" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-12 -4 Q-4 -8 4 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-8" y="0" width="6" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="2" y="0" width="6" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="-6" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="6" cy="8" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Gramophone - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <ellipse cx="0" cy="-8" rx="12" ry="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-12 -8 L-8 0 L8 0 L12 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-4" y="0" width="8" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="-8" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Paint brush - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <path d="M0 -15 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -15 L0 -20 L3 -15" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 8 L2 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Palette - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-10 -6 Q-6 -10 0 -10 Q6 -10 10 -6 L8 6 Q0 10 -8 6 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-5" cy="-5" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="5" cy="-5" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Vintage camera - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-8" y="-10" width="16" height="14" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="2" fill="white" opacity="0.8"/>
            <path d="M6 -10 L8 -12" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Sculpture - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="-8" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-3" y="-3" width="6" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="7" width="8" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Trophy - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="0" cy="-6" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-5" y="-1" width="10" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="9" width="12" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Old clock - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -8 L0 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L4 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.6"/>
          </g>
        </svg>
      );
    }
    
    // Sports, Outdoor, Fitness, Gym
    if (categoryLower.includes('sports') || categoryLower.includes('outdoor') || categoryLower.includes('fitness') ||
        categoryLower.includes('gym') || categoryLower.includes('garden')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Dumbbell - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-4" y="-2" width="8" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="-3" width="4" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="2" y="-3" width="4" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Basketball - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -6 L0 6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -4 Q0 -2 4 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Tennis racket - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L-6 9" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M6 0 L6 9" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 1 L5 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 -1 L5 -1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Ball - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <circle cx="0" cy="0" r="15" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-15 0 L15 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -15 L0 15" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-10 -10 Q0 -5 10 -10" stroke="white" strokeWidth="1" fill="none" opacity="0.7"/>
          </g>
          
          {/* Trophy - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <circle cx="0" cy="-5" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="-1" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-5" y="9" width="10" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -5 L-5 -7 M4 -5 L5 -7" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Water bottle - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <rect x="-2" y="-8" width="4" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -8 Q0 -9 2 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -5 L1 -5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Running shoe - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <path d="M-6 3 Q-4 0 -2 -1 Q0 -2 2 -1 Q4 0 6 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 1 L4 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 4 L-5 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Dumbbell - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <rect x="-6" y="-3" width="12" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-10" y="-5" width="6" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="4" y="-5" width="6" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Basketball - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="9" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-9 0 L9 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -9 L0 9" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 -6 Q0 -3 6 -6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Trophy - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <circle cx="0" cy="-8" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-5" y="-1" width="10" height="13" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="12" width="12" height="2.5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -8 L-7 -10 M5 -8 L7 -10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Tennis racket - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 0 L-8 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M8 0 L8 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 1.5 L6 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 -1.5 L6 -1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Yoga mat - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-10" y="-2" width="20" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -2 L-8 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -2 L0 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M8 -2 L8 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Running shoe - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <path d="M-10 4 Q-6 0 -3 -2 Q0 -4 3 -2 Q6 0 10 4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 2 L6 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 5 L-8 7" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Water bottle - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <rect x="-3" y="-12" width="6" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -12 Q0 -14 3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -8 L1 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Jump rope - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <path d="M-8 -8 Q0 0 8 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-8" cy="-8" r="2" fill="white" opacity="0.8"/>
            <circle cx="8" cy="-8" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Garden tools - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <path d="M0 -10 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -10 L0 -14 L3 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 6 L2 6" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Entertainment, Events, Wedding, Media
    if (categoryLower.includes('entertainment') || categoryLower.includes('event') || categoryLower.includes('wedding') ||
        categoryLower.includes('media') || categoryLower.includes('musical')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Music note - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 6 L0 15" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 15 Q3 13 6 15" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Party hat - top left center */}
          <g transform="translate(120, 50)" opacity="0.6">
            <path d="M-5 5 L0 -6 L5 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="5" rx="5" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Confetti - top center left */}
          <g transform="translate(180, 45)" opacity="0.5">
            <path d="M-2 -2 L2 2 M2 -2 L-2 2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white"/>
          </g>
          
          {/* Stage - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-20" y="-8" width="40" height="16" rx="1" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-20 -8 L-15 -15 L15 -15 L20 -8" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-15 -15 L-15 -12 L15 -12 L15 -15" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Balloon - top center right */}
          <g transform="translate(220, 45)" opacity="0.5">
            <path d="M0 -8 Q-3 -10 -3 -5 Q-3 -1 0 0 Q3 -1 3 -5 Q3 -10 0 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L0 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Microphone - top right center */}
          <g transform="translate(280, 50)" opacity="0.6">
            <rect x="-2" y="-10" width="4" height="15" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 5 Q0 6 4 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -10 L-3 -12 L3 -12 L2 -10" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Camera - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-6" y="-8" width="12" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="2" fill="white" opacity="0.8"/>
            <path d="M4 -8 L5 -10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Food plate - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="12" ry="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-6" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-6" r="4" fill="white" opacity="0.6"/>
          </g>
          
          {/* Drinks glass - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M-4 -12 L-4 8 L4 8 L4 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -12 Q0 -15 4 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -8 L2 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Microphone - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-3" y="-15" width="6" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 5 Q0 8 6 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -15 L-5 -18 L5 -18 L3 -15" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Music note - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 8 L0 20" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 20 Q4 18 8 20" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Camera - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="2.5" fill="white" opacity="0.8"/>
            <path d="M6 -10 L8 -12" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Party hat - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <path d="M-6 6 L0 -8 L6 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="6" rx="6" ry="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Confetti - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white"/>
          </g>
          
          {/* Balloon - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <path d="M0 -10 Q-4 -12 -4 -6 Q-4 -2 0 0 Q4 -2 4 -6 Q4 -12 0 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L0 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Cake - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-8" y="-8" width="16" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-6" y="-12" width="12" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-3" cy="-9" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="-9" r="1" fill="white" opacity="0.8"/>
            <circle cx="0" cy="-11" r="1" fill="white" opacity="0.8"/>
          </g>
        </svg>
      );
    }
    
    // Pets, Animals, Baby & Kids, Childcare
    if (categoryLower.includes('pet') || categoryLower.includes('animal') || categoryLower.includes('baby') ||
        categoryLower.includes('kid') || categoryLower.includes('childcare') || categoryLower.includes('family')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          {/* Heart shape outline - items arranged within */}
          {/* Top left - Jack Russell Terrier face */}
          <circle cx="120" cy="80" r="20" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="115" cy="75" r="3" fill="white"/>
          <circle cx="125" cy="75" r="3" fill="white"/>
          <path d="M 115 90 Q 120 95, 125 90" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 105 70 L 110 65 M 130 65 L 135 70" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 100 85 Q 120 80, 140 85" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Top right - Labrador face with tongue */}
          <circle cx="280" cy="80" r="22" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="275" cy="75" r="3" fill="white"/>
          <circle cx="285" cy="75" r="3" fill="white"/>
          <path d="M 270 90 Q 280 95, 290 90" stroke="white" strokeWidth="2.5" fill="none"/>
          <ellipse cx="285" cy="88" rx="2" ry="3" fill="white"/>
          <path d="M 295 70 L 300 65 M 305 70 L 310 65" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Lower right - Pug face with wrinkles */}
          <circle cx="300" cy="200" r="18" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 290 195 Q 300 190, 310 195" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="295" cy="195" r="2.5" fill="white"/>
          <circle cx="305" cy="195" r="2.5" fill="white"/>
          <path d="M 295 210 Q 300 215, 305 210" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 290 200 Q 300 198, 310 200" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 290 205 Q 300 203, 310 205" stroke="white" strokeWidth="1.5" fill="none"/>
          
          {/* Food bag - top left, overflowing with kibble */}
          <path d="M 50 50 L 50 120 L 100 120 L 100 50 Z" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 50 50 L 75 30 L 100 50" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 60 70 L 90 70" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="70" cy="85" r="3" fill="white"/>
          <circle cx="65" cy="90" r="2" fill="white"/>
          <circle cx="75" cy="90" r="2" fill="white"/>
          <circle cx="68" cy="95" r="2" fill="white"/>
          <circle cx="72" cy="95" r="2" fill="white"/>
          <circle cx="70" cy="100" r="2" fill="white"/>
          <circle cx="65" cy="105" r="2" fill="white"/>
          <circle cx="75" cy="105" r="2" fill="white"/>
          
          {/* Double food bowl - lower left */}
          <ellipse cx="100" cy="240" rx="30" ry="10" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 70 240 L 130 240" stroke="white" strokeWidth="2.5" fill="none"/>
          <ellipse cx="85" cy="240" rx="20" ry="7" stroke="white" strokeWidth="2" fill="none"/>
          <ellipse cx="115" cy="240" rx="20" ry="7" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="80" cy="235" r="2" fill="white"/>
          <circle cx="90" cy="235" r="2" fill="white"/>
          <circle cx="110" cy="235" r="2" fill="white"/>
          <circle cx="120" cy="235" r="2" fill="white"/>
          
          {/* Large cartoon bone - center bottom */}
          <ellipse cx="200" cy="250" rx="20" ry="6" stroke="white" strokeWidth="3.5" fill="none"/>
          <circle cx="180" cy="250" r="5" fill="white"/>
          <circle cx="220" cy="250" r="5" fill="white"/>
          <path d="M 185 250 L 215 250" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Grooming brush - upper left */}
          <rect x="60" y="130" width="25" height="8" rx="2" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 60 130 L 85 130" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 65 125 L 65 138" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 70 125 L 70 138" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 75 125 L 75 138" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 80 125 L 80 138" stroke="white" strokeWidth="1.5" fill="none"/>
          
          {/* Syringe - lower left */}
          <path d="M 50 200 L 50 240" stroke="white" strokeWidth="2.5" fill="none"/>
          <rect x="45" y="200" width="10" height="15" rx="1" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 47 205 L 53 205" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 47 210 L 53 210" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 47 215 L 53 215" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 50 240 L 45 245 L 55 245 Z" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* First aid kit - upper right */}
          <rect x="320" y="50" width="50" height="40" rx="3" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 320 50 L 370 50" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 345 50 L 345 90" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 335 70 L 355 70" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 335 60 L 355 60" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 335 80 L 355 80" stroke="white" strokeWidth="2.5" fill="none"/>
          
          {/* Dog house - center */}
          <rect x="150" y="120" width="100" height="70" rx="3" stroke="white" strokeWidth="3.5" fill="none"/>
          <path d="M 140 120 L 200 80 L 260 120" stroke="white" strokeWidth="3.5" fill="none"/>
          <ellipse cx="200" cy="100" rx="10" ry="8" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 190 150 L 190 190 L 210 190 L 210 150" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 195 100 Q 200 95, 205 100" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Pet carrier bag - lower right */}
          <path d="M 320 200 Q 340 190, 360 200 L 360 240 Q 340 250, 320 240 Z" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 330 200 L 330 240" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 350 200 L 350 240" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 320 220 L 360 220" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 340 200 L 340 190" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 335 190 L 345 190" stroke="white" strokeWidth="2.5" fill="none"/>
          
          {/* Bow tie - upper left */}
          <path d="M 100 60 L 110 65 L 100 70 Z" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 110 60 L 120 65 L 110 70 Z" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="110" cy="65" r="2" fill="white"/>
          
          {/* Small ball - lower right */}
          <circle cx="330" cy="220" r="10" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 320 220 L 340 220" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 330 210 L 330 230" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* V-shaped stick/chew toy - lower middle */}
          <path d="M 180 230 L 200 250 L 220 230" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 185 235 L 195 245" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 205 235 L 215 245" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Slipper - upper right */}
          <path d="M 300 100 Q 310 95, 320 100 L 325 120 Q 320 125, 315 120 L 310 110 Q 305 105, 300 110 Z" 
                stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 305 105 L 315 105" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Dog whistle - mid left */}
          <path d="M 80 150 L 100 150" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="80" cy="150" r="3" fill="white"/>
          <path d="M 100 150 L 105 145 L 105 155 Z" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Retractable leash - lower left */}
          <circle cx="70" cy="200" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="70" cy="200" r="4" fill="white"/>
          <path d="M 70 200 Q 90 210, 110 220" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="3,3"/>
          
          {/* Dog collar with leash - upper right */}
          <ellipse cx="250" cy="120" rx="15" ry="6" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="245" cy="120" r="2" fill="white"/>
          <circle cx="250" cy="120" r="2" fill="white"/>
          <circle cx="255" cy="120" r="2" fill="white"/>
          <path d="M 265 120 L 280 110" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="280" cy="110" r="4" stroke="white" strokeWidth="2" fill="none"/>
          
          {/* Rosette award ribbon - upper right */}
          <circle cx="340" cy="100" r="15" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M 325 100 L 340 85 L 355 100" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 325 100 L 340 115 L 355 100" stroke="white" strokeWidth="2.5" fill="none"/>
          <path d="M 330 90 L 350 90" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 330 110 L 350 110" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="340" cy="100" r="5" fill="white"/>
          <path d="M 337 100 L 343 100" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 340 97 L 340 103" stroke="white" strokeWidth="1.5" fill="none"/>
          
          {/* Paw prints scattered */}
          <circle cx="90" cy="180" r="4" fill="white"/>
          <circle cx="85" cy="185" r="3" fill="white"/>
          <circle cx="95" cy="185" r="3" fill="white"/>
          <circle cx="88" cy="190" r="2.5" fill="white"/>
          <circle cx="92" cy="190" r="2.5" fill="white"/>
          
          <circle cx="350" cy="150" r="4" fill="white"/>
          <circle cx="345" cy="155" r="3" fill="white"/>
          <circle cx="355" cy="155" r="3" fill="white"/>
          <circle cx="348" cy="160" r="2.5" fill="white"/>
          <circle cx="352" cy="160" r="2.5" fill="white"/>
          
          <circle cx="150" cy="250" r="4" fill="white"/>
          <circle cx="145" cy="255" r="3" fill="white"/>
          <circle cx="155" cy="255" r="3" fill="white"/>
          <circle cx="148" cy="260" r="2.5" fill="white"/>
          <circle cx="152" cy="260" r="2.5" fill="white"/>
          
          {/* Decorative dots and circles */}
          <circle cx="110" cy="110" r="2" fill="white"/>
          <circle cx="130" cy="100" r="2" fill="white"/>
          <circle cx="270" cy="120" r="2" fill="white"/>
          <circle cx="290" cy="130" r="2" fill="white"/>
          <circle cx="160" cy="200" r="2" fill="white"/>
          <circle cx="240" cy="200" r="2" fill="white"/>
          
          {/* Wavy lines */}
          <path d="M 140 60 Q 145 65, 150 60" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 250 60 Q 255 65, 260 60" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M 170 230 Q 175 235, 180 230" stroke="white" strokeWidth="1.5" fill="none"/>
          
          {/* Starburst - upper middle */}
          <path d="M 200 50 L 205 60 M 200 50 L 195 60 M 200 50 L 200 40 M 200 50 L 200 60" 
                stroke="white" strokeWidth="2" fill="none"/>
          <path d="M 200 50 L 210 55 M 200 50 L 190 55 M 200 50 L 210 45 M 200 50 L 190 45" 
                stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      );
    }
    
    // Business, Professional Services, Legal, Financial, Insurance, Marketing
    if (categoryLower.includes('business') || categoryLower.includes('professional') || categoryLower.includes('legal') ||
        categoryLower.includes('financial') || categoryLower.includes('insurance') || categoryLower.includes('marketing') ||
        categoryLower.includes('advertising') || categoryLower.includes('office')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Document - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -7 L6 -7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -1 L4 -1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 2 L4 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Chart - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-7" y="-7" width="14" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 4 L-2 2 L0 4 L2 1 L4 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 4 L-4 7" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 4 L0 7" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M4 3 L4 7" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Dollar sign - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -7 L0 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -3 L4 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 3 L4 3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Briefcase - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-18" y="-12" width="36" height="24" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-18 -12 L18 -12" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-12 -6 L12 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-12 0 L12 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Pen - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <path d="M0 -8 L0 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -8 L0 -11 L1 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-0.5 5 L0.5 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Handshake - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="-3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 2 L-1 3 L1 3 L3 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Credit card - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-6" y="-3" width="12" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -1 L4 -1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 1 L2 1" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="2" r="0.8" fill="white" opacity="0.8"/>
          </g>
          
          {/* Document - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -10 L8 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 -6 L5 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 -2 L5 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 2 L5 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Chart - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-10" y="-10" width="20" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 6 L-3 3 L0 6 L3 2 L6 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 6 L-6 10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 6 L0 10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 5 L6 10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Dollar sign - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -10 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 -5 L5 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 5 L5 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Contract - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-6" y="-10" width="12" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -2 L3 -2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="4" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Pen - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M0 -12 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -12 L0 -15 L2 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 8 L1 8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Calculator - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="-6" width="8" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 -3 L2 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Handshake - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="-4" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 3 L-1 5 L1 5 L4 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Credit card - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-8" y="-5" width="16" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -3 L6 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Clipboard - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="-10" width="2" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 0 L4 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Jobs, Employment
    if (categoryLower.includes('job') || categoryLower.includes('employment')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Resume - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-6" y="-7" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -7 L6 -7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 -1 L4 -1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 2 L4 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Briefcase - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-8" y="-6" width="16" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -6 L8 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 -3 L5 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-5 0 L5 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Clock - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -7 L0 -3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L4 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Person - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <circle cx="0" cy="0" r="12" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="-3" cy="-2" r="1.5" fill="white"/>
            <circle cx="3" cy="-2" r="1.5" fill="white"/>
            <path d="M-2 3 Q0 4 2 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 12 L0 20" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-8 20 L8 20" stroke="white" strokeWidth="2" fill="none"/>
          </g>
          
          {/* ID badge - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-5" y="-7" width="10" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-2" r="2" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 4 L2 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Star award - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M0 -6 L1.5 -1.5 L6 -1.5 L2 1 L3 6 L0 3 L-3 6 L-2 1 L-6 -1.5 L-1.5 -1.5 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Handshake - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <circle cx="-2.5" cy="0" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="2.5" cy="0" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2.5 2 L-1 2.5 L1 2.5 L2.5 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Resume - left */}
          <g transform="translate(120, 150)" opacity="0.6">
            <rect x="-10" y="-12" width="20" height="24" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-10 -12 L10 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 -4 L6 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Briefcase - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-15" y="-10" width="30" height="20" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-15 -10 L15 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-10 -5 L10 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-10 0 L10 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Clock - right */}
          <g transform="translate(280, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -10 L0 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L5 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* ID badge - bottom left */}
          <g transform="translate(100, 240)" opacity="0.5">
            <rect x="-8" y="-10" width="16" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="3" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-4 5 L4 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Star award - bottom right */}
          <g transform="translate(300, 240)" opacity="0.5">
            <path d="M0 -8 L2 -2 L8 -2 L3 1 L5 7 L0 4 L-5 7 L-3 1 L-8 -2 L-2 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
        </svg>
      );
    }
    
    // Travel, Tourism
    if (categoryLower.includes('travel') || categoryLower.includes('tourism') || categoryLower === 'travel-tourism') {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Suitcase - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-7" y="-6" width="14" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-7 -6 L7 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-5" y="-4" width="4" height="5" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="1" y="-4" width="4" height="5" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="0" cy="-2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Ship - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M-8 3 Q-3 0 3 3 L3 9 Q-3 12 -8 9 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 3 L-5 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 3 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-2" cy="6" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Location pin - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M0 -7 L-5 0 L0 5 L5 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Airplane - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <path d="M-20 0 L20 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 -15 L0 15" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-12 -5 L0 0 L12 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="2" fill="white"/>
          </g>
          
          {/* Map - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-8" y="-7" width="16" height="14" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -4 L6 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 4 L6 4" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="-2" cy="-2" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Compass - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -6 L0 6 M-6 0 L6 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
            <path d="M0 -6 L0 -3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Hotel key - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-2" y="-6" width="4" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-7" r="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-7" r="1" fill="white" opacity="0.8"/>
            <path d="M-1 -3 L1 -3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Suitcase - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <rect x="-10" y="-8" width="20" height="18" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-10 -8 L10 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-5" width="5" height="6" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="1" y="-5" width="5" height="6" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="0" cy="-2" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Ship - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M-12 4 Q-4 0 4 4 L4 12 Q-4 16 -12 12 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 4 L-6 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 4 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-3" cy="7" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Location pin - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M0 -10 L-6 0 L0 6 L6 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Train - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-10" y="-4" width="20" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-10" y="-8" width="12" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-5" cy="10" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="5" cy="10" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-8" y="-6" width="4" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Hotel key - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-3" y="-8" width="6" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-10" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-10" r="1.5" fill="white" opacity="0.8"/>
            <path d="M-1 -4 L1 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Map - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-12" y="-10" width="24" height="20" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -6 L8 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 0 L8 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-8 6 L8 6" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="-2" cy="-3" r="1.5" fill="white" opacity="0.8"/>
            <circle cx="4" cy="3" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Compass - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -8 L0 8 M-8 0 L8 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
            <path d="M0 -8 L0 -4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Camera - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
            <path d="M4 -8 L5 -10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Passport - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-4" r="2" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 4 L3 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Renewable Energy, Waste Management, Industrial, Raw Materials
    if (categoryLower.includes('renewable') || categoryLower.includes('energy') || categoryLower.includes('waste') ||
        categoryLower.includes('industrial') || categoryLower.includes('raw-material')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Wind turbine - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-6" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -8 L2 -4 M2 -8 L-2 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Battery - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <rect x="-4" y="-7" width="8" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-3" y="-6" width="6" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 -1 L2 -1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M3 -3 L4 -3 L4 3 L3 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Recycle symbol - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M-4 -4 L0 -6 L4 -4 L3 -2 L-3 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M4 4 L0 6 L-4 4 L-3 2 L3 2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 0 L-6 -2 L-4 -4 L-2 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Solar panel - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-18" y="-12" width="36" height="24" rx="1" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-18 -12 L18 -12" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-18 0 L18 0" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-18 12 L18 12" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-9 -6 L9 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-9 6 L9 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Factory - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-7" y="-6" width="14" height="12" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-7 -6 L0 -10 L7 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-5" y="-3" width="4" height="5" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="1" y="-3" width="4" height="5" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-1 3 L1 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Lightbulb - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="-5" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-2" y="-1" width="4" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -4 L1 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Cog/Gear - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="3" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -5 L0 5 M-5 0 L5 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Wind turbine - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-8" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -10 L3 -6 M3 -10 L-3 -6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Factory - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-10" y="-8" width="20" height="18" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-10 -8 L0 -14 L10 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-4" width="5" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <rect x="1" y="-4" width="5" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-1 4 L1 4" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Battery - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-6" y="-10" width="12" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-4" y="-8" width="8" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M-2 -6 L2 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 -2 L2 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M4 -5 L5 -5 L5 5 L4 5" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Recycle symbol - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <path d="M-6 -6 L0 -9 L6 -6 L4 -3 L-4 -3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M6 6 L0 9 L-6 6 L-4 3 L4 3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L-9 -3 L-6 -6 L-3 -3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Oil barrel - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-6" y="-10" width="12" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 10 L6 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 6 L3 6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Recycle bin - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-6" y="-10" width="12" height="20" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -6 L4 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -2 L3 -2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="2" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Lightbulb - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="-6" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-2" y="-1" width="4" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -5 L1 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -3 L1 -3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Cog/Gear - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -6 L0 6 M-6 0 L6 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Power plug - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-4" y="-6" width="8" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -6 L4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="-2" width="2" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-1" y="2" width="2" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
        </svg>
      );
    }
    
    // Security, Safety
    if (categoryLower.includes('security') || categoryLower.includes('safety')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Lock - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <rect x="-4" y="-4" width="8" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -4 Q-2 -6 0 -4 Q2 -6 4 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="2" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Key - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="3.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="0" y="-1" width="7" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M5 -1 L5 1" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M4 0 L7 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Camera - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <rect x="-4" y="-6" width="8" height="7" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-3" r="1.5" fill="white" opacity="0.8"/>
            <path d="M3 -6 L4 -8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Shield - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <path d="M0 -15 Q-8 -15 -10 -5 L-10 10 Q-10 20 0 25 Q10 20 10 10 L10 -5 Q8 -15 0 -15" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="-6" y="-5" width="12" height="15" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="2" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Padlock - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-3" y="-3" width="6" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -3 Q-1.5 -5 0 -3 Q1.5 -5 3 -3" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="2" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Alarm - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="3" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -5 L0 -9" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-11" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Safety helmet - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <path d="M-5 -7 Q0 -10 5 -7 L5 0 Q5 3 0 3 Q-5 3 -5 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -5 L3 -5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Lock - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <rect x="-6" y="-6" width="12" height="18" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -6 Q-3 -9 0 -6 Q3 -9 6 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="3" r="3" fill="white" opacity="0.8"/>
          </g>
          
          {/* Key - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="0" y="-1.5" width="10" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M6 -1.5 L6 1.5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M5 0 L9 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Camera - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-6" y="-8" width="12" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
            <path d="M4 -8 L5 -10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Fingerprint - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="8" ry="12" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -8 Q-2 -6 0 -8 Q2 -10 4 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -4 Q-1 -2 0 -4 Q1 -6 3 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 Q0 2 2 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 4 Q0 6 2 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Padlock - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <rect x="-5" y="-5" width="10" height="15" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -5 Q-2 -8 0 -5 Q2 -8 5 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="2" r="3" fill="white" opacity="0.8"/>
          </g>
          
          {/* Alarm - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -6 L0 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-12" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Safety helmet - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <path d="M-6 -8 Q0 -12 6 -8 L6 0 Q6 4 0 4 Q-6 4 -6 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -3 L1 -3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Security badge - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -5 L-3 0 L0 5 L3 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Fire extinguisher - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-3" y="-10" width="6" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -10 Q0 -12 3 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -6 L1 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -2 L1 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 8 L2 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Government, Public, Non-Profit, Charity
    if (categoryLower.includes('government') || categoryLower.includes('public') || categoryLower.includes('non-profit') ||
        categoryLower.includes('charity')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Flag - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="0" y="-8" width="8" height="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M1 -6 L6 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M1 -4 L6 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Scales of justice - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -7 L0 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 0 L5 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-4" cy="-5" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="-5" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Heart - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M0 -4 Q-3 -4 -4 -2 Q-4 0 0 4 Q4 0 4 -2 Q3 -4 0 -4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Building - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-20" y="-15" width="40" height="30" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-20 -15 L0 -30 L20 -15" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="-12" y="-8" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="4" y="-8" width="8" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Document - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-5" y="-7" width="10" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -7 L5 -7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -4 L3 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -1 L3 -1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Gavel - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M0 -7 L0 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-4" y="-9" width="8" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -9 L2 -9" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="3" width="2" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Certificate - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-5" y="-6" width="10" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -6 L5 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -3 L3 -3" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M0 -1.5 L0 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1.5 0 L1.5 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Flag - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="0" y="-12" width="10" height="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M1 -10 L7 -10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M1 -7 L7 -7" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Scales of justice - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M0 -10 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 0 L6 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-5" cy="-6" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="5" cy="-6" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Heart - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M0 -6 Q-5 -6 -7 -3 Q-7 0 0 6 Q7 0 7 -3 Q5 -6 0 -6" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Document with seal - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-6" y="-10" width="12" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -10 L6 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -6 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 -2 L3 -2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="4" r="2.5" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M0 2 L0 6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 4 L2 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Gavel - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M0 -10 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-6" y="-12" width="12" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -12 L3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-2" y="6" width="4" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Document - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -4 L3 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Hand helping - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <ellipse cx="0" cy="0" rx="6" ry="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -6 L-1 -8 L0 -6 L1 -8 L3 -6" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Donation box - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <ellipse cx="0" cy="-6" rx="3" ry="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Certificate - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-7" y="-8" width="14" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-7 -8 L7 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="0" r="2" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M0 -2 L0 2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Tools, Equipment, Appliances, Repair Services
    if (categoryLower.includes('tool') || categoryLower.includes('equipment') || categoryLower.includes('appliance') ||
        categoryLower.includes('repair')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Screwdriver - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1.5 -8 L0 -11 L1.5 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1" y="5" width="2" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Hammer - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -7 L0 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-4" y="-11" width="8" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -9 L2 -9" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Gear - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4.5" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -7 L0 7 M-7 0 L7 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="2" fill="white" opacity="0.8"/>
          </g>
          
          {/* Wrench - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <path d="M-10 -6 L10 -6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M0 -6 L0 12" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Drill - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-2" y="-6" width="4" height="11" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-7" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -4 L1 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -1 L1 -1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pliers - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M-3 -5 L-3 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M3 -5 L3 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -5 Q0 -2 3 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 5 Q0 2 3 5" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Measuring tape - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-7" y="-1" width="14" height="2" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -1 L-5 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1 L0 1" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M5 -1 L5 1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Screwdriver - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -12 L0 -16 L2 -12" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-1.5" y="6" width="3" height="6" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Hammer - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M0 -10 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-5" y="-14" width="10" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -12 L3 -12" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Gear - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -10 L0 10 M-10 0 L10 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Drill - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-3" y="-10" width="6" height="18" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="-12" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1 -8 L1 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 -4 L1 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Pliers - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-4 -8 L-4 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M4 -8 L4 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -8 Q0 -4 4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 8 Q0 4 4 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Measuring tape - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-10" y="-1.5" width="20" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -1.5 L-8 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M0 -1.5 L0 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M8 -1.5 L8 1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Toolbox - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <rect x="-8" y="-6" width="16" height="14" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -6 L8 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -2 L4 -2" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="-1" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Saw - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-0.5" y="-8" width="1" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M-4 -6 L4 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Level - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-8" y="-1.5" width="16" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
            <path d="M-6 -1.5 L-6 1.5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M6 -1.5 L6 1.5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Cleaning Services
    if (categoryLower.includes('cleaning')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Broom - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 6 L5 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 8 L4 8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 10 L3 10" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Mop - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -7 L0 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-3" y="5" width="6" height="3" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 7 L2 7" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 9 L1 9" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Water drop - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <path d="M0 -6 Q-3 -5 -3 -1 Q-3 2 0 6 Q3 2 3 -1 Q3 -5 0 -6" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Spray bottle - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-10" y="-20" width="20" height="35" rx="2" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-6 -20 L6 -20" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-6 -20 L-6 -25" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="0" cy="-27" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -27 L0 -30" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Vacuum - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="6" ry="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L-6 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M6 0 L6 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 8 L6 8" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Bucket - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M-4 -6 L-4 5 L4 5 L4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -6 Q0 -7 4 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -4 L3 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Sponge - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-5" y="-4" width="10" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-2" cy="-1" r="0.8" fill="white" opacity="0.8"/>
            <circle cx="2" cy="-1" r="0.8" fill="white" opacity="0.8"/>
            <circle cx="-2" cy="1" r="0.8" fill="white" opacity="0.8"/>
            <circle cx="2" cy="1" r="0.8" fill="white" opacity="0.8"/>
          </g>
          
          {/* Broom - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -12 L0 12" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 8 L6 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 10 L5 10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-4 12 L4 12" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Mop - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M0 -10 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-4" y="8" width="8" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 10 L3 10" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 12 L2 12" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Water drop - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M0 -8 Q-4 -6 -4 -2 Q-4 2 0 8 Q4 2 4 -2 Q4 -6 0 -8" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Vacuum - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 0 L-8 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M8 0 L8 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-8 10 L8 10" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Bucket - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-6 -8 L-6 8 L6 8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -8 Q0 -10 6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -4 L4 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-3 0 L3 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Sponge - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-6" y="-5" width="12" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-3" cy="-2" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="-2" r="1" fill="white" opacity="0.8"/>
            <circle cx="-3" cy="2" r="1" fill="white" opacity="0.8"/>
            <circle cx="3" cy="2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Gloves - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <ellipse cx="-3" cy="0" rx="3" ry="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="3" cy="0" rx="3" ry="6" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Detergent bottle - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-4" y="-8" width="8" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -8 Q0 -10 4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Duster - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <path d="M0 -8 L0 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-3" y="4" width="6" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 6 L2 6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 8 L1 8" stroke="white" strokeWidth="1" fill="none"/>
          </g>
        </svg>
      );
    }
    
    // Thrift, Second-hand
    if (categoryLower.includes('thrift')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Tag - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M-5 -4 L5 -4 L5 4 L-5 4 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -4 L-2 -7 L2 -7 L5 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Recycle symbol - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M-5 -5 L0 -7 L5 -5 L4 -2 L-4 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M5 5 L0 7 L-5 5 L-4 2 L4 2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 0 L-7 -2 L-5 -5 L-2 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Price tag - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <rect x="-5" y="-4" width="10" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -4 L-2 -7 L2 -7 L5 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-1 -1 L1 -1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Box - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <rect x="-18" y="-18" width="36" height="36" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M-18 -18 L-6 -30 L12 -30 L18 -18" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-6 -30 L-6 -12" stroke="white" strokeWidth="2" fill="none"/>
          </g>
          
          {/* Shopping bag - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <rect x="-5" y="-6" width="10" height="12" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -6 L-2 -9 L2 -9 L5 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -3 L2 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Discount badge - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <circle cx="0" cy="0" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-2 -2 L2 2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M2 -2 L-2 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Used item - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-4" y="-4" width="8" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -4 L4 4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M4 -4 L-4 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Tag - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M-6 -6 L6 -6 L6 6 L-6 6 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -6 L-3 -9 L3 -9 L6 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Recycle symbol - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M-6 -6 L0 -9 L6 -6 L4 -3 L-4 -3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M6 6 L0 9 L-6 6 L-4 3 L4 3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 0 L-9 -3 L-6 -6 L-3 -3 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Price tag - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <rect x="-6" y="-5" width="12" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -5 L-3 -8 L3 -8 L6 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -1 L2 -1" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Shopping bag - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <rect x="-6" y="-8" width="12" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L-3 -12 L3 -12 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 0 L2 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Discount badge - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -3 L3 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M3 -3 L-3 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Vintage item - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Second-hand badge - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -3 L3 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M3 -3 L-3 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Used item - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-5" y="-5" width="10" height="10" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -5 L5 5" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M5 -5 L-5 5" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Bargain tag - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <path d="M-4 -4 L4 -4 L4 4 L-4 4 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 -4 L0 -7 L4 -4" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
        </svg>
      );
    }
    
    // Agriculture, Farming
    if (categoryLower.includes('agriculture') || categoryLower.includes('farming')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Plant - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <path d="M0 -18 L0 8" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M0 -8 Q-5 -6 -5 -2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -4 Q5 -2 5 2" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 Q-7 2 -7 7" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 4 Q7 6 7 11" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Tractor wheel - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.7"/>
            <path d="M0 -10 L0 10 M-10 0 L10 0" stroke="white" strokeWidth="1" opacity="0.6"/>
            <circle cx="0" cy="0" r="2.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Seed packet - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <rect x="-8" y="-10" width="16" height="20" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-8 -10 L8 -10" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="2.5" fill="white" opacity="0.8"/>
            <path d="M-3 4 L3 4" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Shovel - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <path d="M0 -12 L0 10" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-3 -12 L3 -12 L1.5 -9 L-1.5 -9 Z" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1.5 6 L1.5 6" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Hoe - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <path d="M0 -10 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L8 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <rect x="6" y="-2" width="4" height="4" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Watering can - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-4 -8 L-4 6 L4 6 L4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -8 Q0 -10 4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -4 L2 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-6 -6 L-4 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="-5" cy="-7" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Corn - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-1.5" y="-8" width="3" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-1.5 -8 Q0 -9 1.5 -8" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1.5 -4 Q0 -5 1.5 -4" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1.5 0 Q0 -1 1.5 0" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Barn - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <rect x="-6" y="-6" width="12" height="14" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -6 L0 -12 L6 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="-3" y="-1" width="6" height="5" rx="0.5" fill="none" stroke="white" strokeWidth="1"/>
          </g>
          
          {/* Wheat - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <path d="M0 -8 L0 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-2 -6 L2 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1.5 -3 L1.5 -3" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-1 0 L1 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="-1" cy="-4" r="1" fill="white" opacity="0.8"/>
            <circle cx="1" cy="-2" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Tractor - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <rect x="-8" y="-3" width="16" height="8" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <rect x="-8" y="-6" width="10" height="5" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-4" cy="8" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="8" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
        </svg>
      );
    }
    
    // Personal, Service (generic)
    if (categoryLower.includes('personal') || categoryLower.includes('service')) {
      return (
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top section icons - distributed across top */}
          {/* Heart - top left */}
          <g transform="translate(60, 40)" opacity="0.6">
            <path d="M0 -4 Q-2.5 -4 -3 -2 Q-3 0 0 4 Q3 0 3 -2 Q2.5 -4 0 -4" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Star - top left center */}
          <g transform="translate(120, 45)" opacity="0.6">
            <path d="M0 -6 L1.5 -1.5 L6 -1.5 L2 1 L3 6 L0 3 L-3 6 L-2 1 L-6 -1.5 L-1.5 -1.5 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Handshake - top center left */}
          <g transform="translate(180, 50)" opacity="0.6">
            <circle cx="-3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="3" cy="0" r="2.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 2 L-1 3 L1 3 L3 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Person - top center */}
          <g transform="translate(200, 80)" opacity="0.7">
            <circle cx="0" cy="0" r="12" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="-3" cy="-2" r="1.5" fill="white"/>
            <circle cx="3" cy="-2" r="1.5" fill="white"/>
            <path d="M-2 3 Q0 4 2 3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 12 L0 20" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M-8 20 L8 20" stroke="white" strokeWidth="2" fill="none"/>
          </g>
          
          {/* Smile - top center right */}
          <g transform="translate(220, 50)" opacity="0.6">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-1.5" cy="-1.5" r="0.8" fill="white" opacity="0.8"/>
            <circle cx="1.5" cy="-1.5" r="0.8" fill="white" opacity="0.8"/>
            <path d="M-2 1.5 Q0 2.5 2 1.5" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Phone call - top right center */}
          <g transform="translate(280, 45)" opacity="0.6">
            <path d="M-5 -5 Q-1.5 -6 0 -5 Q1.5 -6 5 -5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 5 Q-1.5 6 0 5 Q1.5 6 5 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-5 -5 L-5 5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M5 -5 L5 5" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Gift - top right */}
          <g transform="translate(340, 40)" opacity="0.6">
            <rect x="-5" y="-6" width="10" height="12" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-5 -6 L5 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -6 L0 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-3" r="1" fill="white" opacity="0.8"/>
          </g>
          
          {/* Heart - left */}
          <g transform="translate(100, 150)" opacity="0.6">
            <path d="M0 -5 Q-3 -5 -5 -2 Q-5 0 0 5 Q5 0 5 -2 Q3 -5 0 -5" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Star - left center */}
          <g transform="translate(150, 150)" opacity="0.6">
            <path d="M0 -8 L2 -2 L7 -2 L3 1 L5 6 L0 3 L-5 6 L-3 1 L-7 -2 L-2 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
          </g>
          
          {/* Handshake - center */}
          <g transform="translate(200, 150)" opacity="0.6">
            <circle cx="-4" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="4" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-4 3 L-1 5 L1 5 L4 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Smile - right center */}
          <g transform="translate(250, 150)" opacity="0.6">
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="-2" cy="-2" r="1" fill="white" opacity="0.8"/>
            <circle cx="2" cy="-2" r="1" fill="white" opacity="0.8"/>
            <path d="M-3 2 Q0 4 3 2" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Phone call - right */}
          <g transform="translate(300, 150)" opacity="0.6">
            <path d="M-6 -6 Q-2 -8 0 -6 Q2 -8 6 -6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 6 Q-2 8 0 6 Q2 8 6 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-6 -6 L-6 6" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M6 -6 L6 6" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Gift - bottom left */}
          <g transform="translate(80, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="16" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 -8 L0 8" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="-4" r="1.5" fill="white" opacity="0.8"/>
          </g>
          
          {/* Service badge - bottom center left */}
          <g transform="translate(140, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="white" strokeWidth="1.5" fill="none"/>
          </g>
          
          {/* Calendar - bottom center right */}
          <g transform="translate(260, 240)" opacity="0.5">
            <rect x="-6" y="-8" width="12" height="14" rx="0.5" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M-6 -8 L6 -8" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M-4 -6 L4 -6" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 -2 L2 -2" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M-2 2 L2 2" stroke="white" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Clock - bottom right */}
          <g transform="translate(320, 240)" opacity="0.5">
            <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M0 -6 L0 -3" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M0 0 L3 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
          </g>
        </svg>
      );
    }
    
    // Other/Default - Simple abstract design
    return (
      <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Circle - top center */}
        <g transform="translate(200, 80)" opacity="0.7">
          <circle cx="0" cy="0" r="15" fill="none" stroke="white" strokeWidth="2"/>
          <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7"/>
          <circle cx="0" cy="0" r="5" fill="white" opacity="0.8"/>
        </g>
        
        {/* Triangle - left */}
        <g transform="translate(120, 150)" opacity="0.6">
          <path d="M0 -10 L-8 10 L8 10 Z" fill="none" stroke="white" strokeWidth="1.5"/>
        </g>
        
        {/* Square - center */}
        <g transform="translate(200, 150)" opacity="0.6">
          <rect x="-12" y="-12" width="24" height="24" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M-8 -8 L8 8 M8 -8 L-8 8" stroke="white" strokeWidth="1" opacity="0.6"/>
        </g>
        
        {/* Hexagon - right */}
        <g transform="translate(280, 150)" opacity="0.6">
          <path d="M0 -10 L8 -5 L8 5 L0 10 L-8 5 L-8 -5 Z" fill="none" stroke="white" strokeWidth="1.5"/>
        </g>
        
        {/* Diamond - bottom left */}
        <g transform="translate(100, 240)" opacity="0.5">
          <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill="none" stroke="white" strokeWidth="1.5"/>
        </g>
        
        {/* Star - bottom right */}
        <g transform="translate(300, 240)" opacity="0.5">
          <path d="M0 -6 L2 -2 L6 -2 L3 1 L4 5 L0 3 L-4 5 L-3 1 L-6 -2 L-2 -2 Z" fill="none" stroke="white" strokeWidth="1.5"/>
        </g>
      </svg>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading enquiries" />;
  }

  return (
    <Layout>
      <div 
        className="flex flex-col flex-grow bg-white"
        style={{
          touchAction: 'pan-y pinch-zoom', // Allow vertical scroll but prevent double-tap zoom
          WebkitTextSizeAdjust: '100%', // Prevent text size adjustment that triggers zoom
          msTextSizeAdjust: '100%'
        }}
      >
        {/* Header - Matching Seller Form Background - Full Width - Dark High Depth Black */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8">
            {/* Spacer Section to Match Dashboard/Profile */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10"></div>
              </div>
            </div>
            
            {/* Live Enquiries Heading in Black Header */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2">
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 rounded-full bg-green-500 flex-shrink-0"></span>
                      Live Enquiries.
              </h1>
                  </div>
            
            {/* Content Card - Black Background */}
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-5">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    respect the tastebuds.
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>

        <div className="container mx-auto px-1 sm:px-4 py-4 sm:py-8">
          {/* Search and Filters */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-20 pointer-events-none" style={{ transform: 'translateY(-50%)' }} />
                <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchChange(searchTerm);
                    }
                  }}
                  onFocus={() => {
                    // Only show suggestions if not clicking a suggestion and not prevented
                    if (!isClickingSuggestionRef.current && !preventSuggestionsRef.current) {
                      setShowSuggestions(searchSuggestions.length > 0);
                    }
                  }}
                  onBlur={(e) => {
                    // Clear any existing timeout
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                    }
                    
                    // Check if the blur is caused by clicking on a suggestion
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    const isClickingDropdown = relatedTarget && suggestionsDropdownRef.current && 
                      suggestionsDropdownRef.current.contains(relatedTarget);
                    
                    // Only hide suggestions if not clicking a suggestion and not clicking dropdown
                    if (!isClickingSuggestionRef.current && !isClickingDropdown) {
                      blurTimeoutRef.current = setTimeout(() => {
                        // Double check before hiding
                        if (!isClickingSuggestionRef.current) {
                          setShowSuggestions(false);
                        }
                        blurTimeoutRef.current = null;
                      }, 150);
                    }
                  }}
                    className="w-full pl-11 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-3.5 text-sm sm:text-base border border-black rounded-xl sm:rounded-2xl focus:border-2 focus:border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 placeholder:text-xs sm:placeholder:text-sm placeholder-gray-400 text-left leading-tight sm:leading-normal relative z-10"
                  style={{ 
                    fontSize: '16px', // Prevents zoom on iOS
                    lineHeight: '1.5',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    paddingLeft: '2.75rem', // More space for icon on mobile
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    direction: 'ltr'
                  }}
                  disabled={isAISearching}
                />
                  {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl sm:rounded-2xl pointer-events-none z-0" />
                </div>
                {isAISearching ? (
                  <div className="absolute right-10 sm:right-12 top-1/2 z-10" style={{ transform: 'translateY(-50%)' }}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearchChange(searchTerm);
                    }}
                    className="absolute right-2 sm:right-3 top-1/2 z-50 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-center touch-manipulation cursor-pointer"
                    aria-label="Search"
                    style={{ 
                      pointerEvents: 'auto',
                      transform: 'translateY(-50%)',
                      top: '50%',
                      willChange: 'auto'
                    }}
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-black pointer-events-none" />
                  </button>
                )}
                
                {/* AI Search Suggestions Dropdown - Absolute with Layout Isolation */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div 
                    ref={suggestionsDropdownRef}
                    onMouseDown={(e) => {
                      // Prevent input blur when clicking anywhere in dropdown
                      e.preventDefault();
                      isClickingSuggestionRef.current = true;
                    }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    style={{
                      touchAction: 'pan-y',
                      transform: 'translateZ(0)',
                      WebkitTransform: 'translateZ(0)',
                      contain: 'layout style paint', // Isolate from page layout - prevents layout shifts
                      willChange: 'transform',
                      isolation: 'isolate' // Create new stacking context
                    }}
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onTouchStart={(e) => {
                          e.preventDefault();
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Mark that we're clicking a suggestion
                          isClickingSuggestionRef.current = true;
                          
                          // Blur input to prevent keyboard zoom
                          if (searchInputRef.current) {
                            searchInputRef.current.blur();
                          }
                          
                          // Execute click (viewport already locked by useEffect)
                          handleSuggestionClick(suggestion);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Mark that we're clicking a suggestion
                          isClickingSuggestionRef.current = true;
                          
                          if (searchInputRef.current) {
                            searchInputRef.current.blur();
                          }
                          handleSuggestionClick(suggestion);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 last:border-b-0 cursor-pointer"
                        style={{
                          touchAction: 'none',
                          fontSize: '16px',
                          WebkitAppearance: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          transform: 'translateZ(0)',
                          WebkitTransform: 'translateZ(0)',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                      >
                        <div className="flex items-center gap-2" style={{ pointerEvents: 'none' }}>
                          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Categories Box - Scrollable */}
              <div className="w-full" ref={categoryBoxRef}>
                <div className="bg-gray-200 border border-black rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 transition-all duration-300 relative overflow-hidden">
                      {/* Physical button depth effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl sm:rounded-2xl pointer-events-none z-0" />
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm md:text-base font-black text-black mb-3 sm:mb-4 bg-white border-2 border-black rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 inline-block">
                      Categories
                    </h3>

                  <div
                    ref={categoriesScrollRef}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 overflow-y-auto pr-3 sm:pr-4 md:pr-5 categories-scroll"
                    style={{
                      maxHeight: '120px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#000 #f3f4f6',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {(() => {
                      const allCategories = [
                        { value: "all", label: "All" },
                        { value: "business", label: "Business" },
                        { value: "personal", label: "Personal" },
                        { value: "service", label: "Service" },
                        { value: "agriculture-farming", label: "Agriculture" },
                        { value: "antiques", label: "Antiques" },
                        { value: "art", label: "Art" },
                        { value: "automobile", label: "Automobile" },
                        { value: "baby-kids", label: "Baby & Kids" },
                        { value: "bags-luggage", label: "Bags & Luggage" },
                        { value: "books-publications", label: "Books" },
                        { value: "beauty-products", label: "Beauty" },
                        { value: "bicycles", label: "Bicycles" },
                        { value: "childcare-family", label: "Childcare" },
                        { value: "collectibles", label: "Collectibles" },
                        { value: "construction-renovation", label: "Construction" },
                        { value: "education-training", label: "Education" },
                        { value: "electronics-gadgets", label: "Electronics" },
                        { value: "entertainment-media", label: "Entertainment" },
                        { value: "events-entertainment", label: "Events" },
                        { value: "fashion-apparel", label: "Fashion" },
                        { value: "food-beverage", label: "Food" },
                        { value: "gaming-recreation", label: "Gaming" },
                        { value: "government-public", label: "Government" },
                        { value: "health-beauty", label: "Health" },
                        { value: "home-furniture", label: "Home" },
                        { value: "insurance-services", label: "Insurance" },
                        { value: "jobs", label: "Jobs" },
                        { value: "jewelry-accessories", label: "Jewelry" },
                        { value: "legal-financial", label: "Legal" },
                        { value: "marketing-advertising", label: "Marketing" },
                        { value: "memorabilia", label: "Memorabilia" },
                        { value: "non-profit-charity", label: "Non-Profit" },
                        { value: "pets", label: "Pets" },
                        { value: "raw-materials-industrial", label: "Industrial" },
                        { value: "real-estate", label: "Real Estate" },
                        { value: "real-estate-services", label: "Real Estate Services" },
                        { value: "renewable-energy", label: "Renewable Energy" },
                        { value: "security-safety", label: "Security" },
                        { value: "sneakers", label: "Sneakers" },
                        { value: "souvenir", label: "Souvenir" },
                        { value: "sports-outdoor", label: "Sports" },
                        { value: "technology", label: "Technology" },
                        { value: "thrift", label: "Thrift" },
                        { value: "transportation-logistics", label: "Transportation" },
                        { value: "travel-tourism", label: "Travel" },
                        { value: "vintage", label: "Vintage" },
                        { value: "waste-management", label: "Waste Management" },
                        { value: "wedding-events", label: "Wedding" },
                        { value: "musical-instruments", label: "Musical Instruments" },
                        { value: "tools-equipment", label: "Tools & Equipment" },
                        { value: "appliances", label: "Appliances" },
                        { value: "photography-cameras", label: "Photography & Cameras" },
                        { value: "fitness-gym-equipment", label: "Fitness & Gym Equipment" },
                        { value: "kitchen-dining", label: "Kitchen & Dining" },
                        { value: "garden-outdoor", label: "Garden & Outdoor" },
                        { value: "office-supplies", label: "Office Supplies" },
                        { value: "repair-services", label: "Repair Services" },
                        { value: "cleaning-services", label: "Cleaning Services" },
                        { value: "musical-services", label: "Musical Services" },
                        { value: "tutoring-lessons", label: "Tutoring & Lessons" },
                        { value: "medical-equipment", label: "Medical Equipment" },
                        { value: "musical-accessories", label: "Musical Accessories" },
                        { value: "other", label: "Other" }
                      ];
                      // Keep main categories at top, sort the rest alphabetically, then add 'Other' at the end
                      const mainCategories = allCategories.filter(cat => ['all', 'business', 'personal', 'service'].includes(cat.value));
                      const otherCategories = allCategories.filter(cat => !['all', 'business', 'personal', 'service', 'other'].includes(cat.value));
                      const otherCategory = allCategories.find(cat => cat.value === 'other');
                      const sortedCategories = [
                        ...mainCategories,
                        ...otherCategories.sort((a, b) => a.label.localeCompare(b.label)),
                        otherCategory
                      ].filter(Boolean);
                      
                      return sortedCategories.map((category) => (
                      <button
                        key={category.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelect(category.value);
                          if (category.value === "all") {
                            setSearchTerm("");
                            setAiSearchResults(null);
                            setSearchSuggestions([]);
                            setShowSuggestions(false);
                          }
                        }}
                          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-[10px] sm:text-xs md:text-sm font-black rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 whitespace-nowrap relative overflow-hidden touch-manipulation flex-shrink-0 ${
                          selectedCategory === category.value
                              ? 'bg-black text-white border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)] active:scale-95 sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.2)] sm:hover:scale-105'
                              : 'bg-white hover:bg-gray-50 text-black border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:scale-95 sm:hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] sm:hover:scale-105'
                        }`}
                      >
                        {/* Physical button depth effect */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${
                          selectedCategory === category.value
                            ? 'from-white/5 to-transparent'
                            : 'from-white/20 to-transparent'
                          } rounded-lg sm:rounded-xl md:rounded-2xl pointer-events-none`} />
                        {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full sm:hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-lg sm:rounded-xl md:rounded-2xl" />
                        <span className="relative z-10">{category.label}</span>
                      </button>
                      ));
                      })()}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator - Mobile Only - Between Categories and Cards */}
          {showScrollIndicator && (
            <div className="flex justify-center items-center pt-1 pb-4 sm:hidden">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
              <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ChevronDown className="h-8 w-8 text-gray-600 drop-shadow-lg" />
              </motion.div>
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-[10px] text-gray-600 font-medium mt-1"
                >
                  Scroll down
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 font-medium text-[8px] sm:text-[9px] md:text-[10px]">
                {showTrustBadgeOnly 
                  ? `${trustBadgeEnquiriesCount} number of trust badge buyers`
                  : `${liveEnquiriesCount} real buyers waiting for the right seller` // 🛡️ PROTECTED TEXT - DO NOT MODIFY
                }
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Trust Badge Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:bg-gray-100 flex items-center justify-center ${
                      showTrustBadgeOnly ? "border border-blue-800" : ""
                    }`}
                    style={{
                      borderWidth: showTrustBadgeOnly ? '1px' : '0px'
                    }}
                    title="Filter enquiries"
                  >
                    <Filter 
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                      style={{
                        fill: showTrustBadgeOnly ? '#3b82f6' : '#ffffff'
                      }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-40 sm:w-48 border-2 rounded-xl shadow-xl p-2 ${
                  showTrustBadgeOnly 
                    ? "bg-[#800020] border-[#6b0019]" 
                    : "bg-blue-600 border-blue-700"
                }`}>
                  <DropdownMenuCheckboxItem
                    checked={showTrustBadgeOnly}
                    onCheckedChange={setShowTrustBadgeOnly}
                    className={`cursor-pointer rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 font-medium text-sm sm:text-base text-white flex items-center justify-center text-center [&>span]:hidden ${
                      showTrustBadgeOnly 
                        ? "hover:bg-[#6b0019] hover:text-white focus:bg-[#6b0019] focus:text-white" 
                        : "hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white"
                    }`}
                  >
                    {showTrustBadgeOnly ? "Remove filter" : "Trust badge only"}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Grid/List Toggle */}
              <div 
                className="relative inline-flex items-center bg-black border border-black rounded-full p-0.5 sm:p-1 cursor-pointer transition-colors duration-200 hover:bg-gray-900"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
              {/* Track background */}
              <div className="relative w-16 h-6 sm:w-20 sm:h-7 flex items-center">
                {/* Icons on sides */}
                <div className="absolute left-1.5 sm:left-2 z-10 flex items-center justify-center pointer-events-none">
                  <Grid3X3 className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
                    viewMode === 'grid' ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                <div className="absolute right-1.5 sm:right-2 z-10 flex items-center justify-center pointer-events-none">
                  <List className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
                    viewMode === 'list' ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                
                {/* Sliding knob */}
                <motion.div 
                  className="absolute top-0.5 sm:top-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md z-20 flex items-center justify-center"
                  animate={{
                    left: viewMode === 'grid' ? '0.125rem' : 'calc(100% - 1.5rem)',
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                >
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-300 rounded-full"></div>
            </motion.div>
              </div>
              </div>
            </div>
          </div>

          {/* Enquiries Grid/List */}
          {displayEnquiries.length > 0 ? (
            <>
            {/* Category Fallback Message */}
            {showCategoryFallback && (
              <div className="mb-4 p-3 sm:p-4 bg-[#5C0014] border border-[#5C0014] rounded-lg sm:rounded-xl">
                <div className="text-center">
                  <p className="text-white font-semibold text-xs sm:text-base">
                    No enquiries found in "{selectedCategory.replace('-', ' ')}" category
                  </p>
                  <p className="text-white/70 text-[8px] sm:text-[9px] mt-1">
                    Showing all enquiries below
                  </p>
                </div>
              </div>
            )}
            
            {/* AI Search Results Messages */}
            {aiSearchResults && filteredEnquiries.length === 0 && (
              <div className="mb-4 p-2.5 sm:p-3 bg-black border border-black rounded-lg">
                {aiSearchResults.noResultsInCategory ? (
                  <div className="text-center">
                    <p className="text-white font-medium text-xs sm:text-sm px-1">
                      No enquiries found in {aiSearchResults.searchedCategory?.replace('-', ' ')} category
                    </p>
                    <p className="text-white text-[10px] sm:text-xs mt-1 px-1 break-words leading-relaxed">
                      AI Analysis: {aiSearchResults.aiAnalysis?.reasoning}
                    </p>
                    <p className="text-white text-[10px] sm:text-xs mt-1 px-1">
                      Showing all enquiries below
                    </p>
                  </div>
                ) : aiSearchResults.showAllFallback ? (
                  <div className="text-center">
                    <p className="text-white font-medium text-xs sm:text-sm px-1">
                      AI couldn't determine category for "{searchTerm}"
                    </p>
                    <p className="text-white text-[10px] sm:text-xs mt-1 px-1">
                      Showing all enquiries
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-xs sm:text-sm px-1">
                      AI found {aiSearchResults.results.length} enquiry{aiSearchResults.results.length !== 1 ? 'ies' : ''} in {aiSearchResults.searchedCategory?.replace('-', ' ')} category
                    </p>
                    <p className="text-blue-600 text-[10px] sm:text-xs mt-1 px-1 break-words leading-relaxed">
                      Confidence: {Math.round((aiSearchResults.aiAnalysis?.confidence || 0) * 100)}% | {aiSearchResults.aiAnalysis?.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 items-stretch' 
                : 'space-y-3 sm:space-y-4'
            }`}>
              {displayedEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="block">
                  <Link
                    to={isEnquiryDisabled(enquiry) ? '#' : `/enquiry/${enquiry.id}`} 
                    className="block"
                    onClick={(e) => {
                      if (isEnquiryDisabled(enquiry)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <Card className={`${
                      viewMode === 'grid' ? 'h-full flex-1 flex flex-col border border-gray-300 bg-white rounded-none overflow-hidden relative' : 'border border-gray-300 bg-white rounded-none flex flex-col min-h-[300px] sm:min-h-0 lg:min-h-[400px] xl:min-h-[450px] relative'
                    } transition-all duration-300 cursor-pointer ${
                      isEnquiryDisabled(enquiry) 
                        ? 'opacity-70 bg-gray-50 border-gray-300 grayscale cursor-not-allowed' 
                        : viewMode === 'list' 
                          ? 'rounded-2xl border-gray-300 bg-gradient-to-br from-white via-white to-gray-50/40 shadow-[0_12px_24px_rgba(0,0,0,0.15),0_6px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-[2px] active:scale-[0.99]' 
                          : 'rounded-2xl border-gray-300 bg-gradient-to-br from-white via-white to-gray-50/40 border-l-green-500 shadow-[0_12px_24px_rgba(0,0,0,0.15),0_6px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-[2px] active:scale-[0.99]'
                    } sm:transition-all sm:duration-200 sm:hover:shadow-[0_16px_32px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] sm:hover:-translate-y-1 sm:hover:scale-[1.02] sm:active:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] sm:active:translate-y-[2px] sm:active:scale-[0.99]`} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', height: 'auto', transformStyle: 'preserve-3d' } : viewMode === 'grid' ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, transformStyle: 'preserve-3d' } : {}}>
                      {/* EXPIRED Stamp Badge */}
                      {isEnquiryDisabled(enquiry) && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none" style={{ filter: 'none', WebkitFilter: 'none' }}>
                          <div className="relative" style={{ filter: 'none', WebkitFilter: 'none' }}>
                            <div className={`relative bg-transparent ${
                              viewMode === 'grid' 
                                ? 'px-4 sm:px-6 lg:px-5 xl:px-6 py-2 sm:py-2.5 lg:py-2 xl:py-2.5' 
                                : 'px-8 sm:px-12 lg:px-10 xl:px-12 py-3 sm:py-4 lg:py-3 xl:py-4'
                            }`} style={{ filter: 'none', WebkitFilter: 'none' }}>
                              {/* Distressed border effect */}
                              <div className={`absolute inset-0 rounded-sm ${viewMode === 'grid' ? 'border-2' : 'border-4'}`} style={{
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                filter: 'none drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                                WebkitFilter: 'none drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1), 0 0 20px rgba(239,68,68,0.4)',
                                borderColor: '#ef4444',
                                borderWidth: viewMode === 'grid' ? '2px' : '4px',
                                borderStyle: 'solid'
                              }}></div>
                              {/* Text with distressed effect */}
                              <div className="relative" style={{ filter: 'none', WebkitFilter: 'none' }}>
                                <span className={`font-black tracking-wider ${
                                  viewMode === 'grid'
                                    ? 'text-2xl sm:text-3xl lg:text-2xl xl:text-3xl'
                                    : 'text-4xl sm:text-5xl lg:text-4xl xl:text-5xl'
                                }`} style={{
                                  color: '#ef4444',
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(0,0,0,0.2), 1px 1px 2px rgba(0,0,0,0.2)',
                                  letterSpacing: '0.15em',
                                  filter: 'none drop-shadow(1px 1px 2px rgba(0,0,0,0.4))',
                                  WebkitFilter: 'none drop-shadow(1px 1px 2px rgba(0,0,0,0.4))'
                                }}>EXPIRED</span>
                              </div>
                              {/* Additional distressed texture overlay */}
                              <div className="absolute inset-0 opacity-20" style={{
                                background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 21%, transparent 21%)',
                                backgroundSize: '8px 8px'
                              }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Subtle gradient overlay for mobile - Professional depth */}
                      {!isEnquiryDisabled(enquiry) && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent rounded-2xl pointer-events-none sm:hidden" />
                      )}
                      {/* Additional subtle border highlight for mobile */}
                      {!isEnquiryDisabled(enquiry) && (
                        <div className="absolute inset-0 rounded-2xl border border-white/60 pointer-events-none sm:hidden" />
                      )}
                      {/* Physical button depth effect - Desktop only */}
                      {!isEnquiryDisabled(enquiry) && (
                        <div className="hidden sm:block absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl sm:rounded-3xl pointer-events-none" />
                      )}
                      {/* Shimmer effect - Desktop only */}
                      {!isEnquiryDisabled(enquiry) && (
                        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl sm:rounded-3xl" />
                      )}
                      {/* Card Header - Black */}
                      <div className={`${viewMode === 'grid' ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-4 sm:px-4 py-3 sm:py-2.5'} border-b border-black/20 relative z-10 rounded-t-2xl sm:rounded-t-none`} style={{ background: 'linear-gradient(to bottom, #000000, #000000, #0a0a0a)' }}>
                        <div className="flex justify-between items-center relative">
                          <div className="flex items-center gap-2 sm:gap-2">
                            {/* Show verified badge if: 
                                1. User has profile-level verification (applies to all enquiries), OR
                                2. This specific enquiry has ID images (enquiry-specific verification) */}
                                {(userProfiles[enquiry.userId]?.isProfileVerified || enquiry.idFrontImage || enquiry.idBackImage || enquiry.isProfileVerified || enquiry.userVerified) && (
                                  <>
                                    <div className={`flex items-center justify-center w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm ${
                                      isEnquiryDisabled(enquiry) ? 'bg-gray-500' : 'bg-blue-500'
                                    }`}>
                                      <Check className="h-0.5 w-0.5 sm:h-2 sm:w-2 text-white" />
                                    </div>
                                    <span className={`text-[7px] sm:text-[10px] font-semibold hidden sm:inline tracking-wide ${
                                      isEnquiryDisabled(enquiry) ? 'text-gray-400' : 'text-blue-300'
                                    }`}>Verified</span>
                                  </>
                                )}
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-2">
                            {!isEnquiryDisabled(enquiry) && (
                              <Badge className="text-[7px] sm:text-[10px] px-0.5 sm:px-2 py-0.5 sm:py-1 bg-green-500 text-white border-0 shadow-sm font-semibold">Live</Badge>
                            )}
                            {isDealClosed(enquiry) && (
                              <Badge variant="outline" className="text-[7px] sm:text-[10px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-gray-400 border-gray-500 bg-black">Deal Closed</Badge>
                            )}
                            {!isDealClosed(enquiry) && isEnquiryOutdated(enquiry) && (
                              <Badge variant="outline" className="text-[7px] sm:text-[10px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-gray-400 border-gray-500 bg-black">Expired</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      

                      {viewMode === 'list' ? (
                        <>
                          {/* First Half - Top: Title and Description */}
                          <CardHeader className="p-2 sm:p-5 flex flex-col justify-center flex-1 min-h-0 relative z-10 overflow-hidden" style={{ flex: '1 1 50%', background: 'linear-gradient(to bottom, #000000, #000000, #0a0a0a)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.6)' }}>
                            {/* Category-specific 2D Sketches - List View Only */}
                            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.3]">
                              {getCategorySketch(enquiry.category)}
                            </div>
                            <div className="space-y-1.5 sm:space-y-3 py-2 sm:py-0 pt-12 sm:pt-0 relative z-10">
                              {/* Need Label - Above Title */}
                              <div className="text-left">
                                <div className="relative inline-block bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                  style={{
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                    transformStyle: 'preserve-3d',
                                    perspective: '1000px'
                                  }}
                                >
                                  {/* 3D Border Effect */}
                                  <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                    style={{
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  
                                  {/* Top highlight for 3D effect */}
                                  <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                  
                                  {/* Side highlights for depth */}
                                  <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                  <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                  
                                  {/* Bottom shadow for depth */}
                                  <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                  
                                  {/* Inner depth shadow */}
                                  <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                  
                                  <span className="relative z-10 text-[10px] sm:text-xs text-black font-bold tracking-wide" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Need</span>
                                </div>
                              </div>
                              
                              {/* Title - 3D White Tile Style */}
                              <div className="mb-1.5 sm:mb-3">
                                <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 transform-gpu transition-all duration-500 ease-out"
                                  style={{
                                    boxShadow: '0 15px 30px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.08)',
                                    transformStyle: 'preserve-3d',
                                    perspective: '1000px'
                                  }}
                                >
                                  {/* 3D Border Effect */}
                                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-gray-300/50" 
                                    style={{
                                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.12)'
                                    }}
                                  />
                                  
                                  {/* Top highlight for 3D effect */}
                                  <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                  
                                  {/* Side highlights for depth */}
                                  <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-xl sm:rounded-l-2xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                  <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-xl sm:rounded-r-2xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                  
                                  {/* Bottom shadow for depth */}
                                  <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                  
                                  {/* Inner depth shadow */}
                                  <div className="absolute inset-1 rounded-lg sm:rounded-xl bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                  
                                  <h3 className={`relative z-10 text-base sm:text-lg lg:text-xl font-black tracking-tight leading-relaxed sm:leading-tight line-clamp-3 sm:line-clamp-1 sm:truncate text-black text-center antialiased ${
                                      isEnquiryDisabled(enquiry) ? 'text-gray-400 opacity-70' : ''
                                    }`} style={{
                                      WebkitFontSmoothing: 'antialiased',
                                      MozOsxFontSmoothing: 'grayscale',
                                      textRendering: 'optimizeLegibility',
                                      transform: 'translateZ(15px)',
                                      textShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)'
                                    }}>
                                      {enquiry.title}
                                    </h3>
                                </div>
                              </div>
                              
                              {/* "before [date]" below title, centered on mobile */}
                              {enquiry.deadline && (() => {
                                try {
                                  let deadlineDate: Date;
                                  
                                  // Handle Firestore Timestamp (has toDate method)
                                  if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
                                    deadlineDate = enquiry.deadline.toDate();
                                  }
                                  // Handle Firestore Timestamp object (has seconds and nanoseconds)
                                  else if (enquiry.deadline?.seconds !== undefined) {
                                    deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
                                  }
                                  // Handle Date object
                                  else if (enquiry.deadline instanceof Date) {
                                    deadlineDate = enquiry.deadline;
                                  }
                                  // Handle string or number
                                  else {
                                    deadlineDate = new Date(enquiry.deadline);
                                  }
                                  
                                  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
                                    console.error('⚠️ Invalid deadline for enquiry:', enquiry.id, 'Title:', enquiry.title, 'Deadline value:', enquiry.deadline, 'Type:', typeof enquiry.deadline, 'Is disabled:', isEnquiryDisabled(enquiry));
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="flex flex-col items-end mt-0.5 sm:mt-1 gap-1 sm:gap-1.5">
                                      {/* Location - Right aligned above date */}
                                      {enquiry.location && (
                                        <div className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                          style={{
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                            transformStyle: 'preserve-3d',
                                            perspective: '1000px'
                                          }}
                                        >
                                          {/* 3D Border Effect */}
                                          <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                            style={{
                                              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                            }}
                                          />
                                          
                                          {/* Top highlight for 3D effect */}
                                          <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                          
                                          {/* Side highlights for depth */}
                                          <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                          <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                          
                                          {/* Bottom shadow for depth */}
                                          <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                          
                                          {/* Inner depth shadow */}
                                          <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                          
                                          <span className="text-[10px] sm:text-xs font-semibold text-gray-800 relative z-10 whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>at - </span>
                                          <div className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 relative z-10 shadow-sm ring-2 ring-gray-300/50"
                                            style={{
                                              transform: 'translateZ(10px)'
                                            }}
                                          >
                                            <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-gray-700" />
                                          </div>
                                          <span className="truncate text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 relative z-10" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{enquiry.location}</span>
                                        </div>
                                      )}
                                      <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                        style={{
                                          boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                          transformStyle: 'preserve-3d',
                                          perspective: '1000px'
                                        }}
                                      >
                                        {/* 3D Border Effect */}
                                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                          style={{
                                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                          }}
                                        />
                                        
                                        {/* Top highlight for 3D effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                        
                                        {/* Side highlights for depth */}
                                        <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                        <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                        
                                        {/* Bottom shadow for depth */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                        
                                        {/* Inner depth shadow */}
                                        <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                        
                                        <span className="relative z-10 text-[10px] sm:text-xs text-gray-900 font-semibold whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                                          before {formatDate(deadlineDate.toISOString())}
                                        </span>
                                      </div>
                                      <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 transform-gpu transition-all duration-500 ease-out"
                                        style={{
                                          boxShadow: '0 10px 20px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)',
                                          transformStyle: 'preserve-3d',
                                          perspective: '1000px'
                                        }}
                                      >
                                        {/* 3D Border Effect */}
                                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-red-800/50" 
                                          style={{
                                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.3)'
                                          }}
                                        />
                                        
                                        {/* Top highlight for 3D effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
                                        
                                        {/* Side highlights for depth */}
                                        <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                                        <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
                                        
                                        {/* Bottom shadow for depth */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/30 via-black/15 to-transparent pointer-events-none" />
                                        
                                        {/* Inner depth shadow */}
                                        <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />
                                        
                                        <span className="relative z-10 text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                          {formatDeadlineText(enquiry.deadline)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                } catch (error) {
                                  console.error('⚠️ Error displaying deadline for enquiry:', enquiry.id, 'Title:', enquiry.title, 'Error:', error, 'Deadline:', enquiry.deadline, 'Type:', typeof enquiry.deadline, 'Is disabled:', isEnquiryDisabled(enquiry));
                                  return null;
                                }
                              })()}
                              
                              {/* Badges Row - Centered on mobile */}
                              <div className="flex items-center justify-center sm:justify-start gap-0.5 sm:gap-2 flex-wrap">
                                  {enquiry.isUrgent && !isEnquiryDisabled(enquiry) && (
                                    <Badge className="text-[8px] sm:text-xs px-1 sm:px-2.5 py-0.5 sm:py-1 bg-red-500 text-white border-0 shadow-sm font-semibold">
                                      <span className="w-0.5 h-0.5 sm:w-1.5 sm:h-1.5 bg-white rounded-full inline-block mr-0.5 sm:mr-1"></span>
                                      Urgent
                                    </Badge>
                                  )}
                                  {isDealClosed(enquiry) && (
                                    <Badge variant="outline" className="text-[8px] sm:text-xs px-1 sm:px-2.5 py-0.5 sm:py-1 text-gray-500 border-gray-300 bg-gray-50">Deal Closed</Badge>
                                  )}
                                  {!isDealClosed(enquiry) && isEnquiryOutdated(enquiry) && (
                                    <Badge variant="outline" className="text-[8px] sm:text-xs px-1 sm:px-2.5 py-0.5 sm:py-1 text-gray-500 border-gray-300 bg-gray-50">Expired</Badge>
                                  )}
                                </div>
                              </div>
                              
                            {/* Description - Hidden on mobile, shown on desktop */}
                            {enquiry.description && (
                              <div className="hidden sm:flex justify-center pt-8 pb-2 sm:pt-0 sm:pb-0 sm:my-3">
                                <p className="text-[7px] sm:text-[8px] text-gray-900 font-semibold leading-tight line-clamp-5 text-center max-w-xs sm:max-w-sm">
                                {enquiry.description}
                              </p>
                            </div>
                            )}
                            
                            {/* Budget - Moved to CardHeader to extend black background */}
                            {/* Desktop Budget */}
                            <div className="hidden sm:flex pt-2 sm:pt-3">
                              {enquiry.budget && (
                                <div className="relative flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-0.5 sm:py-1 transform-gpu transition-all duration-500 ease-out"
                                  style={{
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                    transformStyle: 'preserve-3d',
                                    perspective: '1000px'
                                  }}
                                >
                                  {/* 3D Border Effect */}
                                  <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                    style={{
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  
                                  {/* Top highlight for 3D effect */}
                                  <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                  
                                  {/* Side highlights for depth */}
                                  <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                  <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                  
                                  {/* Bottom shadow for depth */}
                                  <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                  
                                  {/* Inner depth shadow */}
                                  <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                  
                                  <span className="font-bold text-gray-900 text-[8px] sm:text-[10px] tracking-wide relative z-10" style={{ letterSpacing: '0.08em', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textTransform: 'uppercase', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Budget -</span>
                                  <span className="font-extrabold text-black text-sm sm:text-base md:text-lg relative z-10" style={{ fontFeatureSettings: '"tnum"', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>₹</span>
                                  <span className="font-extrabold text-gray-900 text-sm sm:text-base md:text-lg whitespace-nowrap tracking-tight relative z-10" style={{ fontFeatureSettings: '"tnum"', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Mobile Budget */}
                            <div className="block sm:hidden pt-2">
                              {enquiry.budget && (
                                <div className="relative flex items-center justify-center">
                                  <div className="relative flex items-center gap-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg px-2 py-1 transform-gpu transition-all duration-500 ease-out"
                                    style={{
                                      boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                      transformStyle: 'preserve-3d',
                                      perspective: '1000px'
                                    }}
                                  >
                                    {/* 3D Border Effect */}
                                    <div className="absolute inset-0 rounded-lg border-2 border-gray-300/50" 
                                      style={{
                                        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                      }}
                                    />
                                    
                                    {/* Top highlight for 3D effect */}
                                    <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                    
                                    {/* Side highlights for depth */}
                                    <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                    <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                    
                                    {/* Bottom shadow for depth */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                    
                                    {/* Inner depth shadow */}
                                    <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                    
                                    <span className="font-bold text-gray-900 text-[8px] sm:text-[10px] tracking-wide relative z-10" style={{ letterSpacing: '0.08em', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textTransform: 'uppercase', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Budget -</span>
                                    <span className="font-extrabold text-black text-sm sm:text-base relative z-10" style={{ fontFeatureSettings: '"tnum"', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>₹</span>
                                    <span className="font-extrabold text-gray-900 text-sm sm:text-base whitespace-nowrap tracking-tight relative z-10" style={{ fontFeatureSettings: '"tnum"', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{formatIndianCurrency(enquiry.budget)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                        </>
                      ) : (
                        <CardHeader className="p-2 sm:p-5 lg:p-6 xl:p-7 relative z-10 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #000000, #000000, #0a0a0a)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.6)' }}>
                          {/* 2D Sketches - Safely Enquire Here */}
                          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.08]">
                            <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                              {/* Shield icon for safety */}
                              <path d="M 50 80 Q 50 50, 80 50 L 120 50 Q 150 50, 150 80 L 150 120 Q 150 150, 120 150 L 100 170 L 80 150 Q 50 150, 50 120 Z" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M 100 100 L 100 130 M 90 120 L 100 130 L 110 120" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                              
                              {/* Lock icon */}
                              <rect x="250" y="100" width="40" height="50" rx="4" 
                                    stroke="white" strokeWidth="2" fill="none"/>
                              <path d="M 270 100 L 270 80 Q 270 60, 290 60 Q 310 60, 310 80 L 310 100" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                              <circle cx="270" cy="125" r="3" fill="white"/>
                              
                              {/* Message/question bubble */}
                              <path d="M 200 200 Q 180 200, 180 220 L 180 240 Q 180 250, 190 250 L 200 260 L 210 250 Q 220 250, 220 240 L 220 220 Q 220 200, 200 200" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                              <circle cx="200" cy="210" r="2" fill="white"/>
                              <circle cx="200" cy="220" r="2" fill="white"/>
                              <circle cx="200" cy="230" r="2" fill="white"/>
                              
                              {/* Connection lines */}
                              <path d="M 150 100 Q 175 100, 200 100" 
                                    stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="3,3" opacity="0.6"/>
                              <path d="M 150 140 Q 175 140, 200 180" 
                                    stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="3,3" opacity="0.6"/>
                              
                              {/* Check mark for verification */}
                              <circle cx="320" cy="80" r="15" 
                                      stroke="white" strokeWidth="2" fill="none"/>
                              <path d="M 315 80 L 318 83 L 325 76" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              
                              {/* Arrow pointing to enquiry */}
                              <path d="M 280 200 L 300 200 M 295 195 L 300 200 L 295 205" 
                                    stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              
                              {/* Decorative dots */}
                              <circle cx="60" cy="200" r="2" fill="white" opacity="0.5"/>
                              <circle cx="340" cy="200" r="2" fill="white" opacity="0.5"/>
                              <circle cx="60" cy="250" r="2" fill="white" opacity="0.5"/>
                              <circle cx="340" cy="250" r="2" fill="white" opacity="0.5"/>
                            </svg>
                          </div>
                          <div className="space-y-1.5 sm:space-y-3 lg:space-y-4 relative z-10">
                            {/* Need Label - Above Title */}
                            <div className="text-left">
                              <div className="relative inline-block bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                style={{
                                  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px'
                                }}
                              >
                                {/* 3D Border Effect */}
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                  style={{
                                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                  }}
                                />
                                
                                {/* Top highlight for 3D effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                
                                {/* Side highlights for depth */}
                                <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                
                                {/* Bottom shadow for depth */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                
                                {/* Inner depth shadow */}
                                <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                
                                <span className="relative z-10 text-xs sm:text-sm md:text-base text-black font-bold tracking-wide" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Need</span>
                              </div>
                            </div>
                            
                            {/* Title - 3D White Tile Style */}
                            <div className="mb-1.5 sm:mb-3">
                              <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 transform-gpu transition-all duration-500 ease-out"
                                style={{
                                  boxShadow: '0 15px 30px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.08)',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px'
                                }}
                              >
                                {/* 3D Border Effect */}
                                <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-gray-300/50" 
                                  style={{
                                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.12)'
                                  }}
                                />
                                
                                {/* Top highlight for 3D effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                
                                {/* Side highlights for depth */}
                                <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-xl sm:rounded-l-2xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-xl sm:rounded-r-2xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                
                                {/* Bottom shadow for depth */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                
                                {/* Inner depth shadow */}
                                <div className="absolute inset-1 rounded-lg sm:rounded-xl bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                
                                <h3 className={`relative z-10 text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight line-clamp-2 text-black text-center antialiased ${
                                    isEnquiryDisabled(enquiry) ? 'text-gray-400 opacity-70' : ''
                                  }`} style={{
                                    WebkitFontSmoothing: 'antialiased',
                                    MozOsxFontSmoothing: 'grayscale',
                                    textRendering: 'optimizeLegibility',
                                    transform: 'translateZ(15px)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)'
                                  }}>
                                    {enquiry.title}
                                  </h3>
                              </div>
                              
                              {/* "before [date]" below title, right aligned */}
                              {enquiry.deadline && (() => {
                                try {
                                  let deadlineDate: Date;
                                  
                                  // Handle Firestore Timestamp (has toDate method)
                                  if (enquiry.deadline?.toDate && typeof enquiry.deadline.toDate === 'function') {
                                    deadlineDate = enquiry.deadline.toDate();
                                  }
                                  // Handle Firestore Timestamp object (has seconds and nanoseconds)
                                  else if (enquiry.deadline?.seconds !== undefined) {
                                    deadlineDate = new Date(enquiry.deadline.seconds * 1000 + (enquiry.deadline.nanoseconds || 0) / 1000000);
                                  }
                                  // Handle Date object
                                  else if (enquiry.deadline instanceof Date) {
                                    deadlineDate = enquiry.deadline;
                                  }
                                  // Handle string or number
                                  else {
                                    deadlineDate = new Date(enquiry.deadline);
                                  }
                                  
                                  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
                                    console.error('⚠️ Invalid deadline for enquiry:', enquiry.id, 'Title:', enquiry.title, 'Deadline value:', enquiry.deadline, 'Type:', typeof enquiry.deadline, 'Is disabled:', isEnquiryDisabled(enquiry));
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="flex flex-col items-end gap-1 sm:gap-1.5 pt-2">
                                      {/* Location - Right aligned above date */}
                                      {enquiry.location && (
                                        <div className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                          style={{
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                            transformStyle: 'preserve-3d',
                                            perspective: '1000px'
                                          }}
                                        >
                                          {/* 3D Border Effect */}
                                          <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                            style={{
                                              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                            }}
                                          />
                                          
                                          {/* Top highlight for 3D effect */}
                                          <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                          
                                          {/* Side highlights for depth */}
                                          <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                          <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                          
                                          {/* Bottom shadow for depth */}
                                          <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                          
                                          {/* Inner depth shadow */}
                                          <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                          
                                          <span className="text-[10px] sm:text-xs font-semibold text-gray-800 relative z-10 whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>at - </span>
                                          <div className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 relative z-10 shadow-sm ring-2 ring-gray-300/50"
                                            style={{
                                              transform: 'translateZ(10px)'
                                            }}
                                          >
                                            <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-gray-700" />
                                          </div>
                                          <span className="truncate text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 relative z-10" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{enquiry.location}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                        style={{
                                          boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                          transformStyle: 'preserve-3d',
                                          perspective: '1000px'
                                        }}
                                      >
                                        {/* 3D Border Effect */}
                                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                          style={{
                                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                          }}
                                        />
                                        
                                        {/* Top highlight for 3D effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                        
                                        {/* Side highlights for depth */}
                                        <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                        <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                        
                                        {/* Bottom shadow for depth */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                        
                                        {/* Inner depth shadow */}
                                        <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                        
                                        <span className="relative z-10 text-[10px] sm:text-xs font-medium text-gray-800 whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                                          before {formatDate(deadlineDate.toISOString())}
                                        </span>
                                      </div>
                                      <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 transform-gpu transition-all duration-500 ease-out"
                                        style={{
                                          boxShadow: '0 10px 20px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)',
                                          transformStyle: 'preserve-3d',
                                          perspective: '1000px'
                                        }}
                                      >
                                        {/* 3D Border Effect */}
                                        <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-red-800/50" 
                                          style={{
                                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.3)'
                                          }}
                                        />
                                        
                                        {/* Top highlight for 3D effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
                                        
                                        {/* Side highlights for depth */}
                                        <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                                        <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
                                        
                                        {/* Bottom shadow for depth */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/30 via-black/15 to-transparent pointer-events-none" />
                                        
                                        {/* Inner depth shadow */}
                                        <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />
                                        
                                        <span className="relative z-10 text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap" style={{ transform: 'translateZ(10px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                          {formatDeadlineText(enquiry.deadline)}
                                        </span>
                                      </div>
                                      </div>
                                    </div>
                                  );
                                } catch (error) {
                                  console.error('⚠️ Error displaying deadline for enquiry:', enquiry.id, 'Title:', enquiry.title, 'Error:', error, 'Deadline:', enquiry.deadline, 'Type:', typeof enquiry.deadline, 'Is disabled:', isEnquiryDisabled(enquiry));
                                  return null;
                                }
                              })()}
                            </div>
                            
                            {/* Show verified badge if: 
                                1. User has profile-level verification (applies to all enquiries), OR
                                2. This specific enquiry has ID images (enquiry-specific verification) */}
                            {((userProfiles[enquiry.userId]?.isProfileVerified || 
                               userProfiles[enquiry.userId]?.isVerified || 
                               userProfiles[enquiry.userId]?.trustBadge || 
                               userProfiles[enquiry.userId]?.isIdentityVerified) || 
                              enquiry.idFrontImage || enquiry.idBackImage ||
                              enquiry.isProfileVerified || enquiry.userVerified) && (
                            <div className={`flex items-center justify-start mt-1 sm:mt-1.5`}>
                              <div className={`flex items-center justify-center w-3 h-3 sm:w-5 sm:h-5 rounded-full flex-shrink-0 shadow-sm ${
                                isEnquiryDisabled(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                              }`}>
                                <Check className="h-1.5 w-1.5 sm:h-3 sm:w-3 text-white" />
                              </div>
                            </div>
                            )}
                            
                            {/* Urgent Badge */}
                            {enquiry.isUrgent && !isEnquiryDisabled(enquiry) && (
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                  Urgent
                                </span>
                              </div>
                            )}
                            
                            {/* Description - Hidden in grid view */}
                            
                            {/* Description - Hidden in grid view */}
                            
                            {/* Budget and Location - Grouped together */}
                            <div className="flex flex-col gap-1.5 sm:gap-2.5">
                              {enquiry.budget && (
                                <div className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-1.5 transform-gpu transition-all duration-500 ease-out"
                                  style={{
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06)',
                                    transformStyle: 'preserve-3d',
                                    perspective: '1000px'
                                  }}
                                >
                                  {/* 3D Border Effect */}
                                  <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-gray-300/50" 
                                    style={{
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  
                                  {/* Top highlight for 3D effect */}
                                  <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/60 via-white/20 to-transparent pointer-events-none" />
                                  
                                  {/* Side highlights for depth */}
                                  <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-lg sm:rounded-l-xl bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
                                  <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-lg sm:rounded-r-xl bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                                  
                                  {/* Bottom shadow for depth */}
                                  <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-lg sm:rounded-b-xl bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />
                                  
                                  {/* Inner depth shadow */}
                                  <div className="absolute inset-0.5 rounded-md sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
                                  
                                  <span className="font-bold text-gray-900 text-[8px] sm:text-[10px] tracking-wide relative z-10" style={{ letterSpacing: '0.08em', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textTransform: 'uppercase', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Budget -</span>
                                  <span className="font-extrabold text-black text-sm sm:text-base md:text-lg relative z-10" style={{ fontFeatureSettings: '"tnum"', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>₹</span>
                                  <span className="truncate font-extrabold text-gray-900 text-sm sm:text-base md:text-lg tracking-tight relative z-10" style={{ fontFeatureSettings: '"tnum"', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', transform: 'translateZ(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Category */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 pt-1 sm:pt-2 border-t border-gray-100">
                              <div>
                                <Badge variant="secondary" className="text-[7px] sm:text-[10px] md:text-xs px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-white text-gray-900 font-bold shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-lg sm:rounded-xl relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                  <span className="relative z-10">{enquiry.category.replace('-', ' ')}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      )}
                      
                      <CardContent className={`${viewMode === 'list' ? 'p-2 sm:p-5 lg:p-6 xl:p-7 bg-white flex flex-col justify-start sm:justify-center flex-1 min-h-0' : 'flex-1 flex flex-col p-2 sm:p-5 lg:p-6 xl:p-7 justify-between bg-white'} relative z-10`} style={viewMode === 'list' ? { flex: '1 1 50%' } : {}}>
                        {viewMode === 'list' ? (
                          <>
                          {/* Desktop Layout */}
                          <div className="hidden sm:flex flex-wrap items-center gap-1 sm:gap-2 md:gap-3 justify-between w-full">
                            {/* All Content Elements in Order */}
                            <div className="flex flex-nowrap items-center gap-1 sm:gap-2 md:gap-3 flex-1 min-w-0 overflow-x-auto mt-4 sm:mt-6 lg:mt-8">
                              {/* Category */}
                              <Badge variant="secondary" className="text-[7px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 bg-white text-gray-900 font-bold shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-lg sm:rounded-xl flex-shrink-0 whitespace-nowrap relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl pointer-events-none" />
                                <span className="relative z-10">{enquiry.category.replace('-', ' ')}</span>
                              </Badge>
                            </div>
                            
                            {/* Right: Action Button - Desktop */}
                            <div className="flex-shrink-0 w-auto self-start -mt-4 sm:-mt-3 lg:-mt-2">
                              {isOwnEnquiry(enquiry) ? (
                                <button 
                                  type="button"
                                  disabled
                                  className="w-full sm:w-auto h-6 sm:h-8 md:h-10 px-1.5 sm:px-3 md:px-6 text-[9px] sm:text-xs md:text-sm font-semibold border-2 sm:border-4 border-black text-white rounded-md sm:rounded-xl cursor-not-allowed"
                                  style={{ backgroundColor: '#000000' }}
                                >
                                  Your Enquiry
                                </button>
                              ) : authUser ? (
                                isDealClosed(enquiry) ? (
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto h-6 sm:h-8 md:h-10 px-1.5 sm:px-3 md:px-6 text-[9px] sm:text-xs md:text-sm font-semibold border-2 border-gray-300 bg-white text-gray-500" disabled>
                                    Deal Closed
                                  </Button>
                                ) : isEnquiryOutdated(enquiry) ? (
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto h-6 sm:h-8 md:h-10 px-1.5 sm:px-3 md:px-6 text-[9px] sm:text-xs md:text-sm font-semibold border-2 border-gray-300 bg-white text-gray-500" disabled>
                                    Expired
                                  </Button>
                                ) : (
                                  <Button 
                                    className="w-full sm:w-auto h-6 sm:h-8 md:h-10 px-1.5 sm:px-3 md:px-6 text-[9px] sm:text-xs md:text-sm font-black text-white border-0 hover:scale-105 active:scale-95 transition-all duration-200 rounded-md sm:rounded-xl relative overflow-hidden"
                                    onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                    style={{
                                      background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #1e40af)',
                                      boxShadow: '0 10px 20px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
                                      transformStyle: 'preserve-3d',
                                      perspective: '1000px'
                                    }}
                                  >
                                    {/* 3D Border Effect */}
                                    <div className="absolute inset-0 rounded-md sm:rounded-xl border-2 border-blue-800/50 pointer-events-none" 
                                      style={{
                                        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.4)'
                                      }}
                                    />
                                    
                                    {/* Top highlight for 3D effect */}
                                    <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-md sm:rounded-t-xl bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
                                    
                                    {/* Side highlights for depth */}
                                    <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-md sm:rounded-l-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                                    <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-md sm:rounded-r-xl bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
                                    
                                    {/* Bottom shadow for depth */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-md sm:rounded-b-xl bg-gradient-to-t from-black/30 via-black/20 to-transparent pointer-events-none" />
                                    
                                    {/* Inner depth shadow */}
                                    <div className="absolute inset-0.5 rounded-sm sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />
                                    
                                    <span className="relative z-10 flex items-center" style={{ transform: 'translateZ(10px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                      Sell
                                      <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 ml-0.5 sm:ml-1.5 md:ml-2" />
                                    </span>
                                  </Button>
                                )
                              ) : (
                                <Link to="/signin" className="w-full sm:w-auto block">
                                  <Button className="w-full sm:w-auto h-6 sm:h-8 md:h-10 px-1.5 sm:px-3 md:px-6 text-[9px] sm:text-xs md:text-sm font-black bg-black hover:bg-gray-900 text-white border-[0.5px] border-black hover:scale-105 active:scale-95 transition-all duration-200 rounded-md sm:rounded-xl relative overflow-hidden">
                                    {/* Physical button depth effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-md sm:rounded-xl pointer-events-none" />
                                    <span className="relative z-10">Sign In to Respond</span>
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          {/* Mobile Layout - Location, Category and Button at Bottom */}
                          <div className="block sm:hidden w-full mt-auto space-y-3 pt-0 -mt-6">
                            {/* Category - In a line above Sell Button (Mobile Only) */}
                            <div className="w-full flex items-center justify-between sm:hidden mb-2 mt-4">
                              {/* Category */}
                              <Badge variant="secondary" className="text-[7px] px-1.5 py-0.5 bg-white text-gray-900 font-bold rounded-lg flex-shrink-0 whitespace-nowrap">
                                <span>{enquiry.category.replace('-', ' ')}</span>
                              </Badge>
                            </div>
                            
                            {/* Action Button - Mobile Only - At Bottom */}
                            <div className="w-full">
                            {isOwnEnquiry(enquiry) ? (
                              <button 
                                type="button"
                                disabled
                                className="w-full h-6 text-[8px] font-bold border-2 border-black text-white cursor-not-allowed transition-all duration-200 rounded-md sm:rounded-xl"
                                style={{ backgroundColor: '#000000' }}
                              >
                                Your Enquiry
                              </button>
                            ) : authUser ? (
                              isDealClosed(enquiry) ? (
                                <Button variant="outline" size="sm" className="w-full h-6 text-[8px] font-semibold border-2 border-gray-300 bg-white text-gray-500" disabled>
                                  Deal Closed
                                </Button>
                              ) : isEnquiryOutdated(enquiry) ? (
                                <Button variant="outline" size="sm" className="w-full h-6 text-[8px] font-semibold border-2 border-gray-300 bg-white text-gray-500" disabled>
                                  Expired
                                </Button>
                              ) : (
                              <Button 
                                className="w-full h-6 text-[8px] font-black text-white border-0 hover:scale-105 active:scale-95 transition-all duration-200 rounded-md relative overflow-hidden"
                                onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                style={{
                                  background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #1e40af)',
                                  boxShadow: '0 10px 20px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px'
                                }}
                              >
                                {/* 3D Border Effect */}
                                <div className="absolute inset-0 rounded-md border-2 border-blue-800/50 pointer-events-none" 
                                  style={{
                                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.4)'
                                  }}
                                />
                                
                                {/* Top highlight for 3D effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-md bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
                                
                                {/* Side highlights for depth */}
                                <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-md bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-md bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
                                
                                {/* Bottom shadow for depth */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-md bg-gradient-to-t from-black/30 via-black/20 to-transparent pointer-events-none" />
                                
                                {/* Inner depth shadow */}
                                <div className="absolute inset-0.5 rounded-sm bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />
                                
                                <span className="relative z-10 flex items-center" style={{ transform: 'translateZ(10px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                  Sell
                                  <ArrowRight className="h-2 w-2 ml-0.5" />
                                </span>
                              </Button>
                              )
                            ) : (
                              <Link to="/signin" className="w-full block">
                                <Button className="w-full h-6 text-[8px] font-black bg-black hover:bg-gray-900 text-white border-[0.5px] border-black hover:scale-105 active:scale-95 transition-all duration-200 rounded-md relative overflow-hidden">
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-md pointer-events-none" />
                                  <span className="relative z-10">Sign In to Respond</span>
                                </Button>
                              </Link>
                            )}
                            </div>
                          </div>
                          </>
                        ) : (
                          <div className="space-y-1.5 sm:space-y-2.5 mt-auto sm:-mt-6 lg:-mt-4">
                            {isOwnEnquiry(enquiry) ? (
                              <button 
                                type="button"
                                disabled
                                className="w-full h-6 sm:h-10 text-[8px] sm:text-xs font-bold border-2 sm:border-4 border-black text-white cursor-not-allowed transition-all duration-200 rounded-md sm:rounded-xl"
                                style={{ backgroundColor: '#022c22' }}
                              >
                                Your Enquiry
                              </button>
                            ) : authUser ? (
                              isDealClosed(enquiry) ? (
                                <Button variant="outline" size="sm" className="w-full h-6 sm:h-10 text-[8px] sm:text-xs font-bold border-2 border-gray-300 bg-gray-50 text-gray-500 transition-all duration-200 rounded-md sm:rounded-xl" disabled>
                                  Deal Closed
                                </Button>
                              ) : isEnquiryOutdated(enquiry) ? (
                                <Button variant="outline" size="sm" className="w-full h-6 sm:h-10 text-[8px] sm:text-xs font-bold border-2 border-gray-300 bg-gray-50 text-gray-500 transition-all duration-200 rounded-md sm:rounded-xl" disabled>
                                  Expired
                                </Button>
                              ) : (
                              <Button 
                                className="w-full h-6 sm:h-10 text-[8px] sm:text-xs font-black text-white border-0 hover:scale-105 active:scale-95 transition-all duration-200 rounded-md sm:rounded-xl relative overflow-hidden"
                                onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                style={{
                                  background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #1e40af)',
                                  boxShadow: '0 10px 20px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
                                  transformStyle: 'preserve-3d',
                                  perspective: '1000px'
                                }}
                              >
                                {/* 3D Border Effect */}
                                <div className="absolute inset-0 rounded-md sm:rounded-xl border-2 border-blue-800/50 pointer-events-none" 
                                  style={{
                                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.4)'
                                  }}
                                />
                                
                                {/* Top highlight for 3D effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-md sm:rounded-t-xl bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
                                
                                {/* Side highlights for depth */}
                                <div className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-md sm:rounded-l-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-md sm:rounded-r-xl bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
                                
                                {/* Bottom shadow for depth */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-md sm:rounded-b-xl bg-gradient-to-t from-black/30 via-black/20 to-transparent pointer-events-none" />
                                
                                {/* Inner depth shadow */}
                                <div className="absolute inset-0.5 rounded-sm sm:rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/20 pointer-events-none" />
                                
                                <span className="relative z-10 flex items-center" style={{ transform: 'translateZ(10px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                  Sell
                                  <ArrowRight className="h-2 w-2 sm:h-3.5 sm:w-3.5 ml-1 sm:ml-2" />
                                </span>
                              </Button>
                              )
                            ) : (
                              <Link to="/signin">
                                <Button className="w-full h-6 sm:h-10 text-[8px] sm:text-xs font-black bg-black hover:bg-gray-900 text-white border-[0.5px] border-black hover:scale-105 active:scale-95 transition-all duration-200 rounded-md sm:rounded-xl relative overflow-hidden">
                                  {/* Physical button depth effect */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-md sm:rounded-xl pointer-events-none" />
                                  <span className="relative z-10">Sign In to Respond</span>
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>

            {/* 🚀 PAGINATION: Load More Button */}
            {hasMore && displayEnquiries.length > displayedEnquiries.length && (
              <div className="flex justify-center mt-8 mb-4">
                <Button
                  onClick={loadMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Load More ({displayEnquiries.length - displayedEnquiries.length} remaining)
                </Button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No enquiries found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No live enquiries available at the moment"}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
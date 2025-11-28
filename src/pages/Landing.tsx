import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Search, Users, CheckCircle, Clock, Heart, BarChart3, FileText, MessageSquare, Eye, Calendar, Share2, MapPin, Check, Bookmark, Home, Briefcase, Package, Car, Sprout } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import newLogo from "@/assets/new-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import CountdownTimer from "@/components/CountdownTimer";
import { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, updateDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { createPortal } from "react-dom";
import { formatIndianCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: "Trust Badge (Optional)",
      description: "Get a trust badge, since the world doesn't trust you"
    },
    {
      icon: Search,
      title: "AI-Powered Discovery",
      description: "We do not exploit unpaid interns"
    },
    {
      icon: Users,
      title: "Simple & Safe",
      description: "We don't need your data; we already have a revenue model"
    }
  ];

  // All categories from enquiry form
  const allEnquiryCategories = [
    { value: "jobs", label: "Jobs & Employment" },
    { value: "professional-services", label: "Professional Services" },
    { value: "real-estate", label: "Real Estate" },
    { value: "real-estate-services", label: "Real Estate Services" },
    { value: "legal-financial", label: "Legal & Financial" },
    { value: "marketing-advertising", label: "Marketing & Advertising" },
    { value: "insurance-services", label: "Insurance Services" },
    { value: "government-public", label: "Government & Public" },
    { value: "non-profit-charity", label: "Non-Profit & Charity" },
    { value: "antiques", label: "Antiques" },
    { value: "art", label: "Art & Artifacts" },
    { value: "automobile", label: "Automobile" },
    { value: "books-publications", label: "Books & Publications" },
    { value: "collectibles", label: "Collectibles" },
    { value: "electronics-gadgets", label: "Electronics & Gadgets" },
    { value: "fashion-apparel", label: "Fashion & Apparel" },
    { value: "home-furniture", label: "Home & Furniture" },
    { value: "jewelry-accessories", label: "Jewelry & Accessories" },
    { value: "memorabilia", label: "Memorabilia" },
    { value: "sneakers", label: "Sneakers" },
    { value: "souvenir", label: "Souvenir" },
    { value: "thrift", label: "Thrift" },
    { value: "vintage", label: "Vintage Items" },
    { value: "agriculture-farming", label: "Agriculture & Farming" },
    { value: "childcare-family", label: "Childcare & Family" },
    { value: "education-training", label: "Education & Training" },
    { value: "entertainment-media", label: "Entertainment & Media" },
    { value: "events-entertainment", label: "Events & Entertainment" },
    { value: "food-beverage", label: "Food & Beverage" },
    { value: "gaming-recreation", label: "Gaming & Recreation" },
    { value: "health-beauty", label: "Health & Beauty" },
    { value: "pets", label: "Pets & Animals" },
    { value: "sports-outdoor", label: "Sports & Outdoor" },
    { value: "travel-tourism", label: "Travel & Tourism" },
    { value: "wedding-events", label: "Wedding & Events" },
    { value: "technology", label: "Technology" },
    { value: "renewable-energy", label: "Renewable Energy" },
    { value: "construction-renovation", label: "Construction & Renovation" },
    { value: "raw-materials-industrial", label: "Raw Materials & Industrial" },
    { value: "transportation-logistics", label: "Transportation & Logistics" },
    { value: "waste-management", label: "Waste Management" },
    { value: "security-safety", label: "Security & Safety" },
    { value: "other", label: "Other" }
  ];

  // Icon mapping for categories
  const getCategoryIcon = (value: string) => {
    const iconMap: { [key: string]: any } = {
      "jobs": Briefcase,
      "professional-services": Briefcase,
      "real-estate": Home,
      "real-estate-services": Home,
      "legal-financial": FileText,
      "marketing-advertising": BarChart3,
      "insurance-services": Shield,
      "government-public": Users,
      "non-profit-charity": Heart,
      "antiques": Package,
      "art": Package,
      "automobile": Car,
      "books-publications": FileText,
      "collectibles": Package,
      "electronics-gadgets": Package,
      "fashion-apparel": Package,
      "home-furniture": Home,
      "jewelry-accessories": Package,
      "memorabilia": Package,
      "sneakers": Package,
      "souvenir": Package,
      "thrift": Package,
      "vintage": Package,
      "agriculture-farming": Sprout,
      "childcare-family": Heart,
      "education-training": FileText,
      "entertainment-media": MessageSquare,
      "events-entertainment": Calendar,
      "food-beverage": Package,
      "gaming-recreation": Package,
      "health-beauty": Heart,
      "pets": Heart,
      "sports-outdoor": Package,
      "travel-tourism": Calendar,
      "wedding-events": Calendar,
      "technology": Package,
      "renewable-energy": Sprout,
      "construction-renovation": Home,
      "raw-materials-industrial": Package,
      "transportation-logistics": Car,
      "waste-management": Package,
      "security-safety": Shield,
      "other": Package
    };
    return iconMap[value] || Package;
  };

  // State for shuffled categories (showing 6 at a time)
  const [displayedCategories, setDisplayedCategories] = useState<any[]>([]);
  const [isShufflingCategories, setIsShufflingCategories] = useState(false);

  // Function to shuffle and get 6 random categories
  const getRandomCategories = () => {
    const shuffled = [...allEnquiryCategories].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6).map(cat => ({
      name: cat.label,
      icon: getCategoryIcon(cat.value),
      value: cat.value
    }));
  };

  // Initialize and shuffle categories every 20 seconds
  useEffect(() => {
    // Set initial categories
    setDisplayedCategories(getRandomCategories());

    // Shuffle every 20 seconds
    const interval = setInterval(() => {
      setIsShufflingCategories(true);
      setTimeout(() => {
        setDisplayedCategories(getRandomCategories());
        setTimeout(() => {
          setIsShufflingCategories(false);
        }, 100);
      }, 500); // Fade out duration
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  const { user, signOut } = useAuth();
  const notificationContext = useContext(NotificationContext);
  const createNotification = notificationContext?.createNotification || (async () => {
    console.warn('NotificationContext not available');
  });
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    enquiries: 0,
    responses: 0,
    views: 0,
    lastActivity: null as any
  });
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  
  // Public recent enquiries for all users
  const [publicRecentEnquiries, setPublicRecentEnquiries] = useState<any[]>([]);
  // All live enquiries for count and search
  const [allLiveEnquiries, setAllLiveEnquiries] = useState<any[]>([]);
  // State for shuffled display
  const [shuffledEnquiries, setShuffledEnquiries] = useState<any[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  // State for showing more enquiries
  const [showAllEnquiries, setShowAllEnquiries] = useState(false);
  // State for expanded card (for hover/click interaction)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0, width: 0 });
  const [savedEnquiries, setSavedEnquiries] = useState<string[]>([]);
  // Track window width for responsive behavior
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Keyword to category mapping for smart search
  const keywordToCategory = {
    'car': 'automobile',
    'vehicle': 'automobile',
    'auto': 'automobile',
    'bike': 'automobile',
    'motorcycle': 'automobile',
    'house': 'real-estate',
    'home': 'real-estate',
    'property': 'real-estate',
    'apartment': 'real-estate',
    'job': 'jobs',
    'work': 'jobs',
    'employment': 'jobs',
    'career': 'jobs',
    'phone': 'electronics-gadgets',
    'mobile': 'electronics-gadgets',
    'laptop': 'electronics-gadgets',
    'computer': 'electronics-gadgets',
    'gadget': 'electronics-gadgets',
    'electronic': 'electronics-gadgets',
    'clothes': 'fashion-apparel',
    'fashion': 'fashion-apparel',
    'dress': 'fashion-apparel',
    'shirt': 'fashion-apparel',
    'furniture': 'home-furniture',
    'sofa': 'home-furniture',
    'chair': 'home-furniture',
    'table': 'home-furniture',
    'service': 'professional-services',
    'help': 'professional-services',
    'repair': 'professional-services',
    'fix': 'professional-services',
    'food': 'food-beverage',
    'restaurant': 'food-beverage',
    'catering': 'food-beverage',
    'travel': 'travel-tourism',
    'tourism': 'travel-tourism',
    'vacation': 'travel-tourism',
    'hotel': 'travel-tourism',
    'education': 'education-training',
    'training': 'education-training',
    'course': 'education-training',
    'learn': 'education-training',
    'tech': 'technology',
    'technology': 'technology',
    'software': 'technology',
    'app': 'technology',
    'gaming': 'gaming-recreation',
    'game': 'gaming-recreation',
    'entertainment': 'entertainment-media',
    'media': 'entertainment-media',
    'wedding': 'wedding-events',
    'event': 'wedding-events',
    'party': 'wedding-events',
    'childcare': 'childcare-family',
    'baby': 'childcare-family',
    'kids': 'childcare-family',
    'construction': 'construction-renovation',
    'renovation': 'construction-renovation',
    'building': 'construction-renovation',
    'legal': 'legal-financial',
    'lawyer': 'legal-financial',
    'finance': 'legal-financial',
    'money': 'legal-financial',
    'marketing': 'marketing-advertising',
    'advertising': 'marketing-advertising',
    'promotion': 'marketing-advertising',
    'insurance': 'insurance-services',
    'security': 'security-safety',
    'safety': 'security-safety',
    'transport': 'transportation-logistics',
    'logistics': 'transportation-logistics',
    'shipping': 'transportation-logistics'
  };

  // Search function - redirects to Live Enquiries page with category filter
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Add to recent searches
    const newRecentSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    
    // Check if search term matches any keyword category
    const matchedCategory = keywordToCategory[searchLower];
    
    if (matchedCategory) {
      // Redirect to Live Enquiries page with category filter
      navigate(`/enquiries?category=${matchedCategory}`);
    } else {
      // For general searches, redirect to Live Enquiries page with search term
      navigate(`/enquiries?search=${encodeURIComponent(searchTerm)}`);
    }
    
    // Clear search term after redirect
    setTimeout(() => {
      setSearchTerm("");
      setIsSearching(false);
      setShowSearchSuggestions(false);
    }, 100);
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.log('Error loading recent searches');
      }
    }
  }, []);

  // Popular search suggestions
  const popularSearches = [
    'car', 'house', 'job', 'phone', 'furniture', 'services', 'electronics', 'fashion'
  ];

  // Get search suggestions based on current input
  const getSearchSuggestions = () => {
    if (!searchTerm.trim()) {
      // Remove duplicates by converting to Set and back to array
      const uniqueSuggestions = Array.from(new Set([...recentSearches, ...popularSearches]));
      return uniqueSuggestions.slice(0, 6);
    }
    
    const allSuggestions = [...recentSearches, ...popularSearches];
    // Remove duplicates and filter
    const uniqueFiltered = Array.from(new Set(allSuggestions))
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return uniqueFiltered.slice(0, 6);
  };

  // Update search position for portal
  const updateSearchPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setSearchPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Use shuffled enquiries for display (search redirects to Live Enquiries page)
  // Final deduplication before rendering to prevent any duplicates
  const filteredEnquiries = Array.from(
    new Map(shuffledEnquiries.map(e => [e.id, e])).values()
  );

  // Load saved enquiries on mount
  useEffect(() => {
    if (!user?.uid) return;

    const loadSavedEnquiries = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const savedIds = profileDoc.data()?.savedEnquiries || [];
          setSavedEnquiries(savedIds);
        }
      } catch (error) {
        console.error('Error loading saved enquiries:', error);
      }
    };

    loadSavedEnquiries();
  }, [user?.uid]);

  // Handle save functionality
  const handleSave = async (enquiryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save enquiries.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userRef = doc(db, 'profiles', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Toggle saved state
      if (savedEnquiries.includes(enquiryId)) {
        // Remove from saved
        setSavedEnquiries(savedEnquiries.filter(id => id !== enquiryId));
        
        // Update user's saved enquiries in Firestore
        if (userDoc.exists()) {
          await updateDoc(userRef, {
            savedEnquiries: arrayRemove(enquiryId)
          });
        } else {
          // Create profile if it doesn't exist with empty saved enquiries
          await setDoc(userRef, {
            savedEnquiries: []
          });
        }
      } else {
        // Add to saved
        setSavedEnquiries([...savedEnquiries, enquiryId]);
        
        // Update user's saved enquiries in Firestore
        if (userDoc.exists()) {
          await updateDoc(userRef, {
            savedEnquiries: arrayUnion(enquiryId)
          });
        } else {
          // Create profile with saved enquiry
          await setDoc(userRef, {
            savedEnquiries: [enquiryId]
          });
        }
      }
    } catch (error) {
      console.error('Error updating save:', error);
      toast({
        title: "Error",
        description: "Failed to save enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle share functionality
  const handleShare = async (enquiry: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/respond/${enquiry.id}`;
    const shareText = `Check out this enquiry: ${enquiry.title}`;
    
    // Update share count in database
    try {
      const enquiryRef = doc(db, 'enquiries', enquiry.id);
      await updateDoc(enquiryRef, {
        shares: (enquiry.shares || 0) + 1
      });
    } catch (error) {
      console.error('Error updating share count:', error);
    }
    
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: enquiry.title,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareUrl, shareText);
        }
      }
    } else {
      fallbackShare(shareUrl, shareText);
    }
  };

  // Get category-specific mural/illustration
  const getCategoryMural = (category: string) => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '-');
    
    // Color schemes for different categories
    const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
      'automobile': { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
      'electronics-gadgets': { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
      'fashion-apparel': { primary: '#EC4899', secondary: '#F472B6', accent: '#F9A8D4' },
      'home-furniture': { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' },
      'real-estate': { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
      'jobs': { primary: '#6366F1', secondary: '#818CF8', accent: '#A5B4FC' },
      'professional-services': { primary: '#14B8A6', secondary: '#2DD4BF', accent: '#5EEAD4' },
      'food-beverage': { primary: '#EF4444', secondary: '#F87171', accent: '#FCA5A5' },
      'health-beauty': { primary: '#EC4899', secondary: '#F472B6', accent: '#F9A8D4' },
      'travel-tourism': { primary: '#06B6D4', secondary: '#22D3EE', accent: '#67E8F9' },
      'default': { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' }
    };

    const colors = colorSchemes[categoryKey] || colorSchemes['default'];

    // Category-specific illustrations
    const murals: Record<string, JSX.Element> = {
      'automobile': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#carGrad)" />
          {/* Minimalist car */}
          <path d="M 40 50 L 60 50 L 70 35 L 130 35 L 140 50 L 160 50 L 160 60 L 40 60 Z" 
                fill={colors.primary} opacity="0.2" />
          <circle cx="65" cy="60" r="8" fill={colors.primary} opacity="0.3" />
          <circle cx="135" cy="60" r="8" fill={colors.primary} opacity="0.3" />
          <rect x="75" y="40" width="50" height="10" fill={colors.secondary} opacity="0.2" rx="2" />
          {/* Road lines */}
          <line x1="10" y1="70" x2="50" y2="70" stroke={colors.accent} strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
          <line x1="150" y1="70" x2="190" y2="70" stroke={colors.accent} strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
        </svg>
      ),
      'electronics-gadgets': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#techGrad)" />
          {/* Smartphone */}
          <rect x="60" y="20" width="35" height="50" fill={colors.primary} opacity="0.2" rx="4" />
          <rect x="65" y="25" width="25" height="35" fill={colors.secondary} opacity="0.15" rx="2" />
          <circle cx="77.5" cy="67" r="3" fill={colors.accent} opacity="0.3" />
          {/* Laptop */}
          <rect x="105" y="35" width="50" height="30" fill={colors.primary} opacity="0.2" rx="2" />
          <rect x="100" y="65" width="60" height="3" fill={colors.primary} opacity="0.3" rx="1" />
          {/* Circuit lines */}
          <path d="M 20 30 L 40 30 L 40 50 L 55 50" stroke={colors.accent} strokeWidth="1.5" opacity="0.2" fill="none" />
          <circle cx="20" cy="30" r="2" fill={colors.accent} opacity="0.3" />
          <circle cx="55" cy="50" r="2" fill={colors.accent} opacity="0.3" />
        </svg>
      ),
      'fashion-apparel': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fashionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#fashionGrad)" />
          {/* T-shirt */}
          <path d="M 60 25 L 75 30 L 75 25 L 85 25 L 85 30 L 100 25 L 105 35 L 100 40 L 100 65 L 60 65 L 60 40 L 55 35 Z" 
                fill={colors.primary} opacity="0.2" />
          <rect x="75" y="32" width="10" height="8" fill={colors.secondary} opacity="0.15" rx="1" />
          {/* Hanger */}
          <path d="M 120 22 L 135 22" stroke={colors.primary} strokeWidth="2" opacity="0.2" />
          <path d="M 127.5 22 L 127.5 30" stroke={colors.primary} strokeWidth="1.5" opacity="0.2" />
          {/* Sparkle */}
          <path d="M 150 35 L 152 40 L 157 42 L 152 44 L 150 49 L 148 44 L 143 42 L 148 40 Z" 
                fill={colors.accent} opacity="0.3" />
        </svg>
      ),
      'home-furniture': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#homeGrad)" />
          {/* Sofa */}
          <rect x="50" y="40" width="70" height="25" fill={colors.primary} opacity="0.2" rx="3" />
          <rect x="45" y="35" width="10" height="30" fill={colors.primary} opacity="0.25" rx="2" />
          <rect x="115" y="35" width="10" height="30" fill={colors.primary} opacity="0.25" rx="2" />
          <rect x="60" y="28" width="50" height="12" fill={colors.secondary} opacity="0.15" rx="2" />
          {/* Lamp */}
          <circle cx="140" cy="25" r="8" fill={colors.accent} opacity="0.2" />
          <rect x="138" y="33" width="4" height="20" fill={colors.primary} opacity="0.2" />
          <ellipse cx="140" cy="53" rx="10" ry="3" fill={colors.primary} opacity="0.2" />
          {/* Plant */}
          <ellipse cx="165" cy="58" rx="8" ry="4" fill={colors.primary} opacity="0.2" />
          <path d="M 165 58 Q 160 48 162 40" stroke={colors.secondary} strokeWidth="2" opacity="0.2" fill="none" />
          <path d="M 165 58 Q 170 48 168 40" stroke={colors.secondary} strokeWidth="2" opacity="0.2" fill="none" />
        </svg>
      ),
      'real-estate': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#houseGrad)" />
          {/* House */}
          <polygon points="100,20 60,50 60,70 140,70 140,50" fill={colors.primary} opacity="0.2" />
          <polygon points="100,20 140,50 140,35 120,35 120,50" fill={colors.primary} opacity="0.25" />
          {/* Door */}
          <rect x="88" y="50" width="24" height="20" fill={colors.secondary} opacity="0.2" rx="1" />
          <circle cx="105" cy="60" r="1.5" fill={colors.accent} opacity="0.4" />
          {/* Windows */}
          <rect x="68" y="52" width="12" height="10" fill={colors.accent} opacity="0.15" rx="1" />
          <rect x="120" y="52" width="12" height="10" fill={colors.accent} opacity="0.15" rx="1" />
          {/* Chimney */}
          <rect x="115" y="25" width="8" height="15" fill={colors.primary} opacity="0.2" />
          {/* Trees */}
          <circle cx="35" cy="55" r="12" fill={colors.secondary} opacity="0.15" />
          <rect x="32" y="55" width="6" height="15" fill={colors.primary} opacity="0.15" />
          <circle cx="165" cy="55" r="12" fill={colors.secondary} opacity="0.15" />
          <rect x="162" y="55" width="6" height="15" fill={colors.primary} opacity="0.15" />
        </svg>
      ),
      'jobs': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="jobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#jobGrad)" />
          {/* Briefcase */}
          <rect x="70" y="35" width="60" height="35" fill={colors.primary} opacity="0.2" rx="3" />
          <rect x="95" y="30" width="10" height="5" fill={colors.primary} opacity="0.25" rx="1" />
          <rect x="80" y="45" width="40" height="3" fill={colors.secondary} opacity="0.15" />
          {/* Person silhouette */}
          <circle cx="45" cy="35" r="8" fill={colors.primary} opacity="0.2" />
          <ellipse cx="45" cy="55" rx="12" ry="15" fill={colors.primary} opacity="0.2" />
          {/* Graph going up */}
          <polyline points="140,60 150,50 160,55 170,40" stroke={colors.accent} strokeWidth="2.5" opacity="0.3" fill="none" />
          <circle cx="170" cy="40" r="3" fill={colors.accent} opacity="0.3" />
        </svg>
      ),
      'professional-services': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="serviceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#serviceGrad)" />
          {/* Handshake concept */}
          <ellipse cx="70" cy="45" rx="18" ry="20" fill={colors.primary} opacity="0.2" />
          <ellipse cx="130" cy="45" rx="18" ry="20" fill={colors.primary} opacity="0.2" />
          <rect x="85" y="38" width="30" height="14" fill={colors.secondary} opacity="0.2" rx="2" />
          {/* Stars */}
          <path d="M 40 30 L 42 35 L 47 35 L 43 38 L 45 43 L 40 40 L 35 43 L 37 38 L 33 35 L 38 35 Z" 
                fill={colors.accent} opacity="0.3" />
          <path d="M 160 28 L 162 33 L 167 33 L 163 36 L 165 41 L 160 38 L 155 41 L 157 36 L 153 33 L 158 33 Z" 
                fill={colors.accent} opacity="0.3" />
          {/* Check mark */}
          <path d="M 95 60 L 100 65 L 110 52" stroke={colors.primary} strokeWidth="3" opacity="0.3" fill="none" strokeLinecap="round" />
        </svg>
      ),
      'food-beverage': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#foodGrad)" />
          {/* Plate with food */}
          <ellipse cx="85" cy="50" rx="35" ry="8" fill={colors.primary} opacity="0.2" />
          <ellipse cx="85" cy="48" rx="25" ry="12" fill={colors.secondary} opacity="0.2" />
          <circle cx="75" cy="45" r="6" fill={colors.accent} opacity="0.3" />
          <circle cx="85" cy="42" r="7" fill={colors.accent} opacity="0.3" />
          <circle cx="95" cy="45" r="5" fill={colors.accent} opacity="0.3" />
          {/* Beverage cup */}
          <path d="M 125 35 L 130 60 L 155 60 L 160 35 Z" fill={colors.primary} opacity="0.2" />
          <ellipse cx="142.5" cy="35" rx="17.5" ry="5" fill={colors.primary} opacity="0.25" />
          <rect x="160" y="42" width="15" height="4" fill={colors.primary} opacity="0.2" rx="2" />
          {/* Steam */}
          <path d="M 135 28 Q 133 23 135 18" stroke={colors.accent} strokeWidth="1.5" opacity="0.3" fill="none" />
          <path d="M 145 28 Q 143 23 145 18" stroke={colors.accent} strokeWidth="1.5" opacity="0.3" fill="none" />
          <path d="M 155 28 Q 153 23 155 18" stroke={colors.accent} strokeWidth="1.5" opacity="0.3" fill="none" />
        </svg>
      ),
      'health-beauty': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#healthGrad)" />
          {/* Heart rate */}
          <polyline points="30,45 50,45 60,30 70,60 80,40 90,45 110,45" 
                    stroke={colors.primary} strokeWidth="2.5" opacity="0.25" fill="none" />
          {/* Heart */}
          <path d="M 100 50 C 100 45 95 40 90 40 C 87 40 85 42 85 45 C 85 42 83 40 80 40 C 75 40 70 45 70 50 C 70 58 85 65 85 65 C 85 65 100 58 100 50 Z" 
                fill={colors.accent} opacity="0.3" />
          {/* Sparkles */}
          <path d="M 130 35 L 132 40 L 137 42 L 132 44 L 130 49 L 128 44 L 123 42 L 128 40 Z" 
                fill={colors.accent} opacity="0.3" />
          <path d="M 155 30 L 157 35 L 162 37 L 157 39 L 155 44 L 153 39 L 148 37 L 153 35 Z" 
                fill={colors.accent} opacity="0.3" />
          {/* Cosmetic bottle */}
          <rect x="140" y="48" width="18" height="25" fill={colors.primary} opacity="0.2" rx="2" />
          <rect x="143" y="43" width="12" height="5" fill={colors.primary} opacity="0.25" rx="1" />
        </svg>
      ),
      'travel-tourism': (
        <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="travelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#travelGrad)" />
          {/* Airplane */}
          <path d="M 60 40 L 80 40 L 90 30 L 100 30 L 100 35 L 90 45 L 90 55 L 95 58 L 95 60 L 85 57 L 80 60 L 80 58 L 75 55 L 75 45 L 65 35 L 60 35 Z" 
                fill={colors.primary} opacity="0.2" />
          {/* Clouds */}
          <ellipse cx="130" cy="30" rx="15" ry="8" fill={colors.secondary} opacity="0.15" />
          <ellipse cx="145" cy="30" rx="18" ry="10" fill={colors.secondary} opacity="0.15" />
          <ellipse cx="160" cy="30" rx="12" ry="7" fill={colors.secondary} opacity="0.15" />
          {/* Sun */}
          <circle cx="40" cy="30" r="10" fill={colors.accent} opacity="0.2" />
          <circle cx="40" cy="30" r="6" fill={colors.accent} opacity="0.3" />
          {/* Suitcase */}
          <rect x="120" y="50" width="35" height="25" fill={colors.primary} opacity="0.2" rx="2" />
          <rect x="132" y="47" width="11" height="3" fill={colors.primary} opacity="0.25" rx="1" />
          <line x1="130" y1="57" x2="145" y2="57" stroke={colors.secondary} strokeWidth="2" opacity="0.2" />
        </svg>
      )
    };

    return murals[categoryKey] || murals['default'] || (
      <svg viewBox="0 0 200 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect width="200" height="80" fill="url(#defaultGrad)" />
        {/* Generic shopping bag */}
        <path d="M 75 35 L 70 70 L 130 70 L 125 35 Z" fill={colors.primary} opacity="0.2" />
        <path d="M 85 35 Q 85 25 100 25 Q 115 25 115 35" stroke={colors.primary} strokeWidth="2" opacity="0.25" fill="none" />
        {/* Star */}
        <path d="M 100 45 L 103 53 L 112 53 L 105 58 L 108 66 L 100 61 L 92 66 L 95 58 L 88 53 L 97 53 Z" 
              fill={colors.accent} opacity="0.3" />
      </svg>
    );
  };

  const fallbackShare = (url: string, text: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
      // Link copied silently - no popup
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${text}\n${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      // Link copied silently - no popup
    });
  };

  // Helper to shuffle and pick 3 unique enquiries
  function getRandomThree(arr: any[]) {
    if (arr.length <= 3) return arr;
    const shuffled = arr.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // Helper to check if an enquiry is expired (copied from EnquiryWall)
  function isEnquiryOutdated(enquiry: any) {
    if (!enquiry.deadline) return false;
    const deadline = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
    return new Date() > deadline;
  }

  // Fetch public recent enquiries (visible to all users)
  useEffect(() => {
    // Fetch all enquiries and filter client-side to ensure all 'live' enquiries are shown
    // This ensures we catch all admin-approved enquiries regardless of query/index issues
    const q = query(
      collection(db, 'enquiries'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log('📊 Landing: Total enquiries from query:', items.length);
      
      // Filter to only show enquiries with status='live' (admin accepted)
      // Use case-insensitive check to catch any variations
      const liveStatusItems = items.filter(e => {
        const status = (e.status || '').toLowerCase().trim();
        return status === 'live';
      });
      
      console.log('📊 Landing: Enquiries with status=live:', liveStatusItems.length);
      
      // Deduplicate by ID first (in case same document appears multiple times)
      const uniqueItems = Array.from(
        new Map(liveStatusItems.map(e => [e.id, e])).values()
      );
      
      // Filter out expired enquiries - only show live (not expired) enquiries
      const now = new Date();
      const liveEnquiries = uniqueItems.filter(enquiry => {
        if (!enquiry.deadline) return true; // No deadline = live
        try {
          const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
          return deadlineDate.getTime() >= now.getTime();
        } catch {
          return true; // If error, assume live
        }
      });
      
      console.log('📊 Landing: Live enquiries (not expired):', liveEnquiries.length);
      
      // Sort live enquiries by createdAt (newest first)
      liveEnquiries.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
      
      // Set all live enquiries for count and search (includes expired for count/search)
      setAllLiveEnquiries(uniqueItems);
      
      // Set display enquiries - only live (not expired) enquiries for the 3 cards
      // Store all live enquiries for shuffling (not just first 3)
      setPublicRecentEnquiries(liveEnquiries);
      
      // Set initial shuffled display (3 random from all live enquiries)
      const initialShuffled = getRandomThree(liveEnquiries);
      setShuffledEnquiries(initialShuffled);
    }, (error) => {
      console.error('Error loading enquiries:', error);
      // Set empty arrays on error
      setAllLiveEnquiries([]);
      setPublicRecentEnquiries([]);
      setShuffledEnquiries([]);
    });
    return () => unsubscribe();
  }, []);

  // Shuffle every 5 seconds - only shuffle live (not expired) enquiries
  useEffect(() => {
    // Deduplicate before processing
    const uniqueEnquiries = Array.from(
      new Map(publicRecentEnquiries.map(e => [e.id, e])).values()
    );
    
    // Filter out expired enquiries (in case any slipped through)
    const now = new Date();
    const liveOnlyEnquiries = uniqueEnquiries.filter(enquiry => {
      if (!enquiry.deadline) return true; // No deadline = live
      try {
        const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
        return deadlineDate.getTime() >= now.getTime();
      } catch {
        return true; // If error, assume live
      }
    });
    
    if (liveOnlyEnquiries.length <= 1) {
      setShuffledEnquiries(liveOnlyEnquiries);
      return;
    }
    
    // Set initial shuffled (deduplicated, live only)
    const initialShuffled = getRandomThree(liveOnlyEnquiries);
    const uniqueInitial = Array.from(
      new Map(initialShuffled.map(e => [e.id, e])).values()
    );
    setShuffledEnquiries(uniqueInitial);
    
    const interval = setInterval(() => {
      // Re-filter to ensure we only shuffle live enquiries
      const currentLiveEnquiries = liveOnlyEnquiries.filter(enquiry => {
        if (!enquiry.deadline) return true;
        try {
          const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
          return deadlineDate.getTime() >= now.getTime();
        } catch {
          return true;
        }
      });
      
      if (currentLiveEnquiries.length > 0) {
        // Trigger shuffle animation - smooth fade out
        setIsShuffling(true);
        
        // Wait for smooth fade out (500ms for smooth transition), then update cards
        setTimeout(() => {
          const shuffled = getRandomThree(currentLiveEnquiries);
          const uniqueShuffled = Array.from(
            new Map(shuffled.map(e => [e.id, e])).values()
          );
          setShuffledEnquiries(uniqueShuffled);
          
          // Smooth fade in new cards (small delay for seamless transition)
          setTimeout(() => {
            setIsShuffling(false);
          }, 100);
        }, 500);
      }
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [publicRecentEnquiries]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Track window width for responsive card behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user's dashboard data
  useEffect(() => {
    if (!user) return;

    // Fetch user's enquiries (without orderBy to avoid index requirement)
    const enquiriesQuery = query(
      collection(db, 'enquiries'),
      where('userId', '==', user.uid),
      limit(10) // Increased limit since we'll sort in JS
    );

    // Simple function to load user data
    const loadUserData = async () => {
      try {
        // Load enquiries
        const enquiriesSnap = await getDocs(enquiriesQuery);
        const items: any[] = [];
        enquiriesSnap.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            title: data.title,
            status: data.status,
            createdAt: data.createdAt,
            views: data.views || 0,
            responses: data.responses || 0
          });
        });
        
        // Sort by createdAt in JavaScript (newest first) and limit to 3
        const sortedItems = items
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime(); // Descending order
          })
          .slice(0, 3);
        
        setRecentEnquiries(sortedItems);
        setUserStats(prev => ({ ...prev, enquiries: sortedItems.length }));

        // Load responses if we have enquiries
        if (sortedItems.length > 0) {
          const responsesQuery = query(
            collection(db, 'submissions'),
            where('enquiryId', 'in', sortedItems.map(e => e.id)),
            limit(10)
          );

          const responsesSnap = await getDocs(responsesQuery);
          const responseItems: any[] = [];
          responsesSnap.forEach((doc) => {
            const data = doc.data();
            responseItems.push({
              id: doc.id,
              enquiryTitle: data.enquiryTitle,
              message: data.message,
              price: data.price,
              status: data.status,
              createdAt: data.createdAt
            });
          });
          
          // Sort by createdAt in JavaScript (newest first) and limit to 3
          const sortedResponseItems = responseItems
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime(); // Descending order
            })
            .slice(0, 3);
          
          setRecentResponses(sortedResponseItems);
          setUserStats(prev => ({ ...prev, responses: sortedResponseItems.length }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Set empty arrays on error
        setRecentEnquiries([]);
        setRecentResponses([]);
        setUserStats(prev => ({ ...prev, enquiries: 0, responses: 0 }));
      }
    };

    loadUserData();
  }, [user, recentEnquiries.length]);

  // Real-time notification listeners for authenticated users
  useEffect(() => {
    if (!user) return;

    // Set up real-time notification listeners

    // Set up real-time listener for new responses to user's enquiries
    let unsubscribeResponses = () => {};
    
    if (recentEnquiries.length > 0 && Array.isArray(recentEnquiries)) {
      try {
        // Limit to 10 enquiries to avoid Firestore query limits (max 10 items in "in" query)
        const enquiryIds = recentEnquiries.slice(0, 10).map(e => e?.id).filter(Boolean);
        
        if (enquiryIds.length > 0) {
          // Remove orderBy to avoid requiring a composite index
          // We'll sort in JavaScript after fetching
          const responsesQuery = query(
            collection(db, 'sellerSubmissions'),
            where('enquiryId', 'in', enquiryIds)
          );
          
          unsubscribeResponses = onSnapshot(
            responsesQuery, 
            (snapshot) => {
              try {
                snapshot.docChanges().forEach((change) => {
                  try {
                    if (change.type === 'added') {
                      const responseData = change.doc.data();
                      if (!responseData || !responseData.enquiryId) return;
                      
                      const enquiry = recentEnquiries.find(e => e?.id === responseData.enquiryId);
                      
                      if (enquiry && enquiry.id) {
                        if (responseData.status === 'approved') {
                          // Create notification for new live response
                          createNotification('new_response', {
                            title: '🎯 New Response to Your Enquiry!',
                            message: `"${responseData.sellerName || 'A seller'}" responded to "${enquiry.title}"`,
                            priority: 'high',
                            actionUrl: `/enquiry/${enquiry.id}/responses-page`,
                            actionText: 'View Response'
                          });
                        } else if (responseData.status === 'pending') {
                          // Create notification for new pending response
                          createNotification('new_response', {
                            title: '📝 New Response Submitted!',
                            message: `"${responseData.sellerName || 'A seller'}" submitted a response to "${enquiry.title}" (under review)`,
                            priority: 'medium',
                            actionUrl: `/enquiry/${enquiry.id}/responses-page`,
                            actionText: 'View Response'
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error processing response change:', error);
                  }
                });
              } catch (error) {
                console.error('Error processing snapshot:', error);
              }
            }, 
            (error) => {
              // Handle Firestore listener errors gracefully (including CORS)
              if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
                console.warn('Firestore CORS error in responses listener. Real-time updates may be limited.');
                // Don't crash - just log the warning
              } else {
                console.error('Firestore responses listener error:', error);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error setting up responses listener:', error);
      }
    }

    // Set up real-time listener for chat messages
    let unsubscribeChats = () => {};
    
    try {
      const chatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      
      unsubscribeChats = onSnapshot(
        chatQuery, 
        (snapshot) => {
          try {
            snapshot.docChanges().forEach((change) => {
              try {
                if (change.type === 'modified') {
                  const chatData = change.doc.data();
                  if (!chatData || !chatData.lastMessage || !chatData.enquiryId) return;
                  
                  const lastMessage = chatData.lastMessage;
                  
                  if (lastMessage && lastMessage.senderId !== user.uid && chatData.enquiryId) {
                    // Create notification for new chat message
                    createNotification('new_chat', {
                      title: '💬 New Message',
                      message: `${lastMessage.senderName || 'Someone'}: ${(lastMessage.text || '').substring(0, 50)}${(lastMessage.text || '').length > 50 ? '...' : ''}`,
                      priority: 'medium',
                      actionUrl: `/enquiry/${chatData.enquiryId}/responses`,
                      actionText: 'Open Chat'
                    });
                  }
                }
              } catch (error) {
                console.error('Error processing chat change:', error);
              }
            });
          } catch (error) {
            console.error('Error processing chat snapshot:', error);
          }
        },
        (error) => {
          // Handle Firestore listener errors gracefully (including CORS)
          if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')) {
            console.warn('Firestore CORS error in chat listener. Real-time updates may be limited.');
            // Don't crash - just log the warning
          } else {
            console.error('Firestore chat listener error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up chat listener:', error);
    }

    return () => {
      try {
        if (unsubscribeResponses && typeof unsubscribeResponses === 'function') {
          unsubscribeResponses();
        }
        if (unsubscribeChats && typeof unsubscribeChats === 'function') {
          unsubscribeChats();
        }
      } catch (error) {
        console.error('Error cleaning up listeners:', error);
      }
    };
  }, [user, recentEnquiries, createNotification]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="default" className="bg-green-100 text-green-800">Live</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Format INR amounts with commas
  const formatINR = (amount: number | string) => {
    if (!amount) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return '₹' + num.toLocaleString('en-IN');
  };

  return (
    <Layout showNavigation={false}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden overflow-y-auto">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pal-blue/5 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-pal-blue/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-pal-blue/5 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          {/* 2D Black and White Cartoon Drawing - Mobile Compatible */}
          <div className="absolute inset-0 opacity-20 sm:opacity-25">
            <svg className="w-full h-full min-w-full min-h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              {/* Cartoon People Characters */}
              {/* Person 1 - Buyer */}
              <g transform="translate(200, 300)">
                <circle cx="0" cy="-20" r="15" fill="black" stroke="black" strokeWidth="2"/>
                <rect x="-12" y="-5" width="24" height="30" fill="white" stroke="black" strokeWidth="2"/>
                <rect x="-8" y="5" width="16" height="20" fill="black"/>
                <circle cx="-5" cy="-15" r="2" fill="white"/>
                <circle cx="5" cy="-15" r="2" fill="white"/>
                <path d="M-3 -10 Q0 -5 3 -10" stroke="black" strokeWidth="1.5" fill="none"/>
                <rect x="-15" y="25" width="6" height="20" fill="black"/>
                <rect x="9" y="25" width="6" height="20" fill="black"/>
                <rect x="-18" y="45" width="12" height="4" fill="black"/>
                <rect x="6" y="45" width="12" height="4" fill="black"/>
                <text x="0" y="70" textAnchor="middle" fontSize="12" fill="black" fontWeight="bold">BUYER</text>
              </g>
              
              {/* Person 2 - Seller */}
              <g transform="translate(800, 280)">
                <circle cx="0" cy="-20" r="15" fill="black" stroke="black" strokeWidth="2"/>
                <rect x="-12" y="-5" width="24" height="30" fill="white" stroke="black" strokeWidth="2"/>
                <rect x="-8" y="5" width="16" height="20" fill="black"/>
                <circle cx="-5" cy="-15" r="2" fill="white"/>
                <circle cx="5" cy="-15" r="2" fill="white"/>
                <path d="M-3 -10 Q0 -5 3 -10" stroke="black" strokeWidth="1.5" fill="none"/>
                <rect x="-15" y="25" width="6" height="20" fill="black"/>
                <rect x="9" y="25" width="6" height="20" fill="black"/>
                <rect x="-18" y="45" width="12" height="4" fill="black"/>
                <rect x="6" y="45" width="12" height="4" fill="black"/>
                <text x="0" y="70" textAnchor="middle" fontSize="12" fill="black" fontWeight="bold">SELLER</text>
              </g>
              
              {/* Cartoon Products */}
              {/* Phone */}
              <g transform="translate(300, 400)">
                <rect x="-8" y="-15" width="16" height="30" fill="white" stroke="black" strokeWidth="2" rx="2"/>
                <rect x="-6" y="-12" width="12" height="20" fill="black"/>
                <circle cx="0" cy="5" r="2" fill="white"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">📱</text>
              </g>
              
              {/* Car */}
              <g transform="translate(500, 420)">
                <ellipse cx="0" cy="0" rx="25" ry="8" fill="white" stroke="black" strokeWidth="2"/>
                <rect x="-20" y="-12" width="15" height="12" fill="white" stroke="black" strokeWidth="1"/>
                <rect x="5" y="-12" width="15" height="12" fill="white" stroke="black" strokeWidth="1"/>
                <circle cx="-15" cy="8" r="4" fill="black"/>
                <circle cx="15" cy="8" r="4" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">🚗</text>
              </g>
              
              {/* House */}
              <g transform="translate(700, 400)">
                <rect x="-15" y="-10" width="30" height="20" fill="white" stroke="black" strokeWidth="2"/>
                <polygon points="-20,-10 0,-25 20,-10" fill="white" stroke="black" strokeWidth="2"/>
                <rect x="-8" y="0" width="6" height="10" fill="black"/>
                <rect x="2" y="-5" width="8" height="6" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">🏠</text>
              </g>
              
              {/* Connection Lines with Arrows */}
              <path d="M215 300 Q400 200 300 400" stroke="black" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
              <path d="M300 400 Q500 350 500 420" stroke="black" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
              <path d="M500 420 Q700 380 700 400" stroke="black" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
              <path d="M700 400 Q900 300 800 280" stroke="black" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
              
              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="black"/>
                </marker>
              </defs>
              
              {/* Cartoon Money/Transaction Elements */}
              <g transform="translate(400, 200)">
                <circle cx="0" cy="0" r="20" fill="white" stroke="black" strokeWidth="2"/>
                <text x="0" y="5" textAnchor="middle" fontSize="16" fill="black" fontWeight="bold">$</text>
                <text x="0" y="35" textAnchor="middle" fontSize="10" fill="black">MONEY</text>
              </g>
              
              <g transform="translate(600, 200)">
                <circle cx="0" cy="0" r="20" fill="white" stroke="black" strokeWidth="2"/>
                <text x="0" y="5" textAnchor="middle" fontSize="16" fill="black" fontWeight="bold">✓</text>
                <text x="0" y="35" textAnchor="middle" fontSize="10" fill="black">DEAL</text>
              </g>
              
              {/* Cartoon Speech Bubbles */}
              <g transform="translate(200, 200)">
                <ellipse cx="0" cy="0" rx="40" ry="25" fill="white" stroke="black" strokeWidth="2"/>
                <text x="0" y="5" textAnchor="middle" fontSize="10" fill="black">I need this!</text>
                <path d="M-10 25 L-5 35 L0 25" stroke="black" strokeWidth="2" fill="none"/>
              </g>
              
              <g transform="translate(800, 180)">
                <ellipse cx="0" cy="0" rx="40" ry="25" fill="white" stroke="black" strokeWidth="2"/>
                <text x="0" y="5" textAnchor="middle" fontSize="10" fill="black">I have this!</text>
                <path d="M10 25 L5 35 L0 25" stroke="black" strokeWidth="2" fill="none"/>
              </g>
              
              {/* Cartoon Hearts/Love */}
              <g transform="translate(500, 150)">
                <path d="M0,6 C0,2 4,0 6,2 C8,0 12,2 12,6 C12,10 6,16 6,16 C6,16 0,10 0,6 Z" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">LOVE</text>
              </g>
              
              {/* Cartoon Stars */}
              <g transform="translate(100, 100)">
                <polygon points="0,-15 4,-4 15,-4 7,3 11,14 0,8 -11,14 -7,3 -15,-4 -4,-4" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">STAR</text>
              </g>
              
              <g transform="translate(1100, 100)">
                <polygon points="0,-15 4,-4 15,-4 7,3 11,14 0,8 -11,14 -7,3 -15,-4 -4,-4" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">STAR</text>
              </g>
              
              {/* FUN ENTERTAINING CARTOON STORY */}
              
              {/* Excited User */}
              <g transform="translate(200, 200)">
                <circle cx="0" cy="0" r="15" fill="#FFE4B5" stroke="black" strokeWidth="2"/>
                <circle cx="-5" cy="-3" r="3" fill="black"/>
                <circle cx="5" cy="-3" r="3" fill="black"/>
                <circle cx="-4" cy="-2" r="1" fill="white"/>
                <circle cx="6" cy="-2" r="1" fill="white"/>
                <path d="M-3 5 Q0 8 3 5" stroke="black" strokeWidth="2" fill="none"/>
                <text x="0" y="30" textAnchor="middle" fontSize="10" fill="black" fontWeight="bold">😍 WOW!</text>
              </g>
              
              {/* Happy Enquiry box with party hat */}
              <g transform="translate(500, 250)">
                <rect x="-30" y="-20" width="60" height="40" fill="#FFB6C1" stroke="black" strokeWidth="2" rx="8"/>
                <text x="0" y="-5" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">🎉 ENQUIRY</text>
                <text x="0" y="10" textAnchor="middle" fontSize="7" fill="black">POST HERE!</text>
                <circle cx="0" cy="15" r="4" fill="black"/>
                <circle cx="-2" cy="13" r="1" fill="white"/>
                <circle cx="2" cy="13" r="1" fill="white"/>
                <path d="M-1 16 Q0 18 1 16" stroke="white" strokeWidth="1" fill="none"/>
                {/* Party hat */}
                <polygon points="0,-25 8,-15 -8,-15" fill="#FF69B4" stroke="black" strokeWidth="1"/>
                <circle cx="0" cy="-20" r="1" fill="white"/>
              </g>
              
              {/* Super AI Brain */}
              <g transform="translate(700, 200)">
                <circle cx="0" cy="0" r="18" fill="#E6E6FA" stroke="black" strokeWidth="2"/>
                <path d="M-10,-6 Q-5,-8 0,-6 Q5,-4 10,-6 Q12,-2 10,2 Q8,6 0,6 Q-8,6 -10,2 Q-12,-2 -10,-6" fill="black"/>
                <circle cx="-5" cy="-2" r="2" fill="white"/>
                <circle cx="5" cy="-2" r="2" fill="white"/>
                <path d="M-3 2 Q0 4 3 2" stroke="white" strokeWidth="1" fill="none"/>
                <text x="0" y="30" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">🧠 SUPER AI</text>
              </g>
              
              {/* Magic matching wand */}
              <g transform="translate(700, 300)">
                <circle cx="0" cy="0" r="20" fill="white" stroke="black" strokeWidth="2"/>
                <circle cx="0" cy="0" r="15" fill="#FFD700" opacity="0.3"/>
                <circle cx="0" cy="0" r="10" fill="#FFD700" opacity="0.5"/>
                <circle cx="0" cy="0" r="5" fill="#FFD700"/>
                <text x="0" y="35" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">🪄 MAGIC MATCH</text>
              </g>
              
              {/* Happy sellers */}
              <g transform="translate(500, 400)">
                <circle cx="0" cy="0" r="12" fill="#FFE4B5" stroke="black" strokeWidth="2"/>
                <circle cx="-3" cy="-3" r="2" fill="black"/>
                <circle cx="3" cy="-3" r="2" fill="black"/>
                <circle cx="-2" cy="-2" r="0.5" fill="white"/>
                <circle cx="4" cy="-2" r="0.5" fill="white"/>
                <path d="M-2 3 Q0 5 2 3" stroke="black" strokeWidth="1" fill="none"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">😊 SELLER</text>
              </g>
              
              <g transform="translate(700, 400)">
                <circle cx="0" cy="0" r="12" fill="#FFE4B5" stroke="black" strokeWidth="2"/>
                <circle cx="-3" cy="-3" r="2" fill="black"/>
                <circle cx="3" cy="-3" r="2" fill="black"/>
                <circle cx="-2" cy="-2" r="0.5" fill="white"/>
                <circle cx="4" cy="-2" r="0.5" fill="white"/>
                <path d="M-2 3 Q0 5 2 3" stroke="black" strokeWidth="1" fill="none"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">😄 SELLER</text>
              </g>
              
              <g transform="translate(900, 400)">
                <circle cx="0" cy="0" r="12" fill="#FFE4B5" stroke="black" strokeWidth="2"/>
                <circle cx="-3" cy="-3" r="2" fill="black"/>
                <circle cx="3" cy="-3" r="2" fill="black"/>
                <circle cx="-2" cy="-2" r="0.5" fill="white"/>
                <circle cx="4" cy="-2" r="0.5" fill="white"/>
                <path d="M-2 3 Q0 5 2 3" stroke="black" strokeWidth="1" fill="none"/>
                <text x="0" y="25" textAnchor="middle" fontSize="8" fill="black">😃 SELLER</text>
              </g>
              
              {/* Amazing product */}
              <g transform="translate(600, 520)">
                <rect x="-20" y="-15" width="40" height="30" fill="white" stroke="black" strokeWidth="2" rx="5"/>
                <rect x="-15" y="-10" width="30" height="20" fill="#FF69B4"/>
                <circle cx="0" cy="0" r="3" fill="white"/>
                <text x="0" y="30" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">🎁 AMAZING ITEM</text>
              </g>
              
              {/* Fun chat */}
              <g transform="translate(350, 570)">
                <rect x="-25" y="-20" width="50" height="40" fill="white" stroke="black" strokeWidth="2" rx="8"/>
                <text x="0" y="-5" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">💬 FUN CHAT</text>
                <circle cx="-8" cy="5" r="2" fill="black"/>
                <circle cx="0" cy="5" r="2" fill="black"/>
                <circle cx="8" cy="5" r="2" fill="black"/>
                <text x="0" y="25" textAnchor="middle" fontSize="7" fill="black">Let's talk! 😄</text>
              </g>
              
              {/* Epic deal completion */}
              <g transform="translate(550, 650)">
                <circle cx="0" cy="0" r="25" fill="white" stroke="black" strokeWidth="3"/>
                <text x="0" y="8" textAnchor="middle" fontSize="20" fill="black" fontWeight="bold">🎉</text>
                <text x="0" y="35" textAnchor="middle" fontSize="9" fill="black" fontWeight="bold">EPIC DEAL!</text>
              </g>
              
              {/* Money rain */}
              <g transform="translate(300, 650)">
                <circle cx="0" cy="0" r="18" fill="white" stroke="black" strokeWidth="2"/>
                <text x="0" y="8" textAnchor="middle" fontSize="16" fill="black" fontWeight="bold">💰</text>
                <text x="0" y="30" textAnchor="middle" fontSize="8" fill="black">MONEY RAIN!</text>
              </g>
              
              {/* Super happy customer */}
              <g transform="translate(800, 650)">
                <circle cx="0" cy="0" r="18" fill="#FFE4B5" stroke="black" strokeWidth="2"/>
                <circle cx="-5" cy="-3" r="3" fill="black"/>
                <circle cx="5" cy="-3" r="3" fill="black"/>
                <circle cx="-4" cy="-2" r="1" fill="white"/>
                <circle cx="6" cy="-2" r="1" fill="white"/>
                <path d="M-6 3 Q0 8 6 3" stroke="black" strokeWidth="2" fill="none"/>
                <text x="0" y="30" textAnchor="middle" fontSize="8" fill="black">😍 SUPER HAPPY!</text>
              </g>
              
            </svg>
          </div>
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          {/* Logo with Cartoon Story Around It */}
          <div className="mb-3 sm:mb-4 animate-slide-up text-center">
            <div className="relative inline-block -m-1 sm:-m-2">
              <img src={newLogo} alt="Enqir.in" className="h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] 2xl:h-[32rem] w-auto animate-float drop-shadow-2xl block relative z-20" style={{ background: 'transparent', padding: 0, margin: 0, border: 'none', outline: 'none', objectFit: 'contain', objectPosition: 'center', filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.2))' }} />
              <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent blur-2xl"></div>
              
              {/* MINIMAL PROFESSIONAL SKETCH IN LOGO PADDING */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <svg className="w-full h-full min-w-full min-h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  {/* Central Hub - Logo Area */}
                  <g transform="translate(200, 200)" opacity="0.8">
                    <circle cx="0" cy="0" r="25" fill="none" stroke="#6B7280" strokeWidth="2"/>
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.7"/>
                    <circle cx="0" cy="0" r="15" fill="none" stroke="#6B7280" strokeWidth="1" opacity="0.5"/>
                    <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#4B5563" fontWeight="600">ENQIR.IN</text>
                  </g>
                  
                  {/* Top - User with Smartphone */}
                  <g transform="translate(200, 80)" opacity="0.8">
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
                    <circle cx="-3" cy="-2" r="1.5" fill="#6B7280"/>
                    <circle cx="3" cy="-2" r="1.5" fill="#6B7280"/>
                    <path d="M-2 3 Q0 4 2 3" stroke="#6B7280" strokeWidth="1.2" fill="none"/>
                    <rect x="-8" y="8" width="16" height="20" fill="none" stroke="#6B7280" strokeWidth="1" rx="2"/>
                    <rect x="-6" y="12" width="12" height="8" fill="#6B7280" opacity="0.3"/>
                    <text x="0" y="35" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">User</text>
                  </g>
                  
                  {/* Left - AI Processing Center */}
                  <g transform="translate(100, 200)" opacity="0.8">
                    <rect x="-15" y="-12" width="30" height="24" fill="none" stroke="#6B7280" strokeWidth="1.5" rx="3"/>
                    <circle cx="-6" cy="0" r="2" fill="#6B7280"/>
                    <circle cx="0" cy="0" r="2" fill="#6B7280"/>
                    <circle cx="6" cy="0" r="2" fill="#6B7280"/>
                    <path d="M-4 -6 L4 6 M4 -6 L-4 6" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
                    <text x="0" y="25" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">AI Engine</text>
                    {/* Processing lines */}
                    <path d="M-20 -5 L-15 -5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                    <path d="M-20 0 L-15 0" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                    <path d="M-20 5 L-15 5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                    <path d="M15 -5 L20 -5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                    <path d="M15 0 L20 0" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                    <path d="M15 5 L20 5" stroke="#6B7280" strokeWidth="1" opacity="0.4"/>
                  </g>
                  
                  {/* Right - Matching Network */}
                  <g transform="translate(300, 200)" opacity="0.8">
                    <circle cx="0" cy="0" r="15" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#6B7280" strokeWidth="1.2" opacity="0.7"/>
                    <circle cx="0" cy="0" r="5" fill="none" stroke="#6B7280" strokeWidth="1" opacity="0.5"/>
                    <circle cx="0" cy="0" r="2" fill="#6B7280"/>
                    <text x="0" y="22" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">Match</text>
                    {/* Network nodes */}
                    <circle cx="-12" cy="-8" r="2" fill="#6B7280" opacity="0.6"/>
                    <circle cx="12" cy="-8" r="2" fill="#6B7280" opacity="0.6"/>
                    <circle cx="-12" cy="8" r="2" fill="#6B7280" opacity="0.6"/>
                    <circle cx="12" cy="8" r="2" fill="#6B7280" opacity="0.6"/>
                    <path d="M-12 -8 L-5 -3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M12 -8 L5 -3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M-12 8 L-5 3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M12 8 L5 3" stroke="#6B7280" strokeWidth="0.8" opacity="0.4"/>
                  </g>
                  
                  {/* Bottom - Success Celebration */}
                  <g transform="translate(200, 320)" opacity="0.8">
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
                    <path d="M-6 0 L-2 4 L6 -2" stroke="#6B7280" strokeWidth="2.5" fill="none"/>
                    <text x="0" y="25" textAnchor="middle" fontSize="8" fill="#4B5563" fontWeight="500">Success!</text>
                    {/* Celebration elements */}
                    <path d="M-20 -8 L-18 -6 L-16 -8 L-18 -10 Z" fill="#6B7280" opacity="0.6"/>
                    <path d="M20 -8 L22 -6 L24 -8 L22 -10 Z" fill="#6B7280" opacity="0.6"/>
                    <path d="M-20 8 L-18 10 L-16 8 L-18 6 Z" fill="#6B7280" opacity="0.6"/>
                    <path d="M20 8 L22 10 L24 8 L22 6 Z" fill="#6B7280" opacity="0.6"/>
                  </g>
                  
                  {/* Dynamic Flow Lines */}
                  <path d="M200 92 L200 175" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite"/>
                  </path>
                  <path d="M130 200 L175 200" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="0.5s"/>
                  </path>
                  <path d="M225 200 L270 200" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1s"/>
                  </path>
                  <path d="M100 225 L175 275" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="1.5s"/>
                  </path>
                  <path d="M300 225 L225 275" stroke="#6B7280" strokeWidth="1.5" fill="none" opacity="0.6" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0;0,100" dur="3s" repeatCount="indefinite" begin="2s"/>
                  </path>
                  
                  {/* Feature Icons Around the Hub */}
                  <g transform="translate(150, 120)" opacity="0.6">
                    <circle cx="0" cy="0" r="8" fill="#6B7280"/>
                    <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">🔒</text>
                    <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Secure</text>
                  </g>
                  
                  <g transform="translate(250, 120)" opacity="0.6">
                    <circle cx="0" cy="0" r="8" fill="#6B7280"/>
                    <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">⚡</text>
                    <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Fast</text>
                  </g>
                  
                  <g transform="translate(150, 280)" opacity="0.6">
                    <circle cx="0" cy="0" r="8" fill="#6B7280"/>
                    <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">💬</text>
                    <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Chat</text>
                  </g>
                  
                  <g transform="translate(250, 280)" opacity="0.6">
                    <circle cx="0" cy="0" r="8" fill="#6B7280"/>
                    <text x="0" y="2" textAnchor="middle" fontSize="8" fill="white">⭐</text>
                    <text x="0" y="15" textAnchor="middle" fontSize="6" fill="#4B5563">Quality</text>
                  </g>
                  
                  {/* Corner Decorative Elements */}
                  <g transform="translate(60, 60)" opacity="0.4">
                    <circle cx="0" cy="0" r="4" fill="#6B7280"/>
                    <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">💡</text>
                  </g>
                  
                  <g transform="translate(340, 60)" opacity="0.4">
                    <circle cx="0" cy="0" r="4" fill="#6B7280"/>
                    <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">🎯</text>
                  </g>
                  
                  <g transform="translate(60, 340)" opacity="0.4">
                    <circle cx="0" cy="0" r="4" fill="#6B7280"/>
                    <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">💰</text>
                  </g>
                  
                  <g transform="translate(340, 340)" opacity="0.4">
                    <circle cx="0" cy="0" r="4" fill="#6B7280"/>
                    <text x="0" y="1" textAnchor="middle" fontSize="5" fill="white">🎉</text>
                  </g>
                  
                  {/* Arrow marker definition */}
                  <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#6B7280"/>
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>



          {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center mb-6 sm:mb-16 animate-slide-up px-1 sm:px-0" style={{ animationDelay: '0.4s' }}>
            <Link to="/post-enquiry" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-black hover:bg-gray-700 text-white font-semibold py-2.5 sm:py-2 px-4 sm:px-4 rounded-lg sm:rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl lg:min-w-[220px] lg:border-4 lg:border-black">
              <span className="text-xs sm:text-base">Post Your Need</span>
              <ArrowRight className="h-3 w-3 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </Link>
          <Link to="/enquiries" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-black font-semibold py-2.5 sm:py-2 px-4 sm:px-4 rounded-lg sm:rounded-lg border-4 border-black hover:border-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl lg:min-w-[220px]">
              <span className="text-xs sm:text-base">Show All Enquiries</span>
              <Eye className="h-3 w-3 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            </Link>
            <div className="w-full sm:w-auto relative z-50" style={{ zIndex: 50 }}>
              <div className="flex gap-2 sm:gap-2">
                <div className="relative flex-1" style={{ zIndex: 50 }}>
                  <Search className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black z-10 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search enquiries..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSearchSuggestions(true);
                      updateSearchPosition();
                    }}
                    onFocus={() => {
                      setShowSearchSuggestions(true);
                      updateSearchPosition();
                    }}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                    onKeyPress={handleKeyPress}
                    className="w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-3 sm:pr-4 text-base sm:text-xs border-4 border-black rounded-lg sm:rounded-2xl focus:border-black focus:ring-2 sm:focus:ring-4 focus:ring-black/20 transition-all duration-300 ease-out bg-white shadow-sm placeholder-gray-400"
                    style={{ 
                      fontSize: '16px',
                      lineHeight: '1.5',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      textAlign: searchTerm ? 'left' : 'center'
                    }}
                  />
                  
                </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-black hover:bg-gray-900 text-white font-semibold h-11 sm:h-12 px-3 sm:px-3 rounded-lg sm:rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[44px] sm:min-w-[52px] border-4 border-black"
              >
                {isSearching ? (
                  <div className="w-3 h-3 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="h-3 w-3 sm:h-5 sm:w-5" />
                )}
              </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-16 animate-slide-up px-1 sm:px-0" style={{ animationDelay: '0.6s' }}>
            {features.map((feature, index) => (
              <Card key={index} className="p-3 sm:p-6 glass-card hover-lift transition-spring group bg-blue-50/30 border border-black rounded-xl sm:rounded-2xl">
                <div className="relative">
                  <feature.icon className="h-5 w-5 sm:h-8 sm:w-8 text-black mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-spring" />
                  <div className="absolute inset-0 bg-pal-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-spring"></div>
                </div>
                <h3 className="text-xs sm:text-lg font-black text-black mb-1 sm:mb-2 text-center group-hover:text-pal-blue transition-spring">{feature.title}</h3>
                <p className="text-[10px] sm:text-sm text-muted-foreground text-center leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Sell Section */}

          {/* Recent Enquiries Grid (Reverted to previous implementation) */}
          <section className="py-4 sm:py-16">
            <div className="text-center mb-4 sm:mb-12">
              {/* Space kept blank as requested */}
            </div>
            {/* Live Needs Heading */}
            <div className="text-center mb-4 sm:mb-8">
              <h3 className="text-sm sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-4">
                Live Needs
              </h3>
              <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-black border border-black rounded-full" style={{ backgroundColor: '#000000' }}>
                <div className="w-1 h-1 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-xs font-medium text-white">
                  {allLiveEnquiries.length} enquir{allLiveEnquiries.length !== 1 ? 'ys' : 'y'} available
                </span>
              </div>
            </div>
            {/* Recent Enquiries - Overlapped Deck Layout */}
            {filteredEnquiries.length > 0 ? (
              <>
              {/* Container for overlapped cards - horizontal right-to-left layout */}
              <div className="relative mb-8 sm:mb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex justify-center items-start overflow-visible" style={{ minHeight: showAllEnquiries ? 'auto' : (windowWidth >= 1024 ? '500px' : (windowWidth >= 640 ? '450px' : '360px')), height: showAllEnquiries ? 'auto' : (windowWidth >= 1024 ? '500px' : (windowWidth >= 640 ? '450px' : '360px')), paddingTop: windowWidth >= 1024 ? '30px' : '0px', paddingBottom: windowWidth >= 1024 ? '30px' : '0px' }}>
                <AnimatePresence mode="wait">
                  {(showAllEnquiries ? filteredEnquiries : filteredEnquiries.slice(0, 3)).map((enquiry, index) => {
                    const isHovered = expandedCardId === enquiry.id;
                    const isAnyCardHovered = expandedCardId !== null;
                    const isRightmostCard = index === 0 && !showAllEnquiries; // Rightmost card is index 0 in right-to-left
                    // Z-index: rightmost card (index 0) = 30, middle (index 1) = 20, leftmost (index 2) = 10
                    const baseZIndex = showAllEnquiries ? 10 : (3 - index) * 10;
                    const zIndex = isHovered ? 50 : (isAnyCardHovered && !isHovered ? 40 : baseZIndex);
                    // Horizontal overlap: Each card shows enough to see the enquiry title/heading text
                    // Right-to-left: Cards positioned to center the entire stack
                    // Card widths: mobile 180px (fits 3 cards on screen), tablet 280px, desktop 320px
                    // Overlap adjusted: Show enough of card to see header section + title text area clearly
                    // Title text is at the top of content area, so we need ~80% visible to ensure title is visible on all cards
                    const cardWidth = windowWidth >= 1024 ? 320 : (windowWidth >= 640 ? 280 : 180);
                    // Desktop: 20% overlap (80% visible - title text clearly visible on all cards), Tablet: 25%, Mobile: 50%
                    const shiftAmount = windowWidth >= 1024 ? (cardWidth * 0.20) : (windowWidth >= 640 ? (cardWidth * 0.25) : (cardWidth * 0.5));
                    // Position cards so the middle card (index 1) is centered below "Live Needs" heading
                    // Middle card should be at 50% (page center)
                    // Rightmost card (index 0) at: 50% - shiftAmount
                    // Middle card (index 1) at: 50% - shiftAmount + shiftAmount = 50% ✓
                    // Leftmost card (index 2) at: 50% + shiftAmount
                    // Also need to account for card width to center the card itself, not just its left edge
                    const cardCenterOffset = cardWidth / 2; // Half card width to center the card
                    const baseLeft = showAllEnquiries ? 'auto' : `calc(50% - ${cardCenterOffset}px - ${shiftAmount}px + ${index * shiftAmount}px)`;
                    // When any card is hovered/touched, all cards expand and others "pop up"
                    // Same behavior for both desktop hover and mobile touch
                    const popUpOffset = isAnyCardHovered && !isHovered ? -15 : 0;
                    const scaleAmount = isAnyCardHovered ? 1.05 : 1;
                    const popUpY = isAnyCardHovered && !isHovered ? -20 : 0; // Pop up effect for non-hovered cards
                    
                    return (
                    <motion.div
                      key={enquiry.id}
                      initial={{ opacity: 0, x: 15, scale: 0.96, y: 10 }}
                      animate={{ 
                        opacity: isShuffling ? 0 : 1, 
                        x: isShuffling ? 15 : popUpOffset, 
                        y: isShuffling ? 10 : popUpY,
                        scale: isShuffling ? 0.92 : scaleAmount,
                        rotateY: isShuffling ? 5 : 0,
                      }}
                      exit={{ opacity: 0, x: 15, scale: 0.96, y: 10 }}
                      transition={{ 
                        duration: isShuffling ? 0.5 : 0.4,
                        ease: isShuffling ? [0.4, 0, 0.2, 1] : [0.34, 1.56, 0.64, 1],
                        delay: isShuffling ? index * 0.08 : index * 0.06
                      }}
                      className={`${showAllEnquiries ? 'relative mb-6' : 'absolute'} w-full`}
                      style={{
                        willChange: 'transform, opacity',
                        // Position cards right-to-left: middle card centered below "Live Needs"
                        left: baseLeft,
                        transform: showAllEnquiries ? 'none' : 'none',
                        zIndex: zIndex,
                        // Same dimensions for all cards - optimized for mobile to fit 3 cards
                        ...(showAllEnquiries ? {} : {
                          width: windowWidth >= 1024 ? '320px' : (windowWidth >= 640 ? '280px' : '180px'),
                          height: windowWidth >= 1024 ? '450px' : (windowWidth >= 640 ? '400px' : '320px'),
                        }),
                      }}
                      onMouseEnter={() => {
                        if (!isEnquiryOutdated(enquiry) && windowWidth >= 1024) {
                          setExpandedCardId(enquiry.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (windowWidth >= 1024) {
                          setExpandedCardId(null);
                        }
                      }}
                      onTouchStart={(e) => {
                        if (!isEnquiryOutdated(enquiry)) {
                          e.preventDefault();
                          e.stopPropagation();
                          // Toggle expansion - same as desktop hover
                          setExpandedCardId(expandedCardId === enquiry.id ? null : enquiry.id);
                        }
                      }}
                      onTouchEnd={(e) => {
                        // Prevent default link navigation when touching to expand/view details
                        if (isAnyCardHovered) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                    <Link 
                      key={enquiry.id} 
                      to={isEnquiryOutdated(enquiry) ? '#' : `/enquiry/${enquiry.id}`} 
                      className="block h-full"
                      style={{
                        height: windowWidth >= 1024 ? '450px' : (windowWidth >= 640 ? '400px' : '320px'),
                      }}
                      onClick={(e) => {
                        if (isEnquiryOutdated(enquiry)) {
                          e.preventDefault();
                          e.stopPropagation();
                        } else if (isHovered && isAnyCardHovered) {
                          // Allow navigation when card is hovered/expanded
                          // Don't prevent default
                        } else if (!isHovered && isAnyCardHovered) {
                          // When another card is hovered, prevent navigation to allow viewing details
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
            <motion.div 
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl border-4 border-black hover:border-gray-700 flex flex-col h-full transform transition-all duration-300 ease-out overflow-visible group relative ${
                isEnquiryOutdated(enquiry) ? 'opacity-60 grayscale pointer-events-none' : 'cursor-pointer'
              } ${isHovered ? 'shadow-2xl border-black' : ''}`}
              transition={{ duration: 0.3 }}
            >
                      {/* Subtle glow effect for mobile-friendly animation */}
                      {!isEnquiryOutdated(enquiry) && (
                        <motion.div 
                          className="absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl pointer-events-none z-0"
                          animate={{
                            opacity: [0.2, 0.3, 0.2],
                            background: [
                              "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
                              "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                              "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
                            ]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                      <div className={`relative z-10 ${windowWidth >= 640 ? 'flex flex-col h-full' : ''} overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl`}>
                      {/* Card Header - Compact on mobile, spacious on desktop - Fixed height for alignment */}
                      <div className={`bg-gradient-to-r from-gray-900 via-black to-gray-900 ${windowWidth < 640 ? 'px-2 py-1.5 min-h-[36px]' : 'px-3 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3'} ${windowWidth >= 640 ? 'flex-shrink-0' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
                            {(enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                              <>
                                <div className={`flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full ${
                                  isEnquiryOutdated(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                                }`}>
                                  <Check className="h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 text-white" />
                                </div>
                                <span className={`text-[8px] sm:text-[9px] lg:text-xs font-medium hidden sm:inline ${
                                  isEnquiryOutdated(enquiry) ? 'text-gray-300' : 'text-blue-300'
                                }`}>Verified</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
                            {!isEnquiryOutdated(enquiry) && (
                              <Badge variant="default" className="text-[8px] sm:text-[9px] lg:text-xs px-1 sm:px-1.5 lg:px-2.5 py-0.5 lg:py-1 bg-green-100 text-green-700 border-green-200">Live</Badge>
                            )}
                            {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                              <Badge variant="destructive" className="text-[8px] sm:text-[9px] lg:text-xs px-1 sm:px-1.5 lg:px-2.5 py-0.5 lg:py-1">Urgent</Badge>
                            )}
                            {isEnquiryOutdated(enquiry) && (
                              <Badge variant="outline" className="text-[8px] sm:text-[9px] lg:text-xs px-1 sm:px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-gray-300 border-gray-400">Expired</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Category Mural - Hidden */}
                      
                      {/* Card Content - Professional Layout with Better Spacing */}
                      <div className={`${windowWidth < 640 ? 'p-2.5' : 'p-3 sm:p-4 lg:p-4'} flex-1 flex flex-col ${windowWidth < 640 ? 'overflow-y-auto' : 'overflow-visible'} ${windowWidth < 640 ? 'space-y-2' : 'space-y-2 sm:space-y-2.5'} ${windowWidth < 640 ? 'min-h-0' : 'min-h-0'} ${windowWidth >= 640 ? 'flex-grow' : ''}`}>
                      {/* Title - Professional Typography */}
                      <h3 className={`${windowWidth < 640 ? 'text-xs leading-tight' : 'text-sm sm:text-base lg:text-lg'} font-extrabold ${windowWidth < 640 ? 'mb-2' : 'mb-2 sm:mb-2.5'} leading-snug ${isAnyCardHovered ? '' : (windowWidth < 640 ? 'line-clamp-2' : 'line-clamp-2')} font-heading text-gray-900 ${windowWidth < 640 ? 'border-b border-black pb-1.5' : 'border-b-2 border-black pb-1.5 sm:pb-2'} ${
                        isEnquiryOutdated(enquiry) ? 'text-gray-400' : ''
                      }`}>
                        {enquiry.title && enquiry.title.length > 22 ? enquiry.title.substring(0, 22).trim() + '...' : enquiry.title}
                      </h3>
                      
                      {/* Budget and Location - Horizontal Layout on Desktop, Stacked on Mobile */}
                      <div className={`${windowWidth < 640 ? 'mb-2 space-y-1.5' : 'mb-2 sm:mb-2.5'} flex ${windowWidth < 640 ? 'flex-col' : 'flex-row items-center flex-nowrap'} ${windowWidth < 640 ? 'gap-1.5' : 'gap-2 sm:gap-2.5'} ${windowWidth >= 640 ? 'w-full' : ''}`}>
                        {enquiry.budget && (
                          <div className={`inline-flex items-center bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg ${windowWidth < 640 ? 'px-2 py-1' : 'px-2 py-1.5 sm:px-2.5 sm:py-2'} ${windowWidth < 640 ? 'border-2' : 'border-2'} border-black ${windowWidth >= 640 ? 'flex-shrink-0' : 'w-fit'} flex-shrink-0`}>
                            <span className={`${windowWidth < 640 ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} font-extrabold text-gray-900 ${windowWidth < 640 ? 'mr-0.5' : 'mr-1 sm:mr-1.5'}`}>₹</span>
                            <span className={`${windowWidth < 640 ? 'text-xs' : 'text-sm sm:text-base lg:text-lg'} font-extrabold text-gray-900 whitespace-nowrap`}>{formatIndianCurrency(enquiry.budget)}</span>
                          </div>
                        )}
                        {enquiry.location && (
                          <div className={`inline-flex items-center ${windowWidth < 640 ? 'gap-1 px-2 py-1' : 'gap-1.5 sm:gap-2 px-2 py-1.5'} ${windowWidth < 640 ? 'text-[10px]' : 'text-xs sm:text-sm lg:text-base'} text-gray-700 ${windowWidth < 640 ? 'border border-black rounded' : 'border-2 border-black rounded-lg'} ${windowWidth >= 640 ? 'flex-shrink-0 min-w-0' : 'w-fit'} flex-shrink-0`}>
                            <MapPin className={`${windowWidth < 640 ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4 lg:w-4'} text-gray-600 flex-shrink-0`} />
                            <span className={`font-semibold ${isAnyCardHovered ? '' : 'line-clamp-1 truncate'} ${windowWidth >= 640 ? 'max-w-[200px]' : ''}`}>{enquiry.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Meta Information - Professional Grouping */}
                      <div className={`${windowWidth < 640 ? 'mb-2 space-y-1.5' : 'mb-2 sm:mb-2.5 space-y-1.5 sm:space-y-2'} flex flex-col ${windowWidth >= 640 ? 'w-full' : ''}`}>
                        <div className={`flex items-center ${windowWidth < 640 ? 'flex-col items-stretch gap-1.5' : 'flex-row justify-between flex-nowrap gap-2 sm:gap-2.5'} ${windowWidth >= 640 ? 'w-full' : ''}`}>
                          <Badge variant="secondary" className={`${windowWidth < 640 ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] sm:text-xs lg:text-sm px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 lg:py-1.5'} bg-gray-100 text-black ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'} font-semibold rounded-lg shadow-sm ${windowWidth < 640 ? 'w-full text-center' : 'flex-shrink-0'}`}>
                            {enquiry.category}
                          </Badge>
                          <div className={`flex items-center ${windowWidth < 640 ? 'gap-1 px-1.5 py-0.5 justify-center' : 'gap-1 sm:gap-1.5 px-1.5 py-1'} ${windowWidth < 640 ? 'text-[9px]' : 'text-[10px] sm:text-xs lg:text-sm'} text-gray-600 ${windowWidth < 640 ? 'border border-black rounded w-full' : 'border-2 border-black rounded-lg flex-shrink-0'}`}>
                            <Clock className={`${windowWidth < 640 ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4'} text-gray-500 flex-shrink-0`} />
                            <span className="whitespace-nowrap font-semibold truncate">
                              {enquiry.createdAt?.toDate ? formatDate(enquiry.createdAt.toDate().toISOString()) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {/* Deadline Timer */}
                        {enquiry.deadline && (enquiry.deadline.toDate || typeof enquiry.deadline === 'string' || enquiry.deadline instanceof Date) && !isEnquiryOutdated(enquiry) && (
                          <div className={`${windowWidth < 640 ? 'pt-1.5 px-1.5 py-1' : 'pt-1.5 px-1.5 py-1 sm:pt-2 sm:px-2 sm:py-1.5'} ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'} rounded-lg w-full`}>
                            <CountdownTimer
                              deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                              className={`${windowWidth < 640 ? 'text-[9px]' : 'text-[10px] sm:text-xs lg:text-sm'}`}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Primary Action Button - Professional Styling */}
                      <div className={`mt-auto ${windowWidth < 640 ? 'pt-2' : 'pt-2 sm:pt-2.5'} ${windowWidth < 640 ? 'border-t border-black' : 'border-t-2 border-black'} ${windowWidth >= 640 ? 'flex-shrink-0' : ''}`}>
                        {user ? (
                          (() => {
                            const isOwnEnquiry = enquiry.userId === user.uid;
                            if (isOwnEnquiry) {
                              return (
                                <button className={`w-full ${windowWidth < 640 ? 'h-9' : 'h-9 sm:h-9 lg:h-10'} bg-gray-100 text-gray-500 ${windowWidth < 640 ? 'text-[10px]' : 'text-[10px] sm:text-xs lg:text-sm'} font-semibold rounded-lg ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'} cursor-not-allowed ${windowWidth < 640 ? 'min-h-[36px]' : 'min-h-[36px]'}`} disabled>
                                  ✅ Your Enquiry
                                </button>
                              );
                            } else if (isEnquiryOutdated(enquiry)) {
                              return (
                                <button className={`w-full ${windowWidth < 640 ? 'h-9' : 'h-9 sm:h-9 lg:h-10'} bg-gray-100 text-gray-500 ${windowWidth < 640 ? 'text-[10px]' : 'text-[10px] sm:text-xs lg:text-sm'} font-semibold rounded-lg ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'} cursor-not-allowed ${windowWidth < 640 ? 'min-h-[36px]' : 'min-h-[36px]'}`} disabled>
                                  Expired
                                </button>
                              );
                            } else {
                              return (
                                <button 
                                  className={`w-full ${windowWidth < 640 ? 'h-9' : 'h-9 sm:h-9 lg:h-10'} bg-black hover:bg-gray-900 text-white ${windowWidth < 640 ? 'text-[10px]' : 'text-[10px] sm:text-xs lg:text-sm'} font-bold rounded-lg ${windowWidth < 640 ? 'border-2 border-black' : 'border-2 border-black'} shadow-md hover:shadow-lg transition-all duration-200 font-heading ${windowWidth < 640 ? 'min-h-[36px]' : 'min-h-[36px]'}`}
                                  onClick={() => navigate(`/respond/${enquiry.id}`)}
                                >
                                  Sell
                                </button>
                              );
                            }
                          })()
                        ) : (
                          <button 
                            className={`w-full ${windowWidth < 640 ? 'h-9' : 'h-9 sm:h-9 lg:h-10'} bg-white text-black ${windowWidth < 640 ? 'text-[10px]' : 'text-[10px] sm:text-xs lg:text-sm'} font-semibold rounded-lg ${windowWidth < 640 ? 'border-2 border-black' : 'border-4 border-black'} hover:bg-gray-50 hover:border-black transition-all duration-200 font-heading shadow-sm ${windowWidth < 640 ? 'min-h-[36px]' : 'min-h-[36px]'}`}
                            onClick={() => navigate('/signin')}
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                      
                      {/* Footer - Save and Share - Professional Layout */}
                      <div className={`${windowWidth < 640 ? 'mt-2 pt-2' : 'mt-2 pt-2 sm:mt-2.5 sm:pt-2.5'} ${windowWidth < 640 ? 'border-t border-black' : 'border-t-2 border-black'} ${windowWidth >= 640 ? 'flex-shrink-0 pb-0' : ''}`}>
                        <div className={`flex items-center ${windowWidth < 640 ? 'gap-1.5' : 'justify-between gap-2 sm:gap-3'}`}>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isEnquiryOutdated(enquiry)) {
                                handleSave(enquiry.id, e);
                              }
                            }}
                            disabled={!user || isEnquiryOutdated(enquiry)}
                            className={`inline-flex items-center ${windowWidth < 640 ? 'gap-1 flex-1 justify-center' : 'gap-1 sm:gap-1.5'} ${windowWidth < 640 ? 'px-2 py-1.5' : 'px-2 py-1.5 sm:px-2.5 sm:py-2'} rounded-lg transition-all duration-200 font-semibold ${windowWidth < 640 ? 'text-[9px]' : 'text-[10px] sm:text-xs lg:text-sm'} ${windowWidth < 640 ? 'min-h-[32px]' : 'min-h-[32px] sm:min-h-[36px]'} ${
                              savedEnquiries.includes(enquiry.id) 
                                ? `text-blue-700 bg-blue-50 hover:bg-blue-100 ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'}` 
                                : `text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'}`
                            } ${isEnquiryOutdated(enquiry) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Bookmark className={`${windowWidth < 640 ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4'} transition-transform duration-200 ${savedEnquiries.includes(enquiry.id) ? 'fill-current' : ''}`} />
                            <span className="font-semibold">{savedEnquiries.includes(enquiry.id) ? 'Saved' : 'Save'}</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isEnquiryOutdated(enquiry)) {
                                handleShare(enquiry, e);
                              }
                            }}
                            disabled={isEnquiryOutdated(enquiry)}
                            className={`inline-flex items-center ${windowWidth < 640 ? 'gap-1 flex-1 justify-center' : 'gap-1 sm:gap-1.5'} ${windowWidth < 640 ? 'px-2 py-1.5' : 'px-2 py-1.5 sm:px-2.5 sm:py-2'} rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 font-semibold ${windowWidth < 640 ? 'text-[9px]' : 'text-[10px] sm:text-xs lg:text-sm'} ${windowWidth < 640 ? 'min-h-[32px]' : 'min-h-[32px] sm:min-h-[36px]'} ${windowWidth < 640 ? 'border border-black' : 'border-2 border-black'} ${isEnquiryOutdated(enquiry) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Share2 className={`${windowWidth < 640 ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4'} transition-transform duration-200 hover:scale-110`} />
                            <span className="font-semibold">Share</span>
                          </button>
                        </div>
                      </div>
                      </div>
                      </div>
                    </motion.div>
                  </Link>
                  </motion.div>
                    );
                  })}
                </AnimatePresence>
                {/* Backdrop overlay when card is expanded (mobile) */}
                {expandedCardId && windowWidth < 1024 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black z-40"
                    onClick={() => setExpandedCardId(null)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setExpandedCardId(null);
                    }}
                  />
                )}
              </div>
                
            {/* Load More Button */}
            {filteredEnquiries.length > 3 && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => setShowAllEnquiries(!showAllEnquiries)}
                  variant="outline"
                  className="mobile-button-outline"
                >
                  {showAllEnquiries ? 'Show Less' : `Load More Enquiries (${filteredEnquiries.length - 3} more)`}
                </Button>
              </div>
            )}

              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                {searchTerm ? (
                  <>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-6">No enquiries match your search for "{searchTerm}". Try different keywords!</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={() => setSearchTerm("")}
                        variant="outline"
                      >
                        Clear Search
                      </Button>
                      <Link to="/post-enquiry">
                        <Button className="bg-pal-blue hover:bg-pal-blue-dark text-white">
                          Post Your Enquiry
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                <h3 className="text-lg font-semibold text-foreground mb-2">No live enquiries yet</h3>
                <p className="text-muted-foreground mb-6">
                  Post your needs and start connecting with sellers!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/post-enquiry">
                    <Button variant="default" className="bg-pal-blue hover:bg-pal-blue-dark text-white">
                      Post First Enquiry
                    </Button>
                  </Link>
                </div>
                  </>
                )}
              </div>
            )}

            {/* Show All Enquiries Button */}
            <div className="text-center mt-4">
              <Link to="/enquiries">
                <Button 
                  variant="outline" 
                  className="h-7 sm:h-10 px-3 sm:px-6 text-[10px] sm:text-sm font-medium border-4 border-black text-black hover:border-black hover:bg-gray-50 transition-all duration-200"
                >
                  <Eye className="mr-1 sm:mr-2 h-2.5 w-2.5 sm:h-4 sm:w-4" />
                  Show All Enquiries
                </Button>
              </Link>
            </div>
          </section>

          {/* Compact Dashboard Section for Signed-in Users */}
          {user && (
            <div className="mb-6 sm:mb-12 animate-slide-up px-4 sm:px-0" style={{ animationDelay: '1s' }}>
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-slate-600 font-medium text-[10px] sm:text-xs md:text-base mb-3 sm:mb-4 leading-tight">
                  Stay anonymous — let them be surprised!
                </p>
                
                <div className="flex flex-row gap-1.5 sm:gap-2 justify-center items-center">
                  <Link to="/dashboard">
                    <button className="bg-black text-white px-3 sm:px-4 py-3 sm:py-4 text-[10px] sm:text-xs rounded-full inline-flex items-center justify-center aspect-square w-12 h-12 sm:w-14 sm:h-14">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Link>
                  <Link to="/post-enquiry">
                    <button className="bg-black text-white px-3 sm:px-4 py-3 sm:py-4 text-[10px] sm:text-xs rounded-full inline-flex items-center justify-center aspect-square w-12 h-12 sm:w-14 sm:h-14">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Categories Preview - Professional & Engaging */}
          <div className="mb-12 sm:mb-20 animate-slide-up" style={{ animationDelay: '1.2s' }}>
            {/* Background Container */}
            <div className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30">
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100/20 rounded-full blur-3xl"></div>
              </div>

              <div className="max-w-7xl mx-auto relative">
              {/* Section Header */}
                <div className="mb-8 sm:mb-14 lg:mb-16">
                  <h2 className="text-center text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black mb-2 sm:mb-4">
                  Popular Categories
                </h2>
                  <div className="w-full flex justify-center">
                    <p className="text-xs sm:text-base lg:text-lg font-black text-black w-full sm:max-w-2xl leading-relaxed text-center px-4 sm:px-1 whitespace-nowrap sm:whitespace-normal">
                      "They not like us"
                </p>
                  </div>
              </div>

                {/* Categories Single Row - Professional Circles */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-5 lg:gap-8 mb-10 sm:mb-12">
                <AnimatePresence mode="wait">
                {displayedCategories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <motion.div
                      key={`${category.value}-${index}`}
                        className="group flex justify-center items-center"
                        style={{ willChange: 'transform, opacity, filter' }}
                        initial={{ opacity: 0, scale: 0.5, y: 40, rotateX: -90, filter: "blur(8px)" }}
                        animate={{ 
                          opacity: isShufflingCategories ? 0 : 1, 
                          scale: isShufflingCategories ? 0.5 : 1,
                          y: isShufflingCategories ? 40 : 0,
                          rotateX: isShufflingCategories ? -90 : 0,
                          filter: isShufflingCategories ? "blur(8px)" : "blur(0px)"
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: -40, rotateX: 90, filter: "blur(8px)" }}
                        transition={{ 
                          duration: 0.7, 
                          delay: index * 0.06,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          type: "spring",
                          stiffness: 120,
                          damping: 18
                        }}
                        whileHover={{ 
                          scale: 1.15,
                          y: -8,
                          transition: { duration: 0.3 }
                        }}
                    >
                        <div className="relative">
                          {/* Glow Effect on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 rounded-full blur-xl transition-all duration-500 scale-0 group-hover:scale-150"></div>
                          
                          {/* Circle Container */}
                      <motion.div
                            className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-full w-36 h-36 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-400/20 overflow-hidden flex flex-col items-center justify-center cursor-pointer border border-gray-700/50 group-hover:border-gray-600"
                            style={{ willChange: 'transform, box-shadow' }}
                            whileHover={{ 
                              scale: 1.1,
                              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
                            }}
                            transition={{ duration: 0.3 }}
                      >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                        {/* Content - Perfectly Centered */}
                            <div className="relative flex flex-col items-center justify-center text-center space-y-2 sm:space-y-2.5 lg:space-y-3 z-10 w-full h-full p-4 sm:p-4">
                          {/* Icon Container */}
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500 flex-shrink-0 shadow-lg">
                                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 text-white group-hover:text-blue-100 transition-colors duration-300" />
                          </div>
                          
                              {/* Category Name - Well Arranged */}
                              <div className="w-full flex flex-row sm:flex-col items-center justify-center gap-0.5 sm:gap-0.5">
                                <h4 className="text-[9px] sm:text-xs md:text-sm lg:text-xs font-semibold text-white/95 group-hover:text-white leading-tight text-center px-1 sm:px-2 transition-colors duration-300 whitespace-nowrap sm:whitespace-normal">
                                {category.name}
                              </h4>
                              </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>

              {/* View All CTA */}
                <div className="text-center">
                <Link
                  to="/enquiries"
                    className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-gray-400/20 hover:scale-105 active:scale-100 border border-gray-700/50"
                >
                  <span className="text-sm sm:text-base">Explore All Categories</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center glass-effect backdrop-blur-sm">
            <div className="w-1 h-3 bg-gradient-to-b from-pal-blue to-transparent rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>

      </section>

      {/* How It Works Section - Animated 2D Flow */}
      <section className="py-10 sm:py-16 relative bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-12">
            <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black mb-1">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm font-black text-black">
              This isn't rocket science.
            </p>
          </div>

          {/* Animated SVG Flow - Compact Layout */}
          <div className="bg-white p-4 sm:p-14 rounded-xl sm:rounded-3xl border-4 border-black shadow-md sm:shadow-lg">
            <div className="text-center mb-8 sm:mb-4 lg:mb-6">
              <p className="text-[8px] sm:text-sm lg:text-base text-black font-bold">Advanced AI powers all curations and suggestions for both buyers and sellers.</p>
            </div>
            <svg viewBox="0 0 1200 600" className="w-full h-[400px] sm:h-[650px]">
              {/* Step 1: Larger Animated Human Character */}
              <g transform="translate(120, 150)">
                {/* Extra Large Head with Continuous Bounce */}
                <circle cx="0" cy="-40" r="48" fill="none" stroke="#1F2937" strokeWidth="4">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="-16" cy="-56" r="6" fill="#1F2937">
                  <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="16" cy="-56" r="6" fill="#1F2937">
                  <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <path d="M-16,-36 Q0,-28 16,-36" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M-16,-36 Q0,-28 16,-36; M-16,-36 Q0,-22 16,-36" dur="2s" repeatCount="indefinite"/>
                </path>
                
                {/* Larger Body */}
                <ellipse cx="0" cy="20" rx="36" ry="55" fill="none" stroke="#1F2937" strokeWidth="4">
                  <animateTransform attributeName="transform" type="scale" values="1,1; 1.08,1; 1,1" dur="3s" repeatCount="indefinite"/>
                </ellipse>
                
                {/* Dynamic Arms - Bigger Swing */}
                <g transform="translate(-35, 15)">
                  <path d="M0,0 L-28,-25" stroke="#1F2937" strokeWidth="4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" values="0 0 0; -25 0 0; 0 0 0" dur="2.5s" repeatCount="indefinite"/>
                  </path>
                  <circle cx="-28" cy="-25" r="8" fill="#1F2937"/>
                </g>
                <g transform="translate(35, 15)">
                  <path d="M0,0 L28,-25" stroke="#1F2937" strokeWidth="4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" values="0 0 0; 25 0 0; 0 0 0" dur="2.5s" repeatCount="indefinite"/>
                  </path>
                  <circle cx="28" cy="-25" r="8" fill="#1F2937"/>
                </g>
                
                {/* Large Pulsing Energy Circles */}
                <circle cx="0" cy="-40" r="65" fill="none" stroke="#1F2937" strokeWidth="2" opacity="0.3">
                  <animate attributeName="r" values="65;75;65" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="0" cy="-40" r="55" fill="none" stroke="#1F2937" strokeWidth="1.5" opacity="0.2">
                  <animate attributeName="r" values="55;65;55" dur="2.3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="0" cy="-40" r="45" fill="none" stroke="#1F2937" strokeWidth="1" opacity="0.15">
                  <animate attributeName="r" values="45;55;45" dur="2.6s" repeatCount="indefinite"/>
                </circle>
              </g>
              
              {/* Arrow 1 - Larger */}
              <g transform="translate(280, 220)">
                <line x1="0" y1="0" x2="140" y2="0" stroke="#1F2937" strokeWidth="5" opacity="0.7">
                  <animate attributeName="stroke-dasharray" values="0,400;140,0;0,0" dur="3s" repeatCount="indefinite" begin="0s"/>
                </line>
                <polygon points="155,0 140,-12 125,0 140,12" fill="#1F2937"/>
              </g>
              
              {/* Step 2: Larger AI Box */}
              <g transform="translate(450, 150)">
                <rect x="-60" y="-60" width="120" height="120" rx="16" fill="none" stroke="#1F2937" strokeWidth="4">
                  <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="2s" repeatCount="indefinite"/>
                </rect>
                <rect x="-45" y="-45" width="90" height="90" fill="#F9FAFB"/>
                
                {/* Larger Brain Nodes with More Motion */}
                <circle cx="0" cy="-20" r="10" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="-20" cy="-10" r="8" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.15s"/>
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="0.15s"/>
                </circle>
                <circle cx="20" cy="-10" r="8" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.3s"/>
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="0.3s"/>
                </circle>
                <circle cx="-18" cy="10" r="8" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.45s"/>
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="0.45s"/>
                </circle>
                <circle cx="18" cy="10" r="8" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.6s"/>
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="0.6s"/>
                </circle>
                <circle cx="-15" cy="28" r="7" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.75s"/>
                  <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" begin="0.75s"/>
                </circle>
                <circle cx="15" cy="28" r="7" fill="#1F2937">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" begin="0.9s"/>
                  <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" begin="0.9s"/>
                </circle>
                <circle cx="0" cy="35" r="9" fill="#1F2937" opacity="0.6">
                  <animate attributeName="r" values="9;12;9" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                {/* Animated Connecting Lines */}
                <line x1="-20" y1="-10" x2="0" y2="-20" stroke="#1F2937" strokeWidth="3" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite"/>
                </line>
                <line x1="20" y1="-10" x2="0" y2="-20" stroke="#1F2937" strokeWidth="3" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
                </line>
                <line x1="-18" y1="10" x2="-20" y2="-10" stroke="#1F2937" strokeWidth="3" opacity="0.3">
                  <animate attributeName="opacity" values="0.1;0.6;0.1" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
                </line>
                <line x1="18" y1="10" x2="20" y2="-10" stroke="#1F2937" strokeWidth="3" opacity="0.3">
                  <animate attributeName="opacity" values="0.1;0.6;0.1" dur="1.5s" repeatCount="indefinite" begin="0.9s"/>
                </line>
              </g>
              
              {/* Arrow 2 - Larger */}
              <g transform="translate(580, 220)">
                <line x1="0" y1="0" x2="160" y2="0" stroke="#1F2937" strokeWidth="5" opacity="0.7">
                  <animate attributeName="stroke-dasharray" values="0,400;160,0;0,0" dur="3s" repeatCount="indefinite" begin="0.5s"/>
                </line>
                <polygon points="175,0 160,-12 145,0 160,12" fill="#1F2937"/>
              </g>
              
              {/* Step 3: Larger Multiple Sellers */}
              <g transform="translate(780, 80)">
                <g transform="translate(-70, 0)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#1F2937" strokeWidth="4">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-18; 0,0" dur="2s" repeatCount="indefinite" begin="0s"/>
                  </circle>
                  <circle cx="-16" cy="-16" r="5" fill="#1F2937"/>
                  <circle cx="16" cy="-16" r="5" fill="#1F2937"/>
                  <path d="M-18,15 Q0,22 18,15" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round">
                    <animate attributeName="d" values="M-18,15 Q0,22 18,15; M-18,15 Q0,25 18,15" dur="2s" repeatCount="indefinite"/>
                  </path>
                  <path d="M-35,25 L35,25 M-42,38 L42,38" stroke="#1F2937" strokeWidth="4" strokeLinecap="round"/>
                </g>
                <g transform="translate(0, 0)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#1F2937" strokeWidth="4">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-18; 0,0" dur="2s" repeatCount="indefinite" begin="0.4s"/>
                  </circle>
                  <circle cx="-16" cy="-16" r="5" fill="#1F2937"/>
                  <circle cx="16" cy="-16" r="5" fill="#1F2937"/>
                  <path d="M-18,15 Q0,22 18,15" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round">
                    <animate attributeName="d" values="M-18,15 Q0,22 18,15; M-18,15 Q0,25 18,15" dur="2s" repeatCount="indefinite"/>
                  </path>
                  <path d="M-35,25 L35,25 M-42,38 L42,38" stroke="#1F2937" strokeWidth="4" strokeLinecap="round"/>
                </g>
                <g transform="translate(70, 0)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#1F2937" strokeWidth="4">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-18; 0,0" dur="2s" repeatCount="indefinite" begin="0.8s"/>
                  </circle>
                  <circle cx="-16" cy="-16" r="5" fill="#1F2937"/>
                  <circle cx="16" cy="-16" r="5" fill="#1F2937"/>
                  <path d="M-18,15 Q0,22 18,15" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round">
                    <animate attributeName="d" values="M-18,15 Q0,22 18,15; M-18,15 Q0,25 18,15" dur="2s" repeatCount="indefinite"/>
                  </path>
                  <path d="M-35,25 L35,25 M-42,38 L42,38" stroke="#1F2937" strokeWidth="4" strokeLinecap="round"/>
                </g>
              </g>
              
              {/* Down Arrow - Larger */}
              <g transform="translate(620, 130)">
                <line x1="0" y1="0" x2="0" y2="90" stroke="#1F2937" strokeWidth="4" opacity="0.7">
                  <animate attributeName="stroke-dasharray" values="0,250;90,0;0,0" dur="3s" repeatCount="indefinite" begin="1s"/>
                </line>
                <polygon points="0,95 -8,88 0,105 8,88" fill="#1F2937"/>
              </g>
              
              {/* Step 4: Larger Success */}
              <g transform="translate(580, 260)">
                <circle cx="0" cy="0" r="65" fill="#1F2937" opacity="0.9">
                  <animate attributeName="r" values="65;72;65" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="0" cy="0" r="52" fill="none" stroke="white" strokeWidth="3"/>
                <path d="M-24,-8 L-8,15 L24,-15" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="1.5s" repeatCount="indefinite"/>
                </path>
              </g>
              
              {/* Horizontal Step Labels at Bottom - Compact for Mobile */}
              <g transform="translate(140, 380)">
                <text x="0" y="0" textAnchor="start" fontSize="18" fill="#1F2937" fontWeight="900" className="sm:text-2xl lg:text-lg font-bold">1. Post Whatever You Need At The Moment.</text>
                <text x="0" y="25" textAnchor="start" fontSize="15" fill="#6B7280" className="sm:text-xl lg:text-base font-bold">→ Share your enquiry.</text>
              </g>
              
              <g transform="translate(600, 480)">
                <text x="0" y="0" textAnchor="middle" fontSize="18" fill="#1F2937" fontWeight="900" className="sm:text-2xl lg:text-lg font-bold" style={{ wordSpacing: '0.05em', letterSpacing: '0.01em' }}>2. Connect Only With The Right Providers.</text>
                <text x="0" y="25" textAnchor="middle" fontSize="15" fill="#6B7280" className="sm:text-xl lg:text-base font-bold">→ Discover verified, curated sellers easily</text>
              </g>
              
              <g transform="translate(1150, 580)">
                <text x="0" y="0" textAnchor="end" fontSize="18" fill="#1F2937" fontWeight="900" className="sm:text-2xl lg:text-lg font-bold">3. Close The Deal, Stay Anonymous, Stay Secure.</text>
                <text x="0" y="25" textAnchor="end" fontSize="15" fill="#6B7280" className="sm:text-xl lg:text-base font-bold">→ Close deals — anonymous and safe.</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Portal-based Search Suggestions - Renders outside normal DOM hierarchy */}
      {showSearchSuggestions && getSearchSuggestions().length > 0 && createPortal(
        <div 
          className="fixed bg-white border-4 border-black rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[99999]"
          style={{
            top: searchPosition.top,
            left: searchPosition.left,
            width: searchPosition.width,
            zIndex: 99999
          }}
        >
          {getSearchSuggestions().map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setSearchTerm(suggestion);
                setShowSearchSuggestions(false);
                handleSearch();
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl flex items-center gap-3 border-b border-black last:border-b-0"
            >
              <Search className="h-4 w-4 text-black" />
              <span className="text-sm text-black font-medium">{suggestion}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default Landing;
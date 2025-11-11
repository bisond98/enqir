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
      description: "Get a trust badge by sharing your ID - completely optional"
    },
    {
      icon: Search,
      title: "AI-Powered Discovery",
      description: "Smart AI helps you find exactly what you need, instantly"
    },
    {
      icon: Users,
      title: "Simple & Safe",
      description: "Easy to use, safe to connect with others"
    }
  ];

  const categories = [
    { name: "Household & Personal", icon: Home, color: "from-blue-50 to-blue-100/50" },
    { name: "Community Help", icon: Heart, color: "from-purple-50 to-purple-100/50" },
    { name: "Services & Skills", icon: Briefcase, color: "from-emerald-50 to-emerald-100/50" },
    { name: "Collectibles & Hobbies", icon: Package, color: "from-amber-50 to-amber-100/50" },
    { name: "Transportation", icon: Car, color: "from-slate-50 to-slate-100/50" },
    { name: "Home & Garden", icon: Sprout, color: "from-green-50 to-green-100/50" }
  ];

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
  // State for showing more enquiries
  const [showAllEnquiries, setShowAllEnquiries] = useState(false);
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0, width: 0 });
  const [savedEnquiries, setSavedEnquiries] = useState<string[]>([]);

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
      return [...recentSearches, ...popularSearches].slice(0, 6);
    }
    
    const allSuggestions = [...recentSearches, ...popularSearches];
    return allSuggestions
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 6);
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
    const q = query(
      collection(db, 'enquiries'),
      where('status', '==', 'live'),
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
      
      // Deduplicate by ID first (in case same document appears multiple times)
      const uniqueItems = Array.from(
        new Map(items.map(e => [e.id, e])).values()
      );
      
      // Separate live and expired
      const live = uniqueItems.filter(e => !isEnquiryOutdated(e));
      const expired = uniqueItems.filter(e => isEnquiryOutdated(e));
      
      // Sort both by createdAt (newest first)
      live.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      expired.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Deduplicate again after combining (extra safety)
      const allUnique = Array.from(
        new Map([...live, ...expired].map(e => [e.id, e])).values()
      );
      
      // Set all live enquiries for count and search (deduplicated)
      setAllLiveEnquiries(allUnique);
      
      // Set display enquiries (first 3 live, then expired if needed)
      let combined: any[] = [];
      if (live.length >= 3) {
        combined = live.slice(0, 3);
      } else {
        const needed = 3 - live.length;
        combined = [...live, ...expired.slice(0, needed)];
      }
      
      // Final deduplication on display enquiries
      const uniqueCombined = Array.from(
        new Map(combined.map(e => [e.id, e])).values()
      );
      
      setPublicRecentEnquiries(uniqueCombined);
      setShuffledEnquiries(uniqueCombined);
    }, (error) => {
      console.error('Error loading enquiries:', error);
      // Set empty arrays on error
      setAllLiveEnquiries([]);
      setPublicRecentEnquiries([]);
      setShuffledEnquiries([]);
    });
    return () => unsubscribe();
  }, []);

  // Shuffle every 1 minute
  useEffect(() => {
    // Deduplicate before processing
    const uniqueEnquiries = Array.from(
      new Map(publicRecentEnquiries.map(e => [e.id, e])).values()
    );
    
    if (uniqueEnquiries.length <= 1) {
      setShuffledEnquiries(uniqueEnquiries);
      return;
    }
    
    // Set initial shuffled (deduplicated)
    const initialShuffled = getRandomThree(uniqueEnquiries);
    const uniqueInitial = Array.from(
      new Map(initialShuffled.map(e => [e.id, e])).values()
    );
    setShuffledEnquiries(uniqueInitial);
    
    const interval = setInterval(() => {
      const shuffled = getRandomThree(uniqueEnquiries);
      const uniqueShuffled = Array.from(
        new Map(shuffled.map(e => [e.id, e])).values()
      );
      setShuffledEnquiries(uniqueShuffled);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [publicRecentEnquiries]);

  useEffect(() => {
    window.scrollTo(0, 0);
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
            <button className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 sm:py-2 px-4 sm:px-4 rounded-lg sm:rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
              <span className="text-xs sm:text-base">Post Your Need</span>
              <ArrowRight className="h-3 w-3 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </Link>
          <Link to="/enquiries" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-lg border-2 border-gray-800 hover:border-gray-800 flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
              <Eye className="h-3 w-3 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[10px] sm:text-base">Show All Enquiries</span>
            </button>
            </Link>
            <div className="w-full sm:w-auto relative z-50" style={{ zIndex: 50 }}>
              <div className="flex gap-2 sm:gap-2">
                <div className="relative flex-1" style={{ zIndex: 50 }}>
                  <Search className="absolute left-2 sm:left-5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-5 sm:w-5 text-gray-400" />
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
                    className="w-full px-2 sm:px-5 py-2.5 sm:py-4 pl-8 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-2xl focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-300 ease-out bg-white shadow-sm placeholder-gray-400"
                  />
                  
                </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-2.5 sm:py-2 px-3 sm:px-3 rounded-lg sm:rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[40px] sm:min-w-[52px]"
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
              <Card key={index} className="p-3 sm:p-6 glass-card hover-lift transition-spring group bg-blue-50/30 border-blue-100/50 rounded-xl sm:rounded-2xl">
                <div className="relative">
                  <feature.icon className="h-5 w-5 sm:h-8 sm:w-8 text-pal-blue mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-spring" />
                  <div className="absolute inset-0 bg-pal-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-spring"></div>
                </div>
                <h3 className="text-xs sm:text-lg font-semibold text-foreground mb-1 sm:mb-2 text-center group-hover:text-pal-blue transition-spring">{feature.title}</h3>
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
              <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-full shadow-sm">
                <div className="w-1 h-1 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm sm:text-sm font-medium text-slate-700">
                  {allLiveEnquiries.length} enquir{allLiveEnquiries.length !== 1 ? 'ys' : 'y'} available
                </span>
              </div>
            </div>
            {/* Recent Enquiries Grid */}
            {filteredEnquiries.length > 0 ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 px-1 sm:px-0">
                  {(showAllEnquiries ? filteredEnquiries : filteredEnquiries.slice(0, 3)).map((enquiry) => (
                  <Link key={enquiry.id} to={`/enquiry/${enquiry.id}`} className="block h-full">
                    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 hover:border-gray-300 flex flex-col h-full transform transition-all duration-200 hover:scale-[1.01] overflow-hidden group ${
                      isEnquiryOutdated(enquiry) ? 'opacity-70 bg-gray-100 border-gray-300 grayscale' : ''
                    }`}>
                      {/* Card Header - Compact on mobile, spacious on desktop */}
                      <div className="bg-gray-800 px-2.5 sm:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4">
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
                      
                      {/* Card Content - Compact on mobile, spacious on desktop */}
                      <div className="p-2.5 sm:p-3 lg:p-6 flex-1 flex flex-col">
                      {/* Title */}
                      <h3 className={`text-[12px] sm:text-[13px] lg:text-lg font-semibold mb-1 sm:mb-1.5 lg:mb-3 leading-snug line-clamp-2 ${
                        isEnquiryOutdated(enquiry) ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {enquiry.title}
                      </h3>
                      
                      {/* Quick facts: Budget (location moved on mobile) */}
                      <div className="mb-1.5 sm:mb-2.5 lg:mb-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-[10px] sm:text-[11px] lg:text-base text-slate-700 flex-wrap">
                          {enquiry.budget && (
                            <span className="inline-flex items-center font-semibold text-slate-900">
                              <span className="mr-0.5 sm:mr-1 lg:mr-1.5 text-[12px] sm:text-[13px] lg:text-lg">₹</span>{formatIndianCurrency(enquiry.budget)}
                            </span>
                          )}
                          {/* Keep location inline on larger screens */}
                          {enquiry.budget && enquiry.location && (
                            <span className="hidden sm:inline text-slate-300">•</span>
                          )}
                          {enquiry.location && (
                            <span className="hidden sm:inline-flex items-center">
                              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 mr-1 lg:mr-1.5 text-slate-500" />
                              <span className="line-clamp-1">
                                {enquiry.location}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Meta: Category at left, Created date at right */}
                      <div className="mb-2 sm:mb-3 lg:mb-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] lg:text-sm px-1.5 sm:px-2 lg:px-3 py-0.5 lg:py-1">
                            {enquiry.category}
                          </Badge>
                          <div className="flex items-center text-[9px] sm:text-[10px] lg:text-sm text-slate-500">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 mr-0.5 sm:mr-1 lg:mr-1.5" />
                            <span className="whitespace-nowrap">
                              {enquiry.createdAt?.toDate ? formatDate(enquiry.createdAt.toDate().toISOString()) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {/* Mobile-only location aligned to right, slightly larger */}
                        {enquiry.location && (
                          <div className="sm:hidden mt-1.5">
                            <div className="flex items-start justify-end gap-1">
                              <MapPin className="h-2.5 w-2.5 mt-0.5 text-slate-600" />
                              <span className="text-[9px] text-slate-700 text-right break-words">{enquiry.location}</span>
                            </div>
                          </div>
                        )}
                        {/* Deadline Timer */}
                        {enquiry.deadline && !isEnquiryOutdated(enquiry) && (
                          <div className="mt-0.5 sm:mt-1 lg:mt-2">
                            <CountdownTimer
                              deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                              className="text-[9px] sm:text-[10px] lg:text-sm"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Primary action - before footer */}
                      <div className="flex flex-col gap-0.5 sm:gap-1 lg:gap-2 mt-auto -mx-2.5 sm:-mx-3 lg:-mx-6 px-2.5 sm:px-3 lg:px-6">
                        {user ? (
                          (() => {
                            const isOwnEnquiry = enquiry.userId === user.uid;
                            if (isOwnEnquiry) {
                              return (
                                <button className="w-full h-5 sm:h-6 lg:h-10 bg-gray-100 text-gray-600 text-[8px] sm:text-[9px] lg:text-sm font-medium rounded border border-gray-300" disabled>
                                  ✅ Your Enquiry
                                </button>
                              );
                            } else if (isEnquiryOutdated(enquiry)) {
                              return (
                                <button className="w-full h-5 sm:h-6 lg:h-10 bg-gray-100 text-gray-600 text-[8px] sm:text-[9px] lg:text-sm font-medium rounded border border-gray-300" disabled>
                                  Expired
                                </button>
                              );
                            } else {
                              return (
                                <button 
                                  className="w-full h-5 sm:h-6 lg:h-10 bg-gray-800 text-white text-[8px] sm:text-[9px] lg:text-sm font-medium rounded hover:bg-gray-900 transition-colors"
                                  onClick={() => navigate(`/respond/${enquiry.id}`)}
                                >
                                  Sell
                                </button>
                              );
                            }
                          })()
                        ) : (
                          <button 
                            className="w-full h-5 sm:h-6 lg:h-10 bg-gray-100 text-gray-700 text-[8px] sm:text-[9px] lg:text-sm font-medium rounded border border-gray-300 hover:bg-gray-200 transition-colors"
                            onClick={() => navigate('/signin')}
                          >
                            Sign In to Respond
                          </button>
                        )}
                      </div>
                      
                      {/* Footer - Save and Share only */}
                      <div className="border-t border-gray-700 bg-gray-800 rounded-b-lg -mx-2.5 sm:-mx-3 lg:-mx-6 -mb-2.5 sm:-mb-3 lg:-mb-6 px-2.5 sm:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4">
                        <div className="flex items-center justify-between h-[18px] sm:h-[20px] lg:h-[28px]">
                          <button 
                            onClick={(e) => handleSave(enquiry.id, e)}
                            className={`inline-flex items-center gap-0.5 sm:gap-1 lg:gap-2 px-1 sm:px-1.5 lg:px-3 py-0.5 lg:py-1 h-auto text-[8px] sm:text-[9px] lg:text-sm transition-all duration-150 ${savedEnquiries.includes(enquiry.id) ? 'text-blue-300 hover:text-blue-200' : 'text-gray-300 hover:text-blue-300'}`}
                            disabled={!user}
                          >
                            <Bookmark className={`h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 transition-transform duration-150 ${savedEnquiries.includes(enquiry.id) ? 'fill-current scale-110' : 'hover:scale-110'}`} />
                            <span className="hidden sm:inline">{savedEnquiries.includes(enquiry.id) ? 'Saved' : 'Save'}</span>
                          </button>
                          <button 
                            onClick={(e) => handleShare(enquiry, e)}
                            className="inline-flex items-center gap-0.5 sm:gap-1 lg:gap-2 px-1 sm:px-1.5 lg:px-3 py-0.5 lg:py-1 h-auto text-[8px] sm:text-[9px] lg:text-sm text-gray-300 hover:text-blue-300 transition-all duration-150"
                          >
                            <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 transition-transform duration-150 hover:scale-110" />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                        </div>
                      </div>
                      </div>
                    </div>
                  </Link>
                ))}
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

            {/* Show All Enquiries Button */}
            <div className="text-center mt-4">
              <Link to="/enquiries">
                <Button 
                  variant="outline" 
                  className="h-7 sm:h-10 px-3 sm:px-6 text-[10px] sm:text-sm font-medium border-2 border-gray-800 text-gray-800 hover:border-gray-800 hover:bg-gray-50 transition-all duration-200"
                >
                  <Eye className="mr-1 sm:mr-2 h-2.5 w-2.5 sm:h-4 sm:w-4" />
                  Show All Enquiries
                </Button>
              </Link>
            </div>
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
          </section>

          {/* Compact Dashboard Section for Signed-in Users */}
          {user && (
            <div className="mb-6 sm:mb-12 animate-slide-up px-4 sm:px-0" style={{ animationDelay: '1s' }}>
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-slate-600 font-medium text-[10px] sm:text-xs md:text-base mb-3 sm:mb-4 leading-tight">
                  Stay anonymous until closing the deal
                </p>
                
                <div className="flex flex-row gap-1.5 sm:gap-2 justify-center items-center">
                  <Link to="/dashboard">
                    <button className="bg-gray-800 text-white px-3 sm:px-4 py-3 sm:py-4 text-[10px] sm:text-xs rounded-full inline-flex items-center justify-center aspect-square w-12 h-12 sm:w-14 sm:h-14">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Link>
                  <Link to="/post-enquiry">
                    <button className="bg-gray-800 text-white px-3 sm:px-4 py-3 sm:py-4 text-[10px] sm:text-xs rounded-full inline-flex items-center justify-center aspect-square w-12 h-12 sm:w-14 sm:h-14">
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
                <div className="text-center mb-8 sm:mb-14 lg:mb-16 px-2 sm:px-0">
                  <div className="inline-block mb-2 sm:mb-4">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider px-4 py-1.5 bg-gray-100 rounded-full">
                      Explore
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-2 sm:mb-4">
                    Popular Categories
                  </h2>
                  <p className="text-[10px] sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-tight sm:leading-relaxed whitespace-nowrap sm:whitespace-normal px-1">
                    Discover opportunities across diverse categories tailored to your needs
                  </p>
                </div>

                {/* Categories Single Row - Professional Circles */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-5 lg:gap-8 mb-10 sm:mb-12">
                  {categories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <div
                        key={index}
                        className="group flex justify-center items-center animate-slide-up"
                        style={{ animationDelay: `${1.4 + index * 0.1}s` }}
                      >
                        <div className="relative">
                          {/* Glow Effect on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 rounded-full blur-xl transition-all duration-500 scale-0 group-hover:scale-150"></div>
                          
                          {/* Circle Container */}
                          <div
                            className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-full w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-400/20 hover:scale-110 overflow-hidden flex flex-col items-center justify-center cursor-pointer border border-gray-700/50 group-hover:border-gray-600"
                          >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Content - Perfectly Centered */}
                            <div className="relative flex flex-col items-center justify-center text-center space-y-2 sm:space-y-2.5 lg:space-y-3 z-10 w-full h-full p-4">
                              {/* Icon Container */}
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500 flex-shrink-0 shadow-lg">
                                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 text-white group-hover:text-blue-100 transition-colors duration-300" />
                              </div>
                              
                              {/* Category Name - Well Arranged */}
                              <div className="w-full flex flex-col items-center justify-center gap-0.5">
                                {category.name.includes('&') ? (
                                  <>
                                    <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/95 group-hover:text-white leading-tight text-center px-2 transition-colors duration-300">
                                      {category.name.split('&')[0]?.trim()}
                                    </h4>
                                    <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/95 group-hover:text-white leading-tight text-center px-2 transition-colors duration-300">
                                      & {category.name.split('&')[1]?.trim()}
                                    </h4>
                                  </>
                                ) : category.name.split(' ').length > 2 ? (
                                  <>
                                    <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/95 group-hover:text-white leading-tight text-center px-2 transition-colors duration-300">
                                      {category.name.split(' ').slice(0, 2).join(' ')}
                                    </h4>
                                    <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/95 group-hover:text-white leading-tight text-center px-2 transition-colors duration-300">
                                      {category.name.split(' ').slice(2).join(' ')}
                                    </h4>
                                  </>
                                ) : (
                                  <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/95 group-hover:text-white leading-tight text-center px-2 transition-colors duration-300">
                                    {category.name}
                                  </h4>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View All CTA */}
                <div className="text-center">
                  <Link
                    to="/enquiries"
                    className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-gray-400/20 hover:scale-105 active:scale-100 border border-gray-700/50"
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
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              3 simple steps to connect
            </p>
          </div>

          {/* Animated SVG Flow - Compact Layout */}
          <div className="bg-white p-4 sm:p-14 rounded-xl sm:rounded-3xl border border-gray-200 sm:border-2 shadow-md sm:shadow-lg">
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
                  <path d="M-18,15 Q0,10 18,15" stroke="#1F2937" strokeWidth="4" fill="none"/>
                  <path d="M-35,25 L35,25 M-42,38 L42,38" stroke="#1F2937" strokeWidth="4" strokeLinecap="round"/>
                </g>
                <g transform="translate(0, 0)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#1F2937" strokeWidth="4">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-18; 0,0" dur="2s" repeatCount="indefinite" begin="0.4s"/>
                  </circle>
                  <circle cx="-16" cy="-16" r="5" fill="#1F2937"/>
                  <circle cx="16" cy="-16" r="5" fill="#1F2937"/>
                  <path d="M-18,15 Q0,10 18,15" stroke="#1F2937" strokeWidth="4" fill="none"/>
                  <path d="M-35,25 L35,25 M-42,38 L42,38" stroke="#1F2937" strokeWidth="4" strokeLinecap="round"/>
                </g>
                <g transform="translate(70, 0)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#1F2937" strokeWidth="4">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-18; 0,0" dur="2s" repeatCount="indefinite" begin="0.8s"/>
                  </circle>
                  <circle cx="-16" cy="-16" r="5" fill="#1F2937"/>
                  <circle cx="16" cy="-16" r="5" fill="#1F2937"/>
                  <path d="M-18,15 Q0,10 18,15" stroke="#1F2937" strokeWidth="4" fill="none"/>
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
              <g transform="translate(140, 450)">
                <text x="0" y="0" textAnchor="start" fontSize="16" fill="#1F2937" fontWeight="700" className="sm:text-2xl">1. Post Need</text>
                <text x="0" y="20" textAnchor="start" fontSize="12" fill="#6B7280" className="sm:text-lg">→ Share what you need</text>
              </g>
              
              <g transform="translate(470, 450)">
                <text x="0" y="0" textAnchor="start" fontSize="16" fill="#1F2937" fontWeight="700" className="sm:text-2xl">2. AI Matches</text>
                <text x="0" y="20" textAnchor="start" fontSize="12" fill="#6B7280" className="sm:text-lg">→ Finds verified sellers</text>
              </g>
              
              <g transform="translate(800, 450)">
                <text x="0" y="0" textAnchor="start" fontSize="16" fill="#1F2937" fontWeight="700" className="sm:text-2xl">3. Connect &amp; Complete</text>
                <text x="0" y="20" textAnchor="start" fontSize="12" fill="#6B7280" className="sm:text-lg">→ Chat &amp; close deal</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Portal-based Search Suggestions - Renders outside normal DOM hierarchy */}
      {showSearchSuggestions && getSearchSuggestions().length > 0 && createPortal(
        <div 
          className="fixed bg-white border-2 border-blue-400 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[99999]"
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
              className="w-full px-4 py-3 text-left hover:bg-blue-100 transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl flex items-center gap-3 border-b border-gray-200 last:border-b-0"
            >
              <Search className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-800 font-medium">{suggestion}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default Landing;
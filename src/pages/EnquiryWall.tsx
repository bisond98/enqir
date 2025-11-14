import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, Clock, MessageSquare, ArrowRight, Search, Filter, X, CheckCircle, Grid3X3, List, Check } from "lucide-react";
import newLogo from "@/assets/new-logo.png";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import CountdownTimer from "@/components/CountdownTimer";
import { AISearchService } from "@/services/ai/aiSearchService";
import { formatIndianCurrency } from "@/lib/utils";
import { LoadingAnimation } from "@/components/LoadingAnimation";

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
  idFrontImage?: string;
  idBackImage?: string;
}

export default function EnquiryWall() {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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

  // Load enquiries
  useEffect(() => {
    const loadEnquiries = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "enquiries"), where("status", "==", "live")));
        const enquiriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Enquiry[];
        
        // Separate live and expired enquiries
        const now = new Date();
        const liveEnquiries = enquiriesData.filter(enquiry => {
          if (!enquiry.deadline) return true; // No deadline = live
          const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
          return deadlineDate >= now;
        });
        
        const expiredEnquiries = enquiriesData.filter(enquiry => {
          if (!enquiry.deadline) return false; // No deadline = not expired
          const deadlineDate = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
          return deadlineDate < now;
        });
        
        // Sort live enquiries by date (newest first)
        liveEnquiries.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        
        // Sort expired enquiries by date (newest first)
        expiredEnquiries.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        
        // Combine live first, then expired (both already sorted)
        const combinedEnquiries = [...liveEnquiries, ...expiredEnquiries];
        
        // Deduplicate by enquiry ID to prevent duplicates
        const uniqueEnquiries = Array.from(
          new Map(combinedEnquiries.map(enquiry => [enquiry.id, enquiry])).values()
        );
        
        setEnquiries(uniqueEnquiries);
        setLoading(false);
      } catch (error) {
        console.error("Error loading enquiries:", error);
        setLoading(false);
      }
    };

    loadEnquiries();
  }, []);

  // Fetch user profiles for all enquiry owners to show trust badges
  useEffect(() => {
    if (enquiries.length === 0) return;

    const fetchUserProfiles = async () => {
      const profiles: {[key: string]: any} = {};
      const userIds = [...new Set(enquiries.map(enquiry => enquiry.userId))];
      
      for (const userId of userIds) {
        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
          if (profileDoc.exists()) {
            profiles[userId] = profileDoc.data();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      setUserProfiles(profiles);
    };

    fetchUserProfiles();
  }, [enquiries]);

  // AI-powered search function
  const handleAISearch = async (term: string) => {
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
  };

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

  // Handle search input with AI suggestions
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    
    if (value.trim()) {
      // Generate suggestions from actual enquiry data
      const suggestions = generateSuggestions(value);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
      // Perform AI search
      await handleAISearch(value);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setAiSearchResults(null);
    }
  };

  // Find matching category for a suggestion
  const findMatchingCategory = (suggestion: string): string | null => {
    const suggestionLower = suggestion.toLowerCase().replace(/\s+/g, '-');
    
    // Check all available categories
    const allCategories = [
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'antiques', label: 'Antiques' },
      { value: 'art', label: 'Art' },
      { value: 'automobile', label: 'Automobile' },
      { value: 'books', label: 'Books' },
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
      { value: 'services', label: 'Services' },
      { value: 'sports', label: 'Sports' },
      { value: 'technology', label: 'Technology' },
      { value: 'thrift', label: 'Thrift' },
      { value: 'transportation', label: 'Transportation' },
      { value: 'travel', label: 'Travel' },
      { value: 'vintage', label: 'Vintage' },
      { value: 'waste-management', label: 'Waste Management' },
      { value: 'wedding', label: 'Wedding' },
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
    // Close suggestions immediately
    setShowSuggestions(false);
    
    // Pre-calculate category
    const matchingCategory = findMatchingCategory(suggestion);
    
    // Update search term
    setSearchTerm(suggestion);
    
    // Set matching category
    if (matchingCategory) {
      setSelectedCategory(matchingCategory);
    }
    
    // Trigger search
    handleSearchChange(suggestion);
  };

  // Get final results - AI search completely overrides original search
  const finalResults = (() => {
    let results: Enquiry[] = [];
    
    // If AI search is active, use AI results only
    if (aiSearchResults) {
      results = aiSearchResults.results;
    } else {
      // If no AI search, use original filtering logic
      results = enquiries.filter(enquiry => {
        const matchesSearch = !searchTerm || 
          enquiry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || 
          enquiry.category === selectedCategory || 
          (enquiry.categories && enquiry.categories.includes(selectedCategory));
        return matchesSearch && matchesCategory;
      });
    }
    
    // Sort: User's enquiries in selected category first, then others
    if (selectedCategory !== "all") {
      return results.sort((a, b) => {
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
  })();

  // Deduplicate final results by ID to prevent duplicates
  const filteredEnquiries = Array.from(
    new Map(finalResults.map(enquiry => [enquiry.id, enquiry])).values()
  );

  // Check if we need to show "no enquiries in category" message and fallback to all
  const showCategoryFallback = filteredEnquiries.length === 0 && selectedCategory !== "all" && !aiSearchResults;
  
  // If no enquiries in selected category, show all enquiries as fallback
  const displayEnquiries = showCategoryFallback ? enquiries : filteredEnquiries;

  const isOwnEnquiry = (enquiry: Enquiry) => {
    return authUser && enquiry.userId === authUser.uid;
  };

  // Helper to check if an enquiry is expired
  const isEnquiryOutdated = (enquiry: Enquiry) => {
    if (!enquiry.deadline) return false;
    const deadline = enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline);
    return new Date() > deadline;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <LoadingAnimation message="Loading enquiries" />;
  }

  return (
    <Layout>
      <div 
        className="flex flex-col flex-grow bg-gradient-to-br from-background to-muted/20"
        style={{
          touchAction: 'pan-y pinch-zoom', // Allow vertical scroll but prevent double-tap zoom
          WebkitTextSizeAdjust: '100%', // Prevent text size adjustment that triggers zoom
          msTextSizeAdjust: '100%'
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-4">
              Live Enquiries
            </h1>
            <p className="text-[9px] sm:text-xs text-muted-foreground max-w-xl mx-auto">
              Connect with buyers from individuals to businesses.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search enquiries... (try 'car', 'jacket', 'phone')"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm placeholder-gray-400 leading-tight sm:leading-normal"
                  style={{ 
                    fontSize: '16px', // Prevents zoom on iOS
                    lineHeight: '1.5',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  disabled={isAISearching}
                />
                {isAISearching && (
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* AI Search Suggestions Dropdown - Absolute with Layout Isolation */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div 
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
                          
                          // Blur input to prevent keyboard zoom
                          if (searchInputRef.current) {
                            searchInputRef.current.blur();
                          }
                          
                          // Execute click (viewport already locked by useEffect)
                          handleSuggestionClick(suggestion);
                        }}
                        onClick={(e) => {
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
              {/* Categories Grid - Professional Mobile Layout */}
              <div className="w-full">
                {/* Mobile: First Row - Always Visible */}
                <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center sm:justify-start mb-2 sm:mb-0">
                  {[
                    { value: "all", label: "All" },
                    { value: "agriculture-farming", label: "Agriculture" },
                    { value: "antiques", label: "Antiques" },
                    { value: "art", label: "Art" },
                    { value: "automobile", label: "Automobile" },
                    { value: "books-publications", label: "Books" },
                  ].map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl sm:rounded-2xl transition-all duration-200 whitespace-nowrap min-touch ${
                        selectedCategory === category.value
                          ? 'bg-gray-800 text-white shadow-md hover:bg-gray-900 scale-105'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Mobile: Additional Categories - Expandable */}
                <div className={`${showAllCategories ? 'block' : 'hidden sm:block'} transition-all duration-300`}>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center sm:justify-start">
                    {[
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
                      { value: "professional-services", label: "Services" },
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
                      { value: "other", label: "Other" }
                    ].map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl sm:rounded-2xl transition-all duration-200 whitespace-nowrap min-touch ${
                          selectedCategory === category.value
                            ? 'bg-gray-800 text-white shadow-md hover:bg-gray-900 scale-105'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Mobile: Show More/Less toggle - Professional */}
              <div className="text-center sm:hidden pt-2">
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 min-touch"
                >
                  {showAllCategories ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Filter className="w-3.5 h-3.5" />
                      Show More (+38)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-xl font-semibold text-foreground">
              {displayEnquiries.length} enquiries
            </h3>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-5 sm:h-8 px-1.5 sm:px-3 text-[9px] sm:text-sm"
              >
                <Grid3X3 className="h-2.5 w-2.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-5 sm:h-8 px-1.5 sm:px-3 text-[9px] sm:text-sm"
              >
                <List className="h-2.5 w-2.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                List
              </Button>
            </div>
          </div>

          {/* Enquiries Grid/List */}
          {displayEnquiries.length > 0 ? (
            <>
            {/* Category Fallback Message */}
            {showCategoryFallback && (
              <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                <div className="text-center">
                  <p className="text-amber-800 font-semibold text-sm sm:text-base">
                    No enquiries found in "{selectedCategory.replace('-', ' ')}" category
                  </p>
                  <p className="text-amber-600 text-xs sm:text-sm mt-1">
                    Showing all enquiries below
                  </p>
                </div>
              </div>
            )}
            
            {/* AI Search Results Messages */}
            {aiSearchResults && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {aiSearchResults.noResultsInCategory ? (
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-sm">
                      No enquiries found in {aiSearchResults.searchedCategory?.replace('-', ' ')} category
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      AI Analysis: {aiSearchResults.aiAnalysis?.reasoning}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Showing all enquiries below
                    </p>
                  </div>
                ) : aiSearchResults.showAllFallback ? (
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-sm">
                      AI couldn't determine category for "{searchTerm}"
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Showing all enquiries
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-sm">
                      AI found {aiSearchResults.results.length} enquiry{aiSearchResults.results.length !== 1 ? 'ies' : ''} in {aiSearchResults.searchedCategory?.replace('-', ' ')} category
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
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
              {displayEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="block">
                  <Link 
                    to={isEnquiryOutdated(enquiry) ? '#' : `/enquiry/${enquiry.id}`} 
                    className="block"
                    onClick={(e) => {
                      if (isEnquiryOutdated(enquiry)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <Card className={`${
                      viewMode === 'grid' ? 'h-full border border-gray-200 bg-white shadow-md hover:shadow-xl hover:border-gray-300 sm:hover:border-blue-300 flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden' : 'border-2 border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 rounded-2xl sm:rounded-3xl'
                    } transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                      isEnquiryOutdated(enquiry) ? 'opacity-70 bg-gray-50 border-gray-300 grayscale' : viewMode === 'list' ? '' : 'border-l-4 border-l-green-500'
                    }`}>
                      {/* Card Header - Dark Gray */}
                      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-2.5 sm:px-4 py-1.5 sm:py-2.5 border-b border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {(enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                              <>
                                <div className={`flex items-center justify-center w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shadow-sm ${
                                  isEnquiryOutdated(enquiry) ? 'bg-gray-500' : 'bg-blue-500'
                                }`}>
                                  <Check className="h-1 w-1 sm:h-2 sm:w-2 text-white" />
                                </div>
                                <span className={`text-[8px] sm:text-[10px] font-semibold hidden sm:inline tracking-wide ${
                                  isEnquiryOutdated(enquiry) ? 'text-gray-400' : 'text-blue-300'
                                }`}>Verified</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            {!isEnquiryOutdated(enquiry) && (
                              <Badge className="text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 bg-green-500 text-white border-0 shadow-sm font-semibold">Live</Badge>
                            )}
                            {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                              <Badge className="text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 bg-red-500 text-white border-0 shadow-sm font-semibold">Urgent</Badge>
                            )}
                            {isEnquiryOutdated(enquiry) && (
                              <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 text-gray-400 border-gray-500 bg-gray-800">Expired</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {viewMode === 'list' ? (
                        <CardHeader className="p-2.5 sm:p-5 border-b border-gray-200">
                          <div className="space-y-2 sm:space-y-3.5">
                            {/* Title Row */}
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="flex items-start gap-1.5 sm:gap-2.5 flex-1 min-w-0">
                                <h3 className={`text-sm sm:text-lg lg:text-xl font-black leading-tight line-clamp-2 flex-1 text-gray-900 ${
                                  isEnquiryOutdated(enquiry) ? 'text-gray-500' : ''
                                }`}>
                                  {enquiry.title}
                                </h3>
                                {(userProfiles[enquiry.userId]?.isProfileVerified || (enquiry as any).isUserVerified || enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                                  <div className={`flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full flex-shrink-0 mt-0.5 shadow-sm ${
                                    isEnquiryOutdated(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                                  }`}>
                                    <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                                  <Badge className="text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-red-500 text-white border-0 shadow-sm font-semibold">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full inline-block mr-0.5 sm:mr-1"></span>
                                    Urgent
                                  </Badge>
                                )}
                                {isEnquiryOutdated(enquiry) && (
                                  <Badge variant="outline" className="text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-gray-500 border-gray-300 bg-gray-50">Expired</Badge>
                                )}
                                {isOwnEnquiry(enquiry) && (
                                  <Badge variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 font-semibold">Your Enquiry</Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Description */}
                            <p className="text-xs sm:text-base text-gray-700 leading-relaxed line-clamp-2">
                              {enquiry.description}
                            </p>
                            
                            {/* Key Info: Budget, Location, Category */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                              {enquiry.budget && (
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-blue-200">
                                  <span className="font-black text-blue-600 text-base sm:text-xl">₹</span>
                                  <span className="font-black text-gray-900 text-xs sm:text-base">{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                              {enquiry.location && (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                                  <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gray-100 flex-shrink-0">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                  </div>
                                  <span className="text-xs sm:text-base font-semibold">{enquiry.location}</span>
                                </div>
                              )}
                              <Badge variant="secondary" className="text-[10px] sm:text-sm px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
                                {enquiry.category.replace('-', ' ')}
                              </Badge>
                            </div>
                            
                            {/* Deadline Timer */}
                            {enquiry.deadline && !isEnquiryOutdated(enquiry) && (
                              <div className="pt-1.5 sm:pt-2 border-t border-gray-200">
                                <CountdownTimer
                                  deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                                  className="text-[10px] sm:text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      ) : (
                        <CardHeader className="p-2.5 sm:p-5">
                          <div className="space-y-2 sm:space-y-3">
                            {/* Title with Verification Badge - Mobile Optimized */}
                            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <h3 className={`text-xs sm:text-base font-black leading-tight line-clamp-1 truncate flex-1 text-gray-900 ${
                                  isEnquiryOutdated(enquiry) ? 'text-gray-500' : ''
                                }`}>
                                  {enquiry.title}
                                </h3>
                                {(userProfiles[enquiry.userId]?.isProfileVerified || (enquiry as any).isUserVerified || enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                                  <div className={`flex items-center justify-center w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex-shrink-0 shadow-sm ${
                                    isEnquiryOutdated(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                                  }`}>
                                    <Check className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                                <Badge className="text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.5 bg-red-500 text-white border-0 shadow-sm font-semibold flex-shrink-0">
                                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full inline-block mr-0.5 sm:mr-1"></span>
                                  Urgent
                                </Badge>
                              )}
                              {isEnquiryOutdated(enquiry) && (
                                <Badge variant="outline" className="text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.5 text-gray-500 border-gray-300 bg-gray-50 flex-shrink-0">Expired</Badge>
                              )}
                            </div>
                            
                            {/* Budget and Location - Grouped together */}
                            <div className="flex flex-col gap-2 sm:gap-2.5">
                              {enquiry.budget && (
                                <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-blue-200 shadow-sm">
                                  <span className="font-black text-blue-600 text-base sm:text-xl">₹</span>
                                  <span className="truncate font-black text-gray-900 text-sm sm:text-lg">{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                              {enquiry.location && (
                                <div className="flex items-center gap-2 sm:gap-2.5 px-0.5 sm:px-1">
                                  <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gray-100 flex-shrink-0">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                  </div>
                                  <span className="truncate text-[10px] sm:text-sm font-semibold text-gray-700">{enquiry.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Deadline Timer and Category - Side by side on desktop */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-gray-100">
                              {enquiry.deadline && !isEnquiryOutdated(enquiry) && (
                                <div className="flex-1">
                                  <CountdownTimer
                                    deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                                    className="text-[10px] sm:text-sm"
                                  />
                                </div>
                              )}
                              <div className={`${enquiry.deadline && !isEnquiryOutdated(enquiry) ? 'sm:ml-auto' : ''}`}>
                                <Badge variant="secondary" className="text-[9px] sm:text-xs px-2 sm:px-3.5 py-1 sm:py-2 bg-gray-100 text-gray-700 border border-gray-200 font-semibold shadow-sm">
                                  {enquiry.category.replace('-', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      )}
                      
                      <CardContent className={`${viewMode === 'list' ? 'p-2.5 sm:p-5 bg-gray-50 border-t border-gray-200' : 'flex-1 flex flex-col p-2.5 sm:p-5 justify-between'}`}>
                        {viewMode === 'list' ? (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                            {/* Left: Efficient Info Layout */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              {isOwnEnquiry(enquiry) && (
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600 bg-white rounded-md px-2 py-1 border border-gray-200 shadow-sm">
                                  <MessageSquare className="h-3 w-3 text-gray-600 flex-shrink-0" />
                                  <span className="font-semibold text-gray-700 whitespace-nowrap">{enquiry.responses || 0} responses</span>
                                </div>
                              )}
                              {enquiry.createdAt?.toDate && (
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 bg-white rounded-md px-2 py-1 border border-gray-200">
                                  <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{formatDate(enquiry.createdAt.toDate().toISOString())}</span>
                                </div>
                              )}
                              {enquiry.budget && (
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-700 bg-blue-50 rounded-md px-2 py-1 border border-blue-200">
                                  <span className="font-black text-blue-600">₹</span>
                                  <span className="font-semibold whitespace-nowrap">{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                              {enquiry.location && (
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 bg-white rounded-md px-2 py-1 border border-gray-200">
                                  <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                  <span className="truncate max-w-[120px] sm:max-w-none">{enquiry.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Right: Action Button */}
                            <div className="flex-shrink-0 ml-auto">
                              {isOwnEnquiry(enquiry) ? (
                                <Button variant="outline" size="sm" className="h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm font-semibold border-2 border-gray-300 bg-white text-gray-600" disabled>
                                  Your Enquiry
                                </Button>
                              ) : authUser ? (
                                isEnquiryOutdated(enquiry) ? (
                                  <Button variant="outline" size="sm" className="h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm font-semibold border-2 border-gray-300 bg-white text-gray-500" disabled>
                                    Expired
                                  </Button>
                                ) : (
                                  <Button 
                                    className="h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm font-bold bg-gray-800 hover:bg-gray-900 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
                                    onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                  >
                                    Sell
                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                                  </Button>
                                )
                              ) : (
                                <Link to="/signin">
                                  <Button variant="outline" className="h-8 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all duration-200 rounded-xl">
                                    Sign In to Respond
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 sm:space-y-2.5">
                            {isOwnEnquiry(enquiry) && (
                              <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <div className="flex items-center justify-center w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-white shadow-sm">
                                    <MessageSquare className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-gray-600" />
                                  </div>
                                  <span className="font-semibold text-gray-700">{enquiry.responses || 0} responses</span>
                                </div>
                                <div className="text-[9px] sm:text-xs font-semibold text-gray-500">
                                  {enquiry.createdAt?.toDate ? formatDate(enquiry.createdAt.toDate().toISOString()) : 'N/A'}
                                </div>
                              </div>
                            )}
                            
                            {isOwnEnquiry(enquiry) ? (
                              <Button variant="outline" size="sm" className="w-full h-7 sm:h-10 text-[9px] sm:text-xs font-bold border-2 border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200 rounded-lg sm:rounded-xl" disabled>
                                Your Enquiry
                              </Button>
                            ) : authUser ? (
                              isEnquiryOutdated(enquiry) ? (
                                <Button variant="outline" size="sm" className="w-full h-7 sm:h-10 text-[9px] sm:text-xs font-bold border-2 border-gray-300 bg-gray-50 text-gray-500 transition-all duration-200 rounded-lg sm:rounded-xl" disabled>
                                  Expired
                                </Button>
                              ) : (
                                <Button 
                                  className="w-full h-7 sm:h-10 text-[9px] sm:text-xs font-bold bg-gray-800 hover:bg-gray-900 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg sm:rounded-xl"
                                  onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                >
                                  Sell
                                  <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ml-1.5 sm:ml-2" />
                                </Button>
                              )
                            ) : (
                              <Link to="/signin">
                                <Button className="w-full h-7 sm:h-10 text-[9px] sm:text-xs font-bold border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all duration-200 rounded-lg sm:rounded-xl" variant="outline">
                                  Sign In to Respond
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
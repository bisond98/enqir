import { useState, useEffect } from "react";
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllCategories, setShowAllCategories] = useState(false);
  
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
        
        setEnquiries(combinedEnquiries);
        setLoading(false);
      } catch (error) {
        console.error("Error loading enquiries:", error);
        setLoading(false);
      }
    };

    loadEnquiries();
  }, []);

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

  // Handle search input with AI suggestions
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    
    if (value.trim()) {
      // Generate AI suggestions based on common search terms
      const commonTerms = [
        'car', 'vehicle', 'phone', 'laptop', 'food', 'catering', 'job', 'work',
        'house', 'apartment', 'fuel', 'oil', 'construction', 'healthcare', 'education',
        'wedding', 'event', 'waste', 'cleaning', 'clothing', 'fashion', 'electronics'
      ];
      
      const suggestions = commonTerms
        .filter(term => term.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      
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

  // Get final results - AI search completely overrides original search
  const finalResults = (() => {
    // If AI search is active, use AI results only
    if (aiSearchResults) {
      return aiSearchResults.results;
    }
    
    // If no AI search, use original filtering logic
    return enquiries.filter(enquiry => {
      const matchesSearch = !searchTerm || 
        enquiry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        enquiry.category === selectedCategory || 
        (enquiry.categories && enquiry.categories.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });
  })();

  // Alias for compatibility
  const filteredEnquiries = finalResults;

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
      <div className="flex flex-col flex-grow bg-gradient-to-br from-background to-muted/20">
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
                    paddingBottom: '0.75rem'
                  }}
                  disabled={isAISearching}
                />
                {isAISearching && (
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* AI Search Suggestions Dropdown - Mobile Compatible */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSearchChange(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 min-touch"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Categories Grid */}
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center max-w-full">
                {[
                  { value: "all", label: "All" },
                  { value: "agriculture-farming", label: "Agriculture" },
                  { value: "antiques", label: "Antiques" },
                  { value: "art", label: "Art" },
                  { value: "automobile", label: "Automobile" },
                  { value: "books-publications", label: "Books" },
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
                ].map((category, index) => (
                  <div
                    key={category.value}
                    className={`${
                      index < 6 
                        ? 'block' 
                        : showAllCategories 
                          ? 'block animate-fade-in' 
                          : 'hidden sm:block'
                    } transition-all duration-300`}
                  >
                    <Button
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="mobile-button-secondary text-xs whitespace-nowrap min-w-fit flex-shrink-0"
                    >
                      {category.label}
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Mobile: Show More/Less toggle */}
              <div className="text-center sm:hidden mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="mobile-button-outline text-xs"
                >
                  {showAllCategories ? (
                    <>
                      <X className="w-2.5 h-2.5 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Filter className="w-2.5 h-2.5 mr-1" />
                      Show More (+38)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-xl font-semibold text-foreground">
              {filteredEnquiries.length} enquiries
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
          {filteredEnquiries.length > 0 ? (
            <>
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
                : 'space-y-4'
            }`}>
              {filteredEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="block">
                  <Link to={`/enquiry/${enquiry.id}`} className="block">
                <Card className={`${
                  viewMode === 'grid' ? 'h-full border-2 border-blue-200 shadow-sm hover:shadow-md hover:border-slate-300 flex flex-col rounded-2xl' : ''
                } transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  isEnquiryOutdated(enquiry) ? 'opacity-70 bg-gray-100 border-gray-300 grayscale' : 'border-l-4 border-l-green-500'
                }`}>
                      <CardHeader className={`${viewMode === 'list' ? 'pb-2' : 'p-2 sm:p-3'}`}>
                        {viewMode === 'list' ? (
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`mobile-heading-2 line-clamp-1 truncate flex-1 ${
                                  isEnquiryOutdated(enquiry) ? 'text-gray-600' : 'text-foreground'
                                }`}>
                                  {enquiry.title}
                                </h3>
                                {(enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                                  <div className={`flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 ${
                                    isEnquiryOutdated(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                                  }`}>
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  {enquiry.category.replace('-', ' ')}
                                </Badge>
                                {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                                {isEnquiryOutdated(enquiry) && (
                                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">Expired</Badge>
                                )}
                              </div>
                            </div>
                            {isOwnEnquiry(enquiry) && (
                              <Badge variant="secondary" className="text-xs">Your Enquiry</Badge>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Title with Verification Badge - Well spaced */}
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                            <h3 className={`text-xs sm:text-sm font-semibold leading-tight line-clamp-2 flex-1 ${
                              isEnquiryOutdated(enquiry) ? 'text-gray-600' : 'text-foreground'
                            }`}>
                              {enquiry.title}
                            </h3>
                                {(enquiry.userProfileVerified || enquiry.idFrontImage || enquiry.idBackImage) && (
                                  <div className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${
                                    isEnquiryOutdated(enquiry) ? 'bg-gray-400' : 'bg-blue-500'
                                  }`}>
                                    <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                            {enquiry.isUrgent && !isEnquiryOutdated(enquiry) && (
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            )}
                            {isEnquiryOutdated(enquiry) && (
                              <span className="text-xs text-gray-500 font-medium flex-shrink-0">Expired</span>
                            )}
                            </div>
                            
                            {/* Budget and Location - Well spaced */}
                            <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-slate-700">
                              {enquiry.budget && (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">₹</span>
                                  <span className="truncate font-medium">{formatIndianCurrency(enquiry.budget)}</span>
                                </div>
                              )}
                              {enquiry.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">{enquiry.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Deadline Timer - Separate row */}
                            {enquiry.deadline && !isEnquiryOutdated(enquiry) && (
                              <div className="mt-2">
                                <CountdownTimer
                                  deadline={enquiry.deadline.toDate ? enquiry.deadline.toDate() : new Date(enquiry.deadline)}
                                  className="text-xs sm:text-sm"
                                />
                              </div>
                            )}
                            
                            {/* Category - Separate row */}
                            <div className="mt-2">
                              <span className="text-xs sm:text-sm text-muted-foreground capitalize truncate bg-slate-100 px-2 py-1 rounded inline-block">
                                {enquiry.category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className={`${viewMode === 'list' ? 'flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-6' : 'flex-1 flex flex-col p-2 sm:p-3 justify-between'}`}>
                        {viewMode === 'list' ? (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {enquiry.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                {enquiry.budget && (
                                  <span className="font-medium">₹{formatIndianCurrency(enquiry.budget)}</span>
                                )}
                                {enquiry.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{enquiry.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{enquiry.responses || 0} responses</span>
                                </div>
                              </div>
                              {isOwnEnquiry(enquiry) ? (
                                <Button variant="outline" size="sm" disabled>
                                  Your Enquiry
                                </Button>
                              ) : authUser ? (
                                isEnquiryOutdated(enquiry) ? (
                                  <Button variant="outline" size="sm" disabled>
                                    Expired
                                  </Button>
                                ) : (
                                  <Button 
                                    className="font-medium"
                                    onClick={() => window.location.href = `/respond/${enquiry.id}`}
                                  >
                                    Sell
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                  </Button>
                                )
                              ) : (
                                <Link to="/signin">
                                  <Button variant="outline">Sign In to Respond</Button>
                                </Link>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-[8px] md:text-xs text-muted-foreground mb-1 md:mb-2">
                              <div className="flex items-center gap-1 md:gap-2">
                                <div className="flex items-center gap-0.5">
                                  <MessageSquare className="h-1.5 w-1.5 md:h-3 md:w-3" />
                                  <span>{enquiry.responses || 0} responses</span>
                                </div>
                              </div>
                              <div className="text-[8px] md:text-xs">
                                {enquiry.createdAt?.toDate ? formatDate(enquiry.createdAt.toDate().toISOString()) : 'N/A'}
                              </div>
                            </div>
                            
                            {isOwnEnquiry(enquiry) ? (
                              <Button variant="outline" size="sm" className="w-full h-4 md:h-8 text-[8px] md:text-xs" disabled>
                                Your Enquiry
                              </Button>
                            ) : authUser ? (
                              <Button 
                                className="w-full h-4 md:h-8 text-[8px] md:text-xs font-medium"
                                onClick={() => window.location.href = `/respond/${enquiry.id}`}
                              >
                                Sell
                                <ArrowRight className="h-2 w-2 md:h-3 md:w-3 ml-1" />
                              </Button>
                            ) : (
                              <Link to="/signin">
                                <Button className="w-full h-4 md:h-8 text-[8px] md:text-xs font-medium" variant="outline">
                                  Sign In to Respond
                                </Button>
                              </Link>
                            )}
                          </>
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
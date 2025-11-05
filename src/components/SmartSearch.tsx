import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, TrendingUp, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  performSmartSearch, 
  getSmartSuggestions, 
  getTrendingCategories, 
  getPersonalizedRecommendations,
  type Enquiry 
} from '@/services/ai/smartSearch';
import { getAIConfig } from '@/config/ai';

interface SmartSearchProps {
  enquiries: Enquiry[];
  onSearch: (results: Enquiry[]) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  enquiries,
  onSearch,
  onClear,
  placeholder = "Search anything you need...",
  className = ""
}) => {
  // SAFETY CHECK: Validate props
  if (!enquiries || !Array.isArray(enquiries)) {
    console.warn('SmartSearch: Invalid enquiries prop, falling back to basic search');
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search enquiries..."
            className="w-full pl-10 pr-4 h-12 text-base bg-background border-border focus:border-pal-blue focus:ring-2 focus:ring-pal-blue/20 transition-all duration-200"
            readOnly
          />
        </div>
      </div>
    );
  }

  if (!onSearch || typeof onSearch !== 'function') {
    console.warn('SmartSearch: Invalid onSearch prop, component disabled');
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search temporarily unavailable..."
            className="w-full pl-10 pr-4 h-12 text-base bg-background border-border opacity-50"
            disabled
          />
        </div>
      </div>
    );
  }
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Enquiry[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiConfig = getAIConfig();

  // Debounced search for mobile performance with SAFETY FALLBACK
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // Try AI search first
        const results = performSmartSearch(searchQuery, enquiries);
        const smartSuggestions = getSmartSuggestions(searchQuery, enquiries);
        
        setSuggestions(smartSuggestions);
        onSearch(results);
      } catch (error) {
        console.warn('AI search failed, falling back to basic search:', error);
        
        // GRACEFUL DEGRADATION: Fall back to basic search
        const fallbackResults = enquiries.filter(enquiry => {
          const searchTerm = searchQuery.toLowerCase();
          return enquiry.title.toLowerCase().includes(searchTerm) ||
                 enquiry.description.toLowerCase().includes(searchTerm) ||
                 enquiry.category.toLowerCase().includes(searchTerm) ||
                 enquiry.location.toLowerCase().includes(searchTerm);
        });
        
        setSuggestions([]); // No AI suggestions, just basic results
        onSearch(fallbackResults);
      }
    }, aiConfig.search.debounceMs),
    [enquiries, onSearch, aiConfig.search.debounceMs]
  );

  // Handle search input changes
  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsSearchActive(value.length > 0);
    
    if (value.trim()) {
      debouncedSearch(value);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      onClear();
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowDropdown(false);
    const results = performSmartSearch(suggestion, enquiries);
    onSearch(results);
  };

  // Handle trending category click
  const handleTrendingClick = (category: string) => {
    setQuery(category);
    setShowDropdown(false);
    const results = enquiries.filter(e => 
      e.category.toLowerCase().includes(category.toLowerCase())
    );
    onSearch(results);
  };

  // Handle recommendation click
  const handleRecommendationClick = (enquiry: Enquiry) => {
    setQuery(enquiry.title);
    setShowDropdown(false);
    const results = [enquiry];
    onSearch(results);
  };

  // Initialize trending and recommendations
  useEffect(() => {
    if (enquiries.length > 0) {
      setTrendingCategories(getTrendingCategories(enquiries));
      setRecommendations(getPersonalizedRecommendations([], enquiries));
    }
  }, [enquiries]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on mobile
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 h-12 text-base bg-background border-border focus:border-pal-blue focus:ring-2 focus:ring-pal-blue/20 transition-all duration-200"
          onFocus={() => setShowDropdown(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInputChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Smart Dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto bg-background border border-border shadow-xl">
          <div className="p-4 space-y-4">
            
            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-pal-blue" />
                  <span className="text-sm font-medium text-foreground">Smart Suggestions</span>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Categories */}
            {trendingCategories.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-foreground">Trending Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingCategories.map((category, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-pal-blue hover:text-white transition-colors"
                      onClick={() => handleTrendingClick(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Personalized Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-foreground">Recommended for You</span>
                </div>
                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((enquiry) => (
                    <button
                      key={enquiry.id}
                      onClick={() => handleRecommendationClick(enquiry)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-pal-blue hover:bg-muted/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{enquiry.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{enquiry.category}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {query && suggestions.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">No exact matches found</p>
                <p className="text-xs text-muted-foreground">Try different keywords or browse categories</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// Debounce utility for mobile performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SmartSearch;

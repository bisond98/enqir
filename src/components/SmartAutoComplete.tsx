import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, TrendingUp, MapPin, DollarSign, Tag, Type, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  getSmartTitleSuggestions, 
  getSmartCategorySuggestions, 
  getSmartBudgetSuggestions,
  getSmartLocationSuggestions,
  getDescriptionTemplates,
  type Enquiry 
} from '@/services/ai/smartAutoComplete';
import { getAIConfig } from '@/config/ai';

interface SmartAutoCompleteProps {
  field: 'title' | 'category' | 'budget' | 'location' | 'description';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  existingEnquiries?: Enquiry[];
  userHistory?: Enquiry[];
}

const SmartAutoComplete: React.FC<SmartAutoCompleteProps> = ({
  field,
  value,
  onChange,
  placeholder = "",
  label = "",
  className = "",
  existingEnquiries = [],
  userHistory = []
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedData, setRelatedData] = useState<any>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const aiConfig = getAIConfig();

  // Debounced search for performance
  const debouncedSearch = useCallback(
    debounce(async (searchValue: string) => {
      if (searchValue.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoading(true);
        let results: string[] = [];
        let related: any = null;

        switch (field) {
          case 'title':
            results = getSmartTitleSuggestions(searchValue, existingEnquiries, userHistory);
            break;
          case 'category':
            results = getSmartCategorySuggestions(searchValue, existingEnquiries);
            break;
          case 'budget':
            results = getSmartBudgetSuggestions(searchValue, existingEnquiries);
            break;
          case 'location':
            results = getSmartLocationSuggestions(searchValue, existingEnquiries);
            break;
          case 'description':
            results = getDescriptionTemplates(searchValue, field);
            break;
        }

        setSuggestions(results.slice(0, 8)); // Increased limit for comprehensive coverage
        setRelatedData(related);
      } catch (error) {
        console.warn('Smart auto-complete failed, falling back to basic search:', error);
        // Graceful degradation - basic filtering
        const basicResults = existingEnquiries
          .filter(e => {
            const searchTerm = searchValue.toLowerCase();
            switch (field) {
              case 'title':
                return e.title.toLowerCase().includes(searchTerm);
              case 'category':
                return e.category.toLowerCase().includes(searchTerm);
              case 'location':
                return e.location.toLowerCase().includes(searchTerm);
              default:
                return false;
            }
          })
          .map(e => {
            switch (field) {
              case 'title': return e.title;
              case 'category': return e.category;
              case 'location': return e.location;
              default: return '';
            }
          })
          .filter(Boolean)
          .slice(0, 5);
        
        setSuggestions(basicResults);
      } finally {
        setIsLoading(false);
      }
    }, aiConfig.autocomplete.debounceMs),
    [field, existingEnquiries, userHistory, aiConfig.autocomplete.debounceMs]
  );

  // Handle input changes
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (inputValue.trim()) {
      debouncedSearch(inputValue);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get field-specific icon and styling
  const getFieldConfig = () => {
    switch (field) {
      case 'title':
        return { icon: Type, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'category':
        return { icon: Tag, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'budget':
        return { icon: IndianRupee, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
      case 'location':
        return { icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'description':
        return { icon: Sparkles, color: 'text-pink-600', bgColor: 'bg-pink-50' };
      default:
        return { icon: Search, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const fieldConfig = getFieldConfig();
  const IconComponent = fieldConfig.icon;

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldConfig.color}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 h-11 text-sm border-border focus:border-pal-blue focus:ring-2 focus:ring-pal-blue/20 transition-all duration-200"
          onFocus={() => value.trim() && setShowDropdown(true)}
        />
        
        {/* AI Indicator */}
        {value.trim() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-pal-blue animate-pulse' : 'bg-green-500'}`} />
          </div>
        )}
      </div>

      {/* Smart Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto bg-background border border-border shadow-xl">
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Sparkles className="h-4 w-4 text-pal-blue" />
              <span className="text-sm font-medium text-foreground">Smart Suggestions</span>
              <Badge variant="secondary" className="text-xs">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Badge>
            </div>

            {/* Suggestions List */}
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground hover:text-pal-blue"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${fieldConfig.color.replace('text-', 'bg-')}`} />
                    <span className="truncate">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            {field === 'description' && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Popular templates</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Urgent', 'Flexible', 'Professional', 'Casual'].map((style) => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(`${style} style description`)}
                      className="text-xs h-6 px-2 hover:bg-pal-blue hover:text-white transition-colors"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No Suggestions Message */}
      {showDropdown && value.trim() && suggestions.length === 0 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-3 bg-background border border-border shadow-xl">
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">No suggestions found</p>
            <p className="text-xs text-muted-foreground">Try different keywords</p>
          </div>
        </Card>
      )}
    </div>
  );
};

// Debounce utility for performance
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

export default SmartAutoComplete;

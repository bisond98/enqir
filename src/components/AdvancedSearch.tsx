import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, MapPin, Calendar, IndianRupee, Clock } from "lucide-react";

interface SearchFilters {
  category: string;
  location: string;
  priceMin: number;
  priceMax: number;
  dateRange: string;
  urgentOnly: boolean;
  hasDeadline: boolean;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (query: string) => void;
}

export const AdvancedSearch = ({ onFiltersChange, onSearch }: AdvancedSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: "all",
    location: "all",
    priceMin: 0,
    priceMax: 100000,
    dateRange: "all",
    urgentOnly: false,
    hasDeadline: false
  });
  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "antiques", label: "Antiques" },
    { value: "vintage-cars", label: "Vintage Cars" },
    { value: "collectibles", label: "Collectibles" },
    { value: "services", label: "Services" },
    { value: "real-estate", label: "Real Estate" },
    { value: "art-artifacts", label: "Art & Artifacts" },
    { value: "rare-books", label: "Rare Books" },
    { value: "electronics", label: "Electronics" },
    { value: "jewelry", label: "Jewelry" }
  ];
  
  const locations = [
    { value: "all", label: "All Locations" },
    { value: "mumbai", label: "Mumbai" },
    { value: "delhi", label: "Delhi" },
    { value: "bangalore", label: "Bangalore" },
    { value: "chennai", label: "Chennai" },
    { value: "kolkata", label: "Kolkata" },
    { value: "pune", label: "Pune" },
    { value: "hyderabad", label: "Hyderabad" }
  ];
  
  const dateRanges = [
    { value: "all", label: "Any Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "3months", label: "Last 3 Months" }
  ];
  
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
    
    // Update active filters for display
    updateActiveFilters(newFilters);
  };
  
  const updateActiveFilters = (currentFilters: SearchFilters) => {
    const active: string[] = [];
    
    if (currentFilters.category !== "all") {
      const category = categories.find(c => c.value === currentFilters.category);
      if (category) active.push(category.label);
    }
    
    if (currentFilters.location !== "all") {
      const location = locations.find(l => l.value === currentFilters.location);
      if (location) active.push(location.label);
    }
    
    if (currentFilters.priceMin > 0 || currentFilters.priceMax < 100000) {
      active.push(`₹${currentFilters.priceMin.toLocaleString()} - ₹${currentFilters.priceMax.toLocaleString()}`);
    }
    
    if (currentFilters.dateRange !== "all") {
      const range = dateRanges.find(d => d.value === currentFilters.dateRange);
      if (range) active.push(range.label);
    }
    
    if (currentFilters.urgentOnly) active.push("Urgent Only");
    if (currentFilters.hasDeadline) active.push("Has Deadline");
    
    setActiveFilters(active);
  };
  
  const clearAllFilters = () => {
    const defaultFilters: SearchFilters = {
      category: "all",
      location: "all",
      priceMin: 0,
      priceMax: 100000,
      dateRange: "all",
      urgentOnly: false,
      hasDeadline: false
    };
    setFilters(defaultFilters);
    setActiveFilters([]);
    onFiltersChange(defaultFilters);
  };
  
  const handleSearch = () => {
    onSearch(searchQuery);
  };
  
  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search enquiries, products, services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-24 h-12 text-base"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={handleSearch} size="sm" className="bg-pal-blue hover:bg-pal-blue-dark">
            Search
          </Button>
        </div>
      </div>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-6 space-y-6 border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Location
              </label>
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Posted Date
              </label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Price Range */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground flex items-center">
              <IndianRupee className="h-4 w-4 mr-1" />
              Price Range
            </label>
            <div className="px-4">
              <Slider
                value={[filters.priceMin, filters.priceMax]}
                onValueChange={([min, max]) => {
                  handleFilterChange('priceMin', min);
                  handleFilterChange('priceMax', max);
                }}
                min={0}
                max={100000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>₹{filters.priceMin.toLocaleString()}</span>
                <span>₹{filters.priceMax.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.urgentOnly ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('urgentOnly', !filters.urgentOnly)}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Urgent Only
              </Button>
              <Button
                variant={filters.hasDeadline ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('hasDeadline', !filters.hasDeadline)}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Has Deadline
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
            <Button onClick={() => setShowAdvanced(false)} className="bg-pal-blue hover:bg-pal-blue-dark">
              Apply Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
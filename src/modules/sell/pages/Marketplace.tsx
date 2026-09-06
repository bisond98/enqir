import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SellShell from '../components/SellShell';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import { listMarketplace } from '../services/sellDb';
import type { SellListing } from '../types';
import { MapPin, Tag, IndianRupee, ImageOff, Search, SlidersHorizontal, X, Map, LayoutGrid, List, CheckCircle, Smartphone, Laptop, Sofa, Home, Shirt, Car, Wrench, Sprout, Palette, Gem, Baby, Briefcase, BookOpen, Music, Gamepad2, Utensils, Dumbbell, PawPrint, Camera, Building2, Scale, Megaphone, Recycle, Stethoscope, Shield, Gift, Zap, Package, Truck, Plane, ShoppingBag, Hammer, Sparkles, Heart, User, Bookmark } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import type { MapLocationAddress } from '@/types/mapLocation';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'electronics': Zap,
  'mobiles': Smartphone,
  'car': Car,
  'bike': Zap,
  'laptops': Laptop,
  'furniture': Sofa,
  'home': Home,
  'fashion': Shirt,
  'vehicles': Car,
  'services': Wrench,
  'agriculture-farming': Sprout,
  'antiques': Gem,
  'art': Palette,
  'baby-kids': Baby,
  'bags-luggage': ShoppingBag,
  'beauty-products': Sparkles,
  'bicycles': Zap,
  'books-publications': BookOpen,
  'business': Briefcase,
  'childcare-family': Baby,
  'collectibles': Gem,
  'construction-renovation': Hammer,
  'education-training': BookOpen,
  'entertainment-media': Music,
  'events-entertainment': Music,
  'food-beverage': Utensils,
  'gaming-recreation': Gamepad2,
  'government-public': Shield,
  'health-beauty': Stethoscope,
  'insurance-services': Shield,
  'jobs': Briefcase,
  'jewelry-accessories': Gem,
  'legal-financial': Scale,
  'marketing-advertising': Megaphone,
  'memorabilia': Gift,
  'musical-instruments': Music,
  'musical-accessories': Music,
  'musical-services': Music,
  'non-profit-charity': Heart,
  'office-supplies': Briefcase,
  'personal': User,
  'pets': PawPrint,
  'photography-cameras': Camera,
  'fitness-gym-equipment': Dumbbell,
  'garden-outdoor': Sprout,
  'kitchen-dining': Utensils,
  'raw-materials-industrial': Package,
  'real-estate': Building2,
  'real-estate-services': Building2,
  'renewable-energy': Zap,
  'repair-services': Wrench,
  'cleaning-services': Sparkles,
  'security-safety': Shield,
  'sneakers': Shirt,
  'souvenir': Gift,
  'sports-outdoor': Dumbbell,
  'thrift': ShoppingBag,
  'technology': Laptop,
  'tools-equipment': Wrench,
  'transportation-logistics': Truck,
  'travel-tourism': Plane,
  'tutoring-lessons': BookOpen,
  'vintage': Gem,
  'waste-management': Recycle,
  'wedding-events': Heart,
  'medical-equipment': Stethoscope,
  'appliances': Sofa,
  'other': Tag,
};

function formatPrice(l: SellListing) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (l.priceType === 'range') return `₹${fmt(l.priceMax ?? l.priceMin ?? 0)}`;
  return l.price ? `₹${fmt(l.price)}` : '₹—';
}

function formatPostedDate(dateString: any): string {
  try {
    let date: Date;
    if (dateString?.toDate && typeof dateString.toDate === 'function') {
      date = dateString.toDate();
    } else if (dateString?.seconds !== undefined) {
      date = new Date(dateString.seconds * 1000 + (dateString.nanoseconds || 0) / 1000000);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string' || typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return '';
    }
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [trustBadgeOnly, setTrustBadgeOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [shuffledListings, setShuffledListings] = useState<SellListing[]>([]);
  const { user } = useAuth();
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  // Load user's saved listing IDs (profiles.savedListings - same store as the listing page save)
  useEffect(() => {
    if (!user?.uid) { setSavedListingIds(new Set()); return; }
    let cancelled = false;
    getDoc(doc(db, 'profiles', user.uid)).then(snap => {
      if (!cancelled) setSavedListingIds(new Set((snap.data()?.savedListings || []) as string[]));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid]);

  const toggleSaveListing = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      sessionStorage.setItem('returnAfterSignIn', window.location.pathname);
      navigate('/signin');
      return;
    }
    const isSaved = savedListingIds.has(listingId);
    setSavedListingIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(listingId); else next.add(listingId);
      return next;
    });
    try {
      await updateDoc(doc(db, 'profiles', user.uid), isSaved
        ? { savedListings: arrayRemove(listingId) }
        : { savedListings: arrayUnion(listingId) }
      );
    } catch (err) {
      console.error('Failed to update saved listings:', err);
      setSavedListingIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(listingId); else next.delete(listingId);
        return next;
      });
    }
  };

  // Scroll to top on page change
  const prevPage = useRef(page);
  useEffect(() => {
    if (page !== prevPage.current) {
      prevPage.current = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  // Auto-shuffle listings every 5 minutes when no filters/search
  const noFiltersActive = search.trim() === '' && category === 'all' && location === 'all';

  // Seller profiles for trust badge
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (listings.length === 0) return;
    const uniqueIds = Array.from(new Set(listings.map(l => l.sellerId).filter(Boolean)));
    const fetchProfiles = async () => {
      const profiles: Record<string, any> = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'userProfiles', id));
          if (snap.exists()) profiles[id] = snap.data();
        } catch {}
      }));
      setSellerProfiles(profiles);
    };
    fetchProfiles();
  }, [listings]);

  // Location popup
  const [locPopupOpen, setLocPopupOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const locPopupRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMarketplace({
        search,
        category: category === 'all' ? undefined : category,
        location: location === 'all' ? undefined : location,
      });
      setListings(data);
    } catch (err: any) {
      console.error('Marketplace load error:', err);
      setError(err?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [search, category, location]);

  useEffect(() => {
    setPage(0);
    load();
  }, [search, category, location]);

  // Shuffle effect: every 5 minutes when no filters/search active
  useEffect(() => {
    if (!noFiltersActive || listings.length <= 1) {
      setShuffledListings(listings);
      return;
    }
    const shuffle = (arr: SellListing[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    setShuffledListings(shuffle(listings));
    const timer = setInterval(() => setShuffledListings(shuffle(listings)), 300000);
    return () => clearInterval(timer);
  }, [listings, noFiltersActive]);

  // Auto-detect category from search term
  const detectedCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return null;
    return SELL_CATEGORIES.find(c => c.label.toLowerCase().includes(q) || q.includes(c.label.toLowerCase()))?.value ?? null;
  }, [search]);

  // Suggested category badge shown when search matches a category but filter isn't set
  const showCategorySuggestion = detectedCategory && category !== detectedCategory;

  const canSearch = search.trim().length === 0 || search.trim().length >= 2;

  // Effective price of a listing used for budget filtering (range → its max number).
  const listingPrice = (l: SellListing): number => {
    if (l.priceType === 'range') return l.priceMax ?? l.priceMin ?? l.price ?? 0;
    return l.price ?? l.priceMin ?? l.priceMax ?? 0;
  };

  const minVal = priceMin ? Math.max(0, parseFloat(priceMin.replace(/[^0-9]/g, ''))) : null;
  const maxVal = priceMax ? Math.max(0, parseFloat(priceMax.replace(/[^0-9]/g, ''))) : null;
  const budgetActive = minVal !== null || maxVal !== null;
  const hasFilters = category !== 'all' || location !== 'all' || budgetActive || trustBadgeOnly;

  // Show Indian-style thousand separators (e.g. 1,00,000) while typing.
  const toInr = (raw: string): string => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('en-IN');
  };



  // Choose on map
  const handleMapSelect = useCallback((_lat: number, _lng: number, address: MapLocationAddress) => {
    const city = address.city || address.state || 'Other';
    setLocation(city);
    setLocSearch(city);
    setMapPickerOpen(false);
    setLocPopupOpen(false);
    load();
  }, [load]);

  // Close popup on outside click
  useEffect(() => {
    if (!locPopupOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (locPopupRef.current && !locPopupRef.current.contains(e.target as Node)) {
        setLocPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [locPopupOpen]);

  const filteredLocations = useMemo(() => {
    if (!locSearch) return SELL_LOCATIONS.filter(l => l !== 'Other');
    return SELL_LOCATIONS.filter(l => l !== 'Other' && l.toLowerCase().includes(locSearch.toLowerCase()));
  }, [locSearch]);

  const activeLocationLabel = location === 'all' ? 'Locations' : location;

  // Apply budget (min/max) and trust-badge filters on top of the fetched results.
  const budgetFilteredListings = useMemo(() => {
    const base = noFiltersActive ? shuffledListings : listings;
    if (!budgetActive && !trustBadgeOnly) return base;
    return base.filter((l) => {
      if (budgetActive) {
        const p = listingPrice(l);
        if (minVal !== null && p < minVal) return false;
        if (maxVal !== null && p > maxVal) return false;
      }
      if (trustBadgeOnly && !sellerProfiles[l.sellerId]?.isProfileVerified) return false;
      return true;
    });
  }, [noFiltersActive, shuffledListings, listings, budgetActive, trustBadgeOnly, minVal, maxVal, sellerProfiles]);

  const displayListings = budgetFilteredListings;
  const perPage = viewMode === 'grid' ? 12 : 10;
  const totalPages = Math.ceil(displayListings.length / perPage);
  const pagedListings = displayListings.slice(page * perPage, (page + 1) * perPage);

  // Keep the current page in range when filters shrink the result set.
  useEffect(() => {
    if (page > Math.max(0, totalPages - 1)) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  return (
    <SellShell title="Marketplace" filterOpen={filterOpen} onToggleFilter={() => setFilterOpen(v => !v)}>
      <MapLocationPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        onSelect={handleMapSelect}
        title="Choose location on map"
      />

      {/* Search & Filters */}
      <div className="space-y-3 mb-8">
        {/* Filter Panel: Adjust budget + trust badge — opens from the header Filter toggle */}
        {filterOpen && (
          <div className="border-[1.5px] border-black !rounded-2xl bg-gradient-to-br from-white to-slate-50/50 !shadow-[0_8px_0_0_rgba(0,0,0,0.15)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-black tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Adjust budget
              </h3>
              <button onClick={() => setFilterOpen(false)} className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-black transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Min–Max budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">Min (₹)</label>
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/50 z-10" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={toInr(priceMin)}
                    onChange={(e) => setPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 5,000"
                    style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem' }}
                    className="w-full h-10 sm:h-11 text-sm font-bold border-[1.5px] border-black !rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:outline-none focus:border-[4px] placeholder:text-gray-400 placeholder:font-normal placeholder:text-[10px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 block">Max (₹)</label>
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/50 z-10" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={toInr(priceMax)}
                    onChange={(e) => setPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 50,000"
                    style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem' }}
                    className="w-full h-10 sm:h-11 text-sm font-bold border-[1.5px] border-black !rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:outline-none focus:border-[4px] placeholder:text-gray-400 placeholder:font-normal placeholder:text-[10px]"
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-gray-500 -mt-2">Applies on top of your current search, category, and tags.</p>

            {/* Trust badge toggle */}
            <div className={`flex items-center justify-between gap-3 py-2 px-3 border-t border-black/10 rounded-xl transition-colors ${trustBadgeOnly ? 'bg-blue-50' : ''}`}>
              <button
                type="button"
                onClick={() => setTrustBadgeOnly(v => !v)}
                className="text-left flex-1 cursor-pointer"
              >
                <p className={`text-xs font-black ${trustBadgeOnly ? 'text-blue-700' : 'text-black'}`}>Trust badge sellers only</p>
                <p className="text-[9px] text-gray-500">Show only verified sellers</p>
              </button>
              <Switch checked={trustBadgeOnly} onCheckedChange={setTrustBadgeOnly} thumbClassName="data-[state=unchecked]:!bg-black" className="flex-shrink-0 !h-6 !w-11 !min-h-0 !min-w-0 !border-2 !border-black data-[state=checked]:!bg-blue-600" />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setPriceMin(''); setPriceMax(''); setTrustBadgeOnly(false); }}
                className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-bold text-black bg-white border border-black !rounded-xl hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl border border-black !shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_4px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:!translate-y-[2px] transition-all duration-200"
              >
                <Search className="h-4 w-4 mr-1.5" />Show results
              </button>
            </div>
          </div>
        )}

        {/* Filter Row: Categories + Location — equal size on mobile */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={category} onValueChange={(v) => { setCategory(v); }}>
              <SelectTrigger className="relative h-10 sm:h-12 text-xs sm:text-sm border-[1.5px] border-black !rounded-2xl focus:!border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_8px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 overflow-hidden font-bold">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-white" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="!rounded-2xl !border-black !shadow-[0_4px_0_0_rgba(0,0,0,0.2)] bg-white">
                <SelectItem value="all" className="!rounded-xl !font-black text-black focus:bg-black/5 focus:text-black mb-0.5 !shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.15)] !transition-all !duration-150">All categories</SelectItem>
                {SELL_CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICONS[c.value] || Tag;
                  return (
                    <SelectItem key={c.value} value={c.value} className="!rounded-xl !font-black text-black focus:bg-black/5 focus:text-black mb-0.5 !shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.15)] !transition-all !duration-150">
                      <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-black" /> {c.label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <button
              onClick={() => setLocPopupOpen(!locPopupOpen)}
              className="relative w-full h-10 sm:h-12 flex items-center text-xs sm:text-sm border-[1.5px] border-black !rounded-2xl !bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_8px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 px-3 gap-1.5 overflow-hidden"
            >
              <MapPin className="h-3.5 w-3.5 text-white flex-shrink-0" />
              <span className="flex-1 text-center truncate text-white font-bold">
                {activeLocationLabel}
              </span>
            </button>

            {/* Location Popup */}
            {locPopupOpen && (
              <div
                ref={locPopupRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 top-full mt-1 right-0 w-72 bg-white border-[1.5px] border-black rounded-xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] overflow-hidden"
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={locSearch}
                      onChange={(e) => setLocSearch(e.target.value)}
                      placeholder="Search location…"
                      className="w-full h-9 text-xs bg-gray-50 border-[1.5px] border-black rounded-xl pl-8 pr-3 outline-none focus:outline-none focus:border-[4px] focus:border-black focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none focus:shadow-none transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Choose on Map */}
                <div className="p-3 border-b border-gray-100">
                  <button
                    onClick={() => { setMapPickerOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-black bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Map className="h-4 w-4" />
                    Choose on map
                  </button>
                </div>

                {/* Search Suggestions */}
                {locSearch && (
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => { setLocation(loc); setLocSearch(loc); setLocPopupOpen(false); load(); }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between ${location === loc ? 'font-bold bg-gray-50' : ''}`}
                      >
                        <span>{loc}</span>
                      </button>
                    ))}
                    {!SELL_LOCATIONS.some(l => l.toLowerCase() === locSearch.toLowerCase()) && (
                      <button
                        onClick={() => { setLocation(locSearch); setLocPopupOpen(false); load(); }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors text-gray-500 italic"
                      >
                        Use "{locSearch}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder="Search listings…"
            className="relative pl-10 pr-10 h-10 sm:h-12 text-xs sm:text-sm bg-gradient-to-br from-white to-slate-50/50 border-[1.5px] border-black !rounded-2xl focus:!border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !shadow-[0_8px_0_0_rgba(0,0,0,0.15)] hover:!shadow-[0_8px_0_0_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.15)] active:!translate-y-[4px] !transition-all !duration-200 placeholder:text-black placeholder:text-[10px] font-bold overflow-hidden"
          />
          {search && (
            <button onClick={() => { setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Auto-detected category suggestion */}
        {showCategorySuggestion && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Did you mean:</span>
            <button
              onClick={() => { setCategory(detectedCategory!); }}
              className="text-[10px] font-bold text-black bg-gray-100 border border-black/20 rounded-full px-2.5 py-1 hover:bg-gray-200 transition-colors"
            >
              {SELL_CATEGORIES.find(c => c.value === detectedCategory)?.label}
            </button>
          </div>
        )}

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => { setCategory('all'); setLocation('all'); setLocSearch(''); setSearch(''); setPriceMin(''); setPriceMax(''); setTrustBadgeOnly(false); }}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-white bg-[#7a1c1c] border border-black/60 rounded-full hover:bg-[#8f2323] transition-colors flex-shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] active:translate-y-[2px]"
            >
              <X className="h-3 w-3" />Clear filters
            </button>
          )}
          {/* View Toggle */}
          <div className="flex h-10 sm:h-12 border-[1.5px] border-black !rounded-2xl overflow-hidden !shadow-[0_8px_0_0_rgba(0,0,0,0.15)] flex-shrink-0">
            <button
              onClick={() => { setViewMode('list'); setPage(0); }}
              className={`h-full px-3 flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              <List className="h-3 w-3" />
            </button>
            <button
              onClick={() => { setViewMode('grid'); setPage(0); }}
              className={`h-full px-3 flex items-center justify-center transition-all border-l-2 border-black ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
          </div>
          <button
            className="relative flex-1 h-10 sm:h-12 !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl border-[1.5px] border-black !font-black text-xs sm:text-sm !shadow-[0_8px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
            onClick={() => load()}
            disabled={!canSearch || loading}
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
            <span className="relative z-10 flex items-center justify-center"><Search className="h-4 w-4 mr-1.5" />Search</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">Searching…</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-10 border-2 border-dashed border-red-200 rounded-2xl">
            <p className="text-sm font-bold text-red-500 mb-2">{error}</p>
            <Button variant="outline" onClick={() => load()} className="border-black text-xs">Retry</Button>
          </div>
        )}

        {!loading && !error && displayListings.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-2xl">
            <ImageOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-1">No listings found.</p>
            <p className="text-xs text-gray-400">Try a different search or filter.</p>
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && !error && viewMode === 'list' && pagedListings.map((l) => (
          <div key={l.id} onClick={(e) => { if (!e.defaultPrevented) navigate(`/sell/listing/${l.id}`); }} className="block border border-black/25 rounded-2xl hover:border-black hover:shadow-md transition-all bg-white shadow-[0_2px_0_0_rgba(0,0,0,0.05)] cursor-pointer">
            <div className="flex gap-3 p-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {l.images?.[0] ? (
                  <img src={l.images[0]} alt="" loading="lazy" decoding="async" className="w-20 h-20 sm:w-24 sm:h-24 !rounded-2xl object-cover !border-[0.5px] !border-black/20 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 !rounded-2xl bg-gray-100 flex items-center justify-center !border-[0.5px] !border-black/20 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
                    <span className="text-[10px] font-bold text-gray-400">No Image</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => toggleSaveListing(e, l.id)}
                    aria-label={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                    title={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                    className="p-0.5 rounded-lg transition-all active:scale-95 hover:bg-gray-100"
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${savedListingIds.has(l.id) ? 'fill-black text-black' : 'text-gray-500 hover:text-black'}`} />
                  </button>
                  <ShareButton listing={l} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-black text-sm truncate flex items-center gap-1">
                    {l.title}
                    {sellerProfiles[l.sellerId]?.isProfileVerified && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"><CheckCircle className="h-2.5 w-2.5 text-white" /></span>
                    )}
                  </h3>
                  {l.price != null && (
                    <span className="relative text-base sm:text-lg font-black text-white bg-black border border-black !rounded-2xl px-4 py-2 flex-shrink-0 !shadow-[0_8px_0_0_rgba(0,0,0,0.15)] -mt-1">
                      {formatPrice(l)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{l.description && l.description.length > 20 ? l.description.slice(0, 20) + '......' : l.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {l.condition && (
                    <span className="text-[9px] font-black text-black bg-white border border-black !rounded-2xl px-2.5 py-1 flex-shrink-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)] uppercase">
                      {l.condition}
                    </span>
                  )}
                  <span className="text-[9px] font-black text-black bg-white border border-black !rounded-2xl px-2.5 py-1 flex-shrink-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)] flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5 text-red-500" />{l.location}
                  </span>
                  {l.details?.year && (
                    <span className="text-[9px] font-black text-black bg-white border border-black !rounded-2xl px-2.5 py-1 flex-shrink-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
                      {l.details.year}
                    </span>
                  )}
                  {l.details?.kmsDriven ? (
                    <span className="text-[9px] font-black text-black bg-white border border-black !rounded-2xl px-2.5 py-1 flex-shrink-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
                      {l.details.kmsDriven} km
                    </span>
                  ) : !l.details?.year && formatPostedDate(l.createdAt) && (
                    <span className="text-[9px] font-black text-black bg-white border border-black !rounded-2xl px-2.5 py-1 flex-shrink-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
                      Posted on {formatPostedDate(l.createdAt)}
                    </span>
                  )}
                </div>
                {l.tags?.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {l.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[8px] text-gray-400 flex items-center gap-0.5">
                        <Tag className="h-2 w-2" />{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* GRID VIEW */}
        {!loading && !error && viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pagedListings.map((l) => (
              <div key={l.id} onClick={(e) => { if (!e.defaultPrevented) navigate(`/sell/listing/${l.id}`); }} className="relative block border border-black/25 rounded-2xl hover:border-black hover:shadow-md transition-all bg-white shadow-[0_2px_0_0_rgba(0,0,0,0.05)] cursor-pointer overflow-visible">
                {formatPrice(l).length >= 9 ? (
                  /* Wide price chip would overlap a top-left save — stack save above share instead */
                  <div className="absolute bottom-1 right-1 z-10 flex flex-col items-center gap-1">
                    <button
                      onClick={(e) => toggleSaveListing(e, l.id)}
                      aria-label={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                      title={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md active:scale-95 transition-all"
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${savedListingIds.has(l.id) ? 'fill-black text-black' : 'text-gray-600'}`} />
                    </button>
                    <span className="translate-x-1"><ShareButton listing={l} /></span>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-1 left-1 z-10">
                      <button
                        onClick={(e) => toggleSaveListing(e, l.id)}
                        aria-label={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                        title={savedListingIds.has(l.id) ? 'Remove from saved' : 'Save listing'}
                        className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md active:scale-95 transition-all"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${savedListingIds.has(l.id) ? 'fill-black text-black' : 'text-gray-600'}`} />
                      </button>
                    </div>
                    <div className="absolute bottom-1 right-1 z-10">
                      <span className="translate-x-1"><ShareButton listing={l} /></span>
                    </div>
                  </>
                )}
                <div className="p-2.5 pb-0">
                {l.images?.[0] ? (
                  <img src={l.images[0]} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover !rounded-2xl !border-[0.5px] !border-black/20 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]" />
                ) : (
                  <div className="w-full aspect-square !rounded-2xl bg-gray-100 flex items-center justify-center !border-[0.5px] !border-black/20 !shadow-[0_6px_0_0_rgba(0,0,0,0.15)]">
                    <span className="text-xs font-bold text-gray-400">No Image</span>
                  </div>
                )}
                </div>
                {l.price != null && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="text-base sm:text-lg font-black text-white bg-black border border-black !rounded-2xl px-4 py-2 !shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
                      {formatPrice(l)}
                    </span>
                  </div>
                )}
                <div className="p-2.5">
                  <div className="flex items-start gap-1">
                    <h3 className="font-black text-black text-xs truncate flex-1 flex items-center gap-1">
                      {l.title}
                      {sellerProfiles[l.sellerId]?.isProfileVerified && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0"><CheckCircle className="h-2 w-2 text-white" /></span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {l.condition && (
                      <span className="text-[8px] font-black text-black bg-white border border-black !rounded-2xl px-2 py-0.5 flex-shrink-0 !shadow-[0_5px_0_0_rgba(0,0,0,0.15)] uppercase">
                        {l.condition}
                      </span>
                    )}
                    <span className="text-[8px] font-black text-black bg-white border border-black !rounded-2xl px-1.5 py-0.5 flex-shrink-0 !shadow-[0_5px_0_0_rgba(0,0,0,0.15)] inline-flex items-center gap-0.5">
                      <MapPin className="h-1.5 w-1.5 text-red-500" />{l.location}
                    </span>

                  </div>
                  {l.details?.year && (
                    <span className="text-[8px] font-black text-black bg-white border border-black !rounded-2xl px-2 py-0.5 inline-flex items-center gap-0.5 mt-1.5">
                      {l.details.year}
                    </span>
                  )}
                  {l.details?.kmsDriven ? (
                    <span className="text-[8px] font-black text-black bg-white border border-black !rounded-2xl px-2 py-0.5 inline-flex items-center gap-0.5 mt-1.5">
                      {l.details.kmsDriven} km
                    </span>
                  ) : !l.details?.year && formatPostedDate(l.createdAt) && (
                    <span className="text-[8px] font-black text-black bg-white border border-black !rounded-2xl px-2 py-0.5 inline-flex items-center gap-0.5 mt-1.5">
                      Posted on {formatPostedDate(l.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Previous / Next buttons */}
        {!loading && !error && displayListings.length > perPage && (
          <div className="flex justify-center gap-3 pt-2 pb-4">
            {page > 0 && (
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="min-w-[130px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl px-5 py-2.5 border border-black !shadow-[0_8px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200"
              >
                ← Previous
              </button>
            )}
            {page < totalPages - 1 && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="min-w-[130px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl px-5 py-2.5 border border-black !shadow-[0_8px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(37,99,235,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </SellShell>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import { listMarketplace } from '../services/sellDb';
import type { SellListing } from '../types';
import { MapPin, Tag, IndianRupee, ImageOff, Search, SlidersHorizontal, X, Map } from 'lucide-react';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import type { MapLocationAddress } from '@/types/mapLocation';

function formatPrice(l: SellListing) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (l.priceType === 'range') return `₹${fmt(l.priceMin ?? 0)} - ₹${fmt(l.priceMax ?? 0)}`;
  return l.price ? `₹${fmt(l.price)}` : '₹—';
}

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    load();
  }, []);

  const canSearch = useMemo(() => search.trim().length === 0 || search.trim().length >= 2, [search]);
  const hasFilters = category !== 'all' || location !== 'all';



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

  return (
    <SellShell title="Marketplace">
      <MapLocationPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        onSelect={handleMapSelect}
        title="Choose location on map"
      />

      {/* Search & Filters */}
      <div className="space-y-3 mb-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder="Search listings…"
            className="pl-10 pr-10 h-10 sm:h-12 text-xs sm:text-sm bg-gradient-to-br from-white to-slate-50/50 border-2 border-black rounded-xl focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all placeholder:text-slate-400 placeholder:text-[10px]"
          />
          {search && (
            <button onClick={() => { setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={category} onValueChange={(v) => { setCategory(v); }}>
              <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black rounded-xl focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {SELL_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <button
              onClick={() => setLocPopupOpen(!locPopupOpen)}
              className={`w-full h-10 sm:h-12 flex items-center text-xs sm:text-sm border-2 border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all px-3 gap-1.5`}
            >
              <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
              <span className={`flex-1 text-left truncate ${location !== 'all' ? 'text-black font-bold' : 'text-gray-400'}`}>
                {activeLocationLabel}
              </span>
            </button>

            {/* Location Popup */}
            {locPopupOpen && (
              <div
                ref={locPopupRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 top-full mt-1 right-0 w-72 bg-white border-2 border-black rounded-xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] overflow-hidden"
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
                      className="w-full h-9 text-xs bg-gray-50 border-2 border-black rounded-xl pl-8 pr-3 outline-none focus:outline-none focus:border-[4px] focus:border-black focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none focus:shadow-none transition-all duration-300"
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
                        {userCoords && CITY_COORDS[loc] && (
                          <span className="text-[10px] text-gray-400">
                            {Math.round(haversineDistance(userCoords[0], userCoords[1], CITY_COORDS[loc][0], CITY_COORDS[loc][1]))} km
                          </span>
                        )}
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

        {/* Active Filters + Search Button */}
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => { setCategory('all'); setLocation('all'); setLocSearch(''); load(); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
            >
              <X className="h-3 w-3" />Clear filters
            </button>
          )}
          <Button
            className="flex-1 h-10 bg-black text-white border-2 border-black rounded-xl font-black text-sm shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all"
            onClick={() => load()}
            disabled={!canSearch || loading}
          >
            <Search className="h-4 w-4 mr-1.5" />Search
          </Button>
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

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-2xl">
            <ImageOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-1">No listings found.</p>
            <p className="text-xs text-gray-400">Try a different search or filter.</p>
          </div>
        )}

        {!loading && !error && listings.map((l) => (
          <Link to={`/sell/listing/${l.id}`} key={l.id} className="block border border-black/10 rounded-2xl overflow-hidden hover:border-black/30 hover:shadow-md transition-all bg-white shadow-[0_2px_0_0_rgba(0,0,0,0.05)]">
            <div className="flex gap-3 p-3">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0 border border-black/10" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-black/10">
                  <ImageOff className="h-5 w-5 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-black text-sm truncate">{l.title}</h3>
                  {l.price != null && (
                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      {formatPrice(l)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{l.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {l.condition && (
                    <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded uppercase">
                      {l.condition}
                    </span>
                  )}
                  <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {SELL_CATEGORIES.find(c => c.value === l.category)?.label ?? l.category}
                  </span>
                  <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />{l.location}
                  </span>
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
          </Link>
        ))}
      </div>
    </SellShell>
  );
}

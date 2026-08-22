import { useEffect, useMemo, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import { listMarketplace } from '../services/sellDb';
import type { SellListing } from '../types';
import { MapPin, Tag, IndianRupee, ImageOff, Search, SlidersHorizontal, X } from 'lucide-react';

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

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSearch = useMemo(() => search.trim().length === 0 || search.trim().length >= 2, [search]);

  const hasFilters = category !== 'all' || location !== 'all';

  return (
    <SellShell title="Marketplace">
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
            className="pl-10 pr-10 h-10 sm:h-12 text-xs sm:text-sm bg-gradient-to-br from-white to-slate-50/50 border-2 border-black rounded-xl focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all placeholder:text-slate-400 placeholder:text-[10px]"
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
              <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black rounded-xl focus:border-2 focus:border-black focus:ring-black bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
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
          <div className="flex-1">
            <Select value={location} onValueChange={(v) => { setLocation(v); }}>
              <SelectTrigger className="h-10 sm:h-12 text-xs sm:text-sm border-2 border-black rounded-xl focus:border-2 focus:border-black focus:ring-black bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <SelectValue placeholder="Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {SELL_LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters + Search Button */}
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => { setCategory('all'); setLocation('all'); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
            >
              <X className="h-3 w-3" />Clear filters
            </button>
          )}
          <Button
            className="flex-1 h-10 bg-black text-white border-2 border-black rounded-xl font-black text-sm shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all"
            onClick={load}
            disabled={!canSearch || loading}
          >
            {loading ? 'Loading…' : 'Search'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {listings.map((l) => (
          <Link key={l.id} to={`/sell/listing/${l.id}`} className="block group">
            <Card className="border-2 border-black rounded-2xl overflow-hidden group-hover:shadow-[0_8px_0_0_rgba(0,0,0,0.25)] group-active:shadow-[0_2px_0_0_rgba(0,0,0,0.25)] group-active:translate-y-1 transition-all duration-200 bg-white">
              {/* Image */}
              <div className="relative aspect-square bg-gray-100">
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt={l.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-[10px] font-medium">No image</span>
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="bg-black text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {l.condition}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-white text-black text-[9px] px-2 py-0.5 rounded-full font-bold border border-black/10">
                    {l.category}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-1.5">
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-black">{formatPrice(l)}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-black text-[11px] sm:text-sm leading-snug line-clamp-1">{l.title}</h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{l.location}</span>
                </div>

                {/* View details link */}
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-0.5">View details →</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm text-red-700 font-medium">Failed to load listings</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <Button onClick={load} className="mt-3 h-9 bg-black text-white border border-black font-black text-xs rounded-xl">Retry</Button>
        </div>
      )}
      {!loading && !error && listings.length === 0 && (
        <p className="text-sm text-gray-700">No listings found.</p>
      )}
    </SellShell>
  );
}



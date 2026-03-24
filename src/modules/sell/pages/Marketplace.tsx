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
import { MapPin, Tag, IndianRupee, ImageOff } from 'lucide-react';

function formatPrice(l: SellListing) {
  if (l.priceType === 'range') return `₹${l.priceMin ?? ''} - ₹${l.priceMax ?? ''}`;
  return l.price ? `₹${l.price}` : '₹—';
}

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listMarketplace({
        search,
        category: category === 'all' ? undefined : category,
        location: location === 'all' ? undefined : location,
      });
      setListings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSearch = useMemo(() => search.trim().length === 0 || search.trim().length >= 2, [search]);

  return (
    <SellShell title="Marketplace">
      <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] mb-4">
        <CardHeader className="font-black text-black">Search & Filters</CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Input
            className="sm:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings…"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border border-black">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {SELL_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="border border-black">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {SELL_LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="sm:col-span-4 bg-black text-white border border-black font-black"
            onClick={load}
            disabled={!canSearch || loading}
          >
            {loading ? 'Loading…' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map((l) => (
          <Link key={l.id} to={`/sell/listing/${l.id}`} className="block">
            <Card className="border border-black rounded-2xl overflow-hidden hover:shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-shadow bg-white">
              <div className="relative aspect-square sm:aspect-[4/3] bg-gray-100">
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt={l.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <ImageOff className="h-5 w-5 mr-2" />
                    <span className="text-xs font-medium">No image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/85 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                  {l.condition}
                </div>
                <div className="absolute top-2 right-2 bg-white/95 text-black text-[10px] px-2 py-1 rounded-full font-bold">
                  {l.category}
                </div>
              </div>

              <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                <div className="flex items-center gap-1 text-sm sm:text-lg text-black font-black">
                  <IndianRupee className="h-4 w-4" />
                  <span>{formatPrice(l)}</span>
                </div>
                <h3 className="font-black text-black text-xs sm:text-base leading-snug line-clamp-2">{l.title}</h3>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 px-3 pb-3 sm:px-6 sm:pb-6">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-700">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{l.location}</span>
                </div>

                {l.tags?.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-700">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{l.tags.slice(0, 3).join(' • ')}</span>
                  </div>
                )}

                <p className="hidden sm:block text-xs text-gray-700 line-clamp-2">{l.description}</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-black pt-1">View details</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!loading && listings.length === 0 && (
        <p className="text-sm text-gray-700">No listings found.</p>
      )}
    </SellShell>
  );
}



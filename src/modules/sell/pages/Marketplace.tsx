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
import { MapPin, Tag, IndianRupee } from 'lucide-react';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {listings.map((l) => (
          <Link key={l.id} to={`/sell/listing/${l.id}`} className="block">
            <Card className="border border-black rounded-2xl hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3)] transition-shadow">
              <CardHeader className="font-black text-black">{l.title}</CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span className="font-bold">{formatPrice(l)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{l.location}</span>
                </div>
                {l.tags?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="truncate">{l.tags.slice(0, 5).join(', ')}</span>
                  </div>
                )}
                <p className="text-xs text-gray-700 line-clamp-2">{l.description}</p>
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



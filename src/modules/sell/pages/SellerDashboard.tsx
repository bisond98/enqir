import { useEffect, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { listMyListings, listResponsesForSeller, softDeleteListing, updateListing } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Save, X, Plus, IndianRupee, MapPin, Eye, MessageSquare, LayoutDashboard, Tag, Package, MapPinned, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import type { ListingCondition, ListingPriceType } from '../types';

export default function SellerDashboard({ minimal = false }: { minimal?: boolean } = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [responses, setResponses] = useState<SellListingResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'responses'>('listings');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCondition, setEditCondition] = useState<ListingCondition>('used');
  const [editPriceType, setEditPriceType] = useState<ListingPriceType>('fixed');
  const [editPrice, setEditPrice] = useState('');
  const [editPriceMin, setEditPriceMin] = useState('');
  const [editPriceMax, setEditPriceMax] = useState('');
  const [editTags, setEditTags] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [responsesPage, setResponsesPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ls, rs] = await Promise.all([listMyListings(user.uid), listResponsesForSeller(user.uid)]);
      setListings(ls);
      setResponses(rs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.uid]);

  const startEdit = (l: SellListing) => {
    setEditingId(l.id);
    setEditTitle(l.title ?? '');
    setEditDescription(l.description ?? '');
    setEditCategory(l.category ?? 'other');
    setEditLocation(l.location ?? '');
    setEditCondition(l.condition ?? 'used');
    setEditPriceType(l.priceType ?? 'fixed');
    setEditPrice(l.price != null ? String(l.price) : '');
    setEditPriceMin(l.priceMin != null ? String(l.priceMin) : '');
    setEditPriceMax(l.priceMax != null ? String(l.priceMax) : '');
    setEditTags(l.tags?.join(', ') ?? '');
    setLocationSearch(l.location ?? '');
    setLocationDropdownOpen(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateListing(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        location: editLocation.trim(),
        condition: editCondition,
        priceType: editPriceType,
        price: editPrice ? Number(editPrice.replace(/[^0-9]/g, '')) : null,
        priceMin: editPriceType === 'range' && editPriceMin ? Number(editPriceMin.replace(/[^0-9]/g, '')) : null,
        priceMax: editPriceType === 'range' && editPriceMax ? Number(editPriceMax.replace(/[^0-9]/g, '')) : null,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 15),
      } as any);
      toast({ title: 'Saved', description: 'Listing updated.', variant: 'success' });
      setEditingId(null);
      await load();
    } catch {
      toast({ title: 'Failed', description: 'Could not update listing.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await softDeleteListing(id);
      toast({ title: 'Deleted', description: 'Listing removed.', variant: 'success' });
      await load();
    } catch {
      toast({ title: 'Failed', description: 'Could not delete listing.', variant: 'destructive' });
    }
  };

  const liveCount = listings.filter(l => l.status === 'live').length;
  const draftCount = listings.filter(l => l.status === 'draft').length;

  const listingsTotalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
  const paginatedListings = listings.slice((listingsPage - 1) * ITEMS_PER_PAGE, listingsPage * ITEMS_PER_PAGE);
  // Deduplicate responses: keep only the first message per buyer per listing
  const uniqueResponses = (() => {
    const seen = new Map<string, SellListingResponse>();
    // Responses are sorted newest-first, so iterate in reverse to keep the oldest (first) message
    for (let i = responses.length - 1; i >= 0; i--) {
      const r = responses[i];
      const key = `${r.listingId}_${r.buyerId}`;
      if (!seen.has(key)) seen.set(key, r);
    }
    return Array.from(seen.values());
  })();
  const responsesTotalPages = Math.ceil(uniqueResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = uniqueResponses.slice((responsesPage - 1) * ITEMS_PER_PAGE, responsesPage * ITEMS_PER_PAGE);

  if (!user) {
    return (
      minimal ? (
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 mb-4">Sign in to view your seller dashboard.</p>
          <Link to="/signin">
            <Button className="bg-black text-white border border-black font-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">Sign In</Button>
          </Link>
        </div>
      ) : (
      <SellShell title="Seller Dashboard">
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 mb-4">Sign in to view your seller dashboard.</p>
          <Link to="/signin">
            <Button className="bg-black text-white border border-black font-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">Sign In</Button>
          </Link>
        </div>
      </SellShell>
      )
    );
  }

  const shellContent = (
      <>
      {/* Stats Row */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-5">
        {[
          { label: 'Listings', count: listings.length },
          { label: 'Active', count: liveCount },
          { label: 'Responses', count: responses.length },
        ].map(({ label, count }) => (
          <div key={label} className="relative flex flex-col items-center justify-center border-3 border-black bg-white rounded-full overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] w-[70px] h-[70px] sm:w-20 sm:h-20 lg:w-24 lg:h-24">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <h3 className="text-base sm:text-lg lg:text-2xl font-black text-black mb-0 leading-none">
                {loading ? '—' : count}
              </h3>
              <p className="text-[7px] sm:text-[8px] lg:text-[9px] text-black font-black uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl border-[3px] border-black">
        {([
          { key: 'listings' as const, label: 'My Listings', count: listings.length },
          { key: 'responses' as const, label: 'Responses', count: responses.length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setListingsPage(1); setResponsesPage(1); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_4px_0_0_rgba(37,99,235,0.3)]'
                : 'text-black font-black hover:bg-gray-50'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">Loading listings…</p>
            </div>
          )}

          {!loading && listings.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-2xl">
              <LayoutDashboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500 mb-1">No listings yet.</p>
              <p className="text-xs text-gray-400 mb-4">Start selling to see your listings here.</p>
              <Link to="/sell/new">
                <Button className="bg-black text-white border border-black font-black text-xs rounded-xl px-4 shadow-[0_3px_0_0_rgba(0,0,0,0.2)]">
                  <Plus className="h-3 w-3 mr-1.5" />Create Listing
                </Button>
              </Link>
            </div>
          )}

          {!loading && paginatedListings.map((l) => (
            <div key={l.id} className="border border-black rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
              {editingId === l.id ? (
                <div className="p-4 space-y-3" onClick={(e) => e.preventDefault()}>
                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-10 text-sm border-[3px] border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
                    />
                  </div>
                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Description</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="text-sm border-[3px] border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl min-h-[80px] bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-10 text-sm border-[3px] border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-white px-3 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:outline-none transition-all duration-300"
                    >
                      {SELL_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Location */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Location</label>
                    <div className="flex items-center border-[3px] border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
                      <span className="flex items-center justify-center pl-3 text-black"><MapPin className="h-4 w-4" /></span>
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value);
                          setLocationDropdownOpen(true);
                          setEditLocation(e.target.value);
                        }}
                        onFocus={() => setLocationDropdownOpen(true)}
                        placeholder="Search location..."
                        className="flex-1 h-full text-sm bg-transparent px-3 outline-none border-none placeholder:text-gray-400"
                      />
                    </div>
                    {locationDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-[3px] border-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.15)] max-h-48 overflow-y-auto">
                        {SELL_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase())).length > 0 ? (
                          SELL_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase())).map((loc) => (
                            <button
                              key={loc}
                              onClick={() => {
                                setEditLocation(loc);
                                setLocationSearch(loc);
                                setLocationDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0 transition-colors"
                            >
                              {loc}
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => {
                              setEditLocation(locationSearch);
                              setLocationDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0 transition-colors text-gray-500 italic"
                          >
                            Use "{locationSearch}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Condition */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Condition</label>
                    <div className="flex gap-2">
                      {(['new', 'used'] as ListingCondition[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditCondition(c)}
                          className={`flex-1 h-10 text-xs font-bold border-2 rounded-xl transition-all ${
                            editCondition === c
                              ? 'border-[4px] border-black bg-black text-white shadow-[0_3px_0_0_rgba(0,0,0,0.2)]'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {c === 'new' ? 'New' : 'Used'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Price</label>
                    <div className="flex items-center border-[3px] border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
                      <span className="flex items-center justify-center pl-3 text-sm font-bold text-black"><IndianRupee className="h-4 w-4" /></span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        className="flex-1 h-full text-sm bg-transparent px-3 outline-none border-none"
                      />
                    </div>
                  </div>
                  {/* Tags */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tags (comma separated)</label>                        <Input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="e.g. urgent, wholesale, negotiable"
                          className="h-10 text-sm border-[3px] border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
                        />
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 bg-black text-white border border-black font-black text-xs rounded-xl shadow-[0_3px_0_0_rgba(0,0,0,0.2)]" onClick={saveEdit} disabled={saving}>
                      <Save className="h-3 w-3 mr-1.5" />{saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button variant="outline" className="flex-1 border border-black font-bold text-xs rounded-xl" onClick={() => setEditingId(null)} disabled={saving}>
                      <X className="h-3 w-3 mr-1.5" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to={`/sell/listing/${l.id}`} className="block group/tile">
                  <div className="p-4">
                    <div className="flex gap-3.5">
                      {l.images?.[0] ? (
                        <img src={l.images[0]} alt="" className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0 border border-black" />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-black">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[15px] text-gray-900 truncate leading-tight">{l.title}</h3>
                          <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold p-1 rounded-full ${
                            l.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-2.5 h-2.5 rounded-full border border-black ${l.status === 'live' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {l.price != null && (
                            <span className="text-[13px] font-bold text-gray-900">
                              ₹{l.price.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">•</span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{l.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex border-t border-gray-200 mx-4 mb-4 mt-0 rounded-b-2xl overflow-hidden">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(l); }}
                      className="flex-1 py-2.5 text-[11px] font-black text-gray-800 border border-black rounded-xl mx-2 my-2 flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 bg-white hover:bg-gray-50"
                    >
                      <Pencil className="h-3 w-3" />Edit
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(l.id); }}
                      className="flex-1 py-2.5 text-[11px] font-black text-white border border-black rounded-xl mx-2 my-2 flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 bg-[#800020] hover:bg-[#6b0019]"
                    >
                      <Trash2 className="h-3 w-3" />Delete
                    </button>
                  </div>
                </Link>
              )}
            </div>
          ))}

          {/* Listings Pagination */}
          {!loading && listingsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setListingsPage(p => Math.max(1, p - 1))}
                disabled={listingsPage === 1}
                className="flex items-center gap-1.5 text-sm font-black text-gray-700 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />Prev
              </button>
              <span className="text-sm font-black text-black">
                {listingsPage} / {listingsTotalPages}
              </span>
              <button
                onClick={() => setListingsPage(p => Math.min(listingsTotalPages, p + 1))}
                disabled={listingsPage === listingsTotalPages}
                className="flex items-center gap-1.5 text-sm font-black text-gray-700 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next<ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Create Listing CTA */}
          {!loading && listings.length > 0 && (
            <Link to="/sell/new" className="block">
              <Button className="w-full h-11 bg-black text-white border border-black font-black text-sm rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
                <Plus className="h-4 w-4 mr-2" />Create New Listing
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">Loading responses…</p>
            </div>
          )}

          {!loading && responses.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-2xl">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500 mb-1">No responses yet.</p>
              <p className="text-xs text-gray-400">Buyer responses will appear here.</p>
            </div>
          )}

          {!loading && paginatedResponses.map((r) => {
            const listing = listings.find((l) => l.id === r.listingId);
            return (              <Link to={`/sell/listing/${r.listingId}?buyer=${r.buyerId}`} key={r.id} className="block border border-black rounded-2xl overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.1)] group">
                <div className="bg-green-950 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="h-5 w-5 text-white flex-shrink-0" />
                    <p className="font-semibold text-[16px] text-white truncate">{listing?.title ?? 'Listing'}</p>
                  </div>
                  <span className="text-[10px] text-white/60 flex-shrink-0">Buyer's Message</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3.5">
                    {listing?.images?.[0] ? (
                      <img src={listing.images[0]} alt="" className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0 border border-black" />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-black">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {(r.offeredPrice != null && !isNaN(r.offeredPrice)) || r.message ? (
                        <div className="space-y-2">
                          {r.offeredPrice != null && !isNaN(r.offeredPrice) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider">offer</span>
                              <span className="text-[15px] font-bold text-gray-900">₹{r.offeredPrice.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {r.message && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <p className="text-[10px] text-gray-900 font-bold line-clamp-2 leading-relaxed">{r.message}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

              </Link>
            );
          })}

          {/* Responses Pagination */}
          {!loading && responsesTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setResponsesPage(p => Math.max(1, p - 1))}
                disabled={responsesPage === 1}
                className="flex items-center gap-1.5 text-sm font-black text-gray-700 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />Prev
              </button>
              <span className="text-sm font-black text-black">
                {responsesPage} / {responsesTotalPages}
              </span>
              <button
                onClick={() => setResponsesPage(p => Math.min(responsesTotalPages, p + 1))}
                disabled={responsesPage === responsesTotalPages}
                className="flex items-center gap-1.5 text-sm font-black text-gray-700 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next<ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
  </>
  );

  return minimal ? shellContent : <SellShell title="Seller Dashboard">{shellContent}</SellShell>;
}

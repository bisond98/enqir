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
import { Pencil, Trash2, Save, X, Plus, IndianRupee, MapPin, Eye, MessageSquare, LayoutDashboard, Tag, Package, MapPinned } from 'lucide-react';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import type { ListingCondition, ListingPriceType } from '../types';

export default function SellerDashboard() {
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

  if (!user) {
    return (
      <SellShell title="Seller Dashboard">
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 mb-4">Sign in to view your seller dashboard.</p>
          <Link to="/signin">
            <Button className="bg-black text-white border border-black font-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">Sign In</Button>
          </Link>
        </div>
      </SellShell>
    );
  }

  return (
    <SellShell title="Seller Dashboard">
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

      {/* Create Listing CTA */}
      <Link to="/sell/new" className="block mb-4">
        <Button className="w-full h-11 bg-black text-white border border-black font-black text-sm rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all">
          <Plus className="h-4 w-4 mr-2" />Create New Listing
        </Button>
      </Link>

      {/* Tab Toggle */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        {([
          { key: 'listings' as const, label: 'My Listings', count: listings.length },
          { key: 'responses' as const, label: 'Responses', count: responses.length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === key
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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

          {!loading && listings.map((l) => (
            <div key={l.id} className="border border-black rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
              {editingId === l.id ? (
                <div className="p-4 space-y-3" onClick={(e) => e.preventDefault()}>
                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-10 text-sm border-2 border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
                    />
                  </div>
                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Description</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="text-sm border-2 border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl min-h-[80px] bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-10 text-sm border-2 border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-white px-3 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:outline-none transition-all duration-300"
                    >
                      {SELL_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Location */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Location</label>
                    <div className="flex items-center border-2 border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
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
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.15)] max-h-48 overflow-y-auto">
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
                  {/* Price Type */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Price Type</label>
                    <div className="flex gap-2">
                      {(['fixed', 'range'] as ListingPriceType[]).map((pt) => (
                        <button
                          key={pt}
                          onClick={() => setEditPriceType(pt)}
                          className={`flex-1 h-10 text-xs font-bold border-2 rounded-xl transition-all ${
                            editPriceType === pt
                              ? 'border-[4px] border-black bg-black text-white shadow-[0_3px_0_0_rgba(0,0,0,0.2)]'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {pt === 'fixed' ? 'Fixed Price' : 'Price Range'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Price */}
                  {editPriceType === 'fixed' ? (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Price (₹)</label>
                      <div className="flex items-center border-2 border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
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
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Min (₹)</label>
                        <div className="flex items-center border-2 border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
                          <span className="flex items-center justify-center pl-3 text-sm font-bold text-black"><IndianRupee className="h-4 w-4" /></span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editPriceMin}
                            onChange={(e) => setEditPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="0"
                            className="flex-1 h-full text-sm bg-transparent px-3 outline-none border-none"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Max (₹)</label>
                        <div className="flex items-center border-2 border-black focus-within:border-[4px] rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] h-10 transition-all duration-300">
                          <span className="flex items-center justify-center pl-3 text-sm font-bold text-black"><IndianRupee className="h-4 w-4" /></span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editPriceMax}
                            onChange={(e) => setEditPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="0"
                            className="flex-1 h-full text-sm bg-transparent px-3 outline-none border-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Tags */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tags (comma separated)</label>                        <Input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="e.g. urgent, wholesale, negotiable"
                          className="h-10 text-sm border-2 border-black focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition-all duration-300"
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
                <Link to={`/sell/listing/${l.id}`} className="block">
                  <div className="flex gap-3 p-3">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 border border-black/10" />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-black/10">
                        <LayoutDashboard className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-black text-sm truncate">{l.title}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          l.status === 'live' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>{l.status}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{l.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {l.price != null && (
                          <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">
                            <IndianRupee className="h-2 w-2 inline" />{l.price.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{l.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex border-t border-black/10">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(l); }}
                      className="flex-1 py-2.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 border-r border-black/10 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />Edit
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(l.id); }}
                      className="flex-1 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />Delete
                    </button>
                  </div>
                </Link>
              )}
            </div>
          ))}
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

          {!loading && responses.slice(0, 30).map((r) => {
            const listing = listings.find((l) => l.id === r.listingId);
            return (
              <Link to={`/sell/listing/${r.listingId}`} key={r.id} className="block border border-black/10 rounded-2xl p-4 hover:bg-slate-50 hover:border-black/20 transition-all shadow-[0_2px_0_0_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-black text-black text-xs sm:text-sm truncate">{listing?.title ?? 'Listing'}</p>
                  {r.offeredPrice != null && (
                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      <IndianRupee className="h-2 w-2 inline" />{r.offeredPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-2">{r.message}</p>
              </Link>
            );
          })}
        </div>
      )}
    </SellShell>
  );
}

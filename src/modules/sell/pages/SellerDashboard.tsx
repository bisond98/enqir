import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { listMyListings, listResponsesForSeller, softDeleteListing, updateListing } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Save, X, Plus, IndianRupee, MapPin, Eye, MessageSquare, LayoutDashboard, Tag, Package, MapPinned, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { LoadingAnimation } from '@/components/LoadingAnimation';

export default function SellerDashboard({ minimal = false }: { minimal?: boolean } = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [responses, setResponses] = useState<SellListingResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'responses'>('listings');
  const [editPrice, setEditPrice] = useState('');
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
    // Only the price is editable; everything else stays untouched.
    setEditPrice(l.price != null ? String(l.price) : '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    // Only the price is editable once a listing is live.
    setSaving(true);
    try {
      await updateListing(editingId, {
        price: editPrice ? Number(editPrice.replace(/[^0-9]/g, '')) : null,
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

  // Unread counts for My Listings / Buyers toggle badges ("new since last viewed")
  const listingsUnread = (() => {
    if (!user) return 0;
    const seen = parseInt(localStorage.getItem(`sd_listings_viewed_${user.uid}`) || '0', 10);
    return listings.length > seen ? listings.length - seen : 0;
  })();
  const responsesUnread = (() => {
    if (!user) return 0;
    const seen = parseInt(localStorage.getItem(`sd_responses_viewed_${user.uid}`) || '0', 10);
    return uniqueResponses.length > seen ? uniqueResponses.length - seen : 0;
  })();

  const listingsTotalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
  const paginatedListings = listings.slice((listingsPage - 1) * ITEMS_PER_PAGE, listingsPage * ITEMS_PER_PAGE);
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
          { label: 'Buyers', count: responses.length },
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
      <div className="flex gap-1 mb-4 bg-white p-1 rounded-full !border-[1.5px] !border-black !shadow-[0_5px_0_0_rgba(0,0,0,0.85)]">
        {([
          { key: 'listings' as const, label: 'My Listings', count: listings.length, unread: listingsUnread },
          { key: 'responses' as const, label: 'Buyers', count: responses.length, unread: responsesUnread },
        ]).map(({ key, label, count, unread }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key); setListingsPage(1); setResponsesPage(1);
              if (key === 'listings') { setListingsUnread(0); localStorage.setItem(`sd_listings_viewed_${user?.uid}`, String(listings.length)); }
              if (key === 'responses') { setResponsesUnread(0); localStorage.setItem(`sd_responses_viewed_${user?.uid}`, String(responses.length)); }
            }}
            className={`relative flex-1 py-2 text-xs sm:text-sm font-black !rounded-full !transition-all !duration-150 touch-manipulation select-none ${
              activeTab === key
                ? '!bg-blue-600 text-white'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            {label} ({count})
            {unread > 0 && (
              <motion.span
                className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-white shadow-sm z-10 pointer-events-none"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </button>
        ))}
      </div>

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-10">
              <LoadingAnimation message="Loading listings" showBackButton={false} compact />
            </div>
          )}

          {!loading && listings.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-2xl">
              <LayoutDashboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500 mb-1">No listings yet.</p>
              <p className="text-xs text-gray-400 mb-4">Start selling to see your listings here.</p>
              <Link to="/sell/new">
                <Button className="relative !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black/20 !shadow-[0_8px_0_0_rgba(0,0,0,0.25)] hover:!shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.25)] active:!translate-y-[4px] !transition-all !duration-200 !overflow-hidden group font-black text-xs px-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                  <Plus className="h-3 w-3 mr-1.5 relative z-10" />
                  <span className="relative z-10">Create Listing</span>
                </Button>
              </Link>
            </div>
          )}

          {!loading && paginatedListings.map((l) => (
            <div key={l.id} className="border border-black rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
              {editingId === l.id ? (
                <div className="p-4 space-y-3" onClick={(e) => e.preventDefault()}>
                  {/* Price */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Price</label>
                    <div className="flex items-center bg-gradient-to-br from-white to-slate-50/50 border-[1.5px] border-black !rounded-2xl h-10 sm:h-11 overflow-hidden !shadow-[0_6px_0_0_rgba(0,0,0,0.15)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.15)] active:!translate-y-[4px] focus-within:!border-black transition-all !duration-200">
                      <span className="flex items-center justify-center pl-3 text-sm font-bold text-black"><IndianRupee className="h-4 w-4" /></span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editPrice ? Number(editPrice).toLocaleString('en-IN') : ''}
                        onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        className="flex-1 h-full text-sm font-bold bg-transparent px-3 outline-none border-none placeholder:text-gray-400"
                      />
                    </div>
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
                        <img src={l.images[0]} alt="" loading="lazy" decoding="async" className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0 border border-black" />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-black">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[17px] text-gray-900 truncate leading-tight">{l.title}</h3>
                          <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold p-1 rounded-full ${
                            l.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-2.5 h-2.5 rounded-full border border-black ${l.status === 'live' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {l.price != null && (
                            <span className="text-[13px] font-bold text-gray-900">
                              ₹{l.price.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">•</span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />{l.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex border-t border-gray-200 mx-4 mb-4 mt-0 rounded-b-2xl overflow-hidden">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(l); }}
                      className="relative flex-1 py-2.5 text-[11px] font-black text-gray-800 !border-[1.5px] !border-black !rounded-2xl mx-2 my-2 flex items-center justify-center gap-1.5 !transition-all !duration-150 !bg-white hover:!bg-gray-50 !shadow-[0_4px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[3px] overflow-hidden group/edit touch-manipulation select-none"
                    >
                      <Pencil className="h-3 w-3 relative z-10" /><span className="relative z-10">Edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(l.id); }}
                      className="relative flex-1 py-2.5 text-[11px] font-black text-white !border-[1.5px] !border-black !rounded-2xl mx-2 my-2 flex items-center justify-center gap-1.5 !transition-all !duration-150 !bg-[#800020] hover:!bg-[#6b0019] !shadow-[0_4px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[3px] overflow-hidden group/del touch-manipulation select-none"
                    >
                      <Trash2 className="h-3 w-3 relative z-10" /><span className="relative z-10">Delete</span>
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
              <Button className="w-full h-11 !bg-black text-white !border-[1.5px] !border-black font-black text-sm !rounded-2xl !shadow-[0_4px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[3px] !transition-all !duration-150 touch-manipulation select-none">
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
              <LoadingAnimation message="Loading responses" showBackButton={false} compact />
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
                      <img src={listing.images[0]} alt="" loading="lazy" decoding="async" className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0 border border-black" />
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

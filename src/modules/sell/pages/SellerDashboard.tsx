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
import { Pencil, Trash2, Save, X, Plus, IndianRupee, MapPin, Eye, MessageSquare, LayoutDashboard, Tag, Package, MapPinned, ChevronLeft, ChevronRight, Mail, User, Clock } from 'lucide-react';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import ShareButton from '../components/ShareButton';

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
      {/* Tab Toggle */}
      <div className={minimal ? 'bg-black px-4 sm:px-6 pb-5 sm:pb-6' : ''}>
      <div className="flex w-fit mx-auto gap-1 bg-white p-0.5 rounded-full !border-[1.5px] !border-black !shadow-none">
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
            className={`relative py-1 sm:py-1.5 px-12 sm:px-14 text-[9px] sm:text-[10px] font-bold whitespace-nowrap !rounded-full !transition-all !duration-200 touch-manipulation select-none ${
              activeTab === key
                ? '!bg-blue-600 !text-white'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            <span className={activeTab === key ? 'text-[12px] sm:text-[13px]' : ''}>{label} ({count})</span>
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
      </div>

      <div className={minimal ? 'px-4 sm:px-6 pt-5 sm:pt-6 pb-2' : 'pt-5 sm:pt-6'}>

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
                <Button className="relative !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-0 !shadow-none hover:!shadow-none active:!shadow-none !transition-all !duration-200 !overflow-hidden group font-black text-xs px-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                  <Plus className="h-3 w-3 mr-1.5 relative z-10" />
                  <span className="relative z-10">Create Listing</span>
                </Button>
              </Link>
            </div>
          )}

          {!loading && paginatedListings.map((l) => (
            <div key={l.id} className="group relative rounded-2xl border-0 bg-white overflow-hidden transition-all duration-200 shadow-[0_-2px_0_0_rgba(17,24,39,0.07),-2px_0_0_0_rgba(17,24,39,0.09),2px_0_0_0_rgba(17,24,39,0.09),0_2px_0_0_rgba(17,24,39,0.15),0_6px_12px_-6px_rgba(17,24,39,0.18)] hover:-translate-y-[2px] hover:shadow-[0_-2px_0_0_rgba(17,24,39,0.07),-2px_0_0_0_rgba(17,24,39,0.11),2px_0_0_0_rgba(17,24,39,0.11),0_4px_0_0_rgba(17,24,39,0.16),0_10px_16px_-8px_rgba(17,24,39,0.20)]">
              {editingId === l.id ? (
                <div className="p-4 space-y-3" onClick={(e) => e.preventDefault()}>
                  {/* Price */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Price</label>
                    <div className="flex items-center border border-gray-300 rounded-xl h-12 min-h-[48px] overflow-hidden bg-white !shadow-none focus-within:border-black transition-colors">
                      <span className="flex items-center justify-center pl-4 text-sm font-bold text-black"><IndianRupee className="h-4 w-4" /></span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editPrice ? Number(editPrice).toLocaleString('en-IN') : ''}
                        onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        className="flex-1 h-full w-full text-base font-medium text-slate-900 bg-transparent px-3 outline-none border-none ring-0 focus:ring-0 focus:outline-none shadow-none focus:shadow-none placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] [caret-color:black] [-webkit-tap-highlight-color:transparent]"
                        style={{ fontSize: '16px', WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none' }}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 h-10 !bg-black hover:!bg-gray-900 !text-white !border-0 font-bold text-xs !rounded-full !shadow-none" onClick={saveEdit} disabled={saving}>
                      <Save className="h-3 w-3 mr-1.5" />{saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 !border !border-gray-300 font-bold text-xs !rounded-full !shadow-none" onClick={() => setEditingId(null)} disabled={saving}>
                      <X className="h-3 w-3 mr-1.5" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to={`/sell/listing/${l.id}`} className="block">
                  <div className="flex gap-3.5 p-3.5">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt="" loading="lazy" decoding="async" className="w-[76px] h-[76px] rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-[76px] h-[76px] rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-200">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[15px] text-gray-900 leading-snug line-clamp-2">{l.title}</h3>
                        <span className={`flex-shrink-0 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${
                          l.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.status === 'expired' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'live' ? 'bg-emerald-500' : l.status === 'expired' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                          {l.status === 'expired' && 'Expired'}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-2">
                        {l.price != null && (
                          <span className="inline-flex items-center text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-full px-2.5 py-1">
                            ₹{l.price.toLocaleString('en-IN')}
                          </span>
                        )}
                        {l.createdAt && (
                          <span className="inline-flex items-center truncate rounded-full bg-gray-100 border border-gray-300 px-1.5 py-[1px] text-[7px] font-bold text-gray-700">
                            Posted on {(() => {
                              try {
                                const d = typeof l.createdAt?.toDate === 'function' ? l.createdAt.toDate() : new Date(l.createdAt);
                                if (isNaN(d.getTime())) return '';
                                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              } catch { return ''; }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 border-t border-gray-100 px-3.5 py-2.5">
                    <span className="mr-auto inline-flex items-center gap-0.5 text-[7px] font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-full px-1.5 py-[1px]">
                      <MapPin className="h-1.5 w-1.5 text-gray-500" />{l.location}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(l); }}
                      aria-label="Edit listing"
                      title="Edit"
                      className="group/edit flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors focus-visible:border-black touch-manipulation select-none"
                    >
                      <Pencil className="h-3.5 w-3.5 group-hover/edit:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(l.id); }}
                      aria-label="Delete listing"
                      title="Delete"
                      className="group/del flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-700 border border-red-700 text-white hover:bg-red-800 transition-colors focus-visible:border-red-800 touch-manipulation select-none"
                    >
                      <Trash2 className="h-3.5 w-3.5 group-hover/del:scale-110 transition-transform" />
                    </button>
                    {/* Share — same green round share as the listing detail page */}
                    <ShareButton
                      listing={l}
                      className="!w-9 !h-9 !p-0 !rounded-full !bg-green-700 hover:!bg-green-800 !text-white !border-0 flex items-center justify-center !shadow-none [&>svg]:!h-3.5 [&>svg]:!w-3.5"
                    />
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
              <Button className="w-full h-11 !bg-black hover:!bg-gray-900 text-white !border-0 font-bold text-sm !rounded-full !shadow-none !transition-colors touch-manipulation select-none">
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
            return (              <Link to={`/sell/listing/${r.listingId}?buyer=${r.buyerId}`} key={r.id} className="block relative rounded-2xl border-0 bg-white overflow-hidden group transition-all duration-200 shadow-[0_-2px_0_0_rgba(17,24,39,0.07),-2px_0_0_0_rgba(17,24,39,0.09),2px_0_0_0_rgba(17,24,39,0.09),0_2px_0_0_rgba(17,24,39,0.15),0_6px_12px_-6px_rgba(17,24,39,0.18)] hover:-translate-y-[2px] hover:shadow-[0_-2px_0_0_rgba(17,24,39,0.07),-2px_0_0_0_rgba(17,24,39,0.11),2px_0_0_0_rgba(17,24,39,0.11),0_4px_0_0_rgba(17,24,39,0.16),0_10px_16px_-8px_rgba(17,24,39,0.20)]">
                <div className="flex gap-3.5 p-3.5">
                  {listing?.images?.[0] ? (
                    <img src={listing.images[0]} alt="" loading="lazy" decoding="async" className="w-[76px] h-[76px] rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-[76px] h-[76px] rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-200">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-gray-900 leading-snug line-clamp-2">{listing?.title ?? 'Listing'}</p>
                        {((r.offeredPrice != null && !isNaN(r.offeredPrice)) || r.message) && (
                      <div className="mt-1 space-y-1">
                        {r.offeredPrice != null && !isNaN(r.offeredPrice) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">offer</span>
                            <span className="text-xs font-bold text-white">₹{r.offeredPrice.toLocaleString('en-IN')}</span>
                          </span>
                        )}
                        {r.message && (
                          <div className="flex items-start gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-[1px]" />
                            <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed">{r.message}</p>
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 border border-emerald-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                          <Mail className="h-3 w-3" />Buyer's Message
                        </span>
                        <span className="inline-flex max-w-[130px] items-center gap-1 truncate rounded-full bg-gray-100 border border-black px-2 py-1 text-[9px] font-bold text-black">
                          <User className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">Posted by {(r as any).buyerName || 'Buyer'}</span>
                        </span>
                        <span className="inline-flex max-w-[130px] items-center gap-1 truncate rounded-full bg-gray-50 border border-gray-300 px-1.5 py-[1px] text-[7px] font-semibold text-gray-600">
                          <Clock className="h-2 w-2 flex-shrink-0" />
                          <span className="truncate">
                            Posted on {(() => {
                              try {
                                const raw = (r as any).createdAt;
                                const d = raw?.toDate ? raw.toDate() : new Date(raw);
                                if (isNaN(d.getTime())) return '—';
                                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              } catch { return '—'; }
                            })()}
                          </span>
                        </span>
                      </div>
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
      </div>
  </>
  );

  return minimal ? shellContent : <SellShell title="Seller Dashboard">{shellContent}</SellShell>;
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SellShell from '../components/SellShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getListing, listResponsesForListing, createListingResponse } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { MapPin, Tag, IndianRupee, MessageSquare, ChevronLeft, ChevronRight, X, Send, UserCircle, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { suggestEnquiriesForListing } from '../services/aiMatching';
import { processPayment } from '@/services/paymentService';
import { PAYMENT_PLANS } from '@/config/paymentPlans';


function formatPrice(l: SellListing) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (l.priceType === 'range') return `₹${fmt(l.priceMin ?? 0)} – ₹${fmt(l.priceMax ?? 0)}`;
  return l.price ? `₹${fmt(l.price)}` : '₹—';
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<SellListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<SellListingResponse[]>([]);
  const [message, setMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [responsePage, setResponsePage] = useState(0);
  const RESPONSES_PER_PAGE = 5;


  const isOwner = useMemo(() => !!user && !!listing && listing.sellerId === user.uid, [user, listing]);
  const chatUnlocked = useMemo(() => !!user && responses.some(r => r.buyerId === user.uid), [user, responses]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    if (!listing?.sellerId) return;
    getDoc(doc(db, 'userProfiles', listing.sellerId)).then(snap => {
      if (snap.exists()) setSellerProfile(snap.data());
    }).catch(() => {});
  }, [listing?.sellerId]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const l = await getListing(id);
        setListing(l);
        if (l) {
          listResponsesForListing(l.id).then(setResponses);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const submitResponse = async () => {
    if (!user || !listing) {
      toast({ title: 'Sign in required', description: 'Please sign in to message the seller.', variant: 'destructive' });
      return;
    }
    if (!message.trim() && !offeredPrice.trim()) {
      toast({ title: "Input required", description: "Enter a message or offered price.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      // Check if user already has a response on this listing (already paid)
      const alreadyPaid = responses.some(r => r.buyerId === user.uid);
      console.log(alreadyPaid ? '✅ Chat already unlocked — skipping payment' : '💳 First message — opening Razorpay checkout');

      if (!alreadyPaid) {
        const messagePlan = PAYMENT_PLANS.find(p => p.id === 'premium');
        if (!messagePlan) {
          toast({ title: 'Error', description: 'Payment plan not found.', variant: 'destructive' });
          setSending(false);
          return;
        }

        const paymentResult = await processPayment(
          listing.id,
          user.uid,
          messagePlan,
          {
            name: user.displayName || user.email?.split('@')[0] || '',
            email: user.email || '',
            contact: '',
          }
        );

        if (!paymentResult.success) {
          console.error('❌ Payment failed:', paymentResult.error);
          toast({
            title: 'Payment Unsuccessful',
            description: paymentResult.error || 'Payment failed. Message not sent.',
            variant: 'destructive',
          });
          setSending(false);
          return;
        }
      }

      console.log('✅ Proceeding to send message...');
      console.log('📤 Sending listing response:', { listingId: listing.id, sellerId: listing.sellerId, buyerId: user.uid });
      await createListingResponse({
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: user.uid,
        buyerName: user.displayName || user.email?.split('@')[0] || 'Buyer',
        message: message.trim(),
        offeredPrice: offeredPrice.trim() ? Number(offeredPrice) : null,
      });
      console.log('✅ Listing response sent successfully');
      toast({ title: 'Sent', description: 'Your message was sent to the seller.' });
      setMessage('');
      setOfferedPrice('');
      navigate(`/sell/listing/${listing.id}/chat/${user.uid}`);
    } catch (err: any) {
      console.error('❌ Failed to send listing response:', err.code, err.message);
      toast({ title: 'Failed', description: err.message || 'Could not send your message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const [matches, setMatches] = useState<Array<{ enquiry: any; score: number }> | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!listing) return;
      setLoadingMatches(true);
      try {
        const m = await suggestEnquiriesForListing(listing, { threshold: 0.8, max: 5 });
        setMatches(m);
      } finally {
        setLoadingMatches(false);
      }
    };
    run();
  }, [listing]);

  if (loading) {
    return (
      <SellShell title="Listing">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Loading listing…</p>
        </div>
      </SellShell>
    );
  }

  if (!listing || listing.status !== 'live') {
    return (
      <SellShell title="Listing">
        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
          <CardContent className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-700">Listing not found or no longer available.</p>
            <Link to="/sell/marketplace">
              <Button className="mt-4 bg-black text-white border border-black font-black rounded-xl" variant="default">
                Browse Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </SellShell>
    );
  }

  return (
    <SellShell title="Listing">
      <div className="space-y-4 pb-6">
        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 && (
          <div className="relative">
            <div className="relative w-full h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden border border-black/10 bg-gray-100">
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
                onClick={() => setShowAllImages(true)}
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((p) => (p === 0 ? listing.images.length - 1 : p - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveImage((p) => (p === listing.images.length - 1 ? 0 : p + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
                    {activeImage + 1} / {listing.images.length}
                  </div>
                </>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                {listing.images.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImage ? 'border-black shadow-[0_3px_0_0_rgba(0,0,0,0.2)]' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listing Info Card */}
        <div className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Title + Price */}
            <div className="mb-3">
              <h2 className="text-base sm:text-lg font-black text-black leading-snug text-left flex items-center gap-1.5">
                <span className="px-3 py-1 rounded-xl border-2 border-black">{listing.title}</span>
                {sellerProfile?.isProfileVerified && (
                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"><CheckCircle className="h-2 w-2 text-white" /></span>
                )}
              </h2>
              <div className="w-full text-center mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">₹{listing.price != null ? listing.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="border-t border-gray-100 pt-3 mb-3">
                <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Info Chips + Share inside card */}
            <div className="flex flex-wrap items-center gap-1.5">
              {listing.condition && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-md uppercase">
                  {listing.condition}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-md">
                <Tag className="h-2.5 w-2.5" />{listing.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-md">
                <MapPin className="h-3 w-3 text-red-500" />{listing.location}
              </span>
              {listing.tags && listing.tags.length > 0 && (
                listing.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-md">
                    {tag}
                  </span>
                ))
              )}
              <span className="ml-auto"><ShareButton listing={listing} /></span>
            </div>

          </div>
        </div>

        {/* Message Seller Card */}
        {!isOwner && (
          <div id="message-seller" className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <div className="bg-black p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-white" />
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">Message Seller
                  {sellerProfile?.isProfileVerified && (
                    <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-500"><CheckCircle className="h-1.5 w-1.5 text-white" /></span>
                  )}
                </h3>
                <IndianRupee className="h-3.5 w-3.5 text-white/70 ml-auto" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-700 uppercase mb-1 block">Your Price (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 z-10">₹</span>
                  <Input
                    value={offeredPrice ? Number(offeredPrice).toLocaleString("en-IN") : ""}
                    maxLength={13}
                    onChange={(e) => setOfferedPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g., 15,000"
                    inputMode="numeric"
                    className="h-10 sm:h-11 text-sm border-[1.5px] border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 placeholder:text-[10px] pl-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-bold text-gray-700 uppercase mb-1 block">Chat with Seller</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message to the seller…"
                  maxLength={250}
                  rows={3}
                  className="text-sm border-[1.5px] border-black rounded-xl min-h-[90px] bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 placeholder:text-[10px] resize-none"
                />
              </div>
              <Button
                variant="outline"
                className="w-full h-11 !bg-green-600 hover:!bg-green-700 !text-white !border-green-700 font-black text-sm rounded-xl shadow-[0_4px_0_0_rgba(22,163,74,0.3)] hover:shadow-[0_6px_0_0_rgba(22,163,74,0.3)] active:shadow-[0_2px_0_0_rgba(22,163,74,0.3)] active:translate-y-0.5 transition-all"
                onClick={() => { if (user) { submitResponse(); } else { sessionStorage.setItem('returnAfterSignIn', window.location.pathname + '#message-seller'); navigate('/signin'); } }}
                disabled={sending}
              >
                <Send className="h-4 w-4 mr-2" />
                {user ? (sending ? (chatUnlocked ? 'Sending…' : 'Opening Razorpay…') : (chatUnlocked ? 'Connect' : 'Connect')) : 'Sign in to message'}
              </Button>
            </div>
          </div>
        )}

        {/* Buyer Responses (Owner Only) */}
        {isOwner && (() => {
          const totalPages = Math.ceil(responses.length / RESPONSES_PER_PAGE);
          const pagedResponses = responses.slice(responsePage * RESPONSES_PER_PAGE, (responsePage + 1) * RESPONSES_PER_PAGE);
          return (
          <div className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <div className="bg-black p-3">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-white" />
                <h3 className="text-sm font-bold text-white">Buyer Responses ({responses.length})</h3>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {responses.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No responses yet.</p>
              )}
              {pagedResponses.map((r) => (
                <Link
                  key={r.id}
                  to={`/sell/listing/${listing?.id}/chat/${r.buyerId}`}
                  className="block border border-black/10 rounded-xl p-3 hover:bg-gray-50 transition-all shadow-[0_2px_0_0_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{r.buyerName || 'Buyer'}</p>
                      <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">{r.message}</p>
                      {r.offeredPrice != null && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-black mt-1.5">
                          <IndianRupee className="h-2.5 w-2.5" />₹{r.offeredPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 mt-1 w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5 text-white" /></span>
                  </div>
                </Link>
              ))}
              {/* Prev / Next pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setResponsePage(p => Math.max(0, p - 1))}
                    disabled={responsePage === 0}
                    className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
                  >
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </button>
                  <span className="text-[10px] font-bold text-gray-500">{responsePage + 1} / {totalPages}</span>
                  <button
                    onClick={() => setResponsePage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={responsePage >= totalPages - 1}
                    className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })()}


      </div>


      {/* Full-screen image viewer */}
      {showAllImages && listing.images && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-3">
            <p className="text-white text-xs font-medium">
              {activeImage + 1} / {listing.images.length}
            </p>
            <button
              onClick={() => setShowAllImages(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <button
              onClick={() => setActiveImage((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
              className="absolute left-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <img
              src={listing.images[activeImage]}
              alt={listing.title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setActiveImage((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </SellShell>
  );
}

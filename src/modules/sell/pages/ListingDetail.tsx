import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getListing, listResponsesForListing, createListingResponse } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { MapPin, Tag, IndianRupee, MessageSquare, ChevronLeft, ChevronRight, X, Send, UserCircle } from 'lucide-react';
import { suggestEnquiriesForListing } from '../services/aiMatching';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, getDoc, doc } from 'firebase/firestore';

function formatPrice(l: SellListing) {
  if (l.priceType === 'range') return `₹${l.priceMin ?? ''} – ₹${l.priceMax ?? ''}`;
  return l.price ? `₹${l.price}` : '₹—';
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<SellListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<SellListingResponse[]>([]);
  const [message, setMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isOwner = useMemo(() => !!user && !!listing && listing.sellerId === user.uid, [user, listing]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const l = await getListing(id);
        setListing(l);
        if (l) {
          const r = await listResponsesForListing(l.id);
          setResponses(r);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // Real-time chat listener for selected buyer
  useEffect(() => {
    if (!selectedBuyerId || !listing || !isOwner) return;

    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', `sell_listing_${listing.id}`),
      where('sellerId', '==', selectedBuyerId)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });
      setChatMessages(messages);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error('Chat listener error:', error);
    });

    return () => unsubscribe();
  }, [selectedBuyerId, listing, isOwner]);

  const sendChatMessage = async () => {
    if (!user || !listing || !selectedBuyerId || !chatInput.trim()) return;
    setSendingChat(true);
    try {
      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: `sell_listing_${listing.id}`,
        sellerId: selectedBuyerId,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Seller',
        recipientId: selectedBuyerId,
        message: chatInput.trim(),
        timestamp: serverTimestamp(),
        isSystemMessage: false,
      });
      setChatInput('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast({ title: 'Failed', description: 'Could not send message.', variant: 'destructive' });
    } finally {
      setSendingChat(false);
    }
  };

  const submitResponse = async () => {
    if (!user || !listing) {
      toast({ title: 'Sign in required', description: 'Please sign in to message the seller.', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Write a short message to the seller.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
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
      const r = await listResponsesForListing(listing.id);
      setResponses(r);
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
      <div className="space-y-4 sm:space-y-5">
        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 && (
          <div className="relative">
            {/* Main Image */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-black/20 bg-gray-100">
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg border border-black/10 active:scale-95 transition-transform"
                  >
                    <ChevronLeft className="h-4 w-4 text-black" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg border border-black/10 active:scale-95 transition-transform"
                  >
                    <ChevronRight className="h-4 w-4 text-black" />
                  </button>
                  {/* Image counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
                    {activeImage + 1} / {listing.images.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                {listing.images.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      idx === activeImage ? 'border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3)]' : 'border-transparent opacity-60'
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
        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-black text-black tracking-tight leading-tight">
              {listing.title}
            </h2>

            {/* Price & Meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 bg-black text-white text-xs sm:text-sm font-black px-3 py-1.5 rounded-lg">
                <IndianRupee className="h-3.5 w-3.5" />
                {formatPrice(listing)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg border border-black/5">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg border border-black/5">
                <Tag className="h-3 w-3" />
                {listing.category}
              </span>
            </div>

            {/* Description */}
            <div className="border-t border-black/5 pt-3">
              <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] sm:text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-black/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Condition */}
            {listing.condition && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Condition:</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-black capitalize">{listing.condition}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Seller Card */}
        {!isOwner && (
          <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-black" />
                <h3 className="text-sm sm:text-base font-black text-black">Message Seller</h3>
              </div>

              {/* Offered Price */}
              <div className="space-y-2.5">
                <Label className="text-[10px] sm:text-xs font-bold text-gray-900">Offered Price (optional)</Label>
                <div className="relative">
                  <Input
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    placeholder="e.g., 15000"
                    inputMode="numeric"
                    className="h-12 sm:h-14 text-base border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none transition-all duration-300 pl-4 pr-4 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2.5">
                <Label className="text-[10px] sm:text-xs font-bold text-gray-900">Your Message</Label>
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message to the seller…"
                    rows={4}
                    className="border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base min-h-[120px] rounded-none transition-all duration-300 pl-4 pr-4 py-3 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] placeholder:text-slate-400 placeholder:text-[10px] relative z-10"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-none pointer-events-none z-0" />
                </div>
              </div>

              {/* Send Button */}
              <Button
                className="w-full h-12 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white border border-blue-700 font-black text-sm sm:text-base rounded-xl shadow-[0_6px_0_0_rgba(37,99,235,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(37,99,235,0.4)] active:translate-y-[4px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={submitResponse}
                disabled={!user || sending}
              >
                <Send className="h-4 w-4 mr-2" />
                {user ? (sending ? 'Sending…' : 'Send Message') : 'Sign in to message'}
              </Button>

              {!user && (
                <p className="text-[11px] text-gray-500 text-center">
                  <Link to="/signin" className="underline font-bold text-black">Sign in</Link> to contact the seller.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Buyer Responses (Owner Only) */}
        {isOwner && (
          <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="h-4 w-4 text-black" />
                <h3 className="text-sm sm:text-base font-black text-black">Buyer Responses ({responses.length})</h3>
              </div>

              {responses.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No responses yet.</p>
              )}

              {responses.slice(0, 20).map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedBuyerId(r.buyerId);
                    setChatMessages([]);
                  }}
                  className={`border rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                    selectedBuyerId === r.buyerId
                      ? 'border-black bg-slate-50 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]'
                      : 'border-black/10 bg-gradient-to-br from-white to-slate-50/50 shadow-[0_2px_0_0_rgba(0,0,0,0.05)] hover:border-black/30 hover:shadow-[0_4px_0_0_rgba(0,0,0,0.08)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{r.buyerName || 'Buyer'}</p>
                      <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mt-1">{r.message}</p>
                      {r.offeredPrice != null && (
                        <p className="text-xs font-black text-black mt-2 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          Offer: ₹{r.offeredPrice.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <MessageSquare className={`h-4 w-4 flex-shrink-0 mt-1 ${selectedBuyerId === r.buyerId ? 'text-black' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Chat Box (Owner Only, when buyer selected) */}
        {isOwner && selectedBuyerId && listing && (
          <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col" style={{ height: 'min(500px, 60vh)' }}>
            <CardHeader className="bg-green-950 p-3 flex flex-row items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-black">
                <MessageSquare className="h-4 w-4 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">Chat with Buyer</h3>
                <p className="text-[10px] text-green-300">{selectedBuyerId.slice(0, 8)}…</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBuyerId(null)}
                className="text-white hover:text-white hover:bg-white/10 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-white min-h-0 p-3 sm:p-4 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">Start chatting</p>
                    <p className="text-[10px] text-gray-400 mt-1">Send a message to this buyer</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl border border-black ${
                      msg.senderId === user?.uid ? 'bg-white' : 'bg-gray-100'
                    }`}>
                      {msg.isSystemMessage || msg.senderId === 'system' ? (
                        <p className="text-[10px] text-center text-gray-500 font-medium">{msg.message}</p>
                      ) : (
                        <p className="text-sm leading-relaxed break-words text-black font-medium">{msg.message}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t border-black p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder="Type a message…"
                  className="flex-1 h-10 border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-lg"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || sendingChat}
                  className="h-10 px-4 bg-black text-white border border-black rounded-lg hover:bg-gray-800 transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* AI Suggestions */}
        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <h3 className="text-sm sm:text-base font-black text-black">AI Suggestions</h3>
            <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed">
              Read-only layer — suggests matching enquiries and does not affect listings.
            </p>

            {loadingMatches && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Finding matches…</p>
              </div>
            )}

            {!loadingMatches && (!matches || matches.length === 0) && (
              <p className="text-xs text-gray-500 text-center py-4">No strong matches yet.</p>
            )}

            {!loadingMatches && matches?.map((m) => (
              <Link key={m.enquiry.id} to={`/enquiry/${m.enquiry.id}`} className="block">
                <div className="border border-black/10 rounded-xl p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-[0_2px_0_0_rgba(0,0,0,0.03)]">
                  <p className="text-xs sm:text-sm font-black text-black line-clamp-1">{m.enquiry.title ?? 'Enquiry'}</p>
                  <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-relaxed">{m.enquiry.description ?? ''}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-gray-500">
                      Match: {Math.round(m.score * 100)}%
                    </p>
                    <span className="text-[10px] font-semibold text-black underline">View</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
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

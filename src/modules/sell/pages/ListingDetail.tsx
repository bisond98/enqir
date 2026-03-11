import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getListing, listResponsesForListing, createListingResponse } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { MapPin, Tag, IndianRupee, MessageSquare } from 'lucide-react';
import { suggestEnquiriesForListing } from '../services/aiMatching';

function formatPrice(l: SellListing) {
  if (l.priceType === 'range') return `₹${l.priceMin ?? ''} - ₹${l.priceMax ?? ''}`;
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

  const submitResponse = async () => {
    if (!user || !listing) return;
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Write a short message to the seller.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await createListingResponse({
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: user.uid,
        message: message.trim(),
        offeredPrice: offeredPrice.trim() ? Number(offeredPrice) : null,
      });
      toast({ title: 'Sent', description: 'Your message was sent to the seller.' });
      setMessage('');
      setOfferedPrice('');
      const r = await listResponsesForListing(listing.id);
      setResponses(r);
    } catch {
      toast({ title: 'Failed', description: 'Could not send your message.', variant: 'destructive' });
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
        <p className="text-sm text-gray-700">Loading…</p>
      </SellShell>
    );
  }

  if (!listing || listing.status !== 'live') {
    return (
      <SellShell title="Listing">
        <p className="text-sm text-gray-700">Listing not found.</p>
      </SellShell>
    );
  }

  return (
    <SellShell title="Listing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
            <CardHeader className="font-black text-black">{listing.title}</CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
                <span className="inline-flex items-center gap-1 font-bold">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {formatPrice(listing)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {listing.category}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{listing.description}</p>
              {listing.tags?.length > 0 && (
                <p className="text-xs text-gray-700">
                  <span className="font-bold">Tags:</span> {listing.tags.join(', ')}
                </p>
              )}
              {listing.images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {listing.images.slice(0, 6).map((url) => (
                    <img key={url} src={url} alt="Listing" className="w-full h-28 object-cover rounded-xl border border-black/20" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {!isOwner && (
            <Card className="border border-black rounded-2xl">
              <CardHeader className="font-black text-black">Message Seller</CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="Optional offered price"
                  inputMode="numeric"
                />
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message…" />
                <Button className="w-full bg-black text-white border border-black font-black" onClick={submitResponse} disabled={!user || sending}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {user ? (sending ? 'Sending…' : 'Send') : 'Sign in to message'}
                </Button>
                {!user && (
                  <p className="text-xs text-gray-600">
                    Go to <Link to="/signin" className="underline font-bold">Sign in</Link> to contact the seller.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          {isOwner && (
            <Card className="border border-black rounded-2xl">
              <CardHeader className="font-black text-black">Buyer Responses</CardHeader>
              <CardContent className="space-y-2">
                {responses.length === 0 && <p className="text-sm text-gray-700">No responses yet.</p>}
                {responses.slice(0, 20).map((r) => (
                  <div key={r.id} className="border border-black/10 rounded-xl p-2">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.message}</p>
                    {r.offeredPrice != null && <p className="text-xs font-bold mt-1">Offer: ₹{r.offeredPrice}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border border-black rounded-2xl">
            <CardHeader className="font-black text-black">AI Suggestions (Optional)</CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-gray-600">
                This is a read-only layer: it only suggests matches and does not affect enquiries or listings.
              </p>
              {loadingMatches && <p className="text-sm text-gray-700">Finding matches…</p>}
              {!loadingMatches && (!matches || matches.length === 0) && <p className="text-sm text-gray-700">No strong matches yet.</p>}
              {!loadingMatches &&
                matches?.map((m) => (
                  <Link key={m.enquiry.id} to={`/enquiry/${m.enquiry.id}`} className="block">
                    <div className="border border-black/10 rounded-xl p-2 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-black text-black line-clamp-1">{m.enquiry.title ?? 'Enquiry'}</p>
                      <p className="text-[11px] text-gray-700 line-clamp-2">{m.enquiry.description ?? ''}</p>
                      <p className="text-[10px] text-gray-600 mt-1">Relevance: {Math.round(m.score * 100)}%</p>
                    </div>
                  </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </SellShell>
  );
}



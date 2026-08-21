import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Send, X, IndianRupee, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

import { toast } from '@/hooks/use-toast';
import { getListing, listResponsesForListing } from '../services/sellDb';
import type { SellListing } from '../types';

interface ChatMessage {
  id: string;
  enquiryId: string;
  sellerId: string;
  senderId: string;
  senderName?: string;
  message: string;
  timestamp: any;
  isSystemMessage?: boolean;
}

export default function ListingChat() {
  const { id, buyerId } = useParams<{ id: string; buyerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [listing, setListing] = useState<SellListing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load listing and responses
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const load = async () => {
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
    load();
  }, [id]);



  // Real-time chat messages
  useEffect(() => {
    if (!id || !buyerId) return;

    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('enquiryId', '==', `sell_listing_${id}`),
      where('sellerId', '==', buyerId)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      msgs.sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return tA - tB;
      });
      setMessages(msgs);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error('Chat listener error:', error);
    });

    return () => unsubscribe();
  }, [id, buyerId]);

  // Mark chat as read
  useEffect(() => {
    if (!id || !buyerId || !user?.uid) return;
    const threadKey = `sell_listing_${id}_${buyerId}`;
    const readKey = `chat_read_${user.uid}_${threadKey}`;
    localStorage.setItem(readKey, Date.now().toString());
    window.dispatchEvent(new CustomEvent('chatViewed', { detail: { enquiryId: `sell_listing_${id}`, sellerId: buyerId } }));
  }, [id, buyerId, user?.uid]);

  const sendMessage = async () => {
    if (!user || !id || !buyerId || !newMessage.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: `sell_listing_${id}`,
        sellerId: buyerId,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Seller',
        recipientId: buyerId,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        isSystemMessage: false,
      });
      setNewMessage('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast({ title: 'Failed', description: 'Could not send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Find buyer's response index and offered price (must be before any early return)
  const buyerResponse = useMemo(() => {
    const idx = responses.findIndex(r => r.buyerId === buyerId);
    const resp = responses.find(r => r.buyerId === buyerId);
    return { number: idx >= 0 ? idx + 1 : null, offeredPrice: resp?.offeredPrice };
  }, [responses, buyerId]);

  // Generate a short identification number for the buyer (not their real name)
  const buyerIdShort = useMemo(() => {
    if (!buyerId) return '—';
    return buyerId.slice(0, 6).toUpperCase();
  }, [buyerId]);

  if (loading) {
    return (
      <Layout showNavigation={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={false}>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 pb-20 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 p-0 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 border border-black">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-black truncate">Buyer #{buyerResponse.number || buyerIdShort}</h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{listing?.title || 'Listing'}</p>
                {buyerResponse.offeredPrice != null && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-black text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200 flex-shrink-0">
                    <IndianRupee className="h-2.5 w-2.5" />{buyerResponse.offeredPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listing Preview */}
        {listing && (
          <Link to={`/sell/listing/${listing.id}`} className="block mb-4">
            <div className="border border-black/10 rounded-xl p-3 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {listing.images && listing.images[0] && (
                  <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-black/10" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black truncate">{listing.title}</p>
                  {listing.price != null && (
                    <p className="text-[10px] font-black text-black flex items-center gap-1 mt-0.5">
                      <IndianRupee className="h-2.5 w-2.5" />₹{listing.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Chat Messages */}
        <Card className="flex-1 border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          <CardHeader className="bg-green-950 p-3 flex flex-row items-center gap-2 border-b border-black">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-black">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Chat</h3>
              <p className="text-[10px] text-green-300">with Buyer #{buyerResponse.number || buyerIdShort}</p>
            </div>
          </CardHeader>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-white min-h-0 p-3 sm:p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[250px]">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-bold text-black mb-1">Start chatting</h4>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Discuss details and negotiate with this buyer
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages.map((msg, index) => {
                  if (msg.isSystemMessage || msg.senderId === 'system') {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-2">
                        <div className="bg-red-500 border-2 border-red-600 text-white px-4 py-2 rounded-lg shadow-md">
                          <p className="text-xs font-bold text-center">{msg.message}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id || index} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-xl border-[0.5px] border-black ${
                        msg.senderId === user?.uid ? 'bg-white' : 'bg-white'
                      }`}>
                        <p className="text-sm leading-relaxed break-words text-black font-medium">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-black/10 px-3 pt-3 pb-1 bg-white">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {user?.uid === listing?.sellerId ? (
                // Seller suggestions
                <>
                  <button onClick={() => setNewMessage('Payment: 50% advance, 50% on delivery')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Payment
                  </button>
                  <button onClick={() => setNewMessage('Delivery: 3-5 days')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Delivery
                  </button>
                  <button onClick={() => setNewMessage('Bulk discounts available')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Bulk
                  </button>
                  <button onClick={() => setNewMessage('Quality guarantee included')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Quality
                  </button>
                  <button onClick={() => setNewMessage('Can we schedule a meetup to discuss details?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Meetup
                  </button>
                  <button onClick={() => setNewMessage('I sell samples for testing')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Samples
                  </button>
                </>
              ) : (
                // Buyer suggestions
                <>
                  <button onClick={() => setNewMessage('Can you provide more details about pricing?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Pricing
                  </button>
                  <button onClick={() => setNewMessage("What's the delivery timeline?")} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Timeline
                  </button>
                  <button onClick={() => setNewMessage('Can you share more images?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Images
                  </button>
                  <button onClick={() => setNewMessage('What are the payment terms?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Terms
                  </button>
                  <button onClick={() => setNewMessage('Is this still available?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Available
                  </button>
                  <button onClick={() => setNewMessage('Can we negotiate the price?')} className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-full font-normal transition-all duration-200 hover:scale-105 active:scale-95">
                    Negotiate
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-black p-3 bg-white">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message…"
                className="flex-1 h-11 border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-xl"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-11 px-5 bg-black text-white border border-black rounded-xl hover:bg-gray-800 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 font-bold"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

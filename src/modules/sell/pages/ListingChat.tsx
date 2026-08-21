import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Send, X, IndianRupee, User, Mic, MicOff, Square, Play, Pause } from 'lucide-react';
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
  attachments?: Array<{ name: string; type: string; size: number; base64?: string }>;
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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);

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

  // Voice recording functions
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlobResult = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlobResult);
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = () => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks([]);

      const timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      (recorder as any).timer = timer;
    } catch {
      toast({ title: 'Error', description: 'Could not access microphone', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if ((mediaRecorder as any).timer) clearInterval((mediaRecorder as any).timer);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioBlob(null);
      setAudioChunks([]);
      setRecordingTime(0);
      if ((mediaRecorder as any).timer) clearInterval((mediaRecorder as any).timer);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !id || !buyerId || !user) return;
    setSendingVoice(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: `sell_listing_${id}`,
        sellerId: buyerId,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        recipientId: buyerId,
        message: `🎤 Voice message (${formatRecordingTime(recordingTime)})`,
        attachments: [{ name: `voice-${Date.now()}.webm`, type: 'audio/webm', size: audioBlob.size, base64 }],
        timestamp: serverTimestamp(),
        isSystemMessage: false,
      });

      setAudioBlob(null);
      setAudioChunks([]);
      setRecordingTime(0);
    } catch {
      toast({ title: 'Error', description: 'Failed to send voice message', variant: 'destructive' });
    } finally {
      setSendingVoice(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !id || !buyerId || !newMessage.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: `sell_listing_${id}`,
        sellerId: buyerId,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        recipientId: buyerId,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        isSystemMessage: false,
      });
      setNewMessage('');
    } catch {
      toast({ title: 'Failed', description: 'Could not send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Memoized values
  const buyerResponse = useMemo(() => {
    const idx = responses.findIndex(r => r.buyerId === buyerId);
    const resp = responses.find(r => r.buyerId === buyerId);
    return { number: idx >= 0 ? idx + 1 : null, offeredPrice: resp?.offeredPrice };
  }, [responses, buyerId]);

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

        {/* Chat Card */}
        <Card className="flex-1 border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          {/* Chat Header */}
          <CardHeader className="bg-green-950 p-3 flex flex-row items-center gap-2 border-b border-black">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-black">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Chat</h3>
              <p className="text-[10px] text-green-300">with Buyer #{buyerResponse.number || buyerIdShort}</p>
            </div>
          </CardHeader>

          {/* Messages */}
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
                  // System messages
                  if (msg.isSystemMessage || msg.senderId === 'system') {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-2">
                        <div className="bg-red-500 border-2 border-red-600 text-white px-4 py-2 rounded-lg shadow-md">
                          <p className="text-xs font-bold text-center">{msg.message}</p>
                        </div>
                      </div>
                    );
                  }
                  const isOwn = msg.senderId === user?.uid;
                  const isVoice = msg.message?.includes('🎤 Voice message');
                  return (
                    <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-xl border-[0.5px] border-black bg-white`}>
                        {isVoice && msg.attachments && msg.attachments[0]?.base64 ? (
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-green-700 flex-shrink-0" />
                            <audio controls src={msg.attachments[0].base64} className="h-8 max-w-[180px]" />
                          </div>
                        ) : null}
                        <p className="text-sm leading-relaxed break-words text-black font-medium">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Voice Recording UI */}
          {isRecording && (
            <div className="mx-3 mb-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-red-700">Recording...</span>
                    <div className="text-sm text-red-600 font-mono font-bold">{formatRecordingTime(recordingTime)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full p-2 h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={stopRecording} className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full p-2 h-8 w-8">
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-red-500 text-center mt-1.5 font-medium">Tap stop when done</p>
            </div>
          )}

          {/* Voice Message Preview */}
          {audioBlob && !isRecording && (
            <div className="mx-3 mb-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Mic className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-blue-700 truncate">Voice Message</p>
                    <p className="text-xs text-blue-600 font-mono font-bold">{formatRecordingTime(recordingTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full p-2 h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={sendVoiceMessage} disabled={sendingVoice} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 h-8 w-8">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="border-t border-black/10 px-3 pt-3 pb-1 bg-white">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {user?.uid === listing?.sellerId ? (
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

          {/* Input Area */}
          <div className="border-t border-black p-3 bg-white">
            {/* Mic or Send + Text Input */}
            <div className="flex gap-2 items-center">
              {/* Mic Button */}
              {!isRecording && !audioBlob && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startRecording}
                  className="h-11 w-11 p-0 rounded-xl flex-shrink-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}

              {/* Text Input */}
              {!isRecording && !audioBlob && (
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message…"
                  className="flex-1 h-11 border border-black focus:border-2 focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-xl"
                />
              )}

              {/* Send Button (text) */}
              {!isRecording && !audioBlob && (
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-11 px-5 bg-black text-white border border-black rounded-xl hover:bg-gray-800 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 font-bold flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}

              {/* When recording or previewing voice, show placeholder */}
              {(isRecording || audioBlob) && (
                <div className="flex-1 h-11 flex items-center text-sm text-gray-400 px-3">
                  {isRecording ? 'Recording...' : 'Voice message ready'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

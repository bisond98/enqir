import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Send, X, IndianRupee, User, Mic, Square } from 'lucide-react';
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

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);

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
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [id, buyerId]);

  useEffect(() => {
    if (!id || !buyerId || !user?.uid) return;
    const threadKey = `sell_listing_${id}_${buyerId}`;
    localStorage.setItem(`chat_read_${user.uid}_${threadKey}`, Date.now().toString());
  }, [id, buyerId, user?.uid]);

  // Voice recording
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => { setAudioBlob(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); };
      recorder.onerror = () => { setIsRecording(false); stream.getTracks().forEach(t => t.stop()); };
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      const timer = setInterval(() => setRecordingTime(p => p + 1), 1000);
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
        enquiryId: `sell_listing_${id}`, sellerId: buyerId, senderId: user.uid,
        senderName: user.displayName || 'User', recipientId: buyerId,
        message: `🎤 Voice message (${formatTime(recordingTime)})`,
        attachments: [{ name: `voice-${Date.now()}.webm`, type: 'audio/webm', size: audioBlob.size, base64 }],
        timestamp: serverTimestamp(), isSystemMessage: false,
      });
      setAudioBlob(null);
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
        enquiryId: `sell_listing_${id}`, sellerId: buyerId, senderId: user.uid,
        senderName: user.displayName || 'User', recipientId: buyerId,
        message: newMessage.trim(), timestamp: serverTimestamp(), isSystemMessage: false,
      });
      setNewMessage('');
    } catch {
      toast({ title: 'Failed', description: 'Could not send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const buyerResponse = useMemo(() => {
    const idx = responses.findIndex(r => r.buyerId === buyerId);
    const resp = responses.find(r => r.buyerId === buyerId);
    return { number: idx >= 0 ? idx + 1 : null, offeredPrice: resp?.offeredPrice };
  }, [responses, buyerId]);

  const buyerIdShort = useMemo(() => buyerId ? buyerId.slice(0, 6).toUpperCase() : '—', [buyerId]);

  const suggestions = user?.uid === listing?.sellerId
    ? [
        { label: 'Payment', text: 'Payment: 50% advance, 50% on delivery' },
        { label: 'Delivery', text: 'Delivery: 3-5 days' },
        { label: 'Bulk', text: 'Bulk discounts available' },
        { label: 'Quality', text: 'Quality guarantee included' },
        { label: 'Meetup', text: 'Can we schedule a meetup to discuss details?' },
        { label: 'Samples', text: 'I sell samples for testing' },
      ]
    : [
        { label: 'Pricing', text: 'Can you provide more details about pricing?' },
        { label: 'Timeline', text: "What's the delivery timeline?" },
        { label: 'Images', text: 'Can you share more images?' },
        { label: 'Terms', text: 'What are the payment terms?' },
        { label: 'Available', text: 'Is this still available?' },
        { label: 'Negotiate', text: 'Can we negotiate the price?' },
      ];

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
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-black/10 flex-shrink-0 safe-area-top">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0 flex-shrink-0 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-black truncate">Buyer #{buyerResponse.number || buyerIdShort}</h2>
              {buyerResponse.offeredPrice != null && (
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200 flex-shrink-0">
                  <IndianRupee className="h-2 w-2" />{buyerResponse.offeredPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {listing && (
              <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">{listing.title}</p>
            )}
          </div>
          {listing && (
            <Link to={`/sell/listing/${listing.id}`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-gray-500 hover:text-black flex-shrink-0">
                View Listing
              </Button>
            </Link>
          )}
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-7 w-7 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-black mb-1">Start chatting</h4>
                <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                  Discuss details and negotiate with this buyer
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => {
                if (msg.isSystemMessage || msg.senderId === 'system') {
                  return (
                    <div key={msg.id || index} className="flex justify-center my-2">
                      <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md">
                        {msg.message}
                      </div>
                    </div>
                  );
                }
                const isOwn = msg.senderId === user?.uid;
                const isVoice = msg.message?.includes('🎤 Voice message');
                return (
                  <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-black text-white rounded-br-md'
                        : 'bg-white text-black border border-black/10 rounded-bl-md shadow-sm'
                    }`}>
                      {isVoice && msg.attachments?.[0]?.base64 ? (
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className={`h-3.5 w-3.5 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-gray-500'}`} />
                          <audio controls src={msg.attachments[0].base64} className="h-7 max-w-[160px]" />
                        </div>
                      ) : null}
                      <p className={`text-[13px] leading-relaxed break-words ${isOwn ? 'text-white' : 'text-black'}`}>{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Voice Recording Bar */}
        {isRecording && (
          <div className="mx-3 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-xs font-semibold text-red-700">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={cancelRecording} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full">
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={stopRecording} className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full">
                <Square className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Voice Preview */}
        {audioBlob && !isRecording && (
          <div className="mx-3 mb-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Mic className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-700">Voice message · {formatTime(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-100 rounded-full">
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={sendVoiceMessage} disabled={sendingVoice} className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!isRecording && !audioBlob && (
          <div className="px-3 pb-1.5 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setNewMessage(s.text)}
                  className="flex-shrink-0 px-3 py-1.5 text-[10px] sm:text-[11px] bg-green-950 hover:bg-green-900 text-white border border-black/20 rounded-full font-medium transition-all active:scale-95"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        {!isRecording && !audioBlob && (
          <div className="px-3 pb-3 pt-1 bg-white border-t border-black/5 flex-shrink-0 safe-area-bottom">
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={startRecording}
                className="h-10 w-10 p-0 rounded-full flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message…"
                className="flex-1 h-10 bg-gray-100 border-0 focus:border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-full px-4"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-10 w-10 p-0 bg-black text-white border-0 rounded-full hover:bg-gray-800 transition-all flex-shrink-0 disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

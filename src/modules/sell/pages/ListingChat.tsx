import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageSquare, Send, X, IndianRupee, User, Mic, Square, Phone, Settings, Paperclip, Image, File } from 'lucide-react';
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
  attachments?: Array<{ name: string; type: string; size?: number; base64?: string }>;
}

export default function ListingChat() {
  const { id, buyerId } = useParams<{ id: string; buyerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listing, setListing] = useState<SellListing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = Object.assign(blob, { name: file.name, lastModified: Date.now() }) as File;
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const load = async () => {
      try {
        const l = await getListing(id);
        setListing(l);
        const r = await listResponsesForListing(id);
        setResponses(r);
      } catch { }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id || !buyerId) return;
    const q = query(collection(db, 'chatMessages'), where('enquiryId', '==', `sell_listing_${id}`));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))
        .filter(m => (m.sellerId === buyerId || m.recipientId === buyerId))
        .sort((a, b) => {
          const tA = a.timestamp?.toDate?.() || new Date(0);
          const tB = b.timestamp?.toDate?.() || new Date(0);
          return tA.getTime() - tB.getTime();
        });
      setMessages(msgs);
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight }), 100);
    });
    return () => unsub();
  }, [id, buyerId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
        toast({ title: 'Error', description: 'Recording failed', variant: 'destructive' });
      };
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch {
      toast({ title: 'Microphone access denied', variant: 'destructive' });
    }
  };

  const cancelRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !id || !buyerId || !user?.uid) return;
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
        senderType: user.uid === listing?.sellerId ? 'seller' : 'buyer',
        message: '🎤 Voice message', timestamp: serverTimestamp(), isSystemMessage: false,
        attachments: [{ name: `voice-${Date.now()}.webm`, type: 'audio/webm', size: audioBlob.size, base64 }],
      });
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Voice send error:', err);
      toast({ title: 'Failed', description: 'Could not send voice.', variant: 'destructive' });
    } finally {
      setSendingVoice(false);
    }
  };

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || !mediaRecorder) return;
    const timer = setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 60000);
    return () => clearTimeout(timer);
  }, [isRecording, mediaRecorder]);

  const sendMessage = async () => {
    if (!user || !id || !buyerId || (!newMessage.trim() && attachments.length === 0)) return;
    setSending(true);
    try {
      const attachmentData = attachments.length > 0 ? await Promise.all(attachments.map(async (file) => {
        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }
        return new Promise<{ name: string; type: string; base64: string } | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: processedFile.name, type: processedFile.type, base64: reader.result as string });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(processedFile);
        });
      })) : [];
      const validAttachments = attachmentData.filter(a => a !== null);

      await addDoc(collection(db, 'chatMessages'), {
        enquiryId: `sell_listing_${id}`, sellerId: buyerId, senderId: user.uid,
        senderName: user.displayName || 'User', recipientId: buyerId,
        senderType: user.uid === listing?.sellerId ? 'seller' : 'buyer',
        message: newMessage.trim() || (validAttachments.length > 0 ? '📎' : ''),
        timestamp: serverTimestamp(), isSystemMessage: false,
        attachments: validAttachments,
      });

      setNewMessage('');
      setAttachments([]);
    } catch (err) {
      console.error('Send message error:', err);
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
        { label: 'Payment', text: 'What are the payment terms?' },
        { label: 'Delivery', text: "What's the delivery timeline?" },
        { label: 'Bulk', text: 'Do you offer bulk pricing?' },
        { label: 'Quality', text: 'Can you share more images?' },
        { label: 'Meetup', text: 'Can we meet in person to discuss?' },
        { label: 'Samples', text: 'Do you have samples I can check?' },
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Black Header - Matches EnquiryResponses exactly */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate(-1)}
                  className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
                <div className="w-10 h-10"></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 gap-2 sm:gap-2.5">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 rounded-full" />
                Chat.
              </h1>
            </div>

            <div className="bg-black rounded-lg p-3 sm:p-4 lg:p-5">
              <div className="bg-black border border-black rounded-lg p-3 sm:p-4 lg:p-5">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-tight px-1 text-center">
                      {listing?.title || 'Listing'}
                    </h3>
                  </div>
                  <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    <p className="text-[10px] sm:text-[12px] text-white font-medium">Total Responses - 1</p>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pt-2 border-t-2 border-black">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-[8px] sm:text-[10px] text-white font-medium mb-0.5">Buyer's Budget</div>
                        <div className="text-[10px] sm:text-sm font-bold text-white truncate">{listing ? `₹${listing.price.toLocaleString('en-IN')}` : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 justify-end">
                      <div className="text-right min-w-0 flex-1">
                        <div className="text-[8px] sm:text-[10px] text-white font-medium mb-0.5">Location</div>
                        <div className="text-[10px] sm:text-sm font-bold text-white truncate">{listing?.location || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section - Exact same dimensions as EnquiryResponses */}
        <div className="max-w-[98vw] sm:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[99vw] mx-auto px-0.5 sm:px-1 lg:px-4 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col">
            <div className="w-full min-h-0">
              <Card className="border border-black shadow-sm h-[calc(100vh-100px)] sm:h-[calc(100vh-200px)] lg:h-[750px] xl:h-[800px] flex flex-col bg-white overflow-hidden" style={{ width: '100%', borderWidth: '0.5px' }}>
                {/* Green Header - Matches EnquiryResponses */}
                <CardHeader className="pb-2 sm:pb-2 lg:pb-2.5 bg-green-950 p-2 sm:p-2 lg:p-2.5 overflow-visible relative" style={{ borderBottom: '0.5px solid black' }}>
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:text-white hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-md transition-colors duration-200 flex-shrink-0">
                      <X className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 relative">
                    <div className="flex items-center space-x-1 sm:space-x-2.5 lg:space-x-3 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-[0.5px] border-black">
                        <MessageSquare className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5 text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-0 sm:gap-2 flex-nowrap">
                          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-white">Chat</h2>
                          <span className="text-xs sm:text-sm text-white font-medium whitespace-nowrap ml-0.5 sm:ml-0">with</span>
                          <span className="text-xs sm:text-sm lg:text-base font-bold text-white whitespace-nowrap">Buyer</span>
                          <span className="text-xs sm:text-sm text-white font-medium">#{buyerResponse.number || '1'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-2 lg:mt-2.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-black bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                      #Response {buyerResponse.number || '1'}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-white hover:bg-white/10 rounded-md flex-shrink-0">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:text-white hover:bg-white/10 rounded-md flex-shrink-0">
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Offer Bar */}
                {buyerResponse.offeredPrice != null && (
                  <div className="bg-green-900 px-4 py-2.5 text-center" style={{ borderTop: '0.5px solid rgba(0,0,0,0.2)' }}>
                    <span className="text-xs sm:text-sm font-bold text-white">Offer - ₹{buyerResponse.offeredPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Chat Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-white min-h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5 lg:mb-3">
                          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-slate-500" />
                        </div>
                        <h4 className="text-xs sm:text-sm lg:text-base font-bold text-black mb-1.5 sm:mb-2 lg:mb-2.5">Start chatting</h4>
                        <p className="text-black font-medium text-[10px] sm:text-xs lg:text-sm max-w-sm mx-auto px-3 sm:px-4 lg:px-5">
                          Begin discussing details and negotiating with this seller
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4 lg:py-5 space-y-2 sm:space-y-2.5 lg:space-y-3">
                      {messages.map((msg, index) => {
                        if (msg.isSystemMessage || msg.senderId === 'system') {
                          return (
                            <div key={msg.id || index} className="flex justify-center my-1.5 sm:my-2 lg:my-3">
                              <div className="bg-red-500 border-2 border-red-600 text-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-lg shadow-md">
                                <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-center">{msg.message}</p>
                              </div>
                            </div>
                          );
                        }
                        const isOwn = msg.senderId === user?.uid;
                        return (
                          <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[75%] sm:max-w-[70%] lg:max-w-[65%] px-3 sm:px-3.5 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl relative border-[0.5px] border-black bg-white text-black">
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-2 space-y-2">
                                  {msg.attachments.map((att, i) => (
                                    <div key={i}>
                                      {att.type?.startsWith('image/') && att.base64 ? (
                                        <img src={att.base64} alt={att.name} className="max-w-[200px] max-h-[200px] rounded-lg object-cover" />
                                      ) : att.type?.startsWith('audio/') && att.base64 ? (
                                        <audio controls src={att.base64} className="h-7 max-w-[160px]" />
                                      ) : (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                                          <File className="h-4 w-4 text-slate-600" />
                                          <span className="text-xs truncate">{att.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.message && msg.message !== '📎' ? (
                                <p className="text-sm sm:text-base lg:text-lg leading-relaxed break-words text-black font-medium">{msg.message}</p>
                              ) : msg.attachments && msg.attachments.length > 0 ? (
                                <p className="text-xs text-gray-400 text-right">✓</p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Area - Suggestions + Input - Matches EnquiryResponses */}
                <div className="border-t border-gray-800 bg-white">
                  <div className="p-2.5 sm:p-2 lg:p-2.5">
                    {/* Suggestions */}
                    <div className="flex items-center gap-2 sm:gap-2 lg:gap-2 mb-2 sm:mb-2.5 lg:mb-3 overflow-x-auto pb-2 sm:pb-2.5 lg:pb-3 px-2 sm:px-0 -mx-1.5 sm:mx-0 scrollbar-hide">
                      {suggestions.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setNewMessage(s.text)}
                          className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 text-[8px] sm:text-[9px] lg:text-[10px] bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-xl font-normal min-touch transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                          <span className="relative z-10">{s.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Attachment Preview */}
                    {attachments.length > 0 && (
                      <div className="mb-2 sm:mb-2.5 lg:mb-3 p-2 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-black">Attachments ({attachments.length})</span>
                          <Button variant="ghost" size="sm" onClick={() => setAttachments([])} className="text-xs h-6 px-2">Clear All</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white rounded-md border p-2 text-xs relative">
                              {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt="" className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                  <File className="h-4 w-4 text-slate-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-slate-700">{file.name}</p>
                                <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="h-5 w-5 p-0 text-slate-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voice Recording UI (shown when audioBlob exists after recording) */}
                    {audioBlob && !isRecording && (
                      <div className="mb-2 sm:mb-2.5 lg:mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-700">
                              Voice message ({formatTime(recordingTime)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-red-600 hover:text-red-700 hover:bg-red-100 text-xs h-8 px-3">
                              Cancel
                            </Button>
                            <Button onClick={sendVoiceMessage} disabled={sendingVoice} className="bg-green-950 hover:bg-green-900 text-white text-xs h-8 px-3 rounded-lg">
                              {sendingVoice ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-700">Recording {formatTime(recordingTime)}</span>
                        <Button variant="ghost" size="sm" onClick={stopRecording} className="ml-auto text-red-600 text-xs h-6 px-2">Stop</Button>
                      </div>
                    )}

                    {/* Input Bar */}
                    {!audioBlob && !isRecording && (
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startRecording}
                          className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full flex-shrink-0 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                        >
                          <Mic className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                        </Button>
                        <div className="relative">
                          <Button variant="ghost" size="sm" onClick={() => setShowAttachmentOptions(!showAttachmentOptions)} className="h-10 w-10 sm:h-11 sm:w-11 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                            <Paperclip className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                          </Button>
                          {showAttachmentOptions && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-10">
                              <div className="flex flex-col space-y-1">
                                <button onClick={() => { imageInputRef.current?.click(); }} className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-slate-50 rounded cursor-pointer">
                                  <Image className="h-4 w-4 text-green-600" />
                                  <span>Image</span>
                                </button>
                                <button onClick={() => { fileInputRef.current?.click(); }} className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-slate-50 rounded cursor-pointer">
                                  <File className="h-4 w-4 text-slate-600" />
                                  <span>File</span>
                                </button>
                              </div>
                            </div>
                          )}
                          <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={(e) => { setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]); setShowAttachmentOptions(false); if (imageInputRef.current) imageInputRef.current.value = ''; }} className="hidden" />
                          <input ref={fileInputRef} type="file" multiple onChange={(e) => { setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]); setShowAttachmentOptions(false); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hidden" />
                        </div>
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            className="resize-none border border-gray-800 focus-visible:border-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg sm:rounded-xl px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 pr-12 sm:pr-14 lg:pr-16 text-base sm:text-base lg:text-lg min-touch placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-500"
                          />
                        </div>
                        <Button onClick={sendMessage} disabled={(!newMessage.trim() && attachments.length === 0) || sending} className="h-10 w-10 sm:h-11 sm:w-11 p-0 bg-green-950 hover:bg-green-900 text-white border-[0.5px] border-black rounded-xl transition-all flex-shrink-0 disabled:opacity-30 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] relative overflow-hidden group/sendbtn">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/sendbtn:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                          <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5 relative z-10" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

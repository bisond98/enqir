import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { MapPin, Calendar, IndianRupee, MessageSquare, ChevronLeft, ChevronRight, X, Send, UserCircle, ArrowLeft, Sparkles, CheckCircle, Mic, Paperclip, Play, Pause, AlertTriangle, Bookmark } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { suggestEnquiriesForListing } from '../services/aiMatching';
import { processPayment } from '@/services/paymentService';
import { PAYMENT_PLANS } from '@/config/paymentPlans';
import { uploadToCloudinaryAuto } from '@/integrations/cloudinary';


function formatPrice(l: SellListing) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (l.priceType === 'range') return `₹${fmt(l.priceMin ?? 0)} – ₹${fmt(l.priceMax ?? 0)}`;
  return l.price ? `₹${fmt(l.price)}` : '₹—';
}

function formatPostedDate(dateString: any): string {
  try {
    let date: Date;
    if (dateString?.toDate && typeof dateString.toDate === 'function') {
      date = dateString.toDate();
    } else if (dateString?.seconds !== undefined) {
      date = new Date(dateString.seconds * 1000 + (dateString.nanoseconds || 0) / 1000000);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string' || typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return '';
    }
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
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
  const [saved, setSaved] = useState(false);

  // Load initial saved state and toggle saved listings in profiles.savedListings (same pattern as savedEnquiries)
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    getDoc(doc(db, 'profiles', user.uid)).then(snap => {
      if (!cancelled) {
        const ids: string[] = snap.data()?.savedListings || [];
        setSaved(ids.includes(id));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid, id]);

  const toggleSave = async () => {
    if (!user || !id) { setSaved(v => !v); return; }
    const next = !saved;
    setSaved(next);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), next
        ? { savedListings: arrayUnion(id) }
        : { savedListings: arrayRemove(id) }
      );
    } catch (err) {
      console.error('Failed to update saved listings:', err);
      setSaved(!next);
    }
  };
  const [paymentDone, setPaymentDone] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [responsePage, setResponsePage] = useState(0);
  const RESPONSES_PER_PAGE = 5;
  const [searchParams] = useSearchParams();
  const targetBuyerId = searchParams.get('buyer');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedPreviews, setAttachedPreviews] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fileUploadProgresses, setFileUploadProgresses] = useState<number[]>([]);
  const [voiceUploadProgress, setVoiceUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Scroll to the targeted buyer response after loading
  useEffect(() => {
    if (targetBuyerId && responses.length > 0) {
      // Find which page the target response is on and navigate there first
      const targetIndex = responses.findIndex(r => r.buyerId === targetBuyerId);
      if (targetIndex >= 0) {
        const targetPage = Math.floor(targetIndex / RESPONSES_PER_PAGE);
        setResponsePage(targetPage);
      }
      // Wait for page to render, then scroll
      const timer = setTimeout(() => {
        const el = document.getElementById(`response-${targetBuyerId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [targetBuyerId, responses]);

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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoicePreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access to record voice messages.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const playPauseVoice = () => {
    if (!voicePreviewUrl) return;
    if (isPlayingVoice) {
      voiceAudioRef.current?.pause();
      setIsPlayingVoice(false);
    } else {
      const audio = new Audio(voicePreviewUrl);
      voiceAudioRef.current = audio;
      audio.onended = () => setIsPlayingVoice(false);
      audio.play();
      setIsPlayingVoice(true);
    }
  };

  const clearVoice = () => {
    setVoiceBlob(null);
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoicePreviewUrl(null);
    setRecordingTime(0);
    setIsPlayingVoice(false);
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // File attachment functions
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachedFiles.length + files.length > 5) {
      toast({ title: 'Max 5 files', description: 'You can attach up to 5 files only.', variant: 'destructive' });
    }
    const allowed = files.slice(0, 5 - attachedFiles.length);
    setAttachedFiles(prev => [...prev, ...allowed]);
    // Generate previews for images
    allowed.forEach(f => {
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        setAttachedPreviews(prev => [...prev, url]);
      } else {
        setAttachedPreviews(prev => [...prev, '']);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = (index: number) => {
    if (attachedPreviews[index]) URL.revokeObjectURL(attachedPreviews[index]);
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setAttachedPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const submitResponse = async () => {
    if (!user || !listing) {
      toast({ title: 'Sign in required', description: 'Please sign in to message the seller.', variant: 'destructive' });
      return;
    }
    const hasContent = message.trim() || offeredPrice.trim() || voiceBlob || attachedFiles.length > 0;
    if (!hasContent) {
      toast({ title: "Input required", description: "Enter a message, price, voice note, or attachment.", variant: "destructive" });
      return;
    }
    setSending(true);
    setUploadingMedia(true);
    setPaymentDone(false);
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

      // Payment confirmed — warn the buyer not to press back while we upload/send
      setPaymentDone(true);

      // Upload voice note to Cloudinary (only if present)
      let voiceUrl: string | undefined;
      if (voiceBlob && voiceBlob.size > 0) {
        setVoiceUploadProgress(10);
        const voiceInterval = setInterval(() => {
          setVoiceUploadProgress(prev => prev < 90 ? prev + Math.floor(Math.random() * 15) + 5 : prev);
        }, 200);
        const voiceFile = new File([voiceBlob], 'voice-note.webm', { type: 'audio/webm' });
        voiceUrl = await uploadToCloudinaryAuto(voiceFile);
        clearInterval(voiceInterval);
        setVoiceUploadProgress(100);
      }

      // Upload attached files to Cloudinary (only if present)
      const attachments: { url: string; name: string; type: string }[] = [];
      if (attachedFiles.length > 0) {
        setFileUploadProgresses(attachedFiles.map(() => 0));
        for (let i = 0; i < attachedFiles.length; i++) {
          const f = attachedFiles[i];
          // Simulate progress
          const progressInterval = setInterval(() => {
            setFileUploadProgresses(prev => {
              const next = [...prev];
              if (next[i] < 90) next[i] = next[i] + Math.floor(Math.random() * 15) + 5;
              return next;
            });
          }, 200);
          const url = await uploadToCloudinaryAuto(f);
          clearInterval(progressInterval);
          setFileUploadProgresses(prev => {
            const next = [...prev];
            next[i] = 100;
            return next;
          });
          attachments.push({ url, name: f.name, type: f.type });
        }
        setTimeout(() => setFileUploadProgresses([]), 1000);
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
        voiceUrl,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      console.log('✅ Listing response sent successfully');
      toast({ title: 'Sent', description: 'Your message was sent to the seller.' });
      setMessage('');
      setOfferedPrice('');
      clearVoice();
      setAttachedFiles([]);
      setAttachedPreviews([]);
      setFileUploadProgresses([]);
      setVoiceUploadProgress(0);
      navigate(`/sell/listing/${listing.id}/chat/${user.uid}`);
    } catch (err: any) {
      console.error('❌ Failed to send listing response:', err.code, err.message);
      toast({ title: 'Failed', description: err.message || 'Could not send your message.', variant: 'destructive' });
    } finally {
      setSending(false);
      setUploadingMedia(false);
      setPaymentDone(false);
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
      {paymentDone && sending && createPortal(
        <div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-50">
          <LoadingAnimation message="Creating Chat Room" showBackButton={false} className="min-h-screen" />
          {/* Warning — bottom centre, animated icon */}
          <div className="fixed inset-x-0 bottom-5 sm:bottom-8 flex items-center justify-center pointer-events-none">
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 py-1.5">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0 animate-bounce drop-shadow-[0_2px_4px_rgba(220,38,38,0.4)]" />
              <span className="text-base sm:text-2xl font-black text-black tracking-wide">Do not press back</span>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div className="space-y-4 pb-6">
        {/* Unified Listing Card — image + details in one bordered card */}
        <div className="relative border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 && (
          <div className="relative">
            <div className="relative w-full h-56 sm:h-72 lg:h-80 overflow-hidden bg-gray-100">
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
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border transition-all ${
                      idx === activeImage ? 'border-black shadow-[0_3px_0_0_rgba(0,0,0,0.2)]' : 'border-black/20 opacity-60'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listing Details — inside the same unified card */}
        <div className="relative">
          {sellerProfile?.isProfileVerified && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]"><CheckCircle className="h-4 w-4 text-white" /></span>
          )}
          <div className="p-4 sm:p-5">
            {/* Title */}
            <div className="w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">{listing.title}</h2>
            </div>

            {/* Amount + Info Chips on one row — amount right side next to location etc */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 sm:mt-3">
              <span className="bg-black text-white border border-black font-black text-xs sm:text-sm rounded-xl px-2.5 py-1 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] inline-flex items-center">₹ {listing.price != null ? listing.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</span>

              {listing.condition && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-white text-black border border-black px-2.5 py-1 rounded-xl uppercase shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                  {listing.condition}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-white text-black border border-black px-2.5 py-1 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                <MapPin className="h-3 w-3 text-black" />{listing.location}
              </span>
              {formatPostedDate(listing.createdAt) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-white text-black border border-black px-2 py-1 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                  <Calendar className="h-2.5 w-2.5 flex-shrink-0" />Posted on {formatPostedDate(listing.createdAt)}
                </span>
              )}
              {listing.tags && listing.tags.length > 0 && (
                listing.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-black bg-white text-black border border-black px-2.5 py-1 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                    {tag}
                  </span>
                ))
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="border-t border-gray-100 pt-3 mb-3 mt-3">
                <p className="text-[13px] text-black whitespace-pre-wrap leading-relaxed font-bold">{listing.description}</p>
              </div>
            )}

              {chatUnlocked && (
                <div className="sm:hidden mt-4 w-full flex justify-center">
                  <Button
                    variant="outline"
                    className="relative !h-14 !text-lg !font-black !bg-green-600 hover:!bg-green-700 !text-white !rounded-2xl !border-[0.5px] !border-green-700 !shadow-[0_8px_0_0_rgba(22,163,74,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_8px_0_0_rgba(22,163,74,0.35),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(22,163,74,0.3)] active:!translate-y-[4px] !transition-all !duration-200 !transform !relative !overflow-hidden group"
                    onClick={() => navigate(`/sell/listing/${listing.id}/chat/${user?.uid}`)}
                  >
                    <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                    <MessageSquare className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">Continue Messaging</span>
                  </Button>
                </div>
              )}
              <div className="w-full flex items-center justify-between mt-4 mb-0.5 gap-2">
                <button
                  onClick={toggleSave}
                  aria-label={saved ? 'Remove from saved' : 'Save listing'}
                  className={`p-1 rounded-lg transition-all active:scale-95 ${saved ? 'text-black hover:bg-gray-100' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-black text-black' : 'text-gray-600'}`} />
                </button>
                <span className="ml-auto"><ShareButton listing={listing} /></span>
              </div>
            </div>

          </div>
        </div>

        {/* Message Seller Card */}
        {!isOwner && (chatUnlocked ? (
          <>
            {/* Desktop: keep the card + Your Chat header */}
            <div className="hidden sm:block border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
              <div className="bg-black p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">Your Chat
                  {sellerProfile?.isProfileVerified && (
                    <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-500"><CheckCircle className="h-1.5 w-1.5 text-white" /></span>
                  )}
                </h3>
                <IndianRupee className="h-3.5 w-3.5 text-white/70 ml-auto" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <Button
                variant="outline"
                className="relative w-full !h-14 !text-lg !font-black !bg-green-600 hover:!bg-green-700 !text-white !rounded-2xl !border-[0.5px] !border-green-700 !shadow-[0_8px_0_0_rgba(22,163,74,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_8px_0_0_rgba(22,163,74,0.35),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(22,163,74,0.3)] active:!translate-y-[4px] !transition-all !duration-200 !transform !relative !overflow-hidden group"
                onClick={() => navigate(`/sell/listing/${listing.id}/chat/${user?.uid}`)}
              >
                <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                <MessageSquare className="h-4 w-4 mr-2 relative z-10" />
                <span className="relative z-10">Continue Messaging</span>
              </Button>
            </div>
          </div>
        </>
        ) : (
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
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message to the seller…"
                    maxLength={250}
                    rows={3}
                    className="text-sm border-[1.5px] border-black rounded-xl min-h-[90px] bg-gradient-to-br from-white to-slate-50/50 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] focus:border-[4px] focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 placeholder:text-[10px] resize-none pr-20"
                  />
                  {/* Voice & Attach icons — right side */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      title={isRecording ? 'Stop recording' : 'Record voice message'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={attachedFiles.length >= 5}
                      title={`Attach files (${attachedFiles.length}/5)`}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileAttach}
                  />
                </div>
                {/* Voice preview */}
                {voicePreviewUrl && (
                  <div className="mt-2 p-2 rounded-xl border-[1.5px] border-black/20 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playPauseVoice}
                        className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0"
                      >
                        {isPlayingVoice ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                      </button>
                      <span className="text-[11px] font-bold text-gray-600">Voice note ({formatRecordingTime(recordingTime)})</span>
                      <button type="button" onClick={clearVoice} className="ml-auto text-red-500 hover:text-red-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {uploadingMedia && voiceUploadProgress > 0 && voiceUploadProgress < 100 && (
                      <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-black h-1.5 rounded-full transition-all duration-200" style={{ width: `${voiceUploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}
                {/* Attached file previews */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachedFiles.map((f, i) => (
                      <div key={i} className="relative group flex flex-col">
                        {attachedPreviews[i] ? (
                          <img src={attachedPreviews[i]} alt={f.name} className="w-14 h-14 object-cover rounded-lg border border-black/10" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg border border-black/10 bg-gray-50 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-gray-500 text-center px-1 truncate w-full">{f.name.split('.').pop()?.toUpperCase()}</span>
                          </div>
                        )}
                        {uploadingMedia && fileUploadProgresses[i] !== undefined && fileUploadProgresses[i] < 100 && (
                          <div className="w-14 bg-gray-200 rounded-full h-1 mt-0.5">
                            <div className="bg-black h-1 rounded-full transition-all duration-200" style={{ width: `${fileUploadProgresses[i]}%` }} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="relative w-full !h-14 !text-lg !font-black !bg-green-600 hover:!bg-green-700 !text-white !rounded-2xl !border-[0.5px] !border-green-700 !shadow-[0_8px_0_0_rgba(22,163,74,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_8px_0_0_rgba(22,163,74,0.35),inset_0_-2px_4px_rgba(0,0,0,0.06)] active:!shadow-[0_2px_0_0_rgba(22,163,74,0.3)] active:!translate-y-[4px] !transition-all !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed !transform !relative !overflow-hidden group"
                onClick={() => { if (user) { submitResponse(); } else { sessionStorage.setItem('returnAfterSignIn', window.location.pathname + '#message-seller'); navigate('/signin'); } }}
                disabled={sending}
              >
                <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                <Send className="h-4 w-4 mr-2 relative z-10" />
                <span className="relative z-10">{user ? (sending ? 'Sending…' : 'Connect') : 'Sign in to message'}</span>
              </Button>
            </div>
          </div>
        ))}

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
                  id={`response-${r.buyerId}`}
                  className={`block border rounded-xl p-3 hover:bg-gray-50 transition-all shadow-[0_2px_0_0_rgba(0,0,0,0.05)] ${r.buyerId === targetBuyerId ? 'border-black border-2 bg-yellow-50' : 'border-black/10'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{r.buyerName || 'Buyer'}</p>
                      <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">{r.message}</p>
                      {r.offeredPrice != null && (
                        <span className="inline-flex items-center gap-0.5 text-sm font-black text-black mt-1.5">
                          <IndianRupee className="h-3.5 w-3.5" />{r.offeredPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 mt-3 w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5 text-white" /></span>
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

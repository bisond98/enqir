import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Heart, Bell, BellOff, ArrowLeft, Search, X, Check, Tag, Megaphone, MapPin, SlidersHorizontal, ChevronDown, Plus, Type } from "lucide-react";
import { getCategoryIcon } from "@/constants/categoryIcons";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query as fsQuery, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { listMarketplace } from "@/modules/sell/services/sellDb";
import type { SellListing } from "@/modules/sell/types";
import { APP_CATEGORIES } from "@/constants/categories";
import { toast } from "@/hooks/use-toast";

// Popular categories shown first, same as the sell/enquiry pickers
const POPULAR_VALUES = ['electronics', 'mobiles', 'car', 'bike', 'laptops', 'furniture', 'home', 'fashion', 'vehicles', 'automobile'];

const orderedCategories = [
  ...APP_CATEGORIES.filter(c => POPULAR_VALUES.includes(c.value)),
  ...APP_CATEGORIES.filter(c => !['business', 'personal', 'service', ...POPULAR_VALUES].includes(c.value)),
];

// No cap — users can like as many categories as they want
// Max custom keywords a user can follow
const MAX_KEYWORDS = 10;
// Max characters per keyword
const MAX_KEYWORD_LENGTH = 20;

interface LikesSettings {
  categories: string[];
  keywords: string[];
  notifyListings: boolean;
  notifyEnquiries: boolean;
}

interface FeedEnquiry {
  id: string;
  title: string;
  category: string;
  categories?: string[];
  budget: string;
  location: string;
  status: string;
  deadline?: any;
  createdAt?: any;
}

const DEFAULTS: LikesSettings = { categories: [], notifyListings: true, notifyEnquiries: true };

// Enquiry is live = no deadline passed (same rule as the Live Enquiries wall)
const isEnquiryLive = (e: FeedEnquiry): boolean => {
  try {
    let d: Date | null = null;
    if (e.deadline?.toDate && typeof e.deadline.toDate === 'function') d = e.deadline.toDate();
    else if (e.deadline?.seconds !== undefined) d = new Date(e.deadline.seconds * 1000 + (e.deadline.nanoseconds || 0) / 1000000);
    else if (e.deadline instanceof Date) d = e.deadline;
    else if (e.deadline) d = new Date(e.deadline);
    if (!d || isNaN(d.getTime())) return true;
    return d.getTime() >= Date.now();
  } catch { return true; }
};

const inLikedCats = (cats: string[], primary?: string, all?: string[]): boolean => {
  const list = Array.isArray(all) && all.length ? all : (primary ? [primary] : []);
  return list.some(c => cats.includes(c));
};

// Case-insensitive keyword match against a post's title, description, tags, category and location
const matchesKeyword = (kw: string, post: { title?: string; description?: string; tags?: string[]; category?: string; location?: string }): boolean => {
  const k = kw.trim().toLowerCase();
  if (!k) return false;
  const hay = [
    post.title,
    post.description,
    post.category,
    post.location,
    ...(Array.isArray(post.tags) ? post.tags : []),
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(k);
};

const MyLikes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  // Pending (unsaved) keyword edits — parallel to pending category selection
  const [pendingKeywords, setPendingKeywords] = useState<string[] | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [notifyListings, setNotifyListings] = useState(true);
  const [notifyEnquiries, setNotifyEnquiries] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string[] | null>(null);
  // Feed: live listings + enquiries from the liked categories
  const [feedListings, setFeedListings] = useState<SellListing[]>([]);
  const [feedEnquiries, setFeedEnquiries] = useState<FeedEnquiry[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  // Dropdown open state — stays open while tapping categories
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click (but NOT when selecting categories inside it)
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const d = snap.data() as any;
        setLiked(Array.isArray(d?.likedCategories) ? d.likedCategories : []);
        setKeywords(Array.isArray(d?.likedKeywords) ? d.likedKeywords : []);
        setNotifyListings(d?.likedNotifyListings !== false);
        setNotifyEnquiries(d?.likedNotifyEnquiries !== false);
      } catch (e) {
        console.error('Failed to load likes:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const loadFeed = useCallback(async (cats: string[], kws: string[]) => {
    if (cats.length === 0 && kws.length === 0) { setFeedListings([]); setFeedEnquiries([]); return; }
    setFeedLoading(true);
    try {
      const [listings, enqSnap] = await Promise.all([
        listMarketplace({}),
        getDocs(fsQuery(collection(db, 'enquiries'), where('status', '==', 'live'))),
      ]);
      const matchListing = (l: any) => inLikedCats(cats, l.category, l.categories) || kws.some(kw => matchesKeyword(kw, l));
      const matchEnquiry = (e: any) => (inLikedCats(cats, e.category, e.categories) || kws.some(kw => matchesKeyword(kw, e))) && isEnquiryLive(e);
      setFeedListings(listings.filter(matchListing));
      const enqs = enqSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as FeedEnquiry[];
      setFeedEnquiries(enqs.filter(matchEnquiry));
    } catch (err) {
      console.error('Failed to load liked-category feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Load the feed once likes are loaded from Firestore
  useEffect(() => {
    if (!loading) loadFeed(liked, keywords);
  }, [loading, liked, keywords, loadFeed]);

  // REAL-TIME: live listeners on listings + enquiries — the feed updates itself
  // and a badge count is broadcast to the header Likes icon when new posts appear.
  useEffect(() => {
    if (!user?.uid) return;

    // Track seen post ids so we can detect "new" arrivals and bump the badge
    const seenListings = new Set<string>();
    const seenEnquiries = new Set<string>();
    const newUnreadListings = { current: 0 };
    const newUnreadEnquiries = { current: 0 };
    let firstListingsSnapshot = true;
    let firstEnquiriesSnapshot = true;

    const notifyFeedUpdate = () => {
      const count = (firstListingsSnapshot ? 0 : newUnreadListings.current)
        + (firstEnquiriesSnapshot ? 0 : newUnreadEnquiries.current);
      window.dispatchEvent(new CustomEvent('likesFeedUpdated', { detail: { newCount: count } }));
    };

    const listingsUnsub = onSnapshot(
      fsQuery(collection(db, 'sell_listings'), where('status', '==', 'live')),
      (snap) => {
        let added = 0;
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const l = { id: change.doc.id, ...(change.doc.data() as any) } as SellListing;
            if (!firstListingsSnapshot && !seenListings.has(l.id) && (inLikedCats(liked, l.category, (l as any).categories) || keywords.some(kw => matchesKeyword(kw, l as any)))) {
              added++;
            }
            seenListings.add(l.id);
          }
        });
        // Refresh feed with the newest live listings matching liked categories or keywords
        const live = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SellListing[];
        setFeedListings(live.filter(l => inLikedCats(liked, l.category, (l as any).categories) || keywords.some(kw => matchesKeyword(kw, l as any))));
        if (!firstListingsSnapshot && added > 0) {
          newUnreadListings.current += added;
          notifyFeedUpdate();
        }
        firstListingsSnapshot = false;
      },
      (err) => console.error('Likes feed listings listener error:', err)
    );

    const enquiriesUnsub = onSnapshot(
      fsQuery(collection(db, 'enquiries'), where('status', '==', 'live')),
      (snap) => {
        let added = 0;
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const e = { id: change.doc.id, ...(change.doc.data() as any) } as FeedEnquiry;
            if (!firstEnquiriesSnapshot && !seenEnquiries.has(e.id) && (inLikedCats(liked, e.category, e.categories) || keywords.some(kw => matchesKeyword(kw, e as any))) && isEnquiryLive(e)) {
              added++;
            }
            seenEnquiries.add(e.id);
          }
        });
        const enqs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as FeedEnquiry[];
        setFeedEnquiries(enqs.filter(e => (inLikedCats(liked, e.category, e.categories) || keywords.some(kw => matchesKeyword(kw, e as any))) && isEnquiryLive(e)));
        if (!firstEnquiriesSnapshot && added > 0) {
          newUnreadEnquiries.current += added;
          notifyFeedUpdate();
        }
        firstEnquiriesSnapshot = false;
      },
      (err) => console.error('Likes feed enquiries listener error:', err)
    );

    return () => { listingsUnsub(); enquiriesUnsub(); };
  }, [user?.uid, liked, keywords]);

  // Broadcast the current liked-count to the header icon on changes
  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new CustomEvent('likesFeedUpdated', { detail: { likedCount: liked.length } }));
    }
  }, [loading, liked.length]);

  // Visiting the Likes page clears the header Likes badge
  useEffect(() => {
    if (!loading && user?.uid) {
      window.dispatchEvent(new Event('likesFeedViewed'));
    }
  }, [loading, user?.uid]);

  const save = async (next: Partial<LikesSettings>) => {
    const payload = {
      likedCategories: next.categories ?? liked,
      likedKeywords: next.keywords ?? keywords,
      likedNotifyListings: next.notifyListings ?? notifyListings,
      likedNotifyEnquiries: next.notifyEnquiries ?? notifyEnquiries,
      likedCategoriesUpdatedAt: serverTimestamp(),
    };
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
    } catch (e) {
      console.error('Failed to save likes:', e);
      toast({ title: 'Error', description: 'Could not save your preferences. Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (value: string) => {
    const base = pending ?? liked;
    if (base.includes(value)) {
      setPending(base.filter(v => v !== value));
      return;
    }
    setPending([...base, value]);
  };

  // Keywords — custom free-text follows (max 10), matched against title/description/tags/category/location
  const addKeyword = async (raw: string) => {
    const kw = raw.trim().toLowerCase();
    if (!kw) return;
    const effectiveKws = pendingKeywords ?? keywords;
    if (effectiveKws.some(k => k.toLowerCase() === kw)) {
      toast({ title: 'Already added', description: `"${kw}" is already in your keywords.` });
      setKeywordInput('');
      return;
    }
    if (effectiveKws.length >= MAX_KEYWORDS) {
      toast({ title: 'Keyword limit reached', description: `You can follow up to ${MAX_KEYWORDS} keywords. Remove one to add another.`, variant: 'destructive' });
      return;
    }
    const next = [...effectiveKws, kw];
    setPendingKeywords(null);
    setKeywords(next);
    setKeywordInput('');
    await save({ keywords: next });
    toast({ title: 'Keyword added', description: `You'll see posts matching "${kw}" in your feed.` });
  };

  const removeKeyword = async (kw: string) => {
    const effectiveKws = pendingKeywords ?? keywords;
    const next = effectiveKws.filter(k => k !== kw);
    setPendingKeywords(null);
    setKeywords(next);
    await save({ keywords: next });
  };

  // Clear every selected category AND keyword (pending selection, if any, or saved likes)
  const clearAllCategories = async () => {
    const hadSelection = (pending ?? liked).length > 0 || keywords.length > 0;
    setPending([]);
    setKeywords([]);
    if (liked.length > 0 || keywords.length > 0) {
      setLiked([]);
      await save({ categories: [], keywords: [] });
      loadFeed([], []);
    }
    if (hadSelection) {
      toast({ title: 'Cleared', description: 'All liked categories and keywords removed. Start fresh.' });
    }
  };

  const savePending = async () => {
    if (pending === null) return;
    setLiked(pending);
    setPending(null);
    await save({ categories: pending });
    toast({ title: 'Saved', description: `${pending.length} categor${pending.length === 1 ? 'y' : 'ies'} selected.` });
    loadFeed(pending, keywords);
  };

  const discardPending = () => setPending(null);

  const effective = pending ?? liked;
  const effectiveKeywords = pendingKeywords ?? keywords;
  const filtered = query.trim()
    ? orderedCategories.filter(c => c.label.toLowerCase().includes(query.trim().toLowerCase()) || c.value.toLowerCase().includes(query.trim().toLowerCase()))
    : orderedCategories;
  const likedCount = liked.length;
  const pendingCount = pending ? pending.filter(v => !liked.includes(v)).length + liked.filter(v => !pending.includes(v)).length : 0;
  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (likedCount > 0) parts.push(`${likedCount} categor${likedCount === 1 ? 'y' : 'ies'}`);
    if (keywords.length > 0) parts.push(`${keywords.length} keyword${keywords.length === 1 ? '' : 's'}`);
    if (parts.length === 0) return 'Pick categories or add keywords — get notified when new posts match';
    return `${parts.join(' · ')} · we'll notify you about new posts matching them`;
  }, [likedCount, keywords.length]);

  return (
    <Layout>
      <div className="flex flex-col flex-grow bg-white min-h-screen">
        {/* Header - matching other pages' black header */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
                <div className="w-10 h-10"></div>
              </div>
            </div>

            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 text-blue-400" />
                <span className="bg-gradient-to-r from-white via-white to-blue-300 bg-clip-text text-transparent">Likes.</span>
              </h1>
            </div>

            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  {loading ? 'Loading…' : subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex-grow">
          {/* Category grid */}
          <div className="mt-6">

            {/* Category dropdown — stays open, tap to like/unlike, unlimited picks */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="relative w-full h-16 sm:h-16 flex items-center text-base sm:text-lg border-[0.5px] border-black focus:!border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 !transform hover:!scale-[1.02] active:!scale-[0.98] font-black !rounded-2xl !overflow-hidden group"
              >
                {/* Physical button depth effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 ml-4 mr-2 text-white flex-shrink-0 relative z-10" />
                <span className="flex-1 text-left truncate relative z-10">Categories</span>
                {effective.length > 0 && (
                  <span className="mr-2 bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 relative z-10">{effective.length}</span>
                )}
                <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 mr-4 transition-transform relative z-10 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border-2 border-black !rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] max-h-80 overflow-hidden flex flex-col">
                  {/* Category search — inside the dropdown panel */}
                  <div className="relative p-2 border-b border-slate-100 flex-shrink-0">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search categories…"
                      className="w-full h-9 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-black placeholder:text-gray-400 focus:outline-none focus:border-black"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto">
                    {filtered.length === 0 && (
                      <p className="text-center text-xs sm:text-sm text-muted-foreground py-6">No categories match "{query}"</p>
                    )}
                    {/* Selected categories first */}
                    {[...filtered].sort((a, b) => {
                      const aSel = effective.includes(a.value) ? 0 : 1;
                      const bSel = effective.includes(b.value) ? 0 : 1;
                      return aSel - bSel;
                    }).map((c) => {
                      const Icon = getCategoryIcon(c.value);
                      const isLiked = effective.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => toggleCategory(c.value)}
                          className={`w-full flex items-center gap-2 px-4 py-3 text-left !rounded-xl !font-black mb-0.5 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${
                            isLiked
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-black hover:bg-black/5'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{c.label}</span>
                          {isLiked && <Heart className="h-3 w-3 fill-blue-600 text-blue-600 ml-1 flex-shrink-0" />}
                          {isLiked && <Check className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 mt-1.5">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Tap a category to like / unlike it
              </p>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">{effective.length} selected</span>
            </div>

            {/* Keywords — custom free-text follows */}
            <div className="mt-2 sm:mt-5">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">{effectiveKeywords.length}/{MAX_KEYWORDS}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value.slice(0, MAX_KEYWORD_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                  placeholder="Type a keyword (e.g., innova, 2012)…"
                  maxLength={MAX_KEYWORD_LENGTH}
                  disabled={effectiveKeywords.length >= MAX_KEYWORDS}
                  className="w-full h-14 sm:h-16 pl-4 pr-24 rounded-2xl border-2 border-black bg-white text-base sm:text-lg font-black text-black placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:!border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] focus:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] !transition-all !duration-200 !transform focus:!scale-[0.98] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => addKeyword(keywordInput)}
                  disabled={!keywordInput.trim() || effectiveKeywords.length >= MAX_KEYWORDS}
                  style={{ minHeight: 0, minWidth: 0 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2.5 inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-[10px] font-black transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {effectiveKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {effectiveKeywords.map(kw => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border-[1.5px] border-black bg-black text-white text-[11px] font-black shadow-[0_3px_0_0_rgba(0,0,0,0.3)]"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                        aria-label={`Remove keyword ${kw}`}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 mt-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-none">
                  Matches titles, descriptions, tags & categories
                </p>
                {(effective.length > 0 || effectiveKeywords.length > 0) && (
                  <button
                    type="button"
                    onClick={clearAllCategories}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-white bg-[#7a1c1c] border border-black/60 rounded-full hover:bg-[#8f2323] transition-colors disabled:opacity-50 shadow-[0_3px_0_0_rgba(0,0,0,0.3)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] active:translate-y-[1px] flex-shrink-0"
                  >
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification toggles — shown only once a category or keyword is selected */}
            {(effective.length > 0 || effectiveKeywords.length > 0) && (
            <div className="mt-5 bg-white border-2 border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)] overflow-hidden">
              {/* Black tile header */}
              <div className="bg-black px-4 sm:px-6 py-3.5">
                <h3 className="text-sm sm:text-base font-bold text-white inline-flex items-center gap-2">
                  <Bell className="h-4 w-4 text-white" />
                  Notify
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black">For Sale</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">When a seller lists something in a category you like</p>
                </div>
                <Switch
                  checked={notifyListings}
                  onCheckedChange={(checked) => { setNotifyListings(checked); save({ notifyListings: checked }); }}
                  disabled={loading}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black">New enquiries</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">When a buyer posts a need in a category you like</p>
                </div>
                <Switch
                  checked={notifyEnquiries}
                  onCheckedChange={(checked) => { setNotifyEnquiries(checked); save({ notifyEnquiries: checked }); }}
                  disabled={loading}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                />
              </div>
              </div>
            </div>
            )}

            {/* Feed: live listings + enquiries from liked categories + keywords */}
            {(liked.length > 0 || keywords.length > 0) && (
              <div className="mt-8">
                <h3 className="text-sm sm:text-base font-bold text-black mb-3">From your liked categories & keywords</h3>
                {feedLoading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground py-6 text-center">Loading posts…</p>
                ) : (
                  <div className="space-y-6">
                    {/* Listings */}
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 inline-flex items-center gap-1.5 justify-center w-full">
                        <Tag className="h-3 w-3" /> Listings ({feedListings.length})
                      </p>
                      {feedListings.length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground py-3">No live listings in your liked categories yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {feedListings.slice(0, 10).map(l => {
                            const Icon = getCategoryIcon(l.category);
                            return (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => navigate(`/sell/listing/${l.id}`)}
                                className="flex items-center gap-3 rounded-xl border-2 border-black bg-white px-3 py-2.5 text-left shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-gray-50 active:translate-y-0.5 transition-all"
                              >
                                {l.images?.[0] ? (
                                  <img src={l.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                                ) : (
                                  <span className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-gray-500" />
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-black truncate">{l.title}</span>
                                  <span className="block text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                    {l.priceType === 'range' && l.priceMin != null && l.priceMax != null
                                      ? `₹${l.priceMin.toLocaleString('en-IN')} – ₹${l.priceMax.toLocaleString('en-IN')}`
                                      : l.price != null ? `₹${Number(l.price).toLocaleString('en-IN')}` : 'Price on request'}
                                    {l.location ? ` · ${l.location.slice(0, 15)}${l.location.length > 15 ? '…' : ''}` : ''}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Enquiries */}
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 inline-flex items-center gap-1.5 justify-center w-full">
                        <Megaphone className="h-3 w-3" /> Enquiries ({feedEnquiries.length})
                      </p>
                      {feedEnquiries.length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground py-3">No live enquiries in your liked categories yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {feedEnquiries.slice(0, 10).map(e => {
                            const Icon = getCategoryIcon(e.category);
                            return (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => navigate(`/enquiry/${e.id}`)}
                                className="flex items-center gap-3 rounded-xl border-2 border-black bg-white px-3 py-2.5 text-left shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-gray-50 active:translate-y-0.5 transition-all"
                              >
                                <span className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-5 h-5 text-gray-500" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-black truncate">{e.title}</span>
                                  <span className="block text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                    {e.budget ? `Budget: ${e.budget}` : 'Budget not set'}
                                    {e.location ? ` · ${e.location.slice(0, 15)}${e.location.length > 15 ? '…' : ''}` : ''}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save button */}
            <div className="sticky bottom-4 mt-6">
              <Button
                onClick={pending === null ? undefined : savePending}
                disabled={pending === null || saving}
                className={`relative w-full h-14 sm:h-16 !rounded-2xl text-base sm:text-lg font-black !overflow-hidden group !transition-all !duration-200 !transform ${
                  pending !== null && pendingCount > 0
                    ? '!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:!scale-[1.02] active:!scale-[0.98]'
                    : 'bg-gray-200 text-gray-500 !shadow-none cursor-not-allowed'
                }`}
              >
                {saving ? (
                  'Saving…'
                ) : (
                  <span className="inline-flex items-center gap-2 relative z-10"><Check className="h-4 w-4" /> Save</span>
                )}
                {pending !== null && pendingCount > 0 && (
                  <>
                    {/* Physical button depth effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent !rounded-2xl pointer-events-none" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none !rounded-2xl" />
                  </>
                )}
              </Button>
              {pending !== null && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={discardPending}
                  className="w-full text-center text-[10px] sm:text-xs text-muted-foreground underline mt-2"
                >
                  Discard changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyLikes;

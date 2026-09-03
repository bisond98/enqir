import { useEffect, useMemo, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToCloudinaryUnsigned } from '@/integrations/cloudinary';
import { toast } from '@/hooks/use-toast';
import { createListing } from '../services/sellDb';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import type { ListingCondition, ListingPriceType } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { processPayment } from '@/services/paymentService';
import { PAYMENT_PLANS } from '@/config/paymentPlans';
import {
  AlignLeft,
  Armchair,
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Dumbbell,
  Factory,
  FileText,
  Film,
  Flower2,
  Gamepad2,
  Gem,
  GraduationCap,
  HandHeart,
  HardHat,
  HeartPulse,
  Home,
  IndianRupee,
  Landmark,
  Laptop,
  LayoutGrid,
  Lock,
  MapPin,
  Megaphone,
  Mic,
  Monitor,
  Music,
  Package,
  PartyPopper,
  Palette,
  PawPrint,
  Scale,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Stamp,
  Tag,
  TreePine,
  Tractor,
  Truck,
  Trophy,
  Type,
  Umbrella,
  Upload,
  User,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
  X,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  electronics: Cpu,
  mobiles: Smartphone,
  laptops: Laptop,
  furniture: Armchair,
  home: Home,
  fashion: Shirt,
  vehicles: Car,
  services: Wrench,
  'agriculture-farming': Tractor,
  antiques: Landmark,
  art: Palette,
  'baby-kids': Baby,
  'bags-luggage': Briefcase,
  'beauty-products': Flower2,
  bicycles: Bike,
  'books-publications': BookOpen,
  business: Briefcase,
  'childcare-family': Users,
  collectibles: Trophy,
  'construction-renovation': HardHat,
  'education-training': GraduationCap,
  'entertainment-media': Film,
  'events-entertainment': PartyPopper,
  'food-beverage': UtensilsCrossed,
  'gaming-recreation': Gamepad2,
  'government-public': Building2,
  'health-beauty': HeartPulse,
  'insurance-services': ShieldCheck,
  jobs: Briefcase,
  'jewelry-accessories': Gem,
  'legal-financial': Scale,
  'marketing-advertising': Megaphone,
  memorabilia: Stamp,
  'musical-instruments': Mic,
  'musical-accessories': Music,
  'musical-services': Mic,
  'non-profit-charity': HandHeart,
  'office-supplies': FileText,
  personal: User,
  pets: PawPrint,
  'photography-cameras': Camera,
  'fitness-gym-equipment': Dumbbell,
  'garden-outdoor': TreePine,
  'kitchen-dining': UtensilsCrossed,
  'raw-materials-industrial': Factory,
  'real-estate': Home,
  'real-estate-services': Home,
  'renewable-energy': Zap,
  'repair-services': Wrench,
  'cleaning-services': Sparkles,
  'security-safety': Lock,
  sneakers: Gem,
  souvenir: MapPin,
  'sports-outdoor': Dumbbell,
  technology: Monitor,
  thrift: Shirt,
  'tools-equipment': Wrench,
  'transportation-logistics': Truck,
  'travel-tourism': MapPin,
  'tutoring-lessons': GraduationCap,
  vintage: Landmark,
  'waste-management': Factory,
  'wedding-events': PartyPopper,
  'medical-equipment': HeartPulse,
  appliances: Armchair,
  other: LayoutGrid,
};

const STEPS = [
  { key: 'category', label: 'Category', description: 'Pick what fits best' },
  { key: 'title', label: 'Title', description: 'Name your listing' },
  { key: 'description', label: 'Description', description: 'Tell buyers more' },
  { key: 'location', label: 'Location', description: 'Where is the item?' },
  { key: 'details', label: 'Condition', description: 'How you want to sell' },
  { key: 'price', label: 'Price', description: 'Set your numbers' },
  { key: 'extras', label: 'Tags & photos', description: 'Finish strong' },
] as const;

export default function CreateListing() {
  const { user, isProfileVerified } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const STORAGE_KEY = 'sell_listing_draft';

  const [step, setStep] = useState(() => {
    // If returning from profile verification, jump to last step
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) return STEPS.length - 1;
    return 0;
  });
  const [animDir, setAnimDir] = useState<'up' | 'down'>('up');
  const [catSearch, setCatSearch] = useState('');
  const [catPage, setCatPage] = useState(0);
  const CATS_PER_PAGE = 10;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [location, setLocation] = useState<string>('Other');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [condition, setCondition] = useState<ListingCondition>('used');
  const [priceType, setPriceType] = useState<ListingPriceType>('fixed');
  const [price, setPrice] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<number[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const parsedTags = useMemo(() => {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 15);
  }, [tags]);

  // Restore form from localStorage if returning from profile verification
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.category) setCategory(d.category);
        if (d.location) setLocation(d.location);
        if (d.condition) setCondition(d.condition);
        if (d.priceType) setPriceType(d.priceType);
        if (d.price) setPrice(d.price);
        if (d.priceMin) setPriceMin(d.priceMin);
        if (d.priceMax) setPriceMax(d.priceMax);
        if (d.tags) setTags(d.tags);
        if (d.images?.length) setImages(d.images);
      } catch {}
      localStorage.removeItem(STORAGE_KEY);
      // Scroll down to publish listing button after restoring
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const isVerifiedOrPending = isProfileVerified;

  useEffect(() => {
    // Check sessionStorage in case React state was lost due to Razorpay history manipulation
    if (sessionStorage.getItem('listing-published') === 'true') {
      sessionStorage.removeItem('listing-published');
      setIsPublished(true);
    }
  }, []);

  useEffect(() => {
    if (isPublished) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isPublished]);

  if (!user) {
    return (
      <SellShell title="Sell">
        <Card className="border-[0.5px] border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_8px_0_0_rgba(0,0,0,0.25)] overflow-hidden">
          <CardContent className="py-10 sm:py-14 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-black flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
              <LogIn className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">Sign in to Create a Listing</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xs leading-relaxed">
              You need an account to publish listings and manage your items.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-xs mt-2">
              <Button
                onClick={() => navigate('/signin')}
                className="flex-1 h-12 bg-black hover:bg-gray-900 text-white border border-black font-black text-sm rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/signin', { state: { mode: 'signup' } })}
                className="flex-1 h-12 border-2 border-black font-black text-sm rounded-xl bg-white hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </SellShell>
    );
  }

  const totalSteps = STEPS.length;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const onAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length >= 5) {
      toast({ title: 'Image limit reached', description: 'You can upload up to 5 images only.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      const remainingSlots = 5 - images.length;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      
      // Add placeholder progress entries
      const startIdx = images.length;
      setUploadProgresses(prev => [...prev, ...selectedFiles.map(() => 0)]);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgresses(prev => {
            const next = [...prev];
            const idx = startIdx + i;
            if (next[idx] < 90) next[idx] = next[idx] + Math.floor(Math.random() * 15) + 5;
            return next;
          });
        }, 200);
        
        const url = await uploadToCloudinaryUnsigned(selectedFiles[i]);
        
        clearInterval(progressInterval);
        setUploadProgresses(prev => {
          const next = [...prev];
          next[startIdx + i] = 100;
          return next;
        });
        urls.push(url);
      }
      if (files.length > selectedFiles.length) {
        toast({ title: 'Only 5 images allowed', description: 'Extra selected images were skipped.' });
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
      // Clear progress after a short delay
      setTimeout(() => setUploadProgresses([]), 1000);
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload one or more images.', variant: 'destructive' });
      setUploadProgresses([]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatPriceInput = (value: string): string => {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return '';
    return parseInt(digits).toLocaleString('en-IN');
  };

  const validatePriceFields = (): boolean => {
    if (priceType === 'fixed') {
      if (!price.trim()) {
        toast({ title: 'Missing price', description: 'Enter a price.', variant: 'destructive' });
        return false;
      }
      const fixedPrice = Number(price.replace(/,/g, ""));
      if (!Number.isFinite(fixedPrice) || fixedPrice <= 0) {
        toast({ title: 'Invalid price', description: 'Enter a valid numeric price.', variant: 'destructive' });
        return false;
      }
      return true;
    }
    if (!priceMin.trim() || !priceMax.trim()) {
      toast({ title: 'Missing price range', description: 'Enter min and max price.', variant: 'destructive' });
      return false;
    }
    const rangeMin = Number(priceMin);
    const rangeMax = Number(priceMax);
    if (
      !Number.isFinite(rangeMin) ||
      !Number.isFinite(rangeMax) ||
      rangeMin <= 0 ||
      rangeMax <= 0 ||
      rangeMin > rangeMax
    ) {
      toast({ title: 'Invalid range', description: 'Use valid numbers and keep min ≤ max.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const canAdvanceFromStep = (s: number): boolean => {
    switch (s) {
      case 0:
        return true;
      case 1:
        if (!title.trim()) {
          toast({ title: 'Add a title', description: 'Buyers need a clear name for your item.', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (!description.trim()) {
          toast({ title: 'Add a description', description: 'A few sentences help buyers decide.', variant: 'destructive' });
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return validatePriceFields();
      case 6:
        return true;
      default:
        return true;
    }
  };

  const scrollToInput = () => {
    requestAnimationFrame(() => {
      const el = document.getElementById('step-top');
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - 20, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    setAnimDir('up');
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    scrollToInput();
  };

  const goBack = () => {
    setAnimDir('down');
    setStep((prev) => Math.max(prev - 1, 0));
    scrollToInput();
  };

  const publish = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Missing info', description: 'Title and description are required.', variant: 'destructive' });
      return;
    }
    if (!validatePriceFields()) return;

    setPublishing(true);

    // ALL listings require ₹10 Razorpay payment before publishing
    const listingPlan = PAYMENT_PLANS.find(p => p.id === 'premium');
    if (!listingPlan) {
      toast({ title: 'Error', description: 'Payment plan not found.', variant: 'destructive' });
      setPublishing(false);
      return;
    }

    try {
      console.log('💳 Opening Razorpay checkout - ₹10 payment required to publish listing');

      // Open Razorpay for ₹10 payment
      const paymentResult = await processPayment(
        'temp-listing-id', // temporary — real listing not created yet
        user.uid,
        listingPlan,
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
          description: paymentResult.error || 'Payment failed. Listing not published.',
          variant: 'destructive',
        });
        setPublishing(false);
        return;
      }

      console.log('✅ Payment successful, publishing listing...');

      // Payment succeeded — show success screen immediately so form fields don't flash
      sessionStorage.setItem('listing-published', 'true');
      setIsPublished(true);

      // Create the listing in the background
      const fixedPrice = priceType === 'fixed' ? Number(price.replace(/,/g, '')) : null;
      const rangeMin = priceType === 'range' ? Number(priceMin) : null;
      const rangeMax = priceType === 'range' ? Number(priceMax) : null;

      const newListingId = await createListing(user.uid, {
        title: title.trim(),
        description: description.trim(),
        category,
        location,
        condition,
        priceType,
        price: fixedPrice,
        priceMin: rangeMin,
        priceMax: rangeMax,
        tags: parsedTags,
        images,
      });
      toast({ title: 'Published', description: 'Your listing is live.' });
      sessionStorage.removeItem('listing-published');
      window.setTimeout(() => {
        navigate(`/sell/listing/${newListingId}`);
      }, 2000);
    } catch (error) {
      console.error('❌ Error:', error);
      toast({ title: 'Publish failed', description: error instanceof Error ? error.message : 'Could not publish listing.', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <SellShell title="Sell">
        <Card className="border-[0.5px] border-black rounded-2xl bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
          <CardContent className="py-12 sm:py-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">Successfully Listed</h2>
            <p className="text-xs sm:text-sm text-gray-700 max-w-sm">
              Your product is now live. Redirecting...
            </p>
          </CardContent>
        </Card>
      </SellShell>
    );
  }

  const StepIcon = ({ active }: { active: boolean }) => {
    const meta = STEPS[step];
    const Icon =
      meta.key === 'title'
        ? Type
        : meta.key === 'description'
          ? AlignLeft
          : meta.key === 'category'
            ? LayoutGrid
            : meta.key === 'location'
              ? MapPin
              : meta.key === 'details'
                ? IndianRupee
                : meta.key === 'price'
                  ? IndianRupee
                  : Upload;
    return (
      <div
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]',
          active ? 'bg-black text-white' : 'bg-white text-black'
        )}
      >
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
      </div>
    );
  };

  return (
    <SellShell title="Sell">
      <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
        <CardHeader className="space-y-2 border-b border-black/10 pb-4">
          <Progress value={progressPct} className="h-2 rounded-full bg-slate-200" />
        </CardHeader>

        <CardContent className="pt-6 sm:pt-8 pb-6 min-h-[320px] sm:min-h-[360px] flex flex-col">
          <div id="step-top">
            <StepIcon active />
          </div>

          <div id="step-title" className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">{STEPS[step].label}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{STEPS[step].description}</p>
          </div>

          <div key={step} className="flex-1 space-y-4" style={{ animation: animDir === "up" ? "stepSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "stepSlideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {step === 0 && (() => {
              const filteredCats = catSearch.trim()
                ? SELL_CATEGORIES.filter(c => c.label.toLowerCase().includes(catSearch.toLowerCase()))
                : SELL_CATEGORIES;
              const isSearching = catSearch.trim().length > 0;
              const totalPages = Math.ceil(filteredCats.length / CATS_PER_PAGE);
              const paginatedCats = isSearching
                ? filteredCats
                : filteredCats.slice(catPage * CATS_PER_PAGE, (catPage + 1) * CATS_PER_PAGE);
              return (
                <div className="max-w-2xl mx-auto w-full">
                  {/* Search bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={catSearch}
                      onChange={(e) => { setCatSearch(e.target.value); setCatPage(0); }}
                      placeholder="Search categories..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                    />
                    {catSearch && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setCatSearch(''); setCatPage(0); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-black transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {paginatedCats.map((c) => {
                      const Icon = CATEGORY_ICON[c.value] ?? LayoutGrid;
                      const selected = category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(c.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation',
                            selected
                              ? 'border-black bg-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.35)]'
                              : 'border-black/20 bg-white text-black hover:border-black hover:bg-slate-50 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border',
                              selected ? 'border-white/30 bg-white/10' : 'border-black/10 bg-slate-50'
                            )}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                          </div>
                          <span className="text-[10px] sm:text-xs font-black leading-tight">{c.label}</span>
                          {selected && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* No results — show Other card like PostEnquiry */}
                  {isSearching && filteredCats.length === 0 && (
                    <div className="text-center py-6">
                      <div className="flex flex-col items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-black">Please choose</span>
                        {(() => {
                          const Icon = CATEGORY_ICON['other'] ?? LayoutGrid;
                          const selected = category === 'other';
                          return (
                            <button
                              type="button"
                              onClick={() => setCategory('other')}
                              className={cn(
                                'flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation',
                                selected
                                  ? 'border-black bg-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.35)]'
                                  : 'border-black/20 bg-white text-black hover:border-black hover:bg-slate-50 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]'
                              )}
                            >
                              <div className={cn(
                                'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border',
                                selected ? 'border-white/30 bg-white/10' : 'border-black/10 bg-slate-50'
                              )}>
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] sm:text-xs font-black leading-tight">Other</span>
                              {selected && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {!isSearching && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => { setCatPage(p => Math.max(0, p - 1)); }}
                        disabled={catPage === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      <span className="text-[11px] font-bold text-gray-500">{catPage + 1} / {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => { setCatPage(p => Math.min(totalPages - 1, p + 1)); }}
                        disabled={catPage === totalPages - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {step === 1 && (
              <div className="space-y-2 max-w-lg mx-auto w-full">
                <Label htmlFor="listing-title" className="text-[10px] sm:text-xs font-bold">
                  Listing title
                </Label>
                <Input
                  id="listing-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., iPhone 13 Pro 128GB — excellent condition"
                  className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 placeholder:text-slate-400 placeholder:text-[10px]"
                  maxLength={15}
                  autoFocus
                />
                <p className="text-[11px] text-slate-500">Keep it specific. Mention brand, model, or size if it helps.</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2 max-w-lg mx-auto w-full">
                <Label htmlFor="listing-desc" className="text-[10px] sm:text-xs font-bold">
                  Description
                </Label>
                <Textarea
                  id="listing-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Condition, accessories, warranty, reason for selling…"
                  maxLength={250}
                  className="rounded-2xl min-h-[160px] sm:min-h-[180px] text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 py-3 placeholder:text-slate-400 placeholder:text-[10px] resize-y"
                  autoFocus
                />
              </div>
            )}

            {step === 3 && (
              <div className="max-w-xl mx-auto w-full space-y-3">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                  <Input
                    id="listing-location"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setLocationDropdownOpen(true);
                      if (e.target.value === '') setLocation('');
                    }}
                    onFocus={() => setLocationDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 200)}
                    placeholder="Search location..."
                    className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-10 pr-4 placeholder:text-slate-400"
                    style={{ fontSize: '16px' }}
                  />
                  {locationDropdownOpen && locationSearch.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      {SELL_LOCATIONS.filter(loc => loc !== 'Other').map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setLocation(loc);
                            setLocationSearch(loc);
                            setLocationDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 transition-colors text-left"
                        >
                          <MapPin className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
                          {loc}
                        </button>
                      ))}
                    </div>
                  )}
                  {locationDropdownOpen && locationSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      {SELL_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase())).length > 0 ? (
                        SELL_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase())).map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setLocation(loc);
                              setLocationSearch(loc);
                              setLocationDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 transition-colors text-left"
                          >
                            <MapPin className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
                            {loc}
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setLocation(locationSearch);
                            setLocationDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 transition-colors text-left"
                        >
                          <MapPin className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
                          {locationSearch}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-lg mx-auto w-full space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Condition</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCondition('new')}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                        condition === 'new' ? 'border-black bg-emerald-50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)]' : 'border-black/20 hover:border-black/40'
                      )}
                    >
                      <Sparkles className="h-8 w-8 text-emerald-700" />
                      <span className="font-black text-sm">New</span>
                      <span className="text-[10px] text-slate-600 text-center">Unused / sealed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('used')}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                        condition === 'used' ? 'border-black bg-amber-50 shadow-[0_4px_0_0_rgba(0,0,0,0.2)]' : 'border-black/20 hover:border-black/40'
                      )}
                    >
                      <Package className="h-8 w-8 text-amber-800" />
                      <span className="font-black text-sm">Used</span>
                      <span className="text-[10px] text-slate-600 text-center">Good / fair wear</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {step === 5 && (
              <div className="max-w-md mx-auto w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price-fixed" className="text-[10px] sm:text-xs font-bold flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Your price (INR)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500 z-10">₹</span>
                    <Input
                      id="price-fixed"
                      value={price}
                      onChange={(e) => setPrice(formatPriceInput(e.target.value))}
                      placeholder="25,000"
                      inputMode="decimal"
                      maxLength={13}
                      className="rounded-2xl h-12 sm:h-14 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-8 pr-4 placeholder:text-slate-400 placeholder:text-[10px] font-bold text-lg"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="max-w-lg mx-auto w-full space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    Photos (up to 5)
                  </Label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Image ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-black/10" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length < 5 && (
                  <div className="rounded-xl border-2 border-dashed border-black/30 bg-slate-50/80 p-4">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => onAddImages(e.target.files)}
                      disabled={uploading || images.length >= 5}
                      className="cursor-pointer text-sm"
                    />
                    <p className="text-[11px] text-slate-600 mt-2">{images.length}/5 images</p>
                    {uploading && uploadProgresses.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadProgresses.map((p, i) => (
                          <div key={i} className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-black h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-3 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Title</span>
                    <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{title || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Category</span>
                    <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{SELL_CATEGORIES.find((c) => c.value === category)?.label ?? category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Location</span>
                    <span className="text-xs sm:text-sm font-bold text-black text-right truncate ml-4">{location}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Price</span>
                    <span className="text-sm sm:text-base font-black text-black">{price ? `₹${price}` : '—'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-[10px] sm:text-xs font-bold flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />                     Tags
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="apple, warranty, charger…"
                    className="rounded-2xl h-11 text-base border-2 border-gray-800 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 min-touch pl-4 pr-4 placeholder:text-slate-400 placeholder:text-[10px]"
                  />
                  {parsedTags.length > 0 && (
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold">Preview:</span> {parsedTags.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Verify Profile Button */}
          {step === totalSteps - 1 && user && !isProfileVerified && (
            <div className="mt-4 mb-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    title, description, category, location, condition,
                    priceType, price, priceMin, priceMax, tags, images
                  }));
                  navigate('/profile?returnTo=/sell/new');
                }}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all group shadow-[0_4px_0_0_rgba(37,99,235,0.4)] active:shadow-[0_2px_0_0_rgba(37,99,235,0.4)] active:translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs sm:text-sm font-bold text-white">Verify Your Profile <span className="text-blue-200 font-normal">(Optional)</span></p>
                  <p className="text-[10px] sm:text-[11px] text-blue-100">Get a trust badge</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/70 flex-shrink-0" />
              </button>
            </div>
          )}
          {step === totalSteps - 1 && user && isProfileVerified && (
            <div className="mt-4 mb-2">
              <div className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-blue-600">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs sm:text-sm font-bold text-white">Profile Verified ✓</p>
                  <p className="text-[10px] sm:text-[11px] text-blue-100">Your listing will show a trust badge.</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] sm:text-xs text-gray-400 font-normal truncate mt-3">We don't offer anything free at the cost of your time and safety.</p>
          <div className="mt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0}
              className="border-2 border-black font-black rounded-xl h-11 sm:h-12"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {step < totalSteps - 1 ? (
              <Button type="button" onClick={goNext} className="bg-black text-white font-black rounded-xl h-11 sm:h-12 px-6">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={publish}
                disabled={!user || uploading || publishing}
                className="!w-full !h-16 !text-lg !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
              >
                {/* Physical button depth effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
                <span className="relative z-10">{publishing ? 'Connecting…' : 'Connect'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </SellShell>
  );
}

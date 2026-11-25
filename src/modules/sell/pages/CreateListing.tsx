import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react';
import SellShell from '../components/SellShell';
import { SellListingSketch } from '@/components/doodles';
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
import { CATEGORY_TILE_IMAGES, CATEGORY_TILE_SCRIM } from '@/constants/categoryTileImages';
import { filterCategoriesBySearch, NO_CONDITION_CATEGORIES, REPAIR_SERVICE_TYPES, CLEANING_SERVICE_TYPES } from '@/constants/categories';
import { SNEAKER_SIZES_ADULTS, SNEAKER_SIZES_KIDS } from '../categoryDetails';
import { LAPTOP_OTHER, getLaptopModels, getLaptopProcessors, getLaptopStorageOptions } from '@/constants/laptopCatalog';
import { MOBILE_OTHER, getMobileModels, getMobileStorageOptions } from '@/constants/mobileCatalog';
import { getBicycleBrands, getBicycleModels } from '@/constants/bicycleCatalog';
import { AUDIO_OTHER, getAudioModels } from '@/constants/audioCatalog';
import { CAR_MODEL_OTHER, getCarModels, getCarVariants } from '@/constants/carCatalog';
import { BIKE_MODEL_OTHER, getBikeModels } from '@/constants/bikeCatalog';
import { getVehicleBrandsForType } from '../categoryBrands';
import { VEHICLE_MODEL_OTHER, getVehicleModels } from '@/constants/vehicleCatalog';
import { WATCH_OTHER, getWatchModels } from '@/constants/watchCatalog';
import { getCameraModels } from '@/constants/cameraCatalog';
import { SNEAKER_AUDIENCES, getSneakerBrands, getSneakerModels } from '@/constants/sneakerCatalog';
import { THRIFT_GENDERS, THRIFT_TYPES, thriftItemsFor, thriftSizesFor } from '@/constants/thriftClothing';
import { getSneakerBrandLogoUrl } from '@/lib/sneakerBrandLogos';
import { getCarBrandLogoUrl } from '@/lib/carBrandLogos';
import type { ListingCondition, ListingPriceType } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapLocationPickerLazy as MapLocationPicker } from '@/components/MapLocationPickerLazy';
import type { MapLocationAddress } from '@/types/mapLocation';
import { LogIn, UserPlus } from 'lucide-react';
import { PET_TYPES, PET_TRAINING_OPTIONS, petBreedsFor, OFFICE_SUPPLIES_SUBCATEGORIES } from '@/constants/petsCatalog';
import { fieldsForCategoryStep, isFieldHiddenForDetails, PRODUCT_CONDITIONS, VISIBLE_DAMAGE_OPTIONS, DAMAGE_TYPES, DAMAGE_SEVERITIES, FUNCTIONAL_STATUSES, ANTIQUE_CONDITIONS, ANTIQUE_DAMAGE_TYPES, ANTIQUE_FUNCTIONAL_STATUSES } from '../categoryDetails';
import { titleHintsFor } from '../titleHints';
import { improveDescription, isVehicleCategory } from '@/services/ai/descriptionAssistant';
import { canAutoScroll, canAutoFocus, resetAutoScrollGuard, revealNewStep } from '@/utils/autoScrollGuard';
import { prefetchCategoryTiles } from '@/utils/prefetchCategoryTiles';
import { SellerCartoon } from '@/components/doodles';
import { categoriesRequireImage } from '@/lib/imageRequiredCategories';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { processPayment } from '@/services/paymentService';
import { displayNameForUser } from '@/lib/userDisplayName';
import { isDefaultPinAddress } from '@/lib/reverseGeocode';
import { PAYMENT_PLANS } from '@/config/paymentPlans';
import TimeLimitSelector from '@/components/TimeLimitSelector';
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
  ChevronDown,
  CalendarDays,
  Settings,
  Fuel,
  Gauge,
  HardDrive,
  Clock,
  Ruler,
  Compass,
  Cog,
  Phone,
  Footprints,
  Pen,
  Loader2,
  Globe,
  Watch,
  Headphones
} from 'lucide-react';

// H-pattern stick-shift (manual gearbox) icon
function GearShiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.6" />
      <line x1="8" y1="7.5" x2="8" y2="16.5" />
      <line x1="12" y1="7.5" x2="12" y2="16.5" />
      <line x1="16" y1="7.5" x2="16" y2="16.5" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <circle cx="8" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
import { cn } from '@/lib/utils';
import { splitE164Phone, formatNationalForInput } from '@/lib/phonePrefill';
import { db } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreWrite } from '@/lib/firestoreSafe';
import type { LucideIcon } from 'lucide-react';
import { friendlyError } from '@/utils/friendlyError';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  electronics: Cpu,
  mobiles: Smartphone,
  car: Car,
  bike: Bike,
  laptops: Laptop,
  watches: Watch,
  furniture: Armchair,
  home: Home,
  fashion: Shirt,
  vehicles: Car,
  automobile: Car,
  service: Wrench,
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
  'digital-it-services': Globe,
  'audio-headphones': Headphones,
  memorabilia: Stamp,
  'musical-instruments': Mic,
  'musical-accessories': Music,
  'musical-services': Mic,
  'non-profit-charity': HandHeart,
  'office-supplies': FileText,
  personal: User,
  pets: PawPrint,
  'photography-cameras': Camera,
  'camera': Camera,
  'photography': Camera,
  'fitness-gym-equipment': Dumbbell,
  'garden-outdoor': TreePine,
  'kitchen-dining': UtensilsCrossed,
  'raw-materials-industrial': Factory,
  'real-estate': Home,
  'real-estate-services': Home,
  'renewable-energy': Zap,
  'cleaning-services': Sparkles,
  'security-safety': Lock,
  sneakers: Footprints,
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
  { key: 'category', label: 'Category', description: 'What are you selling?' },
  { key: 'title', label: 'Title', description: 'Name your listing' },
  { key: 'description', label: 'Description', description: 'Tell buyers more' },
  { key: 'location', label: 'Location', description: 'Where is the item?' },
  { key: 'details', label: 'Condition', description: 'How you want to sell' },
  { key: 'price', label: 'Price & Photos', description: 'Set your numbers' },
  { key: 'extras', label: 'Confirmation', description: 'Finish strong' },
] as const;

// Description limits — same 8000-word cap as the enquiry form. The character
// ceiling only stops an unbroken paste from growing without bound.
const MAX_DESC_WORDS = 8000;
const MAX_DESC_CHARS = 60000;
const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const withinDescLimit = (text: string) => text.length <= MAX_DESC_CHARS && countWords(text) <= MAX_DESC_WORDS;

// Categories whose listings support an optional auto-expire deadline shown on
// the Condition step (step index 4). Everything downstream (sweep, marketplace
// filter, detail-page countdown) is category-agnostic — it only reads the
// `deadline` field on the doc, so adding a category here is all it takes.
const DEADLINE_CATEGORIES = new Set(['food-beverage', 'jobs', 'agriculture-farming']);

/**
 * The title the pet pickers write for the seller, the way the laptop picker
 * builds "Brand Model 512GB": breed + type first ("Siberian Husky Dog"), then
 * the training on the end ("... - Basic obedience training"). "Other ..." picks
 * carry no product name, so they are left out and the seller writes their own.
 */
function petListingTitle(details: Record<string, string>, overrides: Record<string, string> = {}) {
  const d = { ...details, ...overrides };
  const named = (v?: string) => (v && !v.startsWith('Other ') ? v : '');
  const name = [named(d.petBreed), named(d.subcategory)].filter(Boolean).join(' ');
  const training = named(d.petTraining);
  if (!name) return training;
  return training ? `${name} - ${training}` : name;
}

export default function CreateListing() {
  const { user, isProfileVerified, loading: authLoading, savedPhone, savedFullName, savedUsername, sendPhoneOTP, verifyPhoneOTP } = useAuth();
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
  // The newest cleaning chip is scrolled into view under the field.
  const cleaningChipsRef = useRef<HTMLDivElement>(null);

  // Keep the end of a long title visible inside the input, so a title written
  // by the pickers never hides the part that just changed.
  useEffect(() => {
    const el = document.getElementById('listing-title') as HTMLInputElement | null;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [title]);
  // Rotating title placeholder — cycles product examples every 3s while the input is empty
  const [titleHintIdx, setTitleHintIdx] = useState(0);
  useEffect(() => {
    if (title) return;
    const t = setInterval(() => setTitleHintIdx((i) => i + 1), 3000);
    return () => clearInterval(t);
  }, [title]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  // The category the seller last moved forward with. Answers are only dropped
  // when Next is pressed from the category step with a *different* category;
  // stepping back to review and moving on again loses nothing.
  const committedCategoryRef = useRef('');

  // Single category selection — the selected category drives category details
  // and is stored in `categories` for matching/search.
  const toggleCat = (v: string) => {
    setSelectedCats((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      return [v]; // only one category can be selected at a time
    });
  };
  useEffect(() => {
    setCategory(selectedCats[0] ?? 'other');
  }, [selectedCats]);
  // Location is required to publish — starts empty so the user must pick one
  // (the 'Other' fallback default is no longer applied automatically).
  const [location, setLocation] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  // Precise map location (lat/lng + structured address) picked from the map picker
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<MapLocationAddress | null>(null);
  const [condition, setCondition] = useState<ListingCondition>('used');
  // Categories where New/Used condition makes no sense (properties, stays,
  // services, perishables & live animals) — hides the selector and chips
  const hideCondition = NO_CONDITION_CATEGORIES.has(category) || /-services$/.test(category);
  // Antiques reuse the Condition step but with age/patina/restoration wording.
  const isAntiqueCategory = category === 'antiques';
  const conditionGrades = isAntiqueCategory ? ANTIQUE_CONDITIONS : PRODUCT_CONDITIONS;
  const damageTypeOptions = isAntiqueCategory ? ANTIQUE_DAMAGE_TYPES : DAMAGE_TYPES;
  const functionalStatusOptions = isAntiqueCategory ? ANTIQUE_FUNCTIONAL_STATUSES : FUNCTIONAL_STATUSES;
  // Deadline-enabled categories (DEADLINE_CATEGORIES) show the countdown
  // timer on the Condition step (step index 4). Food and jobs hide the New/Used
  // chips (food via NO_CONDITION_CATEGORIES, jobs via the explicit check in the
  // step's JSX), so the timer is the step's only content; agriculture shows the
  // chips above it. The deadline is always optional — the step is never
  // blocked, so the seller can leave it unset and the listing still publishes.
  const isDeadlineCategory = DEADLINE_CATEGORIES.has(category);
  // The Condition step (index 4) is skipped entirely for service categories
  // — Service, Musical Services, Real Estate Services, Cleaning Services
  // (New/Used makes no sense there and the step has no other fields for them).
  const CONDITION_SKIP_CATEGORIES = ['service', 'musical-services', 'real-estate-services', 'cleaning-services'];
  const skipDetailsStep = CONDITION_SKIP_CATEGORIES.includes(category) && !isDeadlineCategory;
  const isSkippedStep = (s: number) => skipDetailsStep && s === 4;
  const [priceType, setPriceType] = useState<ListingPriceType>('fixed');
  const [price, setPrice] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [details, setDetails] = useState<Record<string, string>>({ listingFor: 'Sale' }); // Real-estate deal type defaults to For Sale

  // Newest cleaning chip scrolls into view; declared after `details` so the
  // dependency exists when this component first renders.
  useEffect(() => {
    const row = cleaningChipsRef.current;
    if (row) row.scrollLeft = row.scrollWidth;
  }, [details]);
  // Which real-estate capsule is selected (only one big capsule shows at a time)
  const [estateType, setEstateType] = useState<'' | 'land' | 'built' | 'house' | 'flat' | 'other'>('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<number[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Contact mobile number (optional) — shown only to paid users via the call popup
  // Prefilled from the signed-in user's OTP number (editable, drafts win)
  const [mobileNumber, setMobileNumber] = useState('');
  // India only: the country code is fixed and only a 10-digit Indian number is accepted.
  const MOBILE_CODE = '+91';
  // The account's OTP-verified number. Only a verified number may reach a listing;
  // a typed/edited number has to be verified before it can replace this one.
  const [verifiedMobileNational, setVerifiedMobileNational] = useState('');
  const [otpStage, setOtpStage] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpListeners, setOtpListeners] = useState(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const otpBoxRefs = useRef<Array<HTMLInputElement | null>>([]);

  const mobileDigitsOnly = mobileNumber.replace(/\D/g, '');
  const typedMobileIsVerified =
    !!verifiedMobileNational && mobileDigitsOnly === verifiedMobileNational.replace(/\D/g, '');
  // Verify is offered only for a complete Indian number that isn't verified yet.
  const showMobileVerify = !typedMobileIsVerified && mobileDigitsOnly.length === 10;
  // What the listing is allowed to carry — always the verified number.
  const verifiedMobileValue = verifiedMobileNational ? `${MOBILE_CODE} ${verifiedMobileNational}` : null;

  // Auto-fill the contact number from the signed-in user's phone-auth (OTP)
  // number. Only fills an empty field, so user edits always win.
  useEffect(() => {
    const phoneToUse = user?.phoneNumber || savedPhone || '';
    if (!phoneToUse) return;
    const split = splitE164Phone(phoneToUse);
    // India only — a saved foreign number is not offered in this field.
    if (!split || split.code !== MOBILE_CODE) return;
    const national = formatNationalForInput(split.national, split.code);
    setVerifiedMobileNational((prev) => prev || national);
    setMobileNumber((prev) => prev || national);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phoneNumber, savedPhone]);

  // Resend cooldown while the OTP boxes are open.
  useEffect(() => {
    if (!otpStage || resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpStage, resendSeconds]);

  // Send an OTP to the number currently in the field (India, 10 digits).
  const handleListingOtpSend = async () => {
    if (!user) return;
    if (mobileDigitsOnly.length !== 10) {
      toast({ title: 'Invalid number', description: 'Enter a 10-digit Indian mobile number first.', variant: 'destructive' });
      return;
    }
    setSendingOtp(true);
    try {
      const result = await sendPhoneOTP(`${MOBILE_CODE}${mobileDigitsOnly}`);
      if (result?.error) return;
      setVerificationId(result.verificationId || null);
      setOtpListeners(['', '', '', '', '', '']);
      setResendSeconds(60);
      setOtpStage(true);
      setTimeout(() => {
        if (!canAutoFocus()) return;
        otpBoxRefs.current[0]?.focus();
      }, 100);
    } finally {
      setSendingOtp(false);
    }
  };

  // Correct OTP = this number becomes the verified one, so the listing may use it.
  const handleListingOtpConfirm = async () => {
    const code = otpListeners.join('');
    if (code.length < 6) {
      toast({ title: 'Incomplete OTP', description: 'Enter all 6 digits.', variant: 'destructive' });
      return;
    }
    if (!verificationId) {
      toast({ title: 'Session expired', description: 'Request a new OTP.', variant: 'destructive' });
      setOtpStage(false);
      return;
    }
    setConfirmingOtp(true);
    try {
      const result = await verifyPhoneOTP(code, verificationId);
      if (result?.error) return;
      const national = mobileNumber.trim();
      setVerifiedMobileNational(national);
      try {
        if (user) {
          await firestoreWrite(
            setDoc(doc(db, 'userProfiles', user.uid), {
              userId: user.uid,
              phone: national.replace(/\D/g, ''),
              countryCode: MOBILE_CODE,
              phoneVerified: true,
              updatedAt: serverTimestamp(),
            }, { merge: true }),
            'Listing phone verify profile write'
          );
        }
      } catch (writeError) {
        console.error('Phone verified but profile save failed:', writeError);
      }
      await user?.reload().catch(() => {});
      setOtpListeners(['', '', '', '', '', '']);
      setOtpStage(false);
      setVerificationId(null);
    } catch (error) {
      console.error('Listing OTP confirm flow failed:', error);
    } finally {
      setConfirmingOtp(false);
    }
  };

  const setListingOtpDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setOtpListeners((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpBoxRefs.current[index + 1]?.focus();
  };

  const handleListingOtpPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setOtpListeners(next);
    otpBoxRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const [aiGenerating, setAiGenerating] = useState(false);

  // Thrift dropdowns: changing a parent clears whatever was picked below it,
  // so a stale Type/Item can never survive a Gender change.
  const resetThriftBelow = (level: 'gender' | 'type') => {
    setDetails((prev) => {
      const next = { ...prev };
      if (level === 'gender') {
        delete next['thriftType'];
        delete next['thriftItem'];
        delete next['thriftSize'];
      } else {
        delete next['thriftItem'];
        delete next['thriftSize'];
      }
      return next;
    });
  };

  // Session-drop handling: no toast — the sign-in prompt below speaks for itself.
  const sessionToastShown = useRef(false);
  const listingImageInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (authLoading) return;                 // wait for session restore to settle
    if (sessionToastShown.current) return;   // once per page open
    sessionToastShown.current = true;
    if (user && !navigator.onLine) {
      toast({
        title: 'No internet connection',
        description: 'You are offline. Reconnect to publish your listing.',
        variant: 'destructive',
      });
    }
  }, [authLoading, user?.uid, toast]);

  // AI description assistant — grammar-corrects & polishes typed text in place.
  // The AI never writes the description and never inserts listing details.
  const runDescriptionAI = () => {
    if (!description.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      try {
        const { suggestion } = improveDescription(description, {
          title,
          category,
          categories: selectedCats,
        });
        if (suggestion) setDescription(suggestion.slice(0, MAX_DESC_CHARS));
      } catch {
        // keep the user's text untouched on failure
      } finally {
        setAiGenerating(false);
      }
    }, 250);
  };

  // Recover a deadline-category draft countdown from the saved draft so a seller
  // returning to /sell/new after a sign-in redirect still sees their chosen
  // countdown instead of a blank step. Deadline is intentionally kept out of
  // the generic form-restore block above so an old countdown is never silently
  // re-armed for a non-deadline draft.
  useEffect(() => {
    if (!isDeadlineCategory) return;
    const draft = localStorage.getItem(STORAGE_KEY);
    if (!draft) return;
    try {
      const d = JSON.parse(draft);
      if (d.deadline) {
        setDeadline(d.deadline instanceof Date ? d.deadline : new Date(d.deadline));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeadlineCategory]);

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
        if (Array.isArray(d.categories) && d.categories.length) {
          setSelectedCats(d.categories.slice(0, 3));
          committedCategoryRef.current = d.categories[0] ?? 'other';
        }
        if (d.location && !isDefaultPinAddress(d.location)) setLocation(d.location);
        if (d.condition) setCondition(d.condition);
        if (d.priceType) setPriceType(d.priceType);
      if (d.price) setPrice(d.price);
      if (d.priceOption) setPriceOption(d.priceOption);
      if (d.deadline) setDeadline(d.deadline instanceof Date ? d.deadline : new Date(d.deadline));
        // priceMin/priceMax & 'range' priceType intentionally NOT restored —
        // the price-range slider section was removed from the form.
        if (d.tags) setTags(d.tags);
        if (d.details) setDetails(d.details);
        if (d.estateType) setEstateType(d.estateType);
        if (d.images?.length) setImages(d.images);
      } catch {}
      // Deadline draft is intentionally left out of the auto-restore path: a
      // food listing draft kept across a session should not silently re-arm an
      // old countdown. Sellers set a new deadline on the step if they want one.
      // Deadline draft is intentionally left out of the auto-restore path: a
    // food listing draft kept across a session should not silently re-arm an
    // old countdown. Sellers set a new deadline on the step if they want one.
    localStorage.removeItem(STORAGE_KEY);
      // Scroll down to publish listing button after restoring
      setTimeout(() => {
        if (!canAutoScroll()) return;
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const isVerifiedOrPending = isProfileVerified;

  // A fresh visit starts with auto-reveal available; touching the phone turns
  // every automatic jump off for the rest of the visit.
  useEffect(() => {
    resetAutoScrollGuard();
    prefetchCategoryTiles();
  }, []);

  // The listing form opens already scrolled to its tab's title, and each step
  // change opens the new tab on its title. Inside a tab the page stays put once
  // the seller touches it.
  useEffect(() => {
    // Called straight away rather than from requestAnimationFrame: in a tab
    // that is not visible the browser never runs animation frames, so a
    // deferred reveal was silently skipped and the form opened at scroll 0.
    revealNewStep('step-top', 20);
  }, [step]);

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

  // "Open to discussion" — price dropdown alternative to typing a number
  // NOTE: declared BEFORE the auth early-returns below — every hook in this
  // component must run on every render, or React throws "Rendered more hooks
  // than during the previous render" when the auth listener fires.
  const [priceOption, setPriceOption] = useState<'' | 'discussion'>('');
  // Deadline categories (DEADLINE_CATEGORIES): optional listing end time.
  // Stored as a Firestore timestamp on the doc; used by the expiry logic and
  // shown on the detail page as a reverse countdown.
  const [deadline, setDeadline] = useState<Date | null>(null);

  // IMPORTANT: wait for Firebase to restore the persisted session before
  // deciding the user is signed out. On a fresh app open (or restored tab)
  // `user` is null for the first few hundred ms while Firebase reads its
  // saved session — rendering the sign-in prompt in that window made every
  // restored tab flash "Sign in to Create a Listing" for signed-in users.
  if (!user && authLoading) {
    return (
      <SellShell title="Sell">
        <div className="flex items-center justify-center min-h-[45vh]">
          <LoadingAnimation message="Loading" showBackButton={false} compact />
        </div>
      </SellShell>
    );
  }

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
                onClick={() => {
                  // After login, come back to the list-new form.
                  sessionStorage.setItem('returnAfterSignIn', '/sell/new');
                  navigate('/signin');
                }}
                className="flex-1 h-12 bg-black hover:bg-gray-900 text-white border border-black font-black text-sm rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.setItem('returnAfterSignIn', '/sell/new');
                  navigate('/signin', { state: { mode: 'signup' } });
                }}
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
  // Visible steps exclude the Condition step when it's skipped (service category)
  const visibleSteps = skipDetailsStep ? totalSteps - 1 : totalSteps;
  const progressPct = ((step + 1) / visibleSteps) * 100;

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
        
        const url = await uploadToCloudinaryUnsigned(selectedFiles[i], 2, true);
        
        clearInterval(progressInterval);
        setUploadProgresses(prev => {
          const next = [...prev];
          next[startIdx + i] = 100;
          return next;
        });
        urls.push(url);
      }
      if (files.length > selectedFiles.length) {
        toast({ title: 'Only 5 images allowed', description: `Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} could be added — extra selected images were skipped.` });
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

  const setDetail = (key: string, value: string) =>
    setDetails((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });

  const formatPriceInput = (value: string): string => {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return '';
    return parseInt(digits).toLocaleString('en-IN');
  };

  const validatePriceFields = (): boolean => {
    if (priceOption === 'discussion') return true;
    if (priceType === 'discussion') return true;
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

  // Laptop listings can skip the title: the brand + model picked on the Title
  // tab stand in for it, and a typed title always wins when there is one.
  const laptopTitle = [details['brand'], details['model']].filter(Boolean).join(' ');
  // "Other" means the catalogue has no name for it, so it can never stand in
  // for the title — the seller has to type one to move on.
  const laptopTitleIsReal =
    !!details['brand'] &&
    details['brand'] !== LAPTOP_OTHER &&
    details['model'] !== LAPTOP_OTHER;
  // Audio & Headphones uses the same "brand + model stands in for the title"
  // rule; "Other" never counts because the catalogue has no name for it.
  const audioTitle = [details['brand'], details['model']].filter(Boolean).join(' ');
  const audioTitleIsReal =
    !!details['brand'] &&
    details['brand'] !== AUDIO_OTHER &&
    details['model'] !== AUDIO_OTHER;
  // How many dropdowns the Title tab shows: a tab with a single dropdown gets
  // the enlarged, centred picker and it sits above the title input.
  const titleDropdownCount = fieldsForCategoryStep(category, 'title')
    .filter((field) => !field.typeable && field.type !== 'text' && field.type !== 'number').length;
  const singleTitleDropdown = titleDropdownCount === 1;
  const effectiveTitle = title.trim() || ((category === 'laptops' || category === 'camera' || category === 'watches') && laptopTitleIsReal ? laptopTitle : (category === 'audio-headphones' && audioTitleIsReal ? audioTitle : ''));

  const canAdvanceFromStep = (s: number): boolean => {
    switch (s) {
      case 0:
        // Category is required — a listing can't be filed without one
        if (selectedCats.length === 0) {
          toast({ title: 'Choose a category', description: 'Pick the category that best matches what you are selling.', variant: 'destructive' });
          return false;
        }
        return true;
      case 1:
        if (!effectiveTitle) {
          toast({ title: 'Add a title', description: 'Buyers need a clear name for your item.', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (!description.trim()) {
          toast({ title: 'Add a description', description: 'A few sentences help buyers decide.', variant: 'destructive' });
          return false;
        }
        if (category === 'jobs' && !details.experience) {
          toast({ title: 'Select experience', description: 'Experience required must be filled for job listings.', variant: 'destructive' });
          return false;
        }
        return true;
      case 3:
        // Location is required — sellers must say where the item is so
        // nearby buyers can find it.
        if (!location.trim()) {
          toast({ title: 'Add a location', description: 'Tell buyers where the item is located.', variant: 'destructive' });
          return false;
        }
        return true;
      case 4:
        // Deadline categories: the deadline is optional, so the step can
        // always be advanced — the seller can leave it unset and still publish.
        return true;
      case 5:
        if (!validatePriceFields()) return false;
        if (categoriesRequireImage(category) && images.length === 0) {
          toast({ title: 'At least 1 photo is required', description: 'Categories like cars, bikes, mobiles and other physical items need at least one image so buyers can see them.', variant: 'destructive' });
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  // Step changes open the new tab on its heading; once the seller touches that
  // tab the page belongs to the finger, not the wizard.
  const scrollToInput = () => {
    revealNewStep('step-top', 20);
  };

  // Wipes every answer the seller filled on the other steps. Called only when
  // moving forward out of the category step with a different category, so a
  // draft for the old category can't ride along into the new listing. Photos,
  // phone verification and the chosen plan are left alone.
  const resetListingAnswers = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setCondition('used');
    setPriceType('fixed');
    setPrice('');
    setPriceMin('');
    setPriceMax('');
    setPriceOption('');
    setTags('');
    setDetails({ listingFor: 'Sale' });
    setEstateType('');
    setDeadline(null);
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    // Moving forward out of the category step with a different category drops
    // every answer; with the same category nothing changes.
    if (step === 0) {
      const nextCategory = selectedCats[0] ?? 'other';
      if (nextCategory !== committedCategoryRef.current) {
        // The first category a form is given never wipes anything —
        // there is nothing committed yet to compare against.
        if (committedCategoryRef.current) resetListingAnswers();
        committedCategoryRef.current = nextCategory;
      }
    }
    setAnimDir('up');
    setStep((prev) => {
      let next = prev + 1;
      while (next < totalSteps - 1 && isSkippedStep(next)) next += 1;
      return Math.min(next, totalSteps - 1);
    });
    scrollToInput();
  };

  const goBack = () => {
    setAnimDir('down');
    setStep((prev) => {
      let next = prev - 1;
      while (next > 0 && isSkippedStep(next)) next -= 1;
      return Math.max(next, 0);
    });
    scrollToInput();
  };

  const publish = async () => {
    if (!user) return;
    if (!effectiveTitle || !description.trim()) {
      toast({ title: 'Missing info', description: 'Add a title — or a brand and model — plus a description.', variant: 'destructive' });
      return;
    }
    if (!location.trim()) {
      toast({ title: 'Missing location', description: 'Location is required to publish your listing.', variant: 'destructive' });
      return;
    }
    if (selectedCats.length === 0) {
      toast({ title: 'Choose a category', description: 'Pick the category that best matches what you are selling.', variant: 'destructive' });
      return;
    }
    if (!validatePriceFields()) return;
    if (categoriesRequireImage(category) && images.length === 0) {
      toast({ title: 'At least 1 photo is required', description: 'Categories like cars, bikes, mobiles and other physical items need at least one image so buyers can see them.', variant: 'destructive' });
      return;
    }

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
          name: displayNameForUser(user, savedFullName, savedUsername),
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
      const effectivePriceType: ListingPriceType = priceOption === 'discussion' ? 'discussion' : priceType;
      const fixedPrice = effectivePriceType === 'fixed' ? Number(price.replace(/,/g, '')) : null;
      const rangeMin = effectivePriceType === 'range' ? Number(priceMin) : null;
      const rangeMax = effectivePriceType === 'range' ? Number(priceMax) : null;
      // "Open to discussion": no numeric price is saved

      // Combine capsule number+unit parts into saved values (e.g., "25 Cents")
      const estateSaved: Record<string, string> = {};
      if (details['landAreaNum']) estateSaved.landArea = `${details['landAreaNum']} ${details['landAreaUnit'] ?? 'Cents'}`;
      if (details['builtUpAreaNum']) estateSaved.builtUpArea = `${details['builtUpAreaNum']} ${details['builtUpAreaUnit'] ?? 'Sqft'}`;
      if (details['houseAreaNum']) estateSaved.houseArea = `${details['houseAreaNum']} ${details['houseAreaUnit'] ?? 'Sqft'}`;
      if (details['houseBhk']) estateSaved.houseBhk = details['houseBhk'];

      const newListingId = await createListing(user.uid, {
        mobileNumber: verifiedMobileValue,
        title: effectiveTitle,
        description: description.trim(),
        category,
        categories: selectedCats.length > 0 ? selectedCats : [category],
        location,
        latitude: mapLocation?.latitude ?? null,
        longitude: mapLocation?.longitude ?? null,
        mapAddress: mapLocation ?? null,
        condition: hideCondition ? ('' as ListingCondition) : condition,
        // Deadline categories: optional auto-end deadline (saved as a Firestore timestamp).
        ...(isDeadlineCategory && deadline ? { deadline } : {}),
        priceType: effectivePriceType,
        price: fixedPrice,
        priceMin: rangeMin,
        priceMax: rangeMax,
        tags: parsedTags,
        images,
        details: Object.keys(estateSaved).length > 0
          ? { ...(category === 'sneakers' && !details['sneakerAudience'] ? { sneakerAudience: 'Adults' } : {}), ...details, ...estateSaved }
          : (Object.keys(details).length > 0 ? { ...(category === 'sneakers' && !details['sneakerAudience'] ? { sneakerAudience: 'Adults' } : {}), ...details } : null),
      });
      toast({ title: 'Published', description: 'Your listing is live.' });
      // AI Match engine: how many buyers need this? Notify the seller (non-blocking)
      import('../services/matchEngine').then(({ matchesForListing, notifyMatch }) =>
        matchesForListing({ id: newListingId, sellerId: user.uid, title: effectiveTitle, description: description.trim(), category, categories: selectedCats.length > 0 ? selectedCats : [category], location, condition, priceType: effectivePriceType, price: fixedPrice, priceMin: rangeMin, priceMax: rangeMax, tags: parsedTags, images, details: Object.keys(details).length > 0 ? details : null, status: 'live' })
          .then((matches) => {
            if (matches.length > 0) {
              notifyMatch({
                userId: user.uid,
                side: 'seller',
                count: matches.length,
                topScore: matches[0].score,
                listingTitle: effectiveTitle,
                targetUrl: `/sell/listing/${newListingId}`,
              }).catch(() => {});
            }
          })
      ).catch(() => {});
      sessionStorage.removeItem('listing-published');
      // Notify users who liked this listing's categories (non-blocking)
      import('@/services/categoryNotifications').then(({ notifyNewListing }) =>
        notifyNewListing({
          categories: selectedCats.length > 0 ? selectedCats : [category],
          authorId: user.uid,
          title: effectiveTitle,
          targetUrl: `/sell/listing/${newListingId}`,
        })
      ).catch(() => {});
      window.setTimeout(() => {
        navigate(`/sell/listing/${newListingId}`);
      }, 2000);
    } catch (error) {
      console.error('❌ Error:', error);
      toast({ title: 'Publish failed', description: friendlyError(error, 'Could not publish listing. Please try again.'), variant: 'destructive' });
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

  return (
    <SellShell
      title="Sell"
      onBack={() => {
        // Inside the wizard: step back a tab (same as the bottom Back
        // button). On the first tab: leave the form via normal history.
        if (step > 0) {
          goBack();
          return;
        }
        navigate(-1);
      }}
    >
      <Card className="sell-form-card border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
        <CardHeader className="space-y-2 pb-4">
          <Progress value={progressPct} className="h-2 rounded-full bg-slate-200 [&>div]:bg-[#15803d]" />
        </CardHeader>

        <CardContent className="pt-6 sm:pt-8 pb-6 flex flex-col">
          {/* Kept as the scroll anchor the step's Back button jumps to. */}
          <div id="step-top" />

          {/* Picked category — carried on every step after the Category tab so the
              seller can see what the form is being filled in for. */}
          {step > 0 && selectedCats.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 -mb-1">
              {selectedCats.map((catValue) => {
                const catLabel = SELL_CATEGORIES.find((c) => c.value === catValue)?.label ?? catValue;
                const Icon = CATEGORY_ICON[catValue] ?? LayoutGrid;
                return (
                  <span
                    key={catValue}
                    className="inline-flex items-center gap-1 px-1 py-1 text-[10px] font-black uppercase tracking-wide text-black"
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
                    {catLabel}
                  </span>
                );
              })}
            </div>
          )}

          <div id="step-title" className="text-center pt-4 mb-4">
            {/* Title styled like the "Enqir" wordmark on the phone sign-in page:
                brush-swash stroke behind the text, no pill/background */}
            <div className="relative mx-auto inline-flex items-center justify-center select-none px-9 sm:px-14 py-7 sm:py-9">
              <svg
                aria-hidden="true"
                viewBox="0 0 640 260"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                style={{ filter: 'drop-shadow(0 2px 0 rgba(17,24,39,0.24)) drop-shadow(0 4px 0 rgba(17,24,39,0.20)) drop-shadow(0 -2px 0 rgba(17,24,39,0.14)) drop-shadow(2px 0 0 rgba(17,24,39,0.16)) drop-shadow(-2px 0 0 rgba(17,24,39,0.16)) drop-shadow(0 10px 12px rgba(17,24,39,0.30))' }}
              >
                <defs>
                  <linearGradient id="brushSwashSell" x1="0" y1="0" x2="1" y2="0.6">
                    <stop offset="0%" stopColor="#bfdbfe" />
                    <stop offset="50%" stopColor="#a9cdfb" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
                <path
                  d="M18 158
                     C 40 120, 96 96, 168 92
                     C 250 86, 330 60, 420 62
                     C 500 64, 570 84, 614 108
                     C 620 112, 620 120, 610 126
                     C 560 158, 470 178, 380 182
                     C 290 186, 190 192, 112 184
                     C 66 180, 30 172, 18 158 Z"
                  fill="url(#brushSwashSell)"
                />
                <path
                  d="M60 150 C 170 118, 330 96, 520 108"
                  stroke="#e0effe"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.5"
                />
                <path
                  d="M96 182 C 180 194, 300 192, 420 178"
                  stroke="#6ea8e6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />
              </svg>
              <h2 className="relative text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-snug whitespace-nowrap">{STEPS[step].key === 'price' && category === 'jobs' ? 'Salary & Photos' : STEPS[step].label}</h2>
          </div>
          </div>

          <div key={step} className="space-y-4" style={{ animation: animDir === "up" ? "stepSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "stepSlideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {step === 0 && (() => {
              const filteredCats = filterCategoriesBySearch(SELL_CATEGORIES, catSearch);
              // Every category keeps its place in the grid — picking one only lights
              // it up as selected, it never jumps to the top.
              const isSearching = catSearch.trim().length > 0;
              const totalPages = Math.ceil(filteredCats.length / CATS_PER_PAGE);
              const paginatedCats = isSearching
                ? filteredCats
                : filteredCats.slice(catPage * CATS_PER_PAGE, (catPage + 1) * CATS_PER_PAGE);
              return (
                <div className="max-w-2xl mx-auto w-full">
                  {/* Search bar */}
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <Search className="h-4 w-4 text-black flex-shrink-0" />
                    </div>
                    <input
                      type="text"
                      value={catSearch}
                      onChange={(e) => { setCatSearch(e.target.value); setCatPage(0); }}
                      placeholder="Search categories..."
                      className="w-full h-12 sm:h-14 min-h-[48px] pr-10 rounded-[12px] border border-black bg-white text-sm font-medium text-slate-900 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] focus:outline-none transition-all duration-200 placeholder:text-black placeholder:font-semibold placeholder:text-[11px]"
                      style={{ paddingLeft: '2.75rem' }}
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

                  {/* Caption removed by request; the spacer keeps the grid where it was. */}
                  <div aria-hidden="true" className="mb-3 h-[13px] sm:h-[14px]" />

                  {/* Category grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {paginatedCats.map((c) => {
                      const Icon = CATEGORY_ICON[c.value] ?? LayoutGrid;
                      const selected = selectedCats.includes(c.value);
                      const disabled = false;
                      const tileImage = CATEGORY_TILE_IMAGES[c.value];
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => toggleCat(c.value)}
                          disabled={disabled}
                          className={cn(
                            'relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 sm:p-4 min-h-[104px] sm:min-h-[118px] text-center transition-all touch-manipulation',
                            selected
                              ? 'border-black bg-blue-600 text-white shadow-none'
                              : disabled
                                ? 'border-black/10 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'border-black/20 bg-white text-black hover:border-black hover:bg-slate-50 shadow-[0_3px_0_0_rgba(0,0,0,0.08)]'
                          )}
                        >
                          {tileImage && (
                            <>
                              {/* Category wallpaper — bright up top, dark behind the label */}
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-cover bg-center brightness-100 saturate-[0.95]"
                                style={{ backgroundImage: `url('${tileImage}')` }}
                              />
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'pointer-events-none absolute inset-0',
                                  selected
                                    ? 'bg-gradient-to-t from-blue-700 via-blue-600/85 to-blue-600/45'
                                    : CATEGORY_TILE_SCRIM
                                )}
                              />
                            </>
                          )}
                          <div
                            className={cn(
                              'relative z-10 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border',
                              selected
                                ? 'border-white/30 bg-white/10'
                                : tileImage
                                  ? 'border-white/25 bg-white/10 text-white backdrop-blur-[2px]'
                                  : 'border-black/10 bg-slate-50'
                            )}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                          </div>
                          <span className={cn('relative z-10 mt-1 translate-y-1 sm:translate-y-1.5 text-[10px] sm:text-xs font-black leading-tight', tileImage && 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]')}>{c.label}</span>
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
                          const selected = selectedCats.includes('other');
                          return (
                            <button
                              type="button"
                              onClick={() => toggleCat('other')}
                              className={cn(
                                'flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation',
                                selected
                                  ? 'border-black bg-blue-600 text-white shadow-none'
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
              <div className="sell-pills relative flex flex-col space-y-2 max-w-lg mx-auto w-full">
                {/* Single quiet line-art doodle — seller offering */}
                <SellerCartoon className="pointer-events-none absolute -top-8 -right-4 sm:-right-10 h-20 w-20 sm:h-24 sm:w-24 opacity-[0.6] select-none" aria-hidden="true" />
                <div className="relative">
                <Input
                  id="listing-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    // The title writes back to the picker: deleting the whole
                    // title clears everything, deleting just the model keeps the
                    // brand and resets only what hung off the model.
                    const typed = e.target.value.trim();
                    if (category === 'laptops') {
                      const brand = details['brand'] ?? '';
                      if (!typed) {
                        setDetail('brand', ''); setDetail('model', ''); setDetail('storage', ''); setDetail('processor', '');
                      } else if (brand && typed.toLowerCase() === brand.toLowerCase()) {
                        setDetail('model', ''); setDetail('storage', ''); setDetail('processor', '');
                      }
                    }
                    if (category === 'camera') {
                      if (!typed) {
                        setDetail('brand', ''); setDetail('model', '');
                      } else if (details['brand'] && typed.toLowerCase() === details['brand'].toLowerCase()) {
                        setDetail('model', '');
                      }
                    }
                    if (category === 'watches') {
                      if (!typed) {
                        setDetail('brand', ''); setDetail('model', '');
                      } else if (details['brand'] && typed.toLowerCase() === details['brand'].toLowerCase()) {
                        setDetail('model', '');
                      }
                    }
                    if (category === 'audio-headphones') {
                      if (!typed) {
                        setDetail('brand', ''); setDetail('model', '');
                      } else if (details['brand'] && typed.toLowerCase() === details['brand'].toLowerCase()) {
                        setDetail('model', '');
                      }
                    }
                    // Vehicles: deleting the title drops the type + brand picks, and
                    // trimming it back to just one of them drops the other.
                    if (category === 'vehicles') {
                      if (!typed) {
                        setDetail('vehicleType', ''); setDetail('brand', '');
                      } else if (details['brand'] && typed.toLowerCase() === details['brand'].toLowerCase()) {
                        // Only the maker is left ("Ashok Leyland"), so the body type
                        // was the part that got deleted — drop the type, keep the brand.
                        setDetail('vehicleType', '');
                      } else if (details['vehicleType'] && typed.toLowerCase() === details['vehicleType'].toLowerCase()) {
                        setDetail('brand', '');
                      }
                    }
                    // Car: deleting the title drops the brand + model picks, and
                    // trimming it back to just the brand drops only the model.
                    if (category === 'car') {
                      if (!typed) {
                        setDetail('brand', ''); setDetail('model', '');
                      } else if (details['brand'] && typed.toLowerCase() === details['brand'].toLowerCase()) {
                        setDetail('model', '');
                      }
                    }
                    // The subcategory only stands while the title still says it —
                    // except "Other ...", which the seller is meant to describe in
                    // their own words, so typing there must not undo the pick.
                    if (details['subcategory'] && (
                      !typed ||
                      (!details['subcategory'].startsWith('Other ') && typed.toLowerCase() !== details['subcategory'].toLowerCase())
                    )) {
                      setDetail('subcategory', '');
                    }
                    // If the user types a title that exactly equals another
                    // service name, switch the Service-type dropdown to it.
                    // Any other title edit leaves the dropdown untouched.
                    if (category === 'service') {
                      const typed = e.target.value.trim();
                      const match = REPAIR_SERVICE_TYPES.find(t => t.toLowerCase() === typed.toLowerCase());
                      setDetail('repairType', match ?? details['repairType'] ?? '');
                    }
                  }}
                  placeholder=""
                  className="rounded-2xl h-12 sm:h-14 text-base border-[1.5px] border-slate-200 bg-white focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 min-touch pl-4 pr-4 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200"
                  maxLength={1000}
                  autoFocus={canAutoFocus()}
                />
                {/* Rotating placeholder — dull examples roll down inside the input box every 3s;
                    Vehicles rolls truck / earthmover / tractor models instead of product examples */}
                {!title && (() => {
                  const hints = titleHintsFor(category);
                  return (
                    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none rounded-2xl" aria-hidden="true">
                      {titleHintIdx > 0 && (
                        <span key={`title-hint-out-${titleHintIdx}`} className="kw-roll-out absolute inset-0 flex items-center justify-start pl-4 pr-4 leading-tight text-[11px] font-semibold text-gray-400">
                          Title — {hints[(titleHintIdx - 1 + hints.length) % hints.length]}
                        </span>
                      )}
                      <span key={`title-hint-in-${titleHintIdx}`} className="kw-roll-down absolute inset-0 flex items-center justify-start pl-4 pr-4 leading-tight text-[11px] font-semibold text-gray-400">
                        Title — {hints[titleHintIdx % hints.length]}
                      </span>
                    </div>
                  );
                })()}
                </div>
                {fieldsForCategoryStep(category, 'title').length > 0 && (
                  <div className="order-first flex flex-wrap items-center justify-end gap-3 -mt-1" style={{ marginBottom: '1rem' }}>
                    {fieldsForCategoryStep(category, 'title').map((f, fieldIdx) => {
                      // Pets keep the breed/training pickers hidden until a pet type
                      // is chosen (same gating the Description-step fields use).
                      if (isFieldHiddenForDetails(f, details)) return null;
                      // Laptop models are the ones the picked brand actually sells.
                      // The picked brand's models, plus Other for anything unlisted
                      const fieldOptions = f.key === 'brand' && category === 'vehicles'
                        ? getVehicleBrandsForType(details['vehicleType'] ?? '')
                        : f.key === 'model' && category === 'car'
                        ? (details['brand'] === CAR_MODEL_OTHER
                            ? [CAR_MODEL_OTHER]
                            : [...getCarModels(details['brand'] ?? ''), CAR_MODEL_OTHER])
                        : f.key === 'model' && category === 'bike'
                        ? (details['brand'] === BIKE_MODEL_OTHER
                            ? [BIKE_MODEL_OTHER]
                            : [...getBikeModels(details['brand'] ?? ''), BIKE_MODEL_OTHER])
                        : f.key === 'model' && category === 'audio-headphones'
                        ? (details['brand'] === AUDIO_OTHER
                            ? [AUDIO_OTHER]
                            : [...getAudioModels(details['brand'] ?? ''), AUDIO_OTHER])
                        : f.key === 'model' && category === 'camera'
                        ? (details['brand'] === 'Other'
                            ? ['Other']
                            : [...getCameraModels(details['brand'] ?? ''), 'Other'])
                        : f.key === 'model' && category === 'watches'
                        ? (details['brand'] === WATCH_OTHER
                            ? [WATCH_OTHER]
                            : [...getWatchModels(details['brand'] ?? ''), WATCH_OTHER])
                        : f.key === 'model' && category === 'laptops'
                        ? (details['brand'] === LAPTOP_OTHER
                            ? [LAPTOP_OTHER]
                            : [...getLaptopModels(details['brand'] ?? ''), LAPTOP_OTHER])
                        : f.key === 'model' && category === 'mobiles'
                        ? (details['brand'] === MOBILE_OTHER
                            ? [MOBILE_OTHER]
                            : [...getMobileModels(details['brand'] ?? ''), MOBILE_OTHER])
                        : f.key === 'storage' && category === 'mobiles'
                        ? getMobileStorageOptions(details['brand'] ?? '', details['model'] ?? '')
                        : f.key === 'petBreed' && category === 'pets'
                        ? petBreedsFor(details['subcategory'] ?? '')
                        : f.key === 'brand' && category === 'bicycles'
                        ? getBicycleBrands(details['subcategory'] ?? '')
                        : f.key === 'model' && category === 'bicycles'
                        ? getBicycleModels(details['brand'] ?? '')
                        : (f.options ?? []);
                      // Every dropdown hugs the text it shows (its placeholder, or
                      // the picked value once chosen) instead of a fixed column.
                      const shortSubcategory = category === 'electronics' && f.key === 'subcategory';
                      const isDropdown = !f.typeable && f.type !== 'text' && f.type !== 'number';
                      // Only a tab that holds a single dropdown gets the hugs-text
                      // treatment; tabs with several (car, vehicles, bike) keep
                      // their normal even widths.
                      const titleDropdowns = fieldsForCategoryStep(category, 'title')
                        .filter((field) => !field.typeable && field.type !== 'text' && field.type !== 'number').length;
                      const hugText = isDropdown && titleDropdowns <= 1;
                      // A picked car brand shows its logo in the dropdown instead of
                      // the name, matching the Post Enquiry brand picker.
                      const pickedBrandLogo = (category === 'car' || category === 'vehicles') && f.key === 'brand' && details['brand'] && details['brand'] !== 'Other'
                        ? getCarBrandLogoUrl(details['brand'])
                        : null;
                      return (
                      // A tab with exactly three dropdowns leaves the third one alone on
                      // the second line, so it is centred in that line instead of being
                      // pushed to the right edge with the rest of the row.
                      <div key={f.key} className={`relative ${category === 'pets' ? (f.key === 'petBreed' ? 'w-[62%]' : 'w-[47%]') : shortSubcategory ? 'electronics-pill max-w-full' : f.key === 'subcategory' ? 'max-w-full' : 'w-[48%]'} max-w-full`} style={category === 'bicycles' && (f.key === 'subcategory' || f.key === 'year') ? { marginLeft: 'auto', marginRight: 'auto' } : hugText ? { width: '70%', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' } : f.key === 'repairType' ? { marginLeft: 'auto' } : titleDropdowns === 3 && fieldIdx === 2 ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>
                        {f.key !== 'brand' && f.key !== 'model' && f.key !== 'storage' && f.key !== 'subcategory' && f.key !== 'repairType' && f.key !== 'transmission' && f.key !== 'vehicleType' && f.key !== 'cleaningTypes' && category !== 'pets' && !((category === 'car' || category === 'bike') && f.key === 'year') && (
                          // The bicycle year and the jobs "Listing for" pick add no
                          // label: their placeholder names them, and the node stays in
                          // place so the spacing does not move.
                          <p className={`absolute left-0 right-0 top-full text-[8px] font-bold text-black mt-1 text-center pointer-events-none tracking-wide ${(category === 'bicycles' && f.key === 'year') || f.key === 'jobListingFor' ? 'invisible' : ''}`}>{f.label}</p>
                        )}
                        {f.key === 'cleaningTypes' ? (() => {
                          // A native dropdown (so it pops open like Brand/Model)
                          // that adds each pick to a list below, giving several
                          // cleaning types without a custom popup.
                          const picked = details['cleaningTypes'] ? details['cleaningTypes'].split(', ') : [];
                          return (
                            <div className="w-full">
                              <div className="relative">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (!v) return;
                                    // Picks name the listing, the way laptop brand and
                                    // model do: each cleaning type joins the title.
                                    const next = picked.includes(v) ? picked : [...picked, v];
                                    setDetail('cleaningTypes', next.join(', '));
                                    setTitle(next.join(', '));
                                  }}
                                  className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-9 text-[11px] font-semibold text-gray-900 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] ${picked.length > 0 ? '!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none !text-white' : ''}`}
                                >
                                  <option value="">Add cleaning type</option>
                                  {[...CLEANING_SERVICE_TYPES, 'All cleaning', 'Other'].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${picked.length > 0 ? 'text-white' : 'text-gray-800'}`} />
                              </div>
                              {picked.length > 0 && (
                                <div ref={cleaningChipsRef}
                                className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                  {picked.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => {
                                        const next = picked.filter((v) => v !== t);
                                        setDetail('cleaningTypes', next.join(', '));
                                        setTitle(next.join(', '));
                                      }}
                                      className="inline-flex shrink-0 !min-h-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-gray-800"
                                    >
                                      {t}
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })() : f.typeable || f.type === 'number' ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={details[f.key] ?? ''}
                            onChange={(e) => setDetail(f.key, e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder={f.placeholder ?? 'Type year'}
                            className={`w-full rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-medium ${category === 'vehicles' && f.key === 'year' ? 'border-2 border-gray-800' : 'border-[1.5px] border-slate-200'} focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 bg-white text-black placeholder:text-gray-900 placeholder:font-semibold shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${category === 'car' && f.key === 'year' ? 'pl-3 pr-3 placeholder:text-[8px] placeholder:tracking-tight' : 'pl-4 pr-4 placeholder:text-[11px]'}${category === 'bicycles' && f.key === 'year' ? ' text-center placeholder:text-center' : ''}${(category === 'car' || category === 'vehicles' || category === 'bicycles') && f.key === 'year' && (details[f.key] ?? '').length === 4 ? ' !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !placeholder:text-white !border-blue-700 !shadow-none' : ''}`}
                          />
                        ) : f.type === 'text' ? (
                          <Input
                            type="text"
                            maxLength={40}
                            value={details[f.key] ?? ''}
                            onChange={(e) => setDetail(f.key, e.target.value)}
                            placeholder={f.placeholder ?? 'Type here'}
                            className="w-full rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 bg-white pl-4 pr-4 text-black placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200"
                          />
                        ) : (
                          <>
                            <select
                              value={details[f.key] ?? ''}
                              disabled={(f.key === 'model' && category === 'car' && !details['brand']) || (f.key === 'model' && category === 'audio-headphones' && !details['brand']) || (f.key === 'model' && category === 'laptops' && !details['brand']) || (f.key === 'model' && category === 'camera' && !details['brand']) || (f.key === 'model' && category === 'watches' && !details['brand']) || (f.key === 'model' && category === 'mobiles' && !details['brand']) || (f.key === 'storage' && category === 'mobiles' && !details['model']) || (f.key === 'brand' && category === 'bicycles' && !details['subcategory']) || (f.key === 'model' && category === 'bicycles' && !details['brand'])}
                              onChange={(e) => {
                                setDetail(f.key, e.target.value);
                                // Switching a jobs post to "To apply" drops everything
                                // typed for the hiring side, so the role fields start
                                // clean.
                                if (f.key === 'jobListingFor' && e.target.value === 'To apply') {
                                  ['education', 'stream', 'experience', 'jobType', 'skills'].forEach((k) => setDetail(k, ''));
                                }
                                // A different brand invalidates the model and its storage
                                if (f.key === 'brand' && category === 'laptops') {
                                  setDetail('model', ''); setDetail('storage', ''); setDetail('processor', '');
                                  // The title mirrors the picker — except for "Other",
                                  // which has no name worth filling in.
                                  setTitle(e.target.value === LAPTOP_OTHER ? '' : e.target.value);
                                }
                                if (f.key === 'vehicleType' && category === 'vehicles') {
                                  setDetail('brand', ''); setDetail('variant', ''); setDetail('year', '');
                                  setDetail('transmission', ''); setDetail('fuel', '');
                                  // Maker first, then the body type — "Ashok Leyland Lorry",
                                  // the way people name commercial vehicles.
                                  setTitle(e.target.value === 'Other' ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'brand' && category === 'vehicles') {
                                  setDetail('variant', ''); setDetail('year', '');
                                  setDetail('transmission', ''); setDetail('fuel', '');
                                  setTitle(e.target.value === 'Other' ? '' : [e.target.value, details['vehicleType']].filter(Boolean).join(' '));
                                }
                                // A car's picks below the model belong to that model, so a
                                // new brand or model drops the variant, year, transmission
                                // and fuel already chosen.
                                if (f.key === 'brand' && category === 'car') {
                                  setDetail('model', ''); setDetail('variant', ''); setDetail('year', '');
                                  setDetail('transmission', ''); setDetail('fuel', '');
                                  setTitle(e.target.value === CAR_MODEL_OTHER ? '' : e.target.value);
                                }
                                if (f.key === 'model' && category === 'car') {
                                  setDetail('variant', ''); setDetail('year', '');
                                  setDetail('transmission', ''); setDetail('fuel', '');
                                  const unknownCar = e.target.value === CAR_MODEL_OTHER || details['brand'] === CAR_MODEL_OTHER;
                                  setTitle(unknownCar ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                // Bikes cascade the same way: a new brand clears the
                                // model, and the title mirrors brand + model.
                                if (f.key === 'brand' && category === 'bike') {
                                  setDetail('model', '');
                                  setTitle(e.target.value === BIKE_MODEL_OTHER ? '' : e.target.value);
                                }
                                if (f.key === 'model' && category === 'bike') {
                                  const unknownBike = e.target.value === BIKE_MODEL_OTHER || details['brand'] === BIKE_MODEL_OTHER;
                                  setTitle(unknownBike ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'brand' && category === 'audio-headphones') {
                                  setDetail('model', '');
                                  setTitle(e.target.value === AUDIO_OTHER ? '' : e.target.value);
                                }
                                if (f.key === 'model' && category === 'audio-headphones') {
                                  const unknownAudio = e.target.value === AUDIO_OTHER || details['brand'] === AUDIO_OTHER;
                                  setTitle(unknownAudio ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'brand' && category === 'camera') {
                                  setDetail('model', '');
                                  setTitle(e.target.value === 'Other' ? '' : e.target.value);
                                }
                                if (f.key === 'brand' && category === 'watches') {
                                  setDetail('model', '');
                                  setTitle(e.target.value === WATCH_OTHER ? '' : e.target.value);
                                }
                                // A phone's model belongs to its brand, so a new brand
                                // clears the model picked under the old one.
                                // A phone's picks write the listing title the way the
                                // laptop picker does: brand, then brand + model, then
                                // brand + model + storage. "Other" has no name worth
                                // filling in, so it leaves the title to the seller.
                                if (f.key === 'brand' && category === 'mobiles') {
                                  setDetail('model', ''); setDetail('storage', '');
                                  setTitle(e.target.value === MOBILE_OTHER ? '' : e.target.value);
                                }
                                if (f.key === 'model' && category === 'mobiles') {
                                  setDetail('storage', '');
                                  const unknownMobile = e.target.value === MOBILE_OTHER || details['brand'] === MOBILE_OTHER;
                                  setTitle(unknownMobile ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                // Bicycles: type -> brand -> model, and the picks name
                                // the listing the way laptop brand and model do.
                                if (f.key === 'subcategory' && category === 'bicycles') {
                                  setDetail('brand', ''); setDetail('model', '');
                                  setTitle(e.target.value);
                                }
                                // Pets: a new pet type clears the breed that belonged
                                // to the old one and names the listing the way the
                                // laptop picker does: type first, then breed + type
                                // ("Siberian Husky Dog"). "Other ..." has no name worth
                                // filling in, so the seller writes the title instead.
                                if (f.key === 'subcategory' && category === 'pets') {
                                  // Training is its own pick, so a new pet type only
                                  // clears the breed that belonged to the old one.
                                  setDetail('petBreed', '');
                                  setTitle(petListingTitle(details, { subcategory: e.target.value, petBreed: '' }));
                                }
                                if (f.key === 'petBreed' && category === 'pets') {
                                  setTitle(petListingTitle(details, { petBreed: e.target.value }));
                                }
                                // Training joins the same title after the pet name.
                                if (f.key === 'petTraining' && category === 'pets') {
                                  setTitle(petListingTitle(details, { petTraining: e.target.value }));
                                }
                                if (f.key === 'brand' && category === 'bicycles') {
                                  setDetail('model', '');
                                  const bikeType = details['subcategory'] ?? '';
                                  setTitle(e.target.value === 'Other' ? bikeType : [bikeType, e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'model' && category === 'bicycles') {
                                  const bikeType = details['subcategory'] ?? '';
                                  const bikeBrand = details['brand'] ?? '';
                                  const unknownBike = e.target.value === 'Other' || bikeBrand === 'Other';
                                  setTitle(unknownBike ? [bikeType, bikeBrand === 'Other' ? '' : bikeBrand].filter(Boolean).join(' ') : [bikeType, bikeBrand, e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'storage' && category === 'mobiles') {
                                  const mobileBrand = details['brand'] ?? '';
                                  const mobileModel = details['model'] ?? '';
                                  if (mobileBrand && mobileModel && mobileBrand !== MOBILE_OTHER && mobileModel !== MOBILE_OTHER) {
                                    setTitle([mobileBrand, mobileModel, e.target.value].filter(Boolean).join(' '));
                                  }
                                }
                                if (f.key === 'model' && category === 'watches') {
                                  const unknownWatch = e.target.value === WATCH_OTHER || details['brand'] === WATCH_OTHER;
                                  setTitle(unknownWatch ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'model' && category === 'laptops') {
                                  setDetail('storage', '');
                                  const unknownModel = e.target.value === LAPTOP_OTHER || details['brand'] === LAPTOP_OTHER;
                                  setTitle(unknownModel ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                if (f.key === 'model' && category === 'camera') {
                                  const unknownCamera = e.target.value === 'Other' || details['brand'] === 'Other';
                                  setTitle(unknownCamera ? '' : [details['brand'], e.target.value].filter(Boolean).join(' '));
                                }
                                // Kitchen & Dining: the subcategory is the listing's name,
                                // except "Other", which the seller has to describe themselves.
                                if (f.key === 'subcategory') {
                                  setTitle(e.target.value.startsWith('Other ') ? '' : e.target.value);
                                }
                                // Picking a service prefills the title (editable).
                                // Only overwrite when the title is empty or still
                                // exactly equals the previous auto-filled service.
                                if (f.key === 'repairType' && category === 'service') {
                                  const v = e.target.value;
                                  const prev = details['repairType'] ?? '';
                                  if (v && (title.trim() === '' || title.trim().toLowerCase() === prev.toLowerCase())) {
                                    setTitle(v);
                                  }
                                }
                              }}
                              className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-9 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${details[f.key] ? `!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 ${pickedBrandLogo ? '!text-transparent' : '!text-white'} !border-blue-700 !shadow-none` : '!bg-black !bg-none !border-black'} ${!details[f.key] ? (category === 'pets' ? 'text-[11px] sm:text-xs text-transparent' : 'text-[10px] text-transparent') : `text-[11px] sm:text-xs !font-bold ${pickedBrandLogo ? '!text-transparent' : '!text-white'}`}`}
                            >
                              <option value="">Cancel</option>
                              {fieldOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            {pickedBrandLogo && (
                              <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pr-10">
                                {/* White backing so dark marks read on the blue pill. */}
                                <span className="flex h-8 max-w-[78%] items-center justify-center rounded-full bg-white px-2">
                                  <img
                                    decoding="async"
                                    src={pickedBrandLogo}
                                    alt=""
                                    loading="lazy"
                                    className="h-6 w-auto max-w-full object-contain"
                                  />
                                </span>
                              </span>
                            )}
                            {!details[f.key] && (
                              <span className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 truncate px-4 pr-12 text-center text-[10px] font-semibold text-white">
                                {f.placeholder ?? 'Select'}
                              </span>
                            )}
                            <span className="pointer-events-none absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black">
                              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                            </span>
                          </>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}
                <div className="h-4" />
              </div>
            )}

            {step === 2 && (
              <div className="sell-pills space-y-2 max-w-lg mx-auto w-full">
                {/* Sneaker details — Adults or Kids first, then the brand, model
                    and the size scale that matches (kids listings only offer kids
                    models and kids sizes). */}
                {category === 'sneakers' && (() => {
                  const audience = details['sneakerAudience'] || 'Adults';
                  const sneakerSize = details['sneakerSize'] ?? '';
                  const sneakerBrandVal = details['sneakerBrand'] ?? '';
                  const sneakerModelVal = details['sneakerModel'] ?? '';
                  const sizeList = audience === 'Kids' ? SNEAKER_SIZES_KIDS : SNEAKER_SIZES_ADULTS;
                  const brandOptions = getSneakerBrands(audience);
                  const modelOptions = sneakerBrandVal ? getSneakerModels(sneakerBrandVal, audience) : [];
                  const sneakerLogo = sneakerBrandVal ? getSneakerBrandLogoUrl(sneakerBrandVal) : null;
                  const pillCls = (filled: boolean) => `w-full appearance-none rounded-full h-9 sm:h-10 font-semibold text-[8px] text-center [text-align-last:center] border-2 focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-0 bg-white pl-3 pr-8 ${filled ? '!text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none' : 'border-black text-gray-900 text-[8px] font-semibold'}`;
                  return (
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-3">
                        {/* Adults / Kids — drives brand, model and size */}
                        <div className="flex-1 min-w-0 relative">
                          <select
                            value={audience}
                            onChange={(e) => {
                              setDetail('sneakerAudience', e.target.value);
                              setDetail('sneakerBrand', '');
                              setDetail('sneakerModel', '');
                              setDetail('sneakerSize', '');
                            }}
                            aria-label="Sneaker audience"
                            className={pillCls(true)}
                          >
                            {SNEAKER_AUDIENCES.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                        {/* Brand — every brand for adults, only kids makers for kids;
                            the picked brand shows its logo inside the button. */}
                        <div className="flex-[2] min-w-0 relative">
                          {(() => {
                            const sneakerLogo = sneakerBrandVal ? getSneakerBrandLogoUrl(sneakerBrandVal) : null;
                            return (
                              <>
                                <select
                                  value={sneakerBrandVal}
                                  onChange={(e) => { setDetail('sneakerBrand', e.target.value); setDetail('sneakerModel', ''); }}
                                  aria-label="Sneaker brand"
                                  className={`${pillCls(!!sneakerBrandVal)} ${sneakerLogo ? 'pl-10' : ''}`}
                                >
                                  <option value="">Brand</option>
                                  {brandOptions.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                  <option value="Other">Other</option>
                                </select>
                                {sneakerLogo && (
                                  <img decoding="async" src={sneakerLogo}
                                    alt=""
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 object-contain pointer-events-none"
                                    loading="lazy"
                                  />
                                )}
                              </>
                            );
                          })()}
                          <ChevronDown className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3 mt-2">
                        {/* Model — the brand's adult range, or its kids models */}
                        <div className="flex-[2] min-w-0 relative">
                          <select
                            value={sneakerModelVal}
                            disabled={!sneakerBrandVal}
                            onChange={(e) => setDetail('sneakerModel', e.target.value)}
                            aria-label="Sneaker model"
                            className={`${pillCls(!!sneakerModelVal)} ${!sneakerBrandVal ? 'bg-slate-100 text-gray-400' : ''}`}
                          >
                            <option value="">Model</option>
                            {modelOptions.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                        {/* Size — kids scale for Kids, adult scale for Adults */}
                        <div className="flex-1 min-w-0 relative">
                          <select
                            value={sneakerSize}
                            onChange={(e) => setDetail('sneakerSize', e.target.value)}
                            aria-label="Sneaker size"
                            className={pillCls(!!sneakerSize)}
                          >
                            <option value="">Size</option>
                            {sizeList.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Real-estate — selection buttons + big capsules above the description */}
                {(() => {
                  const LAND_UNITS = ['Cents', 'Acre', 'Hectare'];
                  const BUILT_UNITS = ['Sqft'];
                  const HOUSE_UNITS = ['Sqft'];
                  const BHK_OPTIONS = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
                  // Estate capsules (Land/Buildings/House/Others + Sale/Rent/Lease)
                  // apply ONLY to the 'real-estate' category — Real Estate Services
                  // is a services listing and gets none of them.
                  const isEstate = category === 'real-estate';
                  if (!isEstate) return null;
                  const TYPES: { key: string; label: string }[] = [
                    { key: 'land', label: 'Land / Plot' },
                    { key: 'built', label: 'Buildings / Commercial' },
                    { key: 'house', label: 'House' },
                    { key: 'flat', label: 'Flat' },
                    { key: 'other', label: 'Others' },
                  ];
                  const unit = details['landAreaUnit'] ?? 'Cents';
                  const units = LAND_UNITS;
                  const areaVal = estateType === 'land' ? (details['landAreaNum'] ?? '') : estateType === 'built' ? (details['builtUpAreaNum'] ?? '') : (details['houseAreaNum'] ?? '');
                  const areaKey = estateType === 'land' ? 'landAreaNum' : estateType === 'built' ? 'builtUpAreaNum' : 'houseAreaNum';
                  const unitKey = estateType === 'land' ? 'landAreaUnit' : estateType === 'built' ? 'builtUpAreaUnit' : 'houseAreaUnit';
                  return (
                    <div className="space-y-2 pt-2">
                      {/* Deal type dropdown — For Sale / For Rent / For Lease; LOCKED once a property type is chosen. */}
                      <div className="flex justify-center mb-6">
                        <div className="relative w-full max-w-xs">
                          <select
                            value={details['listingFor'] ?? ''}
                            disabled={!!estateType}
                            onChange={(e) => { if (!estateType) setDetail('listingFor', e.target.value); }}
                            className={cn(
                              'w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200',
                              !details['listingFor'] ? 'text-[10px] text-gray-700 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none',
                              !!estateType && 'opacity-60 cursor-not-allowed'
                            )}
                          >
                            <option value="" disabled hidden>Select listing type</option>
                            {(['Sale', 'Rent', 'Lease'] as const).map((dt) => (
                              <option key={dt} value={dt}>{dt === 'Sale' ? 'For Sale' : dt}</option>
                            ))}
                            <option value="">Cancel</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                        </div>
                      </div>
                      {/* Property type dropdown — Land/Plot, Buildings/Commercial, House, Flat, Others */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 self-start">
                        <div className="relative w-full max-w-xs">
                          <select
                            value={estateType}
                            onChange={(e) => {
                              const next = e.target.value as typeof estateType;
                              // Auto-clear the previous type's saved data when the selection changes (replaces the old ✕ Clear button)
                              if (next !== estateType) {
                                if (estateType === 'land') { setDetail('landAreaNum', ''); }
                                else if (estateType === 'built') { setDetail('builtUpAreaNum', ''); }
                                else if (estateType === 'house' || estateType === 'flat') { setDetail('houseAreaNum', ''); setDetail('houseBhk', ''); }
                              }
                              setEstateType(next);
                            }}
                            className={cn(
                              'w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200',
                              !estateType ? 'text-[10px] text-gray-700 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'
                            )}
                          >
                            <option value="" disabled hidden>Select property type</option>
                            {TYPES.map((t) => (
                              <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                            <option value="">Cancel</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                        </div>
                      </div>
                      {/* Two separate capsules — number input + unit dropdown (only for non-Other types) */}
                      {estateType && estateType !== 'other' && (
                        <div className="flex items-stretch gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={areaVal}
                            onChange={(e) => setDetail(areaKey, e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                            placeholder={(estateType === 'house' || estateType === 'flat') ? '1000 sqft' : estateType === 'built' ? '10000 sqft / 25 acres..' : '25 acres..'}
                            style={{ outline: 'none' }}
                            className="flex-1 min-w-0 h-12 sm:h-14 rounded-full border-2 border-gray-400 bg-white text-center text-sm sm:text-base font-bold text-black outline-none focus:border-[3px] focus:border-gray-900 px-3 placeholder:text-[10px] placeholder:text-slate-400 placeholder:font-semibold shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)]"
                          />
                          {estateType === 'land' && (
                            <div className="relative flex-shrink-0">
                              <select
                                value={unit}
                                onChange={(e) => setDetail(unitKey, e.target.value)}
                                className="h-12 sm:h-14 rounded-full border-2 border-gray-400 bg-white text-center text-xs sm:text-sm font-bold text-black outline-none focus:border-[3px] focus:border-gray-900 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] appearance-none pl-4 pr-8 cursor-pointer"
                                style={{ textAlignLast: 'center', outline: 'none' } as React.CSSProperties}
                              >
                                {units.map((u) => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                            </div>
                          )}
                          {(estateType === 'house' || estateType === 'flat') && (
                            <div className="relative flex-shrink-0">
                              <select
                                value={details['houseBhk'] ?? ''}
                                onChange={(e) => setDetail('houseBhk', e.target.value)}
                                className={cn('h-12 sm:h-14 rounded-full border-2 border-gray-400 bg-white text-center text-xs sm:text-sm font-bold outline-none focus:border-[3px] focus:border-gray-900 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] appearance-none pl-4 pr-8 cursor-pointer', !details['houseBhk'] ? 'text-gray-900 font-semibold' : '!text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none')}
                                style={{ textAlignLast: 'center', outline: 'none' } as React.CSSProperties}
                              >
                                <option value="">BHK</option>
                                {BHK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {!['real-estate', 'real-estate-services'].includes(category) && fieldsForCategoryStep(category, 'description').length > 0 && (
                  <div className="space-y-3 pt-2">
                    {/* Thrift — Gender → Type → Item; each level appears once its parent is picked */}
                    {category === 'thrift' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="relative">
                            <select
                              value={details['thriftGender'] ?? ''}
                              onChange={(e) => { setDetail('thriftGender', e.target.value); resetThriftBelow('gender'); }}
                              className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['thriftGender'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                            >
                              <option value="" disabled>Select gender</option>
                              {THRIFT_GENDERS.map((g) => <option key={g.value} value={g.label}>{g.label}</option>)}
                              <option value="">Cancel</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                          </div>
                          {details['thriftGender'] && (
                            <div className="relative">
                              <select
                                value={details['thriftType'] ?? ''}
                                onChange={(e) => { setDetail('thriftType', e.target.value); resetThriftBelow('type'); }}
                                className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['thriftType'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                              >
                                <option value="" disabled>Select type</option>
                                {THRIFT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                <option value="">Cancel</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                            </div>
                          )}
                        </div>
                        {details['thriftGender'] && details['thriftType'] && (
                          <div className="relative">
                            <select
                              value={details['thriftItem'] ?? ''}
                              onChange={(e) => setDetail('thriftItem', e.target.value)}
                              className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['thriftItem'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                            >
                              <option value="" disabled>Select item</option>
                              {thriftItemsFor(details['thriftGender'], details['thriftType']).map((item) => <option key={item} value={item}>{item}</option>)}
                              <option value="">Cancel</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                          </div>
                        )}
                        {details['thriftType'] && thriftSizesFor(details['thriftType']).length > 0 && (
                          <div className="relative">
                            <select
                              value={details['thriftSize'] ?? ''}
                              onChange={(e) => setDetail('thriftSize', e.target.value)}
                              className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['thriftSize'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                            >
                              <option value="" disabled>Select size</option>
                              {thriftSizesFor(details['thriftType']).map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                              <option value="">Cancel</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Creative toggle-style fields (e.g., transmission) — shown above the description */}
                    {(() => {
                      // Sneaker brand/audience/size are rendered by the custom
                      // Post-Enquiry-style block above, not by the generic fields.
                      const descFields = fieldsForCategoryStep(category, 'description')
                        .filter((f) => !isFieldHiddenForDetails(f, details))
                        // The motorcycle year is drawn above the description box instead.
                        .filter((f) => !(category === 'bike' && f.key === 'year'))
                        .filter((f) => !['sneakerBrand', 'sneakerAudience', 'sneakerSize', 'cleaningTypes', 'thriftGender', 'thriftType', 'thriftItem', 'thriftSize'].includes(f.key));
                      // Car transmission is a 2-option field but it belongs here as a
                      // dropdown, not the on/off toggle the other 2-option fields use.
                      const toggleFields = descFields.filter((f) => (f.options?.length ?? 0) === 2 && f.key !== 'transmission');
                      const selectFields = descFields.filter((f) => (f.options?.length ?? 0) !== 2 || f.key === 'transmission');
                      return (
                        <>
                          {toggleFields.length > 0 && (
                            <div className={`grid grid-cols-1 ${category === 'laptops' ? '' : 'sm:grid-cols-2'} gap-3`}>
                              {toggleFields.map((f) => {
                                const val = details[f.key] ?? '';
                                const isOn = val === f.options![1];
                                return (
                                  <div key={f.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5">
                                    <span className="text-xs sm:text-sm font-bold text-black">{f.label}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setDetail(f.key, f.options![0])}
                                        className={cn('text-[10px] font-black uppercase tracking-wide transition-colors', val === f.options![0] ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600')}
                                      >
                                        {f.options![0]}
                                      </button>
                                      <button
                                        type="button"
                                        role="slider"
                                        aria-label={f.label}
                                        aria-valuenow={val || undefined}
                                        onClick={() => setDetail(f.key, val === f.options![1] ? f.options![0] : f.options![1])}
                                        className="relative inline-flex h-[24px] w-[50px] items-center rounded-full flex-shrink-0 bg-black"
                                      >
                                        <span
                                          className="absolute left-0 top-1/2 h-[30px] w-[30px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] will-change-transform transition-transform duration-300 ease-in-out"
                                          style={{ transform: val === f.options![1] ? 'translate(20px, -50%)' : 'translate(0px, -50%)' }}
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDetail(f.key, f.options![1])}
                                        className={cn('text-[10px] font-black uppercase tracking-wide transition-colors', val === f.options![1] ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600')}
                                      >
                                        {f.options![1]}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {selectFields.length > 0 && (
                            <div className={`grid gap-3 ${category === 'car' ? 'car-pill grid-cols-2' : category === 'bicycles' || category === 'vehicles' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                              {selectFields.map((f) => (
                                // On mobile the year box sits at the top of the tab;
                                // from sm upwards it keeps its array position. Cars
                                // are the exception: their variant leads the tab.
                                <div
                                  key={f.key}
                                  className={`space-y-2 ${category === 'bicycles' && f.key === 'bicycleRepair' ? 'col-span-2' : category === 'bicycles' && f.key === 'year' ? 'order-first col-span-2' : f.key === 'year' && category !== 'vehicles' && category !== 'car' ? 'order-first sm:order-none' : ''} ${category === 'car' && (f.key === 'variant' || f.key === 'year') ? 'sm:col-span-2' : ''} ${category === 'vehicles' && (f.type === 'text' || f.type === 'number') ? 'col-span-2' : ''}`}
                                  style={category === 'bicycles' && f.key === 'bicycleRepair'
                                    ? { width: 'calc(50% - 0.375rem)', marginLeft: 'auto', marginRight: 'auto' }
                                    : selectFields.length === 1 && f.type !== 'text' && f.type !== 'number'
                                    ? { width: `${Math.min(320, Math.max(124, Math.round(((details[f.key] || f.placeholder || 'Select').length) * 7.4) + 88))}px`, marginLeft: 'auto' }
                                    : undefined}
                                >
                                  {category === 'vehicles' && f.key === 'variant' && getVehicleModels(details['brand'] ?? '', details['vehicleType'] ?? '').length > 0 ? (
                                    <div className="relative">
                                      <select
                                        value={details[f.key] ?? ''}
                                        onChange={(e) => setDetail(f.key, e.target.value)}
                                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-9 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${details[f.key] ? '!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !border-blue-700 !shadow-none' : '!bg-black !bg-none !border-black'} ${!details[f.key] ? 'text-[10px] text-transparent' : 'text-[11px] sm:text-xs !font-bold !text-white'}`}
                                      >
                                        <option value="">Model</option>
                                        {getVehicleModels(details['brand'] ?? '', details['vehicleType'] ?? '').map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value={VEHICLE_MODEL_OTHER}>Other</option>
                                      </select>
                                      {!details[f.key] && (
                                        <span className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 truncate px-4 pr-12 text-center text-[10px] font-semibold text-white">
                                          Model
                                        </span>
                                      )}
                                      <span className="pointer-events-none absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black">
                                        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                      </span>
                                    </div>
                                  ) : category === 'car' && f.key === 'variant' && getCarVariants(details['brand'] ?? '', details['model'] ?? '').length > 0 ? (
                                    <div className="relative">
                                      <select
                                        value={details[f.key] ?? ''}
                                        onChange={(e) => setDetail(f.key, e.target.value)}
                                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-9 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${details[f.key] ? '!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !border-blue-700 !shadow-none' : '!bg-black !bg-none !border-black'} ${!details[f.key] ? 'text-[10px] text-transparent' : 'text-[11px] sm:text-xs !font-bold !text-white'}`}
                                      >
                                        <option value="">Variant</option>
                                        {getCarVariants(details['brand'] ?? '', details['model'] ?? '').map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                      </select>
                                      {!details[f.key] && (
                                        <span className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 truncate px-4 pr-12 text-center text-[10px] font-semibold text-white">
                                          Variant
                                        </span>
                                      )}
                                      <span className="pointer-events-none absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black">
                                        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                      </span>
                                    </div>
                                  ) : f.type === 'text' || f.type === 'number' ? (
                                    <Input
                                      type="text"
                                      inputMode={f.type === 'number' ? 'numeric' : 'text'}
                                      maxLength={f.type === 'number' ? 4 : 40}
                                      value={details[f.key] ?? ''}
                                      onChange={(e) => setDetail(f.key, f.type === 'number' ? e.target.value.replace(/[^0-9]/g, '').slice(0, 4) : e.target.value)}
                                      placeholder={category === 'vehicles' && f.key === 'variant'
                                        ? (details['brand'] ? 'Enter model name' : 'Select brand first')
                                        : category === 'jobs' && f.key === 'skills' && details.jobListingFor === 'To apply' ? 'Your skills'
                                        : f.placeholder ?? 'Type here'}
                                      className={`w-full rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-medium border-[1.5px] border-slate-200 bg-white focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 pl-4 pr-4 ${f.key === 'skills' ? 'skills-hint' : 'placeholder:text-gray-400 placeholder:font-medium placeholder:text-[11px]'} shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${(category === 'car' || category === 'vehicles') && f.key === 'year' && (details[f.key] ?? '').length === 4 ? '!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !placeholder:text-white !border-blue-700 !shadow-none' : ''}`}
                                    />
                                  ) : (
                                  <div className="relative">
                                    <select
                                      value={details[f.key] ?? ''}
                                      disabled={(f.key === 'storage' && category === 'laptops' && !details['model']) || (f.key === 'processor' && category === 'laptops' && !details['brand'])}
                                      onChange={(e) => {
                                        setDetail(f.key, e.target.value);
                                        // School-level education has no stream to name.
                                        if (f.key === 'education' && ['10th pass', '12th pass'].includes(e.target.value)) setDetail('stream', '');
                                      }}
                                      className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-9 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${details[f.key] ? '!bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !border-blue-700 !shadow-none' : '!bg-black !bg-none !border-black'} ${!details[f.key] ? 'text-[10px] text-transparent' : 'text-[11px] sm:text-xs !font-bold !text-white'}`}
                                    >
                                      <option value="">{
                                        // A hiring post asks for what the role needs; an
                                        // applying post asks for the applicant's own details.
                                        category === 'jobs' && details.jobListingFor === 'To hire' && f.key === 'education' ? 'Education needed'
                                        : category === 'jobs' && details.jobListingFor === 'To hire' && f.key === 'experience' ? 'Experience needed'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'education' ? 'Your education'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'experience' ? 'Your experience'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'jobType' ? 'Job type you suggest'
                                        : f.placeholder ?? 'Select'
                                      }</option>
                                      {((f.key === 'storage' && category === 'laptops')
                                      ? [...getLaptopStorageOptions(details['brand'] ?? '', details['model'] ?? ''), LAPTOP_OTHER]
                                      : (f.key === 'processor' && category === 'laptops')
                                        ? [...getLaptopProcessors(details['brand'] ?? ''), LAPTOP_OTHER]
                                        : (f.options ?? [])).map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                    {!details[f.key] && (
                                      <span className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-center px-4 pr-12 text-center text-[10px] font-semibold text-white">
                                        {f.key === 'transmission' ? (
                                          <img src="/icons/gear-shifter.png" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                                        ) : f.key === 'fuel' ? (
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white">
                                            <Fuel className="h-3 w-3" strokeWidth={2.25} />
                                          </span>
                                        ) : category === 'jobs' && details.jobListingFor === 'To hire' && f.key === 'education' ? 'Education needed'
                                        : category === 'jobs' && details.jobListingFor === 'To hire' && f.key === 'experience' ? 'Experience needed'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'education' ? 'Your education'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'experience' ? 'Your experience'
                                        : category === 'jobs' && details.jobListingFor === 'To apply' && f.key === 'jobType' ? 'Job type you suggest'
                                        : f.placeholder ?? 'Select'}
                                      </span>
                                    )}
                                    <span className="pointer-events-none absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black">
                                      <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                    </span>
                                  </div>
                                  )}
                                  {/* Jobs: the free-text stream sits directly under
                                      the education pick, except for 10th and 12th
                                      pass, which have no stream. */}
                                  {f.key === 'education' && !!details.education && !['10th pass', '12th pass'].includes(details.education) && (
                                    <Input
                                      type="text"
                                      maxLength={35}
                                      value={details.stream ?? ''}
                                      onChange={(e) => setDetail('stream', e.target.value.slice(0, 35))}
                                      placeholder="Stream — e.g., B.Tech CSE"
                                      className="w-full rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-medium border-[1.5px] border-slate-200 bg-white focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 pl-4 pr-4 placeholder:text-gray-400 placeholder:font-medium placeholder:text-[11px] shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                {(category !== 'real-estate' || estateType) && (
                  <>
                    {/* Motorcycle: the year box sits directly above the description. */}
                    {category === 'bike' && (
                      <div className="mb-3 flex justify-center">
                        {/* Small capsule sized for a 4-digit year. */}
                        <div className="w-24">
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={details['year'] ?? ''}
                            onChange={(e) => setDetail('year', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="Year"
                            className={`w-full rounded-full text-sm font-medium bg-white px-1 py-0 text-center placeholder:text-black placeholder:opacity-100 placeholder:font-semibold placeholder:text-[11px] transition-all duration-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] ${details['year']?.length === 4 ? '!h-10 !min-h-0 !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !text-white !placeholder:text-white !border-blue-700 !shadow-none' : '!h-10 !min-h-0 border-[1.5px] border-slate-200 focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15'}`}
                          />
                        </div>
                      </div>
                    )}
                    {/* A little air between the last dropdown row and the description box.
                        The step stacks its blocks with space-y, so the margin has to win
                        against that rule — hence the important. */}
                    <div className="relative !mt-6">
                      <button
                        type="button"
                        onClick={runDescriptionAI}
                        disabled={aiGenerating}
                        aria-label="AI description assistant"
                        className="absolute right-3 bottom-3 z-10 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-60 touch-manipulation bg-transparent"
                        style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, padding: 0 }}
                      >
                        {aiGenerating ? (
                          <Loader2 className="h-3 w-3 text-black animate-spin" />
                        ) : (
                          <Sparkles
                            className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                            style={{
                              color: '#F5B301',
                              fill: '#F5B301',
                              filter: 'drop-shadow(0 0 4px rgba(245,179,1,0.55))',
                            }}
                          />
                        )}
                      </button>
                      <Textarea
                        id="listing-desc"
                        value={description}
                        onChange={(e) => {
                          if (withinDescLimit(e.target.value)) setDescription(e.target.value);
                        }}
                        placeholder={category === 'jobs' && details.jobListingFor === 'To hire'
                          ? 'Explain the role, responsibilities, and nature of the work. Specify the required skills, qualifications, experience, and expectations.'
                          : category === 'jobs' && details.jobListingFor === 'To apply'
                          ? 'Describe your skills, strengths, technical abilities, and areas of expertise in detail. Detail your previous roles, responsibilities, achievements, and relevant work experience.'
                          : 'Condition, accessories, warranty, reason for selling…'}
                        maxLength={MAX_DESC_CHARS}
                        className={`wizard-desc-box rounded-2xl min-h-[160px] sm:min-h-[180px] text-base border-[1.5px] border-slate-200 bg-white focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 min-touch pl-4 pr-14 py-3 placeholder:font-medium placeholder:text-[11px] resize-y shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${category === 'jobs' && (details.jobListingFor === 'To hire' || details.jobListingFor === 'To apply') ? 'placeholder:text-gray-900 placeholder:font-semibold' : 'placeholder:text-gray-400'}`}
                        autoFocus={canAutoFocus()}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="max-w-xl mx-auto w-full space-y-3">
                {/* Pin precise location on a map — the search bar above
                    "Where is it?" was removed per request */}
                <button
                  type="button"
                  onClick={() => setMapPickerOpen(true)}
                  className="w-full flex items-center gap-3 !rounded-2xl !border-[1.5px] !border-black bg-white hover:!bg-gray-50 px-4 py-3 transition-all !duration-150 !shadow-[0_5px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] touch-manipulation select-none"
                >
                  <div className="relative z-10 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <p className="w-full px-2 font-chip text-xs sm:text-[13px] font-semibold text-black tracking-tight truncate text-center">
                      {mapLocation
                        ? ([mapLocation.city, mapLocation.state].filter(Boolean).join(', ') || mapLocation.formatted_address || `${mapLocation.latitude.toFixed(4)}, ${mapLocation.longitude.toFixed(4)}`)
                        : 'click here'}
                    </p>
                  </div>
                  {/* Globe counterpart on the right edge — same size as the red location circle */}
                  <div className="relative z-10 ml-auto w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                </button>

                <MapLocationPicker
                  open={mapPickerOpen}
                  onOpenChange={(o) => setMapPickerOpen(o)}
                  title="Where is it?"
                  defaultLocation={mapLocation ? { lat: mapLocation.latitude, lng: mapLocation.longitude } : undefined}
                  onSelect={(lat, lng, addr) => {
                    setMapLocation(addr);
                    // Prefill the search box with the pin's city/address so both stay in sync
                    const text = addr.formatted_address || addr.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setLocation(text);
                    setLocationSearch(text);
                    setLocationDropdownOpen(false);
                    // Mobile: the map sheet leaves the page scrolled mid-form, so glide
                    // back to the top to reveal the chosen location card in place.
                    if (window.matchMedia('(max-width: 640px)').matches) {
                      window.setTimeout(() => {
                        if (!canAutoScroll()) return;
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 150);
                    }
                  }}
                />
              </div>
            )}

            {step === 4 && (
              <div className="max-w-lg mx-auto w-full space-y-6">
                {category !== 'jobs' && !hideCondition && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCondition('new')}
                      className={cn(
                        'flex flex-col items-center gap-2 !rounded-2xl !border-[1.5px] p-4 transition-all !duration-150 active:!translate-y-[4px] touch-manipulation select-none',
                        condition === 'new' ? 'border-black bg-emerald-50 !shadow-[0_5px_0_0_rgba(0,0,0,0.85)]' : 'border-black/20 hover:border-black/40 !shadow-[0_5px_0_0_rgba(0,0,0,0.15)]'
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
                        'flex flex-col items-center gap-2 !rounded-2xl !border-[1.5px] p-4 transition-all !duration-150 active:!translate-y-[4px] touch-manipulation select-none',
                        condition === 'used' ? 'border-black bg-amber-50 !shadow-[0_5px_0_0_rgba(0,0,0,0.85)]' : 'border-black/20 hover:border-black/40 !shadow-[0_5px_0_0_rgba(0,0,0,0.15)]'
                      )}
                    >
                      <Package className="h-8 w-8 text-amber-800" />
                      <span className="font-black text-sm">Used</span>
                      <span className="text-[10px] text-slate-600 text-center">Good / fair wear</span>
                    </button>
                  </div>
                </div>
                )}

                {/* Product condition grade + visible damage. These grades (with
                    tags, like new, vintage, wear %) are built for Thrift and
                    Antiques, so they show on those Condition steps only. Every
                    other category — vehicles included — keeps just its
                    New/Used chips. */}
                {(category === 'thrift' || category === 'antiques') && (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={details['productCondition'] ?? ''}
                        onChange={(e) => setDetail('productCondition', e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['productCondition'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="" disabled>Product Condition</option>
                        {conditionGrades.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="">Cancel</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={details['visibleDamage'] ?? ''}
                        onChange={(e) => setDetail('visibleDamage', e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['visibleDamage'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="" disabled>Visible damage?</option>
                        {VISIBLE_DAMAGE_OPTIONS.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                        <option value="">Cancel</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={details['damageType'] ?? ''}
                        onChange={(e) => setDetail('damageType', e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['damageType'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="" disabled>Damage Type</option>
                        {damageTypeOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                        <option value="">Cancel</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={details['damageSeverity'] ?? ''}
                        onChange={(e) => setDetail('damageSeverity', e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['damageSeverity'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="" disabled>Damage Severity</option>
                        {DAMAGE_SEVERITIES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                        <option value="">Cancel</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={details['functionalStatus'] ?? ''}
                        onChange={(e) => setDetail('functionalStatus', e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details['functionalStatus'] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="" disabled>Functional Status</option>
                        {functionalStatusOptions.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                        <option value="">Cancel</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                  </div>
                )}

                {(condition === 'used' || hideCondition) && fieldsForCategoryStep(category, 'details').map((f) => (
                  <div key={f.key} className="space-y-2">
                    <div className="relative">
                      {f.type === 'select' ? (
                        <>
                          <select
                            value={details[f.key] ?? ''}
                            onChange={(e) => setDetail(f.key, e.target.value)}
                            className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details[f.key] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                          >
                            <option value="">{f.placeholder ?? 'Select'}</option>
                            {f.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                        </>
                      ) : (
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={details[f.key] ?? ''}
                          onChange={(e) => setDetail(f.key, formatPriceInput(e.target.value))}
                          placeholder={f.placeholder}
                          className="rounded-2xl h-12 sm:h-14 text-base border-[1.5px] border-slate-200 bg-white focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 min-touch pl-4 pr-14 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] font-bold shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200"
                        />
                      )}
                      {f.suffix && f.type !== 'select' && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500">{f.suffix}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Deadline categories: optional countdown. Food, jobs & agriculture hide the New/Used chips above (food & agriculture via NO_CONDITION_CATEGORIES, jobs via the explicit check), so the timer stands alone. */}
                {isDeadlineCategory && (
                  <div className="space-y-2 border border-black rounded-2xl p-4 bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <Label className="text-[10px] font-bold text-black flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {category === 'jobs' ? 'Deadline for applicants to apply (optional)' : 'Listing deadline (optional)'}
                    </Label>
                    <p className="text-[9px] text-gray-500">
                      {category === 'jobs' ? 'Applications close after the countdown; the listing then leaves the marketplace.' : 'Your listing expires after the countdown.'}
                    </p>
                    <TimeLimitSelector value={deadline ?? undefined} onChange={setDeadline} />
                    {deadline && (
                      <button
                        type="button"
                        onClick={() => setDeadline(null)}
                        className="text-[11px] font-bold text-red-600 underline underline-offset-2"
                      >
                        Clear deadline
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}

            {step === 5 && (
              <div className="price-pills max-w-md mx-auto w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price-fixed" className="text-[9px] sm:text-[10px] font-bold text-black flex items-center gap-2 ml-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {category === 'jobs' ? 'Salary (INR)' : 'Your price (INR)'}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500 z-10">₹</span>
                    <Input
                      id="price-fixed"
                      value={price}
                      onChange={(e) => {
                        setPrice(formatPriceInput(e.target.value));
                        if (formatPriceInput(e.target.value)) setPriceOption('');
                      }}
                      placeholder="25,000"
                      inputMode="decimal"
                      maxLength={13}
                      className="rounded-[12px] h-12 sm:h-14 min-h-[48px] text-base bg-white border-[1.5px] border-slate-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] transition-all duration-200 min-touch pl-8 pr-4 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] font-bold text-lg"
                      autoFocus={canAutoFocus()}
                    />
                  </div>
                </div>
                {/* Open to discussion — alternative to entering a specific price */}
                <div className="flex items-center justify-end gap-3">
                  <div className="relative ml-auto" style={{ marginRight: 0 }}>
                    <select
                      id="price-option"
                      style={{ width: 200 }}
                      value={priceOption}
                      onChange={(e) => {
                        const v = e.target.value as '' | 'discussion';
                        setPriceOption(v);
                        if (v === 'discussion') {
                          setPrice('');
                          setPriceMin('');
                          setPriceMax('');
                        }
                      }}
                      className={`appearance-none rounded-[12px] h-12 sm:h-14 min-h-[48px] max-w-full font-medium border-[1.5px] focus:outline-none focus:ring-3 focus:ring-black/15 transition-all duration-200 pl-4 pr-10 ${priceOption === 'discussion' ? 'border-black bg-blue-600 text-[11px] sm:text-xs font-bold text-white shadow-none' : 'border-slate-200 bg-white text-[10px] sm:text-xs font-semibold text-gray-900 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus-visible:border-black focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)]'}`}
                    >
                      <option value="" className="bg-white text-black"></option>
                      <option value="discussion" className="bg-white text-black">Open to discussion</option>
                    </select>
                    {/* Empty-state caption matches the post-enquiry budget picker:
                        the question at the left edge, "Click here" near the round
                        chevron handle. Hidden once a value is picked. */}
                    {!priceOption && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-between pl-4 pr-[52px] text-[10px] sm:text-xs font-semibold text-gray-900"
                      >
                        <span>Not fixed yet?</span>
                        <span>Click here</span>
                      </span>
                    )}
                    <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${priceOption === 'discussion' ? 'text-white' : 'text-gray-800'}`} />
                  </div>
                </div>
                {fieldsForCategoryStep(category, 'price').map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label className="text-[10px] sm:text-xs font-bold">{f.label}</Label>
                    <div className="relative">
                      <select
                        value={details[f.key] ?? ''}
                        onChange={(e) => setDetail(f.key, e.target.value)}
                        className={`w-full appearance-none rounded-2xl h-12 sm:h-14 font-medium border-[1.5px] border-slate-200 focus-visible:border-black focus:outline-none focus:ring-3 focus:ring-black/15 bg-white pl-4 pr-10 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-200 ${!details[f.key] ? 'text-[11px] font-semibold text-gray-900 font-semibold' : 'text-[11px] sm:text-xs !text-white !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 !border-blue-700 !shadow-none'}`}
                      >
                        <option value="">{f.placeholder ?? 'Select'}</option>
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 pointer-events-none" />
                    </div>
                  </div>
                ))}
                <div className="space-y-2 !mt-8">
                  <Label className="text-[9px] sm:text-[10px] font-bold text-black flex items-center gap-2 ml-1">
                    <Upload className="h-3.5 w-3.5" />
                    Photos (up to 5){category === 'service' && <span className="font-normal text-slate-400">— optional</span>}
                  </Label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img loading="lazy" decoding="async" src={url} alt={`Image ${i+1}`} className="w-full h-20 object-cover rounded-lg border border-black/10" />
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
                    <input
                      id="listing-images"
                      ref={listingImageInputRef}
                      type="file"
                      multiple={images.length < 4}
                      accept="image/*"
                      onChange={(e) => { onAddImages(e.target.files); if (listingImageInputRef.current) listingImageInputRef.current.value = ''; }}
                      disabled={uploading || images.length >= 5}
                      className="hidden"
                    />
                    <label
                      htmlFor="listing-images"
                      className="block w-full text-center !rounded-xl !border-0 !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 hover:!from-blue-500 hover:!to-blue-700 !text-white transition-all !duration-200 !shadow-none hover:!shadow-none active:!shadow-none !text-base sm:!text-lg font-bold h-14 sm:h-16 flex items-center justify-center cursor-pointer touch-manipulation select-none"
                    >
                      {images.length === 0 ? 'Choose Image' : 'Add More Images'}
                    </label>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[8px] font-bold text-black tracking-wide">
                        {category === 'service' ? 'Your work, sites etc.' : ''}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {images.length}/5
                      </p>
                    </div>
                    {category === 'jobs' && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/10">
                        <span className="text-[8px] font-bold text-black tracking-wide">workspace</span>
                        <span className="text-[8px] font-bold text-black tracking-wide">culture</span>
                      </div>
                    )}
                    {uploading && uploadProgresses.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadProgresses.map((p, i) => (
                          <div key={i} className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="max-w-lg mx-auto w-full space-y-5">
                {(() => {
                  const titleFields = fieldsForCategoryStep(category, 'title').filter((f) => details[f.key]);
                  const descFields = fieldsForCategoryStep(category, 'description').filter((f) => details[f.key]);
                  const usedFields = (condition === 'used' || hideCondition) ? fieldsForCategoryStep(category, 'details').filter((f) => details[f.key]) : [];
                  const priceFields = fieldsForCategoryStep(category, 'price').filter((f) => details[f.key]);
                  const hasSpecs = titleFields.length + descFields.length + usedFields.length + priceFields.length > 0;
                  const hasPhoto = images.length > 0;
                  return (
                    <>
                      {/* Hero: photo + title + price */}
                      <div className="rounded-xl border border-black bg-gray-100 p-4 sm:p-5 space-y-3">
                        {hasPhoto ? (
                          <div className="relative overflow-hidden rounded-lg">
                            <img loading="lazy" decoding="async" src={images[0]} alt="Listing" className="w-full h-40 sm:h-48 object-cover" />
                            {images.length > 1 && (
                              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-black rounded-full px-2 py-0.5">+{images.length - 1} more</span>
                            )}
                          </div>
                        ) : (
                          <div className="h-16 rounded-lg border border-dashed border-black/15 bg-white flex flex-col items-center justify-center gap-0.5">
                            <Upload className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-[9px] text-gray-400 font-medium">No photos added yet</span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <h3 className="text-[15px] sm:text-base font-semibold text-gray-900 leading-snug break-words">{title || 'Untitled listing'}</h3>
                          <div className="flex justify-center pt-4">
                            {priceOption === 'discussion' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-black font-chip bg-green-800 text-white border-0 px-2.5 py-1 rounded-xl shadow-[0_-1.5px_0_0_rgba(17,24,39,0.10),-1.5px_0_0_0_rgba(17,24,39,0.10),1.5px_0_0_0_rgba(17,24,39,0.10),0_3px_0_0_rgba(17,24,39,0.22),0_8px_12px_-6px_rgba(17,24,39,0.22)]"><IndianRupee className="h-3 w-3" />Open to discussion</span>
                            ) : (
                              <span className="text-sm sm:text-base font-bold text-gray-900">{price ? `₹${price}` : 'Price not set'}</span>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-gray-100" />
                        <div className="flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black font-chip bg-white text-black border-0 px-2.5 py-1 rounded-xl shadow-[0_-1.5px_0_0_rgba(17,24,39,0.10),-1.5px_0_0_0_rgba(17,24,39,0.10),1.5px_0_0_0_rgba(17,24,39,0.10),0_3px_0_0_rgba(17,24,39,0.22),0_8px_12px_-6px_rgba(17,24,39,0.22)]">
                              {(() => { const Icon = CATEGORY_ICON[category] ?? LayoutGrid; return <span className="w-4 h-4 rounded-full bg-red-600 border-[1.5px] border-black flex items-center justify-center flex-shrink-0"><Icon className="h-2.5 w-2.5 text-white" /></span>; })()}
                              {SELL_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                            </span>
                            {!hideCondition && category !== 'jobs' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black font-chip bg-white text-black border-0 px-2.5 py-1 rounded-xl capitalize shadow-[0_-1.5px_0_0_rgba(17,24,39,0.10),-1.5px_0_0_0_rgba(17,24,39,0.10),1.5px_0_0_0_rgba(17,24,39,0.10),0_3px_0_0_rgba(17,24,39,0.22),0_8px_12px_-6px_rgba(17,24,39,0.22)]">
                              <span className="w-4 h-4 rounded-full bg-red-600 border-[1.5px] border-black flex items-center justify-center flex-shrink-0"><BadgeCheck className="h-2.5 w-2.5 text-white" /></span>{condition}
                            </span>
                            )}
                            {location && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black font-chip bg-white text-black border-0 px-2.5 py-1 rounded-xl shadow-[0_-1.5px_0_0_rgba(17,24,39,0.10),-1.5px_0_0_0_rgba(17,24,39,0.10),1.5px_0_0_0_rgba(17,24,39,0.10),0_3px_0_0_rgba(17,24,39,0.22),0_8px_12px_-6px_rgba(17,24,39,0.22)]">
                                <span className="w-4 h-4 rounded-full bg-red-600 border-[1.5px] border-black flex items-center justify-center flex-shrink-0"><MapPin className="h-2.5 w-2.5 text-white" /></span>{location}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Specs — only filled ones, as compact chips */}
                      {hasSpecs && (
                        <div className="rounded-2xl border border-black/15 bg-slate-50/70 p-3.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Details</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...titleFields, ...descFields, ...usedFields, ...priceFields].map((f) => {
                              const SpecIcon =
                                f.key === 'variant' ? Cog :
                                f.key === 'brand' ? Tag :
                                f.key === 'year' ? CalendarDays :
                                f.key === 'transmission' ? GearShiftIcon :
                                f.key === 'fuel' ? Fuel :
                                f.key === 'kmsDriven' ? Gauge :
                                f.key === 'ownership' ? User :
                                f.key === 'storage' ? HardDrive :
                                f.key === 'storage' ? Cpu :
                                f.key === 'processor' ? Cpu :
                                f.key === 'warranty' ? ShieldCheck :
                                f.key === 'experience' ? Briefcase :
                                f.key === 'jobListingFor' ? Tag :
                                f.key === 'jobType' ? Clock :
                                f.key === 'workMode' ? Home :
                                f.key === 'salaryPeriod' ? IndianRupee :
                                f.key === 'bhk' ? Home :
                                f.key === 'landArea' || f.key === 'builtUpArea' || f.key === 'houseArea' || f.key === 'otherArea' ? Ruler :
                                f.key === 'furnishing' ? Armchair :
                                f.key === 'houseBhk' ? Home :
                                f.key === 'facing' ? Compass :
                                f.key === 'listingFor' ? Tag :
                                null;
                              return (
                                <span key={f.key} className="inline-flex items-center gap-1 text-[11px] font-black font-chip bg-white text-black border-0 px-2.5 py-1 rounded-xl shadow-[0_-1.5px_0_0_rgba(17,24,39,0.10),-1.5px_0_0_0_rgba(17,24,39,0.10),1.5px_0_0_0_rgba(17,24,39,0.10),0_3px_0_0_rgba(17,24,39,0.22),0_8px_12px_-6px_rgba(17,24,39,0.22)]">
                                  {SpecIcon && <SpecIcon className="h-3 w-3 text-black" />}
                                  {details[f.key]}{f.suffix ? ` ${f.suffix}` : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                    title, description, category, categories: selectedCats, location, condition,
                    priceType, priceOption, price, priceMin, priceMax, tags, images, details, estateType,
                    deadline: isDeadlineCategory && deadline ? deadline.toISOString() : null
                  }));
                  navigate('/profile?returnTo=/sell/new');
                }}
                className="w-full flex items-center gap-3 p-3 sm:p-4 !rounded-xl !border-0 !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 hover:!from-blue-500 hover:!to-blue-700 transition-all !duration-200 group !shadow-none hover:!shadow-none active:!shadow-none hover:!translate-y-0 active:!translate-y-0 touch-manipulation select-none"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs sm:text-sm font-bold text-white">Verify Your Profile <span className="text-[8px] sm:text-[9px] text-blue-200 font-normal">(Optional)</span></p>
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


          {/* Contact Mobile Number (optional) — India only, and only a verified number is shared */}
          {step === totalSteps - 1 && (
            <div className="mt-6">
              <Label htmlFor="listing-mobile" className="text-[9px] sm:text-[10px] font-bold text-black flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <div className="flex gap-1.5 mt-1.5">
                {/* India only — the country code is fixed, not selectable */}
                <span
                  aria-label="Country code India +91"
                  className="!h-12 shrink-0 !w-[76px] inline-flex items-center justify-center !rounded-2xl !border-[1.5px] !border-slate-200 bg-white text-black !text-xs !font-bold select-none !shadow-[0_3px_0_0_rgba(0,0,0,0.14)]"
                >
                  🇮🇳 +91
                </span>
                <input
                  id="listing-mobile"
                  type="tel"
                  inputMode="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    // Indian numbers only: 10 digits, shown as "98765 43210"
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(digits.replace(/(\d{5})(?=\d)/, '$1 '));
                  }}
                  maxLength={11}
                  placeholder="98765 43210"
                  className="flex-1 min-w-0 !h-12 px-4 !rounded-2xl !border-[1.5px] !border-slate-200 bg-white text-black !text-sm !font-medium placeholder:!text-gray-900 placeholder:!font-semibold placeholder:!text-[11px] focus:outline-none focus-visible:!border-black focus-visible:!ring-3 focus-visible:!ring-black/15 transition-all !duration-200 !shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:!shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] touch-manipulation"
                />
                {/* Verify only for a complete number that isn't the verified one */}
                {showMobileVerify && (
                  <Button
                    type="button"
                    onClick={handleListingOtpSend}
                    disabled={sendingOtp || confirmingOtp}
                    className="!h-12 shrink-0 !px-3 !text-[11px] !font-black !bg-black hover:!bg-gray-900 !text-white !rounded-2xl !border-0 disabled:!opacity-60 inline-flex items-center gap-1 !shadow-[0_3px_0_0_rgba(0,0,0,0.14)]"
                  >
                    {sendingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Verify
                  </Button>
                )}
              </div>

              {/* OTP boxes — appear under the number after Verify is clicked */}
              {otpStage && (
                <div className="mt-2 rounded-2xl border-[1.5px] border-black bg-slate-50 p-3 space-y-3 shadow-[0_3px_0_0_rgba(0,0,0,0.14)]">
                  <p className="text-[11px] font-bold text-gray-700">
                    Enter the 6-digit code sent to +91 {mobileNumber.trim()}
                  </p>
                  <div className="flex gap-1.5" onPaste={handleListingOtpPaste}>
                    {otpListeners.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpBoxRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        aria-label={`OTP digit ${i + 1}`}
                        onChange={(e) => setListingOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !d && i > 0) otpBoxRefs.current[i - 1]?.focus();
                        }}
                        className="w-9 h-11 text-center text-sm font-bold border-[1.5px] border-slate-200 rounded-xl bg-white focus:outline-none focus-visible:border-black"
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleListingOtpSend}
                      disabled={resendSeconds > 0 || sendingOtp}
                      className="text-[11px] font-bold text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtpStage(false); setOtpListeners(['', '', '', '', '', '']); }}
                      className="text-[11px] font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleListingOtpConfirm}
                    disabled={confirmingOtp || otpListeners.join('').length < 6}
                    className="!w-full !h-10 !text-xs !bg-black hover:!bg-gray-900 !text-white !font-black !rounded-2xl !border-0 disabled:!opacity-60"
                  >
                    {confirmingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm OTP
                  </Button>
                </div>
              )}

              {/* recaptcha anchor for Firebase phone auth (required, invisible) */}
              <div id="recaptcha-container" aria-hidden="true" />
            </div>
          )}
          {/* Nav — Back hugs the left corner, Next/submit hugs the right (both breakpoints); first tab has no Back, so Next stays right */}
          <div className={`mt-6 sm:mt-8 flex items-center gap-4 pt-2 px-0.5 sm:px-2 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {/* Back circle — hidden entirely on the first tab (was a dead, disabled button there) */}
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                aria-label="Back"
                className={`!p-0 ${step === totalSteps - 1 ? '!w-12 !h-12 sm:!w-14 sm:!h-14' : '!w-16 !h-16 sm:!w-20 sm:!h-20'} !rounded-full !bg-gradient-to-b !from-gray-100 !via-gray-200 !to-gray-300 hover:!via-gray-200 hover:!to-gray-400 !text-gray-900 !border-0 relative transition-all !duration-200 hover:scale-[1.04] active:scale-[0.95] flex items-center justify-center flex-shrink-0 touch-manipulation select-none`}
              >
                <ChevronLeft className={`${step === totalSteps - 1 ? '!h-5 !w-5 sm:!h-6 sm:!w-6' : '!h-7 !w-7 sm:!h-9 sm:!w-9'} relative z-10`} />
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button type="button" onClick={goNext} aria-label="Next" className="!p-0 !w-16 !h-16 sm:!w-20 sm:!h-20 !rounded-full !bg-gradient-to-r !from-pal-blue !to-blue-600 hover:!from-blue-500 hover:!to-blue-700 !text-white !border-0 relative transition-all !duration-200 hover:scale-[1.04] active:scale-[0.95] flex items-center justify-center flex-shrink-0 touch-manipulation select-none">
                <ChevronRight className="!h-7 !w-7 sm:!h-9 sm:!w-9 relative z-10" />
              </Button>
            ) : (
              <div className="flex-1 min-w-0">
                <Button
                  type="button"
                  onClick={publish}
                  disabled={!user || uploading || publishing}
                  className="!w-full !h-16 !text-lg !font-black !bg-blue-600 !bg-gradient-to-b !from-blue-500 !to-blue-700 hover:!from-blue-500 hover:!to-blue-700 !text-white !rounded-xl !border-0 relative overflow-hidden transition-all !duration-200 !shadow-none hover:!shadow-none active:!shadow-none hover:!translate-y-0 active:!translate-y-0 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!translate-y-0 touch-manipulation select-none flex items-center justify-center"
                >
                  <span className="relative z-10">{publishing ? 'Selling…' : 'Sell'}</span>
                </Button>
              </div>
            )}
          </div>
          {step === totalSteps - 1 && (
            <p className="text-[6px] sm:text-[7px] text-right text-slate-400 font-medium mt-2 pr-1">
              We do not offer anything for free to make you the product.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Phones only: the sketch sits under the card on every tab, exactly as
          the enquiry sketch does on the post-enquiry form */}
      <div className="sm:hidden px-4 pt-4 text-gray-900">
        <SellListingSketch className="w-full h-auto" />
      </div>
    </SellShell>
  );
}

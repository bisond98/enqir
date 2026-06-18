import { useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import {
  AlignLeft,
  Armchair,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Home,
  IndianRupee,
  Laptop,
  LayoutGrid,
  MapPin,
  Package,
  Shirt,
  Smartphone,
  Sparkles,
  Tag,
  Type,
  Upload,
  Wrench,
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
  other: LayoutGrid,
};

const STEPS = [
  { key: 'title', label: 'Title', description: 'Name your listing' },
  { key: 'description', label: 'Description', description: 'Tell buyers more' },
  { key: 'category', label: 'Category', description: 'Pick what fits best' },
  { key: 'location', label: 'Location', description: 'Where is the item?' },
  { key: 'details', label: 'Condition & pricing', description: 'How you want to sell' },
  { key: 'price', label: 'Price', description: 'Set your numbers' },
  { key: 'extras', label: 'Tags & photos', description: 'Finish strong' },
] as const;

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [location, setLocation] = useState<string>('Other');
  const [condition, setCondition] = useState<ListingCondition>('used');
  const [priceType, setPriceType] = useState<ListingPriceType>('fixed');
  const [price, setPrice] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const totalSteps = STEPS.length;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const parsedTags = useMemo(() => {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 15);
  }, [tags]);

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
      for (const file of selectedFiles) {
        const url = await uploadToCloudinaryUnsigned(file);
        urls.push(url);
      }
      if (files.length > selectedFiles.length) {
        toast({ title: 'Only 5 images allowed', description: 'Extra selected images were skipped.' });
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload one or more images.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const validatePriceFields = (): boolean => {
    if (priceType === 'fixed') {
      if (!price.trim()) {
        toast({ title: 'Missing price', description: 'Enter a price.', variant: 'destructive' });
        return false;
      }
      const fixedPrice = Number(price);
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
        if (!title.trim()) {
          toast({ title: 'Add a title', description: 'Buyers need a clear name for your item.', variant: 'destructive' });
          return false;
        }
        return true;
      case 1:
        if (!description.trim()) {
          toast({ title: 'Add a description', description: 'A few sentences help buyers decide.', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
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

  const goNext = () => {
    if (!canAdvanceFromStep(step)) return;
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const publish = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Missing info', description: 'Title and description are required.', variant: 'destructive' });
      return;
    }
    if (!validatePriceFields()) return;

    const fixedPrice = priceType === 'fixed' ? Number(price) : null;
    const rangeMin = priceType === 'range' ? Number(priceMin) : null;
    const rangeMax = priceType === 'range' ? Number(priceMax) : null;

    setPublishing(true);
    try {
      await createListing(user.uid, {
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
      setTitle('');
      setDescription('');
      setPrice('');
      setPriceMin('');
      setPriceMax('');
      setTags('');
      setImages([]);
      setStep(0);
      setIsPublished(true);
      window.setTimeout(() => {
        navigate('/sell/marketplace');
      }, 5000);
    } catch {
      toast({ title: 'Publish failed', description: 'Could not publish listing.', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <SellShell title="Create Listing">
        <Card className="border-[0.5px] border-black rounded-2xl bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
          <CardContent className="py-12 sm:py-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">Successfully Listed</h2>
            <p className="text-xs sm:text-sm text-gray-700 max-w-sm">
              Your product is now live on the For Sale page. Redirecting in 5 seconds...
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
    <SellShell title="Create Listing">
      <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] overflow-hidden">
        <CardHeader className="space-y-3 border-b border-black/10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Step {step + 1} of {totalSteps}
            </p>
            <p className="text-xs sm:text-sm font-bold text-black">{STEPS[step].label}</p>
          </div>
          <Progress value={progressPct} className="h-2 rounded-full bg-slate-200" />
          <div className="flex justify-between gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  if (i < step) setStep(i);
                }}
                className={cn(
                  'shrink-0 rounded-lg border px-2 py-1.5 text-[9px] sm:text-[10px] font-black transition-colors',
                  i === step
                    ? 'border-black bg-black text-white'
                    : i < step
                      ? 'border-black bg-slate-100 text-black hover:bg-slate-200'
                      : 'border-slate-200 bg-white text-slate-400 cursor-default'
                )}
                disabled={i > step}
                title={s.label}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6 sm:pt-8 pb-6 min-h-[320px] sm:min-h-[360px] flex flex-col">
          <StepIcon active />

          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">{STEPS[step].label}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{STEPS[step].description}</p>
          </div>

          <div className="flex-1 space-y-4">
            {step === 0 && (
              <div className="space-y-2 max-w-lg mx-auto w-full">
                <Label htmlFor="listing-title" className="text-xs font-bold">
                  Listing title
                </Label>
                <Input
                  id="listing-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., iPhone 13 Pro 128GB — excellent condition"
                  className="h-12 sm:h-14 border-2 border-black rounded-xl text-base font-medium"
                  maxLength={120}
                  autoFocus
                />
                <p className="text-[11px] text-slate-500">Keep it specific. Mention brand, model, or size if it helps.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2 max-w-lg mx-auto w-full">
                <Label htmlFor="listing-desc" className="text-xs font-bold">
                  Description
                </Label>
                <Textarea
                  id="listing-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Condition, accessories, warranty, reason for selling…"
                  className="min-h-[160px] sm:min-h-[180px] border-2 border-black rounded-xl text-base resize-y"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="max-w-2xl mx-auto w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {SELL_CATEGORIES.map((c) => {
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
              </div>
            )}

            {step === 3 && (
              <div className="max-w-xl mx-auto w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SELL_LOCATIONS.map((loc) => {
                    const selected = location === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl border-2 px-2 py-3 text-xs sm:text-sm font-bold transition-all',
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-black/20 bg-white text-black hover:border-black'
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        {loc}
                      </button>
                    );
                  })}
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
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Price type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPriceType('fixed')}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                        priceType === 'fixed' ? 'border-black bg-slate-100 shadow-[0_4px_0_0_rgba(0,0,0,0.2)]' : 'border-black/20 hover:border-black/40'
                      )}
                    >
                      <IndianRupee className="h-7 w-7" />
                      <span className="font-black text-sm">Fixed price</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceType('range')}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                        priceType === 'range' ? 'border-black bg-slate-100 shadow-[0_4px_0_0_rgba(0,0,0,0.2)]' : 'border-black/20 hover:border-black/40'
                      )}
                    >
                      <span className="flex items-center gap-0.5 font-black text-lg leading-none">₹–₹</span>
                      <span className="font-black text-sm mt-1">Price range</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-md mx-auto w-full space-y-4">
                {priceType === 'fixed' ? (
                  <div className="space-y-2">
                    <Label htmlFor="price-fixed" className="text-xs font-bold flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5" />
                      Your price (INR)
                    </Label>
                    <Input
                      id="price-fixed"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g., 25000"
                      inputMode="decimal"
                      className="h-12 border-2 border-black rounded-xl text-lg font-bold"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Min (INR)</Label>
                      <Input
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        placeholder="20000"
                        inputMode="decimal"
                        className="h-12 border-2 border-black rounded-xl font-bold"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Max (INR)</Label>
                      <Input
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        placeholder="30000"
                        inputMode="decimal"
                        className="h-12 border-2 border-black rounded-xl font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 6 && (
              <div className="max-w-lg mx-auto w-full space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-xs font-bold flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Tags (comma separated)
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="apple, warranty, charger…"
                    className="h-11 border-2 border-black rounded-xl"
                  />
                  {parsedTags.length > 0 && (
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold">Preview:</span> {parsedTags.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    Photos (up to 5)
                  </Label>
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
                  </div>
                </div>
                <div className="rounded-xl border border-black/15 bg-slate-50 p-3 text-[11px] text-slate-700 space-y-1">
                  <p>
                    <span className="font-bold">Title:</span> {title || '—'}
                  </p>
                  <p>
                    <span className="font-bold">Category:</span>{' '}
                    {SELL_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                  </p>
                  <p>
                    <span className="font-bold">Location:</span> {location}
                  </p>
                  <p>
                    <span className="font-bold">Price:</span>{' '}
                    {priceType === 'fixed'
                      ? price
                        ? `₹${price}`
                        : '—'
                      : `${priceMin || '—'} – ${priceMax || '—'}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center pt-2 border-t border-slate-100">
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
                className="bg-black text-white border-2 border-black font-black rounded-xl h-11 sm:h-12 px-8"
              >
                {publishing ? 'Publishing…' : 'Publish listing'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </SellShell>
  );
}

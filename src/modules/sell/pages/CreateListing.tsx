import { useMemo, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToCloudinaryUnsigned } from '@/integrations/cloudinary';
import { toast } from '@/hooks/use-toast';
import { createListing } from '../services/sellDb';
import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';
import type { ListingCondition, ListingPriceType } from '../types';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    } catch (e) {
      toast({ title: 'Upload failed', description: 'Could not upload one or more images.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Missing info', description: 'Title and description are required.', variant: 'destructive' });
      return;
    }
    if (priceType === 'fixed' && !price.trim()) {
      toast({ title: 'Missing price', description: 'Enter a price.', variant: 'destructive' });
      return;
    }
    if (priceType === 'range' && (!priceMin.trim() || !priceMax.trim())) {
      toast({ title: 'Missing price range', description: 'Enter min and max price.', variant: 'destructive' });
      return;
    }

    const fixedPrice = priceType === 'fixed' ? Number(price) : null;
    const rangeMin = priceType === 'range' ? Number(priceMin) : null;
    const rangeMax = priceType === 'range' ? Number(priceMax) : null;

    if (priceType === 'fixed' && (!Number.isFinite(fixedPrice) || (fixedPrice ?? 0) <= 0)) {
      toast({ title: 'Invalid price', description: 'Enter a valid numeric price.', variant: 'destructive' });
      return;
    }

    if (
      priceType === 'range' &&
      (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax) || (rangeMin ?? 0) <= 0 || (rangeMax ?? 0) <= 0 || (rangeMin ?? 0) > (rangeMax ?? 0))
    ) {
      toast({ title: 'Invalid range', description: 'Use valid numbers and keep min <= max.', variant: 'destructive' });
      return;
    }

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
      setIsPublished(true);
      window.setTimeout(() => {
        navigate('/sell/marketplace');
      }, 5000);
    } catch (e) {
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

  return (
    <SellShell title="Create Listing">
      <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
        <CardHeader className="font-black text-black">Listing Details</CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., iPhone 13 Pro 128GB" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write details…" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border border-black">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SELL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="border border-black">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {SELL_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as ListingCondition)}>
                <SelectTrigger className="border border-black">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select value={priceType} onValueChange={(v) => setPriceType(v as ListingPriceType)}>
                <SelectTrigger className="border border-black">
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {priceType === 'fixed' ? (
            <div className="space-y-2">
              <Label>Price</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 25000" inputMode="numeric" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min</Label>
                <Input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="e.g., 20000" inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="e.g., 30000" inputMode="numeric" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags / keywords (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., apple, warranty, charger" />
            {parsedTags.length > 0 && <p className="text-[11px] text-gray-600">Tags: {parsedTags.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <Input type="file" multiple accept="image/*" onChange={(e) => onAddImages(e.target.files)} disabled={uploading || images.length >= 5} />
            <p className="text-[11px] text-gray-600">Maximum 5 images.</p>
            {images.length > 0 && <p className="text-[11px] text-gray-600">{images.length}/5 image(s) added</p>}
          </div>

          <Button
            onClick={publish}
            disabled={!user || uploading || publishing}
            className="w-full bg-black text-white border border-black font-black h-12 rounded-xl"
          >
            {publishing ? 'Publishing…' : 'Publish Listing'}
          </Button>
        </CardContent>
      </Card>
    </SellShell>
  );
}



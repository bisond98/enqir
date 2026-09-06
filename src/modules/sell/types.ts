export type ListingCondition = 'new' | 'used';

export type ListingPriceType = 'fixed' | 'range';

// Per-category structured attributes (brand, year, fuel, etc.) keyed by field name
export type ListingDetails = Record<string, string>;

export interface SellListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  condition: ListingCondition;
  priceType: ListingPriceType;
  price?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  tags: string[];
  images: string[];
  details?: ListingDetails | null;
  createdAt?: any;
  updatedAt?: any;
  status: 'live' | 'draft' | 'deleted';
}

export interface SellListingResponse {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  message: string;
  offeredPrice?: number | null;
  voiceUrl?: string;
  attachments?: { url: string; name: string; type: string }[];
  createdAt?: any;
}



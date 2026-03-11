export type ListingCondition = 'new' | 'used';

export type ListingPriceType = 'fixed' | 'range';

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
  createdAt?: any;
}



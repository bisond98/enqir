export type ListingCondition = 'new' | 'used';

export type ListingPriceType = 'fixed' | 'range' | 'discussion';

// Per-category structured attributes (brand, year, fuel, etc.) keyed by field name
export type ListingDetails = Record<string, string>;

export interface SellListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  /** All selected categories (max 3) — first one is the primary (same as `category`). */
  categories?: string[];
  location: string;
  condition: ListingCondition;
  priceType: ListingPriceType;
  price?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  tags: string[];
  images: string[];
  details?: ListingDetails | null;
  /** Seller's contact mobile number (e.g. "+91 98765 43210") — never displayed on the page, only revealed via the call popup to paid users. */
  mobileNumber?: string | null;
  createdAt?: any;
  updatedAt?: any;
  status: 'live' | 'draft' | 'deleted' | 'expired';
  /** Deadline categories (food / jobs / agriculture): optional listing end time after which the listing is expired (shown expired to the seller, hidden from marketplace). */
  deadline?: any;
}

export type ListingCreateInput = Omit<SellListing, 'id' | 'sellerId' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: SellListing['status'];
  /** Deadline categories: optional end time after which the listing is expired. */
  deadline?: any;
};

export interface SellListingResponse {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  message: string;
  /** 'connect' = buyer paid to call/connect without writing a message. */
  type?: 'message' | 'connect';
  offeredPrice?: number | null;
  voiceUrl?: string;
  attachments?: { url: string; name: string; type: string }[];
  createdAt?: any;
}



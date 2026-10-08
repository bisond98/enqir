import type { SellListing } from '../types';
import { shareToTarget } from '@/lib/socialShare';

/** Show only the state (last comma-separated part) of a location in shares. */
function locationStateOnly(location?: string): string {
  if (!location) return 'India';
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] || 'India');
}

/**
 * Spec sentence from the listing's category detail chips — the needful facts
 * a buyer asks for first (fuel, transmission, ownership, km driven…).
 */
function listingSpecSentence(listing: SellListing): string {
  const d: any = listing.details || {};
  const cat = listing.category;
  const bits: string[] = [];

  if (cat === 'car' || cat === 'vehicles' || cat === 'bike') {
    if (d.fuel) bits.push(d.fuel);
    if (d.transmission) bits.push(d.transmission);
    if (d.ownership) bits.push(d.ownership);
    if (d.kmsDriven) bits.push(`${Number(d.kmsDriven).toLocaleString('en-IN')} km driven`);
    if (d.accidentHistory && d.accidentHistory !== 'No accidents') bits.push(d.accidentHistory);
  } else if (cat === 'mobiles') {
    if (d.brand) bits.push(d.brand);
    if (d.storage) bits.push(d.storage);
    if (d.warranty) bits.push(d.warranty);
  } else if (cat === 'laptops') {
    if (d.processor) bits.push(d.processor);
    if (d.ram) bits.push(`${d.ram} RAM`);
    if (d.storage) bits.push(d.storage);
  } else if (cat === 'jobs') {
    if (d.experience) bits.push(d.experience);
    if (d.jobType) bits.push(d.jobType);
    if (d.workMode) bits.push(d.workMode);
  } else if (cat === 'service') {
    if (d.repairType) bits.push(d.repairType);
    if (d.serviceMode) bits.push(d.serviceMode);
    if (d.experience) bits.push(d.experience);
  } else if (cat === 'accommodations') {
    if (d.accommodationType) bits.push(d.accommodationType);
    if (d.furnishing) bits.push(d.furnishing);
  } else if (cat === 'real-estate') {
    if (d.houseBhk) bits.push(d.houseBhk);
    if (d.landArea) bits.push(`Land: ${d.landArea}`);
    if (d.builtUpArea) bits.push(`Buildings: ${d.builtUpArea}`);
    if (d.houseArea) bits.push(`House: ${d.houseArea}`);
    if (d.furnishing) bits.push(d.furnishing);
  } else if (cat === 'sneakers') {
    if (d.sneakerBrand) bits.push(d.sneakerBrand);
    if (d.sneakerSize) bits.push(`Size ${d.sneakerSize}`);
    if (d.sneakerAudience) bits.push(d.sneakerAudience);
  }

  return bits.join(' · ');
}

// AI-generated share messages for listings
const shareTemplates = [
  (title: string, price: string, location: string) => 
    `🔥 Just found "${title}" for ${price} in ${location}! Check it out on Enqir.in 🛒`,
  
  (title: string, price: string, location: string) => 
    `✨ Great deal alert! "${title}" available for ${price} in ${location}. Shop now on Enqir.in! 🎯`,
  
  (title: string, price: string, location: string) => 
    `👀 Check this out! "${title}" for only ${price} in ${location}. Find it on Enqir.in! 💎`,
  
  (title: string, price: string, location: string) => 
    `🎯 Found a gem! "${title}" priced at ${price} in ${location}. See it on Enqir.in! 🛍️`,
  
  (title: string, price: string, location: string) => 
    `💥 Hot deal! "${title}" for ${price} in ${location}. Browse more on Enqir.in! 🔥`,
];

// Generate a catchy AI-style share message
export function generateShareMessage(listing: SellListing): string {
  const price = (listing as any).priceType === 'discussion'
    ? '₹ Open to discussion'
    : listing.price
      ? `₹${listing.price.toLocaleString('en-IN')}`
      : 'contact for price';
  
  const location = locationStateOnly(listing.location);
  const templateIndex = Math.floor(Math.random() * shareTemplates.length);
  
  let message = shareTemplates[templateIndex](listing.title, price, location);

  // Spec chips as a sentence on its own line (fuel · transmission · owner · km driven…)
  const specs = listingSpecSentence(listing);
  if (specs) message = `${message}\n${specs}`;

  // Real-estate listings — make the deal type explicit (For Rent / For Lease / For Sale)
  const listingFor = (listing.details as any)?.listingFor as string | undefined;
  const isRealEstate = ['real-estate', 'real-estate-services'].includes(listing.category);
  // Jobs and services aren't products for sale — they're offered as available
  const isOffered = listing.category === 'jobs' || listing.category.includes('service');
  if (isRealEstate && listingFor && listingFor !== 'Sale') {
    message = `🏠 FOR ${listingFor.toUpperCase()} — ${message}`;
  } else if (isOffered) {
    // Jobs and service listings read as availability, not a sale
    message = `✅ AVAILABLE — ${message}`;
  } else if (isRealEstate) {
    // Real-estate listed for sale
    message = `🏠 FOR SALE — ${message}`;
  } else {
    // Every other listing here is a sale — say so up front
    message = `🛒 FOR SALE — ${message}`;
  }

  return message;
}

// Get the listing URL
export function getListingUrl(listingId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/sell/listing/${listingId}`;
}

// Share to WhatsApp
export function shareToWhatsApp(message: string, url: string): void {
  const text = encodeURIComponent(`${message}\n\n${url}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Share to Twitter/X
export function shareToTwitter(message: string, url: string): void {
  const text = encodeURIComponent(`${message}\n\n${url}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

// Share to Facebook
export function shareToFacebook(url: string): void {
  const encodedUrl = encodeURIComponent(url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Native share (for mobile devices)
export async function nativeShare(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Main share function with AI message
export async function shareListing(
  listing: SellListing,
  platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy' | 'native' | 'whatsapp_status' | 'instagram_dm' | 'instagram_story' | 'email'
): Promise<{ success: boolean; message: string }> {
  const aiMessage = generateShareMessage(listing);
  const url = getListingUrl(listing.id);
  
  try {
    switch (platform) {
      case 'whatsapp_status':
      case 'instagram_dm':
      case 'instagram_story':
      case 'email': {
        const result = await shareToTarget(platform, { title: listing.title, text: aiMessage, url });
        return result;
      }
      
      case 'whatsapp':
        shareToWhatsApp(aiMessage, url);
        return { success: true, message: 'Opening WhatsApp...' };
      
      case 'twitter':
        shareToTwitter(aiMessage, url);
        return { success: true, message: 'Opening Twitter...' };
      
      case 'facebook':
        shareToFacebook(url);
        return { success: true, message: 'Opening Facebook...' };
      
      case 'copy':
        const fullText = `${aiMessage}\n\n${url}`;
        const copied = await copyToClipboard(fullText);
        return { success: copied, message: copied ? 'Copied to clipboard!' : 'Failed to copy' };
      
      case 'native':
        const shared = await nativeShare(listing.title, aiMessage, url);
        if (shared) return { success: true, message: 'Shared successfully!' };
        // Fallback to copy if native share fails
        const fallbackCopied = await copyToClipboard(`${aiMessage}\n\n${url}`);
        return { success: fallbackCopied, message: fallbackCopied ? 'Copied to clipboard!' : 'Failed to share' };
      
      default:
        return { success: false, message: 'Invalid platform' };
    }
  } catch (error) {
    return { success: false, message: 'Share failed' };
  }
}

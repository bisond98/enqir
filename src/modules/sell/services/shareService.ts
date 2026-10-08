import type { SellListing } from '../types';
import { shareToTarget } from '@/lib/socialShare';

/**
 * Show only the state (e.g. "Kerala") of a location in shares — never the
 * country. A trailing "India" part is skipped; if nothing but the country
 * remains, no location is shown at all.
 */
function locationStateOnly(location?: string): string {
  if (!location) return '';
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  const states = parts.filter((p) => p.toLowerCase() !== 'india');
  return states.length ? states[states.length - 1] : '';
}

/** Emoji for the listing's category — an apt icon for every category. */
function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    car: '🚗', vehicles: '🚗', bike: '🏍️', bicycles: '🚲',
    mobiles: '📱', laptops: '💻', electronics: '🔌', technology: '🔌',
    appliances: '🔌', furniture: '🛋️', home: '🏠', kitchen_dining: '🍽️',
    'kitchen-dining': '🍽️', fashion: '👗', sneakers: '👟',
    'bags-luggage': '👜', 'jewelry-accessories': '💎', 'beauty-products': '💄',
    'health-beauty': '💊', 'medical-equipment': '🩺',
    'real-estate': '🏠', 'real-estate-services': '🏠', accommodations: '🏠',
    jobs: '💼', service: '🔧', 'repair-services': '🔧',
    'cleaning-services': '🧹', 'insurance-services': '🛡️',
    'musical-services': '🎼', 'musical-instruments': '🎸',
    'musical-accessories': '🎼', 'education-training': '🎓',
    'tutoring-lessons': '🎓', 'wedding-events': '💍',
    'childcare-family': '🧸', 'baby-kids': '🧸', pets: '🐾',
    'food-beverage': '🍽️', 'travel-tourism': '✈️',
    'transportation-logistics': '🚚', 'agriculture-farming': '🌾',
    'construction-renovation': '🏗️', 'tools-equipment': '🛠️',
    'raw-materials-industrial': '🏭', 'office-supplies': '🖨️',
    'photography-cameras': '📷', 'fitness-gym-equipment': '🏋️',
    'sports-outdoor': '🏏', 'garden-outdoor': '🌱', 'gaming-recreation': '🎮',
    'entertainment-media': '🎬', 'events-entertainment': '🎪',
    books: '📚', 'books-publications': '📚', art: '🎨',
    antiques: '🏺', collectibles: '🏺', memorabilia: '🏺', vintage: '🏺',
    souvenir: '🎁', thrift: '🛍️', business: '🏢', personal: '👤',
    'legal-financial': '⚖️', 'marketing-advertising': '📣',
    'government-public': '🏛️', 'non-profit-charity': '🤝',
    'renewable-energy': '☀️', 'security-safety': '🔒',
    'waste-management': '♻️', other: '🏷️',
  };
  if (map[cat]) return map[cat];
  if (cat.includes('service')) return '🔧';
  return '🏷️';
}

/** Fuel emoji — pump for liquid fuels, battery for electric, bolt for hybrid. */
function fuelIcon(fuel?: string): string {
  if (!fuel) return '⛽';
  const f = fuel.toLowerCase();
  if (f.includes('electric')) return '🔋';
  if (f.includes('hybrid')) return '⚡';
  return '⛽';
}

/**
 * Spec sentence from the listing's category detail chips — the needful facts
 * a buyer asks for first, each with an apt emoji.
 */
function listingSpecSentence(listing: SellListing): string {
  const d: any = listing.details || {};
  const cat = listing.category;
  const bits: string[] = [];

  if (cat === 'car' || cat === 'vehicles' || cat === 'bike') {
    if (d.fuel) bits.push(`${fuelIcon(d.fuel)} ${d.fuel}`);
    if (d.transmission) bits.push(`⚙️ ${d.transmission}`);
    if (d.ownership) bits.push(`👤 ${d.ownership}`);
  } else if (cat === 'mobiles') {
    if (d.brand) bits.push(`📱 ${d.brand}`);
    if (d.storage) bits.push(`💾 ${d.storage}`);
    if (d.warranty) bits.push(`🛡️ ${d.warranty}`);
  } else if (cat === 'laptops') {
    if (d.processor) bits.push(`⚡ ${d.processor}`);
    if (d.ram) bits.push(`🧠 ${d.ram} RAM`);
    if (d.storage) bits.push(`💾 ${d.storage}`);
  } else if (cat === 'jobs') {
    if (d.experience) bits.push(`📅 ${d.experience}`);
    if (d.jobType) bits.push(`🕒 ${d.jobType}`);
    if (d.workMode) bits.push(`🏢 ${d.workMode}`);
  } else if (cat === 'service') {
    if (d.repairType) bits.push(`🔧 ${d.repairType}`);
    if (d.serviceMode) bits.push(`📍 ${d.serviceMode}`);
    if (d.experience) bits.push(`📅 ${d.experience}`);
  } else if (cat === 'accommodations') {
    if (d.accommodationType) bits.push(`🛏️ ${d.accommodationType}`);
    if (d.furnishing) bits.push(`🛋️ ${d.furnishing}`);
  } else if (cat === 'real-estate') {
    if (d.houseBhk) bits.push(`🏠 ${d.houseBhk}`);
    if (d.landArea) bits.push(`🌳 Land: ${d.landArea}`);
    if (d.builtUpArea) bits.push(`🏢 Buildings: ${d.builtUpArea}`);
    if (d.houseArea) bits.push(`🏡 House: ${d.houseArea}`);
    if (d.furnishing) bits.push(`🛋️ ${d.furnishing}`);
  } else if (cat === 'sneakers') {
    if (d.sneakerBrand) bits.push(`👟 ${d.sneakerBrand}`);
    if (d.sneakerSize) bits.push(`📏 Size ${d.sneakerSize}`);
    if (d.sneakerAudience) bits.push(`👥 ${d.sneakerAudience}`);
  }

  const bits2 = bits;
  return bits2
    .filter((b) => b.toLowerCase() !== (listing.title || '').toLowerCase())
    .join(' · ');
}

// Generate the share message for a listing — natural sentence, no price:
//   "Used BMW for sale in Kerala"
export function generateShareMessage(listing: SellListing): string {
  const d: any = listing.details || {};
  const cat = listing.category;
  const isRealEstate = ['real-estate', 'real-estate-services'].includes(cat);
  // Jobs and services aren't products for sale — they're offered as available
  const isOffered = cat === 'jobs' || cat.includes('service');
  const listingFor = d.listingFor as string | undefined;
  const state = locationStateOnly(listing.location);

  // Sentence body: condition + title ("Used BMW 320d") — no km driven, no accident history
  const cond = listing.condition
    ? listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).toLowerCase()
    : null;
  const head = cond ? `${cond} ${listing.title || ''}`.trim() : (listing.title || '');
  const bits: string[] = [];
  if (head) bits.push(head);

  // Deal phrase: rent/lease for real estate, available for jobs/services, else for sale
  let dealPhrase = 'for sale';
  if (isRealEstate && listingFor === 'Rent') dealPhrase = 'for rent';
  else if (isRealEstate && listingFor === 'Lease') dealPhrase = 'for lease';
  else if (isOffered) dealPhrase = 'available';

  // Real-estate's FOR SALE/RENT/LEASE prefix already carries the house emoji
  const icon = isRealEstate ? '' : categoryIcon(cat);
  let message = `${icon ? `${icon} ` : ''}${bits.join(', ')} ${dealPhrase}${state ? ` in 📍 ${state}` : ''}`;

  // Spec chips as a sentence on its own line (fuel · transmission · owner…)
  const specs = listingSpecSentence(listing);
  if (specs) message = `${message}\n${specs}`;

  // Prefix: make the deal type explicit at a glance
  if (isRealEstate && listingFor && listingFor !== 'Sale') {
    message = `🏠 FOR ${listingFor.toUpperCase()} — ${message}`;
  } else if (isOffered) {
    // Jobs and service listings read as availability, not a sale
    message = `❗️ AVAILABLE — ${message}`;
  } else if (isRealEstate) {
    // Real-estate listed for sale
    message = `🏠 FOR SALE — ${message}`;
  } else {
    // Every other listing here is a sale — say so up front
    message = `❗️ FOR SALE — ${message}`;
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

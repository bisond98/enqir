import type { SellListing } from '../types';

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
  const price = listing.price 
    ? `₹${listing.price.toLocaleString('en-IN')}` 
    : 'contact for price';
  
  const location = listing.location || 'India';
  const templateIndex = Math.floor(Math.random() * shareTemplates.length);
  
  return shareTemplates[templateIndex](listing.title, price, location);
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
  platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy' | 'native'
): Promise<{ success: boolean; message: string }> {
  const aiMessage = generateShareMessage(listing);
  const url = getListingUrl(listing.id);
  
  try {
    switch (platform) {
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

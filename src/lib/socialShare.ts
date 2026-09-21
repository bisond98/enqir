/**
 * Deep-link share targets for enquiries and sell listings.
 *
 * Platform notes:
 * - WhatsApp message: proper deep link exists (wa.me) — works everywhere.
 * - WhatsApp Status: no web deep link exists. On mobile the native share
 *   sheet (Web Share API) surfaces it when the app is installed. On desktop
 *   we copy the content and open WhatsApp Web.
 * - Instagram DM/Story: deliberately NOT offered as direct targets —
 *   Instagram blocks websites from pre-filling content (no share-intent
 *   URL exists). The native share sheet covers it on mobile.
 */

export type SocialShareTarget =
  | 'whatsapp'
  | 'whatsapp_status'
  | 'twitter'
  | 'facebook'
  | 'email'
  | 'copy';

export interface SocialShareContent {
  title: string;
  /** Full share text — should already include the link/URL. */
  text: string;
  url: string;
}

export interface ShareResult {
  success: boolean;
  message: string;
}

const isMobileDevice = (): boolean =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Fires the native OS share sheet (mobile) — where WhatsApp Status /
 *  Instagram Story appear as targets when those apps are installed. */
export async function openNativeShareSheet(content: SocialShareContent): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share({
      title: content.title,
      text: content.text,
      url: content.url,
    });
    return true;
  } catch (err: any) {
    if (err?.name === 'AbortError') return true; // user cancelled — not an error
    return false;
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareToTarget(
  target: SocialShareTarget,
  content: SocialShareContent
): Promise<ShareResult> {
  const fullText = content.text.includes(content.url)
    ? content.text
    : `${content.text}\n${content.url}`;

  switch (target) {
    case 'whatsapp': {
      openUrl(`https://wa.me/?text=${encodeURIComponent(fullText)}`);
      return { success: true, message: 'Opening WhatsApp…' };
    }

    case 'whatsapp_status': {
      // Mobile: native sheet offers "WhatsApp Status" when the app is installed.
      if (isMobileDevice() && navigator.share) {
        const shared = await openNativeShareSheet(content);
        if (shared) return { success: true, message: 'Shared!' };
      }
      // Fallback: copy and let the user paste into their Status.
      const copied = await copyText(fullText);
      if (!isMobileDevice()) openUrl('https://web.whatsapp.com/');
      return {
        success: copied,
        message: copied
          ? 'Copied! Paste it into your WhatsApp Status.'
          : 'Could not copy — please copy the link manually.',
      };
    }

    case 'twitter': {
      openUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`);
      return { success: true, message: 'Opening X…' };
    }

    case 'facebook': {
      openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`);
      return { success: true, message: 'Opening Facebook…' };
    }

    case 'email': {
      const subject = content.title || 'Check this out';
      const body = fullText;
      openUrl(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      return { success: true, message: 'Opening your mail app…' };
    }

    case 'copy': {
      const copied = await copyText(fullText);
      return {
        success: copied,
        message: copied ? 'Copied to clipboard!' : 'Could not copy — please copy the link manually.',
      };
    }

    default:
      return { success: false, message: 'Unknown share target' };
  }
}

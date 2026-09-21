import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Instagram, Mail, Facebook, Copy, Check, Smartphone, Twitter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { shareToTarget } from '@/lib/socialShare';
import type { SocialShareTarget } from '@/lib/socialShare';

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  /** Anchor element the menu positions against. */
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  text: string;
  url: string;
  /** Optional callback fired after the user picks any target (e.g. to bump a share counter). */
  onShared?: () => void;
}

/**
 * Reusable share dropdown for enquiries — WhatsApp, WhatsApp Status,
 * Instagram DM and Instagram Story targets, matching the listing
 * ShareButton's physical-button menu style.
 */
export default function ShareMenu({ open, onClose, anchorRef, title, text, url, onShared }: ShareMenuProps) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (anchorRef.current?.contains(target)) return;
      if (target.closest('[data-enquiry-share-menu]')) return;
      onClose();
    };
    const id = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuHeight = 460;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      // Vertical: prefer below the anchor; if it would overflow the bottom,
      // open upward; if even that overflows, pin it inside the viewport.
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      let top: number;
      if (spaceBelow >= menuHeight + margin) {
        top = rect.bottom + 4;
      } else if (spaceAbove >= menuHeight + margin) {
        top = rect.top - menuHeight - 4;
      } else {
        // Doesn't fit either side — pin with margin and let the menu scroll
        top = Math.min(Math.max(rect.bottom + 4, margin), Math.max(margin, vh - menuHeight - margin));
      }

      // Horizontal: keep fully inside the viewport
      const left = Math.min(Math.max(rect.left, margin), Math.max(margin, vw - 216 - margin));

      setMenuPos({ top, left });
    }
  }, [open, anchorRef]);

  if (!open) return null;

  const handleShare = (target: SocialShareTarget) => {
    onClose();
    onShared?.();
    setTimeout(async () => {
      const result = await shareToTarget(target, { title, text, url });
      if (result.success) {
        toast({ title: 'Share', description: result.message });
        if (target === 'copy') {
          setCopiedKey(target);
          setTimeout(() => setCopiedKey(null), 2000);
        }
      } else {
        toast({ title: 'Failed', description: result.message, variant: 'destructive' });
      }
    }, 100);
  };

  return createPortal(
    <div
      data-enquiry-share-menu
      className="fixed bg-white border-2 border-black rounded-xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] min-w-[200px] py-1 overflow-y-auto"
      style={{
        zIndex: 9999,
        top: menuPos.top,
        left: menuPos.left,
        maxHeight: 'calc(100vh - 16px)',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {hasNativeShare && (
        <button
          onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp_status'); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Smartphone className="h-4 w-4 text-blue-500" />
          Share to Story / Status…
        </button>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <MessageCircle className="h-4 w-4 text-green-500" />
        WhatsApp
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp_status'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <MessageCircle className="h-4 w-4 text-green-600" />
        WhatsApp Status
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('instagram_dm'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Instagram className="h-4 w-4 text-pink-600" />
        Instagram Message
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('instagram_story'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        {copiedKey === 'instagram_story' ? <Check className="h-4 w-4 text-green-500" /> : <Instagram className="h-4 w-4 text-purple-600" />}
        {copiedKey === 'instagram_story' ? 'Copied!' : 'Instagram Story'}
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('twitter'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Twitter className="h-4 w-4 text-black" />
        X (Twitter)
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('facebook'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Facebook className="h-4 w-4 text-blue-600" />
        Facebook
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('email'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Mail className="h-4 w-4 text-slate-600" />
        Email
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('copy'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors"
      >
        {copiedKey === 'copy' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
        {copiedKey === 'copy' ? 'Copied!' : 'Copy Link'}
      </button>
    </div>,
    document.body
  );
}

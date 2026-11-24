import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Copy, Check, X } from 'lucide-react';
import { WhatsAppIcon, XIcon, FacebookIcon, InstagramIcon } from '@/components/BrandIcons';
import { toast } from '@/hooks/use-toast';
import { shareToTarget } from '@/lib/socialShare';
import type { SocialShareTarget } from '@/lib/socialShare';
import StatusCardStudio from '@/components/StatusCardStudio';

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  /** Anchor element the menu positions against. */
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  text: string;
  url: string;
  /** First uploaded photo (enquiry reference image), if any — attached on phones. */
  imageUrl?: string;
  /** Optional callback fired after the user picks any target (e.g. to bump a share counter). */
  onShared?: () => void;
}

/**
 * Reusable share dropdown for enquiries — WhatsApp, WhatsApp Status,
 * Instagram DM and Instagram Story targets, matching the listing
 * ShareButton's physical-button menu style.
 */
export function ShareRow({
  icon,
  tile,
  label,
  hint,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  tile: string;
  label: string;
  hint: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${tile} shadow-sm transition-transform group-active:scale-95`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-gray-900">{label}</span>
          {badge && (
            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-600">
              {badge}
            </span>
          )}
        </span>
        <span className="block truncate text-[11px] leading-snug text-gray-400">{hint}</span>
      </span>
    </button>
  );
}

export default function ShareMenu({ open, onClose, anchorRef, title, text, url, imageUrl, onShared }: ShareMenuProps) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Phones get a bottom sheet; wider screens get an anchored popover.
  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 640);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
    if (open && !isMobile && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuHeight = 560;
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
      // Align the popover's right edge with the share button.
      const left = Math.min(Math.max(rect.right - 272, margin), Math.max(margin, vw - 272 - margin));

      setMenuPos({ top, left });
    }
  }, [open, anchorRef, isMobile]);

  // The status-card studio lives in the same portal, so it must survive the
  // menu closing — that close is what opens the studio.
  if (!open && !studioOpen) return null;

  const handleShare = (target: SocialShareTarget) => {
    // Status posts a card image, not a coloured text block — open the studio so
    // the design can be picked before sharing.
    if (target === 'whatsapp_status') {
      onClose();
      onShared?.();
      setStudioOpen(true);
      return;
    }
    onClose();
    onShared?.();

    setTimeout(async () => {
      try {
        const result = await shareToTarget(target, { title, text, url, imageUrl });
        if (result.success) {
          toast({ title: 'Share', description: result.message });
          if (target === 'copy') {
            setCopiedKey(target);
            setTimeout(() => setCopiedKey(null), 2000);
          }
        } else {
          toast({ title: 'Failed', description: result.message, variant: 'destructive' });
        }
      } catch (err) {
        // A blocked popup, denied clipboard or failed share sheet must not
        // surface as an unhandled rejection — show the same failure toast.
        console.error('Share failed:', err);
        toast({
          title: 'Failed',
          description: 'Sharing is unavailable right now — please copy the link instead.',
          variant: 'destructive',
        });
      }
    }, 100);
  };

  return createPortal(
    <>
      {open && (
        <>
      {/* Dim backdrop — tap anywhere to close */}
      <div
        className={`fixed inset-0 backdrop-fade ${isMobile ? 'bg-black/40' : 'bg-transparent'}`}
        style={{ zIndex: 9998 }}
        aria-hidden="true"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        data-enquiry-share-menu
        role="dialog"
        aria-label="Share enquiry"
        onClick={(e) => e.stopPropagation()}
        className={
          isMobile
            ? 'sheet-rise fixed inset-x-0 bottom-0 overflow-y-auto rounded-t-[26px] border-t border-gray-200 bg-white px-3 pb-6 pt-2 shadow-[0_-16px_50px_rgba(0,0,0,0.18)]'
            : 'menu-pop fixed w-[272px] overflow-y-auto rounded-2xl border border-gray-200/80 bg-white/95 p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl'
        }
        style={
          isMobile
            ? { zIndex: 9999, maxHeight: '82vh' }
            : { zIndex: 9999, top: menuPos.top, left: menuPos.left, maxHeight: 'calc(100vh - 16px)' }
        }
      >
        {isMobile && (
          <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-gray-300" aria-hidden="true" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Share</p>
            <p className="mt-0.5 text-[13px] font-semibold text-gray-900">Send this enquiry</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1 space-y-0.5">
          <ShareRow
            icon={<WhatsAppIcon className="h-[18px] w-[18px] text-white" />}
            tile="bg-[#25D366]"
            label="WhatsApp"
            hint="Send the link in a chat"
            onClick={() => handleShare('whatsapp')}
          />
          <ShareRow
            icon={<WhatsAppIcon className="h-[18px] w-[18px] text-white" />}
            tile="bg-[#128C7E]"
            label="WhatsApp Status"
            hint="Post it as an image card"
            badge="Card"
            onClick={() => handleShare('whatsapp_status')}
          />
          <ShareRow
            icon={<FacebookIcon className="h-[18px] w-[18px] text-white" />}
            tile="bg-[#1877F2]"
            label="Facebook"
            hint="Share to your feed"
            onClick={() => handleShare('facebook')}
          />
          <ShareRow
            icon={<InstagramIcon className="h-[18px] w-[18px] text-white" />}
            tile="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"
            label="Instagram"
            hint="Send it in a DM"
            onClick={() => handleShare('instagram_dm')}
          />
          <ShareRow
            icon={<XIcon className="h-[16px] w-[16px] text-white" />}
            tile="bg-black"
            label="X"
            hint="Post to your timeline"
            onClick={() => handleShare('twitter')}
          />
          <ShareRow
            icon={<Mail className="h-[18px] w-[18px] text-white" />}
            tile="bg-slate-500"
            label="Email"
            hint="Open a mail draft"
            onClick={() => handleShare('email')}
          />
        </div>

        <div className="mx-2.5 my-1.5 border-t border-gray-100" />

        <div className="space-y-0.5">
          <ShareRow
            icon={
              copiedKey === 'copy' ? (
                <Check className="h-[18px] w-[18px] text-white" />
              ) : (
                <Copy className="h-[18px] w-[18px] text-white" />
              )
            }
            tile={copiedKey === 'copy' ? 'bg-emerald-500' : 'bg-gray-700'}
            label={copiedKey === 'copy' ? 'Link copied' : 'Copy link'}
            hint={copiedKey === 'copy' ? 'Paste it anywhere' : 'Copy to clipboard'}
            onClick={() => handleShare('copy')}
          />
        </div>
      </div>
        </>
      )}
    <StatusCardStudio
      open={studioOpen}
      onClose={() => setStudioOpen(false)}
      title={title}
      text={text}
      url={url}
      imageUrl={imageUrl}
    />
    </>,
    document.body
  );
}

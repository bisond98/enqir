import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Check, Smartphone, Mail, X } from 'lucide-react';
import { WhatsAppIcon, XIcon, FacebookIcon, InstagramIcon } from '@/components/BrandIcons';
import { toast } from '@/hooks/use-toast';
import { shareListing, generateShareMessage, getListingUrl } from '../services/shareService';
import StatusCardStudio from '@/components/StatusCardStudio';
import { ShareRow } from '@/components/ShareMenu';
import type { SellListing } from '../types';

interface ShareButtonProps {
  listing: SellListing;
  variant?: 'icon' | 'full';
  className?: string;
}

export default function ShareButton({ listing, variant = 'icon', className = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [studioOpen, setStudioOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Phones get a bottom sheet; wider screens get an anchored popover.
  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 640);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the button or the portal menu
      if (btnRef.current?.contains(target)) return;
      if (target.closest('[data-share-menu]')) return;
      setIsOpen(false);
    };
    // Use setTimeout to avoid catching the same click that opened the menu
    const id = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMobile && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 560;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      // Vertical: below anchor, else above, else pin inside viewport (menu scrolls)
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      let top: number;
      if (spaceBelow >= menuHeight + margin) {
        top = rect.bottom + 4;
      } else if (spaceAbove >= menuHeight + margin) {
        top = rect.top - menuHeight - 4;
      } else {
        top = Math.min(Math.max(rect.bottom + 4, margin), Math.max(margin, vh - menuHeight - margin));
      }

      // Align the popover's right edge with the share button.
      const left = Math.min(Math.max(rect.right - 272, margin), Math.max(margin, vw - 272 - margin));
      setMenuPos({ top, left });
    }
  }, [isOpen, isMobile]);

  const handleShare = useCallback(async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy' | 'native' | 'whatsapp_status' | 'instagram_dm' | 'instagram_story' | 'email') => {
    setIsOpen(false);

    // Status gets the card image, not the coloured text block — open the studio
    // so a design can be picked before sharing.
    if (platform === 'whatsapp_status') {
      setStudioOpen(true);
      return;
    }

    // Small delay to ensure menu closes before opening share window
    setTimeout(async () => {
      try {
        const result = await shareListing(listing, platform);
        if (result.success) {
          toast({ title: 'Shared!', description: result.message });
          if (platform === 'copy') {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } else {
          toast({ title: 'Failed', description: result.message, variant: 'destructive' });
        }
      } catch (err) {
        // Same failure surface as a rejected share — never an unhandled throw.
        console.error('Share failed:', err);
        toast({
          title: 'Failed',
          description: 'Sharing is unavailable right now — please copy the link instead.',
          variant: 'destructive',
        });
      }
    }, 100);
  }, [listing]);

  const menu = isOpen ? createPortal(
    <>
      {/* Dim backdrop — tap anywhere to close */}
      <div
        className={`fixed inset-0 backdrop-fade ${isMobile ? 'bg-black/40' : 'bg-transparent'}`}
        style={{ zIndex: 9998 }}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />
      <div
        data-share-menu
        role="dialog"
        aria-label="Share listing"
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
            <p className="mt-0.5 text-[13px] font-semibold text-gray-900">Send this listing</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
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
          {hasNativeShare && (
            <ShareRow
              icon={<Smartphone className="h-[18px] w-[18px] text-white" />}
              tile="bg-blue-600"
              label="More options"
              hint="Your phone's share sheet"
              onClick={() => handleShare('native')}
            />
          )}
          <ShareRow
            icon={
              copied ? <Check className="h-[18px] w-[18px] text-white" /> : <Copy className="h-[18px] w-[18px] text-white" />
            }
            tile={copied ? 'bg-emerald-500' : 'bg-gray-700'}
            label={copied ? 'Link copied' : 'Copy link'}
            hint={copied ? 'Paste it anywhere' : 'Copy to clipboard'}
            onClick={() => handleShare('copy')}
          />
        </div>
    </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className={`
          ${variant === 'full'
            ? 'flex items-center gap-2 px-3 py-2 text-xs font-bold bg-white border-2 border-black rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all'
            : 'p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg active:scale-95 transition-all'
          }
          ${className}
        `}
        aria-label="Share listing"
      >
        <Share2 className={variant === 'full' ? 'h-4 w-4 text-black' : 'h-4 w-4'} />
        {variant === 'full' && <span>Share</span>}
      </button>
      {menu}
      {studioOpen && (
        <StatusCardStudio
          open={studioOpen}
          onClose={() => setStudioOpen(false)}
          title={listing.title}
          text={generateShareMessage(listing)}
          url={getListingUrl(listing.id)}
          imageUrl={listing.images?.[0]}
        />
      )}
    </div>
  );
}

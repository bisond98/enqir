import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Check, Smartphone, Mail } from 'lucide-react';
import { WhatsAppIcon, XIcon, FacebookIcon } from '@/components/BrandIcons';
import { toast } from '@/hooks/use-toast';
import { shareListing } from '../services/shareService';
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
  const btnRef = useRef<HTMLButtonElement>(null);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

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
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = hasNativeShare ? 450 : 400;
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

      const left = Math.min(Math.max(rect.left, margin), Math.max(margin, vw - 216 - margin));
      setMenuPos({ top, left });
    }
  }, [isOpen, hasNativeShare]);

  const handleShare = useCallback(async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy' | 'native' | 'whatsapp_status' | 'instagram_dm' | 'instagram_story' | 'email') => {
    setIsOpen(false);
    
    // Small delay to ensure menu closes before opening share window
    setTimeout(async () => {
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
    }, 100);
  }, [listing]);

  const menu = isOpen ? createPortal(
    <div
      data-share-menu
      className="fixed bg-white border-2 border-black rounded-xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] min-w-[180px] py-1 overflow-y-auto"
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
          onMouseDown={(e) => { e.preventDefault(); handleShare('native'); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Smartphone className="h-4 w-4 text-blue-500" />
          Share via...
        </button>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
        WhatsApp
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp_status'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <WhatsAppIcon className="h-4 w-4 text-[#128C7E]" />
        WhatsApp Status
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('twitter'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <XIcon className="h-4 w-4 text-black" />
        X
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('facebook'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <FacebookIcon className="h-4 w-4 text-[#1877F2]" />
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
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>,
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
    </div>
  );
}

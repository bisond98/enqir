import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Share2, MessageCircle, Twitter, Facebook, Copy, Check, Smartphone } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 200)
      });
    }
  }, [isOpen]);

  const handleShare = useCallback(async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy' | 'native') => {
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

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const menu = isOpen ? createPortal(
    <div
      className="fixed bg-white border-2 border-black rounded-xl shadow-[0_8px_0_0_rgba(0,0,0,0.2)] min-w-[180px] py-1"
      style={{ zIndex: 9999, top: menuPos.top, left: menuPos.left }}
    >
      {hasNativeShare && (
        <button
          onMouseDown={(e) => { e.preventDefault(); handleShare('native'); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Smartphone className="h-4 w-4 text-blue-500" />
          Share via...
        </button>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('whatsapp'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <MessageCircle className="h-4 w-4 text-green-500" />
        WhatsApp
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('twitter'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Twitter className="h-4 w-4 text-sky-500" />
        Twitter / X
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('facebook'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <Facebook className="h-4 w-4 text-blue-600" />
        Facebook
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); handleShare('copy'); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors"
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

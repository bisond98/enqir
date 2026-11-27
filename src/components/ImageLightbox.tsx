import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  /** Image to show full screen; null/empty keeps the viewer closed. */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer. Opened by tapping a reference image on the
 * enquiry detail page; closes on backdrop tap, the X button, or Escape.
 */
const ImageLightbox = ({ src, alt = 'Image', onClose }: ImageLightboxProps) => {
  useEffect(() => {
    if (!src) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 active:scale-95 sm:right-5 sm:top-5"
      >
        <X className="h-6 w-6" strokeWidth={2} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body
  );
};

export default ImageLightbox;

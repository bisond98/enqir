import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CardStyle = 'editorial' | 'poster' | 'framed';

interface StatusCardStudioProps {
  open: boolean;
  onClose: () => void;
  /** Listing or enquiry title — the headline of the card. */
  title: string;
  /** Share text; its first line becomes the kicker, the rest the details. */
  text: string;
  /** Link shown at the foot of the card. */
  url: string;
}

const CARD_W = 1080;
const CARD_H = 1920;
const PAD = 112;

const STYLES: { id: CardStyle; label: string }[] = [
  { id: 'editorial', label: 'Editorial' },
  { id: 'poster', label: 'Poster' },
  { id: 'framed', label: 'Framed' },
];

const FONT = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Break a line into lines that fit `maxWidth` at the given font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  style: CardStyle,
  title: string,
  kicker: string,
  details: string[],
  url: string
) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // Deep black backdrop with a soft lift at the top so the type sits in light.
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, '#111113');
  bg.addColorStop(0.45, '#0a0a0b');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const centered = style !== 'poster';
  const contentW = CARD_W - PAD * 2;
  const left = PAD;

  ctx.textAlign = centered ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';

  // Hairline frame for the framed style.
  if (style === 'framed') {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, CARD_W - 112, CARD_H - 112);
  }

  // Wordmark
  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  ctx.font = `600 30px ${FONT}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('ENQIR.IN', centered ? CARD_W / 2 : left, 208);
  ctx.letterSpacing = '0px';

  let y = style === 'poster' ? 470 : 430;

  // Kicker (short category line from the share text)
  if (kicker) {
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `600 32px ${FONT}`;
    ctx.letterSpacing = '3px';
    const kickerLines = wrap(ctx, kicker.toUpperCase(), contentW);
    for (const line of kickerLines.slice(0, 2)) {
      ctx.fillText(line, centered ? CARD_W / 2 : left, y);
      y += 48;
    }
    ctx.letterSpacing = '0px';
    y += 30;
  }

  // Headline
  const headlineSize = style === 'poster' ? 104 : title.length > 42 ? 76 : 88;
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${headlineSize}px ${FONT}`;
  const titleLines = wrap(ctx, title, contentW).slice(0, 5);
  const headlineLead = Math.round(headlineSize * 1.16);
  for (const line of titleLines) {
    ctx.fillText(line, centered ? CARD_W / 2 : left, y);
    y += headlineLead;
  }

  y += 34;
  if (centered) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(CARD_W / 2 - 36, y, 72, 2);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(left, y, 72, 2);
  }
  y += 62;

  // Details
  ctx.fillStyle = 'rgba(255,255,255,0.74)';
  ctx.font = `400 38px ${FONT}`;
  const detailLines: string[] = [];
  for (const raw of details) {
    detailLines.push(...wrap(ctx, raw, contentW));
  }
  for (const line of detailLines.slice(0, 12)) {
    ctx.fillText(line, centered ? CARD_W / 2 : left, y);
    y += 58;
  }

  // Foot: link + call to action
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(url.replace(/^https?:\/\//, ''), centered ? CARD_W / 2 : left, CARD_H - 232);

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = `500 26px ${FONT}`;
  ctx.letterSpacing = '4px';
  ctx.fillText('REPLY ON WHATSAPP', centered ? CARD_W / 2 : left, CARD_H - 168);
  ctx.letterSpacing = '0px';
}

function splitText(text: string, url: string) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== url);
  const kicker = lines.length > 1 ? lines[0] : '';
  const details = lines.length > 1 ? lines.slice(1) : lines;
  return { kicker, details };
}

export default function StatusCardStudio({ open, onClose, title, text, url }: StatusCardStudioProps) {
  const [style, setStyle] = useState<CardStyle>('editorial');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { kicker, details } = useMemo(() => splitText(text, url), [text, url]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawCard(ctx, style, title, kicker, details, url);
  }, [open, style, title, kicker, details, url]);

  if (!open) return null;

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

  const fileName = () =>
    `enqir-status-${(title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`;

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error('no image');
      const file = new File([blob], fileName(), { type: 'image/png' });
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        !!navigator.canShare &&
        navigator.canShare({ files: [file] });
      if (canShareFiles) {
        await navigator.share({ files: [file], text: `${title}\n${url}` });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName();
        link.click();
        URL.revokeObjectURL(link.href);
        toast({ title: 'Image saved', description: 'Attach this image to your WhatsApp Status.' });
      }
    } catch {
      toast({ title: 'Could not share', description: 'Download the image and post it manually.', variant: 'destructive' });
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName();
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status card</p>
            <h3 className="text-sm font-black text-black">Black &amp; white preview</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4 text-black" />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[240px_1fr]">
          <div className="mx-auto w-[240px] overflow-hidden rounded-xl border border-gray-300 bg-black shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
            <canvas ref={canvasRef} width={CARD_W} height={CARD_H} className="block h-auto w-full" />
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      style === s.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-gray-600">
              The card exports at 1080 × 1920 — full-screen WhatsApp Status size, black background, white type.
            </p>

            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-black text-white disabled:opacity-60"
              >
                <Share2 className="h-3.5 w-3.5" />
                {sharing ? 'Preparing…' : 'Share image'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-[11px] font-black text-black"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-[11px] font-black text-gray-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy text'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

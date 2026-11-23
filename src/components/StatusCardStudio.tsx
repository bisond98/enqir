import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CardStyle = 'classic' | 'ticket' | 'blueprint' | 'banner' | 'editorial' | 'poster' | 'framed';

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
  { id: 'classic', label: 'Classic' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'banner', label: 'Banner' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'poster', label: 'Poster' },
  { id: 'framed', label: 'Framed' },
];

const FONT = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'Menlo', 'Consolas', monospace";

/** Shield outline — the Enqir mark used at the top of the status card. */
function shieldPath(ctx: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number) {
  const half = w / 2;
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + half, top + h * 0.2);
  ctx.lineTo(cx + half, top + h * 0.55);
  ctx.quadraticCurveTo(cx + half, top + h * 0.86, cx, top + h);
  ctx.quadraticCurveTo(cx - half, top + h * 0.86, cx - half, top + h * 0.55);
  ctx.lineTo(cx - half, top + h * 0.2);
  ctx.closePath();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Shrink a headline until it fits the given width in at most `maxLines`. */
function fitHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  maxLines: number,
  weight = 800
) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  let lines = wrap(ctx, text, maxWidth);
  while (lines.length > maxLines && size > 48) {
    size -= 6;
    ctx.font = `${weight} ${size}px ${FONT}`;
    lines = wrap(ctx, text, maxWidth);
  }
  return { lines: lines.slice(0, maxLines), size };
}

/** Size a single line down until it fits the given width. */
function fitLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight: number,
  family: string
) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function ctaAndBody(details: string[]) {
  const i = details.findIndex((d) => d.includes('\uD83D\uDC47'));
  const cta = (i >= 0 ? details[i].replace(/\uD83D\uDC47/g, '') : 'Click here to close the deal').trim();
  return { cta, body: details.filter((_, idx) => idx !== i) };
}

/** Cream ticket on black — headline, perfs, dashed rule, black footer. */
function drawTicket(ctx: CanvasRenderingContext2D, title: string, kicker: string, details: string[], url: string) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const m = 64;
  roundRect(ctx, m, m, CARD_W - m * 2, CARD_H - m * 2, 52);
  ctx.fillStyle = '#f4f1ea';
  ctx.fill();

  const inset = m + 72;
  const innerW = CARD_W - inset * 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#111111';
  ctx.font = `600 30px ${MONO}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('ENQIR.IN · STATUS', inset, m + 108);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  shieldPath(ctx, CARD_W - inset - 34, m + 50, 68, 84);
  ctx.stroke();

  const { cta, body } = ctaAndBody(details);
  const head = fitHeadline(ctx, (kicker || title).toUpperCase(), innerW, 92, 4);
  let y = m + 260;
  ctx.fillStyle = '#111111';
  ctx.font = `800 ${head.size}px ${FONT}`;
  for (const line of head.lines) {
    ctx.fillText(line, inset, y);
    y += Math.round(head.size * 1.14);
  }

  y += 34;
  ctx.strokeStyle = '#bbb3a4';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 14]);
  ctx.beginPath();
  ctx.moveTo(inset, y);
  ctx.lineTo(CARD_W - inset, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 92;
  ctx.fillStyle = '#2b2b2b';
  ctx.font = `400 44px ${FONT}`;
  const lines: string[] = [];
  for (const d of body) lines.push(...wrap(ctx, d, innerW));
  const room = Math.max(0, Math.floor((CARD_H - m - 360 - y) / 64) + 1);
  for (const line of lines.slice(0, Math.min(9, room))) {
    ctx.fillText(line, inset, y);
    y += 64;
  }

  // Black footer band with the call to action and the link — it sits under the
  // details, but never past the bottom of the ticket.
  const footerH = 260;
  const footerTop = CARD_H - m - footerH;
  ctx.fillStyle = '#111111';
  roundRect(ctx, m, footerTop, CARD_W - m * 2, footerH, 40);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(cta, inset, footerTop + 96);
  const link = url.replace(/^https?:\/\//, '');
  const linkSize = fitLine(ctx, link, innerW - 24, 34, 500, MONO);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = `500 ${linkSize}px ${MONO}`;
  ctx.fillText(link, inset, footerTop + 186);
}

/** Navy blueprint — grid paper, blue hairline accents, mono labels. */
function drawBlueprint(ctx: CanvasRenderingContext2D, title: string, kicker: string, details: string[], url: string) {
  ctx.fillStyle = '#08101f';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = 'rgba(96,165,250,0.14)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= CARD_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke();
  }
  for (let y = 0; y <= CARD_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke();
  }

  const m = 96;
  const innerW = CARD_W - m * 2;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#60a5fa';
  ctx.font = `600 28px ${MONO}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('ENQIR.IN', m, m + 40);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(147,197,253,0.55)';
  ctx.fillText('STATUS CARD', CARD_W - m, m + 40);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 4;
  shieldPath(ctx, m + 42, m + 96, 84, 104);
  ctx.stroke();

  const { cta, body } = ctaAndBody(details);
  const head = fitHeadline(ctx, (kicker || title).toUpperCase(), innerW, 88, 4);
  let y = m + 320;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${head.size}px ${FONT}`;
  for (const line of head.lines) {
    ctx.fillText(line, m, y);
    y += Math.round(head.size * 1.12);
  }

  y += 40;
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(m, y, 120, 4);
  y += 96;

  ctx.fillStyle = '#a9c8ff';
  ctx.font = `400 42px ${FONT}`;
  const lines: string[] = [];
  for (const d of body) lines.push(...wrap(ctx, d, innerW));
  const room = Math.max(0, Math.floor((CARD_H - 460 - y) / 62) + 1);
  for (const line of lines.slice(0, Math.min(9, room))) {
    ctx.fillText(line, m, y);
    y += 62;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(cta, m, CARD_H - 380);

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.strokeRect(m, CARD_H - 316, innerW, 116);
  const link = url.replace(/^https?:\/\//, '');
  const linkSize = fitLine(ctx, link, innerW - 56, 34, 500, MONO);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${linkSize}px ${MONO}`;
  ctx.fillText(link, m + 28, CARD_H - 316 + 70);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(147,197,253,0.7)';
  ctx.font = `500 30px ${MONO}`;
  ctx.fillText('enqir.in', CARD_W - m, CARD_H - 130);
}

/** Split banner — giant headline up top, blue information band below. */
function drawBanner(ctx: CanvasRenderingContext2D, title: string, kicker: string, details: string[], url: string) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const m = 96;
  const innerW = CARD_W - m * 2;
  const bandTop = CARD_H - 760;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `600 28px ${MONO}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('ENQIR.IN', m, 150);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 20;
  ctx.lineJoin = 'round';
  shieldPath(ctx, CARD_W / 2, 300, 118, 146);
  ctx.stroke();

  const { cta, body } = ctaAndBody(details);
  const head = fitHeadline(ctx, (kicker || title).toUpperCase(), innerW, 104, 5);
  let y = 640;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${head.size}px ${FONT}`;
  for (const line of head.lines) {
    ctx.fillText(line, m, y);
    y += Math.round(head.size * 1.1);
  }

  // Blue information band
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(0, bandTop, CARD_W, 760);

  let dy = bandTop + 130;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `400 42px ${FONT}`;
  const lines: string[] = [];
  for (const d of body) lines.push(...wrap(ctx, d, innerW));
  const room = Math.max(0, Math.floor((bandTop + 400 - dy) / 60) + 1);
  for (const line of lines.slice(0, Math.min(6, room))) {
    ctx.fillText(line, m, dy);
    dy += 60;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(cta, m, bandTop + 500);

  const link = url.replace(/^https?:\/\//, '');
  const linkSize = fitLine(ctx, link, innerW - 240, 32, 500, MONO);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `500 ${linkSize}px ${MONO}`;
  ctx.fillText(link, m, bandTop + 590);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 36px ${MONO}`;
  ctx.fillText('enqir.in', CARD_W - m, bandTop + 690);
}

/**
 * The reference poster: black canvas, shield mark, the need as a centred
 * uppercase headline, the emoji detail lines under it, a closing call to
 * action, the link in a white box and the wordmark in the corner.
 */
function drawClassic(
  ctx: CanvasRenderingContext2D,
  title: string,
  kicker: string,
  details: string[],
  url: string
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Shield mark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 26;
  ctx.lineJoin = 'round';
  shieldPath(ctx, CARD_W / 2, 250, 152, 186);
  ctx.stroke();

  const maxW = CARD_W - 200;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Headline — share text's first line already reads "WANTED: …"
  const headline = (kicker || title || '').toUpperCase();
  let size = 92;
  ctx.font = `800 ${size}px ${FONT}`;
  let lines = wrap(ctx, headline, maxW);
  while (lines.length > 4 && size > 54) {
    size -= 6;
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrap(ctx, headline, maxW);
  }
  let y = 700;
  const lead = Math.round(size * 1.16);
  ctx.fillStyle = '#ffffff';
  for (const line of lines.slice(0, 5)) {
    ctx.fillText(line, CARD_W / 2, y);
    y += lead;
  }

  // Closing call to action travels with the share text; the reference wording
  // is the fallback.
  const ctaIndex = details.findIndex((d) => d.includes('\uD83D\uDC47'));
  const cta = (ctaIndex >= 0 ? details[ctaIndex].replace(/\uD83D\uDC47/g, '') : 'Click here to close the deal').trim();
  const body = details.filter((_, i) => i !== ctaIndex);

  // Detail lines
  y += 74;
  ctx.font = `400 46px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const detailLines: string[] = [];
  for (const raw of body) detailLines.push(...wrap(ctx, raw, maxW));
  // Never let the details run into the call to action and the link box.
  const roomForDetails = Math.max(0, Math.floor((CARD_H - 470 - y) / 72) + 1);
  for (const line of detailLines.slice(0, Math.min(10, roomForDetails))) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 72;
  }

  // Call to action, left aligned above the link box
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 54px ${FONT}`;
  ctx.fillText(cta, 90, CARD_H - 400);

  // Link in a white box
  const boxTop = CARD_H - 330;
  const boxH = 132;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(90, boxTop, CARD_W - 180, boxH);
  const link = url.replace(/^https?:\/\//, '');
  let linkSize = 40;
  ctx.font = `500 ${linkSize}px ${MONO}`;
  while (ctx.measureText(link).width > CARD_W - 260 && linkSize > 22) {
    linkSize -= 2;
    ctx.font = `500 ${linkSize}px ${MONO}`;
  }
  ctx.fillStyle = '#000000';
  ctx.fillText(link, 128, boxTop + boxH / 2 + linkSize * 0.36);

  // Wordmark
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `500 46px ${MONO}`;
  ctx.fillText('enqir.in', CARD_W - 90, CARD_H - 150);
}

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
  if (style === 'classic') {
    drawClassic(ctx, title, kicker, details, url);
    return;
  }
  if (style === 'ticket') {
    drawTicket(ctx, title, kicker, details, url);
    return;
  }
  if (style === 'blueprint') {
    drawBlueprint(ctx, title, kicker, details, url);
    return;
  }
  if (style === 'banner') {
    drawBanner(ctx, title, kicker, details, url);
    return;
  }

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
  const [style, setStyle] = useState<CardStyle>('classic');
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

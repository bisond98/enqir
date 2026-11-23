import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type CardStyle = 'classic' | 'photo' | 'paper' | 'ticket' | 'blueprint' | 'banner' | 'editorial' | 'poster' | 'framed';

interface StatusCardStudioProps {
  open: boolean;
  onClose: () => void;
  /** Listing or enquiry title — the headline of the card. */
  title: string;
  /** Share text; its first line becomes the kicker, the rest the details. */
  text: string;
  /** Link shown at the foot of the card. */
  url: string;
  /** Listing / enquiry photo used by the Photo design. */
  imageUrl?: string;
}

const CARD_W = 1080;
const CARD_H = 1920;
const PAD = 112;

const STYLES: { id: CardStyle; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'photo', label: 'Photo' },
  { id: 'paper', label: 'Paper' },
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

/** A call to action that shrinks, then wraps to two lines — never clipped. */
function drawCta(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  maxWidth: number,
  startSize: number,
  weight: number,
  family: string
) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 30) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  const lines = wrap(ctx, text, maxWidth).slice(0, 2);
  const lead = Math.round(size * 1.18);
  let y = baseline - (lines.length - 1) * lead;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lead;
  }
}

function ctaAndBody(details: string[]) {
  const i = details.findIndex((d) => d.includes('\uD83D\uDC47'));
  const cta = (i >= 0 ? details[i].replace(/\uD83D\uDC47/g, '') : 'Click here to close the deal').trim();
  const body = details
    .filter((_, idx) => idx !== i)
    // Share lines may end in a separator that reads as a stray mark once the
    // line is its own row on the poster.
    .map((line) => line.replace(/\s*[|·]\s*$/, '').trim())
    .filter(Boolean);
  return { cta, body };
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
  drawCta(ctx, cta, inset, footerTop + 96, innerW, 44, 700, FONT);
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
  drawCta(ctx, cta, m, CARD_H - 380, innerW, 46, 700, FONT);

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
  drawCta(ctx, cta, m, bandTop + 500, innerW, 46, 700, FONT);

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

/** Full-bleed photo with a dark scrim, the type stacked over the bottom third. */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  title: string,
  kicker: string,
  details: string[],
  url: string,
  photo: HTMLImageElement | null
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  if (photo && photo.width && photo.height) {
    // Cover-fit: fill the whole card, crop the overflow evenly.
    const scale = Math.max(CARD_W / photo.width, CARD_H / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    ctx.drawImage(photo, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
  }

  // Scrim: light at the top for the wordmark, deep at the bottom for the type.
  const scrim = ctx.createLinearGradient(0, 0, 0, CARD_H);
  scrim.addColorStop(0, 'rgba(0,0,0,0.55)');
  scrim.addColorStop(0.3, 'rgba(0,0,0,0.08)');
  scrim.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const m = 90;
  const innerW = CARD_W - m * 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `600 28px ${MONO}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('ENQIR.IN', m, 124);
  ctx.letterSpacing = '0px';

  const { cta, body } = ctaAndBody(details);
  const boxTop = CARD_H - 340;
  const boxH = 112;
  const ctaBase = boxTop - 70;

  // Details, bottom-up above the call to action.
  ctx.font = `400 40px ${FONT}`;
  const detailLines: string[] = [];
  for (const d of body) detailLines.push(...wrap(ctx, d, innerW));
  const shown = detailLines.slice(0, 4);
  const lead = 54;
  const lastDetailBase = ctaBase - 76;
  const firstDetailBase = lastDetailBase - (shown.length - 1) * lead;
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  shown.forEach((line, i) => ctx.fillText(line, m, firstDetailBase + i * lead));

  // Headline above the details.
  const head = fitHeadline(ctx, (kicker || title).toUpperCase(), innerW, 84, 3);
  const headLead = Math.round(head.size * 1.12);
  const lastHeadBase = firstDetailBase - 70;
  const firstHeadBase = lastHeadBase - (head.lines.length - 1) * headLead;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${head.size}px ${FONT}`;
  head.lines.forEach((line, i) => ctx.fillText(line, m, firstHeadBase + i * headLead));

  // CTA
  ctx.fillStyle = '#ffffff';
  drawCta(ctx, cta, m, ctaBase, innerW, 46, 700, FONT);

  // Link in a white box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(m, boxTop, innerW, boxH);
  const link = url.replace(/^https?:\/\//, '');
  const linkSize = fitLine(ctx, link, innerW - 56, 34, 500, MONO);
  ctx.fillStyle = '#000000';
  ctx.font = `500 ${linkSize}px ${MONO}`;
  ctx.fillText(link, m + 28, boxTop + boxH / 2 + linkSize * 0.36);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 36px ${MONO}`;
  ctx.fillText('enqir.in', CARD_W - m, CARD_H - 110);
}

/** Paper: white card, black type — the light counterpart of Classic. */
function drawPaper(ctx: CanvasRenderingContext2D, title: string, kicker: string, details: string[], url: string) {
  ctx.fillStyle = '#f8f7f4';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = 'rgba(17,24,39,0.10)';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, CARD_W - 88, CARD_H - 88);

  const m = 96;
  const innerW = CARD_W - m * 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#111827';
  ctx.font = `600 28px ${MONO}`;
  ctx.letterSpacing = '8px';
  ctx.fillText('ENQIR.IN', m, 158);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 18;
  ctx.lineJoin = 'round';
  shieldPath(ctx, CARD_W / 2, 300, 112, 138);
  ctx.stroke();

  const { cta, body } = ctaAndBody(details);
  const head = fitHeadline(ctx, (kicker || title).toUpperCase(), innerW, 92, 4);
  const headLead = Math.round(head.size * 1.14);
  let y = 660;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111827';
  ctx.font = `800 ${head.size}px ${FONT}`;
  for (const line of head.lines) {
    ctx.fillText(line, CARD_W / 2, y);
    y += headLead;
  }

  y += 74;
  ctx.font = `400 44px ${FONT}`;
  ctx.fillStyle = '#4b5563';
  const detailLines: string[] = [];
  for (const d of body) detailLines.push(...wrap(ctx, d, innerW));
  const room = Math.max(0, Math.floor((CARD_H - 500 - y) / 66) + 1);
  for (const line of detailLines.slice(0, Math.min(9, room))) {
    ctx.fillText(line, CARD_W / 2, y);
    y += 66;
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  drawCta(ctx, cta, m, CARD_H - 400, innerW, 50, 700, FONT);

  // Black link box with white type
  const boxTop = CARD_H - 330;
  const boxH = 118;
  ctx.fillStyle = '#111827';
  ctx.fillRect(m, boxTop, innerW, boxH);
  const link = url.replace(/^https?:\/\//, '');
  const linkSize = fitLine(ctx, link, innerW - 56, 34, 500, MONO);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${linkSize}px ${MONO}`;
  ctx.fillText(link, m + 28, boxTop + boxH / 2 + linkSize * 0.36);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#111827';
  ctx.font = `500 40px ${MONO}`;
  ctx.fillText('enqir.in', CARD_W - m, CARD_H - 150);
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
  const { cta, body } = ctaAndBody(details);

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
  drawCta(ctx, cta, 90, CARD_H - 400, CARD_W - 180, 54, 700, FONT);

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
  url: string,
  photo: HTMLImageElement | null = null
) {
  if (style === 'photo') {
    drawPhoto(ctx, title, kicker, details, url, photo);
    return;
  }
  if (style === 'paper') {
    drawPaper(ctx, title, kicker, details, url);
    return;
  }
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

const cardFileName = (title: string) =>
  `enqir-status-${(title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`;

function loadCardImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export type StatusCardShareResult = 'shared' | 'saved' | 'cancelled' | 'failed';

/**
 * Renders the status card and hands it to the native share sheet, with a
 * download fallback. Used where the card must be shared without showing the
 * designer popup (i.e. on the live site).
 */
export async function shareStatusCard({
  title,
  text,
  url,
  imageUrl,
  style = 'classic',
}: {
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
  style?: CardStyle;
}): Promise<StatusCardShareResult> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'failed';

    const { kicker, details } = splitText(text, url);
    const photo = style === 'photo' && imageUrl ? await loadCardImage(imageUrl) : null;
    drawCard(ctx, style, title, kicker, details, url, photo);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
      setTimeout(() => resolve(null), 4000);
    });
    if (!blob) return 'failed';

    const file = new File([blob], cardFileName(title), { type: 'image/png' });
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: `${title}\n${url}` });
      return 'shared';
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    return 'saved';
  } catch (err: any) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

export default function StatusCardStudio({ open, onClose, title, text, url, imageUrl }: StatusCardStudioProps) {
  const [style, setStyle] = useState<CardStyle>('classic');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  // The exported PNG is prepared ahead of time so the native share sheet can
  // be opened straight from the tap (a mobile browser drops the user gesture
  // if anything is awaited first).
  const [file, setFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const justOpenedRef = useRef(0);

  const { kicker, details } = useMemo(() => splitText(text, url), [text, url]);
  // The Photo design is only offered when there is a picture to show.
  const styles = useMemo(() => STYLES.filter((s) => s.id !== 'photo' || !!imageUrl), [imageUrl]);

  useEffect(() => {
    if (!imageUrl) {
      setPhoto(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) setPhoto(img);
    };
    img.onerror = () => {
      if (!cancelled) setPhoto(null);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return;
    if (!justOpenedRef.current) justOpenedRef.current = Date.now();
    // The first tap that opened the sheet must not immediately close it.
    const closeGuard = setTimeout(() => {
      justOpenedRef.current = 0;
    }, 400);
    return () => clearTimeout(closeGuard);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawCard(ctx, style, title, kicker, details, url, photo);
    setFile(null);
    const timer = setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const name = `enqir-status-${(title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`;
        setFile(new File([blob], name, { type: 'image/png' }));
      }, 'image/png');
    }, 60);
    return () => clearTimeout(timer);
  }, [open, style, title, kicker, details, url, photo]);

  if (!open) return null;

  const guardedClose = () => {
    if (justOpenedRef.current) return;
    onClose();
  };

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.toBlob) return resolve(null);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
      // Never leave the button spinning if the encoder stalls.
      setTimeout(() => resolve(null), 4000);
    });

  const fileName = () => cardFileName(title);

  const saveImage = async (blob: Blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    toast({ title: 'Image saved', description: 'Attach this image to your WhatsApp Status.' });
  };

  const handleShare = async () => {
    if (sharing) return;
    // Share the already-prepared file straight from the tap. The share sheet is
    // the only way a website can hand an image to WhatsApp Status.
    const ready = file;
    if (ready && typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [ready] })) {
      setSharing(true);
      try {
        await navigator.share({ files: [ready], text: `${title}\n${url}` });
        onClose();
        return;
      } catch (err: any) {
        // Cancelling is not an error; anything else falls through to saving.
        if (err?.name === 'AbortError') {
          setSharing(false);
          return;
        }
      } finally {
        setSharing(false);
      }
    }

    setSharing(true);
    try {
      const blob = ready ? ready : await toBlob();
      if (!blob) throw new Error('no image');
      await saveImage(blob);
    } catch {
      toast({ title: 'Could not share', description: 'Download the image and post it manually.', variant: 'destructive' });
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    const blob = file ?? (await toBlob());
    if (blob) await saveImage(blob);
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
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) guardedClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share to WhatsApp Status"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.22)] sm:max-h-[88vh] sm:max-w-3xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">Share to Status</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">1080 × 1920 — the full-screen size WhatsApp Status uses</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto px-5 pb-5 pt-3 sm:grid-cols-[240px_1fr] sm:items-start">
          <div className="mx-auto w-full max-w-[210px] sm:max-w-none">
            <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-black/10">
              <canvas ref={canvasRef} width={CARD_W} height={CARD_H} className="block h-auto w-full" />
            </div>
            <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-gray-400">Live preview</p>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Design</p>
              <div className="flex flex-wrap gap-1.5">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    aria-pressed={style === s.id}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      style === s.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="hidden text-[11px] leading-relaxed text-gray-500 sm:block">
              Pick a layout, then share. The image saves to your gallery ready for Status, and the link is copied
              alongside it.
            </p>

            <div className="flex flex-col gap-2 sm:mt-auto">
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                <Share2 className="h-4 w-4" />
                {sharing ? 'Preparing image…' : 'Share image'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-[11px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-[11px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

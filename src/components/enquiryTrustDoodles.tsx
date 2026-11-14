// ── The trust doodle field behind the enquiries page's black header ───────────
// A mural of small, hand-drawn marks rather than a few big icons: coins, ticks,
// shields, padlocks, scales, notes, parcels, speech bubbles and sparkles, each
// about 30 units across, scattered in three jittered rows so the black band
// reads as a filled pattern of promises instead of a sparse row of pictures.
// Line weights step 1.8 → 0.7, hatch marks and stipple fill the gaps, and
// nothing lines up mechanically. Everything is currentColor, so the caller sets
// the ink level; the caller positions it absolutely, so the header keeps its
// height.
import type { ReactNode } from "react";

type Motif = (key: string) => ReactNode;

const coin: Motif = (k) => (
  <g key={k}>
    <circle r="15" strokeWidth={1.6} />
    <path d="M-6 -8 H6 M-6 -3 H6 M-2 -8 C4 -8 4 0 -2 0 M-1 0 L5 9" strokeWidth={1.1} />
  </g>
);

const shield: Motif = (k) => (
  <g key={k}>
    <path d="M0 -16 C-9 -13 -15 -11 -15 -3 V4 C-15 13 -7 18 0 22 C7 18 15 13 15 4 V-3 C15 -11 9 -13 0 -16 Z" strokeWidth={1.6} />
    <path d="M-6 1 L-2 6 L7 -6" strokeWidth={1.5} />
  </g>
);

const tick: Motif = (k) => (
  <g key={k}>
    <circle r="14" strokeWidth={1.5} />
    <path d="M-6 0 L-2 5 L7 -6" strokeWidth={1.4} />
  </g>
);

const padlock: Motif = (k) => (
  <g key={k}>
    <path d="M-11 0 H11 A3 3 0 0 1 14 3 V13 A3 3 0 0 1 11 16 H-11 A3 3 0 0 1 -14 13 V3 A3 3 0 0 1 -11 0 Z" strokeWidth={1.5} />
    <path d="M-6 0 V-6 A6 6 0 0 1 6 -6 V0" strokeWidth={1.3} />
    <path d="M0 6 V10" strokeWidth={1.2} />
  </g>
);

const scales: Motif = (k) => (
  <g key={k}>
    <path d="M0 -16 V12" strokeWidth={1.5} />
    <path d="M-10 13 H10" strokeWidth={1.5} />
    <path d="M-17 -11 C-7 -14 7 -14 17 -11" strokeWidth={1.3} />
    <path d="M-17 -11 V-5 M17 -11 V-5" strokeWidth={0.9} />
    <path d="M-23 -5 A6.5 6.5 0 0 0 -11 -5" strokeWidth={1.4} />
    <path d="M11 -5 A6.5 6.5 0 0 0 23 -5" strokeWidth={1.4} />
  </g>
);

const note: Motif = (k) => (
  <g key={k}>
    <path d="M-16 -9 H16 V11 H-16 Z" strokeWidth={1.5} />
    <circle cx="0" cy="1" r="6" strokeWidth={1.1} />
    <path d="M-4 -2 H4 M-4 2 H4 M-1.5 -2 L2.5 4" strokeWidth={0.9} />
    <path d="M-11 -5 V7 M11 -5 V7" strokeWidth={0.7} strokeDasharray="2 3.5" opacity={0.7} />
  </g>
);

const parcel: Motif = (k) => (
  <g key={k}>
    <path d="M-14 -10 H14 V14 H-14 Z" strokeWidth={1.5} />
    <path d="M-14 -1 H14" strokeWidth={1.2} />
    <path d="M0 -10 V14" strokeWidth={1.2} />
    <path d="M-14 -10 L-19 -14 M14 -10 L19 -14 M-14 14 L-19 18" strokeWidth={0.8} opacity={0.7} />
  </g>
);

const bubble: Motif = (k) => (
  <g key={k}>
    <path d="M-16 -9 C-16 -14 -12 -17 -6 -17 H8 C14 -17 18 -14 18 -9 V2 C18 7 14 10 8 10 H1 L-5 17 L-4 10 C-12 10 -16 6 -16 0 Z" strokeWidth={1.5} />
    <path d="M-6 0 L-2 4 L7 -5" strokeWidth={1.3} />
  </g>
);

const hand: Motif = (k) => (
  <g key={k}>
    <path d="M-13 -4 C-13 -10 -8 -13 -2 -13 H6 C12 -13 16 -10 16 -4 V4 C16 10 12 13 6 13 H-3 C-9 13 -13 10 -13 4 Z" strokeWidth={1.4} />
    <path d="M-13 -4 H-19 M-13 4 H-19 M16 -4 H22 M16 4 H22" strokeWidth={1.1} />
    <path d="M-4 -8 V-3 M1 -9 V-3 M6 -8 V-3" strokeWidth={0.9} opacity={0.8} />
  </g>
);

const star: Motif = (k) => (
  <g key={k}>
    <path d="M0 -14 v10 M-5 -9 h10" strokeWidth={1.4} />
    <path d="M0 14 v-6 M-3 11 h6" strokeWidth={0.9} opacity={0.7} />
  </g>
);

const spark: Motif = (k) => (
  <g key={k}>
    <path d="M0 -10 v8 M-4 -6 h8" strokeWidth={1.2} />
    <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" opacity={0.8} />
  </g>
);

const tag: Motif = (k) => (
  <g key={k}>
    <path d="M-12 -8 H4 L14 2 L4 12 H-12 Z" strokeWidth={1.4} />
    <circle cx="0" cy="2" r="2.4" strokeWidth={1.1} />
    <path d="M-7 6 L-10 10" strokeWidth={0.8} opacity={0.6} />
  </g>
);

// The order of the field. Repeating each motif once per row keeps it varied but
// rhythmic — no two neighbours are the same promise.
const sequence: Motif[] = [coin, shield, tick, note, padlock, scales, parcel, bubble, hand, tag, coin, shield, tick, star];

// Three rows, each nudged out of step with the one above, plus a per-cell jitter
// and tilt so the grid never shows.
const field = [
  { y: 18, x0: -8, step: 48, offset: 0, jitter: [0, 5, -3, 7, 2, -5, 4] },
  { y: 70, x0: 14, step: 49, offset: 6, jitter: [5, -2, 3, 0, -5, 4, -3] },
  { y: 122, x0: -6, step: 48, offset: 3, jitter: [-3, 4, 0, -6, 2, -4, 5] },
  { y: 174, x0: 18, step: 50, offset: 9, jitter: [4, -4, 5, -1, 6, 0, -3] },
  { y: 224, x0: -2, step: 49, offset: 1, jitter: [2, 5, -4, 3, -6, 4, -2] },
];

export const EnquiryTrustDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 900 240"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {field.map((row, r) =>
      Array.from({ length: 21 }).map((_, c) => {
        const motif = sequence[(c + row.offset) % sequence.length];
        const size = 0.44 + ((c + r) % 3) * 0.06;
        const x = row.x0 + c * row.step + row.jitter[c % row.jitter.length];
        const y = row.y + (((c + r) % 2 === 0 ? 1 : -1) * ((c % 3) + 1)) * 3;
        const tilt = ((c * 7 + r * 11) % 15) - 7;
        return (
          <g key={`m-${r}-${c}`} transform={`translate(${x} ${y}) rotate(${tilt}) scale(${size})`}>
            {motif(`k-${r}-${c}`)}
          </g>
        );
      }),
    )}

    {/* a couple of sparkles and open rolls threaded through the field */}
    <g opacity={0.7}>
      <g transform="translate(120 100) scale(0.8)">{spark("s1")}</g>
      <g transform="translate(392 78) scale(0.7)">{spark("s2")}</g>
      <g transform="translate(672 200) scale(0.75)">{spark("s3")}</g>
      <g transform="translate(824 62) scale(0.7)">{spark("s4")}</g>
    </g>
  </svg>
);

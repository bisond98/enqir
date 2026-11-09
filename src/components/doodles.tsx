// Shared doodle components for the wizard title steps — drawn in the same
// style as the landing page's minimal professional sketch around the logo:
// thin gray (#6B7280) strokes, small labeled nodes, dashed flow lines.
// Strictly gray-on-white, quiet, professional.

const GRAY = '#374151';
const TEXT = '#111827';

// Buyer doodle — mini flow sketch: You → Need → Seller.
// Used on the Post Enquiry title step.
export const BuyerCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 90" className={className} fill="none" stroke={GRAY} strokeLinecap="round" strokeLinejoin="round">
    {/* Node 1: User */}
    <g transform="translate(24, 34)">
      <circle cx="0" cy="0" r="10" strokeWidth="1.5" fill="white" />
      <circle cx="-3" cy="-2" r="1.3" fill={GRAY} stroke="none" />
      <circle cx="3" cy="-2" r="1.3" fill={GRAY} stroke="none" />
      <path d="M-2 2.5 Q0 3.5 2 2.5" strokeWidth="1.1" />
      <text x="0" y="24" textAnchor="middle" fontSize="8" stroke="none" fill={TEXT} fontWeight="500">You</text>
    </g>
    {/* Node 2: Need bubble */}
    <g transform="translate(100, 30)">
      <ellipse cx="0" cy="0" rx="26" ry="13" strokeWidth="1.5" fill="white" />
      <text x="0" y="3.5" textAnchor="middle" fontSize="9" stroke="none" fill={TEXT} fontWeight="600">Need</text>
    </g>
    {/* Node 3: Sellers */}
    <g transform="translate(172, 34)">
      <circle cx="0" cy="-8" r="7" strokeWidth="1.5" fill="white" />
      <rect x="-6" y="-2" width="12" height="11" rx="2" strokeWidth="1.2" fill="white" />
      <circle cx="-14" cy="14" r="4.5" strokeWidth="1.2" fill="white" />
      <circle cx="0" cy="16" r="4.5" strokeWidth="1.2" fill="white" />
      <circle cx="14" cy="14" r="4.5" strokeWidth="1.2" fill="white" />
      <text x="0" y="34" textAnchor="middle" fontSize="8" stroke="none" fill={TEXT} fontWeight="500">Sellers</text>
    </g>
    {/* Dashed flow lines between nodes */}
    <path d="M38 34 L72 32" strokeWidth="1.4" strokeDasharray="4 4">
      <animate attributeName="stroke-dashoffset" values="8;0" dur="1.6s" repeatCount="indefinite" />
    </path>
    <path d="M128 30 L154 28" strokeWidth="1.4" strokeDasharray="4 4">
      <animate attributeName="stroke-dashoffset" values="8;0" dur="1.6s" repeatCount="indefinite" begin="0.4s" />
    </path>
    {/* Corner accent dots */}
    <circle cx="8" cy="8" r="2" fill={GRAY} stroke="none" opacity="0.4" />
    <circle cx="192" cy="82" r="2" fill={GRAY} stroke="none" opacity="0.4" />
  </svg>
);

// ── The mural ────────────────────────────────────────────────────────────────
// One continuous hand-inked mural, drawn small: a dotted spine runs the height of
// the card and every band hangs off it — garlands of little category drawings
// (phone, tee, car, book, chair, house, bag, tag, camera, bike, mug, dumbbell,
// plant, watch), a sunburst with a magnifier, waves and a sea of swirls. The
// garland lines pass through the drawings, so the whole thing reads as one
// growing drawing rather than a set of separate icons.
const INK = '#5f6875';
const BLUE = '#8e99a6';
const RED = '#a6a2a0';
const GREEN = '#8f9b93';

// Outward spiral drawn as a chain of quarter arcs.
const spiralPath = (cx: number, cy: number, step = 3, turns = 3) => {
  let d = `M${cx} ${cy}`;
  let r = 0;
  let a = 0;
  for (let i = 0; i < turns * 2; i++) {
    r += step;
    a += Math.PI / 2;
    d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d;
};

type BurstProps = { cx: number; cy: number; r: number; len?: number; n?: number; sw?: number };
const Burst = ({ cx, cy, r, len = 8, n = 14, sw = 1.1 }: BurstProps) => (
  <g strokeWidth={sw}>
    {Array.from({ length: n }).map((_, i) => {
      const a = ((i * 360) / n - 90) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1={(cx + Math.cos(a) * r).toFixed(1)}
          y1={(cy + Math.sin(a) * r).toFixed(1)}
          x2={(cx + Math.cos(a) * (r + len)).toFixed(1)}
          y2={(cy + Math.sin(a) * (r + len)).toFixed(1)}
        />
      );
    })}
  </g>
);

type SwirlProps = { cx: number; cy: number; r: number; tone?: 'white' | 'ink' | 'blue' };
const Swirl = ({ cx, cy, r, tone = 'white' }: SwirlProps) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={tone === 'white' ? '#ffffff' : tone === 'ink' ? INK : BLUE} strokeWidth={1.3} />
    <path
      d={spiralPath(cx, cy, Math.max(1.6, r * 0.14), 3)}
      stroke={tone === 'white' ? INK : '#ffffff'}
      strokeWidth={0.9}
    />
  </g>
);

const Drop = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} c-3 5 -5 7 -5 9 a5 5 0 0 0 10 0 c0 -2 -2 -4 -5 -9 z`} strokeWidth={1} />
);

type Kind =
  | 'phone' | 'tee' | 'car' | 'book' | 'chair' | 'house' | 'bag'
  | 'tag' | 'camera' | 'bike' | 'mug' | 'dumbbell' | 'plant' | 'watch';

const Shape = ({ kind }: { kind: Kind }) => {
  switch (kind) {
    case 'phone':
      return (
        <g>
          <rect x="-8" y="-12" width="16" height="24" rx="3" strokeWidth={1.2} />
          <path d="M-4 -9 h8" strokeWidth={0.9} />
          <circle cx="0" cy="8" r="1.2" fill={INK} stroke="none" />
        </g>
      );
    case 'tee':
      return <path d="M-11 -9 h22 l7 7 -7 6 -2 -2 v11 h-18 v-11 l-2 2 -7 -6 z" strokeWidth={1.2} />;
    case 'car':
      return (
        <g>
          <path d="M-12 4 v-4 l5 -7 h16 l6 7 v4 z" strokeWidth={1.2} />
          <circle cx="-7" cy="6" r="3.4" strokeWidth={1.1} />
          <circle cx="8" cy="6" r="3.4" strokeWidth={1.1} />
        </g>
      );
    case 'book':
      return (
        <g>
          <rect x="-12" y="-5" width="24" height="5" rx="1.5" strokeWidth={1.1} />
          <rect x="-10" y="2" width="21" height="5" rx="1.5" strokeWidth={1.1} />
        </g>
      );
    case 'chair':
      return (
        <g>
          <rect x="-10" y="-2" width="20" height="9" rx="3" strokeWidth={1.2} />
          <path d="M-8 -4 v-5 M8 -4 v-5 M-7 7 v4 M6 7 v4" strokeWidth={1} />
        </g>
      );
    case 'house':
      return (
        <g>
          <path d="M-11 8 v-8 l11 -8 11 8 v8 z" strokeWidth={1.2} />
          <path d="M-3 8 v-6 h6 v6" strokeWidth={1} />
        </g>
      );
    case 'bag':
      return (
        <g>
          <path d="M-9 -2 h18 l2 12 h-22 z" strokeWidth={1.2} />
          <path d="M-4 -2 v-4 a4 4 0 0 1 8 0 v4" strokeWidth={1} />
        </g>
      );
    case 'tag':
      return (
        <g>
          <path d="M-11 -6 h13 l9 8 -9 8 h-13 z" strokeWidth={1.2} />
          <circle cx="-8" cy="2" r="1.4" strokeWidth={1} />
        </g>
      );
    case 'camera':
      return (
        <g>
          <rect x="-12" y="-7" width="24" height="16" rx="3" strokeWidth={1.2} />
          <circle cx="0" cy="1" r="5" strokeWidth={1.1} />
          <path d="M-5 -7 l2 -3 h6 l2 3" strokeWidth={1} />
        </g>
      );
    case 'bike':
      return (
        <g>
          <circle cx="-8" cy="4" r="6" strokeWidth={1.1} />
          <circle cx="8" cy="4" r="6" strokeWidth={1.1} />
          <path d="M-8 4 l5 -9 h7 l4 9 M-3 -5 h7" strokeWidth={1.1} />
        </g>
      );
    case 'mug':
      return (
        <g>
          <path d="M-8 -7 h14 v12 a4 4 0 0 1 -4 4 h-6 a4 4 0 0 1 -4 -4 z" strokeWidth={1.2} />
          <path d="M6 -4 a4 4 0 0 1 0 8" strokeWidth={1.1} />
        </g>
      );
    case 'dumbbell':
      return <path d="M-10 -4 v8 M-6 -2 v4 M10 -4 v8 M6 -2 v4 M-6 0 h12" strokeWidth={1.2} />;
    case 'plant':
      return (
        <g>
          <path d="M-6 9 h12 l-2 -8 h-8 z" strokeWidth={1.2} />
          <path d="M0 1 v-6 M0 -5 c-5 0 -7 -4 -7 -7 c5 0 7 3 7 7 M0 -5 c5 0 7 -4 7 -7 c-5 0 -7 3 -7 7" strokeWidth={1.1} />
        </g>
      );
    case 'watch':
      return (
        <g>
          <rect x="-8" y="-6" width="16" height="12" rx="3" strokeWidth={1.2} />
          <path d="M0 -6 v-5 M0 6 v5" strokeWidth={1.5} />
        </g>
      );
    default:
      return null;
  }
};

const Glyph = ({ kind, x, y, rot = 0, s = 1 }: { kind: Kind; x: number; y: number; rot?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <Shape kind={kind} />
  </g>
);

export const MuralDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 420 1000"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke={INK}
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* the spine every band hangs from */}
    <path
      d="M210 24 C 252 140, 168 240, 210 344 C 252 448, 158 548, 210 652 C 252 756, 168 856, 210 976"
      strokeDasharray="2 7"
      strokeWidth={1}
    />

    {/* band 1 — spreads of small drawings */}
    <path d="M-10 100 C 50 78, 100 122, 150 104 C 190 90, 210 74, 246 90 C 290 108, 300 126, 330 104 C 368 82, 400 96, 430 104" strokeWidth={0.9} />
    <Glyph kind="phone" x={66} y={92} rot={-8} />
    <Glyph kind="tee" x={150} y={104} rot={6} />
    <Glyph kind="car" x={246} y={90} rot={0} />
    <Glyph kind="book" x={330} y={104} rot={-5} />
    <Burst cx={196} cy={40} r={6} len={7} n={10} />
    <Drop x={286} y={36} />
    <circle cx="112" cy="46" r="1.6" fill={INK} stroke="none" />

    {/* band 2 */}
    <path d="M-10 232 C 60 206, 120 254, 180 232 C 240 210, 300 258, 430 226" strokeWidth={0.9} />
    <Glyph kind="chair" x={70} y={224} rot={4} />
    <Glyph kind="bag" x={150} y={232} rot={-6} />
    <Glyph kind="camera" x={240} y={218} rot={0} />
    <Glyph kind="mug" x={320} y={232} rot={5} />
    <Drop x={384} y={206} />
    <circle cx="30" cy="196" r="1.4" fill={RED} stroke="none" />

    {/* band 3 — the sunburst with a magnifier */}
    <Burst cx={210} cy={362} r={36} len={14} n={18} sw={1.2} />
    <circle cx="210" cy="362" r="34" fill="#ffffff" strokeWidth={1.5} />
    <circle cx="204" cy="356" r="14" strokeWidth={1.3} />
    <circle cx="204" cy="356" r="5" strokeWidth={0.9} />
    <path d="M214 366 l11 12" strokeWidth={2.2} />
    <Swirl cx={92} cy={352} r={20} />
    <Swirl cx={330} cy={344} r={17} tone="blue" />
    <circle cx="330" cy="424" r="15" fill="#ffffff" strokeWidth={1.2} />
    <text x="330" y="430" textAnchor="middle" fontSize="14" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">₹</text>
    <path d="M104 414 h20" strokeWidth={1} />
    <path d="M119 410 l5 4 -5 4" strokeWidth={1} />

    {/* band 4 */}
    <path d="M-10 484 C 50 458, 110 508, 170 484 C 230 460, 300 510, 430 478" strokeWidth={0.9} />
    <Glyph kind="house" x={64} y={478} rot={0} />
    <Glyph kind="tag" x={146} y={468} rot={-10} />
    <Glyph kind="bike" x={232} y={480} rot={0} />
    <Glyph kind="dumbbell" x={312} y={470} rot={0} />
    <Glyph kind="plant" x={378} y={478} rot={4} />
    <circle cx="196" cy="516" r="1.6" fill={INK} stroke="none" />

    {/* band 5 */}
    <path d="M-10 612 C 60 586, 120 636, 190 612 C 250 590, 320 636, 430 606" strokeWidth={0.9} />
    <Glyph kind="watch" x={78} y={606} rot={-6} />
    <Glyph kind="phone" x={162} y={598} rot={7} />
    <Glyph kind="tee" x={244} y={608} rot={-5} />
    <Glyph kind="bag" x={320} y={600} rot={6} />
    <Glyph kind="camera" x={382} y={606} rot={0} />
    <Drop x={212} y={648} />

    {/* band 6 — waves */}
    <path d="M-10 714 q55 -34 110 0 t110 0 t110 0 t100 0" strokeWidth={1.5} />
    <path d="M-10 760 q55 -30 110 0 t110 0 t110 0 t100 0" strokeWidth={1.2} />
    <Glyph kind="car" x={92} y={736} rot={0} />
    <Glyph kind="book" x={182} y={728} rot={-4} />
    <Glyph kind="chair" x={268} y={738} rot={3} />
    <Glyph kind="mug" x={350} y={730} rot={0} />

  </svg>
);


// ── Header mural for the black "Post Your Enquiry" banner ────────────────────
// Drawn the way a pen artist would fill the band: a handful of confident, larger
// drawings instead of a row of icons — a posted need, the magnifier that finds
// the match, the seller's hang tag, a home, a car, a shirt on its hanger and a
// stack of coins — tied together by one dashed line of travel. Hatching, grain
// dots and sparkles sit between them at a smaller scale, and the weights step
// from 3 down to 1 so the piece reads top-to-bottom. currentColor throughout,
// and the caller positions it absolutely, so the header keeps its height.
const Spark = ({ x, y, s = 1, rot = 0, sw = 1 }: { x: number; y: number; s?: number; rot?: number; sw?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 -7 C1 -3 3 -1 7 0 C3 1 1 3 0 7 C-1 3 -3 1 -7 0 C-3 -1 -1 -3 0 -7" strokeWidth={sw} />
  </g>
);

export const EnquiryHeaderDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 900 240"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* ── the need, posted: a hand-drawn bubble with three written lines */}
    <g transform="translate(120 108) rotate(-6) scale(0.8)">
      <path
        d="M-44 -18 C-38 -26 -20 -30 2 -30 C24 -30 40 -24 42 -12 C44 0 34 10 16 12 C2 14 -10 13 -20 12 C-28 17 -34 22 -42 24 C-40 18 -38 12 -38 8 C-44 2 -46 -4 -46 -10 C-46 -14 -45 -16 -44 -18 Z"
        strokeWidth={1.9}
      />
      <path d="M-30 -14 C-16 -17 0 -17 14 -15" strokeWidth={1.2} />
      <path d="M-28 -6 C-14 -9 2 -9 16 -7" strokeWidth={1.2} />
      <path d="M-26 2 C-18 0 -10 0 -2 1" strokeWidth={1.2} />
      <circle cx="24" cy="4" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="31" cy="4" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="38" cy="4" r="1.7" fill="currentColor" stroke="none" />
    </g>

    {/* the magnifier now sits beside the title itself, not in the mural */}

    {/* the match, travelling from the need to the seller */}
    <path d="M236 126 C246 121 254 117 262 113" strokeWidth={1.1} strokeDasharray="3 6" opacity="0.85" />
    <path d="M256 108 L266 112 L258 119" strokeWidth={1.2} />

    {/* ── the seller's hang tag, tied off the top edge */}
    <path d="M300 6 C298 26 300 48 304 66" strokeWidth={1} strokeDasharray="2 5" opacity="0.85" />
    <g transform="translate(302 98) rotate(-14) scale(0.8)">
      <path d="M-30 -17 H8 L28 0 L8 17 H-30 Z" strokeWidth={1.9} />
      <path d="M-30 -17 V17" strokeWidth={1.9} />
      <circle cx="-22" cy="0" r="2.5" strokeWidth={1.3} />
      <text
        x="4"
        y="7"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif"
      >
        ₹
      </text>
    </g>

    {/* ── a home on the market, chimney smoking */}
    <g transform="translate(518 190) rotate(-2) scale(0.8)">
      <path d="M-34 10 V-10 L0 -32 L34 -10 V10" strokeWidth={1.9} />
      <path d="M-37 10 H37" strokeWidth={1.6} />
      <path d="M17 -17 V-27 H26 V-12" strokeWidth={1.4} />
      <path d="M21.5 -31 C17 -35 24 -37 20 -42" strokeWidth={1} opacity="0.8" />
      <path d="M-10 10 V-5 H4 V10" strokeWidth={1.4} />
      <path d="M-3 10 V-5" strokeWidth={1} opacity="0.6" />
      <path d="M-22 -2 H-14 M-22 4 H-16" strokeWidth={1} opacity="0.7" />
    </g>

    {/* ── the coins that close the deal */}
    <g transform="translate(626 196) rotate(-3) scale(0.8)">
      <path d="M-20 2 C-20 -2 -11 -5 0 -5 C11 -5 20 -2 20 2 V12 C20 16 11 19 0 19 C-11 19 -20 16 -20 12 Z" strokeWidth={1.7} />
      <ellipse cx="0" cy="2" rx="20" ry="6" strokeWidth={1.4} />
      <ellipse cx="0" cy="-8" rx="20" ry="6" strokeWidth={1.3} opacity="0.9" />
      <path d="M-6 -10 C-2 -11 3 -11 7 -10" strokeWidth={1} opacity="0.7" />
    </g>

    {/* ── what the seller puts up: a shirt on its hanger, and the car */}
    <g transform="translate(700 74) rotate(7) scale(0.8)">
      <path d="M-6 -30 C-2 -34 7 -34 11 -30 C13 -28 11 -25 7 -24" strokeWidth={1.1} />
      <path d="M7 -24 L1 -18" strokeWidth={1.1} />
      <path
        d="M-32 -6 C-22 -14 -10 -18 0 -18 C10 -18 22 -14 32 -6 C28 -2 24 1 19 3 C15 1 12 -2 9 -4 V16 C9 19 7 20 4 20 H-4 C-7 20 -9 19 -9 16 V-4 C-12 -2 -15 1 -19 3 C-24 1 -28 -2 -32 -6 Z"
        strokeWidth={1.9}
      />
      <path d="M-13 -12 C-6 -16 0 -17 6 -16" strokeWidth={1} opacity="0.7" />
    </g>
    <g transform="translate(778 178) rotate(-2) scale(0.8)">
      <path d="M-46 8 C-46 2 -40 -3 -32 -4 C-24 -18 -12 -24 2 -23 C14 -22 22 -16 28 -6 C36 -5 42 0 42 8" strokeWidth={1.9} />
      <path d="M-46 8 H42" strokeWidth={1.7} />
      <path d="M-16 -4 C-10 -14 -2 -18 8 -17 C16 -16 22 -12 26 -5" strokeWidth={1.2} />
      <circle cx="-26" cy="9" r="8" strokeWidth={1.8} />
      <circle cx="26" cy="9" r="8" strokeWidth={1.8} />
      <circle cx="-26" cy="9" r="2.4" strokeWidth={1.1} />
      <circle cx="26" cy="9" r="2.4" strokeWidth={1.1} />
      <path d="M-11 2 H6" strokeWidth={1} opacity="0.7" />
    </g>

    {/* ── a small trade in the corner, so the far left is not bare */}
    <g transform="translate(56 196) rotate(-7) scale(0.8)">
      <path d="M-14 -12 H6 L16 0 L6 12 H-14 Z" strokeWidth={1.6} />
      <circle cx="-8" cy="0" r="2" strokeWidth={1.1} />
      <path d="M-4 -2 C0 -4 4 -4 8 -2 M-4 3 C0 1 4 1 8 3" strokeWidth={1} opacity="0.8" />
    </g>

    {/* ── filling the rest of the band: a phone, a parcel, a coin, a plane */}
    <g transform="translate(44 84) rotate(-8) scale(0.8)">
      <path d="M-9 -16 c3 -1 8 -1 11 0 c2 1 2 3 2 5 v18 c0 3 -1 4 -3 5 c-4 1 -8 1 -11 0 c-2 -1 -3 -2 -3 -5 v-18 c0 -2 1 -4 3 -5 z" strokeWidth={1.5} />
      <path d="M-4 -12 H4" strokeWidth={1.1} />
      <circle cx="0" cy="9" r="1.4" strokeWidth={1} />
    </g>
    <g transform="translate(444 208) rotate(-4) scale(0.8)">
      <path d="M-22 -10 H22 V12 H-22 Z" strokeWidth={1.7} />
      <path d="M-22 -10 L-15 -17 H29 L22 -10" strokeWidth={1.4} />
      <path d="M22 -10 L29 -17 V5 L22 12" strokeWidth={1.4} />
      <path d="M-6 -14 V12" strokeWidth={1.1} opacity="0.75" />
      <path d="M-14 2 H-4" strokeWidth={1} opacity="0.7" />
    </g>
    <g transform="translate(566 206) rotate(6) scale(0.8)">
      <path d="M0 -18 C10 -18 18 -11 18 0 C18 11 10 18 0 18 C-10 18 -18 11 -18 0 C-18 -11 -10 -18 0 -18 Z" strokeWidth={1.7} />
      <path d="M-6 -6 C-2 -8 2 -8 6 -6 M-6 0 H6 M-2 -8 V8" strokeWidth={1.2} opacity="0.9" />
    </g>
    <g opacity="0.85">
      <path d="M330 52 C356 34 380 30 404 34" strokeWidth={1} strokeDasharray="3 6" />
      <path d="M404 34 L426 24 L418 44 L410 38 Z" strokeWidth={1.6} />
      <path d="M410 38 L426 24" strokeWidth={1.1} opacity="0.7" />
    </g>

    {/* ── what people leave behind: a plant, a pair of glasses */}
    <g transform="translate(276 190) rotate(5) scale(0.8)">
      <path d="M-9 10 H9 L7 0 H-7 Z" strokeWidth={1.4} />
      <path d="M0 0 V-8 M0 -6 C-6 -6 -8 -11 -8 -14 C-2 -14 0 -10 0 -6 M0 -6 C6 -6 8 -11 8 -14 C2 -14 0 -10 0 -6" strokeWidth={1.2} />
    </g>
    <g transform="translate(170 178) rotate(-6) scale(0.8)">
      <circle cx="-11" cy="0" r="7" strokeWidth={1.5} />
      <circle cx="11" cy="0" r="7" strokeWidth={1.5} />
      <path d="M-4 0 C-2 -2 2 -2 4 0 M-18 0 H-24 M18 0 H24" strokeWidth={1.2} />
    </g>

    {/* ── the street the marketplace lives on, and birds going home */}
    <path d="M-10 226 C 70 214 130 232 210 222 C 290 212 350 230 430 220 C 510 210 570 228 650 218 C 730 208 790 226 870 216 C 890 213 900 214 910 214" strokeWidth={1.2} opacity="0.6" />
    <path d="M624 44 C630 38 636 38 641 44 M648 36 C653 31 658 31 662 37 M612 32 C616 28 620 28 623 32" strokeWidth={1.2} opacity="0.85" />
    <g transform="translate(872 128) rotate(1) scale(0.8)">
      <path d="M0 52 V-26" strokeWidth={2} />
      <path d="M-11 52 H11" strokeWidth={1.8} />
      <path d="M0 -26 C0 -36 14 -36 14 -26" strokeWidth={1.5} />
      <path d="M7 -26 H21 V-14 H7 Z" strokeWidth={1.5} />
      <path d="M4 -12 H24" strokeWidth={1.2} />
    </g>
    <g transform="translate(806 104) rotate(-6) scale(0.8)">
      <path d="M-7 9 H7 L5 0 H-5 Z" strokeWidth={1.3} />
      <path d="M0 0 V-7 M0 -5 C-5 -5 -7 -9 -7 -12 C-1 -12 0 -8 0 -5 M0 -5 C5 -5 7 -9 7 -12 C1 -12 0 -8 0 -5" strokeWidth={1.1} />
    </g>

    {/* ── the middle column, filled: on a phone the band only shows the centre
        of this drawing, so the space above the title and below the subtitle is
        packed with the categories people actually trade here */}
    <g opacity="0.9">
      <Glyph kind="phone" x={322} y={22} rot={-8} s={0.48} />
      <Glyph kind="tag" x={368} y={34} rot={10} s={0.44} />
      <Glyph kind="book" x={414} y={18} rot={-4} s={0.48} />
      <Glyph kind="watch" x={462} y={36} rot={8} s={0.44} />
      <Glyph kind="camera" x={512} y={20} rot={-6} s={0.48} />
      <Glyph kind="bag" x={556} y={34} rot={6} s={0.44} />
      <Glyph kind="dumbbell" x={594} y={16} rot={-10} s={0.40} />

      <Glyph kind="mug" x={314} y={196} rot={-6} s={0.48} />
      <Glyph kind="plant" x={358} y={216} rot={6} s={0.44} />
      <Glyph kind="chair" x={404} y={188} rot={-4} s={0.48} />
      <Glyph kind="tag" x={500} y={192} rot={-8} s={0.44} />
      <Glyph kind="bike" x={546} y={216} rot={0} s={0.48} />
      <Glyph kind="car" x={592} y={190} rot={4} s={0.44} />
    </g>

    {/* and the outer columns, so the wider screens fill too */}
    <g opacity="0.85">
      <Glyph kind="tee" x={242} y={58} rot={-6} s={0.44} />
      <Glyph kind="bag" x={108} y={52} rot={8} s={0.40} />
      <Glyph kind="house" x={246} y={132} rot={-3} s={0.44} />
      <Glyph kind="chair" x={700} y={132} rot={5} s={0.44} />
      <Glyph kind="camera" x={770} y={118} rot={-7} s={0.40} />
      <Glyph kind="watch" x={858} y={178} rot={4} s={0.44} />
      <Glyph kind="dumbbell" x={654} y={214} rot={0} s={0.40} />
      <Glyph kind="phone" x={126} y={196} rot={-5} s={0.40} />
    </g>

    {/* ── ink texture: hatching, grain and the artist's sparkles */}
    <g opacity="0.6" strokeWidth={1}>
      <path d="M448 202 l7 -9 M460 204 l7 -9 M472 206 l7 -9" />
      <path d="M812 202 l7 -9 M824 204 l7 -9" />
      <path d="M300 140 l6 -8 M312 142 l6 -8" />
      <path d="M660 44 l6 -8 M671 46 l6 -8" />
      <path d="M232 210 l6 -8 M244 212 l6 -8" />
      <path d="M636 210 l6 -8 M648 212 l6 -8" />
      <path d="M700 30 l6 -8 M712 32 l6 -8" />
      <path d="M150 106 C166 100 180 100 194 104" />
      <path d="M352 150 C368 144 382 146 394 150" />
      <path d="M84 60 C104 48 128 46 148 52" />
      <path d="M846 116 C862 108 876 108 890 112" />
    </g>
    <Spark x={58} y={42} s={1.08} rot={-8} />
    <Spark x={862} y={52} s={0.96} rot={6} />
    <Spark x={252} y={166} s={0.56} rot={10} sw={0.9} />
    <Spark x={470} y={46} s={0.64} rot={-4} sw={0.9} />
    <Spark x={822} y={214} s={0.48} rot={12} sw={0.8} />
    <Spark x={330} y={212} s={0.60} rot={-8} sw={0.85} />
    <Spark x={700} y={22} s={0.68} rot={6} sw={0.9} />
    <Spark x={186} y={44} s={0.72} rot={-4} sw={0.9} />
    <Spark x={640} y={196} s={0.52} rot={10} sw={0.8} />
    <Spark x={508} y={140} s={0.44} rot={14} sw={0.75} />
    <circle cx="24" cy="112" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="186" cy="34" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="322" cy="196" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="418" cy="30" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="452" cy="150" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="596" cy="60" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="672" cy="140" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="884" cy="86" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="118" cy="140" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="500" cy="26" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="740" cy="96" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="296" cy="36" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="676" cy="196" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="404" cy="172" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="714" cy="210" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="846" cy="160" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="30" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="76" cy="236" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="160" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="232" cy="232" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="288" cy="58" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="340" cy="146" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="388" cy="54" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="430" cy="146" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="470" cy="94" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="524" cy="58" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="568" cy="146" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="612" cy="92" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="700" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="782" cy="232" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="872" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

// ── The mobile sketch under the post-enquiry card ───────────────────────────
// Drawn the way a page in a working sketchbook is drawn: one ink line, a
// slightly unsteady hand, then two coloured pencils worked into the shadows —
// terracotta in the enquiry, indigo in the phone, sage in the shield. No
// caption and no colour fields; the paper is left as paper.
export const DealFlowSketch = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 -8 360 94"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.55}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >

    <g>
      {/* the line the whole scene stands on */}
      <path d="M6 66 C 80 62 150 67 210 64 C 264 62 310 66 354 63" strokeWidth={1.2} opacity={0.6} />

      {/* the enquiry, written out, with a terracotta pencil in the shadow side */}
      <g transform="translate(50 40) rotate(-3)">
        <path
          d="M-25 -16 C-11 -19 9 -19 24 -16 C27 -8 27 4 24 12 C11 16 -7 16 -18 14 C-23 16 -26 19 -30 20 C-26 15 -25 11 -25 8 C-27 1 -27 -9 -25 -16 Z"
          strokeWidth={1.9}
        />
        <path d="M-16 -8 C-6 -10 6 -10 15 -8" strokeWidth={1.05} />
        <path d="M-14 -1 C-5 -3 5 -3 11 -2" strokeWidth={1} />
        <g stroke="#b5563a" strokeWidth={0.6} opacity={0.55}>
          <path d="M-19 6 L-13 13" />
          <path d="M-15 5 L-9 12" />
          <path d="M-11 5 L-5 12" />
          <path d="M-7 6 L-1 13" />
          <path d="M-18 12 L-12 5" />
          <path d="M-13 13 L-7 6" />
        </g>
        <circle cx="16" cy="6" r="2.1" fill="#b5563a" stroke="none" opacity={0.75} />
      </g>
      <g transform="translate(80 16) rotate(28)">
        <path d="M-2 -11 L3 -11 L3 5 L0.5 11 L-2 5 Z" strokeWidth={1.3} />
      </g>

      <path d="M88 44 C96 41 104 41 112 42" strokeWidth={1.2} strokeDasharray="5 5.5" />
      <path d="M108 37 L116 42 L107 47" strokeWidth={1.2} />

      {/* the phone it lands on, indigo pencil down the shaded side */}
      <g transform="translate(160 38) rotate(2)">
        <path d="M-16 -27 C-9 -29 9 -29 16 -27 C18 -18 18 18 16 27 C9 29 -9 29 -16 27 C-18 18 -18 -18 -16 -27 Z" strokeWidth={1.9} />
        <path d="M-7 22 H7" strokeWidth={1.2} />
        <path d="M-10 -15 H1 C3 -9 3 -6 1 -2 H-6 C-8 0 -9 1 -11 2 C-10 0 -10 -1 -10 -3 C-11 -7 -11 -11 -10 -15 Z" strokeWidth={1} />
        <path d="M-10 4 H5 C7 9 7 12 5 15 H-4 C-6 16 -8 18 -10 19 C-9 17 -9 15 -9 13 C-10 10 -10 7 -10 4 Z" strokeWidth={1} />
        <g stroke="#3b4a7a" strokeWidth={0.6} opacity={0.5} fill="none">
          <path d="M-14 -20 L-8 -13" />
          <path d="M-14 -12 L-8 -5" />
          <path d="M-14 6 L-8 13" />
          <path d="M-14 14 L-8 21" />
          <path d="M7 -20 L13 -13" />
          <path d="M7 8 L13 15" />
        </g>
      </g>

      {/* the share, drawn once and slightly wrong, the way a hand does it */}
      <path d="M180 25 C 191 16 204 11 215 7" strokeWidth={1.2} strokeDasharray="3 5.5" />
      <path d="M180 37 C 196 35 209 35 222 36" strokeWidth={1.2} strokeDasharray="3 6" />
      <path d="M180 49 C 192 54 203 59 215 65" strokeWidth={1.2} strokeDasharray="3 5" />
      <g transform="translate(225 4)">
        <path d="M-8 -6 H6 C8 -1 8 2 6 6 H-3 L-8 9 V6 H-9 C-10 1 -10 -2 -8 -6 Z" strokeWidth={1.25} />
      </g>
      <g transform="translate(232 36)">
        <path d="M-8 -4 L8 0 L-8 4 L-5 0 Z" strokeWidth={1.25} />
      </g>
      <g transform="translate(225 68) rotate(-2)">
        <path d="M-8 -4 H8 V5 H-8 Z" strokeWidth={1.25} />
        <circle cx="0" cy="0.5" r="2.2" strokeWidth={1} />
      </g>

      <path d="M246 44 C 258 42 270 41 280 41" strokeWidth={1.2} strokeDasharray="5 5" />
      <path d="M275 36 L283 41 L275 47" strokeWidth={1.2} />

      {/* the deal, closed and safe — sage pencil under the tick */}
      <g transform="translate(316 36) rotate(2)">
        <path d="M0 -23 C7 -20 13 -18 17 -17 C17 -2 11 10 0 16 C-11 10 -17 -2 -17 -17 C-13 -18 -7 -20 0 -23 Z" strokeWidth={1.9} />
        <g stroke="#5f8a6a" strokeWidth={0.7} opacity={0.55}>
          <path d="M-7 7 L-2 13" />
          <path d="M-3 7 L2 13" />
          <path d="M1 6 L6 12" />
          <path d="M-9 12 L-4 6" />
          <path d="M-5 13 L0 7" />
        </g>
        <path d="M-8 -2 C-5 1 -3 4 -1 7 C3 1 7 -4 11 -8" stroke="#4f7d5c" strokeWidth={2} />
      </g>

      {/* two pencils in the margins, and a fleck of each */}
      <g transform="translate(20 16) rotate(-7)" stroke="#bf8a2e" strokeWidth={0.85}>
        <path d="M0 -6 C1 -3 2 -1 6 0 C2 1 1 3 0 6 C-1 3 -2 1 -6 0 C-2 -1 -1 -3 0 -6" />
      </g>
      <g transform="translate(345 30) rotate(9)" stroke="#b5563a" strokeWidth={0.8} opacity={0.85}>
        <path d="M0 -5 C1 -2.5 2 -1 5 0 C2 1 1 2.5 0 5 C-1 2.5 -2 1 -5 0 C-2 -1 -1 -2.5 0 -5" />
      </g>
      <circle cx="120" cy="18" r="1.4" fill="#3b4a7a" stroke="none" opacity={0.55} />
      <circle cx="252" cy="72" r="1.3" fill="#b5563a" stroke="none" opacity={0.5} />
    </g>
  </svg>
);

// ── The mobile sketch under the sell form's card ────────────────────────────
// Same scene as before, now blocked in with flat colour: terracotta for the
// priced item, indigo for the phone, ochre for the buyer, sage for the closed
// deal. One ink outline holds each solid shape.
export const SellListingSketch = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 -8 360 94"
    className={className}
    fill="none"
    stroke="#0f172a"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <g>
      {/* the line the whole scene stands on */}
      <path d="M6 66 C 80 62 150 67 210 64 C 264 62 310 66 354 63" strokeWidth={1.5} />

      {/* the thing being sold, priced by hand — solid terracotta */}
      <g transform="translate(50 38) rotate(-2)">
        <path d="M-26 -14 C-9 -17 12 -17 26 -14 C28 -4 28 9 26 17 C9 20 -12 20 -26 17 C-28 9 -28 -4 -26 -14 Z" fill="#b5563a" strokeWidth={1.9} />
        <path d="M-26 -14 C-12 -5 12 -5 26 -14" strokeWidth={1.3} />
        <g transform="translate(-13 1)" stroke="#ffffff" strokeWidth={1.6}>
          <path d="M-6 -7 H6" />
          <path d="M-6 -3 H6" />
          <path d="M1 -7 C5 -4 4 0 0 0" />
          <path d="M-6 0 H3" />
          <path d="M1 0 L6 8" />
        </g>
      </g>

      <path d="M84 43 H112" strokeWidth={1.6} />
      <path d="M104 36 L114 43 L104 50" strokeWidth={1.6} />

      {/* the phone it goes out on — solid indigo, a listing lit on the screen */}
      <g transform="translate(160 38) rotate(2)">
        <path d="M-16 -27 C-9 -29 9 -29 16 -27 C18 -18 18 18 16 27 C9 29 -9 29 -16 27 C-18 18 -18 -18 -16 -27 Z" fill="#3b4a7a" strokeWidth={1.9} />
        <path d="M-11 -19 H9 V-3 H-11 Z" fill="#ffffff" strokeWidth={1.3} />
        <path d="M-8 -8 L-4 -12 L0 -7 L4 -10 L7 -6" strokeWidth={1.1} />
        <path d="M-10 2 H7" stroke="#ffffff" strokeWidth={1.5} />
        <path d="M-10 8 H0" stroke="#ffffff" strokeWidth={1.5} />
        <path d="M-7 22 H7" stroke="#ffffff" strokeWidth={1.4} />
      </g>

      {/* the share, out to the buyers */}
      <path d="M178 25 C 190 16 203 11 214 8" strokeWidth={1.5} />
      <path d="M180 38 C 196 36 209 36 221 37" strokeWidth={1.5} />
      <path d="M180 50 C 192 55 203 60 214 65" strokeWidth={1.5} />

      <g transform="translate(226 4)">
        <path d="M-8 -6 H6 C8 -1 8 2 6 6 H-3 L-8 9 V6 H-9 C-10 1 -10 -2 -8 -6 Z" fill="#bf8a2e" strokeWidth={1.3} />
      </g>
      <g transform="translate(233 38)">
        <path d="M-8 -4 L8 0 L-8 4 L-5 0 Z" fill="#ffffff" strokeWidth={1.3} />
      </g>
      <g transform="translate(226 68) rotate(-2)">
        <path d="M-8 -4 H8 V5 H-8 Z" fill="#b5563a" strokeWidth={1.3} />
        <circle cx="0" cy="0.5" r="2.2" fill="#ffffff" strokeWidth={1} />
      </g>

      <path d="M248 44 C 258 42 270 41 280 41" strokeWidth={1.5} />
      <path d="M274 35 L283 41 L274 47" strokeWidth={1.5} />

      {/* the deal, closed — solid sage under a white tick */}
      <g transform="translate(316 36) rotate(2)">
        <path d="M0 -23 C7 -20 13 -18 17 -17 C17 -2 11 10 0 16 C-11 10 -17 -2 -17 -17 C-13 -18 -7 -20 0 -23 Z" fill="#5f8a6a" strokeWidth={1.9} />
        <path d="M-8 -2 C-5 1 -3 4 -1 7 C3 1 7 -4 11 -8" stroke="#ffffff" strokeWidth={2.4} />
      </g>

      {/* two pencils in the margins, and a fleck of colour */}
      <g transform="translate(20 16) rotate(-7)">
        <path d="M0 -6 C1 -3 2 -1 6 0 C2 1 1 3 0 6 C-1 3 -2 1 -6 0 C-2 -1 -1 -3 0 -6" fill="#bf8a2e" strokeWidth={1} />
      </g>
      <g transform="translate(345 30) rotate(9)">
        <path d="M0 -5 C1 -2.5 2 -1 5 0 C2 1 1 2.5 0 5 C-1 2.5 -2 1 -5 0 C-2 -1 -1 -2.5 0 -5" fill="#b5563a" strokeWidth={1} />
      </g>
      <circle cx="120" cy="18" r="1.6" fill="#3b4a7a" stroke="none" />
      <circle cx="252" cy="74" r="1.5" fill="#bf8a2e" stroke="none" />
    </g>
  </svg>
);

// ── The magnifier that sits beside the "Post Your Enquiry" title ─────────────
// Same pen as the mural, not a UI glyph: a slightly off-true lens, one glint and
// a thick handle, drawn in currentColor so it can sit on the black header.
export const MagnifierDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11.6 2.4 C15 2.4 17.6 5.1 17.6 8.4 C17.6 11.7 15 14.4 11.6 14.4 C8.2 14.4 5.6 11.7 5.6 8.4 C5.6 5.1 8.2 2.4 11.6 2.4 Z" />
    <path d="M8.7 6.1 C9.3 5.1 10.3 4.4 11.4 4.3" strokeWidth={0.7} opacity={0.75} />
    <path d="M15.4 12.2 L20 16.8" strokeWidth={1.6} />
  </svg>
);

// ── Writing doodle for the description tab ───────────────────────────────────
// Same thin, connected mural language, drawn around words: manuscript ribbons
// run through the page, carrying a written sheet, a pencil, speech bubbles, a
// checklist, a marker bar and a handwriting squiggle, a ring-bound notebook, a
// ruler, a sticky note, a quill, paragraph blocks and a signature line.
export const DescriptionDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 420 1000"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke={INK}
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* spine */}
    <path
      d="M210 24 C 252 140, 168 240, 210 344 C 252 448, 158 548, 210 652 C 252 756, 168 856, 210 976"
      strokeDasharray="2 7"
      strokeWidth={1}
    />

    {/* manuscript ribbons */}
    <path d="M-10 152 C 70 112, 140 202, 210 162 C 280 122, 340 212, 430 172" strokeWidth={0.9} />
    <path d="M-10 560 C 80 520, 150 612, 230 572 C 300 536, 360 616, 430 580" strokeWidth={0.9} />
    <path d="M-10 878 C 90 844, 160 920, 240 886 C 310 856, 370 916, 430 890" strokeWidth={0.9} />

    {/* a written sheet with a folded corner */}
    <g transform="rotate(-6 126 126)">
      <path
        d="M84 76 h66 l20 20 v78 a6 6 0 0 1 -6 6 h-80 a6 6 0 0 1 -6 -6 v-92 a6 6 0 0 1 6 -6 z"
        strokeWidth={1.4}
      />
      <path d="M150 76 v20 h20" strokeWidth={1.1} />
      <path d="M96 112 h58 M96 126 h44 M96 140 h58 M96 154 h34" strokeWidth={1} />
    </g>

    {/* pencil */}
    <g transform="translate(292 118) rotate(-24)">
      <path d="M-34 -7 h48 l14 7 -14 7 h-48 z" strokeWidth={1.4} />
      <path d="M14 -7 v14" strokeWidth={1.1} />
      <path d="M-34 -4 l-10 4 10 4" strokeWidth={1.1} />
      <path d="M-14 -7 v14" strokeWidth={0.9} />
    </g>
    <text x="332" y="212" textAnchor="middle" fontSize="24" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">Aa</text>

    {/* speech bubbles with text */}
    <path
      d="M64 236 h96 a10 10 0 0 1 10 10 v34 a10 10 0 0 1 -10 10 h-56 l-16 14 v-14 h-24 a10 10 0 0 1 -10 -10 v-34 a10 10 0 0 1 10 -10 z"
      fill="#ffffff"
      strokeWidth={1.4}
    />
    <path d="M78 254 h68 M78 266 h52 M78 278 h60" strokeWidth={1} />
    <path
      d="M258 250 h62 a9 9 0 0 1 9 9 v26 a9 9 0 0 1 -9 9 h-34 l-13 11 v-11 h-15 a9 9 0 0 1 -9 -9 v-26 a9 9 0 0 1 9 -9 z"
      fill="#ffffff"
      strokeWidth={1.3}
    />
    <text x="294" y="276" textAnchor="middle" fontSize="16" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">…</text>

    {/* checklist */}
    <rect x="52" y="318" width="15" height="15" rx="3" strokeWidth={1.2} />
    <path d="M55 325 l4 5 8 -10" stroke={GREEN} strokeWidth={1.8} />
    <path d="M76 326 h72 M76 338 h56" strokeWidth={1} />
    <rect x="52" y="352" width="15" height="15" rx="3" strokeWidth={1.2} />
    <path d="M76 360 h62" strokeWidth={1} />

    {/* marker bar + handwriting squiggle */}
    <path d="M46 396 h106 a8 8 0 0 1 0 16 h-106 a8 8 0 0 1 0 -16 z" strokeWidth={1.2} />
    <path d="M60 442 q10 -12 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" strokeWidth={1.1} />

    {/* ring-bound notebook */}
    <g transform="rotate(6 306 546)">
      <rect x="272" y="504" width="68" height="84" rx="6" fill="#ffffff" strokeWidth={1.4} />
      <path d="M282 512 h-8 M282 528 h-8 M282 544 h-8 M282 560 h-8" strokeWidth={1.2} />
      <path d="M290 524 h38 M290 538 h30 M290 552 h36 M290 566 h22" strokeWidth={1} />
    </g>

    {/* ruler */}
    <g transform="rotate(-8 112 574)">
      <rect x="66" y="566" width="94" height="16" rx="3" strokeWidth={1.3} />
      <path d="M80 566 v6 M94 566 v9 M108 566 v6 M122 566 v9 M136 566 v6" strokeWidth={0.9} />
    </g>

    {/* sticky note */}
    <g transform="rotate(-7 344 706)">
      <path
        d="M312 676 h56 l16 16 v38 a5 5 0 0 1 -5 5 h-67 a5 5 0 0 1 -5 -5 v-49 a5 5 0 0 1 5 -5 z"
        strokeWidth={1.3}
      />
      <path d="M368 676 v16 h16" strokeWidth={1} />
      <path d="M320 700 h40 M320 712 h28" strokeWidth={1} />
    </g>

    {/* quill */}
    <g transform="translate(150 706) rotate(-34)">
      <path d="M0 0 c18 -6 38 -2 52 10 c-16 12 -36 16 -52 10 z" strokeWidth={1.3} />
      <path d="M0 0 l-14 16" strokeWidth={1.2} />
      <path d="M14 4 c10 2 20 6 28 12" strokeWidth={0.9} />
    </g>

    {/* paragraph blocks */}
    <path d="M66 800 h96 M66 816 h74 M66 832 h92 M66 848 h58" strokeWidth={1.05} />
    <path d="M250 806 h84 M250 822 h60 M250 838 h78" strokeWidth={1.05} />

    {/* signature */}
    <path d="M84 904 c 10 -20 26 -20 34 0 c 8 20 26 20 34 0 c 6 -14 16 -18 26 -6" strokeWidth={1.5} />
    <path d="M78 922 h116" strokeWidth={1.1} />

    {/* closing paragraph */}
    <path d="M60 952 h104 M60 964 h72" strokeWidth={1} />
    <path d="M232 952 h84 M232 964 h56" strokeWidth={1} />

    {/* texture */}
    <Burst cx={196} cy={36} r={6} len={7} n={10} />
    <Drop x={286} y={32} />
    <Drop x={112} y={196} />
    <circle cx="368" cy="196" r="1.6" fill={INK} stroke="none" />
    <circle cx="34" cy="486" r="1.5" fill={RED} stroke="none" />
    <circle cx="382" cy="608" r="1.5" fill={INK} stroke="none" />
    <circle cx="216" cy="860" r="1.6" fill={INK} stroke="none" />
    <Swirl cx={332} cy={382} r={14} tone="blue" />
    <Swirl cx={76} cy={680} r={12} />
  </svg>
);


// ── Map doodle for the location tab ──────────────────────────────────────────
// Roads and a dotted route run the height of the card, carrying a folding map,
// a compass, a pin inside search rings, a globe, a crosshair, a signpost, town
// blocks, waypoints, a scale bar and a neighbourhood outline — the same thin,
// connected line language as the other tabs.
export const LocationDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 420 1000"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke={INK}
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* spine */}
    <path
      d="M210 24 C 252 140, 168 240, 210 344 C 252 448, 158 548, 210 652 C 252 756, 168 856, 210 976"
      strokeDasharray="2 7"
      strokeWidth={1}
    />

    {/* roads */}
    <path d="M-10 156 C 60 118, 140 194, 214 154 C 288 116, 356 188, 430 148" strokeWidth={1} />
    <path d="M-10 484 C 70 446, 150 524, 226 482 C 300 444, 362 518, 430 478" strokeWidth={1} />
    <path d="M-10 806 C 80 768, 156 846, 236 806 C 308 770, 368 842, 430 804" strokeWidth={1} />
    <path d="M208 156 C 236 260, 168 350, 200 462 C 232 574, 172 668, 204 782" strokeWidth={0.9} strokeDasharray="6 7" />

    {/* folding map with a pin */}
    <g transform="rotate(-5 112 104)">
      <path d="M64 70 l30 -12 26 12 30 -12 v68 l-30 12 -26 -12 -30 12 z" strokeWidth={1.4} />
      <path d="M94 58 v68 M120 70 v68" strokeWidth={1.05} />
      <path d="M72 96 h10 M100 88 h8 M128 100 h10" strokeWidth={0.9} />
    </g>
    <path d="M146 82 c 6 0 11 5 11 11 c 0 8 -11 18 -11 18 s -11 -10 -11 -18 c 0 -6 5 -11 11 -11 z" strokeWidth={1.25} />
    <circle cx="146" cy="93" r="3.4" strokeWidth={1} />

    {/* compass */}
    <circle cx="334" cy="92" r="23" strokeWidth={1.3} />
    <path d="M334 74 l6 18 -6 -4 -6 4 z" strokeWidth={1.1} />
    <path d="M334 111 v4 M334 69 v-4 M315 92 h-4 M353 92 h4" strokeWidth={0.9} />
    <text x="334" y="56" textAnchor="middle" fontSize="10" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">N</text>

    {/* pin inside search rings */}
    <circle cx="118" cy="296" r="50" strokeDasharray="2 7" strokeWidth={1} />
    <circle cx="118" cy="296" r="70" strokeDasharray="2 7" strokeWidth={1} />
    <path
      d="M118 254 c 21 0 38 17 38 38 c 0 27 -38 60 -38 60 s -38 -33 -38 -60 c 0 -21 17 -38 38 -38 z"
      fill="#ffffff"
      strokeWidth={1.5}
    />
    <circle cx="118" cy="292" r="13" strokeWidth={1.2} />

    {/* globe */}
    <circle cx="306" cy="296" r="38" strokeWidth={1.4} />
    <ellipse cx="306" cy="296" rx="14" ry="38" strokeWidth={1} />
    <path d="M270 284 h72 M270 310 h72" strokeWidth={0.9} strokeDasharray="4 5" />
    <path d="M294 292 q12 -9 21 0 q8 9 -3 15 q-14 6 -18 -6 z" strokeWidth={0.95} />

    {/* crosshair */}
    <circle cx="204" cy="420" r="16" strokeWidth={1.2} />
    <path d="M204 396 v10 M204 434 v10 M180 420 h10 M218 420 h10" strokeWidth={1.1} />
    <circle cx="204" cy="420" r="2" fill={INK} stroke="none" />

    {/* signpost */}
    <path d="M74 520 v104" strokeWidth={1.4} />
    <path d="M40 532 h66 l10 10 -10 10 h-66 z" strokeWidth={1.2} />
    <path d="M108 566 h-66 l-10 10 10 10 h66 z" strokeWidth={1.2} />
    <path d="M52 542 h34 M52 576 h30" strokeWidth={0.9} />

    {/* neighbourhood outline */}
    <path d="M76 668 q-12 -36 20 -46 q32 -10 48 10 q16 20 -2 32 q-24 16 -66 4 z" strokeWidth={1} />

    {/* town blocks */}
    <path d="M200 664 v-42 h26 v42 M226 664 v-58 h28 v58 M254 664 v-30 h24 v30" strokeWidth={1.3} />
    <path d="M208 632 h10 M208 646 h10 M234 618 h12 M234 632 h12 M234 646 h12 M262 646 h8" strokeWidth={0.9} />
    <path d="M186 664 h112" strokeWidth={1.1} />

    {/* dotted route with waypoints and an arrow */}
    <path d="M40 742 C 104 706, 168 764, 236 730 C 282 708, 316 720, 338 736" strokeWidth={1.1} strokeDasharray="5 7" />
    <path d="M330 726 l12 10 -14 4" strokeWidth={1.2} />
    <circle cx="104" cy="726" r="3" strokeWidth={1} />
    <circle cx="188" cy="738" r="3" strokeWidth={1} />
    <circle cx="266" cy="716" r="3" strokeWidth={1} />

    {/* scale bar */}
    <path d="M56 792 h96" strokeWidth={1.2} />
    <path d="M56 786 v12 M104 786 v12 M152 786 v12" strokeWidth={1} />

    {/* a second route running out of the frame */}
    <path d="M-10 902 C 70 872, 150 934, 230 900 C 300 870, 360 922, 430 892" strokeWidth={0.9} strokeDasharray="4 8" />
    <circle cx="120" cy="918" r="2.2" fill={INK} stroke="none" />
    <circle cx="296" cy="906" r="2" fill={RED} stroke="none" />
    <circle cx="366" cy="884" r="1.8" fill={INK} stroke="none" />

    {/* map crosses */}
    <path d="M46 392 h8 M50 388 v8" strokeWidth={0.9} />
    <path d="M372 352 h8 M376 348 v8" strokeWidth={0.9} />
    <path d="M176 588 h8 M180 584 v8" strokeWidth={0.9} />
    <path d="M336 762 h8 M340 758 v8" strokeWidth={0.9} />

    {/* texture */}
    <Burst cx={196} cy={36} r={6} len={7} n={10} />
    <Drop x={286} y={32} />
    <Drop x={358} y={196} />
  </svg>
);


// ── Money doodle for the budget tab ──────────────────────────────────────────
// Cash-flow ribbons run the height of the card, carrying a banknote, a hanging
// price tag, a coin stack, a calculator, a rising bar chart, a percentage, a
// receipt, a wallet, a two-handle budget slider and a cheque — the same thin,
// connected line language as the other tabs.
export const BudgetDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 420 1000"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke={INK}
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* spine */}
    <path
      d="M210 24 C 252 140, 168 240, 210 344 C 252 448, 158 548, 210 652 C 252 756, 168 856, 210 976"
      strokeDasharray="2 7"
      strokeWidth={1}
    />

    {/* cash-flow ribbons */}
    <path d="M-10 158 C 60 122, 140 196, 214 156 C 288 120, 356 190, 430 152" strokeWidth={1} />
    <path d="M-10 470 C 70 434, 150 510, 226 470 C 300 432, 362 506, 430 466" strokeWidth={1} />
    <path d="M-10 796 C 84 762, 158 838, 238 800 C 310 766, 370 832, 430 798" strokeWidth={0.9} />

    {/* banknote */}
    <g transform="rotate(-6 112 110)">
      <rect x="58" y="84" width="108" height="54" rx="6" fill="#ffffff" strokeWidth={1.4} />
      <rect x="68" y="94" width="88" height="34" rx="4" strokeWidth={0.9} />
      <circle cx="112" cy="111" r="12" strokeWidth={1.1} />
      <text x="112" y="117" textAnchor="middle" fontSize="14" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">₹</text>
      <path d="M76 102 h8 M76 111 h8 M76 120 h8 M140 102 h6 M140 111 h6 M140 120 h6" strokeWidth={0.8} />
    </g>

    {/* price tag on a string */}
    <path d="M306 62 v20" strokeWidth={0.9} />
    <g transform="rotate(8 332 100)">
      <path d="M306 84 h44 l14 14 -14 14 h-44 z" strokeWidth={1.25} />
      <circle cx="314" cy="98" r="2.4" strokeWidth={0.9} />
      <path d="M326 98 h26" strokeWidth={0.9} />
    </g>

    {/* coin stack */}
    <ellipse cx="88" cy="318" rx="26" ry="9" strokeWidth={1.2} />
    <path d="M62 318 v-11 M114 318 v-11" strokeWidth={1.1} />
    <ellipse cx="88" cy="307" rx="26" ry="9" strokeWidth={1.1} />
    <path d="M62 307 v-11 M114 307 v-11" strokeWidth={1.1} />
    <ellipse cx="88" cy="296" rx="26" ry="9" strokeWidth={1.1} />
    <text x="88" y="301" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">₹</text>

    {/* calculator */}
    <g transform="rotate(4 302 300)">
      <rect x="266" y="254" width="72" height="94" rx="6" fill="#ffffff" strokeWidth={1.4} />
      <rect x="274" y="262" width="56" height="18" rx="3" strokeWidth={1} />
      <path d="M280 271 h18" strokeWidth={0.9} />
      <path d="M274 292 h10 M290 292 h10 M306 292 h10 M274 306 h10 M290 306 h10 M306 306 h10 M274 320 h10 M290 320 h10 M306 320 h10" strokeWidth={1} />
      <rect x="274" y="332" width="56" height="8" rx="3" strokeWidth={0.9} />
    </g>

    {/* rising arrow between them */}
    <path d="M150 382 h58" strokeWidth={1.2} />
    <path d="M200 374 l10 8 -10 8" strokeWidth={1.2} />

    {/* bar chart */}
    <path d="M58 508 h182" strokeWidth={1.2} />
    <path d="M58 508 v-6 M100 508 v-6 M142 508 v-6 M184 508 v-6 M226 508 v-6" strokeWidth={0.9} />
    <rect x="72" y="476" width="20" height="32" rx="2" strokeWidth={1.2} />
    <rect x="106" y="456" width="20" height="52" rx="2" strokeWidth={1.2} />
    <rect x="140" y="432" width="20" height="76" rx="2" strokeWidth={1.2} />
    <rect x="174" y="462" width="20" height="46" rx="2" strokeWidth={1.2} />
    <rect x="208" y="416" width="20" height="92" rx="2" strokeWidth={1.2} />
    <path d="M74 466 C 120 436, 168 404, 222 396" strokeWidth={1} strokeDasharray="4 5" />
    <path d="M212 392 l12 3 -6 11" strokeWidth={1.1} />

    {/* percentage */}
    <text x="332" y="470" textAnchor="middle" fontSize="30" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">%</text>
    <circle cx="322" cy="446" r="5" strokeWidth={1.1} />

    {/* receipt with a torn edge */}
    <g transform="rotate(-3 100 646)">
      <path d="M64 604 h72 v86 l-9 -6 -9 6 -9 -6 -9 6 -9 -6 -9 6 -9 -6 -9 6 z" fill="#ffffff" strokeWidth={1.3} />
      <path d="M76 620 h46 M76 632 h38 M76 644 h46 M76 656 h26" strokeWidth={0.95} />
      <path d="M76 672 h30" strokeWidth={1.1} />
    </g>

    {/* wallet with a note peeking out */}
    <g transform="rotate(3 302 646)">
      <rect x="258" y="622" width="92" height="56" rx="8" fill="#ffffff" strokeWidth={1.4} />
      <path d="M258 638 h92" strokeWidth={1} />
      <rect x="322" y="640" width="26" height="18" rx="4" strokeWidth={1.1} />
      <path d="M330 649 h6" strokeWidth={1} />
      <path d="M266 612 h54" strokeWidth={1.2} />
    </g>

    {/* budget slider with two handles */}
    <path d="M54 748 h176" strokeWidth={1.3} />
    <path d="M54 742 v12 M142 742 v12 M230 742 v12" strokeWidth={0.9} />
    <rect x="86" y="738" width="13" height="20" rx="3" fill="#ffffff" strokeWidth={1.3} />
    <rect x="188" y="738" width="13" height="20" rx="3" fill="#ffffff" strokeWidth={1.3} />
    <path d="M92 754 h0" strokeWidth={1} />

    {/* cheque */}
    <g transform="rotate(-2 300 862)">
      <rect x="244" y="836" width="112" height="48" rx="5" fill="#ffffff" strokeWidth={1.35} />
      <path d="M254 850 h44 M254 862 h30 M254 874 h58" strokeWidth={0.95} />
      <path d="M312 872 c 6 -12 16 -12 20 0" strokeWidth={1.1} />
    </g>

    {/* loose coins on the trail */}
    <ellipse cx="120" cy="812" rx="15" ry="5" strokeWidth={1.1} />
    <ellipse cx="246" cy="796" rx="13" ry="4.5" strokeWidth={1.1} />
    <circle cx="196" cy="820" r="2" fill={INK} stroke="none" />

    {/* texture */}
    <Burst cx={196} cy={36} r={6} len={7} n={10} />
    <Drop x={286} y={32} />
    <circle cx="46" cy="212" r="1.6" fill={INK} stroke="none" />
    <circle cx="380" cy="392" r="1.5" fill={RED} stroke="none" />
    <circle cx="60" cy="546" r="1.5" fill={INK} stroke="none" />
  </svg>
);


// ── Clock doodle for the deadline tab ────────────────────────────────────────
// Time runs down the card on three ribbons: a calendar page with one day
// circled, a clock, an hourglass, a stopwatch, an alarm clock, a milestone
// timeline with a flag, a tear-off date page, a dashed DUE stamp and countdown
// dashes — the same thin, connected line language as the other tabs.
export const DeadlineDoodles = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 420 1000"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    aria-hidden="true"
    fill="none"
    stroke={INK}
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* spine */}
    <path
      d="M210 24 C 252 140, 168 240, 210 344 C 252 448, 158 548, 210 652 C 252 756, 168 856, 210 976"
      strokeDasharray="2 7"
      strokeWidth={1}
    />

    {/* time ribbons */}
    <path d="M-10 160 C 60 124, 140 198, 214 158 C 288 122, 356 192, 430 154" strokeWidth={1} />
    <path d="M-10 500 C 70 464, 150 540, 226 500 C 300 462, 362 536, 430 496" strokeWidth={1} />
    <path d="M-10 812 C 84 778, 158 854, 238 816 C 310 782, 370 848, 430 814" strokeWidth={0.9} />

    {/* calendar page with one day circled */}
    <g transform="rotate(-4 110 122)">
      <rect x="58" y="84" width="104" height="84" rx="7" fill="#ffffff" strokeWidth={1.4} />
      <path d="M58 106 h104" strokeWidth={1.1} />
      <path d="M80 84 v-10 M140 84 v-10" strokeWidth={1.6} />
      <path d="M70 96 h10 M130 96 h10" strokeWidth={0.9} />
      <path d="M72 120 h1 M90 120 h1 M108 120 h1 M126 120 h1 M144 120 h1 M72 134 h1 M90 134 h1 M108 134 h1 M126 134 h1 M144 134 h1 M72 148 h1 M90 148 h1 M108 148 h1 M126 148 h1 M144 148 h1" strokeWidth={2.4} />
      <circle cx="126" cy="134" r="9.5" strokeWidth={1.3} />
    </g>

    {/* clock */}
    <circle cx="306" cy="118" r="30" strokeWidth={1.4} />
    <path d="M306 98 v20 l13 8" strokeWidth={1.3} />
    <path d="M306 92 v5 M306 144 v-5 M280 118 h5 M332 118 h-5" strokeWidth={0.9} />
    <text x="306" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">24h</text>

    {/* hourglass */}
    <g transform="translate(94 302) rotate(-6)">
      <path d="M-26 -44 h52 M-26 44 h52" strokeWidth={1.6} />
      <path d="M-22 -40 h44 l-22 38 l22 38 h-44 l22 -38 z" strokeWidth={1.4} />
      <path d="M-9 30 h18" strokeWidth={1.1} />
      <circle cx="0" cy="-8" r="1.6" fill={INK} stroke="none" />
      <circle cx="0" cy="6" r="1.3" fill={INK} stroke="none" />
    </g>

    {/* stopwatch */}
    <circle cx="302" cy="304" r="34" strokeWidth={1.4} />
    <path d="M302 262 v8 M292 268 h20" strokeWidth={1.5} />
    <path d="M302 304 l-12 18" strokeWidth={1.4} />
    <path d="M302 304 l16 -9" strokeWidth={1.2} />
    <path d="M302 276 v5 M302 332 v-5 M274 304 h5 M330 304 h-5" strokeWidth={0.9} />
    <path d="M302 346 v10" strokeWidth={1.2} />

    {/* alarm clock */}
    <circle cx="206" cy="428" r="30" strokeWidth={1.4} />
    <path d="M182 402 l-13 -11 M230 402 l13 -11" strokeWidth={1.3} />
    <path d="M206 412 v16 l12 8" strokeWidth={1.3} />
    <path d="M192 460 l-8 12 M220 460 l8 12" strokeWidth={1.2} />

    {/* milestone timeline ending in a flag */}
    <path d="M40 576 h332" strokeWidth={1.3} />
    <circle cx="84" cy="576" r="4" fill={INK} stroke="none" />
    <circle cx="164" cy="576" r="4" strokeWidth={1.1} />
    <circle cx="244" cy="576" r="4" strokeWidth={1.1} />
    <circle cx="318" cy="576" r="4.5" fill={RED} stroke="none" />
    <path d="M318 576 v-28 l24 7 -24 7" strokeWidth={1.2} />
    <path d="M72 596 h24 M152 596 h24 M232 596 h24 M306 596 h24" strokeWidth={0.9} />

    {/* tear-off date page */}
    <g transform="rotate(5 108 672)">
      <path d="M66 636 h80 v68 h-80 z" strokeWidth={1.4} />
      <path d="M66 656 h80" strokeWidth={1.1} />
      <path d="M78 648 h12" strokeWidth={0.9} />
      <text x="106" y="692" textAnchor="middle" fontSize="22" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">31</text>
    </g>

    {/* dashed DUE stamp */}
    <g transform="rotate(-7 306 672)">
      <rect x="254" y="646" width="104" height="42" rx="6" strokeWidth={1.4} strokeDasharray="5 4" />
      <text x="306" y="674" textAnchor="middle" fontSize="15" fontWeight="700" fill={INK} stroke="none" fontFamily="'Helvetica Neue', Arial, system-ui, sans-serif">DUE</text>
    </g>

    {/* countdown marks */}
    <path d="M56 748 h44 M108 748 h44 M160 748 h44" strokeWidth={1.5} />
    <path d="M56 762 h12 M68 762 h12 M80 762 h12" strokeWidth={0.9} />

    {/* trail running out of the frame */}
    <path d="M-10 894 C 70 864, 150 926, 230 892 C 300 862, 360 918, 430 886" strokeWidth={0.9} strokeDasharray="4 8" />
    <circle cx="126" cy="908" r="2.2" fill={INK} stroke="none" />
    <circle cx="300" cy="898" r="2" fill={RED} stroke="none" />

    {/* texture */}
    <Burst cx={196} cy={36} r={6} len={7} n={10} />
    <Drop x={286} y={30} />
    <circle cx="44" cy="212" r="1.6" fill={INK} stroke="none" />
    <circle cx="382" cy="392" r="1.5" fill={INK} stroke="none" />
    <circle cx="62" cy="536" r="1.5" fill={RED} stroke="none" />
  </svg>
);

// Seller doodle — mini flow sketch: Your Item → Match → Buyer.
// Used on the Sell Listing title step.
export const SellerCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 90" className={className} fill="none" stroke={GRAY} strokeLinecap="round" strokeLinejoin="round">
    {/* Node 1: Your item box */}
    <g transform="translate(24, 34)">
      <rect x="-10" y="-10" width="20" height="20" rx="2.5" strokeWidth="1.5" fill="white" />
      <path d="M0 -10 L0 10 M-10 0 L10 0" strokeWidth="1.1" />
      <text x="0" y="24" textAnchor="middle" fontSize="8" stroke="none" fill={TEXT} fontWeight="500">Item</text>
    </g>
    {/* Node 2: Match (concentric target, like the landing Match node) */}
    <g transform="translate(100, 30)">
      <circle cx="0" cy="0" r="13" strokeWidth="1.5" fill="white" />
      <circle cx="0" cy="0" r="8" strokeWidth="1.2" opacity="0.7" />
      <circle cx="0" cy="0" r="2.5" fill={GRAY} stroke="none" />
      <text x="0" y="27" textAnchor="middle" fontSize="8" stroke="none" fill={TEXT} fontWeight="500">Match</text>
    </g>
    {/* Node 3: Buyer */}
    <g transform="translate(172, 34)">
      <circle cx="0" cy="-8" r="7" strokeWidth="1.5" fill="white" />
      <circle cx="-2.5" cy="-9.5" r="1" fill={GRAY} stroke="none" />
      <circle cx="2.5" cy="-9.5" r="1" fill={GRAY} stroke="none" />
      <rect x="-6" y="-2" width="12" height="11" rx="2" strokeWidth="1.2" fill="white" />
      <text x="0" y="34" textAnchor="middle" fontSize="8" stroke="none" fill={TEXT} fontWeight="500">Buyer</text>
    </g>
    {/* Dashed flow lines between nodes */}
    <path d="M38 32 L85 30" strokeWidth="1.4" strokeDasharray="4 4">
      <animate attributeName="stroke-dashoffset" values="8;0" dur="1.6s" repeatCount="indefinite" />
    </path>
    <path d="M115 30 L162 28" strokeWidth="1.4" strokeDasharray="4 4">
      <animate attributeName="stroke-dashoffset" values="8;0" dur="1.6s" repeatCount="indefinite" begin="0.4s" />
    </path>
    {/* Corner accent dots */}
    <circle cx="8" cy="8" r="2" fill={GRAY} stroke="none" opacity="0.4" />
    <circle cx="192" cy="82" r="2" fill={GRAY} stroke="none" opacity="0.4" />
  </svg>
);

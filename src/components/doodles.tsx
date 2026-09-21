// Shared doodle components for the wizard title steps — drawn in the same
// style as the landing page's minimal professional sketch around the logo:
// thin gray (#6B7280) strokes, small labeled nodes, dashed flow lines.
// Strictly gray-on-white, quiet, professional.

const GRAY = '#6B7280';
const TEXT = '#4B5563';

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

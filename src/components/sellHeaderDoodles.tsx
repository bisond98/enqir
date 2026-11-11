// ── The selling mural that fills the sell form's black header ────────────────
// The enquiry form's treatment, redrawn for a seller: a striped stall awning, a
// hanging "for sale" board, the listing on a phone, a parcel, a price tag with a
// hand-written rupee, a shirt still on its hanger and the coins that close the
// sale — tied together by one dashed line of travel. Hatching, grain dots and
// sparkles sit between them at a smaller scale, weights stepping 1.9 down to 0.9
// so the piece reads top-to-bottom. currentColor throughout, and the caller
// positions it absolutely, so the header keeps its height.
export const SellHeaderDoodles = ({ className = "" }: { className?: string }) => (
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
    {/* ── the stall, striped awning and all */}
    <g transform="translate(96 96) rotate(-3) scale(0.85)">
      <path d="M-64 0 H64" strokeWidth={1.8} />
      <path d="M-64 0 C-64 -18 -44 -30 -24 -30 H24 C44 -30 64 -18 64 0" strokeWidth={1.9} />
      <path d="M-48 -30 V-38 M-24 -32 V-40 M0 -32 V-40 M24 -32 V-40 M48 -30 V-38" strokeWidth={1} />
      <path d="M-64 0 C-56 12 -44 12 -36 0" strokeWidth={1.4} />
      <path d="M-28 0 C-20 12 -8 12 0 0" strokeWidth={1.4} />
      <path d="M8 0 C16 12 28 12 36 0" strokeWidth={1.4} />
      <path d="M44 0 C52 12 60 10 64 2" strokeWidth={1.4} />
      <path d="M-40 -26 L-30 0 M-8 -30 L2 0 M24 -30 L34 0 M48 -24 L56 0" strokeWidth={0.9} opacity={0.75} />
      <path d="M-52 0 V24 M52 0 V24" strokeWidth={1.2} opacity={0.8} />
      <path d="M-44 24 H-60 M44 24 H60" strokeWidth={1.1} opacity={0.7} />
    </g>

    {/* ── the board hanging off the top edge */}
    <path d="M300 4 C299 20 301 34 303 48" strokeWidth={1} strokeDasharray="2 5" opacity={0.85} />
    <g transform="translate(303 76) rotate(-5) scale(0.8)">
      <path d="M-46 -22 H46 V22 H-46 Z" strokeWidth={1.9} />
      <path d="M-46 -22 L-52 -28 M46 -22 L52 -28" strokeWidth={1.3} />
      <path d="M-34 -8 H20" strokeWidth={1.2} />
      <path d="M-34 3 H6" strokeWidth={1.2} />
      <path d="M27 -11 L39 0 L27 11" strokeWidth={1.3} />
    </g>

    {/* ── the listing on a phone */}
    <g transform="translate(152 180) rotate(-4) scale(0.8)">
      <path d="M-16 -27 C-9 -29 9 -29 16 -27 C18 -18 18 18 16 27 C9 29 -9 29 -16 27 C-18 18 -18 -18 -16 -27 Z" strokeWidth={1.8} />
      <path d="M-11 -19 H9 V-3 H-11 Z" strokeWidth={1.2} />
      <path d="M-8 -8 L-4 -12 L0 -7 L4 -10 L7 -6" strokeWidth={1} />
      <path d="M-10 3 H6 M-10 10 H0" strokeWidth={1.3} />
      <path d="M-6 22 H6" strokeWidth={1.2} />
    </g>

    {/* ── the parcel, packed and ready */}
    <g transform="translate(452 176) rotate(-3) scale(0.85)">
      <path d="M-26 -10 H26 V20 H-26 Z" strokeWidth={1.8} />
      <path d="M-26 -10 L-18 -19 H34 L26 -10" strokeWidth={1.5} />
      <path d="M26 -10 L34 -19 V11 L26 20" strokeWidth={1.5} />
      <path d="M-8 -10 L-14 -19 M8 -10 L14 -19" strokeWidth={1.1} opacity={0.8} />
      <path d="M-6 -1 H6 V20" strokeWidth={1.1} opacity={0.8} />
      <path d="M-20 4 H-10 M-20 10 H-14" strokeWidth={0.9} opacity={0.6} />
    </g>

    {/* ── the price tag, rupee written by hand */}
    <g transform="translate(618 66) rotate(8) scale(0.85)">
      <path d="M-30 -17 H8 L28 0 L8 17 H-30 Z" strokeWidth={1.9} />
      <path d="M-30 -17 V17" strokeWidth={1.9} />
      <circle cx="-22" cy="0" r="2.5" strokeWidth={1.3} />
      <text
        x="2"
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

    {/* ── still on its hanger, far right */}
    <g transform="translate(790 78) rotate(6) scale(0.8)">
      <path d="M-6 -30 C-2 -34 7 -34 11 -30 C13 -28 11 -25 7 -24" strokeWidth={1.1} />
      <path d="M7 -24 L1 -18" strokeWidth={1.1} />
      <path
        d="M-32 -6 C-22 -14 -10 -18 0 -18 C10 -18 22 -14 32 -6 C28 -2 24 1 19 3 C15 1 12 -2 9 -4 V16 C9 19 7 20 4 20 H-4 C-7 20 -9 19 -9 16 V-4 C-12 -2 -15 1 -19 3 C-24 1 -28 -2 -32 -6 Z"
        strokeWidth={1.9}
      />
      <path d="M-13 -12 C-6 -16 0 -17 6 -16" strokeWidth={1} opacity={0.7} />
    </g>

    {/* ── the coins that close the sale */}
    <g transform="translate(722 194) rotate(-4) scale(0.8)">
      <path d="M-20 2 C-20 -2 -11 -5 0 -5 C11 -5 20 -2 20 2 V12 C20 16 11 19 0 19 C-11 19 -20 16 -20 12 Z" strokeWidth={1.7} />
      <ellipse cx="0" cy="2" rx="20" ry="6" strokeWidth={1.4} />
      <ellipse cx="0" cy="-8" rx="20" ry="6" strokeWidth={1.3} opacity={0.9} />
      <path d="M-6 -10 C-2 -11 3 -11 7 -10" strokeWidth={1} opacity={0.7} />
    </g>

    {/* ── the line the sale travels along */}
    <path d="M232 128 C264 114 300 100 336 94" strokeWidth={1.1} strokeDasharray="3 6" opacity={0.85} />
    <path d="M330 88 L340 94 L330 101" strokeWidth={1.2} />
    <path d="M556 138 C596 128 634 122 666 124" strokeWidth={1.1} strokeDasharray="3 6" opacity={0.85} />
    <path d="M660 118 L670 124 L660 131" strokeWidth={1.2} />

    {/* ── small trades in the far corners, so they are not bare */}
    <g transform="translate(48 40) rotate(-8) scale(0.8)">
      <path d="M-14 -12 H6 L16 0 L6 12 H-14 Z" strokeWidth={1.6} />
      <circle cx="-8" cy="0" r="2" strokeWidth={1.1} />
    </g>
    <g transform="translate(866 172) rotate(7) scale(0.8)">
      <path d="M-14 -12 H6 L16 0 L6 12 H-14 Z" strokeWidth={1.6} />
      <circle cx="-8" cy="0" r="2" strokeWidth={1.1} />
      <path d="M-4 -2 C0 -4 4 -4 8 -2" strokeWidth={0.9} opacity={0.8} />
    </g>

    {/* ── hatching, grain dots and sparkles filling the band */}
    <path d="M70 152 l10 -8 M76 158 l10 -8 M82 164 l10 -8" strokeWidth={0.9} opacity={0.6} />
    <path d="M836 44 l10 -8 M842 50 l10 -8" strokeWidth={0.9} opacity={0.6} />
    <path d="M382 214 l12 -9 M390 220 l12 -9" strokeWidth={0.9} opacity={0.55} />
    <circle cx="212" cy="50" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="392" cy="32" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="556" cy="208" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="690" cy="38" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="846" cy="112" r="1.5" fill="currentColor" stroke="none" />
    <g transform="translate(262 158) rotate(-6)">
      <path d="M0 -7 C1 -3 3 -1 7 0 C3 1 1 3 0 7 C-1 3 -3 1 -7 0 C-3 -1 -1 -3 0 -7" strokeWidth={1} />
    </g>
    <g transform="translate(520 44) rotate(8)">
      <path d="M0 -6 C1 -2.5 2 -1 5 0 C2 1 1 2.5 0 6 C-1 2.5 -2 1 -5 0 C-2 -1 -1 -2.5 0 -6" strokeWidth={1} />
    </g>
    <g transform="translate(760 150) rotate(-4)">
      <path d="M0 -6 C1 -2.5 2 -1 5 0 C2 1 1 2.5 0 6 C-1 2.5 -2 1 -5 0 C-2 -1 -1 -2.5 0 -6" strokeWidth={1} />
    </g>
    <g transform="translate(348 168) rotate(5)">
      <path d="M0 -5 C1 -2 2 -1 4 0 C2 1 1 2 0 5 C-1 2 -2 1 -4 0 C-2 -1 -1 -2 0 -5" strokeWidth={0.9} />
    </g>
  </svg>
);

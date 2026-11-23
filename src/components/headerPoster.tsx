// ── Print poster behind a section header ────────────────────────────────────
// Same language as the new-listing header poster: navy wash, faint print grid,
// ghost display lettering, a hanging tag outline, a masthead chip and a barcode,
// so every dark band across the app reads as one printed set. Sliced to fill, so
// any header height or width crops into a composed print.
import type { CSSProperties } from "react";

type Props = {
  /** Ghost display word cropped by the band, e.g. SHOP / ASK. */
  word: string;
  /** Small capsule beside the ENQIR masthead, e.g. SAFE DEALS. */
  chip: string;
  /** Bottom-left trust line beside the stars. */
  caption: string;
  /** Text inside the hanging tag outline. */
  tagLabel: string;
  className?: string;
  style?: CSSProperties;
};

export default function HeaderPoster({ word, chip, caption, tagLabel, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="bandBase" x1="0" y1="0" x2="1200" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#111111" />
          <stop offset="0.5" stopColor="#0a0a0a" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="bandGlowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(980 40) rotate(120) scale(420 420)">
          <stop stopColor="#9ca3af" stopOpacity="0.10" />
          <stop offset="1" stopColor="#9ca3af" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bandGlowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 300) rotate(-50) scale(360 360)">
          <stop stopColor="#9ca3af" stopOpacity="0.10" />
          <stop offset="1" stopColor="#9ca3af" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="320" fill="url(#bandBase)" />
      <rect width="1200" height="320" fill="url(#bandGlowA)" />
      <rect width="1200" height="320" fill="url(#bandGlowB)" />

      {/* Print grid */}
      <g stroke="#ffffff" strokeOpacity="0.08">
        {Array.from({ length: 15 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 86} 0 V320`} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 80} H1200`} />
        ))}
      </g>

      {/* Ghost display lettering */}
      <text
        x="640"
        y="252"
        fontSize="160"
        fontWeight="800"
        letterSpacing="-6"
        fill="#ffffff"
        fillOpacity="0.13"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {word}
      </text>

      {/* Hanging tag outline */}
      <g stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2">
        <path d="M342 58 C342 34 380 34 380 58" strokeOpacity="0.35" />
        <path d="M300 78 H430 V246 H300 Z" strokeLinejoin="round" />
        <circle cx="365" cy="96" r="7" />
      </g>
      <text
        x="365"
        y="176"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        letterSpacing="-0.6"
        fill="#ffffff"
        fillOpacity="0.35"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ₹
      </text>
      <text
        x="365"
        y="204"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.4"
        fill="#e5e7eb"
        fillOpacity="0.6"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {tagLabel}
      </text>

      {/* Masthead + chip, left */}
      <text
        x="58"
        y="64"
        fontSize="11"
        fontWeight="700"
        letterSpacing="4.5"
        fill="#ffffff"
        fillOpacity="0.6"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ENQIR
      </text>
      <rect x="140" y="48" width="120" height="20" rx="10" stroke="#ffffff" strokeOpacity="0.35" />
      <text
        x="200"
        y="62"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.6"
        fill="#e5e7eb"
        fillOpacity="0.5"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {chip}
      </text>

      {/* Trust row, bottom left */}
      <g fill="#ffffff" fillOpacity="0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${58 + i * 18} 268 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z`}
          />
        ))}
      </g>
      <text
        x="158"
        y="276"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1.4"
        fill="#ffffff"
        fillOpacity="0.6"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {caption}
      </text>

      {/* Barcode, bottom right */}
      <g fill="#ffffff" fillOpacity="0.42">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((i) => (
          <rect
            key={i}
            x={520 + i * 11 + (i % 3) * 2}
            y="262"
            width={i % 4 === 0 ? 5 : i % 3 === 0 ? 2 : 3.4}
            height="30"
          />
        ))}
      </g>

      {/* Print marks and a rule */}
      <g stroke="#ffffff" strokeOpacity="0.28">
        <path d="M24 24 V48 H48" />
        <path d="M1176 24 V48 H1152" />
        <path d="M24 296 V272 H48" />
        <path d="M1176 296 V272 H1152" />
      </g>
      <path d="M300 288 H900" stroke="#ffffff" strokeOpacity="0.22" strokeDasharray="2 8" />
    </svg>
  );
}

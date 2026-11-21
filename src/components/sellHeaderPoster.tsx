// ── Full-bleed seller poster behind the new-listing header ───────────────────
// The enquiry header pins a small flyer to one side; this one is a poster wall
// that covers the whole band instead: navy wash, faint print grid, ghost SELL
// lettering, a hanging price-tag outline, a barcode and loose print marks. It is
// drawn wide (1200×320) and sliced to fill, so any header height or width still
// crops into a composed print rather than stretched art. Everything stays dark
// and low-contrast; the header scrim and heading sit on top.
import type { CSSProperties } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
};

export default function SellHeaderPoster({ className, style }: Props) {
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
        <linearGradient id="sellWallBase" x1="0" y1="0" x2="1200" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2434" />
          <stop offset="0.5" stopColor="#121b28" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id="sellWallGlowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(980 40) rotate(120) scale(420 420)">
          <stop stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sellWallGlowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 300) rotate(-50) scale(360 360)">
          <stop stopColor="#60a5fa" stopOpacity="0.12" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="320" fill="url(#sellWallBase)" />
      <rect width="1200" height="320" fill="url(#sellWallGlowA)" />
      <rect width="1200" height="320" fill="url(#sellWallGlowB)" />

      {/* Print grid */}
      <g stroke="#ffffff" strokeOpacity="0.08">
        {Array.from({ length: 15 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 86} 0 V320`} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 80} H1200`} />
        ))}
      </g>

      {/* Ghost SELL lettering, cropped by the band on small headers */}
      <text
        x="640"
        y="252"
        fontSize="210"
        fontWeight="800"
        letterSpacing="-6"
        fill="#ffffff"
        fillOpacity="0.13"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        SELL
      </text>

      {/* Hanging price-tag outline */}
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
        fill="#93c5fd"
        fillOpacity="0.8"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        SET PRICE
      </text>

      {/* Masthead + seller chip, left */}
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
      <rect x="140" y="48" width="96" height="20" rx="10" stroke="#93c5fd" strokeOpacity="0.55" />
      <text
        x="188"
        y="62"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.6"
        fill="#bfdbfe"
        fillOpacity="0.55"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        FOR SELLERS
      </text>

      {/* Trust row, bottom left */}
      <g fill="#60a5fa" fillOpacity="0.6">
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
        LOCAL BUYERS
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

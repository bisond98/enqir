// ── The marketing poster pinned into the Post Enquiry black header ───────────
// A printed-flyer treatment rather than an illustration: deep navy sheet, soft
// blue glow, hairline edge and one accent, so it sells the form without
// competing with the headline beside it. Colours are literal (it always sits on
// black) and the caller positions it absolutely, so the header keeps exactly
// its height.
type Props = {
  className?: string;
};

export default function EnquiryPosterDoodle({ className }: Props) {
  return (
    <svg viewBox="0 0 220 300" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="enqPosterSheet" x1="20" y1="6" x2="200" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1b2637" />
          <stop offset="0.5" stopColor="#121c2b" />
          <stop offset="1" stopColor="#0d1624" />
        </linearGradient>
        <radialGradient
          id="enqPosterGlow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(176 54) rotate(120) scale(120 120)"
        >
          <stop stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="enqPosterSheen" x1="0" y1="0" x2="220" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g transform="rotate(-2 110 150)">
        <rect x="10" y="6" width="200" height="288" rx="11" fill="url(#enqPosterSheet)" />
        <rect x="10" y="6" width="200" height="288" rx="11" fill="url(#enqPosterGlow)" />
        <rect x="10" y="6" width="200" height="288" rx="11" stroke="#ffffff" strokeOpacity="0.26" />
        <path d="M21 6 H199 V44 C150 26 70 28 21 48 Z" fill="url(#enqPosterSheen)" />

        {/* Masthead */}
        <text
          x="28"
          y="38"
          fontSize="7.4"
          fontWeight="700"
          letterSpacing="2.6"
          fill="#e2eaf5"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          ENQIR
        </text>
        <rect x="132" y="26" width="72" height="15" rx="7.5" fill="#ffffff" fillOpacity="0.07" />
        <rect x="132" y="26" width="72" height="15" rx="7.5" stroke="#93c5fd" strokeOpacity="0.4" />
        <text
          x="168"
          y="36.4"
          textAnchor="middle"
          fontSize="6.4"
          fontWeight="700"
          letterSpacing="1.1"
          fill="#bfdbfe"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          GET MATCHED
        </text>

        {/* Headline */}
        <text
          x="28"
          y="94"
          fontSize="30"
          fontWeight="800"
          letterSpacing="-0.8"
          fill="#ffffff"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Post a
        </text>
        <text
          x="28"
          y="124"
          fontSize="30"
          fontWeight="800"
          letterSpacing="-0.8"
          fill="#ffffff"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          need.
        </text>
        <text
          x="28"
          y="160"
          fontSize="25"
          fontWeight="700"
          letterSpacing="-0.3"
          fill="#a8bfd9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Get real
        </text>
        <text
          x="28"
          y="186"
          fontSize="25"
          fontWeight="700"
          letterSpacing="-0.3"
          fill="#a8bfd9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          offers.
        </text>

        <rect x="28" y="198" width="36" height="3" rx="1.5" fill="#3b82f6" />

        {/* Trust row */}
        <g fill="#60a5fa">
          <path d="M29 212 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z" />
          <path d="M47 212 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z" />
          <path d="M65 212 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z" />
          <path d="M83 212 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z" />
          <path d="M101 212 l2.2 4.6 5 .7 -3.6 3.6 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.6 5-.7z" />
        </g>
        <text
          x="120"
          y="220"
          fontSize="6.6"
          fontWeight="600"
          letterSpacing="0.3"
          fill="#7f93ad"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Local sellers
        </text>

        {/* Footer */}
        <path d="M28 234 H162" stroke="#ffffff" strokeOpacity="0.12" />
        <text
          x="28"
          y="250"
          fontSize="8.2"
          fontWeight="500"
          fill="#93a6bd"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Say what you need.
        </text>
        <text
          x="28"
          y="262"
          fontSize="8.2"
          fontWeight="500"
          fill="#6f839c"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          Sellers come to you.
        </text>

        {/* Registration marks */}
        <g stroke="#ffffff" strokeOpacity="0.1">
          <path d="M10 254 V294 H52" />
          <path d="M168 6 H210 V46" />
        </g>
      </g>
    </svg>
  );
}

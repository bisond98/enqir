// ── Two people shaking hands, drawn as characters for the sell-response tiles ─
// The deal made literal: a white-collar figure on the left with collar and tie,
// a blue-collar figure on the right in a hard hat and overalls, their arms met in
// one clasped handshake in the middle. Built in the same doodle language as the
// rest of the app — a single ink weight family, hatching for shadow, sparks off
// the grip, grain dots and one dashed line of ground under both of them. The
// caller sizes and tints it, so it lies in the tile's empty space as ink, not as
// an illustration that fights the text.
export const JobCategoryDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 300 124"
    preserveAspectRatio="xMidYMax meet"
    className={className}
    fill="none"
    stroke="#1F2937"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* ── left figure: the white-collar side of the deal ── */}
    <g>
      {/* head and neck */}
      <circle cx="104" cy="36" r="12.5" strokeWidth={1.7} fill="#F6D7B8" />
      <path d="M100 48 V53 M108 48 V53" strokeWidth={1.15} />
      {/* collar and tie */}
      <path d="M97 51 L104 58 L111 51" strokeWidth={1.3} />
      <path d="M104 58 L101 67 L104 75 L107 67 Z" strokeWidth={1.25} fill="#800020" stroke="#800020" />
      {/* torso and the arm going to the grip */}
      <path d="M92 53 C90 63 89 73 88 89" strokeWidth={1.7} />
      <path d="M116 53 C118 63 119 73 120 89" strokeWidth={1.7} />
      <path d="M114 56 C123 58 131 60 140 63" strokeWidth={1.45} />
      <path d="M115 62 C124 64 132 65 140 67" strokeWidth={1.1} opacity={0.75} />
      {/* hatching down the jacket */}
      <path d="M95 60 L94 86 M99 58 L98 87 M110 58 L111 87 M113 60 L114 86" strokeWidth={0.8} opacity={0.45} />
      {/* legs and shoes */}
      <path d="M88 89 C87 95 87 99 87 104 M120 89 C121 95 121 99 121 104" strokeWidth={1.5} />
      <path d="M83 104 H91 M117 104 H125" strokeWidth={2.2} stroke="#111827" />
    </g>

    {/* ── right figure: the blue-collar side of it ── */}
    <g>
      {/* head under the hard hat */}
      <circle cx="196" cy="42" r="11.5" strokeWidth={1.7} fill="#F6D7B8" />
      <path d="M184 33 C184 23 190 17 196 17 C202 17 208 23 208 33" strokeWidth={1.7} fill="#F5B301" />
      <path d="M178 33 C185 38 207 38 214 33" strokeWidth={1.45} stroke="#D99A00" />
      <path d="M196 17 V33 M189 20 L187 32 M203 20 L205 32" strokeWidth={0.85} opacity={0.7} />
      {/* torso, overalls straps and the arm reaching in */}
      <path d="M187 53 C186 64 185 74 184 90" strokeWidth={1.7} />
      <path d="M206 53 C207 64 208 74 209 90" strokeWidth={1.7} />
      <path d="M188 57 C178 59 169 61 160 63" strokeWidth={1.45} />
      <path d="M189 63 C179 65 170 66 160 67" strokeWidth={1.1} opacity={0.75} />
      <path d="M190 56 L193 74 M203 56 L200 74" strokeWidth={1.15} stroke="#1E4E79" />
      <path d="M190 74 H203" strokeWidth={1.1} opacity={0.8} stroke="#1E4E79" />
      <path d="M191 70 L191 86 M195 70 V86 M199 70 L199 86" strokeWidth={0.8} opacity={0.45} />
      {/* legs and boots */}
      <path d="M184 90 C183 96 183 100 183 105 M209 90 C210 96 210 100 210 105" strokeWidth={1.5} />
      <path d="M178 105 H187 M205 105 H214" strokeWidth={2.2} stroke="#6B4A2F" />
    </g>

    {/* ── the handshake itself, dead centre ── */}
    <g>
      {/* sleeves meeting, one cuff slightly over the other */}
      <path d="M143 59 V70" strokeWidth={1.25} />
      <path d="M158 59 V70" strokeWidth={1.25} />
      <path d="M143 62 C146 57 151 56 154 60 C157 64 154 69 150 68 C147 67 146 65 145 63" strokeWidth={1.6} />
      <path d="M155 61 C153 58 150 58 148 60 M150 66 C153 66 155 63 155 61" strokeWidth={0.95} opacity={0.8} />
      {/* the thumb over the top of the grip */}
      <path d="M147 58 C150 55 154 56 155 59" strokeWidth={1.3} />
    </g>

    {/* ── sparks off the grip: the deal landing ── */}
    <g strokeWidth={1.15} opacity={0.9} stroke="#D97706">
      <path d="M150 44 V50 M147 47 H153" />
      <path d="M136 47 V51 M134 49 H138" />
      <path d="M164 47 V51 M162 49 H166" />
      <path d="M150 24 V29 M147.5 26.5 H152.5" opacity={0.7} />
    </g>

    {/* ── the briefcase set down beside the white-collar figure ── */}
    <g transform="translate(66 100) scale(0.62)">
      <path d="M-22 -8 H22 C24.4 -8 26 -6.4 26 -4 V18 C26 20.6 24.4 22 22 22 H-22 C-24.4 22 -26 20.6 -26 18 V-4 C-26 -6.4 -24.4 -8 -22 -8 Z" strokeWidth={1.9} fill="#A9744F" />
      <path d="M-9 -8 C-9 -16 -5 -19 0 -19 C5 -19 9 -16 9 -8" strokeWidth={1.7} />
      <path d="M-2 6 H2" strokeWidth={1.8} />
      <path d="M-22 -3 L-19 18 M-16 -3 L-13 18 M18 -5 L21 18" strokeWidth={1.1} opacity={0.6} />
    </g>

    {/* ── grain dots, the ink speckle every doodle carries ── */}
    <g fill="#4B5563" stroke="none" opacity={0.5}>
      <circle cx="132" cy="90" r="0.9" />
      <circle cx="170" cy="94" r="0.8" />
      <circle cx="120" cy="20" r="0.7" />
      <circle cx="222" cy="70" r="0.8" />
      <circle cx="80" cy="66" r="0.7" />
      <circle cx="246" cy="46" r="0.8" />
    </g>

    {/* ── the one dashed line of ground they both stand on ── */}
    <path d="M52 112 C120 118 200 118 252 110" strokeWidth={0.95} strokeDasharray="3 5" opacity={0.55} stroke="#9CA3AF" />
  </svg>
);

export default JobCategoryDoodle;

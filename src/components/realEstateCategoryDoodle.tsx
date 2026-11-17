// ── Keys changing hands in front of a house, for real-estate response tiles ───
// The moment a property changes owner, drawn as characters: a house with its
// roof, door and window on the left, two figures meeting over the keys in the
// middle, sparks off the keyring and one dashed plot line under the lot. Same
// ink language as the jobs doodle — one weight family, hatching for shadow,
// grain dots and sparks between the shapes. The caller sizes and tints it.
export const RealEstateCategoryDoodle = ({ className = "" }: { className?: string }) => (
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
    {/* ── the house: walls, roof, door and one lit window ── */}
    <g>
      <path d="M40 62 H112 V102 H40 Z" fill="#F7F1E8" stroke="none" />
      <path d="M40 62 H112 V102" strokeWidth={1.75} />
      <path d="M32 62 L76 30 L120 62 Z" strokeWidth={1.8} fill="#8C4A32" />
      <path d="M64 62 V44 H76 V51" strokeWidth={1.3} opacity={0.8} />
      <path d="M112 62 V102 H40" strokeWidth={1.75} />
      <path d="M68 102 V80 H86 V102 Z" strokeWidth={1.5} fill="#800020" />
      <path d="M82 92 H84" strokeWidth={1.6} />
      <path d="M50 70 H62 V82 H50 Z" strokeWidth={1.35} fill="#CFEAF7" />
      <path d="M56 70 V82 M50 76 H62" strokeWidth={0.9} opacity={0.7} />
      <path d="M93 70 H105 V82 H93 Z" strokeWidth={1.35} fill="#CFEAF7" />
      <path d="M99 70 V82 M93 76 H105" strokeWidth={0.9} opacity={0.7} />
      {/* hatching on the shadow side of the wall and roof */}
      <path d="M44 66 L44 100 M48 66 L48 100 M52 66 L52 100" strokeWidth={0.8} opacity={0.4} />
      <path d="M40 57 L47 52 M50 57 L57 52 M60 57 L67 52" strokeWidth={0.8} opacity={0.4} />
      {/* a chimney with a curl of smoke */}
      <path d="M98 40 V30 H106 V46" strokeWidth={1.3} stroke="#A24B32" />
      <path d="M102 28 C99 22 106 18 103 12" strokeWidth={0.95} strokeDasharray="2 3.5" opacity={0.6} />
    </g>

    {/* ── two people meeting over the keys ── */}
    <g>
      {/* figure on the left: handing the keys over */}
      <circle cx="152" cy="54" r="10.5" strokeWidth={1.7} fill="#F6D7B8" />
      <path d="M148 65 V69 M156 65 V69" strokeWidth={1.1} />
      <path d="M141 69 C140 79 139 89 138 104" strokeWidth={1.65} />
      <path d="M163 69 C164 79 165 89 166 104" strokeWidth={1.65} />
      <path d="M162 72 C167 74 172 76 176 78" strokeWidth={1.4} />
      <path d="M142 76 L141 100 M146 74 L145 101 M159 74 L160 101" strokeWidth={0.8} opacity={0.45} />
      <path d="M138 104 C137 108 137 110 137 112 M166 104 C167 108 167 110 167 112" strokeWidth={1.4} />
      <path d="M133 112 H141 M163 112 H171" strokeWidth={1.4} />

      {/* figure on the right: taking them */}
      <circle cx="208" cy="54" r="10.5" strokeWidth={1.7} fill="#F6D7B8" />
      <path d="M204 65 V69 M212 65 V69" strokeWidth={1.1} />
      <path d="M197 69 C196 79 195 89 194 104" strokeWidth={1.65} />
      <path d="M219 69 C220 79 221 89 222 104" strokeWidth={1.65} />
      <path d="M198 72 C193 74 188 76 184 78" strokeWidth={1.4} />
      <path d="M198 76 L197 101 M202 74 L201 101 M215 74 L216 101" strokeWidth={0.8} opacity={0.45} />
      <path d="M194 104 C193 108 193 110 193 112 M222 104 C223 108 223 110 223 112" strokeWidth={1.4} />
      <path d="M189 112 H197 M219 112 H227" strokeWidth={1.4} />
    </g>

    {/* ── the keyring between their hands ── */}
    <g>
      <circle cx="180" cy="79" r="4.6" strokeWidth={1.5} stroke="#C9A227" />
      <path d="M184 79 H196" strokeWidth={1.6} stroke="#C9A227" />
      <path d="M191 79 V84 M195 79 V83" strokeWidth={1.4} stroke="#C9A227" />
      <path d="M176 76 C173 73 170 73 168 75" strokeWidth={1.1} opacity={0.75} />
    </g>

    {/* ── sparks: the keys finding a hand ── */}
    <g strokeWidth={1.15} opacity={0.9} stroke="#D97706">
      <path d="M180 62 V68 M177 65 H183" />
      <path d="M166 58 V62 M164 60 H168" opacity={0.75} />
      <path d="M196 58 V62 M194 60 H198" opacity={0.75} />
    </g>

    {/* ── grain dots, the ink speckle every doodle carries ── */}
    <g fill="#4B5563" stroke="none" opacity={0.5}>
      <circle cx="128" cy="88" r="0.9" />
      <circle cx="146" cy="24" r="0.7" />
      <circle cx="176" cy="100" r="0.8" />
      <circle cx="232" cy="76" r="0.8" />
      <circle cx="86" cy="86" r="0.7" />
      <circle cx="248" cy="40" r="0.8" />
    </g>

    {/* ── the dashed plot line both the house and the deal stand on ── */}
    <path d="M26 116 C100 121 210 121 262 112" strokeWidth={0.95} strokeDasharray="3 5" opacity={0.55} stroke="#9CA3AF" />
  </svg>
);

export default RealEstateCategoryDoodle;

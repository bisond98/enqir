// ── Two characters closing a deal, dressed for the category ──────────────────
// One drawing, not two: a pair shaking hands in the middle, with the category's
// own object set down beside them. The pair changes clothes with the category —
// formals and a safety cap for jobs, aprons and a toque for food, overalls and a
// cap for vehicles, scrubs and a stethoscope for health, ties for the desk
// categories, and a plain jacket when nothing else fits.
const INK = "#1F2937";
const SKIN = "#F6D7B8";
const MAROON = "#800020";
const AMBER = "#F5B301";
const SPARK = "#D97706";
const GROUND = "#9CA3AF";

type Group = "jobs" | "realestate" | "vehicles" | "tech" | "home" | "fashion" | "food" | "study" | "health" | "business" | "other";

const GROUP_BY_CATEGORY: Record<string, Group> = {
  jobs: "jobs", job: "jobs", service: "jobs", services: "jobs",
  "real-estate": "realestate", "real-estate-services": "realestate", property: "realestate", properties: "realestate",
  accommodations: "realestate", "construction-renovation": "realestate",
  car: "vehicles", bike: "vehicles", vehicles: "vehicles", bicycles: "vehicles", "transportation-logistics": "vehicles",
  electronics: "tech", mobiles: "tech", laptops: "tech", "audio-headphones": "tech", camera: "tech",
  photography: "tech", "gaming-recreation": "tech", technology: "tech", "digital-it-services": "tech",
  "security-safety": "tech", appliances: "tech", "renewable-energy": "tech",
  home: "home", furniture: "home", "kitchen-dining": "home", "garden-outdoor": "home",
  fashion: "fashion", thrift: "fashion", sneakers: "fashion", watches: "fashion", "jewelry-accessories": "fashion",
  "bags-luggage": "fashion", vintage: "fashion", antiques: "fashion", collectibles: "fashion", art: "fashion",
  "food-beverage": "food", "agriculture-farming": "food", pets: "food",
  "books-publications": "study", "education-training": "study", "tutoring-lessons": "study",
  "health-beauty": "health", "beauty-products": "health", "medical-equipment": "health",
  "fitness-gym-equipment": "health", "sports-outdoor": "health",
  business: "business", personal: "business", "legal-financial": "business", "marketing-advertising": "business",
  "insurance-services": "business", "government-public": "business", "non-profit-charity": "business",
  "events-entertainment": "business", "entertainment-media": "business", "wedding-events": "business",
  "travel-tourism": "business", "office-supplies": "business", "tools-equipment": "business",
  "raw-materials-industrial": "business", "waste-management": "business", "musical-instruments": "business",
  "musical-accessories": "business", "musical-services": "business", souvenir: "business", memorabilia: "business",
  "childcare-family": "other", other: "other",
};

const groupFor = (category?: string | null): Group =>
  GROUP_BY_CATEGORY[String(category || "").trim().toLowerCase()] ?? "other";

/** The object that belongs to the category, parked beside the pair. */
const CategoryObject = ({ group }: { group: Group }) => {
  switch (group) {
    case "jobs":
      return (
        <g transform="translate(62 76) scale(2.4)">
          <path d="M-14 12 C-14 -6 -5 -16 0 -16 C5 -16 14 -6 14 12" strokeWidth={1.7} fill={AMBER} />
          <path d="M-20 12 C-13 18 13 18 20 12" strokeWidth={1.4} stroke="#D99A00" />
          <path d="M-4 6 H4" strokeWidth={1.4} />
        </g>
      );
    case "realestate":
      return (
        <g transform="translate(62 78) scale(1.9)">
          <path d="M-26 6 L0 -16 L26 6 Z" strokeWidth={1.6} fill="#8C4A32" />
          <path d="M-20 6 H20 V18 H-20 Z" strokeWidth={1.5} fill="#F7F1E8" />
          <path d="M-5 18 V8 H5 V18" strokeWidth={1.3} fill={MAROON} />
          <path d="M-26 20 H26" strokeWidth={1.1} opacity={0.6} />
        </g>
      );
    case "vehicles":
      return (
        <g transform="translate(62 80) scale(2.4)">
          <path d="M-26 4 H-14 L-8 -8 H10 L16 4 H26 V12 H20" strokeWidth={1.6} />
          <circle cx="-8" cy="13" r="6" strokeWidth={1.5} fill="#E5E7EB" />
          <circle cx="16" cy="13" r="6" strokeWidth={1.5} fill="#E5E7EB" />
          <path d="M-14 12 H10" strokeWidth={1.2} />
        </g>
      );
    case "tech":
      return (
        <g transform="translate(62 76) scale(2.1)">
          <path d="M-12 -14 H12 V16 H-12 Z" strokeWidth={1.6} fill="#E0F2FE" />
          <path d="M-6 -6 H6 M-6 0 H6 M-6 6 H2" strokeWidth={1} strokeDasharray="2 3" opacity={0.85} />
        </g>
      );
    case "home":
      return (
        <g transform="translate(62 82) scale(1.9)">
          <path d="M-24 -8 H24 V8 C24 11 21 13 18 13 H-18 C-21 13 -24 11 -24 8 Z" strokeWidth={1.6} fill="#F3E8DC" />
          <path d="M-24 0 H24" strokeWidth={1.2} />
          <path d="M-18 13 V18 M18 13 V18" strokeWidth={1.4} />
          <path d="M-18 -8 C-18 -14 -13 -17 -8 -17 H8 C13 -17 18 -14 18 -8" strokeWidth={1.4} />
        </g>
      );
    case "fashion":
      return (
        <g transform="translate(62 76) scale(2.0)">
          <path d="M0 -14 L-14 -8 L-19 2 L-10 5 L-6 -1 V18 H6 V-1 L10 5 L19 2 L14 -8 Z" strokeWidth={1.6} fill="#F7F1E8" />
          <path d="M-5 -11 L0 -6 L5 -11" strokeWidth={1.3} fill={MAROON} />
        </g>
      );
    case "food":
      return (
        <g transform="translate(62 82) scale(1.9)">
          <path d="M-20 -6 H20 L15 18 H-15 Z" strokeWidth={1.6} fill="#D8B98A" />
          <path d="M-20 -6 C-12 -18 12 -18 20 -6" strokeWidth={1.4} />
          <circle cx="-8" cy="-8" r="6" strokeWidth={1.3} fill="#E0663F" />
          <circle cx="6" cy="-10" r="6" strokeWidth={1.3} fill="#8FB56A" />
        </g>
      );
    case "study":
      return (
        <g transform="translate(62 78) scale(1.8)">
          <path d="M0 -12 C-8 -18 -18 -19 -26 -17 V14 C-18 12 -8 13 0 18 C8 13 18 12 26 14 V-17 C18 -19 8 -18 0 -12 Z" strokeWidth={1.6} fill="#FBF6EC" />
          <path d="M0 -12 V18" strokeWidth={1.3} />
        </g>
      );
    case "health":
      return (
        <g transform="translate(62 78) scale(1.9)">
          <path d="M0 16 C-18 4 -26 -4 -22 -11 C-18 -18 -6 -17 0 -8 C6 -17 18 -18 22 -11 C26 -4 18 4 0 16 Z" strokeWidth={1.6} fill="#F7C7CC" />
          <path d="M-12 -6 H-4 L-1 -11 L4 0 L7 -6 H12" strokeWidth={1.4} stroke={MAROON} />
        </g>
      );
    case "business":
      return (
        <g transform="translate(62 80) scale(2.3)">
          <path d="M-22 -14 H18 V14 H-22 Z" strokeWidth={1.6} fill="#FFFFFF" />
          <path d="M-16 10 V0 M-8 10 V-6 M0 10 V-2 M8 10 V-10" strokeWidth={2} stroke={MAROON} />
        </g>
      );
    default:
      return (
        <g transform="translate(62 80) scale(2.0)">
          <path d="M-16 -6 H16 C18 -6 19 -5 19 -3 V14 C19 16 18 17 16 17 H-16 C-18 17 -19 16 -19 14 V-3 C-19 -5 -18 -6 -16 -6 Z" strokeWidth={1.6} fill="#A9744F" />
          <path d="M-6 -6 C-6 -12 -3 -15 0 -15 C3 -15 6 -12 6 -6" strokeWidth={1.4} />
        </g>
      );
  }
};

/** Headwear that suits the category: safety cap, toque, cap, or none. */
const Headwear = ({ group }: { group: Group }) => {
  if (group === "jobs")
    return (
      <g>
        <path d="M200 32 C200 22 206 16 212 16 C218 16 224 22 224 32" strokeWidth={1.7} fill={AMBER} />
        <path d="M194 32 C201 37 223 37 230 32" strokeWidth={1.4} stroke="#D99A00" />
      </g>
    );
  if (group === "food")
    return (
      <g>
        <path d="M200 26 C193 26 190 19 196 15 C192 8 200 2 207 6 C210 -1 221 0 223 7 C230 4 236 11 232 17 C237 22 233 28 226 28 Z" strokeWidth={1.6} fill="#FFFFFF" />
        <path d="M200 28 H224" strokeWidth={1.4} />
      </g>
    );
  if (group === "vehicles" || group === "tech")
    return (
      <g>
        <path d="M199 32 C199 22 205 17 212 17 C219 17 225 22 225 32" strokeWidth={1.6} fill="#2F6FB0" />
        <path d="M199 32 H231" strokeWidth={1.5} stroke="#1E4E79" />
      </g>
    );
  if (group === "health")
    return (
      <g>
        <path d="M200 31 C200 22 205 17 212 17 C219 17 224 22 224 31" strokeWidth={1.5} fill="#CFEAF7" />
      </g>
    );
  return null;
};

export const DealPairCategoryDoodle = ({ category, className = "", showObject = true }: { category?: string | null; className?: string; showObject?: boolean }) => {
  const group = groupFor(category);
  const formal = ["jobs", "realestate", "business", "study", "tech", "health"].includes(group);

  return (
    <svg
      viewBox="0 0 330 124"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* the category's own object, set down large on the left */}
      {showObject && (
        <g>
          <CategoryObject group={group} />
        </g>
      )}

      {/* the pair, drawn smaller so the category object leads */}
      <g transform="translate(222 70) scale(0.9) translate(-186 -70)">
      {/* left character — the one making the offer */}
      <g>
        <circle cx="150" cy="42" r="11" strokeWidth={1.7} fill={SKIN} />
        <path d="M146 53 V57 M154 53 V57" strokeWidth={1.1} />
        <circle cx="144" cy="47" r="1.7" fill="#F0A9A0" stroke="none" opacity={0.85} />
        <circle cx="156" cy="47" r="1.7" fill="#F0A9A0" stroke="none" opacity={0.85} />
        {formal ? (
          <>
            <path d="M143 55 L150 62 L157 55" strokeWidth={1.25} />
            <path d="M150 62 L147 70 L150 78 L153 70 Z" strokeWidth={1.2} fill={MAROON} stroke={MAROON} />
          </>
        ) : (
          <path d="M143 56 C147 59 153 59 157 56" strokeWidth={1.25} />
        )}
        <path d="M139 57 C137 67 136 77 135 92 H165 C164 77 163 67 161 57 Z" fill="#E8EEF7" stroke="none" />
        <path d="M139 57 C137 67 136 77 135 92" strokeWidth={1.65} />
        <path d="M161 57 C163 67 164 77 165 92" strokeWidth={1.65} />
        <path d="M160 60 C166 62 172 64 177 66" strokeWidth={1.4} />
        <path d="M136 64 L135 89 M141 62 L140 90 M159 62 L160 90" strokeWidth={0.8} opacity={0.45} />
        <path d="M135 92 C134 96 134 99 134 101 M165 92 C166 96 166 99 166 101" strokeWidth={1.35} />
        <path d="M129 101 H139 M161 101 H171" strokeWidth={1.9} stroke="#111827" />
      </g>

      {/* right character — the one taking it on */}
      <g>
        <circle cx="212" cy="44" r="10.5" strokeWidth={1.7} fill={SKIN} />
        <path d="M208 54 V58 M216 54 V58" strokeWidth={1.1} />
        <circle cx="206" cy="49" r="1.6" fill="#F0A9A0" stroke="none" opacity={0.85} />
        <circle cx="218" cy="49" r="1.6" fill="#F0A9A0" stroke="none" opacity={0.85} />
        {group === "vehicles" ? (
          <>
            <path d="M203 56 L206 74 M217 56 L214 74" strokeWidth={1.15} stroke="#1E4E79" />
            <path d="M206 70 H217" strokeWidth={1.1} stroke="#1E4E79" />
          </>
        ) : (
          <path d="M204 57 C208 60 216 60 220 57" strokeWidth={1.2} />
        )}
        <path d="M201 58 C199 68 198 78 197 93 H227 C226 78 225 68 223 58 Z" fill="#F3E8DC" stroke="none" />
        <path d="M201 58 C199 68 198 78 197 93" strokeWidth={1.65} />
        <path d="M223 58 C225 68 226 78 227 93" strokeWidth={1.65} />
        <path d="M202 61 C196 63 190 65 185 66" strokeWidth={1.4} />
        <path d="M198 65 L197 90 M222 65 L223 90" strokeWidth={0.8} opacity={0.45} />
        <path d="M197 93 C196 97 196 100 196 102 M227 93 C228 97 228 100 228 102" strokeWidth={1.35} />
        <path d="M191 102 H201 M223 102 H233" strokeWidth={1.9} stroke="#6B4A2F" />
        <Headwear group={group} />
      </g>

      {/* the handshake that ties both sides together */}
      <g>
        <path d="M175 63 V74" strokeWidth={1.2} />
        <path d="M187 63 V74" strokeWidth={1.2} />
        <path d="M175 66 C178 61 183 60 186 64 C189 68 186 73 182 72 C179 71 178 69 177 67" strokeWidth={1.55} />
        <path d="M179 61 C182 58 186 59 187 62" strokeWidth={1.25} />
      </g>
      </g>

      {/* sparks between the shifts */}
      <g strokeWidth={1.15} opacity={0.9} stroke={SPARK}>
        <path d="M181 48 V54 M178 51 H184" />
        <path d="M168 44 V48 M166 46 H170" opacity={0.75} />
        <path d="M196 44 V48 M194 46 H198" opacity={0.75} />
      </g>

      {/* grain dots */}
      <g fill="#4B5563" stroke="none" opacity={0.5}>
        <circle cx="120" cy="92" r="0.9" />
        <circle cx="244" cy="80" r="0.8" />
        <circle cx="96" cy="40" r="0.7" />
        <circle cx="268" cy="46" r="0.8" />
      </g>

      {/* the dashed ground they stand on */}
      <path d="M20 112 C100 118 220 118 300 108" strokeWidth={0.95} strokeDasharray="3 5" opacity={0.55} stroke={GROUND} />
    </svg>
  );
};

export default DealPairCategoryDoodle;

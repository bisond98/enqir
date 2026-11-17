// ── Doodles for every enquiry category on the sell-response tiles ────────────
// Each piece is drawn in the app's hand: one ink outline colour (#1F2937), a few
// apt fills, hatching for shadow, amber sparks and grey grain dots, and a single
// dashed ground line. Every drawing shares the same 300×124 canvas so the tiles
// keep one rhythm, and the caller sizes / dulls it with a single class.
import { JobCategoryDoodle } from "./jobCategoryDoodle";
import { RealEstateCategoryDoodle } from "./realEstateCategoryDoodle";

const INK = "#1F2937";
const SKIN = "#F6D7B8";
const MAROON = "#800020";
const AMBER = "#F5B301";
const SPARK = "#D97706";
const GROUND = "#9CA3AF";

type DoodleProps = { className?: string };

/** Shared wrapper so every doodle keeps the same canvas and ink language. */
const Scene = ({ className, children }: DoodleProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 300 124"
    preserveAspectRatio="xMidYMax meet"
    className={className}
    fill="none"
    stroke={INK}
    strokeWidth={1.45}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
    <g strokeWidth={1.15} opacity={0.9} stroke={SPARK}>
      <path d="M150 22 V28 M147 25 H153" />
      <path d="M236 34 V39 M233.5 36.5 H238.5" />
    </g>
    <g fill="#4B5563" stroke="none" opacity={0.5}>
      <circle cx="120" cy="92" r="0.9" />
      <circle cx="196" cy="96" r="0.8" />
      <circle cx="252" cy="70" r="0.8" />
    </g>
    <path d="M40 114 C110 120 210 120 266 110" strokeWidth={0.95} strokeDasharray="3 5" opacity={0.55} stroke={GROUND} />
  </svg>
);

/** Vehicles: a little car, headlights on. */
export const VehicleDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M64 84 H112 L124 58 H196 L214 84 H246 V98 H228" strokeWidth={1.8} />
      <path d="M112 84 C112 72 120 58 132 58 M196 58 C206 60 212 70 214 84" strokeWidth={1.4} />
      <path d="M126 76 H206" strokeWidth={1.3} />
      <path d="M138 62 H190" strokeWidth={1.1} opacity={0.7} />
      <path d="M64 98 H84" strokeWidth={1.6} />
      <circle cx="112" cy="98" r="13" strokeWidth={1.8} fill="#E5E7EB" />
      <circle cx="228" cy="98" r="13" strokeWidth={1.8} fill="#E5E7EB" />
      <circle cx="112" cy="98" r="4.5" strokeWidth={1.3} />
      <circle cx="228" cy="98" r="4.5" strokeWidth={1.3} />
      <path d="M240 72 H248 V80 H240" strokeWidth={1.5} fill={AMBER} />
      <path d="M70 78 C74 76 80 76 84 80" strokeWidth={1.2} opacity={0.7} />
      <path d="M180 64 L184 76 M192 64 L196 76" strokeWidth={0.85} opacity={0.5} />
    </g>
  </Scene>
);

/** Electronics, phones, laptops, gaming, cameras: a phone and a screen. */
export const TechDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M104 40 H152 V104 H104 Z" strokeWidth={1.8} fill="#E0F2FE" />
      <path d="M114 36 H142" strokeWidth={1.4} />
      <path d="M112 52 H144 M112 62 H136 M112 72 H144 M112 82 H128" strokeWidth={1.05} strokeDasharray="2 3.5" opacity={0.8} />
      <circle cx="128" cy="95" r="3.2" strokeWidth={1.3} />
      <path d="M176 56 H236 V104 H176 Z" strokeWidth={1.8} fill="#FFFFFF" />
      <path d="M168 104 H244 L238 110 H174 Z" strokeWidth={1.4} />
      <path d="M184 68 H218 M184 78 H226 M184 88 H206" strokeWidth={1.1} strokeDasharray="2 3.5" opacity={0.85} />
      <path d="M186 50 C190 44 198 44 202 50" strokeWidth={1.2} opacity={0.7} />
    </g>
  </Scene>
);

/** Home, furniture, appliances: a sofa with its lamp and plant. */
export const HomeDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M96 62 H204 V92 C204 96 200 99 195 99 H105 C100 99 96 96 96 92 Z" strokeWidth={1.8} fill="#F3E8DC" />
      <path d="M96 74 H204" strokeWidth={1.3} />
      <path d="M112 62 C112 52 120 46 132 46 H168 C180 46 188 52 188 62" strokeWidth={1.6} />
      <path d="M108 99 V108 M192 99 V108" strokeWidth={1.6} />
      <path d="M110 66 L112 96 M124 66 L126 96 M172 66 L170 96 M186 66 L184 96" strokeWidth={0.85} opacity={0.45} />
      <path d="M96 80 C90 80 86 84 86 90 V99 H96" strokeWidth={1.5} fill="#EADFD2" />
      <path d="M204 80 C210 80 214 84 214 90 V99 H204" strokeWidth={1.5} fill="#EADFD2" />
      <path d="M232 100 V66 M232 66 L218 44 M232 66 L246 44" strokeWidth={1.5} />
      <path d="M214 44 H232 L246 44" strokeWidth={1.3} />
      <path d="M70 100 V78 M70 78 C62 74 62 62 70 60 C78 62 78 74 70 78" strokeWidth={1.4} fill="#86A98A" />
    </g>
  </Scene>
);

/** Fashion, thrift, sneakers, watches, jewellery: a shirt on its hanger. */
export const FashionDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M150 30 L150 42" strokeWidth={1.4} />
      <path d="M150 30 C146 26 140 30 144 35 L150 42 L156 35 C160 30 154 26 150 30" strokeWidth={1.3} />
      <path d="M150 42 L118 56 L108 76 L126 82 L134 70 V104 H166 V70 L174 82 L192 76 L182 56 Z" strokeWidth={1.8} fill="#F7F1E8" />
      <path d="M138 46 L150 56 L162 46" strokeWidth={1.4} fill={MAROON} />
      <path d="M136 72 L137 100 M164 72 L163 100" strokeWidth={0.85} opacity={0.45} />
      <path d="M206 60 L226 60 L230 66 L226 72 L206 72 Z" strokeWidth={1.4} fill={AMBER} />
      <path d="M206 66 H214" strokeWidth={1} opacity={0.7} />
      <path d="M226 60 L220 52" strokeWidth={1.1} />
    </g>
  </Scene>
);

/** Food, agriculture, garden: a basket of the day's produce. */
export const FoodDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M104 66 H196 L186 104 H114 Z" strokeWidth={1.8} fill="#D8B98A" />
      <path d="M104 66 C118 44 182 44 196 66" strokeWidth={1.6} />
      <path d="M118 74 L122 104 M134 72 V104 M150 70 V104 M166 72 V104 M182 74 L178 104" strokeWidth={0.9} opacity={0.55} />
      <circle cx="126" cy="60" r="10" strokeWidth={1.5} fill="#E0663F" />
      <circle cx="152" cy="54" r="11" strokeWidth={1.5} fill="#8FB56A" />
      <circle cx="176" cy="60" r="9" strokeWidth={1.5} fill="#E8B23C" />
      <path d="M110 44 C114 36 122 36 126 44 M166 40 C170 32 178 32 182 40" strokeWidth={1.2} opacity={0.6} />
      <path d="M216 104 V70 M216 70 C208 66 208 54 216 52 C224 54 224 66 216 70" strokeWidth={1.4} fill="#7FA37A" />
    </g>
  </Scene>
);

/** Education, tutoring, books: an open book with a pencil. */
export const StudyDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M150 54 C138 44 120 42 104 46 V94 C120 90 138 92 150 102 C162 92 180 90 196 94 V46 C180 42 162 44 150 54 Z" strokeWidth={1.8} fill="#FBF6EC" />
      <path d="M150 54 V102" strokeWidth={1.5} />
      <path d="M114 58 C124 56 136 58 142 64 M114 70 C124 68 136 70 142 76 M114 82 C124 80 136 82 142 88" strokeWidth={1.05} strokeDasharray="2 3.5" opacity={0.8} />
      <path d="M158 64 C164 58 176 56 186 58 M158 76 C164 70 176 68 186 70" strokeWidth={1.05} strokeDasharray="2 3.5" opacity={0.8} />
      <path d="M214 40 L232 58 L222 68 L204 50 Z" strokeWidth={1.5} fill={AMBER} />
      <path d="M204 50 L198 60 L208 56" strokeWidth={1.3} />
      <path d="M222 68 L228 74" strokeWidth={1.5} />
    </g>
  </Scene>
);

/** Health, beauty, medical: a heart with its steady line. */
export const HealthDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M150 100 C112 78 96 62 104 48 C112 34 134 36 150 54 C166 36 188 34 196 48 C204 62 188 78 150 100 Z" strokeWidth={1.8} fill="#F7C7CC" />
      <path d="M112 66 H136 L142 56 L152 78 L160 66 H188" strokeWidth={1.6} stroke={MAROON} />
      <path d="M126 44 C130 40 136 40 140 44" strokeWidth={1.1} opacity={0.6} />
      <path d="M228 50 V74 M216 62 H240" strokeWidth={2} stroke={MAROON} />
    </g>
  </Scene>
);

/** Business, office supplies, marketing, legal: a chart and its coin. */
export const BusinessDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <path d="M96 46 H196 V104 H96 Z" strokeWidth={1.8} fill="#FFFFFF" />
      <path d="M108 94 V76 M124 94 V64 M140 94 V82 M156 94 V54 M172 94 V70" strokeWidth={2} stroke={MAROON} />
      <path d="M104 60 L128 52 L150 58 L184 44" strokeWidth={1.3} strokeDasharray="3 4" opacity={0.8} />
      <path d="M96 104 H196" strokeWidth={1.4} />
      <circle cx="222" cy="72" r="20" strokeWidth={1.8} fill={AMBER} />
      <path d="M216 64 C216 60 228 60 228 65 C228 71 216 70 216 76 C216 81 228 81 228 77" strokeWidth={1.5} />
      <path d="M222 56 V88" strokeWidth={1.3} />
    </g>
  </Scene>
);

/** Anything else: one smiling character, pleased to be here. */
export const SmilingCharacterDoodle = ({ className }: DoodleProps) => (
  <Scene className={className}>
    <g>
      <circle cx="150" cy="56" r="24" strokeWidth={1.9} fill={SKIN} />
      <path d="M138 52 C141 49 145 49 148 52 M152 52 C155 49 159 49 162 52" strokeWidth={1.5} />
      <path d="M138 66 C143 74 157 74 162 66" strokeWidth={1.7} />
      <path d="M143 44 C145 40 149 39 152 42" strokeWidth={1.1} opacity={0.5} />
      <path d="M150 80 V92" strokeWidth={1.8} />
      <path d="M150 92 C142 100 136 104 128 106 M150 92 C158 100 164 104 172 106" strokeWidth={1.7} />
      <path d="M150 86 C140 84 132 86 126 92 M150 86 C160 84 168 86 174 92" strokeWidth={1.6} />
      <circle cx="124" cy="94" r="4" strokeWidth={1.4} fill={SKIN} />
      <circle cx="176" cy="94" r="4" strokeWidth={1.4} fill={SKIN} />
      <path d="M126 104 C134 108 142 110 150 110 M174 104 C166 108 158 110 150 110" strokeWidth={1.5} />
      <path d="M118 112 H136 M164 112 H182" strokeWidth={1.5} stroke={MAROON} />
      <path d="M196 46 C200 42 205 42 209 46 M94 46 C90 42 85 42 81 46" strokeWidth={1.3} opacity={0.6} />
    </g>
  </Scene>
);

const BY_CATEGORY: Record<string, React.FC<DoodleProps>> = {
  // work
  'jobs': JobCategoryDoodle,
  'job': JobCategoryDoodle,
  'service': JobCategoryDoodle,
  'services': JobCategoryDoodle,
  'digital-it-services': TechDoodle,
  'education-training': StudyDoodle,
  'tutoring-lessons': StudyDoodle,
  'health-beauty': HealthDoodle,
  'beauty-products': HealthDoodle,
  'medical-equipment': HealthDoodle,
  'fitness-gym-equipment': HealthDoodle,
  'childcare-family': SmilingCharacterDoodle,
  // property
  'real-estate': RealEstateCategoryDoodle,
  'real-estate-services': RealEstateCategoryDoodle,
  'property': RealEstateCategoryDoodle,
  'properties': RealEstateCategoryDoodle,
  'accommodations': RealEstateCategoryDoodle,
  'construction-renovation': RealEstateCategoryDoodle,
  // wheels
  'car': VehicleDoodle,
  'bike': VehicleDoodle,
  'vehicles': VehicleDoodle,
  'bicycles': VehicleDoodle,
  'transportation-logistics': VehicleDoodle,
  // tech
  'electronics': TechDoodle,
  'mobiles': TechDoodle,
  'laptops': TechDoodle,
  'audio-headphones': TechDoodle,
  'camera': TechDoodle,
  'photography': TechDoodle,
  'gaming-recreation': TechDoodle,
  'technology': TechDoodle,
  'renewable-energy': TechDoodle,
  'security-safety': TechDoodle,
  'appliances': TechDoodle,
  // home
  'home': HomeDoodle,
  'furniture': HomeDoodle,
  'kitchen-dining': HomeDoodle,
  'garden-outdoor': HomeDoodle,
  'office-supplies': BusinessDoodle,
  'tools-equipment': BusinessDoodle,
  'raw-materials-industrial': BusinessDoodle,
  'waste-management': BusinessDoodle,
  // style
  'fashion': FashionDoodle,
  'thrift': FashionDoodle,
  'sneakers': FashionDoodle,
  'watches': FashionDoodle,
  'jewelry-accessories': FashionDoodle,
  'bags-luggage': FashionDoodle,
  'vintage': FashionDoodle,
  'antiques': FashionDoodle,
  'collectibles': FashionDoodle,
  'memorabilia': FashionDoodle,
  'souvenir': FashionDoodle,
  'art': FashionDoodle,
  // food and field
  'food-beverage': FoodDoodle,
  'agriculture-farming': FoodDoodle,
  'pets': FoodDoodle,
  // desk work
  'business': BusinessDoodle,
  'personal': BusinessDoodle,
  'legal-financial': BusinessDoodle,
  'marketing-advertising': BusinessDoodle,
  'insurance-services': BusinessDoodle,
  'government-public': BusinessDoodle,
  'non-profit-charity': BusinessDoodle,
  'events-entertainment': BusinessDoodle,
  'entertainment-media': BusinessDoodle,
  'wedding-events': BusinessDoodle,
  'travel-tourism': BusinessDoodle,
  'books-publications': StudyDoodle,
  'musical-instruments': BusinessDoodle,
  'musical-accessories': BusinessDoodle,
  'musical-services': BusinessDoodle,
  'sports-outdoor': HealthDoodle,
};

/** Picks the doodle that fits the enquiry's category; a smiling character otherwise. */
export const CategoryDoodle = ({ category, className }: { category?: string | null; className?: string }) => {
  const key = String(category || "").trim().toLowerCase();
  const Doodle = BY_CATEGORY[key] ?? SmilingCharacterDoodle;
  return <Doodle className={className} />;
};

export default CategoryDoodle;

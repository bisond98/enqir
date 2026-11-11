// Laptop catalogue for the post-enquiry description step.
//
// Brand -> every model that brand sells/sold in India -> the storage sizes that
// model came in. Processors hang off the brand (Apple M-series, Intel / AMD /
// Snapdragon for the Windows brands). Each dropdown ends with an "Other" entry
// that unlocks a free-text box, so a model, chip or size that is not listed can
// still be recorded instead of being lost.
//
// Shared storage ladders keep the data honest without repeating 20 arrays:
// entry-level, mainstream, ultrabook, gaming/creator and Apple's tiers.

export interface LaptopModelEntry {
  name: string;
  storage: string[];
}

export interface LaptopBrandEntry {
  processors: string[];
  models: LaptopModelEntry[];
}

// ---- storage ladders -------------------------------------------------------
const S_ENTRY = ['128 GB', '256 GB', '512 GB', '1 TB'];
const S_MAINSTREAM = ['256 GB', '512 GB', '1 TB', '2 TB'];
const S_ULTRABOOK = ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'];
const S_GAMING = ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'];
const S_CREATOR = ['512 GB', '1 TB', '2 TB', '4 TB', '8 TB'];
const S_MAC_AIR = ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'];
const S_MAC_PRO = ['512 GB', '1 TB', '2 TB', '4 TB', '8 TB'];
const S_ALL = ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB'];

// ---- processor pools -------------------------------------------------------
const INTEL_CORE = ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9'];
const INTEL_BY_GEN = [
  '10th Gen Intel Core i5', '10th Gen Intel Core i7',
  '11th Gen Intel Core i3', '11th Gen Intel Core i5', '11th Gen Intel Core i7',
  '12th Gen Intel Core i3', '12th Gen Intel Core i5', '12th Gen Intel Core i7', '12th Gen Intel Core i9',
  '13th Gen Intel Core i5', '13th Gen Intel Core i7', '13th Gen Intel Core i9',
  '14th Gen Intel Core i5', '14th Gen Intel Core i7', '14th Gen Intel Core i9',
];
const INTEL_ULTRA = ['Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9'];
const AMD = [
  'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
  'AMD Ryzen 5 5000 Series', 'AMD Ryzen 7 5000 Series',
  'AMD Ryzen 5 7000 Series', 'AMD Ryzen 7 7000 Series', 'AMD Ryzen 9 7000 Series',
  'AMD Ryzen AI 5', 'AMD Ryzen AI 7', 'AMD Ryzen AI 9',
];
const SNAPDRAGON = ['Snapdragon X Plus', 'Snapdragon X Elite', 'Snapdragon X X1P-42-100'];
const APPLE_SILICON = [
  'Apple M1', 'Apple M1 Pro', 'Apple M1 Max',
  'Apple M2', 'Apple M2 Pro', 'Apple M2 Max',
  'Apple M3', 'Apple M3 Pro', 'Apple M3 Max',
  'Apple M4', 'Apple M4 Pro', 'Apple M4 Max',
  'Apple M5',
];

const uniq = (list: string[]) => Array.from(new Set(list));
const windowsChips = uniq([...INTEL_CORE, ...INTEL_BY_GEN, ...INTEL_ULTRA, ...AMD, ...SNAPDRAGON]);

export const LAPTOP_CATALOG: Record<string, LaptopBrandEntry> = {
  Apple: {
    processors: APPLE_SILICON,
    models: [
      { name: 'MacBook Air 13" (M1)', storage: S_MAC_AIR },
      { name: 'MacBook Air 13" (M2)', storage: S_MAC_AIR },
      { name: 'MacBook Air 13" (M3)', storage: S_MAC_AIR },
      { name: 'MacBook Air 13" (M4)', storage: S_MAC_AIR },
      { name: 'MacBook Air 15" (M2)', storage: S_MAC_AIR },
      { name: 'MacBook Air 15" (M3)', storage: S_MAC_AIR },
      { name: 'MacBook Air 15" (M4)', storage: S_MAC_AIR },
      { name: 'MacBook Pro 13" (M1)', storage: S_MAC_AIR },
      { name: 'MacBook Pro 13" (M2)', storage: S_MAC_AIR },
      { name: 'MacBook Pro 14" (M1 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M2 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M3)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M3 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M4)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M4 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 14" (M5)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M1 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M2 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M3 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M4 Pro)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M4 Max)', storage: S_MAC_PRO },
      { name: 'MacBook Pro 16" (M5)', storage: S_MAC_PRO },
    ],
  },
  Dell: {
    processors: windowsChips,
    models: [
      { name: 'Inspiron 14', storage: S_MAINSTREAM },
      { name: 'Inspiron 14 Plus', storage: S_ULTRABOOK },
      { name: 'Inspiron 15', storage: S_MAINSTREAM },
      { name: 'Inspiron 16', storage: S_MAINSTREAM },
      { name: 'Inspiron 3520', storage: S_ENTRY },
      { name: 'Vostro 14', storage: S_MAINSTREAM },
      { name: 'Vostro 15', storage: S_MAINSTREAM },
      { name: 'Vostro 16', storage: S_MAINSTREAM },
      { name: 'Latitude 3440', storage: S_MAINSTREAM },
      { name: 'Latitude 5440', storage: S_ULTRABOOK },
      { name: 'Latitude 7440', storage: S_ULTRABOOK },
      { name: 'Latitude 9440', storage: S_ULTRABOOK },
      { name: 'Precision 3480', storage: S_CREATOR },
      { name: 'Precision 5480', storage: S_CREATOR },
      { name: 'XPS 13', storage: S_ULTRABOOK },
      { name: 'XPS 13 Plus', storage: S_ULTRABOOK },
      { name: 'XPS 14', storage: S_ULTRABOOK },
      { name: 'XPS 15', storage: S_CREATOR },
      { name: 'XPS 16', storage: S_CREATOR },
      { name: 'G15', storage: S_GAMING },
      { name: 'G16', storage: S_GAMING },
    ],
  },
  HP: {
    processors: windowsChips,
    models: [
      { name: 'HP 14', storage: S_ENTRY },
      { name: 'HP 15', storage: S_MAINSTREAM },
      { name: 'HP 17', storage: S_MAINSTREAM },
      { name: 'Pavilion 14', storage: S_MAINSTREAM },
      { name: 'Pavilion 15', storage: S_MAINSTREAM },
      { name: 'Pavilion Plus 14', storage: S_ULTRABOOK },
      { name: 'Pavilion x360 14', storage: S_MAINSTREAM },
      { name: 'Envy 14', storage: S_ULTRABOOK },
      { name: 'Envy x360 14', storage: S_ULTRABOOK },
      { name: 'Envy x360 15', storage: S_ULTRABOOK },
      { name: 'Spectre x360 13', storage: S_ULTRABOOK },
      { name: 'Spectre x360 14', storage: S_ULTRABOOK },
      { name: 'Spectre x360 16', storage: S_CREATOR },
      { name: 'ProBook 440', storage: S_MAINSTREAM },
      { name: 'ProBook 450', storage: S_MAINSTREAM },
      { name: 'EliteBook 840', storage: S_ULTRABOOK },
      { name: 'ZBook Firefly 14', storage: S_CREATOR },
      { name: 'Victus 15', storage: S_GAMING },
      { name: 'Victus 16', storage: S_GAMING },
      { name: 'Omen 16', storage: S_GAMING },
      { name: 'Omen Transcend 14', storage: S_GAMING },
    ],
  },
  Lenovo: {
    processors: windowsChips,
    models: [
      { name: 'IdeaPad 1', storage: S_ENTRY },
      { name: 'IdeaPad 3', storage: S_MAINSTREAM },
      { name: 'IdeaPad Slim 3', storage: S_MAINSTREAM },
      { name: 'IdeaPad Slim 5', storage: S_MAINSTREAM },
      { name: 'IdeaPad Slim 5x', storage: S_ULTRABOOK },
      { name: 'IdeaPad Gaming 3', storage: S_GAMING },
      { name: 'IdeaPad Pro 5', storage: S_GAMING },
      { name: 'ThinkBook 14', storage: S_MAINSTREAM },
      { name: 'ThinkBook 15', storage: S_MAINSTREAM },
      { name: 'ThinkPad E14', storage: S_MAINSTREAM },
      { name: 'ThinkPad E15', storage: S_MAINSTREAM },
      { name: 'ThinkPad L14', storage: S_MAINSTREAM },
      { name: 'ThinkPad T14', storage: S_ULTRABOOK },
      { name: 'ThinkPad T14s', storage: S_ULTRABOOK },
      { name: 'ThinkPad X1 Carbon', storage: S_ULTRABOOK },
      { name: 'Yoga Slim 6', storage: S_MAINSTREAM },
      { name: 'Yoga Slim 7', storage: S_ULTRABOOK },
      { name: 'Yoga Slim 7x', storage: S_ULTRABOOK },
      { name: 'Yoga 7i', storage: S_ULTRABOOK },
      { name: 'Yoga Pro 7', storage: S_CREATOR },
      { name: 'LOQ 15', storage: S_GAMING },
      { name: 'Legion 5', storage: S_GAMING },
      { name: 'Legion 5 Pro', storage: S_GAMING },
      { name: 'Legion Slim 5', storage: S_GAMING },
      { name: 'Legion Pro 5', storage: S_GAMING },
      { name: 'Legion 7', storage: S_CREATOR },
      { name: 'Legion Pro 7', storage: S_CREATOR },
    ],
  },
  Asus: {
    processors: windowsChips,
    models: [
      { name: 'VivoBook 14', storage: S_MAINSTREAM },
      { name: 'VivoBook 15', storage: S_MAINSTREAM },
      { name: 'VivoBook 16', storage: S_MAINSTREAM },
      { name: 'VivoBook S 14', storage: S_ULTRABOOK },
      { name: 'VivoBook S 15', storage: S_ULTRABOOK },
      { name: 'VivoBook Pro 15', storage: S_CREATOR },
      { name: 'VivoBook Pro 16X', storage: S_CREATOR },
      { name: 'Zenbook 13', storage: S_ULTRABOOK },
      { name: 'Zenbook 14', storage: S_ULTRABOOK },
      { name: 'Zenbook 14 OLED', storage: S_ULTRABOOK },
      { name: 'Zenbook 14X OLED', storage: S_ULTRABOOK },
      { name: 'Zenbook S 13 OLED', storage: S_ULTRABOOK },
      { name: 'Zenbook S 14', storage: S_ULTRABOOK },
      { name: 'Zenbook Duo', storage: S_ULTRABOOK },
      { name: 'ExpertBook B1', storage: S_MAINSTREAM },
      { name: 'ExpertBook B9', storage: S_ULTRABOOK },
      { name: 'ProArt Studiobook 16', storage: S_CREATOR },
      { name: 'TUF Gaming F15', storage: S_GAMING },
      { name: 'TUF Gaming F17', storage: S_GAMING },
      { name: 'TUF Gaming A15', storage: S_GAMING },
      { name: 'TUF Gaming A16', storage: S_GAMING },
      { name: 'ROG Strix G16', storage: S_GAMING },
      { name: 'ROG Strix G17', storage: S_GAMING },
      { name: 'ROG Strix Scar 16', storage: S_CREATOR },
      { name: 'ROG Zephyrus G14', storage: S_GAMING },
      { name: 'ROG Zephyrus G16', storage: S_GAMING },
      { name: 'ROG Zephyrus M16', storage: S_GAMING },
      { name: 'ROG Flow X13', storage: S_ULTRABOOK },
      { name: 'ROG Flow Z13', storage: S_ULTRABOOK },
    ],
  },
  Acer: {
    processors: uniq([...INTEL_CORE, ...INTEL_BY_GEN, ...INTEL_ULTRA, ...AMD]),
    models: [
      { name: 'Aspire 3', storage: S_ENTRY },
      { name: 'Aspire 5', storage: S_MAINSTREAM },
      { name: 'Aspire 7', storage: S_MAINSTREAM },
      { name: 'Aspire Lite', storage: S_MAINSTREAM },
      { name: 'Aspire Vero', storage: S_MAINSTREAM },
      { name: 'Swift 3', storage: S_MAINSTREAM },
      { name: 'Swift 5', storage: S_ULTRABOOK },
      { name: 'Swift Go 14', storage: S_ULTRABOOK },
      { name: 'Swift X 14', storage: S_CREATOR },
      { name: 'TravelMate P2', storage: S_MAINSTREAM },
      { name: 'TravelMate P4', storage: S_ULTRABOOK },
      { name: 'Extensa 15', storage: S_ENTRY },
      { name: 'Nitro V 15', storage: S_GAMING },
      { name: 'Nitro V 16', storage: S_GAMING },
      { name: 'Nitro 5', storage: S_GAMING },
      { name: 'Nitro 16', storage: S_GAMING },
      { name: 'Predator Helios Neo 16', storage: S_CREATOR },
      { name: 'Predator Helios 16', storage: S_CREATOR },
      { name: 'Predator Helios 18', storage: S_CREATOR },
      { name: 'Predator Triton 14', storage: S_CREATOR },
    ],
  },
  MSI: {
    processors: uniq([...INTEL_CORE, ...INTEL_BY_GEN, ...INTEL_ULTRA, ...AMD]),
    models: [
      { name: 'Modern 14', storage: S_MAINSTREAM },
      { name: 'Modern 15', storage: S_MAINSTREAM },
      { name: 'Prestige 14', storage: S_ULTRABOOK },
      { name: 'Prestige 16', storage: S_ULTRABOOK },
      { name: 'Summit E14', storage: S_ULTRABOOK },
      { name: 'Thin 15', storage: S_GAMING },
      { name: 'Thin GF63', storage: S_GAMING },
      { name: 'Katana 15', storage: S_GAMING },
      { name: 'Katana 17', storage: S_GAMING },
      { name: 'Cyborg 15', storage: S_GAMING },
      { name: 'Sword 16', storage: S_GAMING },
      { name: 'Sword 17', storage: S_GAMING },
      { name: 'Crosshair 16', storage: S_GAMING },
      { name: 'Pulse 15', storage: S_GAMING },
      { name: 'Pulse 17', storage: S_GAMING },
      { name: 'Vector 16', storage: S_CREATOR },
      { name: 'Stealth 14', storage: S_GAMING },
      { name: 'Stealth 16', storage: S_CREATOR },
      { name: 'Raider GE68', storage: S_CREATOR },
      { name: 'Raider GE78', storage: S_CREATOR },
      { name: 'Titan 18', storage: S_CREATOR },
    ],
  },
  'Microsoft Surface': {
    processors: uniq([...SNAPDRAGON, ...INTEL_ULTRA, 'Intel Core i5', 'Intel Core i7']),
    models: [
      { name: 'Surface Laptop Go 2', storage: ['128 GB', '256 GB'] },
      { name: 'Surface Laptop Go 3', storage: ['128 GB', '256 GB'] },
      { name: 'Surface Laptop 4', storage: S_ULTRABOOK },
      { name: 'Surface Laptop 5', storage: S_ULTRABOOK },
      { name: 'Surface Laptop 6', storage: S_ULTRABOOK },
      { name: 'Surface Laptop 7', storage: S_ULTRABOOK },
      { name: 'Surface Laptop Studio', storage: S_CREATOR },
      { name: 'Surface Laptop Studio 2', storage: S_CREATOR },
    ],
  },
  Samsung: {
    processors: uniq([...SNAPDRAGON, ...INTEL_ULTRA, 'Intel Core i5', 'Intel Core i7']),
    models: [
      { name: 'Galaxy Book Go', storage: ['128 GB'] },
      { name: 'Galaxy Book 2', storage: S_MAINSTREAM },
      { name: 'Galaxy Book 2 Pro', storage: S_ULTRABOOK },
      { name: 'Galaxy Book 3', storage: S_MAINSTREAM },
      { name: 'Galaxy Book 3 Pro', storage: S_ULTRABOOK },
      { name: 'Galaxy Book 3 Ultra', storage: S_CREATOR },
      { name: 'Galaxy Book 4', storage: S_MAINSTREAM },
      { name: 'Galaxy Book 4 Pro', storage: S_ULTRABOOK },
      { name: 'Galaxy Book 4 Ultra', storage: S_CREATOR },
      { name: 'Galaxy Book 4 Edge', storage: S_ULTRABOOK },
      { name: 'Galaxy Book 5 Pro', storage: S_ULTRABOOK },
    ],
  },
  Xiaomi: {
    processors: uniq(['Intel Core i5', 'Intel Core i7', 'Intel Core Ultra 5', 'Intel Core Ultra 7', ...AMD]),
    models: [
      { name: 'RedmiBook 15', storage: S_MAINSTREAM },
      { name: 'RedmiBook 15 Pro', storage: S_MAINSTREAM },
      { name: 'RedmiBook Pro 14', storage: S_ULTRABOOK },
      { name: 'RedmiBook Pro 15', storage: S_ULTRABOOK },
      { name: 'Mi Notebook 14', storage: S_MAINSTREAM },
      { name: 'Mi Notebook Ultra', storage: S_ULTRABOOK },
      { name: 'Mi Notebook Pro', storage: S_ULTRABOOK },
      { name: 'Xiaomi Book Pro 14', storage: S_ULTRABOOK },
    ],
  },
  Infinix: {
    processors: uniq([...INTEL_CORE, ...AMD]),
    models: [
      { name: 'INBook X1', storage: S_MAINSTREAM },
      { name: 'INBook X1 Slim', storage: S_MAINSTREAM },
      { name: 'INBook X2', storage: S_MAINSTREAM },
      { name: 'INBook Y1 Plus', storage: S_MAINSTREAM },
      { name: 'INBook Y1 Pro', storage: S_MAINSTREAM },
      { name: 'Zero Book', storage: S_ULTRABOOK },
      { name: 'Zero Book Ultra', storage: S_ULTRABOOK },
    ],
  },
  Alienware: {
    processors: uniq([...INTEL_CORE, ...INTEL_ULTRA, ...AMD]),
    models: [
      { name: 'm15 R7', storage: S_GAMING },
      { name: 'm16', storage: S_CREATOR },
      { name: 'm16 R2', storage: S_CREATOR },
      { name: 'm18', storage: S_CREATOR },
      { name: 'x14', storage: S_GAMING },
      { name: 'x16', storage: S_CREATOR },
      { name: 'Area-51m', storage: S_CREATOR },
    ],
  },
  Razer: {
    processors: uniq([...INTEL_CORE, ...INTEL_ULTRA, ...AMD]),
    models: [
      { name: 'Blade 14', storage: S_GAMING },
      { name: 'Blade 15', storage: S_GAMING },
      { name: 'Blade 16', storage: S_CREATOR },
      { name: 'Blade 17', storage: S_CREATOR },
      { name: 'Blade 18', storage: S_CREATOR },
    ],
  },
  Other: {
    processors: uniq([...APPLE_SILICON, ...windowsChips]),
    models: [{ name: 'Other model', storage: S_ALL }],
  },
};

export const LAPTOP_BRAND_OPTIONS = Object.keys(LAPTOP_CATALOG);

/** The "not listed" entry every dropdown offers, which opens a free-text box. */
export const LAPTOP_OTHER = 'Other';

export const getLaptopModels = (brand: string): string[] =>
  LAPTOP_CATALOG[brand]?.models.map((m) => m.name) ?? [];

export const getLaptopProcessors = (brand: string): string[] =>
  LAPTOP_CATALOG[brand]?.processors ?? [];

/** Storage for one model; an unknown/custom model gets the brand's full ladder. */
export const getLaptopStorageOptions = (brand: string, model: string): string[] => {
  const exact = LAPTOP_CATALOG[brand]?.models.find((m) => m.name === model);
  if (exact) return exact.storage;
  const all = LAPTOP_CATALOG[brand]?.models.flatMap((m) => m.storage) ?? [];
  return Array.from(new Set(all));
};

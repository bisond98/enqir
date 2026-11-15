// Audio catalogue for the Brand -> Model pickers in the Post Enquiry form.
// Covers headphones, earphones, earbuds / TWS, neckbands, bluetooth speakers,
// party speakers and soundbars — global brands alongside the ones that matter
// in the Indian market (boAt, Noise, Boult, pTron, Mivi, Wings, Truke,
// Gizmore, Ultima, Ambrane, Fire-Boltt, Crossbeats, UBON, TAGG, Nu Republic …).
// Every list ends with "Other" so an unlisted model can still be recorded;
// picking Other opens a text box for the exact name.

export const AUDIO_OTHER = 'Other';

/** Audio sub-types. No longer shown as a dropdown — kept because the category
 *  search reads them, so typing "earbuds" or "soundbar" still finds the
 *  category. */
export const AUDIO_SUBCATEGORIES: string[] = [
  'Headphones',
  'Wireless Headphones',
  'Earphones',
  'Wired Earphones',
  'Earbuds / TWS',
  'Neckband',
  'Bluetooth Speakers',
  'Party Speakers',
  'Soundbars',
  'Home Theatre',
  'Gaming Headsets',
  'Audio Accessories',
  'Other Audio & Headphones',
];

const AUDIO_MODELS: Record<string, string[]> = {
  Apple: [
    'AirPods (1st gen)', 'AirPods (2nd gen)', 'AirPods (3rd gen)', 'AirPods 4',
    'AirPods 4 ANC', 'AirPods Pro (1st gen)', 'AirPods Pro (2nd gen)', 'AirPods Max',
    'AirPods Max (USB-C)', 'EarPods (3.5mm)', 'EarPods (USB-C)', 'Beats Studio Buds',
    'Beats Studio Pro', 'Beats Fit Pro', 'Beats Flex',
  ],
  Sony: [
    'MDR-ZX110', 'MDR-ZX310', 'MDR-XB55AP', 'MDR-XB450AP', 'WH-CH510', 'WH-CH520',
    'WH-CH710N', 'WH-CH720N', 'WH-XB910N', 'WH-1000XM2', 'WH-1000XM3', 'WH-1000XM4',
    'WH-1000XM5', 'WI-1000X', 'WI-C100', 'WI-C200', 'WI-XB400', 'WF-C500', 'WF-C700N',
    'WF-1000XM3', 'WF-1000XM4', 'WF-1000XM5', 'WF-SP800N', 'LinkBuds', 'LinkBuds S',
    'LinkBuds Fit', 'SRS-XB100', 'SRS-XB13', 'SRS-XB23', 'SRS-XG300', 'HT-S200F',
    'HT-S40R', 'WH-G900N',
  ],
  JBL: [
    'Tune 500BT', 'Tune 510BT', 'Tune 520BT', 'Tune 560BT', 'Tune 660NC', 'Tune 710BT',
    'Tune 750BTNC', 'Tune 760NC', 'Tune 770NC', 'Tune Buds', 'Tune Flex',
    'Live 460NC', 'Live 660NC', 'Live Pro 2', 'Live Free 2', 'Tour One M2',
    'Go 2', 'Go 3', 'Go 4', 'Clip 3', 'Clip 4', 'Flip 4', 'Flip 5', 'Flip 6',
    'Charge 4', 'Charge 5', 'Xtreme 2', 'Xtreme 3', 'PartyBox 110', 'PartyBox 310',
    'PartyBox Encore', 'Bar 2.1', 'Bar 5.0 MultiBeam', 'Quantum 100', 'Quantum 400',
    'C100SI', 'C200SI', 'Wave Buds', 'Wave Flex',
  ],
  Bose: [
    'QuietComfort 15', 'QuietComfort 25', 'QuietComfort 35 II', 'QuietComfort 45',
    'QuietComfort Ultra Headphones', 'QuietComfort Ultra Earbuds', 'Noise Cancelling Headphones 700',
    'SoundLink Around-Ear II', 'SoundLink On-Ear', 'SoundLink Flex', 'SoundLink Micro',
    'SoundLink Color II', 'SoundLink Revolve', 'SoundLink Revolve+ II', 'Sport Earbuds',
    'SoundSport Free', 'Smart Soundbar 300', 'Smart Soundbar 900',
  ],
  Sennheiser: [
    'HD 202 II', 'HD 206', 'HD 400S', 'HD 450BT', 'HD 458BT', 'HD 599', 'HD 650',
    'Momentum 2.0', 'Momentum 3', 'Momentum 4', 'Momentum True Wireless', 'Momentum True Wireless 2',
    'Momentum True Wireless 3', 'Accentum', 'Accentum Plus', 'CX 80S', 'CX 100',
    'CX 400BT', 'CX Plus True Wireless', 'IE 100 Pro', 'Ambeo Soundbar Mini',
  ],
  Beats: [
    'Beats EP', 'BeatsX', 'urBeats3', 'Powerbeats 3', 'Powerbeats Pro', 'Powerbeats Pro 2',
    'Solo 2', 'Solo3 Wireless', 'Solo Pro', 'Solo 4', 'Studio 2', 'Studio3 Wireless',
    'Studio Pro', 'Beats Fit Pro', 'Beats Flex', 'Beats Pill', 'Beats Pill+',
  ],
  boAt: [
    'BassHeads 100', 'BassHeads 152', 'BassHeads 172', 'BassHeads 225', 'BassHeads 242',
    'Rockerz 235v2', 'Rockerz 245v2', 'Rockerz 255 Pro', 'Rockerz 255 Pro+',
    'Rockerz 330', 'Rockerz 400', 'Rockerz 450', 'Rockerz 510', 'Rockerz 550',
    'Rockerz 560', 'Rockerz 650', 'Rockerz 770 ANC', 'Rockerz 1000 ANC',
    'Airdopes 91 Prime', 'Airdopes 121v2', 'Airdopes 131', 'Airdopes 141', 'Airdopes 161',
    'Airdopes 170', 'Airdopes 201', 'Airdopes 281', 'Airdopes 311 Pro', 'Airdopes 441',
    'Airdopes 500 ANC', 'Airdopes Supreme', 'Stone 190', 'Stone 350', 'Stone 600',
    'Stone 1200', 'Stone Grenade', 'PartyPal 20', 'PartyPal 120',
    'Immortal 121', 'Immortal 171', 'Aavante Bar 1200', 'Aavante Bar 2050',
  ],
  Noise: [
    'Buds VS102', 'Buds VS104', 'Buds VS104 Pro', 'Buds VS201', 'Buds Xero',
    'Buds Pro 2', 'Buds Pro 3', 'Buds Pro 4', 'Air Buds Pro 2', 'Air Buds Pro 4',
    'Buds Verve', 'Buds Aero', 'Shots Trance', 'Shots XO', 'Halo Space', 'Halo Plus',
    'Voyage', 'ColorFit Buzz', 'Bravo', 'Buds N1', 'Twins Buds Pro',
  ],
  Boult: [
    'Audio W10', 'Audio W20', 'Audio W40', 'Audio Z40', 'Audio K10', 'Audio X30 Pro',
    'Audio Y1 Pro', 'Audio Airdopes', 'Mustang Torq', 'Mustang Racer', 'Rudder',
    'Wing', 'Onyx', 'Partybox 10', 'Astro', 'K10 Pro', 'Z40 Pro', 'W40 ANC',
  ],
  pTron: [
    'Bassbuds Classic', 'Bassbuds Elite', 'Bassbuds Prime', 'Bassbuds Max',
    'Bassbuds Neon', 'Bassbuds Twist', 'Bassbuds Zen', 'Fusion Neckband',
    'Boompods', 'Boompods Studio', 'Raaga', 'Raaga Pro', 'Tangent Sports',
  ],
  Mivi: [
    'DuoPods A25', 'DuoPods A35', 'DuoPods M25', 'DuoPods M45', 'DuoPods K2',
    'Roam Neckband', 'Roam Pro', 'SuperPods', 'Soundbar', 'Collide', 'Sonic Buds',
  ],
  Wings: [
    'Flint', 'Flint Pro', 'Nova', 'Nova Pro', 'Phantom', 'Phantom 200', 'Rover',
    'Icon', 'Icon Pro', 'Loop', 'Orbit', 'Paradise', 'Vibe',
  ],
  Truke: [
    'Buds Lite', 'Buds F1', 'Buds Q1', 'Buds Q2', 'Buds X1', 'Buds X2', 'Buds Elite',
    'Clarity 5', 'Clarity 7', 'Sport X1', 'Sport X2', 'Fit 2',
  ],
  Gizmore: [
    'Gbuds 712', 'Gbuds 811', 'Gbuds 910', 'Gbuds Pro', 'Gbuds Wave', 'Cloud Buzz',
    'Gizbuds 511', 'Thunder Neckband', 'Gizmo Rocker', 'Party Box 20',
  ],
  Ultima: [
    'Bass 110', 'Bass 210', 'Bass 310', 'Bass 410', 'Bass 910', 'Nirvana 1',
    'Nirvana 2', 'Prime', 'Prime Plus', 'Life 2', 'Rock 2', 'Thunder 2',
  ],
  Ambrane: [
    'Dots 11', 'Dots 31', 'Dots 51', 'Dots 71', 'Dots 111', 'Dots Pro', 'Bassbuds',
    'Thunder', 'Partybox', 'Soundbar',
  ],
  'Fire-Boltt': [
    'Buds 101', 'Buds Pro', 'Buds X', 'Buds Z', 'Harmony', 'Harmony Pro', 'Groove',
    'Groove ANC', 'Battle Buds', 'Thunder',
  ],
  Crossbeats: [
    'Rover', 'Rover Pro', 'Torq', 'Torq 2', 'Pulse', 'Pulse 2', 'Nitro', 'Nitro ANC',
    'Drift', 'Sonic', 'Bassline',
  ],
  UBON: [
    'UB-185', 'UB-215', 'UB-220', 'UB-250', 'UB-570', 'UB-750', 'UB-780',
    'BT-5700', 'BT-5600', 'Speaker SP-150',
  ],
  TAGG: [
    'Inferno', 'Inferno Plus', 'Loop', 'Loop 2', 'Sonic', 'Sonic Plus', 'Liberty',
    'Liberty Plus', 'Power', 'Rocker',
  ],
  'Nu Republic': [
    'Starboy', 'Starboy 70', 'Starboy 90', 'Cyberstud', 'Cyberstud Spin', 'Jaxx',
    'Jaxx Pro', 'Basskill', 'Basskill Pro',
  ],
  Loops: [
    'Buds Pro', 'Buds Max', 'Buds Ultra', 'Neckband Pro', 'Sonic', 'Sonic Pro',
    'Rock', 'Rock Pro',
  ],
  Hitage: [
    'NBE-3', 'NBE-5', 'NBE-9', 'NBE-12', 'HB-31', 'HB-51', 'Bass King', 'Thunder',
  ],
  Digitek: [
    'DWM-002', 'DWM-011', 'DG-BT-100', 'DG-BT-200', 'DWM-008', 'Party Speaker 10',
  ],
  Intex: [
    'Jazz', 'Jazz 2', 'Rocker', 'Rocker 2', 'Bass Blaster', 'BT Speaker MU',
    'IT-115', 'IT-120',
  ],
  iBall: [
    'B9', 'B10', 'B14', 'Musi Neon', 'Musi Flex', 'Musi Trend', 'Tarang',
    'Rockstar', 'BT Speaker',
  ],
  'F&D': [
    'F550X', 'F3100X', 'T180X', 'W2000X', 'A180X', 'F780X', 'Soundbar 2.1',
  ],
  Aroma: ['NB-118', 'NB-120', 'AR-101', 'AR-200', 'Thunder Bass', 'Party Speaker'],
  'Black Cat': ['MN-230', 'MN-250', 'BC-100', 'BC-200', 'Bass Cat', 'Speaker 10'],
  Lavender: ['Bass X', 'Bass X Pro', 'Sonic', 'Sonic Pro', 'Neckband', 'Party Box'],
  Oraimo: [
    'FreePods 3', 'FreePods 4', 'FreePods Lite', 'FreePods Neo', 'SoundBuds',
    'Shark 4', 'Neckband Pro', 'Party Speaker',
  ],
  Saregama: ['Carvaan', 'Carvaan 2.0', 'Carvaan Mini', 'Carvaan Go', 'Carvaan Malayalam'],
  Redmi: [
    'Redmi Buds 3', 'Redmi Buds 3 Lite', 'Redmi Buds 4', 'Redmi Buds 4 Active',
    'Redmi Buds 4 Pro', 'Redmi Buds 5', 'Redmi Buds 5 Pro', 'Redmi Buds 6 Active',
    'Redmi Buds 6 Play', 'Redmi Neckband Pro', 'Redmi Soundbar',
  ],
  OnePlus: [
    'Bullets Wireless', 'Bullets Wireless 2', 'Bullets Wireless Z', 'Bullets Wireless Z2',
    'Bullets Wireless Z2 ANC', 'Buds', 'Buds Z', 'Buds Z2', 'Buds N', 'Buds 2',
    'Buds 3', 'Buds Pro', 'Buds Pro 2', 'Buds Pro 3', 'Buds Ace', 'Buds Ace 2',
    'Nord Buds', 'Nord Buds 2', 'Nord Buds 2r', 'Nord Buds 3', 'Nord Buds 3 Pro',
    'Nord Wired Earphones', 'Type-C Bullets',
  ],
  Realme: [
    'Buds Air', 'Buds Air 2', 'Buds Air 2 Neo', 'Buds Air 3', 'Buds Air 5', 'Buds Air 5 Pro',
    'Buds Air 6', 'Buds T100', 'Buds T110', 'Buds T300', 'Buds Q', 'Buds Q2',
    'Buds Q2s', 'Buds Wireless', 'Buds Wireless 3', 'Buds Wireless Pro', 'Buds 2 Neo',
    'Techlife Wireless Earbuds', 'Brick Bluetooth Speaker', 'Cobra Neckband',
  ],
  Samsung: [
    'Galaxy Buds', 'Galaxy Buds+', 'Galaxy Buds Live', 'Galaxy Buds2', 'Galaxy Buds2 Pro',
    'Galaxy Buds3', 'Galaxy Buds3 Pro', 'Galaxy Buds FE', 'Galaxy Buds Core',
    'Level U2', 'EO-IA500', 'HW-B450 Soundbar', 'HW-Q600C Soundbar', 'HW-S60B Soundbar',
  ],
  Google: [
    'Pixel Buds', 'Pixel Buds 2', 'Pixel Buds A-Series', 'Pixel Buds Pro',
    'Pixel Buds Pro 2', 'Pixel Buds A-Series (2024)',
  ],
  Oppo: [
    'Enco W31', 'Enco W51', 'Enco M31', 'Enco M32 Neckband', 'Enco Air', 'Enco Air2',
    'Enco Air2 Pro', 'Enco Air3', 'Enco Air3 Pro', 'Enco Buds', 'Enco Buds2',
    'Enco Buds3', 'Enco X', 'Enco X2',
  ],
  Xiaomi: [
    'Mi True Wireless Earbuds Basic 2', 'Mi Neckband Bluetooth Earphones', 'Mi Earphones Basic',
    'Buds 3', 'Buds 3 Pro', 'Buds 4', 'Buds 4 Pro', 'Buds 5', 'Xiaomi Soundbar',
    'Mi Bluetooth Speaker', 'Mi Portable Speaker', 'Redmi Buds 4 Lite',
  ],
  Motorola: [
    'Moto Pulse', 'Moto Pulse 2', 'Moto Pulse Escape', 'Moto Buds', 'Moto Buds+',
    'Moto Buds 600 ANC', 'Moto Buds 250', 'Moto XT500 Neckband', 'Verve Buds',
    'Verve Ones',
  ],
  Nokia: [
    'Nokia BH-205', 'Nokia E3103', 'Nokia T3110', 'Nokia Clarity Earbuds',
    'Nokia Clarity Earbuds Pro', 'Nokia Wristband',
  ],
  Infinix: ['XBuds 1', 'XBuds 2', 'XBuds 3', 'XBuds 4', 'XBuds Pro', 'XBuds Neo', 'XBand 4'],
  Tecno: ['Sonic 1', 'Buds 1', 'Buds 2', 'Buds 3', 'Buds 4', 'Sphere 3', 'TWS K2', 'TWS G1'],
  Vivo: ['TWS 1', 'TWS 1e', 'TWS 2', 'TWS 2e', 'TWS 3', 'TWS 3e', 'TWS 3 Pro', 'Wireless 3 Neckband'],
  Nothing: [
    'Ear (1)', 'Ear (2)', 'Ear (a)', 'Ear (open)', 'Ear Stick', 'Headphone (1)',
    'CMF Buds', 'CMF Buds Pro 2', 'CMF Neckband Pro', 'CMF Buds 2',
  ],
  Jabra: [
    'Elite 25e', 'Elite 3', 'Elite 4 Active', 'Elite 5', 'Elite 7 Pro', 'Elite 75t',
    'Elite 85t', 'Elite 10', 'Talk 15 SE', 'Talk 25 SE', 'Evolve2 40', 'Evolve2 65',
  ],
  'Audio-Technica': [
    'ATH-M20x', 'ATH-M30x', 'ATH-M40x', 'ATH-M50x', 'ATH-M50xBT2', 'ATH-S200BT',
    'ATH-CK350iS', 'ATH-SQ1TW', 'ATH-CKS50TW',
  ],
  AKG: ['K52', 'K72', 'K92', 'K371', 'K361', 'Y500', 'N200', 'N400'],
  Shure: ['SE215', 'SE425', 'SE535', 'AONIC 50', 'AONIC 215', 'SRH440A', 'SRH840A'],
  Denon: ['AH-C620R', 'AH-C720', 'AH-GC25W', 'AH-GC30', 'PerL', 'PerL Pro', 'DHT-S216'],
  Yamaha: ['YH-E700A', 'YH-L500A', 'EP-E30A', 'TW-E3B', 'SR-B20A Soundbar', 'SR-C20A'],
  Sonos: ['Era 100', 'Era 300', 'One SL', 'Roam', 'Move 2', 'Beam (Gen 2)', 'Ray'],
  'Bang & Olufsen': ['Beoplay H9', 'Beoplay HX', 'Beoplay EX', 'Beoplay EQ', 'Beosound A1', 'Beosound Explore'],
  'Bowers & Wilkins': ['Px7 S2', 'Px8', 'Pi5 S2', 'Pi7 S2', 'Zeppelin'],
  Klipsch: ['T5 II', 'T5 II ANC', 'R6', 'The Fives', 'The One Plus'],
  Devialet: ['Phantom I', 'Phantom II', 'Gemini', 'Manía'],
  Focal: ['Bathys', 'Elegia', 'Clear MG', 'Utopia'],
  HiFiMan: ['HE400se', 'Sundara', 'Ananda', 'Edition XS'],
  Moondrop: ['Chu II', 'Aria 2', 'Space Travel', 'Kato', 'Blessing 3'],
  KZ: ['ZSN Pro X', 'ZST X', 'EDX Pro', 'ZS10 Pro', 'Castor', 'AZ09'],
  CCA: ['CRA', 'CXS', 'LYRA', 'PL13'],
  '1MORE': ['PistonBuds Pro', 'ComfoBuds', 'ComfoBuds Pro', 'ColorBuds 2', 'SonoFlow'],
  Soundcore: [
    'Liberty Air 2', 'Liberty Air 2 Pro', 'Liberty 3 Pro', 'Liberty 4', 'Liberty 4 NC',
    'Space A40', 'Space One', 'Life Q10', 'Life Q20+', 'Life Q30', 'Life P2',
    'Motion 300', 'Motion Boom', 'Boom 2', 'Select 4 Go', 'Sleep A10',
  ],
  Anker: ['Soundcore Life P2 Mini', 'Soundcore Mini 3', 'PowerConf', 'Soundcore Anker Halo'],
  Baseus: ['Bowie E8', 'Bowie E9', 'Bowie MA10', 'Bowie WM02', 'AeQur G10'],
  Ugreen: ['HiTune T3', 'HiTune X6', 'HiTune Max5', 'HiTune H5'],
  EarFun: ['Air Pro 3', 'Air Pro 4', 'Free Pro 2', 'Free Pro 3', 'Uboom L'],
  SoundPEATS: ['Air3', 'Air4 Pro', 'TrueFree 2', 'Clear', 'Mini Pro'],
  Tozo: ['T6', 'T9', 'T10', 'T12', 'A1', 'Golden X1'],
  Tronsmart: ['Apollo Bold', 'Apollo Air', 'Spunky Buds', 'Bang 2', 'Element T6'],
  Technics: ['EAH-AZ40', 'EAH-AZ60', 'EAH-AZ80', 'EAH-A800'],
  Philips: [
    'TAT1207', 'TAT2206', 'TAT3508', 'TAT4506', 'SHB4305', 'SHB5250', 'SHL5000',
    'BT2200', 'TAB5305 Soundbar', 'TAB7305 Soundbar',
  ],
  Amazon: ['Echo Buds (1st gen)', 'Echo Buds (2nd gen)', 'Echo Pop', 'Echo Dot 5', 'Fire TV Soundbar'],
  HomePod: ['HomePod', 'HomePod (2nd gen)', 'HomePod mini'],
  Tribit: ['StormBox Micro 2', 'StormBox Pro', 'StormBox Flow', 'XSound Go', 'XSound Plus', 'FlyBuds 3'],
  Portronics: ['Harmonics Twins S3', 'Harmonics Twins S13', 'Harmonics Twins S16', 'SoundDrum', 'Pebble', 'Bubble', 'Conch'],
  Marshall: [
    'Major II', 'Major III', 'Major IV', 'Major V', 'Emberton', 'Emberton II', 'Willen',
    'Stockwell II', 'Kilburn II', 'Stanmore II', 'Acton II', 'Mode EQ', 'Minor II',
  ],
  Skullcandy: [
    'Jib True', 'Smokin Buds', 'Indy Evo', 'Indy ANC', 'Hesh Evo', 'Hesh ANC',
    'Crusher Evo', 'Crusher ANC 2', 'Push ANC', 'Method ANC',
  ],
  'Harman Kardon': ['Go + Play 3', 'Onyx Studio 7', 'Aura Studio 4', 'Citation Bar', 'Fly TWS'],
  Edifier: ['W820NB', 'W820NB Plus', 'NeoBuds Pro', 'NeoBuds Pro 2', 'TWS1 Pro 2', 'R1280T', 'R1700BT', 'MP230'],
  Zebronics: [
    'Zeb-Duke', 'Zeb-Bro', 'Zeb-Thunder', 'Zeb-Fit 20', 'Zeb-Fit 30', 'Zeb-Blast',
    'Zeb-Vita', 'Zeb-Monk', 'Zeb-County', 'Zeb-Sound Bomb 10', 'Zeb-Sound Bomb Q',
    'Zeb-Envy', 'Zeb-Raga', 'Zeb-Evolve', 'Zeb-Juke Bar 9500',
  ],
};

export const AUDIO_BRAND_OPTIONS: string[] = [
  ...Object.keys(AUDIO_MODELS).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })),
  AUDIO_OTHER,
];

/** Models the brand actually makes; empty until a brand is picked. */
export function getAudioModels(brand: string): string[] {
  if (!brand) return [];
  return AUDIO_MODELS[brand] ?? [];
}

/** Brand-wide union, used when the model is "Other" or unknown. */
export function getAudioModelUnion(): string[] {
  return Array.from(new Set(Object.values(AUDIO_MODELS).flat()));
}

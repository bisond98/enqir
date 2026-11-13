// Watch catalogue for the post-enquiry description step.
//
// Brand -> the models that brand actually makes, so the model dropdown only
// ever offers watches that belong to the chosen brand. Both dropdowns end with
// an "Other" entry that unlocks a free-text box, so an unlisted brand or model
// can still be recorded instead of being lost.
//
// Only real brand/model pairs belong here: a model must not appear under a
// brand that never sold it. Order runs from the rare/exclusive houses through
// the mainstream names to independent and Indian brands.

export const WATCH_CATALOG: Record<string, string[]> = {
  // ---- rare / exclusive haute horlogerie ----
  'Patek Philippe': [
    'Nautilus 5711/1A',
    'Nautilus 5726',
    'Aquanaut 5167A',
    'Calatrava 6119',
    'Complications Annual Calendar 5205',
    'Grand Complications Perpetual Calendar 5320',
    'World Time 5230',
    'Cubitus 5821',
  ],
  'Audemars Piguet': [
    'Royal Oak Jumbo 16202',
    'Royal Oak 15500',
    'Royal Oak Offshore',
    'Royal Oak Concept',
    'CODE 11.59',
  ],
  'Vacheron Constantin': [
    'Overseas',
    'Patrimony',
    'Traditionnelle',
    'Historiques',
    'Égérie',
  ],
  'Richard Mille': [
    'RM 11-03',
    'RM 27-04',
    'RM 35-02',
    'RM 55',
    'RM 65-01',
    'RM 07-01',
  ],
  'Jacob & Co.': [
    'Epic X',
    'Astronomia',
    'Bugatti Chiron Tourbillon',
    'Opera Godfather',
    'Casino Tourbillon',
    'Five Time Zone',
    'Billionaire',
  ],
  'F.P. Journe': [
    'Chronomètre Bleu',
    'Chronomètre Souverain',
    'Octa Automatique',
    'Tourbillon Souverain',
    'Centigraphe Souverain',
    'Élégante',
    'LineSport',
  ],
  Breguet: [
    'Classique',
    'Marine',
    'Type XX',
    'Reine de Naples',
    'Tradition',
    'Héritage',
  ],
  'A. Lange & Söhne': [
    'Lange 1',
    'Saxonia',
    'Zeitwerk',
    'Datograph',
    'Odysseus',
    'Richard Lange',
  ],
  'Jaeger-LeCoultre': [
    'Reverso',
    'Master Control',
    'Polaris',
    'Rendez-Vous',
    'Duomètre',
  ],
  Cartier: [
    'Santos',
    'Tank',
    'Ballon Bleu',
    'Panthère',
    'Ronde',
    'Pasha',
  ],
  Blancpain: [
    'Fifty Fathoms',
    'Bathyscaphe',
    'Villeret',
  ],
  Hublot: [
    'Big Bang',
    'Classic Fusion',
    'Spirit of Big Bang',
    'MP-11',
  ],
  Panerai: [
    'Luminor',
    'Radiomir',
    'Submersible',
  ],
  IWC: [
    'Portugieser',
    'Big Pilot',
    "Pilot's Chronograph",
    'Portofino',
    'Aquatimer',
  ],
  Breitling: [
    'Navitimer',
    'Chronomat',
    'Superocean',
    'Avenger',
    'Premier',
  ],
  Zenith: [
    'El Primero',
    'Chronomaster',
    'Defy',
    'Pilot',
  ],
  'Ulysse Nardin': [
    'Marine',
    'Freak',
    'Diver',
    'Classico',
  ],
  'Girard-Perregaux': [
    'Laureato',
    'Bridges',
    'Vintage 1945',
  ],
  Chopard: [
    'Alpine Eagle',
    'Happy Sport',
    'Mille Miglia',
    'L.U.C',
  ],
  Piaget: [
    'Polo',
    'Altiplano',
    'Possession',
  ],
  Bovet: [
    'Fleurier',
    'Amadeo',
    'Récital',
  ],
  'MB&F': [
    'Horological Machine No. 3',
    'HM10',
    'LM101',
    'HM8',
  ],
  'Greubel Forsey': [
    'Double Tourbillon',
    'Hand Made 1',
    'Tourbillon 24 Secondes',
  ],
  'Roger Dubuis': [
    'Excalibur',
    'Velvet',
  ],
  'Franck Muller': [
    'Vanguard',
    'Crazy Hours',
    'Casablanca',
    'Long Island',
  ],
  'Bell & Ross': [
    'BR 03',
    'BR 05',
    'BR V2',
    'Vintage',
  ],
  'H. Moser & Cie': [
    'Endeavour',
    'Pioneer',
    'Streamliner',
  ],
  Czapek: [
    'Antarctique',
  ],

  // ---- famous luxury / sporting ----
  Rolex: [
    'Submariner Date',
    'Submariner',
    'Datejust 36',
    'Datejust 41',
    'Day-Date 40',
    'GMT-Master II',
    'Explorer',
    'Explorer II',
    'Oyster Perpetual 36',
    'Oyster Perpetual 41',
    'Cosmograph Daytona',
    'Yacht-Master 40',
    'Sky-Dweller',
    'Sea-Dweller',
  ],
  Omega: [
    'Speedmaster Professional Moonwatch',
    'Speedmaster Racing',
    'Seamaster Diver 300M',
    'Seamaster Aqua Terra',
    'Seamaster Planet Ocean',
    'Constellation',
    'De Ville Prestige',
    'Globemaster',
  ],
  'TAG Heuer': [
    'Carrera',
    'Monaco',
    'Aquaracer',
    'Formula 1',
    'Link',
    'Autavia',
    'Connected',
  ],
  Tudor: [
    'Black Bay',
    'Pelagos',
    'Royal',
    'Ranger',
    '1926',
  ],
  'Grand Seiko': [
    'Heritage',
    'Evolution 9',
    'Sport',
    'Elegance',
    'Spring Drive',
  ],
  Longines: [
    'HydroConquest',
    'Master Collection',
    'DolceVita',
    'Conquest',
    'Legend Diver',
    'Spirit',
  ],
  Tissot: [
    'PRX',
    'T-Classic',
    'T-Race',
    'Seastar',
    'Le Locle',
    'Couturier',
    'Gentleman',
  ],
  Rado: [
    'Captain Cook',
    'True Square',
    'DiaMaster',
    'Coupole',
    'Centrix',
  ],
  Seiko: [
    '5 Sports',
    'Prospex',
    'Presage',
    'Astron',
    'King Seiko',
    'Alpinist',
    'Seiko 5',
  ],
  Citizen: [
    'Eco-Drive',
    'Promaster',
    'Tsuyosa',
    'Series 8',
    'Attesa',
    'Chandler',
  ],
  Orient: [
    'Kamasu',
    'Bambino',
    'Ray II',
    'Sun and Moon',
    'Mako III',
  ],
  Casio: [
    'G-Shock GA-2100',
    'G-Shock DW-5600',
    'G-Shock Mudmaster',
    'Edifice',
    'Pro Trek',
    'Vintage A158',
    'F-91W',
    'Sheen',
  ],
  Fossil: [
    'Gen 5 Smartwatch',
    'Gen 6 Smartwatch',
    'Machine',
    'Neutra',
    'Grant',
    'Chronograph',
  ],
  Titan: [
    'Titan Neo',
    'Titan Raga',
    'Titan Edge',
    'Titan Octane',
    'Titan Regalia',
  ],
  Fastrack: [
    'Reflex V2',
    'Reflex Beat',
    'Stunner',
    'Aster',
    'Tees',
  ],
  'Daniel Wellington': [
    'Classic Petite',
    'Classic Sheffield',
    'Iconic Link',
    'Quadro',
  ],
  'Michael Kors': [
    'Runway',
    'Lexington',
    'Parker',
    'Bradshaw',
  ],

  // ---- independent / enthusiast favourites ----
  'Nomos Glashütte': [
    'Tangente',
    'Orion',
    'Club',
    'Ludwig',
    'Metro',
    'Autobahn',
  ],
  Oris: [
    'Aquis',
    'Divers Sixty-Five',
    'Big Crown',
    'ProPilot',
  ],
  Sinn: [
    '556',
    'U1',
    '104',
    '856',
  ],
  Hamilton: [
    'Khaki Field',
    'Jazzmaster',
    'Ventura',
    'Intra-Matic',
  ],
  Mido: [
    'Commander',
    'Ocean Star',
    'Multifort',
    'Baroncelli',
  ],
  Certina: [
    'DS Action',
    'DS Podium',
    'DS-1',
  ],
  Junghans: [
    'Max Bill',
    'Form',
    'Mega',
  ],
  'Christopher Ward': [
    'C60 Trident',
    'C63 Sealander',
    'Bel Canto',
    'The Twelve',
  ],
  Baltic: [
    'Aquascaphe',
    'HMS',
    'Bicompax',
    'MR01',
  ],
  Farer: [
    'Lander',
    'Resolute',
    'Cayley',
  ],
  'Kurono Tokyo': [
    'Grand Akane',
    'Mori',
    'Toki',
    'Sensu NOS',
  ],
  Ming: [
    '17.09',
    '37.04',
    '27.01',
    '22.01',
  ],
  'Studio Underd0g': [
    'Pizza Party',
    'Watermel0n',
    'Mint Ch0c Chip',
    'Desert Sky',
  ],
  Vostok: [
    'Amphibia',
    'Komandirskie',
  ],
  Seagull: [
    '1963 Chronograph',
    'Ocean Star',
  ],
  Skagen: [
    'Ancher',
    'Grenen',
    'Signatur',
  ],
  MVMT: [
    'Revolver',
    'Chrono',
  ],
  'D1 Milano': [
    'Ultra Thin',
    'Polycarbon',
  ],

  // ---- Indian brands ----
  'Nalla Neram (നേരം)': [
    'Kaalam Minutes Timer — Black Dial',
    'Kaalam Minutes Timer — Blue Dial',
    'Vaanam',
    'Bhoomi',
  ],
  'Bangalore Watch Company': [
    'Cover Drive',
    'MACH 1',
    'Genesis',
    'Kolar',
  ],
  'Jaipur Watch Company': [
    'Aviator',
    'Jantar Mantar',
    "Collector's Edition",
  ],
  HMT: [
    'Janata',
    'Pilot',
    'Kohinoor',
    'Sona',
  ],

  // ---- smartwatches / wearables ----
  'Apple Watch': [
    'Ultra 2',
    'Ultra',
    'Series 9',
    'Series 8',
    'Series 7',
    'SE (2nd gen)',
    'SE',
  ],
  'Samsung Galaxy Watch': [
    'Watch 6',
    'Watch 6 Classic',
    'Watch 5',
    'Watch 5 Pro',
    'Watch 4',
    'Watch FE',
  ],
  Garmin: [
    'Forerunner 265',
    'Forerunner 165',
    'Fenix 7',
    'Venu 3',
    'Vivoactive 5',
    'Instinct 2',
  ],
  Fitbit: [
    'Versa 4',
    'Sense 2',
    'Charge 6',
    'Inspire 3',
  ],
  Amazfit: [
    'GTR 4',
    'GTS 4',
    'T-Rex 2',
    'Bip 5',
    'Active 2',
  ],
  Noise: [
    'ColorFit Pro 5',
    'ColorFit Ultra 3',
    'Halo Plus',
    'Icon 2',
  ],
  boAt: [
    'Wave Call',
    'Wave Sigma',
    'Storm Call',
    'Lunar Call',
  ],
  'Fire-Boltt': [
    'Ninja Call Pro',
    'Phoenix',
    'Talk',
    'Vision',
  ],
};

// A–Z, so the long brand list is easy to scan and type into.
export const WATCH_BRAND_OPTIONS = Object.keys(WATCH_CATALOG).sort((a, b) =>
  a.localeCompare(b, 'en', { sensitivity: 'base' })
);

/** The "not listed" entry every dropdown offers, which opens a free-text box. */
export const WATCH_OTHER = 'Other';

// Models are handed out A–Z as well, so the shorter dropdown is just as easy
// to scan as the brand list.
export const getWatchModels = (brand: string): string[] =>
  [...(WATCH_CATALOG[brand] ?? [])].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );

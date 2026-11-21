// Bicycle catalogue: the type picked on the Bicycles dropdown decides which
// brands are offered, and each brand offers the models it actually sells.
// Shared by the Sell listing form and the Post Enquiry form. "Other" is always
// available so an unlisted bike can still be recorded.
export const BICYCLE_OTHER = 'Other';

export const BICYCLE_TYPE_BRANDS: Record<string, string[]> = {
  'BMX Bicycles': [
    'Haro', 'Mongoose', 'GT', 'Redline', 'SE Bikes', 'Sunday', 'We The People',
    'Cult', 'Fit Bike Co', 'Kink', 'Subrosa', 'Eastern', 'Hoffman', 'Schwinn',
    'Hero', 'Firefox', 'Btwin', 'Polygon', 'Ninety One', 'Montra', 'Other',
  ],
  'Mountain Bicycles (MTB)': [
    'Trek', 'Giant', 'Scott', 'Merida', 'Cannondale', 'Specialized', 'Santa Cruz',
    'Polygon', 'Firefox', 'Hero', 'Btwin', 'Stryder', 'Montra', 'Ninety One',
    'Trinx', 'Kross', 'Bergamont', 'Ghost', 'Marin', 'Kona', 'BSA', 'Hercules',
    'Avon', 'Leader', 'MTB', 'Other',
  ],
  'Road Bicycles': [
    'Trek', 'Giant', 'Scott', 'Merida', 'Cannondale', 'Specialized', 'Bianchi',
    'Pinarello', 'Colnago', 'Orbea', 'Cube', 'Polygon', 'Firefox', 'Btwin',
    'Java', 'Other',
  ],
  'Hybrid Bicycles': [
    'Trek', 'Giant', 'Scott', 'Merida', 'Cannondale', 'Specialized', 'Firefox',
    'Hero', 'Btwin', 'Montra', 'Ninety One', 'Polygon', 'Trinx', 'Kross', 'Other',
  ],
  'Cruiser Bicycles': ['Schwinn', 'Electra', 'Firmstrong', 'Micargi', 'Trek', 'Giant', 'Hero', 'Btwin', 'Other'],
  "Children's Bicycles": ['Hero', 'Btwin', 'Firefox', 'Strider', 'Frog', 'Schnell', 'Avon', 'BSA', 'Mach City', 'Montra', 'Ninety One', 'Other'],
  'Electric Bicycles (E-Bikes)': ['Trek', 'Giant', 'Specialized', 'Cannondale', 'Hero Lectro', 'Btwin', 'EMotorad', 'Ninety One', 'Firefox', 'Tern', 'Brompton', 'Other'],
  'Folding Bicycles': ['Brompton', 'Dahon', 'Tern', 'Btwin', 'Montra', 'Firefox', 'Hero', 'Bickerton', 'Other'],
  'Single-Speed & Fixed-Gear Bicycles': ['State Bicycle Co', 'Pure Cycles', 'Fuji', 'Bianchi', 'SE Bikes', 'Crew', 'Aventon', 'Trek', 'Other'],
  'Tandem Bicycles': ['Trek', 'Santana', 'Co-Motion', 'Raleigh', 'Schwinn', 'Cannondale', 'Other'],
  'Touring Bicycles': ['Trek', 'Surly', 'Kona', 'Salsa', 'Giant', 'Ridgeback', 'Fuji', 'Other'],
  'Track & Racing Bicycles': ['Cervélo', 'Pinarello', 'Look', 'Bianchi', 'Fuji', 'Dolan', 'Trek', 'Giant', 'Other'],
  Tricycles: ['Hero', 'BSA', 'Avon', 'Firefly', 'Mobo', 'Trailmate', 'Other'],
  'Adaptive & Special Needs Bicycles': ['Van Raam', 'Hase Bikes', 'ICE', 'TerraTrike', 'Catrike', 'Sun Seeker', 'Other'],
  'Cargo Bicycles': ['Tern', 'Yuba', 'Xtracycle', 'Btwin', 'Riese & Müller', 'Other'],
  // Everyday Indian cycles: the home brands people actually ride, then the
  // imported ones sold here.
  Cycle: [
    'Hero', 'Hero Lectro', 'Firefox', 'BSA', 'Avon', 'Hercules', 'Roadeo',
    'Mach City', 'Montra', 'Ninety One', 'Stryder', 'Schnell', 'La Sovereign',
    'Atlas', 'Eastman', 'Leader', 'Viki', 'Hippo', 'HiBird', 'MTB', 'Kross',
    'Btwin', 'Trek', 'Giant', 'Polygon', 'Merida', 'Scott', 'Specialized',
    'Cannondale', 'Other',
  ],
};

export const BICYCLE_BRAND_MODELS: Record<string, string[]> = {
  // BMX
  Haro: ['Freestyler Master', 'Lineage Ground Master', 'Downtown DLX', 'Boulevard 24', 'Raceline', 'Annex', 'Other'],
  Mongoose: ['Legion L100', 'Legion L60', 'Title Elite', 'Title Pro', 'Guide', 'Fraction', 'Other'],
  GT: ['Performer', 'Performer Pro', 'Aggressor', 'Avalanche', 'Grade', 'Other'],
  Redline: ['Random', 'Roam', 'RL 275', 'MX', 'Other'],
  'SE Bikes': ['PK Ripper', 'Big Ripper 29', 'OM Flyer', 'Blocks Flyer', 'So Cal Flyer', 'Other'],
  Sunday: ['Forecaster', 'Scout', 'Primer', 'High C', 'Model C', 'Other'],
  'We The People': ['Crysis', 'Arcade', 'Nova', 'Justice', 'Reason', 'Other'],
  Cult: ['Access', 'Devotion', 'Gateway', 'Crew', 'Other'],
  'Fit Bike Co': ['Begin', 'Eighteen', 'Series One', 'Other'],
  Kink: ['Launch', 'Gap', 'Whip', 'Switch', 'Other'],
  Subrosa: ['Malum', 'Tiro', 'Letum', 'Other'],
  Eastern: ['Nightwasp', 'Grim Reaper', 'Shovelhead', 'Other'],
  Hoffman: ['Condor', 'Taj', 'Other'],
  Schwinn: ['Sting-Ray', 'Cruiser', 'Krate', 'Other'],

  // MTB / hybrid / road
  Trek: ['Marlin 5', 'Marlin 7', 'X-Caliber 8', 'Fuel EX 8', 'FX 3', 'Domane AL 2', 'Émonda ALR 5', 'Checkpoint ALR 5', 'Other'],
  Giant: ['Talon 3', 'ATX 1', 'Revolt 2', 'Contend AR 3', 'FastRoad SL 2', 'Escape 3', 'Other'],
  Scott: ['Scale 970', 'Aspect 950', 'Contessa', 'Speedster 20', 'Addict 30', 'Other'],
  Merida: ['Big Nine 100', 'Big Seven 100', 'Scultura 100', 'Reacto 400', 'Crossway 100', 'One-Twenty', 'Other'],
  Cannondale: ['Trail 8', 'Trail SE 4', 'Synapse 3', 'CAAD13', 'Topstone 4', 'Quick 4', 'Other'],
  Specialized: ['Rockhopper', 'Rockhopper Comp', 'Sirrus 2.0', 'Allez', 'Diverge E5', 'Turbo Vado', 'Other'],
  'Santa Cruz': ['Chameleon', 'Hightower', 'Bronson', 'Tallboy', 'Other'],
  Polygon: ['Cascade 4', 'Premier 4', 'Siskiu D5', 'Path 2', 'Strattos S2', 'Other'],
  Firefox: ['Maverick 27.5', 'Target 27.5', 'Rapide', 'Razor 26 D', 'Bad Attitude', 'Nexus', 'Cyclone', 'Dominator', 'Mountana Neo D', 'Flytron', 'Meteorider', 'Stormyum', 'Aspect 26', 'Other'],
  Hero: [
    'Sprint Pro 26T', 'Sprint Ridge 26T', 'Sprint Voltage', 'RIOT 26T', 'Ranger',
    'Octane', 'Hawk', 'Milano', 'Angel', 'Compass', 'Shotgun', 'Ryder 26T',
    'Bolt', 'Jazz', 'Kids 14T', 'Other',
  ],
  BSA: [
    'Mach 1', 'Mach 1 26T', 'Champ', 'Photon', 'Ladybird', 'LB', 'Spotlight',
    'Street Rider', 'Camber 27.5', 'Summit', 'Jr 14T', 'Kids 16T', 'Other',
  ],
  Avon: [
    'Invader', 'Vertex', 'Cyclone', 'Rider', 'Prime', 'Blaze', 'Aero',
    'Cruise', 'Vitals', 'Bounce', 'Hunk', 'Solid', 'Zephyr', 'Golf', 'Sprint',
    'Flash', 'Ranger', 'Waka-Waka 26T', 'Shaka Laka 26T', 'Ravo IBC 24T',
    'Gamer Apex 26T', 'Avonic', 'League 26T', 'Kids 20T', 'Other',
  ],
  Hercules: [
    'Roadeo A100', 'Roadeo A75', 'Roadeo A50', 'Roadeo A30', 'Roadeo Fugitive 21SP',
    'Roadeo Beast 21SP', 'Griffin', 'Bazooka RF', 'Decoy IC', 'DOOM', 'Dynamite ZX',
    'Streetcat Pro', 'Top Gear 24T', 'Krypton', 'Other',
  ],
  Roadeo: ['A100', 'A110', 'A300', 'A75', 'A50', 'NFS', 'Xtreme', 'Other'],
  'Mach City': ['Munich 7', 'Ibiza', 'Barcelona', 'Johannesburg', 'Tokyo', 'Munich', 'Other'],
  'La Sovereign': ['Sporter', 'Urban', 'Spyder', 'Max', 'Other'],
  Atlas: ['Rapid', 'Comfort', 'Club', 'Champion', 'Gold', 'Other'],
  Eastman: ['Spider 26T', 'Champ', 'Ranger', 'Other'],
  Leader: [
    'Scout 26T', 'Gladiator 26T', 'Ultima 26T', 'Torfin 26T', 'Stark 27.5T',
    'Sniper 24T', 'Xtreme 26T', 'Storm', 'Buzz', 'Other',
  ],
  Viki: ['Ranger', 'Comfort', 'Other'],
  Hippo: ['Rogger City Ride 26', 'Arizon IBC 26', 'Arizon Passion 24', 'Techno NV 20T', 'Other'],
  HiBird: ['Flare MTB', 'Beauty', 'Classic', 'Kids Flare', 'Other'],
  // Cycles sold under the plain "MTB" name — sized, not model-named.
  MTB: ['20T MTB', '24T MTB', '26T MTB', '27.5T MTB', '29T MTB', 'Geared MTB', 'Other'],
  Btwin: ['Rockrider ST 100', 'Rockrider ST 540', 'Riverside 100', 'Riverside 500', 'Triban RC 100', 'My Bike 16', 'Tilt 120', 'Other'],
  Stryder: ['Aero 26T', 'Sprint 26T', 'Other'],
  Montra: [
    'Country SS 27.5T', 'Country SS 29T', 'Metal 27.5T', 'Metal 29T',
    'Madrock 27.5T', 'Madrock 29T', 'Reverb 21SP', 'Reverb SS', 'Trance Pro 700C',
    'Fixie', 'Downtown', 'Timba 700C', 'Blade 27.5', 'Mystique', 'Zap 27.5T',
    'Techno 27.5T', 'Hypno', 'Other',
  ],
  'Ninety One': ['Meraki 27.5', 'Meraki 29', 'Orpheus', 'Cipher', 'Gryphon', 'Other'],
  Trinx: ['M136', 'M118', 'Other'],
  Kross: ['Kavar', 'Level', 'Other'],
  Bergamont: ['Revox', 'Contrail', 'Other'],
  Ghost: ['Kato', 'Lector', 'Other'],
  Marin: ['Bobcat Trail', 'Fairfax', 'Other'],
  Kona: ['Lava Dome', 'Rove', 'Other'],
  Bianchi: ['Via Nirone 7', 'Sprint', 'Oltre XR3', 'Other'],
  Pinarello: ['Gan', 'Dogma F', 'Other'],
  Colnago: ['C68', 'Other'],
  Orbea: ['Terra', 'Orca', 'Other'],
  Cube: ['Aim', 'Attention', 'Other'],
  Java: ['Siluro', 'Veloce', 'Other'],

  // Cruiser / kids / e-bike / folding / others
  Electra: ['Cruiser 1', 'Townie 7D', 'Other'],
  Firmstrong: ['Urban Man', 'Other'],
  Micargi: ['Mustang', 'Other'],
  Strider: ['12 Sport', '14x', 'Other'],
  Frog: ['Frog 44', 'Frog 52', 'Other'],
  Schnell: ['Kids 16', 'Kids 20', 'Sprint', 'Other'],
  'Hero Lectro': ['Winner', 'Other'],
  EMotorad: ['Xpower', 'Other'],
  Tern: ['Link A7', 'Verge X11', 'Other'],
  Brompton: ['C Line', 'P Line', 'Other'],
  Dahon: ['Mariner D8', 'Other'],
  Bickerton: ['Junction', 'Other'],
  'State Bicycle Co': ['4130', 'Other'],
  'Pure Cycles': ['Fixed Gear', 'Other'],
  Fuji: ['Absolute', 'Sportif', 'Track', 'Other'],
  Crew: ['District', 'Other'],
  Aventon: ['Cordoba', 'Other'],
  Santana: ['Arriva', 'Other'],
  'Co-Motion': ['Java', 'Other'],
  Raleigh: ['Pioneer', 'Other'],
  Surly: ['Disc Trucker', 'Other'],
  Salsa: ['Marrakesh', 'Other'],
  Ridgeback: ['World', 'Other'],
  Cervélo: ['P-Series', 'Other'],
  Look: ['765', 'Other'],
  Dolan: ['Track', 'Other'],
  'Van Raam': ['Fun2Go', 'Other'],
  'Hase Bikes': ['Kettwiesel', 'Other'],
  ICE: ['Adventure', 'Other'],
  TerraTrike: ['Rambler', 'Other'],
  Catrike: ['Trail', 'Other'],
  'Sun Seeker': ['Eco-Delta', 'Other'],
  Mobo: ['Mobo Cruiser', 'Other'],
  Firefly: ['Tricycle', 'Other'],
  Trailmate: ['Fun Cycle', 'Other'],
  Yuba: ['Mundo', 'Other'],
  Xtracycle: ['Swoop', 'Other'],
  'Riese & Müller': ['Load', 'Other'],
};

/** Brands that make the picked bicycle type; every brand when no type is set. */
export const getBicycleBrands = (type: string): string[] =>
  BICYCLE_TYPE_BRANDS[type] ?? [];

/** Models the picked brand sells. */
export const getBicycleModels = (brand: string): string[] =>
  BICYCLE_BRAND_MODELS[brand] ?? [BICYCLE_OTHER];

// The five parts/accessory fields shown on the Description tab.
export const BICYCLE_FRAME_TYPES: string[] = [
  'Hardtail frame', 'Full-suspension frame', 'Road frame', 'Gravel frame',
  'Track frame', 'BMX frame', 'Fat-bike frame', 'Kids frame',
  'Frameset (frame + fork)', 'Fork', 'Other',
];

export const BICYCLE_PART_TYPES: string[] = [
  'Drivetrain', 'Groupset', 'Wheelset', 'Brakes', 'Suspension',
  'Handlebar & stem', 'Saddle & seatpost', 'Pedals', 'Tyres & tubes',
  'Chain & cassette', 'Bottom bracket', 'Cables & housing', 'Other',
];

export const BICYCLE_ACCESSORY_TYPES: string[] = [
  'Helmet', 'Lights', 'Locks', 'Bottle cage & bottle', 'Mudguards',
  'Bell & horn', 'Gloves', 'Pump', 'Saddle bag', 'Phone mount',
  'Training wheels', 'Reflectors', 'Other',
];

export const BICYCLE_STORAGE_TYPES: string[] = [
  'Car roof rack', 'Rear car rack', 'Hitch rack', 'Wall mount', 'Floor stand',
  'Ceiling hoist', 'Bike cover', 'Bike bag / travel case', 'Other',
];

export const BICYCLE_REPAIR_TYPES: string[] = [
  'Tool kit', 'Torque wrench', 'Chain tool', 'Repair stand', 'Truing stand',
  'Floor pump', 'Tyre levers', 'Degreaser & lubricants', 'Work mat', 'Other',
];

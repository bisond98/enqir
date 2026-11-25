// Sneaker catalogue — gender-first picker used by the Sell listing form and the
// Post Enquiry form.
//
// The picker starts with the gender (Men / Ladies / Unisex / Kids). The brand
// list then shows only brands that make shoes for that gender (unisex styles
// count for Men and Ladies), and the model list only that gender's models —
// unisex models are always included. Kids listings only offer kids sizes.

export type SneakerGender = 'Men' | 'Ladies' | 'Unisex' | 'Kids';

export const SNEAKER_GENDERS: SneakerGender[] = ['Men', 'Ladies', 'Unisex', 'Kids'];

type GenderModels = {
  men: string[];
  ladies: string[];
  kids: string[];
  unisex: string[];
};

// Model names per brand. Every brand in SNEAKER_BRANDS has an entry, so no brand
// is missing from the gender pickers.
const SNEAKER_MODELS: Record<string, GenderModels> = {
  Nike: {
    men: ['Air Force 1', "Air Force 1 '07", 'Air Max 90', 'Air Max 95', 'Air Max 97', 'Air Max 270', 'Air Max 720', 'Dunk Low', 'Dunk High', 'Cortez', 'Pegasus 40', 'Pegasus 41', 'Revolution 7', 'Downshifter 13', 'Vomero 17', 'Invincible 3', 'Court Vision Low'],
    ladies: ['Air Force 1 Shadow', 'Air Max 270', 'Air Max 90', 'Dunk Low', 'Court Vision', 'Pegasus 40', 'Revolution 7', 'Waffle Debut', 'Daybreak', 'Blazer Low'],
    kids: ['Air Force 1', 'Dunk Low', 'Court Borough Low', 'Revolution 7', 'Air Max 90', 'Star Runner'],
    unisex: ['Dunk Low', "Air Force 1 '07", "Blazer Mid '77", 'Air Max 90', 'Cortez'],
  },
  Adidas: {
    men: ['Ultraboost Light', 'Ultraboost 24', 'NMD_R1', 'NMD_S1', 'Superstar', 'Stan Smith', 'Samba OG', 'Gazelle', 'Campus 00s', 'Forum Low', 'Duramo SL', 'Runfalcon 5', 'Adizero SL', 'Solarglide 6', 'Response 4'],
    ladies: ['Ultraboost Light', 'Superstar', 'Stan Smith', 'Samba OG', 'Gazelle', 'Duramo SL', 'Runfalcon 5', 'Advantage', 'Grand Court'],
    kids: ['Superstar', 'Stan Smith', 'Runfalcon 5', 'Tensaur Run', 'Duramo SL', 'RapidaZen'],
    unisex: ['Samba OG', 'Gazelle', 'Superstar', 'Stan Smith', 'Campus 00s'],
  },
  Puma: {
    men: ['Suede Classic', 'Suede XL', 'RS-X', 'RS-Z', 'Smashic', 'Rider FV', 'Softride', 'Velocity Nitro 3', 'Deviate Nitro 3', 'Future Rider', 'Court Rider', 'Rebound Joy'],
    ladies: ['Suede Classic', 'Carina', 'Carina Street', 'Softride', 'Smash', 'Cali', 'Rider FV'],
    kids: ['Suede Classic', 'Smash', 'Carina', 'Rebound', 'RS-X'],
    unisex: ['Suede Classic', 'RS-X', 'Rider FV'],
  },
  Reebok: {
    men: ['Classic Leather', 'Club C 85', 'Club C Revenge', 'Nano X4', 'Energen Tech', 'Floatride Energy 5', 'BB 4000', 'Court Advance'],
    ladies: ['Classic Leather', 'Club C 85', 'Princess', 'Floatride Energy 5', 'Nano X4'],
    kids: ['Classic Leather', 'Club C', 'Energen'],
    unisex: ['Club C 85', 'Classic Leather'],
  },
  'New Balance': {
    men: ['574', '550', '327', '530', '9060', '2002R', '1906R', '1080v13', '880v14', 'Fresh Foam X More'],
    ladies: ['574', '327', '550', '530', '9060', 'Fresh Foam X', '1080v13'],
    kids: ['574', '327', '530', '455'],
    unisex: ['574', '327', '550', '2002R', '9060'],
  },
  Asics: {
    men: ['Gel-Kayano 31', 'Gel-Kayano 30', 'Gel-Nimbus 26', 'Gel-Nimbus 25', 'GT-2000 13', 'GT-1000 13', 'Gel-Contend 9', 'Gel-Cumulus 26', 'Novablast 4', 'Superblast 2'],
    ladies: ['Gel-Kayano 31', 'Gel-Nimbus 26', 'GT-2000 13', 'Gel-Contend 9', 'Gel-Cumulus 26', 'Novablast 4'],
    kids: ['Gel-Contend', 'Pre Excite', 'Gel-Noosa Tri'],
    unisex: ['Gel-Kayano 31', 'Novablast 4'],
  },
  Jordan: {
    men: ['Air Jordan 1 Low', 'Air Jordan 1 Mid', 'Air Jordan 1 High OG', 'Air Jordan 3', 'Air Jordan 4', 'Air Jordan 5', 'Air Jordan 11 Low', 'Air Jordan 12', 'Luka 3', 'Tatum 2', 'Zion 3'],
    ladies: ['Air Jordan 1 Low', 'Air Jordan 1 Mid', 'Air Jordan 4', 'Luka 3'],
    kids: ['Air Jordan 1 Low', 'Air Jordan 1 Mid', 'Air Jordan 4', 'Luka 3'],
    unisex: ['Air Jordan 1 Low', 'Air Jordan 1 Mid'],
  },
  Converse: {
    men: ['Chuck Taylor All Star High', 'Chuck Taylor All Star Low', 'Chuck 70 High', 'Chuck 70 Low', 'One Star', 'Run Star Hike', 'Run Star Motion', 'Jack Purcell', 'G4'],
    ladies: ['Chuck Taylor All Star', 'Chuck 70', 'Run Star Hike', 'Run Star Motion', 'One Star', 'Dainty'],
    kids: ['Chuck Taylor All Star', 'Chuck 70', 'Run Star'],
    unisex: ['Chuck 70', 'Chuck Taylor All Star'],
  },
  Vans: {
    men: ['Old Skool', 'Authentic', 'Knu Skool', 'Sk8-Hi', 'Sk8-Low', 'Era', 'UltraRange EXO', 'Slip-On', 'Rowan', 'Gilbert Crockett'],
    ladies: ['Old Skool', 'Authentic', 'Knu Skool', 'Slip-On', 'Era', 'Sk8-Hi'],
    kids: ['Old Skool', 'Authentic', 'Slip-On', 'Sk8-Hi'],
    unisex: ['Old Skool', 'Authentic', 'Slip-On', 'Sk8-Hi'],
  },
  Skechers: {
    men: ['Go Walk 7', 'Go Walk 6', "D'Lux Walker", 'Arch Fit', 'Max Cushioning', 'Summits', 'Uno', 'Work Relaxed Fit'],
    ladies: ['Go Walk 7', "D'Lites", 'Arch Fit', 'Uno', 'Summits', 'Bobs', 'Max Cushioning'],
    kids: ['S-Lights', 'Go Run', 'Uno', 'Twinkle Toes'],
    unisex: ['Go Walk 7'],
  },
  'Under Armour': {
    men: ['HOVR Phantom 3', 'HOVR Sonic 6', 'Charged Assert 10', 'Charged Rogue 4', 'Curry Flow 11', 'Curry 3Z', 'TriBase Reign 5', 'Project Rock 6'],
    ladies: ['HOVR Phantom 3', 'HOVR Sonic 6', 'Charged Assert', 'Flow Dynamic'],
    kids: ['Charged Rogue', 'Curry 3Z', 'Charged Assert'],
    unisex: ['HOVR Sonic 6'],
  },
  'On Running': {
    men: ['Cloud 5', 'Cloud 5 Waterproof', 'Cloudmonster', 'Cloudmonster 2', 'Cloudswift 3', 'Cloudrunner 2', 'Cloudsurfer 7', 'Cloudvista 2', 'Cloudwander'],
    ladies: ['Cloud 5', 'Cloudswift 3', 'Cloudrunner 2', 'Cloudsurfer 7', 'Cloud X 3'],
    kids: ['Cloud Play', 'Cloudhero'],
    unisex: ['Cloud 5', 'Cloudmonster'],
  },
  Hoka: {
    men: ['Clifton 9', 'Clifton 10', 'Bondi 8', 'Bondi 9', 'Arahi 7', 'Gaviota 5', 'Mach 6', 'Speedgoat 6', 'Rincon 4', 'Kaha 2'],
    ladies: ['Clifton 9', 'Bondi 8', 'Arahi 7', 'Mach 6', 'Rincon 4', 'Gaviota 5'],
    kids: ['Clifton 9', 'Torrent'],
    unisex: ['Clifton 9', 'Bondi 8', 'Speedgoat 6'],
  },
  Salomon: {
    men: ['Speedcross 6', 'Speedcross Peak', 'XT-6', 'XT-4', 'XT-Quest', 'Ultra Glide 2', 'Sense Ride 5', 'Pulsar Trail', 'ACS Pro'],
    ladies: ['Speedcross 6', 'XT-6', 'Ultra Glide 2', 'Sense Ride 5', 'Pulsar Trail'],
    kids: ['Speedcross', 'XT-6'],
    unisex: ['XT-6', 'Speedcross 6', 'ACS Pro'],
  },
  Brooks: {
    men: ['Ghost 16', 'Ghost 15', 'Adrenaline GTS 24', 'Adrenaline GTS 23', 'Glycerin 22', 'Glycerin 21', 'Launch 10', 'Levitate 6', 'Caldera 7', 'Beast 24'],
    ladies: ['Ghost 16', 'Ghost 15', 'Adrenaline GTS 24', 'Adrenaline GTS 23', 'Glycerin 21', 'Launch 10', 'Trace 3'],
    kids: ['Ghost', 'Adrenaline'],
    unisex: ['Ghost 16'],
  },
  Saucony: {
    men: ['Endorphin Speed 3', 'Endorphin Pro 3', 'Kinvara 15', 'Kinvara 14', 'Ride 17', 'Ride 16', 'Guide 16', 'Triumph 21', 'Peregrine 13', 'Xodus Ultra 2'],
    ladies: ['Kinvara 14', 'Ride 16', 'Guide 16', 'Endorphin Speed 3', 'Triumph 21'],
    kids: ['Kinvara', 'Ride'],
    unisex: ['Endorphin Speed 3'],
  },
  Mizuno: {
    men: ['Wave Rider 28', 'Wave Rider 27', 'Wave Inspire 20', 'Wave Sky 7', 'Wave Rebellion', 'Wave Daichi 8', 'Wave Mujin 9', 'Wave Prophecy 12'],
    ladies: ['Wave Rider 27', 'Wave Inspire 20', 'Wave Sky 7', 'Wave Rebellion'],
    kids: ['Wave Rider', 'Wave Twister'],
    unisex: ['Wave Rider 27'],
  },
  Fila: {
    men: ['Disruptor 2', 'Disruptor Premium', 'Ray Tracer', 'Memory Workshift', 'Original Fitness', 'Grant Hill 2'],
    ladies: ['Disruptor 2', 'Ray Tracer', 'Memory Breaker', 'Original Fitness'],
    kids: ['Disruptor 2', 'Ray Tracer'],
    unisex: ['Disruptor 2'],
  },
  Campus: {
    men: ['Campus First', 'Campus Lloyd', 'Campus Bond', 'Campus Maximus', 'Campus Zoe'],
    ladies: ['Campus First', 'Campus Zoe', 'Campus Beth'],
    kids: ['Campus First', 'Campus Polly'],
    unisex: ['Campus First'],
  },
  Sparx: {
    men: ['SM-421', 'SM-631', 'SM-682', 'SM-710', 'SM-808'],
    ladies: ['SL-171', 'SL-204', 'SL-238'],
    kids: ['SK-101', 'SK-105', 'SK-120'],
    unisex: ['SM-421'],
  },
  Crocs: {
    men: ['Classic Clog', 'LiteRide 360', 'Swiftwater', 'Baya Clog', 'Classic Slides'],
    ladies: ['Classic Clog', 'LiteRide 360', 'Kadee', 'Baya Clog', 'Brooklyn'],
    kids: ["Kids' Classic Clog", "Kids' Baya", "Kids' LiteRide"],
    unisex: ['Classic Clog', 'LiteRide 360', 'Baya Clog'],
  },
  Bata: {
    men: ['Power Walker', 'Boss-Grip', 'Bata Tennis', 'North Star', 'Wind'],
    ladies: ['Comfit', 'Bata New', 'Theresa', 'Marie'],
    kids: ['Bubblegummers', 'Bata Kids', 'Disney'],
    unisex: ['Bata Tennis'],
  },
  Woodland: {
    men: ['GC 0951', 'Casual Leather', 'Climber', 'Ozone', 'Gurkha'],
    ladies: ['Woodland For Her', 'Ankle Boot'],
    kids: ['Woodland Kids'],
    unisex: ['GC 0951'],
  },
  Lacoste: {
    men: ['Carnaby', 'Powercourt', 'L001', 'Rene', 'T-Clip', 'Court-Drive'],
    ladies: ['Carnaby', 'L001', 'Rene', 'T-Clip'],
    kids: ['Carnaby', 'T-Clip'],
    unisex: ['Carnaby'],
  },
  Yeezy: {
    men: [],
    ladies: [],
    kids: ['Boost 350 V2 Kids', 'Foam RNNR Kids', 'Slide Kids'],
    unisex: ['Boost 350 V2', 'Boost 350 V2 CMPCT', 'Slide', 'Foam RNNR', '500', '700', 'QNTM'],
  },
  Anta: {
    men: ['KT 9', 'KT 8', 'Flash 6', 'Shock The Game', 'C202 GT'],
    ladies: ['Anta Running', 'Anta Sneaker'],
    kids: ['Anta Kids'],
    unisex: ['Flash 6'],
  },
  'Li-Ning': {
    men: ['Way of Wade 11', 'Way of Wade All City 12', 'Sonic 11', 'Feidian 4', 'Yueying 4'],
    ladies: ['Li-Ning Running', 'Li-Ning Casual'],
    kids: ['Li-Ning Kids'],
    unisex: ['Feidian 4'],
  },
  Merrell: {
    men: ['Moab 3', 'Moab Speed 2', 'Hydro Moc', 'Agility Peak 5', 'Trail Glove 7'],
    ladies: ['Moab 3', 'Antora 3', 'Hydro Moc'],
    kids: ['Moab', 'Bare Steps'],
    unisex: ['Hydro Moc'],
  },
  'K-Swiss': {
    men: ['Classic VN', 'Classic LX', 'Court Pro II', 'Hypercourt Express 2', 'Tubes'],
    ladies: ['Classic VN', 'Court Pro II', 'Hypercourt'],
    kids: ['Classic VN', 'Court'],
    unisex: ['Classic VN'],
  },
  Veja: {
    men: [],
    ladies: [],
    kids: ['V-10 Kids'],
    unisex: ['V-10', 'V-12', 'Campo', 'Esplar'],
  },
  Balenciaga: {
    men: [],
    ladies: ['Track', 'Speed Trainer'],
    kids: [],
    unisex: ['Triple S', 'Speed Trainer', 'Track', 'Drive'],
  },
  Yonex: {
    men: [],
    ladies: [],
    kids: ['Power Cushion Kids'],
    unisex: ['Power Cushion 65', 'Power Cushion Eclipsion', 'Aerus'],
  },
};

const GENDER_KEY: Record<Exclude<SneakerGender, 'Unisex'>, keyof GenderModels> = {
  Men: 'men',
  Ladies: 'ladies',
  Kids: 'kids',
};

/** Brands that make shoes for this gender. Unisex shows every brand. */
export function getSneakerBrands(gender: string): string[] {
  const brands = Object.keys(SNEAKER_MODELS).filter((brand) => {
    // Unisex styling exists at every brand in the catalogue.
    if (gender === 'Unisex' || !(gender in GENDER_KEY)) return true;
    const models = SNEAKER_MODELS[brand];
    const key = GENDER_KEY[gender as Exclude<SneakerGender, 'Unisex'>];
    return models[key].length > 0 || models.unisex.length > 0;
  });
  return brands.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/** Models that brand sells for this gender, unisex models included. */
export function getSneakerModels(brand: string, gender: string): string[] {
  const models = SNEAKER_MODELS[brand];
  if (!models) return [];
  let list: string[];
  if (gender === 'Unisex') {
    // Unisex asks for the shared styles; a brand with none falls back to its
    // full catalogue so the picker is never empty behind a visible brand.
    list = models.unisex.length > 0
      ? models.unisex
      : [...models.men, ...models.ladies, ...models.kids];
  } else if (gender in GENDER_KEY) {
    const key = GENDER_KEY[gender as Exclude<SneakerGender, 'Unisex'>];
    list = [...models[key], ...models.unisex];
  } else {
    list = [...models.men, ...models.ladies, ...models.kids, ...models.unisex];
  }
  return Array.from(new Set(list));
}

/** Kids listings only offer kids sizes; everything else uses adult sizes. */
export function isKidsGender(gender: string): boolean {
  return gender === 'Kids';
}

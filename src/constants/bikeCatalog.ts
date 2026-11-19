// Motorcycle / scooter catalogue for the Brand -> Model pickers.
// Every maker sold in India, with both the current line-up and the models
// still common in the used market (Pegasus, Thunderbird, RX100, Chetak …).
// "Other" is always offered last so an unlisted model can still be recorded.

export const BIKE_MODEL_OTHER = 'Other';

const BIKE_MODELS: Record<string, string[]> = {
  Aprilia: [
    'SR 125', 'SR 150', 'SR 160', 'SXR 125', 'SXR 160', 'RS 457', 'Tuono 457',
    'RSV4', 'Tuono V4',
  ],
  Ather: ['450 Apex', '450S', '450X', 'Rizta'],
  Ampere: ['Magnus', 'Nexus', 'Primus', 'Reo', 'Zeal', 'V60'],
  Bajaj: [
    'Avenger 160 Street', 'Avenger 220 Cruise', 'Avenger 220 Street',
    'Boxer 150', 'Chetak', 'Chetak 2901', 'CT 100', 'CT 110X', 'Discover 100',
    'Discover 110', 'Discover 125', 'Discover 135', 'Discover 150',
    'Dominar 250', 'Dominar 400', 'Freedom 125', 'Kristal 110', 'Legend 110',
    'M80', 'Platina 100', 'Platina 110', 'Platina 125', 'Pulsar 125',
    'Pulsar 135 LS', 'Pulsar 150', 'Pulsar 180', 'Pulsar 200 NS',
    'Pulsar 220 F', 'Pulsar N150', 'Pulsar N160', 'Pulsar N250',
    'Pulsar NS160', 'Pulsar NS200', 'Pulsar NS400Z', 'Pulsar RS200',
    'V12', 'V15', 'XCD 125', 'XCD 135',
  ],
  Benelli: [
    '302R', '502C', 'Imperiale 400', 'Leoncino 250', 'Leoncino 500',
    'TRK 251', 'TRK 502', 'TRK 502X',
  ],
  BGauss: ['C12', 'C12i', 'D15', 'RUV350'],
  BMW: [
    'C 400 GT', 'CE 04', 'F 900 R', 'F 900 XR', 'G 310 GS', 'G 310 R',
    'R 1250 GS', 'R 1300 GS', 'S 1000 RR',
  ],
  BSA: ['Gold Star 650', 'Scrambler 650'],
  Bounce: ['Infinity E1', 'Infinity E1X'],
  CFMoto: ['250 SR', '300 NK', '300 SR', '650 MT', '650 NK', '800 MT', 'MT 450'],
  Ducati: [
    'DesertX', 'Diavel V4', 'Hypermotard 698', 'Monster', 'Multistrada V2',
    'Multistrada V4', 'Panigale V2', 'Panigale V4', 'Scrambler Icon',
    'Scrambler Nightshift', 'Streetfighter V2', 'Supersport 950',
  ],
  'Harley-Davidson': [
    'Forty-Eight', 'Iron 883', 'Nightster', 'Night Rod Special', 'Pan America 1250',
    'Road King', 'Sportster S', 'Street 750', 'Street Bob 114', 'X440',
  ],
  Hero: [
    'Achiever', 'Ambition', 'CBZ', 'CBZ Xtreme', 'Dash 110', 'Destini 125',
    'Duet', 'Glamour', 'Glamour X', 'HF 100', 'HF Deluxe', 'Ignitor',
    'iSmart 110', 'Karizma', 'Karizma R', 'Karizma XMR', 'Karizma ZMR',
    'Maestro', 'Maestro Edge 110', 'Maestro Edge 125', 'Mavrick 440',
    'Passion Plus', 'Passion Pro', 'Pleasure', 'Pleasure+ 110', 'Splendor',
    'Splendor+ XTEC', 'Splendor iSmart', 'Splendor Plus', 'Vida V1', 'Vida V2',
    'Xpulse 200', 'Xpulse 200 4V', 'Xpulse 210', 'Xtreme 125R', 'Xtreme 160R',
    'Xtreme 200S', 'Xtreme 250R',
  ],
  'Hero Electric': [
    'Dash', 'Eddy', 'Flash', 'NYX', 'Optima', 'Optima CX', 'Photon', 'Wave',
  ],
  Honda: [
    'Activa 125', 'Activa 3G', 'Activa 4G', 'Activa 5G', 'Activa 6G',
    'Activa e', 'Aviator', 'CB 110 Dream', 'CB Hornet 160R', 'CB Shine',
    'CB Shine SP', 'CB Trigger', 'CB Unicorn 150', 'CB Unicorn 160',
    'CB200X', 'CB300F', 'CB350', "CB350 H'ness", 'CB350RS', 'CBR 150R',
    'CBR 250R', 'CD 110 Dream', 'Cliq', 'Dio', 'Dio 125', 'Dream Neo',
    'Dream Yuga', 'Eterno', 'Grazia 125', 'Hornet 2.0', 'Livo', 'Navi',
    'NX200', 'QC1', 'Shine 100', 'Shine 125', 'SP 125', 'SP 160',
    'Unicorn', 'X-Blade',
  ],
  Husqvarna: ['Svartpilen 250', 'Svartpilen 401', 'Vitpilen 250', 'Vitpilen 401'],
  Indian: ['Chief', 'Chief Dark Horse', 'Chieftain', 'Roadmaster', 'Scout', 'Scout Bobber'],
  Jawa: ['42', '42 Bobber', '42 FJ', '350', 'Perak'],
  'Joy e-bike': ['Glob', 'Hurricane', 'Monster', 'Skyline', 'Wolf', 'Wolf+'],
  Kawasaki: [
    'Eliminator 400', 'KLX 230', 'Ninja 300', 'Ninja 400', 'Ninja 500',
    'Ninja 650', 'Ninja 1000SX', 'Ninja ZX-6R', 'Versys 650', 'W800', 'Z400',
    'Z650', 'Z900',
  ],
  Keeway: ['K-Light 250', 'SR 250', 'SRV 300', 'Vieste 300', 'Vieste 500'],
  'Kinetic Green': ['E-Luna', 'Flex', 'Zoom', 'Zoom 2.0'],
  Komaki: ['GT', 'MX3', 'Ranger', 'SE', 'XGT', 'XT'],
  KTM: [
    'Duke 125', 'Duke 200', 'Duke 250', 'Duke 390', 'Duke 690',
    'Adventure 250', 'Adventure 390', 'Adventure 890', 'RC 125', 'RC 200',
    'RC 390',
  ],
  Matter: ['AERA', 'AERA 5000'],
  'Moto Guzzi': ['V7', 'V7 Stone', 'V85 TT', 'V9 Bobber', 'V9 Roamer'],
  'Moto Morini': ['Seiemmezzo', 'X-Cape 650', 'X-Cape 1200'],
  Odysse: ['E2', 'Racer', 'V2', 'V2 Plus'],
  Okinawa: ['Dual 1000', 'Lite', 'Oki 90', 'Praise', 'Ridge', 'Ridge Plus'],
  'Ola Electric': [
    'Roadster', 'Roadster X', 'S1 Air', 'S1 Pro', 'S1 X', 'S1 X+',
  ],
  'Pure EV': ['EcoDryft', 'EPluto 7G', 'EPluto 7G Max', 'ETrance', 'ETrance Neo'],
  'QJ Motor': ['SVR 300', 'SRV 300', 'SRK 600', 'SRT 550'],
  Revolt: ['RV300', 'RV400', 'RV400 BRZ'],
  River: ['Indie'],
  'Royal Enfield': [
    'Bear 650', 'Bullet 350', 'Bullet 500', 'Classic 350', 'Classic 500',
    'Classic 650', 'Continental GT 650', 'Electra 350', 'Flying Flea',
    'Guerrilla 450', 'Himalayan 411', 'Himalayan 450', 'Hunter 350',
    'Interceptor 650', 'Meteor 350', 'Pegasus 350', 'Pegasus 500',
    'Scram 411', 'Scram 440', 'Shotgun 650', 'Super Meteor 650',
    'Thunderbird 350', 'Thunderbird 350X', 'Thunderbird 500',
    'Thunderbird 500X', 'Trials 350',
  ],
  'Simple Energy': ['Dot One', 'Dot One 2.0'],
  Suzuki: [
    'Access 125', 'Avenis', 'Burgman Street', 'Burgman Street EX', 'Gixxer',
    'Gixxer 250', 'Gixxer SF', 'Gixxer SF 250', 'Hayabusa', 'Heat', 'Intruder 150',
    'Katana', 'Lets', 'Samurai', 'Shogun', 'Slingshot', 'Swish', 'V-Strom SX',
    'V-Strom 650', 'Zeus',
  ],
  Tork: ['Kratos', 'Kratos R'],
  Triumph: [
    'Bonneville T100', 'Bonneville T120', 'Daytona 660', 'Rocket 3',
    'Scrambler 400X', 'Scrambler 900', 'Speed 400', 'Speed Twin 900',
    'Speed Triple 1200', 'Street Triple', 'Thruxton 400', 'Tiger 900',
  ],
  TVS: [
    'Apache RTR 160', 'Apache RTR 160 4V', 'Apache RTR 180', 'Apache RTR 200 4V',
    'Apache RTR 310', 'Apache RR 310', 'Flame', 'iQube', 'iQube S', 'iQube ST',
    'Jive', 'Jupiter 110', 'Jupiter 125', 'Max 4R', 'Ntorq 125', 'Radeon',
    'Raider 125', 'Ronin', 'Scooty Pep+', 'Scooty Teenz', 'Scooty Zest',
    'Sport', 'Star City+', 'Star Sport', 'Victor', 'Wego', 'XL 100', 'XL Super',
    'Zest 110',
  ],
  Ultraviolette: ['F77', 'F77 Mach 2', 'Shockwave', 'Tesseract'],
  UM: ['Renegade Commando', 'Renegade Sport S', 'Xtreet 200'],
  Vespa: ['Elegante 150', 'LX 125', 'SXL 125', 'SXL 150', 'VXL 125', 'VXL 150'],
  Voge: ['300 RR', '300 Rally', '525 DSX', '900 DSX'],
  Yamaha: [
    'Aerox 155', 'Alpha', 'Crux', 'Enticer 125', 'Fascino 110', 'Fascino 125',
    'Fazer', 'FZ 150', 'FZ-S Fi', 'FZ-X', 'Gladiator', 'MT-03', 'MT-15',
    'R15', 'R15M', 'R3', 'Ray', 'Ray Z', 'Ray ZR 125', 'RX 100', 'RX 135',
    'RD 350', 'Saluto', 'SZ-R', 'XSR 155',
  ],
  Yezdi: ['Adventure', 'Roadster', 'Scrambler'],
  Zontes: ['350 R', '350 X', '350 T', '703 F'],
};

export const BIKE_MODEL_BRANDS: string[] = Object.keys(BIKE_MODELS);

/** Models the maker actually sells in India, listed A-Z; empty until a brand
 *  is picked (or for makers with no catalogue yet). */
export function getBikeModels(brand: string): string[] {
  if (!brand) return [];
  return [...(BIKE_MODELS[brand] ?? [])].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );
}

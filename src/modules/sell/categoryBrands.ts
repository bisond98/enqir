// Shared brand lists used by both the Sell form (categoryDetails.ts)
// and the Post Enquiry form's vehicle detail inputs.
// 'Other' is always last so the free choice sits where people expect it.

export const CAR_BRANDS = [
  'Alfa Romeo', 'Aston Martin', 'Audi', 'Audi RS', 'Austin', 'Bentley', 'BMW',
  'BMW M', 'Bugatti', 'BYD', 'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën',
  'Daewoo', 'Datsun', 'Dodge', 'Ferrari', 'Fiat', 'Force', 'Ford', 'GMC',
  'Hillman', 'Hindustan Motors', 'Honda', 'Hummer', 'Hyundai', 'Ineos', 'Isuzu',
  'Jaecoo', 'Jaguar', 'Jeep', 'Kia', 'Koenigsegg', 'Lamborghini', 'Land Rover',
  'Lexus', 'Lotus', 'Mahindra', 'Maruti Suzuki', 'Maserati', 'Maybach',
  'McLaren', 'Mercedes-AMG', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi',
  'Morris', 'Nissan', 'Omoda', 'Opel', 'Pagani', 'Peugeot', 'Porsche', 'Premier',
  'Renault', 'Rolls-Royce', 'Rover', 'Saab', 'San Motors', 'Shelby', 'Simca',
  'Sipani', 'Skoda', 'Standard', 'Tata', 'Tesla', 'Toyota', 'Triumph', 'Vauxhall',
  'VinFast', 'Volkswagen', 'Volvo', 'Wiesmann', 'Wolseley', 'Other',
];

export const BIKE_BRANDS = [
  'Ampere', 'Aprilia', 'Ather', 'Bajaj', 'Benelli', 'BGauss', 'BMW', 'Bounce',
  'BSA', 'CFMoto', 'Ducati', 'Harley-Davidson', 'Hero', 'Hero Electric', 'Honda',
  'Husqvarna', 'Indian', 'Jawa', 'Joy e-bike', 'Kawasaki', 'Keeway',
  'Kinetic Green', 'Komaki', 'KTM', 'Matter', 'Moto Guzzi', 'Moto Morini',
  'Odysse', 'Okinawa', 'Ola Electric', 'Pure EV', 'QJ Motor', 'Revolt', 'River',
  'Royal Enfield', 'Simple Energy', 'Suzuki', 'Tork', 'Triumph', 'TVS',
  'Ultraviolette', 'UM', 'Vespa', 'Voge', 'Yamaha', 'Yezdi', 'Zontes', 'Other',
];

// Phones live in one catalogue shared by both forms, so the Sell listing and
// the Post Enquiry form always offer the same brands and the same models behind
// them. Re-exported here because existing callers import the brand list from
// this file.
export { MOBILE_BRANDS } from '@/constants/mobileCatalog';

export const SNEAKER_BRANDS = [
  '361 Degrees', 'Adidas', 'Alexander McQueen', 'Allbirds', 'Altra', 'Anta', "Arc'teryx", 'Ariat',
  'Asics', 'Autry', 'Balenciaga', 'Bape', 'Bata', 'Blundstone', 'Brooks', 'Camper',
  'Campus', 'CAT', 'Clarks', 'Columbia', 'Common Projects', 'Converse', 'Crocs', 'Danner',
  'Diadora', 'Dr. Martens', 'Ecco', 'Fear of God', 'Fila', 'Gola', 'Golden Goose', 'Hey Dude',
  'Hoka', 'Hummel', 'Inov-8', 'Joma', 'Jordan', 'K-Swiss', 'Karhu', 'Keds',
  'Keen', 'La Sportiva', 'Lacoste', 'Le Coq Sportif', 'Li-Ning', 'Lotto', 'Lowa', 'Merrell',
  'Mizuno', 'New Balance', 'Nike', 'No Bull', 'Off-White', 'On Running', 'Onitsuka Tiger', 'Palladium',
  'Peak', 'Puma', 'Red Wing', 'Reebok', 'Rick Owens', 'Salomon', 'Saucony', 'Scarpa',
  'Skechers', 'Solovair', 'Sorel', 'Sparx', 'Superga', 'The North Face', 'Timberland', 'Toms',
  'Topo Athletic', 'UGG', 'Umbro', 'Under Armour', 'Vans', 'Veja', 'Vibram', 'Vivobarefoot',
  'Wolverine', 'Woodland', 'Xero Shoes', 'Yeezy', 'Yonex', 'Other',
];

// Commercial, construction and farm vehicle makers — trucks, lorries, pickups,
// tippers, three-wheeler cargo, earthmovers and tractors, not just car marques.
// Names already in CAR_BRANDS (Tata, Mahindra, Isuzu, Force, Volvo, Hyundai) are
// not repeated here; VEHICLE_BRANDS de-duplicates before sorting.
const COMMERCIAL_VEHICLE_BRANDS = [
  // Trucks & buses
  'AMW', 'Ashok Leyland', 'BharatBenz', 'BYD', 'DAF', 'Eicher', 'Freightliner',
  'Hino', 'International', 'Iveco', 'JBM Auto', 'Kamaz', 'Kenworth', 'Mack',
  'MAN', 'Mitsubishi Fuso', 'Olectra', 'Peterbilt', 'Piaggio', 'Scania',
  'SML Isuzu', 'Switch Mobility', 'UD Trucks',
  // Three-wheeler & last-mile cargo
  'Altigreen', 'Bajaj', 'Etrio', 'Euler Motors', 'YC Electric',
  // Earthmoving & construction
  'ACE', 'Ajax Fiori', 'Bobcat', 'Case', 'Caterpillar', 'Doosan', 'Hitachi',
  'JCB', 'Kobelco', 'Komatsu', 'LiuGong', 'SANY', 'Schwing Stetter', 'Takeuchi',
  'XCMG', 'Yanmar',
  // Tractors & farm
  'Captain', 'Claas', 'Deutz-Fahr', 'Escorts', 'Farmtrac', 'John Deere',
  'Kubota', 'Massey Ferguson', 'New Holland', 'Powertrac', 'Sonalika',
  'Swaraj', 'TAFE', 'VST',
];

// All vehicle makers: cars plus trucks, earthmovers and tractors.
export const VEHICLE_BRANDS = Array.from(
  new Set([...CAR_BRANDS.filter((b) => b !== 'Other'), ...COMMERCIAL_VEHICLE_BRANDS]),
).sort((a, b) => a.localeCompare(b)).concat('Other');

// Vehicle body types for the enquiry form — trucks and commercial bodies first,
// 'Other' stays last so the free choice sits where people expect it.
export const VEHICLE_TYPES = [
  // Goods & haulage
  'Truck', 'Lorry', 'Container Truck', 'Flatbed', 'Pickup', 'Mini Truck',
  'Tipper', 'Tanker', 'Trailer',
  // Passenger & light commercial
  'Tempo', 'Van', 'Cargo Van', 'Bus', 'Mini Bus', 'School Bus', 'Ambulance',
  'Auto Rickshaw', 'E-Rickshaw', 'Three Wheeler',
  // Farm & construction
  'Tractor', 'Power Tiller', 'Tractor Trolley', 'Harvester', 'JCB / Construction',
  'Excavator', 'Dumper', 'Bulldozer', 'Road Roller', 'Crane', 'Forklift',
  'Fire Truck',
  // Era marker that spans every make
  'Vintage / Classic',
  'Other',
];

// Which makers actually build each body type, so picking "Bus" only offers bus
// makers. Anything not listed here falls back to the full vehicle brand list.
const VEHICLE_BRANDS_BY_TYPE: Record<string, string[]> = {
  Truck: [
    'AMW', 'Ashok Leyland', 'BharatBenz', 'DAF', 'Eicher', 'Force', 'Freightliner',
    'Hino', 'International', 'Isuzu', 'Iveco', 'Kamaz', 'Kenworth', 'Mack', 'MAN',
    'Mitsubishi Fuso', 'Peterbilt', 'Piaggio', 'Scania', 'SML Isuzu', 'Tata',
    'UD Trucks', 'Volvo',
  ],
  Lorry: [
    'AMW', 'Ashok Leyland', 'BharatBenz', 'DAF', 'Eicher', 'Hino', 'Isuzu',
    'Kamaz', 'MAN', 'Scania', 'SML Isuzu', 'Tata', 'UD Trucks', 'Volvo',
  ],
  Pickup: [
    'Ashok Leyland', 'Force', 'Isuzu', 'Mahindra', 'Maruti Suzuki', 'Nissan',
    'Tata', 'Toyota',
  ],
  'Mini Truck': [
    'Altigreen', 'Ashok Leyland', 'Bajaj', 'Eicher', 'Etrio', 'Euler Motors',
    'Force', 'Mahindra', 'Maruti Suzuki', 'Piaggio', 'SML Isuzu', 'Tata',
    'YC Electric',
  ],
  Tipper: [
    'AMW', 'Ashok Leyland', 'BharatBenz', 'Eicher', 'MAN', 'Scania', 'Tata', 'Volvo',
  ],
  Tanker: ['Ashok Leyland', 'BharatBenz', 'Eicher', 'MAN', 'Scania', 'Tata', 'Volvo'],
  Trailer: [
    'Ashok Leyland', 'BharatBenz', 'DAF', 'Freightliner', 'Kenworth', 'Mack',
    'MAN', 'Peterbilt', 'Scania', 'Tata', 'Volvo',
  ],
  // Tempo / auto-rickshaw makers only — Maruti Suzuki sells mini trucks, not tempos.
  Tempo: ['Ashok Leyland', 'Bajaj', 'Force', 'Mahindra', 'Piaggio', 'Tata'],
  Van: ['Ashok Leyland', 'Force', 'Mahindra', 'Maruti Suzuki', 'Tata'],
  Bus: [
    'Ashok Leyland', 'BharatBenz', 'Eicher', 'Force', 'Hino', 'JBM Auto', 'MAN',
    'Olectra', 'Scania', 'SML Isuzu', 'Switch Mobility', 'Tata', 'Volvo',
  ],
  Tractor: [
    'Captain', 'Claas', 'Deutz-Fahr', 'Escorts', 'Farmtrac', 'John Deere', 'Kubota',
    'Mahindra', 'Massey Ferguson', 'New Holland', 'Powertrac', 'Sonalika', 'Swaraj',
    'TAFE', 'VST', 'Yanmar',
  ],
  'JCB / Construction': [
    'ACE', 'Ajax Fiori', 'Bobcat', 'Case', 'Caterpillar', 'Doosan', 'Hitachi', 'JCB',
    'Kobelco', 'Komatsu', 'LiuGong', 'SANY', 'Schwing Stetter', 'Takeuchi', 'XCMG',
    'Yanmar',
  ],
  'Container Truck': [
    'Ashok Leyland', 'BharatBenz', 'DAF', 'Eicher', 'Freightliner', 'MAN', 'Scania',
    'Tata', 'Volvo',
  ],
  Flatbed: [
    'Ashok Leyland', 'BharatBenz', 'Eicher', 'MAN', 'Scania', 'Tata', 'Volvo',
  ],
  'School Bus': [
    'Ashok Leyland', 'BharatBenz', 'Eicher', 'Force', 'JBM Auto', 'Olectra',
    'SML Isuzu', 'Switch Mobility', 'Tata', 'Volvo',
  ],
  Ambulance: ['Ashok Leyland', 'Force', 'Mahindra', 'Maruti Suzuki', 'Tata', 'Toyota'],
  'Auto Rickshaw': ['Bajaj', 'Mahindra', 'Piaggio', 'YC Electric'],
  'Three Wheeler': ['Bajaj', 'Mahindra', 'Piaggio', 'YC Electric'],
  'Tractor Trolley': [
    'Captain', 'Escorts', 'Farmtrac', 'John Deere', 'Mahindra', 'Massey Ferguson',
    'Powertrac', 'Sonalika', 'Swaraj', 'TAFE', 'VST',
  ],
  Harvester: ['Claas', 'John Deere', 'Kubota', 'New Holland', 'Yanmar'],
  Excavator: [
    'ACE', 'Case', 'Caterpillar', 'Doosan', 'Hitachi', 'JCB', 'Kobelco', 'Komatsu',
    'LiuGong', 'SANY', 'Takeuchi', 'XCMG',
  ],
  Bulldozer: ['Caterpillar', 'Hitachi', 'JCB', 'Komatsu', 'LiuGong', 'SANY', 'XCMG'],
  Crane: ['ACE', 'Ajax Fiori', 'Caterpillar', 'JCB', 'Schwing Stetter', 'Tata'],
  Forklift: ['Caterpillar', 'Doosan', 'JCB', 'Komatsu', 'Takeuchi', 'Toyota', 'Yanmar'],
  'Fire Truck': [
    'Ashok Leyland', 'BharatBenz', 'Eicher', 'MAN', 'Scania', 'Tata', 'Volvo',
  ],
  'Cargo Van': ['Ashok Leyland', 'Force', 'Mahindra', 'Maruti Suzuki', 'Tata'],
  'Mini Bus': [
    'Ashok Leyland', 'Force', 'Mahindra', 'Maruti Suzuki', 'SML Isuzu', 'Tata',
  ],
  'E-Rickshaw': ['Bajaj', 'Mahindra', 'Piaggio', 'YC Electric'],
  Dumper: [
    'ACE', 'Ashok Leyland', 'BharatBenz', 'Caterpillar', 'Doosan', 'JCB',
    'Komatsu', 'Tata',
  ],
  'Power Tiller': ['Captain', 'Kubota', 'Mahindra', 'VST', 'Yanmar'],
  'Road Roller': ['ACE', 'Case', 'Caterpillar', 'Hitachi', 'JCB', 'Komatsu'],
};

/** Makers for one body type, restricted to brands the dropdown already knows,
 *  with "Other" last. No type picked → the full vehicle list. */
/** Placeholder for the Vehicles variant box, worded for the picked body type:
 *  "e.g., variants of lorries", "e.g., variants of buses". */
export function getVehicleVariantHint(type: string): string {
  if (!type) return 'e.g., variants of lorry, pickup, truck';
  const lower = type.toLowerCase();
  const plural = lower.endsWith('y')
    ? `${lower.slice(0, -1)}ies`
    : lower.endsWith('s') ? (lower === 'bus' ? 'buses' : lower) : `${lower}s`;
  return `e.g., variants of ${plural}`;
}

export function getVehicleBrandsForType(type: string): string[] {
  const all = VEHICLE_BRANDS.filter((b) => b !== 'Other');
  const wanted = type ? VEHICLE_BRANDS_BY_TYPE[type] : undefined;
  if (!wanted || wanted.length === 0) return VEHICLE_BRANDS;
  const allowed = new Set(wanted);
  const filtered = all.filter((b) => allowed.has(b));
  return filtered.length > 0 ? [...filtered, 'Other'] : VEHICLE_BRANDS;
}


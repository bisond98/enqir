// Shared brand lists used by both the Sell form (categoryDetails.ts)
// and the Post Enquiry form's vehicle detail inputs.
// 'Other' is always last so the free choice sits where people expect it.

export const CAR_BRANDS = [
  'Aston Martin', 'Audi', 'Bentley', 'BMW', 'BYD', 'Chevrolet', 'Citroën',
  'Datsun', 'Ferrari', 'Fiat', 'Force', 'Ford', 'Hindustan Motors', 'Honda',
  'Hyundai', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
  'Lexus', 'Maruti Suzuki', 'Maserati', 'Mercedes-Benz', 'MG', 'Mini',
  'Mitsubishi', 'Nissan', 'Opel', 'Porsche', 'Premier', 'Renault',
  'Rolls-Royce', 'Skoda', 'Tata', 'Tesla', 'Toyota', 'VinFast', 'Volkswagen',
  'Volvo', 'Other',
];

export const BIKE_BRANDS = [
  'Ampere', 'Aprilia', 'Ather', 'Bajaj', 'Benelli', 'BSA', 'CFMoto', 'Ducati',
  'Harley-Davidson', 'Hero', 'Hero Electric', 'Honda', 'Husqvarna', 'Jawa',
  'Joy e-bike', 'Kawasaki', 'Keeway', 'Kinetic Green', 'Komaki', 'KTM',
  'Matter', 'Moto Morini', 'Okinawa', 'Ola Electric', 'Pure EV', 'QJ Motor',
  'Revolt', 'Royal Enfield', 'Simple Energy', 'Suzuki', 'Triumph', 'TVS',
  'Ultraviolette', 'UM', 'Vespa', 'Voge', 'Yamaha', 'Yezdi', 'Zontes', 'Other',
];

export const MOBILE_BRANDS = [
  'Apple', 'Asus', 'Google', 'Honor', 'Infinix', 'iQOO', 'Itel', 'Jio',
  'Karbonn', 'Lava', 'Lenovo', 'Micromax', 'Motorola', 'Nokia', 'Nothing',
  'OnePlus', 'Oppo', 'Other', 'Realme', 'Redmi', 'Samsung', 'Tecno', 'Vivo', 'Xiaomi',
];

export const SNEAKER_BRANDS = [
  'Adidas', 'Anta', 'Asics', 'Balenciaga', 'Bata', 'Brooks', 'Campus', 'Converse', 'Crocs', 'Fila',
  'Hoka', 'Jordan', 'K-Swiss', 'Lacoste', 'Li-Ning', 'Merrell', 'Mizuno', 'New Balance', 'Nike', 'On Running',
  'Puma', 'Reebok', 'Salomon', 'Saucony', 'Skechers', 'Sparx', 'Under Armour', 'Vans', 'Veja', 'Woodland', 'Yonex',
  'Yeezy', 'Other',
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
  'Truck', 'Lorry', 'Pickup', 'Mini Truck', 'Tipper', 'Tanker', 'Trailer',
  'Tempo', 'Van', 'Bus', 'Tractor', 'JCB / Construction', 'Other',
];

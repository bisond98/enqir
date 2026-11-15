// Real commercial-vehicle models, keyed "Brand|Body type" — so the Vehicles
// variant field can offer actual model names ("Ecomet 1615", "Dost Strong",
// "Yodha 2.0") instead of generic wording. Anything missing here falls back to
// a free-text Variant box.

export const VEHICLE_MODEL_OTHER = 'Other';

const VEHICLE_MODELS: Record<string, string[]> = {
  // ---- Ashok Leyland ----
  'Ashok Leyland|Truck': [
    'Ecomet 1015', 'Ecomet 1215', 'Ecomet 1615', 'Ecomet 2820', 'Boss 1920',
    'Boss 1215', '1616 IL', '2518 IL', 'Captain 2523',
  ],
  'Ashok Leyland|Lorry': [
    'Ecomet 1215', 'Ecomet 1615', 'Boss 1920', '1616 IL', '2518 IL', 'Partner 6 Tyre',
  ],
  'Ashok Leyland|Pickup': ['Dost Strong', 'Dost+', 'Bada Dost i2'],
  'Ashok Leyland|Mini Truck': ['Dost', 'Dost Strong', 'Bada Dost i4', 'Bada Dost i2'],
  'Ashok Leyland|Bus': ['Viking', 'Cheetah', 'Lynx', 'Janbus', 'Oyster', 'MiTR School Bus'],
  'Ashok Leyland|Tipper': ['Ecomet 1615 Tipper', 'Boss 1920 Tipper', 'Bada Dost Tipper'],
  'Ashok Leyland|Tanker': ['Ecomet 1615 Tanker', 'Boss 1920 Tanker'],
  // ---- Tata ----
  'Tata|Truck': [
    'Ace Gold', 'Intra V30', 'LPT 1618', 'LPT 3118', 'Ultra 1918.T',
    'Signa 5530.S', 'Prima 4028.S', 'Prima 4928.S',
  ],
  'Tata|Lorry': ['LPT 1618', 'LPT 3118', 'Ultra 1918.T', 'Signa 4225.T', 'Prima 4028.S'],
  'Tata|Pickup': ['Yodha 2.0', 'Yodha 1700', 'Xenon Yodha', 'Intra V30', 'Ace Gold Plus'],
  'Tata|Mini Truck': ['Ace Gold', 'Ace Gold Plus', 'Intra V30', 'Intra V50', 'Ace EV'],
  'Tata|Tipper': ['Signa 2823.K', 'Prima 2830.K', 'Ultra 1518.T', 'Signa 1923.K'],
  'Tata|Tanker': ['LPT 1618 Tanker', 'Signa 4225.T Tanker'],
  'Tata|Trailer': ['Signa 5530.S', 'Prima 4928.S', 'LPT 3118 Trailer'],
  'Tata|Bus': ['Starbus', 'LP 909', 'Ultra EV', 'Magnus', 'Winger School Bus'],
  'Tata|Van': ['Winger', 'Magic', 'Winger 9-Seater'],
  'Tata|Tempo': ['Ace Gold', 'Intra V30'],
  // ---- Mahindra ----
  'Mahindra|Pickup': ['Bolero Maxx Pik-Up', 'Bolero Pik-Up', 'Jeeto Plus', 'Bolero City Pik-Up'],
  'Mahindra|Mini Truck': ['Jeeto', 'Jeeto Plus', 'Supro Profit Truck', 'Bolero Maxx'],
  'Mahindra|Van': ['Supro Van', 'Jeeto Minivan'],
  'Mahindra|Truck': ['Blazo X 28', 'Blazo X 35', 'Furio 7', 'Furio 14'],
  'Mahindra|Tractor': ['575 DI', '265 DI', 'Jivo 365', 'Arjun 605', 'Yuvo 575'],
  // ---- Isuzu ----
  'Isuzu|Pickup': ['D-Max', 'D-Max S-Cab', 'D-Max V-Cross', 'D-Max Hi-Lander'],
  'Isuzu|Mini Truck': ['D-Max', 'D-Max S-Cab'],
  'Isuzu|Truck': ['FVR', 'FTS', 'FRR'],
  // ---- BharatBenz ----
  'BharatBenz|Truck': ['1015R', '1217C', '1617R', '1917R', '3528R', 'Boss 1920'],
  'BharatBenz|Lorry': ['1617R', '1917R', '3528R'],
  'BharatBenz|Tipper': ['1917R Tipper', '2523R Tipper'],
  'BharatBenz|Bus': ['914R', '1017R', '1217C School Bus'],
  'BharatBenz|Tanker': ['1917R Tanker'],
  // ---- Eicher ----
  'Eicher|Truck': ['Pro 3015', 'Pro 2110', 'Pro 6016', 'Pro 2049'],
  'Eicher|Mini Truck': ['Pro 1049', 'Pro 2049'],
  'Eicher|Bus': ['Skyline Pro', 'Starline', 'Skyline Pro School'],
  'Eicher|Tipper': ['Pro 3015 Tipper'],
  // ---- Electric & bus specialists ----
  'JBM Auto|Bus': ['City Bus', 'Ecolife', 'Solaris', 'Galaxy'],
  'Olectra|Bus': ['K9', 'C9', 'MX V2', 'Xpress'],
  'Switch Mobility|Bus': ['EiV 12', 'EiV 22', 'Metrodecker'],
  'SML Isuzu|Bus': ['S7', 'Executive', 'Pre-Series', 'School Bus'],
  'SML Isuzu|Truck': ['Samrat GS', 'Sartaj GS', 'Prestige GS'],
  'SML Isuzu|Mini Truck': ['Samrat GS'],
  // ---- Light commercial ----
  'Force|Van': ['Traveller 3350', 'Traveller 4020', 'Traveller Delivery Van'],
  'Force|Tempo': ['Traveller 3350', 'Traveller 4020'],
  'Force|Mini Truck': ['Traveller Delivery Van', 'Gurkha Delivery'],
  'Maruti Suzuki|Pickup': ['Super Carry', 'Super Carry CNG'],
  'Maruti Suzuki|Mini Truck': ['Super Carry', 'Super Carry CNG'],
  'Maruti Suzuki|Van': ['Eeco Cargo'],
  'Piaggio|Mini Truck': ['Ape Xtra LDX', 'Ape Xtra DX', 'Ape Auto DX'],
  'Piaggio|Tempo': ['Ape City', 'Ape Xtra LDX'],
  'Bajaj|Mini Truck': ['Maxima X Wide', 'Maxima Z', 'GoGo P511'],
  'Bajaj|Tempo': ['RE E-Tec 9.0', 'Maxima X Wide'],
  'Altigreen|Mini Truck': ['neEV Tez', 'neEV L5'],
  'Euler Motors|Mini Truck': ['HiLoad EV', 'HiLoad 2.0'],
  'Etrio|Mini Truck': ['Touro Max', 'Touro Mini'],
  // ---- Heavy trucks ----
  'Volvo|Truck': ['FH16', 'FMX 440', 'FM 420'],
  'Volvo|Bus': ['9400', '9600', '7900 Electric'],
  'Scania|Truck': ['P 360', 'G 410', 'R 500'],
  'Scania|Bus': ['Metrolink', 'Interlink'],
  'MAN|Truck': ['CLA 16.220', 'TGS 33.400', 'TGM 18.240'],
  'MAN|Bus': ['CLA 12.220 Bus'],
  'DAF|Truck': ['XF 480', 'CF 430', 'LF 280'],
  'Eicher|Van': ['Pro 2049 Delivery Van'],
  // ---- Construction ----
  'JCB|JCB / Construction': ['3DX', '4DX', '2DX', 'JS 205', 'Skid Steer 135', 'VMT 230'],
  'Caterpillar|JCB / Construction': ['320D3', '323D3', '950GC', '424B2'],
  'Komatsu|JCB / Construction': ['PC 205', 'PC 210', 'WA 200', 'PC 71'],
  'Hitachi|JCB / Construction': ['Zaxis 220', 'Zaxis 140', 'ZW 180'],
  'Case|JCB / Construction': ['770 EX Plus', '851 EX', '1107 EX'],
  'ACE|JCB / Construction': ['AX 90', 'F 15', 'NX 200'],
  // ---- Tractors ----
  'Swaraj|Tractor': ['744 XT', '855 FE', '735 FE', '963 FE'],
  'John Deere|Tractor': ['5050D', '5310', '5210', '5405'],
  'Massey Ferguson|Tractor': ['241 DI', '1035 DI', '7250 DI'],
  'Sonalika|Tractor': ['DI 47', 'DI 745 III', 'Tiger', 'RX 42'],
  'Kubota|Tractor': ['MU4501', 'B2441', 'NeoStar L4508'],
  'New Holland|Tractor': ['3630', '5500', '3600 TX'],
  'Escorts|Tractor': ['Farmtrac 45', 'Powertrac 439', 'Powertrac 445'],
  'Farmtrac|Tractor': ['60 EP', '45 Classic'],
  'Powertrac|Tractor': ['439', '445', 'Euro 50'],
  'TAFE|Tractor': ['45 DI', 'Dynatrack 50', 'Smart 45'],
  'VST|Tractor': ['Shakti 35 DI', 'MT 171 DI'],
  'Captain|Tractor': ['200 DI', '280 DI'],
  'Yanmar|Tractor': ['YT 359', 'EF 494', 'YM 342'],
};

/** Real models for a maker + body type. A maker on its own returns every model
 *  it builds (across body types), so the list is never empty once a brand is
 *  picked; unknown makers return [] and the field falls back to free text. */
export function getVehicleModels(brand: string, type: string): string[] {
  if (!brand) return [];
  if (type) {
    const exact = VEHICLE_MODELS[`${brand}|${type}`];
    if (exact) return exact;
  }
  const prefix = `${brand}|`;
  const seen = new Set<string>();
  for (const key of Object.keys(VEHICLE_MODELS)) {
    if (!key.startsWith(prefix)) continue;
    for (const model of VEHICLE_MODELS[key]) seen.add(model);
  }
  return [...seen];
}

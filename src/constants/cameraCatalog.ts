// Camera catalogue for the Brand -> Model pickers in the post-enquiry form and
// the sell form. Every list ends with "Other" so an unlisted camera can still be
// recorded; picking Other opens a text box for the exact name.

export const CAMERA_OTHER = 'Other';

const CAMERA_MODELS: Record<string, string[]> = {
  Canon: [
    'EOS R5', 'EOS R6 Mark II', 'EOS R7', 'EOS R8', 'EOS R10', 'EOS R50', 'EOS R100',
    'EOS 5D Mark IV', 'EOS 6D Mark II', 'EOS 90D', 'EOS 200D II', 'EOS M50 Mark II',
    'PowerShot G7 X Mark III', 'PowerShot SX70 HS',
  ],
  Nikon: [
    'Z9', 'Z8', 'Z7 II', 'Z6 III', 'Z6 II', 'Z5', 'Z50', 'Z30', 'Zfc',
    'D850', 'D780', 'D7500', 'D5600', 'D3500', 'Coolpix P1000', 'Coolpix B600',
  ],
  Sony: [
    'Alpha 1', 'Alpha 7R V', 'Alpha 7 IV', 'Alpha 7S III', 'Alpha 7C II', 'Alpha 7 III',
    'Alpha 6700', 'Alpha 6600', 'Alpha 6400', 'Alpha 6100', 'ZV-E1', 'ZV-E10',
    'ZV-1', 'RX100 VII', 'RX10 IV',
  ],
  Fujifilm: [
    'X-H2S', 'X-H2', 'X-T5', 'X-T4', 'X-T30 II', 'X-S20', 'X-Pro3', 'X-E4',
    'X100VI', 'X100V', 'GFX 100 II', 'GFX 50S II', 'X-T200',
  ],
  Panasonic: [
    'Lumix S5 II', 'Lumix S5', 'Lumix S1R', 'Lumix GH6', 'Lumix GH5 II', 'Lumix G9 II',
    'Lumix G95', 'Lumix G100', 'Lumix FZ1000 II', 'Lumix LX100 II',
  ],
  'OM System': [
    'OM-1', 'OM-5', 'E-M1 Mark III', 'E-M5 Mark III', 'E-M10 Mark IV', 'PEN E-P7',
  ],
  Olympus: [
    'OM-D E-M1 Mark III', 'OM-D E-M5 Mark III', 'OM-D E-M10 Mark IV', 'PEN E-P7', 'PEN-F',
  ],
  Leica: [
    'M11', 'M11 Monochrom', 'Q3', 'SL3', 'SL2-S', 'CL', 'D-Lux 8', 'V-Lux 5',
  ],
  Pentax: ['K-3 Mark III', 'K-1 Mark II', 'K-70', 'KP', '645Z'],
  Ricoh: ['GR III', 'GR IIIx', 'GR II', 'Theta Z1', 'Theta X'],
  Hasselblad: ['X2D 100C', 'X1D II 50C', '907X & CFV II 50C', '503CW'],
  GoPro: ['HERO12 Black', 'HERO11 Black', 'HERO11 Black Mini', 'HERO10 Black', 'MAX 360', 'HERO9 Black'],
  DJI: ['Osmo Action 4', 'Osmo Action 3', 'Osmo Pocket 3', 'Osmo Mobile 6', 'Ronin 4D', 'Mavic 3 Pro', 'Air 3', 'Mini 4 Pro'],
  Insta360: ['X4', 'X3', 'ONE RS', 'ONE X2', 'GO 3', 'Ace Pro', 'Link'],
  Samsung: ['Galaxy Camera 2', 'NX1', 'NX500', 'NX300', 'WB350F'],
  Kodak: ['PixPro AZ528', 'PixPro AZ421', 'PixPro FZ43', 'M35', 'M38'],
  Polaroid: ['Now+', 'Go Gen 2', 'Go', 'OneStep 2', 'Originals 600', 'Lab'],
  RED: ['Komodo 6K', 'V-Raptor 8K VV', 'DSMC2 Gemini 5K', 'Scarlet-W 5K'],
  'Blackmagic Design': [
    'Pocket Cinema Camera 6K Pro', 'Pocket Cinema Camera 4K', 'Cinema Camera 6K',
    'URSA Mini Pro 12K', 'Studio Camera 4K Pro',
  ],
  Sigma: ['fp', 'fp L', 'sd Quattro', 'dp0 Quattro'],
  Casio: ['Exilim EX-ZR2000', 'Exilim EX-FR200', 'Exilim EX-10'],
};

export const CAMERA_BRAND_OPTIONS: string[] = [...Object.keys(CAMERA_MODELS), CAMERA_OTHER];

/** Models the brand actually makes; empty until a brand is picked. */
export function getCameraModels(brand: string): string[] {
  if (!brand) return [];
  return CAMERA_MODELS[brand] ?? [];
}

/** Brand-wide union, used when the model is "Other" or unknown. */
export function getCameraModelUnion(): string[] {
  const all = new Set<string>();
  Object.values(CAMERA_MODELS).forEach((list) => list.forEach((m) => all.add(m)));
  return [...all];
}

// Sneaker brand icons — every brand in the sneaker catalogue maps to a local
// icon in public/logos/sneakers, so the brand picker can show a mark next to
// each name. Brands with no obtainable mark (Common Projects, Sparx, Topo
// Athletic) fall back to their initials in the picker.

const LOCAL: Record<string, string> = {
  "361 degrees": "361-degrees.png",
  "adidas": "adidas.png",
  "alexander mcqueen": "alexander-mcqueen.png",
  "allbirds": "allbirds.png",
  "altra": "altra.png",
  "anta": "anta.png",
  "arc'teryx": "arc-teryx.png",
  "ariat": "ariat.png",
  "asics": "asics.png",
  "autry": "autry.png",
  "balenciaga": "balenciaga.png",
  "bape": "bape.png",
  "bata": "bata.png",
  "blundstone": "blundstone.png",
  "brooks": "brooks.png",
  "camper": "camper.png",
  "campus": "campus.png",
  "cat": "cat.png",
  "clarks": "clarks.png",
  "columbia": "columbia.png",
  "common projects": "common-projects.svg",
  "converse": "converse.png",
  "crocs": "crocs.png",
  "danner": "danner.png",
  "diadora": "diadora.png",
  "dr. martens": "dr-martens.png",
  "ecco": "ecco.png",
  "fear of god": "fear-of-god.png",
  "fila": "fila.png",
  "gola": "gola.png",
  "golden goose": "golden-goose.png",
  "hey dude": "hey-dude.png",
  "hoka": "hoka.png",
  "hummel": "hummel.png",
  "inov-8": "inov-8.png",
  "joma": "joma.png",
  "jordan": "jordan.png",
  "k-swiss": "k-swiss.png",
  "karhu": "karhu.png",
  "keds": "keds.png",
  "keen": "keen.png",
  "la sportiva": "la-sportiva.png",
  "lacoste": "lacoste.png",
  "le coq sportif": "le-coq-sportif.svg",
  "li-ning": "li-ning.svg",
  "lotto": "lotto.png",
  "lowa": "lowa.png",
  "merrell": "merrell.png",
  "mizuno": "mizuno.png",
  "new balance": "new-balance.png",
  "nike": "nike.png",
  "no bull": "no-bull.png",
  "off-white": "off-white.png",
  "on running": "on-running.png",
  "onitsuka tiger": "onitsuka-tiger.png",
  "palladium": "palladium.png",
  "peak": "peak.png",
  "puma": "puma.png",
  "red wing": "red-wing.png",
  "reebok": "reebok.png",
  "rick owens": "rick-owens.png",
  "salomon": "salomon.png",
  "saucony": "saucony.png",
  "scarpa": "scarpa.png",
  "skechers": "skechers.png",
  "solovair": "solovair.png",
  "sorel": "sorel.png",
  "sparx": "sparx.svg",
  "superga": "superga.png",
  "the north face": "the-north-face.png",
  "timberland": "timberland.png",
  "toms": "toms.png",
  "topo athletic": "topo-athletic.svg",
  "ugg": "ugg.png",
  "umbro": "umbro.png",
  "under armour": "under-armour.png",
  "vans": "vans.png",
  "veja": "veja.png",
  "vibram": "vibram.png",
  "vivobarefoot": "vivobarefoot.png",
  "wolverine": "wolverine.png",
  "woodland": "woodland.png",
  "xero shoes": "xero-shoes.png",
  "yeezy": "yeezy.png",
  "yonex": "yonex.png",
};

/** Local logo URL for a sneaker brand, or null when the brand has no mark. */
export function getSneakerBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const file = LOCAL[brand.trim().toLowerCase()];
  return file ? `/logos/sneakers/${file}` : null;
}

/** Initials used when a brand has no logo file. */
export function getSneakerBrandInitials(brand: string): string {
  return brand
    .replace(/[^A-Za-z0-9 .-]/g, '')
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

import type { Category } from './taxonomy'

export interface FitPiece {
  /** Top-to-bottom slot label, e.g. "Beanie", "Tee", "Denim". */
  slot: string
  /** What the person actually wore. */
  worn: string
  /** How we match a buyable equivalent from the catalog. */
  match: { category: Category; brand?: string; kw?: string; sil?: string }
}

export interface Fit {
  id: string
  who: string
  where: string
  /** When it happened + why it mattered — the context line under the fit. */
  when: string
  context: string
  vibe: string
  /** Looks for /fits/<id>.jpg in public — drop a photo in and it appears. */
  pieces: FitPiece[]
}

/**
 * Iconic tunnel/street fits, broken down top-to-bottom. The photo itself is
 * user-supplied (public/fits/<id>.jpg) — we ship the breakdown and the links.
 */
export const FITS: Fit[] = [
  {
    id: 'clarkson-tunnel',
    who: 'Jordan Clarkson',
    where: 'Jazz tunnel',
    when: '2023–24 season, pregame arrival',
    context: 'Walked in wearing a thrifted ’93 Final Four tee layered over a thermal — the fit that put tunnel-walk vintage on every mood board.',
    vibe: 'Vintage tee over thermal, baggy wash, suede boot',
    pieces: [
      { slot: 'Beanie', worn: 'Oatmeal fisherman beanie', match: { category: 'accessory', kw: 'beanie' } },
      { slot: 'Tee', worn: 'Vintage ’93 Final Four graphic tee', match: { category: 'top', brand: 'Stüssy', kw: 'tee' } },
      { slot: 'Layer', worn: 'Cream waffle thermal underneath', match: { category: 'top', kw: 'l/s|long sleeve|thermal|rugby' } },
      { slot: 'Denim', worn: 'Baggy light-wash jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Boots', worn: 'Tan suede boots', match: { category: 'shoes', sil: 'boot', kw: 'boot|suede' } },
    ],
  },
  {
    id: 'poole-arrival',
    who: 'Jordan Poole',
    where: 'Wizards tunnel',
    when: 'Game-day arrival, headphones on',
    context: 'All-black everything with an Arc’teryx beanie and white runners — proof a whole fit can be three colors and still walk like money.',
    vibe: 'Oversized hoodie, wide cords, white runners',
    pieces: [
      { slot: 'Beanie', worn: 'Arc’teryx camo beanie', match: { category: 'accessory', kw: 'beanie' } },
      { slot: 'Hoodie', worn: 'Oversized washed-black hoodie', match: { category: 'top', kw: 'hoodie|sweatshirt' } },
      { slot: 'Layer', worn: 'Grey tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Pants', worn: 'Wide charcoal cords', match: { category: 'pants', kw: 'cord|wide|carpenter|baggy' } },
      { slot: 'Shoes', worn: 'White runners', match: { category: 'shoes', kw: 'runner|trainer|sneaker' } },
      { slot: 'Bag', worn: 'Crossbody duffel', match: { category: 'accessory', sil: 'bag', kw: 'bag|tote|duffel' } },
    ],
  },
  {
    id: 'sga-leather',
    who: 'Shai Gilgeous-Alexander',
    where: 'Thunder tunnel',
    when: '2024 playoffs arrival',
    context: 'Mid-playoff run, GQ’s most stylish player showed up in head-to-toe quiet leather — no logos, all silhouette.',
    vibe: 'Best-dressed-in-the-league minimalism',
    pieces: [
      { slot: 'Jacket', worn: 'Boxy leather blouson', match: { category: 'outer', kw: 'jacket' } },
      { slot: 'Knit', worn: 'Fine merino underneath', match: { category: 'knit' } },
      { slot: 'Trousers', worn: 'Wide pleated trousers', match: { category: 'pants', kw: 'trouser|pleat|wide' } },
      { slot: 'Shoes', worn: 'Sleek loafers', match: { category: 'shoes', kw: 'loafer|moc' } },
    ],
  },
  {
    id: 'tyler-prep',
    who: 'Tyler, the Creator',
    where: 'Courtside',
    when: 'Lakers game, courtside seats',
    context: 'Cameras cut to him more than the game — cardigan, knit polo and loafers while everyone else wore hoodies.',
    vibe: 'Le Fleur prep — pastels, cardigans, loafers',
    pieces: [
      { slot: 'Cap', worn: 'Le Fleur logo cap', match: { category: 'accessory', kw: 'cap|hat' } },
      { slot: 'Knit', worn: 'Pastel cardigan over polo', match: { category: 'knit', kw: 'cardigan|sweater' } },
      { slot: 'Shirt', worn: 'Knit polo underneath', match: { category: 'shirt', kw: 'polo' } },
      { slot: 'Trousers', worn: 'Cropped pleated slacks', match: { category: 'pants', kw: 'trouser|chino' } },
      { slot: 'Shoes', worn: 'Suede loafers with socks', match: { category: 'shoes', kw: 'loafer|suede' } },
    ],
  },
  {
    id: 'rocky-work',
    who: 'A$AP Rocky',
    where: 'NYC street',
    when: 'SoHo, paparazzi walk',
    context: 'Shot leaving a studio in beat-up workwear that looked inherited, not bought — the reference photo for half of menswear TikTok.',
    vibe: 'Workwear layers, carpenter fit',
    pieces: [
      { slot: 'Jacket', worn: 'Faded chore coat', match: { category: 'outer', kw: 'chore|shop|work|canvas' } },
      { slot: 'Hoodie', worn: 'Heavy hoodie underneath', match: { category: 'top', kw: 'hoodie|sweatshirt' } },
      { slot: 'Pants', worn: 'Double-knee carpenter pants', match: { category: 'pants', kw: 'painter|carpenter|fatigue|work' } },
      { slot: 'Boots', worn: 'Beat-up work boots', match: { category: 'shoes', kw: 'boot' } },
    ],
  },
  {
    id: 'lebron-quiet',
    who: 'LeBron James',
    where: 'Lakers tunnel',
    when: 'Season opener arrival',
    context: 'Opening night, no jewelry, no logos — just tailoring. The whole tunnel read as a statement about being past flexing.',
    vibe: 'Quiet luxury — nothing shouts, everything fits',
    pieces: [
      { slot: 'Overshirt', worn: 'Suede overshirt', match: { category: 'shirt', kw: 'overshirt|suede|corduroy|flannel' } },
      { slot: 'Tee', worn: 'Perfect white tee', match: { category: 'top', brand: 'Lady White Co.' } },
      { slot: 'Trousers', worn: 'Tailored wool trousers', match: { category: 'pants', kw: 'trouser|wool' } },
      { slot: 'Sneakers', worn: 'Minimal white leather sneakers', match: { category: 'shoes', kw: 'sneaker|leather' } },
    ],
  },
  {
    id: 'booker-gorp',
    who: 'Devin Booker',
    where: 'Suns tunnel',
    when: 'Road game arrival',
    context: 'Showed up dressed for a trailhead at 7pm in an arena garage — and made technical shells a tunnel staple.',
    vibe: 'Gorp on the way to work',
    pieces: [
      { slot: 'Shell', worn: 'Technical wind shell', match: { category: 'outer', kw: 'anorak|wind|shell|nylon' } },
      { slot: 'Tee', worn: 'Faded graphic tee', match: { category: 'top', kw: 'tee' } },
      { slot: 'Pants', worn: 'Loose nylon cargo', match: { category: 'pants', kw: 'cargo|nylon|climb' } },
      { slot: 'Shoes', worn: 'Trail runners', match: { category: 'shoes', kw: 'trainer|runner|trail' } },
    ],
  },
]

import type { Category, StyleId } from './taxonomy'

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
  /** The player's style DNA — powers the style-twin match. */
  styles: StyleId[]
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
    styles: ['street', 'skate'],
    who: 'Jordan Poole',
    where: 'Tunnel walk',
    when: 'Game-day arrival',
    context: 'Thrifted ’93 Final Four tee layered over a cream thermal — the vintage-tunnel formula: one loud piece, everything else quiet.',
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
    styles: ['street', 'minimal'],
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
    id: 'sga-arrival',
    styles: ['minimal', 'street'],
    who: 'Shai Gilgeous-Alexander',
    where: 'Thunder tunnel',
    when: 'Home opener, puppy in hand',
    context: 'The internet asked “shorts?” for two months and never got an answer. Grey boxy hoodie, camo 3/4 cargos, cream sneakers — and the dog.',
    vibe: 'Grey hoodie, camo cargos, cream sneakers',
    pieces: [
      { slot: 'Hoodie', worn: 'Boxy bonded grey hoodie', match: { category: 'top', kw: 'hoodie|sweatshirt' } },
      { slot: 'Tee', worn: 'White tee peeking underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Cargos', worn: 'Camo 3/4 cargo shorts', match: { category: 'pants', kw: 'cargo|camo|short' } },
      { slot: 'Socks', worn: 'Stacked white socks', match: { category: 'accessory', kw: 'sock' } },
      { slot: 'Sneakers', worn: 'Cream zip sneakers', match: { category: 'shoes', kw: 'sneaker|trainer|runner' } },
    ],
  },
  {
    id: 'tyler-prep',
    styles: ['ivy', 'street'],
    who: 'Tyler, the Creator',
    where: 'Le Fleur shoot',
    when: 'Backyard, cars on the grass',
    context: 'Trucker cap, chain, Le Fleur tee and forest-green work pants — proof the whole look can be five pieces if every piece is right.',
    vibe: 'Trucker cap, Le Fleur tee, green work pants',
    pieces: [
      { slot: 'Cap', worn: 'Two-tone trucker cap', match: { category: 'accessory', kw: 'cap|hat|trucker' } },
      { slot: 'Tee', worn: 'White Le Fleur graphic tee', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Chain', worn: 'Silver curb chain', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Pants', worn: 'Forest-green work pants', match: { category: 'pants', kw: 'work|fatigue|pant|painter' } },
      { slot: 'Sneakers', worn: 'White-and-green sneakers', match: { category: 'shoes', kw: 'sneaker|trainer' } },
    ],
  },
  {
    id: 'rocky-work',
    styles: ['workwear', 'street'],
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
    styles: ['minimal', 'ivy'],
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
    styles: ['gorp', 'athletic'],
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

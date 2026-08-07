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
    id: 'sga-leather',
    who: 'Shai Gilgeous-Alexander',
    where: 'Thunder tunnel',
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
    vibe: 'Gorp on the way to work',
    pieces: [
      { slot: 'Shell', worn: 'Technical wind shell', match: { category: 'outer', kw: 'anorak|wind|shell|nylon' } },
      { slot: 'Tee', worn: 'Faded graphic tee', match: { category: 'top', kw: 'tee' } },
      { slot: 'Pants', worn: 'Loose nylon cargo', match: { category: 'pants', kw: 'cargo|nylon|climb' } },
      { slot: 'Shoes', worn: 'Trail runners', match: { category: 'shoes', kw: 'trainer|runner|trail' } },
    ],
  },
]

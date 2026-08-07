export interface Scent {
  id: string
  house: string
  name: string
  /** Juice colour for the bottle illustration. */
  color: string
  /** Community-reported wearer — phrased as reported, not verified endorsement. */
  wornBy: string
  notes: string
  price: number
  vibe: string
  url: string
}

/**
 * The scent files. "Worn by" reflects community reporting / interviews,
 * not brand endorsements — the disclaimer renders in the UI.
 */
export const SCENTS: Scent[] = [
  {
    id: 'pdm-layton',
    color: '#c9a24b',
    house: 'Parfums de Marly',
    name: 'Layton',
    wornBy: 'Duke Dennis’ reported signature',
    notes: 'Apple · lavender · vanilla · cardamom',
    price: 235,
    vibe: 'The compliment magnet. Winter nights.',
    url: 'https://www.parfums-de-marly.com',
  },
  {
    id: 'jpg-elixir',
    color: '#7a1f2b',
    house: 'Jean Paul Gaultier',
    name: 'Le Male Elixir',
    wornBy: 'Kai Cenat community canon',
    notes: 'Mint · lavender · vanilla · tonka',
    price: 138,
    vibe: 'Loud, sweet, impossible to miss.',
    url: 'https://www.jeanpaulgaultier.com',
  },
  {
    id: 'dior-sauvage-elixir',
    color: '#1c2733',
    house: 'Dior',
    name: 'Sauvage Elixir',
    wornBy: 'Johnny Depp (campaign face) · half the league',
    notes: 'Grapefruit · cinnamon · lavender · amber',
    price: 185,
    vibe: 'The safe bet that still hits.',
    url: 'https://www.dior.com',
  },
  {
    id: 'ysl-lanuit',
    color: '#4a3550',
    house: 'Yves Saint Laurent',
    name: 'La Nuit de L’Homme',
    wornBy: 'Jeremy Fragrance-approved date night',
    notes: 'Cardamom · cedar · lavender',
    price: 105,
    vibe: 'Quiet, close-range, intentional.',
    url: 'https://www.yslbeauty.com',
  },
  {
    id: 'versace-eros',
    color: '#2e7fa3',
    house: 'Versace',
    name: 'Eros',
    wornBy: 'Jeremy Fragrance compliment canon',
    notes: 'Mint · green apple · vanilla',
    price: 88,
    vibe: 'First designer bottle. Still works.',
    url: 'https://www.versace.com',
  },
  {
    id: 'versace-flame',
    color: '#8f1c1c',
    house: 'Versace',
    name: 'Eros Flame',
    wornBy: 'Winter-night pick',
    notes: 'Mandarin · black pepper · vanilla',
    price: 102,
    vibe: 'The red one. Warmer, louder, colder months.',
    url: 'https://www.versace.com',
  },
  {
    id: 'dg-pourhomme',
    color: '#d6d0a2',
    house: 'Dolce & Gabbana',
    name: 'Pour Homme',
    wornBy: 'The timeless one',
    notes: 'Bergamot · lavender · tobacco · cedar',
    price: 98,
    vibe: 'Smells like being a grown man on purpose.',
    url: 'https://www.dolcegabbana.com',
  },
  {
    id: 'valentino-bir',
    color: '#b8433a',
    house: 'Valentino',
    name: 'Uomo Born in Roma',
    wornBy: 'Campus favorite · reported Central Cee pick',
    notes: 'Ginger · sage · vanilla',
    price: 120,
    vibe: 'Clean enough for class, warm enough for after.',
    url: 'https://www.valentino-beauty.com',
  },
  {
    id: 'lelabo-santal',
    color: '#b7986a',
    house: 'Le Labo',
    name: 'Santal 33',
    wornBy: 'Reported: Bieber · Ryan Reynolds',
    notes: 'Sandalwood · cardamom · leather',
    price: 230,
    vibe: 'Smells like a gallery opening.',
    url: 'https://www.lelabofragrances.com',
  },
  {
    id: 'prada-lhomme',
    color: '#9aa7b0',
    house: 'Prada',
    name: 'L’Homme',
    wornBy: 'Minimalist pick',
    notes: 'Iris · amber · neroli',
    price: 112,
    vibe: 'Ironed-shirt energy. Never wrong.',
    url: 'https://www.prada.com',
  },
]

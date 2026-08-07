export interface Scent {
  id: string
  house: string
  name: string
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
    house: 'Parfums de Marly',
    name: 'Layton',
    wornBy: 'Duke Dennis',
    notes: 'Apple · lavender · vanilla · cardamom',
    price: 235,
    vibe: 'The compliment magnet. Winter nights.',
    url: 'https://www.parfums-de-marly.com',
  },
  {
    id: 'jpg-elixir',
    house: 'Jean Paul Gaultier',
    name: 'Le Male Elixir',
    wornBy: 'Kai Cenat (community pick)',
    notes: 'Mint · lavender · vanilla · tonka',
    price: 138,
    vibe: 'Loud, sweet, impossible to miss.',
    url: 'https://www.jeanpaulgaultier.com',
  },
  {
    id: 'dior-sauvage-elixir',
    house: 'Dior',
    name: 'Sauvage Elixir',
    wornBy: 'Half the league, honestly',
    notes: 'Grapefruit · cinnamon · lavender · amber',
    price: 185,
    vibe: 'The safe bet that still hits.',
    url: 'https://www.dior.com',
  },
  {
    id: 'ysl-lanuit',
    house: 'Yves Saint Laurent',
    name: 'La Nuit de L’Homme',
    wornBy: 'Date-night canon',
    notes: 'Cardamom · cedar · lavender',
    price: 105,
    vibe: 'Quiet, close-range, intentional.',
    url: 'https://www.yslbeauty.com',
  },
  {
    id: 'versace-eros',
    house: 'Versace',
    name: 'Eros',
    wornBy: 'The starter kit',
    notes: 'Mint · green apple · vanilla',
    price: 88,
    vibe: 'First designer bottle. Still works.',
    url: 'https://www.versace.com',
  },
  {
    id: 'valentino-bir',
    house: 'Valentino',
    name: 'Uomo Born in Roma',
    wornBy: 'Campus favorite',
    notes: 'Ginger · sage · vanilla',
    price: 120,
    vibe: 'Clean enough for class, warm enough for after.',
    url: 'https://www.valentino-beauty.com',
  },
  {
    id: 'lelabo-santal',
    house: 'Le Labo',
    name: 'Santal 33',
    wornBy: 'The quiet-luxury uniform',
    notes: 'Sandalwood · cardamom · leather',
    price: 230,
    vibe: 'Smells like a gallery opening.',
    url: 'https://www.lelabofragrances.com',
  },
  {
    id: 'prada-lhomme',
    house: 'Prada',
    name: 'L’Homme',
    wornBy: 'Minimalist pick',
    notes: 'Iris · amber · neroli',
    price: 112,
    vibe: 'Ironed-shirt energy. Never wrong.',
    url: 'https://www.prada.com',
  },
]

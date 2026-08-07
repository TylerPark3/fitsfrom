export type StyleId =
  | 'ivy'
  | 'workwear'
  | 'minimal'
  | 'gorp'
  | 'street'
  | 'japanese'
  | 'skate'
  | 'athletic'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export type Tier = 'entry' | 'solid' | 'premium' | 'grail'

export type Category = 'top' | 'shirt' | 'knit' | 'outer' | 'pants' | 'shoes' | 'accessory'

export type Gender = 'men' | 'women' | 'unisex'

export type Silhouette =
  | 'tee'
  | 'shirt'
  | 'polo'
  | 'sweater'
  | 'jacket'
  | 'coat'
  | 'trouser'
  | 'jean'
  | 'short'
  | 'sneaker'
  | 'boot'
  | 'cap'
  | 'bag'

export const STYLES: { id: StyleId; label: string; blurb: string; anchors: string; celebs: string }[] = [
  {
    id: 'ivy',
    label: 'Ivy & Prep',
    blurb: 'Oxfords, chinos, loafers.',
    anchors: 'J.Press · Kamakura · Beams Plus',
    celebs: 'Tyler, the Creator · Jacob Elordi',
  },
  {
    id: 'workwear',
    label: 'Workwear',
    blurb: 'Canvas, denim, boots.',
    anchors: 'Carhartt WIP · 3sixteen · Stan Ray',
    celebs: 'Pretty Flacko · Jerry Lorenzo',
  },
  {
    id: 'minimal',
    label: 'Quiet Minimal',
    blurb: 'No logos. Good fabric.',
    anchors: 'Asket · Norse Projects · Uniqlo U',
    celebs: 'SGA · Bron',
  },
  {
    id: 'gorp',
    label: 'Gorpcore',
    blurb: 'Trail gear in the city.',
    anchors: 'Arc’teryx · Salomon · Snow Peak',
    celebs: 'Devin Booker · Frank Ocean',
  },
  {
    id: 'street',
    label: 'Streetwear',
    blurb: 'Graphics, layers, attitude.',
    anchors: 'Stüssy · Noah · Brain Dead',
    celebs: 'Poole Party · JC',
  },
  {
    id: 'japanese',
    label: 'Japanese & Archive',
    blurb: 'Weird proportions, insane fabric.',
    anchors: 'Kapital · Needles · orSlow',
    celebs: 'John Mayer · Kendrick Lamar',
  },
  {
    id: 'skate',
    label: 'Skate',
    blurb: 'Baggy and durable.',
    anchors: 'Polar · Dickies · Last Resort',
    celebs: 'Bieber · Tyshawn Jones',
  },
  {
    id: 'athletic',
    label: 'Sport & Vintage Athletic',
    blurb: 'Retro runners, warmups.',
    anchors: 'New Balance · adidas · Sporty & Rich',
    celebs: 'Rookie LeBron · Central Cee',
  },
]

export const TIERS: { id: Tier; label: string; blurb: string; band: string }[] = [
  { id: 'entry', label: 'Entry', blurb: 'Gets you through the semester.', band: 'Under $70' },
  { id: 'solid', label: 'Solid', blurb: 'Real construction, sane price.', band: '$70 – $180' },
  { id: 'premium', label: 'Premium', blurb: 'Buy once, keep ten years.', band: '$180 – $400' },
  { id: 'grail', label: 'Grail', blurb: 'The one thing you save for.', band: '$400+' },
]

export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: 'top', label: 'Tee / Sweat', plural: 'Tees & sweats' },
  { id: 'shirt', label: 'Shirt', plural: 'Shirts' },
  { id: 'knit', label: 'Knitwear', plural: 'Knitwear' },
  { id: 'outer', label: 'Outerwear', plural: 'Outerwear' },
  { id: 'pants', label: 'Pants', plural: 'Pants' },
  { id: 'shoes', label: 'Shoes', plural: 'Shoes' },
  { id: 'accessory', label: 'Accessory', plural: 'Accessories' },
]

export const SEASONS: { id: Season; label: string }[] = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'fall', label: 'Fall' },
  { id: 'winter', label: 'Winter' },
]

/** A complete outfit needs one of each of these. Used for wardrobe gap analysis. */
export const CORE_SLOTS: { category: Category; label: string; per: number }[] = [
  { category: 'top', label: 'tees & sweats', per: 4 },
  { category: 'shirt', label: 'shirts', per: 2 },
  { category: 'knit', label: 'a mid-layer', per: 2 },
  { category: 'outer', label: 'outerwear', per: 2 },
  { category: 'pants', label: 'pants', per: 3 },
  { category: 'shoes', label: 'shoes', per: 2 },
]

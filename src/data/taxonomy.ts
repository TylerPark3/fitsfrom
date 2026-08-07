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

export const STYLES: { id: StyleId; label: string; blurb: string; anchors: string }[] = [
  {
    id: 'ivy',
    label: 'Ivy & Prep',
    blurb: 'Oxfords, chinos, loafers. Looks like you have a plan.',
    anchors: 'J.Press · Kamakura · Beams Plus · Drake’s',
  },
  {
    id: 'workwear',
    label: 'Workwear',
    blurb: 'Duck canvas, selvedge, chore coats. Ages instead of dying.',
    anchors: 'Carhartt WIP · 3sixteen · Stan Ray · Rogue Territory',
  },
  {
    id: 'minimal',
    label: 'Quiet Minimal',
    blurb: 'No logos, good fabric, boring on purpose. Never wrong.',
    anchors: 'Asket · COS · Norse Projects · Uniqlo U',
  },
  {
    id: 'gorp',
    label: 'Gorpcore',
    blurb: 'Technical shells and trail shoes worn to the library.',
    anchors: 'Arc’teryx · Salomon · Snow Peak · and wander',
  },
  {
    id: 'street',
    label: 'Streetwear',
    blurb: 'Heavyweight graphics, real fits, no reseller tax.',
    anchors: 'Stüssy · Noah · Awake NY · Brain Dead',
  },
  {
    id: 'japanese',
    label: 'Japanese & Archive',
    blurb: 'Weird proportions, insane fabric. The deep end.',
    anchors: 'Kapital · Needles · Auralee · orSlow',
  },
  {
    id: 'skate',
    label: 'Skate',
    blurb: 'Baggy, durable, cheap enough to actually wreck.',
    anchors: 'Polar · Dickies · Vans · Last Resort',
  },
  {
    id: 'athletic',
    label: 'Sport & Vintage Athletic',
    blurb: 'Warmups, mesh, retro runners. Effortless without trying.',
    anchors: 'New Balance · adidas · Nike ACG · Sporty & Rich',
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

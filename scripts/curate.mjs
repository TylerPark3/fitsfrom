/**
 * Curate the raw Shopify dump into src/data/catalog.gen.json.
 * Heuristic category/style/season mapping + per-brand caps so no feed dominates.
 *
 *   node scripts/curate.mjs <feeds.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const feeds = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const BRAND_STYLES = {
  'Lady White Co.': ['minimal'],
  '3sixteen': ['workwear', 'japanese'],
  'Topo Designs': ['gorp'],
  Noah: ['street', 'ivy'],
  'Sporty & Rich': ['athletic', 'minimal'],
  'Stan Ray': ['workwear', 'skate'],
  'Gitman Vintage': ['ivy', 'workwear'],
  'J.Press': ['ivy'],
  'Snow Peak': ['gorp', 'japanese'],
  'Polar Skate Co.': ['skate', 'street'],
  'Norse Projects': ['minimal', 'gorp'],
  'Rowing Blazers': ['ivy', 'street'],
  'Taylor Stitch': ['workwear', 'minimal'],
  'Alex Mill': ['minimal', 'ivy'],
  Corridor: ['ivy', 'japanese'],
  Bather: ['minimal', 'athletic'],
  'Aime Leon Dore': ['street', 'ivy'],
  'Last Resort AB': ['skate'],
  'Stüssy': ['street', 'skate'],
  Kith: ['street', 'athletic'],
  'Fear of God': ['street', 'minimal'],
  'John Elliott': ['minimal', 'street'],
  JJJJound: ['minimal', 'street'],
  Represent: ['street', 'athletic'],
  Sexhippies: ['skate', 'workwear'],
  Stingwater: ['skate', 'street'],
  'Checks Downtown': ['street', 'minimal'],
  '18 East': ['ivy', 'gorp'],
  'Free & Easy': ['street', 'athletic'],
  'Museum of Peace & Quiet': ['minimal', 'athletic'],
  'Story mfg.': ['workwear', 'japanese'],
  'Kartik Research': ['japanese', 'ivy'],
  Battenwear: ['gorp', 'workwear'],
  'Dehen 1920': ['workwear'],
  'Freenote Cloth': ['workwear'],
  Uskees: ['workwear', 'minimal'],
  'BBC Ice Cream': ['street'],
  'Golf Wang': ['street', 'skate'],
  AWGE: ['street'],
  'Glo Gang': ['street'],
  'The Marathon Clothing': ['street', 'athletic'],
  Kuon: ['japanese', 'workwear'],
  'Iron Heart': ['workwear', 'japanese'],
  Bodega: ['street', 'athletic'],
  Concepts: ['street', 'athletic'],
  Undefeated: ['street', 'athletic'],
  'A Ma Maniére': ['street', 'minimal'],
  Feature: ['street', 'athletic'],
  'Extra Butter': ['street', 'athletic'],
  'Social Status': ['street', 'athletic'],
  Oneness: ['street', 'athletic'],
  'Lapstone & Hammer': ['street', 'athletic'],
  Packer: ['street', 'athletic'],
  'Saint Alfred': ['street', 'athletic'],
  'Wish ATL': ['street', 'athletic'],
  Sp5der: ['street'],
  ICECREAM: ['street', 'skate'],
  BAPE: ['street', 'japanese'],
  MARKET: ['street', 'skate'],
  'Anti Social Social Club': ['street'],
}

const CAT = [
  ['shoes', /sneaker|\bshoes?\b|\bboots?\b|loafer|\bmocs?\b|slide|sandal|trainer(?!.{0,20}(jacket|pant|short|crew))|runner(?!.{0,20}(jacket|pant|short|crew))/i],
  ['outer', /jacket|coat|parka|anorak|blazer|vest|puffer|windbreaker|fleece(?!.*pant)|shell/i],
  ['knit', /sweater|cardigan|knit(?!.*(tee|polo))|jumper|pullover(?!.*hood)|shetland|merino|cashmere|mohair/i],
  ['pants', /pant|trouser|jean|denim(?!.*(jacket|shirt))|chino|short(?!.*sleeve)|sweatpant|fatigue|cargo/i],
  ['top', /\btee\b|t-shirt|tshirt|crewneck|sweatshirt|hoodie|henley|tank/i],
  ['shirt', /shirt|oxford|flannel|chambray|polo|button/i],
  ['accessory', /cap\b|hat\b|beanie|bag|tote|backpack|belt|scarf|sock|wallet|bandana|watch|glove/i],
]

const SILHOUETTE = [
  ['boot', /boot|chelsea/i],
  ['sneaker', /sneaker|shoe|trainer|runner|loafer|moc|slide|sandal/i],
  ['coat', /coat|parka|overcoat|trench/i],
  ['jacket', /jacket|blazer|anorak|vest|puffer|windbreaker|shell|fleece/i],
  ['jean', /jean|denim/i],
  ['short', /short\b/i],
  ['trouser', /pant|trouser|chino|fatigue|cargo|sweatpant/i],
  ['polo', /polo/i],
  ['sweater', /sweater|cardigan|knit|jumper|crewneck|sweatshirt|hoodie|pullover|shetland|merino/i],
  ['shirt', /shirt|oxford|flannel|chambray|button/i],
  ['cap', /cap|hat|beanie/i],
  ['bag', /bag|tote|backpack/i],
  ['tee', /tee|t-shirt|henley|tank|long sleeve/i],
]

const EXCLUDE =
  /gift card|e-gift|sticker|keychain|dog |candle|mug|incense|book|poster|deck\b|griptape|wheels|bearing|tool|wax|lighter|ashtray|frisbee|towel(?!.*robe)|blanket|pillow|tent|stove|cooler|lantern|chair|table|cutlery|plate|bottle(?! opener)|tumbler|jug|pot\b|pan\b|kettle|spork|underwear|boxer|brief\b|swim(?!.*trunk)|kids|women'?s dress|skirt|bikini|legging/i

const seasonFor = (cat, title) => {
  if (/linen|swim|trunk|short sleeve|tank|camp collar|seersucker/i.test(title)) return ['spring', 'summer']
  if (/flannel|wool|shetland|cashmere|merino|down|puffer|fleece|corduroy|thermal|parka|quilt/i.test(title))
    return ['fall', 'winter']
  if (cat === 'shoes' || cat === 'accessory') return ['spring', 'summer', 'fall', 'winter']
  if (cat === 'outer') return ['fall', 'winter', 'spring']
  return ['spring', 'fall']
}

const tierFor = (price) =>
  price < 70 ? 'entry' : price < 180 ? 'solid' : price < 400 ? 'premium' : 'grail'

/** Feeds shout in ALL CAPS; calm them down. Keeps small words lowercase. */
const titleCase = (t) => {
  const letters = t.replace(/[^a-z]/gi, '')
  const upper = t.replace(/[^A-Z]/g, '')
  if (letters.length === 0 || upper.length / letters.length < 0.7) return t
  return t
    .toLowerCase()
    .replace(/(^|[\s\-/("'])([a-z])/g, (m, pre, c) => pre + c.toUpperCase())
    .replace(/\b(And|Or|The|Of|In|With|X)\b/g, (m) => m.toLowerCase())
    .replace(/\b(l\/s|s\/s)\b/gi, (m) => m.toUpperCase())
}

const sizeSystemFor = (cat, sizes) => {
  if (cat === 'shoes') return 'shoe'
  if (cat === 'accessory') return 'one'
  if (sizes.some((s) => /^\d{2}(\b|x)/.test(s))) return 'waist'
  return 'alpha'
}

const BRAND_SKIP = new Set(['Gitman Vintage', 'Rowing Blazers', 'Taylor Stitch'])

// Sneaker boutiques: shoes only, deeper cap — this is the sneaker wall.
const SHOE_ONLY = new Set(['Bodega', 'Concepts', 'Undefeated', 'A Ma Maniére', 'Feature', 'Extra Butter', 'Social Status', 'Oneness', 'Lapstone & Hammer', 'Packer', 'Saint Alfred', 'Wish ATL'])

const out = []
const seenImages = new Set()
for (const [brand, products] of Object.entries(feeds)) {
  if (BRAND_SKIP.has(brand)) continue
  const styles = BRAND_STYLES[brand] ?? ['minimal']
  const seen = new Set()
  const perCat = {}
  const picked = []
  // Feed order ≈ merchandising order; walk it and keep the first clean hit per bucket.
  for (const p of products) {
    if (!p.available || p.price < 20) continue
    if (EXCLUDE.test(p.title) || EXCLUDE.test(p.type)) continue
    const meta = `${p.type} ${p.title} ${(p.tags || []).join(' ')}`
    if (/\bwomen'?s?\b|\bwmns\b|\bwomans?\b|female|\bdress\b|skirt|blouse|bralette|\bher\b/i.test(meta)) continue
    // No kids lines — TD/PS/GS Jordans, youth, infant.
    if (/\b(td|ps|gs|gt)\b|toddler|preschool|pre-school|grade school|gradeschool|infant|\bkids?\b|youth|little|\bbaby\b/i.test(meta)) continue
    // Boring blanks don't make the edit.
    if (/^\s*(classic |basic |essential )?(black |white |grey |gray |navy )?(t-?shirt|tee)\s*$/i.test(p.title)) continue
    const hay = `${p.type} ${p.title}`
    const cat = CAT.find(([, re]) => re.test(hay))?.[0]
    if (!cat) continue
    if (SHOE_ONLY.has(brand) && cat !== 'shoes') continue
    // Dedup near-identical colourways: strip trailing " - Color" noise.
    const base = p.title.replace(/\s*[-–—]\s*[^-–—]+$/, '').toLowerCase()
    if (seen.has(base)) continue
    if (seenImages.has(p.image)) continue
    seenImages.add(p.image)
    if ((perCat[cat] ?? 0) >= (SHOE_ONLY.has(brand) ? 30 : 8)) continue
    seen.add(base)
    perCat[cat] = (perCat[cat] ?? 0) + 1
    const silhouette = SILHOUETTE.find(([, re]) => re.test(hay))?.[0] ?? 'tee'
    picked.push({
      id: `${brand.replace(/[^a-z]/gi, '').toLowerCase()}-${p.handle.slice(0, 70)}`,
      brand,
      name: titleCase(p.title.replace(/\s*[-–—]\s*(mens?|unisex)$/i, '')),
      category: cat,
      price: p.price,
      tier: tierFor(p.price),
      styles,
      seasons: seasonFor(cat, p.title),
      gender: 'unisex',
      sizeSystem: sizeSystemFor(cat, p.sizes),
      fitBias: 0,
      image: `${p.image}?width=900`,
      fabric: p.fabric || '',
      _candidates: (p.images || [p.image]).slice(0, 4),
      silhouette,
      url: p.url,
    })
    if (picked.length >= 44) break
  }
  out.push(...picked)
}

// hard guarantee: no duplicate ids ever reach the app
const seenIds = new Set()
const deduped = out.filter((p) => (seenIds.has(p.id) ? false : (seenIds.add(p.id), true)))
writeFileSync('src/data/catalog.gen.json', JSON.stringify(deduped, null, 1))
console.error(`curated ${deduped.length} products from ${Object.keys(feeds).length} brands`)
const byCat = {}
out.forEach((p) => (byCat[p.category] = (byCat[p.category] ?? 0) + 1))
console.error(byCat)

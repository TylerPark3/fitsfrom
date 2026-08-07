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
  /** When it happened + why it mattered. */
  when: string
  context: string
  vibe: string
  /** The person's style DNA — powers the style-twin match. */
  styles: StyleId[]
  /** Instagram post permalink — renders the real post when set. */
  ig?: string
  /** Keep the data but hide from the grid (e.g. second fit from same person). */
  hidden?: boolean
  /** Photo lives at public/fits/<id>.jpg. */
  pieces: FitPiece[]
}

/** Iconic fits, broken down top-to-bottom. */
export const FITS: Fit[] = [
  {
    id: 'clarkson-tunnel',
    styles: ['street', 'skate'],
    who: 'Poole Party',
    where: 'Tunnel walk',
    when: 'Game-day arrival',
    context:
      'Thrifted ’93 Final Four tee layered over a cream thermal — the vintage-tunnel formula: one loud piece, everything else quiet.',
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
    who: 'Poole Party',
    where: 'Wizards tunnel',
    when: 'Game-day arrival, headphones on',
    context:
      'All-black everything with an Arc’teryx beanie and white runners — proof a whole fit can be three colors and still walk like money.',
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
    id: 'clarkson-mavs',
    styles: ['street', 'skate'],
    who: 'JC',
    where: 'Mavs tunnel',
    when: 'Game-day arrival, iced drink in hand',
    context:
      'Washed-orchid zip hoodie with contrast stitching over a white tee, gold chains, light-wash carpenter jeans puddling over white Forces. One loud color, everything else calm.',
    vibe: 'Washed purple zip hoodie, baggy wash, white Forces',
    pieces: [
      { slot: 'Hoodie', worn: 'Washed-orchid zip hoodie', match: { category: 'top', kw: 'hoodie|zip|sweatshirt' } },
      { slot: 'Tee', worn: 'White tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Chains', worn: 'Layered gold chains', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Jeans', worn: 'Light-wash baggy carpenter jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Sneakers', worn: 'White Forces', match: { category: 'shoes', kw: 'sneaker|leather|court' } },
    ],
  },
  {
    id: 'sga-arrival',
    styles: ['minimal', 'street'],
    who: 'SGA',
    where: 'Thunder tunnel',
    when: 'Home opener, puppy in hand',
    context:
      'The internet asked “shorts?” for two months and never got an answer. Grey boxy hoodie, camo 3/4 cargos, cream sneakers — and the dog.',
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
    context:
      'Trucker cap, chain, Le Fleur tee and forest-green work pants — proof the whole look can be five pieces if every piece is right.',
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
    styles: ['street', 'skate'],
    who: 'Pretty Flacko',
    where: 'Studio backdrop',
    when: 'Tie-dye wall, film flash',
    context:
      'Boxy striped tee, pearl choker, rings on every finger, parachute-wide black trousers. Proportions doing all the work.',
    vibe: 'Striped boxy tee, pearls, parachute pants',
    pieces: [
      { slot: 'Tee', worn: 'Oversized striped tee', match: { category: 'top', kw: 'stripe|striped|tee' } },
      { slot: 'Chain', worn: 'Pearl choker', match: { category: 'accessory', kw: 'chain|necklace|pearl|jewel' } },
      { slot: 'Pants', worn: 'Parachute-wide black trousers', match: { category: 'pants', kw: 'wide|parachute|baggy|pleat' } },
      { slot: 'Sneakers', worn: 'Black platform sneakers', match: { category: 'shoes', kw: 'sneaker|trainer' } },
    ],
  },
  {
    id: 'lebron-quiet',
    styles: ['athletic', 'street'],
    who: 'Rookie LeBron',
    where: 'Cleveland, 2003',
    when: 'PS2 and controllers in hand',
    context:
      'Cavs trucker cap, team longsleeve, grey sweats, white Forces — carrying a PlayStation 2 by the cords. The most 2003 photo ever taken.',
    vibe: 'Trucker cap, team longsleeve, grey sweats',
    pieces: [
      { slot: 'Cap', worn: 'Cavs trucker cap', match: { category: 'accessory', kw: 'cap|hat|trucker' } },
      { slot: 'Longsleeve', worn: 'Navy team longsleeve', match: { category: 'top', kw: 'l/s|long sleeve|longsleeve' } },
      { slot: 'Sweats', worn: 'Grey baggy sweatpants', match: { category: 'pants', kw: 'sweatpant|sweat|jogger|fleece' } },
      { slot: 'Sneakers', worn: 'White Forces', match: { category: 'shoes', kw: 'sneaker|leather|court' } },
    ],
  },
  {
    id: 'lebron-tunnel',
    styles: ['minimal', 'street'],
    who: 'Bron',
    where: 'Lakers tunnel',
    when: 'Playoff game-day arrival',
    context:
      'Backwards printed cap, moto-graphic camp shirt, lilac relaxed trousers, ice-blue sneakers. Year 21 and still setting the dress code.',
    vibe: 'Camp shirt, lilac trousers, ice-blue sneakers',
    pieces: [
      { slot: 'Cap', worn: 'Backwards printed cap', match: { category: 'accessory', kw: 'cap|hat' } },
      { slot: 'Shirt', worn: 'Moto-graphic camp collar shirt', match: { category: 'shirt', kw: 'camp|print|graphic|short sleeve' } },
      { slot: 'Chain', worn: 'Pearl necklace', match: { category: 'accessory', kw: 'chain|pearl|necklace|jewel' } },
      { slot: 'Trousers', worn: 'Lilac relaxed trousers', match: { category: 'pants', kw: 'trouser|pleat|wide' } },
      { slot: 'Sneakers', worn: 'Ice-blue sneakers', match: { category: 'shoes', kw: 'sneaker|trainer' } },
    ],
  },
  {
    id: 'drake-night',
    styles: ['street', 'athletic'],
    who: 'Drizzy',
    where: 'NYC, leaving dinner',
    when: 'Night out, security in tow',
    context:
      'Vintage Bad Dog quarter-zip fleece over grey sweats — the richest man in the room dressed like a 1994 assistant coach, on purpose.',
    vibe: 'Vintage quarter-zip, grey sweats',
    pieces: [
      { slot: 'Fleece', worn: 'Vintage Bad Dog quarter-zip', match: { category: 'top', kw: 'quarter|half zip|fleece|sweatshirt' } },
      { slot: 'Sweats', worn: 'Grey wide sweatpants', match: { category: 'pants', kw: 'sweatpant|sweat|jogger|fleece' } },
      { slot: 'Sneakers', worn: 'White sneakers', match: { category: 'shoes', kw: 'sneaker|trainer' } },
    ],
  },
  {
    id: 'bieber-lounge',
    styles: ['athletic', 'street'],
    who: 'Bieber',
    where: 'At home',
    when: 'Beanbag, gold chains out',
    context:
      'White durag, layered gold chains, head-to-toe oversized grey sweatsuit. Comfort pushed so far it loops back to a statement.',
    vibe: 'Durag, chains, oversized grey sweatsuit',
    pieces: [
      { slot: 'Chains', worn: 'Layered gold chains', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Hoodie', worn: 'Oversized grey zip hoodie', match: { category: 'top', kw: 'hoodie|zip|sweatshirt' } },
      { slot: 'Sweats', worn: 'Baggy grey cargo sweats', match: { category: 'pants', kw: 'sweatpant|sweat|cargo|jogger' } },
      { slot: 'Sneakers', worn: 'Grey chunky runners', match: { category: 'shoes', kw: 'runner|trainer|sneaker' } },
    ],
  },
  {
    id: 'bieber-drew',
    styles: ['street', 'skate'],
    who: 'Bieber',
    where: 'West Hollywood',
    when: 'Dinner run, hood over beanie',
    context:
      'Grey zip hoodie over a beanie, pearl chain, paint-splattered baggy jeans, drew house mules. Messy on purpose, expensive by accident.',
    vibe: 'Hood over beanie, painted jeans, mules',
    pieces: [
      { slot: 'Beanie', worn: 'Brown beanie under hood', match: { category: 'accessory', kw: 'beanie' } },
      { slot: 'Hoodie', worn: 'Oversized grey zip hoodie', match: { category: 'top', kw: 'hoodie|zip|sweatshirt' } },
      { slot: 'Tee', worn: 'White tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Jeans', worn: 'Paint-splattered baggy jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Shoes', worn: 'drew house smiley mules', match: { category: 'shoes', kw: 'mule|slide|loafer' } },
    ],
  },
  {
    id: 'bieber-night',
    styles: ['minimal', 'street'],
    who: 'Bieber',
    where: 'Hollywood, night out',
    when: 'Backwards cap, chains out',
    context:
      'Crisp white boxy camp shirt over ripped light-wash baggies into tan suede boots. Three pieces, zero effort, all proportion.',
    vibe: 'White boxy shirt, ripped baggies, suede boots',
    pieces: [
      { slot: 'Cap', worn: 'Backwards black cap', match: { category: 'accessory', kw: 'cap|hat' } },
      { slot: 'Shirt', worn: 'White boxy short-sleeve shirt', match: { category: 'shirt', kw: 'camp|short sleeve|boxy|white' } },
      { slot: 'Chain', worn: 'Layered silver chains', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Jeans', worn: 'Ripped light-wash baggy jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Boots', worn: 'Tan suede boots', match: { category: 'shoes', sil: 'boot', kw: 'boot|suede|mule' } },
    ],
  },
  {
    id: 'messi-notears',
    styles: ['street', 'minimal'],
    who: 'Messi',
    where: 'Store exit, flashbulbs',
    when: 'Shopping run',
    context:
      'The GOAT in a No Tears graphic tee, zebra-faded baggy denim and pool-blue slip-ons. Proof the fit formula is universal: one graphic, one silhouette, one color pop.',
    vibe: 'Graphic tee, baggy wash, blue slip-ons',
    pieces: [
      { slot: 'Tee', worn: 'No Tears oversized graphic tee', match: { category: 'top', kw: 'graphic|print|tee' } },
      { slot: 'Belt', worn: 'Black leather belt', match: { category: 'accessory', kw: 'belt' } },
      { slot: 'Denim', worn: 'Faded baggy jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Shoes', worn: 'Pool-blue slip-ons', match: { category: 'shoes', kw: 'slip|canvas|sneaker' } },
    ],
  },
  {
    id: 'lamine-touchline',
    styles: ['street', 'workwear'],
    who: 'Lamine Yamal',
    where: 'Touchline, suspended',
    when: 'Watching from the sideline',
    context:
      'Seventeen, in a shearling-collar leather jacket, raw-dark baggy denim and Vans. Dressed better injured than the league does healthy.',
    vibe: 'Shearling leather jacket, dark baggies, Vans',
    pieces: [
      { slot: 'Jacket', worn: 'Brown shearling-collar leather jacket', match: { category: 'outer', kw: 'leather|shearling|jacket' } },
      { slot: 'Tee', worn: 'Black tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Denim', worn: 'Raw dark baggy denim', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Shoes', worn: 'Two-tone Vans', match: { category: 'shoes', kw: 'canvas|vans|sneaker|skate' } },
    ],
  },
  {
    id: 'flacko-money',
    styles: ['street', 'skate'],
    who: 'Pretty Flacko',
    where: 'SoHo crosswalk',
    when: 'Winter, walking like a runway',
    context:
      'Money-print puffer over a cash-print hoodie, Supreme denim jorts, tube socks, wheat Timbs. Nobody else survives this outfit. He owns it.',
    vibe: 'Money-print puffer, denim jorts, wheat Timbs',
    pieces: [
      { slot: 'Puffer', worn: 'Money-print puffer jacket', match: { category: 'outer', kw: 'puffer|down|print' } },
      { slot: 'Hoodie', worn: 'Cash-print zip hoodie', match: { category: 'top', kw: 'hoodie|zip|print' } },
      { slot: 'Jorts', worn: 'Supreme denim jorts', match: { category: 'pants', kw: 'short' } },
      { slot: 'Socks', worn: 'Striped tube socks', match: { category: 'accessory', kw: 'sock' } },
      { slot: 'Boots', worn: 'Wheat work boots', match: { category: 'shoes', sil: 'boot', kw: 'boot' } },
    ],
  },
  {
    id: 'ye-detroit',
    styles: ['workwear', 'minimal'],
    who: 'Ye',
    where: 'Calabasas',
    when: 'Sunday Service era',
    context:
      'Washed-teal Carhartt Detroit with the brown corduroy collar, black jeans breaking over sand military boots. The jacket that sent Detroit prices to the moon.',
    vibe: 'Teal Detroit jacket, black jeans, sand boots',
    pieces: [
      { slot: 'Jacket', worn: 'Washed-teal Detroit jacket', match: { category: 'outer', kw: 'detroit|chore|work|canvas|jacket' } },
      { slot: 'Tee', worn: 'White tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Jeans', worn: 'Black straight jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Boots', worn: 'Sand military boots', match: { category: 'shoes', sil: 'boot', kw: 'boot' } },
    ],
  },
  {
    id: 'ye-red',
    styles: ['workwear', 'street'],
    who: 'Ye',
    where: 'Hotel exit',
    when: 'Pink-hair era',
    context:
      'Red Detroit jacket with the black collar, greige tee, chocolate Dickies, neutral Air Maxes. One loud jacket, everything else earth tones.',
    vibe: 'Red Detroit jacket, brown work pants, Air Max',
    pieces: [
      { slot: 'Jacket', worn: 'Red Detroit work jacket', match: { category: 'outer', kw: 'detroit|chore|work|canvas|jacket' } },
      { slot: 'Tee', worn: 'Greige tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Chain', worn: 'Thin gold chain', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Pants', worn: 'Chocolate work pants', match: { category: 'pants', kw: 'work|pant|dickies|874|twill' } },
      { slot: 'Sneakers', worn: 'Neutral runners', match: { category: 'shoes', kw: 'runner|trainer|sneaker' } },
    ],
  },
  {
    id: 'rpattz-paris',
    styles: ['workwear', 'minimal'],
    who: 'Rob Pattinson',
    where: 'Paris hotel exit',
    when: 'Trucker cap, hands in pockets',
    context:
      'Alpha Industries trucker cap, navy harrington over an open plaid shirt, slate cargos breaking over navy suede campus sneakers. The most famous normcore guy alive.',
    vibe: 'Trucker cap, plaid shirt, slate cargos',
    pieces: [
      { slot: 'Cap', worn: 'Alpha Industries trucker cap', match: { category: 'accessory', kw: 'cap|hat|trucker' } },
      { slot: 'Jacket', worn: 'Navy zip harrington', match: { category: 'outer', kw: 'harrington|jacket|zip' } },
      { slot: 'Shirt', worn: 'Open plaid button-up', match: { category: 'shirt', kw: 'plaid|check|flannel|button' } },
      { slot: 'Cargos', worn: 'Slate-blue cargos', match: { category: 'pants', kw: 'cargo|fatigue|work' } },
      { slot: 'Sneakers', worn: 'Navy suede campus sneakers', match: { category: 'shoes', kw: 'suede|campus|sneaker' } },
    ],
  },
  {
    id: 'jgreen-flannel',
    styles: ['street', 'skate'],
    who: 'Jalen Green',
    where: 'Rockets tunnel',
    when: 'Plate of food in hand',
    context:
      'Bubblegum-plaid flannel open over a white tee, black baggy cargos puddling on olive boots, iced-out chain. Loud shirt, quiet everything else.',
    vibe: 'Pink plaid flannel, black baggies, chain',
    pieces: [
      { slot: 'Flannel', worn: 'Pink-and-teal plaid flannel', match: { category: 'shirt', kw: 'flannel|plaid|check' } },
      { slot: 'Tee', worn: 'White tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Chain', worn: 'Iced pendant chain', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Cargos', worn: 'Black baggy cargos', match: { category: 'pants', kw: 'cargo|baggy|wide' } },
      { slot: 'Boots', worn: 'Olive lug boots', match: { category: 'shoes', sil: 'boot', kw: 'boot' } },
    ],
  },
  {
    id: 'jwill-arrival',
    styles: ['ivy', 'street'],
    who: 'J-Dub',
    where: 'Thunder arrival',
    when: 'Duffel over the shoulder',
    context:
      'Tennis sweater vest with a pink V over a white tee, washed denim jorts, stacked white socks into white lows. Prep pieces, street proportions.',
    vibe: 'Tennis vest, denim jorts, stacked socks',
    pieces: [
      { slot: 'Vest', worn: 'White tennis sweater vest', match: { category: 'knit', kw: 'vest|cricket|tennis|sweater' } },
      { slot: 'Tee', worn: 'White tee underneath', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Chains', worn: 'Layered chains + pearls', match: { category: 'accessory', kw: 'chain|pearl|necklace|jewel' } },
      { slot: 'Jorts', worn: 'Washed denim jorts', match: { category: 'pants', kw: 'short' } },
      { slot: 'Socks', worn: 'Stacked white socks', match: { category: 'accessory', kw: 'sock' } },
      { slot: 'Sneakers', worn: 'White low-top sneakers', match: { category: 'shoes', kw: 'sneaker|canvas|court' } },
    ],
  },
  {
    id: 'booker-stripe',
    styles: ['street', 'skate'],
    who: 'Book',
    where: 'Suns tunnel',
    when: 'Backwards cap, chain hanging',
    context:
      'Pink-striped boxy tee layered over a white longsleeve, raw-hem black jorts, black Chucks with stacked white socks. The layered-tee formula at its cleanest.',
    vibe: 'Striped tee over longsleeve, black jorts, Chucks',
    pieces: [
      { slot: 'Cap', worn: 'Backwards black cap', match: { category: 'accessory', kw: 'cap|hat' } },
      { slot: 'Tee', worn: 'Pink-striped boxy tee', match: { category: 'top', kw: 'stripe|striped|tee' } },
      { slot: 'Layer', worn: 'White longsleeve underneath', match: { category: 'top', kw: 'l/s|long sleeve|longsleeve' } },
      { slot: 'Jorts', worn: 'Raw-hem black jorts', match: { category: 'pants', kw: 'short' } },
      { slot: 'Sneakers', worn: 'Black canvas Chucks', match: { category: 'shoes', kw: 'canvas|chuck|sneaker' } },
    ],
  },
  {
    id: 'booker-black',
    styles: ['street', 'minimal'],
    who: 'Book',
    where: 'Suns tunnel',
    when: 'Playoff arrival, shades indoors',
    context:
      'Backwards cap, black-on-black boxy tee into parachute pants into Chucks. One color, four silhouettes — that’s the trick.',
    vibe: 'All black, backwards cap, Chucks',
    pieces: [
      { slot: 'Cap', worn: 'Backwards black cap', match: { category: 'accessory', kw: 'cap|hat' } },
      { slot: 'Tee', worn: 'Boxy 3/4-sleeve black tee', match: { category: 'top', kw: 'tee|t-shirt' } },
      { slot: 'Pants', worn: 'Black parachute pants', match: { category: 'pants', kw: 'parachute|nylon|wide|cargo' } },
      { slot: 'Sneakers', worn: 'Black canvas Chucks', match: { category: 'shoes', kw: 'canvas|chuck|sneaker' } },
    ],
  },
  {
    id: 'v-airport',
    styles: ['minimal', 'ivy'],
    who: 'V (BTS)',
    where: 'Incheon airport',
    when: 'Departure walk, cameras waiting',
    context:
      'Checked shirt with a loose black tie, washed green jeans, leather duffel with a bear charm. Business on top, completely unbothered below.',
    vibe: 'Loose tie, checked shirt, washed green denim',
    pieces: [
      { slot: 'Shirt', worn: 'Green-check button-up', match: { category: 'shirt', kw: 'check|plaid|gingham|button' } },
      { slot: 'Chain', worn: 'Layered gold necklaces', match: { category: 'accessory', kw: 'chain|necklace|jewel' } },
      { slot: 'Denim', worn: 'Washed-green wide jeans', match: { category: 'pants', sil: 'jean', kw: 'jean(?!s? short)|denim(?! short)' } },
      { slot: 'Bag', worn: 'Leather duffel, bear charm', match: { category: 'accessory', sil: 'bag', kw: 'bag|tote|duffel' } },
    ],
  },
  {
    id: 'v-funk',
    styles: ['street', 'minimal'],
    who: 'V (BTS)',
    where: 'Studio floor',
    when: 'Film camera, flash on',
    context:
      'Grey bucket cap, Funk-logo hoodie, teal track pants, socks. The off-duty idol uniform: nothing fits, everything works.',
    vibe: 'Bucket cap, logo hoodie, teal track pants',
    pieces: [
      { slot: 'Cap', worn: 'Grey bucket cap', match: { category: 'accessory', kw: 'cap|hat|bucket' } },
      { slot: 'Hoodie', worn: 'Navy Funk-logo hoodie', match: { category: 'top', kw: 'hoodie|sweatshirt' } },
      { slot: 'Pants', worn: 'Teal relaxed track pants', match: { category: 'pants', kw: 'track|sweatpant|jogger|nylon' } },
      { slot: 'Socks', worn: 'White socks, no shoes', match: { category: 'accessory', kw: 'sock' } },
    ],
  },
]

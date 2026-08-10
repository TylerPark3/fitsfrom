# Personal Styling Engine — Product & Technical Specification
### Project: **Cosign** (`/Users/tylerpark/Desktop/Fashion`) · React 18 + Vite + TypeScript · client-only, localStorage, no backend
### Spec version 1.0 · 2026-08-07

---

## 0. Scope in one paragraph

Cosign today ranks *products* against a taste profile (`matchScore`, 1672-product catalog) and lets a user stash owned pieces in a closet. It cannot reason about an **outfit**. This spec adds a deterministic styling engine: a metadata layer over every garment (owned + catalog), a 12-dimension outfit fit score derived from sourced styling rules, an outfit builder with a completion solver, a ranked "Top Fits" surface, a four-tier recommendation engine, and a feedback loop that adapts per-user weights. Everything runs in the browser with zero network calls at runtime and zero model calls. All new numbers live in one tunable config module so seasonal drift is a config edit, not a code change.

---

# 1. RESEARCH REPORT (condensed)

Twelve topics. Each claim is tagged **[D]** durable (encode as logic), **[T]** trend (encode as decaying config), or **[R]** refuted (do not encode).

### Sourcing caveats that constrain what we may hard-code
- `gq.com`, `esquire.com` — blocked entirely. **No claim below rests on them.**
- `permanentstyle.com` — HTTP 403 on direct fetch. All PS figures come from search-surfaced excerpts. **Every PS number below is marked ⚠️ and ships as `config`, never as a constant, until a human verifies it.**
- One PS excerpt is internally contradictory (Crompton's "22–22.5in hem" vs his stated 16–17in preference). **Do not encode that figure at all.** The 2 cm just-noticeable-difference and the 21.5 / 23 / 25 cm hem ladder are internally consistent and are used.
- Refuted claims (§1.11) are called out specifically so no one "improves" the engine by adding them back.

---

### 1.1 Silhouette ≠ fit — two independent axes **[D]**
Put This On defines silhouette as "the shape of your clothes" with details stripped, and calls it the most important dimension for whether something looks good — explicitly distinct from fit (whether a garment pulls or bags).
→ https://putthison.com/how-to-understand-silhouette-pt-one/
**Encoded as:** `GarmentMeta.silhouetteRole` (volume 0–3) and `GarmentMeta.fitQuality` are separate fields; the size/comfort sub-score and the proportion sub-score never read each other's field.

### 1.2 Commit to a proportion — the middle is the failure state **[D]** *(strongest claim in the corpus, 3 independent sources)*
- Die Workwear! quoting George Wang: "You can either adhere to conventional concepts or go the opposite way. But never somewhere in between." → https://dieworkwear.com/2022/10/15/how-to-develop-good-taste-pt-4/
- Highsnobiety (2026): garments were "either boxy and masculine or sexy and see-through," which "left little space for in-betweens." → https://www.highsnobiety.com/p/tight-oversized-trend-2026/
- Complex, Giovanna Ramos: "You can't put on a fat-ass T-shirt with some jeans that's like halfway baggy." → https://www.complex.com/style/a/andrew-luecke/giovanna-ramos-big-pants-style-tips-adidas

Ramos is describing a *near*-match failing, not a mismatch. → **RULE P1 (polarization gate)**: `|volumeTop − volumeBottom| == 1` fails unless both are 1.

### 1.3 Three legal configurations **[D]**
Put This On's taxonomy: **Classic** ("middle-of-the-road cut with moderate proportions… tailored without being skinny; comfortable without being baggy"), **coherently slim / coherently full**, and **mixed** — with the asymmetry stated: it is "typically easier to pair fuller tops with slim bottoms" than the reverse. PTO names both failure modes: columnar slim-everything "lack[s] dimensional interest"; uncoordinated mixing "appears sloppy rather than considered."
→ https://putthison.com/how-to-understand-silhouettes-pt-two/
**Note the live tension:** PTO's "fuller top / slimmer bottom is easier" is the *inverse* of streetwear's current default. Encoded as a **confidence weight**, never a prohibition — see §4.3 `PROPORTION.mixBias` (default `0`, PTO-leaning `+0.15`, streetwear-leaning `−0.15`).

### 1.4 Horizontal lines stratify the body **[D]**
PTO's three levers that break a silhouette into readable blocks: waistline definition (belt, drawstring, higher rise + tuck), hemline placement ("longer coats, longer shirts, and even longer sleeves"), and layering different lengths.
→ https://putthison.com/how-to-understand-silhouettes-pt-two/
**Encoded as:** `OutfitDraft.waistDefined` + `topHemVsWaistbandCm` + `rise` — the three inputs to RULE P2.

### 1.5 Oversized survives by being short **[D]**
Highsnobiety distinguishes plain oversized from **boxy**: "very wide" but "quite short — almost cropped," crediting YEEZY Season 1; the boxy cut "maintains visual definition by limiting length." → https://www.highsnobiety.com/p/oversized-fashion-mens/
Corroborated from tailoring: Die Workwear! on roomy overcoats — "you should layer a chunky sweater inside so you don't look like you're swimming underneath." → https://dieworkwear.com/2016/11/28/the-ideal-coat-wardrobe/

### 1.6 Wide bottoms need a higher rise and a terminating hem **[D]**
PTO: trousers should "sit a little higher on the hips" for "better proportions between torso and legs"; fuller pants should "sit a little cropped, such that the hem terminates right around the ankles"; failure is explicit — "if there's fabric pooling around your feet, it'll look like you need to go to the tailors." → https://putthison.com/real-people-a-more-relaxed-silhouette-the/
Rise definitions ⚠️ (PS, excerpt only): high = natural waist, "between the bottom of your ribs and the top of your hip bones"; mid = just below hip bone; low = at/below hip bone. → https://www.permanentstyle.com/2020/08/what-are-low-medium-and-high-rise-trousers.html

### 1.7 Footwear weight is paid for by leg volume **[D]** *(with a preserved disagreement)*
- Highsnobiety: chunky sneakers, "there's only one full-proof way of ensuring you don't end up looking like you have clown feet: wide-leg pants." → https://www.highsnobiety.com/p/sneakers-pants-styles-guide/
- Complex: "Opt for a straight leg for wide or puffy sneakers, a slim fit for narrow styles, or a tapered fit to show off your favorite kicks." Two-sided failure: "A wide cuff means you'll never see your feet, whereas a too-skinny style will make some silos appear overly bulky." → https://www.complex.com/sneakers/a/calvy-click/rules-for-matching-your-sneakers-to-your-outfit
- PTO: "Heavier boots ground voluminous trousers; lightweight pieces can highlight dominant items through contrast." → https://putthison.com/how-to-understand-silhouettes-pt-two/
- Die Workwear! on chunky shoes: they "look tremendous with the right clothes" — substantial fabrics. → https://dieworkwear.com/2015/11/11/chunky-shoes-for-fall/

Highsnobiety says wide-leg, Complex says straight-leg. **We encode the overlap only** (19–27 cm), not either source's endpoint.

### 1.8 Boots impose a hard geometric constraint **[D]** *(the only fully-numeric verbatim rule in the corpus)*
Complex, Timberland guide: pants must "stack, or at the very least, fall **within** the collar of the boot"; "if the cuff is wider than the collar of the boot itself, then try a different pant"; "your pants should fall behind the tongue… avoid placing your pants **over** the tongue"; "Timbs deserve to be seen—not covered by billowing bootcut jeans."
→ https://www.complex.com/style/a/gregory-babcock/guide-on-how-to-wear-timberland-boots

### 1.9 Stack is a bounded interval, not a monotonic good **[D]**
Complex: stacked denim from over-long jeans "just makes the outcome sloppy"; "denim with a slight stack usually looks best, but you don't want too much excess length"; over-cuffing warning — "they might be at your shin when everything is said and done. That's not a good look." → https://www.complex.com/sneakers/a/matt-welty/how-to-pinroll-jeans

### 1.10 Hem width has a just-noticeable difference **[D]** ⚠️
PS (excerpt only): "The difference between jeans styles is often around **2cm** on the hem, which can significantly impact the look." Reference specs cited: Casatlantic El Jadida 21.5 cm, Rubato Lot 2 / Casatlantic Mogador 23 cm, Buck Mason Full Saddle 25 cm. Bespoke can be let out only ~2.5 cm total.
→ https://www.permanentstyle.com/2026/07/wide-legged-trousers-are-mainstream-should-you-alter-yours.html
Also ⚠️: preferred openings 16in (suit) / 17in (casual), measured as flat width × 2; large feet + aggressive taper "would only emphasize the size of your shoes." → https://www.permanentstyle.com/2008/07/know-your-trouser-width.html · https://www.permanentstyle.com/2018/04/trouser-measurements-style-and-proportions.html

### 1.11 Color: the three-color rule is right about the count and wrong about the mechanism **[D]**
O'Donovan, Agarwala & Hertzmann, *Color Compatibility From Large Datasets* (SIGGRAPH 2011), LASSO over a 334-dim feature vector on hundreds of thousands of rated 5-color themes:
- **Hue entropy** (von Mises mixture, κ = 2π) runs 4.62 (one hue) → 5.87 (uniform). Rated optimum **4.7–5.4**, which the paper states "corresponds to themes with about 2-3 hues."
- **Lightness dominates**, and the shape matters more than the spread: max−min lightness is positively weighted, but "all models heavily penalize a high standard deviation in lightness." Synthesis: "these two features promote high contrast with low standard deviation, that is, a gradient."
- **"reasonably popular, but not too similar"** — positive weight on mean pairwise hue probability, negative on its minimum. → near-miss hue penalty.
- **[R] Hue templates do not predict beauty.** Matsuda's i/V/I/Y/X/T/L/N templates: "we find little evidence that people gravitate to templates naturally, or that matching a template produces higher scores" — themes *closer* to templates scored slightly **lower**.
→ https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf

Zhang et al. independently: Matsuda templates "deviated from real-world data"; and background-removed **3-color palettes per item** reach AUC 0.84, comparable to deep image features. → https://arxiv.org/abs/2007.02388

Menswear corroboration: **chroma parity** — Stòffa's Agyesh Madan via Die Workwear: "When everything has a similar intensity, the colors feel right with each other, even if they contrast." → https://dieworkwear.com/2021/09/27/colorful-conversation-with-stoffa/ · **value-first** ⚠️ PS: value "is probably the most important in classic menswear and in art." → https://www.permanentstyle.com/2024/01/what-colour-theory-can-teach-you-about-clothing.html · **neutral spine** of blue/grey/brown + green/burgundy accents. → https://dieworkwear.com/2018/06/01/how-to-color-outside-of-the-lines/ · **accents against black** ⚠️ PS: "oxblood, copper, forest or olive green, aubergine, navy." → https://www.permanentstyle.com/2020/01/wearing-black.html

**⛔ Implementation ban: no complementary / triadic / analogous bonus, ever.** It is the most tempting feature and the evidence says it does not predict preference and may anti-predict it.

### 1.12 Texture, statement budget, accessories, layering, culture **[D]**
- **Texture substitutes for color contrast**: "The low-hanging fruit is always: 'add some texture or surface interest.'" → https://dieworkwear.com/2021/09/27/colorful-conversation-with-stoffa/ · ceiling ⚠️ PS: "there can be too much contrast between a tweed coat and worsted trousers." → https://www.permanentstyle.com/2016/10/the-guide-to-worsted-suitings.html
- **One statement piece anchors, others recede** — Highsnobiety's genreless-menswear framing ("Loud and quiet. Color and neutral."). → https://www.highsnobiety.com/p/how-menswear-became-genreless/ · design-side: branding "isolated to a singular, precise point on the chest." → https://www.highsnobiety.com/p/graphic-t-shirts-buy-online/
- **Limit your variables** — Die Workwear! quoting Aaron Levine: "Limit yourself to a single color palette… sticking to navy and creating tension within a set of parameters," with deliberate tension like "oversized outerwear with diminutive footwear." → https://dieworkwear.com/2022/10/15/how-to-develop-good-taste-pt-4/
- **Metal temperature** — "Sterling silver goes nicely with cooler colors"; accessories must match the clothing's genre; "use it as a way to create a total and cohesive look." → https://dieworkwear.com/2018/06/20/the-controversial-issue-of-men-jewelry/
- **Layering caps**: 3 visible layers max ("four or more look messy and overcomplicated"); hem reveal 1–2 inches max; thin→thick outward; never all one fabric; never size up a base layer to make room. → https://manofmany.com/style/how-to-layer-clothes-mens-guide
- **Sneaker-first construction** — Kesha McLeod (PJ Tucker, Harden, Serena, Embiid): "That's how it always works. He knows what sneaker he wants… it was finding a look that meshed with the sneaker well." → https://www.complex.com/style/a/mike-destefano/pj-tucker-stylist-kesha-mcleod-nba-playoffs-outfit-strategy
- **Personal uniform + fit literacy** — Courtney Mays: find 2–3 pieces you love, build a repeatable uniform; #1 "do" is understanding fit. → https://www.yahoo.com/entertainment/dos-don-ts-wnba-tunnel-201450571.html · https://www.si.com/lifestyle/2022/05/27/courtney-mays-nba-menswear-stylist-100-influential
- **Coordinate sets** = highest style-per-decision ratio; **archive over new-season** — styling sophistication reads louder than newness. Same Complex URL.
- **Baggy on baggy** — "Baggy on baggy turns a confident silhouette into a shapeless one." → https://ghostnotesupply.com/blogs/magazine/how-to-dress-like-a-rapper-2026
- **Volume in the body, structure at the boundaries** (necklines, wrists, hems). → https://www.dapperconfidential.com/oversized-menswear/
- **The over-styling meta-rule** — McLeod (WWD, paywalled snippet): "You can always tell when somebody's overly styled… it doesn't look like something natural, something that's them." → https://wwd.com/menswear-news/mens-fashion/nba-tunnel-fits-stylist-breakdown-1235642665/

---

### 1.13 TREND TABLE — decays, never becomes logic

All rows below ship in `src/lib/trends.ts` with `validThrough` and linear confidence decay over 18 months (RULE T1). **Nothing in this table may appear in a scoring branch except via `trendWeight(tag, today)`.**

| Tag | Claim | Source | `validThrough` |
|---|---|---|---|
| `big-pant-little-top` | "Tops have gotten increasingly tighter and more cropped while pants have mutated into huge, sculptural silhouettes" | https://www.highsnobiety.com/p/big-pant-little-top-trend-how-to-style/ | 2027-06 |
| `barrel-jeans` | "Exaggerated, barrel jeans are definitely a big trend right now" | https://www.complex.com/style/a/mike-destefano/jeans-buyers-guide-2026 | 2027-06 |
| `ultra-baggy-receding` | "we've also luckily reversed-course from the ultra baggy silhouette" | https://www.highsnobiety.com/p/raw-denim-trend-2026/ | 2027-12 |
| `polarized-runway` | tailored-and-vast vs body-con | https://www.highsnobiety.com/p/tight-oversized-trend-2026/ | 2027-03 |
| `low-profile-footwear` | "designers have been obsessed with flattening and slimming" | https://www.highsnobiety.com/p/footwear-trends-2026/ | 2027-06 |
| `chunky-returning` | "familiarity breeds contempt and we've been too familiar with the dad shoe for too long" | https://www.highsnobiety.com/p/flat-sneaker-chunky-shoe-trend/ | 2028-01 |
| `hybrid-shoes` | snoafers, ballet sneakers, Tabis | https://www.highsnobiety.com/p/footwear-trends-2026/ | 2027-06 |
| `sneaker-pivot-ss26` | fashion week moving to proper shoes | https://www.highsnobiety.com/p/fashion-week-ss26-footwear-trend/ | 2027-01 |
| `frankenstein-trousers` | AMBUSH / Acne trompe-l'œil (a *garment* trend, not hem stacking) | https://www.highsnobiety.com/p/stacked-pants-trend/ | 2026-12 |
| `long-coat-baggy-denim` | FW26 street style, "oversized, drapey silhouettes" | https://hypebeast.com/2026/1/paris-fashion-week-mens-fw26-street-style | 2027-06 |
| `cropped-and-snug` | "so awkwardly cropped… as though accidentally subjected to a tumble dry" | https://www.highsnobiety.com/p/menswear-trends-of-2026/ | 2028-06 |

**Read `ultra-baggy-receding` and `cropped-and-snug` together: the direction of travel is away from maximum volume.** Any engine that hard-codes "bigger is better" is wrong within two seasons.

### 1.14 REFUTED / WEAK — never encode
| Claim | Status |
|---|---|
| Complementary / triadic / analogous wheel bonus | Empirically refuted as a rating predictor (O'Donovan) |
| Seasonal color analysis / dress for your complexion | Weak — Die Workwear: "the proof is often dubious"; with variables controlled "it's hard to notice any real effect." → https://dieworkwear.com/2018/04/07/dressing-for-your-complexion/ |
| Never mix black + navy, brown + black | Convention only; contradicted by PS's black-accent list |
| 60-30-10 | Trade heuristic, no research backing. Used only as an **area prior**, labeled as such in the UI |
| Personal contrast matching (high/low contrast faces) | Popular sources only, no peer-reviewed support |
| "Photograph your fit in grayscale" attributed to Highsnobiety | **Not present** in the cited article. Grounded instead in O'Donovan's lightness findings |

---

# 2. DATA MODELS

New file: **`src/lib/attrs.ts`** (types + inference), **`src/lib/color.ts`** (OKLCH), **`src/lib/types.ts`** (engine types). Existing `src/lib/store.ts` types are **extended, never replaced**.

## 2.1 Confidence mechanism (used by every inferred field)

```ts
/** Where a value came from. Anything not 'user' is uncertain and must render as such. */
export type Provenance =
  | 'user'        // typed or picked by the person. Never overwritten by inference.
  | 'catalog'     // present in catalog.gen.json as authored by scripts/curate.mjs
  | 'image'       // extracted from pixels at build time (or canvas, for customs)
  | 'title'       // regex over product.name / brand
  | 'fabric'      // parsed from product.fabric free text
  | 'default'     // category-level fallback; the weakest source

/** Confidence floor per provenance. Multiplied by rule-specific modifiers. */
export const PROV_CONF: Record<Provenance, number> = {
  user: 1.0, catalog: 0.95, image: 0.8, title: 0.65, fabric: 0.7, default: 0.35,
}

/** Every inferred field is wrapped. `v` is always present — never null-guard at call sites. */
export interface Inferred<T> {
  v: T
  c: number            // 0–1 confidence
  src: Provenance
  /** Short human string for the "why do you think that?" popover. */
  why?: string
}

export const known = <T>(v: T, why?: string): Inferred<T> =>
  ({ v, c: 1, src: 'user', why })

export const guess = <T>(v: T, src: Provenance, why?: string, mod = 1): Inferred<T> =>
  ({ v, c: clamp01(PROV_CONF[src] * mod), src, why })
```

**UI contract:** any `Inferred<T>` with `c < 0.6` renders with the `.condchip` treatment plus a dotted underline and an "Is this right?" tap target that writes `known(...)` on confirm. Confidence `< 0.6` also suppresses the field from any *hard reject* rule — it may only downgrade (see §4.6).

## 2.2 `GarmentMeta` — the metadata layer

Attached to catalog products (build-time, `src/data/attrs.gen.json`) and to owned/custom pieces (runtime override in `WardrobeItem.meta`).

```ts
export type Subcategory =
  // top
  | 'tee' | 'longsleeve' | 'tank' | 'hoodie' | 'crewneck' | 'zip'
  // shirt
  | 'oxford' | 'flannel' | 'overshirt' | 'camp' | 'rugby' | 'polo' | 'jersey'
  // knit
  | 'crew-knit' | 'cardigan' | 'vest' | 'turtleneck'
  // outer
  | 'bomber' | 'coach' | 'work-jacket' | 'puffer' | 'parka' | 'overcoat'
  | 'blazer' | 'leather' | 'shell' | 'fleece' | 'varsity' | 'track-top'
  // pants
  | 'jean' | 'chino' | 'trouser' | 'cargo' | 'sweatpant' | 'short' | 'skirt'
  // shoes
  | 'low-sneaker' | 'high-sneaker' | 'runner' | 'chunky-sneaker'
  | 'boot' | 'loafer' | 'derby' | 'sandal' | 'clog'
  // accessory
  | 'cap' | 'beanie' | 'bag' | 'belt' | 'scarf' | 'glasses' | 'jewelry' | 'sock' | 'watch'
  | 'other'

export type ColorRole = 'dominant' | 'secondary' | 'accent'
export type TextureClass =
  | 'worsted' | 'jersey' | 'twill' | 'canvas' | 'denim' | 'flannel'
  | 'fleece' | 'knit-fine' | 'knit-chunky' | 'tweed' | 'corduroy'
  | 'nylon' | 'leather' | 'suede' | 'shearling' | 'mesh' | 'quilted'

/** PS roughness ladder (R11). Adjacent large panels must not exceed 2 steps. */
export const ROUGHNESS: Record<TextureClass, number> = {
  worsted: 0, nylon: 0, leather: 0, mesh: 0,
  jersey: 1, twill: 1, 'knit-fine': 1, suede: 1,
  denim: 2, canvas: 2, flannel: 2, quilted: 2,
  fleece: 3, 'knit-chunky': 3, corduroy: 3, tweed: 3,
  shearling: 4,
}

export interface GarmentColor {
  hex: string           // '#1b2a3c'
  L: number             // OKLCH L, 0–1
  C: number             // OKLCH C, 0–~0.4
  H: number             // OKLCH H, 0–360
  role: ColorRole
  /** Share of the garment's visible area this color occupies, 0–1. Sums to 1 per garment. */
  share: number
}

export interface GarmentMeta {
  /** Stable key. For catalog: product.id. For customs: custom.id. */
  ref: string
  category: Category                       // reuses existing taxonomy
  subcategory: Inferred<Subcategory>

  /** Zhang et al.: 3 colors per item, never 1. Index 0 is always the dominant. */
  colors: Inferred<GarmentColor[]>

  pattern: Inferred<{
    kind: 'solid' | 'stripe' | 'check' | 'camo' | 'floral' | 'allover-print' | 'colorblock'
    /** 0 = none, 1 = full-garment print. Feeds R12 loudness. */
    scale: number
  }>
  /** Fraction of the garment's front area occupied by a printed/embroidered graphic. */
  graphicArea: Inferred<number>
  /** 0 = matte, 1 = mirror. Satin, patent, metallic, coated nylon. */
  sheen: Inferred<number>

  material: Inferred<{ fibers: string[]; primary: string }>
  texture: Inferred<TextureClass>

  /** 0 slim · 1 regular/straight · 2 relaxed/loose · 3 oversized/baggy/wide */
  volume: Inferred<0 | 1 | 2 | 3>
  /** Bottoms only. Leg opening, flat half-measure, cm. */
  legOpeningCm: Inferred<number | null>
  /** Bottoms only. */
  rise: Inferred<'low' | 'mid' | 'mid_high' | 'high' | null>
  /** Tops/outer only. cm below the natural waistband. Negative = cropped. */
  hemDropCm: Inferred<number | null>
  /** Shoes only. Max stack height at the heel, mm. */
  soleMm: Inferred<number | null>
  /** Shoes only. Boot collar circumference proxy, flat half-measure cm. */
  bootCollarCm: Inferred<number | null>

  /** Layering position. Lower = closer to skin. base 0 · mid 1 · outer 2 · shell 3 */
  layerIndex: Inferred<0 | 1 | 2 | 3>
  /** Fabric weight proxy, gsm. Drives layering monotonicity + warmth. */
  gsm: Inferred<number>
  /** 0 = mesh tank · 100 = expedition parka. */
  warmth: Inferred<number>
  seasons: Inferred<Season[]>
  /** 0 gym · 25 casual · 50 smart-casual · 75 business · 100 black tie */
  formality: Inferred<number>
  /** 0 invisible · 100 the only thing anyone sees. Computed, see §4.9. */
  visualWeight: Inferred<number>

  styleTags: Inferred<StyleId[]>
  /** Free tags: 'bbc', 'archive', 'coordinate-set', 'sport-heritage', 'graphic-hero'. */
  tags: string[]

  /** Jewelry/hardware only. */
  metal: Inferred<'silver' | 'gold' | 'mixed' | 'none'>

  /** Bookkeeping so a catalog regen can re-run inference without stomping user edits. */
  inferredAt: number
  schemaVersion: number
}
```

## 2.3 `WardrobeItem` — extended (backwards compatible)

Every new field is optional. Existing persisted objects deserialize unchanged.

```ts
export type ItemStatus = 'owned' | 'wishlist' | 'sold' | 'donated' | 'retired' | 'loaned'

export interface SizeFitNotes {
  /** What they actually bought. Existing field, unchanged. */
  size: string
  /** Post-purchase correction — the single highest-value signal we can collect. */
  runs?: 'small' | 'true' | 'large'
  lengthFit?: 'short' | 'good' | 'long'
  shoulderFit?: 'tight' | 'good' | 'loose'
  waistFit?: 'tight' | 'good' | 'loose'
  /** Free text, shown verbatim in the drawer. */
  note?: string
}

export interface CompatibilityRecord {
  /** Other item ref this was worn with. */
  ref: string
  /** Times worn together. */
  n: number
  /** Sum of user ratings of outfits containing both, /5. */
  ratingSum: number
  lastAt: number
}

export interface WardrobeItem {
  // ——— existing, unchanged ———
  productId: string
  size: string
  addedAt: number
  owned: boolean          // DEPRECATED — kept for rollback; `status` is authoritative
  condition?: string
  years?: number

  // ——— new ———
  /** Denormalized snapshot so a catalog regen cannot silently delete the item. */
  snapshot?: { brand: string; name: string; price: number; image: string; category: Category }
  status?: ItemStatus                      // default 'owned'
  meta?: Partial<GarmentMeta>              // user overrides; merged OVER inferred meta
  fitNotes?: SizeFitNotes
  /** Cents. What they actually paid — differs from catalog price. */
  paidCents?: number
  wearCount?: number                       // default 0
  lastWornAt?: number | null
  /** Dates worn, newest first, capped at 60 entries. */
  wearLog?: number[]
  /** −1 dislike · 0 neutral · 1..5 stars. */
  rating?: number
  /** User photo of the actual item, data URL. Overrides catalog image in the builder. */
  photo?: string | null
  compat?: CompatibilityRecord[]
}

/** Derived, never stored. */
export const costPerWear = (i: WardrobeItem, fallbackPrice: number): number | null => {
  const paid = i.paidCents != null ? i.paidCents / 100 : fallbackPrice
  const n = i.wearCount ?? 0
  return n > 0 ? paid / n : null
}
```

`CustomPiece` gains the same optional block (`snapshot` omitted — customs are the source of truth):

```ts
export interface CustomPiece {
  id: string; name: string; category: string; photo: string; link?: string
  // new
  meta?: Partial<GarmentMeta>
  status?: ItemStatus
  paidCents?: number
  wearCount?: number
  lastWornAt?: number | null
  wearLog?: number[]
  rating?: number
  fitNotes?: SizeFitNotes
  compat?: CompatibilityRecord[]
  addedAt?: number
}
```

## 2.4 `StyleProfile` — the adaptive layer

Sits **beside** `Profile`, not inside it, so the existing profile deep-merge in `loadState` is untouched.

```ts
export type Occasion =
  | 'school' | 'work' | 'casual' | 'going-out' | 'date'
  | 'gameday' | 'travel' | 'athletic' | 'formal'

export interface StyleProfile {
  schemaVersion: number

  /** Which formulas the person gravitates to. Seeded at onboarding, updated by feedback. */
  formulaAffinity: Partial<Record<FormulaId, number>>   // −1..+1, EWMA

  /** Adaptive dimension weights. Sum is normalized at read time, never at write time. */
  weights: Record<FitDimension, number>

  /** Per-user calibration so a loud dresser is not penalized for loudness. */
  cal: {
    /** Chroma the user tolerates before the accent rule bites. Default 0.15. */
    chromaCeiling: number
    /** Max simultaneous loud items before penalty. Default 1. */
    statementBudget: number
    /** −1 = prefers slim-top/full-bottom (streetwear) · +1 = full-top/slim-bottom (PTO). */
    mixBias: number
    /** Preferred bottom volume, 0–3, fractional. Default 1.6. */
    volumeTarget: number
    /** How much novelty the user wants. 0 = uniform-repeater, 1 = never repeat. */
    noveltyAppetite: number
    /** 0 = ignore trends entirely, 1 = full trend weighting. Default 0.5. */
    trendAppetite: number
  }

  /** Context the engine needs and cannot infer. All optional. */
  context: {
    /** IANA-ish city label for the manual climate band. No API — see §12. */
    climate?: 'cold' | 'temperate' | 'hot' | 'variable'
    /** Manual override of today's temp band; sticky for 12h. */
    tempBandF?: 'freezing' | 'cold' | 'mild' | 'warm' | 'hot'
    /** Where they spend their week. Drives occasion priors + gap targets. */
    primaryOccasions: Occasion[]
    /** Dress code hard limits, e.g. no hats, no shorts. */
    restrictions: string[]
  }

  /** Rolling counters used for novelty + anti-domination. */
  stats: {
    wornRefs: Record<string, { n: number; lastAt: number }>
    outfitsRated: number
    dislikedRefs: string[]
  }

  updatedAt: number
}

export type FitDimension =
  | 'taste' | 'proportion' | 'color' | 'layering' | 'texture'
  | 'occasion' | 'weather' | 'footwear' | 'statement'
  | 'sizeComfort' | 'novelty' | 'feedback'

export const DEFAULT_WEIGHTS: Record<FitDimension, number> = {
  taste: 0.14, proportion: 0.18, color: 0.16, layering: 0.08, texture: 0.07,
  occasion: 0.09, weather: 0.08, footwear: 0.08, statement: 0.06,
  sizeComfort: 0.04, novelty: 0.01, feedback: 0.01,
}
```

`proportion` and `color` are the two heaviest because they carry the best-sourced rules (§1.2 three-source triangulation; §1.11 SIGGRAPH regression).

## 2.5 `OutfitDraft`, `FitEvaluation`, `Recommendation`, `FeedbackSignal`

```ts
export type SlotId =
  | 'headwear' | 'base' | 'mid' | 'outer' | 'bottom' | 'footwear'
  | 'accessory1' | 'accessory2' | 'bag'

export interface SlotFill {
  slot: SlotId
  /** Catalog product id OR custom id OR null (empty). */
  ref: string | null
  /** True = the solver must not change this. */
  locked: boolean
  /** Solver's runner-up fills for this slot, best-first. Populated by complete(). */
  alternatives: string[]
}

export interface OutfitDraft {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  slots: SlotFill[]
  /** The formula this draft was generated from, if any. */
  formulaId?: FormulaId
  /** Celebrity Fit id used as a template, if any. */
  templateFitId?: string
  occasion?: Occasion
  tempBandF?: StyleProfile['context']['tempBandF']
  season?: Season
  /** Detail measurements the user can set; solver seeds them from meta. */
  detail: {
    waistDefined: boolean
    tucked: boolean
    hemTreatment: 'none' | 'cuff' | 'stack' | 'within_collar' | 'break'
    stackMm: number
    pantOverTongue: boolean
    focalPoint: 'top' | 'bottom' | 'feet' | 'outer' | 'accessory' | null
  }
  wornAt: number[]          // dates this exact draft was marked worn
  rating?: number           // 1–5
  photo?: string | null
  archived?: boolean
}
```

```ts
export type Severity = 'reject' | 'warn' | 'nudge' | 'pass'

export interface RuleHit {
  id: string                      // 'P1' | 'C-R5' | 'L3' | ...
  dimension: FitDimension
  severity: Severity
  /** Message shown verbatim. Written in second person, no hedging. */
  message: string
  /** Refs implicated. Used to highlight the offending slots on the canvas. */
  refs: string[]
  /** Points deducted from the dimension sub-score (0–100 scale). */
  delta: number
  /** Confidence of the metadata this hit depends on. <0.6 downgrades reject→warn. */
  confidence: number
  sourceUrl?: string              // shown on tap: "why do we say that?"
}

export interface FitEvaluation {
  score: number                   // 0–100
  label: 'Cooked' | 'Off' | 'Fine' | 'Solid' | 'Strong' | 'Elite'
  confidence: number              // 0–1, see §4.10
  sub: Record<FitDimension, { score: number; weight: number; hits: RuleHit[] }>
  /** Ordered, deduped, capped at 3. */
  working: string[]
  improve: string[]
  /** One swap using something already owned. */
  easySwap: { fromRef: string; toRef: string; slot: SlotId; why: string } | null
  /** One higher-risk suggestion, may reference a catalog item they don't own. */
  adventurous: { slot: SlotId; toRef: string; owned: boolean; why: string } | null
  /** Machine-readable failures for tests. */
  hits: RuleHit[]
  evaluatedAt: number
}
```

```ts
export type RecoTier = 'own' | 'recombine' | 'gap' | 'product'

export interface Recommendation {
  tier: RecoTier
  /** Stable id so dismissals persist. hash(tier + payload refs). */
  id: string
  title: string                 // "Wear the olive work jacket"
  body: string                  // one sentence
  /** What to render. */
  refs: string[]
  outfit?: OutfitDraft          // tiers 'own' | 'recombine'
  gap?: { category: Category; have: number; want: number }
  product?: {
    productId: string
    priceCents: number
    /** REQUIRED — see §7.2. A product reco with fewer than 4 filled fields is not shown. */
    explain: {
      whatItFixes: string
      pairsWith: string[]       // owned refs, min 2
      outfitsUnlocked: number
      sizeLabel: string
      sizeConfidence: number
      costPerWearAtN: { n: number; cpw: number }
      alreadyOwnSimilar: string | null
      cheaperAlternative: string | null
    }
  }
  /** 0–100, drives ordering within the tier. */
  urgency: number
  evidence: RuleHit[]
}
```

```ts
export type FeedbackKind =
  | 'save' | 'unsave' | 'wardrobe-add' | 'wardrobe-remove'
  | 'outfit-save' | 'outfit-worn' | 'outfit-rate' | 'outfit-discard'
  | 'slot-reroll' | 'alt-accepted' | 'reco-dismiss' | 'reco-accept'
  | 'item-rate' | 'item-dislike' | 'fit-note'
  | 'explain-helpful' | 'explain-wrong'

export interface FeedbackSignal {
  id: string
  at: number
  kind: FeedbackKind
  refs: string[]
  /** −1..+1 normalized valence. Derived by kind; overridable. */
  valence: number
  /** Snapshot of what the engine believed, so we can learn from disagreement. */
  ctx?: {
    dimension?: FitDimension
    score?: number
    ruleIds?: string[]
    occasion?: Occasion
    formulaId?: FormulaId
  }
}
```

Storage cap: **500 signals**, FIFO. Older signals are compacted into `StyleProfile.cal` before eviction (§4.4).

## 2.6 localStorage migration plan

### Current state
| Key | Shape |
|---|---|
| `lapel.state.v2` | whole `AppState` |
| `lapel.pro.waitlist` | `'1'` |
| `lapel.unlocks` | `string[]` |
| `lapel.react.<fitId>` | per-fit reactions — **unbounded key count** |
| `lapel.chat.<fitId>` | per-fit chat — **unbounded key count** |

### Target
| Key | Shape |
|---|---|
| `cosign.state.v3` | `AppState` with `schemaVersion: 3` + new collections |
| `cosign.feedback.v1` | `FeedbackSignal[]`, capped 500 |
| `cosign.photos.v1` | **IndexedDB** store (not localStorage) for `profile.photo` + `customs[].photo` + item photos |
| `lapel.state.v2` | **left in place, untouched, for one release** as rollback |
| `lapel.state.v2.bak` | raw string quarantine, written only if parse throws |
| `lapel.social.v1` | `{ unlocks: string[]; react: Record<fitId, …>; chat: Record<fitId, …> }` — folds the unbounded keys |

### `src/lib/migrate.ts`

```ts
export const CURRENT_SCHEMA = 3
type Migration = (s: any) => any
const MIGRATIONS: Record<number, Migration> = { 2: v2_to_v3 }

export function loadState(): AppState {
  // 1. New key wins.
  const v3 = readJSON('cosign.state.v3')
  if (v3 && v3.schemaVersion === CURRENT_SCHEMA) return hydrate(v3)
  if (v3) return hydrate(runChain(v3))

  // 2. Fall back to legacy, migrate, DO NOT delete legacy.
  const raw = localStorage.getItem('lapel.state.v2')
  if (!raw) return DEFAULT_STATE
  let parsed: any
  try { parsed = JSON.parse(raw) }
  catch {
    localStorage.setItem('lapel.state.v2.bak', raw)   // quarantine before giving up
    return DEFAULT_STATE
  }
  const migrated = runChain({ ...parsed, schemaVersion: 2 })
  writeSplit(migrated)                                  // photos → IDB, rest → v3
  return hydrate(migrated)
}
```

### `v2_to_v3` — the exact preservation rules

Ordered. Each numbered rule maps to an audit finding; **each has a test in §10.4.**

1. **Photos migrate first.** `profile.photo`, `customs[].photo` are moved to IndexedDB before the v3 blob is written, and replaced in the blob with `idb:<key>`. Rationale: the existing quota fallback at `store.ts:158-168` *silently drops the photo*; growing the blob makes that fire more often. The photo is the only copy of the body scan and the input `profile.pose` was derived from.
2. `profile.pose`, `faceX`, `faceY`, `faceZoom` copied byte-for-byte. Expensive TF MoveNet output + hand-tuned sliders.
3. **`profile.measurementsEdited` defaults to `true` for every migrated user**, `false` only for brand-new profiles. Existing `chest`/`waist`/`inseam` are indistinguishable from `estimateFromBody` output; assuming "not edited" would let the first height/weight tick destroy real tape-measure data (`AvatarView.tsx:105`, `Onboarding.tsx:304`).
4. `account.passwordHash` and `account.createdAt` copied verbatim. `createdAt` is the sole trial clock (`App.tsx:181-184`).
5. `wardrobe[]` mapped element-wise, never spread:
   ```ts
   wardrobe: (v2.wardrobe ?? []).map((w: any) => ({
     ...w,
     status: w.owned === false ? 'wishlist' : 'owned',
     snapshot: snapshotOf(w.productId),   // brand/name/price/image/category from CATALOG, or undefined
     wearCount: 0, wearLog: [], lastWornAt: null, compat: [],
   }))
   ```
   `snapshot` closes the audit's most dangerous hole: `productId` slugs are regenerated by `scripts/curate.mjs` and are **not stable across catalog refreshes**; today unresolvable ids are silently filtered out (`WardrobeView.tsx:40-41`, `SavedView.tsx:14`). With a snapshot, an orphan degrades to a still-visible entry instead of vanishing.
6. `wardrobe[].condition` / `years` preserved exactly — manually cycled, not derivable.
7. `outfits[].refs` — heterogeneous product/custom ids. Convert to `OutfitDraft` with **customs-first resolution**, matching `refImage`'s precedence at `WardrobeView.tsx:632-637` exactly. Slot assignment by category (`top`→`base`, `knit`→`mid`, `outer`→`outer`, `pants`→`bottom`, `shoes`→`footwear`, `accessory`→`accessory1/2`, `shirt`→`mid` if `base` filled else `base`). Overflow refs go into a `spare: string[]` field so nothing is dropped. Every slot lands `locked: false`.
8. `customs[].category` coerced to `Category` with a `'top'` fallback, mirroring `parseQuickAdd`'s own default (`WardrobeView.tsx:361`).
9. `saved` and `scentFavs` copied **in order** — newest-prepended semantics (`App.tsx:56-58, 117-119`). Never sorted.
10. `collections` copied verbatim, including a present-but-empty array (a user who deleted Wishlist must not get it back).
11. `lapel.unlocks` / `lapel.react.*` / `lapel.chat.*` folded into `cosign.social.v1`; legacy keys left in place for one release.
12. Write order: IDB photos → `cosign.state.v3` → `cosign.feedback.v1`. If the v3 write throws `QuotaExceededError`, retry once with `customs[].photo` also pushed to IDB, then surface a toast — **never silently drop data**, unlike the current behavior.
13. `AppState.styleProfile` seeded from `Profile`: `weights = DEFAULT_WEIGHTS`, `cal` at defaults, `context.primaryOccasions = ['school','casual']`, `context.climate` from `profile.seasons` (`['winter']`→cold, `['summer']`→hot, else temperate).

### Rollback
`cosign.state.v3` write failure leaves `lapel.state.v2` intact and the app boots on the legacy path. A `?legacy=1` query param forces the legacy path for support.

---

# 3. INFERENCE — deterministic derivation of `GarmentMeta`

Two execution sites, identical rule tables (`src/lib/attrs.ts` is imported by both):
- **Build time** — `scripts/enrich.mjs` reads `src/data/catalog.gen.json`, emits `src/data/attrs.gen.json` (`Record<productId, GarmentMeta>`). Runs after `curate.mjs`. Adds one devDependency: `sharp` (image decode). Network failures degrade to title inference, never fail the build.
- **Runtime** — `inferMeta(source)` for `CustomPiece` (canvas-based color extraction, title regex) and for catalog products missing from `attrs.gen.json`.

Precedence at every field: **`user` override > `catalog` field > `image` > `fabric` > `title` > `default`.**

## 3.1 Subcategory — regex ladder over `` `${brand} ${name}` ``
First match wins. Ordered most-specific first. `src` = `'title'`, `mod = 1.0` on hit, else `'default'` from `category`.

```ts
const SUBCAT: [Subcategory, RegExp, Category][] = [
  ['hoodie',       /\bhood(ie|ed)\b/i, 'top'],
  ['zip',          /\bfull.?zip|\bzip.?up\b/i, 'top'],
  ['crewneck',     /\bcrew.?neck|\bsweatshirt\b/i, 'top'],
  ['longsleeve',   /\bl\/s\b|\blong.?sleeve|\bthermal\b/i, 'top'],
  ['tank',         /\btank\b|\bsleeveless\b/i, 'top'],
  ['tee',          /\btee\b|\bt-?shirt\b|\bs\/s\b/i, 'top'],
  ['rugby',        /\brugby\b/i, 'shirt'],
  ['polo',         /\bpolo\b/i, 'shirt'],
  ['jersey',       /\bjersey\b|\bkit\b|\bfootball shirt\b/i, 'shirt'],
  ['overshirt',    /\bovershirt\b|\bshirt.?jac|\bCPO\b/i, 'shirt'],
  ['flannel',      /\bflannel\b|\bplaid shirt\b/i, 'shirt'],
  ['camp',         /\bcamp collar|\bcuban|\bopen collar|\bhawaiian\b/i, 'shirt'],
  ['oxford',       /\boxford\b|\bBD\b|\bbutton.?down\b|\bpoplin\b/i, 'shirt'],
  ['cardigan',     /\bcardigan\b/i, 'knit'],
  ['turtleneck',   /\bturtle.?neck|\bmock.?neck|\broll.?neck\b/i, 'knit'],
  ['vest',         /\bvest\b|\bgilet\b/i, 'knit'],
  ['crew-knit',    /\bsweater\b|\bknit\b|\bshetland\b|\bjumper\b/i, 'knit'],
  ['puffer',       /\bpuffer\b|\bdown\b|\bpuffy\b/i, 'outer'],
  ['parka',        /\bparka\b|\banorak\b/i, 'outer'],
  ['overcoat',     /\bovercoat\b|\btopcoat\b|\bbalmacaan\b|\bchesterfield\b/i, 'outer'],
  ['blazer',       /\bblazer\b|\bsport ?coat\b|\bsuit jacket\b/i, 'outer'],
  ['varsity',      /\bvarsity\b|\bletterman\b/i, 'outer'],
  ['track-top',    /\btrack (top|jacket)\b|\bwarm.?up\b/i, 'outer'],
  ['leather',      /\bleather jacket|\bmoto\b|\bbiker\b|\bracer\b/i, 'outer'],
  ['work-jacket',  /\bwork ?(jacket|shirt)\b|\bchore\b|\bcarpenter jacket\b/i, 'outer'],
  ['coach',        /\bcoach(es)? jacket\b/i, 'outer'],
  ['bomber',       /\bbomber\b|\bMA-?1\b|\bstadium\b|\bflight jacket\b/i, 'outer'],
  ['shell',        /\bshell\b|\bgore.?tex\b|\brain\b|\bhard ?shell\b/i, 'outer'],
  ['fleece',       /\bfleece\b|\bsherpa\b|\bpolartec\b/i, 'outer'],
  ['short',        /\bshort(s)?\b/i, 'pants'],
  ['skirt',        /\bskirt\b/i, 'pants'],
  ['sweatpant',    /\bsweat ?pant|\bjogger\b|\btrack pant|\bparachute\b/i, 'pants'],
  ['cargo',        /\bcargo\b|\bfatigue\b|\bBDU\b/i, 'pants'],
  ['jean',         /\bjean(s)?\b|\bdenim\b(?!.*jacket)|\bfive.?pocket\b/i, 'pants'],
  ['chino',        /\bchino\b|\bkhaki\b/i, 'pants'],
  ['trouser',      /\btrouser\b|\bslack\b|\bpleated\b/i, 'pants'],
  ['boot',         /\bboot(s)?\b|\bchelsea\b|\bmoc toe\b|\bblundstone\b/i, 'shoes'],
  ['loafer',       /\bloafer\b|\bpenny\b|\bbit\b|\bmule\b/i, 'shoes'],
  ['derby',        /\bderby\b|\boxford shoe|\bblucher\b|\bmonk\b/i, 'shoes'],
  ['sandal',       /\bsandal\b|\bslide\b|\bbirkenstock\b/i, 'shoes'],
  ['clog',         /\bclog\b/i, 'shoes'],
  ['high-sneaker', /\bhigh\b|\bhi\b|\bmid\b|\b1 high\b|\bAF1 high\b/i, 'shoes'],
  ['chunky-sneaker', /\bchunky\b|\bdad\b|\bXLG\b|\bmonster\b|\b990|\b993|\b9060\b|\bozweego\b/i, 'shoes'],
  ['runner',       /\brunner\b|\btrail\b|\bspeedcross\b|\bXT-?6\b|\b57\/40\b/i, 'shoes'],
  ['low-sneaker',  /\bsneaker\b|\blow\b|\bsamba\b|\bgazelle\b|\bcampus\b|\bsuperstar\b/i, 'shoes'],
  ['beanie',       /\bbeanie\b|\bwatch cap\b|\btoque\b/i, 'accessory'],
  ['cap',          /\bcap\b|\bhat\b|\b5.?panel\b|\bfitted\b|\btrucker\b/i, 'accessory'],
  ['bag',          /\bbag\b|\btote\b|\bbackpack\b|\bsling\b|\bduffel\b/i, 'accessory'],
  ['belt',         /\bbelt\b/i, 'accessory'],
  ['scarf',        /\bscarf\b|\bmuffler\b|\bsnood\b/i, 'accessory'],
  ['glasses',      /\bsunglass|\beyewear\b|\bshades\b/i, 'accessory'],
  ['jewelry',      /\bchain\b|\bring\b|\bnecklace\b|\bbracelet\b|\bpendant\b|\bcuff\b/i, 'accessory'],
  ['watch',        /\bwatch\b/i, 'accessory'],
  ['sock',         /\bsock(s)?\b/i, 'accessory'],
]
// Guard: only accept a match whose third element === product.category.
// Fallback per category: top→'tee', shirt→'oxford', knit→'crew-knit',
// outer→'work-jacket', pants→'trouser', shoes→'low-sneaker', accessory→'other'.
```

Note `product.silhouette` (13 values) already exists and is a valid `catalog`-provenance prior; use it as a **tiebreak** when the regex ladder returns nothing (`sil='jean'` → `'jean'`, `sil='boot'` → `'boot'`, etc.), at `PROV_CONF.catalog`.

## 3.2 Colors — three per garment, OKLCH

**Path A (build time, `src` = `'image'`, `c` = 0.80):**
1. `fetch(product.image)` → `sharp(buf).resize(96, 96, { fit: 'inside' }).raw()`.
2. Background removal: sample the 4 corners; any pixel within ΔE < 6 (Oklab Euclidean) of the corner mode is dropped. Product cutouts in this catalog sit on white, so this reliably strips the ground.
3. Convert every surviving pixel to Oklab. Run **k-means with k = 3, deterministic init**: seeds are the pixels at the 10th, 50th, 90th percentile of `L` (no RNG — the same image always yields the same palette). 12 iterations, fixed.
4. Emit clusters sorted by size → `role: 'dominant' | 'secondary' | 'accent'`, `share` = cluster fraction.
5. Confidence modifiers: `× 0.85` if the largest cluster is < 40% (busy image), `× 0.7` if > 15% of pixels were dropped as background (likely a lifestyle shot, not a cutout).

**Path B (runtime, customs):** identical algorithm on a `<canvas>` at 96×96 via `drawImage`, `getImageData`. Same k-means, same seeds. `src` = `'image'`, `c` = 0.75 (user photos have real backgrounds).

**Path C (title fallback, `src` = `'title'`, `c` = 0.65):** the colorway is usually the last hyphen-delimited segment (`"L/S Municipal T-Shirt - Abyss"`). Match against a 96-entry lexicon; on hit, emit a single color at `share: 1`.

```ts
// src/lib/color.ts — excerpt of the lexicon. Full table ships 96 entries.
export const COLOR_WORDS: [RegExp, string][] = [
  [/\bblack|\bonyx|\bjet|\bcaviar|\bink\b/i,            '#111111'],
  [/\bwhite|\boptic|\bblanc\b/i,                        '#f7f7f5'],
  [/\bcream|\becru|\bivory|\bnatural|\bbone|\boat\b/i,  '#e9e2d3'],
  [/\bsand|\bstone|\bkhaki|\btan|\btaupe|\bdesert\b/i,  '#c8b79b'],
  [/\bgrey|\bgray|\bcharcoal|\bheather|\bsmoke\b/i,     '#8a8d88'],
  [/\bnavy|\bmidnight|\babyss|\bindigo\b/i,             '#1e2a44'],
  [/\bolive|\bloden|\bfatigue|\barmy|\bsage\b/i,        '#5c6144'],
  [/\bbrown|\bchocolate|\bmocha|\bespresso|\bwalnut\b/i,'#5a4331'],
  [/\bburgundy|\boxblood|\bwine|\bmaroon\b/i,           '#5c2230'],
  [/\bforest|\bhunter|\bracing green\b/i,               '#22402f'],
  [/\bred|\bcrimson|\bscarlet\b/i,                      '#a8352a'],
  [/\bblue|\bcobalt|\broyal|\bsky\b/i,                  '#2b5fa8'],
  // …
]
```

**sRGB → OKLCH** (exact, per CSS Color 4 → https://www.w3.org/TR/css-color-4/):

```ts
export function srgbToOklch(hex: string): { L: number; C: number; H: number } {
  const [r, g, b] = hexToRgb(hex).map(lin)                 // lin: sRGB EOTF⁻¹
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b)
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b)
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b)
  const L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s
  const a = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s
  const bb= 0.0259040371*l + 0.7827717662*m - 0.8086757660*s
  const C = Math.hypot(a, bb)
  const H = (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360
  return { L, C, H }
}
const lin = (c: number) => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4)
```

**Never use HSL.** HSL's `L` reports yellow and blue both at 50%, which breaks the entire lightness-ladder machinery.

## 3.3 Material & texture — parse `product.fabric` (present on 1378/1672)

The field is dirty (172 distinct values, including truncations like `'00% cotton'`, `'90% and'`). Parser:

```ts
// 1. Extract percent-fiber pairs: /(\d{1,3})\s*%\s*([A-Za-z][A-Za-z\s]*)/g
// 2. Normalize the fiber word through FIBER_ALIASES (supima|pima|combed → cotton, poly → polyester).
// 3. Drop pairs whose percent is 0 or > 100, or whose fiber is not in the known set
//    (kills '90% and', '100% high', '100% weighted' — truncation garbage).
// 4. primary = highest-percent fiber. If no percent pairs, look for a bare fiber word.
// 5. If nothing survives → src 'default', category prior, c = 0.35.
```

Texture is then a **two-key lookup on `(subcategory, primaryFiber)`**, falling back to subcategory alone:

```ts
const TEXTURE_BY_SUBCAT: Record<Subcategory, TextureClass> = {
  tee:'jersey', longsleeve:'jersey', tank:'jersey', hoodie:'fleece', crewneck:'fleece', zip:'fleece',
  oxford:'twill', flannel:'flannel', overshirt:'twill', camp:'twill', rugby:'jersey', polo:'knit-fine',
  jersey:'mesh', 'crew-knit':'knit-fine', cardigan:'knit-fine', vest:'knit-fine', turtleneck:'knit-fine',
  bomber:'nylon', coach:'nylon', 'work-jacket':'canvas', puffer:'quilted', parka:'nylon',
  overcoat:'worsted', blazer:'worsted', leather:'leather', shell:'nylon', fleece:'fleece',
  varsity:'flannel', 'track-top':'nylon',
  jean:'denim', chino:'twill', trouser:'worsted', cargo:'canvas', sweatpant:'fleece',
  short:'twill', skirt:'twill',
  'low-sneaker':'leather', 'high-sneaker':'leather', runner:'mesh', 'chunky-sneaker':'mesh',
  boot:'leather', loafer:'leather', derby:'leather', sandal:'leather', clog:'leather',
  cap:'twill', beanie:'knit-chunky', bag:'canvas', belt:'leather', scarf:'knit-fine',
  glasses:'leather', jewelry:'leather', sock:'knit-fine', watch:'leather', other:'twill',
}
// Fiber overrides applied after: wool+chunky-name → 'knit-chunky'; 'tweed'/'harris' in name → 'tweed';
// 'cord'/'corduroy' → 'corduroy'; 'suede'/'nubuck' → 'suede'; 'shearling'/'sherpa' → 'shearling';
// 'mesh'/'air'/'knit upper' on shoes → 'mesh'.
```

## 3.4 Pattern, graphic area, sheen

```ts
// pattern.kind — title regex, then image variance check.
const PATTERN: [kind, RegExp][] = [
  ['stripe',        /\bstripe|\bbreton|\bhoop|\bpinstripe\b/i],
  ['check',         /\bcheck|\bplaid|\btartan|\bgingham|\bmadras|\bglen\b/i],
  ['camo',          /\bcamo|\bcamouflage|\bduck hunter|\btiger stripe\b/i],
  ['floral',        /\bfloral|\bflower|\bpaisley|\bbatik\b/i],
  ['allover-print', /\ball.?over|\bprint\b|\bgraphic\b|\bmulti.?print|\bbayou\b/i],
  ['colorblock',    /\bcolou?r.?block|\bpanel(l)?ed|\bsplit\b|\btwo.?tone\b/i],
]
// Default 'solid'.
// scale: image cross-check at build time. Compute stdev of L over a 12x12 downsample of the
// garment region. stdev < 0.04 → force kind='solid', scale=0 (overrides the regex; a
// "Print" in the product line name doesn't mean the garment is printed).
// Otherwise scale = clamp((stdev - 0.04) / 0.16, 0, 1).
// Regex-only (no image): stripe/check 0.35, camo/floral/allover 0.75, colorblock 0.5.

// graphicArea — heuristic, honest about being weak (c capped at 0.5 without an image).
//   subcategory in {tee, longsleeve, crewneck, hoodie} AND title matches
//   /\bgraphic|\blogo|\bprint|\btee\b.*\b(19|20)\d{2}|\bband\b|\barch\b|\bcrest\b/i
//   → 0.18 (chest-placement) unless /\ball.?over|\bbig|\boversized (logo|print)/i → 0.55
//   Highsnobiety notes branding "isolated to a singular, precise point on the chest" —
//   0.18 encodes that as the default placement size.
//   Everything else → 0.
//   Image cross-check: if the dominant cluster covers >85% of the garment, force 0.05.

// sheen — fiber + title.
//   leather/patent/satin/metallic/lamé/coated/glossy → 0.7
//   nylon/polyester primary with /\bripstop|\bcrinkle|\bshiny|\bgloss/i → 0.5
//   nylon/polyester otherwise → 0.3
//   everything else → 0.05
```

## 3.5 Volume, leg opening, rise, hem drop

```ts
// volume 0–3. Title regex first (highest signal), then subcategory prior.
const VOL_WORDS: [0|1|2|3, RegExp][] = [
  [3, /\bbaggy|\bwide|\bballoon|\bbarrel|\boversiz|\bboxy|\bparachute|\bXL fit|\bsuper wide\b/i],
  [2, /\brelaxed|\bloose|\beasy|\bfull|\bcarpenter|\bwide.?ish|\bcomfort fit\b/i],
  [1, /\bstraight|\bregular|\bclassic fit|\bstandard\b/i],
  [0, /\bslim|\bskinny|\btapered|\bfitted|\bnarrow|\bathletic fit\b/i],
]
const VOL_PRIOR: Partial<Record<Subcategory, 0|1|2|3>> = {
  tee: 1, longsleeve: 1, tank: 0, hoodie: 2, crewneck: 2, zip: 2,
  oxford: 1, flannel: 1, overshirt: 2, camp: 2, rugby: 2, polo: 1, jersey: 2,
  'crew-knit': 1, cardigan: 2, vest: 1, turtleneck: 0,
  bomber: 2, coach: 2, 'work-jacket': 2, puffer: 3, parka: 3, overcoat: 2,
  blazer: 1, leather: 1, shell: 2, fleece: 2, varsity: 2, 'track-top': 2,
  jean: 1, chino: 1, trouser: 1, cargo: 2, sweatpant: 2, short: 1, skirt: 1,
}
// Adjust by product.fitBias — but note ALL 1672 rows are fitBias 0 today, so this
// branch is dead until curate.mjs learns to set it. Keep the code, expect no effect.

// legOpeningCm — only for category 'pants'. Derived from volume via the PS ladder (§1.10),
// which is the ONLY defensible mapping we have; marked src 'default', c 0.4, because
// no catalog row carries a measurement.
const LO_FROM_VOLUME: Record<0|1|2|3, number> = { 0: 17, 1: 20, 2: 22, 3: 26 }
// Subcategory nudges: sweatpant/parachute +1, cargo +1, short → null (no LO rule applies),
// jean with /\bbootcut|\bflare/i → 24.

// rise — title first, then subcategory prior.
//   /\bhigh.?ris|\bhigh.?wais/i → 'high'    /\blow.?ris|\bdrop.?cro/i → 'low'
//   /\bmid.?ris/i → 'mid'
//   prior: trouser→'mid_high', chino→'mid', jean→'mid', cargo→'mid',
//          sweatpant→'mid_high', short→'mid'.  c = 0.4.

// hemDropCm — tops/outer, cm below natural waistband. Negative = cropped.
//   /\bcrop(ped)?\b|\bboxy\b/i → −4       // Highsnobiety: boxy = wide AND "almost cropped"
//   /\blongline|\blong.?line|\belongated|\btall\b/i → +22
//   priors: tee 4, longsleeve 6, hoodie 6, crewneck 4, oxford 12, overshirt 14,
//           'crew-knit' 4, bomber 2, coach 6, 'work-jacket' 8, blazer 20,
//           parka 26, overcoat 40, puffer 14.  c = 0.4.
```

## 3.6 Footwear geometry

```ts
// soleMm — the WEAKEST inference in the whole system. The research corpus contains NO
// sole-height number for "chunky" (explicitly flagged in the proportion research).
// These are model-name-keyed and ship in config with a "needs measurement" flag.
const SOLE_BY_MODEL: [RegExp, number][] = [
  [/\bsamba|\bgazelle|\bspezial|\bcampus|\bstan smith|\bcourt\b/i, 22],
  [/\bair force 1|\bAF1|\bdunk|\bblazer|\bold skool|\bauthentic\b/i, 26],
  [/\b990|\b993|\b9060|\b2002r|\b1906|\bozweego|\bXLG\b/i, 42],
  [/\bXT-?6|\bspeedcross|\bACS|\bgel-?kayano|\bkayano\b/i, 40],
  [/\bboot|\bmoc toe|\bchelsea|\btimberland|\bblundstone\b/i, 32],
  [/\bloafer|\bderby|\boxford shoe|\bpenny\b/i, 18],
  [/\bplatform|\bchunky|\bdad\b/i, 45],
]
// Fallback by subcategory: 'low-sneaker' 26, 'high-sneaker' 28, runner 34,
// 'chunky-sneaker' 44, boot 32, loafer 18, derby 20, sandal 14, clog 30. c = 0.35.

// bootCollarCm — flat half-measure proxy. subcategory 'boot' only.
//   /\bchelsea\b/i → 15 (elasticated, snug)   /\bmoc toe|\bwork boot|\btimberland\b/i → 19
//   /\bcombat|\bjungle|\btall\b/i → 20        default boot → 18.  c = 0.35.
```

## 3.7 Layer index, gsm, warmth, formality, seasons, style tags, metal

```ts
const LAYER_INDEX: Partial<Record<Subcategory, 0|1|2|3>> = {
  tee:0, longsleeve:0, tank:0, polo:0, oxford:0, camp:0, jersey:0,
  hoodie:1, crewneck:1, zip:1, 'crew-knit':1, cardigan:1, vest:1, turtleneck:0,
  flannel:1, overshirt:1, rugby:0, fleece:1, 'track-top':1,
  bomber:2, coach:2, 'work-jacket':2, blazer:2, leather:2, varsity:2,
  puffer:2, parka:3, overcoat:2, shell:3,
}

// gsm — fiber + subcategory table. Drives layering monotonicity (§4.5) and warmth.
const GSM: Partial<Record<Subcategory, number>> = {
  tank:130, tee:180, longsleeve:220, polo:220, oxford:150, camp:140, jersey:150,
  flannel:220, overshirt:320, rugby:300, 'crew-knit':320, cardigan:340,
  turtleneck:300, vest:280, hoodie:400, crewneck:380, zip:400, fleece:350,
  'track-top':260, coach:240, bomber:300, 'work-jacket':380, blazer:300,
  leather:500, varsity:480, puffer:520, parka:600, overcoat:650, shell:200,
  jean:400, chino:280, trouser:260, cargo:340, sweatpant:340, short:240, skirt:240,
}
// Modifiers: /\bheavy(weight)?\b/i ×1.35 · /\blight(weight)?\b/i ×0.7 ·
//            /\bmidweight\b/i ×1.0 · wool primary ×1.1 · linen primary ×0.75.
// The Ghostnote/ManOfMany guidance that a tee should be 200–240 gsm and a hoodie
// ≥350 gsm to hold its shoulder line is encoded as F4's gsm constraint, not here.

// warmth 0–100 = clamp(round(gsm / 6.5) + insulationBonus, 0, 100)
//   insulationBonus: puffer/parka +25, shearling +25, fleece +12, quilted +10,
//                    wool primary +8, linen primary −8, mesh −10.

// seasons — start from product.seasons (catalog, c 0.95). Refine by warmth:
//   warmth >= 70 → drop 'summer'.  warmth <= 25 → drop 'winter'.
//   Note the catalog has NO summer-only or winter-only rows, so this refinement is
//   the only thing that makes the season signal usable at all.

// formality 0–100 — subcategory base, then modifiers.
const FORMALITY: Partial<Record<Subcategory, number>> = {
  tank:5, tee:15, longsleeve:20, hoodie:15, crewneck:20, zip:18, sweatpant:10,
  jersey:12, 'track-top':15, short:12, sandal:8, clog:12,
  polo:35, camp:30, flannel:28, overshirt:35, rugby:28, cargo:22,
  'low-sneaker':25, 'high-sneaker':22, runner:20, 'chunky-sneaker':18,
  jean:30, chino:45, 'crew-knit':45, cardigan:45, vest:45, turtleneck:50,
  oxford:55, boot:40, coach:30, bomber:35, 'work-jacket':35, varsity:25,
  leather:40, fleece:20, puffer:25, parka:25, shell:20,
  trouser:65, blazer:75, overcoat:70, loafer:65, derby:75,
}
// Modifiers: graphicArea > 0.1 → ×0.7 · pattern 'camo'/'allover-print' → ×0.7
//            volume 3 → ×0.85 · fiber 'wool' or 'silk' → ×1.1 · sheen > 0.6 → ×0.9.

// styleTags — start from product.styles (catalog, c 0.95, always 1–2 values).
// Augment from subcategory: cargo/'work-jacket'/boot → +workwear; runner/'track-top' → +athletic;
// shell/fleece/parka → +gorp; oxford/loafer/blazer → +ivy; sweatpant/'chunky-sneaker' → +skate.
// Augmented tags carry c = 0.5 and are excluded from the "Exactly your lane" bonus.

// metal — jewelry/watch/belt only. /\bsilver|\bsterling|\bsteel|\bplatinum|\bwhite gold\b/i
// → 'silver'; /\bgold|\bbrass|\bbronze\b/i → 'gold'; /\btwo.?tone|\bmixed\b/i → 'mixed';
// else 'none'.
```

## 3.8 Visual weight (computed, not inferred)

```ts
// Per R12, extended with area. Range 0–100.
export function visualWeight(m: GarmentMeta): number {
  const c = m.colors.v[0]?.C ?? 0
  const loud =
      0.40 * Math.min(c / 0.20, 1)
    + 0.30 * m.graphicArea.v
    + 0.20 * m.pattern.v.scale
    + 0.10 * m.sheen.v
  return Math.round(loud * 100)
}
```

---

# 4. FIT SCORE — the deterministic algorithm

New file **`src/lib/fitscore.ts`**. Pure. No I/O, no `Date.now()` inside the scorer (time is an argument). Constants live in **`src/lib/styleconfig.ts`**; nothing numeric is inlined.

## 4.1 Entry point

```ts
export function evaluate(
  draft: OutfitDraft,
  ctx: EvalContext,           // { metaOf, itemOf, profile, styleProfile, now, occasion, tempBandF, season }
): FitEvaluation
```

Pipeline:
```
resolve slots → build ItemView[] → run 12 dimension scorers →
adapt weights → weighted mean → apply confidence → generate explanation
```

An `ItemView` is `{ ref, slot, meta: GarmentMeta, item: WardrobeItem | CustomPiece | null, area: number }`. **Area** is the 60-30-10 prior (§1.11, labeled trade convention in the UI):

```ts
const SLOT_AREA: Record<SlotId, number> = {
  base: 0.20, mid: 0.16, outer: 0.26, bottom: 0.30, footwear: 0.06,
  headwear: 0.015, accessory1: 0.01, accessory2: 0.01, bag: 0.015,
}
// Re-normalized over filled slots only. If `outer` is filled, `base` area × 0.4
// (an open overshirt hides most of the tee) and `mid` × 0.6.
```

## 4.2 The twelve dimensions

Every scorer returns `{ score: 0–100, hits: RuleHit[] }`, starts at a **neutral base of 70** and applies deltas. Rationale: an outfit with no information should not score 0 or 100.

---

### D1 · TASTE (weight 0.14)
Reuses the existing `matchScore` shape so the two surfaces agree.

```
taste = 70
styleUnion = union of all items' styleTags (c ≥ 0.6 only)
overlap    = |styleUnion ∩ profile.styles| / max(1, |styleUnion|)
taste += round(overlap * 26)                            // 70 → 96 at full overlap
if overlap == 0: taste -= 22 ; hit('T1','nudge',"Nothing here is in a lane you picked")
// Coherence: PTO/Levine "limit your variables" — a fit spanning 4+ style lanes reads scattered.
if |styleUnion| >= 4: taste -= 8 ; hit('T2','warn',
   "Four different lanes at once. Hold one thing fixed.", src=dieworkwear D11)
// Icon cosign: reuse fitmatch.cosigns()
if any item has a cosign matching profile.icons: taste += 6 ; working("<who> wears this")
// Brand affinity
taste += 4 * (fraction of items whose brand ∈ profile.brands)
```

---

### D2 · PROPORTION (weight 0.18) — the heaviest, best-sourced dimension

Inputs: `vTop` (volume of the outermost torso garment — `outer` if present, else `mid`, else `base`), `vBottom`, `LO`, `rise`, `hemDrop` (of the outermost torso garment), `draft.detail`.

```
prop = 70

// ——— RULE P1: polarization gate. §1.2, three-source triangulation. ———
d = |vTop − vBottom|
if d == 1 and not (vTop == 1 and vBottom == 1):
    prop -= 30
    hit('P1','reject',
        "One step off. Either match the volume or commit to the contrast — halfway reads like clothes that don't fit.",
        src=complex/giovanna-ramos)
else if d == 0: working("Coherent volume top to bottom")
else if d >= 2: working("Real contrast — the shape is deliberate")

// ——— RULE P2: oversized-on-oversized needs a terminator. §1.4, §1.5 ———
if vTop >= 2 and vBottom >= 2:
    terminated = hemDrop <= 0            // cropped/boxy
              or draft.detail.waistDefined
              or draft.detail.tucked
              or rise in ('mid_high','high')
    if not terminated:
        prop -= 24
        hit('P2','reject',
            "Volume everywhere with no horizontal break. Crop the top, add a belt, or go higher-rise.",
            src=highsnobiety/oversized-fashion-mens)
    else: working("The volume has a break to read against")

// ——— RULE P3: longline × wide is the primary failure mode. §1.3 ———
if hemDrop > 15 and LO >= 23:
    ok = (soleMm >= 40 or footwearClass == 'boot') and draft.detail.waistDefined
    if not ok:
        prop -= 26
        hit('P3','reject',
            "A long top over a wide leg has no waist and no break — it reads as one column.",
            src=putthison/silhouettes-pt-two)

// ——— RULE P7: wide legs are paid for at the waist. §1.6 ———
if LO >= 23:
    if rise == 'low':
        prop -= 20 ; hit('P7a','reject',"Wide leg on a low rise gives no torso/leg split.")
    else if rise == 'mid': prop -= 8 ; hit('P7b','warn',"A higher rise would carry this leg better.")
    if hemTreatment not in ('none','cuff') and stackMm > 40:
        prop -= 14 ; hit('P7c','reject',
          "A wide leg has to terminate at the ankle, not pool.", src=putthison/real-people)

// ——— RULE P6: stack is a bounded interval. §1.9 ———
if hemTreatment == 'stack':
    if vBottom >= 2: prop -= 12 ; hit('P6a','warn',"Stacking belongs on a slim or straight leg.")
    if stackMm < 20: prop -= 5  ; hit('P6b','nudge',"That's not a stack, that's just long.")
    if stackMm > 90: prop -= 18 ; hit('P6c','reject',
        "Pooling at the hem reads as needing a tailor.", src=complex/how-to-pinroll-jeans)
    if footwearClass not in ('boot','high-sneaker'):
        prop -= 8 ; hit('P6d','warn',"A stack needs a boot or a high-top to sit on.")

// ——— RULE P9: one anchor. §1.12 (Levine) ———
anchors = count(v == 3) + count(footwearWeight == 3) + count(visualWeight > 60)
if anchors > 2: prop -= 12 ; hit('P9a','warn',
    "Too many loud variables. Hold something fixed.", src=dieworkwear/good-taste-pt-4)
if anchors == 0 and all volumes == 1:
    prop -= 6 ; hit('P9b','nudge',
    "Safe but columnar — nothing here has dimensional interest.", src=putthison/silhouettes-pt-two)

// ——— Mix bias (§1.3 live tension). Confidence weight, NEVER a prohibition. ———
if vTop > vBottom: prop += 6 * styleProfile.cal.mixBias      // PTO-leaning user
if vBottom > vTop: prop -= 6 * styleProfile.cal.mixBias      // streetwear-leaning user

// ——— RULE P8: hem-width JND. §1.10 ———
// Used only for equivalence, not scoring: two bottoms whose |LO_a − LO_b| < 2 are
// treated as the same silhouette class by the completion solver's variety check.
```

---

### D3 · COLOR (weight 0.16) — O'Donovan-derived

Operates on the **flattened palette**: every item's 3 colors, each weighted by `item.area × color.share`. Sub-scores per §1.11.

```
partition: NEUTRAL C < 0.05 · MUTED 0.05–chromaCeiling · VIVID > chromaCeiling
           (chromaCeiling is per-user, default 0.15 — this is the adaptivity hook)

S_value  (0.32 of D3)  // O'Donovan: lightness features dominate
  Lmax, Lmin over area-weighted palette
  f_range = clamp((Lmax − Lmin) / 0.35, 0, 1)
  g = consecutive gaps of sorted L (dedup within 0.02)
  f_even  = clamp(1 − CV(g) / 0.8, 0, 1)        // "gradient, not barbell"
  S_value = 0.60*f_range + 0.40*f_even
  if Lmax − Lmin < 0.20: hit('C-R3','warn',"Everything is the same brightness — the fit reads flat.")

S_chroma (0.24)
  accent = argmax C ; rest = CHROMA_SET \ {accent}
  f_par = clamp(1 − (Cmax(rest) − Cmin(rest)) / 0.12, 0, 1)     // Stòffa chroma parity
  n = Σ area where C < 0.05
  f_neu = trapezoid(n; rise 0.30→0.45, plateau 0.45→0.85, fall 0.85→1.0)
  S_chroma = 0.50*f_par + 0.50*f_neu
  if n < 0.25: hit('C-R1','warn',"Not enough neutral ground for the color to land against.")

S_hue    (0.22)
  k = single-linkage clusters over CHROMA_SET at ΔH ≤ 30°
  S_hue = {0:0.80, 1:0.75, 2:1.00, 3:0.90, 4:0.50}[k] ?? 0.20
  // Optional continuous form: von Mises hue entropy, κ = 2π, area-weighted,
  // full credit 4.7–5.4 (O'Donovan §4.4). Ship the discrete map first.
  if k >= 5: hit('C-R2','reject',"Five separate color families. Cut it to two or three.")

S_temp   (0.12)
  warm H ∈ [20,110] · cool H ∈ [180,300]
  w = warm share of chromatic area
  S_temp = 0.35 + 0.65 * |w − 0.5| * 2
  if 0.4 < w < 0.6: hit('C-R7','nudge',"Warm and cool split down the middle — pick a side.")

S_accent (0.10)
  1 VIVID, area ≤ 0.15 → 1.00 · 1 VIVID, area > 0.15 → 0.60
  0 VIVID → 0.70 (safe but flat) · ≥2 VIVID → 0.35
  // NOTE: the ≥2 penalty is scaled by (1 / cal.statementBudget) — see §4.3.

D3 = 100 * (0.32*S_value + 0.24*S_chroma + 0.22*S_hue + 0.12*S_temp + 0.10*S_accent)

gates (multiplicative, product floored at 0.55):
  G1 near-miss hue pair (both C ≥ 0.10, ΔH ∈ (10,35), |ΔC| < 0.05)  × 0.90 per pair
     hit('C-R8','warn',"Those two colors are almost the same — match them tighter or separate them.")
  G2 metal temperature mismatch (silver on warm-share ≥ 0.5, or gold on < 0.5) × 0.95
  G5 neutral share < 0.25  × 0.85
```

**⛔ There is no complementary/triadic/analogous term and there must never be one.**

---

### D4 · LAYERING (weight 0.08)

```
layers = items with layerIndex ≥ 0 on the torso, sorted by layerIndex
lay = 70
if |layers| > 3: lay -= 25 ; hit('L1','reject',
    "Four visible layers reads messy. Warmer shell, not another layer.", src=manofmany/layering)
if not monotonically non-decreasing gsm outward:
    lay -= 14 ; hit('L2','warn',"A heavier layer under a lighter one bunches. Thin to thick, outward.")
if any inner hemDrop − outer hemDrop > 5.1cm (2in):
    lay -= 12 ; hit('L3','warn',"More than two inches of inner hem showing. One to two is the window.")
if any outer hemDrop < inner hemDrop:
    lay -= 10 ; hit('L4','warn',"The outer layer has to be the longest one.")
if outer layer is 'open' and base volume >= 2:
    lay -= 12 ; hit('L5','warn',"An oversized base under an open layer loses the shape.",
                    src=manofmany/layering)
if tempBand in ('cold','freezing') and |layers| < 2:
    lay -= 15 ; hit('L6','warn',"One layer at this temperature.")
if outermost is a shell and it is not the longest layer and weather == 'wet':
    lay -= 10 ; hit('L7','warn',"In rain the shell has to be the longest thing you have on.")
// Color monotonicity (ManOfMany): lighten-to-darken outward OR fully tonal.
if not (L strictly non-increasing outward or k <= 1): lay -= 5 ; hit('L8','nudge', …)
```

---

### D5 · TEXTURE (weight 0.07)

```
tex = 70
t = distinct TextureClass across items with area ≥ 0.05
base = {1:0.45, 2:0.85, 3:1.00, 4:0.85}[t] ?? 0.60
// R10 texture rescue: tonal or low-contrast fits REQUIRE texture variety.
if (k <= 1 or Lmax − Lmin < 0.20) and t == 1:
    base = 0.20 ; hit('X-R10','reject',
      "One color family and one fabric. Add surface interest or it reads flat.",
      src=dieworkwear/stoffa)
// R11 ceiling: adjacent large panels (area ≥ 0.15) must be within 2 roughness steps.
for each adjacent large pair: if |ROUGHNESS[a] − ROUGHNESS[b]| > 2:
    base *= 0.75 ; hit('X-R11','warn',
      "Too much jump between those two fabrics.", src=permanentstyle/worsted-suitings)
tex = round(base * 100)
```

---

### D6 · OCCASION (weight 0.09)

```
target = OCCASION_FORMALITY[draft.occasion]   // school 25, work 55, casual 20,
                                              // going-out 40, date 45, gameday 25,
                                              // travel 20, athletic 10, formal 85
f = area-weighted mean formality across items
spread = max(formality) − min(formality)
occ = 100 − 1.6 * |f − target| − 0.35 * max(0, spread − 45)
// The spread term is the high/low-mixing guard: Highsnobiety says mixing works when
// silhouette/color/material carry a thread, not automatically.
// Hard restrictions from styleProfile.context.restrictions:
if 'no-hats' and headwear filled: occ -= 30 ; hit('O1','reject',"Your dress code rules out headwear.")
if 'no-shorts' and bottom.subcategory == 'short': occ -= 30 ; hit('O2','reject', …)
if draft.occasion == 'formal' and any graphicArea > 0.1:
    occ -= 25 ; hit('O3','reject',"A graphic kills the tension in a tailored fit.")
```

---

### D7 · WEATHER (weight 0.08)

Weather has **no API** (§12). Input is a manual `tempBandF` or the season default.

```
TARGET_WARMTH = { freezing: 88, cold: 68, mild: 45, warm: 26, hot: 12 }
total = Σ (warmth_i * torsoCoverage_i)   // torsoCoverage: base .5, mid .8, outer 1.0
gap = total − TARGET_WARMTH[band]
wea = 100 − 0.85 * |gap|
if gap < −20: hit('W1','warn',"You'll be cold in this.")
if gap >  25: hit('W2','warn',"This is more than the day needs — you'll be carrying the outer layer.")
if band in ('warm','hot') and any texture in ('fleece','shearling','quilted','knit-chunky'):
    wea -= 12 ; hit('W3','warn', …)
if bottom.subcategory == 'short' and band in ('freezing','cold'): wea -= 20
if season set and item.seasons excludes it: wea -= 5 per item (capped −15)
```

---

### D8 · FOOTWEAR (weight 0.08)

```
fw = 70
weight = soleMm >= 40 ? 3 : soleMm >= 28 ? 2 : 1

// RULE F4 — footwear weight ↔ leg opening. Encodes the Highsnobiety/Complex OVERLAP only.
if weight == 3 and LO < 19: fw -= 26 ; hit('F4a','reject',
    "Chunky shoes under a narrow leg gives you clown feet.", src=highsnobiety/sneakers-pants)
if weight == 3 and LO > 27: fw -= 12 ; hit('F4b','warn',"The leg swallows the shoe.")
if weight == 1 and LO > 24 and draft.detail.focalPoint != 'feet':
    fw -= 8  ; hit('F4c','nudge',"You won't see the shoe. Fine if the point is elsewhere.",
                   src=complex/rules-for-matching-sneakers)
if weight == 1 and LO <= 18: fw += 6 ; working("Slim leg with a narrow shoe — clean line")
if weight == 2 and 19 <= LO <= 24: fw += 6

// RULE F5 — boot cuff inequality. §1.8, the only VERBATIM-sourced numeric rule.
if footwearClass == 'boot':
    if cuffWidthCm > bootCollarCm: fw -= 28 ; hit('F5a','reject',
        "The cuff is wider than the boot collar. Different pant.",
        src=complex/how-to-wear-timberland-boots)
    if draft.detail.pantOverTongue: fw -= 22 ; hit('F5b','reject',
        "Pants go behind the tongue, never over it.", src=same)
    if hemTreatment not in ('stack','within_collar'): fw -= 10 ; hit('F5c','warn', …)
    if bottom is bootcut and LO >= 23: fw -= 12 ; hit('F5d','warn',"The boot is buried.")

// Sneaker-first echo (McLeod, §1.12): reward exactly one color echo from the shoe.
echoes = count of non-adjacent items sharing a color with the shoe within ΔE < 0.08
if echoes == 1: fw += 8 ; working("One color picked up from the shoe — that's the echo")
if echoes >= 3: fw -= 10 ; hit('F6','warn',"Matching this much to the shoe is a costume, not an echo.")
```

---

### D9 · STATEMENT BALANCE (weight 0.06)

```
loud_i = visualWeight(meta_i) / 100          // the R12 formula
n_loud = count(loud_i > 0.6)
budget = styleProfile.cal.statementBudget     // default 1, adaptive
sta = 70
if n_loud == budget:   sta += 22 ; working("One thing is loud and everything else backs it up")
if n_loud == 0:        sta -= 6  ; hit('S1','nudge',"Nothing here is saying anything.")
if n_loud > budget:    sta -= 18 * (n_loud − budget) ; hit('S2','warn',
    "Two things fighting for the eye. Pick one.", src=highsnobiety/genreless)
// Pattern scale separation
if two patterned items and max(scale)/min(scale) < 2:
    sta -= 12 ; hit('S3','warn',"Two patterns at the same scale read as a mistake.")
// Graphic count — the streetwear invariant
if count(graphicArea > 0.10) >= 2: sta -= 20 ; hit('S4','reject',
    "Two graphics cancel each other out. One hero, everything else solid.",
    src=urbanoutfitter/streetwear-outfit-guide)
```

---

### D10 · SIZE & COMFORT (weight 0.04)

The only dimension that reads `Profile` measurements and `fitNotes`.

```
sz = 70
for each owned item with a recorded size:
    rec = recommendSize(product, profile)
    if item.size == rec.label: sz += 4 * rec.confidence
    else if adjacent on the ladder: sz += 0
    else: sz -= 6 ; hit('Z1','nudge',"You own this in a size off your recommendation.")
    if item.fitNotes?.runs == 'small' and item.size == rec.label:
        sz -= 8 ; hit('Z2','warn',"You told us this one runs small.")
    if item.fitNotes?.lengthFit == 'long' and slot == 'bottom':
        sz -= 6 ; hit('Z3','warn',"You marked these long — that's where the pooling comes from.")
// Comfort: the "five-second runway" caveat. A fit for an 8-hour day is not a fit for a camera.
if draft.occasion in ('school','work','travel'):
    if any subcategory in ('blazer','overcoat') and tempBand in ('warm','hot'): sz -= 8
    if bottom.texture == 'leather' or sheen > 0.6: sz -= 6
    if footwear.subcategory in ('derby','loafer') and draft.occasion == 'travel': sz -= 4
```

---

### D11 · NOVELTY (weight 0.01, adaptive to 0.06)

```
nov = 70
for each ref: recency = daysSince(stats.wornRefs[ref].lastAt)
avgRecency = mean over filled slots (missing = 999)
nov += clamp((avgRecency − 7) * 1.2, −25, 20) * cal.noveltyAppetite
// Exact-repeat detection
if this exact slot set was worn within 14 days:
    nov -= 30 ; hit('N1','nudge',"You wore exactly this eight days ago.")
// The counterweight, from Mays' personal-uniform guidance: a repeat is NOT a failure.
// noveltyAppetite defaults to 0.35, so a uniform-repeater is barely penalized.
```

---

### D12 · FEEDBACK HISTORY (weight 0.01, adaptive to 0.10)

```
fb = 70
for each pair (a,b) in the fit:
    rec = compatOf(a, b)
    if rec and rec.n >= 2: fb += 3 * (rec.ratingSum / rec.n − 3)     // −6 … +6 per pair
fb = clamp(fb, 30, 100)
if any ref ∈ stats.dislikedRefs: fb -= 25 ; hit('B1','reject',"You marked this piece as not you.")
if draft.formulaId and formulaAffinity[formulaId] < −0.3:
    fb -= 12 ; hit('B2','nudge',"You've passed on this formula three times.")
```

---

## 4.3 Adaptive weights — how a loud dresser stops being penalized

Two mechanisms, both driven by `FeedbackSignal` history. **Nothing adapts until 5 signals exist**, so a cold-start user gets the sourced defaults.

**(a) Calibration parameters** — EWMA with `α = 0.15`, updated on every positive signal (`outfit-worn`, `outfit-rate ≥ 4`, `reco-accept`, `alt-accepted`):

```ts
function calibrate(sp: StyleProfile, fit: OutfitDraft, ev: FitEvaluation, valence: number) {
  const α = 0.15 * clamp01(valence)
  const obs = observe(fit)   // measured properties of the fit the user endorsed

  // A user who keeps wearing C=0.22 pieces should not keep hearing "too saturated".
  sp.cal.chromaCeiling  = ewma(sp.cal.chromaCeiling,  Math.max(0.15, obs.maxChroma), α)
  sp.cal.statementBudget= Math.round(ewma(sp.cal.statementBudget, obs.loudCount, α))
  sp.cal.volumeTarget   = ewma(sp.cal.volumeTarget,   obs.volumeBottom, α)
  sp.cal.mixBias        = ewma(sp.cal.mixBias,  obs.volTop > obs.volBottom ? 1 : -1, α)
  sp.cal.noveltyAppetite= ewma(sp.cal.noveltyAppetite, obs.wasRepeat ? 0 : 1, α * 0.5)

  // Bounds — the sourced rules still apply, they just move.
  sp.cal.chromaCeiling   = clamp(sp.cal.chromaCeiling, 0.15, 0.30)
  sp.cal.statementBudget = clamp(sp.cal.statementBudget, 1, 3)
  sp.cal.mixBias         = clamp(sp.cal.mixBias, -1, 1)
}
```

**Critically: `chromaCeiling` moving to 0.30 does not disable D3.** The *structural* rules (value ladder, chroma parity, hue economy) still fire — a loud fit that is loud *coherently* scores well, and a loud fit that is incoherent still scores badly. What moves is the threshold at which "vivid" starts, which is exactly the parameter the research leaves unspecified. The rules whose numbers are **verbatim from sources** — P1's polarization gate, F5's cuff inequality, P8's 2 cm JND, R2's 2–3 hue clusters — are **not adaptive** and are excluded from calibration.

**(b) Dimension weights** — nudged toward the dimensions the user's *disagreements* live in:

```ts
// On 'explain-wrong' or on rating an outfit ≥4 that the engine scored <60:
//   the dimension that contributed the largest negative delta loses weight.
// On rating an outfit ≤2 that the engine scored >80:
//   the dimension with the highest score gains weight (we over-trusted it).
w[dim] = clamp(w[dim] * (1 ± 0.08), 0.25 * DEFAULT[dim], 2.5 * DEFAULT[dim])
// Renormalize to sum 1 at READ time, never at write time (so bounds stay meaningful).
```

Weight learning is capped at ±10% total drift per week to prevent one bad rating from reshaping the engine.

## 4.4 Signal compaction
When `FeedbackSignal[]` exceeds 500, the oldest 100 are folded into `cal` (running the same EWMA at `α = 0.05`) and dropped. Pairwise `compat` records live on the items, not in the signal log, so they survive eviction.

## 4.5 Confidence

```ts
function evalConfidence(items: ItemView[], hits: RuleHit[]): number {
  // 1. Metadata quality: area-weighted mean of the fields each firing rule actually read.
  const metaConf = weightedMean(hits.map(h => ({ v: h.confidence, w: Math.abs(h.delta) })))
  // 2. Coverage: how many dimensions had enough data to run at all.
  const coverage = dimensionsWithData / 12
  // 3. Slot completeness: a 3-item fit is less knowable than a 6-item fit.
  const completeness = clamp(filledSlots / 5, 0, 1)
  // 4. Personal history: more feedback = better calibration.
  const history = clamp(signalCount / 25, 0.5, 1)
  return clamp01(0.40*metaConf + 0.25*coverage + 0.20*completeness + 0.15*history)
}
```

## 4.6 The confidence downgrade rule (safety valve)

```
A RuleHit whose confidence < 0.6 is downgraded one severity step:
  reject → warn → nudge → pass
and its |delta| is multiplied by 0.5.
```
Consequence: the engine never tells someone their outfit is wrong based on a `src: 'default'` guess. It only says so when it read a real field or a user confirmation. Every `reject` shown in the UI carries the source URL.

## 4.7 Composition

```
raw = Σ w_i * S_i / Σ w_i                        // weights normalized at read time
gates = Π gate_j, floored at 0.55                // color gates only
score = round(clamp(raw * gates, 0, 100))
label = score>=90 'Elite' · >=80 'Strong' · >=68 'Solid'
      · >=55 'Fine' · >=40 'Off' · else 'Cooked'
```

**Calibration anchors** (regression targets, §10.1):

| Fit | Target |
|---|---|
| Navy overcoat / grey flannel / cream shetland / brown suede boot, school | 84–92 |
| Boxy cropped hoodie (v3) + wide leg 25cm high-rise + chunky sneaker, one graphic | 82–90 |
| Longline coat (hemDrop 40) + baggy 26cm + low-profile sneaker, no belt | 28–42 |
| Oversized tee (v3) + halfway-baggy jean (v2) + any shoe | 35–48 (P1 fires) |
| All-black, single texture, 3 items | 46–58 |
| All-black, leather + wool + nylon | 72–82 |
| Neutral base + one raspberry knit at 14% area | 86–94 |
| Red + green + purple + orange, all C > 0.2 | 15–28 |
| Slim tee + slim jean + slim sneaker, all v0 | 60–70 (coherent but P9b fires) |

## 4.8 Explanation generator

```ts
function explain(sub, hits, items, ctx): Pick<FitEvaluation,'working'|'improve'|'easySwap'|'adventurous'> {
  // WORKING — up to 3. Sourced from positive `working()` calls, ranked by the weight of
  // the dimension that produced them. Never generic: each names a specific garment.
  const working = positives
    .sort((a,b) => ctx.w[b.dim] - ctx.w[a.dim])
    .map(p => p.message).slice(0, 3)

  // IMPROVE — up to 3. Rejects first, then warns, then nudges. Deduped by dimension:
  // at most one message per dimension so the user isn't told the same thing four ways.
  const improve = hits
    .filter(h => h.severity !== 'pass')
    .sort(bySeverityThenDelta)
    .dedupeBy(h => h.dimension)
    .map(h => h.message).slice(0, 3)

  // EASY SWAP — one owned-item substitution that raises the score most.
  // Search: for the slot named by the single worst hit, try every OWNED item of a
  // compatible category (≤ 40 candidates), re-evaluate, keep the best Δ ≥ +5.
  // Cost is bounded: 40 evaluations × ~0.4ms = under 20ms.
  const easySwap = bestOwnedSwap(worstHit.slot, items, ctx)

  // ADVENTUROUS — one higher-variance move. Chosen by walking a fixed ladder and
  // taking the first that (a) is legal under P1/P2/P3/F5 and (b) raises `statement`
  // or `proportion` while not dropping total score more than 4 points.
  //   1. If all volumes ≤ 1 → propose a v3 item in the slot with the most catalog depth.
  //   2. If zero VIVID     → propose a MUTED/VIVID accent at ≤15% area (PS black-accent
  //                          list when the fit is dark: oxblood, copper, forest, aubergine).
  //   3. If footwearWeight == 2 and LO ≥ 21 → propose a chunky shoe.
  //   4. If texture count ≤ 2 → propose a high-roughness mid-layer.
  //   5. Else → propose the top-scoring catalog item carrying a cosign from profile.icons.
  // Prefers an OWNED item; falls back to catalog and marks `owned: false`.
  return { working, improve, easySwap, adventurous }
}
```

Every message is written in second person, states a specific action, and carries `sourceUrl`. **Never** "consider adjusting the proportions."

---

# 5. OUTFIT BUILDER

## 5.1 Component tree

```
<OutfitBuilder>                            // new view, routed from WardrobeView
├─ <BuilderToolbar>                        // .toolbar .toolbar--sticky (new modifier)
│   ├─ occasion <Drop>                     // reuses .drop / .drop__panel
│   ├─ temp band <Drop>
│   ├─ "Build one for me"  .btn--primary   // → complete()
│   ├─ "Shuffle unlocked"  .btn--ghost     // → complete() with a new seed
│   └─ "Compare"           .btn--quiet     // → <CompareTray>
├─ <PieceTray>                             // left col of .av2k — reuses .pickrow/.pick
│   ├─ category tabs      .addtabs/.addtab
│   ├─ search             .search
│   └─ <PickTile>[]       .pick .pick--drag (new modifier) .pick__tick
├─ <OutfitCanvas>                          // center, inside .stage2k
│   └─ <Slot>[] .slot .slot__label .slotitem .slotitem__x
│        states: .is-over (drop hover, verbatim .av__drop.is-over) · .is-filled · .is-locked
│        each filled slot shows a lock toggle + a reroll caret
├─ <FitInspector>                          // right col of .av2k
│   ├─ <ScoreHeader>      .fitbox .fitbox__top .fitbox__size
│   ├─ <FitScoreBreakdown> .fscore .fscore__row/__label/__val + .meter/.meter--good/--neg
│   ├─ <WorkingList>      .reasons/.reason
│   ├─ <ImproveList>      .reasons/.reason (+ .meter--neg dot)
│   ├─ <EasySwapCard>     .own (with an inline swap button)
│   ├─ <AdventurousCard>  .own .own--add
│   └─ <ConfidenceBar>    .meter (renders `evaluation.confidence`)
├─ <AlternativesRail>                      // appears when a slot is focused
│   └─ <PickTile>[]                        // slot.alternatives, best-first, with Δscore
├─ <CompareTray>                           // 2–3 drafts side by side
│   └─ <MiniCanvas>[] + per-dimension delta table
└─ <SaveBar>                               // .drawer__foot pattern
    ├─ "Save fit"  · "Mark worn"  · "Discard"  · rating stars
```

Slot order top-to-bottom on the canvas: `headwear · outer · mid · base · bottom · footwear · accessory1 · accessory2 · bag`. Accessories and bag render as a bottom strip, not a column entry.

## 5.2 Interaction model

| Action | Behavior | Signal emitted |
|---|---|---|
| **Anchor** | Tap a tray piece → fills its natural slot and auto-locks it. First anchor sets `focalPoint`. Sneaker-first (McLeod) is the default hint: an empty canvas shows "Start with the shoe" in the footwear slot. | `wardrobe-add` (none if already owned) |
| **Lock** | Click the lock chip on any filled slot. Locked slots are immutable for `complete()`. `aria-pressed` state, per convention. | — |
| **Complete** | `complete(draft, ctx)` fills every unlocked slot. Re-runs `evaluate()`. Animates fills sequentially (gated on `prefers-reduced-motion` via `matchMedia` — the global CSS kill-switch does not cover JS motion). | — |
| **Alternatives** | Click a filled slot → `AlternativesRail` shows the solver's top 6 runner-ups with Δscore. Accepting one re-evaluates but does not re-solve other slots. | `alt-accepted` |
| **Reroll slot** | Caret on a slot → advances to the next alternative in place. | `slot-reroll` (valence −0.2 on the rejected ref) |
| **Compare** | Snapshot the current draft into a compare tray (max 3). Renders a per-dimension delta table. | — |
| **Save** | Persists `OutfitDraft` to `state.drafts`. | `outfit-save` (+0.6) |
| **Mark worn** | Increments `wearCount` + pushes to `wearLog` on every ref, sets `lastWornAt`, updates every pairwise `compat` record, pushes to `stats.wornRefs`. Prompts for a 1–5 rating (skippable). | `outfit-worn` (+0.8), `outfit-rate` if rated |
| **Discard** | Removes the draft; every ref gets a small negative on `compat`. | `outfit-discard` (−0.4) |

## 5.3 Completion algorithm

**Beam search, deterministic, seeded.** Replaces `autoMatch` (`WardrobeView.tsx:670-730`) entirely. Keeps the one good idea from it — celebrity `Fit` as a template — and adds a slot model, customs, completeness, variety, and repeatability.

```ts
export function complete(draft: OutfitDraft, ctx: EvalContext, seed = 0): OutfitDraft {
  // ——— 0. Candidate pool: owned wardrobe (status 'owned') ∪ customs. Never catalog-only. ———
  const pool = ctx.ownedItems()          // ← FIXES the audit's G13: customs ARE included

  // ——— 1. Required slot set, driven by occasion + temp band. ———
  const required = requiredSlots(draft.occasion, draft.tempBandF)
  //   always: base, bottom, footwear
  //   tempBand cold/freezing: + outer, and mid if freezing
  //   tempBand mild: + one of {mid, outer}
  //   occasion 'formal': + outer
  // If the wardrobe cannot fill a required slot, the solver returns a partial draft
  // with a `gapHint` naming the category — this feeds Recommendation tier 3.

  // ——— 2. Template selection. Preserves the good instinct from the old autoMatch. ———
  const template = pickTemplate(pool, ctx)
  //   score each FIT by (coverage of its pieces by owned categories) then (style overlap
  //   with profile.styles) then (formulaAffinity of its implied formula).
  //   Rotate through the top 3 by `seed % 3` so pressing the button twice differs.

  // ——— 3. Beam search over slots, width 6. ———
  const order = ['footwear', 'bottom', 'base', 'mid', 'outer', 'headwear',
                 'accessory1', 'accessory2', 'bag']
  //   Footwear first is deliberate: it is the McLeod sneaker-first construction, AND it is
  //   the slot with the hardest downstream constraints (F4, F5), so fixing it first prunes
  //   the most branches.

  let beam: Partial<OutfitDraft>[] = [seedFromLocked(draft)]
  for (const slot of order) {
    if (isLocked(draft, slot)) { beam = beam.map(b => withLocked(b, slot)); continue }
    const cands = pool
      .filter(p => fitsSlot(p, slot))
      .filter(p => passesHardGates(p, slot, beam))     // P1, F5, L1 pre-filter
      .slice(0, 24)                                     // bounded work
    const next: Scored[] = []
    for (const b of beam) {
      for (const c of [...cands, null]) {               // null = leave empty, if not required
        if (c == null && required.includes(slot)) continue
        const cand = place(b, slot, c)
        next.push({ draft: cand, s: partialScore(cand, ctx) })
      }
    }
    beam = dedupe(next).sort(byScoreThen(tieBreak(seed))).slice(0, 6).map(x => x.draft)
  }

  // ——— 4. Variety constraints, applied as the beam is pruned. ———
  //   V1  At most one item may repeat from the user's last 3 worn outfits — unless it is
  //       locked, or unless noveltyAppetite < 0.2 (uniform-repeaters are exempt).
  //   V2  No two items from the same brand, unless they are a coordinate set
  //       (both tagged 'coordinate-set' AND sharing a dominant color within ΔE < 0.05).
  //       Coordinate sets are the highest style-per-decision move; do not block them.
  //   V3  At most one item with visualWeight > 60 (the statement budget).
  //   V4  Bottoms differing by < 2cm LO are the same silhouette class (P8/JND) — when
  //       generating alternatives, at most one per class, so the rail shows real choices.
  //   V5  Across the top 6 alternatives for a slot, require ≥ 3 distinct dominant hue
  //       clusters, so the rail isn't six black hoodies.

  // ——— 5. Finalize: full evaluate(), populate each slot's `alternatives` from the
  //        discarded beam branches (best-first, deduped, capped at 6). ———
  const best = beam[0]
  return { ...best, slots: withAlternatives(best, beam), updatedAt: ctx.now }
}
```

`partialScore` runs only the dimensions whose inputs are already filled — cheap, and monotone enough for beam pruning. Complexity: `9 slots × 6 beam × 25 candidates ≈ 1350` partial evaluations, each ~0.05 ms → **under 80 ms** on a mid-range phone. Determinism: `tieBreak(seed)` is the existing `jitter()` hash over `ref + seed`, so the same seed always yields the same fit and "Shuffle" is `seed + 1`.

**Formulas** ship in `src/lib/formulas.ts` as `FormulaId` presets that pre-lock slots and pre-set constraints — the ten from the culture research: `sneaker-first`, `coordinate-set`, `one-loud-graphic`, `top-volume-bottom-clean`, `open-overshirt`, `tailored-street`, `archive-hero`, `tonal-monochrome`, `sport-heritage`, `three-layer-cold`. Each is a partial `OutfitDraft` plus a `constraints: RuleId[]` list the solver adds to `passesHardGates`.

---

# 6. TOP FITS

New file **`src/lib/topfits.ts`**. Ranks the user's saved `OutfitDraft[]` (plus solver-generated candidates) for the "what do I wear" surface.

## 6.1 Ranking formula

```ts
export function rankFits(drafts: OutfitDraft[], f: FitFilters, ctx: EvalContext): RankedFit[] {
  const scored = drafts
    .filter(d => passesFilters(d, f))
    .map(d => {
      const ev = evaluate(d, { ...ctx, occasion: f.occasion ?? d.occasion })
      let r = ev.score

      // (a) Recency penalty — worn recently drops, but never to zero.
      const days = daysSince(lastWorn(d))
      r -= RECENCY_CURVE(days) * ctx.sp.cal.noveltyAppetite
      //   RECENCY_CURVE: 0d→28 · 3d→18 · 7d→10 · 14d→4 · 30d→0 · 90d→−4 (a small
      //   *bonus* for something forgotten, so the closet's back half surfaces)

      // (b) Worn state — a proven fit earns trust the engine can't compute.
      r += clamp((d.wornAt.length) * 1.5, 0, 9)
      if (d.rating) r += (d.rating - 3) * 4          // −8 … +8

      // (c) Season fit.
      if (d.season && d.season !== ctx.season) r -= 12

      // (d) Occasion fit — soft when unspecified, hard when the user filtered.
      if (f.occasion && d.occasion && d.occasion !== f.occasion) r -= 15

      // (e) Confidence shrinkage toward the mean — low-confidence fits don't top the list.
      r = 62 + (r - 62) * (0.6 + 0.4 * ev.confidence)

      return { draft: d, ev, r }
    })
    .sort((a, b) => b.r - a.r)

  // (f) Anti-domination — MMR-style greedy reranking so the top 10 isn't one hoodie
  //     ten ways. λ = 0.72 (relevance) / 0.28 (diversity).
  return mmr(scored, {
    lambda: 0.72,
    sim: (a, b) => jaccard(refsOf(a), refsOf(b))
                 + 0.5 * (a.draft.formulaId === b.draft.formulaId ? 1 : 0),
    // Hard cap regardless of λ:
    caps: { perRef: 2, perFormula: 3, perDominantHue: 4 },
  })
}
```

## 6.2 Card contents

Reuses `.fitcard` unchanged, plus the two new classes from the design audit.

| Element | Class | Content |
|---|---|---|
| Rank numeral | `.fitcard__rank` (new) | `01`–`12`, mono, ink-on-paper pill, top-left |
| Cover | `.fitcard__frame` / `.fitcard__photo` | User photo if present, else a 3-up flat-lay of the top 3 slots by area |
| Score badge | `.card__badge card__badge--good` | `{score} · {label}` — `--good` only at ≥ 80 |
| Name | `.fitcard__who` | Draft name, or auto-name (`"The Kolek formula"` / `"Tonal olive"`) |
| Meta line | `.fitcard__meta` | `{occasion} · {tempBand} · {n} pieces` |
| Worn chip | `.condchip` | `Worn 4×` or `Never worn` |
| Last worn | `.condchip` | `12d ago` — `--ink-4` when > 60d |
| Headline reason | `.reason` | `working[0]`, verbatim |
| Confidence | `.meter` | Only rendered when `confidence < 0.75`, with the label `Low confidence` |
| Locked state | `.fitcard--locked` / `.fitcard__lockover` | Pro-gated fits, existing behavior |

## 6.3 Filter list

Rendered in `.rail` with `.fgroup` / `.opt` (identical to `Discover`), or in a `.toolbar--sticky` on mobile.

1. **Occasion** — 9 values, multi-select. *Hard filter.*
2. **Temperature band** — 5 values, single-select, defaults to `styleProfile.context.tempBandF`. *Hard.*
3. **Season** — 4 values. *Soft (−12).*
4. **Worn state** — `Never worn` · `Worn once` · `Rotation (3+)` · `Retired`. *Hard.*
5. **Uses only what I own** — excludes drafts containing wishlist/catalog refs. *Hard, default on.*
6. **Formula** — the 10 `FormulaId`s. *Hard.*
7. **Style lane** — the 8 `StyleId`s. *Soft.*
8. **Volume shape** — `Coherent slim` · `Classic` · `Coherent full` · `Contrast` (derived from `|vTop − vBottom|`). *Hard.* Directly exposes PTO's taxonomy.
9. **Color** — `Tonal` · `Neutral + accent` · `High contrast`. *Hard.*
10. **Minimum score** — slider, default 0. *Hard.*
11. **Statement** — `Quiet` (0 loud) · `One hero` · `Loud`. *Hard.*
12. **Sort** — `Best for today` (the formula above) · `Highest score` · `Least worn` · `Newest`.

Zero results renders `.empty` with the single most-restrictive filter named and a one-tap clear.

---

# 7. RECOMMENDATIONS

New file **`src/lib/recommend.ts`**. Returns `Recommendation[]`, always ordered by tier, then `urgency` desc.

## 7.1 The four-tier priority

The ordering is the product's ethical spine: **never sell before you've suggested.**

**Tier 1 — OWN.** "Wear what you already have." Runs `rankFits` over saved drafts restricted to owned refs, plus `complete()` from an empty canvas over the owned pool. Emitted when a fit scoring ≥ 72 exists using only `status: 'owned'` items.
`urgency = score + 20 × (daysSinceLastWorn / 30, capped 1)`. **Always shown first, always at least one, if the wardrobe can produce anything.**

**Tier 2 — RECOMBINE.** "You've never put these two together." Finds owned pairs with `compat.n === 0` that, when completed into a full fit, score ≥ 68 **and** exceed the user's mean worn-fit score. Surfaces the specific novel pair in the copy.
`urgency = score + 15 × (1 − pairFamiliarity)`. Capped at 3.

**Tier 3 — CATEGORY GAP.** "You're missing a mid-layer." Extends the existing `CORE_SLOTS` / `ESSENTIAL` machinery (`taxonomy.ts:118-126`, `WardrobeView.tsx:43-67`) from static counts to **contextual** counts:

```ts
function targetFor(cat: Category, sp: StyleProfile): number {
  let t = CORE_SLOTS.find(s => s.category === cat)!.per
  if (sp.context.climate === 'cold'  && cat === 'outer') t += 1
  if (sp.context.climate === 'hot'   && cat === 'outer') t -= 1
  if (sp.context.climate === 'hot'   && cat === 'top')   t += 1
  if (sp.context.primaryOccasions.includes('work'))      t += (cat === 'shirt' ? 1 : 0)
  if (sp.context.primaryOccasions.includes('gameday'))   t += (cat === 'shoes' ? 1 : 0)
  // Solver-driven: every slot the completion solver failed to fill in the last 20 runs
  // adds +0.5 to its category target. This makes the gap real, not theoretical.
  t += 0.5 * solverMissRate(cat)
  return Math.round(t)
}
```
`urgency = (1 − have/want) × ESSENTIAL_WEIGHT[cat] × 100`. Presented as a gap, **not** as a product — the CTA is "see what fills this," which drops the user into tier 4 pre-filtered.

**Tier 4 — PRODUCT.** Only reached when tiers 1–3 are exhausted or the user explicitly navigates in. Candidates come from `rank(CATALOG, profile)` (existing `matchScore`, unchanged), then **re-ranked by outfits unlocked**:

```ts
unlocked(p) = count of distinct full outfits scoring ≥ 72 that become possible
              with p in the pool and were impossible without it
              (evaluated over a 200-combination sample, seeded, capped at 40ms)
productUrgency = 0.45 * matchScore + 0.35 * min(unlocked, 8)/8 * 100
               + 0.20 * gapUrgency(p.category)
```
Hard suppressions: any product whose category the user already exceeds target in by 2+; any product within ΔE < 0.06 and same subcategory as something owned (`alreadyOwnSimilar`); anything the user has dismissed twice.

## 7.2 What a product suggestion MUST explain

A `Recommendation` with `tier: 'product'` renders **only if at least 4 of these 8 fields are non-null.** Enforced in the type guard `isShowableProductReco()`, tested in §10.5.

1. **What it fixes** — the specific `RuleHit` or gap it resolves, quoting the rule's own message. *"Your only outer layer is a bomber; three of your fits want something longer."*
2. **What it pairs with** — **minimum 2 owned refs, shown as thumbnails.** If fewer than 2 exist, the reco is suppressed. This is the anti-slop guard.
3. **Outfits unlocked** — the integer from the sampler, with one of them previewable on tap.
4. **Size and confidence** — `recommendSize()` label plus its `confidence`, rendered as a `.meter`. This finally exposes the confidence value the audit found is computed and never displayed.
5. **Cost per wear at a realistic N** — `price / projectedWears`, where `projectedWears` = median wear count of the user's owned items in that category, floored at 12. Stated as *"$8/wear if you wear it like your other jackets."*
6. **Whether they already own something similar** — named explicitly if so, with the reco reframed as an upgrade or suppressed entirely.
7. **A cheaper alternative** — the lowest-price catalog item within the same subcategory + volume class + a hue cluster of the suggestion. Always shown when one exists at ≥ 25% less.
8. **Why now** — season fit, or a gap the solver hit this week, or a trend tag with its decayed confidence stated (*"trending, and that trend is 8 months old"*).

Additionally: the affiliate disclosure already in `lib/affiliate.ts` is rendered on every tier-4 card, and no tier-4 card may appear above a tier-1 card in any list, ever.

---

# 8. ONBOARDING ADDITIONS

Existing flow (`Onboarding.tsx`) is 6 steps. **Add 2 required questions and 3 optional ones. Nothing else.** Every field below either unlocks a dimension that is otherwise dead or fixes an existing bug.

| # | Field | Where | Req? | Why it earns its place |
|---|---|---|---|---|
| 1 | **Where do you wear clothes?** → `context.primaryOccasions`, 2–3 chips from the 9 occasions | New step after style picker | **Required** | D6 (occasion, weight 0.09) cannot run at all without it, and it makes gap targets contextual (§7 tier 3). Two taps. |
| 2 | **How cold does it get where you are?** → `context.climate`, 4 chips | Same step, same screen | **Required** | D7 (weather, 0.08) and warmth targets. Also fixes the audit's G10: today a user who onboards in fall gets fall-weighted results in July forever. |
| 3 | **Brands you rock with** → `profile.brands`, chips from `BRANDS` + free entry | Added to the existing interests step | Optional | `profile.brands` is read in 4 places (`match.ts:89`, `twin.ts:50`, `AvatarView.tsx:145`, `Discover.tsx:280`) and **written by no UI** (audit G23). The Style DNA "Brands picked" check is currently unachievable, hard-capping DNA at 90. Two minutes of work, closes a visible bug. |
| 4 | **Anything you won't wear?** → `context.restrictions`, chips: no hats · no shorts · no logos · no heels · nothing tight · nothing white | New, optional, on the occasion step | Optional | Prevents the single worst failure mode — confidently recommending something the user cannot wear. One screen, skippable. |
| 5 | **Add 3 things you own** → wardrobe seed, reusing the existing `OwnCloset` three-mode add | New final step, skippable with "I'll do it later" | Optional, **strongly prompted** | The entire engine is dead with an empty closet. Three items is the minimum for `complete()` to produce anything. Framed as "so we can show you a fit right now," and it immediately does — the step ends by running `complete()` and showing the result. |

**Explicitly NOT added:**
- Body measurements beyond what exists — already collected, and the estimator overwrite bug (§9, PR2) is the real problem.
- Color preferences — O'Donovan shows hue preference doesn't predict rating; it belongs in `StyleProfile.cal` learned from behavior, not asked for.
- Budget granularity — `budgetMin` is already dead (audit G24); don't add more of it.
- Gender/cut — every one of the 1672 catalog rows is `unisex` (audit G4), so the question cannot affect anything. The existing non-functional "Cut" dropdown (`Discover.tsx:296-302`) should be removed, not extended.

Placement: the two required questions go into **one new step between "Styles" and "Budget"**, adding one screen to a 6-step flow. Optional fields ride along on existing steps. The wardrobe seed becomes the new final step, replacing the current terminal screen.

---

# 9. FILE PLAN

Nine PR-sized stages, strict dependency order. Each stage is independently shippable and independently revertable. No stage exceeds ~600 lines of diff.

---

### PR 1 — Foundations: types, config, color math, tests
**New**
- `src/lib/types.ts` — `Occasion`, `SlotId`, `FitDimension`, `Severity`, `RuleHit`, `Inferred<T>`, `Provenance`, `PROV_CONF`
- `src/lib/color.ts` — `srgbToOklch`, `hexToRgb`, `deltaE`, `hueClusters`, `COLOR_WORDS`, `isNeutral`
- `src/lib/styleconfig.ts` — every numeric constant in this spec, one export per rule family, each with a `// SOURCE:` comment carrying the URL
- `src/lib/trends.ts` — the §1.13 table + `trendWeight(tag, now)`
- `vitest.config.ts`, `src/lib/__tests__/color.test.ts`
**Modified**
- `package.json` — add `vitest` (dev), `"test": "vitest run"`
**Ships nothing user-visible.** Pure additive.

---

### PR 2 — Metadata model + inference + build enrichment
**New**
- `src/lib/attrs.ts` — `GarmentMeta`, `Subcategory`, `TextureClass`, `ROUGHNESS`, all §3 rule tables, `inferMeta(product | custom)`, `visualWeight()`
- `scripts/enrich.mjs` — build-time enrichment → `src/data/attrs.gen.json`
- `src/data/attrs.ts` — typed loader with a runtime `inferMeta` fallback for missing ids
- `src/lib/__tests__/attrs.test.ts` — golden set of 40 hand-labeled catalog products
**Modified**
- `package.json` — `sharp` (dev), `"enrich": "node scripts/enrich.mjs"`, `build` chains it
- `src/lib/sizing.ts` — **bugfix**: `estimateFromBody` call sites must respect a new `measurementsEdited` flag
- `src/views/AvatarView.tsx:102-106`, `src/views/Onboarding.tsx:301-305` — stop clobbering manually-entered chest/waist on every height/weight tick
- `src/lib/store.ts` — add `Profile.measurementsEdited?: boolean`
**Visible:** nothing new; one long-standing data-loss bug fixed.

---

### PR 3 — Storage: schema v3, migration, IndexedDB photos
**New**
- `src/lib/migrate.ts` — `MIGRATIONS`, `v2_to_v3`, `runChain`, quarantine
- `src/lib/idb.ts` — minimal promise wrapper, one object store `photos`
- `src/lib/__tests__/migrate.test.ts` — the 13 preservation rules, each a case
**Modified**
- `src/lib/store.ts` — `AppState` gains `schemaVersion`, `styleProfile`, `drafts: OutfitDraft[]`, `feedback` accessor; `loadState`/`saveState` route through `migrate.ts`; `WardrobeItem` + `CustomPiece` gain their optional blocks
- `src/App.tsx` — new store actions: `setStyleProfile`, `markWorn`, `rateItem`, `updateItemMeta`, `saveDraft`, `deleteDraft`, `pushFeedback`
**Visible:** nothing. `lapel.state.v2` is left intact for rollback.
**Risk:** highest of any stage. Gate behind a `?v3=0` escape hatch for one release.

---

### PR 4 — Fit score engine (headless)
**New**
- `src/lib/fitscore.ts` — `evaluate()`, all 12 dimension scorers, `evalConfidence`, `explain`
- `src/lib/proportion.ts` — P1–P9, exported individually so each is unit-testable
- `src/lib/palette.ts` — flatten to area-weighted palette, run the O'Donovan sub-scores and gates
- `src/lib/__tests__/fitscore.test.ts` — the §4.7 calibration anchors as regression bounds
- `src/lib/__tests__/proportion.test.ts`, `palette.test.ts`
**Modified:** none.
**Visible:** nothing. Ship the engine before any UI touches it.

---

### PR 5 — Score UI: breakdown panel + product drawer confidence
**New**
- `src/components/FitScoreBreakdown.tsx`
- `src/components/ConfidenceBar.tsx`
**Modified**
- `src/styles.css` — `.fscore` / `__row` / `__label` / `__val` into the drawer section after `.meter` (~line 2605); `.meter--good` / `.meter--neg` adjacent; `.btn--danger` into the buttons section before `.btn--sm` (~line 235)
- `src/components/ProductDrawer.tsx` — render `recommendSize().confidence` on the existing `.meter` (closes audit G18)
**Visible:** the confidence bar the code has been computing and discarding since day one.

---

### PR 6 — Outfit builder
**New**
- `src/lib/outfit.ts` — `complete()`, `partialScore`, `requiredSlots`, variety constraints V1–V5
- `src/lib/formulas.ts` — the 10 `FormulaId` presets
- `src/views/OutfitBuilder.tsx`
- `src/components/OutfitCanvas.tsx`, `PieceTray.tsx`, `FitInspector.tsx`, `AlternativesRail.tsx`
- `src/lib/__tests__/outfit.test.ts`
**Modified**
- `src/styles.css` — `.canvas`, `.slot`, `.slot__label`, `.slotitem`, `.slotitem__x`, `.pick--drag` into the planner section after `.pick__tick` (~line 3014)
- `src/views/WardrobeView.tsx` — **delete** `autoMatch` (`:670-730`), `NEUTRALS`/`ACCENTS` (`:657-668`); `FitPlanner` becomes a thin list that routes into `OutfitBuilder`
- `src/App.tsx` — add the `builder` view
**Visible:** the feature. Also fixes G12 (regenerable), G13 (customs included), G14 (completeness), G15 (scored + explained).

---

### PR 7 — Item metadata editing + wear tracking
**New**
- `src/components/ItemDrawer.tsx` — reuses `.drawer` wholesale
- `src/components/WearChips.tsx`
**Modified**
- `src/styles.css` — `.spec--edit` next to `.spec` (~2560), `.text-input--pill` next to `.text-input` (~2153) (this promotes a rule set currently inlined in `ProductDrawer.tsx:792`)
- `src/views/WardrobeView.tsx` — `.ctile` gains wear/last-worn chips beside the existing condition/years chips; `itemValue` gains a cost-per-wear row
**Visible:** wear tracking, cost-per-wear, editable metadata with confidence affordances.
**Also fix here (2-line selector repairs, from the design audit):** `.tile__tick` at `styles.css:2352` and `.ctile__x` at `:3869` — both are permanently visible because a mangled selector swallowed the `[aria-pressed]` guard. New `.slotitem__x` must render conditionally in JSX (the `InterestPicker` pattern) rather than inherit the broken CSS.

---

### PR 8 — Top Fits + filters
**New**
- `src/lib/topfits.ts` — `rankFits`, `mmr`
- `src/views/TopFitsView.tsx`
- `src/components/FitFilters.tsx`
- `src/lib/__tests__/topfits.test.ts`
**Modified**
- `src/styles.css` — `.fitcard__rank` into the fits section (~2653), `.toolbar--sticky` into the toolbar section (~857)
- `src/views/FitsView.tsx` — fold `lapel.unlocks` / `lapel.react.*` / `lapel.chat.*` into `cosign.social.v1`
- `src/App.tsx` — nav entry
**Visible:** the ranked "what do I wear today" surface.

---

### PR 9 — Recommendations, feedback loop, onboarding
**New**
- `src/lib/recommend.ts` — the 4 tiers, `isShowableProductReco`
- `src/lib/feedback.ts` — `pushFeedback`, `calibrate`, `compaction`
- `src/components/RecoCard.tsx`
- `src/lib/__tests__/recommend.test.ts`, `feedback.test.ts`
**Modified**
- `src/views/Onboarding.tsx` — the new occasion/climate step, brand picker, restrictions, wardrobe seed
- `src/lib/match.ts` — replace the hardcoded `INTEREST_LANES` (`:66-76`) with a data-driven `TAG_LANES` table so user-typed tags stop silently contributing nothing (audit G3)
- `src/lib/fitmatch.ts` — `resolve()` returns `null` instead of `?? pool[0]` (audit item 11: the silent fallback propagates a wrong product into `cosigns`, `iconScores` pricing, and Discover's `provenIds`); update the 3 call sites
- `src/views/Discover.tsx` — **remove** the non-functional "Cut" dropdown (`:296-302`)
- `src/views/AvatarView.tsx` — the "Brands picked" DNA check now achievable
- `src/views/WardrobeView.tsx` — gap analysis reads contextual targets; `MoreLikeYours` uses color/style neighbors of specific owned items
**Visible:** the full loop.

---

# 10. TESTS

`vitest`, added in PR 1. All pure-function tests; no DOM, no network.

## 10.1 Scoring — calibration anchors (`fitscore.test.ts`)
Each row of the §4.7 table becomes a `it.each` case asserting `score` inside its band. These are regression bounds, not exact values — they must not be tightened.

## 10.2 Scoring — rule-level (`proportion.test.ts`, `palette.test.ts`)
| Test | Assertion |
|---|---|
| P1 gate: `(3,2)` | hit `P1` severity `reject` |
| P1 gate: `(3,3)`, `(3,1)`, `(3,0)`, `(1,1)` | **no** `P1` hit |
| P1 gate: `(1,0)`, `(2,1)`, `(0,1)` | hit `P1` |
| P1 exemption | `(1,1)` scores strictly higher than `(1,0)` |
| P2 terminator | `v=(3,3)` + `hemDrop=−4` passes; same with `hemDrop=+8`, no belt, mid rise → `reject` |
| P2 each terminator independently | cropped / waistDefined / tucked / high-rise each rescue alone |
| P3 | `hemDrop=22, LO=25` rejects; add `soleMm=45` + `waistDefined` → passes |
| P7 | `LO=24, rise='low'` rejects; `rise='high'` passes |
| P6 bounds | `stackMm` 10 → downgrade, 50 → pass, 120 → reject |
| P6 | `stack` on `vBottom=3` warns |
| F5 verbatim | `cuff=20, collar=18` → reject; `cuff=16, collar=18` → pass |
| F5 tongue | `pantOverTongue=true` → reject regardless of widths |
| F4 overlap | `soleMm=44, LO=17` reject; `LO=20` pass; `LO=25` pass; `LO=29` warn |
| P8 JND | `LO=21.0` and `LO=22.5` classify identically; `21.0` vs `23.5` do not |
| C-R2 | 5 hue clusters → reject; 2 → max sub-score; 1 → 0.75; 0 → 0.80 |
| C-R3/R4 | gradient palette beats barbell palette at identical range |
| C-R5 | removing the single highest-chroma item before parity is checked (accent exemption) |
| C-R8 | `ΔH=22, ΔC=0.02, both C≥0.10` → gate ×0.90; `ΔH=8` → no gate; `ΔH=50` → no gate |
| **Template ban** | a fit at exact complementary (`ΔH=180`) scores **no higher** than one at `ΔH=140`, all else equal — guards against someone re-adding the refuted bonus |
| R10 | tonal + 1 texture → texture sub-score ≤ 25; tonal + 3 textures → ≥ 80 |
| R11 | worsted (0) adjacent to shearling (4) → ×0.75; worsted adjacent to denim (2) → no penalty |
| L1 | 4 torso layers → reject; 3 → pass |
| L2 | gsm `[400, 200, 300]` outward → warn |
| S4 | two items with `graphicArea > 0.10` → reject |

## 10.3 Adaptive weights & variety (`feedback.test.ts`, `outfit.test.ts`)
- 10 positive signals on `C=0.24` fits raises `chromaCeiling` above 0.20 and the same fit re-scores ≥ 8 points higher.
- `chromaCeiling` never exceeds 0.30 regardless of signal count.
- **P1, F5, R2, P8 are unchanged by any amount of calibration** — assert byte-identical thresholds after 200 signals.
- Weight drift over one simulated week never exceeds ±10%.
- `complete()` with the same seed twice → identical `refs`. With `seed+1` → at least one differing unlocked slot.
- `complete()` with 3 locked slots → those 3 refs unchanged in the output.
- V2: two same-brand items only co-occur when both are `coordinate-set` with matching dominant color.
- V5: top-6 alternatives contain ≥ 3 distinct dominant hue clusters when the pool supports it.
- `rankFits` anti-domination: given 20 drafts sharing one hoodie, the top 10 contains it at most twice.
- Recency: a fit worn today ranks below an equal-scoring fit worn 30 days ago.

## 10.4 Migration (`migrate.test.ts`)
One test per numbered rule in §2.6, plus:
- Fixture: a realistic `lapel.state.v2` blob with photo, pose, 12 wardrobe items, 3 customs, 4 outfits with mixed refs, an account, a deleted Wishlist. Round-trip → assert deep equality on every preserved field.
- `measurementsEdited` is `true` for every migrated profile and `false` for `DEFAULT_STATE`.
- After migration, a height change does **not** alter `chest`.
- Malformed JSON → `lapel.state.v2.bak` contains the exact original string, and `lapel.state.v2` is untouched.
- `QuotaExceededError` on the v3 write → photos are in IDB, no field is silently dropped, a toast fires.
- `outfits[].refs` containing an id present in **both** `customs` and `CATALOG` resolves to the custom (matching `refImage` precedence).
- A `wardrobe` item whose `productId` is absent from `CATALOG` survives with a populated `snapshot` and renders.
- `saved` order preserved exactly (not sorted).
- Deleted Wishlist (`collections: []`) stays deleted.
- Running the migration twice is idempotent.
- `lapel.state.v2` still parses after migration (rollback path intact).

## 10.5 Recommendations (`recommend.test.ts`)
- A tier-4 reco with only 3 filled `explain` fields is filtered out by `isShowableProductReco`.
- A tier-4 reco with fewer than 2 `pairsWith` refs is suppressed.
- No tier-4 item is ordered above any tier-1 item.
- A product whose category already exceeds target by 2 is suppressed.
- `alreadyOwnSimilar` fires for a same-subcategory item within ΔE < 0.06.
- Dismissing a reco twice suppresses it permanently.

## 10.6 Edge cases
| Case | Required behavior |
|---|---|
| **Empty wardrobe** | `complete()` returns a draft with all slots `null` and a `gapHint` for each required slot. `evaluate()` returns `score: 0`, `confidence: 0`, `label: 'Cooked'`, `improve[0]` = "Add a few pieces so we can build something." **No throw, no NaN.** |
| **One item** | `complete()` places it and returns partial. `evaluate()` runs D1/D5/D10 only; `confidence ≤ 0.35`; no `reject` hit is shown (confidence downgrade). |
| **Two items, no bottom** | `requiredSlots` unmet → partial draft, `gapHint: ['pants']`, score computed on what exists but flagged incomplete. |
| **All metadata `src: 'default'`** | Every `reject` downgrades to `warn`; `confidence < 0.5`; the UI shows the "we're guessing" banner. |
| **Missing colors entirely** | D3 returns the neutral base 70 with `hits: []` and contributes its weight without distorting the mean (weight is redistributed, not zeroed). |
| **`legOpeningCm === null`** (a shorts fit) | P7, F4, P3 skip silently; no hit, no penalty. |
| **Item in wardrobe whose product vanished from catalog** | Resolves through `snapshot`; `meta` falls back to runtime `inferMeta` over the snapshot's name/category; nothing throws. |
| **Duplicate refs across slots** | Deduped by the solver; `evaluate` counts area once. |
| **NaN / Infinity in any measurement** | `clamp` guards on every arithmetic path; a fuzz test feeds `NaN`, `±Infinity`, `-1`, `1e9` into every `GarmentMeta` numeric field and asserts `Number.isFinite(score)` and `0 ≤ score ≤ 100`. |
| **10,000 wardrobe items** | `complete()` under 300 ms (candidate pools are capped at 24 per slot). |
| **`prefers-reduced-motion`** | The builder's JS-driven sequential fill checks `matchMedia` and places instantly. The global CSS kill-switch at `styles.css:5616` does not cover JS motion. |

---

# 11. OPEN QUESTIONS

Four. Each has a default that lets implementation start today.

**Q1. Do we ship build-time image color extraction, or title-only?**
Image extraction needs `sharp`, ~1672 network fetches at build, and a ~90 s build step. Title-only is instant but leaves colors at `c: 0.65` and blind to multi-color garments — which materially weakens D3 (weight 0.16, the second-heaviest dimension).
**Default: ship image extraction in PR 2, with a `--no-images` flag that degrades to titles and a committed `attrs.gen.json` so contributors never need to run it.** If the build cost proves painful, flip the default; the code path already exists.

**Q2. Is `mixBias` seeded from the style picker, or left neutral?**
PTO says fuller-top-over-slimmer-bottom is the easier mix; every current streetwear source says the opposite. Highsnobiety's own 2026 reporting that ultra-baggy has already "reversed-course" suggests PTO's version may outlast. Seeding from `profile.styles` (`street`/`skate` → −0.4, `ivy`/`minimal` → +0.4) makes cold-start feel personal but bakes in a guess.
**Default: seed at 0 (neutral) and let feedback move it.** The term is only worth ±6 points; being wrong for two weeks costs less than being confidently wrong forever.

**Q3. Do stack / rise / hem-treatment become user-editable per outfit, or stay inferred?**
Rules P2, P6, P7, F5 all read `draft.detail`, which is inferred at `c ≈ 0.4`. Inferred-only means those rules almost always downgrade to `warn` (§4.6) and their sourced precision is wasted — including F5, the one verbatim-quoted numeric rule in the corpus. Asking adds friction to every build.
**Default: infer, and surface a single collapsed "Fit details" row on the canvas with 4 controls (waist defined · tucked · hem treatment · stack).** Untouched, it stays inferred and rules stay soft. Touched once, it becomes `user` provenance and the hard rules activate. The user opts into precision.

**Q4. Where does weather actually come from?**
No backend and no API means no forecast. A manual band picker is honest but will go stale; a season-derived default is invisible but often wrong (the audit's G10 — a fall onboarder gets fall results in July).
**Default: derive the band from `context.climate` + today's date via a static Northern-Hemisphere table, show it as an editable chip in the builder toolbar, and make a manual override sticky for 12 hours.** No network, no lying about precision. Wire a real API only when a backend exists (§12).

---

# 12. LIMITATIONS

Stated plainly. None of these are bugs; they are consequences of the architecture, and the UI should not pretend otherwise.

**Without a backend:**
- **No real weather.** Temperature bands are user-set or date-derived. There is no forecast, no location, no rain. Rule L7 (shell must be longest when wet) only fires if the user tells us it's wet.
- **No cross-device sync.** Everything is one browser's localStorage plus IndexedDB. Clearing site data destroys the closet, the body scan, and every wear record. There is no backup and no export in v1 — **add a JSON export button in PR 7; it is the only recovery path that exists.**
- **No brand size charts.** `recommendSize` runs one global `alphaIndexFromChest` table across all 1672 products and every brand. Per-brand charts require scraping and hosting size data. Until then, D10 is the weakest dimension and its weight (0.04) reflects that.
- **No community signal.** No "people with your build sized up," no aggregate outfit ratings, no popularity. Every learned parameter comes from one user's own behavior, which means calibration needs ~25 signals before it does anything useful.
- **No price tracking, no stock.** Catalog prices are a build-time snapshot. A recommendation may point at something sold out or on sale, and we cannot know.
- **Product ids are unstable.** They are slugs regenerated by `scripts/curate.mjs` from brand + title. The `snapshot` field keeps orphaned wardrobe items visible, but their catalog metadata freezes at the moment they were added.

**Without model calls:**
- **Color extraction is naive.** k-means over a 96×96 downsample with corner-based background removal. It will fail on lifestyle photography, layered flat-lays, and anything shot on a colored ground. Zhang et al. get their results with proper background removal; we approximate it. Confidence is set accordingly (0.75–0.80) and the UI lets the user correct it.
- **No garment segmentation.** We cannot tell a jacket's lining from its shell, or find a graphic's actual bounding box. `graphicArea` is a title-driven guess capped at `c: 0.5`, and `pattern.scale` is a lightness-variance proxy.
- **No fit assessment from photos.** `profile.pose` (TensorFlow MoveNet) gives four body pins and is used only to place avatar graphics. We cannot tell whether a garment actually drapes correctly on this person — which is precisely what Courtney Mays names as the #1 thing that matters.
- **No natural-language input.** "Something for a wedding in Austin in August" cannot be parsed. Occasion and temperature are pickers.
- **Explanations are templated.** Every message in `working` / `improve` is a fixed string with slot names interpolated. They are specific and sourced, but they are not written fresh for each outfit, and a user who builds fifty fits will see repetition.
- **Novel garments defeat the taxonomy.** A skirt, a kilt, a cape, a two-piece set worn split — the `SlotId` model has no place for them, and `Subcategory` will fall through to `'other'`. The engine degrades to low confidence rather than failing, but it will not have anything useful to say.

**Inherent to the rule set:**
- **The rules encode taste, and taste is contested.** Two of the strongest sources disagree in the corpus and we ship the overlap rather than a resolution: Highsnobiety says chunky sneakers need wide-leg while Complex says straight-leg (F4 encodes 19–27 cm, neither endpoint); Put This On says fuller-top/slimmer-bottom is the easier mix while all current streetwear coverage says the opposite (`mixBias`, default 0).
- **Several thresholds are ours, not the sources'.** Every number tagged 🔧 in the research — most of P2, P3, P6, P7, the entire F4 mm ladder — is an operationalization of a qualitative claim. **The sole-height cutoffs in F4 are the weakest link in the entire system: no publication in the corpus gives a sole-height number for "chunky."** They live in `styleconfig.ts` for exactly that reason. The honest next step is measuring stack heights from manufacturer spec sheets.
- **Permanent Style could not be fetched** (HTTP 403). Every PS-derived figure — rise definitions, the 2 cm JND, the 21.5/23/25 cm hem ladder, the black-accent list — comes from search excerpts and ships flagged. One PS excerpt is internally contradictory and is not encoded at all.
- **Trends decay on a schedule we guessed.** The 18-month linear decay in RULE T1 is a convention, not a measurement. Volume targets in particular will drift: two independent 2026 sources report the direction of travel is *away* from maximum volume. If nobody edits `trends.ts`, the engine will be quietly wrong about silhouette within two seasons.
- **The over-styling meta-rule cannot be automated.** McLeod's test — "it doesn't look like something natural, something that's them" — is the one rule that overrides all the others, and no deterministic function can evaluate it. The UI's honest answer is the `adventurous` slot and the explicit "remove one element" prompt when a fit scores above 85 with three or more anchors. Everything else is the engine admitting what it doesn't know.
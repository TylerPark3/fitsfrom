import type { Profile } from '../store'
import type {
  DimensionScore,
  FeedbackSignal,
  FitDimension,
  FitEvaluation,
  Occasion,
  StyleProfileV3,
  VisualWeight,
  WardrobeItemV3,
  Weather,
} from './types'

/** Baseline weights; adapt() reshapes them from the user's own signals. */
const BASE: Record<FitDimension, number> = {
  taste: 16,
  proportion: 14,
  color: 13,
  layering: 9,
  texture: 7,
  occasion: 9,
  weather: 8,
  footwear: 8,
  statement: 7,
  comfort: 4,
  novelty: 3,
  feedback: 2,
}

const WEIGHT_N: Record<VisualWeight, number> = { light: 0, medium: 0.5, heavy: 1 }

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** Circular hue distance, 0–180. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// ---------------------------------------------------------------- dimensions

function scoreProportion(items: WardrobeItemV3[]): [number, string] {
  const top = items.find((i) => ['top', 'shirt', 'knit'].includes(i.category))
  const bottom = items.find((i) => i.category === 'pants')
  if (!top || !bottom) return [70, 'Needs a top and a bottom to judge proportion.']

  const loose = new Set(['relaxed', 'baggy'])
  const topLoose = loose.has(top.meta.silhouette.value)
  const botLoose = loose.has(bottom.meta.silhouette.value)
  const topLong = top.meta.length.value > 0.55

  // Volume on both halves reads shapeless unless the top is cropped/short enough
  // to keep a visible waist break.
  if (topLoose && botLoose && topLong) {
    return [46, 'Volume on both halves with a long top — the waist disappears.']
  }
  if (topLoose && botLoose) {
    return [78, 'Oversized on oversized, saved by the top ending above the hip.']
  }
  if (!topLoose && !botLoose && top.meta.silhouette.value === 'slim' && bottom.meta.silhouette.value === 'slim') {
    return [64, 'Slim on slim — clean, but no contrast in the silhouette.']
  }
  return [88, 'One half fitted, one half relaxed — the proportion reads.']
}

function scoreColor(items: WardrobeItemV3[], sp: StyleProfileV3): [number, string] {
  const cols = items.flatMap((i) => i.meta.colors.filter((c) => c.role !== 'accent'))
  if (!cols.length) return [70, 'Not enough colour data yet.']
  const accents = cols.filter((c) => !c.neutral)
  const neutrals = cols.length - accents.length

  let s = 72
  let note = ''
  if (accents.length === 0) {
    s = 84
    note = 'All-neutral palette — always safe.'
  } else if (accents.length === 1) {
    s = 92
    note = 'Neutral base with one accent doing the talking.'
  } else if (accents.length === 2) {
    const gap = hueGap(accents[0].h, accents[1].h)
    if (gap < 32) { s = 86; note = 'Two accents sitting close on the wheel — reads intentional.' }
    else if (gap > 145) { s = 82; note = 'Two accents opposite each other — bold but balanced.' }
    else { s = 58; note = 'Two accents clash rather than relate.' }
  } else {
    s = sp.loudness > 0.6 ? 74 : 48
    note = sp.loudness > 0.6 ? 'Three-plus accents — loud, which is your lane.' : 'Three-plus accents compete.'
  }
  // Value contrast keeps a fit from going flat.
  const ls = cols.map((c) => c.l)
  const spread = Math.max(...ls) - Math.min(...ls)
  if (spread < 0.15) { s -= 8; note += ' Everything sits at one lightness — it flattens.' }
  if (neutrals >= 2 && accents.length <= 1) s += 4
  return [clamp(s), note.trim()]
}

function scoreLayering(items: WardrobeItemV3[]): [number, string] {
  const layers = items.filter((i) => ['top', 'shirt', 'knit', 'outer'].includes(i.category))
  if (layers.length <= 1) return [76, 'Single layer — nothing to conflict.']
  const lens = layers.map((l) => l.meta.length.value).sort((a, b) => a - b)
  const stepped = lens.every((v, i) => i === 0 || v - lens[i - 1] > 0.04)
  const outer = layers.find((l) => l.category === 'outer')
  const under = layers.filter((l) => l.category !== 'outer')
  if (outer && under.some((u) => u.meta.length.value > outer.meta.length.value)) {
    return [52, 'An under-layer runs longer than the jacket — the line breaks.']
  }
  return stepped ? [90, 'Each layer steps longer than the one beneath it.'] : [70, 'Layer lengths sit too close to read as deliberate.']
}

function scoreTexture(items: WardrobeItemV3[]): [number, string] {
  const mats = items.map((i) => (i.meta.material || '').toLowerCase()).filter(Boolean)
  if (mats.length < 2) return [74, 'Not enough material data to judge texture.']
  const uniq = new Set(mats.map((m) => m.split(/[\s,/]/)[0]))
  if (uniq.size === 1) return [66, 'One material throughout — safe but flat.']
  return [88, `${uniq.size} textures in play — the fit has depth.`]
}

function scoreFootwear(items: WardrobeItemV3[]): [number, string] {
  const shoe = items.find((i) => i.category === 'shoes')
  if (!shoe) return [60, 'No shoe chosen yet — footwear sets the whole direction.']
  const upper = items.filter((i) => ['top', 'shirt', 'knit', 'outer'].includes(i.category))
  const upperW = avg(upper.map((u) => WEIGHT_N[u.meta.weight.value]))
  const shoeW = WEIGHT_N[shoe.meta.weight.value]
  const gap = shoeW - upperW
  if (gap > 0.6) return [62, 'The shoe carries more visual weight than everything above it.']
  if (gap < -0.6) return [70, 'Heavy up top, light on the foot — the fit floats.']
  return [90, 'Shoe weight matches the upper half.']
}

function scoreStatement(items: WardrobeItemV3[], sp: StyleProfileV3): [number, string] {
  const loud = items.filter((i) => i.meta.graphic.value >= 3).length
  if (loud === 0) return [sp.loudness > 0.6 ? 66 : 84, loud === 0 && sp.loudness > 0.6 ? 'No statement piece — quieter than your usual.' : 'Clean, no competing graphics.']
  if (loud === 1) return [94, 'One statement piece, everything else supporting it.']
  const tolerant = sp.loudness > 0.65
  return [tolerant ? 76 : 52, tolerant ? `${loud} statement pieces — loud on purpose.` : `${loud} graphics compete for the eye.`]
}

function scoreTaste(items: WardrobeItemV3[], profile: Profile): [number, string] {
  if (!profile.styles.length) return [72, 'Pick your styles to sharpen this.']
  const tags = items.flatMap((i) => i.meta.styleTags)
  if (!tags.length) return [70, 'These pieces have no style tags yet.']
  const hits = tags.filter((t) => profile.styles.includes(t)).length
  const ratio = hits / tags.length
  return [clamp(46 + ratio * 52), ratio > 0.6 ? 'Squarely in your lane.' : ratio > 0.25 ? 'Partly your lane.' : 'Outside your usual lane.']
}

function scoreOccasion(items: WardrobeItemV3[], occasion?: Occasion): [number, string] {
  if (!occasion) return [78, 'No occasion set.']
  const target: Record<Occasion, number> = {
    school: 2, casual: 2, date: 3, party: 3, concert: 2, gameday: 2, travel: 2, formal: 4.5,
  }
  const f = avg(items.map((i) => i.meta.formality.value))
  const gap = Math.abs(f - target[occasion])
  return [clamp(100 - gap * 26), gap < 0.6 ? `Reads right for ${occasion}.` : `Formality is off for ${occasion}.`]
}

function scoreWeather(items: WardrobeItemV3[], weather?: Weather): [number, string] {
  if (!weather) return [78, 'No weather set.']
  const target: Record<Weather, number> = {
    hot: 0.12, warm: 0.28, mild: 0.45, cold: 0.72, freezing: 0.9, rain: 0.6,
  }
  const w = avg(items.map((i) => i.meta.warmth.value))
  const gap = Math.abs(w - target[weather])
  return [clamp(100 - gap * 150), gap < 0.15 ? `Dressed for ${weather}.` : w < target[weather] ? `Too light for ${weather}.` : `Too warm for ${weather}.`]
}

function scoreComfort(items: WardrobeItemV3[]): [number, string] {
  const sized = items.filter((i) => i.size)
  const ratio = items.length ? sized.length / items.length : 0
  return [clamp(58 + ratio * 40), ratio === 1 ? 'Every piece has a size on file.' : 'Some pieces have no size recorded.']
}

function scoreNovelty(items: WardrobeItemV3[]): [number, string] {
  const worn = avg(items.map((i) => i.wearCount))
  if (worn === 0) return [95, 'Nothing here is overworn.']
  return [clamp(100 - worn * 7), worn > 6 ? 'These pieces are in heavy rotation.' : 'Reasonably fresh combination.']
}

function scoreFeedback(items: WardrobeItemV3[], signals: FeedbackSignal[]): [number, string] {
  const ids = new Set(items.map((i) => i.id))
  const rel = signals.filter((s) => s.itemIds.some((id) => ids.has(id)))
  if (!rel.length) return [78, 'No feedback on these pieces yet.']
  const pos = rel.filter((s) => s.kind === 'wear' || s.kind === 'save').length
  const neg = rel.length - pos
  return [clamp(78 + pos * 8 - neg * 12), neg > pos ? 'You have pushed back on pieces like these.' : 'You have worn or saved these before.']
}

// ---------------------------------------------------------------- adaptation

/** Weights shift toward what the user actually reacts to. */
export function adapt(sp: StyleProfileV3, signals: FeedbackSignal[]): Record<FitDimension, number> {
  const w = { ...BASE, ...sp.weights } as Record<FitDimension, number>
  const count = (k: FeedbackSignal['kind']) => signals.filter((s) => s.kind === k).length

  // Someone who never complains about loudness shouldn't be graded on it.
  const loudComplaints = count('too-loud')
  const basicComplaints = count('too-basic')
  if (loudComplaints === 0 && basicComplaints > 0) {
    w.statement *= 0.45
    w.color *= 0.7
  }
  if (loudComplaints > basicComplaints + 1) {
    w.statement *= 1.5
    w.color *= 1.25
  }
  if (count('wrong-silhouette') > 0) w.proportion *= 1.4
  if (count('wrong-color') > 0) w.color *= 1.4
  if (count('uncomfortable') > 0) w.comfort *= 2
  if (count('wrong-occasion') > 0) w.occasion *= 1.5
  if (count('worn-recently') > 0) w.novelty *= 2
  if (sp.loudness > 0.65) w.statement *= 0.6
  return w
}

// ---------------------------------------------------------------- evaluation

export interface EvalContext {
  profile: Profile
  styleProfile: StyleProfileV3
  signals: FeedbackSignal[]
  occasion?: Occasion
  weather?: Weather
}

export function evaluateFit(items: WardrobeItemV3[], ctx: EvalContext): FitEvaluation {
  const sp = ctx.styleProfile
  const w = adapt(sp, ctx.signals)

  const raw: [FitDimension, [number, string]][] = [
    ['taste', scoreTaste(items, ctx.profile)],
    ['proportion', scoreProportion(items)],
    ['color', scoreColor(items, sp)],
    ['layering', scoreLayering(items)],
    ['texture', scoreTexture(items)],
    ['occasion', scoreOccasion(items, ctx.occasion)],
    ['weather', scoreWeather(items, ctx.weather)],
    ['footwear', scoreFootwear(items)],
    ['statement', scoreStatement(items, sp)],
    ['comfort', scoreComfort(items)],
    ['novelty', scoreNovelty(items)],
    ['feedback', scoreFeedback(items, ctx.signals)],
  ]

  const dimensions: DimensionScore[] = raw.map(([dimension, [score, note]]) => ({
    dimension,
    score: Math.round(score),
    weight: w[dimension],
    note,
  }))

  const totalW = dimensions.reduce((n, d) => n + d.weight, 0)
  const score = Math.round(dimensions.reduce((n, d) => n + d.score * d.weight, 0) / (totalW || 1))

  // Confidence tracks how much of the metadata was actually known vs guessed.
  const confs = items.flatMap((i) => [
    i.meta.silhouette.confidence,
    i.meta.graphic.confidence,
    i.meta.length.confidence,
    i.meta.weight.confidence,
    i.meta.warmth.confidence,
    i.meta.formality.confidence,
  ])
  const confidence = Math.round(avg(confs) * 100) / 100

  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const missing: string[] = []
  if (!items.some((i) => i.category === 'shoes')) missing.push('No shoes in this fit')
  if (!items.some((i) => i.meta.material)) missing.push('Material unknown on every piece')
  if (confidence < 0.6) missing.push('Most metadata is inferred, not confirmed')

  return {
    score,
    confidence,
    dimensions,
    working: sorted.slice(0, 2).filter((d) => d.score >= 75).map((d) => d.note),
    improve: sorted.slice(-2).filter((d) => d.score < 72).map((d) => d.note),
    missing,
  }
}

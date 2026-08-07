import type { Product } from '../../data/catalog'
import type { Category, Season, StyleId } from '../../data/taxonomy'
import type {
  ColorInfo,
  Formality,
  GraphicIntensity,
  Inferred,
  ItemMeta,
  Silhouette,
  VisualWeight,
} from './types'

const mark = <T,>(value: T, confidence: number, source: Inferred<T>['source'] = 'heuristic'): Inferred<T> => ({
  value,
  confidence,
  source,
})

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const n = parseInt(full || '888888', 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  let h = 0
  let s = 0
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (mx === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h, s, l }
}

/** Neutral = low saturation, or very dark/light regardless of hue. */
export function isNeutral(s: number, l: number): boolean {
  return s < 0.18 || l < 0.14 || l > 0.9
}

const COLOR_WORDS: [string, string][] = [
  ['black', '#111111'], ['white', '#f4f2ed'], ['cream', '#efe7d6'], ['ivory', '#f2ece0'],
  ['ecru', '#e8dfcc'], ['bone', '#e9e2d4'], ['natural', '#e6dcc7'], ['sand', '#d9c9a8'],
  ['tan', '#c9a87c'], ['khaki', '#b9a276'], ['beige', '#d6c7ab'], ['stone', '#cbc3b4'],
  ['grey', '#8d8f8c'], ['gray', '#8d8f8c'], ['charcoal', '#3b3f3d'], ['silver', '#c6c9c6'],
  ['navy', '#1f2a44'], ['blue', '#2f5db0'], ['cobalt', '#2a4bd8'], ['royal', '#2340b8'],
  ['sky', '#8fbde0'], ['teal', '#1f7a72'], ['green', '#2f6a3f'], ['olive', '#5d6142'],
  ['forest', '#22412c'], ['sage', '#9aa88c'], ['lime', '#a8c832'],
  ['red', '#a8241f'], ['burgundy', '#5c1b22'], ['maroon', '#5d1f24'], ['crimson', '#9c1b2c'],
  ['wine', '#5a1f2a'], ['orange', '#c2611f'], ['rust', '#9c4a24'], ['clay', '#a9613f'],
  ['yellow', '#d8b52a'], ['mustard', '#c39a1e'], ['gold', '#bb9634'],
  ['purple', '#4f3a70'], ['lilac', '#b3a3cc'], ['lavender', '#b7aad4'], ['orchid', '#8d5f9c'],
  ['pink', '#d98aa0'], ['rose', '#c97e88'], ['salmon', '#d98a72'],
  ['brown', '#5f4630'], ['chocolate', '#4a3223'], ['coffee', '#4d3928'], ['camel', '#b28d5d'],
  ['indigo', '#2a3a5c'], ['denim', '#40618f'], ['camo', '#5f6347'], ['multi', '#8d8f8c'],
]

/** Colors from the product name; falls back to the catalog's own colour field. */
export function inferColors(name: string, fallbackHex?: string): ColorInfo[] {
  const lower = name.toLowerCase()
  const hits: string[] = []
  for (const [word, hex] of COLOR_WORDS) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && !hits.includes(hex)) hits.push(hex)
    if (hits.length === 3) break
  }
  if (hits.length === 0 && fallbackHex) hits.push(fallbackHex)
  if (hits.length === 0) hits.push('#8d8f8c')
  return hits.map((hex, i) => {
    const { h, s, l } = hexToHsl(hex)
    return {
      hex,
      role: (i === 0 ? 'primary' : i === 1 ? 'secondary' : 'accent') as ColorInfo['role'],
      h,
      s,
      l,
      neutral: isNeutral(s, l),
    }
  })
}

const GRAPHIC_LOUD = /graphic|print|logo|embroider|arch|flame|astronaut|all.?over|paisley|tie.?dye|camo|paint|splatter|jersey|varsity/i
const GRAPHIC_MILD = /stripe|check|plaid|patch|script|emblem|panel|colou?r.?block/i

export function inferGraphic(name: string): Inferred<GraphicIntensity> {
  if (GRAPHIC_LOUD.test(name)) return mark<GraphicIntensity>(3, 0.72)
  if (GRAPHIC_MILD.test(name)) return mark<GraphicIntensity>(2, 0.66)
  if (/plain|blank|essential|basic|solid/i.test(name)) return mark<GraphicIntensity>(0, 0.7)
  return mark<GraphicIntensity>(1, 0.45)
}

const SIL_RULES: [RegExp, Silhouette, number][] = [
  [/\bcrop(ped)?\b/i, 'cropped', 0.85],
  [/\blongline\b|\bduster\b|\btrench\b|\bovercoat\b/i, 'longline', 0.85],
  [/\bbaggy\b|\bwide\b|\bparachute\b|\bloose\b|\bballoon\b/i, 'baggy', 0.82],
  [/\brelaxed\b|\beasy\b|\bboxy\b|\boversiz/i, 'relaxed', 0.78],
  [/\bslim\b|\bskinny\b|\btapered\b|\btrim\b/i, 'slim', 0.8],
  [/\bstraight\b|\bregular\b|\bclassic\b|\bstandard\b/i, 'straight', 0.72],
]

export function inferSilhouette(name: string, category: Category): Inferred<Silhouette> {
  for (const [re, sil, conf] of SIL_RULES) if (re.test(name)) return mark(sil, conf)
  if (category === 'outer') return mark<Silhouette>('relaxed', 0.4)
  return mark<Silhouette>('straight', 0.35)
}

/** 0 = cropped, 1 = full-length coat. */
export function inferLength(name: string, category: Category, sil: Silhouette): Inferred<number> {
  if (/\bshort(s)?\b/i.test(name)) return mark(0.25, 0.8)
  if (sil === 'cropped') return mark(0.28, 0.75)
  if (sil === 'longline') return mark(0.85, 0.75)
  if (/\btrench\b|\bovercoat\b|\bparka\b/i.test(name)) return mark(0.9, 0.8)
  const base: Partial<Record<Category, number>> = {
    top: 0.45, shirt: 0.5, knit: 0.48, outer: 0.6, pants: 0.75, shoes: 0.05, accessory: 0.2,
  }
  return mark(base[category] ?? 0.5, 0.4)
}

const HEAVY = /puffer|down|parka|shearling|leather|denim jacket|varsity|boot|chunky|cargo|carpenter|work/i
const LIGHT = /tee|t-shirt|tank|mesh|nylon|silk|linen|poplin|sock|cap|chain/i

export function inferWeight(name: string, category: Category): Inferred<VisualWeight> {
  if (HEAVY.test(name)) return mark<VisualWeight>('heavy', 0.7)
  if (LIGHT.test(name)) return mark<VisualWeight>('light', 0.68)
  if (category === 'outer' || category === 'shoes') return mark<VisualWeight>('heavy', 0.5)
  return mark<VisualWeight>('medium', 0.45)
}

/** 0 = summer only, 1 = deep winter. */
export function inferWarmth(name: string, category: Category, seasons: Season[]): Inferred<number> {
  if (/puffer|down|parka|shearling|wool|fleece|thermal|sherpa|padded/i.test(name)) return mark(0.9, 0.75)
  if (/mesh|tank|linen|short|swim/i.test(name)) return mark(0.12, 0.75)
  const w = seasons.includes('winter') ? 0.75 : seasons.includes('fall') ? 0.55 : seasons.includes('spring') ? 0.4 : 0.22
  const conf = seasons.length ? 0.55 : 0.3
  return mark(category === 'outer' ? Math.max(w, 0.6) : w, conf)
}

export function inferFormality(name: string, category: Category): Inferred<Formality> {
  if (/suit|blazer|oxford|dress shirt|loafer|derby|trouser|pleated/i.test(name)) return mark<Formality>(4, 0.7)
  if (/mesh short|sweatpant|hoodie|jersey|track|sneaker|tee/i.test(name)) return mark<Formality>(1, 0.72)
  const base: Partial<Record<Category, Formality>> = {
    top: 2, shirt: 3, knit: 3, outer: 3, pants: 2, shoes: 2, accessory: 2,
  }
  return mark<Formality>(base[category] ?? 2, 0.4)
}

/** Full metadata for a catalog product — every field marked with its source. */
export function metaFromProduct(p: Product): ItemMeta {
  const sil = inferSilhouette(p.name, p.category)
  return {
    colors: inferColors(p.name, (p as unknown as { color?: string }).color),
    graphic: inferGraphic(p.name),
    material: p.fabric || undefined,
    silhouette: sil,
    length: inferLength(p.name, p.category, sil.value),
    weight: inferWeight(p.name, p.category),
    warmth: inferWarmth(p.name, p.category, p.seasons),
    seasons: p.seasons,
    formality: inferFormality(p.name, p.category),
    styleTags: p.styles as StyleId[],
  }
}

/** Metadata for a user-added piece where all we have is a name and a category. */
export function metaFromText(name: string, category: Category): ItemMeta {
  const sil = inferSilhouette(name, category)
  return {
    colors: inferColors(name),
    graphic: inferGraphic(name),
    silhouette: sil,
    length: inferLength(name, category, sil.value),
    weight: inferWeight(name, category),
    warmth: inferWarmth(name, category, []),
    seasons: [],
    formality: inferFormality(name, category),
    styleTags: [],
  }
}

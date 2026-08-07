import { CATALOG, type Product } from '../data/catalog'
import type { Category, StyleId } from '../data/taxonomy'

/**
 * What you like, learned per category rather than globally.
 * Grey wide-leg Noah pants tell us nothing about which hoodie you want —
 * so every category keeps its own colour / brand / price / style profile.
 */
export interface CategoryTaste {
  brands: Record<string, number>
  colors: Record<string, number>
  styles: Partial<Record<StyleId, number>>
  /** Median price of what you actually save in this category. */
  priceMid: number
  n: number
}

export type LearnedTaste = Partial<Record<Category, CategoryTaste>>

const COLOR_RE: [string, RegExp][] = [
  ['black', /black|onyx|noir|jet/i],
  ['white', /white|ivory|optic/i],
  ['cream', /cream|ecru|natural|oat|bone|sand/i],
  ['grey', /grey|gray|charcoal|heather|slate|silver/i],
  ['navy', /navy|indigo/i],
  ['blue', /\bblue\b|cobalt|royal|denim/i],
  ['green', /green|olive|forest|sage/i],
  ['brown', /brown|tan|khaki|camel|chocolate|coffee/i],
  ['red', /red|burgundy|maroon|crimson|wine/i],
  ['orange', /orange|rust|clay/i],
  ['purple', /purple|lilac|lavender|orchid/i],
  ['pink', /pink|rose|salmon/i],
  ['yellow', /yellow|mustard|gold/i],
]

export function colorOf(p: Product): string | null {
  const hay = `${p.name} ${p.fabric ?? ''}`
  return COLOR_RE.find(([, re]) => re.test(hay))?.[0] ?? null
}

const bump = (m: Record<string, number>, k: string, by = 1) => {
  m[k] = (m[k] ?? 0) + by
}

/**
 * Builds the per-category profile from saved pieces and owned pieces.
 * Saves count double — actively choosing something says more than owning it.
 */
export function learnTaste(savedIds: string[], ownedIds: string[]): LearnedTaste {
  const out: LearnedTaste = {}
  const add = (p: Product, weight: number) => {
    const t = (out[p.category] ??= { brands: {}, colors: {}, styles: {}, priceMid: 0, n: 0 })
    bump(t.brands, p.brand, weight)
    const c = colorOf(p)
    if (c) bump(t.colors, c, weight)
    for (const st of p.styles) t.styles[st] = (t.styles[st] ?? 0) + weight
    t.priceMid += p.price * weight
    t.n += weight
  }

  for (const id of savedIds) {
    const p = CATALOG.find((x) => x.id === id)
    if (p) add(p, 2)
  }
  for (const id of ownedIds) {
    const p = CATALOG.find((x) => x.id === id)
    if (p) add(p, 1)
  }
  for (const t of Object.values(out)) if (t && t.n) t.priceMid /= t.n
  return out
}

/**
 * How well a product matches what you've shown you like *in its own category*.
 * Returns 0 when there isn't enough signal yet — the caller then ignores it
 * rather than inventing a preference from one save.
 */
export function learnedBoost(
  product: Product,
  learned: LearnedTaste,
): { points: number; reason?: string } {
  const t = learned[product.category]
  if (!t || t.n < 2) return { points: 0 }

  let points = 0
  let reason: string | undefined

  // Brand you keep coming back to, in this category specifically.
  const brandHits = t.brands[product.brand] ?? 0
  if (brandHits > 0) {
    points += Math.min(7, 3 + brandHits)
    reason = `You save ${product.brand} ${product.category}`
  }

  // Colour you actually reach for here.
  const c = colorOf(product)
  const topColor = Object.entries(t.colors).sort((a, b) => b[1] - a[1])[0]
  if (c && topColor && c === topColor[0] && topColor[1] >= 2) {
    points += 5
    reason ??= `Your ${c} ${product.category}`
  }

  // Style lanes inside this category.
  const styleHit = product.styles.reduce((n, st) => n + (t.styles[st] ?? 0), 0)
  if (styleHit > 0) points += Math.min(5, styleHit)

  // Price level you're comfortable at for this kind of piece.
  if (t.priceMid > 0) {
    const ratio = product.price / t.priceMid
    if (ratio > 0.6 && ratio < 1.6) points += 4
    else if (ratio > 2.4 || ratio < 0.3) points -= 4
  }

  return { points, reason }
}

import type { Product } from '../data/catalog'
import type { Profile } from './store'

export interface MatchResult {
  score: number
  reasons: string[]
}

/**
 * How well a product fits the person, 0–100. Deliberately transparent: every
 * point is attributable to a reason we can show, because "trust me, it's a 94%"
 * is exactly the black-box feeling this whole site exists to avoid.
 */
/** Deterministic per-product spread so equal configs don't all tie at one number. */
function jitter(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return (h % 11) - 4 // -4 … +6
}

export function matchScore(product: Product, p: Profile): MatchResult {
  const reasons: string[] = []
  let score = 30

  // Taste — the heaviest signal, weighted by how much of the product's DNA you share.
  const overlap = product.styles.filter((s) => p.styles.includes(s))
  const ratio = product.styles.length ? overlap.length / product.styles.length : 0
  if (overlap.length > 0) {
    score += Math.round(14 + ratio * 24)
    reasons.push(ratio === 1 ? 'Exactly your lane' : 'In your lane')
  } else {
    score -= 8
  }

  // Budget — peak in the sweet spot, taper at the edges.
  if (product.price <= p.budgetMax) {
    const t = product.price / Math.max(1, p.budgetMax)
    const sweet = 1 - Math.abs(t - 0.62) / 0.62
    score += Math.round(8 + Math.max(0, sweet) * 12)
    if (t <= 1) reasons.push('In budget')
  } else if (product.price <= p.budgetMax * 1.25) {
    score += 2
    reasons.push('Slightly over budget')
  } else {
    score -= 10
  }

  // Quality tier.
  if (p.tiers.includes(product.tier)) {
    score += product.tier === 'premium' || product.tier === 'grail' ? 9 : 6
    reasons.push('Your quality tier')
  } else {
    score -= 4
  }

  // Season precision beats year-round filler.
  const seasonHit = product.seasons.filter((s) => p.seasons.includes(s))
  if (seasonHit.length > 0) {
    score += product.seasons.length <= 2 ? 8 : 4
    if (product.seasons.length <= 2) reasons.push('Right season')
  } else {
    score -= 6
  }

  score += jitter(product.id)

  return { score: Math.max(31, Math.min(98, Math.round(score))), reasons }
}

export function scoreLabel(score: number) {
  if (score >= 85) return 'Strong match'
  if (score >= 70) return 'Good match'
  if (score >= 50) return 'Worth a look'
  return 'Stretch'
}

/** Products sorted best-first for this person. */
export function rank(products: Product[], p: Profile) {
  return products
    .map((product) => ({ product, ...matchScore(product, p) }))
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
}

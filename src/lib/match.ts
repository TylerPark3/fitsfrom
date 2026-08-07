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
export function matchScore(product: Product, p: Profile): MatchResult {
  const reasons: string[] = []
  let score = 0

  // Taste — the heaviest signal.
  const overlap = product.styles.filter((s) => p.styles.includes(s))
  if (overlap.length > 0) {
    score += Math.min(42, 26 + overlap.length * 8)
    reasons.push(`Matches your ${overlap.length > 1 ? 'styles' : 'style'}`)
  } else {
    score += 6
  }

  // Budget.
  if (product.price >= p.budgetMin && product.price <= p.budgetMax) {
    score += 24
    reasons.push('In budget')
  } else if (product.price <= p.budgetMax * 1.25) {
    score += 12
    reasons.push('Slightly over budget')
  }

  // Quality tier.
  if (p.tiers.includes(product.tier)) {
    score += 14
    reasons.push('Your quality tier')
  } else {
    score += 4
  }

  // Season.
  const seasonHit = product.seasons.filter((s) => p.seasons.includes(s))
  if (seasonHit.length > 0) {
    score += 12
    reasons.push(seasonHit.length >= 3 ? 'Year-round' : 'Right season')
  }

  // Who it's cut for.
  if (product.gender === 'unisex' || p.genders.includes(product.gender)) {
    score += 8
  }

  return { score: Math.min(99, Math.round(score)), reasons }
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

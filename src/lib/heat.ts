import { CATALOG, type Product } from '../data/catalog'
import { SOCIAL_FITS, type SocialFitPost } from '../data/socialFits'
import { FITS } from '../data/fits'
import { cosigns } from './fitmatch'
import { socialRepository } from './socialRepository'

/**
 * What people are actually reacting to.
 *
 * Heat is a time-decayed engagement score — the same shape Hacker News and
 * Reddit use, because it solves the problem every "trending" list has: without
 * decay the same post wins forever, and with too much decay nothing has time
 * to build. Gravity 1.5 means a post needs roughly double the reactions to
 * hold its place a day later.
 *
 *              likes + 2·takes + 3·saves
 *   heat = ──────────────────────────────────
 *                  (hours + 2) ^ 1.5
 *
 * Saves are weighted heaviest because saving is the most deliberate thing
 * someone can do — it costs them a decision, a like costs nothing.
 *
 * TODO: counts are per-device until there's a backend. The interface below is
 * what a Supabase implementation replaces; nothing that renders heat knows
 * where the numbers came from.
 */
const GRAVITY = 1.5

export function heatScore(
  engagement: { likes: number; comments: number; saves: number },
  publishedAt: string,
  now = Date.now(),
): number {
  const hours = Math.max(0, (now - new Date(publishedAt).getTime()) / 3_600_000)
  const weighted = engagement.likes + engagement.comments * 2 + engagement.saves * 3
  return weighted / Math.pow(hours + 2, GRAVITY)
}

export interface HeatedFit {
  post: SocialFitPost
  score: number
  /** Local reactions layered on top of the seed counts. */
  yours: { liked: boolean; saved: boolean; takes: number }
}

/** Every fit, hottest first. */
export function rankedFits(now = Date.now()): HeatedFit[] {
  return SOCIAL_FITS.map((post) => {
    const mine = socialRepository.getTakes(post.id).filter((t) => !t.seeded).length
    const liked = socialRepository.isLiked(post.id)
    const saved = socialRepository.isSaved(post.id)
    const engagement = {
      likes: post.engagement.likes + (liked ? 1 : 0),
      comments: post.engagement.comments + mine,
      saves: post.engagement.saves + (saved ? 1 : 0),
    }
    return {
      post,
      score: heatScore(engagement, post.publishedAt, now),
      yours: { liked, saved, takes: mine },
    }
  }).sort((a, b) => b.score - a.score)
}

/** The single hottest fit published in the last seven days. */
export function fitOfTheWeek(now = Date.now()): HeatedFit | null {
  const week = now - 7 * 86_400_000
  const recent = rankedFits(now).filter((f) => new Date(f.post.publishedAt).getTime() >= week)
  return recent[0] ?? rankedFits(now)[0] ?? null
}

/**
 * Pieces with the most cultural proof behind them — how many documented fits a
 * piece turns up in, which is the one signal we have that isn't self-reported.
 */
export interface HotPiece {
  product: Product
  cosigns: string[]
  /** How many people in the files wore it. */
  proof: number
  saved: boolean
}

export function mostIdentified(savedIds: string[], limit = 4): HotPiece[] {
  const out: HotPiece[] = []
  for (const product of CATALOG) {
    // A model shot in a row of flat lays looks like a mistake. The picker
    // already tells us which images are product-on-white — use it.
    if (product.flat === false) continue
    const who = cosigns(product.id)
    if (who.length === 0) continue
    out.push({ product, cosigns: who, proof: who.length, saved: savedIds.includes(product.id) })
  }
  return out.sort((a, b) => b.proof - a.proof || a.product.price - b.product.price).slice(0, limit)
}

/**
 * Brands whose pieces show up across the most different people. A brand one
 * person wears is a preference; a brand six people wear independently is a
 * movement, and that's the thing worth surfacing.
 */
export interface HotBrand {
  brand: string
  people: string[]
  pieces: number
}

export function hotBrands(limit = 6): HotBrand[] {
  const byBrand = new Map<string, { people: Set<string>; pieces: Set<string> }>()
  for (const fit of FITS) {
    for (const piece of fit.pieces) {
      const brand = piece.match.brand
      if (!brand) continue
      const rec = byBrand.get(brand) ?? { people: new Set(), pieces: new Set() }
      rec.people.add(fit.who)
      rec.pieces.add(`${fit.id}-${piece.slot}`)
      byBrand.set(brand, rec)
    }
  }
  return [...byBrand.entries()]
    .map(([brand, r]) => ({ brand, people: [...r.people], pieces: r.pieces.size }))
    .sort((a, b) => b.people.length - a.people.length || b.pieces - a.pieces)
    .slice(0, limit)
}

/* ── what people look for ──────────────────────────────────────────────────
   Search terms are the purest demand signal there is: someone typing "denim
   shirt" is telling you exactly what they want, with no interface in the way.
   Logged locally for now; the shape is what a server table would hold. */

const SEARCH_KEY = 'lapel.searches.v1'

export interface SearchCount {
  term: string
  n: number
  at: number
}

export const searchLog = {
  record(raw: string) {
    const term = raw.trim().toLowerCase()
    if (term.length < 2 || term.length > 40) return
    try {
      const all = searchLog.all()
      const hit = all.find((s) => s.term === term)
      if (hit) {
        hit.n += 1
        hit.at = Date.now()
      } else {
        all.push({ term, n: 1, at: Date.now() })
      }
      localStorage.setItem(SEARCH_KEY, JSON.stringify(all.slice(-200)))
    } catch {
      /* storage blocked — the log is a nicety, not a requirement */
    }
  },

  all(): SearchCount[] {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_KEY) ?? '[]') as SearchCount[]
    } catch {
      return []
    }
  },

  top(limit = 8): SearchCount[] {
    return searchLog
      .all()
      .sort((a, b) => b.n - a.n || b.at - a.at)
      .slice(0, limit)
  },
}

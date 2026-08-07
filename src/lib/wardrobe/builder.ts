import { CATALOG } from '../../data/catalog'
import type { CustomPiece, Profile, WardrobeItem } from '../store'
import { metaFromProduct, metaFromText } from './infer'
import { evaluateFit, type EvalContext } from './score'
import type { FitEvaluation, WardrobeItemV3 } from './types'

export const SLOTS = ['outer', 'top', 'shirt', 'knit', 'pants', 'shoes', 'accessory'] as const
export type Slot = (typeof SLOTS)[number]

/** The slots a fit needs before it counts as complete. */
export const REQUIRED: Slot[] = ['top', 'pants', 'shoes']

/** Lift the stored wardrobe into the richer model, inferring what's missing. */
export function hydrate(wardrobe: WardrobeItem[], customs: CustomPiece[]): WardrobeItemV3[] {
  const out: WardrobeItemV3[] = []
  for (const w of wardrobe) {
    const p = CATALOG.find((c) => c.id === w.productId)
    if (!p) continue
    out.push({
      id: p.id,
      productId: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      image: p.image,
      size: w.size,
      condition: w.condition,
      yearsOwned: w.years,
      price: p.price,
      status: 'owned',
      meta: metaFromProduct(p),
      wearCount: 0,
      addedAt: w.addedAt,
    })
  }
  for (const c of customs) {
    out.push({
      id: c.id,
      name: c.name,
      category: (c.category || 'top') as WardrobeItemV3['category'],
      image: c.photo || undefined,
      link: c.link,
      status: 'owned',
      meta: metaFromText(c.name, (c.category || 'top') as WardrobeItemV3['category']),
      wearCount: 0,
      addedAt: Date.now(),
    })
  }
  return out
}

export interface CompleteOptions {
  locked: Partial<Record<Slot, string>>
  ctx: EvalContext
  /** Deterministic variety: same seed, same fit. */
  seed?: number
  /** Ids to avoid so consecutive suggestions differ. */
  avoid?: string[]
}

export interface BuiltFit {
  slots: Partial<Record<Slot, string>>
  items: WardrobeItemV3[]
  evaluation: FitEvaluation
  gaps: Slot[]
}

/**
 * Greedy slot-filling with lookahead: for each open slot, try every candidate
 * and keep the one that scores best with what's already placed. Deterministic —
 * the seed only rotates candidate order, never randomises the result.
 */
export function complete(pool: WardrobeItemV3[], opts: CompleteOptions): BuiltFit {
  const { locked, ctx, seed = 0, avoid = [] } = opts
  const chosen: Partial<Record<Slot, string>> = { ...locked }
  const byId = new Map(pool.map((i) => [i.id, i]))

  const orderedSlots: Slot[] = ['pants', 'top', 'shoes', 'outer', 'knit', 'shirt', 'accessory']

  for (const slot of orderedSlots) {
    if (chosen[slot]) continue
    let candidates = pool.filter((i) => i.category === slot && !Object.values(chosen).includes(i.id))
    if (!candidates.length) continue

    // Rotate by seed so "give me another" returns a genuinely different fit.
    if (seed > 0) {
      const k = seed % candidates.length
      candidates = [...candidates.slice(k), ...candidates.slice(0, k)]
    }
    // Push recently-suggested pieces to the back rather than banning them.
    candidates.sort((a, b) => Number(avoid.includes(a.id)) - Number(avoid.includes(b.id)))

    let best: WardrobeItemV3 | null = null
    let bestScore = -Infinity
    for (const cand of candidates.slice(0, 24)) {
      const trial = [...Object.values(chosen).map((id) => byId.get(id)!), cand].filter(Boolean)
      const { score } = evaluateFit(trial, ctx)
      if (score > bestScore) {
        bestScore = score
        best = cand
      }
    }
    // Only keep optional layers when they actually help.
    const optional = !REQUIRED.includes(slot)
    if (best && (!optional || bestScore >= 72)) chosen[slot] = best.id
  }

  const items = Object.values(chosen)
    .map((id) => byId.get(id))
    .filter((i): i is WardrobeItemV3 => !!i)

  return {
    slots: chosen,
    items,
    evaluation: evaluateFit(items, ctx),
    gaps: REQUIRED.filter((s) => !chosen[s]),
  }
}

/** Swap one slot for the next-best alternative, keeping everything else. */
export function alternatives(
  pool: WardrobeItemV3[],
  built: BuiltFit,
  slot: Slot,
  ctx: EvalContext,
  limit = 4,
): { item: WardrobeItemV3; score: number }[] {
  const others = built.items.filter((i) => i.category !== slot)
  return pool
    .filter((i) => i.category === slot && i.id !== built.slots[slot])
    .map((i) => ({ item: i, score: evaluateFit([...others, i], ctx).score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Ranked fits with anti-domination: no single piece may headline more than
 * twice in the top results, so one favourite hoodie can't own the whole page.
 */
export function rankFits(
  fits: BuiltFit[],
  opts: { maxPerItem?: number; recentlyWorn?: Record<string, number> } = {},
): BuiltFit[] {
  const { maxPerItem = 2, recentlyWorn = {} } = opts
  const now = Date.now()
  const scored = fits
    .map((f) => {
      let s = f.evaluation.score
      for (const i of f.items) {
        const worn = recentlyWorn[i.id]
        if (worn) {
          const days = (now - worn) / 86_400_000
          if (days < 7) s -= (7 - days) * 2.2
        }
      }
      if (f.gaps.length) s -= f.gaps.length * 9
      return { f, s }
    })
    .sort((a, b) => b.s - a.s)

  const used: Record<string, number> = {}
  const out: BuiltFit[] = []
  for (const { f } of scored) {
    if (f.items.some((i) => (used[i.id] ?? 0) >= maxPerItem)) continue
    f.items.forEach((i) => (used[i.id] = (used[i.id] ?? 0) + 1))
    out.push(f)
  }
  return out
}

export function profileToStyle(profile: Profile) {
  // Loudness read from the lanes they picked — street/skate skew loud.
  const loudLanes = ['street', 'skate', 'athletic']
  const loud = profile.styles.filter((s) => loudLanes.includes(s)).length
  return {
    loudness: profile.styles.length ? loud / profile.styles.length : 0.5,
    colorAvoid: [] as string[],
    silhouettePref: {},
    occasionDefault: 'casual' as const,
    weights: {},
  }
}

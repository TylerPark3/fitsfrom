import { FITS, type Fit } from '../data/fits'
import { CATALOG } from '../data/catalog'
import { resolve } from './fitmatch'
import type { StyleId } from '../data/taxonomy'
import type { Profile, WardrobeItem, CustomPiece } from './store'

export interface IconScore {
  who: string
  pct: number
  /** The receipts — why the number is what it is. */
  bits: string
}

/**
 * Multi-signal icon compatibility: style DNA overlap, their pieces vs your
 * budget, brands you both rock, and overlap with what's already in your closet.
 * Every signal surfaces in `bits` so the % is demonstrable, never arbitrary.
 */
export function iconScores(
  profile: Profile,
  wardrobe: WardrobeItem[],
  customs: CustomPiece[],
): IconScore[] {
  // The user's closet, as category counts.
  const myCats = new Set<string>()
  for (const w of wardrobe) {
    const pr = CATALOG.find((x) => x.id === w.productId)
    if (pr) myCats.add(pr.category)
  }
  for (const c of customs) myCats.add(c.category)

  const people = new Map<string, Fit[]>()
  for (const f of FITS) people.set(f.who, [...(people.get(f.who) ?? []), f])

  const out: IconScore[] = []
  for (const [who, fits] of people) {
    const styles = new Set(fits.flatMap((f) => f.styles))
    const shared = profile.styles.filter((st) => styles.has(st))
    const union = new Set([...styles, ...profile.styles]).size || 1
    const sJac = shared.length / union

    const pieces = fits.flatMap((f) => f.pieces.map((pc) => resolve(pc))).filter(
      (x): x is NonNullable<typeof x> => !!x,
    )
    const avg = pieces.length ? pieces.reduce((n, pr) => n + pr.price, 0) / pieces.length : 0
    const t = avg / Math.max(60, profile.budgetMax)
    const budgetFit = Math.max(0, 1 - Math.abs(t - 0.7))

    const iconBrands = new Set(pieces.map((pr) => pr.brand))
    const sharedBrands = (profile.brands ?? []).filter((b) => iconBrands.has(b))
    const brandAff = sharedBrands.length / Math.max(2, Math.min(4, iconBrands.size))

    const iconCats = new Set(pieces.map((pr) => pr.category))
    const catShared = [...iconCats].filter((c) => myCats.has(c))
    const catAff = myCats.size ? catShared.length / iconCats.size : 0

    const followBoost = profile.icons.includes(who) ? 3 : 0

    const pct = Math.max(
      34,
      Math.min(97, Math.round(30 + sJac * 42 + budgetFit * 11 + brandAff * 8 + catAff * 6 + followBoost)),
    )

    const bits = [
      shared.length ? `style ${shared.length}/${styles.size}` : 'different lane',
      budgetFit > 0.6 ? 'budget ✓' : avg > profile.budgetMax ? 'runs pricier' : 'budget ~',
      sharedBrands.length ? `${sharedBrands.length} shared brand${sharedBrands.length > 1 ? 's' : ''}` : null,
      catShared.length ? `${catShared.length} closet overlap` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    out.push({ who, pct, bits })
  }
  return out.sort((a, b) => b.pct - a.pct || a.who.localeCompare(b.who))
}


export interface Twin {
  fit: Fit
  pct: number
  shared: StyleId[]
}

/**
 * "You dress like ___" — Jaccard overlap between the user's picked styles and
 * each player's style DNA, scaled into a friendly 55–97% band. Deterministic,
 * so your twin doesn't change until your taste does.
 */
export function styleTwins(userStyles: StyleId[]): Twin[] {
  if (userStyles.length === 0) return []
  return FITS.map((fit) => {
    const shared = fit.styles.filter((s) => userStyles.includes(s))
    const union = new Set([...fit.styles, ...userStyles]).size
    const jaccard = union === 0 ? 0 : shared.length / union
    return { fit, pct: Math.round(55 + jaccard * 42), shared }
  }).sort((a, b) => b.pct - a.pct || a.fit.who.localeCompare(b.fit.who))
}

export function topTwin(userStyles: StyleId[]): Twin | null {
  const t = styleTwins(userStyles)
  return t.length && t[0].shared.length > 0 ? t[0] : null
}

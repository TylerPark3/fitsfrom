import { FITS, type Fit } from '../data/fits'
import type { StyleId } from '../data/taxonomy'

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

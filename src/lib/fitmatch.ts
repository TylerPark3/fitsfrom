import { CATALOG, type Product } from '../data/catalog'
import type { FitPiece } from '../data/fits'

/** Best buyable stand-in for a worn piece. */
export function resolve(piece: FitPiece): Product | null {
  const { category, brand, kw, sil } = piece.match
  const re = kw ? new RegExp(kw, 'i') : null
  const pool = CATALOG.filter((p) => p.category === category)
  return (
    pool.find((p) => (!brand || p.brand === brand) && (!re || re.test(p.name))) ??
    pool.find((p) => !re || re.test(p.name)) ??
    (sil ? pool.find((p) => p.silhouette === sil) : null) ??
    pool[0] ??
    null
  )
}

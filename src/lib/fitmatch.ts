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

import { FITS } from '../data/fits'

let _cosigns: Map<string, string[]> | null = null

/** productId → the people whose fit files this piece backs. Built once. */
export function cosigns(productId: string): string[] {
  if (!_cosigns) {
    _cosigns = new Map()
    for (const f of FITS) {
      for (const piece of f.pieces) {
        const p = resolve(piece)
        if (!p) continue
        const arr = _cosigns.get(p.id) ?? []
        if (!arr.includes(f.who)) arr.push(f.who)
        _cosigns.set(p.id, arr)
      }
    }
  }
  return _cosigns.get(productId) ?? []
}

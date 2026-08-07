import type { Product } from '../data/catalog'
import type { Profile } from './store'

export const ALPHA = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export type Alpha = (typeof ALPHA)[number]

/** Chest circumference (in) → alpha size index. */
function alphaIndexFromChest(chest: number): number {
  if (chest < 33) return 0
  if (chest < 36) return 1
  if (chest < 38.5) return 2
  if (chest < 42) return 3
  if (chest < 45.5) return 4
  if (chest < 49) return 5
  return 6
}

const PREF_SHIFT = { slim: -1, true: 0, relaxed: 1 } as const

/**
 * Rough chest/waist estimate from height + weight, used to seed the sliders so a
 * new user gets a usable recommendation before they own a tape measure.
 */
export function estimateFromBody(heightIn: number, weightLb: number) {
  const bmi = (weightLb / (heightIn * heightIn)) * 703
  const chest = Math.round((heightIn * 0.52 + (bmi - 22) * 0.85) * 2) / 2
  const waist = Math.round((heightIn * 0.44 + (bmi - 22) * 1.05) * 2) / 2
  const inseam = Math.round(heightIn * 0.45)
  return {
    chest: clamp(chest, 30, 56),
    waist: clamp(waist, 26, 48),
    inseam: clamp(inseam, 26, 36),
  }
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

export interface SizeRec {
  /** What to actually put in the cart, e.g. "L" or "32 × 32" or "US 10.5". */
  label: string
  /** Plain-English reason, shown under the recommendation. */
  note: string
  /** 0–1, how confident we are. Drives the confidence bar. */
  confidence: number
}

export function recommendSize(product: Product, p: Profile): SizeRec {
  const prefShift = PREF_SHIFT[p.fitPreference]

  switch (product.sizeSystem) {
    case 'alpha': {
      const base = alphaIndexFromChest(p.chest)
      // A garment that runs roomy (+1) means you take one size down to land true.
      const idx = clamp(base + prefShift - product.fitBias, 0, ALPHA.length - 1)
      const note =
        product.fitBias === 1
          ? 'Runs roomy — this is a size down from your measured size.'
          : product.fitBias === -1
            ? 'Runs slim — this is a size up from your measured size.'
            : `True to size for a ${p.chest}" chest.`
      return { label: ALPHA[idx], note, confidence: product.fitBias === 0 ? 0.9 : 0.75 }
    }
    case 'waist': {
      // Round to the even waist sizes brands actually stock.
      const raw = p.waist + (product.fitBias === 1 ? -1 : product.fitBias === -1 ? 1 : 0) + prefShift
      const waist = clamp(Math.round(raw / 2) * 2, 26, 44)
      const inseam = clamp(Math.round(p.inseam), 26, 36)
      const note =
        product.fitBias === 1
          ? 'Cut generously — take your true waist, not a size up.'
          : product.fitBias === -1
            ? 'Slim cut — one up from your true waist for comfort.'
            : `Sized off a ${p.waist}" waist and ${p.inseam}" inseam.`
      return { label: `${waist} × ${inseam}`, note, confidence: 0.85 }
    }
    case 'shoe': {
      // fitBias -1 = runs small = size up.
      const adj = product.fitBias === -1 ? 0.5 : product.fitBias === 1 ? -0.5 : 0
      const size = clamp(p.shoe + adj, 5, 16)
      const note =
        adj > 0
          ? 'Runs small — this is a half size up from your normal.'
          : adj < 0
            ? 'Runs long — half size down from your normal.'
            : 'True to size.'
      return { label: `US ${size % 1 === 0 ? size : size.toFixed(1)}`, note, confidence: 0.8 }
    }
    default:
      return { label: 'One size', note: 'Fits everyone.', confidence: 1 }
  }
}

/** All the sizes we'd let the user pick from, with the recommendation first. */
export function sizeOptions(product: Product, p: Profile): string[] {
  const rec = recommendSize(product, p).label
  switch (product.sizeSystem) {
    case 'alpha':
      return dedupe([rec, ...ALPHA.slice(1, 6)])
    case 'waist': {
      const inseam = clamp(Math.round(p.inseam), 26, 36)
      return dedupe([rec, ...[28, 30, 32, 34, 36].map((w) => `${w} × ${inseam}`)])
    }
    case 'shoe':
      return dedupe([rec, ...[8, 9, 9.5, 10, 10.5, 11, 12].map((s) => `US ${s}`)])
    default:
      return ['One size']
  }
}

function dedupe(a: string[]) {
  return Array.from(new Set(a))
}

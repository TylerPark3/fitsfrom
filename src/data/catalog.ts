import type { Category, Gender, Season, Silhouette, StyleId, Tier } from './taxonomy'
import raw from './catalog.gen.json'

export type SizeSystem = 'alpha' | 'waist' | 'shoe' | 'one'

export interface Product {
  id: string
  brand: string
  name: string
  category: Category
  price: number
  tier: Tier
  styles: StyleId[]
  seasons: Season[]
  gender: Gender
  sizeSystem: SizeSystem
  /** How the garment runs vs. true size. -1 slim / 0 true / +1 roomy */
  fitBias: -1 | 0 | 1
  image: string
  fabric?: string
  silhouette: Silhouette
  url: string
}

/**
 * Real products pulled from each brand's public Shopify feed by
 * scripts/fetch-feeds.mjs → scripts/curate.mjs. Prices and images are the
 * brand's own; links go to the live product page.
 */
export const CATALOG = raw as unknown as Product[]

export const BRANDS = Array.from(new Set(CATALOG.map((p) => p.brand))).sort()

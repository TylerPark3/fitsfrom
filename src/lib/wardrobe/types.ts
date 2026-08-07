import type { Category, Season, StyleId } from '../../data/taxonomy'

/** Anything inferred rather than stated carries its confidence so the UI can hedge. */
export interface Inferred<T> {
  value: T
  /** 0–1. Below 0.6 the UI shows it as a guess and invites a correction. */
  confidence: number
  source: 'user' | 'catalog' | 'heuristic'
}

export type Silhouette = 'slim' | 'straight' | 'relaxed' | 'baggy' | 'cropped' | 'longline'
export type VisualWeight = 'light' | 'medium' | 'heavy'
export type Formality = 1 | 2 | 3 | 4 | 5
export type GraphicIntensity = 0 | 1 | 2 | 3

export interface ColorInfo {
  hex: string
  role: 'primary' | 'secondary' | 'accent'
  /** HSL, derived once at write time so scoring never re-parses. */
  h: number
  s: number
  l: number
  neutral: boolean
}

export interface ItemMeta {
  subcategory?: string
  colors: ColorInfo[]
  graphic: Inferred<GraphicIntensity>
  material?: string
  silhouette: Inferred<Silhouette>
  /** Hem position, 0 = cropped … 1 = long overcoat. */
  length: Inferred<number>
  weight: Inferred<VisualWeight>
  warmth: Inferred<number>
  seasons: Season[]
  formality: Inferred<Formality>
  styleTags: StyleId[]
}

export type ItemStatus = 'owned' | 'saved' | 'suggested'

export interface WardrobeItemV3 {
  id: string
  productId?: string
  name: string
  brand?: string
  category: Category
  image?: string
  link?: string
  size?: string
  fitNotes?: string
  condition?: string
  yearsOwned?: number
  price?: number
  status: ItemStatus
  meta: ItemMeta
  wearCount: number
  lastWorn?: number
  rating?: number
  addedAt: number
}

export type Occasion =
  | 'school'
  | 'casual'
  | 'date'
  | 'party'
  | 'concert'
  | 'gameday'
  | 'travel'
  | 'formal'

export type Weather = 'hot' | 'warm' | 'mild' | 'cold' | 'freezing' | 'rain'

export interface OutfitV3 {
  id: string
  name: string
  /** slot -> item id */
  slots: Record<string, string>
  occasion?: Occasion
  weather?: Weather
  wornAt?: number[]
  photo?: string
  createdAt: number
  pinned?: boolean
}

export type FeedbackKind =
  | 'wear'
  | 'save'
  | 'not-my-style'
  | 'wrong-occasion'
  | 'too-loud'
  | 'too-basic'
  | 'wrong-color'
  | 'wrong-silhouette'
  | 'uncomfortable'
  | 'worn-recently'

export interface FeedbackSignal {
  kind: FeedbackKind
  outfitId?: string
  itemIds: string[]
  at: number
}

/** Learned from feedback; nudges scoring weights and preferences. */
export interface StyleProfileV3 {
  loudness: number
  colorAvoid: string[]
  silhouettePref: Partial<Record<Silhouette, number>>
  occasionDefault: Occasion
  climate?: Weather
  weights: Partial<Record<FitDimension, number>>
}

export type FitDimension =
  | 'taste'
  | 'proportion'
  | 'color'
  | 'layering'
  | 'texture'
  | 'occasion'
  | 'weather'
  | 'footwear'
  | 'statement'
  | 'comfort'
  | 'novelty'
  | 'feedback'

export interface DimensionScore {
  dimension: FitDimension
  score: number
  weight: number
  note: string
}

export interface FitEvaluation {
  score: number
  confidence: number
  dimensions: DimensionScore[]
  working: string[]
  improve: string[]
  easyFix?: { text: string; swapSlot?: string; itemId?: string }
  bold?: { text: string; swapSlot?: string; itemId?: string }
  missing: string[]
}

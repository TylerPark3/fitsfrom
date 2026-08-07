import { createContext, useContext } from 'react'
import type { Gender, Season, StyleId, Tier } from '../data/taxonomy'
import { estimateFromBody } from './sizing'

export interface Profile {
  name: string
  /** Data URL of the uploaded full-body photo. Never leaves the browser. */
  photo: string | null
  /** Normalised crop offsets for the photo inside the avatar frame. */
  photoScale: number
  photoY: number
  height: number
  weight: number
  chest: number
  waist: number
  inseam: number
  shoe: number
  fitPreference: 'slim' | 'true' | 'relaxed'
  styles: StyleId[]
  budgetMin: number
  budgetMax: number
  tiers: Tier[]
  seasons: Season[]
  genders: Gender[]
  onboarded: boolean
}

export interface WardrobeItem {
  productId: string
  size: string
  addedAt: number
  owned: boolean
}

export interface Collection {
  id: string
  name: string
  productIds: string[]
}

export interface AppState {
  profile: Profile
  wardrobe: WardrobeItem[]
  saved: string[]
  collections: Collection[]
}

const est = estimateFromBody(70, 160)

export const DEFAULT_STATE: AppState = {
  profile: {
    name: '',
    photo: null,
    photoScale: 1,
    photoY: 50,
    height: 70,
    weight: 160,
    chest: est.chest,
    waist: est.waist,
    inseam: est.inseam,
    shoe: 10,
    fitPreference: 'true',
    styles: [],
    budgetMin: 0,
    budgetMax: 200,
    tiers: ['entry', 'solid'],
    seasons: ['fall'],
    genders: ['men'],
    onboarded: false,
  },
  wardrobe: [],
  saved: [],
  collections: [{ id: 'wishlist', name: 'Wishlist', productIds: [] }],
}

const KEY = 'lapel.state.v2'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...(parsed.profile ?? {}) },
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Photo data URLs can blow the quota. Persist everything but the photo.
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ ...state, profile: { ...state.profile, photo: null } }),
      )
    } catch {
      /* give up quietly rather than break the app */
    }
  }
}

export interface Store extends AppState {
  setProfile: (patch: Partial<Profile>) => void
  toggleSaved: (productId: string) => void
  addToWardrobe: (productId: string, size: string, owned: boolean) => void
  removeFromWardrobe: (productId: string) => void
  createCollection: (name: string) => string
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  toggleInCollection: (collectionId: string, productId: string) => void
  reset: () => void
  toast: (message: string) => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

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
  /** Detected body-pin positions (fractions of the cropped photo). */
  pose: { chest: number; waist: number; inseam: number; cx: number } | null
  /** Circular face crop — like setting a profile picture. */
  faceX: number
  faceY: number
  faceZoom: number
  height: number
  weight: number
  chest: number
  waist: number
  inseam: number
  shoe: number
  fitPreference: 'slim' | 'true' | 'relaxed'
  styles: StyleId[]
  /** People they want to dress like — picked at signup, drives similarity scores. */
  icons: string[]
  /** Teams they follow — ESPN-style personalization for fit files and trends. */
  teams: string[]
  /** Brands they rock with — boosts ranking. */
  brands: string[]
  /** Free-form interests — names, shows, anything. Personalization never ends. */
  tags: string[]
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

/** A piece the user photographed themselves — lives only on this device. */
export interface CustomPiece {
  id: string
  name: string
  category: string
  photo: string
}

/** A planned fit: named set of refs (catalog product ids or custom ids). */
export interface Outfit {
  id: string
  name: string
  refs: string[]
}

export interface Account {
  firstName: string
  lastName: string
  email: string
  /** SHA-256 hex of the password. Local-only — never sent anywhere. */
  passwordHash: string
  createdAt: number
}

export interface AppState {
  profile: Profile
  wardrobe: WardrobeItem[]
  saved: string[]
  collections: Collection[]
  account: Account | null
  signedIn: boolean
  customs: CustomPiece[]
  outfits: Outfit[]
  scentFavs: string[]
}

const est = estimateFromBody(70, 160)

export const DEFAULT_STATE: AppState = {
  profile: {
    name: '',
    photo: null,
    photoScale: 1,
    photoY: 50,
    pose: null,
    faceX: 50,
    faceY: 10,
    faceZoom: 2.6,
    height: 70,
    weight: 160,
    chest: est.chest,
    waist: est.waist,
    inseam: est.inseam,
    shoe: 10,
    fitPreference: 'true',
    styles: [],
    icons: [],
    teams: [],
    brands: [],
    tags: [],
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
  account: null,
  signedIn: false,
  customs: [],
  outfits: [],
  scentFavs: [],
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
  createAccount: (a: Account) => void
  signIn: () => void
  signOut: () => void
  addCustom: (piece: CustomPiece) => void
  removeCustom: (id: string) => void
  toggleScentFav: (id: string) => void
  createOutfit: (name: string) => string
  deleteOutfit: (id: string) => void
  toggleOutfitRef: (outfitId: string, ref: string) => void
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

import type { AppState } from './store'

/**
 * The free tier is a real, usable closet — five up top, five down below — not a
 * crippled demo. Past that the closet, the dressing room and the planning tools
 * are what you're paying for.
 */
export const PRO = {
  price: 19.99,
  label: '$19.99/mo',
  freeTops: 5,
  freeBottoms: 5,
}

export const TOP_CATS = ['top', 'shirt', 'knit', 'outer']
export const BOTTOM_CATS = ['pants', 'shoes', 'accessory']

export type Half = 'tops' | 'bottoms'

export const halfOf = (category: string): Half =>
  TOP_CATS.includes(category) ? 'tops' : 'bottoms'

export interface PlanState {
  pro: boolean
  tops: number
  bottoms: number
  topsLeft: number
  bottomsLeft: number
  /** True when this half is full and the user isn't on Pro. */
  full: (half: Half) => boolean
}

export function planFor(
  state: Pick<AppState, 'wardrobe' | 'customs' | 'account'>,
  counts: { tops: number; bottoms: number },
): PlanState {
  const pro = !!state.account?.pro
  const topsLeft = Math.max(0, PRO.freeTops - counts.tops)
  const bottomsLeft = Math.max(0, PRO.freeBottoms - counts.bottoms)
  return {
    pro,
    tops: counts.tops,
    bottoms: counts.bottoms,
    topsLeft,
    bottomsLeft,
    full: (half) => !pro && (half === 'tops' ? topsLeft : bottomsLeft) === 0,
  }
}

/**
 * Cosign Pro — the one place the price lives.
 *
 * TODO: Replace prototype entitlement with server-verified Stripe/Supabase
 * subscription state before production billing. Nothing here is secure: the
 * status is read from local demo account state, so anyone can flip it in
 * devtools. The UI is complete; the enforcement is not.
 */
export const PREMIUM_PRICE = 19.99
export const PREMIUM_PRICE_LABEL = `$${PREMIUM_PRICE.toFixed(2)}/month`
export const PREMIUM_NAME = 'Cosign Pro'

export interface SubscriptionStatus {
  active: boolean
  /** How we decided — useful when debugging, and honest in the UI. */
  source: 'account' | 'preview' | 'none'
}

/** Dev/demo override so the locked and unlocked states can both be reviewed. */
const PREVIEW_KEY = 'lapel.pro.preview'

export const subscriptionService = {
  getStatus(accountPro?: boolean): SubscriptionStatus {
    if (accountPro) return { active: true, source: 'account' }
    try {
      if (localStorage.getItem(PREVIEW_KEY) === '1') return { active: true, source: 'preview' }
    } catch {
      /* private mode — fall through to locked */
    }
    return { active: false, source: 'none' }
  },

  /** Prototype only. Lets the reviewer see the unlocked experience. */
  setPreview(on: boolean) {
    try {
      if (on) localStorage.setItem(PREVIEW_KEY, '1')
      else localStorage.removeItem(PREVIEW_KEY)
    } catch {
      /* ignore */
    }
  },

  isPreview(): boolean {
    try {
      return localStorage.getItem(PREVIEW_KEY) === '1'
    } catch {
      return false
    }
  },
}

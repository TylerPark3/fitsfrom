/**
 * Affiliate link wrapping. Sign up at sovrn.com/commerce (5 min, free) and
 * paste your API key below — every outbound product link starts earning
 * commission (~5–15% per sale) with zero other changes.
 */
export const SOVRN_KEY = ''

export function buyUrl(raw: string): string {
  if (!SOVRN_KEY) return raw
  return `https://redirect.viglink.com?key=${SOVRN_KEY}&u=${encodeURIComponent(raw)}`
}

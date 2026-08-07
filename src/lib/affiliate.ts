import { CATALOG } from '../data/catalog'

export function buyUrl(raw: string, placement = 'site'): string {
  const product = CATALOG.find((item) => item.url === raw)
  if (!product) return raw
  const safePlacement = placement.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'site'
  return `/go/${encodeURIComponent(product.id)}?placement=${encodeURIComponent(safePlacement)}`
}

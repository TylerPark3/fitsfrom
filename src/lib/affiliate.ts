import { CATALOG } from '../data/catalog'

export function buyUrl(raw: string): string {
  const product = CATALOG.find((item) => item.url === raw)
  if (!product) return raw
  return `/go/${encodeURIComponent(product.id)}?placement=site`
}

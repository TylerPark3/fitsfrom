import catalog from '../../src/data/catalog.gen.json'

const products = new Map(catalog.map((product) => [product.id, product]))

function safePlacement(value) {
  return String(value || 'site').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'site'
}

export async function onRequestGet({ env, params, request }) {
  const product = products.get(params.product)
  if (!product || !product.url) return new Response('Product not found', { status: 404 })

  let destination
  try {
    destination = new URL(product.url)
  } catch {
    return new Response('Invalid merchant URL', { status: 500 })
  }

  if (destination.protocol !== 'https:' && destination.protocol !== 'http:') {
    return new Response('Unsupported merchant URL', { status: 400 })
  }

  const source = new URL(request.url)
  const placement = safePlacement(source.searchParams.get('placement'))
  const key = env.SOVRN_KEY
  const target = key
    ? `https://redirect.viglink.com?key=${encodeURIComponent(key)}&u=${encodeURIComponent(destination.href)}&cuid=${encodeURIComponent(`${product.id}:${placement}`)}`
    : destination.href

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

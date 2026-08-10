import catalog from '../../src/data/catalog.gen.json'

const products = new Map(catalog.map((product) => [product.id, product]))

function safePlacement(value) {
  return String(value || 'site').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'site'
}

/**
 * Direct programmes beat an aggregator.
 *
 * Sovrn takes a cut of a rate it negotiated on your behalf. A direct
 * relationship with a retailer pays the full rate, and the premium retailers
 * carry the pieces that actually appear in these fits. So: if a merchant has a
 * direct programme configured, use it; otherwise fall through to Sovrn;
 * otherwise send the person to the shop unmonetised, which must always still
 * work.
 *
 * Each entry needs one secret set on the Pages project, e.g.
 *   npx wrangler pages secret put AWIN_MRPORTER --project-name=cosign
 *
 * `build(url, id, secret)` returns the tracked destination.
 */
const DIRECT = [
  {
    hosts: ['mrporter.com'],
    secret: 'AWIN_MRPORTER',
    // Awin: advertiser id lives in the secret, clickref carries our own id
    build: (url, clickRef, advertiser) =>
      `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(advertiser)}&awinaffid=${encodeURIComponent(advertiser)}&clickref=${encodeURIComponent(clickRef)}&ued=${encodeURIComponent(url)}`,
  },
  {
    hosts: ['farfetch.com'],
    secret: 'RAKUTEN_FARFETCH',
    build: (url, clickRef, advertiser) =>
      `https://click.linksynergy.com/deeplink?id=${encodeURIComponent(advertiser)}&mid=${encodeURIComponent(advertiser)}&u1=${encodeURIComponent(clickRef)}&murl=${encodeURIComponent(url)}`,
  },
  {
    hosts: ['ssense.com'],
    secret: 'RAKUTEN_SSENSE',
    build: (url, clickRef, advertiser) =>
      `https://click.linksynergy.com/deeplink?id=${encodeURIComponent(advertiser)}&mid=${encodeURIComponent(advertiser)}&u1=${encodeURIComponent(clickRef)}&murl=${encodeURIComponent(url)}`,
  },
]

function directFor(hostname, env) {
  const host = hostname.replace(/^www\./, '')
  for (const entry of DIRECT) {
    if (!entry.hosts.some((h) => host === h || host.endsWith(`.${h}`))) continue
    const secret = env[entry.secret]
    if (secret) return { entry, secret }
  }
  return null
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
  const clickId = crypto.randomUUID().replaceAll('-', '').slice(0, 16)
  const clickRef = `${product.id}:${placement}:${clickId}`
  const key = env.SOVRN_KEY
  const direct = directFor(destination.hostname, env)

  // direct programme → aggregator → straight to the shop
  let network = 'none'
  let target = destination.href
  if (direct) {
    network = direct.entry.secret
    target = direct.entry.build(destination.href, clickRef, direct.secret)
  } else if (key) {
    network = 'sovrn'
    target = `https://redirect.viglink.com?key=${encodeURIComponent(key)}&u=${encodeURIComponent(destination.href)}&cuid=${encodeURIComponent(clickRef)}`
  }

  const event = {
    type: 'commerce_click',
    clickId,
    productId: product.id,
    merchant: destination.hostname.replace(/^www\./, ''),
    brand: product.brand,
    category: product.category,
    placement,
    monetized: network !== 'none',
    network,
    at: new Date().toISOString(),
  }

  // Contains no profile, measurement, wardrobe, email, or avatar information.
  console.log(JSON.stringify(event))
  if (env.AFFILIATE_ANALYTICS?.writeDataPoint) {
    env.AFFILIATE_ANALYTICS.writeDataPoint({
      blobs: [event.productId, event.merchant, event.brand, event.category, event.placement],
      doubles: [event.monetized ? 1 : 0],
      indexes: [event.clickId],
    })
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

/**
 * Pull real product data (title, price, image, deep link) from brands that run
 * on Shopify, which exposes a public /products.json feed. Writes a raw dump we
 * curate by hand — we are not shipping whatever the feed happens to return.
 *
 *   node scripts/fetch-feeds.mjs > /dev/null
 */
import { writeFileSync } from 'node:fs'

const BRANDS = [
  ['Lady White Co.', 'ladywhiteco.com'],
  ['3sixteen', 'www.3sixteen.com'],
  ['Topo Designs', 'topodesigns.com'],
  ['Brain Dead', 'braindead.la'],
  ['Noah', 'noahny.com'],
  ['Sporty & Rich', 'sportyandrich.com'],
  ['Stan Ray', 'stanray.com'],
  ['Gitman Vintage', 'gitmanvintage.com'],
  ['J.Press', 'jpressonline.com'],
  ['Snow Peak', 'www.snowpeak.com'],
  ['Polar Skate Co.', 'polarskateco.com'],
  ['orSlow', 'orslow.jp'],
  ['Norse Projects', 'www.norseprojects.com'],
  ['Asket', 'www.asket.com'],
  ['Rowing Blazers', 'rowingblazers.com'],
  ['Taylor Stitch', 'www.taylorstitch.com'],
  ['Buck Mason', 'www.buckmason.com'],
  ['Alex Mill', 'www.alexmill.com'],
  ['Corridor', 'corridornyc.com'],
  ['Deveaux', 'deveauxnewyork.com'],
  ['Wythe', 'wytheny.com'],
  ['Bather', 'bather.com'],
  ['Kotn', 'kotn.com'],
  ['Portuguese Flannel', 'portuguese-flannel.com'],
  ['Aime Leon Dore', 'www.aimeleondore.com'],
  ['Last Resort AB', 'lastresortab.com'],
  ['Stüssy', 'www.stussy.com'],
  ['Kith', 'kith.com'],
  ['Fear of God', 'fearofgod.com'],
  ['John Elliott', 'johnelliott.com'],
  ['JJJJound', 'jjjjound.com'],
  ['Represent', 'representclo.com'],
  ['Sexhippies', 'sexhippies.com'],
  ['Stingwater', 'stingwater.com'],
  ['Checks Downtown', 'checksdowntown.com'],
  ['18 East', '18east.co'],
  ['Free & Easy', 'freeandeasy.la'],
  ['Museum of Peace & Quiet', 'museumofpeaceandquiet.com'],
  ['Story mfg.', 'storymfg.com'],
  ['Kartik Research', 'kartikresearch.com'],
  ['Battenwear', 'battenwear.com'],
  ['Dehen 1920', 'dehen.com'],
  ['Freenote Cloth', 'freenotecloth.com'],
  ['Uskees', 'uskees.com'],
  ['BBC Ice Cream', 'bbcicecream.com'],
  ['Golf Wang', 'golfwang.com'],
  ['AWGE', 'awge.com'],
  ['Glo Gang', 'glogang.com'],
  ['The Marathon Clothing', 'themarathonclothing.com'],
  ['Kuon', 'kuon.tokyo'],
  ['Iron Heart', 'ironheart.co.uk'],
]

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }

const MATERIALS = ['cotton','wool','merino','cashmere','linen','nylon','polyester','suede','leather','denim','corduroy','fleece','canvas','ripstop','mohair','alpaca','silk','tencel','hemp','moleskin','twill','jersey','terry']

function extractFabric(html) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const pct = text.match(/\d{2,3}%\s*[A-Za-z]+(?:\s*[,/]\s*\d{1,3}%\s*[A-Za-z]+)?/)
  if (pct) return pct[0].slice(0, 60)
  const lower = text.toLowerCase()
  const hit = MATERIALS.find((m) => lower.includes(m))
  return hit ? hit[0].toUpperCase() + hit.slice(1) : ''
}

async function feed(domain) {
  const out = []
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`https://${domain}/products.json?limit=250&page=${page}`, {
      headers: UA,
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json.products?.length) break
    out.push(...json.products)
    if (json.products.length < 250) break
  }
  return out
}

const all = {}
for (const [brand, domain] of BRANDS) {
  try {
    const products = await feed(domain)
    all[brand] = products
      .filter((p) => p.images?.length && p.variants?.length)
      .map((p) => ({
        brand,
        domain,
        handle: p.handle,
        title: p.title,
        type: p.product_type,
        tags: p.tags,
        price: Number(p.variants[0].price),
        available: p.variants.some((v) => v.available),
        sizes: p.variants.map((v) => v.title).slice(0, 14),
        image: p.images[0].src.split('?')[0],
        images: p.images.slice(0, 4).map((im) => im.src.split('?')[0]),
        fabric: extractFabric(p.body_html),
        url: `https://${domain}/products/${p.handle}`,
      }))
    console.error(`ok   ${brand.padEnd(20)} ${all[brand].length}`)
  } catch (e) {
    console.error(`FAIL ${brand.padEnd(20)} ${e.message}`)
  }
}

writeFileSync(process.argv[2] ?? 'feeds.json', JSON.stringify(all, null, 1))
console.error(
  `\ntotal ${Object.values(all).reduce((n, a) => n + a.length, 0)} products from ${Object.keys(all).length} brands`,
)

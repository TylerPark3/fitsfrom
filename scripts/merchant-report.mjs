import catalog from '../src/data/catalog.gen.json' with { type: 'json' }

const merchants = new Map()
for (const product of catalog) {
  let host = 'invalid-url'
  try {
    host = new URL(product.url).hostname.replace(/^www\./, '')
  } catch {}
  const key = `${product.brand}\t${host}`
  merchants.set(key, (merchants.get(key) || 0) + 1)
}

const rows = [...merchants.entries()]
  .map(([key, products]) => {
    const [brand, domain] = key.split('\t')
    return { brand, domain, products }
  })
  .sort((a, b) => b.products - a.products || a.brand.localeCompare(b.brand))

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), totalProducts: catalog.length, merchantCount: rows.length, merchants: rows }, null, 2))

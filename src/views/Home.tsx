import { useEffect, useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS } from '../data/catalog'
import { useStore } from '../lib/store'
import { Arrow, Search } from '../components/Icons'

const QUERIES = [
  'best jeans for guys 5′10″',
  'niche clothing brands like carhartt',
  'jackets that aren’t north face',
  'best minimal sneakers under $150',
  'what to wear to look put together',
  'flannels that don’t look cheap',
]

export function Home({ go }: { go: (v: View) => void }) {
  const { profile } = useStore()
  const [qi, setQi] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setQi((i) => (i + 1) % QUERIES.length), 2200)
    return () => clearInterval(t)
  }, [])

  // One strong image per brand.
  const preview: typeof CATALOG = []
  for (const p of CATALOG) {
    if (preview.length === 6) break
    if (preview.some((x) => x.brand === p.brand)) continue
    if (p.category === 'accessory') continue
    preview.push(p)
  }

  return (
    <>
      <section className="wrap hero">
        <h1>
          Tired of <em>searching</em> this?
        </h1>

        <div className="querybox" aria-hidden="true">
          <Search size={16} />
          <span key={qi} className="querybox__q">
            {QUERIES[qi]}
          </span>
          <i className="querybox__caret" />
        </div>

        <p className="hero__sub">
          Set your size, budget and taste once. Get the niche brands that actually fit — straight
          from their own stores.
        </p>

        <div className="hero__cta">
          <button className="btn btn--primary btn--lg" onClick={() => go('onboarding')}>
            {profile.onboarded ? 'Redo my profile' : 'Start'} <Arrow />
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => go('discover')}>
            Browse
          </button>
        </div>

        <p className="hero__proof">
          {BRANDS.length} brands · {CATALOG.length} live pieces · nothing leaves your browser
        </p>
      </section>

      <section className="wrap" aria-label="Preview">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {preview.map((p) => (
            <button key={p.id} className="card" onClick={() => go('discover')}>
              <div className="card__frame">
                <img className="card__img" src={p.image} alt="" loading="lazy" />
              </div>
              <div className="card__meta">
                <div className="card__brand">{p.brand}</div>
                <div className="card__line">
                  <span>${p.price.toFixed(0)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="strip">
          <div className="strip__cell">
            <div className="strip__n serif">01</div>
            <h3>Your body</h3>
            <p>A photo and six sliders. Every piece shows the size to buy.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">02</div>
            <h3>Your taste</h3>
            <p>Style, budget, season. No quiz personalities.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">03</div>
            <h3>Steal fits</h3>
            <p>Tunnel fits broken down top to bottom — every piece linked.</p>
          </div>
        </div>
      </section>
    </>
  )
}

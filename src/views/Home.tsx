import type { View } from '../App'
import { CATALOG, BRANDS } from '../data/catalog'
import { FITS } from '../data/fits'
import { useStore } from '../lib/store'
import { Arrow } from '../components/Icons'

/**
 * Editorial front page — sells the culture, not the SKU.
 * Lead story + fit covers, The Ringer style: the headline is the design.
 */
export function Home({ go }: { go: (v: View) => void }) {
  const { profile } = useStore()
  const covers = FITS.filter((f) =>
    ['clarkson-tunnel', 'poole-arrival'].includes(f.id),
  )

  return (
    <>
      <section className="wrap hero" style={{ paddingBottom: 24 }}>
        <h1>
          Dress like you <em>mean it.</em>
        </h1>
        <p className="hero__sub">
          The fits, the brands, the culture — matched to your size and budget, linked straight to
          the source.
        </p>
        <div className="hero__cta">
          <button className="btn btn--primary btn--lg" onClick={() => go('onboarding')}>
            {profile.onboarded ? 'Redo my profile' : 'Start'} <Arrow />
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => go('fits')}>
            See the fits
          </button>
        </div>
      </section>

      {/* lead editorial — the culture, full bleed */}
      <section className="wrap">
        <div className="lead">
          <button className="lead__main" onClick={() => go('fits')}>
            <img src="/editorial/iverson-crowd.jpg" alt="Allen Iverson, courtside, 2002" />
            <div className="lead__text">
              <span className="lead__kicker">The Answer, 2002</span>
              <span className="lead__head serif">
                Style was never about the clothes. It was about walking in like you own the
                building.
              </span>
              <span className="lead__cta">The fits, broken down →</span>
            </div>
          </button>

          <div className="lead__side">
            {covers.map((f) => (
              <button key={f.id} className="lead__story" onClick={() => go('fits')}>
                <img src={`/fits/${f.id}.jpg`} alt={f.who} />
                <div className="lead__text">
                  <span className="lead__kicker">{f.where}</span>
                  <span className="lead__head lead__head--sm serif">{f.who}</span>
                  <span className="lead__cta">
                    {f.pieces.length} pieces, all linked →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="strip">
          <div className="strip__cell">
            <div className="strip__n serif">01</div>
            <h3>The fits</h3>
            <p>Tunnel walks broken down top to bottom. Every piece linked.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">02</div>
            <h3>Your fit</h3>
            <p>Size, budget, taste — set once. Every piece shows your size.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">03</div>
            <h3>The source</h3>
            <p>
              {BRANDS.length} brands, {CATALOG.length} live pieces. Buy direct, no middleman.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

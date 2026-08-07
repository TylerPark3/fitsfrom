import type { View } from '../App'
import { CATALOG, BRANDS } from '../data/catalog'
import { FITS } from '../data/fits'
import { useStore } from '../lib/store'
import { Arrow } from '../components/Icons'

/** Same fit for everyone all day; a new one tomorrow. The reason to come back. */
export function fitOfTheDay() {
  const day = Math.floor(Date.now() / 86_400_000)
  return FITS[day % FITS.length]
}

/**
 * Front page of fit culture — magazine collage, not boxes.
 * Cutout-style tilted photo cards, overlapping serif headline, daily fit.
 */
export function Home({ go }: { go: (v: View) => void }) {
  const { profile } = useStore()
  const today = fitOfTheDay()
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* masthead collage */}
      <section className="mast">
        <div className="wrap mast__in">
          <div className="mast__cutouts" aria-hidden="true">
            <button className="cutout cutout--a" onClick={() => go('fits')}>
              <img src="/editorial/iverson-crowd.jpg" alt="" />
              <span>A.I. · Phila, 2002</span>
            </button>
            <button className="cutout cutout--b" onClick={() => go('fits')}>
              <img src="/fits/clarkson-tunnel.jpg" alt="" />
              <span>Clarkson · Jazz tunnel</span>
            </button>
            <button className="cutout cutout--c" onClick={() => go('fits')}>
              <img src="/fits/poole-arrival.jpg" alt="" />
              <span>Poole · gameday</span>
            </button>
          </div>

          <div className="mast__text">
            <p className="eyebrow">{date}</p>
            <h1 className="mast__head serif">
              The fits run
              <br />
              the <em>culture.</em>
            </h1>
            <p className="mast__sub">
              Tunnel walks, courtside cameos, street shots — broken down piece by piece, matched to
              your size, linked to the source.
            </p>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn--primary btn--lg" onClick={() => go('fits')}>
                Today’s fit <Arrow />
              </button>
              <button className="btn btn--ghost btn--lg" onClick={() => go('onboarding')}>
                {profile.onboarded ? 'My profile' : 'Get sized'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* fit of the day banner */}
      <section className="wrap">
        <button className="fotd" onClick={() => go('fits')}>
          <span className="fotd__tag">Fit of the day</span>
          <span className="fotd__who serif">{today.who}</span>
          <span className="fotd__what">
            {today.where} — {today.vibe}
          </span>
          <span className="fotd__cta">
            {today.pieces.length} pieces, all linked <Arrow size={13} />
          </span>
        </button>
      </section>

      <section className="wrap">
        <div className="strip">
          <div className="strip__cell">
            <div className="strip__n serif">01</div>
            <h3>A new fit every day</h3>
            <p>NBA tunnels today. NFL, music, film next. Come back tomorrow.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">02</div>
            <h3>Every piece identified</h3>
            <p>Top to bottom, with the exact size to buy for your body.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">03</div>
            <h3>Straight from the source</h3>
            <p>
              {BRANDS.length} brands, {CATALOG.length} live pieces. No middleman.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

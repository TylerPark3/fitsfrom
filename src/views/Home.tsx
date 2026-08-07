import type { View } from '../App'
import { CATALOG, BRANDS } from '../data/catalog'
import { FITS } from '../data/fits'
import { useStore } from '../lib/store'
import { resolve } from '../lib/fitmatch'
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

  const tickerItems = [
    `Fit of the day — ${today.who}`,
    'New fits daily',
    `${BRANDS.length} brands live`,
    'Steal the whole look',
    'Every piece identified',
    'Sized to your body',
  ]

  return (
    <>
      {/* hype ticker */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i}>
              {t} <i>◆</i>
            </span>
          ))}
        </div>
      </div>

      {/* full-bleed black & white triptych */}
      <section className="mast">
        <div className="mast__bg" aria-hidden="true">
          <img src="/editorial/iverson-crowd.jpg" alt="" />
          <img src="/fits/clarkson-tunnel.jpg" alt="" />
          <img src="/fits/sga-arrival.jpg" alt="" />
        </div>
        <div className="mast__overlay">
          <p className="mast__date">{date} — the front page of fit culture</p>
          <h1 className="mast__head">
            THE FITS RUN
            <br />
            THE <em className="serif">culture.</em>
          </h1>
          <p className="mast__sub">
            Tunnel walks broken down piece by piece — matched to your size, linked to the source.
          </p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn--invert btn--lg" onClick={() => go('fits')}>
              Today’s fit <Arrow />
            </button>
            <button className="btn btn--outline btn--lg" onClick={() => go('onboarding')}>
              {profile.onboarded ? 'My profile' : 'Get sized'}
            </button>
          </div>
        </div>
      </section>

      {/* fit of the day — editorial split */}
      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="fotd2">
          <button className="fotd2__media" onClick={() => go('fits')} aria-label={`Open ${today.who}`}>
            {today.ig ? (
              <iframe
                src={`${today.ig.replace(/\/?$/, '/')}embed/captioned/`}
                title={`${today.who} on Instagram`}
                loading="lazy"
                allowTransparency
              />
            ) : (
              <>
                <img src={`/fits/${today.id}.jpg`} alt={today.who} onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')} />
                <span className="fotd2__stamp">{today.where}</span>
              </>
            )}
          </button>

          <div className="fotd2__body">
            <span className="eyebrow" style={{ color: 'var(--red)' }}>
              Fit of the day — {date}
            </span>
            <h2 className="fotd2__who serif">{today.who}</h2>
            <p className="mono-line" style={{ marginTop: 4 }}>
              {today.when.toUpperCase()}
            </p>
            <p className="fotd2__context">{today.context}</p>

            <div className="fotd2__pieces">
              {today.pieces.slice(0, 5).map((piece) => {
                const p = resolve(piece)
                return p ? (
                  <div className="fotd2__piece" key={piece.slot} title={`${piece.slot} — ${p.brand}`}>
                    <img src={p.image} alt={piece.slot} loading="lazy" />
                    <span>{piece.slot}</span>
                  </div>
                ) : null
              })}
            </div>

            <div className="row" style={{ gap: 10, marginTop: 26 }}>
              <button className="btn btn--primary btn--lg" onClick={() => go('fits')}>
                Open the breakdown <Arrow />
              </button>
            </div>
          </div>
        </div>
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

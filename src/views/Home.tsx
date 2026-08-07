import { useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS } from '../data/catalog'
import { FITS } from '../data/fits'
import { useStore } from '../lib/store'
import { resolve } from '../lib/fitmatch'
import { Arrow } from '../components/Icons'
import { Type } from '../components/Type'

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
          <p className="mast__date"><Type text={`${date.toUpperCase()} — THE FRONT PAGE OF FIT CULTURE`} speed={16} /></p>
          <h1 className="mast__head">
            THE FITS RUN
            <br />
            THE <em className="serif">culture.</em>
          </h1>
          <p className="mast__sub">
            <em className="serif" style={{ color: '#ff8a6d', fontSize: '1.15em' }}>Style is shared.</em>{' '}
            We curate the fits, break them down piece by piece, and size them to you.
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
              <Type text={`FIT OF THE DAY — ${date.toUpperCase()}`} speed={16} />
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
        <PhoneDemo go={go} />
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
            <h3>Catalogue everything you own</h3>
            <p>Snap it or type it — your whole closet, on shelves, sized.</p>
          </div>
          <div className="strip__cell">
            <div className="strip__n serif">03</div>
            <h3>New pieces from your favorite artists</h3>
            <p>
              Proven fits, not algorithm slop — {BRANDS.length} brands, {CATALOG.length} live pieces, straight from the source.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

const DEMO_STEPS = [
  {
    kicker: 'STEP 01 — SNAP',
    title: 'Take a photo of yourself in a fit',
    step: 'Photo of yourself',
  },
  {
    kicker: 'STEP 02 — ICONS',
    title: 'Pick who inspires you',
    step: 'Choose your style',
  },
  {
    kicker: 'STEP 03 — SIZES',
    title: 'Your sizes, computed per brand',
    step: 'Sizes',
  },
  {
    kicker: 'STEP 04 — PORTFOLIO',
    title: 'A portfolio of fits built for you',
    step: 'Your fits',
  },
  {
    kicker: 'STEP 05 — WARDROBE',
    title: '“carhartt jeans, 32” → added',
    step: 'Your wardrobe',
  },
]

/** Slide-through wireframe of the whole product inside a phone. */
function PhoneDemo({ go }: { go: (v: View) => void }) {
  const [i, setI] = useState(0)
  // One real product per category for the mini-closet mock.
  const closetPicks = ['pants', 'top', 'shoes', 'shirt', 'accessory', 'knit']
    .map((c) => CATALOG.find((p) => p.category === c))
    .filter((p): p is (typeof CATALOG)[number] => !!p)
  const next = () => setI((x) => (x + 1) % DEMO_STEPS.length)
  const d = DEMO_STEPS[i]

  return (
    <div className="demo">
      <div>
        <h2 className="demo__head">
          A NEW WAY
          <br />
          TO <em>dress.</em>
        </h2>
        <div className="demo__steps">
          {DEMO_STEPS.map((st, k) => (
            <button key={st.kicker} className="demo__step" aria-current={k === i} onClick={() => setI(k)}>
              <b>{String(k + 1).padStart(2, '0')}</b>
              {st.step}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 10, marginTop: 24 }}>
          <button className="btn btn--primary" onClick={() => go('onboarding')}>
            Try it for real <Arrow />
          </button>
          <button className="btn btn--quiet" onClick={next}>
            Next step
          </button>
        </div>
      </div>

      <button className="phone" onClick={next} aria-label="Next step">
        <div className="phone__screen" key={i}>
          <span className="phone__kicker">{d.kicker}</span>
          <span className="phone__title">{d.title}</span>

          {i === 0 && (
            <div className="phone__mock phone__mock--snap">
              <img src="/demo/snap.jpg" alt="" loading="lazy" />
              <span className="phone__scan" />
              <div className="phone__row phone__row--float">
                <span>FULL BODY DETECTED</span>
                <b className="ok">✓</b>
              </div>
            </div>
          )}

          {i === 1 && (
            <div className="phone__mock">
              {[
                ['Poole Party', '92%'],
                ['SGA', '87%'],
                ['Tyler, the Creator', '74%'],
                ['V (BTS)', '61%'],
              ].map(([who, pct]) => (
                <div className="phone__row" key={who}>
                  <span>{who}</span>
                  <b className="ok">{pct}</b>
                </div>
              ))}
            </div>
          )}

          {i === 2 && (
            <div className="phone__mock">
              {[
                ['TOPS', 'M'],
                ['SHIRTS', 'M / 15.5'],
                ['PANTS', '32 × 32'],
                ['SHOES', 'US 10.5'],
                ['STÜSSY RUNS BOXY', 'SIZE S'],
              ].map(([k, v]) => (
                <div className="phone__row" key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          )}

          {i === 3 && (
            <div className="phone__mock">
              <div className="phone__grid">
                <img src="/fits/clarkson-tunnel.jpg" alt="" />
                <img src="/fits/sga-arrival.jpg" alt="" />
                <img src="/fits/tyler-prep.jpg" alt="" />
                <img src="/fits/v-airport.jpg" alt="" />
              </div>
            </div>
          )}

          {i === 4 && (
            <div className="phone__mock">
              <div className="phone__row" style={{ borderStyle: 'dashed' }}>
                <span>carhartt jeans, 32…</span>
                <b className="ok">✓ ADDED</b>
              </div>
              <div className="phone__closet">
                {closetPicks.map((p, k) => (
                  <div className="phone__item" key={p.id}>
                    <img src={p.image} alt="" loading="lazy" />
                    <span>{['32×32', 'M', 'US 10.5', 'M', 'OS', 'S'][k]}</span>
                  </div>
                ))}
              </div>
              <div className="phone__row">
                <span>23 PIECES CATALOGUED</span>
                <b className="ok">SGA MATCH 90%</b>
              </div>
            </div>
          )}
        </div>

        <div className="phone__dots">
          {DEMO_STEPS.map((_, k) => (
            <i key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
      </button>
    </div>
  )
}

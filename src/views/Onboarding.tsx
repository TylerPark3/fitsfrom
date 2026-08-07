import { useState } from 'react'
import { useStore } from '../lib/store'
import { STYLES, TIERS, SEASONS, type Gender, type Season, type StyleId, type Tier } from '../data/taxonomy'
import { estimateFromBody } from '../lib/sizing'
import { FITS } from '../data/fits'
import { CATALOG } from '../data/catalog'

/** Example image per style: a real fit photo where we have one, else a catalog piece. */
const STYLE_IMG: Record<string, string> = {
  ivy: '/fits/tyler-prep.jpg',
  street: '/fits/clarkson-mavs.jpg',
  minimal: '/fits/sga-arrival.jpg',
  skate: '/fits/bieber-drew.jpg',
  athletic: '/fits/lebron-quiet.jpg',
  gorp: '/styles/gorp.jpg',
  japanese: '/styles/japanese.jpg',
}

/** Adjacent lanes — surfaced after each pick so taste can branch. */
const RELATED: Record<string, string[]> = {
  ivy: ['minimal', 'japanese'],
  workwear: ['skate', 'gorp'],
  minimal: ['ivy', 'japanese'],
  gorp: ['athletic', 'workwear'],
  street: ['skate', 'athletic'],
  japanese: ['minimal', 'workwear'],
  skate: ['street', 'workwear'],
  athletic: ['street', 'gorp'],
}

function styleImg(id: string): string {
  if (STYLE_IMG[id]) return STYLE_IMG[id]
  const p = CATALOG.find((x) => x.styles.includes(id as never) && x.category === 'outer')
    ?? CATALOG.find((x) => x.styles.includes(id as never))
  return p?.image ?? ''
}
import { topTwin } from '../lib/twin'
import { Arrow, CheckInk } from '../components/Icons'
import { PhotoStage } from '../components/PhotoStage'

const TOTAL = 4

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { profile, setProfile } = useStore()
  const [step, setStep] = useState(0)
  const twin = topTwin(profile.styles)

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const canAdvance =
    step === 0 ? profile.styles.length > 0 : step === 2 ? profile.tiers.length > 0 : true

  const next = () => {
    if (step === TOTAL - 1) {
      setProfile({ onboarded: true })
      onDone()
      return
    }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="wrap ob">
      <div className="ob__card">
        <div className="ob__prog" aria-label={`Step ${step + 1} of ${TOTAL}`}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <i key={i} className={i <= step ? 'on' : ''} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2>
              Which corners of fashion do you <em>actually</em> live in?
            </h2>
            <p className="ob__sub">Pick two or three. Honest beats aspirational.</p>
            <div className="tiles">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  className="tile stile"
                  aria-pressed={profile.styles.includes(s.id)}
                  onClick={() => setProfile({ styles: toggle<StyleId>(profile.styles, s.id) })}
                >
                  <span className="tile__tick">
                    <CheckInk size={15} />
                  </span>
                  <h4>{s.label}</h4>
                  <div className="stile__row">
                    <img src={styleImg(s.id)} alt="" loading="lazy" />
                    <p>{s.blurb}</p>
                  </div>
                  <small className="stile__celebs">{s.celebs}</small>
                </button>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 22 }}>
              <h3>Who do you want to dress like?</h3>
              <p>Pick your icons — your wardrobe gets scored against them.</p>
              <div className="chips">
                {Array.from(new Set(FITS.map((f) => f.who))).map((who) => (
                  <button
                    key={who}
                    className="chip"
                    aria-pressed={profile.icons.includes(who)}
                    onClick={() =>
                      setProfile({
                        icons: profile.icons.includes(who)
                          ? profile.icons.filter((x) => x !== who)
                          : [...profile.icons, who],
                      })
                    }
                  >
                    {who}
                  </button>
                ))}
              </div>
            </div>
            {profile.styles.length > 0 && (() => {
              const suggested = Array.from(
                new Set(profile.styles.flatMap((st) => RELATED[st] ?? [])),
              ).filter((st) => !profile.styles.includes(st as StyleId))
              return suggested.length ? (
                <div className="row" style={{ gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                  <span className="tiny">Goes with:</span>
                  {suggested.map((st) => (
                    <button
                      key={st}
                      className="chip chip--sm"
                      onClick={() =>
                        setProfile({ styles: [...profile.styles, st as StyleId] })
                      }
                    >
                      + {STYLES.find((x) => x.id === st)?.label}
                    </button>
                  ))}
                </div>
              ) : null
            })()}
            {twin && (
              <p className="twinline serif">
                You dress like <em>{twin.fit.who}</em> — {twin.pct}% style match
              </p>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2>
              Now your <em>actual</em> proportions.
            </h2>
            <p className="ob__sub">Height and weight estimate the rest. A tape measure sharpens it.</p>
            <BodyStep />
          </>
        )}

        {step === 2 && (
          <>
            <h2>
              What can you <em>actually</em> spend?
            </h2>
            <p className="ob__sub">Your ceiling for one good piece. Nothing above it gets shown.</p>

            <div className="panel">
              <div className="field">
                <div className="field__label">
                  <span>Ceiling for a single piece</span>
                  <b className="slider__val">
                    ${profile.budgetMax}
                    {profile.budgetMax >= 600 ? '+' : ''}
                  </b>
                </div>
                <input
                  type="range"
                  min={40}
                  max={600}
                  step={10}
                  value={profile.budgetMax}
                  onChange={(e) => setProfile({ budgetMax: +e.target.value })}
                />
                <p className="field__hint">
                  Most of the catalogue sits between $45 and $250. Under $120 still leaves you 20+
                  genuinely good options.
                </p>
              </div>
            </div>

            <div className="panel">
              <h3>Quality floor</h3>
              <p>How much construction do you need? Pick every tier you’d buy from.</p>
              <div className="tiles">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    className="tile"
                    aria-pressed={profile.tiers.includes(t.id)}
                    onClick={() => setProfile({ tiers: toggle<Tier>(profile.tiers, t.id) })}
                  >
                    <span className="tile__tick">
                      <CheckInk size={15} />
                    </span>
                    <h4>
                      {t.label} <span style={{ opacity: 0.5, fontWeight: 400 }}>· {t.band}</span>
                    </h4>
                    <p>{t.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>
              Last thing — <em>when</em> and <em>who</em>.
            </h2>
            <p className="ob__sub">Flip these any time from the filters.</p>

            <div className="panel">
              <h3>Dressing for</h3>
              <p>Pick the seasons you’re shopping for right now.</p>
              <div className="chips">
                {SEASONS.map((s) => (
                  <button
                    key={s.id}
                    className="chip"
                    aria-pressed={profile.seasons.includes(s.id)}
                    onClick={() => setProfile({ seasons: toggle<Season>(profile.seasons, s.id) })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Show me things cut for</h3>
              <p>
                Most of the catalogue is unisex and always shows. This just controls the gendered
                cuts.
              </p>
              <div className="chips">
                {(
                  [
                    ['men', 'Menswear'],
                    ['women', 'Womenswear'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    className="chip"
                    aria-pressed={profile.genders.includes(id)}
                    onClick={() => setProfile({ genders: toggle<Gender>(profile.genders, id) })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>What should we call you?</h3>
              <p>Optional. Stored on this device only.</p>
              <input
                className="text-input"
                placeholder="First name"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                style={{ maxWidth: 280 }}
              />
            </div>
          </>
        )}

        <div className="ob__foot">
          {step > 0 && (
            <button className="btn btn--quiet" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          <span className="tiny">
            Step {step + 1} of {TOTAL}
          </span>
          <button className="btn btn--primary" disabled={!canAdvance} onClick={next}>
            {step === TOTAL - 1 ? 'See my edit' : 'Continue'} <Arrow />
          </button>
        </div>
      </div>
    </div>
  )
}

function BodyStep() {
  const { profile, setProfile } = useStore()

  const onHeightWeight = (patch: { height?: number; weight?: number }) => {
    const height = patch.height ?? profile.height
    const weight = patch.weight ?? profile.weight
    setProfile({ height, weight, ...estimateFromBody(height, weight) })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: 36 }}>
      <PhotoStage compact />
      <div className="panel" style={{ margin: 0 }}>
        <Slider
          label="Height"
          value={profile.height}
          min={58}
          max={82}
          step={1}
          format={(v) => `${Math.floor(v / 12)}′ ${v % 12}″`}
          onChange={(height) => onHeightWeight({ height })}
        />
        <Slider
          label="Weight"
          value={profile.weight}
          min={95}
          max={300}
          step={1}
          format={(v) => `${v} lb`}
          onChange={(weight) => onHeightWeight({ weight })}
        />
        <hr className="rule" style={{ margin: '4px 0 20px' }} />
        <Slider
          label="Chest"
          value={profile.chest}
          min={30}
          max={56}
          step={0.5}
          format={(v) => `${v}″`}
          hint="Around the fullest part, under the arms."
          onChange={(chest) => setProfile({ chest })}
        />
        <Slider
          label="Waist"
          value={profile.waist}
          min={26}
          max={48}
          step={0.5}
          format={(v) => `${v}″`}
          hint="Where your pants actually sit, not your natural waist."
          onChange={(waist) => setProfile({ waist })}
        />
        <Slider
          label="Inseam"
          value={profile.inseam}
          min={26}
          max={38}
          step={1}
          format={(v) => `${v}″`}
          onChange={(inseam) => setProfile({ inseam })}
        />
        <Slider
          label="Shoe (US)"
          value={profile.shoe}
          min={5}
          max={16}
          step={0.5}
          format={(v) => `${v}`}
          onChange={(shoe) => setProfile({ shoe })}
        />

        <div className="field" style={{ marginBottom: 0 }}>
          <div className="field__label">
            <span>How you like things to fit</span>
          </div>
          <div className="chips" style={{ marginTop: 6 }}>
            {(['slim', 'true', 'relaxed'] as const).map((f) => (
              <button
                key={f}
                className="chip"
                aria-pressed={profile.fitPreference === f}
                onClick={() => setProfile({ fitPreference: f })}
              >
                {f === 'true' ? 'True to size' : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  hint?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mrow">
      <div className="mrow__top">
        <span className="mrow__label">{label}</span>
        <b className="mrow__val">{format(value)}</b>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        aria-label={label}
      />
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}

import { useState } from 'react'
import type { View } from '../App'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'
import { estimateFromBody, recommendSize } from '../lib/sizing'
import { PhotoStage } from '../components/PhotoStage'
import { InterestPicker } from '../components/InterestPicker'
import { iconScores } from '../lib/twin'
import { Slider } from './Onboarding'
import { Arrow } from '../components/Icons'
import { Type } from '../components/Type'

const RANKS: [number, string][] = [
  [0, 'ROOKIE'],
  [25, 'STARTER'],
  [45, 'SIXTH MAN'],
  [65, 'ALL-STAR'],
  [85, 'MVP'],
]

export function AvatarView({ go }: { go: (v: View) => void }) {
  const { profile, setProfile, reset, wardrobe, customs, saved, outfits } = useStore()
  const [tagDraft, setTagDraft] = useState('')

  // Style DNA completeness — every add moves the meter.
  const checks: [string, boolean, number][] = [
    ['Photo scanned', !!profile.photo, 15],
    ['Styles picked', profile.styles.length > 0, 12],
    ['Icons followed', profile.icons.length > 0, 12],
    ['Brands picked', profile.brands.length > 0, 10],
    ['Teams followed', profile.teams.length > 0, 8],
    ['3+ closet pieces', wardrobe.length + customs.length >= 3, 15],
    ['A planned fit', outfits.length > 0, 10],
    ['5+ saves', saved.length >= 5, 8],
    ['3+ tags', profile.tags.length >= 3, 10],
  ]
  const dna = checks.reduce((n, [, ok, w]) => n + (ok ? w : 0), 0)
  const rank = [...RANKS].reverse().find(([min]) => dna >= min)?.[1] ?? 'ROOKIE'
  const next = checks.find(([, ok]) => !ok)

  const onHeightWeight = (patch: { height?: number; weight?: number }) => {
    const height = patch.height ?? profile.height
    const weight = patch.weight ?? profile.weight
    setProfile({ height, weight, ...estimateFromBody(height, weight) })
  }

  // One representative piece per sizing system so the numbers feel real.
  const cards = [
    { label: 'Tops', product: CATALOG.find((p) => p.sizeSystem === 'alpha' && p.category === 'top') },
    { label: 'Shirts', product: CATALOG.find((p) => p.sizeSystem === 'alpha' && p.category === 'shirt') },
    { label: 'Pants', product: CATALOG.find((p) => p.sizeSystem === 'waist') },
    { label: 'Shoes', product: CATALOG.find((p) => p.sizeSystem === 'shoe') },
  ]
    .filter((c) => c.product)
    .map((c) => ({ ...c, rec: recommendSize(c.product!, profile) }))

  return (
    <div className="wrap">
      <div className="pagehead">
        <span className="eyebrow"><Type text="AVATAR — MEASUREMENTS ON FILE" speed={18} /></span>
        <h2>Your fit, on file</h2>
        <p>Drag a slider — every size on the site updates. The photo never leaves this browser.</p>
      </div>

      <div className="av">
        <PhotoStage />

        <div>
          <div className="panel dna">
            <div className="spread">
              <h3>Style DNA</h3>
              <span className="dna__rank">{rank}</span>
            </div>
            <div className="meter" style={{ margin: '14px 0 8px' }}>
              <i style={{ width: `${dna}%` }} />
            </div>
            <div className="spread">
              <span className="tiny">{dna}% built</span>
              {next && <span className="tiny" style={{ color: 'var(--red)' }}>next: {next[0].toLowerCase()} +{next[2]}%</span>}
            </div>
          </div>

          <div className="panel">
            <h3>Your sizes right now</h3>
            <div className="sizes" style={{ marginTop: 12 }}>
              {cards.map((c) => (
                <div className="sizes__cell" key={c.label}>
                  <div className="eyebrow">{c.label}</div>
                  <b>{c.rec.label}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Body</h3>
            <p>Height and weight seed an estimate; the tape-measure numbers sharpen it.</p>
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
              hint="Fullest part, under the arms, tape level."
              onChange={(chest) => setProfile({ chest })}
            />
            <Slider
              label="Waist"
              value={profile.waist}
              min={26}
              max={48}
              step={0.5}
              format={(v) => `${v}″`}
              hint="Where your pants sit — check a pair that fits and use that number."
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

          {profile.styles.length > 0 && (
            <div className="panel">
              <h3>Icon match</h3>
              <p>Style DNA, budget, shared brands, closet overlap — receipts included.</p>
              <div className="speclist" style={{ marginTop: 0 }}>
                {iconScores(profile, wardrobe, customs)
                  .filter((t) => profile.icons.length === 0 || profile.icons.includes(t.who))
                  .slice(0, 6)
                  .map((t) => (
                    <div className="spec" key={t.who} style={{ alignItems: 'baseline' }}>
                      <dt style={{ color: 'var(--ink)' }}>
                        {t.who}
                        <span className="iconmatch__bits">{t.bits}</span>
                      </dt>
                      <dd>
                        <b style={{ fontWeight: 600, color: t.pct >= 80 ? 'var(--good)' : 'var(--ink)' }}>
                          {t.pct}%
                        </b>
                      </dd>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="panel">
            <h3>Into</h3>
            <p>Tap what you’re about — it feeds every score.</p>
            <InterestPicker />
            <div className="room__input" style={{ margin: '16px 0 12px' }}>
              <input
                className="text-input"
                placeholder="Add your own — “Larry June”, “F1”…"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagDraft.trim()) {
                    setProfile({ tags: [...profile.tags, tagDraft.trim()] })
                    setTagDraft('')
                  }
                }}
              />
            </div>
            {profile.tags.length > 0 && (
              <div className="chips">
                {profile.tags.map((t) => (
                  <button
                    key={t}
                    className="chip chip--sm"
                    aria-pressed
                    onClick={() => setProfile({ tags: profile.tags.filter((x) => x !== t) })}
                    title="Remove"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => go('discover')}>
              See what fits <Arrow />
            </button>
            <button className="btn btn--ghost" onClick={() => go('onboarding')}>
              Redo taste & budget
            </button>
            <button
              className="btn btn--quiet"
              onClick={() => {
                if (confirm('Clear your profile, wardrobe and saved items on this device?'))
                  reset()
              }}
            >
              Clear everything
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

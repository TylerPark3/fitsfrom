import { useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'
import { estimateFromBody, recommendSize } from '../lib/sizing'
import { analyzeBody } from '../lib/pose'
import { fileToDataUrl } from '../lib/img'
import { iconScores } from '../lib/twin'
import { AvatarRig } from '../components/AvatarRig'
import { Slider } from './Onboarding'
import { Arrow, Upload, Trash } from '../components/Icons'

const INTO: { id: string; label: string; kind: 'team' | 'tag'; options: string[] }[] = [
  { id: 'nba', label: 'NBA', kind: 'team', options: ['Lakers', 'Thunder', 'Mavs', 'Wizards', 'Suns', 'Rockets', 'Warriors', 'Knicks', 'Celtics', 'Bulls'] },
  { id: 'mlb', label: 'MLB', kind: 'tag', options: ['Yankees', 'Dodgers', 'Mets', 'Red Sox', 'Braves', 'Giants'] },
  { id: 'fc', label: 'Football', kind: 'tag', options: ['Barcelona', 'Real Madrid', 'Arsenal', 'Inter Miami', 'PSG'] },
  { id: 'music', label: 'Music', kind: 'tag', options: ['Hip-hop', 'Pop & R&B', 'K-culture'] },
  { id: 'culture', label: 'Culture', kind: 'tag', options: ['Sneakers', 'Thrifting', 'Gaming', 'Film & TV', 'Fragrance', 'Outdoors', 'Tokyo street'] },
]

/** Posters exist for these — picking them decorates the room. */
const HAS_ART = new Set(['Yankees', 'Dodgers', 'Lakers', 'Rockets'])

const RANKS: [number, string][] = [
  [0, 'ROOKIE'],
  [25, 'STARTER'],
  [45, 'SIXTH MAN'],
  [65, 'ALL-STAR'],
  [85, 'MVP'],
]

export function AvatarView({ go }: { go: (v: View) => void }) {
  const { profile, setProfile, reset, wardrobe, customs, saved, outfits, toast } = useStore()
  const [tagDraft, setTagDraft] = useState('')
  const [intoOpen, setIntoOpen] = useState<string | null>('nba')
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onHeightWeight = (patch: { height?: number; weight?: number }) => {
    const height = patch.height ?? profile.height
    const weight = patch.weight ?? profile.weight
    setProfile({ height, weight, ...estimateFromBody(height, weight) })
  }

  const accept = async (file: File | undefined) => {
    if (!file?.type.startsWith('image/')) return
    setBusy(true)
    try {
      const raw = await fileToDataUrl(file, 1400)
      setProfile({ photo: raw, pose: null })
      void analyzeBody(raw).then((r) => {
        if (r)
          setProfile({
            photo: r.photo,
            pose: r.pose,
            ...(r.face ? { faceX: r.face.x, faceY: r.face.y, faceZoom: Number(r.face.zoom.toFixed(1)) } : {}),
          })
      })
      toast('Scan read — face auto-centered')
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    { label: 'Tops', product: CATALOG.find((p) => p.sizeSystem === 'alpha' && p.category === 'top') },
    { label: 'Shirts', product: CATALOG.find((p) => p.sizeSystem === 'alpha' && p.category === 'shirt') },
    { label: 'Pants', product: CATALOG.find((p) => p.sizeSystem === 'waist') },
    { label: 'Shoes', product: CATALOG.find((p) => p.sizeSystem === 'shoe') },
  ]
    .filter((c) => c.product)
    .map((c) => ({ ...c, rec: recommendSize(c.product!, profile) }))

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

  return (
    <div className="wrap">
      <div className="pagehead">
        <span className="eyebrow">MY PLAYER — BUILD YOUR AVATAR</span>
        <h2>Your build</h2>
      </div>

      <div className="av2k">
        {/* LEFT — body attributes */}
        <div>
          <div className="panel">
            <h3>Body</h3>
            <Slider label="Height" value={profile.height} min={58} max={82} step={1}
              format={(v) => `${Math.floor(v / 12)}′ ${v % 12}″`} onChange={(height) => onHeightWeight({ height })} />
            <Slider label="Weight" value={profile.weight} min={95} max={300} step={1}
              format={(v) => `${v} lb`} onChange={(weight) => onHeightWeight({ weight })} />
            <hr className="rule" style={{ margin: '4px 0 18px' }} />
            <Slider label="Chest" value={profile.chest} min={30} max={56} step={0.5}
              format={(v) => `${v}″`} onChange={(chest) => setProfile({ chest })} />
            <Slider label="Waist" value={profile.waist} min={26} max={48} step={0.5}
              format={(v) => `${v}″`} onChange={(waist) => setProfile({ waist })} />
            <Slider label="Inseam" value={profile.inseam} min={26} max={38} step={1}
              format={(v) => `${v}″`} onChange={(inseam) => setProfile({ inseam })} />
            <Slider label="Shoe (US)" value={profile.shoe} min={5} max={16} step={0.5}
              format={(v) => `${v}`} onChange={(shoe) => setProfile({ shoe })} />
            <div className="chips" style={{ marginTop: 4 }}>
              {(['slim', 'true', 'relaxed'] as const).map((f) => (
                <button key={f} className="chip chip--sm" aria-pressed={profile.fitPreference === f}
                  onClick={() => setProfile({ fitPreference: f })}>
                  {f === 'true' ? 'True to size' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Face</h3>
            <p>Center yourself in the circle — like setting a profile picture.</p>
            <div className="facewrap">
              <div
                className="facecrop"
                style={
                  profile.photo
                    ? {
                        backgroundImage: `url(${profile.photo})`,
                        backgroundSize: `${profile.faceZoom * 100}%`,
                        backgroundPosition: `${profile.faceX}% ${profile.faceY}%`,
                      }
                    : undefined
                }
              >
                {!profile.photo && (busy ? '…' : '?')}
              </div>
              <div style={{ flex: 1 }}>
                <Slider label="Zoom" value={profile.faceZoom} min={1.2} max={5} step={0.1}
                  format={(v) => `${v.toFixed(1)}×`} onChange={(faceZoom) => setProfile({ faceZoom })} />
                <Slider label="Left / right" value={profile.faceX} min={0} max={100} step={1}
                  format={(v) => `${v}%`} onChange={(faceX) => setProfile({ faceX })} />
                <Slider label="Up / down" value={profile.faceY} min={0} max={100} step={1}
                  format={(v) => `${v}%`} onChange={(faceY) => setProfile({ faceY })} />
              </div>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>
                <Upload size={14} /> {profile.photo ? 'Replace scan' : 'Upload scan'}
              </button>
              {profile.photo && (
                <button className="btn btn--quiet btn--sm" onClick={() => setProfile({ photo: null, pose: null })}>
                  <Trash /> Remove
                </button>
              )}
              <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void accept(e.target.files?.[0])} />
            </div>
          </div>
        </div>

        {/* CENTER — the build + the Into module underneath */}
        <div className="stage2k">
          <AvatarRig />
          <div className="into">
            <div className="spread" style={{ marginBottom: 10 }}>
              <span className="eyebrow">Into</span>
              <span className="tiny">Pick a lane — teams with a ✦ hang art in your room</span>
            </div>
            <div className="chips">
              {INTO.map((cat) => (
                <button
                  key={cat.id}
                  className="chip"
                  aria-pressed={intoOpen === cat.id}
                  onClick={() => setIntoOpen(intoOpen === cat.id ? null : cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {intoOpen && (
              <div className="chips into__options">
                {INTO.find((c) => c.id === intoOpen)!.options.map((opt) => {
                  const cat = INTO.find((c) => c.id === intoOpen)!
                  const list = cat.kind === 'team' ? profile.teams : profile.tags
                  const on = list.includes(opt)
                  return (
                    <button
                      key={opt}
                      className="chip chip--sm"
                      aria-pressed={on}
                      onClick={() => {
                        const next = on ? list.filter((x) => x !== opt) : [...list, opt]
                        setProfile(cat.kind === 'team' ? { teams: next } : { tags: next })
                        if (!on && HAS_ART.has(opt)) toast(`${opt} — poster hung in your room`)
                      }}
                    >
                      {HAS_ART.has(opt) && '✦ '}
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="room__input" style={{ marginTop: 12, maxWidth: 380 }}>
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
          </div>
        </div>

        {/* RIGHT — ratings */}
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
            <h3>Your sizes</h3>
            <div className="sizes" style={{ marginTop: 12 }}>
              {cards.map((c) => (
                <div className="sizes__cell" key={c.label}>
                  <div className="eyebrow">{c.label}</div>
                  <b>{c.rec.label}</b>
                </div>
              ))}
            </div>
          </div>

          {profile.styles.length > 0 && (
            <div className="panel">
              <h3>Icon match</h3>
              <div className="speclist" style={{ marginTop: 8 }}>
                {iconScores(profile, wardrobe, customs)
                  .filter((t) => profile.icons.length === 0 || profile.icons.includes(t.who))
                  .slice(0, 5)
                  .map((t) => (
                    <div className="spec" key={t.who} style={{ alignItems: 'baseline' }}>
                      <dt style={{ color: 'var(--ink)' }}>
                        {t.who}
                        <span className="iconmatch__bits">{t.bits}</span>
                      </dt>
                      <dd>
                        <b style={{ fontWeight: 600, color: t.pct >= 80 ? 'var(--good)' : 'var(--ink)' }}>{t.pct}%</b>
                      </dd>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => go('discover')}>
              See what fits <Arrow />
            </button>
            <button className="btn btn--quiet" onClick={() => {
              if (confirm('Clear your profile, wardrobe and saved items on this device?')) reset()
            }}>
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

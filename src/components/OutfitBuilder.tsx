import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import {
  alternatives,
  complete,
  hydrate,
  profileToStyle,
  SLOTS,
  type Slot,
} from '../lib/wardrobe/builder'
import type { Occasion, Weather } from '../lib/wardrobe/types'
import { FitScore } from './FitScore'
import { Plus, Trash } from './Icons'

const SLOT_LABEL: Record<Slot, string> = {
  outer: 'Outerwear',
  top: 'Top',
  shirt: 'Shirt',
  knit: 'Knit',
  pants: 'Bottoms',
  shoes: 'Shoes',
  accessory: 'Accessory',
}

const OCCASIONS: Occasion[] = ['school', 'casual', 'date', 'party', 'concert', 'gameday', 'travel', 'formal']
const WEATHERS: Weather[] = ['hot', 'warm', 'mild', 'cold', 'freezing', 'rain']

/** Build a fit piece by piece: lock what you like, let the engine fill the rest. */
export function OutfitBuilder() {
  const { wardrobe, customs, profile, feedback, outfits, createOutfit, toggleOutfitRef, pushFeedback, toast } =
    useStore()

  const [locked, setLocked] = useState<Partial<Record<Slot, string>>>({})
  const [occasion, setOccasion] = useState<Occasion>('casual')
  const [weather, setWeather] = useState<Weather>('mild')
  const [seed, setSeed] = useState(0)
  const [openSlot, setOpenSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')

  const pool = useMemo(() => hydrate(wardrobe, customs), [wardrobe, customs])
  const ctx = useMemo(
    () => ({
      profile,
      styleProfile: profileToStyle(profile),
      signals: (feedback ?? []).map((f) => ({ kind: f.kind as never, itemIds: f.itemIds, at: f.at })),
      occasion,
      weather,
    }),
    [profile, feedback, occasion, weather],
  )

  const built = useMemo(() => complete(pool, { locked, ctx, seed }), [pool, locked, ctx, seed])
  const alts = useMemo(
    () => (openSlot ? alternatives(pool, built, openSlot, ctx) : []),
    [openSlot, pool, built, ctx],
  )
  const byId = useMemo(() => new Map(pool.map((i) => [i.id, i])), [pool])

  if (pool.length < 2) {
    return (
      <div className="section">
        <div className="section__head">
          <h3>Outfit builder</h3>
        </div>
        <p className="tiny">Add a few pieces to your closet and the builder can start assembling fits.</p>
      </div>
    )
  }

  const save = () => {
    const label = name.trim() || `${occasion} fit ${outfits.length + 1}`
    const id = createOutfit(label)
    built.items.forEach((i) => toggleOutfitRef(id, i.id))
    setName('')
    toast(`Saved — ${label}`)
  }

  return (
    <div className="section">
      <div className="section__head">
        <h3>Outfit builder</h3>
        <button className="btn btn--ghost btn--sm" onClick={() => setSeed((n) => n + 1)}>
          ↻ Complete it differently
        </button>
      </div>

      <div className="builder__ctx">
        <label className="builder__ctxrow">
          <span className="eyebrow">Occasion</span>
          <select className="select" value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion)}>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {o[0].toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="builder__ctxrow">
          <span className="eyebrow">Weather</span>
          <select className="select" value={weather} onChange={(e) => setWeather(e.target.value as Weather)}>
            {WEATHERS.map((w) => (
              <option key={w} value={w}>
                {w[0].toUpperCase() + w.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="builder">
        <div className="builder__canvas">
          {SLOTS.map((slot) => {
            const id = built.slots[slot]
            const item = id ? byId.get(id) : null
            const isLocked = !!locked[slot]
            return (
              <div className={`bslot${isLocked ? ' is-locked' : ''}`} key={slot}>
                <button
                  className="bslot__frame"
                  onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                  aria-label={`Change ${SLOT_LABEL[slot]}`}
                >
                  {item?.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  ) : item ? (
                    <span className="bslot__mono">{item.name[0]?.toUpperCase()}</span>
                  ) : (
                    <span className="bslot__empty">
                      <Plus size={16} />
                    </span>
                  )}
                </button>
                <div className="bslot__meta">
                  <span className="bslot__label">{SLOT_LABEL[slot]}</span>
                  {item && (
                    <button
                      className="bslot__lock"
                      aria-pressed={isLocked}
                      aria-label={isLocked ? 'Unlock this slot' : 'Lock this piece'}
                      onClick={() =>
                        setLocked((l) => {
                          const next = { ...l }
                          if (isLocked) delete next[slot]
                          else next[slot] = id!
                          return next
                        })
                      }
                    >
                      {isLocked ? '🔒' : '🔓'}
                    </button>
                  )}
                </div>
                {item && <span className="bslot__name tiny">{item.name}</span>}
              </div>
            )
          })}
        </div>

        <div className="builder__side">
          <FitScore evaluation={built.evaluation} />

          {built.gaps.length > 0 && (
            <p className="tiny" style={{ marginTop: 10, color: 'var(--red)' }}>
              Still missing: {built.gaps.map((g) => SLOT_LABEL[g]).join(' · ')}
            </p>
          )}

          <div className="room__input" style={{ marginTop: 14 }}>
            <input
              className="text-input"
              placeholder={`Name it — “${occasion} fit”`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <button className="btn btn--primary" onClick={save}>
              Save
            </button>
          </div>

          <div className="chips" style={{ marginTop: 12 }}>
            <button
              className="chip chip--sm"
              onClick={() => {
                pushFeedback('wear', built.items.map((i) => i.id))
                toast('Marked as worn')
              }}
            >
              Wore it
            </button>
            {(['not-my-style', 'too-loud', 'too-basic', 'wrong-silhouette'] as const).map((k) => (
              <button
                key={k}
                className="chip chip--sm"
                onClick={() => {
                  pushFeedback(k, built.items.map((i) => i.id))
                  setSeed((n) => n + 1)
                  toast('Noted — the next fit adjusts')
                }}
              >
                {k.replace(/-/g, ' ')}
              </button>
            ))}
            {Object.keys(locked).length > 0 && (
              <button className="chip chip--sm" onClick={() => setLocked({})}>
                <Trash size={12} /> Unlock all
              </button>
            )}
          </div>
        </div>
      </div>

      {openSlot && (
        <div className="builder__alts">
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            Swap {SLOT_LABEL[openSlot]} — scored against everything else in the fit
          </p>
          <div className="pickrow">
            {alts.length === 0 && <p className="tiny">Nothing else in that category yet.</p>}
            {alts.map(({ item, score }) => (
              <button
                key={item.id}
                className="pick"
                onClick={() => {
                  setLocked((l) => ({ ...l, [openSlot]: item.id }))
                  setOpenSlot(null)
                }}
                title={`${item.name} — would score ${score}`}
              >
                {item.image ? <img src={item.image} alt={item.name} /> : <span className="ctile__mono">{item.name[0]}</span>}
                <span className="pick__score">{score}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

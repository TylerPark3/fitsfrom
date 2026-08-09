import { useMemo, useState } from 'react'
import { CutoutImg } from './CutoutImg'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'

/** Artists you follow hang on the wall the same way teams do. */
const ARTIST_POSTERS: Record<string, string> = {
  'Pretty Flacko': '/fits/flacko-money.jpg',
  'Tyler, the Creator': '/fits/tyler-prep.jpg',
  Iceman: '/fits/drake-night.jpg',
  Bieber: '/fits/bieber-night.jpg',
  'V (BTS)': '/fits/v-airport.jpg',
  Ye: '/fits/ye-red.jpg',
  'Cole World': '/fits/jcole-dreamer.jpg',
  Carti: '/fits/carti-studio.jpg',
}

const TEAM_POSTERS: Record<string, string> = {
  Thunder: '/room/poster-thunder.jpg',
  Wizards: '/room/poster-wizards.jpg',
  Warriors: '/room/poster-warriors.jpg',
  Knicks: '/room/poster-knicks.jpg',
  Rockets: '/room/poster-rockets.jpg',
  Lakers: '/room/poster-lakers.jpg',
  Suns: '/room/poster-suns.jpg',
  Blazers: '/room/poster-blazers.jpg',
  Bucks: '/room/poster-bucks.jpg',
  Mavs: '/room/poster-mavs.jpg',
  Clippers: '/room/poster-clippers.jpg',
  Sixers: '/room/poster-sixers.jpg',
  Magic: '/room/poster-magic.jpg',
  Hornets: '/room/poster-hornets.jpg',
  Jazz: '/room/poster-jazz.jpg',
  Celtics: '/room/poster-celtics.jpg',
  Nets: '/room/poster-nets.jpg',
  Nuggets: '/room/poster-nuggets.jpg',
  Grizzlies: '/room/poster-grizzlies.jpg',
}

/**
 * The stack, top to bottom. No figure underneath — a wooden form was always
 * going to fight the clothes for attention, and the clothes are the point.
 * Each piece keeps its own proportions; `scale` is how tall it sits relative
 * to the others, so a trouser reads longer than a cap without being cropped.
 */
const SLOTS: {
  key: string
  label: string
  scale: number
  match: (cat: string, sil?: string) => boolean
}[] = [
  { key: 'hat', label: 'Hat', scale: 0.4, match: (c) => c === 'accessory' },
  {
    key: 'top',
    label: 'Top',
    scale: 1,
    match: (c) => ['top', 'shirt', 'knit', 'outer'].includes(c),
  },
  { key: 'bottom', label: 'Bottom', scale: 1.25, match: (c) => c === 'pants' },
  { key: 'shoes', label: 'Shoes', scale: 0.46, match: (c) => c === 'shoes' },
]

/** Accessories that aren't hats hang beside the figure rather than on it. */
const ACC_SLOT = { key: 'acc', label: 'Accessory' }

interface Piece {
  ref: string
  img: string
  name: string
  cat: string
  sil?: string
  /** A flat product shot — the only kind that can go on the body. */
  flat: boolean
}

/** The dressing room — your build in the middle, your closet on the rails. */
export function Room() {
  const { wardrobe, customs, profile, mannequin, wear, toast } = useStore()
  const [open, setOpen] = useState<string>('top')


  const pieces = useMemo<Piece[]>(() => {
    const list: Piece[] = []
    for (const w of wardrobe) {
      const p = CATALOG.find((x) => x.id === w.productId)
      if (p)
        list.push({
          ref: p.id,
          img: p.image,
          name: p.name,
          cat: p.category,
          sil: p.silhouette,
          flat: p.flat !== false,
        })
    }
    for (const c of customs) {
      if (c.photo) list.push({ ref: c.id, img: c.photo, name: c.name, cat: c.category, flat: true })
    }
    return list
  }, [wardrobe, customs])

  const byRef = (ref?: string) => (ref ? pieces.find((p) => p.ref === ref) : undefined)

  // Hats are the accessory subset that can actually sit on a head.
  const isHat = (p: Piece) => p.cat === 'accessory' && /cap|hat|beanie|bucket|visor/i.test(p.name)
  const forSlot = (key: string) => {
    // A model shot can't be worn — it would paste a whole second person on the
    // figure. Those pieces still live in the closet, just not on the mannequin.
    const wearable = pieces.filter((p) => p.flat)
    if (key === 'hat') return wearable.filter(isHat)
    if (key === ACC_SLOT.key) return wearable.filter((p) => p.cat === 'accessory' && !isHat(p))
    const slot = SLOTS.find((s) => s.key === key)!
    return wearable.filter((p) => slot.match(p.cat, p.sil))
  }

  const rails = [...SLOTS.map((s) => ({ key: s.key, label: s.label })), ACC_SLOT]
  const worn = rails.filter((r) => byRef(mannequin[r.key])).length
  const posters = profile.teams.slice(0, 2)
  return (
    <div className="room2">
      <div className="mq">
        <div className="mq__stage">
          {/* the wall lives inside the figure's column so it can never reach
              the rails — it used to be positioned against the whole room */}
          <div className="room2__wall">
            {posters
              .filter((t) => TEAM_POSTERS[t])
              .map((t) => (
                <div className="room2__poster" key={t}>
                  <img src={TEAM_POSTERS[t]} alt={`${t} poster`} />
                </div>
              ))}
            {profile.tags
              .filter((t) => ARTIST_POSTERS[t])
              .slice(0, 2)
              .map((t, i) => (
                <div className="room2__poster" key={t} style={{ transform: `rotate(${i % 2 ? 1.4 : -1.2}deg)` }}>
                  <img src={ARTIST_POSTERS[t]} alt={`${t} poster`} loading="lazy" />
                </div>
              ))}
            {profile.tags.includes('Sports cards') && (
              <div className="room2__card">
                <img src="/cards/sports.svg" alt="Sports cards" />
              </div>
            )}
            {profile.tags.includes('Pokémon cards') && (
              <div className="room2__card">
                <img src="/cards/pokemon.svg" alt="Trading cards" />
              </div>
            )}
          </div>

          <img className="room2__dog" src="/room/dog.png" alt="" loading="lazy" />

          <div className="stack">
            {SLOTS.map((s) => {
              const p = byRef(mannequin[s.key])
              if (!p || !p.flat) return null
              return (
                <div className={`stackpiece stackpiece--${s.key}`} key={s.key}>
                  {s.key === 'shoes' ? (
                    // Product shots are one shoe in profile — mirror it so the
                    // row reads as a pair rather than a single loose trainer.
                    <span className="mqshoes">
                      <CutoutImg src={p.img} className="stackpiece__img mqshoes__l" />
                      <CutoutImg src={p.img} className="stackpiece__img mqshoes__r" />
                    </span>
                  ) : (
                    <CutoutImg src={p.img} className="stackpiece__img" />
                  )}
                  <span className="stackpiece__name">{p.name}</span>
                </div>
              )
            })}

            {byRef(mannequin[ACC_SLOT.key])?.flat && (
              <div className="stackpiece stackpiece--acc">
                <CutoutImg src={byRef(mannequin[ACC_SLOT.key])!.img} className="stackpiece__img" />
                <span className="stackpiece__name">{byRef(mannequin[ACC_SLOT.key])!.name}</span>
              </div>
            )}

            {worn === 0 && (
              <p className="stack__empty">
                Pick a piece from the rails and the fit builds here.
              </p>
            )}
          </div>

          <div className="mq__caption">
            <span className="eyebrow">{profile.name ? `${profile.name}'s build` : 'Your build'}</span>
            <b>
              {worn}/{rails.length} on
            </b>
            {worn > 0 && (
              <button
                className="mq__strip"
                onClick={() => {
                  rails.forEach((r) => mannequin[r.key] && wear(r.key, mannequin[r.key]))
                  toast('Stripped')
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* THE RAILS — tap a slot, tap a piece, it goes on */}
        <div className="mq__rails">
          {rails.map((r) => {
            const options = forSlot(r.key)
            const on = byRef(mannequin[r.key])
            const isOpen = open === r.key
            return (
              <div className={`mqrail${isOpen ? ' is-open' : ''}`} key={r.key}>
                <button className="mqrail__head" onClick={() => setOpen(isOpen ? '' : r.key)}>
                  <span className="eyebrow">{r.label}</span>
                  <span className="mqrail__now">{on ? on.name : options.length ? 'Pick one' : '—'}</span>
                  <i>{isOpen ? '−' : '+'}</i>
                </button>
                {isOpen && (
                  <div className="mqrail__row">
                    {options.length === 0 && (
                      <p className="tiny">
                        Nothing wearable here yet — add pieces below.
                      </p>
                    )}
                    {options.map((p) => (
                      <button
                        key={p.ref}
                        className={`mqpick${mannequin[r.key] === p.ref ? ' is-on' : ''}`}
                        onClick={() => {
                          wear(r.key, p.ref)
                          toast(mannequin[r.key] === p.ref ? 'Off' : `On — ${p.name}`)
                        }}
                        title={p.name}
                      >
                        <CutoutImg src={p.img} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <i className="room2__floor" />
    </div>
  )
}

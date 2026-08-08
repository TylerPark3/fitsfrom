import { useMemo, useState } from 'react'
import { CutoutImg } from './CutoutImg'
import { ANATOMY, Mannequin, MannequinForearms, MannequinHead, SLEEVE } from './Mannequin'
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
 * Garment bands, measured against the BODY rather than the panel.
 * `top`/`bottom` are fractions of the figure's own height, so a collar lands at
 * the neck on every build instead of floating wherever the container happens to
 * put it. `z` decides the stack — and the head gets redrawn above the shirt, so
 * the face comes out of the collar instead of vanishing under the garment.
 */
const SLOTS: {
  key: string
  label: string
  top: number
  bottom: number
  width: number
  z: number
  match: (cat: string, sil?: string) => boolean
}[] = [
  {
    key: 'hat',
    label: 'Hat',
    // sits on the crown, ends above the chin
    top: -0.01,
    bottom: ANATOMY.chin - 0.03,
    width: 0.34,
    z: 7,
    match: (c) => c === 'accessory',
  },
  {
    key: 'top',
    label: 'Top',
    // collar just under the chin, hem past the hip — a shirt covers the whole
    // torso and the shoulders, so it spans the full shoulder width
    top: ANATOMY.chin + 0.005,
    bottom: ANATOMY.crotch + 0.06,
    width: 1,
    z: 4,
    match: (c) => ['top', 'shirt', 'knit', 'outer'].includes(c),
  },
  {
    key: 'bottom',
    label: 'Bottom',
    // waistband at the navel, hem at the ankle — the full length of the legs
    top: ANATOMY.waist - 0.01,
    bottom: ANATOMY.ankle + 0.02,
    width: 0.76,
    z: 3,
    match: (c) => c === 'pants',
  },
  {
    key: 'shoes',
    label: 'Shoes',
    top: ANATOMY.ankle - 0.03,
    bottom: 1.01,
    // narrow: the two shoes have to land on the figure's feet, which stand
    // close together, not out where the hips are
    width: 0.46,
    z: 5,
    match: (c) => c === 'shoes',
  },
]

/** Shorts stop at the knee, not the ankle — same slot, different hem. */
const SHORT_HEM = ANATOMY.knee + 0.02

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

  // The mannequin is drawn to a fixed 200x520 box, so the figure IS the
  // coordinate space and every garment band is a straight fraction of it.
  const STAGE_H = 620
  const bodyW = STAGE_H * (220 / 560)

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
  const topOn = byRef(mannequin.top)
  const wearingTop = !!topOn?.flat
  // Short sleeves leave the forearm out; long sleeves leave only the hand.
  const sleeveHem = (() => {
    if (!topOn) return SLEEVE.long
    const n = topOn.name
    // long markers win: "L/S Municipal T-Shirt" is a long sleeve, not a tee
    if (/\bl\/s\b|long.?sleeve|hoodie|hooded|crew|sweat|jacket|knit|cardigan|coat|fleece/i.test(n))
      return SLEEVE.long
    if (/\btee\b|t-?shirt|short.?sleeve|\bs\/s\b|polo|tank|jersey|singlet/i.test(n))
      return SLEEVE.short
    return SLEEVE.long
  })()

  return (
    <div className="room2">
      {/* the wall behind the figure */}
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
          .slice(0, 3)
          .map((t, i) => (
            <div className="room2__poster" key={t} style={{ transform: `rotate(${i % 2 ? 1.5 : -1.3}deg)` }}>
              <img src={ARTIST_POSTERS[t]} alt={`${t} poster`} loading="lazy" />
            </div>
          ))}
      </div>

      <div className="mq">
        <div className="mq__stage">
          {/* this box IS the body's bounding box — bands below are anatomy */}
          <div className="mq__figure" style={{ width: bodyW, height: STAGE_H }}>
            <div className="mq__rig">
              <Mannequin profile={profile} />
            </div>

            {SLOTS.map((s) => {
              const p = byRef(mannequin[s.key])
              if (!p || !p.flat) return null
              const bottom =
                s.key === 'bottom' && p.sil === 'short' ? SHORT_HEM : s.bottom
              return (
                <div
                  className={`mqlayer mqlayer--${s.key}`}
                  key={s.key}
                  style={{
                    top: `${s.top * 100}%`,
                    height: `${(bottom - s.top) * 100}%`,
                    width: `${s.width * 100}%`,
                    zIndex: s.z,
                  }}
                >
                  {s.key === 'shoes' ? (
                    // Product shots are one shoe in profile — mirror it so the
                    // figure reads as a person facing us, standing in a pair.
                    <span className="mqshoes">
                      <CutoutImg src={p.img} className="mqlayer__img mqshoes__l" />
                      <CutoutImg src={p.img} className="mqlayer__img mqshoes__r" />
                    </span>
                  ) : (
                    <CutoutImg src={p.img} className="mqlayer__img" />
                  )}
                </div>
              )
            })}

            {/* Redrawn over the shirt: the head so it clears the collar, and
                the arm below the sleeve hem so the limb passes through the
                sleeve instead of the shirt lying flat across it. */}
            {wearingTop && (
              <>
                <div className="mq__arms">
                  <MannequinForearms profile={profile} hem={sleeveHem} />
                </div>
                <div className="mq__head">
                  <MannequinHead profile={profile} />
                </div>
              </>
            )}
          </div>

          {byRef(mannequin[ACC_SLOT.key])?.flat && (
            <div className="mq__acc">
              <CutoutImg src={byRef(mannequin[ACC_SLOT.key])!.img} className="mqlayer__img" />
            </div>
          )}

          <i className="mq__pedestal" />

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

      {/* the card shelf — what you collect sits under the posters */}
      {(profile.tags.includes('Sports cards') || profile.tags.includes('Pokémon cards')) && (
        <div className="room2__cards">
          {profile.tags.includes('Sports cards') && (
            <img src="/cards/sports.svg" alt="Sports cards" style={{ transform: 'rotate(-4deg)' }} />
          )}
          {profile.tags.includes('Pokémon cards') && (
            <img src="/cards/pokemon.svg" alt="Trading cards" style={{ transform: 'rotate(3deg)' }} />
          )}
          <i className="room2__shelf" />
        </div>
      )}

      <img className="room2__dog" src="/room/dog.png" alt="" loading="lazy" />
      <i className="room2__floor" />
    </div>
  )
}

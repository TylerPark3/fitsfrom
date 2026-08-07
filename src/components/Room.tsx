import { useRef } from 'react'
import { CutoutImg } from './CutoutImg'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'

const TEAM_POSTERS: Record<string, string> = {
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
}

/** The dorm — your closet as a place. Head follows the mouse, 2K-style. */
export function Room() {
  const { wardrobe, customs, profile } = useStore()
  const roomRef = useRef<HTMLDivElement>(null)

  const items = wardrobe
    .map((w) => CATALOG.find((p) => p.id === w.productId))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const customImgs = customs.filter((c) => c.photo)

  // One representative per type — the diagram, not the inventory.
  const firstOf = (pred: (c: string, sil?: string) => boolean): string | null => {
    const hit = items.find((p) => pred(p.category, p.silhouette))
    if (hit) return hit.image
    const cu = customImgs.find((c) => pred(c.category))
    return cu ? cu.photo : null
  }
  const reps: { key: string; label: string; shelf: string; img: string | null }[] = [
    { key: 'long', label: 'Long sleeve', shelf: 'Tops', img: firstOf((c) => ['top', 'shirt', 'knit', 'outer'].includes(c)) },
    { key: 'shorts', label: 'Shorts', shelf: 'Shorts', img: firstOf((c, s2) => c === 'pants' && s2 === 'short') },
    { key: 'pants', label: 'Pants', shelf: 'Pants', img: firstOf((c, s2) => c === 'pants' && s2 !== 'short') },
    { key: 'shoes', label: 'Shoes', shelf: 'Shoes', img: firstOf((c) => c === 'shoes') },
  ]

  const posters = profile.teams.slice(0, 2)
  const scrollTo = (label: string) =>
    document.getElementById(`shelf-${label}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="room2" ref={roomRef}>
      {/* the dog lives here */}
      <img className="room2__dog" src="/room/dog.png" alt="" loading="lazy" />

      {/* the wall — everything flows in rows, top first, never overlapping */}
      <div className="room2__wall">
        {posters.length === 0 && !profile.tags.includes('Yankees') && !profile.tags.includes('Dodgers') && (
          <div className="room2__poster room2__poster--empty">FF</div>
        )}
        {posters
          .filter((t) => TEAM_POSTERS[t])
          .map((t) => (
            <div className="room2__poster" key={t}>
              <img src={TEAM_POSTERS[t]} alt={`${t} poster`} />
            </div>
          ))}
        {[
          ['Yankees', '/room/art-yankees.jpg', -1.4],
          ['Dodgers', '/room/art-dodgers.jpg', 1.8],
          ['Angels', '/room/art-angels.jpg', -1.1],
          ['Brewers', '/room/art-brewers.jpg', 1.4],
        ]
          .filter(([tag]) => profile.tags.includes(tag as string))
          .map(([tag, img, rot]) => (
            <div className="room2__poster" key={tag as string} style={{ transform: `rotate(${rot}deg)` }}>
              <img src={img as string} alt={`${tag} art`} loading="lazy" />
            </div>
          ))}
      </div>

      {/* the rail — one hanger per type; click to open that shelf */}
      <div className="room2__rail">
        <i className="room2__bar" />
        {reps.map((r, i) => (
          <button
            key={r.key}
            className={`hanger${r.img ? '' : ' hanger--ghost'}`}
            style={{ transform: `rotate(${i % 2 ? 1.3 : -1.1}deg)` }}
            onClick={() => r.img && scrollTo(r.shelf)}
            aria-label={`Open ${r.label}`}
          >
            <i className="hanger__hook" />
            {r.img ? (
              <CutoutImg src={r.img} className="hanger__img" />
            ) : (
              <svg viewBox="0 0 60 40" aria-hidden="true">
                <path d="M30 2 q6 0 6 6 q0 4 -5 6 L8 32 q-3 2 0 4 l44 0 q3 -2 0 -4 L31 14" fill="none" stroke="#8a7a5e" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            )}
            <span className="hanger__label">{r.label}</span>
          </button>
        ))}
      </div>

      <i className="room2__floor" />
    </div>
  )
}

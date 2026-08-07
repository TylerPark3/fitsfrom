import { useRef } from 'react'
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

  const hanging = [
    ...items.filter((p) => ['top', 'shirt', 'knit', 'outer'].includes(p.category)).map((p) => p.image),
    ...customImgs.filter((c) => ['top', 'shirt', 'knit', 'outer'].includes(c.category)).map((c) => c.photo),
  ].slice(0, 6)
  const folded = [
    ...items.filter((p) => p.category === 'pants').map((p) => p.image),
    ...customImgs.filter((c) => c.category === 'pants').map((c) => c.photo),
  ].slice(0, 4)
  const shoes = items.filter((p) => p.category === 'shoes').map((p) => p.image).slice(0, 6)

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

      {/* the rail */}
      <button className="room2__rail" onClick={() => scrollTo('Tops')} aria-label="Open tops & shirts">
        <i className="room2__bar" />
                {hanging.map((img, i) => (
          <span className="hanger" key={i} style={{ transform: `rotate(${i % 2 ? 1.4 : -1.1}deg)` }}>
            <i className="hanger__hook" />
            <img src={img} alt="" loading="lazy" />
          </span>
        ))}
        {Array.from({ length: Math.max(0, 5 - hanging.length) }, (_, i) => (
          <span className="hanger hanger--ghost" key={`g${i}`} style={{ transform: `rotate(${i % 2 ? -1.6 : 1.2}deg)` }}>
            <svg viewBox="0 0 60 40" aria-hidden="true">
              <path d="M30 2 q6 0 6 6 q0 4 -5 6 L8 32 q-3 2 0 4 l44 0 q3 -2 0 -4 L31 14" fill="none" stroke="#8a7a5e" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
        ))}
      </button>

      {/* dresser with folded pants */}
      <button className="room2__dresser" onClick={() => scrollTo('Pants')} aria-label="Open pants">
        {folded.map((img, i) => (
          <span className="fold" key={i}>
            <img src={img} alt="" loading="lazy" />
          </span>
        ))}
        <i className="room2__dressertop" />
      </button>

      {/* shoe rack — bottom left */}
      <button className="shoerack" onClick={() => scrollTo('Shoes')} aria-label="Open shoe collection">
        <span className="shoerack__shelf">
          {shoes.slice(0, 3).map((img, i) => (
            <img key={i} src={img} alt="" loading="lazy" />
          ))}
          {shoes.length === 0 && <i className="shoerack__hint">shoes go here</i>}
        </span>
        <span className="shoerack__shelf">
          {shoes.slice(3, 6).map((img, i) => (
            <img key={i} src={img} alt="" loading="lazy" />
          ))}
        </span>
      </button>

      <i className="room2__floor" />
    </div>
  )
}

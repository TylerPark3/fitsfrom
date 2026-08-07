import { useEffect, useRef } from 'react'
import { CATALOG } from '../data/catalog'
import { useStore } from '../lib/store'

const TEAM_POSTERS: Record<string, string> = {
  Rockets: '/room/poster-rockets.jpg',
  Lakers: '/room/poster-lakers.jpg',
}

const TEAM_COLORS: Record<string, [string, string]> = {
  Thunder: ['#007AC1', '#EF3B24'],
  Mavs: ['#00538C', '#002B5E'],
  Wizards: ['#002B5C', '#E31837'],
  Suns: ['#1D1160', '#E56020'],
  Warriors: ['#1D428A', '#FFC72C'],
  Knicks: ['#006BB6', '#F58426'],
  Heat: ['#98002E', '#F9A01B'],
  Celtics: ['#007A33', '#BA9653'],
}

/** The dorm — your closet as a place. Head follows the mouse, 2K-style. */
export function Room() {
  const { wardrobe, customs, profile } = useStore()
  const roomRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // dahbiahmed-style tracking: window-wide, spring-eased, direct DOM writes (no re-renders).
  useEffect(() => {
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let lastMove = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      const r = roomRef.current?.getBoundingClientRect()
      if (!r) return
      const hx = r.left + r.width * 0.66
      const hy = r.top + r.height * 0.5
      target.x = Math.max(-1, Math.min(1, (e.clientX - hx) / (window.innerWidth / 2)))
      target.y = Math.max(-1, Math.min(1, (e.clientY - hy) / (window.innerHeight / 2)))
      lastMove = performance.now()
    }

    const tick = (t: number) => {
      // idle: soft breathing when the cursor rests
      const idle = t - lastMove > 2600
      const tx = idle ? Math.sin(t / 900) * 0.08 : target.x
      const ty = idle ? Math.cos(t / 1100) * 0.05 : target.y
      pos.x += (tx - pos.x) * 0.09
      pos.y += (ty - pos.y) * 0.09
      if (headRef.current)
        headRef.current.style.transform = `rotate(${pos.x * 12}deg) translate(${pos.x * 6}px, ${pos.y * 4}px)`
      if (bodyRef.current)
        bodyRef.current.style.transform = `translateX(${pos.x * 5}px) rotate(${pos.x * 1.4}deg)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

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
  const shoes = items.filter((p) => p.category === 'shoes').map((p) => p.image).slice(0, 3)

  const posters = profile.teams.slice(0, 2)
  const scrollTo = (label: string) =>
    document.getElementById(`shelf-${label}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="room2" ref={roomRef}>
      {/* leaning framed print — always part of the room */}
      <div className="room2__lean">
        <img src="/room/art-ny.jpg" alt="" loading="lazy" />
      </div>

      {profile.tags.includes('Yankees') && (
        <div className="room2__hangart">
          <img src="/room/art-yankees.jpg" alt="Yankees caps painting" loading="lazy" />
        </div>
      )}

      {/* wall posters from your teams */}
      <div className="room2__posters">
        {posters.length === 0 && <div className="room2__poster room2__poster--empty">FF</div>}
        {posters.map((t) =>
          TEAM_POSTERS[t] ? (
            <div className="room2__poster" key={t}>
              <img src={TEAM_POSTERS[t]} alt={`${t} poster`} />
            </div>
          ) : (
            <div
              className="room2__poster room2__poster--team"
              key={t}
              style={{
                background: `linear-gradient(135deg, ${(TEAM_COLORS[t] ?? ['#1c2a20', '#52604f'])[0]}, ${(TEAM_COLORS[t] ?? ['#1c2a20', '#52604f'])[1]})`,
              }}
            >
              {t.toUpperCase()}
            </div>
          ),
        )}
      </div>

      {/* the rail */}
      <button className="room2__rail" onClick={() => scrollTo('Tops')} aria-label="Open tops & shirts">
        <i className="room2__bar" />
        {hanging.length === 0 && <span className="room2__hint">closet’s empty — add pieces</span>}
        {hanging.map((img, i) => (
          <span className="hanger" key={i} style={{ animationDelay: `${i * 0.35}s` }}>
            <i className="hanger__hook" />
            <img src={img} alt="" loading="lazy" />
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

      {/* shoes on the floor */}
      <button className="room2__shoes" onClick={() => scrollTo('Shoes')} aria-label="Open shoes">
        {shoes.map((img, i) => (
          <img key={i} src={img} alt="" loading="lazy" />
        ))}
      </button>

      {/* you, 2K-style — head from your scan, eyes on the cursor */}
      <div className="me2k" ref={bodyRef}>
        <div
          className="me2k__head"
          ref={headRef}
          style={{
            backgroundImage: profile.photo ? `url(${profile.photo})` : undefined,
            backgroundSize: `${profile.faceZoom * 100}%`,
            backgroundPosition: `${profile.faceX}% ${profile.faceY}%`,
          }}
        >
          {!profile.photo && '?'}
        </div>
        <svg viewBox="0 0 120 210" className="me2k__body" aria-hidden="true">
          <path d="M38 28q22-10 44 0l14 6 8 44-12 4-4-20v50H36v-50l-4 20-12-4 8-44Z" fill="#1c2a20" />
          <path d="M40 110h40l6 60-4 34H68l-6-58-4 58H46l-4-34Z" fill="#3a4a3e" />
          <path d="M40 200h20v8H38Zm26 0h20v8H64Z" fill="#121915" />
        </svg>
        <span className="me2k__tag">{profile.name || 'you'}</span>
      </div>

      <i className="room2__floor" />
    </div>
  )
}

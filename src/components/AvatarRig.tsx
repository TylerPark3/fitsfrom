import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'

/**
 * The build — the baggy sketch is the body, your scan is the face.
 * Sliders stretch the drawing; the head follows the cursor; ◀ ▶ turns it.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)
  const faceRef = useRef<HTMLDivElement>(null)

  const widthScale = Math.min(
    1.2,
    0.82 + ((profile.chest - 30) / 26) * 0.18 + ((profile.weight - 95) / 205) * 0.16,
  )
  const heightScale = 0.9 + ((profile.height - 58) / 24) * 0.2

  useEffect(() => {
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let raf = 0
    const onMove = (e: MouseEvent) => {
      target.x = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)))
      target.y = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight * 0.3) / (window.innerHeight / 2)))
    }
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.1
      pos.y += (target.y - pos.y) * 0.1
      if (faceRef.current)
        faceRef.current.style.transform = `translate(-50%, -50%) translate(${pos.x * 6}px, ${pos.y * 4}px) rotate(${pos.x * 8}deg)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="rig">
      <div className="rig__turn" style={{ transform: `perspective(900px) rotateY(${yaw}deg)` }}>
        <div
          className="rig__body"
          style={{ transform: `scale(${widthScale}, ${heightScale})` }}
        >
          <img className="rig__sketch" src="/styles/watermark-cut.png" alt="" draggable={false} />
          <span className="rig__shade" />
          <span className="rig__shade rig__shade--band" />
          <div
            className="rig__face"
            ref={faceRef}
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
            {!profile.photo && '?'}
          </div>
        </div>
      </div>

      <div className="rig__controls">
        <button className="iconbtn" aria-label="Turn left" onClick={() => setYaw((y) => Math.max(-26, y - 13))}>
          ◀
        </button>
        <span className="tiny">{profile.name || 'YOUR BUILD'}</span>
        <button className="iconbtn" aria-label="Turn right" onClick={() => setYaw((y) => Math.min(26, y + 13))}>
          ▶
        </button>
      </div>
    </div>
  )
}

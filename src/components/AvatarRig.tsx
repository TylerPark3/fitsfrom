import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'

/**
 * Parametric 2K-style character. Proportions derive live from measurements;
 * the face comes from the scan; the head tracks the cursor; ◀ ▶ turn the body.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)
  const headRef = useRef<SVGGElement>(null)

  // proportions from measurements
  const h = (profile.height - 58) / 24 // 0..1
  const scaleY = 0.9 + h * 0.2
  const chestW = 0.78 + ((profile.chest - 30) / 26) * 0.55
  const waistW = 0.7 + ((profile.waist - 26) / 22) * 0.6
  const bulk = 0.85 + ((profile.weight - 95) / 205) * 0.4
  const leg = 0.9 + ((profile.inseam - 26) / 12) * 0.2

  const sw = 46 * chestW * bulk // shoulder half-width
  const ww = 30 * waistW * bulk // waist half-width
  const legL = 150 * leg

  useEffect(() => {
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let raf = 0
    const onMove = (e: MouseEvent) => {
      target.x = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)))
      target.y = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight * 0.4) / (window.innerHeight / 2)))
    }
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.1
      pos.y += (target.y - pos.y) * 0.1
      if (headRef.current)
        headRef.current.setAttribute(
          'transform',
          `translate(${pos.x * 7}, ${pos.y * 4}) rotate(${pos.x * 8}, 110, 46)`,
        )
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const fz = profile.faceZoom / 2.6
  const fw = 104 * fz

  return (
    <div className="rig">
      <div className="rig__turn" style={{ transform: `perspective(900px) rotateY(${yaw}deg)` }}>
        <svg viewBox="0 0 220 480" className="rig__svg" style={{ transform: `scaleY(${scaleY})` }}>
          <defs>
            <linearGradient id="skinshade" x1="0" x2="1">
              <stop offset="0" stopColor="#2a3830" />
              <stop offset="0.5" stopColor="#1c2a20" />
              <stop offset="1" stopColor="#101913" />
            </linearGradient>
            <linearGradient id="pantshade" x1="0" x2="1">
              <stop offset="0" stopColor="#4a5a4e" />
              <stop offset="0.55" stopColor="#3a4a3e" />
              <stop offset="1" stopColor="#28352c" />
            </linearGradient>
            <clipPath id="headclip">
              <circle cx="110" cy="46" r="30" />
            </clipPath>
          </defs>

          {/* head — the scan, or a blank */}
          <g ref={headRef}>
            {profile.photo ? (
              <image
                href={profile.photo}
                clipPath="url(#headclip)"
                x={110 - fw * (profile.faceX / 100)}
                y={46 - 30 - (fw * 1.4 - 60) * (profile.faceY / 100)}
                width={fw}
                height={fw * 1.4}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <circle cx="110" cy="46" r="30" fill="var(--mist-2)" stroke="var(--line-2)" />
            )}
            <circle cx="110" cy="46" r="30" fill="none" stroke="#fff" strokeWidth="3" />
          </g>

          {/* neck + torso, width driven by chest/waist */}
          <path
            d={`M ${110 - sw} 96
               Q 110 84 ${110 + sw} 96
               L ${110 + sw + 6} 150
               Q ${110 + ww} 190 ${110 + ww} 218
               L ${110 - ww} 218
               Q ${110 - ww} 190 ${110 - sw - 6} 150 Z`}
            fill="url(#skinshade)"
          />
          {/* arms */}
          <path
            d={`M ${110 - sw} 98 q -18 40 -14 96 l 13 4 q 2 -52 12 -84 Z`}
            fill="url(#skinshade)"
            opacity="0.92"
          />
          <path
            d={`M ${110 + sw} 98 q 18 40 14 96 l -13 4 q -2 -52 -12 -84 Z`}
            fill="url(#skinshade)"
            opacity="0.92"
          />
          {/* pants, length from inseam */}
          <path
            d={`M ${110 - ww} 218
               L ${110 + ww} 218
               L ${110 + ww * 1.15} ${218 + legL * 0.45}
               L ${110 + ww * 0.55} ${218 + legL}
               L ${110 + 8} ${218 + legL}
               L 110 ${218 + legL * 0.5}
               L ${110 - 8} ${218 + legL}
               L ${110 - ww * 0.55} ${218 + legL}
               L ${110 - ww * 1.15} ${218 + legL * 0.45} Z`}
            fill="url(#pantshade)"
          />
          {/* sneakers */}
          <path d={`M ${110 - ww * 0.62 - 16} ${218 + legL} h 34 l 4 12 h -42 q -2 -8 4 -12 Z`} fill="#121915" />
          <path d={`M ${110 + ww * 0.62 - 18} ${218 + legL} h 34 q 6 4 4 12 h -42 Z`} fill="#121915" />
          <ellipse cx="110" cy={218 + legL + 22} rx={60 * bulk} ry="8" fill="rgba(18,25,21,0.14)" />
        </svg>
      </div>

      <div className="rig__controls">
        <button className="iconbtn" aria-label="Turn left" onClick={() => setYaw((y) => Math.max(-28, y - 14))}>
          ◀
        </button>
        <span className="tiny">{profile.name || 'YOUR BUILD'}</span>
        <button className="iconbtn" aria-label="Turn right" onClick={() => setYaw((y) => Math.min(28, y + 14))}>
          ▶
        </button>
      </div>
    </div>
  )
}

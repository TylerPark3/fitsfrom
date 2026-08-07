import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'

/**
 * The build — parametric character with real anatomy. Proportions track the
 * sliders live; the face is the auto-centered scan; ◀ ▶ turns the body.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)
  const headRef = useRef<SVGGElement>(null)

  const h = (profile.height - 58) / 24
  const scaleY = 0.92 + h * 0.16
  const chest = (profile.chest - 30) / 26
  const waist = (profile.waist - 26) / 22
  const heft = (profile.weight - 95) / 205
  const sw = 40 + chest * 22 + heft * 8 // shoulder half width
  const ww = 24 + waist * 16 + heft * 6 // waist half width
  const hip = ww + 4
  const legL = 158 + ((profile.inseam - 26) / 12) * 34

  useEffect(() => {
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let raf = 0
    const onMove = (e: MouseEvent) => {
      target.x = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)))
      target.y = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight * 0.35) / (window.innerHeight / 2)))
    }
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.1
      pos.y += (target.y - pos.y) * 0.1
      if (headRef.current)
        headRef.current.setAttribute(
          'transform',
          `translate(${pos.x * 6}, ${pos.y * 3}) rotate(${pos.x * 7}, 110, 46)`,
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

  const hipY = 232
  const ankleY = hipY + legL
  const footW = 30 + heft * 8

  return (
    <div className="rig">
      <div className="rig__turn" style={{ transform: `perspective(900px) rotateY(${yaw}deg)` }}>
        <svg viewBox="0 0 220 500" className="rig__svg" style={{ transform: `scaleY(${scaleY})` }}>
          <defs>
            <linearGradient id="teeG" x1="0" x2="1">
              <stop offset="0" stopColor="#242f27" />
              <stop offset="0.45" stopColor="#1a241d" />
              <stop offset="1" stopColor="#10160f" />
            </linearGradient>
            <linearGradient id="sweatG" x1="0" x2="1">
              <stop offset="0" stopColor="#a8ada3" />
              <stop offset="0.5" stopColor="#8d938a" />
              <stop offset="1" stopColor="#6d7369" />
            </linearGradient>
            <linearGradient id="skinG" x1="0" x2="1">
              <stop offset="0" stopColor="#d9b896" />
              <stop offset="1" stopColor="#bd9b78" />
            </linearGradient>
            <clipPath id="headclip">
              <circle cx="110" cy="46" r="27" />
            </clipPath>
          </defs>

          {/* neck — connects head to shoulders */}
          <path d="M100 62 L120 62 L123 84 L97 84 Z" fill="url(#skinG)" />

          {/* head */}
          <g ref={headRef}>
            {profile.photo ? (
              <>
                <circle cx="110" cy="46" r="27" fill="#e8e2d4" />
                <image
                  href={profile.photo}
                  clipPath="url(#headclip)"
                  x={110 - 27 - ((profile.faceZoom * 54 - 54) * profile.faceX) / 100}
                  y={46 - 27 - ((profile.faceZoom * 54 * 1.33 - 54) * profile.faceY) / 100}
                  width={profile.faceZoom * 54}
                  height={profile.faceZoom * 54 * 1.33}
                  preserveAspectRatio="xMidYMid slice"
                />
              </>
            ) : (
              <circle cx="110" cy="46" r="27" fill="var(--mist-2)" stroke="var(--line-2)" />
            )}
            <circle cx="110" cy="46" r="27" fill="none" stroke="rgba(18,25,21,0.28)" strokeWidth="1.5" />
          </g>

          {/* boxy tee with sleeves */}
          <path
            d={`M ${110 - sw} 92
                C ${110 - sw - 4} 94, ${110 - sw - 12} 100, ${110 - sw - 14} 116
                L ${110 - sw - 12} 146
                Q ${110 - sw - 10} 152, ${110 - sw + 8} 150
                L ${110 - sw + 12} 132
                C ${110 - sw + 10} 170, ${110 - ww - 2} 196, ${110 - ww} 218
                L ${110 + ww} 218
                C ${110 + ww + 2} 196, ${110 + sw - 10} 170, ${110 + sw - 12} 132
                L ${110 + sw - 8} 150
                Q ${110 + sw + 10} 152, ${110 + sw + 12} 146
                L ${110 + sw + 14} 116
                C ${110 + sw + 12} 100, ${110 + sw + 4} 94, ${110 + sw} 92
                Q 110 82 ${110 - sw} 92 Z`}
            fill="url(#teeG)"
          />
          {/* tee hem shadow */}
          <path d={`M ${110 - ww} 214 Q 110 222 ${110 + ww} 214 L ${110 + ww} 218 L ${110 - ww} 218 Z`} fill="rgba(0,0,0,0.25)" />

          {/* forearms + hands */}
          <path d={`M ${110 - sw - 11} 150 q -3 34 2 62 q 2 10 9 10 q 7 0 7 -10 l -4 -60 Z`} fill="url(#skinG)" />
          <path d={`M ${110 + sw + 11} 150 q 3 34 -2 62 q -2 10 -9 10 q -7 0 -7 -10 l 4 -60 Z`} fill="url(#skinG)" />

          {/* sweats — two tapered legs with a soft break */}
          <path
            d={`M ${110 - hip} 218
                C ${110 - hip - 4} 250, ${110 - hip} 280, ${110 - hip + 2} ${hipY + legL * 0.4}
                C ${110 - hip + 2} ${hipY + legL * 0.75}, ${110 - footW * 0.75} ${ankleY - 16}, ${110 - footW * 0.72} ${ankleY}
                L ${110 - 8} ${ankleY}
                C ${110 - 6} ${hipY + legL * 0.6}, ${110 - 4} ${hipY + 46}, 110 ${hipY + 34}
                C ${110 + 4} ${hipY + 46}, ${110 + 6} ${hipY + legL * 0.6}, ${110 + 8} ${ankleY}
                L ${110 + footW * 0.72} ${ankleY}
                C ${110 + footW * 0.75} ${ankleY - 16}, ${110 + hip - 2} ${hipY + legL * 0.75}, ${110 + hip - 2} ${hipY + legL * 0.4}
                C ${110 + hip} 280, ${110 + hip + 4} 250, ${110 + hip} 218 Z`}
            fill="url(#sweatG)"
          />
          {/* drawcord */}
          <path d={`M ${110 - 10} 226 q 10 6 20 0`} stroke="#5d6359" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* sneakers — chunky, separate */}
          <g>
            <path d={`M ${110 - footW - 14} ${ankleY + 10} q 0 -10 10 -12 l ${footW * 0.9} -2 q 6 0 7 8 l 0 8 q 0 6 -7 6 l ${-footW * 0.95 - 4} 0 q -10 0 -10 -8 Z`} fill="#f2f1ec" stroke="#d8d6cd" />
            <path d={`M ${110 - footW - 14} ${ankleY + 16} l ${footW + 22} 0 l 0 6 q 0 4 -6 4 l ${-footW - 8} 0 q -10 0 -10 -8 Z`} fill="#1a241d" />
            <path d={`M ${110 + footW + 14} ${ankleY + 10} q 0 -10 -10 -12 l ${-footW * 0.9} -2 q -6 0 -7 8 l 0 8 q 0 6 7 6 l ${footW * 0.95 + 4} 0 q 10 0 10 -8 Z`} fill="#f2f1ec" stroke="#d8d6cd" />
            <path d={`M ${110 + footW + 14} ${ankleY + 16} l ${-footW - 22} 0 l 0 6 q 0 4 6 4 l ${footW + 8} 0 q 10 0 10 -8 Z`} fill="#1a241d" />
          </g>

          <ellipse cx="110" cy={ankleY + 34} rx={sw + 26} ry="9" fill="rgba(18,25,21,0.12)" />
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

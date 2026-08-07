import { useState } from 'react'
import { useStore } from '../lib/store'

/**
 * The build — the baggy sketch is the body, your scan is the face.
 * Sliders stretch the drawing; the head follows the cursor; ◀ ▶ turns it.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)

  // Dead simple: height stretches it up, weight makes it bigger.
  const widthScale = 0.8 + ((profile.weight - 95) / 205) * 0.45
  const heightScale = 0.85 + ((profile.height - 58) / 24) * 0.35

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

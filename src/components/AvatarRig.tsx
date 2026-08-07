import { useState } from 'react'
import { useStore } from '../lib/store'

const SRC = '/styles/watermark-cut.png'
const W = 340
const H = 520

// body bands as fractions of the sketch: [start, end]
const BANDS = {
  head: [0, 0.115] as const,
  chest: [0.115, 0.4] as const,
  waist: [0.4, 0.575] as const,
  legs: [0.575, 1] as const,
}

/**
 * Purposeful morphs: each slider hits its own region of the body.
 * Height scales everything at ratio; weight bulks legs/torso; chest widens
 * the chest; waist widens the waist; inseam lengthens only the legs.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)

  const overall = 0.82 + ((profile.height - 58) / 24) * 0.32
  const heft = (profile.weight - 95) / 205
  const chestX = (0.86 + ((profile.chest - 30) / 26) * 0.34) * (1 + heft * 0.2)
  const waistX = (0.8 + ((profile.waist - 26) / 22) * 0.46) * (1 + heft * 0.32)
  const legX = 0.88 + heft * 0.5
  const legY = 0.86 + ((profile.inseam - 26) / 12) * 0.32

  const scales: Record<keyof typeof BANDS, [number, number]> = {
    head: [1, 1],
    chest: [chestX, 1],
    waist: [waistX, 1],
    legs: [legX, legY],
  }

  let cum = 0
  const bands = (Object.keys(BANDS) as (keyof typeof BANDS)[]).map((k) => {
    const [a, b] = BANDS[k]
    const [sx, sy] = scales[k]
    const bh = (b - a) * H * sy
    const band = { k, top: cum, h: bh, sx, imgTop: -a * H * sy, imgH: H * sy }
    cum += bh
    return band
  })
  const totalH = cum

  return (
    <div className="rig">
      <div className="rig__turn" style={{ transform: `perspective(900px) rotateY(${yaw}deg)` }}>
        <div
          className="rig__body2"
          style={{ width: W, height: totalH + 26, transform: `scale(${overall})` }}
        >
          {bands.map((b) => (
            <div
              key={b.k}
              className="rigband"
              style={{ top: b.top - 3, height: b.h + 6, width: W }}
            >
              <img
                src={SRC}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: b.imgTop - 3,
                  width: W,
                  height: b.imgH,
                  transform: `translateX(-50%) scaleX(${b.sx})`,
                }}
              />
            </div>
          ))}
          <span
            className="rig__shadow"
            style={{ top: totalH + 2, width: W * 0.62 * Math.max(legX, 0.9) }}
          />
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

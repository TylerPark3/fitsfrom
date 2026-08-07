import { useState } from 'react'
import { useStore } from '../lib/store'

const SRC = '/styles/watermark-cut.png'
const W = 340
const H = 520
const N = 52 // slices — thin enough that the outline reads as one continuous curve

const smooth = (t: number) => (1 - Math.cos(Math.min(1, Math.max(0, t)) * Math.PI)) / 2

/** Piecewise-smooth width profile down the body — never a hard jump. */
function widthAt(y: number, chestX: number, waistX: number, legX: number, shoeX: number): number {
  const pts: [number, number][] = [
    [0, 1],
    [0.1, 1],
    [0.18, 1 + (chestX - 1) * 0.85],
    [0.3, chestX],
    [0.44, (chestX + waistX) / 2],
    [0.52, waistX],
    [0.6, (waistX + legX) / 2],
    [0.72, legX],
    [0.88, legX * 0.98],
    [0.93, shoeX],
    [1, shoeX],
  ]
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, v0] = pts[i]
    const [y1, v1] = pts[i + 1]
    if (y >= y0 && y <= y1) return v0 + (v1 - v0) * smooth((y - y0) / (y1 - y0))
  }
  return legX
}

function heightAt(y: number, legY: number): number {
  if (y < 0.55) return 1
  if (y < 0.68) return 1 + (legY - 1) * smooth((y - 0.55) / 0.13)
  return legY
}

/**
 * Continuous morph: the sketch is resampled through a smooth width/height
 * profile, so the silhouette always stays one connected line.
 */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)

  const overall = 0.82 + ((profile.height - 58) / 24) * 0.32
  const heft = (profile.weight - 95) / 205
  const chestX = (0.88 + ((profile.chest - 30) / 26) * 0.3) * (1 + heft * 0.18)
  const waistX = (0.84 + ((profile.waist - 26) / 22) * 0.4) * (1 + heft * 0.28)
  const legX = (0.9 + heft * 0.42) * (1 + ((profile.waist - 26) / 22) * 0.08)
  const legY = 0.88 + ((profile.inseam - 26) / 12) * 0.28
  const shoeX = (0.82 + ((profile.shoe - 5) / 11) * 0.55) * (1 + heft * 0.1)

  let cum = 0
  const slices = Array.from({ length: N }, (_, i) => {
    const a = i / N
    const mid = (i + 0.5) / N
    const sx = widthAt(mid, chestX, waistX, legX, shoeX)
    const sy = heightAt(mid, legY)
    const h = (H / N) * sy
    const slice = { key: i, top: cum, h, sx, imgTop: -a * H * sy, imgH: H * sy }
    cum += h
    return slice
  })
  const totalH = cum

  return (
    <div className="rig">
      <div className="rig__turn" style={{ transform: `perspective(900px) rotateY(${yaw}deg)` }}>
        <div className="rig__body2" style={{ width: W, height: totalH + 26, transform: `scale(${overall})` }}>
          {slices.map((b) => (
            <div key={b.key} className="rigslice" style={{ top: b.top, height: b.h + 1.2, width: W }}>
              <img
                src={SRC}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: b.imgTop,
                  width: W,
                  height: b.imgH,
                  transform: `translateX(-50%) scaleX(${b.sx})`,
                }}
              />
            </div>
          ))}
          <span className="rig__shadow" style={{ top: totalH + 4, width: W * 0.6 * Math.max(shoeX, 0.9) }} />
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

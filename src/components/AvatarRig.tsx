import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Profile } from '../lib/store'

const SRC = '/styles/watermark-cut.png'
const W = 340
const H = 520
const N = 52 // slices — thin enough that the outline reads as one continuous curve

/** Where the body's landmarks land, as fractions of the figure's own height. */
export const ANATOMY = {
  /** Bottom of the head — a collar sits here, so the face clears it. */
  chin: 0.148,
  shoulder: 0.175,
  waist: 0.5,
  hip: 0.54,
  ankle: 0.9,
}

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

export interface RigMetrics {
  w: number
  h: number
  overall: number
  slices: { key: number; top: number; h: number; sx: number; imgTop: number; imgH: number }[]
}

/**
 * The figure's geometry for a given body. Exported so anything that has to line
 * up with the body — garments on the mannequin, for one — can use the same
 * numbers instead of guessing at percentages of a container.
 */
export function rigMetrics(profile: Profile): RigMetrics {
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

  return { w: W, h: cum, overall, slices }
}

/**
 * The sketch resampled through a smooth width/height profile, so the silhouette
 * always stays one connected line.
 *
 * `part="head"` draws only the slices above the chin. That copy is what gets
 * stacked *over* a shirt so the face comes out of the collar instead of the
 * garment sitting flat on top of the whole body.
 */
export function RigFigure({
  metrics,
  part = 'full',
}: {
  metrics: RigMetrics
  part?: 'full' | 'head'
}) {
  const cut = metrics.h * ANATOMY.chin
  const slices =
    part === 'head' ? metrics.slices.filter((b) => b.top < cut) : metrics.slices

  return (
    <div
      className={`rig__body2 rig__body2--holo${part === 'head' ? ' rig__body2--head' : ''}`}
      style={{
        width: metrics.w,
        height: metrics.h,
        transform: `scale(${metrics.overall})`,
        transformOrigin: 'top left',
      }}
    >
      {part === 'full' && (
        <>
          <span className="rig__beam" style={{ height: metrics.h + 20 }} />
          <span className="rig__emitter" style={{ top: metrics.h + 10 }}>
            <i />
            <i />
          </span>
        </>
      )}
      {slices.map((b) => (
        <div
          key={b.key}
          className="rigslice"
          style={{
            top: b.top,
            // the last head slice is clipped so the cut lands exactly at the chin
            height: Math.min(b.h + 1.2, Math.max(0, cut - b.top) || b.h + 1.2),
            width: metrics.w,
          }}
        >
          <img
            src={SRC}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: b.imgTop,
              width: metrics.w,
              height: b.imgH,
              transform: `translateX(-50%) scaleX(${b.sx})`,
            }}
          />
        </div>
      ))}
      {part === 'full' && (
        <>
          <span
            className="rig__holo"
            style={{ height: metrics.h, WebkitMaskImage: `url(${SRC})`, maskImage: `url(${SRC})` }}
          />
          <span className="rig__scan" />
        </>
      )}
    </div>
  )
}

/** Standalone figure with turn controls — the Avatar section's build view. */
export function AvatarRig() {
  const { profile } = useStore()
  const [yaw, setYaw] = useState(0)
  const m = rigMetrics(profile)

  return (
    <div className="rig">
      <div
        className="rig__turn"
        style={{
          transform: `perspective(900px) rotateY(${yaw}deg)`,
          width: m.w * m.overall,
          height: m.h * m.overall + 26,
        }}
      >
        <RigFigure metrics={m} />
        <span
          className="rig__shadow"
          style={{ top: m.h * m.overall + 4, width: m.w * m.overall * 0.6 }}
        />
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

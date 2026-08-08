import type { Profile } from '../lib/store'

/**
 * Landmarks down the figure, as fractions of its height.
 *
 * The classical eight-head canon — head 0–1, shoulders 1.5, navel 3, crotch 4
 * (the midpoint of a standing body), knee 6, ankle 7.5, sole 8. The garment
 * bands in the dressing room are placed against these, so a waistband lands at
 * the waist and a hem lands at the ankle.
 */
export const ANATOMY = {
  crown: 0,
  chin: 0.125,
  neck: 0.155,
  shoulder: 0.19,
  chest: 0.25,
  waist: 0.375,
  crotch: 0.5,
  knee: 0.75,
  ankle: 0.93,
  sole: 1,
}

/** Where a sleeve ends, as a fraction of figure height. */
export const SLEEVE = {
  short: 0.33,
  long: 0.5,
}

const VB_W = 220
const VB_H = 560
const CX = VB_W / 2

const y = (f: number) => f * VB_H

/** Segment widths, nudged by the build. A wooden figure is slim by nature. */
function shape(p: Profile) {
  const heft = (p.weight - 95) / 205
  const chest = (34 + ((p.chest - 30) / 26) * 10) * (1 + heft * 0.12)
  const waist = (24 + ((p.waist - 26) / 22) * 9) * (1 + heft * 0.14)
  return {
    chest,
    waist,
    pelvis: Math.max(waist * 1.2, chest * 0.82),
    shoulderX: chest * 1.18,
    thigh: 15 + heft * 3,
    calf: 11 + heft * 2,
    foot: 17 + ((p.shoe - 5) / 11) * 6,
    headRx: 23,
  }
}

/** A turned wooden limb: wide end at (x1,y1), narrow end at (x2,y2). */
function segment(x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) {
  const d = y2 - y1
  return [
    `M ${x1 - w1} ${y1}`,
    `C ${x1 - w1} ${y1 + d * 0.45} ${x2 - w2} ${y2 - d * 0.35} ${x2 - w2} ${y2}`,
    `L ${x2 + w2} ${y2}`,
    `C ${x2 + w2} ${y2 - d * 0.35} ${x1 + w1} ${y1 + d * 0.45} ${x1 + w1} ${y1}`,
    'Z',
  ].join(' ')
}

const SHOULDER_Y = 0.185
const ELBOW_Y = 0.355
const WRIST_Y = 0.5

/** Every piece of one arm, so the parts can be split across z-layers. */
function armParts(s: ReturnType<typeof shape>, side: 1 | -1) {
  const sx = CX + side * s.shoulderX
  const ex = CX + side * (s.shoulderX + 4)
  const wx = CX + side * (s.shoulderX + 5)
  return {
    sx,
    ex,
    wx,
    ball: { cx: sx, cy: y(SHOULDER_Y), r: 12 },
    upper: segment(sx, y(SHOULDER_Y) + 6, 10.5, ex, y(ELBOW_Y) - 6, 8),
    elbow: { cx: ex, cy: y(ELBOW_Y), r: 8 },
    fore: segment(ex, y(ELBOW_Y) + 5, 8, wx, y(WRIST_Y) - 4, 6),
    hand: [
      `M ${wx - 6} ${y(WRIST_Y) - 2}`,
      `C ${wx - 7} ${y(0.535)} ${wx - 4} ${y(0.575)} ${wx + side * 1.5} ${y(0.585)}`,
      `C ${wx + 6} ${y(0.55)} ${wx + 6} ${y(0.53)} ${wx + 6} ${y(WRIST_Y) - 2}`,
      'Z',
    ].join(' '),
  }
}

function Grads({ id }: { id: string }) {
  return (
    <defs>
      {/* turned wood: highlight down the middle, shadow at both edges */}
      <linearGradient id={`wood-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c49a63" />
        <stop offset="0.34" stopColor="#eed7ae" />
        <stop offset="0.6" stopColor="#e2c694" />
        <stop offset="1" stopColor="#bd9159" />
      </linearGradient>
      <radialGradient id={`ball-${id}`} cx="0.36" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#f4e0bd" />
        <stop offset="0.6" stopColor="#ddbf8d" />
        <stop offset="1" stopColor="#b98d55" />
      </radialGradient>
    </defs>
  )
}

const STROKE = '#a88250'

/**
 * A wooden artist's figure — the jointed drawing model. Segmented body, ball
 * joints, no face. It reads as a thing built to be dressed, and every surface
 * is neutral wood so the garment is the only real colour on screen.
 *
 * `sleeveHem` hides the part of each arm a sleeve would cover, so the arm can
 * be redrawn on top of the shirt below that point — that is what makes the
 * limb pass *through* the sleeve rather than the shirt sitting flat over it.
 */
export function Mannequin({
  profile,
  className,
  part = 'full',
  sleeveHem,
}: {
  profile: Profile
  className?: string
  part?: 'full' | 'head' | 'forearms'
  sleeveHem?: number
}) {
  const s = shape(profile)
  const L = armParts(s, -1)
  const R = armParts(s, 1)
  const uid = part

  const head = (
    <>
      <circle cx={CX} cy={y(0.148)} r={8} fill={`url(#ball-${uid})`} />
      <path
        d={[
          `M ${CX - s.headRx} ${y(0.078)}`,
          `C ${CX - s.headRx} ${y(0.022)} ${CX + s.headRx} ${y(0.022)} ${CX + s.headRx} ${y(0.078)}`,
          `C ${CX + s.headRx} ${y(0.116)} ${CX + s.headRx * 0.5} ${y(0.137)} ${CX} ${y(0.137)}`,
          `C ${CX - s.headRx * 0.5} ${y(0.137)} ${CX - s.headRx} ${y(0.116)} ${CX - s.headRx} ${y(0.078)}`,
          'Z',
        ].join(' ')}
      />
    </>
  )

  const seam = (
    <path
      d={`M ${CX} ${y(0.026)} C ${CX - 9} ${y(0.062)} ${CX - 9} ${y(0.09)} ${CX} ${y(0.106)}`}
      fill="none"
      stroke="#c9a06a"
      strokeWidth="1.4"
      opacity="0.5"
    />
  )

  const svgProps = {
    className,
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    width: '100%',
    height: '100%',
    'aria-hidden': true as const,
    focusable: 'false' as const,
    preserveAspectRatio: 'xMidYMid meet' as const,
  }

  if (part === 'head') {
    return (
      <svg {...svgProps}>
        <Grads id={uid} />
        <g fill={`url(#wood-${uid})`} stroke={STROKE} strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.6">
          {head}
        </g>
        {seam}
      </svg>
    )
  }

  // Only what pokes out below the sleeve — drawn over the shirt.
  if (part === 'forearms') {
    const hem = sleeveHem ?? SLEEVE.short
    return (
      <svg {...svgProps}>
        <Grads id={uid} />
        <g fill={`url(#wood-${uid})`} stroke={STROKE} strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.6">
          <clipPath id={`below-${uid}`}>
            <rect x="0" y={y(hem)} width={VB_W} height={VB_H} />
          </clipPath>
          <g clipPath={`url(#below-${uid})`}>
            {[L, R].map((a, i) => (
              <g key={i}>
                <path d={a.upper} />
                <circle cx={a.elbow.cx} cy={a.elbow.cy} r={a.elbow.r} fill={`url(#ball-${uid})`} />
                <path d={a.fore} />
                <path d={a.hand} />
              </g>
            ))}
          </g>
        </g>
      </svg>
    )
  }

  const hipY = y(0.505)
  const kneeY = y(ANATOMY.knee)
  const ankleY = y(ANATOMY.ankle)
  const leg = (side: 1 | -1) => {
    const lx = CX + side * (s.pelvis * 0.52)
    return {
      ball: { cx: lx, cy: hipY, r: 13 },
      thigh: segment(lx, hipY + 7, s.thigh, lx, kneeY - 9, s.calf + 1.5),
      knee: { cx: lx, cy: kneeY, r: 10 },
      calf: segment(lx, kneeY + 7, s.calf + 0.5, lx, ankleY - 3, s.calf * 0.72),
      foot: [
        `M ${lx - s.calf * 0.72} ${ankleY - 2}`,
        `C ${lx - s.foot} ${y(0.962)} ${lx - s.foot} ${y(0.997)} ${lx - s.foot * 0.45} ${y(0.997)}`,
        `L ${lx + s.foot * 0.6} ${y(0.997)}`,
        `C ${lx + s.foot} ${y(0.99)} ${lx + s.calf} ${y(0.955)} ${lx + s.calf * 0.72} ${ankleY - 2}`,
        'Z',
      ].join(' '),
    }
  }
  const LL = leg(-1)
  const RL = leg(1)

  const chestTop = y(0.168)
  const chest = [
    `M ${CX - s.chest * 0.32} ${chestTop - 5}`,
    `C ${CX - s.chest * 0.88} ${chestTop - 4} ${CX - s.chest} ${chestTop + 7} ${CX - s.chest} ${y(0.225)}`,
    `C ${CX - s.chest} ${y(0.29)} ${CX - s.waist * 1.04} ${y(0.315)} ${CX - s.waist * 0.96} ${y(0.34)}`,
    `L ${CX + s.waist * 0.96} ${y(0.34)}`,
    `C ${CX + s.waist * 1.04} ${y(0.315)} ${CX + s.chest} ${y(0.29)} ${CX + s.chest} ${y(0.225)}`,
    `C ${CX + s.chest} ${chestTop + 7} ${CX + s.chest * 0.88} ${chestTop - 4} ${CX + s.chest * 0.32} ${chestTop - 5}`,
    'Z',
  ].join(' ')

  const pelvis = [
    `M ${CX - s.pelvis * 0.86} ${y(0.4)}`,
    `C ${CX - s.pelvis} ${y(0.43)} ${CX - s.pelvis} ${y(0.47)} ${CX - s.pelvis * 0.9} ${y(0.492)}`,
    `L ${CX + s.pelvis * 0.9} ${y(0.492)}`,
    `C ${CX + s.pelvis} ${y(0.47)} ${CX + s.pelvis} ${y(0.43)} ${CX + s.pelvis * 0.86} ${y(0.4)}`,
    'Z',
  ].join(' ')

  return (
    <svg {...svgProps}>
      <Grads id={uid} />
      <g fill={`url(#wood-${uid})`} stroke={STROKE} strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.6">
        {/* limbs first — the body blocks overlap them at the joints */}
        {[L, R].map((a, i) => (
          <g key={`arm-${i}`}>
            <circle cx={a.ball.cx} cy={a.ball.cy} r={a.ball.r} fill={`url(#ball-${uid})`} />
            <path d={a.upper} />
            <circle cx={a.elbow.cx} cy={a.elbow.cy} r={a.elbow.r} fill={`url(#ball-${uid})`} />
            <path d={a.fore} />
            <path d={a.hand} />
          </g>
        ))}

        {[LL, RL].map((l, i) => (
          <g key={`leg-${i}`}>
            <circle cx={l.ball.cx} cy={l.ball.cy} r={l.ball.r} fill={`url(#ball-${uid})`} />
            <path d={l.thigh} />
            <circle cx={l.knee.cx} cy={l.knee.cy} r={l.knee.r} fill={`url(#ball-${uid})`} />
            <path d={l.calf} />
            <path d={l.foot} />
          </g>
        ))}

        <path d={chest} />
        <circle cx={CX} cy={y(0.372)} r={12} fill={`url(#ball-${uid})`} />
        <path d={pelvis} />

        {head}
      </g>

      {seam}
      <ellipse cx={CX} cy={y(1.004)} rx="62" ry="7" fill="#b9b5ab" opacity="0.35" />
    </svg>
  )
}

/** Head and neck only, drawn again over a shirt so the collar reads right. */
export function MannequinHead({ profile, className }: { profile: Profile; className?: string }) {
  return <Mannequin profile={profile} className={className} part="head" />
}

/** The arm below a sleeve hem, drawn over the shirt so the limb passes through. */
export function MannequinForearms({
  profile,
  className,
  hem,
}: {
  profile: Profile
  className?: string
  hem: number
}) {
  return <Mannequin profile={profile} className={className} part="forearms" sleeveHem={hem} />
}

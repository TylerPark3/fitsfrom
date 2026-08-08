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
export const SLEEVE = { short: 0.33, long: 0.5 }

const VB_W = 220
const VB_H = 560
const CX = VB_W / 2

/** Segment widths, nudged by the build. A wooden figure is slim by nature. */
function shape(p: Profile) {
  const heft = (p.weight - 95) / 205
  const chest = (40 + ((p.chest - 30) / 26) * 9) * (1 + heft * 0.11)
  const waist = (26 + ((p.waist - 26) / 22) * 8) * (1 + heft * 0.13)
  return {
    chest,
    waist,
    pelvis: Math.max(waist * 1.24, chest * 0.8),
    thigh: 17 + heft * 3,
    calf: 13 + heft * 2,
    foot: 20 + ((p.shoe - 5) / 11) * 7,
    headRx: 23,
  }
}

/**
 * A turned limb. The sides bow outward slightly — a lathe leaves a barrel, not
 * a cone, and a straight taper is what made the last version read as cardboard.
 */
function limb(x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, bulge = 0.09) {
  const d = y2 - y1
  const b1 = w1 * (1 + bulge)
  const b2 = w2 * (1 + bulge)
  return [
    `M ${x1 - w1} ${y1}`,
    `C ${x1 - b1} ${y1 + d * 0.3} ${x2 - b2} ${y1 + d * 0.72} ${x2 - w2} ${y2}`,
    `Q ${x2} ${y2 + w2 * 0.5} ${x2 + w2} ${y2}`,
    `C ${x2 + b2} ${y1 + d * 0.72} ${x1 + b1} ${y1 + d * 0.3} ${x1 + w1} ${y1}`,
    `Q ${x1} ${y1 - w1 * 0.35} ${x1 - w1} ${y1}`,
    'Z',
  ].join(' ')
}

/* ── absolute geometry, in viewBox units ───────────────────────────────────
   Joints overlap on purpose: every ball is drawn wide enough to sit across the
   seam between the two segments it links, so the figure reads as one object
   instead of a pile of loose parts. */
const HEAD_TOP = 5
const HEAD_BOT = 70
const NECK_Y = 79
const CHEST_TOP = 86
const CHEST_BOT = 198
const WAIST_Y = 203
const PELVIS_TOP = 205
const PELVIS_BOT = 282
const SHOULDER_Y = 102
const ELBOW_Y = 198
const WRIST_Y = 274
const HAND_BOT = 312
const HIP_Y = 284
const THIGH_TOP = 286
const KNEE_Y = 418
const CALF_TOP = 422
const ANKLE_Y = 518
const SOLE_Y = 553

/** Every piece of one arm, so the parts can be split across z-layers. */
function armParts(s: ReturnType<typeof shape>, side: 1 | -1) {
  const sx = CX + side * (s.chest * 0.98)
  const ex = CX + side * (s.chest * 1.12)
  const wx = CX + side * (s.chest * 1.18)
  return {
    shoulder: { cx: sx, cy: SHOULDER_Y, r: 15 },
    upper: limb(sx, SHOULDER_Y - 2, 11.5, ex, ELBOW_Y, 9),
    elbow: { cx: ex, cy: ELBOW_Y + 3, r: 10 },
    fore: limb(ex, ELBOW_Y + 1, 9.5, wx, WRIST_Y, 7),
    // a mitten, not a spike — the wooden figure has a rounded paddle hand
    hand: [
      `M ${wx - 7.5} ${WRIST_Y - 3}`,
      `C ${wx - 9} ${WRIST_Y + 16} ${wx - 8} ${HAND_BOT - 10} ${wx - 3.5} ${HAND_BOT - 2}`,
      `Q ${wx} ${HAND_BOT + 2} ${wx + 3.5} ${HAND_BOT - 2}`,
      `C ${wx + 8} ${HAND_BOT - 10} ${wx + 9} ${WRIST_Y + 16} ${wx + 7.5} ${WRIST_Y - 3}`,
      'Z',
    ].join(' '),
  }
}

function legParts(s: ReturnType<typeof shape>, side: 1 | -1) {
  const lx = CX + side * (s.pelvis * 0.46)
  return {
    hip: { cx: lx, cy: HIP_Y, r: 15 },
    thigh: limb(lx, THIGH_TOP, s.thigh, lx, KNEE_Y - 4, s.calf + 1, 0.06),
    knee: { cx: lx, cy: KNEE_Y, r: 12 },
    calf: limb(lx, CALF_TOP, s.calf + 1, lx, ANKLE_Y, s.calf * 0.62, 0.12),
    // a rounded block that runs forward, not a tab hanging off the leg
    foot: [
      `M ${lx - s.calf * 0.62} ${ANKLE_Y - 4}`,
      `C ${lx - s.foot * 0.8} ${ANKLE_Y + 16} ${lx - s.foot * 0.85} ${SOLE_Y} ${lx - s.foot * 0.5} ${SOLE_Y}`,
      `L ${lx + s.foot * 0.62} ${SOLE_Y}`,
      `C ${lx + s.foot} ${SOLE_Y - 3} ${lx + s.calf * 0.9} ${ANKLE_Y + 12} ${lx + s.calf * 0.62} ${ANKLE_Y - 4}`,
      'Z',
    ].join(' '),
  }
}

function Grads({ id }: { id: string }) {
  return (
    <defs>
      {/* Mapped to each shape's own bounding box, so every limb gets its own
          cylinder of light rather than one flat wash across the whole figure. */}
      <linearGradient id={`wood-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a4783f" />
        <stop offset="0.1" stopColor="#c99e64" />
        <stop offset="0.3" stopColor="#f6e8cd" />
        <stop offset="0.46" stopColor="#eedab5" />
        <stop offset="0.72" stopColor="#d3aa74" />
        <stop offset="0.9" stopColor="#b0854a" />
        <stop offset="1" stopColor="#94693a" />
      </linearGradient>
      <radialGradient id={`ball-${id}`} cx="0.34" cy="0.28" r="0.82">
        <stop offset="0" stopColor="#fbf0da" />
        <stop offset="0.42" stopColor="#e8cfa2" />
        <stop offset="0.82" stopColor="#c39a5f" />
        <stop offset="1" stopColor="#966b3a" />
      </radialGradient>
      <radialGradient id={`head-${id}`} cx="0.36" cy="0.3" r="0.86">
        <stop offset="0" stopColor="#fbf1dc" />
        <stop offset="0.46" stopColor="#ecd3a7" />
        <stop offset="0.84" stopColor="#c9a066" />
        <stop offset="1" stopColor="#9c7140" />
      </radialGradient>
    </defs>
  )
}

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
  cover,
}: {
  profile: Profile
  className?: string
  part?: 'full' | 'head' | 'forearms'
  sleeveHem?: number
  /**
   * What a garment is covering, as [from, to] fractions of figure height.
   * A flat product photo has transparent gaps inside it — between two trouser
   * legs, say — and wood showing through those gaps is the single thing that
   * makes a garment read as pasted in front of the figure rather than worn.
   *
   * Torso and legs are clipped separately, and the arms never are: a shirt
   * band that also erased the arms is what made the last attempt delete half
   * the figure.
   */
  cover?: { torso?: [number, number]; legs?: [number, number] }
}) {
  const s = shape(profile)
  const L = armParts(s, -1)
  const R = armParts(s, 1)
  const uid = part

  const svgProps = {
    className,
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    width: '100%',
    height: '100%',
    'aria-hidden': true as const,
    focusable: 'false' as const,
    preserveAspectRatio: 'xMidYMid meet' as const,
  }

  const head = (
    <>
      <circle cx={CX} cy={NECK_Y} r={10.5} fill={`url(#ball-${uid})`} stroke="#9b7340" strokeWidth="0.9" />
      <path
        d={[
          `M ${CX - s.headRx} ${(HEAD_TOP + HEAD_BOT) / 2 - 4}`,
          `C ${CX - s.headRx} ${HEAD_TOP - 2} ${CX + s.headRx} ${HEAD_TOP - 2} ${CX + s.headRx} ${(HEAD_TOP + HEAD_BOT) / 2 - 4}`,
          `C ${CX + s.headRx} ${HEAD_BOT - 8} ${CX + s.headRx * 0.52} ${HEAD_BOT} ${CX} ${HEAD_BOT}`,
          `C ${CX - s.headRx * 0.52} ${HEAD_BOT} ${CX - s.headRx} ${HEAD_BOT - 8} ${CX - s.headRx} ${(HEAD_TOP + HEAD_BOT) / 2 - 4}`,
          'Z',
        ].join(' ')}
        fill={`url(#head-${uid})`}
        stroke="#9b7340"
        strokeWidth="0.9"
      />
    </>
  )

  if (part === 'head') {
    return (
      <svg {...svgProps}>
        <Grads id={uid} />
        {head}
      </svg>
    )
  }

  if (part === 'forearms') {
    const hem = (sleeveHem ?? SLEEVE.short) * VB_H
    return (
      <svg {...svgProps}>
        <Grads id={uid} />
        <clipPath id={`below-${uid}`}>
          <rect x="0" y={hem} width={VB_W} height={VB_H} />
        </clipPath>
        <g clipPath={`url(#below-${uid})`} stroke="#9b7340" strokeWidth="0.9" strokeLinejoin="round">
          {[L, R].map((a, i) => (
            <g key={i}>
              <path d={a.upper} fill={`url(#wood-${uid})`} />
              <path d={a.fore} fill={`url(#wood-${uid})`} />
              <circle cx={a.elbow.cx} cy={a.elbow.cy} r={a.elbow.r} fill={`url(#ball-${uid})`} />
              <path d={a.hand} fill={`url(#wood-${uid})`} />
            </g>
          ))}
        </g>
      </svg>
    )
  }

  const LL = legParts(s, -1)
  const RL = legParts(s, 1)

  // Chest: a bell. Narrow at the neck, flaring across the shoulders, tapering
  // to a rounded base that the waist ball sits into.
  const chest = [
    `M ${CX - 18} ${CHEST_TOP}`,
    `C ${CX - s.chest * 0.72} ${CHEST_TOP - 3} ${CX - s.chest} ${SHOULDER_Y - 4} ${CX - s.chest} ${SHOULDER_Y + 12}`,
    `C ${CX - s.chest} ${150} ${CX - s.waist * 1.16} ${170} ${CX - s.waist} ${CHEST_BOT - 12}`,
    `Q ${CX - s.waist * 0.92} ${CHEST_BOT} ${CX} ${CHEST_BOT}`,
    `Q ${CX + s.waist * 0.92} ${CHEST_BOT} ${CX + s.waist} ${CHEST_BOT - 12}`,
    `C ${CX + s.waist * 1.16} ${170} ${CX + s.chest} ${150} ${CX + s.chest} ${SHOULDER_Y + 12}`,
    `C ${CX + s.chest} ${SHOULDER_Y - 4} ${CX + s.chest * 0.72} ${CHEST_TOP - 3} ${CX + 18} ${CHEST_TOP}`,
    `Q ${CX} ${CHEST_TOP - 7} ${CX - 18} ${CHEST_TOP}`,
    'Z',
  ].join(' ')

  // Pelvis: a rounded block, widest across the hips.
  const pelvis = [
    `M ${CX - s.waist * 0.86} ${PELVIS_TOP}`,
    `C ${CX - s.pelvis} ${PELVIS_TOP + 14} ${CX - s.pelvis} ${PELVIS_BOT - 22} ${CX - s.pelvis * 0.92} ${PELVIS_BOT - 4}`,
    `Q ${CX} ${PELVIS_BOT + 8} ${CX + s.pelvis * 0.92} ${PELVIS_BOT - 4}`,
    `C ${CX + s.pelvis} ${PELVIS_BOT - 22} ${CX + s.pelvis} ${PELVIS_TOP + 14} ${CX + s.waist * 0.86} ${PELVIS_TOP}`,
    `Q ${CX} ${PELVIS_TOP - 6} ${CX - s.waist * 0.86} ${PELVIS_TOP}`,
    'Z',
  ].join(' ')

  /** Everything above and below a covered band — the part still worth drawing. */
  const uncovered = (band?: [number, number]) =>
    band ? (
      <clipPath id={`clip-${uid}-${band[0]}`}>
        <rect x={-30} y={-30} width={VB_W + 60} height={band[0] * VB_H + 30} />
        <rect x={-30} y={band[1] * VB_H} width={VB_W + 60} height={VB_H} />
      </clipPath>
    ) : null
  const clipOf = (band?: [number, number]) =>
    band ? `url(#clip-${uid}-${band[0]})` : undefined

  return (
    <svg {...svgProps}>
      <Grads id={uid} />
      {uncovered(cover?.torso)}
      {uncovered(cover?.legs)}

      <g stroke="#9b7340" strokeWidth="0.9" strokeLinejoin="round">
        {/* limbs go down first — the body blocks and joint balls cover the seams */}
        {[L, R].map((a, i) => (
          <g key={`arm-${i}`}>
            <path d={a.upper} fill={`url(#wood-${uid})`} />
            <path d={a.fore} fill={`url(#wood-${uid})`} />
            <circle cx={a.elbow.cx} cy={a.elbow.cy} r={a.elbow.r} fill={`url(#ball-${uid})`} />
            <path d={a.hand} fill={`url(#wood-${uid})`} />
          </g>
        ))}

        <g clipPath={clipOf(cover?.legs)}>
          {[LL, RL].map((l, i) => (
            <g key={`leg-${i}`}>
              <path d={l.thigh} fill={`url(#wood-${uid})`} />
              <path d={l.calf} fill={`url(#wood-${uid})`} />
              <circle cx={l.knee.cx} cy={l.knee.cy} r={l.knee.r} fill={`url(#ball-${uid})`} />
              <path d={l.foot} fill={`url(#wood-${uid})`} />
            </g>
          ))}
        </g>

        {/* body blocks, then the joints that bridge them */}
        <g clipPath={clipOf(cover?.legs)}>
          <path d={pelvis} fill={`url(#wood-${uid})`} />
          {[LL, RL].map((l, i) => (
            <circle key={`hip-${i}`} cx={l.hip.cx} cy={l.hip.cy} r={l.hip.r} fill={`url(#ball-${uid})`} />
          ))}
        </g>

        <g clipPath={clipOf(cover?.torso)}>
          <path d={chest} fill={`url(#wood-${uid})`} />
          <circle cx={CX} cy={WAIST_Y} r={15} fill={`url(#ball-${uid})`} />
        </g>

        {[L, R].map((a, i) => (
          <circle
            key={`sh-${i}`}
            cx={a.shoulder.cx}
            cy={a.shoulder.cy}
            r={a.shoulder.r}
            fill={`url(#ball-${uid})`}
          />
        ))}

        {head}
      </g>

      <ellipse cx={CX} cy={SOLE_Y + 6} rx="60" ry="7" fill="#b9b5ab" opacity="0.3" />
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

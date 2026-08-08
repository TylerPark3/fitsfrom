import type { Profile } from '../lib/store'

/**
 * Landmarks down the figure, as fractions of its height. The garment bands in
 * the dressing room are placed against these, so a collar lands at the neck on
 * every build instead of floating wherever the container happens to put it.
 */
export const ANATOMY = {
  crown: 0.012,
  chin: 0.148,
  shoulder: 0.177,
  chest: 0.27,
  waist: 0.5,
  hip: 0.577,
  knee: 0.75,
  ankle: 0.9,
}

const VB_W = 200
const VB_H = 520

/** Half-widths at each landmark, in viewBox units, adjusted for the build. */
function shape(p: Profile) {
  const heft = (p.weight - 95) / 205
  const chest = (48 + ((p.chest - 30) / 26) * 20) * (1 + heft * 0.16)
  const waist = (38 + ((p.waist - 26) / 22) * 22) * (1 + heft * 0.22)
  const shoulder = chest * 1.1
  const hip = Math.max(waist * 1.14, chest * 0.94)
  const thigh = hip * 0.52
  const ankle = 12 + heft * 3
  const foot = 15 + ((p.shoe - 5) / 11) * 9
  const headR = 21
  return { chest, waist, shoulder, hip, thigh, ankle, foot, headR }
}

const y = (f: number) => f * VB_H

/**
 * A plain shop mannequin. No face, no drawn clothing, no texture — it exists to
 * be covered up. Anything with a personality of its own competes with the piece
 * you are actually trying to look at.
 */
export function Mannequin({ profile, className }: { profile: Profile; className?: string }) {
  const s = shape(profile)
  const cx = VB_W / 2

  // torso: shoulders → chest → waist → hip, mirrored down each side
  const torso = [
    `M ${cx - s.shoulder} ${y(ANATOMY.shoulder)}`,
    `C ${cx - s.shoulder} ${y(0.23)} ${cx - s.chest} ${y(0.24)} ${cx - s.chest} ${y(ANATOMY.chest)}`,
    `C ${cx - s.chest} ${y(0.4)} ${cx - s.waist} ${y(0.44)} ${cx - s.waist} ${y(ANATOMY.waist)}`,
    `C ${cx - s.waist} ${y(0.54)} ${cx - s.hip} ${y(0.55)} ${cx - s.hip} ${y(ANATOMY.hip)}`,
    `L ${cx + s.hip} ${y(ANATOMY.hip)}`,
    `C ${cx + s.hip} ${y(0.55)} ${cx + s.waist} ${y(0.54)} ${cx + s.waist} ${y(ANATOMY.waist)}`,
    `C ${cx + s.waist} ${y(0.44)} ${cx + s.chest} ${y(0.4)} ${cx + s.chest} ${y(ANATOMY.chest)}`,
    `C ${cx + s.chest} ${y(0.24)} ${cx + s.shoulder} ${y(0.23)} ${cx + s.shoulder} ${y(ANATOMY.shoulder)}`,
    'Z',
  ].join(' ')

  const leg = (side: 1 | -1) => {
    const inner = cx + side * 4
    const outer = cx + side * s.hip
    const kneeIn = cx + side * (s.thigh * 0.42)
    const kneeOut = cx + side * (s.thigh * 0.95)
    const ankIn = cx + side * (s.ankle * 0.35)
    const ankOut = cx + side * (s.ankle * 1.3)
    return [
      `M ${inner} ${y(ANATOMY.hip)}`,
      `L ${outer} ${y(ANATOMY.hip)}`,
      `C ${outer} ${y(0.66)} ${kneeOut} ${y(0.7)} ${kneeOut} ${y(ANATOMY.knee)}`,
      `C ${kneeOut} ${y(0.83)} ${ankOut} ${y(0.85)} ${ankOut} ${y(ANATOMY.ankle)}`,
      `L ${ankIn} ${y(ANATOMY.ankle)}`,
      `C ${ankIn} ${y(0.85)} ${kneeIn} ${y(0.83)} ${kneeIn} ${y(ANATOMY.knee)}`,
      `C ${kneeIn} ${y(0.7)} ${inner} ${y(0.66)} ${inner} ${y(ANATOMY.hip)}`,
      'Z',
    ].join(' ')
  }

  // arms hang slightly away from the body so a sleeve has somewhere to sit
  const arm = (side: 1 | -1) => {
    const top = cx + side * (s.shoulder - 3)
    const elbow = cx + side * (s.shoulder + 7)
    const wrist = cx + side * (s.shoulder + 3)
    const w = 8.5
    return [
      `M ${top - side * w} ${y(ANATOMY.shoulder)}`,
      `C ${elbow - side * w} ${y(0.32)} ${elbow - side * w} ${y(0.42)} ${wrist - side * w} ${y(0.53)}`,
      `L ${wrist + side * w} ${y(0.53)}`,
      `C ${elbow + side * w} ${y(0.42)} ${elbow + side * w} ${y(0.32)} ${top + side * w} ${y(ANATOMY.shoulder)}`,
      'Z',
    ].join(' ')
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="mnq" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d6ce" />
          <stop offset="0.42" stopColor="#f0eee8" />
          <stop offset="1" stopColor="#cfccc3" />
        </linearGradient>
      </defs>

      <g fill="url(#mnq)" stroke="#b9b5ab" strokeWidth="1.1" strokeLinejoin="round">
        {/* arms sit behind the torso so a sleeve reads as going over them */}
        <path d={arm(-1)} />
        <path d={arm(1)} />
        <path d={leg(-1)} />
        <path d={leg(1)} />
        <path d={torso} />
        {/* neck */}
        <rect x={cx - 13} y={y(0.128)} width="26" height={y(ANATOMY.shoulder) - y(0.128) + 4} rx="8" />
        {/* head — blank on purpose, a shop form has no face */}
        <ellipse cx={cx} cy={y(0.075)} rx={s.headR} ry={y(0.075) - y(ANATOMY.crown)} />
      </g>

      {/* feet */}
      <g fill="#c4c0b6">
        <ellipse cx={cx - s.ankle * 0.85} cy={y(0.968)} rx={s.foot} ry={y(0.03)} />
        <ellipse cx={cx + s.ankle * 0.85} cy={y(0.968)} rx={s.foot} ry={y(0.03)} />
      </g>

      {/* the stand */}
      <rect x={cx - 3} y={y(0.98)} width="6" height={y(0.02)} fill="#b9b5ab" />
      <ellipse cx={cx} cy={y(0.998)} rx="46" ry="7" fill="#c4c0b6" />
    </svg>
  )
}

/** Just the head and neck, drawn again over a shirt so the collar reads right. */
export function MannequinHead({ profile, className }: { profile: Profile; className?: string }) {
  const s = shape(profile)
  const cx = VB_W / 2
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="mnqh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d6ce" />
          <stop offset="0.42" stopColor="#f0eee8" />
          <stop offset="1" stopColor="#cfccc3" />
        </linearGradient>
      </defs>
      <g fill="url(#mnqh)" stroke="#b9b5ab" strokeWidth="1.1" strokeLinejoin="round">
        <rect x={cx - 13} y={y(0.128)} width="26" height={y(0.03)} rx="8" />
        <ellipse cx={cx} cy={y(0.075)} rx={s.headR} ry={y(0.075) - y(ANATOMY.crown)} />
      </g>
    </svg>
  )
}

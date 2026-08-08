import type { Profile } from '../lib/store'

/**
 * Landmarks down the figure, as fractions of its height.
 *
 * These are the classical eight-head canon — head 0–1, shoulders at 1.5,
 * navel at 3, crotch at 4 (dead centre), knee at 6, ankle at 7.5, sole at 8.
 * The garment bands in the dressing room are placed against these, so a
 * waistband lands at the waist and a hem lands at the ankle. The previous
 * numbers put the crotch at 0.577 and the ankle at 0.9, which is why the legs
 * came out as stubs and the trousers looked like shorts.
 */
export const ANATOMY = {
  crown: 0,
  chin: 0.125, // 1 head
  neck: 0.155,
  shoulder: 0.19, // 1.5 heads
  chest: 0.25, // 2 heads
  waist: 0.375, // 3 heads
  crotch: 0.5, // 4 heads — the midpoint of a standing body
  knee: 0.75, // 6 heads
  ankle: 0.93, // 7.5 heads
  sole: 1,
}

const VB_W = 220
const VB_H = 560

/** Half-widths at each landmark, in viewBox units, adjusted for the build. */
function shape(p: Profile) {
  const heft = (p.weight - 95) / 205
  // Kept narrow on purpose: a garment photographed flat is always slimmer than
  // a body, so a wide form pokes out either side of everything you put on it.
  const chest = (31 + ((p.chest - 30) / 26) * 12) * (1 + heft * 0.13)
  const waist = (25 + ((p.waist - 26) / 22) * 13) * (1 + heft * 0.17)
  const shoulder = Math.max(chest * 1.14, 36)
  const hip = Math.max(waist * 1.16, chest * 0.92)
  return {
    chest,
    waist,
    shoulder,
    hip,
    thigh: hip * 0.5,
    knee: 12 + heft * 2.5,
    ankle: 8 + heft * 1.5,
    foot: 13 + ((p.shoe - 5) / 11) * 7,
    headRx: 22,
    headRy: (ANATOMY.chin * VB_H) / 2 - 3,
    neckW: 12,
  }
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

  // Torso: shoulder line → armpit → waist → hip, mirrored down the far side.
  const torso = [
    // neck base → sloped shoulder → down the side
    `M ${cx - s.neckW / 2 - 2} ${y(ANATOMY.neck)}`,
    `Q ${cx - s.shoulder * 0.62} ${y(ANATOMY.neck + 0.004)} ${cx - s.shoulder} ${y(ANATOMY.shoulder)}`,
    `C ${cx - s.shoulder} ${y(0.23)} ${cx - s.chest} ${y(0.23)} ${cx - s.chest} ${y(ANATOMY.chest)}`,
    `C ${cx - s.chest} ${y(0.31)} ${cx - s.waist} ${y(0.33)} ${cx - s.waist} ${y(ANATOMY.waist)}`,
    `C ${cx - s.waist} ${y(0.42)} ${cx - s.hip} ${y(0.44)} ${cx - s.hip} ${y(0.475)}`,
    `L ${cx - s.hip} ${y(ANATOMY.crotch)}`,
    `L ${cx + s.hip} ${y(ANATOMY.crotch)}`,
    `L ${cx + s.hip} ${y(0.475)}`,
    `C ${cx + s.hip} ${y(0.44)} ${cx + s.waist} ${y(0.42)} ${cx + s.waist} ${y(ANATOMY.waist)}`,
    `C ${cx + s.waist} ${y(0.33)} ${cx + s.chest} ${y(0.31)} ${cx + s.chest} ${y(ANATOMY.chest)}`,
    `C ${cx + s.chest} ${y(0.23)} ${cx + s.shoulder} ${y(0.23)} ${cx + s.shoulder} ${y(ANATOMY.shoulder)}`,
    `Q ${cx + s.shoulder * 0.62} ${y(ANATOMY.neck + 0.004)} ${cx + s.neckW / 2 + 2} ${y(ANATOMY.neck)}`,
    'Z',
  ].join(' ')

  // Legs run crotch → knee → ankle, two of them, with a real gap between.
  const leg = (side: 1 | -1) => {
    const hipC = cx + side * (s.hip * 0.5) // centre line of this leg
    return [
      `M ${hipC - s.thigh} ${y(ANATOMY.crotch)}`,
      `C ${hipC - s.thigh} ${y(0.6)} ${hipC - s.knee} ${y(0.68)} ${hipC - s.knee} ${y(ANATOMY.knee)}`,
      `C ${hipC - s.knee} ${y(0.84)} ${hipC - s.ankle} ${y(0.87)} ${hipC - s.ankle} ${y(ANATOMY.ankle)}`,
      `L ${hipC + s.ankle} ${y(ANATOMY.ankle)}`,
      `C ${hipC + s.ankle} ${y(0.87)} ${hipC + s.knee} ${y(0.84)} ${hipC + s.knee} ${y(ANATOMY.knee)}`,
      `C ${hipC + s.knee} ${y(0.68)} ${hipC + s.thigh} ${y(0.6)} ${hipC + s.thigh} ${y(ANATOMY.crotch)}`,
      'Z',
    ].join(' ')
  }

  /**
   * Arms as a stroked centre line rather than a filled outline — a filled shape
   * with bezier sides kept blowing out into slabs wider than the shirt. Drawn
   * twice, thick in the outline colour then thinner in the fill, which gives a
   * clean tapered limb with an edge.
   */
  const armPath = (side: 1 | -1) =>
    [
      `M ${cx + side * (s.shoulder - 6)} ${y(ANATOMY.shoulder + 0.022)}`,
      `Q ${cx + side * (s.chest + 6)} ${y(0.33)}`,
      `${cx + side * (s.hip + 2)} ${y(0.485)}`,
    ].join(' ')

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="mnq" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d5d1c8" />
          <stop offset="0.4" stopColor="#efece5" />
          <stop offset="1" stopColor="#cbc7bd" />
        </linearGradient>
      </defs>

      {/* arms behind the torso, so a sleeve reads as going over the shoulder */}
      <g fill="none" strokeLinecap="round">
        <path d={armPath(-1)} stroke="#b6b2a8" strokeWidth="17" />
        <path d={armPath(1)} stroke="#b6b2a8" strokeWidth="17" />
        <path d={armPath(-1)} stroke="#e9e6df" strokeWidth="15" />
        <path d={armPath(1)} stroke="#e9e6df" strokeWidth="15" />
      </g>

      <g fill="url(#mnq)" stroke="#b6b2a8" strokeWidth="1" strokeLinejoin="round">
        <path d={leg(-1)} />
        <path d={leg(1)} />
        <path d={torso} />
        {/* neck */}
        <rect
          x={cx - s.neckW / 2}
          y={y(ANATOMY.chin) - 2}
          width={s.neckW}
          height={y(ANATOMY.shoulder) - y(ANATOMY.chin) + 6}
          rx="6"
        />
        {/* head — blank on purpose, a shop form has no face */}
        <ellipse cx={cx} cy={s.headRy} rx={s.headRx} ry={s.headRy} />
      </g>

      {/* feet */}
      <g fill="#c0bcb2" stroke="#b6b2a8" strokeWidth="1">
        <path
          d={`M ${cx - s.hip * 0.5 - s.ankle} ${y(ANATOMY.ankle)} h ${s.ankle * 2} l ${s.foot * 0.4} ${y(0.052)} h ${-s.foot * 1.7} Z`}
        />
        <path
          d={`M ${cx + s.hip * 0.5 - s.ankle} ${y(ANATOMY.ankle)} h ${s.ankle * 2} l ${s.foot * 0.4} ${y(0.052)} h ${-s.foot * 1.7} Z`}
        />
      </g>

      {/* the base it stands on */}
      <ellipse cx={cx} cy={y(0.992)} rx="58" ry="8" fill="#c9c5bb" opacity="0.85" />
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
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="mnqh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d5d1c8" />
          <stop offset="0.4" stopColor="#efece5" />
          <stop offset="1" stopColor="#cbc7bd" />
        </linearGradient>
      </defs>
      <g fill="url(#mnqh)" stroke="#b6b2a8" strokeWidth="1" strokeLinejoin="round">
        <rect
          x={cx - s.neckW / 2}
          y={y(ANATOMY.chin) - 2}
          width={s.neckW}
          height={y(ANATOMY.neck) - y(ANATOMY.chin) + 8}
          rx="6"
        />
        <ellipse cx={cx} cy={s.headRy} rx={s.headRx} ry={s.headRy} />
      </g>
    </svg>
  )
}

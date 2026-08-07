/**
 * Sourced styling rules, tunable in one place.
 * Every threshold carries the URL it came from; seasonal drift is a config
 * edit here, never a change in the scoring code.
 * Full derivation: STYLING-ENGINE-SPEC.md
 */

export const PROPORTION = {
  /**
   * Commit to a proportion — the near-miss is the failure state.
   * "You can't put on a fat-ass T-shirt with some jeans that's like halfway baggy."
   * SOURCE: https://www.complex.com/style/a/andrew-luecke/giovanna-ramos-big-pants-style-tips-adidas
   * SOURCE: https://dieworkwear.com/2022/10/15/how-to-develop-good-taste-pt-4/
   */
  polarizationGate: true,
  /**
   * Oversized survives by being short — boxy cuts "maintain visual definition
   * by limiting length."
   * SOURCE: https://www.highsnobiety.com/p/oversized-fashion-mens/
   */
  maxTopLengthWhenBothLoose: 0.5,
  /**
   * Fuller-top-over-slimmer-bottom vs the streetwear inverse: sources conflict,
   * so this ships neutral and moves only with user feedback.
   * SOURCE: https://putthison.com/how-to-understand-silhouettes-pt-two/
   */
  mixBias: 0,
  /** Slim-on-slim "lack[s] dimensional interest" — not wrong, just flat. */
  columnarPenalty: 12,
} as const

export const FOOTWEAR = {
  /**
   * Chunky shoes need leg volume. Highsnobiety says wide-leg, Complex says
   * straight-leg — we encode only the overlap.
   * SOURCE: https://www.highsnobiety.com/p/sneakers-pants-styles-guide/
   * SOURCE: https://www.complex.com/sneakers/a/calvy-click/rules-for-matching-your-sneakers-to-your-outfit
   */
  chunkyNeedsVolume: true,
  /**
   * Boots: the cuff must fall inside the boot collar, behind the tongue.
   * SOURCE: https://www.complex.com/style/a/gregory-babcock/guide-on-how-to-wear-timberland-boots
   */
  bootCuffMustClearCollar: true,
  /** Weight gap beyond this and the shoe out-shouts the upper half. */
  maxWeightGap: 0.6,
} as const

export const COLOR = {
  /**
   * Hue clusters, not a raw colour count — the real "three colour rule".
   * Two clusters reads composed; five reads accidental.
   */
  maxHueClusters: 2,
  /** Analogous (<32°) or near-complementary (>145°) relate; the middle clashes. */
  analogousMax: 32,
  complementaryMin: 145,
  /** One high-chroma accent is exempt from parity — that is what an accent is. */
  accentExemptions: 1,
  /** Everything at one lightness reads flat regardless of hue. */
  minValueSpread: 0.15,
} as const

export const STATEMENT = {
  /**
   * One anchor, everything else supporting. Two is a deliberate choice;
   * three is noise unless loudness is the user's whole point.
   * SOURCE: NBA stylist guidance, Complex/Footwear News (Courtney Mays)
   */
  idealAnchors: 1,
  maxBeforePenalty: 2,
  /** Above this loudness the user is not penalised for stacking anchors. */
  loudTolerance: 0.65,
} as const

export const LAYERING = {
  /** Beyond three torso layers the outfit stops reading and starts bulking. */
  maxTorsoLayers: 3,
  /** Each layer should step longer than the one beneath it. */
  minLengthStep: 0.04,
} as const

export const TEXTURE = {
  /** A tonal fit needs texture variety or it goes dead flat. */
  minTexturesWhenTonal: 2,
} as const

/**
 * Trends decay; principles do not. Volume targets in particular are drifting —
 * two 2026 sources report movement away from maximum volume.
 * SOURCE: https://www.highsnobiety.com/p/tight-oversized-trend-2026/
 */
export const TRENDS = {
  reviewBy: '2027-02',
  note: 'Volume targets drift. Re-check silhouette constants each season.',
} as const

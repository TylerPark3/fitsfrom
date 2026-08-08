import type { FitPiece } from './fits'

/**
 * A culturally relevant outfit, sourced from a post someone else published.
 *
 * Instagram discovers the fit. Fits From explains it. The post is the input;
 * everything around it — identification, analysis, translation to your body —
 * is the product. The model is deliberately shallow so an editor can add one
 * by hand, and so a future admin form maps onto it field for field.
 */
export type FitContextType = 'tunnel' | 'pregame' | 'postgame' | 'event' | 'street' | 'editorial'
export type FitPlatform = 'instagram' | 'editorial' | 'owned'
export type RightsStatus = 'official-embed' | 'owned' | 'licensed' | 'permission' | 'pending'

/** How sure we are about a given garment. Never claim more than we have. */
export type IdConfidence = 'exact' | 'strong' | 'similar' | 'alternative' | 'community' | 'pending'

export interface IdentifiedPiece extends FitPiece {
  confidence: IdConfidence
  /** 0–100, only shown for exact/strong. Absent means we won't put a number on it. */
  score?: number
  /** Why we believe it, in one line. Shown on the premium breakdown. */
  evidence?: string
}

export interface SocialFitPost {
  id: string
  /** Stable URL slug — /tunnel/<slug>. */
  slug: string

  person: {
    name: string
    handle?: string
    team?: string
    league?: string
    avatar?: string
  }

  context: {
    type: FitContextType
    event?: string
    location?: string
  }

  source: {
    platform: FitPlatform
    account?: string
    /** Paste the official post permalink here. Empty renders the placeholder. */
    url?: string
    rightsStatus?: RightsStatus
  }

  editorial: {
    headline: string
    dek?: string
    /** The free read — one short, opinionated paragraph. */
    quickTake: string
  }

  /** Premium analysis. Written per fit; long term, generated from the engine. */
  analysis?: {
    silhouette?: string
    proportion?: string
    color?: string
    layering?: string
    footwear?: string
    whyItWorks?: string
    /** Sizing translation. Only written where the actual fit supports it. */
    translation?: string
  }

  pieces: IdentifiedPiece[]

  /** Seed counts. Local interactions add on top — see socialRepository. */
  engagement: { likes: number; comments: number; saves: number }

  /** Whether a full breakdown exists behind Pro. */
  premium: boolean

  /** ISO timestamp — drives the "2 HOURS AGO" line. */
  publishedAt: string

  /** Links back to a Fit in src/data/fits.ts when one covers the same look. */
  fitId?: string

  tags: string[]
}

/**
 * One post, built out properly, rather than a dozen filled with placeholder.
 * The garments below are the ones described in the existing `sga-arrival`
 * fit file — grey bonded hoodie, white tee, camo 3/4 cargos, stacked socks,
 * cream sneakers. Nothing here asserts a brand we haven't identified.
 */
export const SOCIAL_FITS: SocialFitPost[] = [
  {
    id: 'sga-tunnel-opener',
    slug: 'sga-thunder-tunnel',
    person: {
      name: 'Shai Gilgeous-Alexander',
      handle: 'shaigilgeousalexander',
      team: 'Oklahoma City',
      league: 'NBA',
    },
    context: {
      type: 'tunnel',
      event: 'Home opener',
      location: 'Paycom Center, Oklahoma City',
    },
    source: {
      platform: 'instagram',
      account: '@leaguefits',
      // ── PASTE THE OFFICIAL INSTAGRAM POST URL HERE ──────────────────────
      // Verified public post from @leaguefits naming SGA their 2022–23 MVP.
      // Swap for any other official permalink; empty renders the
      // "official post coming soon" state rather than a broken embed.
      url: 'https://www.instagram.com/p/CsRYjDKpjaV/',
      rightsStatus: 'official-embed',
    },
    editorial: {
      headline: 'The cargo length is the whole argument',
      dek: 'A hoodie, a cropped cargo and a dog — and two months of people asking whether they were shorts.',
      quickTake:
        'The hoodie is boxy and short, so the volume stops at the waist instead of running down the body. That hands the whole lower half to the cargo, and cutting it at the calf turns an ordinary trouser into the loudest thing in the fit. The cream sneaker and stacked sock keep the break clean — without them the leg just ends.',
    },
    analysis: {
      silhouette:
        'Short, wide top over a wide, cropped bottom. Both halves are loose, which normally reads sloppy — it holds here because the hoodie stops at the hip and the cargo stops at the calf, so neither volume runs into the other.',
      proportion:
        'Roughly a 1:1 split at the waist rather than the usual 1:2. Equal volumes above and below only work when both are cut short; lengthen either one and the whole thing collapses into a shapeless column.',
      color:
        'Grey top, camo bottom, cream shoe. The camo is doing all the pattern work, so everything else is deliberately flat — one busy piece, two quiet ones.',
      layering:
        'A white tee sits just under the hoodie hem. It is a single visible line, and it is the only thing separating two large blocks of fabric.',
      footwear:
        'A low cream sneaker under a wide, cropped leg. The stacked sock fills the gap the crop opens up; a chunky shoe here would fight the cargo for attention and a low-cut sock would leave the ankle stranded.',
      whyItWorks:
        'Every choice is about where things end. Hoodie ends at the hip, cargo ends at the calf, sock ends above the shoe. Three deliberate stopping points in a fit that would otherwise be two large rectangles.',
      translation:
        'This look depends on the cargo hem landing mid-calf, not on the garment size. If you are shorter than SGA, buying his size gives you a trouser that hits at the ankle and reads as a badly-fitted pant rather than a crop. Set your build in the Avatar tab and Fits From maps the hem, not the label size.',
    },
    pieces: [
      {
        slot: 'Hoodie',
        worn: 'Boxy bonded grey hoodie',
        match: { category: 'top', kw: 'hoodie|sweatshirt' },
        confidence: 'similar',
        evidence: 'Bonded fleece, no drawcord, cropped body. Brand not confirmed.',
      },
      {
        slot: 'Tee',
        worn: 'White tee under the hoodie',
        match: { category: 'top', kw: 'tee|t-shirt' },
        confidence: 'alternative',
      },
      {
        slot: 'Cargo',
        worn: 'Camo 3/4-length cargo',
        match: { category: 'pants', kw: 'cargo|camo|short' },
        confidence: 'similar',
        evidence: 'Six-pocket camo, hem cut above the ankle.',
      },
      {
        slot: 'Socks',
        worn: 'Stacked white socks',
        match: { category: 'accessory', kw: 'sock' },
        confidence: 'alternative',
      },
      {
        slot: 'Sneakers',
        worn: 'Cream low sneaker',
        match: { category: 'shoes', kw: 'sneaker|trainer|runner' },
        confidence: 'similar',
      },
    ],
    engagement: { likes: 2417, comments: 183, saves: 946 },
    premium: true,
    publishedAt: '2026-08-07T16:40:00Z',
    fitId: 'sga-arrival',
    tags: ['NBA', 'Tunnel', 'Cargo', 'Oklahoma City'],
  },
]

export const LEAGUES = ['All', 'NBA', 'Music', 'NFL', 'Soccer', 'F1', 'Creators'] as const
export type LeagueFilter = (typeof LEAGUES)[number]

export const findSocialFit = (slug: string) => SOCIAL_FITS.find((p) => p.slug === slug)

/** "12 MIN AGO" / "2 HOURS AGO" / "YESTERDAY" / "AUG 7". */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((now - then) / 60000)
  if (mins < 1) return 'JUST NOW'
  if (mins < 60) return `${mins} MIN AGO`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} HOUR${hours === 1 ? '' : 'S'} AGO`
  if (hours < 48) return 'YESTERDAY'
  return new Date(then)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()
}

export const CONFIDENCE_LABEL: Record<IdConfidence, string> = {
  exact: 'Exact match',
  strong: 'Strongly identified',
  similar: 'Similar piece',
  alternative: 'Style alternative',
  community: 'Community ID',
  pending: 'Identification pending',
}

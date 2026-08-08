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
 *
 * The editorial below describes the outfit in THIS post — a denim western
 * shirt worn open over a white tee, with white sweatpants. If the URL is
 * swapped, the read has to be rewritten with it: text that describes a
 * different fit to the one on screen is worse than no text at all. No brand is
 * asserted that we haven't actually identified, and the shoes are marked
 * pending because they aren't visible in the frame.
 */
export const SOCIAL_FITS: SocialFitPost[] = [
  {
    id: 'sga-leaguefits-mvp',
    slug: 'sga-leaguefits-mvp',
    person: {
      name: 'Shai Gilgeous-Alexander',
      handle: 'shaigilgeousalexander',
      team: 'Oklahoma City',
      league: 'NBA',
    },
    context: {
      type: 'editorial',
      event: 'LeagueFits \u201923 Awards — Most Valuable Player',
      location: 'NBA season 2022–23',
    },
    source: {
      platform: 'instagram',
      account: '@leaguefits',
      // ── PASTE THE OFFICIAL INSTAGRAM POST URL HERE ──────────────────────
      // Everything below describes THIS post. Swap the URL and the editorial
      // has to be rewritten with it, or the read describes the wrong outfit.
      url: 'https://www.instagram.com/p/CsRYjDKpjaV/',
      rightsStatus: 'official-embed',
    },
    editorial: {
      headline: 'Won it in a denim shirt and white sweats',
      dek: 'LeagueFits named him their 2022–23 fit MVP. The photo they picked to say it is the least complicated thing he wore all year.',
      quickTake:
        'A denim western shirt worn open over a white tee, white sweatpants, a thin silver chain. Four pieces, no logos doing any work, and the only real decision is that the shirt stays unbuttoned — which turns a flat blue rectangle into two vertical lines running the length of the torso. Everything below the waist is white, so the eye goes straight to the blue and stops there.',
    },
    analysis: {
      silhouette:
        'Open shirt over a fitted tee, straight-legged sweat below. The shirt reads as a light jacket rather than a shirt, which is entirely down to leaving it unbuttoned — closed, it would be one solid block and the outfit would flatten.',
      proportion:
        'The shirt hem sits just past the hip and the sweatpant is full length, so it is close to a 1:2 split. Conservative, and it is the reason a fit this plain still holds shape.',
      color:
        'Two colours and a metal. White carries the bottom half and the tee, denim blue carries the top, and the chain is the only thing catching light. Nothing is competing.',
      layering:
        'One layer over one layer. The white tee showing through the open placket is what keeps the blue from becoming a wall — it is a deliberate strip of contrast down the middle.',
      footwear:
        'Not visible in this frame, so we are not going to tell you what it was. The pant is long enough to break over most shoes, which is what lets a plain sweat read as considered rather than lazy.',
      whyItWorks:
        'It is restraint with one move in it. Every piece is basic, the palette is two colours, and the single decision — leaving the shirt open — does all the structural work. That is the argument for why he won: he does not need the clothes to be loud.',
      translation:
        'The open shirt only works if it hangs straight. On a narrower frame a boxy western shirt will flare at the hem instead of falling, so size it to your shoulders rather than for room. Set your build in the Avatar tab and Fits From ranks by how a piece actually falls on you.',
    },
    pieces: [
      {
        slot: 'Shirt',
        worn: 'Denim western shirt, worn open',
        match: { category: 'shirt', kw: 'denim|western|chambray|snap' },
        confidence: 'similar',
        evidence: 'Snap-front, two chest pockets, mid-blue wash. Brand not confirmed from this frame.',
      },
      {
        slot: 'Tee',
        worn: 'Plain white tee',
        match: { category: 'top', kw: 'tee|t-shirt' },
        confidence: 'alternative',
      },
      {
        slot: 'Sweatpant',
        worn: 'White sweatpant with small graphic',
        match: { category: 'pants', kw: 'sweat|jogger' },
        confidence: 'similar',
        evidence: 'Elasticated cuff, small yellow print at the thigh.',
      },
      {
        slot: 'Chain',
        worn: 'Thin silver chain',
        match: { category: 'accessory', kw: 'chain|necklace' },
        confidence: 'alternative',
      },
      {
        slot: 'Shoes',
        worn: 'Not visible in this frame',
        match: { category: 'shoes', kw: 'sneaker|trainer' },
        confidence: 'pending',
      },
    ],
    engagement: { likes: 2417, comments: 183, saves: 946 },
    premium: true,
    publishedAt: '2026-08-07T16:40:00Z',
    fitId: 'sga-arrival',
    tags: ['NBA', 'Denim', 'LeagueFits', 'Oklahoma City'],
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

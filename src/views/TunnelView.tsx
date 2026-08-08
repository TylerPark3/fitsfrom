import { useMemo, useState } from 'react'
import {
  CONFIDENCE_LABEL,
  LEAGUES,
  SOCIAL_FITS,
  findSocialFit,
  timeAgo,
  type LeagueFilter,
} from '../data/socialFits'
import { resolve } from '../lib/fitmatch'
import { useStore } from '../lib/store'
import { InstagramFitEmbed } from '../components/InstagramFitEmbed'
import { SocialFitCard } from '../components/tunnel/SocialFitCard'
import { FitEngagementBar } from '../components/tunnel/FitEngagementBar'
import { FitTakesDrawer } from '../components/tunnel/FitTakesDrawer'
import { PremiumFitAnalysis } from '../components/tunnel/PremiumFitAnalysis'
import { Arrow } from '../components/Icons'

/**
 * The Tunnel — what culturally relevant people are actually wearing.
 *
 * Instagram discovers the fit; this is where it gets explained. The feed and
 * the full report share one route: `slug` decides which you get, so a post has
 * a real address (/tunnel/<slug>) without pulling a router into the app.
 */
export function TunnelView({
  slug,
  onOpen,
  onSlug,
}: {
  slug: string | null
  onOpen: (id: string) => void
  onSlug: (slug: string | null) => void
}) {
  const { toast } = useStore()
  const [league, setLeague] = useState<LeagueFilter>('All')

  const posts = useMemo(
    () => (league === 'All' ? SOCIAL_FITS : SOCIAL_FITS.filter((p) => p.person.league === league)),
    [league],
  )

  const post = slug ? findSocialFit(slug) : null
  if (slug && post) return <FitReport post={post} onOpen={onOpen} onBack={() => onSlug(null)} />

  return (
    <div className="wrap tunnel">
      <div className="pagehead">
        <span className="eyebrow">The tunnel</span>
        <h2>What they’re wearing before the game.</h2>
        <p>
          Instagram finds the fit. We identify the pieces, explain the proportion and translate it to
          your body.
        </p>
      </div>

      <div className="tunnel__filters" role="tablist" aria-label="Filter the tunnel">
        {LEAGUES.map((l) => {
          const n = l === 'All' ? SOCIAL_FITS.length : SOCIAL_FITS.filter((p) => p.person.league === l).length
          return (
            <button
              key={l}
              role="tab"
              aria-selected={league === l}
              className={`tfilter${league === l ? ' is-on' : ''}${n === 0 ? ' is-empty' : ''}`}
              onClick={() => setLeague(l)}
            >
              {l}
              {n > 0 && <i>{n}</i>}
            </button>
          )
        })}
      </div>

      {posts.length === 0 ? (
        <div className="empty">
          <h3>Nothing here yet.</h3>
          <p>{league} coverage is next. NBA is live now.</p>
          <button className="btn btn--ghost" onClick={() => setLeague('All')}>
            Back to all
          </button>
        </div>
      ) : (
        <div className="tunnel__feed">
          {posts.map((p) => (
            <SocialFitCard key={p.id} post={p} onOpen={onOpen} onFull={onSlug} onToast={toast} />
          ))}
        </div>
      )}
    </div>
  )
}

/** The full report for one fit. */
function FitReport({
  post,
  onOpen,
  onBack,
}: {
  post: ReturnType<typeof findSocialFit> & object
  onOpen: (id: string) => void
  onBack: () => void
}) {
  const { toast } = useStore()
  const [takesOpen, setTakesOpen] = useState(false)
  const [, force] = useState(0)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tunnel/${post.slug}`

  return (
    <div className="wrap report">
      <button className="report__back" onClick={onBack}>
        ← The tunnel
      </button>

      <header className="report__head">
        <span className="eyebrow">
          {post.person.league} · {post.context.type} · {timeAgo(post.publishedAt)}
        </span>
        <h2 className="report__who">{post.person.name}</h2>
        <p className="report__where">
          {[post.person.team, post.context.event, post.context.location].filter(Boolean).join(' · ')}
        </p>
      </header>

      <div className="report__grid">
        <div className="report__media">
          <InstagramFitEmbed
            url={post.source.url}
            accountName={post.source.account}
            sourceLabel={post.source.account}
          />
        </div>

        <div className="report__read">
          <h3 className="serif report__headline">{post.editorial.headline}</h3>
          {post.editorial.dek && <p className="report__dek">{post.editorial.dek}</p>}
          <span className="eyebrow">The fit</span>
          <p className="report__take">{post.editorial.quickTake}</p>

          <div className="report__pieces">
            <span className="eyebrow">Pieces</span>
            {post.pieces.map((p) => {
              const prod = resolve(p)
              return (
                <div className="rpiece" key={p.slot}>
                  <div>
                    <b>{p.slot}</b>
                    <span className="tiny">{p.worn}</span>
                  </div>
                  <span className={`conf conf--${p.confidence}`}>
                    <i />
                    {CONFIDENCE_LABEL[p.confidence]}
                  </span>
                  {prod && (
                    <button className="linkish" onClick={() => onOpen(prod.id)}>
                      View piece
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <FitEngagementBar
        postId={post.id}
        seed={{ likes: post.engagement.likes, saves: post.engagement.saves }}
        takesCount={post.engagement.comments}
        onOpenTakes={() => setTakesOpen(true)}
        shareUrl={shareUrl}
        shareTitle={`${post.person.name} — ${post.editorial.headline}`}
        onToast={toast}
      />

      <PremiumFitAnalysis post={post} onOpen={onOpen} onSubscribe={() => force((n) => n + 1)} />

      <section className="report__source">
        <span className="eyebrow">Source</span>
        <p className="tiny">
          {post.source.account ?? 'Official post'} ·{' '}
          {post.source.rightsStatus === 'pending'
            ? 'Embed pending — no media is copied into this site.'
            : post.source.rightsStatus}
        </p>
        {post.source.url && (
          <a className="linkish" href={post.source.url} target="_blank" rel="noreferrer noopener">
            View the original post <Arrow />
          </a>
        )}
      </section>

      {takesOpen && (
        <FitTakesDrawer
          postId={post.id}
          slots={post.pieces.map((p) => p.slot)}
          onClose={() => setTakesOpen(false)}
          onCount={() => {}}
        />
      )}
    </div>
  )
}

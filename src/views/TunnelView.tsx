import { useMemo, useState } from 'react'
import {
  CONFIDENCE_LABEL,
  leagueFilters,
  SOCIAL_FITS,
  findSocialFit,
  timeAgo,
  type LeagueFilter,
} from '../data/socialFits'
import { resolve } from '../lib/fitmatch'
import { hotBrands, mostIdentified, rankedFits } from '../lib/heat'
import { useStore } from '../lib/store'
import { ProductCard } from '../components/ProductCard'
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
  onBrand,
}: {
  slug: string | null
  onOpen: (id: string) => void
  onSlug: (slug: string | null) => void
  onBrand: (brand: string | null) => void
}) {
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
      <TunnelFeed onOpen={onOpen} onSlug={onSlug} onBrand={onBrand} />
    </div>
  )
}

/**
 * The publication itself: filters, the feed, and the two aggregate views.
 *
 * Lives apart from the page wrapper because the front page *is* this — a
 * publication's home should be the publication, not a hero pointing at it.
 */
export function TunnelFeed({
  onOpen,
  onSlug,
  onBrand,
}: {
  onOpen: (id: string) => void
  onSlug: (slug: string | null) => void
  onBrand: (brand: string | null) => void
}) {
  const { toast, saved } = useStore()
  const [league, setLeague] = useState<LeagueFilter>('All')

  // Hottest first — engagement decayed over time, so a post has to earn its
  // place rather than just outlive the others.
  const posts = useMemo(() => {
    const hot = rankedFits().map((f) => f.post)
    return league === 'All' ? hot : hot.filter((p) => p.person.league === league)
  }, [league])

  const filters = useMemo(() => leagueFilters(), [])
  const cosigned = useMemo(() => mostIdentified(saved, 4), [saved])
  const brands = useMemo(() => hotBrands(6), [])

  return (
    <>
      <div className="tunnel__filters" role="tablist" aria-label="Filter the tunnel">
        {filters.map((l) => {
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

      {/* ── cosigned ──────────────────────────────────────────────────────
          The pieces themselves, ranked by how many documented fits they turn
          up in. It's the one signal here that nobody self-reports. */}
      {cosigned.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h3>Cosigned</h3>
            <span className="tiny">The pieces that turn up in the most documented fits</span>
          </div>
          <div className="grid">
            {cosigned.map((c) => (
              <ProductCard
                key={c.product.id}
                product={c.product}
                onOpen={onOpen}
                footer={
                  // Three names and a count. The card already carries a cosign
                  // line above; twelve names underneath it was the same fact
                  // told twice, at length.
                  <p className="cosignline tiny">
                    {c.cosigns.slice(0, 3).join(', ')}
                    {c.cosigns.length > 3 && ` +${c.cosigns.length - 3}`}
                  </p>
                }
              />
            ))}
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h3>Brands with reach</h3>
            <button className="linkish" onClick={() => onBrand(null)}>
              All brands
            </button>
          </div>
          <div className="brandheat">
            {brands.map((b, i) => (
              <button className="brandheat__row" key={b.brand} onClick={() => onBrand(b.brand)}>
                <span className="board__n">{String(i + 1).padStart(2, '0')}</span>
                <b>{b.brand}</b>
                <span className="brandheat__people">{b.people.join(' · ')}</span>
                <span className="brandheat__n">{b.people.length}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
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
        {post.stylist && (
          <p className="report__stylist">
            <span className="eyebrow">Styled by</span>{' '}
            {post.stylist.handle ? (
              <a
                href={`https://instagram.com/${post.stylist.handle}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {post.stylist.name}
              </a>
            ) : (
              post.stylist.name
            )}
          </p>
        )}
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
              // A piece we haven't identified doesn't get a product or a price
              // attached to it — that would be presenting a guess as a finding.
              const prod = p.confidence === 'pending' ? null : resolve(p)
              return (
                <div className="rpiece" key={p.slot}>
                  {prod ? (
                    <button className="rpiece__shot" onClick={() => onOpen(prod.id)} aria-label={prod.name}>
                      <img src={prod.image} alt="" loading="lazy" />
                    </button>
                  ) : (
                    <span className="rpiece__shot rpiece__shot--none">{p.slot[0]}</span>
                  )}

                  <div className="rpiece__body">
                    <span className="eyebrow">{p.slot}</span>
                    <p className="rpiece__worn">{p.worn}</p>
                    <span className={`conf conf--${p.confidence}`}>
                      <i />
                      {CONFIDENCE_LABEL[p.confidence]}
                    </span>
                    {prod && (
                      <button className="rpiece__buy" onClick={() => onOpen(prod.id)}>
                        {prod.brand} · ${prod.price.toFixed(prod.price % 1 ? 2 : 0)}
                      </button>
                    )}
                  </div>
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

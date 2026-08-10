import { useEffect, useState } from 'react'
import { CONFIDENCE_LABEL, timeAgo, type SocialFitPost } from '../../data/socialFits'
import { resolve } from '../../lib/fitmatch'
import { socialRepository } from '../../lib/socialRepository'
import { InstagramFitEmbed } from '../InstagramFitEmbed'
import { FitEngagementBar } from './FitEngagementBar'
import { FitTakesDrawer } from './FitTakesDrawer'
import { Arrow } from '../Icons'

/**
 * One post in the Tunnel: who wore it, where, the official post, our read, and
 * the pieces. Editorial rather than a card — a rule at the top, type doing the
 * hierarchy, the photograph as the anchor.
 */
export function SocialFitCard({
  post,
  onOpen,
  onFull,
  onToast,
  variant = 'feed',
}: {
  post: SocialFitPost
  onOpen: (id: string) => void
  onFull: (slug: string) => void
  onToast: (msg: string) => void
  variant?: 'feed' | 'home'
}) {
  const [takesOpen, setTakesOpen] = useState(false)
  const [takes, setTakes] = useState(post.engagement.comments)

  useEffect(() => {
    setTakes(post.engagement.comments + socialRepository.getTakes(post.id).filter((t) => !t.seeded).length)
  }, [post])

  const identified = post.pieces.filter((p) => p.confidence !== 'pending' && resolve(p))
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tunnel/${post.slug}`

  return (
    <article className={`sfit sfit--${variant}`}>
      <header className="sfit__head">
        <span className="eyebrow sfit__kicker">
          {post.person.league ?? 'Culture'} · {post.context.type}
        </span>
        <h3 className="sfit__who">{post.person.name}</h3>
        <p className="sfit__where">
          {[post.person.team, post.context.location].filter(Boolean).join(' — ')}
        </p>
        <p className="sfit__time mono-line">{timeAgo(post.publishedAt)}</p>
        {post.stylist && (
          <p className="sfit__stylist tiny">Styled by {post.stylist.name}</p>
        )}
      </header>

      <div className="sfit__body">
        <div className="sfit__media">
          <InstagramFitEmbed
            url={post.source.url}
            accountName={post.source.account}
            sourceLabel={post.source.account}
          />
        </div>

        <div className="sfit__read">
          <h4 className="sfit__headline serif">{post.editorial.headline}</h4>
          <span className="eyebrow">The read</span>
          <p className="sfit__take">{post.editorial.quickTake}</p>

          <div className="sfit__pieces">
            <span className="eyebrow">
              {identified.length} of {post.pieces.length} pieces identified
            </span>
            <ul>
              {post.pieces.slice(0, 4).map((p) => (
                <li key={p.slot}>
                  {(() => {
                    const prod = resolve(p)
                    return prod ? (
                      <button className="linkish" onClick={() => onOpen(prod.id)}>
                        {p.slot}
                      </button>
                    ) : (
                      <b>{p.slot}</b>
                    )
                  })()}
                  <span className={`conf conf--${p.confidence}`}>
                    <i />
                    {CONFIDENCE_LABEL[p.confidence]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button className="btn btn--ghost btn--sm" onClick={() => onFull(post.slug)}>
            View full fit <Arrow />
          </button>
        </div>
      </div>

      <FitEngagementBar
        postId={post.id}
        seed={{ likes: post.engagement.likes, saves: post.engagement.saves }}
        takesCount={takes}
        onOpenTakes={() => setTakesOpen(true)}
        shareUrl={shareUrl}
        shareTitle={`${post.person.name} — ${post.editorial.headline}`}
        onToast={onToast}
      />

      {takesOpen && (
        <FitTakesDrawer
          postId={post.id}
          slots={post.pieces.map((p) => p.slot)}
          onClose={() => setTakesOpen(false)}
          onCount={(n) => setTakes(post.engagement.comments + n)}
        />
      )}
    </article>
  )
}

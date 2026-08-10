import { useMemo } from 'react'
import type { IdentifiedPiece, SocialFitPost } from '../../data/socialFits'
import { CONFIDENCE_LABEL } from '../../data/socialFits'
import { CATALOG } from '../../data/catalog'
import { resolve } from '../../lib/fitmatch'
import { rank } from '../../lib/match'
import { learnTaste } from '../../lib/learned'
import { useStore } from '../../lib/store'
import { PREMIUM_NAME, PREMIUM_PRICE_LABEL, subscriptionService } from '../../lib/subscription'
import { ProductCard } from '../ProductCard'

const CHAPTERS = [
  ['01', 'Silhouette'],
  ['02', 'Proportion'],
  ['03', 'Colour'],
  ['04', 'Layering'],
  ['05', 'Footwear'],
  ['06', 'Why it works'],
  ['07', 'Exact pieces'],
  ['08', 'Alternatives'],
  ['09', 'Your version'],
] as const

/** A row per identified garment: what it is, how sure we are, what to buy. */
function PieceRow({ piece, onOpen }: { piece: IdentifiedPiece; onOpen: (id: string) => void }) {
  const product = piece.confidence === 'pending' ? null : resolve(piece)
  const sure = piece.confidence === 'exact' || piece.confidence === 'strong'
  return (
    <div className="pcrow">
      <div className="pcrow__slot">
        <span className="eyebrow">{piece.slot}</span>
        <p className="pcrow__worn">{piece.worn}</p>
        <span className={`conf conf--${piece.confidence}`}>
          <i />
          {CONFIDENCE_LABEL[piece.confidence]}
          {sure && piece.score ? ` · ${piece.score}%` : ''}
        </span>
        {piece.evidence && <p className="tiny">{piece.evidence}</p>}
      </div>

      {product ? (
        <button className="pcrow__prod" onClick={() => onOpen(product.id)}>
          <img src={product.image} alt="" loading="lazy" />
          <span>
            <b>{product.brand}</b>
            <em>{product.name}</em>
            <span className="pcrow__price">${product.price.toFixed(product.price % 1 ? 2 : 0)}</span>
          </span>
        </button>
      ) : (
        <p className="pcrow__none tiny">Identification pending</p>
      )}
    </div>
  )
}

/**
 * The paid layer. Everything above it — the post, the read, the pieces — stays
 * free, because a reader has to understand what Fits From is before being asked
 * to pay for it. What's behind the lock is the reasoning, not the links.
 */
export function PremiumFitAnalysis({
  post,
  onOpen,
  onSubscribe,
}: {
  post: SocialFitPost
  onOpen: (id: string) => void
  onSubscribe: () => void
}) {
  const { account, profile, saved, wardrobe, disliked } = useStore()
  const status = subscriptionService.getStatus(account?.pro)
  const a = post.analysis ?? {}

  const learned = useMemo(
    () => learnTaste(saved, wardrobe.map((w) => w.productId), disliked),
    [saved, wardrobe, disliked],
  )

  // "Same energy" — catalogue pieces in the same lanes as this fit, ranked to
  // the reader rather than to the celebrity.
  const sameEnergy = useMemo(() => {
    const cats = new Set(post.pieces.map((p) => p.match.category))
    const pool = CATALOG.filter((p) => cats.has(p.category))
    return rank(pool, profile, learned)
      .map((r) => r.product)
      .slice(0, 4)
  }, [post, profile, learned])

  // "Your closet" — anything you already own in those categories.
  const fromCloset = useMemo(() => {
    const cats = new Set(post.pieces.map((p) => p.match.category))
    return wardrobe
      .map((w) => CATALOG.find((p) => p.id === w.productId))
      .filter((p): p is NonNullable<typeof p> => !!p && cats.has(p.category))
      .slice(0, 4)
  }, [post, wardrobe])

  if (!status.active) {
    return (
      <section className="lock">
        <div className="lock__rule" />
        <span className="eyebrow">Full breakdown</span>
        <h3 className="lock__head">
          You’ve seen the fit.
          <br />
          Now understand it.
        </h3>
        <p className="lock__dek">
          The exact pieces, how the proportion holds together, what to wear instead, and what the
          same shape looks like on your body.
        </p>

        <ol className="lock__chapters">
          {CHAPTERS.map(([n, label]) => (
            <li key={n}>
              <span>{n}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="lock__cta">
          <div>
            <b>{PREMIUM_NAME}</b>
            <span className="tiny">{PREMIUM_PRICE_LABEL}</span>
          </div>
          <button className="btn btn--primary" onClick={onSubscribe}>
            Unlock full breakdown
          </button>
        </div>

        <button
          className="lock__preview"
          onClick={() => {
            subscriptionService.setPreview(true)
            onSubscribe()
          }}
        >
          Preview what’s inside
        </button>
      </section>
    )
  }

  return (
    <section className="fullfit">
      {status.source === 'preview' && (
        <p className="fullfit__demo tiny">
          Preview mode — prototype entitlement, not a real subscription.{' '}
          <button
            className="linkish"
            onClick={() => {
              subscriptionService.setPreview(false)
              onSubscribe()
            }}
          >
            Exit preview
          </button>
        </p>
      )}

      <div className="fullfit__head">
        <span className="eyebrow">Full fit analysis</span>
        <span className="pro-chip">PRO</span>
      </div>

      <div className="chapters">
        {a.silhouette && <Chapter n="01" title="Silhouette" body={a.silhouette} />}
        {a.proportion && <Chapter n="02" title="Proportion" body={a.proportion} />}
        {a.color && <Chapter n="03" title="Colour" body={a.color} />}
        {a.layering && <Chapter n="04" title="Layering" body={a.layering} />}
        {a.footwear && <Chapter n="05" title="Footwear" body={a.footwear} />}
        {a.whyItWorks && <Chapter n="06" title="Why it works" body={a.whyItWorks} />}
      </div>

      <div className="fullfit__block">
        <span className="eyebrow">07 — Exact pieces</span>
        <div className="pcrows">
          {post.pieces.map((p) => (
            <PieceRow key={p.slot} piece={p} onOpen={onOpen} />
          ))}
        </div>
      </div>

      <div className="fullfit__block">
        <span className="eyebrow">08 — Same energy</span>
        <p className="tiny">
          Same silhouette and palette from the catalogue, ranked against your taste — not his.
        </p>
        <div className="grid">
          {sameEnergy.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={onOpen} />
          ))}
        </div>
      </div>

      <div className="fullfit__block">
        <span className="eyebrow">09 — Your version</span>
        {a.translation && <p className="chapter__body">{a.translation}</p>}
        {fromCloset.length > 0 ? (
          <>
            <p className="tiny">From your closet:</p>
            <div className="grid">
              {fromCloset.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={onOpen} />
              ))}
            </div>
          </>
        ) : (
          <p className="tiny">Nothing in your wardrobe hits this silhouette yet.</p>
        )}
      </div>
    </section>
  )
}

function Chapter({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="chapter">
      <span className="chapter__n">{n}</span>
      <div>
        <h4>{title}</h4>
        <p className="chapter__body">{body}</p>
      </div>
    </article>
  )
}

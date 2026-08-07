import { useState, type ReactNode } from 'react'
import type { Product } from '../data/catalog'
import { useStore } from '../lib/store'
import { matchScore } from '../lib/match'
import { recommendSize } from '../lib/sizing'
import { cosigns } from '../lib/fitmatch'
import { Bookmark } from './Icons'

export function ProductCard({
  product,
  onOpen,
  footer,
}: {
  product: Product
  onOpen: (id: string) => void
  footer?: ReactNode
}) {
  const { profile, saved, toggleSaved, toast } = useStore()
  const isSaved = saved.includes(product.id)
  const { score } = matchScore(product, profile)
  const rec = recommendSize(product, profile)
  const worn = cosigns(product.id)
  const [loaded, setLoaded] = useState(false)
  // 90+ is rare by design — it earns the shine.
  const elite = score >= 90

  return (
    <div className={`card${elite ? ' card--elite' : ''}`}>
      <button
        className="card__frame"
        onClick={() => onOpen(product.id)}
        aria-label={`${product.brand} ${product.name}, $${product.price}`}
        style={{ width: '100%', border: 0, padding: 0 }}
      >
        <img
          className={`card__img${loaded ? ' is-loaded' : ''}`}
          src={product.image}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
        {elite && <span className="card__shine" aria-hidden="true" />}
        {profile.onboarded && score >= 85 && (
          <span className="card__badge card__badge--good">
            <i />
            {score}%
          </span>
        )}
      </button>

      <button
        className="card__save"
        aria-pressed={isSaved}
        aria-label={isSaved ? 'Remove from saved' : 'Save'}
        onClick={() => {
          toggleSaved(product.id)
          toast(isSaved ? 'Removed' : 'Saved')
        }}
      >
        <Bookmark filled={isSaved} />
      </button>

      <button
        className="card__meta"
        onClick={() => onOpen(product.id)}
        style={{ textAlign: 'left', width: '100%' }}
      >
        <div className="card__brand">{product.brand}</div>
        <div className="card__name">{product.name}</div>
        {worn.length > 0 && (
          <div className="card__cosign">✦ in the {worn[0]} file{worn.length > 1 ? ` +${worn.length - 1}` : ''}</div>
        )}
        <div className="card__line">
          <span>${product.price.toFixed(product.price % 1 ? 2 : 0)}</span>
          {product.sizeSystem !== 'one' && <span className="card__size">{rec.label}</span>}
        </div>
      </button>

      {footer}
    </div>
  )
}

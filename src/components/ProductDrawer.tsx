import { useState } from 'react'
import { CATALOG } from '../data/catalog'
import { STYLES, TIERS } from '../data/taxonomy'
import { useStore } from '../lib/store'
import { matchScore, scoreLabel } from '../lib/match'
import { recommendSize, sizeOptions } from '../lib/sizing'
import { buyUrl } from '../lib/affiliate'
import { Bookmark, Close, External, Plus, CheckInk } from './Icons'

export function ProductDrawer({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const store = useStore()
  const { profile, saved, wardrobe, collections } = store
  const product = CATALOG.find((p) => p.id === productId)
  const [size, setSize] = useState(() =>
    product ? recommendSize(product, profile).label : '',
  )
  const [pickingCollection, setPickingCollection] = useState(false)

  if (!product) return null

  const rec = recommendSize(product, profile)
  const { score, reasons } = matchScore(product, profile)
  const inWardrobe = wardrobe.some((w) => w.productId === product.id)
  const isSaved = saved.includes(product.id)
  const tier = TIERS.find((t) => t.id === product.tier)!

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={product.name}>
        <div className="drawer__bar">
          <span className="eyebrow">{product.brand}</span>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <Close />
          </button>
        </div>

        <div className="drawer__body pdp">
          <div className="pdp__hero">
            <img src={product.image} alt={product.name} />
          </div>

          <h2>{product.name}</h2>
          <div className="pdp__price">${product.price.toFixed(product.price % 1 ? 2 : 0)}</div>

          {profile.onboarded && (
            <div className="reasons">
              <span className="reason" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                {score}% · {scoreLabel(score)}
              </span>
              {reasons.map((r) => (
                <span className="reason" key={r}>
                  {r}
                </span>
              ))}
            </div>
          )}

          {product.sizeSystem !== 'one' && (
            <div className="fitbox">
              <div className="fitbox__top">
                <div>
                  <div className="eyebrow">Your size</div>
                  <div className="fitbox__size">{rec.label}</div>
                </div>
                <div className="tiny" style={{ textAlign: 'right', maxWidth: '20ch' }}>
                  {rec.note}
                </div>
              </div>
              <div className="sizepick">
                {sizeOptions(product, profile).map((s) => (
                  <button key={s} aria-pressed={size === s} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="speclist">
            <div className="spec">
              <dt>Quality</dt>
              <dd>
                {tier.label} · {tier.band}
              </dd>
            </div>
            <div className="spec">
              <dt>Season</dt>
              <dd style={{ textTransform: 'capitalize' }}>{product.seasons.join(', ')}</dd>
            </div>
            <div className="spec">
              <dt>Style</dt>
              <dd>
                {product.styles.map((s) => STYLES.find((x) => x.id === s)?.label).join(' · ')}
              </dd>
            </div>
          </dl>

          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setPickingCollection((v) => !v)}
            >
              <Plus /> Collection
            </button>

            {pickingCollection && (
              <div className="chips" style={{ marginTop: 12 }}>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    className="chip chip--sm"
                    aria-pressed={c.productIds.includes(product.id)}
                    onClick={() => {
                      store.toggleInCollection(c.id, product.id)
                      store.toast(
                        c.productIds.includes(product.id)
                          ? `Removed from ${c.name}`
                          : `Added to ${c.name}`,
                      )
                    }}
                  >
                    {c.productIds.includes(product.id) && <CheckInk size={12} />}
                    {c.name}
                  </button>
                ))}
                <button
                  className="chip chip--sm"
                  onClick={() => {
                    const name = prompt('Name this collection')?.trim()
                    if (!name) return
                    const id = store.createCollection(name)
                    store.toggleInCollection(id, product.id)
                    store.toast(`Created ${name}`)
                  }}
                >
                  <Plus size={12} /> New
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="drawer__foot">
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn btn--ghost"
              aria-pressed={isSaved}
              onClick={() => {
                store.toggleSaved(product.id)
                store.toast(isSaved ? 'Removed' : 'Saved')
              }}
              style={{ flex: 'none', width: 44, padding: 0 }}
              aria-label={isSaved ? 'Unsave' : 'Save'}
            >
              <Bookmark filled={isSaved} />
            </button>

            <button
              className="btn btn--ghost"
              style={{ flex: 1 }}
              onClick={() => {
                store.addToWardrobe(product.id, size, inWardrobe)
                store.toast(`In wardrobe · ${size || 'one size'}`)
              }}
            >
              {inWardrobe ? 'In wardrobe ✓' : 'Add to wardrobe'}
            </button>

            <a
              className="btn btn--primary"
              style={{ flex: 1.2 }}
              href={buyUrl(product.url)}
              target="_blank"
              rel="noreferrer noopener"
            >
              Buy at {product.brand.split(' ')[0]} <External />
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}

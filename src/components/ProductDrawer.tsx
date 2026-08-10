import { useState } from 'react'
import { CATALOG } from '../data/catalog'
import { FITS } from '../data/fits'
import { resolve } from '../lib/fitmatch'
import { STYLES, TIERS } from '../data/taxonomy'
import { useStore } from '../lib/store'
import { matchScore, scoreLabel } from '../lib/match'
import { recommendSize, sizeOptions } from '../lib/sizing'
import { buyUrl } from '../lib/affiliate'
import { Bookmark, Close, External, Plus, CheckInk } from './Icons'
import { CONDITIONS, YEAR_STEPS } from '../views/WardrobeView'
import { AffiliateDisclosure } from './AffiliateDisclosure'

export function ProductDrawer({
  productId,
  onClose,
  onOpenProduct,
}: {
  productId: string
  onClose: () => void
  /** Jump to another piece from the same fit without leaving the drawer. */
  onOpenProduct?: (id: string) => void
}) {
  const store = useStore()
  const { profile, saved, wardrobe, collections } = store
  const product = CATALOG.find((p) => p.id === productId)
  const [size, setSize] = useState(() =>
    product ? recommendSize(product, profile).label : '',
  )
  const [pickingCollection, setPickingCollection] = useState(false)
  // After adding, grade it — condition and age drive what the closet is worth.
  const [grading, setGrading] = useState(false)
  const [newName, setNewName] = useState('')

  if (!product) return null

  const rec = recommendSize(product, profile)
  const { score, reasons } = matchScore(product, profile)
  const inWardrobe = wardrobe.some((w) => w.productId === product.id)
  const own = wardrobe.find((w) => w.productId === product.id)
  const isSaved = saved.includes(product.id)
  const tier = TIERS.find((t) => t.id === product.tier)!

  // Proven in the culture: which fit files this exact piece backs.
  const seenIn = FITS.filter((f) => f.pieces.some((pc) => resolve(pc)?.id === product.id)).slice(0, 3)

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
            <div className="pdp__match">
              <span className="pdp__score">{score}%</span>
              <span className="pdp__matchmeta">
                <b>{scoreLabel(score)}</b>
                <span className="tiny">{reasons.slice(0, 3).join(' · ')}</span>
              </span>
            </div>
          )}

          {seenIn.length > 0 && (
            <section className="seenon">
              <div className="seenon__head">
                <span className="eyebrow">Seen on</span>
                <span className="tiny">
                  {seenIn.length} documented {seenIn.length === 1 ? 'fit' : 'fits'}
                </span>
              </div>

              {seenIn.map((fit) => {
                // The rest of that outfit — a piece is worth more when you can
                // see what it was worn with, and buy the whole thing.
                const rest = fit.pieces
                  .map((pc) => ({ pc, prod: resolve(pc) }))
                  .filter((x) => x.prod && x.prod.id !== product.id)
                const total = rest.reduce((n, x) => n + (x.prod?.price ?? 0), product.price)
                return (
                  <article className="seenfit" key={fit.id}>
                    <div className="seenfit__top">
                      <div>
                        <b>{fit.who}</b>
                        <span className="tiny">{fit.where} · {fit.when}</span>
                      </div>
                      <span className="seenfit__total mono-line">
                        FIT ${Math.round(total).toLocaleString()}
                      </span>
                    </div>

                    <div className="seenfit__rail">
                      {rest.map(({ pc, prod }) => (
                        <button
                          key={pc.slot}
                          className="seenfit__piece"
                          onClick={() => onOpenProduct?.(prod!.id)}
                          title={`${prod!.brand} — ${prod!.name}`}
                        >
                          <img src={prod!.image} alt="" loading="lazy" />
                          <span className="seenfit__slot">{pc.slot}</span>
                          <span className="seenfit__price">
                            ${prod!.price.toFixed(prod!.price % 1 ? 2 : 0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </article>
                )
              })}
            </section>
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
            {product.fabric && (
              <div className="spec">
                <dt>Fabric</dt>
                <dd>{product.fabric}</dd>
              </div>
            )}
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
                <input
                  className="text-input"
                  style={{ height: 28, width: 140, fontSize: 12, borderRadius: 999, padding: '0 12px' }}
                  placeholder="New collection…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      const id = store.createCollection(newName.trim())
                      store.toggleInCollection(id, product.id)
                      store.toast(`Created ${newName.trim()}`)
                      setNewName('')
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="drawer__foot">
          {grading && (
            <div className="grade">
              <div className="grade__row">
                <span className="eyebrow">Condition</span>
                <div className="grade__chips">
                  {CONDITIONS.map(([label]) => (
                    <button
                      key={label}
                      className={`gradechip${(own?.condition ?? 'Like new') === label ? ' is-on' : ''}`}
                      onClick={() => store.updateWardrobe(product.id, { condition: label })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grade__row">
                <span className="eyebrow">Had it</span>
                <div className="grade__chips">
                  {YEAR_STEPS.map((y) => (
                    <button
                      key={y}
                      className={`gradechip${(own?.years ?? 0) === y ? ' is-on' : ''}`}
                      onClick={() => store.updateWardrobe(product.id, { years: y })}
                    >
                      {y === 0 ? 'Brand new' : `${y} yr${y === 1 ? '' : 's'}${y === 5 ? '+' : ''}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                setGrading(true)
                store.toast(`In wardrobe · ${size || 'one size'}`)
              }}
            >
              {inWardrobe ? 'In wardrobe ✓' : 'Add to wardrobe'}
            </button>

            <a
              className="btn btn--primary"
              style={{ flex: 1.2 }}
              href={buyUrl(product.url, 'product_drawer')}
              target="_blank"
              rel="noreferrer noopener"
            >
              Buy at {product.brand.split(' ')[0]} <External />
            </a>
          </div>
          <AffiliateDisclosure compact />
        </div>
      </aside>
    </>
  )
}

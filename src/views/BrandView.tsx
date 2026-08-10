import { useMemo } from 'react'
import { CATALOG } from '../data/catalog'
import { FITS } from '../data/fits'
import { resolve } from '../lib/fitmatch'
import { rank } from '../lib/match'
import { learnTaste } from '../lib/learned'
import { useStore } from '../lib/store'
import { hotBrands } from '../lib/heat'
import { ProductCard } from '../components/ProductCard'
import { Arrow } from '../components/Icons'

/**
 * Brands, the third way into the same graph.
 *
 * A piece connects to a person and a person connects to a fit; a brand is just
 * the third axis, and it is the one people actually search by. Every number
 * here is counted from the fit files — nothing is asserted that isn't backed by
 * a documented outfit.
 *
 * Tiles are typeset rather than logo images on purpose: a brand's logo is its
 * trademark, and a wall of scraped marks is the same rights problem as a wall
 * of scraped photographs.
 */
export function BrandView({
  brand,
  onOpen,
  onBrand,
}: {
  brand: string | null
  onOpen: (id: string) => void
  onBrand: (brand: string | null) => void
}) {
  const { profile, saved, wardrobe, disliked } = useStore()

  const learned = useMemo(
    () => learnTaste(saved, wardrobe.map((w) => w.productId), disliked),
    [saved, wardrobe, disliked],
  )

  // Every brand in the catalogue, with whatever cultural proof exists for it.
  const directory = useMemo(() => {
    const worn = new Map(hotBrands(200).map((b) => [b.brand, b.people]))
    const counts = new Map<string, number>()
    for (const p of CATALOG) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1)
    return [...counts.entries()]
      .map(([name, pieces]) => ({ name, pieces, people: worn.get(name) ?? [] }))
      .sort(
        (a, b) => b.people.length - a.people.length || a.name.localeCompare(b.name),
      )
  }, [])

  if (!brand) {
    const cosigned = directory.filter((b) => b.people.length > 0)
    const rest = directory.filter((b) => b.people.length === 0)
    return (
      <div className="wrap">
        <div className="pagehead">
          <span className="eyebrow">Brands</span>
          <h2>Every label, and who wears it.</h2>
          <p>
            {directory.length} brands in the catalogue. The ones at the top have turned up in a
            documented fit — that count is the only thing here nobody self-reported.
          </p>
        </div>

        {cosigned.length > 0 && (
          <section className="section" style={{ marginTop: 0 }}>
            <div className="section__head">
              <h3>Worn in the files</h3>
              <span className="tiny">Counted by how many different people</span>
            </div>
            <div className="btiles">
              {cosigned.map((b) => (
                <button className="btile" key={b.name} onClick={() => onBrand(b.name)}>
                  <span className="btile__name">{b.name}</span>
                  <span className="btile__meta">
                    {b.people.length} {b.people.length === 1 ? 'person' : 'people'} · {b.pieces}{' '}
                    pieces
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <h3>The rest of the catalogue</h3>
            <span className="tiny">{rest.length} brands</span>
          </div>
          <div className="btiles btiles--quiet">
            {rest.map((b) => (
              <button className="btile" key={b.name} onClick={() => onBrand(b.name)}>
                <span className="btile__name">{b.name}</span>
                <span className="btile__meta">{b.pieces} pieces</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // ── one brand ───────────────────────────────────────────────────────────
  const pieces = CATALOG.filter((p) => p.brand === brand)
  const ranked = rank(pieces, profile, learned).map((r) => r.product)

  // Documented fits containing something from this brand, with the piece.
  const appearances = FITS.flatMap((fit) =>
    fit.pieces
      .filter((pc) => pc.match.brand === brand || resolve(pc)?.brand === brand)
      .map((pc) => ({ fit, piece: pc, product: resolve(pc) })),
  )

  const people = [...new Set(appearances.map((a) => a.fit.who))]
  const lo = pieces.length ? Math.min(...pieces.map((p) => p.price)) : 0
  const hi = pieces.length ? Math.max(...pieces.map((p) => p.price)) : 0

  return (
    <div className="wrap">
      <button className="report__back" onClick={() => onBrand(null)}>
        ← All brands
      </button>

      <header className="brandhead">
        <h2 className="brandhead__name">{brand}</h2>
        <div className="brandhead__stats">
          <Stat label="Pieces" value={String(pieces.length)} />
          <Stat label="Worn by" value={people.length ? String(people.length) : '—'} />
          <Stat
            label="Range"
            value={pieces.length ? `$${Math.round(lo)}–$${Math.round(hi)}` : '—'}
          />
        </div>
      </header>

      {appearances.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h3>Seen on</h3>
            <span className="tiny">Documented fits, and the piece from this brand in each</span>
          </div>
          <div className="bwear">
            {appearances.map((a, i) => (
              <div className="bwear__row" key={`${a.fit.id}-${a.piece.slot}-${i}`}>
                {a.product ? (
                  <button
                    className="rpiece__shot"
                    onClick={() => onOpen(a.product!.id)}
                    aria-label={a.product.name}
                  >
                    <img src={a.product.image} alt="" loading="lazy" />
                  </button>
                ) : (
                  <span className="rpiece__shot rpiece__shot--none">{a.piece.slot[0]}</span>
                )}
                <div className="rpiece__body">
                  <b>{a.fit.who}</b>
                  <span className="tiny">
                    {a.fit.where} · {a.fit.when}
                  </span>
                  <p className="rpiece__worn">{a.piece.worn}</p>
                  {a.product && (
                    <button className="rpiece__buy" onClick={() => onOpen(a.product!.id)}>
                      ${a.product.price.toFixed(a.product.price % 1 ? 2 : 0)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h3>Everything from {brand}</h3>
          <span className="tiny">Ranked against your taste, not alphabetically</span>
        </div>
        {ranked.length === 0 ? (
          <p className="tiny">Nothing from this brand in the catalogue yet.</p>
        ) : (
          <div className="grid">
            {ranked.slice(0, 24).map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>

      <button className="btn btn--ghost btn--sm" onClick={() => onBrand(null)}>
        All brands <Arrow />
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="brandstat">
      <b>{value}</b>
      {label}
    </span>
  )
}

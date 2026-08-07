import { useState } from 'react'
import { CATALOG, type Product } from '../data/catalog'
import { FITS, type Fit, type FitPiece } from '../data/fits'
import { useStore } from '../lib/store'
import { recommendSize } from '../lib/sizing'
import { Bookmark, Close, External } from '../components/Icons'

/** Best buyable stand-in for a worn piece. */
function resolve(piece: FitPiece): Product | null {
  const { category, brand, kw, sil } = piece.match
  const re = kw ? new RegExp(kw, 'i') : null
  const pool = CATALOG.filter((p) => p.category === category)
  return (
    pool.find((p) => (!brand || p.brand === brand) && (!re || re.test(p.name))) ??
    pool.find((p) => !re || re.test(p.name)) ??
    (sil ? pool.find((p) => p.silhouette === sil) : null) ??
    pool[0] ??
    null
  )
}

export function FitsView() {
  const [open, setOpen] = useState<Fit | null>(null)

  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="pagehead">
        <span className="eyebrow">Fits</span>
        <h2>Steal the whole look.</h2>
        <p>Iconic fits, broken down top to bottom — with a buyable version of every piece.</p>
      </div>

      <div className="fitgrid">
        {FITS.map((f) => (
          <button key={f.id} className="fitcard" onClick={() => setOpen(f)}>
            <div className="fitcard__frame">
              <img
                src={`/fits/${f.id}.jpg`}
                alt=""
                loading="lazy"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <span className="fitcard__who serif">{f.who}</span>
            </div>
            <div className="fitcard__meta">
              <div className="card__brand">{f.where}</div>
              <div className="card__name">{f.vibe}</div>
              <div className="tiny" style={{ marginTop: 6 }}>
                {f.pieces.length} pieces →
              </div>
            </div>
          </button>
        ))}
      </div>

      {open && <FitDrawer fit={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function FitDrawer({ fit, onClose }: { fit: Fit; onClose: () => void }) {
  const store = useStore()
  const { profile, saved } = store
  const resolved = fit.pieces.map((piece) => ({ piece, p: resolve(piece) }))
  const total = resolved.reduce((n, r) => n + (r.p?.price ?? 0), 0)

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${fit.who} fit`}>
        <div className="drawer__bar">
          <span className="eyebrow">
            {fit.who} · {fit.where}
          </span>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <Close />
          </button>
        </div>

        <div className="drawer__body">
          <p className="muted" style={{ margin: '18px 0 4px', fontSize: 14.5 }}>
            {fit.vibe}. Top to bottom:
          </p>

          {resolved.map(({ piece, p }) =>
            p ? (
              <div className="bagline" key={piece.slot}>
                <div className="bagline__thumb">
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div className="card__brand">
                    {piece.slot} — {piece.worn}
                  </div>
                  <div className="card__name">
                    {p.brand} · {p.name}
                  </div>
                  <div className="tiny" style={{ marginTop: 4 }}>
                    ${p.price.toFixed(0)}
                    {p.sizeSystem !== 'one' && ` · your size ${recommendSize(p, profile).label}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="iconbtn"
                    aria-label="Save"
                    onClick={() => {
                      store.toggleSaved(p.id)
                      store.toast(saved.includes(p.id) ? 'Removed' : 'Saved')
                    }}
                  >
                    <Bookmark filled={saved.includes(p.id)} />
                  </button>
                  <a
                    className="iconbtn"
                    href={p.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Buy at ${p.brand}`}
                  >
                    <External />
                  </a>
                </div>
              </div>
            ) : null,
          )}

          <div className="total">
            <span>The whole look</span>
            <b>${total.toFixed(0)}</b>
          </div>
        </div>
      </aside>
    </>
  )
}

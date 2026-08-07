import { SCENTS } from '../data/scents'
import { useStore } from '../lib/store'

/** Stylised bottle so the shelf reads visual, not textual. */
export function Bottle({ color, initial }: { color: string; initial: string }) {
  return (
    <svg viewBox="0 0 60 84" className="bottle" aria-hidden="true">
      <rect x="24" y="2" width="12" height="10" rx="2" fill="#1a1f1c" />
      <rect x="26" y="12" width="8" height="6" fill="#8b8f8a" />
      <rect x="10" y="18" width="40" height="62" rx="7" fill="#eef0ee" stroke="#d5d8d3" />
      <rect x="14" y="30" width="32" height="46" rx="4" fill={color} opacity="0.85" />
      <rect x="17" y="22" width="5" height="52" rx="2.5" fill="#fff" opacity="0.45" />
      <text x="30" y="58" textAnchor="middle" fontFamily="Instrument Serif, serif" fontSize="17" fill="#fff">
        {initial}
      </text>
    </svg>
  )
}

/** The scent shelf — favorite what you'd wear; wearer tags are community-reported. */
export function ScentShelf() {
  const { scentFavs, toggleScentFav, toast } = useStore()
  return (
    <div className="section">
      <div className="section__head">
        <h3>Scents</h3>
        <span className="tiny">Community-reported wearers — not endorsements</span>
      </div>
      <div className="scentgrid">
        {SCENTS.map((sc) => (
          <div className="scent" key={sc.id}>
            <div className="scent__bottle">
              <Bottle color={sc.color} initial={sc.house[0]} />
              <img
                className="scent__photo"
                src={`/scents/${sc.id}.png`}
                alt=""
                loading="lazy"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            </div>
            <div className="scent__top">
              <span className="card__brand">{sc.house}</span>
              <button
                className="scent__fav"
                aria-pressed={scentFavs.includes(sc.id)}
                aria-label={`Favorite ${sc.name}`}
                onClick={() => {
                  toggleScentFav(sc.id)
                  toast(scentFavs.includes(sc.id) ? 'Removed' : `Saved — ${sc.name}`)
                }}
              >
                {scentFavs.includes(sc.id) ? '♥' : '♡'}
              </button>
            </div>
            <div className="scent__name serif">{sc.name}</div>
            <div className="tiny" style={{ marginTop: 4 }}>{sc.notes}</div>
            <div className="scent__worn">{sc.wornBy}</div>
            <div className="spread" style={{ marginTop: 12 }}>
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>${sc.price}</b>
              <a
                className="btn btn--ghost btn--sm"
                href={sc.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

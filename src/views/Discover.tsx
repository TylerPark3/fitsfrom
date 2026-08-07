import { useMemo, useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS, type Product } from '../data/catalog'
import { FITS } from '../data/fits'
import { resolve } from '../lib/fitmatch'
import { useStore } from '../lib/store'
import { rank } from '../lib/match'
import { ProductCard } from '../components/ProductCard'
import { ScentShelf } from '../components/ScentShelf'
import { SCENTS } from '../data/scents'
import { Arrow, Search } from '../components/Icons'
import { Type } from '../components/Type'

type Sort = 'match' | 'low' | 'high'

const ASKS: { id: string; label: string; test: (p: Product) => boolean }[] = [
  { id: 'any', label: 'Anything', test: () => true },
  { id: 'tees', label: 'Tees & sweats', test: (p) => p.category === 'top' },
  { id: 'shirts', label: 'Shirts', test: (p) => p.category === 'shirt' },
  { id: 'knit', label: 'Knitwear', test: (p) => p.category === 'knit' },
  { id: 'outer', label: 'Outerwear', test: (p) => p.category === 'outer' },
  {
    id: 'parkas',
    label: 'Parkas & puffers',
    test: (p) => p.category === 'outer' && /parka|puffer|down|coat/i.test(p.name),
  },
  { id: 'pants', label: 'Pants', test: (p) => p.category === 'pants' && p.silhouette !== 'short' },
  { id: 'shorts', label: 'Shorts', test: (p) => p.category === 'pants' && p.silhouette === 'short' },
  { id: 'shoes', label: 'Shoes', test: (p) => p.category === 'shoes' },
  { id: 'acc', label: 'Accessories', test: (p) => p.category === 'accessory' },
  { id: 'scents', label: 'Scents', test: () => false },
]

export function Discover({ onOpen, go }: { onOpen: (id: string) => void; go: (v: View) => void }) {
  const { profile, signedIn, account } = useStore()
  const [ask, setAsk] = useState('any')
  const [q, setQ] = useState('')
  const [icon, setIcon] = useState('')
  const [sort, setSort] = useState<Sort>('match')
  const [executed, setExecuted] = useState(false)

  const iconChoices = profile.icons.length
    ? profile.icons
    : Array.from(new Set(FITS.map((f) => f.who)))

  // Scents surface only when asked for — never by default.
  const scentHits = useMemo(() => {
    if (!executed) return []
    const needle = q.trim().toLowerCase()
    const scentQuery =
      ask === 'scents' || /scent|cologne|fragrance|perfume|parfum|smell/.test(needle)
    if (!scentQuery && needle) {
      const named = SCENTS.filter((sc) =>
        `${sc.house} ${sc.name} ${sc.notes} ${sc.wornBy}`.toLowerCase().includes(needle),
      )
      return named.map((sc) => sc.id)
    }
    if (!scentQuery) return []
    const pool = needle
      ? SCENTS.filter((sc) =>
          `${sc.house} ${sc.name} ${sc.notes} ${sc.wornBy}`
            .toLowerCase()
            .includes(needle.replace(/scents?|cologne|fragrance|perfume|parfum|smell/g, '').trim()),
        )
      : SCENTS
    return (pool.length ? pool : SCENTS).map((sc) => sc.id)
  }, [executed, ask, q])

  const results = useMemo(() => {
    if (!executed || ask === 'scents') return []
    const test = ASKS.find((a) => a.id === ask)?.test ?? (() => true)
    const needle = q.trim().toLowerCase()

    // Influencer lens: their proven pieces + their style DNA.
    const iconFits = icon ? FITS.filter((f) => f.who === icon) : []
    const provenIds = new Set(
      iconFits.flatMap((f) => f.pieces.map((pc) => resolve(pc)?.id).filter(Boolean) as string[]),
    )
    const iconStyles = new Set(iconFits.flatMap((f) => f.styles))

    let out = CATALOG.filter((p) => {
      if (!test(p)) return false
      if (icon && !provenIds.has(p.id) && !p.styles.some((st) => iconStyles.has(st))) return false
      if (needle) {
        const hay = `${p.brand} ${p.name} ${p.fabric ?? ''} ${p.styles.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price)
    else if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price)
    else out = rank(out, profile).map((r) => r.product)

    if (icon)
      out = [...out.filter((p) => provenIds.has(p.id)), ...out.filter((p) => !provenIds.has(p.id))]
    return out
  }, [executed, ask, q, icon, sort, profile])

  // Stealth mode until membership.
  if (!(signedIn && account)) {
    return (
      <div className="wrap" style={{ paddingBottom: 110 }}>
        <div className="pagehead" style={{ textAlign: 'center', paddingTop: 64 }}>
          <span className="eyebrow" style={{ color: 'var(--red)' }}>
            <Type text="RESTRICTED — MEMBERS ONLY" speed={20} />
          </span>
          <h2 className="fitcheck" style={{ margin: '10px 0 6px' }}>
            The Vault
          </h2>
          <p className="mono-line" style={{ margin: '0 auto', maxWidth: '52ch' }}>
            {CATALOG.length} LIVE PIECES FROM {BRANDS.length} BRANDS. SIZED TO YOU. UNLOCKED WITH AN
            ACCOUNT.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 26 }}>
            <button className="btn btn--primary btn--lg" onClick={() => go('auth')}>
              Create account to unlock <Arrow />
            </button>
          </div>
        </div>
        <div className="grid" style={{ marginTop: 34 }} aria-hidden="true">
          {CATALOG.slice(0, 12).map((p) => (
            <div className="vaultcard" key={p.id}>
              <div className="vaultcard__frame">
                <img src={p.image} alt="" loading="lazy" />
                <span className="vaultcard__lock">✕</span>
              </div>
              <div className="vaultcard__meta">
                <span>{p.brand}</span>
                <b>$███</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ paddingBottom: 110 }}>
      <div className={`deck${executed ? ' deck--docked' : ''}`}>
        {!executed && (
          <>
            <span className="eyebrow">
              <Type text={`${BRANDS.length} BRANDS · ${CATALOG.length} LIVE PIECES · SIZED TO YOU`} speed={14} />
            </span>
            <h2 className="deck__head">
              <Type text="WHAT ARE YOU LOOKING" speed={40} /> <em className="serif">for?</em>
            </h2>
          </>
        )}

        <div className="deck__bar">
          <select
            className="select deck__ask"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            aria-label="Category"
          >
            {ASKS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <div className="search deck__q">
            <Search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setExecuted(true)}
              placeholder="A brand, a piece, a fabric — or nothing at all"
              aria-label="Search"
            />
          </div>
          <button className="btn btn--primary" onClick={() => setExecuted(true)}>
            Search <Arrow />
          </button>
        </div>

        <div className="deck__subs">
          <select className="select" value="men" onChange={() => {}} aria-label="Cut">
            <option value="men">Men’s</option>
            <option value="women" disabled>
              Women’s — expanding
            </option>
          </select>
          <select className="select" value="me" onChange={() => {}} aria-label="Size">
            <option value="me">
              My size · {profile.chest}″ / {profile.waist}″
            </option>
          </select>
          <select
            className="select"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            aria-label="Inspired by"
          >
            <option value="">Inspired by — anyone</option>
            {iconChoices.map((who) => (
              <option key={who} value={who}>
                {who}
              </option>
            ))}
          </select>
          {executed && (
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort"
            >
              <option value="match">Best match</option>
              <option value="low">Price: low → high</option>
              <option value="high">Price: high → low</option>
            </select>
          )}
        </div>
      </div>

      {executed ? (
        <>
          <div className="spread" style={{ margin: '26px 0 16px' }}>
            <span className="toolbar__count">
              <b>{results.length}</b> {results.length === 1 ? 'piece' : 'pieces'}
              {icon && ` · inspired by ${icon}`}
            </span>
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => {
                setExecuted(false)
                setQ('')
                setIcon('')
                setAsk('any')
              }}
            >
              New search
            </button>
          </div>

          {scentHits.length > 0 && (
            <div style={{ marginBottom: 34 }}>
              <ScentShelf ids={scentHits} />
            </div>
          )}

          {results.length === 0 && scentHits.length === 0 ? (
            <div className="empty">
              <h3>Nothing in the vault for that.</h3>
              <p>Loosen the ask or drop the icon filter.</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={onOpen} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

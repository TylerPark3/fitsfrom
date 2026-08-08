import { useEffect, useMemo, useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS, type Product } from '../data/catalog'
import { FITS } from '../data/fits'
import { cosigns, resolve } from '../lib/fitmatch'
import { useStore } from '../lib/store'
import { rank } from '../lib/match'
import { learnTaste } from '../lib/learned'
import { ProductCard } from '../components/ProductCard'
import { ScentShelf } from '../components/ScentShelf'
import { SCENTS } from '../data/scents'
import { Arrow, Search } from '../components/Icons'

type Sort = 'featured' | 'match' | 'low' | 'high'

const PRODUCT_TYPES = [
  { id: 'all', title: 'All types' },
  { id: 'top', title: 'Tees & sweats' },
  { id: 'shirt', title: 'Shirts' },
  { id: 'knit', title: 'Knitwear' },
  { id: 'outer', title: 'Outerwear' },
  { id: 'pants', title: 'Pants & shorts' },
  { id: 'shoes', title: 'Shoes' },
  { id: 'accessory', title: 'Accessories' },
]

const COLORS = ['black', 'white', 'grey', 'blue', 'brown', 'green', 'red', 'cream'] as const

function productColor(product: Product) {
  const text = `${product.name} ${product.fabric ?? ''}`.toLowerCase()
  if (/black|onyx|noir|charcoal|ink|abyss/.test(text)) return 'black'
  if (/white|ivory|natural|ecru|cream|oat|cashew/.test(text)) return /cream|ecru|oat|cashew/.test(text) ? 'cream' : 'white'
  if (/grey|gray|silver|heather|slate/.test(text)) return 'grey'
  if (/blue|navy|indigo|denim|cobalt/.test(text)) return 'blue'
  if (/brown|tan|khaki|camel|chocolate|olive/.test(text)) return /olive/.test(text) ? 'green' : 'brown'
  if (/green|forest|sage|mint/.test(text)) return 'green'
  if (/red|burgundy|maroon|crimson|orange/.test(text)) return 'red'
  return ''
}


interface DropOption {
  id: string
  title: string
  sub?: string
  disabled?: boolean
}

/** Soar-grade dropdown: labeled trigger, floating card, rich rows. */
function Drop({
  label,
  value,
  options,
  onPick,
  seg = false,
}: {
  label: string
  value: string
  options: DropOption[]
  onPick: (id: string) => void
  seg?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const current = options.find((o) => o.id === value)

  return (
    <div className={`drop${seg ? ' drop--seg' : ''}`} ref={ref}>
      <button
        type="button"
        className={seg ? 'seg' : 'drop__pill'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="seg__label">{label}</span>
        <span className="drop__value">
          {current?.title ?? '—'}
          <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="drop__panel" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="drop__row"
              role="option"
              aria-selected={o.id === value}
              disabled={o.disabled}
              onClick={() => {
                if (o.disabled) return
                onPick(o.id)
                setOpen(false)
              }}
            >
              <span className="drop__title">
                {o.id === value && <i>✓</i>}
                {o.title}
              </span>
              {o.sub && <span className="drop__sub">{o.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const ASK_SUBS: Record<string, string> = {
  any: 'The whole vault',
  tees: 'Heavyweight, boxy, graphic',
  shirts: 'Oxfords, flannels, camp collars',
  knit: 'Sweaters, cardigans, vests',
  outer: 'Jackets & coats',
  parkas: 'Down & technical shells',
  pants: 'Denim, cargos, trousers',
  shorts: 'Jorts & baggies',
  shoes: 'Sneakers & boots',
  acc: 'Caps, chains, socks, bags',
  scents: 'The fragrance files',
}

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
  const { profile, saved, wardrobe, disliked, signedIn, account } = useStore()
  const learned = useMemo(
    () => learnTaste(saved, wardrobe.map((w) => w.productId), disliked),
    [saved, wardrobe, disliked],
  )
  const [ask, setAsk] = useState('any')
  const [q, setQ] = useState('')
  const [sizeF, setSizeF] = useState('mine')
  const [icon, setIcon] = useState('')
  const [sort, setSort] = useState<Sort>('featured')
  const [executed, setExecuted] = useState(false)
  const [brand, setBrand] = useState('all')
  const [gender, setGender] = useState('all')
  const [productType, setProductType] = useState('all')
  const [color, setColor] = useState('all')
  const [badge, setBadge] = useState('all')

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
    const needle = q.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

    // Influencer lens: their proven pieces + their style DNA.
    const iconFits = icon ? FITS.filter((f) => f.who === icon) : []
    const provenIds = new Set(
      iconFits.flatMap((f) => f.pieces.map((pc) => resolve(pc)?.id).filter(Boolean) as string[]),
    )
    const iconStyles = new Set(iconFits.flatMap((f) => f.styles))

    let out = CATALOG.filter((p) => {
      if (!test(p)) return false
      if (brand !== 'all' && p.brand !== brand) return false
      if (gender !== 'all' && p.gender !== gender && p.gender !== 'unisex') return false
      if (productType !== 'all' && p.category !== productType) return false
      if (color !== 'all' && productColor(p) !== color) return false
      if (badge === 'cosigned' && cosigns(p.id).length === 0) return false
      if (badge === 'grail' && p.tier !== 'grail') return false
      // A one-size belt or cap is, by definition, in your size — don't hide it.
      if (sizeF === 'mine' && p.sizeSystem === 'one' && p.category !== 'accessory') return false
      if (icon && !provenIds.has(p.id) && !p.styles.some((st) => iconStyles.has(st))) return false
      if (needle) {
        // Space-collapsing used to make "label trout" match "belt" — keep word
        // boundaries and require every typed word to appear somewhere.
        const hay = ` ${`${p.brand} ${p.name} ${p.fabric ?? ''} ${p.styles.join(' ')}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')} `
        if (!needle.split(' ').filter(Boolean).every((w) => hay.includes(` ${w}`))) return false
      }
      return true
    })

    if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price)
    else if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price)
    else if (sort === 'match') out = rank(out, profile, learned).map((r) => r.product)
    else {
      const ranked = rank(out, profile, learned).map((r) => r.product)
      out = [
        ...ranked.filter((p) => cosigns(p.id).length > 0),
        ...ranked.filter((p) => cosigns(p.id).length === 0),
      ]
    }

    if (icon) {
      const overlap = (p: Product) => p.styles.filter((st) => iconStyles.has(st)).length
      out = [
        ...out.filter((p) => provenIds.has(p.id)),
        ...out.filter((p) => !provenIds.has(p.id)).sort((a, b) => overlap(b) - overlap(a)),
      ]
    }
    return out
  }, [executed, ask, q, sizeF, icon, sort, profile, learned, brand, gender, productType, color, badge])

  // Stealth mode until membership.
  if (!(signedIn && account)) {
    return (
      <div className="wrap" style={{ paddingBottom: 110 }}>
        <div className="pagehead" style={{ textAlign: 'center', paddingTop: 64 }}>
          <span className="eyebrow" style={{ color: 'var(--red)' }}>
            Restricted — members only
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
              {BRANDS.length} brands · {CATALOG.length} live pieces · sized to you
            </span>
            <h2 className="deck__head">
              FIND YOUR <em className="serif">fit.</em>
            </h2>
          </>
        )}

        <div className="deck__bar">
          <Drop
            seg
            label="Looking for"
            value={ask}
            onPick={setAsk}
            options={ASKS.map((a) => ({ id: a.id, title: a.label, sub: ASK_SUBS[a.id] }))}
          />
          <i className="seg__div" />
          <label className="seg seg--grow">
            <span className="seg__label">Details</span>
            <input
              className="seg__control"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setExecuted(true)}
              placeholder="Brand, piece, fabric..."
              aria-label="Search"
            />
          </label>
          <button className="deck__go" onClick={() => setExecuted(true)}>
            <Search size={16} /> Search
          </button>
        </div>

        {(profile.teams.length > 0 || profile.tags.length > 0 || profile.brands.length > 0) && (
          <div className="signal-strip">
            <span className="eyebrow">Ranked using</span>
            {[...profile.styles.slice(0, 2), ...profile.teams.slice(0, 2), ...profile.tags.slice(0, 2), ...profile.brands.slice(0, 2)].map(
              (sig) => (
                <span className="reason" key={sig}>
                  {sig}
                </span>
              ),
            )}
          </div>
        )}

        <div className="deck__subs">
          <Drop
            label="Cut"
            value="men"
            onPick={() => {}}
            options={[
              { id: 'men', title: 'Men’s', sub: 'The whole vault' },
              { id: 'women', title: 'Women’s', sub: 'Expanding soon', disabled: true },
            ]}
          />
          <Drop
            label="Size"
            value={sizeF}
            onPick={setSizeF}
            options={[
              { id: 'all', title: 'All pieces', sub: 'Including one-size' },
              { id: 'mine', title: 'Sized only', sub: `Mapped to ${profile.chest}″ / ${profile.waist}″` },
            ]}
          />
          <Drop
            label="Inspired by"
            value={icon}
            onPick={setIcon}
            options={[
              { id: '', title: 'Anyone', sub: 'No filter' },
              ...iconChoices.map((who) => ({
                id: who,
                title: who,
                sub: `${FITS.filter((f) => f.who === who).length} fit${FITS.filter((f) => f.who === who).length === 1 ? '' : 's'} on file`,
              })),
            ]}
          />
          {executed && (
            <Drop
              label="Sort"
              value={sort}
              onPick={(v) => setSort(v as Sort)}
              options={[
                { id: 'match', title: 'Best match', sub: 'Ranked to your taste' },
                { id: 'low', title: 'Price ↑', sub: 'Low to high' },
                { id: 'high', title: 'Price ↓', sub: 'High to low' },
              ]}
            />
          )}
        </div>
      </div>

      {!executed && (
        <div className="deckstage" aria-hidden="true">
          <div className="sketch sketch--walk">
            <img className="sketch__base" src="/styles/watermark2-cut.png" alt="" />
            <span className="sketch__hatch" />
            <span className="sketch__hatch sketch__hatch--cross" />
          </div>
        </div>
      )}

      {!executed && (
        <section className="arrivals">
          <div className="arrivals__head">
            <p className="catalog__kicker">THE FITS FROM EDIT</p>
            <h2>New arrivals</h2>
            <p className="arrivals__sub">
              The latest independent labels, streetwear, sneakers and staples — ranked to your taste.
            </p>
          </div>

          <div className="catalog__filters" aria-label="Catalogue filters">
            <span className="catalog__filter-label">Filter:</span>
            <Drop label="Brand" value={brand} onPick={setBrand} options={[{ id: 'all', title: 'All brands' }, ...BRANDS.map((n) => ({ id: n, title: n }))]} />
            <Drop label="Gender" value={gender} onPick={setGender} options={[{ id: 'all', title: 'All genders' }, { id: 'men', title: 'Men' }, { id: 'women', title: 'Women' }, { id: 'unisex', title: 'Unisex' }]} />
            <Drop label="Product type" value={productType} onPick={setProductType} options={PRODUCT_TYPES} />
            <Drop label="Color" value={color} onPick={setColor} options={[{ id: 'all', title: 'All colors' }, ...COLORS.map((n) => ({ id: n, title: n[0].toUpperCase() + n.slice(1) }))]} />
            <Drop label="Badge" value={badge} onPick={setBadge} options={[{ id: 'all', title: 'All pieces' }, { id: 'cosigned', title: 'Worn by' }, { id: 'grail', title: 'Grail tier' }]} />
            <div className="catalog__sort">
              <Drop label="Sort" value={sort} onPick={(v) => setSort(v as Sort)} options={[{ id: 'featured', title: 'Featured', sub: 'Cosigned first' }, { id: 'match', title: 'Best match', sub: 'Ranked to your taste' }, { id: 'low', title: 'Price: low to high' }, { id: 'high', title: 'Price: high to low' }]} />
            </div>
          </div>

          <div className="grid">
            {(() => {
              const filtered = CATALOG.filter((p) => {
                if (brand !== 'all' && p.brand !== brand) return false
                if (gender !== 'all' && p.gender !== gender && p.gender !== 'unisex') return false
                if (productType !== 'all' && p.category !== productType) return false
                if (color !== 'all' && productColor(p) !== color) return false
                if (badge === 'cosigned' && cosigns(p.id).length === 0) return false
                if (badge === 'grail' && p.tier !== 'grail') return false
                return true
              })
              const ranked =
                sort === 'low'
                  ? [...filtered].sort((a, b) => a.price - b.price)
                  : sort === 'high'
                    ? [...filtered].sort((a, b) => b.price - a.price)
                    : rank(filtered, profile, learned).map((r) => r.product)
              const ordered =
                sort === 'featured'
                  ? [...ranked.filter((p) => cosigns(p.id).length > 0), ...ranked.filter((p) => cosigns(p.id).length === 0)]
                  : ranked
              return ordered.slice(0, 12).map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} />)
            })()}
          </div>
        </section>
      )}

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

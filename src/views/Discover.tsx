import { useEffect, useMemo, useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS, type Product } from '../data/catalog'
import { FITS } from '../data/fits'
import { cosigns, resolve } from '../lib/fitmatch'
import { useStore } from '../lib/store'
import { rank } from '../lib/match'
import { ProductCard } from '../components/ProductCard'
import { ScentShelf } from '../components/ScentShelf'
import { SCENTS } from '../data/scents'
import { Arrow, Search } from '../components/Icons'

type Sort = 'match' | 'low' | 'high'

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
          {value === 'all' || value === '' ? label : `${label}: ${current?.title ?? '—'}`}
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
  const [sizeF, setSizeF] = useState('all')
  const [icon, setIcon] = useState('')
  const [sort, setSort] = useState<Sort>('match')
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
  }, [ask, q])

  const results = useMemo(() => {
    if (ask === 'scents') return []
    const test = ASKS.find((a) => a.id === ask)?.test ?? (() => true)
    const needle = q.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

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
      if (sizeF === 'mine' && p.sizeSystem === 'one') return false
      if (icon && !provenIds.has(p.id) && !p.styles.some((st) => iconStyles.has(st))) return false
      if (needle) {
        const hay = `${p.brand} ${p.name} ${p.fabric ?? ''} ${p.styles.join(' ')}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
        if (!hay.includes(needle)) return false
      }
      return true
    })

    if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price)
    else if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price)
    else out = rank(out, profile).map((r) => r.product)

    if (icon) {
      const overlap = (p: Product) => p.styles.filter((st) => iconStyles.has(st)).length
      out = [
        ...out.filter((p) => provenIds.has(p.id)),
        ...out.filter((p) => !provenIds.has(p.id)).sort((a, b) => overlap(b) - overlap(a)),
      ]
    }
    return out
  }, [ask, q, sizeF, icon, sort, profile, brand, gender, productType, color, badge])

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
    <div className="catalog wrap">
      <header className="catalog__head">
        <p className="catalog__kicker">THE FITS FROM EDIT</p>
        <h1>New arrivals</h1>
        <p>Explore the latest independent labels, streetwear, sneakers and wardrobe staples—ranked to your taste.</p>
      </header>

      <div className="catalog__search">
        <Search size={15} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a brand, piece, fabric, or scent" aria-label="Search catalogue" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search">Clear</button>}
      </div>

      <div className="catalog__filters" aria-label="Catalogue filters">
        <span className="catalog__filter-label">Filter:</span>
        <Drop label="Brand" value={brand} onPick={setBrand} options={[{ id: 'all', title: 'All brands' }, ...BRANDS.map((name) => ({ id: name, title: name }))]} />
        <Drop label="Gender" value={gender} onPick={setGender} options={[{ id: 'all', title: 'All genders' }, { id: 'men', title: 'Men' }, { id: 'women', title: 'Women' }, { id: 'unisex', title: 'Unisex' }]} />
        <Drop label="Product type" value={productType} onPick={setProductType} options={PRODUCT_TYPES} />
        <Drop label="Size" value={sizeF} onPick={setSizeF} options={[{ id: 'all', title: 'All sizes' }, { id: 'mine', title: 'My size', sub: `${profile.chest}″ chest · ${profile.waist}″ waist` }]} />
        <Drop label="Color" value={color} onPick={setColor} options={[{ id: 'all', title: 'All colors' }, ...COLORS.map((name) => ({ id: name, title: name[0].toUpperCase() + name.slice(1) }))]} />
        <Drop label="Badge" value={badge} onPick={setBadge} options={[{ id: 'all', title: 'All pieces' }, { id: 'cosigned', title: 'Worn by' }, { id: 'grail', title: 'Grail tier' }]} />
        <Drop label="Inspired by" value={icon} onPick={setIcon} options={[{ id: '', title: 'Anyone' }, ...iconChoices.map((who) => ({ id: who, title: who }))]} />
        <div className="catalog__sort">
          <Drop label="Sort" value={sort} onPick={(v) => setSort(v as Sort)} options={[{ id: 'match', title: 'Featured' }, { id: 'low', title: 'Price: low to high' }, { id: 'high', title: 'Price: high to low' }]} />
        </div>
      </div>

      <div className="catalog__resultline">
        <span><b>{results.length}</b> pieces{icon ? ` inspired by ${icon}` : ''}</span>
        {(brand !== 'all' || gender !== 'all' || productType !== 'all' || color !== 'all' || badge !== 'all' || sizeF !== 'all' || icon || q) && (
          <button onClick={() => { setBrand('all'); setGender('all'); setProductType('all'); setColor('all'); setBadge('all'); setSizeF('all'); setIcon(''); setQ(''); setAsk('any') }}>Clear all</button>
        )}
      </div>

      {scentHits.length > 0 && <div className="catalog__scents"><ScentShelf ids={scentHits} /></div>}
      {results.length === 0 && scentHits.length === 0 ? (
        <div className="empty"><h3>No pieces match those filters.</h3><p>Clear a filter and try again.</p></div>
      ) : results.length > 0 ? (
        <div className="grid">{results.map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} />)}</div>
      ) : null}
    </div>
  )
}

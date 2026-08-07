import { useMemo, useState, type ReactNode } from 'react'
import type { View } from '../App'
import { CATALOG, type Product } from '../data/catalog'
import {
  CATEGORIES,
  SEASONS,
  STYLES,
  TIERS,
  type Category,
  type Season,
  type StyleId,
  type Tier,
} from '../data/taxonomy'
import { useStore } from '../lib/store'
import { rank } from '../lib/match'
import { topTwin } from '../lib/twin'
import { ProductCard } from '../components/ProductCard'
import { Check, Search, Arrow } from '../components/Icons'

type Sort = 'match' | 'low' | 'high' | 'new'

export function Discover({ onOpen, go }: { onOpen: (id: string) => void; go: (v: View) => void }) {
  const { profile, setProfile, signedIn, account } = useStore()
  const [q, setQ] = useState('')
  const [cats, setCats] = useState<Category[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [sort, setSort] = useState<Sort>('match')
  const [onlyMySize, setOnlyMySize] = useState(false)

  const toggle = <T,>(list: T[], v: T, set: (l: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out: Product[] = CATALOG.filter((p) => {
      if (cats.length && !cats.includes(p.category)) return false
      if (brands.length && !brands.includes(p.brand)) return false
      if (p.price > profile.budgetMax) return false
      if (profile.tiers.length && !profile.tiers.includes(p.tier)) return false
      if (profile.seasons.length && !p.seasons.some((s) => profile.seasons.includes(s))) return false
      if (p.gender !== 'unisex' && !profile.genders.includes(p.gender)) return false
      if (onlyMySize && p.sizeSystem === 'one') return false
      if (needle) {
        const hay = `${p.brand} ${p.name} ${p.styles.join(' ')}`
        if (!hay.toLowerCase().includes(needle)) return false
      }
      return true
    })

    if (sort === 'match') out = rank(out, profile).map((r) => r.product)
    else if (sort === 'low') out = [...out].sort((a, b) => a.price - b.price)
    else if (sort === 'high') out = [...out].sort((a, b) => b.price - a.price)
    else out = [...out].reverse()

    return out
  }, [q, cats, brands, sort, onlyMySize, profile])

  // Counts reflect what's still reachable given the other active filters.
  const countFor = (fn: (p: Product) => boolean) =>
    CATALOG.filter((p) => p.price <= profile.budgetMax && fn(p)).length

  const brandList = useMemo(
    () =>
      Array.from(new Set(CATALOG.map((p) => p.brand)))
        .sort()
        .map((b) => ({ b, n: CATALOG.filter((p) => p.brand === b).length })),
    [],
  )

  const activeCount =
    cats.length + brands.length + (q ? 1 : 0) + (onlyMySize ? 1 : 0)

  // Stealth mode: the edit stays classified until you're in.
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
            {CATALOG.length} LIVE PIECES FROM {new Set(CATALOG.map((p) => p.brand)).size} BRANDS.
            SIZED TO YOU. UNLOCKED WITH AN ACCOUNT.
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
    <div className="wrap">
      <div className="pagehead">
        <span className="eyebrow">{profile.onboarded ? 'Ranked for you' : 'The edit'}</span>
        <h2>{profile.name ? `${profile.name}’s edit` : 'Your edit'}</h2>
        {profile.onboarded && topTwin(profile.styles) && (
          <p className="tiny" style={{ marginTop: 8 }}>
            Style twin: <b style={{ fontWeight: 550, color: 'var(--ink)' }}>{topTwin(profile.styles)!.fit.who}</b> · {topTwin(profile.styles)!.pct}% match
          </p>
        )}
        {!profile.onboarded && (
          <p>
            Unranked until you{' '}
            <button
              className="btn btn--quiet btn--sm"
              style={{ padding: 0, height: 'auto', textDecoration: 'underline' }}
              onClick={() => go('onboarding')}
            >
              set up your profile
            </button>
            .
          </p>
        )}
      </div>

      <div className="split">
        <aside className="rail">
          <FGroup
            title="Category"
            onClear={cats.length ? () => setCats([]) : undefined}
          >
            {CATEGORIES.map((c) => (
              <Opt
                key={c.id}
                on={cats.includes(c.id)}
                n={countFor((p) => p.category === c.id)}
                onClick={() => toggle(cats, c.id, setCats)}
              >
                {c.plural}
              </Opt>
            ))}
          </FGroup>

          <FGroup title="Style">
            {STYLES.map((s) => (
              <Opt
                key={s.id}
                on={profile.styles.includes(s.id)}
                n={countFor((p) => p.styles.includes(s.id))}
                onClick={() =>
                  setProfile({
                    styles: profile.styles.includes(s.id)
                      ? profile.styles.filter((x) => x !== s.id)
                      : [...profile.styles, s.id as StyleId],
                  })
                }
              >
                {s.label}
              </Opt>
            ))}
          </FGroup>

          <FGroup title="Budget per piece">
            <div className="slider">
              <div className="spread" style={{ marginBottom: 2 }}>
                <span className="tiny">Up to</span>
                <b className="slider__val">
                  ${profile.budgetMax}
                  {profile.budgetMax >= 600 ? '+' : ''}
                </b>
              </div>
              <input
                type="range"
                min={40}
                max={600}
                step={10}
                value={profile.budgetMax}
                onChange={(e) => setProfile({ budgetMax: +e.target.value })}
                aria-label="Maximum price"
              />
            </div>
          </FGroup>

          <FGroup title="Quality">
            {TIERS.map((t) => (
              <Opt
                key={t.id}
                on={profile.tiers.includes(t.id)}
                n={countFor((p) => p.tier === t.id)}
                onClick={() =>
                  setProfile({
                    tiers: profile.tiers.includes(t.id)
                      ? profile.tiers.filter((x) => x !== t.id)
                      : [...profile.tiers, t.id as Tier],
                  })
                }
              >
                {t.label}
              </Opt>
            ))}
          </FGroup>

          <FGroup title="Season">
            {SEASONS.map((s) => (
              <Opt
                key={s.id}
                on={profile.seasons.includes(s.id)}
                n={countFor((p) => p.seasons.includes(s.id))}
                onClick={() =>
                  setProfile({
                    seasons: profile.seasons.includes(s.id)
                      ? profile.seasons.filter((x) => x !== s.id)
                      : [...profile.seasons, s.id as Season],
                  })
                }
              >
                {s.label}
              </Opt>
            ))}
          </FGroup>

          <FGroup title="Brand" onClear={brands.length ? () => setBrands([]) : undefined}>
            {brandList.map(({ b, n }) => (
              <Opt
                key={b}
                on={brands.includes(b)}
                n={n}
                onClick={() => toggle(brands, b, setBrands)}
              >
                {b}
              </Opt>
            ))}
          </FGroup>
        </aside>

        <section>
          <div className="toolbar">
            <div className="search">
              <Search />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brands, pieces…"
                aria-label="Search the catalogue"
              />
            </div>

            <button
              className="chip"
              aria-pressed={onlyMySize}
              onClick={() => setOnlyMySize((v) => !v)}
            >
              Sized for me
            </button>

            <div style={{ flex: 1 }} />

            <span className="toolbar__count">
              <b>{results.length}</b> {results.length === 1 ? 'piece' : 'pieces'}
              {activeCount > 0 && ` · ${activeCount} filter${activeCount > 1 ? 's' : ''}`}
            </span>

            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort"
            >
              <option value="match">Best match</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="new">Recently added</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <h3>Nothing survives those filters.</h3>
              <p>Loosen one and the good stuff comes back.</p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    setCats([])
                    setBrands([])
                    setQ('')
                    setOnlyMySize(false)
                    setProfile({
                      budgetMax: Math.max(profile.budgetMax, 300),
                      tiers: ['entry', 'solid', 'premium', 'grail'],
                      seasons: ['spring', 'summer', 'fall', 'winter'],
                    })
                  }}
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={onOpen} />
              ))}
            </div>
          )}

          {results.length > 0 && !profile.onboarded && (
            <div className="empty" style={{ marginTop: 32 }}>
              <h3>Two minutes of setup ranks all of this around you.</h3>
              <p>Your size on every card. Your budget as the ceiling.</p>
              <button className="btn btn--primary" onClick={() => go('onboarding')}>
                Build my profile <Arrow />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FGroup({
  title,
  onClear,
  children,
}: {
  title: string
  onClear?: () => void
  children: ReactNode
}) {
  return (
    <div className="fgroup">
      <div className="fgroup__head">
        <h4>{title}</h4>
        {onClear && (
          <button className="fgroup__clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Opt({
  on,
  n,
  onClick,
  children,
}: {
  on: boolean
  n: number
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button className="opt" aria-pressed={on} onClick={onClick}>
      <span className="opt__box">
        <Check />
      </span>
      {children}
      <span className="opt__n">{n}</span>
    </button>
  )
}

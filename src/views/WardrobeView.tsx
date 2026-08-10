import { useMemo, useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, BRANDS, type Product } from '../data/catalog'
import { CATEGORIES, CORE_SLOTS } from '../data/taxonomy'
import { useStore, type CustomPiece } from '../lib/store'
import { rank } from '../lib/match'
import { complete, hydrate, profileToStyle, rankFits, type BuiltFit } from '../lib/wardrobe/builder'
import { FitScore } from '../components/FitScore'
import { OutfitBuilder } from '../components/OutfitBuilder'
import { recommendSize } from '../lib/sizing'
import { fileToDataUrl } from '../lib/img'
import { buyUrl } from '../lib/affiliate'
import { ProductCard } from '../components/ProductCard'
import { Arrow, Plus, Trash, Upload } from '../components/Icons'
import { Room } from '../components/Room'
import { PRO, halfOf, planFor } from '../lib/plan'

export const CONDITIONS: [string, number][] = [
  ['NWT', 0.85],
  ['Like new', 0.62],
  ['Good', 0.45],
  ['Fair', 0.28],
  ['Beat', 0.12],
]
export const YEAR_STEPS = [0, 1, 2, 3, 5]

export function itemValue(price: number, condition?: string, years?: number): number {
  const cf = CONDITIONS.find(([c]) => c === condition)?.[1] ?? 0.62
  const age = Math.max(0.35, 1 - 0.05 * (years ?? 0))
  return price * cf * age
}

export function WardrobeView({
  onOpen,
  go,
}: {
  onOpen: (id: string) => void
  go: (v: View) => void
}) {
  const { wardrobe, customs, account, profile, setProfile, toast } = useStore()
  const [recPage, setRecPage] = useState(0)

  const halves = { tops: 0, bottoms: 0 }
  for (const w2 of wardrobe) {
    const p = CATALOG.find((c) => c.id === w2.productId)
    if (p) halves[halfOf(p.category)]++
  }
  for (const c of customs) halves[halfOf(c.category)]++
  const plan = planFor({ wardrobe, customs, account }, halves)

  const items = wardrobe
    .map((w) => ({ w, p: CATALOG.find((c) => c.id === w.productId)! }))
    .filter((x) => x.p)

  const countIn = (cat: string) => items.filter((i) => i.p.category === cat).length

  // What the wardrobe is missing, ranked by how short each slot is.
  const gaps = CORE_SLOTS.map((slot) => ({
    ...slot,
    have: countIn(slot.category),
    pct: Math.min(1, countIn(slot.category) / slot.per),
  }))

  // Essentials first: you can't wear a fit without pants, then shoes.
  const ESSENTIAL: Record<string, number> = {
    pants: 3,
    shoes: 2.6,
    top: 2,
    outer: 1.6,
    knit: 1.2,
    shirt: 1,
    accessory: 0.8,
  }
  const worstGap = [...gaps]
    .filter((g) => g.pct < 1)
    .sort(
      (a, b) =>
        (1 - b.pct) * (ESSENTIAL[b.category] ?? 1) - (1 - a.pct) * (ESSENTIAL[a.category] ?? 1),
    )[0]

  // Diverse pool: never two from the same brand back-to-back, never near-identical names.
  const pool: typeof CATALOG = []
  for (const r of rank(
    CATALOG.filter(
      (p) =>
        p.category === worstGap?.category &&
        !wardrobe.some((w) => w.productId === p.id) &&
        p.price <= profile.budgetMax,
    ),
    profile,
  )) {
    const pr = r.product
    if (pool.some((x) => x.name.slice(0, 18) === pr.name.slice(0, 18))) continue
    pool.push(pr)
  }
  // One per brand within each window of four, so every refresh stays varied.
  const windowed: typeof CATALOG = []
  const brandSeen = new Set<string>()
  for (const pr of pool) {
    if (windowed.length % 4 === 0) brandSeen.clear()
    if (brandSeen.has(pr.brand)) continue
    brandSeen.add(pr.brand)
    windowed.push(pr)
  }
  const pages = Math.max(1, Math.ceil(windowed.length / 4))
  const page = recPage % pages
  const suggestions = windowed.slice(page * 4, page * 4 + 4)

  const totalValue = items.reduce((n, i) => n + itemValue(i.p.price, i.w.condition, i.w.years), 0)

  if (items.length === 0) {
    return (
      <div className="wrap">
        <div className="pagehead">
          <span className="eyebrow">THE CLOSET — CATALOGUED</span>
          <h2>Everything you own, in one place.</h2>
          <p>Add what you have. Cosign fills the holes instead of the feed.</p>
        </div>
        <div className="empty">
          <h3>Nothing in here yet.</h3>
          <p>Open any piece and hit “Add to wardrobe” — or snap what you already own below.</p>
          <button className="btn btn--primary" onClick={() => go('discover')}>
            Go to the edit <Arrow />
          </button>
        </div>
        <div style={{ marginTop: 40 }}>
          <OwnCloset />
          <OutfitBuilder />

      <FitPlanner />
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="pagehead">
        <span className="eyebrow">THE CLOSET — CATALOGUED</span>
        <h2>
          {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          <small className="pagehead__worth">${Math.round(totalValue).toLocaleString()}</small>
        </h2>

        <div className="budgetbar">
          <span className="eyebrow">Budget per piece</span>
          <button
            className="budgetbar__step"
            aria-label="Lower budget"
            onClick={() => setProfile({ budgetMax: Math.max(40, profile.budgetMax - 25) })}
          >
            −
          </button>
          <b>${profile.budgetMax}</b>
          <button
            className="budgetbar__step"
            aria-label="Raise budget"
            onClick={() => setProfile({ budgetMax: Math.min(1200, profile.budgetMax + 25) })}
          >
            +
          </button>
        </div>
      </div>

      <PlanStrip plan={plan} onPro={() => {
        try {
          localStorage.setItem('lapel.pro.waitlist', '1')
        } catch {}
        toast(`Pro — ${PRO.label} · launching soon, you’re first in line`)
      }} />

      <Artists />

      <Room />

      <div className="counts">
        {gaps.map((g) => (
          <span className={`count${g.pct >= 1 ? ' is-full' : ''}`} key={g.category}>
            {g.label} <b>{g.have}</b>
          </span>
        ))}
      </div>

      <Closet onOpen={onOpen} />

      <OwnCloset />

      {suggestions.length > 0 && worstGap && (
        <div className="section">
          <div className="section__head">
            <h3>Your biggest hole is {worstGap.label}</h3>
            <div className="row" style={{ gap: 12 }}>
              <span className="tiny">Ranked against your taste and budget</span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setRecPage((n) => n + 1)}
                aria-label="Show different recommendations in both sections"
              >
                ↻ Refresh both
              </button>
            </div>
          </div>
          <div className="grid">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}

      <MoreLikeYours onOpen={onOpen} page={recPage} />

      <OutfitBuilder />

      <FitPlanner />

      <SavedBrands />

      <SavedShelf onOpen={onOpen} />

    </div>
  )
}

/** The closet — two shelves, tops and bottoms. Filter inside each instead of stacking rows. */
function Closet({ onOpen }: { onOpen: (id: string) => void }) {
  const { wardrobe, customs, removeFromWardrobe, removeCustom, updateWardrobe, toast } = useStore()

  interface Hang {
    key: string
    img: string
    name: string
    kind: string
    size?: string
    productId?: string
    customId?: string
    condition?: string
    years?: number
    price?: number
  }

  // Two shelves. The chips inside each one are the old sections, demoted to a filter.
  const SHELVES: { label: string; kinds: string[] }[] = [
    { label: 'Tops', kinds: ['Tees & hoodies', 'Shirts', 'Knits', 'Outerwear', 'Accessories'] },
    { label: 'Bottoms', kinds: ['Pants', 'Shorts', 'Shoes'] },
  ]
  const kindFor = (cat: string, sil?: string) => {
    if (cat === 'pants') return sil === 'short' ? 'Shorts' : 'Pants'
    return (
      {
        top: 'Tees & hoodies',
        shirt: 'Shirts',
        knit: 'Knits',
        outer: 'Outerwear',
        shoes: 'Shoes',
        accessory: 'Accessories',
      }[cat] ?? 'Tees & hoodies'
    )
  }

  const hangs: Hang[] = []
  for (const w of wardrobe) {
    const p = CATALOG.find((x) => x.id === w.productId)
    if (!p) continue
    hangs.push({
      key: p.id,
      img: p.image,
      name: p.name,
      kind: kindFor(p.category, p.silhouette),
      size: w.size,
      productId: p.id,
      condition: w.condition,
      years: w.years,
      price: p.price,
    })
  }
  for (const c of customs) {
    hangs.push({ key: c.id, img: c.photo, name: c.name, kind: kindFor(c.category), customId: c.id })
  }

  const [kind, setKind] = useState<Record<string, string>>({})
  const filled = SHELVES.map((sh) => ({
    ...sh,
    items: hangs.filter((h) => sh.kinds.includes(h.kind)),
  })).filter((sh) => sh.items.length > 0)
  if (filled.length === 0) return null

  return (
    <div className="section">
      <div className="section__head">
        <h3>The closet</h3>
        <span className="tiny">{hangs.length} pieces · tops and bottoms</span>
      </div>
      {filled.map((sh) => {
        const present = sh.kinds.filter((k) => sh.items.some((it) => it.kind === k))
        const active = kind[sh.label] && present.includes(kind[sh.label]) ? kind[sh.label] : ''
        const items = active ? sh.items.filter((it) => it.kind === active) : sh.items
        return (
        <div className="shelf" key={sh.label} id={`shelf-${sh.label}`}>
          <div className="shelf__head">
            <span>{sh.label}</span>
            <b>{items.length}</b>
          </div>
          {present.length > 1 && (
            <div className="shelf__filters">
              <button
                className={`shelfchip${active === '' ? ' is-on' : ''}`}
                onClick={() => setKind((s) => ({ ...s, [sh.label]: '' }))}
              >
                All
              </button>
              {present.map((k) => (
                <button
                  key={k}
                  className={`shelfchip${active === k ? ' is-on' : ''}`}
                  onClick={() => setKind((s) => ({ ...s, [sh.label]: active === k ? '' : k }))}
                >
                  {k}
                  <i>{sh.items.filter((it) => it.kind === k).length}</i>
                </button>
              ))}
            </div>
          )}
          <div className="shelf__row">
            {items.map((it) => (
              <div className="ctile" key={it.key}>
                <button
                  className="ctile__img"
                  onClick={() => {
                    if (it.productId) onOpen(it.productId)
                    else if (it.customId) {
                      const c = customs.find((x) => x.id === it.customId)
                      if (c?.link) window.open(c.link, '_blank', 'noopener')
                    }
                  }}
                  aria-label={it.name}
                >
                  {it.img ? (
                    <img src={it.img} alt="" loading="lazy" />
                  ) : (
                    <span className="ctile__mono serif">{it.name[0]?.toUpperCase()}</span>
                  )}
                </button>
                <div className="ctile__meta">
                  <span title={it.name}>{it.name}</span>
                  {it.size && <b>{it.size}</b>}
                </div>
                {it.productId && (
                  <div className="ctile__cond">
                    <button
                      className="condchip"
                      title="Condition — tap to cycle"
                      onClick={() => {
                        const i = CONDITIONS.findIndex(([c]) => c === (it.condition ?? 'Like new'))
                        const next = CONDITIONS[(i + 1) % CONDITIONS.length][0]
                        updateWardrobe(it.productId!, { condition: next })
                      }}
                    >
                      {it.condition ?? 'Like new'}
                    </button>
                    <button
                      className="condchip"
                      title="Years owned — tap to cycle"
                      onClick={() => {
                        const i = YEAR_STEPS.indexOf(it.years ?? 0)
                        const next = YEAR_STEPS[(i + 1) % YEAR_STEPS.length]
                        updateWardrobe(it.productId!, { years: next })
                      }}
                    >
                      {(it.years ?? 0) === 0 ? 'new' : `${it.years}y${it.years === 5 ? '+' : ''}`}
                    </button>
                    {it.price != null && (
                      <b className="condchip condchip--val">
                        ${Math.round(itemValue(it.price, it.condition, it.years))}
                      </b>
                    )}
                  </div>
                )}
                <button
                  className="ctile__x"
                  aria-label={`Remove ${it.name}`}
                  onClick={() => {
                    if (it.productId) removeFromWardrobe(it.productId)
                    if (it.customId) removeCustom(it.customId)
                    toast('Removed')
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        )
      })}
    </div>
  )
}


const CAT_KW: [string, RegExp][] = [
  ['shoes', /sneaker|shoe|boot|loafer|runner|chuck|force|dunk|jordan\b/i],
  ['outer', /jacket|coat|parka|vest|puffer|windbreaker/i],
  ['knit', /sweater|cardigan|knit|merino|cashmere/i],
  ['pants', /jean|denim|pant|trouser|cargo|chino|sweat|short|cord/i],
  ['shirt', /shirt|oxford|flannel|polo|button/i],
  ['accessory', /cap|hat|beanie|bag|belt|sock|chain|watch|scarf/i],
  ['top', /tee|t-shirt|hoodie|crewneck|sweatshirt|longsleeve|thermal/i],
]

/** "carhartt jeans, 32" → a catalogued piece. No photo needed. */
function parseQuickAdd(input: string) {
  const size = input.match(/\b(\d{2}(?:\s*[x×]\s*\d{2})?|xs|s|m|l|xl|xxl|\d{1,2}\.5)\b/i)?.[0] ?? ''
  const name = input.replace(/,?\s*(size\s*)?\b(\d{2}(?:\s*[x×]\s*\d{2})?|xs|s|m|l|xl|xxl|\d{1,2}\.5)\b\s*$/i, '').trim()
  const category = CAT_KW.find(([, re]) => re.test(input))?.[0] ?? 'top'
  return { name: name || input.trim(), category, size: size.toUpperCase() }
}

/** One clean way in: search the vault, paste a link, or snap a photo. */
function OwnCloset() {
  const { addCustom, addToWardrobe, profile, toast } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'search' | 'link' | 'snap'>('search')
  const [busy, setBusy] = useState(false)
  const [vaultQ, setVaultQ] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const [pending, setPending] = useState<{ photo: string; name: string; category: string } | null>(null)

  const vaultHits = vaultQ.trim()
    ? CATALOG.filter((p) =>
        `${p.brand} ${p.name}`.toLowerCase().replace(/[^a-z0-9]/g, '').includes(vaultQ.trim().toLowerCase().replace(/[^a-z0-9]/g, '')),
      ).slice(0, 5)
    : []

  const addByLink = () => {
    let url: URL
    try {
      url = new URL(linkUrl.trim())
    } catch {
      toast('That doesn’t look like a link')
      return
    }
    const slug = url.pathname.split('/').filter(Boolean).pop() ?? ''
    const fromSlug = slug
      .replace(/[-_]+/g, ' ')
      .replace(/\.(html?|php)$/i, '')
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim()
    const host = url.hostname.replace(/^www\./, '').split('.')[0]
    const brandGuess = host.replace(/\b\w/g, (ch) => ch.toUpperCase())
    const name = linkName.trim() || fromSlug || 'Linked piece'
    const { category } = parseQuickAdd(`${name} ${slug}`)
    addCustom({
      id: `c${Date.now().toString(36)}`,
      name: `${brandGuess} · ${name}`,
      category,
      photo: '',
      link: url.href,
    })
    setLinkUrl('')
    setLinkName('')
    toast(`In your closet — ${name}`)
  }

  const accept = async (file: File | undefined) => {
    if (!file?.type.startsWith('image/')) return
    setBusy(true)
    try {
      const photo = await fileToDataUrl(file, 700)
      setPending({ photo, name: '', category: 'top' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section">
      <div className="section__head">
        <h3>Add to your closet</h3>
        <span className="tiny">Stays on this device</span>
      </div>

      <div className="addcard">
        <div className="addtabs">
          {(
            [
              ['search', 'Search the vault'],
              ['link', 'Paste a link'],
              ['snap', 'Snap it'],
            ] as const
          ).map(([m, label]) => (
            <button key={m} className="addtab" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'search' && (
          <>
            <div className="room__input">
              <input
                className="text-input"
                autoFocus
                placeholder="“stussy tee”, “3sixteen”, “jordan”…"
                value={vaultQ}
                onChange={(e) => setVaultQ(e.target.value)}
              />
            </div>
            {vaultHits.length > 0 && (
              <div className="vaulthits" style={{ marginTop: 10 }}>
                {vaultHits.map((p) => (
                  <button
                    key={p.id}
                    className="vaulthit"
                    onClick={() => {
                      addToWardrobe(p.id, recommendSize(p, profile).label, true)
                      setVaultQ('')
                      toast(`In your closet — ${p.name}`)
                    }}
                  >
                    <img src={p.image} alt="" loading="lazy" />
                    <span>
                      <b>{p.brand}</b> {p.name}
                    </span>
                    <i>+ add</i>
                  </button>
                ))}
              </div>
            )}
            {vaultQ.trim() && vaultHits.length === 0 && (
              <p className="tiny" style={{ marginTop: 10 }}>
                Not in the vault — paste a link or snap it instead.
              </p>
            )}
          </>
        )}

        {mode === 'link' && (
          <>
            <div className="room__input">
              <input
                className="text-input"
                autoFocus
                placeholder="https://stussy.com/products/…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addByLink()}
              />
            </div>
            <div className="room__input" style={{ marginTop: 8 }}>
              <input
                className="text-input"
                placeholder="Description (optional) — “purple shorts”"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addByLink()}
              />
              <button className="btn btn--primary" onClick={addByLink}>
                Add
              </button>
            </div>
          </>
        )}

        {mode === 'snap' && (
          <>
            <button className="btn btn--ghost" onClick={() => input.current?.click()}>
              <Upload size={15} /> {busy ? 'Reading…' : 'Choose a photo'}
            </button>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void accept(e.target.files?.[0])} />
          </>
        )}

        {pending && (
          <div className="snapform" style={{ marginTop: 14 }}>
            <img src={pending.photo} alt="" />
            <div className="snapform__body">
              <input
                className="text-input"
                placeholder="What is it? “thrifted hoodie”"
                value={pending.name}
                onChange={(e) => setPending({ ...pending, name: e.target.value })}
                autoFocus
              />
              <div className="chips" style={{ margin: '10px 0 14px' }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className="chip chip--sm"
                    aria-pressed={pending.category === c.id}
                    onClick={() => setPending({ ...pending, category: c.id })}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    addCustom({
                      id: `c${Date.now().toString(36)}`,
                      name: pending.name.trim() || 'My piece',
                      category: pending.category,
                      photo: pending.photo,
                    })
                    setPending(null)
                    toast('In your closet')
                  }}
                >
                  Add to closet
                </button>
                <button className="btn btn--quiet btn--sm" onClick={() => setPending(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** "More like what you own" — same category as your deepest stack, ranked to taste. */
function MoreLikeYours({ onOpen, page = 0 }: { onOpen: (id: string) => void; page?: number }) {
  const { wardrobe, customs, profile } = useStore()
  const counts: Record<string, number> = {}
  for (const w of wardrobe) {
    const p = CATALOG.find((x) => x.id === w.productId)
    if (p) counts[p.category] = (counts[p.category] ?? 0) + 1
  }
  for (const c of customs) counts[c.category] = (counts[c.category] ?? 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!top || top[1] < 2) return null

  // Same Refresh as the gap block above — both are recommendations, so one
  // press should turn over both of them.
  const pool = rank(
    CATALOG.filter((p) => p.category === top[0] && !wardrobe.some((w) => w.productId === p.id)),
    profile,
  ).map((r) => r.product)
  const pages = Math.max(1, Math.ceil(Math.min(pool.length, 24) / 4))
  const start = (page % pages) * 4
  const picks = pool.slice(start, start + 4)
  if (picks.length === 0) return null

  const label = CATEGORIES.find((c) => c.id === top[0])?.plural ?? top[0]

  return (
    <div className="section">
      <div className="section__head">
        <h3>More like your closet</h3>
        <span className="tiny">You stack {label.toLowerCase()} — ranked to your taste</span>
      </div>
      <div className="grid">
        {picks.map((p) => (
          <ProductCard key={p.id} product={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/** Brands you rock with — wordmark, piece count, straight link to their store. */
function SavedBrands() {
  const { profile, setProfile, toast } = useStore()
  const [q, setQ] = useState('')

  const saved = profile.brands ?? []
  const matches = q.trim()
    ? BRANDS.filter(
        (b) => b.toLowerCase().includes(q.trim().toLowerCase()) && !saved.includes(b),
      ).slice(0, 6)
    : []

  const brandUrl = (b: string) => CATALOG.find((p) => p.brand === b)?.url ?? ''

  return (
    <div className="section">
      <div className="section__head">
        <h3>Saved brands</h3>
        <span className="tiny">{saved.length} saved · boosts your ranking</span>
      </div>

      <div className="room__input" style={{ marginBottom: 14, maxWidth: 420 }}>
        <input
          className="text-input"
          placeholder="Save a brand — “Stüssy”, “Sp5der”…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {matches.length > 0 && (
        <div className="vaulthits" style={{ marginBottom: 14 }}>
          {matches.map((b) => (
            <button
              key={b}
              className="vaulthit"
              onClick={() => {
                setProfile({ brands: [...saved, b] })
                setQ('')
                toast(`Saved — ${b}`)
              }}
            >
              <span>
                <b>{b}</b> {CATALOG.filter((p) => p.brand === b).length} pieces
              </span>
              <i>+ save</i>
            </button>
          ))}
        </div>
      )}

      {saved.length === 0 ? (
        <p className="tiny">No brands saved yet — search one above.</p>
      ) : (
        <div className="brandgrid">
          {saved.map((b) => {
            const url = brandUrl(b)
            const n = CATALOG.filter((p) => p.brand === b).length
            return (
              <div className="brandcard" key={b}>
                <span className="brandcard__mark serif">{b}</span>
                <span className="tiny">{n} pieces in the vault</span>
                <div className="row" style={{ gap: 6, marginTop: 10 }}>
                  {url && (
                    <a
                      className="btn btn--ghost btn--sm"
                      href={buyUrl(url, 'saved_brand')}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Visit site
                    </a>
                  )}
                  <button
                    className="btn btn--quiet btn--sm"
                    onClick={() => setProfile({ brands: saved.filter((x) => x !== b) })}
                    aria-label={`Remove ${b}`}
                  >
                    <Trash size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Liked pieces live inside the wardrobe now. */
function SavedShelf({ onOpen }: { onOpen: (id: string) => void }) {
  const { saved } = useStore()
  const items = saved.map((id) => CATALOG.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => !!p,
  )
  if (items.length === 0) return null
  return (
    <div className="section">
      <div className="section__head">
        <h3>Saved · Liked</h3>
        <span className="tiny">{items.length} pieces you keep coming back to</span>
      </div>
      <div className="grid">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/** Resolve an outfit ref to something drawable. */
function refImage(ref: string, customs: CustomPiece[]): { img: string; label: string } | null {
  const custom = customs.find((c) => c.id === ref)
  if (custom) return { img: custom.photo, label: custom.name }
  const p: Product | undefined = CATALOG.find((x) => x.id === ref)
  return p ? { img: p.image, label: `${p.brand} ${p.name}` } : null
}

/** Named fits — the virtual dressing room, flat-lay style. */
function FitPlanner() {
  const store = useStore()
  const { wardrobe, customs, profile, outfits, feedback, createOutfit, deleteOutfit, toggleOutfitRef, pushFeedback, toast } =
    store
  const [seed, setSeed] = useState(0)
  const [naming, setNaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const pool = useMemo(() => hydrate(wardrobe, customs), [wardrobe, customs])
  const ctx = useMemo(
    () => ({
      profile,
      styleProfile: profileToStyle(profile),
      signals: (feedback ?? []).map((f) => ({
        kind: f.kind as never,
        itemIds: f.itemIds,
        at: f.at,
      })),
      occasion: 'casual' as const,
    }),
    [profile, feedback],
  )

  // Three ranked fits, anti-dominated so one hoodie can't headline all of them.
  const built: BuiltFit[] = useMemo(() => {
    if (pool.length < 2) return []
    const raw = [0, 1, 2, 3, 4].map((i) => complete(pool, { locked: {}, ctx, seed: seed + i }))
    const seen = new Set<string>()
    const uniq = raw.filter((f) => {
      const key = Object.values(f.slots).sort().join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return rankFits(uniq).slice(0, 3)
  }, [pool, ctx, seed])

  const saveFit = (f: BuiltFit, name: string) => {
    const id = createOutfit(name)
    f.items.forEach((i) => toggleOutfitRef(id, i.id))
    toast(`Saved — ${name}`)
  }

  return (
    <div className="section">
      <div className="section__head">
        <h3>Top Cosign your closet</h3>
        <div className="row" style={{ gap: 8 }}>
          <span className="tiny">Scored on proportion, colour, layering, occasion</span>
          <button className="btn btn--ghost btn--sm" onClick={() => setSeed((n) => n + 3)}>
            ↻ Rebuild
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setNaming((v) => !v)}>
            <Plus /> Blank fit
          </button>
        </div>
      </div>

      {naming && (
        <div className="room__input" style={{ marginBottom: 14, maxWidth: 420 }}>
          <input
            className="text-input"
            autoFocus
            placeholder="Name it — “date night”, “gameday”…"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameDraft.trim()) {
                createOutfit(nameDraft.trim())
                setNameDraft('')
                setNaming(false)
                toast('Fit created')
              }
            }}
          />
        </div>
      )}

      {pool.length < 2 ? (
        <p className="tiny">Add a couple more pieces and the engine can start building fits.</p>
      ) : (
        <div className="topfits">
          {built.map((f, i) => (
            <div className="topfit" key={i}>
              <div className="topfit__lay">
                {f.items.slice(0, 6).map((it) =>
                  it.image ? (
                    <img key={it.id} src={it.image} alt={it.name} loading="lazy" />
                  ) : (
                    <span className="topfit__blank" key={it.id}>
                      {it.name[0]?.toUpperCase()}
                    </span>
                  ),
                )}
              </div>
              <FitScore evaluation={f.evaluation} />
              {f.gaps.length > 0 && (
                <p className="tiny" style={{ marginTop: 8, color: 'var(--red)' }}>
                  Missing: {f.gaps.join(' · ')}
                </p>
              )}
              <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => saveFit(f, `Fit ${outfits.length + 1}`)}
                >
                  Save this fit
                </button>
                <button className="btn btn--quiet btn--sm" onClick={() => setSeed((n) => n + 1)}>
                  Swap it out
                </button>
              </div>

              <div className="chips" style={{ marginTop: 10 }}>
                {(
                  [
                    ['wear', 'Wore it'],
                    ['not-my-style', 'Not my style'],
                    ['too-loud', 'Too loud'],
                    ['too-basic', 'Too basic'],
                    ['wrong-silhouette', 'Wrong fit'],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    className="chip chip--sm"
                    onClick={() => {
                      pushFeedback(kind, f.items.map((i) => i.id))
                      setSeed((n) => n + 1)
                      toast('Noted — future fits adjust')
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {outfits.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Saved fits</p>
          <div className="fitplans">
            {outfits.map((o) => (
              <div className="plan" key={o.id}>
                <div className="plan__lay">
                  {o.refs.slice(0, 6).map((ref) => {
                    const r = refImage(ref, customs)
                    return r ? <img key={ref} src={r.img} alt={r.label} /> : null
                  })}
                  {o.refs.length === 0 && <span className="tiny">Empty</span>}
                </div>
                <div className="plan__meta">
                  <b>{o.name}</b>
                  <button className="iconbtn" aria-label={`Delete ${o.name}`} onClick={() => deleteOutfit(o.id)}>
                    <Trash size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Where you stand on the free tier. One row, plain words, a number and a
 * button — nothing overlapping anything else.
 */
function PlanStrip({ plan, onPro }: { plan: ReturnType<typeof planFor>; onPro: () => void }) {
  if (plan.pro) {
    return (
      <div className="plan plan--pro">
        <span className="plan__tag">PRO</span>
        <p className="plan__line">Unlimited closet, dressing room and planning tools.</p>
      </div>
    )
  }
  const done = plan.topsLeft === 0 && plan.bottomsLeft === 0
  return (
    <div className={`plan${done ? ' plan--full' : ''}`}>
      <span className="plan__tag">FREE</span>
      <p className="plan__line">
        {done ? (
          <>Your free closet is full.</>
        ) : (
          <>
            {plan.topsLeft} {plan.topsLeft === 1 ? 'top' : 'tops'} and {plan.bottomsLeft}{' '}
            {plan.bottomsLeft === 1 ? 'bottom' : 'bottoms'} left.
          </>
        )}
      </p>
      <span className="plan__count">
        {plan.tops}/{PRO.freeTops} · {plan.bottoms}/{PRO.freeBottoms}
      </span>
      <button className="btn btn--primary btn--sm plan__cta" onClick={onPro}>
        Go Pro — {PRO.label}
      </button>
    </div>
  )
}

/** The artists you saved, so the wardrobe knows whose taste it is working from. */
function Artists() {
  const { profile } = useStore()
  const picked = profile.tags.filter((t) => ARTIST_FACE[t])
  if (picked.length === 0) return null
  return (
    <div className="artists">
      <span className="eyebrow">Ranked to</span>
      <div className="artists__row">
        {picked.map((t) => (
          <span className="artist" key={t}>
            <img src={ARTIST_FACE[t]} alt="" loading="lazy" />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

const ARTIST_FACE: Record<string, string> = {
  'Pretty Flacko': '/fits/flacko-money.jpg',
  'Tyler, the Creator': '/fits/tyler-prep.jpg',
  Iceman: '/fits/drake-night.jpg',
  Bieber: '/fits/bieber-night.jpg',
  'V (BTS)': '/fits/v-airport.jpg',
  Ye: '/fits/ye-red.jpg',
  'Cole World': '/fits/jcole-dreamer.jpg',
  Carti: '/fits/carti-studio.jpg',
}

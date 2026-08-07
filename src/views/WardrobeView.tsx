import { useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, type Product } from '../data/catalog'
import { CATEGORIES, CORE_SLOTS, STYLES } from '../data/taxonomy'
import { useStore, type CustomPiece } from '../lib/store'
import { rank } from '../lib/match'
import { recommendSize } from '../lib/sizing'
import { fileToDataUrl } from '../lib/img'
import { ProductCard } from '../components/ProductCard'
import { Arrow, Plus, Trash, Upload, CheckInk } from '../components/Icons'
import { Type } from '../components/Type'

export function WardrobeView({
  onOpen,
  go,
}: {
  onOpen: (id: string) => void
  go: (v: View) => void
}) {
  const { wardrobe, profile } = useStore()

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

  const worstGap = [...gaps].sort((a, b) => a.pct - b.pct)[0]

  const suggestions = rank(
    CATALOG.filter(
      (p) =>
        p.category === worstGap?.category &&
        !wardrobe.some((w) => w.productId === p.id) &&
        p.price <= profile.budgetMax,
    ),
    profile,
  )
    .slice(0, 4)
    .map((r) => r.product)

  const totalSpent = items.reduce((n, i) => n + i.p.price, 0)

  if (items.length === 0) {
    return (
      <div className="wrap">
        <div className="pagehead">
          <span className="eyebrow"><Type text="THE CLOSET — CATALOGUED" speed={18} /></span>
          <h2>Everything you own, in one place.</h2>
          <p>Add what you have. Fits From fills the holes instead of the feed.</p>
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
          <FitPlanner />
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="pagehead">
        <span className="eyebrow"><Type text="THE CLOSET — CATALOGUED" speed={18} /></span>
        <h2>
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} · ${Math.round(totalSpent)}{' '}
          <span className="muted" style={{ fontSize: '0.55em', fontWeight: 400 }}>
            replacement value
          </span>
        </h2>
        <p>Fill the short bars before buying another of what you own.</p>
      </div>

      <div className="gaps">
        {gaps.map((g) => (
          <div className={`gap${g.pct >= 1 ? ' is-full' : ''}`} key={g.category}>
            <div className="eyebrow">{g.label}</div>
            <div className="gap__n">
              {g.have}
              <small> / {g.per}</small>
            </div>
            <div className="gap__bar">
              <i style={{ width: `${g.pct * 100}%` }} />
            </div>
            <div className="tiny">
              {g.pct >= 1 ? 'Covered' : `${g.per - g.have} short`}
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && worstGap && (
        <div className="section">
          <div className="section__head">
            <h3>
              Your biggest hole is {worstGap.label}
            </h3>
            <span className="tiny">Ranked against your taste and budget</span>
          </div>
          <div className="grid">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}

      <Closet onOpen={onOpen} />

      <OwnCloset />

      <MoreLikeYours onOpen={onOpen} />

      <FitPlanner />

      <OutfitBuilder onOpen={onOpen} />
    </div>
  )
}

/** The closet — every piece on its own shelf, shorts split from pants. */
function Closet({ onOpen }: { onOpen: (id: string) => void }) {
  const { wardrobe, customs, removeFromWardrobe, removeCustom, toast } = useStore()

  interface Hang {
    key: string
    img: string
    name: string
    size?: string
    productId?: string
    customId?: string
  }

  const shelves: { label: string; items: Hang[] }[] = [
    { label: 'Tops', items: [] },
    { label: 'Shirts', items: [] },
    { label: 'Knits', items: [] },
    { label: 'Outerwear', items: [] },
    { label: 'Pants', items: [] },
    { label: 'Shorts', items: [] },
    { label: 'Shoes', items: [] },
    { label: 'Accessories', items: [] },
  ]
  const shelfFor = (cat: string, sil?: string) => {
    if (cat === 'pants' && sil === 'short') return 'Shorts'
    return (
      { top: 'Tops', shirt: 'Shirts', knit: 'Knits', outer: 'Outerwear', pants: 'Pants', shoes: 'Shoes', accessory: 'Accessories' }[cat] ?? 'Tops'
    )
  }

  for (const w of wardrobe) {
    const p = CATALOG.find((x) => x.id === w.productId)
    if (!p) continue
    shelves
      .find((sh) => sh.label === shelfFor(p.category, p.silhouette))!
      .items.push({ key: p.id, img: p.image, name: p.name, size: w.size, productId: p.id })
  }
  for (const c of customs) {
    shelves
      .find((sh) => sh.label === shelfFor(c.category))!
      .items.push({ key: c.id, img: c.photo, name: c.name, customId: c.id })
  }

  const filled = shelves.filter((sh) => sh.items.length > 0)
  if (filled.length === 0) return null

  return (
    <div className="section">
      <div className="section__head">
        <h3>The closet</h3>
        <span className="tiny">
          {filled.reduce((n, sh) => n + sh.items.length, 0)} pieces · every shelf its own section
        </span>
      </div>
      {filled.map((sh) => (
        <div className="shelf" key={sh.label}>
          <div className="shelf__head">
            <span>{sh.label}</span>
            <b>{sh.items.length}</b>
          </div>
          <div className="shelf__row">
            {sh.items.map((it) => (
              <div className="ctile" key={it.key}>
                <button
                  className="ctile__img"
                  onClick={() => it.productId && onOpen(it.productId)}
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
      ))}
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

/** Add to closet: search the vault, type it, or snap it — no popups. */
function OwnCloset() {
  const { addCustom, addToWardrobe, profile, toast } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [quick, setQuick] = useState('')
  const [vaultQ, setVaultQ] = useState('')
  const [pending, setPending] = useState<{ photo: string; name: string; category: string } | null>(null)

  const vaultHits = vaultQ.trim()
    ? CATALOG.filter((p) =>
        `${p.brand} ${p.name}`.toLowerCase().includes(vaultQ.trim().toLowerCase()),
      ).slice(0, 4)
    : []

  const quickAdd = () => {
    const q = quick.trim()
    if (!q) return
    const { name, category, size } = parseQuickAdd(q)
    addCustom({ id: `c${Date.now().toString(36)}`, name: size ? `${name} · ${size}` : name, category, photo: '' })
    setQuick('')
    toast(`Catalogued — ${name}`)
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
        <span className="tiny">Search it · type it · snap it — stays on this device</span>
      </div>

      <div className="room__input" style={{ marginBottom: 10 }}>
        <input
          className="text-input"
          placeholder="Search the vault to add — “stussy tee”, “3sixteen”…"
          value={vaultQ}
          onChange={(e) => setVaultQ(e.target.value)}
        />
        <button className="btn btn--ghost" onClick={() => input.current?.click()} aria-label="Snap a photo">
          <Upload size={16} />
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void accept(e.target.files?.[0])} />
      </div>

      {vaultHits.length > 0 && (
        <div className="vaulthits">
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

      <div className="room__input">
        <input
          className="text-input"
          placeholder="Or type what you own — “carhartt jeans, 32”"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
        />
        <button className="btn btn--primary" onClick={quickAdd} aria-label="Add">
          <Plus />
        </button>
      </div>
      {busy && <p className="tiny" style={{ marginTop: 8 }}>Reading photo…</p>}

      {pending && (
        <div className="snapform">
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
  )
}

/** "More like what you own" — same category as your deepest stack, ranked to taste. */
function MoreLikeYours({ onOpen }: { onOpen: (id: string) => void }) {
  const { wardrobe, customs, profile } = useStore()
  const counts: Record<string, number> = {}
  for (const w of wardrobe) {
    const p = CATALOG.find((x) => x.id === w.productId)
    if (p) counts[p.category] = (counts[p.category] ?? 0) + 1
  }
  for (const c of customs) counts[c.category] = (counts[c.category] ?? 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!top || top[1] < 2) return null

  const picks = rank(
    CATALOG.filter(
      (p) => p.category === top[0] && !wardrobe.some((w) => w.productId === p.id),
    ),
    profile,
  )
    .slice(0, 4)
    .map((r) => r.product)
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


/** Resolve an outfit ref to something drawable. */
function refImage(ref: string, customs: CustomPiece[]): { img: string; label: string } | null {
  const custom = customs.find((c) => c.id === ref)
  if (custom) return { img: custom.photo, label: custom.name }
  const p: Product | undefined = CATALOG.find((x) => x.id === ref)
  return p ? { img: p.image, label: `${p.brand} ${p.name}` } : null
}

/** Named fits — the virtual dressing room, flat-lay style. */
function FitPlanner() {
  const { wardrobe, customs, outfits, profile, createOutfit, deleteOutfit, toggleOutfitRef, toast } =
    useStore()
  const [editing, setEditing] = useState<string | null>(null)

  // Whering-style: unlock what you already own — auto-assemble one piece per slot.
  const autoMatch = () => {
    const owned = wardrobe
      .map((w) => CATALOG.find((x) => x.id === w.productId))
      .filter((x): x is (typeof CATALOG)[number] => !!x)
    const slots = ['top', 'shirt', 'knit', 'outer', 'pants', 'shoes']
    const refs: string[] = []
    for (const slot of slots) {
      const pool = owned.filter((p) => p.category === slot)
      const pick = pool.length ? rank(pool, profile)[0]?.product : undefined
      if (pick) refs.push(pick.id)
      else {
        const custom = customs.find((c) => c.category === slot && !refs.includes(c.id))
        if (custom) refs.push(custom.id)
      }
    }
    if (refs.length < 2) {
      toast('Add a few more pieces first')
      return
    }
    const id = createOutfit(`Matched fit ${outfits.length + 1}`)
    refs.forEach((r) => toggleOutfitRef(id, r))
    toast('Matched from your closet')
  }

  const pool: { ref: string; img: string; label: string }[] = [
    ...wardrobe
      .map((w) => {
        const p = CATALOG.find((x) => x.id === w.productId)
        return p ? { ref: p.id, img: p.image, label: p.name } : null
      })
      .filter((x): x is { ref: string; img: string; label: string } => x !== null),
    ...customs.map((c) => ({ ref: c.id, img: c.photo, label: c.name })),
  ]

  const active = outfits.find((o) => o.id === editing)

  return (
    <div className="section">
      <div className="section__head">
        <h3>Planned fits</h3>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--primary btn--sm" onClick={autoMatch}>
            Match one for me
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              const name = prompt('Name this fit (e.g. “date night”, “gameday”)')?.trim()
              if (!name) return
              setEditing(createOutfit(name))
              toast('Tap pieces below to add them')
            }}
          >
            <Plus /> New fit
          </button>
        </div>
      </div>

      {outfits.length === 0 && (
        <p className="tiny" style={{ marginBottom: 12 }}>
          Build “date night” or “gameday” from anything you own — like laying it on the bed, minus
          the bed.
        </p>
      )}

      <div className="fitplans">
        {outfits.map((o) => (
          <div className={`plan${editing === o.id ? ' is-editing' : ''}`} key={o.id}>
            <div className="plan__lay">
              {o.refs.slice(0, 6).map((ref) => {
                const r = refImage(ref, customs)
                return r ? <img key={ref} src={r.img} alt={r.label} /> : null
              })}
              {o.refs.length === 0 && <span className="tiny">Empty — tap pieces to add</span>}
            </div>
            <div className="plan__meta">
              <b>{o.name}</b>
              <div className="row" style={{ gap: 4 }}>
                <button
                  className="btn btn--quiet btn--sm"
                  onClick={() => setEditing(editing === o.id ? null : o.id)}
                >
                  {editing === o.id ? 'Done' : 'Edit'}
                </button>
                <button
                  className="iconbtn"
                  aria-label={`Delete ${o.name}`}
                  onClick={() => deleteOutfit(o.id)}
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <>
          <p className="eyebrow" style={{ margin: '18px 0 10px' }}>
            Tap to add to “{active.name}”
          </p>
          <div className="pickrow">
            {pool.length === 0 && (
              <p className="tiny">Nothing in your wardrobe yet — add pieces first.</p>
            )}
            {pool.map(({ ref, img, label }) => (
              <button
                key={ref}
                className="pick"
                aria-pressed={active.refs.includes(ref)}
                onClick={() => toggleOutfitRef(active.id, ref)}
                title={label}
              >
                <img src={img} alt={label} />
                {active.refs.includes(ref) && (
                  <span className="pick__tick">
                    <CheckInk size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Pulls one piece per slot out of the wardrobe to show a workable head-to-toe fit. */
function OutfitBuilder({ onOpen }: { onOpen: (id: string) => void }) {
  const { wardrobe, profile } = useStore()
  const owned = wardrobe.map((w) => CATALOG.find((c) => c.id === w.productId)!).filter(Boolean)

  const pick = (cat: string) => {
    const pool = owned.filter((p) => p.category === cat)
    if (pool.length === 0) return null
    // Prefer the piece closest to the styles the user actually picked.
    return rank(pool, profile)[0]?.product ?? pool[0]
  }

  const slots = ['top', 'shirt', 'pants', 'shoes', 'outer'].map((c) => ({ c, p: pick(c) }))
  const filled = slots.filter((s) => s.p)

  if (filled.length < 2) return null

  const styleNames = Array.from(new Set(filled.flatMap((s) => s.p!.styles)))
    .map((s) => STYLES.find((x) => x.id === s)?.label)
    .filter(Boolean)
    .slice(0, 2)
    .join(' × ')

  return (
    <div className="section">
      <div className="section__head">
        <h3>A fit you can wear tomorrow</h3>
        <span className="tiny">{styleNames}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${filled.length}, minmax(0,1fr))`,
          gap: 1,
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}
      >
        {filled.map(({ c, p }) => (
          <button
            key={c}
            onClick={() => onOpen(p!.id)}
            style={{
              background: 'var(--paper)',
              padding: '20px 16px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ height: 110, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 8 }}>
              <img src={p!.image} alt="" style={{ height: '100%', width: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
            <div className="card__brand" style={{ marginTop: 10 }}>
              {p!.brand}
            </div>
            <div className="tiny" style={{ marginTop: 3 }}>
              {p!.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

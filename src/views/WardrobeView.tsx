import { useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, type Product } from '../data/catalog'
import { CATEGORIES, CORE_SLOTS } from '../data/taxonomy'
import { useStore, type CustomPiece } from '../lib/store'
import { rank } from '../lib/match'
import { recommendSize } from '../lib/sizing'
import { fileToDataUrl } from '../lib/img'
import { ProductCard } from '../components/ProductCard'
import { Arrow, Plus, Trash, Upload, CheckInk } from '../components/Icons'
import { Room } from '../components/Room'

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

  // Essentials first: you can't wear a fit without pants, then shoes.
  const ESSENTIAL: Record<string, number> = {
    pants: 3,
    shoes: 2.6,
    top: 2,
    outer: 1.6,
    knit: 1.2,
    shirt: 1,
  }
  const worstGap = [...gaps]
    .filter((g) => g.pct < 1)
    .sort(
      (a, b) =>
        (1 - b.pct) * (ESSENTIAL[b.category] ?? 1) - (1 - a.pct) * (ESSENTIAL[a.category] ?? 1),
    )[0]

  // Diverse picks: never two from the same brand, never near-identical names.
  const suggestions: typeof CATALOG = []
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
    if (suggestions.some((x) => x.brand === pr.brand)) continue
    if (suggestions.some((x) => x.name.slice(0, 18) === pr.name.slice(0, 18))) continue
    suggestions.push(pr)
    if (suggestions.length === 4) break
  }

  const totalRetail = items.reduce((n, i) => n + i.p.price, 0)
  const totalValue = items.reduce((n, i) => n + itemValue(i.p.price, i.w.condition, i.w.years), 0)

  if (items.length === 0) {
    return (
      <div className="wrap">
        <div className="pagehead">
          <span className="eyebrow">THE CLOSET — CATALOGUED</span>
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
        <span className="eyebrow">THE CLOSET — CATALOGUED</span>
        <h2>
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} · ${Math.round(totalValue)}{' '}
          <span className="muted" style={{ fontSize: '0.55em', fontWeight: 400 }}>
            est. value · ${Math.round(totalRetail)} retail
          </span>
        </h2>
        <p>Fill the short bars before buying another of what you own.</p>
      </div>

      <Room />

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

      <SavedShelf onOpen={onOpen} />

    </div>
  )
}

/** The closet — every piece on its own shelf, shorts split from pants. */
function Closet({ onOpen }: { onOpen: (id: string) => void }) {
  const { wardrobe, customs, removeFromWardrobe, removeCustom, updateWardrobe, toast } = useStore()

  interface Hang {
    key: string
    img: string
    name: string
    size?: string
    productId?: string
    customId?: string
    condition?: string
    years?: number
    price?: number
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
      .items.push({
        key: p.id,
        img: p.image,
        name: p.name,
        size: w.size,
        productId: p.id,
        condition: w.condition,
        years: w.years,
        price: p.price,
      })
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
        <div className="shelf" key={sh.label} id={`shelf-${sh.label}`}>
          <div className="shelf__head">
            <span>{sh.label}</span>
            <b>{sh.items.length}</b>
          </div>
          <div className="shelf__row">
            {sh.items.map((it) => (
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
    CATALOG.filter((p) => p.category === top[0] && !wardrobe.some((w) => w.productId === p.id)),
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
  const { wardrobe, customs, outfits, profile, createOutfit, deleteOutfit, toggleOutfitRef, toast } =
    useStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [naming, setNaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const createNamed = () => {
    const name = nameDraft.trim()
    if (!name) return
    setEditing(createOutfit(name))
    setNaming(false)
    setNameDraft('')
    toast('Tap pieces below to add them')
  }

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
          <button className="btn btn--ghost btn--sm" onClick={() => setNaming((v) => !v)}>
            <Plus /> New fit
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
            onKeyDown={(e) => e.key === 'Enter' && createNamed()}
          />
          <button className="btn btn--primary" onClick={createNamed}>
            Create
          </button>
        </div>
      )}

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


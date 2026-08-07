import { useRef, useState } from 'react'
import type { View } from '../App'
import { CATALOG, type Product } from '../data/catalog'
import { CATEGORIES, CORE_SLOTS, STYLES } from '../data/taxonomy'
import { useStore, type CustomPiece } from '../lib/store'
import { rank } from '../lib/match'
import { fileToDataUrl } from '../lib/img'
import { ProductCard } from '../components/ProductCard'
import { Arrow, Plus, Trash, Upload, CheckInk } from '../components/Icons'

export function WardrobeView({
  onOpen,
  go,
}: {
  onOpen: (id: string) => void
  go: (v: View) => void
}) {
  const { wardrobe, profile, removeFromWardrobe, toast } = useStore()

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
          <span className="eyebrow">Wardrobe</span>
          <h2>Everything you own, in one place.</h2>
          <p>Add what you have. Lapel fills the holes instead of the feed.</p>
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
        <span className="eyebrow">Wardrobe</span>
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

      {CATEGORIES.map((cat) => {
        const inCat = items.filter((i) => i.p.category === cat.id)
        if (inCat.length === 0) return null
        return (
          <div className="section" key={cat.id}>
            <div className="section__head">
              <h3>{cat.plural}</h3>
              <span className="tiny">{inCat.length}</span>
            </div>
            <div className="grid">
              {inCat.map(({ w, p }) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpen={onOpen}
                  footer={
                    <div
                      className="row"
                      style={{ padding: '10px 3px 0', justifyContent: 'space-between' }}
                    >
                      <span className="tiny">Size {w.size}</span>
                      <button
                        className="btn btn--quiet btn--sm"
                        onClick={() => {
                          removeFromWardrobe(p.id)
                          toast('Removed from wardrobe')
                        }}
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash />
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )
      })}

      <OwnCloset />

      <FitPlanner />

      <OutfitBuilder onOpen={onOpen} />
    </div>
  )
}

/** Alta-style closet snap: photograph your own piece, it lives on this device. */
function OwnCloset() {
  const { customs, addCustom, removeCustom, toast } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const accept = async (file: File | undefined) => {
    if (!file?.type.startsWith('image/')) return
    setBusy(true)
    try {
      const photo = await fileToDataUrl(file, 700)
      const name = prompt('What is it? (e.g. “thrifted Carhartt hoodie”)')?.trim() || 'My piece'
      const category =
        prompt('Category — top / shirt / knit / outer / pants / shoes / accessory')
          ?.trim()
          .toLowerCase() || 'top'
      addCustom({ id: `c${Date.now().toString(36)}`, name, category, photo })
      toast('Added to your closet')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section">
      <div className="section__head">
        <h3>Your own pieces</h3>
        <span className="tiny">Snapped by you · stays on this device</span>
      </div>
      <div className="grid">
        <button className="own own--add" onClick={() => input.current?.click()}>
          <Upload />
          <span>{busy ? 'Reading…' : 'Snap a piece you own'}</span>
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => void accept(e.target.files?.[0])}
          />
        </button>
        {customs.map((c) => (
          <div className="own" key={c.id}>
            <img src={c.photo} alt={c.name} />
            <div className="own__meta">
              <span>{c.name}</span>
              <button
                className="iconbtn"
                aria-label={`Remove ${c.name}`}
                onClick={() => removeCustom(c.id)}
              >
                <Trash size={13} />
              </button>
            </div>
          </div>
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
  const { wardrobe, customs, outfits, createOutfit, deleteOutfit, toggleOutfitRef, toast } =
    useStore()
  const [editing, setEditing] = useState<string | null>(null)

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

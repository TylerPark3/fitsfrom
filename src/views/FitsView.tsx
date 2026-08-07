import { useEffect, useRef, useState } from 'react'
import type { View } from '../App'
import { FITS, type Fit } from '../data/fits'
import { resolve } from '../lib/fitmatch'
import { useStore } from '../lib/store'
import { recommendSize } from '../lib/sizing'
import { buyUrl } from '../lib/affiliate'
import { Arrow, Bookmark, Close, External } from '../components/Icons'

const REACTIONS = ['🔥', '💯', '🥶', '👀'] as const

interface ChatMsg {
  who: string
  text: string
  ts: number
  preview?: boolean
}

/** Seeded example takes, clearly flagged as previews — not real users. */
const SEED_TAKES: Record<string, ChatMsg[]> = Object.fromEntries(
  FITS.map((f) => [
    f.id,
    [
      { who: 'Preview', text: `The ${f.pieces[0].slot.toLowerCase()} makes this one.`, ts: 0, preview: true },
      { who: 'Preview', text: 'Need the full breakdown asap 🔥', ts: 1, preview: true },
    ],
  ]),
)

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* full storage is survivable */
  }
}

/** Types itself out when scrolled into view — mission-console style. */
function Type({ text, className, speed = 26 }: { text: string; className?: string; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [go, setGo] = useState(false)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setGo(true), {
      threshold: 0.3,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!go || n >= text.length) return
    const t = window.setTimeout(() => setN((x) => x + 1), speed)
    return () => window.clearTimeout(t)
  }, [go, n, text, speed])

  return (
    <span ref={ref} className={className}>
      {text.slice(0, n)}
      {n < text.length && <i className="type__caret" />}
    </span>
  )
}

export function FitsView({ go }: { go: (v: View) => void }) {
  const [open, setOpen] = useState<Fit | null>(null)

  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="pagehead">
        <span className="eyebrow">
          <Type text="TRANSMISSION 001 — THE CULTURE FILE" />
        </span>
        <h2 className="fitcheck">
          <Type text="FIT CHECK" speed={70} />
        </h2>
        <p className="mono-line">
          <Type text="EVERY PIECE IDENTIFIED. EVERY LINK LIVE. YOUR SIZE COMPUTED." speed={14} />
        </p>
      </div>

      <div className="fitgrid">
        {FITS.filter((f) => !f.hidden).map((f) => (
          <button key={f.id} className="fitcard" onClick={() => setOpen(f)}>
            <div className="fitcard__frame">
              <div className="fitcard__type" aria-hidden="true">
                <span className="serif">{f.who}</span>
                <i>{f.vibe}</i>
              </div>
              <img
                className="fitcard__photo"
                src={`/fits/${f.id}.jpg`}
                alt=""
                loading="lazy"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <span className="fitcard__who serif">{f.who}</span>
            </div>
            <div className="fitcard__meta">
              <div className="card__brand">{f.where} · {f.when}</div>
              <div className="card__name">{f.vibe}</div>
              <div className="tiny" style={{ marginTop: 6 }}>
                {f.pieces.length} pieces →
              </div>
            </div>
          </button>
        ))}
      </div>

      {open && <FitDrawer fit={open} onClose={() => setOpen(null)} go={go} />}
    </div>
  )
}

function FitDrawer({ fit, onClose, go }: { fit: Fit; onClose: () => void; go: (v: View) => void }) {
  const store = useStore()
  const { profile, saved, signedIn, account } = store
  const resolved = fit.pieces.map((piece) => ({ piece, p: resolve(piece) }))
  const total = resolved.reduce((n, r) => n + (r.p?.price ?? 0), 0)

  // 3 free breakdowns with an account, +1 every day after.
  const [unlocks, setUnlocks] = useState<string[]>(() => loadJson('lapel.unlocks', []))
  const quota = account ? 3 + Math.floor((Date.now() - account.createdAt) / 86_400_000) : 0
  const unlocked = unlocks.includes(fit.id)
  const remaining = Math.max(0, quota - unlocks.length)
  const canView = !!signedIn && (unlocked || remaining > 0)

  useEffect(() => {
    if (signedIn && !unlocked && remaining > 0) {
      const next = [...unlocks, fit.id]
      setUnlocks(next)
      saveJson('lapel.unlocks', next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit.id])

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
          <p className="tiny" style={{ marginTop: 18 }}>{fit.when}</p>
          <p className="muted" style={{ margin: '8px 0 4px', fontSize: 14.5, lineHeight: 1.55 }}>
            {fit.context}
          </p>
          <p className="eyebrow" style={{ margin: '18px 0 4px' }}>
            <Type text="TOP TO BOTTOM — PIECE BY PIECE" speed={16} />
          </p>

          {(canView ? resolved : resolved.slice(0, 2)).map(({ piece, p }) =>
            p ? (
              <div className={`bagline${canView ? '' : ' lockrow'}`} key={piece.slot}>
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
                    href={buyUrl(p.url)}
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

          {canView ? (
            <div className="total">
              <span>The whole look</span>
              <b>${total.toFixed(0)}</b>
            </div>
          ) : (
            <div className="lockcta">
              <p>
                {signedIn
                  ? '0 unlocks left — one more tomorrow'
                  : 'Classified — 3 free breakdowns with an account'}
              </p>
              {!signedIn && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    onClose()
                    go('auth')
                  }}
                >
                  Create account <Arrow />
                </button>
              )}
            </div>
          )}

          {canView && (
            <p className="tiny" style={{ marginTop: 8 }}>
              {remaining} unlock{remaining === 1 ? '' : 's'} left · +1 tomorrow
            </p>
          )}

          <FitRoom fitId={fit.id} />
        </div>
      </aside>
    </>
  )
}

/** Reactions + takes for one fit. On-device today; swaps to a realtime backend later. */
function FitRoom({ fitId }: { fitId: string }) {
  const { profile, account } = useStore()
  const [reacts, setReacts] = useState<Record<string, { n: number; mine: boolean }>>(() =>
    loadJson(`lapel.react.${fitId}`, Object.fromEntries(REACTIONS.map((r) => [r, { n: 0, mine: false }]))),
  )
  const [msgs, setMsgs] = useState<ChatMsg[]>(() =>
    loadJson(`lapel.chat.${fitId}`, SEED_TAKES[fitId] ?? []),
  )
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => saveJson(`lapel.react.${fitId}`, reacts), [reacts, fitId])
  useEffect(() => saveJson(`lapel.chat.${fitId}`, msgs), [msgs, fitId])

  const toggle = (r: string) =>
    setReacts((prev) => ({
      ...prev,
      [r]: { n: Math.max(0, prev[r].n + (prev[r].mine ? -1 : 1)), mine: !prev[r].mine },
    }))

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const who = account?.firstName || profile.name.split(' ')[0] || 'You'
    setMsgs((m) => [...m, { who, text, ts: Date.now() }])
    setDraft('')
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  return (
    <div className="room">
      <div className="spread" style={{ marginBottom: 10 }}>
        <span className="eyebrow">The room</span>
        <span className="tiny">on this device — live rooms launch with accounts</span>
      </div>

      <div className="room__reacts">
        {REACTIONS.map((r) => (
          <button key={r} className="react" aria-pressed={reacts[r]?.mine} onClick={() => toggle(r)}>
            {r} {reacts[r]?.n > 0 && <b>{reacts[r].n}</b>}
          </button>
        ))}
      </div>

      <div className="room__feed">
        {msgs.map((m, i) => (
          <div className="msg" key={i}>
            <span className="msg__avatar">{m.who[0]?.toUpperCase()}</span>
            <div>
              <div className="msg__who">
                {m.who}
                {m.preview && <i className="msg__demo">preview</i>}
              </div>
              <div className="msg__text">{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="room__input">
        <input
          className="text-input"
          placeholder="Drop a take…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn btn--primary" onClick={send} aria-label="Send">
          <Arrow />
        </button>
      </div>
    </div>
  )
}

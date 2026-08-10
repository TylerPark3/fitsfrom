import { useEffect, useMemo, useRef, useState } from 'react'
import {
  socialRepository,
  VERDICTS,
  type CommunityId,
  type Take,
  type Verdict,
} from '../../lib/socialRepository'
import { Close } from '../Icons'

/**
 * Writing a paragraph about someone's trousers is a lot to ask cold. So the
 * cheapest possible contribution is one tap — a verdict — and the text box is
 * never a blank page: it asks you something different every time you open it.
 */
const PROMPTS = [
  'What’s carrying this fit?',
  'One thing you’d swap?',
  'Cook or nah?',
  'What would ruin this?',
  'Who wears this better?',
  'Would you wear it out?',
]

const QUICK = [
  'the shoes carry it',
  'proportions are off',
  'ID on the jacket?',
  'wouldn’t work on me',
  'stealing this',
]

const ago = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/**
 * Takes and community IDs. Bottom sheet on mobile, side drawer on desktop —
 * one component, the difference is CSS.
 */
export function FitTakesDrawer({
  postId,
  slots,
  onClose,
  onCount,
}: {
  postId: string
  slots: string[]
  onClose: () => void
  onCount: (n: number) => void
}) {
  const [takes, setTakes] = useState<Take[]>([])
  const [ids, setIds] = useState<CommunityId[]>([])
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [body, setBody] = useState('')
  const [tab, setTab] = useState<'takes' | 'id'>('takes')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  // one prompt per opening, so it feels like a question rather than a form
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  const panel = useRef<HTMLDivElement>(null)
  const firstField = useRef<HTMLTextAreaElement>(null)

  const [form, setForm] = useState({ slot: slots[0] ?? '', brand: '', piece: '', link: '', evidence: '' })

  const refresh = () => {
    const t = socialRepository.getTakes(postId)
    setTakes(t)
    setIds(socialRepository.getIds(postId))
    onCount(t.length)
  }

  useEffect(refresh, [postId])

  // Escape closes; focus starts inside the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    firstField.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sorted = useMemo(
    () => (sort === 'new' ? [...takes].sort((a, b) => b.at - a.at) : [...takes].sort((a, b) => b.likes - a.likes)),
    [takes, sort],
  )

  return (
    <div className="takes" role="dialog" aria-modal="true" aria-label="Takes on this fit">
      <button className="takes__scrim" aria-label="Close" onClick={onClose} />
      <div className="takes__panel" ref={panel}>
        <div className="takes__head">
          <div className="takes__tabs">
            <button className={tab === 'takes' ? 'is-on' : ''} onClick={() => setTab('takes')}>
              {takes.length} takes
            </button>
            <button className={tab === 'id' ? 'is-on' : ''} onClick={() => setTab('id')}>
              Suggest an ID
            </button>
          </div>
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        </div>

        {tab === 'takes' ? (
          <>
            <Tally postId={postId} />

            <div className="takes__sort">
              <button className={sort === 'top' ? 'is-on' : ''} onClick={() => setSort('top')}>
                Top
              </button>
              <button className={sort === 'new' ? 'is-on' : ''} onClick={() => setSort('new')}>
                New
              </button>
            </div>

            <div className="takes__list">
              {sorted.length === 0 && <p className="tiny">Start the conversation.</p>}
              {sorted.map((t) => (
                <article className="take" key={t.id}>
                  <div className="take__top">
                    <b>@{t.author}</b>
                    <span className="tiny">{ago(t.at)}</span>
                    {t.seeded && <span className="take__demo">demo</span>}
                  </div>
                  {t.verdict && (
                    <span className={`vtag vtag--${t.verdict}`}>
                      {VERDICTS.find((v) => v.id === t.verdict)?.emoji}{' '}
                      {VERDICTS.find((v) => v.id === t.verdict)?.label}
                    </span>
                  )}
                  {t.body && <p>{t.body}</p>}
                  <button
                    className="take__like"
                    onClick={() => {
                      socialRepository.likeTake(t.id)
                      refresh()
                    }}
                    aria-pressed={socialRepository.isTakeLiked(t.id)}
                  >
                    ♡ {t.likes + (socialRepository.isTakeLiked(t.id) ? 1 : 0)}
                  </button>
                </article>
              ))}
            </div>

            <div className="composer">
              {/* one tap is a whole contribution — no typing required */}
              <div className="verdicts">
                {VERDICTS.map((v) => (
                  <button
                    key={v.id}
                    className={`verdict${verdict === v.id ? ' is-on' : ''}`}
                    aria-pressed={verdict === v.id}
                    onClick={() => {
                      if (body.trim()) {
                        setVerdict(verdict === v.id ? null : v.id)
                        return
                      }
                      socialRepository.addTake(postId, 'you', '', v.id)
                      refresh()
                    }}
                  >
                    <span aria-hidden="true">{v.emoji}</span>
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="quick">
                {QUICK.map((q) => (
                  <button key={q} className="quick__chip" onClick={() => setBody(q)}>
                    {q}
                  </button>
                ))}
              </div>

              <form
                className="takes__compose"
                onSubmit={(e) => {
                  e.preventDefault()
                  const text = body.trim()
                  if (!text && !verdict) return
                  socialRepository.addTake(postId, 'you', text, verdict ?? undefined)
                  setBody('')
                  setVerdict(null)
                  refresh()
                }}
              >
                <textarea
                  ref={firstField}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={prompt}
                  rows={2}
                  aria-label="Add a take"
                />
                <button
                  className="btn btn--primary btn--sm"
                  type="submit"
                  disabled={!body.trim() && !verdict}
                >
                  Post
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="takes__blurb">
              Think you know the piece? Suggestions are labelled as community IDs and stay unverified
              until we can confirm them.
            </p>

            <form
              className="idform"
              onSubmit={(e) => {
                e.preventDefault()
                if (!form.brand.trim() || !form.piece.trim()) return
                socialRepository.addId(postId, {
                  slot: form.slot,
                  brand: form.brand.trim(),
                  piece: form.piece.trim(),
                  link: form.link.trim() || undefined,
                  evidence: form.evidence.trim() || undefined,
                })
                setForm({ slot: slots[0] ?? '', brand: '', piece: '', link: '', evidence: '' })
                refresh()
              }}
            >
              <label className="field">
                <span className="tiny">Which piece</span>
                <select value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}>
                  {slots.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="tiny">Brand</span>
                <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
              </label>
              <label className="field">
                <span className="tiny">Piece</span>
                <input value={form.piece} onChange={(e) => setForm((f) => ({ ...f, piece: e.target.value }))} />
              </label>
              <label className="field">
                <span className="tiny">Link (optional)</span>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                />
              </label>
              <label className="field">
                <span className="tiny">Why you think it’s this</span>
                <textarea
                  rows={2}
                  value={form.evidence}
                  onChange={(e) => setForm((f) => ({ ...f, evidence: e.target.value }))}
                />
              </label>
              <button className="btn btn--primary btn--sm" type="submit">
                Submit ID
              </button>
            </form>

            {ids.length > 0 && (
              <div className="takes__list">
                {ids.map((i) => (
                  <article className="take" key={i.id}>
                    <div className="take__top">
                      <b>{i.slot}</b>
                      <span className="cid">Community ID · unverified</span>
                    </div>
                    <p>
                      {i.brand} — {i.piece}
                    </p>
                    {i.evidence && <p className="tiny">{i.evidence}</p>}
                    <button
                      className="take__like"
                      onClick={() => {
                        socialRepository.voteId(i.id)
                        refresh()
                      }}
                    >
                      ▲ {i.votes}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


/** What the room thinks, as a single bar. */
function Tally({ postId }: { postId: string }) {
  const counts = socialRepository.verdicts(postId)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  return (
    <div className="tally">
      <div className="tally__bar">
        {VERDICTS.map((v) =>
          counts[v.id] ? (
            <span
              key={v.id}
              className={`tally__seg tally__seg--${v.id}`}
              style={{ width: `${(counts[v.id] / total) * 100}%` }}
              title={`${v.label} ${counts[v.id]}`}
            />
          ) : null,
        )}
      </div>
      <div className="tally__key">
        {VERDICTS.filter((v) => counts[v.id]).map((v) => (
          <span key={v.id}>
            {v.emoji} {Math.round((counts[v.id] / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}

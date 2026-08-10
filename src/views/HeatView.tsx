import { useMemo } from 'react'
import { fitOfTheWeek, hotBrands, mostIdentified, rankedFits, searchLog } from '../lib/heat'
import { timeAgo } from '../data/socialFits'
import { useStore } from '../lib/store'
import { ProductCard } from '../components/ProductCard'
import { InstagramFitEmbed } from '../components/InstagramFitEmbed'
import { Arrow } from '../components/Icons'

/**
 * The Heat — what people are actually reacting to.
 *
 * Every number on this page is computed from a real signal: engagement decayed
 * over time, how many documented fits a piece turns up in, how many different
 * people wear a brand, what gets typed into search. Nothing is invented, and
 * where a signal is thin the page says so rather than padding it out.
 */
export function HeatView({ onOpen, onTunnel }: { onOpen: (id: string) => void; onTunnel: (slug: string | null) => void }) {
  const { saved } = useStore()

  const week = useMemo(() => fitOfTheWeek(), [])
  const ranked = useMemo(() => rankedFits(), [])
  const pieces = useMemo(() => mostIdentified(saved, 8), [saved])
  const brands = useMemo(() => hotBrands(6), [])
  const searches = useMemo(() => searchLog.top(8), [])

  return (
    <div className="wrap heat">
      <div className="pagehead">
        <span className="eyebrow">The heat</span>
        <h2>What people are actually on.</h2>
        <p>
          Ranked by reactions, decayed over time — so today’s fit has to earn its place against
          last week’s, not just outlive it.
        </p>
      </div>

      {/* ── fit of the week ─────────────────────────────────────────────── */}
      {week && (
        <section className="fotw">
          <div className="fotw__rule" />
          <span className="eyebrow" style={{ color: 'var(--red)' }}>
            Fit of the week
          </span>
          <div className="fotw__grid">
            <div className="fotw__media">
              <InstagramFitEmbed
                url={week.post.source.url}
                accountName={week.post.source.account}
                sourceLabel={week.post.source.account}
              />
            </div>
            <div className="fotw__body">
              <h3 className="fotw__who">{week.post.person.name}</h3>
              <p className="mono-line">
                {week.post.person.league} · {timeAgo(week.post.publishedAt)}
              </p>
              <h4 className="serif fotw__headline">{week.post.editorial.headline}</h4>
              <p className="fotw__take">{week.post.editorial.quickTake}</p>
              <div className="heatbar">
                <Stat n={week.post.engagement.likes + (week.yours.liked ? 1 : 0)} label="likes" />
                <Stat n={week.post.engagement.comments + week.yours.takes} label="takes" />
                <Stat n={week.post.engagement.saves + (week.yours.saved ? 1 : 0)} label="saves" />
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => onTunnel(week.post.slug)}>
                Full breakdown <Arrow />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── the board ───────────────────────────────────────────────────── */}
      {ranked.length > 1 && (
        <section className="section">
          <div className="section__head">
            <h3>Heat index</h3>
            <span className="tiny">Reactions ÷ age — the standard decay, so nothing coasts</span>
          </div>
          <ol className="board">
            {ranked.map((f, i) => (
              <li key={f.post.id}>
                <button className="board__row" onClick={() => onTunnel(f.post.slug)}>
                  <span className="board__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="board__who">
                    <b>{f.post.person.name}</b>
                    <em>{f.post.editorial.headline}</em>
                  </span>
                  <span className="board__meta mono-line">{timeAgo(f.post.publishedAt)}</span>
                  <span className="board__score">{Math.round(f.score)}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── most cosigned pieces ────────────────────────────────────────── */}
      {pieces.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h3>Most cosigned</h3>
            <span className="tiny">
              Pieces that turn up across the most documented fits — the only proof that isn’t
              self-reported
            </span>
          </div>
          <div className="grid">
            {pieces.map((p) => (
              <ProductCard
                key={p.product.id}
                product={p.product}
                onOpen={onOpen}
                footer={
                  <p className="cosignline tiny">
                    ✦ {p.cosigns.join(', ')}
                  </p>
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ── brands with reach ───────────────────────────────────────────── */}
      {brands.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h3>Brands with reach</h3>
            <span className="tiny">
              Counted by how many different people wear them — one person is a preference, six is a
              movement
            </span>
          </div>
          <div className="brandheat">
            {brands.map((b, i) => (
              <div className="brandheat__row" key={b.brand}>
                <span className="board__n">{String(i + 1).padStart(2, '0')}</span>
                <b>{b.brand}</b>
                <span className="brandheat__people">{b.people.join(' · ')}</span>
                <span className="brandheat__n">{b.people.length}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── demand ──────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section__head">
          <h3>What you’re looking for</h3>
          <span className="tiny">Your searches, on this device</span>
        </div>
        {searches.length === 0 ? (
          <p className="tiny">
            Nothing yet. Search a few pieces and the demand shows up here — and once accounts land,
            this becomes what everyone is looking for.
          </p>
        ) : (
          <div className="terms">
            {searches.map((s) => (
              <span className="term" key={s.term}>
                {s.term}
                <i>{s.n}</i>
              </span>
            ))}
          </div>
        )}
      </section>

      <p className="heat__note tiny">
        Counts are per-device until accounts ship. The ranking is real — the audience is currently
        just you.
      </p>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="heatstat">
      <b>{n.toLocaleString()}</b>
      {label}
    </span>
  )
}

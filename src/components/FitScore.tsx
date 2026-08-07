import { useState } from 'react'
import type { FitEvaluation } from '../lib/wardrobe/types'

const LABEL: Record<string, string> = {
  taste: 'Your lane',
  proportion: 'Proportion',
  color: 'Colour',
  layering: 'Layering',
  texture: 'Texture',
  occasion: 'Occasion',
  weather: 'Weather',
  footwear: 'Footwear',
  statement: 'Statement balance',
  comfort: 'Size confidence',
  novelty: 'Freshness',
  feedback: 'Your history',
}

/** Explainable score: the number, then every dimension that produced it. */
export function FitScore({ evaluation }: { evaluation: FitEvaluation }) {
  const [open, setOpen] = useState(false)
  const e = evaluation
  const dims = [...e.dimensions].sort((a, b) => b.weight - a.weight)

  return (
    <div className="fscore">
      <button className="fscore__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="fscore__num">{e.score}</span>
        <span className="fscore__meta">
          <span className="eyebrow">Fit score</span>
          <span className="tiny">
            {Math.round(e.confidence * 100)}% confident · {open ? 'hide' : 'see'} the breakdown
          </span>
        </span>
      </button>

      {e.working.length > 0 && (
        <p className="fscore__line fscore__line--good">✓ {e.working.join(' ')}</p>
      )}
      {e.improve.length > 0 && (
        <p className="fscore__line fscore__line--warn">→ {e.improve.join(' ')}</p>
      )}

      {open && (
        <div className="fscore__rows">
          {dims.map((d) => (
            <div className="fscore__row" key={d.dimension}>
              <span className="fscore__label">{LABEL[d.dimension] ?? d.dimension}</span>
              <span className="meter fscore__bar">
                <i
                  style={{
                    width: `${d.score}%`,
                    background: d.score >= 78 ? 'var(--good)' : d.score < 60 ? 'var(--red)' : 'var(--ink)',
                  }}
                />
              </span>
              <span className="fscore__val">{d.score}</span>
              <span className="fscore__note tiny">{d.note}</span>
            </div>
          ))}
          {e.missing.length > 0 && (
            <p className="tiny" style={{ marginTop: 10 }}>
              Uncertain: {e.missing.join(' · ')}
            </p>
          )}
          <p className="tiny" style={{ marginTop: 6, color: 'var(--ink-4)' }}>
            Fashion isn’t objective — this is your taste, scored against sourced styling rules.
          </p>
        </div>
      )}
    </div>
  )
}

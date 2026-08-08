import { useEffect, useState } from 'react'
import { BRANDS } from '../data/catalog'
import { useStore } from '../lib/store'

/**
 * The readout under the figure. Types itself out character by character, holds,
 * then wipes and moves to the next line — the build never looks finished, it
 * looks like it is still measuring you.
 */
const LINES = [
  'CALIBRATING FRAME',
  'READING SHOULDER SLOPE',
  'SOLVING TORSO RATIO',
  `MAPPING ${BRANDS.length} BRAND SIZE CHARTS`,
  'RESOLVING DROP',
  'BUILD STABLE',
]

export function BuildTicker() {
  const { profile } = useStore()
  const [line, setLine] = useState(0)
  const [n, setN] = useState(0)

  const text = LINES[line]

  useEffect(() => {
    if (n < text.length) {
      const t = window.setTimeout(() => setN((c) => c + 1), 38)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      setLine((l) => (l + 1) % LINES.length)
      setN(0)
    }, 1500)
    return () => window.clearTimeout(t)
  }, [n, text])

  return (
    <div className="bticker" role="status" aria-live="off">
      <span className="bticker__dot" />
      <span className="bticker__text">
        {text.slice(0, n)}
        <i className="bticker__caret" />
      </span>
      <span className="bticker__stat">
        {profile.chest}″ · {profile.waist}″ · {profile.inseam}″
      </span>
    </div>
  )
}

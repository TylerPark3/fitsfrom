import { useEffect, useRef, useState } from 'react'

// Each string types once per session — repeat visits render instantly.
const seen = new Set<string>()

/** Types itself out when scrolled into view — mission-console style. */
export function Type({
  text,
  className,
  speed = 26,
}: {
  text: string
  className?: string
  speed?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [go, setGo] = useState(false)
  const [n, setN] = useState(() => (seen.has(text) ? text.length : 0))

  useEffect(() => {
    if (seen.has(text)) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setGo(true), {
      threshold: 0.3,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (n >= text.length) {
      seen.add(text)
      return
    }
    if (!go) return
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

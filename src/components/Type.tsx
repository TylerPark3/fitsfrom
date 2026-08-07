import { useEffect, useRef, useState } from 'react'

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

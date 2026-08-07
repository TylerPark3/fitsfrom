import { useEffect, useState } from 'react'

const cache = new Map<string, string>()

/** Cuts near-white backgrounds out of a product image in-browser. */
export function CutoutImg({ src, className }: { src: string; className?: string }) {
  const [cut, setCut] = useState<string | null>(cache.get(src) ?? null)

  useEffect(() => {
    if (cache.has(src)) {
      setCut(cache.get(src)!)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, c.width, c.height)
        const px = d.data
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2]
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
          if (mx - mn <= 18 && (r + g + b) / 3 >= 224) px[i + 3] = 0
        }
        ctx.putImageData(d, 0, 0)
        const url = c.toDataURL('image/png')
        cache.set(src, url)
        setCut(url)
      } catch {
        setCut(null)
      }
    }
    img.onerror = () => setCut(null)
    img.src = src
  }, [src])

  return <img className={className} src={cut ?? src} alt="" loading="lazy" draggable={false} />
}

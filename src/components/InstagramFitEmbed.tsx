import { useEffect, useRef, useState } from 'react'

/**
 * The official Instagram embed, loaded only when it's about to be seen.
 *
 * We never download or re-host anyone's photograph. The post renders from
 * Instagram's own embed, which keeps attribution, the caption and the link back
 * to the original intact. If it's blocked, or there's no URL yet, we say so
 * plainly rather than showing a broken frame.
 */
const SCRIPT_SRC = 'https://www.instagram.com/embed.js'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

let scriptPromise: Promise<void> | null = null

/** One loader for the whole app, however many embeds are on the page. */
function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('blocked')))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('blocked'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export interface InstagramFitEmbedProps {
  url?: string
  accountName?: string
  sourceLabel?: string
  fallbackImage?: string
  /** Alt text for the fallback image. */
  fallbackAlt?: string
}

type State = 'empty' | 'idle' | 'loading' | 'ready' | 'blocked'

export function InstagramFitEmbed({
  url,
  accountName,
  sourceLabel,
  fallbackImage,
  fallbackAlt = '',
}: InstagramFitEmbedProps) {
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<State>(url ? 'idle' : 'empty')

  // Only start the embed when it's near the viewport — these are heavy, and a
  // feed of them would otherwise all initialise at once. The synchronous check
  // matters: an observer that is set up on an element already in view doesn't
  // always deliver a first callback, and the embed would sit on its skeleton
  // forever waiting for one.
  useEffect(() => {
    if (!url) return
    const el = host.current
    if (!el) return

    const near = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight + 400 && r.bottom > -400
    }
    if (near()) {
      setState('loading')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setState('loading')
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [url])

  useEffect(() => {
    if (state !== 'loading' || !url) return
    let cancelled = false

    // Clear the skeleton when the real iframe lands, not on a guessed delay.
    const poll = window.setInterval(() => {
      if (cancelled) return
      if (host.current?.querySelector('iframe')) {
        window.clearInterval(poll)
        setState('ready')
      }
    }, 250)
    const timeout = window.setTimeout(() => {
      if (cancelled) return
      window.clearInterval(poll)
      if (!host.current?.querySelector('iframe')) setState('blocked')
    }, 9000)

    loadEmbedScript()
      .then(() => !cancelled && window.instgrm?.Embeds.process())
      .catch(() => !cancelled && setState('blocked'))

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearTimeout(timeout)
    }
  }, [state, url])

  if (state === 'empty') {
    return (
      <div className="igembed igembed--empty" ref={host}>
        <div className="igembed__note">
          <span className="eyebrow">Official post</span>
          <p>Official Instagram post will appear here.</p>
          {accountName && <span className="tiny">Source: {accountName}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="igembed" ref={host}>
      {state === 'blocked' ? (
        <div className="igembed__note igembed__note--blocked">
          {fallbackImage && <img src={fallbackImage} alt={fallbackAlt} loading="lazy" />}
          <p>The embed couldn’t load here.</p>
          <a className="btn btn--ghost btn--sm" href={url} target="_blank" rel="noreferrer noopener">
            View original post on Instagram
          </a>
        </div>
      ) : (
        <>
          {state !== 'ready' && <div className="igembed__skeleton" aria-hidden="true" />}
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            style={{ background: '#fff', border: 0, margin: 0, maxWidth: '100%', width: '100%' }}
          >
            <a href={url} target="_blank" rel="noreferrer noopener">
              View this post on Instagram
            </a>
          </blockquote>
        </>
      )}

      {(sourceLabel || accountName) && (
        <p className="igembed__src">
          <span className="eyebrow">Source</span>
          <a href={url} target="_blank" rel="noreferrer noopener">
            {sourceLabel ?? accountName}
          </a>
        </p>
      )}
    </div>
  )
}

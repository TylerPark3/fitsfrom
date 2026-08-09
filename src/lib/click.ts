/**
 * UI click. Synthesized, so there is no asset to load and no autoplay audio.
 *
 * This used to be an 808 — a sine sub swept 90→60 Hz. It read as a kick drum
 * rather than a button, and on laptop speakers, which roll off below ~150 Hz,
 * it was mostly felt as a thud with no attack. A click is the opposite shape:
 * a very short bandpassed noise transient up in the 1.5–3 kHz range where a
 * fingernail on plastic lives, with a tiny bit of mid body under it so it has
 * weight without being bass.
 */
let ctx: AudioContext | null = null
let muted = false

try {
  muted = localStorage.getItem('fitsfrom.muted') === '1'
} catch {
  /* storage blocked — default to on */
}

export function isMuted() {
  return muted
}

export function setMuted(v: boolean) {
  muted = v
  try {
    localStorage.setItem('fitsfrom.muted', v ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export type Variant = 'tap' | 'select' | 'back' | 'unlock' | 'add'

interface Click {
  /** Centre of the transient, in Hz — this is what gives it its character. */
  f: number
  /** How long the transient rings. Everything here is under 30 ms. */
  dur: number
  gain: number
  /** Resonance. Higher is tighter and more "plastic". */
  q: number
  /** Optional pitched body under the click, for confirmations. */
  body?: { from: number; to: number; gain: number }
}

const CLICKS: Record<Variant, Click> = {
  // the everyday tick
  tap: { f: 2000, dur: 0.014, gain: 0.3, q: 5 },
  // slightly brighter and firmer for a real choice
  select: { f: 2600, dur: 0.018, gain: 0.36, q: 6 },
  // duller and lower — closing something shouldn't sound like opening it
  back: { f: 1300, dur: 0.016, gain: 0.24, q: 4 },
  // two-stage: click, then a short rising note
  unlock: { f: 2800, dur: 0.02, gain: 0.34, q: 6, body: { from: 520, to: 780, gain: 0.1 } },
  // adding gains you something, so the body rises
  add: { f: 2400, dur: 0.016, gain: 0.3, q: 5, body: { from: 440, to: 660, gain: 0.09 } },
}

export function playClick(variant: Variant = 'tap') {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const { f, dur, gain, q, body } = CLICKS[variant]

    // The click itself: a burst of noise, bandpassed tight and cut off fast.
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      // steep decay across the burst — this is what makes it a tick and not a hiss
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = q

    // Roll off the very top so it's crisp rather than harsh.
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 7000

    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, t)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    noise.connect(bp)
    bp.connect(lp)
    lp.connect(env)
    env.connect(ctx.destination)
    noise.start(t)

    // Optional body: a short triangle note so confirmations feel earned.
    if (body) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(body.from, t)
      osc.frequency.exponentialRampToValueAtTime(body.to, t + 0.05)
      const og = ctx.createGain()
      og.gain.setValueAtTime(0.0001, t)
      og.gain.exponentialRampToValueAtTime(body.gain, t + 0.006)
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
      osc.connect(og)
      og.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.08)
    }
  } catch {
    /* audio blocked — silence is fine */
  }
}

/**
 * Global click layer: any button or link gets the tick, with the variant chosen
 * from what the control does. Attached once at app start.
 *
 * Components must NOT call playClick() in their own onClick — this listener
 * already fires on pointerdown, so doing both plays the sound twice. Where a
 * control needs a specific variant, put `data-sound="unlock"` on it and this
 * picks it up.
 */
let installed = false

export function installClickSounds() {
  if (typeof window === 'undefined' || installed) return
  installed = true
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (muted) return
      const el = (e.target as HTMLElement | null)?.closest(
        'button, a, .chip, .inttile, .teamtile, .tile, .opt, .card__save, .drop__row',
      ) as HTMLElement | null
      if (!el || el.hasAttribute('disabled')) return

      const explicit = el.getAttribute('data-sound') as Variant | null
      if (explicit && explicit in CLICKS) return playClick(explicit)

      const label = `${el.className} ${el.getAttribute('aria-label') ?? ''}`
      if (/close|back|cancel|remove|trash|delete/i.test(label)) return playClick('back')
      // anything that puts a piece somewhere gets the rising confirm
      if (/add to|in wardrobe|in your closet|save|saved|add\b/i.test(label)) return playClick('add')
      if (el.matches('.btn--primary, .deck__go, .inttile, .teamtile, .tile')) return playClick('select')
      playClick('tap')
    },
    { passive: true },
  )
}

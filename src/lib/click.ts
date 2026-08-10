/**
 * UI sound. Synthesized, so there is no asset to load and no autoplay audio.
 *
 * Two families, on purpose:
 *
 *   808  — sine sub swept 90→60 Hz with a noise transient on top. This is the
 *          house sound: every tap, select, back and add uses it.
 *   click — a dry mechanical tick, no pitch at all. Used only where a sub would
 *          be wrong, which right now is the fit check cards.
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

export type Variant = 'tap' | 'select' | 'back' | 'unlock' | 'add' | 'click'

/** The 808: sub sine, fast downward sweep, short noise transient on top. */
interface Sub {
  f: number
  f2: number
  dur: number
  gain: number
  snap: number
}

const SUBS: Record<Exclude<Variant, 'click'>, Sub> = {
  tap: { f: 90, f2: 64, dur: 0.026, gain: 0.46, snap: 0.05 },
  select: { f: 90, f2: 70, dur: 0.03, gain: 0.52, snap: 0.06 },
  back: { f: 78, f2: 60, dur: 0.024, gain: 0.4, snap: 0.035 },
  unlock: { f: 90, f2: 62, dur: 0.034, gain: 0.56, snap: 0.07 },
  add: { f: 84, f2: 96, dur: 0.03, gain: 0.5, snap: 0.055 },
}

/**
 * A dry mechanical tick — a switch bottoming out, not a pop.
 *
 * The trick is that there is no oscillator anywhere in it. Any pitched tone,
 * however short, reads as a "boop"; what makes a click satisfying is a very
 * narrow band of noise that stops almost immediately. Two layers: a hard 3.4 kHz
 * top for the attack, and a 900 Hz thump underneath for the weight of the key.
 */
function playTick() {
  if (!ctx) return
  const t = ctx.currentTime

  const layer = (freq: number, q: number, dur: number, gain: number, delay = 0) => {
    const len = Math.max(1, Math.floor(ctx!.sampleRate * dur))
    const buf = ctx!.createBuffer(1, len, ctx!.sampleRate)
    const data = buf.getChannelData(0)
    // quartic decay — steep enough that it ticks rather than hisses
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4
    const src = ctx!.createBufferSource()
    src.buffer = buf

    const bp = ctx!.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = q

    const env = ctx!.createGain()
    env.gain.setValueAtTime(gain, t + delay)
    env.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur)

    src.connect(bp)
    bp.connect(env)
    env.connect(ctx!.destination)
    src.start(t + delay)
  }

  layer(3400, 9, 0.009, 0.34)      // the attack
  layer(900, 4, 0.016, 0.2, 0.001) // the body of the switch
}

export function playClick(variant: Variant = 'tap') {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    if (variant === 'click') return playTick()

    const t = ctx.currentTime
    const { f, f2, dur, gain, snap } = SUBS[variant]

    // 808: sine sub with a fast downward pitch envelope, 90 Hz → 60 Hz.
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.7)

    // Keep it strictly sub — nothing above 120 Hz survives.
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 120
    lp.Q.value = 0.5

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain, t + 0.003)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc.connect(lp)
    lp.connect(env)
    env.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur)

    // A hair of filtered noise so the sub reads as a physical hit.
    const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate)
    const data = n.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const noise = ctx.createBufferSource()
    noise.buffer = n
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 4000
    bp.Q.value = 1.4
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(snap, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
    noise.connect(bp)
    bp.connect(ng)
    ng.connect(ctx.destination)
    noise.start(t)
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
      if (explicit) return playClick(explicit)

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

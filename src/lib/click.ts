/**
 * 2K-menu UI sound: a short filtered blip with a click transient.
 * Synthesized, so there is no asset to load and no autoplay audio.
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

type Variant = 'tap' | 'select' | 'back' | 'unlock'

/**
 * 808-style sub hits. Every variant starts at its peak and drops fast into the
 * 60–90 Hz sub band, and none of them run past 48 ms.
 */
const TONES: Record<Variant, { f: number; f2: number; dur: number; gain: number }> = {
  tap: { f: 86, f2: 62, dur: 0.042, gain: 0.5 },
  select: { f: 90, f2: 68, dur: 0.046, gain: 0.58 },
  back: { f: 74, f2: 60, dur: 0.04, gain: 0.44 },
  unlock: { f: 90, f2: 60, dur: 0.048, gain: 0.62 },
}

export function playClick(variant: Variant = 'tap') {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const { f, f2, dur, gain } = TONES[variant]

    // The 808: sine sub with a fast downward pitch envelope, 90 Hz → 60 Hz.
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

    // Transient: a hair of filtered noise so it reads as a physical click.
    const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate)
    const data = n.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const noise = ctx.createBufferSource()
    noise.buffer = n
    const hp = ctx.createBiquadFilter()
    hp.type = 'lowpass'
    hp.frequency.value = 240
    hp.Q.value = 0.6
    const ng = ctx.createGain()
    ng.gain.value = gain * 0.18
    noise.connect(hp)
    hp.connect(ng)
    ng.connect(ctx.destination)
    noise.start(t)
  } catch {
    /* audio blocked — silence is fine */
  }
}

/**
 * Global click layer: any button/link gets the tick, with the variant chosen
 * from what the control does. Attached once at app start.
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
      const label = `${el.className} ${el.getAttribute('aria-label') ?? ''}`
      if (/close|back|cancel|remove|trash|delete/i.test(label)) return playClick('back')
      if (el.matches('.btn--primary, .deck__go, .inttile, .teamtile, .tile')) return playClick('select')
      playClick('tap')
    },
    { passive: true },
  )
}

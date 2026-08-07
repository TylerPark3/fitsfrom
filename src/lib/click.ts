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

const TONES: Record<Variant, { f: number; f2: number; dur: number; gain: number }> = {
  tap: { f: 320, f2: 190, dur: 0.05, gain: 0.045 },
  select: { f: 300, f2: 420, dur: 0.075, gain: 0.05 },
  back: { f: 240, f2: 150, dur: 0.07, gain: 0.04 },
  unlock: { f: 260, f2: 520, dur: 0.14, gain: 0.055 },
}

export function playClick(variant: Variant = 'tap') {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const { f, f2, dur, gain } = TONES[variant]

    // Body: a quick pitch sweep through a bandpass — the 2K "tick".
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, f2), t + dur)

    // Low-pass instead of bandpass: keeps the body warm, kills the thin whistle.
    const band = ctx.createBiquadFilter()
    band.type = 'lowpass'
    band.frequency.value = 900
    band.Q.value = 0.7

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain, t + 0.004)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc.connect(band)
    band.connect(env)
    env.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)

    // Transient: a hair of filtered noise so it reads as a physical click.
    const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate)
    const data = n.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const noise = ctx.createBufferSource()
    noise.buffer = n
    // A soft wooden tick, not a hiss.
    const hp = ctx.createBiquadFilter()
    hp.type = 'bandpass'
    hp.frequency.value = 1100
    hp.Q.value = 0.9
    const ng = ctx.createGain()
    ng.gain.value = gain * 0.22
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
export function installClickSounds() {
  if (typeof window === 'undefined') return
  window.addEventListener(
    'pointerdown',
    (e) => {
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

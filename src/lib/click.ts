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

interface Tone {
  f: number
  f2: number
  dur: number
  gain: number
  /** Sub-only, or a sub with a short percussive top layer. */
  snap?: number
}

export type Preset = '808' | 'snap'

/**
 * Two sound sets, both strictly sub-band and both under 50 ms.
 * '808'  — pure sine sub, 90→60 Hz, the heavier hit.
 * 'snap' — same sub shortened hard, plus a 4 kHz tick for instant response.
 */
const PRESETS: Record<Preset, Record<Variant, Tone>> = {
  '808': {
    tap: { f: 86, f2: 62, dur: 0.042, gain: 0.5 },
    select: { f: 90, f2: 68, dur: 0.046, gain: 0.58 },
    back: { f: 74, f2: 60, dur: 0.04, gain: 0.44 },
    unlock: { f: 90, f2: 60, dur: 0.048, gain: 0.62 },
  },
  snap: {
    tap: { f: 90, f2: 64, dur: 0.026, gain: 0.46, snap: 0.05 },
    select: { f: 90, f2: 70, dur: 0.03, gain: 0.52, snap: 0.06 },
    back: { f: 78, f2: 60, dur: 0.024, gain: 0.4, snap: 0.035 },
    unlock: { f: 90, f2: 62, dur: 0.034, gain: 0.56, snap: 0.07 },
  },
}

let preset: Preset = '808'
try {
  const saved = localStorage.getItem('fitsfrom.sound')
  if (saved === '808' || saved === 'snap') preset = saved
} catch {
  /* storage blocked — keep the default */
}

export function getPreset() {
  return preset
}

export function setPreset(p: Preset) {
  preset = p
  try {
    localStorage.setItem('fitsfrom.sound', p)
  } catch {
    /* ignore */
  }
  playClick('select')
}

export function playClick(variant: Variant = 'tap') {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const { f, f2, dur, gain, snap } = PRESETS[preset][variant]

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
    // 'snap' lets a crisp top through; '808' stays buried in the low end.
    hp.type = snap ? 'bandpass' : 'lowpass'
    hp.frequency.value = snap ? 4000 : 240
    hp.Q.value = snap ? 1.4 : 0.6
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(snap ?? gain * 0.18, t)
    if (snap) ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
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

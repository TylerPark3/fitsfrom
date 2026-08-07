/** Satisfying tap — tiny synthesized click, no asset needed. */
let ctx: AudioContext | null = null

export function playClick(freq = 900) {
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.07, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09)
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.1)
  } catch {
    /* audio blocked — fine */
  }
}

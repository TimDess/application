/**
 * Kulto's sound design, synthesized with the Web Audio API (no files, no latency).
 * Chosen in the sound lab (28 November 2026): the "Premium" direction (glass bells,
 * crisp clicks, light reverb), with defeat, streak and the launch wave in "Doux".
 */
import { soundEnabled } from './settings'

export type SoundId =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'tick'
  | 'streak'
  | 'badge'
  | 'levelup'
  | 'victory'
  | 'defeat'
  | 'swoosh'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let reverb: GainNode | null = null

/**
 * Creates or resumes the audio context. iOS Safari only unlocks audio inside a gesture
 * that completes (touchend, click, keydown), not on touch-down: call it from those.
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return
  if (ctx) {
    if (ctx.state !== 'running') {
      void ctx.resume().catch(() => undefined)
      primeSilence()
    }
    return
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  try {
    // Respect the iPhone silent switch.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'ambient'
  } catch {
    // Older browsers have no audio session API.
  }
  ctx = new AC()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.ratio.value = 4
  master = ctx.createGain()
  master.gain.value = 0.6
  master.connect(comp).connect(ctx.destination)
  const len = Math.floor(ctx.sampleRate * 1.6)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
  }
  const conv = ctx.createConvolver()
  conv.buffer = ir
  reverb = ctx.createGain()
  reverb.gain.value = 0.32
  reverb.connect(conv).connect(master)
  void ctx.resume().catch(() => undefined)
  primeSilence()
}

/** Playing one silent sample inside the gesture is what finally unlocks WebKit's audio. */
function primeSilence() {
  if (!ctx) return
  try {
    const src = ctx.createBufferSource()
    src.buffer = ctx.createBuffer(1, 1, 22050)
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    // Nothing to unlock.
  }
}

/** True once the browser lets the page play sound. */
export function audioReady() {
  return ctx?.state === 'running'
}

type ToneOptions = {
  type?: OscillatorType
  gain?: number
  attack?: number
  wet?: number
  lp?: number
  fm?: number
  fmIndex?: number
}

function route(node: GainNode, wet?: number) {
  node.connect(master!)
  if (wet) {
    const send = ctx!.createGain()
    send.gain.value = wet
    node.connect(send).connect(reverb!)
  }
}

function tone(f: number, t: number, dur: number, o: ToneOptions = {}) {
  const c = ctx!
  const g = c.createGain()
  const osc = c.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(f, t)
  if (o.fm) {
    const m = c.createOscillator()
    const mg = c.createGain()
    m.frequency.value = f * o.fm
    mg.gain.setValueAtTime(f * (o.fmIndex ?? 2), t)
    mg.gain.exponentialRampToValueAtTime(1, t + dur)
    m.connect(mg).connect(osc.frequency)
    m.start(t)
    m.stop(t + dur + 0.05)
  }
  let node: AudioNode = osc
  if (o.lp) {
    const fl = c.createBiquadFilter()
    fl.type = 'lowpass'
    fl.frequency.value = o.lp
    osc.connect(fl)
    node = fl
  }
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + (o.attack ?? 0.004))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  node.connect(g)
  route(g, o.wet)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function noise(
  t: number,
  dur: number,
  o: {
    from?: number
    to?: number
    gain?: number
    q?: number
    filter?: BiquadFilterType
    attack?: number
    wet?: number
  } = {},
) {
  const c = ctx!
  const len = Math.ceil(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const fl = c.createBiquadFilter()
  fl.type = o.filter ?? 'bandpass'
  fl.Q.value = o.q ?? 1
  fl.frequency.setValueAtTime(o.from ?? 800, t)
  if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + (o.attack ?? 0.01))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(fl).connect(g)
  route(g, o.wet)
  src.start(t)
  src.stop(t + dur + 0.02)
}

const note = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12)
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19]
const bell = (f: number, t: number, dur = 0.9, gain = 0.18, index = 1.6) =>
  tone(f, t, dur, { fm: 3.5, fmIndex: index, gain, attack: 0.002, wet: 0.38 })
const mallet = (f: number, t: number, dur = 0.5, gain = 0.28) => {
  tone(f, t, dur, { gain, attack: 0.002, wet: 0.18, lp: 3000 })
  tone(f * 4, t, 0.08, { gain: gain * 0.35, attack: 0.001 })
}

const recipes: Record<SoundId, (t: number, n: number) => void> = {
  // Premium
  tap: (t) => {
    tone(2200, t, 0.012, { gain: 0.08, attack: 0.001 })
    noise(t, 0.012, { from: 6000, gain: 0.04, filter: 'highpass' })
  },
  correct: (t) => {
    bell(note(28), t, 0.9)
    bell(note(35), t + 0.06, 1.1, 0.12)
  },
  wrong: (t) => {
    tone(note(-5), t, 0.3, { gain: 0.22, fm: 1.4, fmIndex: 1, lp: 900, wet: 0.1 })
    tone(note(-4), t + 0.06, 0.28, { gain: 0.12, lp: 700 })
  },
  combo: (t, n) =>
    bell(note(24 + MAJOR[Math.min(Math.max(n, 1) - 1, MAJOR.length - 1)]!), t, 0.8, 0.16),
  tick: (t, n) =>
    noise(t, 0.012, { from: n ? 7000 : 5000, gain: n ? 0.16 : 0.1, filter: 'highpass' }),
  badge: (t) => [31, 35, 38, 43, 47].forEach((s, i) => bell(note(s), t + i * 0.045, 1.1, 0.1)),
  levelup: (t) => {
    ;[24, 28, 31, 36, 40].forEach((s, i) => bell(note(s), t + i * 0.07, 1.2, 0.11))
    tone(note(0), t + 0.3, 1.2, { gain: 0.12, attack: 0.3, wet: 0.3 })
  },
  victory: (t) => {
    noise(t, 0.5, { from: 400, to: 8000, gain: 0.05, wet: 0.3 })
    ;[24, 28, 31, 36].forEach((s) => bell(note(s), t + 0.45, 1.6, 0.09))
  },
  // Doux
  defeat: (t) => {
    mallet(note(14), t, 0.6, 0.2)
    mallet(note(9), t + 0.22, 0.9, 0.18)
  },
  streak: (t) => {
    noise(t, 0.5, { from: 300, to: 1400, gain: 0.08, filter: 'lowpass', attack: 0.2, wet: 0.2 })
    mallet(note(24), t + 0.3, 0.8)
  },
  swoosh: (t) =>
    noise(t, 0.8, { from: 200, to: 1600, gain: 0.12, filter: 'lowpass', attack: 0.35, wet: 0.3 }),
}

/** Plays a sound if sound is on. `n` is the combo step, or 1 for an urgent tick. */
export function playSound(id: SoundId, n = 0) {
  if (typeof window === 'undefined' || !soundEnabled()) return
  if (!ctx) return
  const c = ctx
  const run = () => {
    try {
      recipes[id](c.currentTime + 0.01, n)
    } catch {
      // Audio is a bonus: never break the page over it.
    }
  }
  if (c.state === 'running') return run()
  // Still locked: try once more; plays only if this call happens inside a gesture.
  void c
    .resume()
    .then(() => {
      if (c.state === 'running') run()
    })
    .catch(() => undefined)
}

import { hapticsEnabled } from './settings'
import { playSound, type SoundId } from './sound'

export { setSensations } from './settings'
export { audioReady, unlockAudio, type SoundId } from './sound'
export { burstAt, confetti, lastPointer } from './particles'

// Android only for now: iPhone gives web pages no vibration access.
const vibrations: Partial<Record<SoundId, number | number[]>> = {
  tap: 6,
  correct: 18,
  wrong: [20, 40, 20],
  combo: 14,
  tick: 6,
  streak: 30,
  badge: [20, 30, 40],
  levelup: [30, 40, 60],
  victory: [40, 50, 80],
  defeat: 40,
}

/** Sound and vibration for one moment, in the same frame (causality, harmony). */
export function feedback(id: SoundId, n = 0) {
  playSound(id, n)
  if (!hapticsEnabled()) return
  const pattern = vibrations[id]
  try {
    if (pattern && typeof navigator !== 'undefined' && 'vibrate' in navigator)
      navigator.vibrate(pattern)
  } catch {
    // Vibration is optional.
  }
}

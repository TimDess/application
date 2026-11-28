'use client'

import { useEffect } from 'react'
import { feedback, unlockAudio } from '@/lib/sensations'
import { trackPointer } from '@/lib/sensations/particles'

/**
 * Global listener: unlocks audio on the first press, remembers where the finger lands
 * (bursts start there) and plays the tap sound when a button is pressed (on press,
 * not on release, so the feedback is immediate).
 */
export function SensationsRoot() {
  useEffect(() => {
    // Unlock on gestures that complete: iOS refuses to start audio on touch-down.
    const unlock = () => unlockAudio()
    const onDown = (e: PointerEvent) => {
      trackPointer(e.clientX, e.clientY)
      const target = e.target instanceof Element ? e.target.closest('button, [data-tap]') : null
      if (!target || target.closest('[data-silent]')) return
      if (target instanceof HTMLButtonElement && target.disabled) return
      feedback('tap')
    }
    window.addEventListener('pointerdown', onDown, { passive: true, capture: true })
    const gestures = ['touchend', 'pointerup', 'click', 'keydown'] as const
    gestures.forEach((g) => window.addEventListener(g, unlock, { passive: true, capture: true }))
    return () => {
      window.removeEventListener('pointerdown', onDown, { capture: true })
      gestures.forEach((g) => window.removeEventListener(g, unlock, { capture: true }))
    }
  }, [])
  return null
}

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
    const onDown = (e: PointerEvent) => {
      trackPointer(e.clientX, e.clientY)
      unlockAudio()
      const target = e.target instanceof Element ? e.target.closest('button, [data-tap]') : null
      if (!target || target.closest('[data-silent]')) return
      if (target instanceof HTMLButtonElement && target.disabled) return
      feedback('tap')
    }
    window.addEventListener('pointerdown', onDown, { passive: true, capture: true })
    return () => window.removeEventListener('pointerdown', onDown, { capture: true })
  }, [])
  return null
}

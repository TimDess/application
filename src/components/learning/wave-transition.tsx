'use client'

import { type CSSProperties, useEffect } from 'react'
import { brand } from '@/config/brand'

export type WavePhase = 'idle' | 'cover' | 'hold' | 'reveal'

export const WAVE_COVER_MS = 700
export const WAVE_REVEAL_MS = 760

/**
 * Set before navigating under a wave: the next lesson player then opens with a reveal
 * instead of popping in. Module state survives client-side navigations.
 */
let pendingReveal = false
export function markPendingReveal() {
  pendingReveal = true
}
export function hasPendingReveal(): boolean {
  return pendingReveal
}
export function consumePendingReveal(): boolean {
  const value = pendingReveal
  pendingReveal = false
  return value
}

/** A Soleil wave that covers the screen from a point, ripples while loading, then opens. */
export function WaveTransition({
  phase,
  origin,
  label,
}: {
  phase: WavePhase
  origin?: { x: number; y: number }
  label?: string
}) {
  if (phase === 'idle') return null
  const style = origin
    ? ({ '--wx': `${origin.x}px`, '--wy': `${origin.y}px` } as CSSProperties)
    : undefined
  return (
    <div className="wave-overlay" data-phase={phase} style={style} role="status" aria-live="polite">
      <WaveHoldContent label={label} />
    </div>
  )
}

export function WaveHoldContent({ label }: { label?: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="wave-ring"
          style={{ animationDelay: `${i * 600}ms` }}
        />
      ))}
      <div className="relative flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden="true"
          className="inline-flex items-end font-display text-[2.75rem] leading-none font-bold tracking-[-0.03em]"
        >
          {brand.wordmark}
          <span className="mb-[0.16em] ml-[0.04em] inline-block size-[0.3em] [animation:kulto-dot-bounce_1s_var(--ease-in-out)_infinite] rounded-full bg-(--on-accent)" />
        </span>
        <span className="max-w-xs px-6 text-heading font-semibold">{label ?? 'C’est parti !'}</span>
      </div>
    </>
  )
}

/** Static full-screen hold, used as the lesson route's loading state so waves chain across pages. */
export function WaveHoldScreen({ label }: { label?: string }) {
  // Whatever replaces this hold (the lesson player) should open the wave rather than pop in.
  useEffect(() => markPendingReveal(), [])
  return (
    <div className="wave-overlay" role="status" aria-live="polite">
      <WaveHoldContent label={label} />
    </div>
  )
}

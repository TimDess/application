'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { motionReduced } from '@/components/theme/theme-client'
import { WAVE_REVEAL_MS } from '@/components/learning/wave-transition'

/** Full-screen "level up" moment: a Soleil wave covers the screen, then opens on close. */
export function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  function close() {
    if (closing) return
    if (motionReduced()) return onClose()
    setClosing(true)
    setTimeout(onClose, WAVE_REVEAL_MS)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Portal: a transformed ancestor (stagger animations) would otherwise trap position: fixed.
  return createPortal(
    <div
      className="wave-overlay"
      data-phase={closing ? 'reveal' : 'cover'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      style={{ ['--wx' as string]: '50%', ['--wy' as string]: '50%' }}
    >
      <span
        aria-hidden="true"
        className="absolute size-[34rem] [animation:rays-spin_18s_linear_infinite] rounded-full opacity-40"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--on-accent) 22%, transparent) 0deg 8deg, transparent 8deg 24deg)',
          maskImage: 'radial-gradient(circle, black 20%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 68%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <p className="text-heading font-semibold" style={{ animationDelay: '250ms' }}>
          Niveau supérieur
        </p>
        <h2
          id="level-up-title"
          className="level-burst font-display text-[5.5rem] leading-none font-bold tracking-[-0.04em]"
          style={{ animationDelay: '350ms' }}
        >
          <span className="sr-only">Tu passes au niveau </span>
          {level}
        </h2>
        <p className="max-w-xs text-body">Ta culture prend de l’ampleur. Continue comme ça !</p>
        <Button
          ref={buttonRef}
          size="lg"
          variant="ghost"
          className="mt-4 min-w-48 bg-on-accent text-accent hover:bg-on-accent/90"
          onClick={close}
        >
          Continuer
        </Button>
      </div>
    </div>,
    document.body,
  )
}

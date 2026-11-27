'use client'

import { useEffect } from 'react'
import { currentThemePreference, rememberPointer, resolveTheme } from './theme-client'

/** Follows OS theme changes while the preference is "system". */
export function ThemeWatcher() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      if (currentThemePreference() === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'))
      }
    }
    const onPointer = (e: PointerEvent) => rememberPointer(e.clientX, e.clientY)
    mq.addEventListener('change', onChange)
    window.addEventListener('pointerdown', onPointer, { passive: true })
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [])
  return null
}

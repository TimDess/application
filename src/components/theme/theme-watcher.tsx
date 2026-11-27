'use client'

import { useEffect } from 'react'
import { currentThemePreference, resolveTheme } from './theme-client'

/** Follows OS theme changes while the preference is "system". */
export function ThemeWatcher() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      if (currentThemePreference() === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'))
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return null
}

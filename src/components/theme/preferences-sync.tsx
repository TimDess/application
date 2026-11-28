'use client'

import { useEffect } from 'react'
import type { ThemePreference } from '@/config/product'
import { setSensations } from '@/lib/sensations/settings'
import { applyReducedMotion, applyThemePreference, currentThemePreference } from './theme-client'

/**
 * Brings this device in line with the preferences saved on the account
 * (e.g. first sign-in on a new phone). Rendered once the user is known.
 */
export function PreferencesSync({
  theme,
  reducedMotion,
  soundEnabled = true,
  hapticsEnabled = true,
}: {
  theme: ThemePreference
  reducedMotion: boolean
  soundEnabled?: boolean
  hapticsEnabled?: boolean
}) {
  useEffect(() => {
    setSensations({ sound: soundEnabled, haptics: hapticsEnabled })
    if (currentThemePreference() !== theme) applyThemePreference(theme)
    const isReduced = document.documentElement.getAttribute('data-motion') === 'reduced'
    if (isReduced !== reducedMotion) applyReducedMotion(reducedMotion)
  }, [theme, reducedMotion, soundEnabled, hapticsEnabled])
  return null
}

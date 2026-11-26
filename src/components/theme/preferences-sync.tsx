'use client'

import { useEffect } from 'react'
import type { ThemePreference } from '@/config/product'
import { applyReducedMotion, applyThemePreference, currentThemePreference } from './theme-client'

/**
 * Brings this device in line with the preferences saved on the account
 * (e.g. first sign-in on a new phone). Rendered once the user is known.
 */
export function PreferencesSync({
  theme,
  reducedMotion,
}: {
  theme: ThemePreference
  reducedMotion: boolean
}) {
  useEffect(() => {
    if (currentThemePreference() !== theme) applyThemePreference(theme)
    const isReduced = document.documentElement.getAttribute('data-motion') === 'reduced'
    if (isReduced !== reducedMotion) applyReducedMotion(reducedMotion)
  }, [theme, reducedMotion])
  return null
}

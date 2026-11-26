'use client'

import type { ThemePreference } from '@/config/product'
import { MOTION_COOKIE, THEME_COOKIE } from './theme-script'

const ONE_YEAR = 60 * 60 * 24 * 365

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
}

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return pref
}

/** Applies a theme preference immediately and remembers it on this device. */
export function applyThemePreference(pref: ThemePreference) {
  const root = document.documentElement
  root.setAttribute('data-theme', resolveTheme(pref))
  root.setAttribute('data-theme-pref', pref)
  writeCookie(THEME_COOKIE, pref)
}

export function applyReducedMotion(reduced: boolean) {
  const root = document.documentElement
  if (reduced) root.setAttribute('data-motion', 'reduced')
  else root.removeAttribute('data-motion')
  writeCookie(MOTION_COOKIE, reduced ? 'reduced' : 'full')
}

export function currentThemePreference(): ThemePreference {
  const p = document.documentElement.getAttribute('data-theme-pref')
  return p === 'light' || p === 'dark' ? p : 'system'
}

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

let lastPointer: { x: number; y: number } | null = null

/** Remembers where the user last pressed, so the theme reveal starts from there. */
export function rememberPointer(x: number, y: number) {
  lastPointer = { x, y }
}

export function motionReduced(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute('data-motion') === 'reduced'
  )
}

/**
 * Applies a theme preference and remembers it on this device. When the resolved theme
 * changes, a circle reveals the new theme from the last pressed point (View Transitions).
 */
export function applyThemePreference(pref: ThemePreference) {
  const root = document.documentElement
  const next = resolveTheme(pref)
  const apply = () => {
    root.setAttribute('data-theme', next)
    root.setAttribute('data-theme-pref', pref)
  }
  writeCookie(THEME_COOKIE, pref)

  const changes = root.getAttribute('data-theme') !== next
  if (!changes || motionReduced() || typeof document.startViewTransition !== 'function') {
    apply()
    return
  }
  const x = lastPointer?.x ?? window.innerWidth / 2
  const y = lastPointer?.y ?? window.innerHeight / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-r', `${radius}px`)
  document.startViewTransition(apply)
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

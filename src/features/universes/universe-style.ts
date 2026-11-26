import type { CSSProperties } from 'react'
import { readableOn } from '@/lib/utils/color'

type UniverseColors = { color_light: string; color_dark: string }

/**
 * CSS variables for a universe, consumed by `.universe-scope` in globals.css.
 * Text colors are computed for WCAG contrast instead of being stored.
 */
export function universeStyle(u: UniverseColors): CSSProperties {
  return {
    '--uni-light': u.color_light,
    '--uni-dark': u.color_dark,
    '--on-uni-light': readableOn(u.color_light),
    '--on-uni-dark': readableOn(u.color_dark),
  } as CSSProperties
}

const HEX = /^#([0-9a-f]{6})$/i

function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a #RRGGBB color. */
export function luminance(hex: string): number {
  const m = HEX.exec(hex)
  if (!m) throw new Error(`Invalid hex color: ${hex}`)
  const n = parseInt(m[1]!, 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

/** WCAG contrast ratio between two #RRGGBB colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Picks the text color (light or dark ink) with the best contrast on a background. */
export function readableOn(background: string, light = '#FFFFFF', dark = '#16142E'): string {
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark
}

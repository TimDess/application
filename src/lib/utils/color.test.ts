import { describe, expect, it } from 'vitest'
import { contrastRatio, luminance, readableOn } from './color'

describe('color utils', () => {
  it('computes luminance bounds', () => {
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('computes the WCAG contrast ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#1F3DFF', '#FFFFFF')).toBeGreaterThan(4.5)
  })

  it('picks dark ink on the Soleil accent and white on deep red', () => {
    expect(readableOn('#FFC83D')).toBe('#16142E')
    expect(readableOn('#C2189B')).toBe('#FFFFFF')
  })

  it('rejects invalid colors', () => {
    expect(() => luminance('red')).toThrow()
  })
})

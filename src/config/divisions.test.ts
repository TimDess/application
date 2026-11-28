import { describe, expect, it } from 'vitest'
import { divisionOf, divisions, timeLeft } from './divisions'

describe('divisions', () => {
  it('lists six divisions from Bronze to Légende', () => {
    expect(divisions.map((d) => d.label)).toEqual([
      'Bronze',
      'Argent',
      'Or',
      'Platine',
      'Diamant',
      'Légende',
    ])
    expect(divisionOf('unknown').label).toBe('Bronze')
  })

  it('formats the time left in the week', () => {
    expect(timeLeft((3 * 24 + 5) * 3600 + 1800)).toBe('3 j 5 h')
    expect(timeLeft(4 * 3600 + 12 * 60)).toBe('4 h 12 min')
    expect(timeLeft(8 * 60)).toBe('8 min')
    expect(timeLeft(-50)).toBe('0 min')
  })
})

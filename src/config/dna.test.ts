import { describe, expect, it } from 'vitest'
import { dnaIdentity } from './dna'

const b = (slug: string, score: number) => ({ slug, score, seen: 1, mastered: 0, available: 10 })

describe('dnaIdentity', () => {
  it('has no identity before any mastery', () => {
    expect(dnaIdentity([b('musique', 0), b('sport', 0)])).toBeNull()
  })
  it('names the dominant universe and spots specialists', () => {
    expect(dnaIdentity([b('sport-automobile', 40), b('musique', 10)])).toEqual({
      title: 'Esprit paddock',
      qualifier: 'Spécialiste',
    })
  })
  it('spots balanced profiles', () => {
    expect(dnaIdentity([b('musique', 30), b('cinema-series', 25)])?.qualifier).toBe('Touche-à-tout')
  })
})

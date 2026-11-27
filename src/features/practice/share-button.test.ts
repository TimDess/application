import { describe, expect, it } from 'vitest'
import { shareText } from './share-button'

describe('shareText', () => {
  it('shows the score and squares, never the answers', () => {
    const text = shareText('2026-11-29', [true, true, false, true, true], 'https://kulto.app')
    expect(text).toContain('Défi du 29 nov.')
    expect(text).toContain('4/5')
    expect(text).toContain('🟨🟨⬛🟨🟨')
    expect(text.endsWith('kulto.app')).toBe(true)
  })
})

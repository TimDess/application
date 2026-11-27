import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a text color next to a custom font size', () => {
    expect(cn('bg-accent text-on-accent', 'text-body')).toBe('bg-accent text-on-accent text-body')
  })

  it('still resolves conflicts inside the same group', () => {
    expect(cn('text-body', 'text-heading')).toBe('text-heading')
    expect(cn('text-ink', 'text-muted')).toBe('text-muted')
  })
})

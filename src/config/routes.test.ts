import { describe, expect, it } from 'vitest'
import { isGuestOnlyPath, isProtectedPath, safeNextPath } from './routes'

describe('safeNextPath', () => {
  it('keeps in-app paths', () => {
    expect(safeNextPath('/parametres')).toBe('/parametres')
    expect(safeNextPath('/explorer?u=f1')).toBe('/explorer?u=f1')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', ''])(
    'rejects %s',
    (value) => {
      expect(safeNextPath(value)).toBe('/accueil')
    },
  )

  it('falls back when missing', () => {
    expect(safeNextPath(null, '/onboarding')).toBe('/onboarding')
  })
})

describe('route guards', () => {
  it('detects protected paths', () => {
    expect(isProtectedPath('/accueil')).toBe(true)
    expect(isProtectedPath('/parametres/compte')).toBe(true)
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/accueillir')).toBe(false)
  })

  it('detects guest-only paths', () => {
    expect(isGuestOnlyPath('/connexion')).toBe(true)
    expect(isGuestOnlyPath('/inscription/verifie-tes-emails')).toBe(false)
  })
})

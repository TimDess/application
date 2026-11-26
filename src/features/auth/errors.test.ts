import { describe, expect, it } from 'vitest'
import { authErrorMessage, genericAuthError } from './errors'

describe('authErrorMessage', () => {
  it('maps known codes to French messages', () => {
    expect(authErrorMessage('invalid_credentials')).toBe('Email ou mot de passe incorrect.')
    expect(authErrorMessage('email_not_confirmed')).toMatch(/Confirme ton adresse email/)
  })

  it('never leaks unknown internal errors', () => {
    expect(authErrorMessage('unexpected_failure')).toBe(genericAuthError)
    expect(authErrorMessage(undefined)).toBe(genericAuthError)
  })
})

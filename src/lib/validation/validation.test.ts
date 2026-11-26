import { describe, expect, it } from 'vitest'
import { changePasswordSchema, deleteAccountSchema, passwordSchema, signUpSchema } from './auth'
import { onboardingSchema, settingsSchema, usernameSchema } from './profile'

describe('auth validation', () => {
  it('enforces the password policy', () => {
    expect(passwordSchema.safeParse('abc12345').success).toBe(true)
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false)
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
    expect(passwordSchema.safeParse('a1').success).toBe(false)
  })

  it('requires age and terms consent at sign-up', () => {
    const base = { email: ' Tim@Example.com ', password: 'abc12345' }
    expect(signUpSchema.safeParse(base).success).toBe(false)
    const ok = signUpSchema.safeParse({ ...base, ageConfirmed: 'on', termsAccepted: 'on' })
    expect(ok.success).toBe(true)
    expect(ok.success && ok.data.email).toBe('tim@example.com')
  })

  it('requires matching passwords', () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: 'x',
      password: 'abc12345',
      confirm: 'abc12346',
    })
    expect(r.success).toBe(false)
  })

  it('requires the explicit deletion keyword', () => {
    expect(
      deleteAccountSchema.safeParse({ password: 'x', confirmation: 'supprimer' }).success,
    ).toBe(false)
    expect(
      deleteAccountSchema.safeParse({ password: 'x', confirmation: 'SUPPRIMER' }).success,
    ).toBe(true)
  })
})

describe('profile validation', () => {
  it.each([
    ['tim_22', true],
    ['ab', false],
    ['a'.repeat(21), false],
    ['timothé', false],
    ['tim dess', false],
    ['Admin', false],
    ['KULTO', false],
  ])('username %s → %s', (value, valid) => {
    expect(usernameSchema.safeParse(value).success).toBe(valid)
  })

  it('validates a full onboarding payload', () => {
    const payload = {
      username: 'tim_22',
      avatarKey: 'soleil',
      dailyGoal: '10',
      universes: [{ slug: 'sport-automobile', level: 'expert' }],
    }
    const r = onboardingSchema.safeParse(payload)
    expect(r.success).toBe(true)
    expect(r.success && r.data.dailyGoal).toBe(10)
  })

  it('rejects onboarding without universes or with a wrong goal', () => {
    expect(
      onboardingSchema.safeParse({
        username: 'tim',
        avatarKey: 'soleil',
        dailyGoal: 10,
        universes: [],
      }).success,
    ).toBe(false)
    expect(
      onboardingSchema.safeParse({
        username: 'tim',
        avatarKey: 'soleil',
        dailyGoal: 7,
        universes: [{ slug: 'musique', level: 'expert' }],
      }).success,
    ).toBe(false)
  })

  it('rejects duplicate universes', () => {
    const r = onboardingSchema.safeParse({
      username: 'tim',
      avatarKey: 'soleil',
      dailyGoal: 10,
      universes: [
        { slug: 'musique', level: 'expert' },
        { slug: 'musique', level: 'debutant' },
      ],
    })
    expect(r.success).toBe(false)
  })

  it('accepts partial settings but not empty ones', () => {
    expect(settingsSchema.safeParse({ theme: 'dark' }).success).toBe(true)
    expect(settingsSchema.safeParse({}).success).toBe(false)
    expect(settingsSchema.safeParse({ theme: 'blue' }).success).toBe(false)
  })
})

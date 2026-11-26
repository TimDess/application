import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteUrl } from './brand'

describe('siteUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('prefers the explicit site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://kulto.app/')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'kulto.vercel.app')
    expect(siteUrl()).toBe('https://kulto.app')
  })

  it('uses the Vercel production domain in production', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'kulto.vercel.app')
    expect(siteUrl()).toBe('https://kulto.vercel.app')
  })

  it('uses the branch URL on previews', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_BRANCH_URL', 'kulto-git-feature.vercel.app')
    expect(siteUrl()).toBe('https://kulto-git-feature.vercel.app')
  })

  it('falls back to localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('VERCEL_URL', '')
    vi.stubEnv('VERCEL_BRANCH_URL', '')
    expect(siteUrl()).toBe('http://localhost:3000')
  })
})

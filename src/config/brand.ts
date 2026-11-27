/**
 * Single source of truth for the brand. Never hard-code the product name elsewhere:
 * import `brand` instead, so a rename is a one-line change.
 */
export const brand = {
  name: 'Kulto',
  wordmark: 'kulto',
  tagline: 'Développe ta culture. Explore tes passions. Défie tes amis.',
  description:
    'Kulto transforme tes passions en culture : des parcours courts, des mini-jeux et des défis pour apprendre la F1, la musique, le gaming et bien plus.',
  locale: 'fr-FR',
  language: 'fr',
  colors: {
    /** Dark theme background, used for browser UI (theme-color). */
    night: '#16142E',
    /** Light theme background. */
    paper: '#F6F5FB',
    /** Brand accent "Soleil". */
    accent: '#FFC83D',
  },
  /** Social links. `null` means "not created yet" and the link is not rendered. */
  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
    x: null as string | null,
  },
  legal: {
    /** Version of the terms the user accepts at sign-up. Bump it when the terms change. */
    termsVersion: '2026-11',
    minimumAge: 15,
  },
} as const

/**
 * Public base URL of the app. Uses NEXT_PUBLIC_SITE_URL when set, otherwise the
 * URL Vercel provides (production domain, or the branch URL for previews).
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercelHost =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  if (vercelHost) return `https://${vercelHost}`
  return 'http://localhost:3000'
}

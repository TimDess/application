export const routes = {
  home: '/',
  signIn: '/connexion',
  signUp: '/inscription',
  checkEmail: '/inscription/verifie-tes-emails',
  forgotPassword: '/mot-de-passe-oublie',
  resetPassword: '/reinitialiser-mot-de-passe',
  authError: '/auth/erreur',
  onboarding: '/onboarding',
  dashboard: '/accueil',
  explore: '/explorer',
  play: '/jouer',
  league: '/ligue',
  profile: '/profil',
  settings: '/parametres',
  account: '/parametres/compte',
  terms: '/cgu',
  privacy: '/confidentialite',
  courses: '/parcours',
  lessons: '/lecon',
  reviews: '/revisions',
  daily: '/defi',
  trial: '/essai',
  saveAccount: '/sauvegarder',
} as const

export const universePath = (slug: string) => `${routes.explore}/${slug}`
export const coursePath = (slug: string) => `${routes.courses}/${slug}`
export const lessonPath = (slug: string) => `${routes.lessons}/${slug}`

/** Routes that require a signed-in user. */
export const protectedPrefixes = [
  routes.dashboard,
  routes.explore,
  routes.play,
  routes.league,
  routes.profile,
  routes.settings,
  routes.onboarding,
  routes.courses,
  routes.lessons,
  routes.reviews,
  routes.daily,
  routes.saveAccount,
] as const

/** Routes a signed-in user has no reason to see (they are sent to the dashboard). */
export const guestOnlyPaths = [
  routes.signIn,
  routes.signUp,
  routes.forgotPassword,
  routes.trial,
] as const

export function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isGuestOnlyPath(pathname: string): boolean {
  return guestOnlyPaths.some((p) => pathname === p)
}

/**
 * Returns a safe in-app path for post-auth redirects. Rejects absolute URLs,
 * protocol-relative URLs and backslash tricks to prevent open redirects.
 */
export function safeNextPath(next: string | null | undefined, fallback: string = routes.dashboard) {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}

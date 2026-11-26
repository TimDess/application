/** Product-level options shared by the UI, validation and the database CHECK constraints. */

export const dailyGoals = [
  { minutes: 5, label: 'Découverte', hint: '5 min par jour' },
  { minutes: 10, label: 'Régulier', hint: '10 min par jour' },
  { minutes: 15, label: 'Passionné', hint: '15 min par jour' },
  { minutes: 20, label: 'Intensif', hint: '20 min ou plus' },
] as const

export type DailyGoalMinutes = (typeof dailyGoals)[number]['minutes']

export const selfLevels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'expert', label: 'Expert' },
] as const

export type SelfLevel = (typeof selfLevels)[number]['value']

export const themePreferences = [
  { value: 'system', label: 'Automatique' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
] as const

export type ThemePreference = (typeof themePreferences)[number]['value']

export const profileVisibilities = [
  { value: 'public', label: 'Public', hint: 'Tous les joueurs peuvent voir ton profil.' },
  { value: 'friends', label: 'Amis', hint: 'Seulement tes amis (dès l’arrivée des amis).' },
  { value: 'private', label: 'Privé', hint: 'Personne d’autre que toi.' },
] as const

export type ProfileVisibility = (typeof profileVisibilities)[number]['value']

/**
 * Usernames nobody can take. Keep in sync with private.reserved_usernames()
 * in supabase/migrations (tested on both sides).
 */
export const reservedUsernames = [
  'admin',
  'administrateur',
  'kulto',
  'moderateur',
  'moderator',
  'support',
  'staff',
  'officiel',
  'official',
  'root',
  'system',
  'null',
  'undefined',
] as const

export function isReservedUsername(username: string): boolean {
  const u = username.toLowerCase()
  return (reservedUsernames as readonly string[]).includes(u)
}

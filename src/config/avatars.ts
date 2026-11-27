/**
 * Original avatar presets. V1 has no image upload (no moderation needed for minors):
 * an avatar is a preset color plus the first letter of the username.
 * Keep keys in sync with the CHECK constraint on public.profiles.avatar_key.
 */
export const avatarPresets = [
  { key: 'soleil', label: 'Soleil', bg: '#FFC83D', fg: '#1B1838' },
  { key: 'lavande', label: 'Lavande', bg: '#B4A8FF', fg: '#16142E' },
  { key: 'corail', label: 'Corail', bg: '#FF7A66', fg: '#1A0703' },
  { key: 'menthe', label: 'Menthe', bg: '#4EE6B5', fg: '#062A1F' },
  { key: 'ocean', label: 'Océan', bg: '#5B93FF', fg: '#04112B' },
  { key: 'rose', label: 'Rose', bg: '#F25BC9', fg: '#240419' },
  { key: 'ambre', label: 'Ambre', bg: '#FFB627', fg: '#1A1000' },
  { key: 'nuit', label: 'Nuit', bg: '#2A2650', fg: '#F5F4FF' },
] as const

export type AvatarKey = (typeof avatarPresets)[number]['key']

export const avatarKeys = avatarPresets.map((a) => a.key) as [AvatarKey, ...AvatarKey[]]

export function getAvatarPreset(key: string | null | undefined) {
  return avatarPresets.find((a) => a.key === key) ?? avatarPresets[avatarPresets.length - 1]!
}

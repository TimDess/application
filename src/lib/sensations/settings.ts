/**
 * Sound and haptics preferences on this device. The account settings are the source
 * (synced by PreferencesSync and the settings form); this per-device copy lets pages
 * outside the app shell (lessons, duels) respect them on a direct load.
 */
const KEY = 'kulto-sensations'

type Prefs = { sound: boolean; haptics: boolean }
let prefs: Prefs | null = null

function load(): Prefs {
  if (prefs) return prefs
  prefs = { sound: true, haptics: true }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) prefs = { ...prefs, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    // Storage may be unavailable (private mode): defaults apply.
  }
  return prefs
}

export function soundEnabled() {
  return load().sound
}

export function hapticsEnabled() {
  return load().haptics
}

export function setSensations(next: Partial<Prefs>) {
  prefs = { ...load(), ...next }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Not persisted on this device; the account setting still applies next sync.
  }
}

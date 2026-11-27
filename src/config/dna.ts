/** Cultural DNA titles, one per universe (validated by Tim, 28 November 2026). */
export const dnaTitles: Record<string, string> = {
  'sport-automobile': 'Esprit paddock',
  musique: 'Oreille d’or',
  'jeux-video': 'Joueur légendaire',
  'cinema-series': 'Cinéphile',
  sport: 'Œil de coach',
  'creation-design': 'Œil de designer',
  'histoire-societe': 'Mémoire vivante',
  'sciences-tech': 'Esprit curieux',
  'geographie-cultures': 'Globe-trotter',
}

/** Short axis labels for the radar. */
export const dnaShortLabels: Record<string, string> = {
  'sport-automobile': 'Auto',
  musique: 'Musique',
  'jeux-video': 'Jeu vidéo',
  'cinema-series': 'Ciné',
  sport: 'Sport',
  'creation-design': 'Design',
  'histoire-societe': 'Histoire',
  'sciences-tech': 'Sciences',
  'geographie-cultures': 'Géo',
}

export type DnaBranch = {
  slug: string
  score: number
  seen: number
  mastered: number
  available: number
}

/**
 * Title from the dominant universe, qualifier from the shape of the profile:
 * "Spécialiste" when the top branch is at least twice the second, "Touche-à-tout" otherwise.
 */
export function dnaIdentity(branches: DnaBranch[]): { title: string; qualifier: string } | null {
  const sorted = [...branches].filter((b) => b.score > 0).sort((a, b) => b.score - a.score)
  const top = sorted[0]
  if (!top) return null
  const second = sorted[1]?.score ?? 0
  return {
    title: dnaTitles[top.slug] ?? 'Curieux',
    qualifier: top.score >= 2 * second ? 'Spécialiste' : 'Touche-à-tout',
  }
}

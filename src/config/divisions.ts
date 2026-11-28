/** League divisions, lowest first (mirrors the league_division enum). */
export const divisions = [
  { value: 'bronze', label: 'Bronze', color: '#C77C3E' },
  { value: 'argent', label: 'Argent', color: '#9AA3B5' },
  { value: 'or', label: 'Or', color: '#E9B422' },
  { value: 'platine', label: 'Platine', color: '#3FB8B0' },
  { value: 'diamant', label: 'Diamant', color: '#5B93FF' },
  { value: 'legende', label: 'Légende', color: '#A66CFF' },
] as const

export type Division = (typeof divisions)[number]['value']

export function divisionOf(value: string) {
  return divisions.find((d) => d.value === value) ?? divisions[0]
}

/** "3 j 5 h", "4 h 12 min", "8 min". */
export function timeLeft(secondsLeft: number): string {
  const minutes = Math.floor(Math.max(0, secondsLeft) / 60)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${minutes % 60} min`
  return `${minutes} min`
}

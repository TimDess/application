import {
  CalendarCheck,
  Flame,
  Footprints,
  Lock,
  Repeat2,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { BadgeRarity } from './types'

export type BadgeFamily = 'progress' | 'streak' | 'level' | 'review' | 'daily'

const familyIcons: Record<BadgeFamily, LucideIcon> = {
  progress: Footprints,
  streak: Flame,
  level: TrendingUp,
  review: Repeat2,
  daily: CalendarCheck,
}

export const rarityLabels: Record<BadgeRarity, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

/** Rarity is shown by the number of rings (and in words), never by colour alone. */
const rarityRings: Record<BadgeRarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }

export function familyOf(key: string): BadgeFamily {
  if (key.startsWith('streak')) return 'streak'
  if (key.startsWith('level') || key === 'specialist') return 'level'
  if (key.includes('review') || key === 'elephant') return 'review'
  if (key.includes('daily')) return 'daily'
  return 'progress'
}

export function BadgeMedal({
  family,
  rarity,
  earned,
  size = 'md',
  className,
}: {
  family: BadgeFamily
  rarity: BadgeRarity
  earned: boolean
  size?: 'md' | 'lg'
  className?: string
}) {
  const Icon = earned ? familyIcons[family] : Lock
  const rings = rarityRings[rarity]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full',
        size === 'lg' ? 'size-20' : 'size-14',
        earned ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted',
        earned && rarity === 'legendary' && 'glow-accent',
        className,
      )}
      style={{
        boxShadow: earned
          ? Array.from(
              { length: rings },
              (_, i) =>
                `0 0 0 ${3 + i * 4}px color-mix(in srgb, var(--accent) ${40 - i * 12}%, transparent)`,
            ).join(', ') || undefined
          : undefined,
      }}
    >
      <Icon className={size === 'lg' ? 'size-9' : 'size-6'} strokeWidth={2} />
    </span>
  )
}

import {
  Atom,
  Clapperboard,
  Gamepad2,
  Gauge,
  Globe,
  Landmark,
  Medal,
  Music,
  PenTool,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/** Maps universes.icon_key (stored in the database) to an icon. Unknown keys fall back to Sparkles. */
const icons: Record<string, LucideIcon> = {
  gauge: Gauge,
  music: Music,
  gamepad: Gamepad2,
  clapperboard: Clapperboard,
  medal: Medal,
  'pen-tool': PenTool,
  landmark: Landmark,
  atom: Atom,
  globe: Globe,
  sparkles: Sparkles,
}

export function UniverseIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = icons[iconKey] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}

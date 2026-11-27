import {
  CalendarCheck,
  CircleUser,
  Compass,
  House,
  Play,
  Repeat2,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { routes } from '@/config/routes'

export type NavItem = { href: string; label: string; icon: LucideIcon }

export const primaryNav: NavItem[] = [
  { href: routes.dashboard, label: 'Accueil', icon: House },
  { href: routes.explore, label: 'Explorer', icon: Compass },
  { href: routes.play, label: 'Jouer', icon: Play },
  { href: routes.league, label: 'Ligue', icon: Trophy },
  { href: routes.profile, label: 'Profil', icon: CircleUser },
]

/** Extra entries shown in the desktop sidebar. */
export const secondaryNav: NavItem[] = [
  { href: routes.daily, label: 'Défi du jour', icon: CalendarCheck },
  { href: routes.reviews, label: 'Révisions', icon: Repeat2 },
]

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

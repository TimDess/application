import { CircleUser, Compass, House, Play, Trophy, type LucideIcon } from 'lucide-react'
import { routes } from '@/config/routes'

export type NavItem = { href: string; label: string; icon: LucideIcon }

export const primaryNav: NavItem[] = [
  { href: routes.dashboard, label: 'Accueil', icon: House },
  { href: routes.explore, label: 'Explorer', icon: Compass },
  { href: routes.play, label: 'Jouer', icon: Play },
  { href: routes.league, label: 'Ligue', icon: Trophy },
  { href: routes.profile, label: 'Profil', icon: CircleUser },
]

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

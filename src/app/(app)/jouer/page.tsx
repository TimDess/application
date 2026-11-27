import { CalendarCheck, Gamepad2, Medal, Swords, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { SoonBadge } from '@/components/ui/pill'

export const metadata: Metadata = { title: 'Jouer' }

const modes = [
  {
    icon: CalendarCheck,
    title: 'Défi du jour',
    text: 'Un défi identique pour tous, disponible 24 heures et partageable.',
    phase: 3,
  },
  {
    icon: Zap,
    title: 'Partie rapide',
    text: 'Quelques questions dans tes univers favoris, en deux minutes.',
    phase: 2,
  },
  {
    icon: Gamepad2,
    title: 'Mini-jeux',
    text: 'Quiz, vrai ou faux, timeline, associations, devine l’année.',
    phase: 2,
  },
  {
    icon: Swords,
    title: 'Duel',
    text: 'Affronte un joueur de ton niveau, en direct ou en différé.',
    phase: 4,
  },
  {
    icon: Medal,
    title: 'Championnat',
    text: 'Ta ligue de la semaine : monte de division ou défends ta place.',
    phase: 4,
  },
]

export default function PlayPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jouer"
        description="Les modes de jeu arrivent au fil des prochaines versions."
      />
      <ul className="flex flex-col gap-3">
        {modes.map(({ icon: Icon, title, text, phase }) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 className="text-heading">{title}</h2>
              <p className="text-body text-muted">{text}</p>
            </div>
            <SoonBadge phase={phase} />
          </li>
        ))}
      </ul>
    </div>
  )
}

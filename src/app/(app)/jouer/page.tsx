import { CalendarCheck, ChevronRight, Gamepad2, Medal, Swords, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { SoonBadge } from '@/components/ui/pill'
import { routes } from '@/config/routes'

export const metadata: Metadata = { title: 'Jouer' }

const upcoming = [
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
    phase: 3,
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
      <PageHeader title="Jouer" description="Apprends en jouant, leçon après leçon." />
      <Link
        href={routes.explore}
        className="flex items-center gap-4 rounded-lg border border-accent/60 bg-accent/10 p-4 transition-colors hover:border-accent"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent text-on-accent">
          <Gamepad2 className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-display text-heading font-semibold text-ink">
            Leçons et mini-jeux
          </span>
          <span className="text-body text-muted">
            Quiz, vrai ou faux, associations, frises, devine l’année : choisis un parcours.
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
      </Link>

      <section aria-labelledby="bientot" className="flex flex-col gap-3">
        <h2 id="bientot" className="text-heading">
          Bientôt
        </h2>
        <ul className="flex flex-col gap-3">
          {upcoming.map(({ icon: Icon, title, text, phase }) => (
            <li
              key={title}
              className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="text-heading">{title}</h3>
                <p className="text-body text-muted">{text}</p>
              </div>
              <SoonBadge phase={phase} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

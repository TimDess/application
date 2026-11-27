import { BookOpen, Brain, Swords } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { brand } from '@/config/brand'
import { routes } from '@/config/routes'
import { AccountDeletedNotice } from './account-deleted-notice'

const pillars = [
  {
    icon: BookOpen,
    title: 'Apprends sans réviser',
    text: 'Des parcours courts et visuels qui t’emmènent des bases jusqu’aux détails que seuls les vrais connaissent.',
  },
  {
    icon: Brain,
    title: 'Retiens pour de bon',
    text: 'Ce que tu apprends revient au bon moment, sous une autre forme, jusqu’à ce que tu le maîtrises.',
  },
  {
    icon: Swords,
    title: 'Défie les autres',
    text: 'Défi du jour, ligues hebdomadaires et duels : ta culture devient un terrain de jeu.',
  },
]

const firstUniverses = [
  { name: 'Formule 1', detail: 'Stratégies, circuits, légendes' },
  { name: 'R&B et rap', detail: 'Artistes, albums, producteurs' },
  { name: 'Jeux vidéo', detail: 'Consoles, studios, licences' },
]

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 pt-10 pb-20 lg:pt-20">
      <Suspense fallback={null}>
        <AccountDeletedNotice />
      </Suspense>

      <section className="flex max-w-2xl flex-col gap-6">
        <p className="text-caption font-semibold tracking-[0.08em] text-accent-text uppercase">
          Culture · Jeu · Compétition
        </p>
        <h1 className="text-display lg:text-[3.25rem] lg:leading-[1.05]">{brand.tagline}</h1>
        <p className="max-w-xl text-heading font-normal text-muted">{brand.description}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={routes.signUp}>Créer mon compte</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={routes.signIn}>J’ai déjà un compte</Link>
          </Button>
        </div>
        <p className="text-caption text-muted">
          Kulto est en construction : les premiers parcours arrivent bientôt.
        </p>
      </section>

      <section aria-labelledby="piliers" className="flex flex-col gap-6">
        <h2 id="piliers" className="sr-only">
          Ce que tu fais sur {brand.name}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass flex flex-col gap-3 rounded-card p-5">
              <span className="grid size-10 place-items-center rounded-md bg-accent/15 text-accent-text">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-heading">{title}</h3>
              <p className="text-body text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="univers" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="univers" className="text-title">
            Les premiers univers
          </h2>
          <p className="text-body text-muted">
            Neuf univers au total, du cinéma à la géographie. On commence par ceux-là.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {firstUniverses.map((u) => (
            <li key={u.name} className="glass flex flex-col gap-1 rounded-card p-4">
              <span className="font-display text-heading font-semibold text-ink">{u.name}</span>
              <span className="text-caption text-muted">{u.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

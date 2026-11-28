import { Mascot } from '@/components/brand/mascot'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'
import { getMyProgress } from '@/features/gamification/queries'
import { MetaChips, PracticeNotice } from '@/features/practice/practice-notice'
import { PracticePlayer } from '@/features/practice/practice-player'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Révisions' }

export default function ReviewsPage() {
  return (
    <Suspense fallback={<BrandLoaderScreen label="Préparation des révisions" />}>
      <Reviews />
    </Suspense>
  )
}

async function Reviews() {
  await requireUser()
  const { reviews } = await getMyProgress()

  const idle =
    reviews.due === 0 ? (
      <PracticeNotice icon={<Mascot mood="happy" size={96} />} title="Rien à réviser">
        <p className="text-body text-muted">
          {reviews.known === 0
            ? 'Termine une leçon : ses notions reviendront ici au bon moment pour que tu ne les oublies pas.'
            : `Tes ${reviews.known} notions sont à jour. Ta mémoire te dit merci, les prochaines reviennent bientôt.`}
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href={reviews.known === 0 ? routes.explore : routes.dashboard}>
            {reviews.known === 0 ? 'Choisir une leçon' : 'Retour à l’accueil'}
          </Link>
        </Button>
      </PracticeNotice>
    ) : undefined

  const count = Math.max(1, Math.min(reviews.due, 10))
  return (
    <PracticePlayer
      kind="review"
      idle={idle}
      title="Révisions"
      intro="Les notions que tu risques d’oublier, posées autrement qu’en leçon."
      meta={
        <MetaChips
          items={[
            `${count} question${count > 1 ? 's' : ''}`,
            '2 à 3 min',
            '+5 XP par bonne réponse',
            '+30 XP à la fin',
          ]}
        />
      }
    />
  )
}

import { CalendarCheck, ChevronRight, Repeat2 } from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/config/routes'
import type { Progress } from '@/features/gamification/types'
import { cn } from '@/lib/utils/cn'

function ActionCard({
  href,
  icon,
  title,
  text,
  highlight,
  badge,
}: {
  href: string
  icon: React.ReactNode
  title: string
  text: string
  highlight: boolean
  badge?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'glass flex items-center gap-4 rounded-card p-4 transition-colors hover:border-line-strong',
        highlight && 'border-accent/60',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-[14px]',
          highlight ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted',
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 font-display text-heading font-semibold text-ink">
          {title}
          {badge ? (
            <span className="tabular rounded-full bg-accent/15 px-2 py-0.5 text-caption font-semibold text-accent-text">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="text-body text-muted">{text}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  )
}

/** The daily challenge and the reviews, as two entry cards. */
export function DailyCards({ progress }: { progress: Progress }) {
  const { daily, reviews } = progress
  const dailyText = !daily.available
    ? 'Disponible dès les premiers parcours publiés.'
    : daily.completed
      ? `Fait : ${daily.correct}/${daily.total}. Partage ton résultat !`
      : daily.started
        ? 'Tu l’as commencé : termine-le !'
        : '5 questions, les mêmes pour tout le monde.'
  const reviewText =
    reviews.due > 0
      ? `${reviews.due} notion${reviews.due > 1 ? 's' : ''} à revoir avant de les oublier.`
      : reviews.known > 0
        ? 'Tout est à jour. Reviens demain !'
        : 'Tes notions reviendront ici après tes leçons.'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ActionCard
        href={routes.daily}
        icon={<CalendarCheck className="size-5" aria-hidden="true" />}
        title="Défi du jour"
        text={dailyText}
        highlight={daily.available && !daily.completed}
        badge={daily.completed ? undefined : daily.available ? '+50 XP' : undefined}
      />
      <ActionCard
        href={routes.reviews}
        icon={<Repeat2 className="size-5" aria-hidden="true" />}
        title="Révisions"
        text={reviewText}
        highlight={reviews.due > 0}
        badge={reviews.due > 0 ? String(reviews.due) : undefined}
      />
    </div>
  )
}

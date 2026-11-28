'use client'

import { Check, Copy, Hourglass, RotateCcw, Share2, Trophy, X as Cross } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { confetti, feedback } from '@/lib/sensations'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { brand } from '@/config/brand'
import { duelInvitePath, duelPath, routes } from '@/config/routes'
import { voice } from '@/config/voice'
import { cn } from '@/lib/utils/cn'
import { createDuelAction } from './actions'
import type { DuelDetail } from './types'

const resultTitles = { win: voice.duel.win, loss: voice.duel.loss, draw: voice.duel.draw } as const
/** A win by less than this many points is a « clutch » win. */
const CLUTCH_MARGIN = 60

export function DuelOutcome({
  duel,
  me,
  headingRef,
}: {
  duel: DuelDetail
  me: { name: string; avatarKey: string }
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const opponentName = duel.opponent?.username ?? 'Adversaire'

  // Celebrate once when the result is shown.
  useEffect(() => {
    if (duel.status !== 'completed') return
    if (duel.result === 'win') {
      feedback('victory')
      const t = setTimeout(() => confetti(), 300)
      return () => clearTimeout(t)
    }
    feedback(duel.result === 'loss' ? 'defeat' : 'correct')
  }, [duel.status, duel.result])

  function rematch() {
    setError(undefined)
    startTransition(async () => {
      const res = await createDuelAction('rematch', duel.id)
      if (!res.ok) return setError(res.message)
      router.push(duelPath(res.data.duelId))
    })
  }

  const margin = duel.me.score - (duel.opponentProgress?.score ?? 0)
  const clutch = duel.result === 'win' && margin < CLUTCH_MARGIN
  const title =
    duel.status === 'completed' && duel.result
      ? clutch
        ? voice.duel.clutch
        : resultTitles[duel.result]
      : duel.status === 'expired'
        ? 'Défi expiré'
        : duel.status === 'cancelled'
          ? 'Duel annulé'
          : 'Manche terminée'

  return (
    <div className="step-in flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <span
          className={cn(
            'grid size-16 place-items-center rounded-full',
            duel.result === 'win' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink',
          )}
        >
          {duel.status === 'completed' ? (
            <Trophy className="size-8" aria-hidden="true" />
          ) : (
            <Hourglass className="size-8" aria-hidden="true" />
          )}
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="text-title outline-none">
          {title}
        </h1>
        <p className="max-w-sm text-body text-muted">
          {duel.status === 'completed'
            ? duel.result === 'win'
              ? `${opponentName} n’a rien pu faire. +20 XP.`
              : duel.result === 'draw'
                ? `Pile le même score que ${opponentName}. Bizarre, non ? +10 XP.`
                : `${opponentName} t’a eu. La revanche t’attend. +10 XP.`
            : duel.status === 'expired'
              ? 'Personne n’a relevé ce défi à temps.'
              : duel.status === 'cancelled'
                ? 'Aucun des deux joueurs n’a terminé sa manche à temps.'
                : duel.opponent
                  ? `À ${opponentName} de jouer. Tu verras le résultat dans Jouer.`
                  : duel.mode === 'link'
                    ? 'Envoie le lien du défi : la première personne qui le relève devient ton adversaire.'
                    : 'On cherche un adversaire de ton niveau. Tu verras le résultat dans Jouer.'}
        </p>
      </div>

      <div className="glass flex items-start gap-4 rounded-hero p-5">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <Avatar avatarKey={me.avatarKey} name={me.name} size="lg" />
          <span className="max-w-full truncate text-body font-semibold text-ink">Toi</span>
          <span className="tabular font-display text-title font-bold text-ink">
            {duel.me.score.toLocaleString('fr-FR')}
          </span>
          <span className="text-caption text-muted">
            {duel.me.correct}/{duel.total} bonnes réponses
          </span>
        </div>
        <span className="self-center font-display text-heading font-bold text-muted">VS</span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <Avatar
            avatarKey={duel.opponent?.avatarKey ?? 'soleil'}
            name={duel.opponent?.username ?? '?'}
            size="lg"
          />
          <span className="max-w-full truncate text-body font-semibold text-ink">
            {duel.opponent?.username ?? 'En attente'}
          </span>
          <span className="tabular font-display text-title font-bold text-ink">
            {duel.opponentProgress?.score == null
              ? '?'
              : duel.opponentProgress.score.toLocaleString('fr-FR')}
          </span>
          <span className="text-caption text-muted">
            {duel.opponentProgress?.correct == null
              ? duel.opponentProgress?.finished
                ? 'A joué'
                : 'Pas encore joué'
              : `${duel.opponentProgress.correct}/${duel.total} bonnes réponses`}
          </span>
        </div>
      </div>

      {duel.rounds && duel.rounds.length > 0 ? (
        <section aria-labelledby="manches" className="flex flex-col gap-2">
          <h2 id="manches" className="text-heading">
            Question par question
          </h2>
          <ol className="glass divide-y divide-line rounded-card">
            {duel.rounds.map((r) => (
              <li key={r.position} className="flex items-center gap-3 px-4 py-3">
                <RoundMark round={r.mine} who="Toi" />
                <span className="min-w-0 flex-1 text-caption text-ink">{r.prompt}</span>
                <RoundMark round={r.theirs} who={opponentName} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {duel.inviteCode && !duel.opponent && duel.status === 'open' ? (
        <InviteShare code={duel.inviteCode} score={duel.me.score} />
      ) : null}

      <FormMessage tone="error">{error}</FormMessage>
      <div className="mt-auto flex flex-col gap-3">
        {duel.status === 'completed' && duel.opponent ? (
          <Button size="lg" loading={pending} onClick={rematch}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Revanche
          </Button>
        ) : null}
        <Button asChild size="lg" variant="secondary">
          <Link href={routes.play}>Retour aux duels</Link>
        </Button>
      </div>
    </div>
  )
}

function RoundMark({
  round,
  who,
}: {
  round: { correct: boolean; points: number } | null
  who: string
}) {
  if (!round) {
    return (
      <span className="tabular w-14 text-center text-caption text-muted">
        –<span className="sr-only"> {who} : pas de réponse</span>
      </span>
    )
  }
  return (
    <span
      className={cn(
        'tabular flex w-14 items-center justify-center gap-1 text-caption font-semibold',
        round.correct ? 'text-success' : 'text-danger',
      )}
    >
      {round.correct ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Cross className="size-3.5" aria-hidden="true" />
      )}
      {round.points}
      <span className="sr-only">
        {' '}
        {who} : {round.correct ? 'juste' : 'faux'}
      </span>
    </span>
  )
}

function InviteShare({ code, score }: { code: string; score: number }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function share() {
    const url = `${window.location.origin}${duelInvitePath(code)}`
    const text = `Je te défie sur ${brand.name} : bats mes ${score.toLocaleString('fr-FR')} points !`
    try {
      if (navigator.share) {
        await navigator.share({ title: `Défi ${brand.name}`, text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setFailed(true)
    }
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-card border-accent/50 p-4">
      <p className="text-body text-ink">
        <span className="font-semibold">Ton défi est prêt.</span> Envoie-le à un ami : il jouera les
        mêmes questions, avec ou sans compte.
      </p>
      <Button size="lg" onClick={share}>
        {copied ? (
          <Copy className="size-4" aria-hidden="true" />
        ) : (
          <Share2 className="size-4" aria-hidden="true" />
        )}
        {copied ? 'Lien copié !' : 'Envoyer le défi'}
      </Button>
      <p role="status" className="text-center text-caption text-muted">
        {failed ? 'Le partage n’est pas disponible sur cet appareil.' : ''}
      </p>
    </div>
  )
}

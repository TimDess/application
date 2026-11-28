import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { duelPath } from '@/config/routes'
import { cn } from '@/lib/utils/cn'
import type { DuelSummary } from './types'

const resultLabels = { win: 'Victoire', loss: 'Défaite', draw: 'Égalité' } as const

function status(d: DuelSummary): { text: string; yourTurn: boolean } {
  if (d.status === 'completed' && d.result) {
    return {
      text: `${resultLabels[d.result]} · ${d.me.score.toLocaleString('fr-FR')} à ${(d.opponentProgress?.score ?? 0).toLocaleString('fr-FR')}`,
      yourTurn: false,
    }
  }
  if (d.status === 'expired')
    return { text: 'Défi expiré, personne ne l’a relevé', yourTurn: false }
  if (d.status === 'cancelled') return { text: 'Duel annulé', yourTurn: false }
  if (!d.me.finished) return { text: 'À toi de jouer', yourTurn: true }
  if (!d.opponent) {
    return {
      text: d.mode === 'link' ? 'En attente : envoie le lien du défi' : 'Recherche d’un adversaire',
      yourTurn: false,
    }
  }
  return { text: `À ${d.opponent.username ?? 'ton adversaire'} de jouer`, yourTurn: false }
}

export function DuelList({ duels }: { duels: DuelSummary[] }) {
  if (duels.length === 0) {
    return (
      <p className="glass rounded-card p-4 text-body text-muted">
        Aucun duel pour l’instant. Lance un duel rapide ou défie un ami !
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {duels.map((d) => {
        const s = status(d)
        const name =
          d.opponent?.username ?? (d.mode === 'link' ? 'Défi par lien' : 'Adversaire à venir')
        return (
          <li key={d.id}>
            <Link
              href={duelPath(d.id)}
              className={cn(
                'glass flex items-center gap-3 rounded-card p-3 transition-colors hover:border-line-strong',
                s.yourTurn && 'border-accent/60',
              )}
            >
              <Avatar
                avatarKey={d.opponent?.avatarKey ?? 'soleil'}
                name={d.opponent?.username ?? '?'}
                size="md"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-ink">{name}</span>
                <span
                  className={cn(
                    'text-caption',
                    s.yourTurn ? 'font-semibold text-accent-text' : 'text-muted',
                  )}
                >
                  {s.text}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

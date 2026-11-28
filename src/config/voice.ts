/**
 * Kulto's voice: direct, close to the player, a touch of humour (identity lab,
 * 28 November 2026). Interface copy that carries personality lives here so the
 * tone stays consistent. Always tutoiement, never guilt-tripping.
 */

function pick(lines: readonly string[], seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0
  return lines[Math.abs(h) % lines.length]!
}

const correct = ['Bien vu !', 'Exact !', 'Carton plein !', 'Tu gères.', 'Dans le mille !'] as const
const wrong = [
  'Raté, mais maintenant tu sais.',
  'Pas cette fois. Retiens bien celle-là.',
  'Aïe. Celle-là, on la revoit bientôt.',
] as const

/** Title of the feedback panel after an answer. `seed` varies the line per question. */
export function answerTitle(r: { isCorrect: boolean; score: number }, seed: string) {
  if (r.isCorrect) return pick(correct, seed)
  if (r.score > 0) return 'Pas loin. La prochaine est pour toi.'
  return pick(wrong, seed)
}

export const voice = {
  timeUp: 'Trop tard ! Le chrono a gagné celle-là.',
  lesson: {
    perfect: 'Sans faute. Tu régales.',
    done: 'Leçon bouclée.',
    rough: 'Celle-là t’a eu. On la retente ?',
  },
  review: { perfect: 'Révision parfaite. Ta mémoire est en feu.', done: 'Révision bouclée.' },
  daily: { done: 'Défi du jour bouclé.' },
  levelUp: 'Ta culture prend du muscle. Personne ne t’arrête.',
  duel: {
    win: 'Victoire !',
    clutch: 'Clutch ! Gagné sur le fil.',
    loss: 'Perdu, cette fois.',
    draw: 'Égalité parfaite.',
  },
  league: {
    first: 'Pole position !',
    promoted: (d: string) => `${d}, te voilà ! Les autres n’ont qu’à bien se tenir.`,
    stayed: (d: string) => `Tu restes en ${d}. Cette semaine, on vise plus haut.`,
    relegated: (d: string) => `Retour en ${d}. Simple coup de frein, on remonte cette semaine ?`,
  },
} as const

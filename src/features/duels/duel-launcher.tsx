'use client'

import { Link2, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { duelPath } from '@/config/routes'
import { createDuelAction } from './actions'

/** Two ways to start: matchmaking with a player of your level, or a link to send. */
export function DuelLauncher() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [which, setWhich] = useState<'quick' | 'link' | null>(null)
  const [error, setError] = useState<string>()

  function start(mode: 'quick' | 'link') {
    setError(undefined)
    setWhich(mode)
    startTransition(async () => {
      const res = await createDuelAction(mode)
      if (!res.ok) {
        setWhich(null)
        return setError(res.message)
      }
      router.push(duelPath(res.data.duelId))
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          loading={pending && which === 'quick'}
          disabled={pending}
          onClick={() => start('quick')}
        >
          <Zap className="size-4" aria-hidden="true" />
          Duel rapide
        </Button>
        <Button
          size="lg"
          variant="secondary"
          loading={pending && which === 'link'}
          disabled={pending}
          onClick={() => start('link')}
        >
          <Link2 className="size-4" aria-hidden="true" />
          Défier un ami
        </Button>
      </div>
      <FormMessage tone="error">{error}</FormMessage>
    </div>
  )
}

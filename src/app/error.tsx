'use client'

import { Button } from '@/components/ui/button'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-title">Quelque chose s’est mal passé</h1>
        <p className="text-body text-muted">
          Le chargement a échoué. Vérifie ta connexion, puis réessaie. Si le problème continue,
          reviens dans quelques minutes.
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  )
}

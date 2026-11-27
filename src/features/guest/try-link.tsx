import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { routes } from '@/config/routes'

/** "Or try without an account": shown under the sign-up and sign-in forms. */
export function TryWithoutAccount() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-caption text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button asChild size="lg" variant="secondary">
        <Link href={routes.trial}>Essayer sans compte</Link>
      </Button>
    </div>
  )
}

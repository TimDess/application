import { MailCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { routes } from '@/config/routes'
import { AuthHeading } from '@/features/auth/auth-heading'
import { ResendConfirmationForm } from '@/features/auth/forms'

export const metadata: Metadata = { title: 'Vérifie tes emails' }

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <span className="grid size-12 place-items-center rounded-full bg-accent/15 text-accent-text">
        <MailCheck className="size-6" aria-hidden="true" />
      </span>
      <AuthHeading
        title="Vérifie tes emails"
        description="On vient de t’envoyer un lien de confirmation. Clique dessus pour activer ton compte. Pense à regarder dans les spams."
      />
      <details className="glass rounded-card p-4">
        <summary className="cursor-pointer text-body font-medium text-ink">
          Tu n’as rien reçu ?
        </summary>
        <div className="mt-4">
          <ResendConfirmationForm />
        </div>
      </details>
      <Link
        href={routes.signIn}
        className="text-center text-body font-semibold text-ink hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}

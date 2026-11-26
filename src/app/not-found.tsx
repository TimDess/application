import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <Logo />
      <div className="flex flex-col gap-2">
        <p className="text-caption font-semibold tracking-[0.08em] text-muted uppercase">
          Erreur 404
        </p>
        <h1 className="text-title">Cette page n’existe pas</h1>
        <p className="text-body text-muted">
          Le lien est peut-être ancien, ou l’adresse contient une faute de frappe.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Revenir à l’accueil</Link>
      </Button>
    </main>
  )
}

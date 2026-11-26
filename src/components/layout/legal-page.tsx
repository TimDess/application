import type { ReactNode } from 'react'

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-body text-ink">
        Document provisoire, à faire valider juridiquement avant l’ouverture publique.
      </div>
      <header className="flex flex-col gap-1">
        <h1 className="text-title lg:text-[1.75rem]">{title}</h1>
        <p className="text-caption text-muted">Dernière mise à jour : {updated}</p>
      </header>
      <div className="flex flex-col gap-5 text-body leading-relaxed text-ink [&_h2]:mt-4 [&_h2]:text-heading [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:text-muted">
        {children}
      </div>
    </article>
  )
}

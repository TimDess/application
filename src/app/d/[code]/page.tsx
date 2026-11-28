import { Swords } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { BrandLoaderScreen } from '@/components/ui/brand-loader'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { brand } from '@/config/brand'
import { duelInvitePath, duelPath, routes } from '@/config/routes'
import { joinDuelAction } from '@/features/duels/actions'
import { getDuelInvite } from '@/features/duels/queries'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Défi',
  description: `Relève le défi sur ${brand.name} : les mêmes questions, le meilleur score gagne.`,
}

/** Public landing of a duel invite link, signed in or not. */
export default function DuelInvitePage({ params, searchParams }: PageProps<'/d/[code]'>) {
  return (
    <Suspense fallback={<BrandLoaderScreen label="Chargement du défi" />}>
      <Invite params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Invite({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ code }, query, user] = await Promise.all([params, searchParams, getSessionUser()])
  const clean = code.toLowerCase()
  const invite = /^[a-z0-9]{8}$/.test(clean) ? await getDuelInvite(clean) : null
  const here = duelInvitePath(clean)

  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -right-32 -z-10 size-96 rounded-full bg-accent opacity-20 blur-[90px]"
      />
      {!invite ? (
        <>
          <h1 className="text-title">Défi introuvable</h1>
          <p className="text-body text-muted">Ce lien de défi n’existe pas ou plus.</p>
          <Button asChild size="lg" className="w-full">
            <Link href={user ? routes.play : routes.home}>Découvrir {brand.name}</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            <Avatar avatarKey={invite.creatorAvatar} name={invite.creatorName ?? '?'} size="xl" />
            <span className="grid size-10 place-items-center rounded-full bg-accent text-on-accent">
              <Swords className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-title">
              {invite.creatorName ? `${invite.creatorName} te défie !` : 'On te défie !'}
            </h1>
            <p className="text-body text-muted">
              7 questions de culture, 15 secondes chacune. Les mêmes questions pour vous deux : le
              meilleur score gagne.
            </p>
          </div>
          {query.erreur ? (
            <FormMessage tone="error">Ce défi a déjà été relevé par quelqu’un d’autre.</FormMessage>
          ) : null}
          {invite.duelId ? (
            <Button asChild size="lg" className="w-full">
              <Link href={duelPath(invite.duelId)}>Ouvrir le duel</Link>
            </Button>
          ) : !invite.joinable ? (
            <>
              <p className="text-body text-muted">Ce défi a déjà été relevé ou a expiré.</p>
              <Button asChild size="lg" className="w-full">
                <Link href={user ? routes.play : routes.trial}>
                  {user ? 'Lancer un autre duel' : 'Essayer sans compte'}
                </Link>
              </Button>
            </>
          ) : user ? (
            <form action={joinDuelAction} className="w-full">
              <input type="hidden" name="code" value={clean} />
              <Button type="submit" size="lg" className="w-full">
                Relever le défi
              </Button>
            </form>
          ) : (
            <div className="flex w-full flex-col gap-3">
              <Button asChild size="lg">
                <Link href={`${routes.trial}?next=${encodeURIComponent(here)}`}>
                  Jouer sans compte
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`${routes.signIn}?next=${encodeURIComponent(here)}`}>
                  J’ai déjà un compte
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}

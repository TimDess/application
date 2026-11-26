import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/config/routes'
import { getViewer } from '@/lib/auth/session'

export async function SidebarUser() {
  const viewer = await getViewer()
  return (
    <Link
      href={routes.profile}
      className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-2"
    >
      <Avatar avatarKey={viewer.avatarKey} name={viewer.username} size="sm" />
      <span className="min-w-0 truncate text-body font-medium text-ink">
        {viewer.username ?? 'Mon profil'}
      </span>
    </Link>
  )
}

export function SidebarUserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

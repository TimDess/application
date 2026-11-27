import type { ReactNode } from 'react'

/** Templates remount on every navigation: each page fades up gently. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>
}

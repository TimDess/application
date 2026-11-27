'use client'

import { useSearchParams } from 'next/navigation'
import { FormMessage } from '@/components/ui/form-message'

export function AccountDeletedNotice() {
  const params = useSearchParams()
  if (params.get('compte') !== 'supprime') return null
  return (
    <FormMessage tone="success">Ton compte et toutes tes données ont été supprimés.</FormMessage>
  )
}

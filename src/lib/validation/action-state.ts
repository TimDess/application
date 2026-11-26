import type { z } from 'zod'

export type ActionState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  /** Non-sensitive submitted values, to refill the form after an error. Never passwords. */
  values?: Record<string, string>
}

export const idle: ActionState = { status: 'idle' }

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export function invalid(error: z.ZodError, values?: Record<string, string>): ActionState {
  return {
    status: 'error',
    message: 'Vérifie les champs en rouge.',
    fieldErrors: fieldErrorsFrom(error),
    values,
  }
}

export function failure(message: string, values?: Record<string, string>): ActionState {
  return { status: 'error', message, values }
}

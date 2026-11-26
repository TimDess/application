import { z } from 'zod'
import { avatarKeys } from '@/config/avatars'
import {
  dailyGoals,
  isReservedUsername,
  profileVisibilities,
  selfLevels,
  themePreferences,
} from '@/config/product'

const goalValues = dailyGoals.map((g) => g.minutes)

export const usernameSchema = z
  .string()
  .trim()
  .min(3, '3 caractères minimum.')
  .max(20, '20 caractères maximum.')
  .regex(/^[A-Za-z0-9_]+$/, 'Lettres sans accents, chiffres et _ uniquement.')
  .refine((u) => !isReservedUsername(u), 'Ce pseudo est réservé.')

export const dailyGoalSchema = z.coerce
  .number()
  .refine((n) => (goalValues as number[]).includes(n), 'Choisis un objectif dans la liste.')

export const selfLevelSchema = z.enum(selfLevels.map((l) => l.value) as [string, ...string[]])

export const universeChoiceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  level: selfLevelSchema,
})

export const universeChoicesSchema = z
  .array(universeChoiceSchema)
  .min(1, 'Choisis au moins un univers.')
  .max(20)
  .refine((list) => new Set(list.map((u) => u.slug)).size === list.length, 'Univers en double.')

export const onboardingSchema = z.object({
  username: usernameSchema,
  avatarKey: z.enum(avatarKeys),
  dailyGoal: dailyGoalSchema,
  universes: universeChoicesSchema,
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

export const settingsSchema = z
  .object({
    theme: z.enum(themePreferences.map((t) => t.value) as [string, ...string[]]),
    reducedMotion: z.boolean(),
    soundEnabled: z.boolean(),
    hapticsEnabled: z.boolean(),
    dailyGoal: dailyGoalSchema,
    showInLeaderboards: z.boolean(),
    visibility: z.enum(profileVisibilities.map((v) => v.value) as [string, ...string[]]),
    avatarKey: z.enum(avatarKeys),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucune modification.')

export type SettingsInput = z.infer<typeof settingsSchema>

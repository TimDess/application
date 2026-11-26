import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Saisis une adresse email valide.'))

/** Mirrors the Supabase Auth policy: 8+ characters with letters and digits (72 = bcrypt limit). */
export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères.')
  .max(72, '72 caractères maximum.')
  .regex(/[A-Za-z]/, 'Au moins une lettre.')
  .regex(/\d/, 'Au moins un chiffre.')

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  ageConfirmed: z.literal('on', 'Kulto est réservé aux personnes de 15 ans ou plus.'),
  termsAccepted: z.literal('on', 'Accepte les conditions pour créer ton compte.'),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Saisis ton mot de passe.'),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

const passwordsMatch = {
  path: ['confirm'],
  message: 'Les deux mots de passe ne correspondent pas.',
}

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, passwordsMatch)

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Saisis ton mot de passe actuel.'),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, passwordsMatch)

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Saisis ton mot de passe.'),
  confirmation: z.literal('SUPPRIMER', 'Écris SUPPRIMER en majuscules pour confirmer.'),
})

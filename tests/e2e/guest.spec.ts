import { expect, test } from '@playwright/test'
import {
  completeOnboarding,
  dismissLevelUp,
  PASSWORD,
  playToEnd,
  readAuthLink,
  signIn,
  signOut,
  uniqueEmail,
  uniqueUsername,
} from './helpers'

test('a guest plays first, then saves the progress into an account', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Essayer sans compte' }).click()
  await expect(page).toHaveURL(/\/essai$/)

  await page.getByRole('button', { name: 'Commencer sans compte' }).click()
  await expect(page.getByText(/réservé aux personnes de 15 ans/)).toBeVisible()
  await page.getByLabel(/ans ou plus/).check()
  await page.getByLabel(/J’accepte les/).check()
  await page.getByRole('button', { name: 'Commencer sans compte' }).click()

  await completeOnboarding(page, uniqueUsername())
  await expect(page.getByRole('link', { name: /Tu joues en invité/ })).toBeVisible()

  await page.goto('/lecon/f1-qu-est-ce-que-la-f1')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await playToEnd(page)
  await dismissLevelUp(page)
  await page.getByRole('link', { name: 'Créer mon compte' }).click()
  await expect(page).toHaveURL(/\/sauvegarder$/)
  await expect(page.getByText(/ta série de 1 jour/)).toBeVisible()

  const email = uniqueEmail('guest')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sauvegarder ma progression' }).click()
  await expect(page.getByText(/ouvre l’email envoyé à/)).toBeVisible()

  // Confirming the address makes the account permanent (same user, same progress).
  const link = await readAuthLink(email)
  await page.request.get(link, { maxRedirects: 0 }).catch(() => undefined)

  await signOut(page)
  await signIn(page, email)
  await expect(page).toHaveURL(/\/accueil$/)
  await expect(page.getByText('Série de 1 jour')).toBeVisible()
  await expect(page.getByRole('link', { name: /Tu joues en invité/ })).toHaveCount(0)
})

test('visitors can open the guest trial', async ({ page }) => {
  await page.goto('/essai')
  await expect(page.getByRole('button', { name: 'Commencer sans compte' })).toBeVisible()
})

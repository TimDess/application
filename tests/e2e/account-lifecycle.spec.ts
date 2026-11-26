import { expect, test } from '@playwright/test'
import {
  PASSWORD,
  completeOnboarding,
  confirmEmail,
  readAuthLink,
  signIn,
  signOut,
  signUp,
  uniqueEmail,
  uniqueUsername,
} from './helpers'

test.describe('Phase 1 acceptance: sign up, onboard, sign back in and find everything again', () => {
  test('full account lifecycle', async ({ page }) => {
    const email = uniqueEmail('life')
    const username = uniqueUsername()

    await signUp(page, email)
    await confirmEmail(page, email)
    await completeOnboarding(page, username)

    await expect(page.getByRole('heading', { name: `Salut ${username}` })).toBeVisible()
    await expect(page.getByText('Objectif passionné : 15 min par jour.')).toBeVisible()
    const favorites = page.getByRole('region', { name: 'Tes univers' })
    await expect(favorites.getByText('Sport automobile')).toBeVisible()
    await expect(favorites.getByText('Expert')).toBeVisible()

    // Change a setting, then check it survives a full sign-out / sign-in.
    await page.goto('/parametres')
    await page.getByText('Clair', { exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Enregistré.' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await signOut(page)
    await page.context().clearCookies()

    await signIn(page, email)
    await expect(page).toHaveURL(/\/accueil$/)
    await expect(page.getByRole('heading', { name: `Salut ${username}` })).toBeVisible()
    // The saved theme is re-applied on a device that had no cookie.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.goto('/profil')
    await expect(page.getByRole('main').getByText(username, { exact: true })).toBeVisible()
    await expect(page.getByText('15 min par jour')).toBeVisible()

    // Export contains the account data and never a password.
    const exportRes = await page.request.get('/api/compte/export')
    expect(exportRes.status()).toBe(200)
    const exported = await exportRes.json()
    expect(exported.profile.username).toBe(username)
    expect(JSON.stringify(exported)).not.toContain(PASSWORD)

    // Delete the account: data is gone and the credentials stop working.
    await page.goto('/parametres/compte')
    await page.getByLabel('Ton mot de passe').fill(PASSWORD)
    await page.getByLabel('Écris SUPPRIMER pour confirmer').fill('SUPPRIMER')
    await page.getByRole('button', { name: 'Supprimer définitivement mon compte' }).click()
    await expect(page).toHaveURL(/\/\?compte=supprime$/)
    await expect(
      page.getByText('Ton compte et toutes tes données ont été supprimés.'),
    ).toBeVisible()

    await signIn(page, email)
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'Email ou mot de passe incorrect.',
    )
  })

  test('password reset by email', async ({ page }) => {
    const email = uniqueEmail('reset')
    await signUp(page, email)
    await confirmEmail(page, email)
    await completeOnboarding(page, uniqueUsername())
    await signOut(page)

    await page.goto('/mot-de-passe-oublie')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Envoyer le lien' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText('Si un compte existe')

    await page.goto(await readAuthLink(email, 'Réinitialise'))
    await expect(page).toHaveURL(/\/reinitialiser-mot-de-passe$/)
    await page.getByLabel('Nouveau mot de passe').fill('nouveau2026mdp')
    await page.getByLabel('Confirme le mot de passe').fill('nouveau2026mdp')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'Ton mot de passe a été modifié.',
    )

    await signOut(page)
    await signIn(page, email, 'nouveau2026mdp')
    await expect(page).toHaveURL(/\/accueil$/)
  })
})

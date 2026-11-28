import { expect, test } from '@playwright/test'
import {
  answerCurrentQuestion,
  completeOnboarding,
  confirmEmail,
  dismissLevelUp,
  signUp,
  uniqueEmail,
  uniqueUsername,
} from './helpers'

test('the daily challenge brings a player into the weekly league', async ({ page }) => {
  const email = uniqueEmail('league')
  const username = uniqueUsername()
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, username)

  await page.goto('/ligue')
  await expect(page.getByText('Rejoins la ligue de la semaine')).toBeVisible()
  await expect(page.getByText('Bronze').first()).toBeVisible()

  await page.goto('/defi')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  for (let i = 0; i < 6; i++) {
    await answerCurrentQuestion(page)
    const last = page.getByRole('button', { name: 'Voir mon résultat' })
    if (await last.isVisible()) {
      await last.click()
      break
    }
    const prompt = await page.getByRole('main').getByRole('heading').first().textContent()
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await expect(
      page.getByRole('main').getByRole('heading', { name: prompt ?? '', exact: true }),
    ).toBeHidden()
  }
  await expect(page.getByRole('heading', { name: 'Défi du jour terminé' })).toBeVisible()
  await dismissLevelUp(page)

  await page.goto('/ligue')
  await expect(page.getByRole('heading', { name: 'Classement de ton groupe' })).toBeVisible()
  const me = page.getByRole('listitem').filter({ hasText: `${username} (toi)` })
  await expect(me).toContainText('20 pts')
})

test('guests are invited to create an account to join the league', async ({ page }) => {
  await page.goto('/essai')
  await page.getByLabel(/ans ou plus/).check()
  await page.getByLabel(/J’accepte les/).check()
  await page.getByRole('button', { name: 'Commencer sans compte' }).click()
  await completeOnboarding(page, uniqueUsername())
  await page.goto('/ligue')
  await expect(page.getByText('Les ligues sont réservées aux comptes.')).toBeVisible()
})

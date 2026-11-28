import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import {
  answerCurrentQuestion,
  completeOnboarding,
  confirmEmail,
  dismissLevelUp,
  playToEnd,
  signUp,
  uniqueEmail,
  uniqueUsername,
} from './helpers'

const DB_URL = process.env.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

/** Answers every question of a review or daily challenge until the result screen. */
async function playPractice(page: import('@playwright/test').Page, resultTitle: RegExp) {
  for (let i = 0; i < 12; i++) {
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
  await expect(page.getByRole('heading', { name: resultTitle })).toBeVisible()
}

test('the daily challenge is played once, then shared', async ({ page }) => {
  const email = uniqueEmail('daily')
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, uniqueUsername())

  await page
    .getByRole('link', { name: /Défi du jour/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/defi$/)
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await expect(page.getByText('Question 1 sur 5').or(page.getByText('1/5'))).toBeVisible()
  await playPractice(page, /Défi du jour bouclé/)
  await expect(
    page.getByRole('listitem').filter({ hasText: /Défi du jour terminé\s*\+50/ }),
  ).toBeVisible()
  await dismissLevelUp(page)
  await expect(page.getByRole('button', { name: 'Partager mon résultat' })).toBeVisible()

  await page.goto('/defi')
  await expect(page.getByRole('heading', { name: /Défi du jour (terminé|bouclé)/ })).toBeVisible()
  await expect(page.getByText(/^\d\/5$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'C’est parti' })).toHaveCount(0)
})

test('notions seen in a lesson come back in reviews', async ({ page }) => {
  const email = uniqueEmail('review')
  const username = uniqueUsername()
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, username)

  await page.goto('/revisions')
  await expect(page.getByRole('heading', { name: 'Rien à réviser' })).toBeVisible()

  await page.goto('/lecon/f1-qu-est-ce-que-la-f1')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await playToEnd(page)
  await dismissLevelUp(page)

  await page.goto('/revisions')
  await expect(page.getByText(/notions sont à jour/)).toBeVisible()

  // Time travel: the notions of the lesson are due tomorrow; make them due today.
  execFileSync('psql', [
    DB_URL,
    '-X',
    '-q',
    '-c',
    `update public.user_knowledge_state set due_on = current_date - 1 where user_id = (select id from public.profiles where username = '${username}')`,
  ])

  await page.goto('/accueil')
  await expect(page.getByRole('link', { name: /Révisions.*à revoir/ })).toBeVisible()
  await page.goto('/revisions')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await playPractice(page, /Révision (parfaite|bouclée)/)
  await expect(
    page.getByRole('listitem').filter({ hasText: /Révision terminée\s*\+30/ }),
  ).toBeVisible()
})

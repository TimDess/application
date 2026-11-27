import { expect, test, type Page } from '@playwright/test'
import { completeOnboarding, confirmEmail, signUp, uniqueEmail, uniqueUsername } from './helpers'

/** Answers whatever question is on screen (correctness does not matter here). */
async function answerCurrentQuestion(page: Page) {
  const main = page.getByRole('main')
  const format = (await main.locator('p.text-caption').first().textContent())?.trim()
  switch (format) {
    case 'Quiz':
      await main.getByRole('radio').first().click()
      await main.getByRole('button', { name: 'Valider', exact: true }).click()
      break
    case 'Vrai ou faux':
      await main.getByRole('button', { name: /^Vrai/ }).click()
      break
    case 'Associations': {
      const left = main.getByRole('group', { name: 'Éléments à associer' }).getByRole('button')
      const right = main.getByRole('group', { name: 'Partenaires' }).getByRole('button')
      const n = await left.count()
      for (let i = 0; i < n; i++) {
        await left.nth(i).click()
        await right.nth(i).click()
      }
      await main.getByRole('button', { name: 'Valider', exact: true }).click()
      break
    }
    case 'Frise chronologique':
      await main.getByRole('button', { name: 'Valider l’ordre' }).click()
      break
    case 'Devine l’année':
      await main.getByRole('button', { name: /^Valider \d+/ }).click()
      break
    default:
      throw new Error(`Unknown question format: ${format}`)
  }
  await expect(
    main.getByRole('status').filter({ hasText: /Bonne réponse|Presque|Pas tout à fait/ }),
  ).toBeVisible()
}

async function playToEnd(page: Page) {
  const main = page.getByRole('main')
  for (let i = 0; i < 20; i++) {
    const nextCard = main.getByRole('button', { name: /^(Suivant|Passer aux questions)/ })
    if (await nextCard.isVisible().catch(() => false)) {
      const title = await main
        .getByRole('heading')
        .nth(1)
        .textContent()
        .catch(() => null)
      await nextCard.click()
      if (title) await expect(main.getByRole('heading', { name: title, exact: true })).toBeHidden()
      continue
    }
    if (
      await main
        .getByRole('heading', { name: /Sans faute|Leçon terminée/ })
        .isVisible()
        .catch(() => false)
    )
      return
    const heading = main.getByRole('heading').first()
    const before = await heading.textContent()
    await answerCurrentQuestion(page)
    await main.getByRole('button', { name: /^(Continuer|Voir mon résultat)$/ }).click()
    await expect(heading).not.toHaveText(before ?? '')
  }
  throw new Error('Lesson did not finish')
}

test('play the first F1 lesson, then find the progress again', async ({ page }) => {
  const email = uniqueEmail('lesson')
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, uniqueUsername())

  const continueRegion = page.getByRole('region', { name: 'Continue ton aventure' })
  await expect(continueRegion.getByText('Qu’est-ce que la F1 ?')).toBeVisible()
  await continueRegion.getByRole('link', { name: 'Commencer' }).click()

  await expect(page).toHaveURL(/\/lecon\/f1-qu-est-ce-que-la-f1$/)
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await expect(page.getByRole('heading', { name: 'Un championnat du monde' })).toBeVisible()
  await playToEnd(page)
  await expect(page.getByText(/bonnes? réponses? sur 6/)).toBeVisible()

  await page.getByRole('button', { name: /Leçon suivante : Le week-end de Grand Prix/ }).waitFor()
  await page.getByRole('link', { name: 'Retour au parcours' }).click()
  await expect(page).toHaveURL(/\/parcours\/comprendre-la-f1$/)
  await expect(page.getByText('1/12 leçons')).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Le week-end de Grand Prix.*disponible/ }),
  ).toBeVisible()

  await page.goto('/accueil')
  await expect(continueRegion.getByText('Le week-end de Grand Prix')).toBeVisible()
  await expect(continueRegion.getByRole('link', { name: 'Reprendre' })).toBeVisible()
})

test('an interrupted lesson resumes where it stopped, and later lessons stay locked', async ({
  page,
}) => {
  const email = uniqueEmail('resume')
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, uniqueUsername())

  await page.goto('/lecon/f1-epreuve-strategies')
  await expect(page.getByRole('heading', { name: 'Leçon verrouillée' })).toBeVisible()

  await page.goto('/lecon/f1-qu-est-ce-que-la-f1')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: /^(Suivant|Passer aux questions)/ }).click()
  const firstPrompt = await page.getByRole('main').getByRole('heading').first().textContent()
  await answerCurrentQuestion(page)

  await page.getByRole('link', { name: /Quitter la leçon/ }).click()
  await expect(page).toHaveURL(/\/parcours\/comprendre-la-f1$/)

  await page.goto('/lecon/f1-qu-est-ce-que-la-f1')
  await page.getByRole('button', { name: 'C’est parti' }).click()
  const resumedPrompt = page.getByRole('main').getByRole('heading').first()
  await expect(resumedPrompt).not.toHaveText(firstPrompt ?? '')
  await expect(
    page.getByText('Étape 5 sur 9', { exact: false }).or(page.getByText('5/9')),
  ).toBeVisible()
})

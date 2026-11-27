import { expect, type Page } from '@playwright/test'

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'

export function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.local`
}

export function uniqueUsername() {
  return `e2e_${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`.slice(0, 20)
}

export const PASSWORD = 'kulto2026test'

/** Waits for the latest email sent to `to` and returns the first auth link it contains. */
export async function readAuthLink(to: string, subject?: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    const data = (await res.json()) as { messages?: { ID: string; Subject: string }[] }
    const msg = data.messages?.find((m) => !subject || subject.test(m.Subject))
    if (msg) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()) as {
        HTML: string
      }
      const href = /href="([^"]*\/auth\/(?:confirm|callback|v1\/verify)[^"]*)"/.exec(full.HTML)?.[1]
      if (href) return href.replaceAll('&amp;', '&')
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`No auth email received for ${to}`)
}

export async function signUp(page: Page, email: string, password = PASSWORD) {
  await page.goto('/inscription')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByLabel(/ans ou plus/).check()
  await page.getByLabel(/J’accepte les/).check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page).toHaveURL(/\/inscription\/verifie-tes-emails$/)
}

export async function confirmEmail(page: Page, email: string) {
  const link = await readAuthLink(email, /Confirm/)
  await page.goto(link)
}

export async function completeOnboarding(page: Page, username: string) {
  await expect(page).toHaveURL(/\/onboarding$/)
  await page.getByRole('button', { name: 'C’est parti' }).click()
  await page.getByLabel('Pseudo').fill(username)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Sport automobile', { exact: true }).click()
  await page.getByText('Musique', { exact: true }).click()
  await page.getByRole('button', { name: /Continuer avec 2 univers/ }).click()
  await page.getByText('Passionné').click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page
    .getByRole('group', { name: 'Ton niveau en Sport automobile' })
    .getByText('Expert')
    .click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: 'Tout est prêt' })).toBeVisible()
  await page.getByRole('button', { name: 'Terminer' }).click()
  await expect(page).toHaveURL(/\/accueil$/)
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/connexion')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

export async function signOut(page: Page) {
  await page.goto('/parametres')
  await page.getByRole('button', { name: 'Se déconnecter' }).click()
  await expect(page).toHaveURL(/\/$/)
}

/** Answers whatever question is on screen (correctness does not matter here). */
export async function answerCurrentQuestion(page: Page) {
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

export async function playToEnd(page: Page) {
  const main = page.getByRole('main')
  await expect(page.getByRole('button', { name: 'C’est parti' })).toBeHidden()
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

/** Closes the level-up moment if the lesson made the player level up (it appears after ~2 s). */
export async function dismissLevelUp(page: Page) {
  const dialog = page.getByRole('dialog', { name: /Tu passes au niveau/ })
  try {
    await dialog.waitFor({ state: 'visible', timeout: 3500 })
  } catch {
    return
  }
  await dialog.getByRole('button', { name: 'Continuer' }).click()
  await expect(dialog).toBeHidden()
}

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
export async function readAuthLink(to: string, subjectPart?: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    const data = (await res.json()) as { messages?: { ID: string; Subject: string }[] }
    const msg = data.messages?.find((m) => !subjectPart || m.Subject.includes(subjectPart))
    if (msg) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()) as {
        HTML: string
      }
      const href = /href="([^"]*\/auth\/(?:confirm|callback)[^"]*)"/.exec(full.HTML)?.[1]
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
  const link = await readAuthLink(email, 'Confirme')
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

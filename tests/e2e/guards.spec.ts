import { expect, test } from '@playwright/test'
import { readAuthLink, signIn, signUp, uniqueEmail } from './helpers'

test('signed-out visitors are sent to sign-in, then back where they were going', async ({
  page,
}) => {
  await page.goto('/parametres/compte')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fparametres%2Fcompte$/)
})

test('sign-up requires age and terms consent', async ({ page }) => {
  await page.goto('/inscription')
  await page.getByLabel('Email').fill(uniqueEmail('consent'))
  await page.getByLabel('Mot de passe', { exact: true }).fill('abc12345')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Kulto est réservé aux personnes de 15 ans ou plus.')).toBeVisible()
  await expect(page.getByText('Accepte les conditions pour créer ton compte.')).toBeVisible()
  await expect(page).toHaveURL(/\/inscription$/)
})

test('an unconfirmed account cannot sign in', async ({ page }) => {
  const email = uniqueEmail('unconfirmed')
  await signUp(page, email)
  await signIn(page, email)
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Confirme ton adresse email',
  )
})

test('weak passwords are rejected before reaching the server', async ({ page }) => {
  await page.goto('/inscription')
  await page.getByLabel('Mot de passe', { exact: true }).fill('motdepasse')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Au moins un chiffre.')).toBeVisible()
})

test('the saved theme is applied before first paint', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'kulto_theme', value: 'light', url: baseURL! }])
  await page.goto('/', { waitUntil: 'commit' })
  await page.waitForSelector('html[data-theme]')
  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(theme).toBe('light')
})

test('a confirmation link opened in another browser confirms the address', async ({
  page,
  browser,
}) => {
  const email = uniqueEmail('otherbrowser')
  await signUp(page, email)
  const link = new URL(await readAuthLink(email, /Confirm/))

  // Production uses Supabase's default template: /auth/v1/verify, then /auth/callback?code=…
  // Rebuild that link from the token so the test follows the same path.
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const token = link.searchParams.get('token_hash') ?? link.searchParams.get('token')
  const redirect = `${new URL(page.url()).origin}/auth/callback?next=/onboarding`
  const defaultLink = `${api}/auth/v1/verify?token=${token}&type=signup&redirect_to=${encodeURIComponent(redirect)}`

  // Another browser has no PKCE verifier: the address is still confirmed.
  const other = await browser.newContext()
  const phone = await other.newPage()
  await phone.goto(defaultLink)
  await expect(phone).toHaveURL(/\/connexion\?confirme=1$/)
  await expect(phone.getByText('Ton adresse email est confirmée')).toBeVisible()
  await signIn(phone, email)
  await expect(phone).toHaveURL(/\/onboarding$/)
  await other.close()
})

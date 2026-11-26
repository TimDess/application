import { expect, test } from '@playwright/test'
import { signIn, signUp, uniqueEmail } from './helpers'

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

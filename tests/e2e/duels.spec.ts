import { execFileSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'
import {
  answerCurrentQuestion,
  completeOnboarding,
  confirmEmail,
  signUp,
  uniqueEmail,
  uniqueUsername,
} from './helpers'

const DB_URL = process.env.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

async function newPlayer(page: Page, tag: string) {
  const email = uniqueEmail(tag)
  const username = uniqueUsername()
  await signUp(page, email)
  await confirmEmail(page, email)
  await completeOnboarding(page, username)
  return username
}

/** Plays the 7 questions of a duel from its intro screen. */
async function playDuel(page: Page) {
  await page.getByRole('button', { name: /^(C’est parti|Reprendre)$/ }).click()
  for (let i = 0; i < 7; i++) {
    await answerCurrentQuestion(page)
    const last = page.getByRole('button', { name: 'Voir le résultat' })
    if (await last.isVisible()) {
      await last.click()
      return
    }
    await page.getByRole('button', { name: 'Question suivante' }).click()
    await expect(page.getByText(`Question ${i + 2}/7`)).toBeVisible()
  }
}

test('two players are matched for a quick duel', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mobile', 'one pairing is enough; both projects share the pool')
  test.setTimeout(180_000)
  // Close any waiting quick duel left by other runs so the two players meet each other.
  execFileSync('psql', [
    DB_URL,
    '-X',
    '-q',
    '-c',
    "update public.duels set status = 'expired' where mode = 'quick' and status = 'open'",
  ])

  const a = await (await browser.newContext()).newPage()
  const nameA = await newPlayer(a, 'duela')
  await a.goto('/jouer')
  await a.getByRole('button', { name: 'Duel rapide' }).click()
  await expect(a).toHaveURL(/\/duels\//)
  await playDuel(a)
  await expect(a.getByRole('heading', { name: 'Manche terminée' })).toBeVisible()

  const b = await (await browser.newContext()).newPage()
  await newPlayer(b, 'duelb')
  await b.goto('/jouer')
  await b.getByRole('button', { name: 'Duel rapide' }).click()
  await expect(b.getByRole('heading', { name: `Duel contre ${nameA}` })).toBeVisible()
  await playDuel(b)
  await expect(b.getByRole('heading', { name: /Victoire !|Défaite|Égalité/ })).toBeVisible()
  await expect(b.getByRole('heading', { name: 'Question par question' })).toBeVisible()
  await expect(b.getByRole('button', { name: 'Revanche' })).toBeVisible()

  await a.goto('/jouer')
  await expect(a.getByRole('link', { name: /Victoire|Défaite|Égalité/ })).toBeVisible()
})

test('a friend takes up a link challenge as a guest', async ({ browser }, info) => {
  test.skip(info.project.name !== 'mobile', 'covered once')
  test.setTimeout(180_000)
  const a = await (await browser.newContext()).newPage()
  const nameA = await newPlayer(a, 'linka')
  await a.goto('/jouer')
  await a.getByRole('button', { name: 'Défier un ami' }).click()
  await expect(a).toHaveURL(/\/duels\//)
  await playDuel(a)
  await expect(a.getByRole('button', { name: 'Envoyer le défi' })).toBeVisible()
  const duelId = a.url().split('/duels/')[1]
  const code = execFileSync('psql', [
    DB_URL,
    '-X',
    '-t',
    '-A',
    '-c',
    `select invite_code from public.duels where id = '${duelId}'`,
  ])
    .toString()
    .trim()

  const friend = await (await browser.newContext()).newPage()
  await friend.goto(`/d/${code}`)
  await expect(friend.getByRole('heading', { name: `${nameA} te défie !` })).toBeVisible()
  await friend.getByRole('link', { name: 'Jouer sans compte' }).click()
  await friend.getByLabel(/ans ou plus/).check()
  await friend.getByLabel(/J’accepte les/).check()
  await friend.getByRole('button', { name: 'Commencer sans compte' }).click()
  await expect(friend).toHaveURL(/\/onboarding\?next=/)
  await friend.getByRole('button', { name: 'C’est parti' }).click()
  await friend.getByLabel('Pseudo').fill(uniqueUsername())
  await friend.getByRole('button', { name: 'Continuer' }).click()
  await friend.getByText('Musique', { exact: true }).click()
  await friend.getByRole('button', { name: /Continuer avec 1 univers/ }).click()
  await friend.getByText('Passionné').click()
  await friend.getByRole('button', { name: 'Continuer' }).click()
  await friend.getByRole('button', { name: 'Continuer' }).click()
  await friend.getByRole('button', { name: 'Terminer' }).click()
  await expect(friend).toHaveURL(new RegExp(`/d/${code}$`))
  await friend.getByRole('button', { name: 'Relever le défi' }).click()
  await expect(friend.getByRole('heading', { name: `Duel contre ${nameA}` })).toBeVisible()
  await playDuel(friend)
  await expect(friend.getByRole('heading', { name: /Victoire !|Défaite|Égalité/ })).toBeVisible()
})

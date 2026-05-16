/**
 * E2E: Navigation between main views
 * Tests that after login each nav item renders the correct route.
 */
import { type ElectronApplication, type Page, expect, test } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from '../global-setup'
import { closeApp, getWindow, launchApp } from '../helpers/electron-app'

let app: ElectronApplication
let page: Page

async function login(p: Page) {
  await p.waitForSelector('#login-email', { timeout: 10_000 })
  await p.fill('#login-email', E2E_EMAIL)
  await p.fill('#login-password', E2E_PASSWORD)
  await p.getByRole('button', { name: '登录' }).click()
  // Wait until login page is gone
  await expect(p.locator('#login-email')).not.toBeVisible({ timeout: 10_000 })
}

test.beforeEach(async () => {
  app = await launchApp()
  page = await getWindow(app)
  await page.waitForLoadState('domcontentloaded')
  await login(page)
})

test.afterEach(async () => {
  await closeApp(app)
})

const routes: Array<{ label: string; path: string }> = [
  { label: '今日', path: '/today' },
  { label: '即将', path: '/upcoming' },
  { label: '汇总', path: '/summary' },
  { label: '述职', path: '/slideshow' },
  { label: '项目', path: '/projects' },
]

for (const { label, path } of routes) {
  test(`clicking "${label}" navigates to ${path}`, async () => {
    // Find nav link by text content (partial match)
    await page.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 5_000 })
  })
}

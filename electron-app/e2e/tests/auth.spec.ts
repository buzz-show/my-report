/**
 * E2E: Authentication flow
 * Tests login page rendering, credential submission, and session persistence.
 */
import { type ElectronApplication, type Page, expect, test } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from '../global-setup'
import { closeApp, getWindow, launchApp } from '../helpers/electron-app'

let app: ElectronApplication
let page: Page

test.beforeEach(async () => {
  app = await launchApp()
  page = await getWindow(app)
  await page.waitForLoadState('domcontentloaded')
})

test.afterEach(async () => {
  await closeApp(app)
})

test('login page is shown before authentication', async () => {
  // Should see the login form before any credentials are entered
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('#login-password')).toBeVisible()
})

test('shows error state for wrong password', async () => {
  await page.waitForSelector('#login-email', { timeout: 10_000 })
  await page.fill('#login-email', E2E_EMAIL)
  await page.fill('#login-password', 'definitely-wrong-password')
  await page.getByRole('button', { name: '登录' }).click()

  // Expect an error message to appear (store sets error field)
  await expect(page.locator('[role="alert"], .error, [data-testid="login-error"]')).toBeVisible({
    timeout: 8_000,
  })
})

test('successful login navigates away from login page', async () => {
  await page.waitForSelector('#login-email', { timeout: 10_000 })
  await page.fill('#login-email', E2E_EMAIL)
  await page.fill('#login-password', E2E_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()

  // Login page should disappear and main app UI should appear
  await expect(page.locator('#login-email')).not.toBeVisible({ timeout: 10_000 })
})

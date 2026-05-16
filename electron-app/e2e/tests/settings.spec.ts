/**
 * E2E: Settings panel
 * Tests opening the settings panel, verifying the loaded fields, and saving.
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

async function openSettings(p: Page) {
  // Settings button is inside ChatPanel header (title="API 设置")
  const trigger = p.locator('button[title="API 设置"]')
  await expect(trigger).toBeVisible({ timeout: 10_000 })
  await trigger.click()
  // Wait for the settings panel to appear
  await expect(p.getByRole('button', { name: '保存' })).toBeVisible({ timeout: 5_000 })
}

test('settings panel opens and shows model field', async () => {
  await openSettings(page)

  // Model input is identified by its placeholder
  const modelInput = page.locator('input[placeholder="qwen3.5-35b-a3b"]')
  const modelValue = await modelInput.inputValue()
  expect(modelValue.length).toBeGreaterThan(0)
})

test('closing settings panel via × button', async () => {
  await openSettings(page)

  await page.getByRole('button', { name: '×' }).click()

  await expect(page.getByRole('button', { name: '保存' })).not.toBeVisible({ timeout: 3_000 })
})

test('saving settings persists model name', async () => {
  await openSettings(page)

  const modelInput = page.locator('input[placeholder="qwen3.5-35b-a3b"]')
  await modelInput.clear()
  await modelInput.fill('e2e-test-model')
  await page.getByRole('button', { name: '保存' }).click()

  // Panel should close after successful save (800ms delay in component)
  await expect(page.getByRole('button', { name: '保存' })).not.toBeVisible({ timeout: 5_000 })

  // Re-open settings and verify the model was persisted
  await openSettings(page)
  const savedValue = await page.locator('input[placeholder="qwen3.5-35b-a3b"]').inputValue()
  expect(savedValue).toBe('e2e-test-model')
})

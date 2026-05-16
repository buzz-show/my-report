/**
 * E2E: Chat flow
 * Tests sending a message in the chat panel and verifying user/assistant bubbles appear.
 * The AI response is real (requires a running LLM) — we only wait for the user bubble
 * and check that the assistant bubble is eventually rendered (even a partial response).
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

test('user message bubble appears after sending', async () => {
  // ChatPanel is rendered on the right side in desktop layout
  const chatInput = page.locator('textarea[placeholder*="输入消息"]')
  await expect(chatInput).toBeVisible({ timeout: 8_000 })

  await chatInput.fill('ping')
  await chatInput.press('Enter')

  // The user message bubble should appear immediately
  await expect(page.locator('[data-testid="user-message"]').first()).toBeVisible({
    timeout: 5_000,
  })
})

test('assistant bubble appears after sending (streaming starts)', async () => {
  const chatInput = page.locator('textarea[placeholder*="输入消息"]')
  await expect(chatInput).toBeVisible({ timeout: 8_000 })

  await chatInput.fill('hello')
  await chatInput.press('Enter')

  // Wait for assistant bubble to appear (streaming response)
  await expect(page.locator('[data-testid="assistant-message"]').first()).toBeVisible({
    timeout: 20_000,
  })
})

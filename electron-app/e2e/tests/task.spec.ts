/**
 * E2E: Create task flow
 * Tests opening the new-task modal, submitting a task, and verifying it
 * appears in the Today view task list. Requires the Python backend to be
 * running (handled by global-setup / global-teardown).
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

async function openNewTaskModal(p: Page) {
  // Desktop sidebar button
  await p.getByRole('button', { name: '新建今日待办' }).first().click()
  await expect(p.getByRole('dialog', { name: '新建今日待办' })).toBeVisible({ timeout: 5_000 })
}

test.beforeEach(async () => {
  app = await launchApp()
  page = await getWindow(app)
  // Explicitly set viewport to desktop width so the sidebar (and its
  // "新建今日待办" button) is rendered.  launchApp sets window size via
  // app.evaluate, but there is a race where BrowserWindow may not yet
  // exist at that point; setting the viewport here is unconditionally safe.
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.waitForLoadState('domcontentloaded')
  await login(page)
})

test.afterEach(async () => {
  await closeApp(app)
})

// ---------------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------------

test('clicking "新建今日待办" opens the modal', async () => {
  await openNewTaskModal(page)

  await expect(page.getByRole('dialog', { name: '新建今日待办' })).toBeVisible()
  await expect(page.getByPlaceholder('你今天要推进什么？')).toBeVisible()
})

test('clicking "取消" closes the modal', async () => {
  await openNewTaskModal(page)

  await page.getByRole('button', { name: '取消' }).click()

  await expect(page.getByRole('dialog', { name: '新建今日待办' })).not.toBeVisible({
    timeout: 3_000,
  })
})

test('pressing Escape closes the modal', async () => {
  await openNewTaskModal(page)

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: '新建今日待办' })).not.toBeVisible({
    timeout: 3_000,
  })
})

test('submit button is disabled when title is empty', async () => {
  await openNewTaskModal(page)

  // Title is empty by default — submit should be disabled
  await expect(page.getByRole('button', { name: '创建待办' })).toBeDisabled()
})

// ---------------------------------------------------------------------------
// Happy path — task creation
// ---------------------------------------------------------------------------

test('creates a task with only title and it appears in the task list', async () => {
  await openNewTaskModal(page)

  await page.getByPlaceholder('你今天要推进什么？').fill('E2E 基础任务')

  // Submit button should become enabled once title is filled
  await expect(page.getByRole('button', { name: '创建待办' })).toBeEnabled()

  await page.getByRole('button', { name: '创建待办' }).click()

  // Modal closes after successful creation
  await expect(page.getByRole('dialog', { name: '新建今日待办' })).not.toBeVisible({
    timeout: 10_000,
  })

  // Task card should appear in Today view
  await expect(page.locator('.task-card').filter({ hasText: 'E2E 基础任务' })).toBeVisible({
    timeout: 8_000,
  })
})

test('creates a task with all optional fields', async () => {
  await openNewTaskModal(page)

  // Fill title
  await page.getByPlaceholder('你今天要推进什么？').fill('E2E 完整任务')

  // Fill description
  await page
    .getByPlaceholder('这个任务要完成什么，或希望留下什么结果说明…')
    .fill('这是一条 E2E 自动化测试产生的描述')

  // Select "低优先级"
  await page.getByRole('button', { name: '低优先级' }).click()

  // Fill time
  await page.getByPlaceholder('09:00 – 11:00').fill('14:00 – 15:00')

  // Select a tag — scope to the dialog to avoid sidebar label ambiguity
  await page
    .getByRole('dialog', { name: '新建今日待办' })
    .getByRole('button', { name: '深度工作' })
    .click()

  await page.getByRole('button', { name: '创建待办' }).click()

  await expect(page.getByRole('dialog', { name: '新建今日待办' })).not.toBeVisible({
    timeout: 10_000,
  })

  await expect(page.locator('.task-card').filter({ hasText: 'E2E 完整任务' })).toBeVisible({
    timeout: 8_000,
  })
})

test('can create multiple tasks sequentially', async () => {
  for (const title of ['E2E 任务一', 'E2E 任务二']) {
    await openNewTaskModal(page)
    await page.getByPlaceholder('你今天要推进什么？').fill(title)
    await page.getByRole('button', { name: '创建待办' }).click()
    await expect(page.getByRole('dialog', { name: '新建今日待办' })).not.toBeVisible({
      timeout: 10_000,
    })
    // Wait for the task card to appear before reopening the modal
    await expect(page.locator('.task-card').filter({ hasText: title })).toBeVisible({
      timeout: 8_000,
    })
  }

  await expect(page.locator('.task-card').filter({ hasText: 'E2E 任务一' })).toBeVisible()
  await expect(page.locator('.task-card').filter({ hasText: 'E2E 任务二' })).toBeVisible()
})

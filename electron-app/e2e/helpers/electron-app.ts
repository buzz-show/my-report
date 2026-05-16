/**
 * Electron app launch helper for Playwright E2E tests.
 *
 * Reads the Python backend port from e2e/.port (written by global-setup)
 * and injects it as AI_RUNTIME_PORT into the Electron process so that
 * `getRuntimeBaseUrl()` in the main process uses the right port.
 *
 * python-process.ts skips spawning in non-packaged mode, so the E2E test
 * runner is responsible for the Python lifecycle (handled in global-setup/teardown).
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { type ElectronApplication, type Page, _electron as electron } from '@playwright/test'

const E2E_DIR = path.resolve(__dirname, '..')
const PORT_FILE = path.join(E2E_DIR, '.port')
const MAIN_JS = path.resolve(__dirname, '../../out/main/index.js')

function readPort(): string {
  return fs.readFileSync(PORT_FILE, 'utf-8').trim()
}

export async function launchApp(): Promise<ElectronApplication> {
  const port = readPort()
  // 每次启动使用独立的临时 userData 目录，防止上一个测试保存的 session token
  // 被 restoreSession() 读取，导致登录页不出现。
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-electron-'))
  const app = await electron.launch({
    args: [MAIN_JS, `--user-data-dir=${userDataDir}`],
    env: {
      ...process.env,
      AI_RUNTIME_PORT: port,
      NODE_ENV: 'test',
    },
  })
  // 设置窗口为桌面尺寸（≥1024px），确保渲染 desktop 布局，显示侧边栏和 ChatPanel
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    win?.setSize(1280, 800)
  })
  // 测试结束后清理临时目录
  app.on('close', () => fs.rmSync(userDataDir, { recursive: true, force: true }))
  return app
}

export async function getWindow(app: ElectronApplication): Promise<Page> {
  return app.firstWindow()
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  await app.close()
}

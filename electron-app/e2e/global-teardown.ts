/**
 * Playwright global-teardown
 * Kills the Python backend process and removes ephemeral files.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const E2E_DIR = path.resolve(__dirname)
const PORT_FILE = path.join(E2E_DIR, '.port')
const PID_FILE = path.join(E2E_DIR, '.pid')
const DB_FILE = path.join(E2E_DIR, 'e2e-test.db')

export default async function globalTeardown(): Promise<void> {
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10)
    if (!Number.isNaN(pid)) {
      try {
        process.kill(pid, 'SIGTERM')
        console.log(`[global-teardown] Sent SIGTERM to pid ${pid}`)
      } catch {
        // Process may have already exited
      }
    }
    fs.rmSync(PID_FILE, { force: true })
  }

  fs.rmSync(PORT_FILE, { force: true })
  fs.rmSync(DB_FILE, { force: true })

  console.log('[global-teardown] Cleanup complete')
}

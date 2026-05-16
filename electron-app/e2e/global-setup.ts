/**
 * Playwright global-setup
 *
 * 1. Find a free TCP port
 * 2. Start the Python backend (uvicorn) using the virtualenv at ai-runtime/.venv/
 * 3. Wait until /health responds with 200
 * 4. Pre-create the E2E test account (POST /auth/login – upsert pattern)
 * 5. Write the chosen port to e2e/.port so helpers can read it
 *
 * The DB file path is e2e/e2e-test.db (cleaned up by global-teardown).
 */
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as net from 'node:net'
import * as path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '../..')
const VENV_PYTHON = path.join(REPO_ROOT, 'ai-runtime', '.venv', 'bin', 'uvicorn')
const E2E_DIR = path.join(__dirname)
const PORT_FILE = path.join(E2E_DIR, '.port')
const PID_FILE = path.join(E2E_DIR, '.pid')
const DB_FILE = path.join(E2E_DIR, 'e2e-test.db')

export const E2E_EMAIL = 'test@e2e.local'
export const E2E_PASSWORD = 'e2e-password-123'

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      server.close(() => resolve(addr.port))
    })
    server.on('error', reject)
  })
}

function waitForHealth(port: number, maxMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/health`, res => {
        if (res.statusCode === 200) {
          resolve()
        } else {
          retry()
        }
        res.resume()
      })
      req.on('error', retry)
      req.setTimeout(1000, () => {
        req.destroy()
        retry()
      })
    }
    const retry = () => {
      if (Date.now() - start > maxMs) {
        reject(new Error(`Python backend did not become healthy within ${maxMs}ms`))
        return
      }
      setTimeout(check, 500)
    }
    check()
  })
}

function postJson(url: string, body: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const urlObj = new URL(url)
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: parseInt(urlObj.port),
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      res => {
        res.resume()
        // 200 or 401 (wrong password) are acceptable – upsert always returns 200 on first call
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else {
          reject(new Error(`POST ${url} returned ${res.statusCode}`))
        }
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

export default async function globalSetup(): Promise<void> {
  const port = await findFreePort()

  const proc = spawn(
    VENV_PYTHON,
    ['ai_runtime.server:create_app', '--factory', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: path.join(REPO_ROOT, 'ai-runtime'),
      env: {
        ...process.env,
        AI_RUNTIME_AUTH_DB_PATH: DB_FILE,
      },
      stdio: 'pipe',
    }
  )

  // Write pid so teardown can stop the process
  fs.writeFileSync(PID_FILE, String(proc.pid))
  fs.writeFileSync(PORT_FILE, String(port))

  proc.stderr?.on('data', (d: Buffer) => {
    // Uncomment to debug: process.stderr.write(d)
    void d
  })

  proc.on('error', err => {
    throw new Error(`Failed to start Python backend: ${err.message}`)
  })

  await waitForHealth(port)

  // Pre-create the E2E test user (upsert on first login)
  await postJson(`http://127.0.0.1:${port}/auth/login`, {
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  })

  console.log(`[global-setup] Python backend running on port ${port} (pid ${proc.pid})`)
}

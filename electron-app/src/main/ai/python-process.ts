/**
 * Python AI Runtime 子进程管理
 *
 * 职责：
 *   1. 找到一个空闲端口
 *   2. spawn 打包好的 ai-runtime 可执行文件（生产环境）
 *   3. 轮询 /health 直到服务就绪，再通知调用方
 *   4. 应用退出时 kill 子进程
 *
 * 开发环境：不 spawn（用户手动运行 uvicorn），直接返回，
 *           getRuntimeBaseUrl() 会读取 AI_RUNTIME_PORT env 或回落到 18765。
 */

import { ChildProcess, spawn } from 'child_process'
import { createServer } from 'net'
import { join } from 'path'

import { app } from 'electron'

let runtimeProcess: ChildProcess | null = null

// ── 端口工具 ──────────────────────────────────────────────────────────────────

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        const { port } = addr
        server.close(() => resolve(port))
      } else {
        server.close()
        reject(new Error('findFreePort: could not determine address'))
      }
    })
    server.on('error', reject)
  })
}

// ── 可执行文件路径 ─────────────────────────────────────────────────────────────

function getRuntimeExecutablePath(): string {
  // electron-builder 将 extraResources 放在 process.resourcesPath 下
  const exeName = process.platform === 'win32' ? 'ai-runtime.exe' : 'ai-runtime'
  return join(process.resourcesPath, exeName)
}

// ── 就绪探测 ──────────────────────────────────────────────────────────────────

async function waitForReady(port: number, timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  const url = `http://127.0.0.1:${port}/health`

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // 服务还未就绪，继续等待
    }
    await new Promise(r => setTimeout(r, 300))
  }

  throw new Error(`AI Runtime 未能在 ${timeoutMs}ms 内就绪（port=${port}）`)
}

// ── 公共 API ──────────────────────────────────────────────────────────────────

/**
 * 启动 Python AI Runtime 子进程（仅生产环境）。
 * 完成后 process.env['AI_RUNTIME_PORT'] 已设置，getRuntimeBaseUrl() 可正常使用。
 */
export async function startPythonRuntime(): Promise<void> {
  // 开发模式：用户自行启动 uvicorn，此处直接返回
  if (!app.isPackaged) return

  const port = await findFreePort()
  const executable = getRuntimeExecutablePath()

  runtimeProcess = spawn(executable, ['--port', String(port)], {
    env: { ...process.env, AI_RUNTIME_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  runtimeProcess.stdout?.on('data', (chunk: Buffer) => {
    console.log('[ai-runtime]', chunk.toString().trimEnd())
  })
  runtimeProcess.stderr?.on('data', (chunk: Buffer) => {
    console.error('[ai-runtime]', chunk.toString().trimEnd())
  })
  runtimeProcess.on('exit', (code, signal) => {
    console.log(`[ai-runtime] exited  code=${code}  signal=${signal}`)
    runtimeProcess = null
  })

  // 注入端口，runtime.ts 的 getRuntimeBaseUrl() 会读取它
  process.env['AI_RUNTIME_PORT'] = String(port)

  await waitForReady(port)
  console.log(`[ai-runtime] ready on port ${port}`)
}

/**
 * 终止子进程（在 app before-quit 时调用）。
 */
export function stopPythonRuntime(): void {
  if (runtimeProcess) {
    runtimeProcess.kill()
    runtimeProcess = null
  }
}

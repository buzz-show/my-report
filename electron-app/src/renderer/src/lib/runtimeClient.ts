/**
 * runtimeClient — 统一 HTTP 请求层
 *
 * 架构说明：
 * - 所有业务接口直接从 renderer 调用 FastAPI（无 IPC 中转）
 * - Auth token 通过 IPC 从 main process 获取（token 存储在 main，renderer 不持有）
 * - 错误统一抛出 RuntimeError，组件/store 只需 catch 即可
 *
 * 后续可直接将 taskApi.* 方法作为 TanStack Query 的 queryFn / mutationFn 使用。
 */

const RUNTIME_BASE = 'http://127.0.0.1:18765'

// Cache the base URL after the first IPC call — the port never changes at runtime.
let _runtimeBase: string | null = null
async function getRuntimeBase(): Promise<string> {
  if (_runtimeBase !== null) return _runtimeBase
  _runtimeBase = await window.electronAPI.runtime.getBaseUrl()
  return _runtimeBase
}

// --------------------------------------------------------------------------
// 统一错误类
// --------------------------------------------------------------------------

export class RuntimeError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'RuntimeError'
  }
}

// --------------------------------------------------------------------------
// 核心请求器
// --------------------------------------------------------------------------

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const [base, token] = await Promise.all([
    getRuntimeBase(),
    window.electronAPI.auth.getAccessToken(),
  ])

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const detail = await response
      .json()
      .then((d: { detail?: string }) => d.detail)
      .catch(() => undefined)
    throw new RuntimeError(detail ?? `请求失败（${response.status}）`, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// --------------------------------------------------------------------------
// 类型定义
// --------------------------------------------------------------------------

export interface TaskApiView {
  id: string
  title: string
  description: string
  priority: string
  badge: string
  time: string
  tags: string[]
  done_at: string | null
  created_at: string
}

export interface CreateTaskRequest {
  title: string
  description: string
  priority: string
  badge: string
  time: string
  tags: string[]
}

// --------------------------------------------------------------------------
// 业务 API — 按资源分组，后续各资源可拆成独立文件再从此处 re-export
// --------------------------------------------------------------------------

export const taskApi = {
  create: (payload: CreateTaskRequest) => request<TaskApiView>('POST', '/tasks', payload),
}

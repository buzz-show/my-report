/**
 * runtimeClient 单测
 *
 * 覆盖：
 * - RuntimeError 类行为
 * - request<T> 核心：token 注入、成功响应、错误解析、204 处理
 * - taskApi.create 调用路径
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { RuntimeError, taskApi } from '../runtimeClient'

// ---------- helpers ----------

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response

// ---------- setup ----------

beforeEach(() => {
  vi.stubGlobal('electronAPI', {
    auth: { getAccessToken: vi.fn().mockResolvedValue('tok-123') },
    runtime: { getBaseUrl: vi.fn().mockResolvedValue('http://127.0.0.1:18765') },
  })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------- RuntimeError ----------

describe('RuntimeError', () => {
  it('stores message and status', () => {
    const err = new RuntimeError('服务不可用', 503)
    expect(err.message).toBe('服务不可用')
    expect(err.status).toBe(503)
    expect(err.name).toBe('RuntimeError')
    expect(err).toBeInstanceOf(Error)
  })
})

// ---------- taskApi.create ----------

describe('taskApi.create', () => {
  const payload = {
    title: '写周报',
    description: '',
    priority: 'high',
    badge: '高优先级',
    time: '09:00 – 10:00',
    tags: ['深度工作'],
  }

  const apiView = {
    id: 'task-uuid',
    title: '写周报',
    description: '',
    priority: 'high',
    badge: '高优先级',
    time: '09:00 – 10:00',
    tags: ['深度工作'],
    done_at: null,
    created_at: '2026-05-19T00:00:00Z',
  }

  it('sends POST /tasks with Authorization header and JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(201, apiView))

    await taskApi.create(payload)

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:18765/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok-123',
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  it('omits Authorization header when token is null', async () => {
    vi.mocked(window.electronAPI.auth.getAccessToken).mockResolvedValue(null)
    vi.mocked(fetch).mockResolvedValue(makeResponse(201, apiView))

    await taskApi.create(payload)

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('returns parsed TaskApiView on 201', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(201, apiView))

    const result = await taskApi.create(payload)

    expect(result).toEqual(apiView)
  })

  it('throws RuntimeError with server detail on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(422, { detail: '标题不能为空' }))

    await expect(taskApi.create(payload)).rejects.toMatchObject({
      name: 'RuntimeError',
      message: '标题不能为空',
      status: 422,
    })
  })

  it('throws RuntimeError with fallback message when body is not JSON', async () => {
    const res = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError('invalid json')),
    } as unknown as Response
    vi.mocked(fetch).mockResolvedValue(res)

    await expect(taskApi.create(payload)).rejects.toMatchObject({
      name: 'RuntimeError',
      status: 500,
    })
  })

  it('throws RuntimeError with fallback when detail field is missing', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(400, {}))

    await expect(taskApi.create(payload)).rejects.toMatchObject({
      name: 'RuntimeError',
      message: '请求失败（400）',
      status: 400,
    })
  })
})

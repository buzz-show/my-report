// @vitest-environment node
/**
 * auth/client 单测
 * 验证 loginWithRuntime / logoutFromRuntime / restoreSession 的 HTTP 调用行为。
 * 使用 vi.stubGlobal('fetch', ...) 拦截所有 fetch 调用。
 * 使用 vi.mock('../../../config', ...) 隔离 config 的 electron 依赖。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../config', () => ({
  getAuthTokens: vi.fn(),
  saveAuthTokens: vi.fn(),
  clearAuthTokens: vi.fn(),
}))

import { getAuthTokens, saveAuthTokens, clearAuthTokens } from '../../config'
import { loginWithRuntime, logoutFromRuntime, restoreSession } from '../client'

const TEST_PORT = '19999'
const BASE = `http://127.0.0.1:${TEST_PORT}`

function mockOk(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(''),
  } as unknown as Response
}

function mockErr(status: number, detail: string): Response {
  return {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ detail }),
    text: vi.fn().mockResolvedValue(''),
  } as unknown as Response
}

const backendUser = {
  user_id: 'u1',
  email: 'a@b.com',
  display_name: 'Alice',
  role: 'user',
  logged_in: true,
}

const expectedSession = {
  userId: 'u1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'user',
  loggedIn: true,
}

beforeEach(() => {
  process.env['AI_RUNTIME_PORT'] = TEST_PORT
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  delete process.env['AI_RUNTIME_PORT']
  vi.unstubAllGlobals()
})

describe('loginWithRuntime', () => {
  it('POSTs to /auth/login and returns a SessionView', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockOk({
        access_token: 'at',
        refresh_token: 'rt',
        expires_at: '2999-01-01T00:00:00Z',
        user: backendUser,
      })
    )

    const result = await loginWithRuntime({ email: 'a@b.com', password: 'pass' })

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: 'POST' })
    )
    expect(saveAuthTokens).toHaveBeenCalledWith({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: '2999-01-01T00:00:00Z',
    })
    expect(result).toEqual(expectedSession)
  })

  it('throws on non-ok response with backend detail', async () => {
    vi.mocked(fetch).mockResolvedValue(mockErr(401, '密码错误'))
    await expect(loginWithRuntime({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
      '密码错误'
    )
    expect(saveAuthTokens).not.toHaveBeenCalled()
  })
})

describe('logoutFromRuntime', () => {
  it('POSTs to /auth/logout and clears tokens', async () => {
    vi.mocked(getAuthTokens).mockReturnValue({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: '2999-01-01T00:00:00Z',
    })
    vi.mocked(fetch).mockResolvedValue(mockOk({}))

    await logoutFromRuntime()

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/logout`,
      expect.objectContaining({ method: 'POST' })
    )
    expect(clearAuthTokens).toHaveBeenCalledTimes(1)
  })

  it('clears tokens even when no tokens are stored', async () => {
    vi.mocked(getAuthTokens).mockReturnValue(null)

    await logoutFromRuntime()

    expect(fetch).not.toHaveBeenCalled()
    expect(clearAuthTokens).toHaveBeenCalledTimes(1)
  })
})

describe('restoreSession', () => {
  it('returns null immediately when no tokens are stored', async () => {
    vi.mocked(getAuthTokens).mockReturnValue(null)

    const result = await restoreSession()

    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('GETs /auth/me with a valid (non-expired) token and returns SessionView', async () => {
    vi.mocked(getAuthTokens).mockReturnValue({
      accessToken: 'valid-at',
      refreshToken: 'rt',
      expiresAt: '2999-01-01T00:00:00Z', // far future → not expired
    })
    vi.mocked(fetch).mockResolvedValue(mockOk(backendUser))

    const result = await restoreSession()

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/me`,
      expect.objectContaining({ method: 'GET' })
    )
    expect(result).toEqual(expectedSession)
  })

  it('throws and clears tokens when /auth/me returns 401 and refresh also fails', async () => {
    vi.mocked(getAuthTokens).mockReturnValue({
      accessToken: 'expired-at',
      refreshToken: 'rt',
      expiresAt: '2999-01-01T00:00:00Z',
    })
    // /auth/me returns 401, then /auth/refresh also fails
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({}),
        text: vi.fn().mockResolvedValue(''),
      } as unknown as Response)
      .mockResolvedValueOnce(mockErr(401, '刷新令牌无效'))

    // refreshAccessToken throws when refresh endpoint fails (does not silently return null)
    await expect(restoreSession()).rejects.toThrow()
    expect(clearAuthTokens).toHaveBeenCalled()
  })
})

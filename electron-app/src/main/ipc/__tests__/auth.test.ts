// @vitest-environment node
/**
 * ipc/auth 单测
 * 验证：
 *   1. 三个 AUTH_* channel 均已注册
 *   2. AUTH_LOGIN 成功返回 SessionView / 邮箱格式非法 throw / 密码为空 throw / 邮箱转小写
 *   3. AUTH_LOGOUT 调用 logoutFromRuntime
 *   4. AUTH_GET_SESSION 成功返回 session / restoreSession 抛出时返回 null
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CHANNELS } from '@shared/constants/ipc-channels'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))

vi.mock('../../auth/client', () => ({
  loginWithRuntime: vi.fn(),
  logoutFromRuntime: vi.fn(),
  restoreSession: vi.fn(),
}))

import { ipcMain } from 'electron'
import { loginWithRuntime, logoutFromRuntime, restoreSession } from '../../auth/client'
import { registerAuthHandlers } from '../auth'

type IpcHandler = (_event: unknown, ...args: unknown[]) => Promise<unknown>

function getHandler(channel: string): IpcHandler {
  const call = vi.mocked(ipcMain.handle).mock.calls.find(([ch]) => ch === channel)
  if (!call) throw new Error(`No handler registered for channel: ${channel}`)
  return call[1] as IpcHandler
}

beforeEach(() => {
  vi.clearAllMocks()
  registerAuthHandlers()
})

describe('registerAuthHandlers', () => {
  it('registers AUTH_LOGIN, AUTH_LOGOUT and AUTH_GET_SESSION channels', () => {
    const registered = vi.mocked(ipcMain.handle).mock.calls.map(([ch]) => ch)
    expect(registered).toContain(CHANNELS.AUTH_LOGIN)
    expect(registered).toContain(CHANNELS.AUTH_LOGOUT)
    expect(registered).toContain(CHANNELS.AUTH_GET_SESSION)
  })

  describe('AUTH_LOGIN', () => {
    const mockSession = {
      userId: 'u1',
      email: 'a@b.com',
      displayName: 'Alice',
      role: 'user',
      loggedIn: true,
    }

    it('returns SessionView on valid credentials', async () => {
      vi.mocked(loginWithRuntime).mockResolvedValue(mockSession)
      const handler = getHandler(CHANNELS.AUTH_LOGIN)
      const result = await handler({}, { email: 'a@b.com', password: 'secret' })
      expect(result).toEqual(mockSession)
      expect(loginWithRuntime).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })
    })

    it('normalises email to lowercase before calling loginWithRuntime', async () => {
      vi.mocked(loginWithRuntime).mockResolvedValue(mockSession)
      const handler = getHandler(CHANNELS.AUTH_LOGIN)
      await handler({}, { email: 'A@B.COM', password: 'secret' })
      expect(loginWithRuntime).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })
    })

    it('throws on invalid email format', async () => {
      const handler = getHandler(CHANNELS.AUTH_LOGIN)
      await expect(handler({}, { email: 'not-an-email', password: 'pass' })).rejects.toThrow(
        '请输入有效邮箱'
      )
    })

    it('throws on empty password', async () => {
      const handler = getHandler(CHANNELS.AUTH_LOGIN)
      await expect(handler({}, { email: 'a@b.com', password: '' })).rejects.toThrow('密码不能为空')
    })

    it('throws when payload is nullish', async () => {
      const handler = getHandler(CHANNELS.AUTH_LOGIN)
      await expect(handler({}, null)).rejects.toThrow()
    })
  })

  describe('AUTH_LOGOUT', () => {
    it('calls logoutFromRuntime and resolves', async () => {
      vi.mocked(logoutFromRuntime).mockResolvedValue(undefined)
      const handler = getHandler(CHANNELS.AUTH_LOGOUT)
      await handler({})
      expect(logoutFromRuntime).toHaveBeenCalledTimes(1)
    })
  })

  describe('AUTH_GET_SESSION', () => {
    it('returns SessionView when restoreSession succeeds', async () => {
      const mockSession = {
        userId: 'u1',
        email: 'a@b.com',
        displayName: 'Alice',
        role: 'user',
        loggedIn: true,
      }
      vi.mocked(restoreSession).mockResolvedValue(mockSession)
      const handler = getHandler(CHANNELS.AUTH_GET_SESSION)
      const result = await handler({})
      expect(result).toEqual(mockSession)
    })

    it('returns null when restoreSession throws', async () => {
      vi.mocked(restoreSession).mockRejectedValue(new Error('token expired'))
      const handler = getHandler(CHANNELS.AUTH_GET_SESSION)
      const result = await handler({})
      expect(result).toBeNull()
    })
  })
})

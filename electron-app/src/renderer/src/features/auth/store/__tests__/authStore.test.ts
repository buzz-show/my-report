/**
 * features/auth/store/authStore 单测
 * 参考模式：chatStore.test.ts（Zustand + act）
 * mock window.electronAPI.auth 替换真实 IPC Bridge。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

import { useAuthStore } from '../authStore'

const mockAuth = {
  login: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn(),
}

const mockSession = {
  userId: 'u1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  loggedIn: true,
}

beforeEach(() => {
  vi.stubGlobal('electronAPI', { auth: mockAuth })
  vi.clearAllMocks()
  act(() => {
    useAuthStore.setState({ session: null, initializing: true, loading: false, error: '' })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('authStore', () => {
  describe('login', () => {
    it('sets session and clears loading on success', async () => {
      mockAuth.login.mockResolvedValue(mockSession)

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'pass123')
      })

      const state = useAuthStore.getState()
      expect(state.session).toEqual(mockSession)
      expect(state.loading).toBe(false)
      expect(state.error).toBe('')
    })

    it('sets error message and clears loading on failure', async () => {
      mockAuth.login.mockRejectedValue(new Error('密码错误'))

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'wrong')
      })

      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.error).toBe('密码错误')
      expect(state.loading).toBe(false)
    })

    it('uses fallback error message for non-Error throws', async () => {
      mockAuth.login.mockRejectedValue('unexpected string error')

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'pass')
      })

      expect(useAuthStore.getState().error).toBe('登录失败')
    })
  })

  describe('logout', () => {
    it('clears session after logout', async () => {
      act(() => {
        useAuthStore.setState({
          session: mockSession,
          initializing: false,
          loading: false,
          error: '',
        })
      })
      mockAuth.logout.mockResolvedValue(undefined)

      await act(async () => {
        await useAuthStore.getState().logout()
      })

      expect(useAuthStore.getState().session).toBeNull()
    })
  })

  describe('restoreSession', () => {
    it('sets session and sets initializing=false when session exists', async () => {
      mockAuth.getSession.mockResolvedValue(mockSession)

      await act(async () => {
        await useAuthStore.getState().restoreSession()
      })

      const state = useAuthStore.getState()
      expect(state.session).toEqual(mockSession)
      expect(state.initializing).toBe(false)
    })

    it('sets session=null and initializing=false when no session', async () => {
      mockAuth.getSession.mockResolvedValue(null)

      await act(async () => {
        await useAuthStore.getState().restoreSession()
      })

      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.initializing).toBe(false)
    })
  })
})

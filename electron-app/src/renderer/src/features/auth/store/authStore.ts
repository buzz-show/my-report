import { create } from 'zustand'
import type { SessionView } from '@shared/types'

interface AuthState {
  session: SessionView | null
  initializing: boolean   // true 直到首次 restoreSession 完成
  loading: boolean
  error: string
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initializing: true,
  loading: false,
  error: '',

  login: async (email, password) => {
    set({ loading: true, error: '' })
    try {
      const session = await window.electronAPI.auth.login({ email, password })
      set({ session, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '登录失败', loading: false })
    }
  },

  logout: async () => {
    await window.electronAPI.auth.logout()
    set({ session: null })
  },

  restoreSession: async () => {
    const session = await window.electronAPI.auth.getSession()
    set({ session, initializing: false })
  },
}))

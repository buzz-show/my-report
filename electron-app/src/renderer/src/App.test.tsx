/**
 * App 单测
 * 验证三种渲染路径：
 *   1. initializing=true  → 显示 loading 占位（无 LoginPage / AppRoutes）
 *   2. session=null       → 渲染 LoginPage
 *   3. session 存在       → 渲染 AppRoutes
 *
 * useAuthStore 和子组件全部 mock，隔离路由与 IPC 依赖。
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./features/auth', () => ({
  LoginPage: () => <div data-testid="login-page">Login</div>,
  useAuthStore: vi.fn(),
}))

vi.mock('./router', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}))

import { useAuthStore } from './features/auth'

const mockSession = {
  userId: 'u1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'user',
  loggedIn: true,
}

describe('App', () => {
  it('shows loading indicator while session is being restored', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      session: null,
      initializing: true,
      restoreSession: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)

    render(<App />)

    expect(screen.queryByTestId('login-page')).toBeNull()
    expect(screen.queryByTestId('app-routes')).toBeNull()
    // Loading state renders the app name
    expect(screen.getByText('交个代')).toBeTruthy()
  })

  it('renders LoginPage when session is null after initialisation', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      session: null,
      initializing: false,
      restoreSession: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)

    render(<App />)

    expect(screen.getByTestId('login-page')).toBeTruthy()
    expect(screen.queryByTestId('app-routes')).toBeNull()
  })

  it('renders AppRoutes when a session exists', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      session: mockSession,
      initializing: false,
      restoreSession: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)

    render(<App />)

    expect(screen.getByTestId('app-routes')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
  })
})

import type { LoginPayload, SessionView } from '@shared/types'

import {
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from '../config'

const DEFAULT_PORT = 18765
const EXPIRY_SKEW_MS = 5_000

interface BackendUser {
  user_id: string
  email: string
  display_name: string
  role: string
  logged_in: boolean
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_at: string
  user: BackendUser
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_at: string
  user: BackendUser
}

function getRuntimeBaseUrl(): string {
  const port = process.env['AI_RUNTIME_PORT'] ?? DEFAULT_PORT
  return `http://127.0.0.1:${port}`
}

function buildSessionView(user: BackendUser): SessionView {
  return {
    userId: user.user_id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    loggedIn: user.logged_in,
  }
}

async function parseError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = (await response.json()) as { detail?: string }
    return new Error(data.detail ?? fallback)
  } catch {
    const text = await response.text()
    return new Error(text || fallback)
  }
}

function isAccessTokenExpired(expiresAt: string): boolean {
  const expiry = Date.parse(expiresAt)
  if (Number.isNaN(expiry)) return true
  return expiry <= Date.now() + EXPIRY_SKEW_MS
}

export async function loginWithRuntime(payload: LoginPayload): Promise<SessionView> {
  const response = await fetch(`${getRuntimeBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await parseError(response, '登录失败')
  }

  const data = (await response.json()) as AuthResponse
  saveAuthTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  })
  return buildSessionView(data.user)
}

export async function refreshAccessToken(force = false): Promise<string | null> {
  const tokens = getAuthTokens()
  if (!tokens?.refreshToken) {
    clearAuthTokens()
    return null
  }

  if (!force && tokens.accessToken && !isAccessTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken
  }

  const response = await fetch(`${getRuntimeBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  })

  if (!response.ok) {
    clearAuthTokens()
    throw await parseError(response, '会话已过期，请重新登录')
  }

  const data = (await response.json()) as RefreshResponse
  saveAuthTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  })
  return data.access_token
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getAuthTokens()
  if (!tokens?.accessToken || !tokens.refreshToken) return null
  if (!isAccessTokenExpired(tokens.expiresAt)) return tokens.accessToken
  return refreshAccessToken(true)
}

export async function restoreSession(): Promise<SessionView | null> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) return null

  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(`${getRuntimeBaseUrl()}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  let response = await makeRequest(accessToken)
  if (response.status === 401) {
    const refreshed = await refreshAccessToken(true)
    if (!refreshed) {
      clearAuthTokens()
      return null
    }
    response = await makeRequest(refreshed)
  }

  if (!response.ok) {
    clearAuthTokens()
    throw await parseError(response, '恢复会话失败')
  }

  const data = (await response.json()) as BackendUser
  return buildSessionView(data)
}

export async function logoutFromRuntime(): Promise<void> {
  const tokens = getAuthTokens()
  if (!tokens) {
    clearAuthTokens()
    return
  }

  try {
    await fetch(`${getRuntimeBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    })
  } finally {
    clearAuthTokens()
  }
}
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

import { app, safeStorage } from 'electron'
import type { AppConfig, SettingsSavePayload, SettingsView } from '@shared/types/config'

const DEFAULT_MODEL = 'qwen3.5-35b-a3b'

/** 磁盘持久化格式 */
interface PersistedConfig {
  /** safeStorage 加密后的 base64；isEncryptionAvailable() 为 false 时此字段为空 */
  apiKeyEncrypted?: string
  /** 加密不可用时的明文回退（headless Linux 等场景） */
  apiKeyPlain?: string
  accessTokenEncrypted?: string
  accessTokenPlain?: string
  refreshTokenEncrypted?: string
  refreshTokenPlain?: string
  authExpiresAt?: string
  baseURL: string
  model: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

function getConfigPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

function readPersisted(): PersistedConfig {
  const path = getConfigPath()
  if (!existsSync(path)) return { baseURL: '', model: DEFAULT_MODEL }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PersistedConfig
  } catch {
    return { baseURL: '', model: DEFAULT_MODEL }
  }
}

function writePersisted(data: PersistedConfig): void {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  writeFileSync(getConfigPath(), JSON.stringify(data, null, 2), 'utf-8')
}

function encryptSecret(secret: string): { encrypted?: string; plain?: string } {
  if (safeStorage.isEncryptionAvailable()) {
    return { encrypted: safeStorage.encryptString(secret).toString('base64') }
  }

  console.warn('[config] safeStorage 不可用，敏感信息将以明文存储。建议安装 libsecret。')
  return { plain: secret }
}

function decryptSecret(encrypted?: string, plain?: string): string {
  if (encrypted) {
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      return ''
    }
  }
  return plain ?? ''
}

/**
 * 读取运行时配置（解密后）。
 * 优先级：userData/config.json > process.env（dev 模式 dotenv 回退）
 */
export function getConfig(): AppConfig {
  const persisted = readPersisted()

  let apiKey = decryptSecret(persisted.apiKeyEncrypted, persisted.apiKeyPlain)

  // dev 回退：若 userData 中无配置，从 process.env 读取（dotenv 已在 index.ts 中加载）
  if (!apiKey) apiKey = process.env['OPENAI_API_KEY'] ?? ''
  const baseURL = persisted.baseURL || process.env['OPENAI_API_BASE_URL'] || ''
  const model = persisted.model || DEFAULT_MODEL

  return { apiKey, baseURL, model }
}

/** 将设置持久化到 userData/config.json（apiKey 使用 safeStorage 加密） */
export function saveConfig(payload: SettingsSavePayload): void {
  const existing = readPersisted()

  let apiKeyEncrypted: string | undefined
  let apiKeyPlain: string | undefined

  if (payload.apiKey) {
    const encoded = encryptSecret(payload.apiKey)
    apiKeyEncrypted = encoded.encrypted
    apiKeyPlain = encoded.plain
  } else {
    // apiKey 为空 = 不修改现有 key
    apiKeyEncrypted = existing.apiKeyEncrypted
    apiKeyPlain = existing.apiKeyPlain
  }

  writePersisted({
    apiKeyEncrypted,
    apiKeyPlain,
    accessTokenEncrypted: existing.accessTokenEncrypted,
    accessTokenPlain: existing.accessTokenPlain,
    refreshTokenEncrypted: existing.refreshTokenEncrypted,
    refreshTokenPlain: existing.refreshTokenPlain,
    authExpiresAt: existing.authExpiresAt,
    baseURL: payload.baseURL,
    model: payload.model || DEFAULT_MODEL,
  })
}

export function getAuthTokens(): AuthTokens | null {
  const persisted = readPersisted()
  const accessToken = decryptSecret(persisted.accessTokenEncrypted, persisted.accessTokenPlain)
  const refreshToken = decryptSecret(persisted.refreshTokenEncrypted, persisted.refreshTokenPlain)
  const expiresAt = persisted.authExpiresAt ?? ''

  if (!accessToken || !refreshToken || !expiresAt) return null
  return { accessToken, refreshToken, expiresAt }
}

export function saveAuthTokens(tokens: AuthTokens): void {
  const existing = readPersisted()
  const access = encryptSecret(tokens.accessToken)
  const refresh = encryptSecret(tokens.refreshToken)

  writePersisted({
    ...existing,
    accessTokenEncrypted: access.encrypted,
    accessTokenPlain: access.plain,
    refreshTokenEncrypted: refresh.encrypted,
    refreshTokenPlain: refresh.plain,
    authExpiresAt: tokens.expiresAt,
  })
}

export function clearAuthTokens(): void {
  const existing = readPersisted()
  writePersisted({
    ...existing,
    accessTokenEncrypted: undefined,
    accessTokenPlain: undefined,
    refreshTokenEncrypted: undefined,
    refreshTokenPlain: undefined,
    authExpiresAt: undefined,
  })
}

/** 返回给 renderer 的 masked 视图（apiKey 明文不离开 main 进程） */
export function getSettingsView(): SettingsView {
  const config = getConfig()
  const k = config.apiKey
  const apiKeyMasked = k ? `${k.slice(0, 6)}${'*'.repeat(Math.min(k.length - 6, 20))}` : ''
  return { apiKeyMasked, baseURL: config.baseURL, model: config.model }
}

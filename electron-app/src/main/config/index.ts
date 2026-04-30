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
  baseURL: string
  model: string
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

/**
 * 读取运行时配置（解密后）。
 * 优先级：userData/config.json > process.env（dev 模式 dotenv 回退）
 */
export function getConfig(): AppConfig {
  const persisted = readPersisted()

  let apiKey = ''
  if (persisted.apiKeyEncrypted) {
    try {
      apiKey = safeStorage.decryptString(Buffer.from(persisted.apiKeyEncrypted, 'base64'))
    } catch {
      apiKey = ''
    }
  } else if (persisted.apiKeyPlain) {
    apiKey = persisted.apiKeyPlain
  }

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
    if (safeStorage.isEncryptionAvailable()) {
      apiKeyEncrypted = safeStorage.encryptString(payload.apiKey).toString('base64')
    } else {
      // 加密不可用（headless Linux）时明文存储，记录警告
      console.warn('[config] safeStorage 不可用，apiKey 将以明文存储。建议安装 libsecret。')
      apiKeyPlain = payload.apiKey
    }
  } else {
    // apiKey 为空 = 不修改现有 key
    apiKeyEncrypted = existing.apiKeyEncrypted
    apiKeyPlain = existing.apiKeyPlain
  }

  writePersisted({
    apiKeyEncrypted,
    apiKeyPlain,
    baseURL: payload.baseURL,
    model: payload.model || DEFAULT_MODEL,
  })
}

/** 返回给 renderer 的 masked 视图（apiKey 明文不离开 main 进程） */
export function getSettingsView(): SettingsView {
  const config = getConfig()
  const k = config.apiKey
  const apiKeyMasked = k ? `${k.slice(0, 6)}${'*'.repeat(Math.min(k.length - 6, 20))}` : ''
  return { apiKeyMasked, baseURL: config.baseURL, model: config.model }
}

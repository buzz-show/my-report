// @vitest-environment node
/**
 * config/index 单测
 * 验证 getConfig / saveConfig / getSettingsView / getAuthTokens 的磁盘读写逻辑。
 * mock fs（读写函数）和 electron（app.getPath, safeStorage）以消除环境依赖。
 * safeStorage.isEncryptionAvailable() → false，因此所有敏感值以明文存储（apiKeyPlain 等）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userData'),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
    encryptString: vi.fn(),
    decryptString: vi.fn(),
  },
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { getConfig, getSettingsView, saveConfig, getAuthTokens } from '../index'

const CONFIG_PATH = '/tmp/test-userData/config.json'
const DEFAULT_MODEL = 'qwen3.5-35b-a3b'

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env['OPENAI_API_KEY']
  delete process.env['OPENAI_API_BASE_URL']
})

describe('getConfig', () => {
  it('returns default values when config file does not exist', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    const config = getConfig()

    expect(config.model).toBe(DEFAULT_MODEL)
    expect(config.baseURL).toBe('')
    expect(config.apiKey).toBe('')
  })

  it('reads values from the config file when it exists', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ apiKeyPlain: 'my-api-key', baseURL: 'http://api.test', model: 'gpt-4' })
    )

    const config = getConfig()

    expect(config.apiKey).toBe('my-api-key')
    expect(config.baseURL).toBe('http://api.test')
    expect(config.model).toBe('gpt-4')
  })

  it('falls back to OPENAI_API_KEY env var when no key is in config', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    process.env['OPENAI_API_KEY'] = 'env-api-key'

    const config = getConfig()

    expect(config.apiKey).toBe('env-api-key')
  })

  it('falls back to DEFAULT_MODEL when model field is missing', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ apiKeyPlain: 'k', baseURL: '' }))

    const config = getConfig()

    expect(config.model).toBe(DEFAULT_MODEL)
  })
})

describe('saveConfig', () => {
  it('writes to the correct config path', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    saveConfig({ apiKey: 'new-key', baseURL: 'http://x.com', model: 'gpt-4o' })

    expect(writeFileSync).toHaveBeenCalledWith(CONFIG_PATH, expect.any(String), 'utf-8')
  })

  it('stores apiKey in plain when safeStorage is unavailable', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    saveConfig({ apiKey: 'sk-plaintext', baseURL: '', model: DEFAULT_MODEL })

    const writtenJson = vi.mocked(writeFileSync).mock.calls[0][1] as string
    const written = JSON.parse(writtenJson)
    expect(written.apiKeyPlain).toBe('sk-plaintext')
    expect(written.apiKeyEncrypted).toBeUndefined()
  })

  it('preserves existing apiKey when new apiKey is empty', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ apiKeyPlain: 'existing-key', baseURL: '', model: DEFAULT_MODEL })
    )

    saveConfig({ apiKey: '', baseURL: 'http://new.url', model: DEFAULT_MODEL })

    const writtenJson = vi.mocked(writeFileSync).mock.calls[0][1] as string
    const written = JSON.parse(writtenJson)
    expect(written.apiKeyPlain).toBe('existing-key')
  })
})

describe('getSettingsView', () => {
  it('masks API key with asterisks', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ apiKeyPlain: 'sk-abcdefghijklmnop', baseURL: '', model: 'gpt-4' })
    )

    const view = getSettingsView()

    expect(view.apiKeyMasked).toMatch(/^sk-abc/)
    expect(view.apiKeyMasked).toContain('*')
  })

  it('returns empty string for masked key when no API key is set', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    const view = getSettingsView()

    expect(view.apiKeyMasked).toBe('')
  })

  it('includes baseURL and model in the view', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        apiKeyPlain: 'sk-longenoughkey',
        baseURL: 'http://custom.api',
        model: 'my-model',
      })
    )

    const view = getSettingsView()

    expect(view.baseURL).toBe('http://custom.api')
    expect(view.model).toBe('my-model')
  })
})

describe('getAuthTokens', () => {
  it('returns null when no auth tokens are stored', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    expect(getAuthTokens()).toBeNull()
  })

  it('returns null when tokens are incomplete', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ accessTokenPlain: 'at', baseURL: '', model: DEFAULT_MODEL })
      // Missing refreshToken and expiresAt
    )

    expect(getAuthTokens()).toBeNull()
  })

  it('returns AuthTokens when all fields are present', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        accessTokenPlain: 'at',
        refreshTokenPlain: 'rt',
        authExpiresAt: '2999-01-01T00:00:00Z',
        baseURL: '',
        model: DEFAULT_MODEL,
      })
    )

    const tokens = getAuthTokens()

    expect(tokens).toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: '2999-01-01T00:00:00Z',
    })
  })
})

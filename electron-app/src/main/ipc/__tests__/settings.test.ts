// @vitest-environment node
/**
 * ipc/settings 单测
 * 验证：
 *   1. SETTINGS_GET 和 SETTINGS_SAVE channel 均已注册
 *   2. SETTINGS_GET 调用 getSettingsView 并返回结果
 *   3. SETTINGS_SAVE 调用 saveConfig + resetClient
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CHANNELS } from '@shared/constants/ipc-channels'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))

vi.mock('../../config', () => ({
  getSettingsView: vi.fn(),
  saveConfig: vi.fn(),
}))

vi.mock('../../ai/client', () => ({
  resetClient: vi.fn(),
}))

import { ipcMain } from 'electron'
import { getSettingsView, saveConfig } from '../../config'
import { resetClient } from '../../ai/client'
import { registerSettingsHandlers } from '../settings'

type Handler = (_event: unknown, ...args: unknown[]) => unknown

function getHandler(channel: string): Handler {
  const call = vi.mocked(ipcMain.handle).mock.calls.find(([ch]) => ch === channel)
  if (!call) throw new Error(`No handler registered for channel: ${channel}`)
  return call[1] as Handler
}

beforeEach(() => {
  vi.clearAllMocks()
  registerSettingsHandlers()
})

describe('registerSettingsHandlers', () => {
  it('registers SETTINGS_GET and SETTINGS_SAVE channels', () => {
    const registered = vi.mocked(ipcMain.handle).mock.calls.map(([ch]) => ch)
    expect(registered).toContain(CHANNELS.SETTINGS_GET)
    expect(registered).toContain(CHANNELS.SETTINGS_SAVE)
  })

  describe('SETTINGS_GET', () => {
    it('returns value from getSettingsView', () => {
      const mockView = { apiKeyMasked: 'sk-abc***', baseURL: 'http://localhost', model: 'gpt-4' }
      vi.mocked(getSettingsView).mockReturnValue(mockView)
      const handler = getHandler(CHANNELS.SETTINGS_GET)
      const result = handler({})
      expect(result).toEqual(mockView)
      expect(getSettingsView).toHaveBeenCalledTimes(1)
    })
  })

  describe('SETTINGS_SAVE', () => {
    it('calls saveConfig with the provided payload', () => {
      const payload = { apiKey: 'new-key', baseURL: 'http://api.example.com', model: 'gpt-4o' }
      const handler = getHandler(CHANNELS.SETTINGS_SAVE)
      handler({}, payload)
      expect(saveConfig).toHaveBeenCalledWith(payload)
    })

    it('calls resetClient after saving', () => {
      const handler = getHandler(CHANNELS.SETTINGS_SAVE)
      handler({}, { apiKey: 'k', baseURL: '', model: 'm' })
      expect(resetClient).toHaveBeenCalledTimes(1)
    })
  })
})

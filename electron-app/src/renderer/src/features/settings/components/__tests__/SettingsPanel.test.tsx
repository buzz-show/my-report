/**
 * features/settings/components/SettingsPanel 单测
 * 验证：
 *   - mount 时调用 getSettings
 *   - 加载后字段值正确显示
 *   - 修改 model 并保存 → saveSettings 以新值被调用
 *   - 点击 × 关闭按钮 → onClose 回调被触发
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from '../SettingsPanel'

const mockSettings = {
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}

const defaultView = {
  apiKeyMasked: 'sk-abc***',
  baseURL: 'http://api.test',
  model: 'gpt-4',
}

beforeEach(() => {
  vi.stubGlobal('electronAPI', { settings: mockSettings })
  vi.clearAllMocks()
  mockSettings.getSettings.mockResolvedValue(defaultView)
  mockSettings.saveSettings.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SettingsPanel', () => {
  it('calls getSettings on mount', async () => {
    render(<SettingsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(mockSettings.getSettings).toHaveBeenCalledTimes(1))
  })

  it('displays loaded baseURL and model values', async () => {
    render(<SettingsPanel onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('http://api.test')).toBeTruthy()
      expect(screen.getByDisplayValue('gpt-4')).toBeTruthy()
    })
  })

  it('calls saveSettings with updated payload on save', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel onClose={vi.fn()} />)

    // Wait for fields to populate
    await waitFor(() => expect(screen.getByDisplayValue('gpt-4')).toBeTruthy())

    // Change model
    const modelInput = screen.getByDisplayValue('gpt-4')
    await user.clear(modelInput)
    await user.type(modelInput, 'gpt-4o')

    // Click save
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockSettings.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o', baseURL: 'http://api.test' })
      )
    })
  })

  it('calls onClose when the × button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsPanel onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '×' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when 取消 button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsPanel onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '取消' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

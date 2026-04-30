import { useState, useEffect, useRef } from 'react'
import type { SettingsSavePayload } from '@shared/types/config'

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState('')
  const [model, setModel] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const apiKeyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.electronAPI.getSettings().then(view => {
      setApiKeyMasked(view.apiKeyMasked)
      setBaseURL(view.baseURL)
      setModel(view.model)
    })
    // focus apiKey field on open
    setTimeout(() => apiKeyRef.current?.focus(), 50)
  }, [])

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const payload: SettingsSavePayload = {
        apiKey, // empty = keep existing
        baseURL,
        model,
      }
      await window.electronAPI.saveSettings(payload)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">API 设置</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              API Key
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              ref={apiKeyRef}
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={apiKeyMasked || '输入新的 API Key'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
            {apiKeyMasked && (
              <p className="text-xs text-gray-600 mt-1">留空则保留现有 Key ({apiKeyMasked})</p>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base URL（可选）</label>
            <input
              type="text"
              value={baseURL}
              onChange={e => setBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
            <p className="text-xs text-gray-600 mt-1">兼容私有部署或国内镜像，留空使用官方端点</p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">模型</label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="qwen3.5-35b-a3b"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {saved ? '已保存 ✓' : saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

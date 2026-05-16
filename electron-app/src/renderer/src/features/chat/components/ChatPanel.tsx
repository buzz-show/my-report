import { useState } from 'react'

import { useChatStore } from '../store/chatStore'
import SettingsPanel from '../../../features/settings/components/SettingsPanel'

import MessageList from './MessageList'
import InputBar from './InputBar'

export default function ChatPanel() {
  const { clearMessages: _clearMessages } = useChatStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* decorative glow */}
      <div className="petal-deco -bottom-32 -right-32 opacity-40 pointer-events-none" />

      {/* Panel Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[rgba(196,115,122,0.1)] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* AI avatar */}
            <div
              className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#f2dde3] via-[#f5e5e8] to-[#eef5f7] flex items-center justify-center flex-shrink-0"
              style={{
                boxShadow: '0 1px 3px rgba(28,22,20,0.04), 0 4px 12px rgba(196,115,122,0.06)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"
                  fill="#c4737a"
                />
              </svg>
              {/* online dot */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#7faa96] rounded-full border-2 border-white shadow-sm" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#1c1614] tracking-[-0.01em]">
                代办官
              </h3>
              <p className="text-[11px] text-[#6d8f96] font-medium">
                ● 在线 · 正在整理你的今日工作
              </p>
            </div>
          </div>
          {/* More / Settings button — kept as title="API 设置" for e2e */}
          <button
            onClick={() => setShowSettings(true)}
            title="API 设置"
            className="w-8 h-8 rounded-xl bg-[rgba(28,22,20,0.04)] flex items-center justify-center text-[#a49494] hover:bg-[#fdf0f2] hover:text-[#c4737a] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
        {/* Context chips */}
        <div className="flex gap-1.5 flex-wrap">
          {['总结今日', '拆分待办', '补充进展', '生成述职草稿'].map(label => (
            <button
              key={label}
              className="chip text-[11px] font-medium text-[#6b5e5e] bg-[rgba(28,22,20,0.05)] rounded-xl px-3 py-1.5 border border-[rgba(28,22,20,0.06)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <MessageList />
      <InputBar />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

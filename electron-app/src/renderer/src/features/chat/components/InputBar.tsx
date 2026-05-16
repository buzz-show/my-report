import { useState, KeyboardEvent, useRef, useEffect } from 'react'

import { useStreamChat } from '../hooks/useStreamChat'

export default function InputBar() {
  const [input, setInput] = useState('')
  const { sendMessage, streaming } = useStreamChat()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const handleSend = () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-5 pt-3 border-t border-[rgba(196,115,122,0.1)] flex-shrink-0 relative z-10">
      <div
        className="glass rounded-xl border border-[rgba(196,115,122,0.16)] overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(28,22,20,0.04), 0 4px 12px rgba(196,115,122,0.06)' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={streaming ? '正在生成回复…' : '让代办官整理待办、补充进展或生成总结…'}
          disabled={streaming}
          rows={2}
          className="w-full bg-transparent text-[14px] text-[#1c1614] placeholder:text-[#a49494] px-4 pt-3 pb-1 outline-none resize-none block leading-relaxed disabled:opacity-50 max-h-40"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          {/* Left: attach + mic */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#a49494] hover:text-[#c4737a] hover:bg-[#fdf0f2] transition-all"
              aria-label="附件"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#a49494] hover:text-[#c4737a] hover:bg-[#fdf0f2] transition-all"
              aria-label="语音"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          {/* Right: send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="flex items-center gap-1.5 bg-[#c4737a] text-white rounded-xl px-3.5 py-1.5 text-[12px] font-semibold hover:bg-[#b56870] disabled:bg-[#d4a8ac] disabled:cursor-not-allowed transition-all active:scale-[0.97]"
            style={{ boxShadow: '0 2px 8px rgba(196,115,122,0.35)' }}
            aria-label="发送"
          >
            {streaming ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
            发送
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[#a49494] text-center mt-2">代办官 · 由 AI 驱动</p>
    </div>
  )
}

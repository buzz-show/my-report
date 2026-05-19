import { useEffect, useState } from 'react'

import type { Task } from '../types'
import { useTaskStore } from '../store/taskStore'

type Priority = Task['priority']

const PRIORITIES: Array<{
  value: Priority
  label: string
  bg: string
  text: string
  border: string
  ring: string
}> = [
  {
    value: 'high',
    label: '高优先级',
    bg: 'bg-[var(--petal-xlight)]',
    text: 'text-[var(--petal)]',
    border: 'border-[rgba(196,115,122,0.24)]',
    ring: 'ring-[var(--petal)]',
  },
  {
    value: 'medium',
    label: '中优先级',
    bg: 'bg-[rgba(232,168,124,0.12)]',
    text: 'text-[#c48240]',
    border: 'border-[rgba(232,168,124,0.28)]',
    ring: 'ring-[#e8a87c]',
  },
  {
    value: 'low',
    label: '低优先级',
    bg: 'bg-[var(--teal-xlight)]',
    text: 'text-[var(--teal)]',
    border: 'border-[rgba(109,143,150,0.28)]',
    ring: 'ring-[var(--teal)]',
  },
]

const BADGE_MAP: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const TAGS: Array<{
  label: string
  bg: string
  text: string
  selectedBg: string
  selectedText: string
  selectedBorder: string
}> = [
  {
    label: '深度工作',
    bg: 'bg-[rgba(28,22,20,0.05)]',
    text: 'text-[var(--ink-muted)]',
    selectedBg: 'bg-[var(--petal-xlight)]',
    selectedText: 'text-[var(--petal)]',
    selectedBorder: 'border-[rgba(196,115,122,0.32)]',
  },
  {
    label: '会议协作',
    bg: 'bg-[rgba(28,22,20,0.05)]',
    text: 'text-[var(--ink-muted)]',
    selectedBg: 'bg-[var(--teal-xlight)]',
    selectedText: 'text-[var(--teal)]',
    selectedBorder: 'border-[rgba(109,143,150,0.32)]',
  },
  {
    label: '规划推进',
    bg: 'bg-[rgba(28,22,20,0.05)]',
    text: 'text-[var(--ink-muted)]',
    selectedBg: 'bg-[rgba(232,168,124,0.14)]',
    selectedText: 'text-[#c48240]',
    selectedBorder: 'border-[rgba(232,168,124,0.32)]',
  },
  {
    label: '风险问题',
    bg: 'bg-[rgba(28,22,20,0.05)]',
    text: 'text-[var(--ink-muted)]',
    selectedBg: 'bg-[rgba(139,127,150,0.12)]',
    selectedText: 'text-[#8b7f96]',
    selectedBorder: 'border-[rgba(139,127,150,0.3)]',
  },
]

export default function NewTaskModal() {
  const { modalOpen, closeModal, addTask } = useTaskStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('high')
  const [time, setTime] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Close on Escape
  useEffect(() => {
    if (!modalOpen) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modalOpen, closeModal])

  // Reset form when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTitle('')
      setDescription('')
      setPriority('high')
      setTime('')
      setSelectedTags([])
    }
  }, [modalOpen])

  if (!modalOpen) return null

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const handleSubmit = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    addTask({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      badge: BADGE_MAP[priority],
      time: time.trim() || '待定',
      tags: selectedTags,
    })
    closeModal()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="新建今日待办"
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-[rgba(28,22,20,0.32)] backdrop-blur-[2px]"
        onClick={closeModal}
        aria-label="关闭弹窗"
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        className="glass-deep relative z-10 mx-4 mb-0 w-full max-w-lg overflow-hidden rounded-t-[28px] sm:mb-auto sm:rounded-[28px]"
        style={{
          boxShadow: '0 8px 40px rgba(28,22,20,0.08), 0 16px 56px rgba(196,115,122,0.12)',
          border: '1px solid rgba(196,115,122,0.12)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(242,221,227,0.5) 0%, transparent 70%)',
            filter: 'blur(32px)',
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-[rgba(196,115,122,0.1)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--petal-light)] via-[#f5e5e8] to-[var(--teal-xlight)]"
              style={{
                boxShadow: '0 1px 3px rgba(28,22,20,0.04), 0 4px 12px rgba(196,115,122,0.06)',
              }}
            >
              <PlusSmIcon />
            </div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              新建今日待办
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(28,22,20,0.04)] text-[var(--ink-faint)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]"
            aria-label="关闭"
          >
            <XIcon />
          </button>
        </div>

        {/* Form body */}
        <div
          className="relative space-y-4 overflow-y-auto px-5 pb-5 pt-4"
          style={{ maxHeight: 'calc(100dvh - 160px)' }}
        >
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              任务标题 <span className="text-[var(--petal)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="你今天要推进什么？"
              autoFocus
              className="w-full rounded-xl border border-[rgba(196,115,122,0.16)] bg-white/80 px-4 py-3 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[rgba(196,115,122,0.4)] focus:ring-2 focus:ring-[rgba(196,115,122,0.12)] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              描述 / 目标
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="这个任务要完成什么，或希望留下什么结果说明…"
              rows={2}
              className="w-full resize-none rounded-xl border border-[rgba(196,115,122,0.16)] bg-white/80 px-4 py-3 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[rgba(196,115,122,0.4)] focus:ring-2 focus:ring-[rgba(196,115,122,0.12)] transition-all"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              优先级
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(p => {
                const isSelected = priority === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={[
                      'rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-all',
                      p.bg,
                      p.text,
                      p.border,
                      isSelected
                        ? `ring-2 ring-offset-1 ${p.ring} scale-[1.02]`
                        : 'opacity-70 hover:opacity-100',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              时间段
            </label>
            <input
              type="text"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="09:00 – 11:00"
              className="w-full rounded-xl border border-[rgba(196,115,122,0.16)] bg-white/80 px-4 py-3 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[rgba(196,115,122,0.4)] focus:ring-2 focus:ring-[rgba(196,115,122,0.12)] transition-all"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag.label)
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => toggleTag(tag.label)}
                    className={[
                      'chip rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-all',
                      isSelected
                        ? `${tag.selectedBg} ${tag.selectedText} ${tag.selectedBorder} scale-[1.02]`
                        : `${tag.bg} border-[rgba(28,22,20,0.06)] ${tag.text}`,
                    ].join(' ')}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[rgba(196,115,122,0.1)] px-5 py-4">
          <button
            onClick={closeModal}
            className="rounded-xl border border-[rgba(196,115,122,0.18)] bg-white/70 px-4 py-2 text-[13px] font-medium text-[var(--ink-muted)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--petal)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(196,115,122,0.35)] transition-all hover:bg-[#b56870] hover:shadow-[0_4px_12px_rgba(196,115,122,0.45)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckSmIcon />
            创建待办
          </button>
        </div>
      </div>
    </div>
  )
}

function PlusSmIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--petal)]"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function XIcon() {
  return (
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
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function CheckSmIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

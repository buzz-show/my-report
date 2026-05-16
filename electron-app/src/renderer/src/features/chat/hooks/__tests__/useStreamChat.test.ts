/**
 * features/chat/hooks/useStreamChat 单测
 * 验证：
 *   - sendMessage 调用 startStream
 *   - onChunk 回调 → updateLastAssistantMessage
 *   - onDone 回调 → streaming=false + 所有 unsubscribe 被调用
 *   - onError 回调 → streaming=false
 *   - 空输入或重复发送被忽略
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamChat } from '../useStreamChat'
import { useChatStore } from '../../store/chatStore'

// Captured callbacks (set by the mock onXxx calls)
const captured = {
  onChunk: (_delta: string) => {},
  onDone: () => {},
  onError: (_msg: string) => {},
  onToolCall: (_p: unknown) => {},
  onToolResult: (_p: unknown) => {},
}

const off = {
  chunk: vi.fn(),
  done: vi.fn(),
  error: vi.fn(),
  toolCall: vi.fn(),
  toolResult: vi.fn(),
}

const mockChat = {
  startStream: vi.fn(),
  onChunk: vi.fn((cb: (d: string) => void) => {
    captured.onChunk = cb
    return off.chunk
  }),
  onDone: vi.fn((cb: () => void) => {
    captured.onDone = cb
    return off.done
  }),
  onError: vi.fn((cb: (m: string) => void) => {
    captured.onError = cb
    return off.error
  }),
  onToolCall: vi.fn((cb: (p: unknown) => void) => {
    captured.onToolCall = cb
    return off.toolCall
  }),
  onToolResult: vi.fn((cb: (p: unknown) => void) => {
    captured.onToolResult = cb
    return off.toolResult
  }),
}

beforeEach(() => {
  vi.stubGlobal('electronAPI', { chat: mockChat })
  vi.clearAllMocks()
  // Reset stub handlers to avoid stale captures
  captured.onChunk = () => {}
  captured.onDone = () => {}
  captured.onError = () => {}
  // Restore mock implementations after clearAllMocks
  mockChat.onChunk.mockImplementation((cb: (d: string) => void) => {
    captured.onChunk = cb
    return off.chunk
  })
  mockChat.onDone.mockImplementation((cb: () => void) => {
    captured.onDone = cb
    return off.done
  })
  mockChat.onError.mockImplementation((cb: (m: string) => void) => {
    captured.onError = cb
    return off.error
  })
  mockChat.onToolCall.mockImplementation((cb: (p: unknown) => void) => {
    captured.onToolCall = cb
    return off.toolCall
  })
  mockChat.onToolResult.mockImplementation((cb: (p: unknown) => void) => {
    captured.onToolResult = cb
    return off.toolResult
  })

  act(() => {
    useChatStore.getState().clearMessages()
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useStreamChat', () => {
  it('starts not streaming', () => {
    const { result } = renderHook(() => useStreamChat())
    expect(result.current.streaming).toBe(false)
  })

  it('calls startStream and sets streaming=true on sendMessage', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('Hello')
    })

    expect(mockChat.startStream).toHaveBeenCalledOnce()
    expect(result.current.streaming).toBe(true)
  })

  it('ignores empty input', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('   ')
    })

    expect(mockChat.startStream).not.toHaveBeenCalled()
    expect(result.current.streaming).toBe(false)
  })

  it('ignores send while already streaming', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('First')
    })
    act(() => {
      result.current.sendMessage('Second while streaming')
    })

    expect(mockChat.startStream).toHaveBeenCalledTimes(1)
  })

  it('updates last assistant message on chunk', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('Hi')
    })
    act(() => {
      captured.onChunk('Hello')
    })

    const messages = useChatStore.getState().messages
    const last = messages[messages.length - 1]
    expect(last.role).toBe('assistant')
    expect(last.content).toContain('Hello')
  })

  it('sets streaming=false and calls all unsubscribers on done', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('Hi')
    })
    act(() => {
      captured.onDone()
    })

    expect(result.current.streaming).toBe(false)
    expect(off.chunk).toHaveBeenCalled()
    expect(off.done).toHaveBeenCalled()
    expect(off.error).toHaveBeenCalled()
  })

  it('sets streaming=false on error', () => {
    const { result } = renderHook(() => useStreamChat())

    act(() => {
      result.current.sendMessage('Hi')
    })
    act(() => {
      captured.onError('API Error')
    })

    expect(result.current.streaming).toBe(false)
  })
})

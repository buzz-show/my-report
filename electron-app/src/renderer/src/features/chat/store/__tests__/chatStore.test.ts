/**
 * chatStore 单测（Zustand store 纯逻辑测试，不涉及 DOM）
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

import { useChatStore } from '../chatStore'

// 每个用例前重置 store
beforeEach(() => {
  act(() => {
    useChatStore.getState().clearMessages()
    useChatStore
      .getState()
      .setSystemPrompt('You are a helpful assistant. Respond in the same language as the user.')
  })
})

describe('chatStore', () => {
  describe('addMessage', () => {
    it('添加消息后 messages 长度 +1', () => {
      act(() => {
        useChatStore.getState().addMessage({ role: 'user', content: 'hello' })
      })
      expect(useChatStore.getState().messages).toHaveLength(1)
    })

    it('消息有自动生成的 id', () => {
      act(() => {
        useChatStore.getState().addMessage({ role: 'user', content: 'test' })
      })
      const [msg] = useChatStore.getState().messages
      expect(msg.id).toMatch(/^msg-/)
    })
  })

  describe('updateLastAssistantMessage', () => {
    it('流式拼接内容', () => {
      act(() => {
        useChatStore.getState().addMessage({ role: 'assistant', content: 'Hello' })
        useChatStore.getState().updateLastAssistantMessage(', world')
      })
      const last = useChatStore.getState().messages.at(-1)!
      expect(last.content).toBe('Hello, world')
    })

    it('非 assistant 消息不受影响', () => {
      act(() => {
        useChatStore.getState().addMessage({ role: 'user', content: 'hi' })
        useChatStore.getState().updateLastAssistantMessage(' extra')
      })
      const last = useChatStore.getState().messages.at(-1)!
      expect(last.content).toBe('hi')
    })
  })

  describe('clearMessages', () => {
    it('清空后 messages 为空数组', () => {
      act(() => {
        useChatStore.getState().addMessage({ role: 'user', content: 'a' })
        useChatStore.getState().clearMessages()
      })
      expect(useChatStore.getState().messages).toHaveLength(0)
    })
  })

  describe('setSystemPrompt', () => {
    it('更新 systemPrompt', () => {
      act(() => {
        useChatStore.getState().setSystemPrompt('new prompt')
      })
      expect(useChatStore.getState().systemPrompt).toBe('new prompt')
    })
  })

  describe('updateToolCallResult', () => {
    it('按 id 更新对应 toolCall 的 result', () => {
      act(() => {
        useChatStore.getState().addMessage({
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'tc-1', name: 'calculate', args: '{}', result: undefined }],
        })
        useChatStore.getState().updateToolCallResult('tc-1', '42')
      })
      const tc = useChatStore.getState().messages[0].toolCalls![0]
      expect(tc.result).toBe('42')
    })
  })
})

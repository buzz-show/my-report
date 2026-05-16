// @vitest-environment node
/**
 * ai/loop 单测
 * 验证 runReActLoop 的核心行为：
 *   1. 文本 chunk → 发送 CHAT_STREAM_CHUNK
 *   2. finish_reason=stop → 正常 resolve
 *   3. finish_reason=tool_calls → 执行工具 → 发送 CHAT_TOOL_CALL / CHAT_TOOL_RESULT → 递归
 *   4. stream 抛错 → 向上 throw
 *
 * mock 链：getOpenAI（OpenAI client）/ getConfig / TOOL_DEFINITIONS + executeTool
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IpcMainEvent } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'

vi.mock('../client', () => ({
  getOpenAI: vi.fn(),
}))

vi.mock('../../config', () => ({
  getConfig: vi.fn(() => ({ model: 'test-model', apiKey: 'test-key', baseURL: '' })),
}))

vi.mock('../../tools', () => ({
  TOOL_DEFINITIONS: [],
  executeTool: vi.fn(),
}))

import { getOpenAI } from '../client'
import { executeTool } from '../../tools'
import { runReActLoop } from '../loop'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockEvent() {
  return { sender: { send: vi.fn() } } as unknown as IpcMainEvent
}

async function* chunkStream(
  chunks: Array<{
    content?: string
    tool_calls?: Array<{
      index: number
      id?: string
      function?: { name?: string; arguments?: string }
    }>
    finish_reason?: string | null
  }>
) {
  for (const c of chunks) {
    yield {
      choices: [
        {
          delta: {
            content: c.content ?? '',
            tool_calls: c.tool_calls,
          },
          finish_reason: c.finish_reason ?? null,
        },
      ],
    }
  }
}

function setupClient(createMock: ReturnType<typeof vi.fn>) {
  vi.mocked(getOpenAI).mockReturnValue({
    chat: { completions: { create: createMock } },
  } as unknown as ReturnType<typeof getOpenAI>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runReActLoop', () => {
  it('sends text deltas via CHAT_STREAM_CHUNK', async () => {
    const event = makeMockEvent()
    const stream = chunkStream([
      { content: 'Hello' },
      { content: ', world' },
      { finish_reason: 'stop' },
    ])
    setupClient(vi.fn().mockResolvedValue(stream))

    await runReActLoop(event, [])

    expect(event.sender.send).toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_CHUNK, 'Hello')
    expect(event.sender.send).toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_CHUNK, ', world')
  })

  it('resolves without error on finish_reason=stop', async () => {
    const event = makeMockEvent()
    setupClient(vi.fn().mockResolvedValue(chunkStream([{ finish_reason: 'stop' }])))

    await expect(runReActLoop(event, [])).resolves.toBeUndefined()
  })

  it('does not crash on empty chunk content', async () => {
    const event = makeMockEvent()
    setupClient(
      vi.fn().mockResolvedValue(chunkStream([{ content: '' }, { finish_reason: 'stop' }]))
    )

    await expect(runReActLoop(event, [])).resolves.toBeUndefined()
    // Empty content delta should NOT trigger a send
    const chunkCalls = vi
      .mocked(event.sender.send)
      .mock.calls.filter(([ch]) => ch === CHANNELS.CHAT_STREAM_CHUNK)
    expect(chunkCalls).toHaveLength(0)
  })

  it('dispatches tool call and sends CHAT_TOOL_CALL / CHAT_TOOL_RESULT, then recurses', async () => {
    vi.mocked(executeTool).mockReturnValue('42')

    const event = makeMockEvent()
    const mockCreate = vi
      .fn()
      // First call: stream with a tool_call chunk then finish_reason=tool_calls
      .mockResolvedValueOnce(
        chunkStream([
          {
            tool_calls: [
              {
                index: 0,
                id: 'call-1',
                function: { name: 'calculate', arguments: '{"expr":"1+1"}' },
              },
            ],
          },
          { finish_reason: 'tool_calls' },
        ])
      )
      // Second call (recursive): just stop
      .mockResolvedValueOnce(chunkStream([{ finish_reason: 'stop' }]))

    setupClient(mockCreate)

    await runReActLoop(event, [])

    expect(executeTool).toHaveBeenCalledWith('calculate', { expr: '1+1' })
    expect(event.sender.send).toHaveBeenCalledWith(
      CHANNELS.CHAT_TOOL_CALL,
      expect.objectContaining({ id: 'call-1', name: 'calculate' })
    )
    expect(event.sender.send).toHaveBeenCalledWith(
      CHANNELS.CHAT_TOOL_RESULT,
      expect.objectContaining({ id: 'call-1', result: '42' })
    )
    // Verify the recursive call happened
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('propagates errors thrown by the stream', async () => {
    const event = makeMockEvent()

    async function* errorStream() {
      throw new Error('Stream failed')
      // eslint-disable-next-line no-unreachable
      yield // make TypeScript treat this as an async generator
    }

    setupClient(vi.fn().mockResolvedValue(errorStream()))

    await expect(runReActLoop(event, [])).rejects.toThrow('Stream failed')
  })
})

/**
 * Python AI Runtime 适配器
 *
 * 职责：
 *   1. 通过 HTTP SSE 调用本地 FastAPI server（ai-runtime）
 *   2. 解析 LangGraph astream_events 格式，翻译为与 loop.ts 相同的 IPC 事件
 *
 * 与 loop.ts 的关系：
 *   - 两者实现相同的对外签名：runReActLoop(event, messages)
 *   - ipc/chat.ts 只需切换 import 来源即可在两种后端之间切换
 *
 * 开发时：手动启动 Python server（uvicorn ai_runtime.server:app --port 18765）
 * 生产时：由 main/index.ts 通过 spawn 启动子进程，端口自动确定后注入 AI_RUNTIME_PORT
 */

import { IpcMainEvent } from 'electron'
import OpenAI from 'openai'

import { CHANNELS } from '@shared/constants/ipc-channels'
import { getValidAccessToken, refreshAccessToken } from '../auth/client'

type Messages = OpenAI.ChatCompletionMessageParam[]

const DEFAULT_PORT = 18765

function getRuntimeBaseUrl(): string {
  const port = process.env['AI_RUNTIME_PORT'] ?? DEFAULT_PORT
  return `http://127.0.0.1:${port}`
}

/**
 * 将 LangGraph astream_events (v2) 解析为 IPC 推送。
 *
 * 关键事件映射：
 *   on_chat_model_stream  → CHAT_STREAM_CHUNK  (文字增量)
 *   on_tool_start         → CHAT_TOOL_CALL
 *   on_tool_end           → CHAT_TOOL_RESULT
 *   [DONE]                → 流结束标志（由 server.py 发送）
 */
export async function runWithPythonRuntime(
  event: IpcMainEvent,
  messages: Messages
): Promise<void> {
  const baseUrl = getRuntimeBaseUrl()

  const body = JSON.stringify({
    messages: messages
      .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map(m => ({ role: m.role, content: m.content ?? '' })),
    thread_id: `session-${Date.now()}`,
  })

  const response = await fetchChatStream(baseUrl, body)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`AI Runtime HTTP ${response.status}: ${text}`)
  }

  if (!response.body) throw new Error('AI Runtime: empty response body')

  const decoder = new TextDecoder()
  const reader = response.body.getReader()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // keep incomplete last line in buffer
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return

      let ev: Record<string, unknown>
      try {
        ev = JSON.parse(raw)
      } catch {
        continue
      }

      handleEvent(ev, event)
    }
  }
}

async function fetchChatStream(baseUrl: string, body: string): Promise<Response> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    throw new Error('登录已过期，请重新登录')
  }

  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    })
  }

  let response = await makeRequest(accessToken)
  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken(true)
    if (!refreshedToken) {
      throw new Error('登录已过期，请重新登录')
    }
    response = await makeRequest(refreshedToken)
  }

  return response
}

function handleEvent(ev: Record<string, unknown>, ipc: IpcMainEvent): void {
  const evName = ev['event'] as string | undefined
  const data = ev['data'] as Record<string, unknown> | undefined

  if (ev['type'] === 'error') {
    throw new Error(String(ev['message'] ?? 'Unknown error from AI Runtime'))
  }

  switch (evName) {
    case 'on_chat_model_stream': {
      // data.chunk is an AIMessageChunk
      const chunk = data?.['chunk'] as Record<string, unknown> | undefined
      const content = chunk?.['content']
      if (typeof content === 'string' && content) {
        ipc.sender.send(CHANNELS.CHAT_STREAM_CHUNK, content)
      }
      break
    }

    case 'on_tool_start': {
      const toolName = (ev['name'] as string) ?? 'unknown'
      const runId = (ev['run_id'] as string) ?? ''
      const inputData = data?.['input'] as Record<string, unknown> | undefined
      ipc.sender.send(CHANNELS.CHAT_TOOL_CALL, {
        id: runId,
        name: toolName,
        args: inputData ?? {},
      })
      break
    }

    case 'on_tool_end': {
      const runId = (ev['run_id'] as string) ?? ''
      const output = data?.['output']
      const result =
        typeof output === 'string'
          ? output
          : typeof output === 'object' && output !== null
            ? JSON.stringify(output)
            : String(output ?? '')
      ipc.sender.send(CHANNELS.CHAT_TOOL_RESULT, { id: runId, result })
      break
    }

    default:
      // Ignore other event types (on_chain_start, on_chain_end, etc.)
      break
  }
}

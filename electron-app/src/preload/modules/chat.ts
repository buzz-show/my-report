import { ipcRenderer, type IpcRendererEvent } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { ToolCallPayload, ToolResultPayload } from '@shared/types'

export const chatBridge = {
  startStream: (messages: unknown[]): void => {
    ipcRenderer.send(CHANNELS.CHAT_STREAM_START, messages)
  },

  onChunk: (cb: (delta: string) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, delta: string): void => cb(delta)
    ipcRenderer.on(CHANNELS.CHAT_STREAM_CHUNK, handler)
    return () => ipcRenderer.removeListener(CHANNELS.CHAT_STREAM_CHUNK, handler)
  },

  onDone: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.once(CHANNELS.CHAT_STREAM_DONE, handler)
    return () => ipcRenderer.removeListener(CHANNELS.CHAT_STREAM_DONE, handler)
  },

  onError: (cb: (message: string) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, message: string): void => cb(message)
    ipcRenderer.once(CHANNELS.CHAT_STREAM_ERROR, handler)
    return () => ipcRenderer.removeListener(CHANNELS.CHAT_STREAM_ERROR, handler)
  },

  onToolCall: (cb: (payload: ToolCallPayload) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, payload: ToolCallPayload): void => cb(payload)
    ipcRenderer.on(CHANNELS.CHAT_TOOL_CALL, handler)
    return () => ipcRenderer.removeListener(CHANNELS.CHAT_TOOL_CALL, handler)
  },

  onToolResult: (cb: (payload: ToolResultPayload) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, payload: ToolResultPayload): void => cb(payload)
    ipcRenderer.on(CHANNELS.CHAT_TOOL_RESULT, handler)
    return () => ipcRenderer.removeListener(CHANNELS.CHAT_TOOL_RESULT, handler)
  },
}
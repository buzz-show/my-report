import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type {
  ToolCallPayload,
  ToolResultPayload,
  SettingsView,
  SettingsSavePayload,
} from '@shared/types'

/**
 * Preload — 安全桥梁
 *
 * contextBridge.exposeInMainWorld 是唯一合法通道：
 * - 对暴露对象做深度克隆和类型校验
 * - renderer 只能调用这里明确暴露的方法
 * - 防止 renderer 通过原型链污染 Node.js 环境
 */
contextBridge.exposeInMainWorld('electronAPI', {
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

  getSettings: (): Promise<SettingsView> => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS_GET)
  },

  saveSettings: (payload: SettingsSavePayload): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS_SAVE, payload)
  },
})

/**
 * IPC 通道的 payload 类型定义
 *
 * 与 ipc-channels.ts 中的 CHANNELS 一一对应。
 * Preload 桥接和渲染进程 hook 共同引用，保证类型安全。
 */

export interface ToolCallPayload {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResultPayload {
  id: string
  result: string
}

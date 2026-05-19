import { contextBridge } from 'electron'
import { authBridge } from './modules/auth'
import { chatBridge } from './modules/chat'
import { settingsBridge } from './modules/settings'
import { runtimeBridge } from './modules/runtime'

/**
 * Preload — 安全桥梁
 *
 * contextBridge.exposeInMainWorld 是唯一合法通道：
 * - 对暴露对象做深度克隆和类型校验
 * - renderer 只能调用这里明确暴露的方法
 * - 防止 renderer 通过原型链污染 Node.js 环境
 */
contextBridge.exposeInMainWorld('electronAPI', {
  auth: authBridge,
  chat: chatBridge,
  settings: settingsBridge,
  runtime: runtimeBridge,
})

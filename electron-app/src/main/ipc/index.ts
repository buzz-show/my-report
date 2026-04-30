import { registerChatHandlers } from './chat'
import { registerSettingsHandlers } from './settings'

/**
 * 统一 IPC 注册入口
 *
 * 新增功能域：在此追加一行 register*Handlers()，
 * 对应 ipc/ 目录下新建一个功能文件即可。
 */
export function registerAll(): void {
  registerChatHandlers()
  registerSettingsHandlers()
}

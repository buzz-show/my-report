import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { LoginPayload, SessionView } from '@shared/types'

import {
  loginWithRuntime,
  logoutFromRuntime,
  restoreSession,
} from '../auth/client'

/**
 * 认证 IPC 处理器 — stub 实现
 *
 * 当前阶段使用内存 Map 实现 upsert 语义：
 * - 邮箱不存在 → 自动注册，创建账号
 * - 邮箱已存在 → 校验密码，正确则登录，错误则返回 401
 *
 * 接入 Python FastAPI 后端时只改本文件，renderer 无需修改。
 *
 * 安全原则：
 * - handler 仅返回 SessionView，不包含任何 token 字段
 * - 真实 token 由 main 进程持有，renderer 不可见
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let _session: SessionView | null = null

export function registerAuthHandlers(): void {
  ipcMain.handle(CHANNELS.AUTH_LOGIN, async (_event, payload: LoginPayload): Promise<SessionView> => {
    const { email, password } = payload ?? {}

    // 安全边界：邮箱格式校验
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      throw new Error('请输入有效邮箱')
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('密码不能为空')
    }

    const normalizedEmail = email.trim().toLowerCase()
    _session = await loginWithRuntime({ email: normalizedEmail, password })
    return _session
  })

  ipcMain.handle(CHANNELS.AUTH_LOGOUT, async (): Promise<void> => {
    await logoutFromRuntime()
    _session = null
  })

  ipcMain.handle(CHANNELS.AUTH_GET_SESSION, async (): Promise<SessionView | null> => {
    try {
      _session = await restoreSession()
    } catch {
      _session = null
    }
    return _session
  })
}


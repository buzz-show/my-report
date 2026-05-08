import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/ipc-channels'
import type { LoginPayload, SessionView } from '@shared/types'

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

/** stub 用户存储：email → { userId, displayName, password } */
const _users = new Map<string, { userId: string; displayName: string; password: string }>()

/** 内存中的当前 session（stub 用），正式版改为 safeStorage 持久化 */
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

    // TODO: 替换为真实的 Python FastAPI 请求
    // const res = await fetch(`${PYTHON_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: normalizedEmail, password }),
    // })
    // if (!res.ok) {
    //   const err = await res.json()
    //   throw new Error(err.detail ?? '登录失败')
    // }
    // const data = await res.json()
    // _saveTokenSecurely(data.access_token, data.refresh_token)
    // _session = buildSessionView(data.user)

    // Stub: upsert 语义
    const existing = _users.get(normalizedEmail)

    if (!existing) {
      // 新邮箱 → 自动注册
      const userId = `user-${Date.now()}`
      const displayName = normalizedEmail.split('@')[0]
      _users.set(normalizedEmail, { userId, displayName, password })
      _session = { userId, email: normalizedEmail, displayName, role: 'member', loggedIn: true }
    } else {
      // 已有邮箱 → 校验密码
      if (existing.password !== password) {
        throw new Error('密码错误')
      }
      _session = {
        userId: existing.userId,
        email: normalizedEmail,
        displayName: existing.displayName,
        role: 'member',
        loggedIn: true,
      }
    }

    return _session
  })

  ipcMain.handle(CHANNELS.AUTH_LOGOUT, async (): Promise<void> => {
    // TODO: 通知 Python FastAPI 使 refresh token 失效
    // TODO: 清除本地 safeStorage 中的 token
    _session = null
  })

  ipcMain.handle(CHANNELS.AUTH_GET_SESSION, async (): Promise<SessionView | null> => {
    // TODO: 读取 safeStorage，尝试静默恢复会话
    return _session
  })
}


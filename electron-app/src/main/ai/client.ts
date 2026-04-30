import OpenAI from 'openai'

import { getConfig } from '../config'

/**
 * OpenAI 客户端懒加载单例
 *
 * 首次调用时从 userData/config.json 读取配置（dev 模式自动回退到 .env）。
 * 调用 resetClient() 可清除单例，下次请求时重新读取最新配置（设置保存后使用）。
 */
let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!client) {
    const { apiKey, baseURL } = getConfig()
    if (!apiKey) {
      throw new Error('API Key 未配置。请点击右上角设置图标，填写 API Key 后重试。')
    }
    if (baseURL) console.log('[ai] Using custom base URL:', baseURL)
    client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  }
  return client
}

/** 清除客户端单例，下次调用 getOpenAI() 时重新读取配置 */
export function resetClient(): void {
  client = null
}

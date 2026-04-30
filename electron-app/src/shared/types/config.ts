/**
 * 应用运行时配置类型（解密后的明文，仅在 main 进程内部流转）
 */
export interface AppConfig {
  apiKey: string
  baseURL: string
  model: string
}

/**
 * 传给 renderer 的设置信息（apiKey 以 masked 形式展示）
 */
export interface SettingsView {
  apiKeyMasked: string
  baseURL: string
  model: string
}

/**
 * renderer 保存设置时提交的数据
 * apiKey 为空字符串表示"不修改现有 key"
 */
export interface SettingsSavePayload {
  apiKey: string
  baseURL: string
  model: string
}

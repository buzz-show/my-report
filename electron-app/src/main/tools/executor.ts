import { TOOL_REGISTRY } from './registry'

/**
 * 统一工具调度器
 *
 * 捕获所有运行时异常并返回错误字符串（不抛出），
 * 返回值直接作为 tool role 消息的 content 发回给 LLM。
 */
export function executeTool(name: string, args: Record<string, unknown>): string {
  const handler = TOOL_REGISTRY[name]
  if (!handler) return `错误：未知工具 "${name}"`
  try {
    return handler.execute(args)
  } catch (err) {
    return `错误：工具执行失败 — ${err instanceof Error ? err.message : String(err)}`
  }
}

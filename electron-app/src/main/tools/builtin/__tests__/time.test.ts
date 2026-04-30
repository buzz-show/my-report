/**
 * time tool 单测
 */
import { describe, it, expect, vi } from 'vitest'

import time from '../time'

describe('time tool', () => {
  it('定义名称正确', () => {
    expect(time.definition.function.name).toBe('get_current_time')
  })

  it('返回字符串', () => {
    expect(typeof time.execute()).toBe('string')
  })

  it('返回内容包含当前年份', () => {
    const result = time.execute()
    expect(result).toContain(String(new Date().getFullYear()))
  })

  it('使用 fake timer 时返回对应时间', () => {
    const fixed = new Date('2024-01-15T10:30:00')
    vi.useFakeTimers()
    vi.setSystemTime(fixed)

    const result = time.execute()
    expect(result).toContain('2024')

    vi.useRealTimers()
  })
})

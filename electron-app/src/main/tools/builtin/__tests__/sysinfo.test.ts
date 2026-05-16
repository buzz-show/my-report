// @vitest-environment node
/**
 * tools/builtin/sysinfo 单测
 * sysinfo 仅依赖 Node.js 内置 os 模块，无需 mock。
 */
import { describe, it, expect } from 'vitest'
import sysinfo from '../sysinfo'

describe('sysinfo', () => {
  describe('execute()', () => {
    it('returns a string', () => {
      expect(typeof sysinfo.execute()).toBe('string')
    })

    it('returns valid JSON', () => {
      expect(() => JSON.parse(sysinfo.execute())).not.toThrow()
    })

    it('includes platform, arch and memory fields', () => {
      const result = JSON.parse(sysinfo.execute())
      expect(result).toHaveProperty('platform')
      expect(result).toHaveProperty('arch')
      expect(result).toHaveProperty('totalMemMB')
      expect(result).toHaveProperty('freeMemMB')
    })

    it('includes CPU info', () => {
      const result = JSON.parse(sysinfo.execute())
      expect(result).toHaveProperty('cpuModel')
      expect(result).toHaveProperty('cpuCount')
      expect(typeof result.cpuCount).toBe('number')
      expect(result.cpuCount).toBeGreaterThan(0)
    })

    it('memory values are non-negative numbers', () => {
      const result = JSON.parse(sysinfo.execute())
      expect(result.totalMemMB).toBeGreaterThan(0)
      expect(result.freeMemMB).toBeGreaterThanOrEqual(0)
    })
  })

  describe('definition', () => {
    it('has name "get_system_info"', () => {
      expect(sysinfo.definition.function.name).toBe('get_system_info')
    })

    it('has type "function"', () => {
      expect(sysinfo.definition.type).toBe('function')
    })
  })
})

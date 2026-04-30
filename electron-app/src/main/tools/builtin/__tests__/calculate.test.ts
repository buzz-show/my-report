/**
 * calculate tool 单测
 * 测试重点：白名单校验（安全边界）+ 正常求值
 */
import { describe, it, expect } from 'vitest'

import calculate from '../calculate'

const exec = (expr: string) => calculate.execute({ expression: expr })

describe('calculate tool', () => {
  describe('正常求值', () => {
    it('整数加法', () => {
      expect(exec('1+2')).toBe('3')
    })

    it('带括号的复合表达式', () => {
      expect(exec('(3+5)*2')).toBe('16')
    })

    it('浮点数运算', () => {
      expect(exec('0.1+0.2')).toMatchInlineSnapshot(`"0.30000000000000004"`)
    })

    it('除法', () => {
      expect(exec('10/4')).toBe('2.5')
    })
  })

  describe('白名单安全校验', () => {
    it('拒绝字母字符', () => {
      expect(exec('alert(1)')).toContain('错误')
    })

    it('拒绝 process 访问', () => {
      expect(exec('process.exit(0)')).toContain('错误')
    })

    it('拒绝反引号注入', () => {
      expect(exec('`ls`')).toContain('错误')
    })

    it('拒绝下划线字符', () => {
      expect(exec('__proto__')).toContain('错误')
    })
  })

  describe('边界情况', () => {
    it('除以零返回 Infinity', () => {
      expect(exec('1/0')).toBe('Infinity')
    })

    it('空表达式报错', () => {
      expect(exec('')).toContain('错误')
    })
  })
})

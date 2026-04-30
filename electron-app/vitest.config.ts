import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
    },
  },
  test: {
    // 渲染器单测跑在 jsdom 环境（模拟浏览器）
    // 主进程纯逻辑单测用 node 环境（通过文件名约定区分）
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/renderer/src/main.tsx',
        'src/main/index.ts',
        'src/preload/**',
      ],
      thresholds: {
        lines: 20,
        functions: 25,
        branches: 10,
      },
    },
  },
})

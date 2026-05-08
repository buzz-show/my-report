import { useSyncExternalStore } from 'react'

import type { LayoutMode } from '@renderer/features/home/types'

function readLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'desktop'

  if (window.innerWidth < 640) return 'mobile'
  if (window.innerWidth < 1024) return 'tablet'

  return 'desktop'
}

function subscribe(onStoreChange: () => void) {
  //  在服务器环境中，window 对象不可用，因此直接返回一个空函数
  if (typeof window === 'undefined') return () => undefined

  //   订阅浏览器的 resize 事件，当窗口大小变化时触发 onStoreChange，通知组件重新读取布局模式
  window.addEventListener('resize', onStoreChange)
  //   返回一个取消订阅的函数
  return () => window.removeEventListener('resize', onStoreChange)
}

export function useResponsiveLayout(): LayoutMode {
  return useSyncExternalStore(subscribe, readLayoutMode, () => 'desktop')
}

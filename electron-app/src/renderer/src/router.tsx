/**
 * 路由表 — 对应 Vue Router 的 routes 数组
 *
 * 使用 HashRouter（在 main.tsx 注入），URL 形如 #/today、#/summary
 * 原因：Electron 使用 file:// 协议，BrowserRouter 无法工作，等同 Vue 的 createWebHashHistory()
 */
import { Navigate, Route, Routes } from 'react-router-dom'

import { ResponsiveAppShell } from '@renderer/components/layout/ResponsiveAppShell'
import {
  ProjectsView,
  SlideshowView,
  SummaryView,
  TodayView,
  UpcomingView,
} from '@renderer/features/home/HomeUI'

/**
 * AppRoutes — 对应 Vue 的 <router-view />
 *
 * 结构：
 *   /           → redirect 到 /today
 *   /today      → TodayView（今日任务）
 *   /upcoming   → UpcomingView（即将到来）
 *   /summary    → SummaryView（汇总中心）
 *   /slideshow  → SlideshowView（述职工作台）
 *   /projects   → ProjectsView（项目）
 *
 * ResponsiveAppShell 是共享 layout（含导航栏），内部通过 <Outlet /> 渲染子路由视图。
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 默认重定向：访问 / 自动跳到 /today */}
      <Route index element={<Navigate to="/today" replace />} />

      {/* ResponsiveAppShell 作为 layout route，内部渲染 <Outlet /> */}
      <Route element={<ResponsiveAppShell />}>
        <Route path="/today" element={<TodayView />} />
        <Route path="/upcoming" element={<UpcomingView />} />
        <Route path="/summary" element={<SummaryView />} />
        <Route path="/slideshow" element={<SlideshowView />} />
        <Route path="/projects" element={<ProjectsView />} />
      </Route>
    </Routes>
  )
}

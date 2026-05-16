import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  FloatingAiOrb,
  MobileAiChatScreen,
  NavigationPanel,
  TabletAiOverlay,
} from '@renderer/features/home/HomeUI'
import ChatPanel from '@renderer/features/chat/components/ChatPanel'

import { useResponsiveLayout } from './useResponsiveLayout'

export function ResponsiveAppShell() {
  const layout = useResponsiveLayout()
  const [isTabletAiOpen, setIsTabletAiOpen] = useState(false)
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(false)

  useEffect(() => {
    if (layout !== 'tablet') {
      setIsTabletAiOpen(false)
    }

    if (layout !== 'mobile') {
      setIsMobileChatVisible(false)
    }
  }, [layout])

  if (layout === 'mobile') {
    return isMobileChatVisible ? (
      <MobileAiChatScreen onBack={() => setIsMobileChatVisible(false)} />
    ) : (
      <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
        <div className="petal-deco -left-24 -top-24 opacity-60" />
        <div className="petal-deco -bottom-24 right-[-4rem] opacity-50" />

        <main className="relative z-10 px-4 pb-20 pt-4">
          <NavigationPanel mode="mobile-top" />
          <div className="mt-4">
            <Outlet />
          </div>
        </main>

        <FloatingAiOrb onClick={() => setIsMobileChatVisible(true)} />
      </div>
    )
  }

  if (layout === 'tablet') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
        <div className="petal-deco -left-24 -top-28 opacity-60" />
        <div className="petal-deco bottom-[-8rem] right-[-5rem] opacity-45" />

        <div className="flex min-h-screen gap-4 p-4">
          <NavigationPanel mode="tablet-rail" />
          <main className="relative z-10 flex min-w-0 flex-1 flex-col">
            <Outlet />
          </main>
        </div>

        <TabletAiOverlay open={isTabletAiOpen} onClose={() => setIsTabletAiOpen(false)} />
        <FloatingAiOrb onClick={() => setIsTabletAiOpen(open => !open)} expanded={isTabletAiOpen} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:flex lg:h-screen lg:overflow-hidden">
      <NavigationPanel mode="desktop-sidebar" />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <Outlet />
        <aside className="glass-deep relative flex w-full flex-col overflow-hidden border-t border-[rgba(196,115,122,0.1)] shadow-[0_-1px_24px_rgba(28,22,20,0.04)] lg:h-full lg:w-[360px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:shadow-[-1px_0_24px_rgba(28,22,20,0.04)]">
          <ChatPanel />
        </aside>
      </main>
    </div>
  )
}

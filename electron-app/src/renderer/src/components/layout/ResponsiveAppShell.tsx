import { useEffect, useState } from 'react'

import { DesktopAiPanel, FloatingAiOrb, MainTaskWorkspace, MobileAiChatScreen, NavigationPanel, TabletAiOverlay } from '@renderer/features/home/HomeUI'

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
            <MainTaskWorkspace mode="mobile" />
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
            <MainTaskWorkspace mode="tablet" />
          </main>
        </div>

        <TabletAiOverlay open={isTabletAiOpen} onClose={() => setIsTabletAiOpen(false)} />
        <FloatingAiOrb onClick={() => setIsTabletAiOpen((open) => !open)} expanded={isTabletAiOpen} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:flex lg:h-screen lg:overflow-hidden">
      <NavigationPanel mode="desktop-sidebar" />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <MainTaskWorkspace mode="desktop" />
        <DesktopAiPanel />
      </main>
    </div>
  )
}
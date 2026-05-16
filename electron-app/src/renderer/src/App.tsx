import { useEffect } from 'react'
import { LoginPage, useAuthStore } from './features/auth'
import { AppRoutes } from './router'

export default function App() {
  const { session, initializing, restoreSession } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // 等待 session 恢复完成，避免登录页闪烁
  if (initializing) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[var(--canvas)] overflow-hidden">
        <div className="petal-deco -left-24 -top-24 opacity-60" />
        <div className="petal-deco bottom-[-6rem] right-[-5rem] opacity-50" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] text-[var(--petal)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_4px_16px_rgba(196,115,122,0.18)]"
            style={{ animation: 'pulse 1.6s ease-in-out infinite' }}
          >
            <FlowerIcon />
          </div>
          <p className="text-[12px] text-[var(--ink-faint)]">交个代</p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.6; transform: scale(0.94); }
          }
        `}</style>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <AppRoutes />
}

function FlowerIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V3m0 0a4.5 4.5 0 0 1 4.5 4.5M12 3a4.5 4.5 0 0 0-4.5 4.5M7.5 12a4.5 4.5 0 1 0 4.5 4.5M7.5 12H3m0 0a4.5 4.5 0 0 1 4.5 4.5M3 12a4.5 4.5 0 0 0 4.5 4.5M16.5 12a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H21m0 0a4.5 4.5 0 0 1-4.5 4.5M21 12a4.5 4.5 0 0 0-4.5 4.5M12 16.5V21m0-4.5a4.5 4.5 0 0 0 4.5-4.5" />
    </svg>
  )
}

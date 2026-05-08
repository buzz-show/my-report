import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { login, loading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  // Trigger shake animation whenever a new error appears
  useEffect(() => {
    if (error) {
      setShakeKey((k) => k + 1)
    }
  }, [error])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await login(email, password)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--canvas)] overflow-hidden">
      {/* Ambient decorative glows */}
      <div className="petal-deco -left-24 -top-24 opacity-70" />
      <div className="petal-deco bottom-[-6rem] right-[-5rem] opacity-55" />

      {/* Login card */}
      <div
        className="glass-panel relative z-10 w-full max-w-[380px] mx-4 rounded-[28px] p-8"
        style={{ animation: 'loginFadeUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] text-[var(--petal)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_4px_16px_rgba(196,115,122,0.18)] mb-4">
            <FlowerIcon className="h-7 w-7" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
            交个代
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">登录或创建账号</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block mb-1.5 text-[12px] font-medium tracking-wide text-[var(--ink-muted)]"
              >
                邮箱
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full rounded-xl border border-[rgba(196,115,122,0.2)] bg-white/80 px-4 py-2.5 text-[14px] text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none transition-all duration-150 focus:border-[var(--petal)] focus:ring-2 focus:ring-[rgba(196,115,122,0.14)] disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block mb-1.5 text-[12px] font-medium tracking-wide text-[var(--ink-muted)]"
              >
                密码
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  disabled={loading}
                  className="w-full rounded-xl border border-[rgba(196,115,122,0.2)] bg-white/80 px-4 py-2.5 pr-11 text-[14px] text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none transition-all duration-150 focus:border-[var(--petal)] focus:ring-2 focus:ring-[rgba(196,115,122,0.14)] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-muted)] transition-colors p-0.5"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              key={shakeKey}
              className="mt-4 rounded-xl border-l-[3px] border-[var(--petal)] bg-[var(--petal-xlight)] px-4 py-2.5"
              style={{ animation: 'shake 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both' }}
              role="alert"
            >
              <p className="text-[13px] text-[var(--petal)]">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-5 w-full rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--petal) 0%, #a55860 100%)',
              boxShadow: '0 2px 12px rgba(196, 115, 122, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = ''
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                处理中…
              </span>
            ) : (
              '登录 / 注册'
            )}
          </button>
        </form>

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-[var(--ink-faint)]">
          首次填写将自动创建账号
        </p>
      </div>

      {/* Global keyframe styles injected once */}
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-5px); }
          30%       { transform: translateX(5px); }
          45%       { transform: translateX(-4px); }
          60%       { transform: translateX(4px); }
          75%       { transform: translateX(-2px); }
          90%       { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}

/* ─── Icon helpers (inline SVG, no extra dependency) ──────────────────── */

function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

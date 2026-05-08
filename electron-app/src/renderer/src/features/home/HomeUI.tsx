import type { ReactNode, SVGProps } from 'react'

import {
  activeTasks,
  chips,
  completedTasks,
  emptyStateFlow,
  emptyStateHighlights,
  emptyStateSuggestions,
  labelItems,
  messages,
  navigationItems,
  pendingTasks,
  summaryRows,
  upcomingTasks,
  userName,
} from './data'
import type { ChatMessage, LabelItem, NavIconKey, NavItem, SummaryRow, Task } from './types'

type IconProps = SVGProps<SVGSVGElement>

type NavigationMode = 'mobile-top' | 'tablet-rail' | 'desktop-sidebar'

type WorkspaceMode = 'mobile' | 'tablet' | 'desktop'

export function NavigationPanel({ mode }: { mode: NavigationMode }) {
  if (mode === 'mobile-top') {
    return (
      <nav className="glass-deep rounded-[28px] border border-[rgba(196,115,122,0.12)] px-3 py-3 shadow-[var(--shadow-lift-sm)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] text-[var(--petal)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <FlowerIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                交个代
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                Mobile Stack Mode
              </p>
            </div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(196,115,122,0.12)] bg-white/70 text-[var(--petal)]">
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {navigationItems.map(item => (
            <button
              key={item.label}
              className={`flex h-11 min-w-[44px] items-center justify-center rounded-2xl ${
                item.active
                  ? 'bg-[var(--petal-light)] text-[var(--petal)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                  : 'bg-white/72 text-[var(--ink-faint)] hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]'
              }`}
              aria-label={item.label}
            >
              <HomeIcon icon={item.icon} className="h-5 w-5" />
            </button>
          ))}
          <button className="flex h-11 min-w-[44px] items-center justify-center rounded-2xl bg-white/72 text-[var(--ink-faint)] hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]">
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>
    )
  }

  if (mode === 'tablet-rail') {
    return (
      <aside className="glass-deep relative z-20 flex w-[86px] flex-shrink-0 flex-col items-center rounded-[32px] border border-[rgba(196,115,122,0.12)] py-5 shadow-[0_8px_40px_rgba(28,22,20,0.08),0_16px_56px_rgba(196,115,122,0.12)]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[20px] bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] text-[var(--petal)] shadow-[var(--shadow-lift-sm)]">
          <FlowerIcon className="h-[22px] w-[22px]" />
        </div>
        {navigationItems.map(item => (
          <button
            key={item.label}
            className={`nav-item mb-2 flex h-12 w-12 items-center justify-center rounded-[18px] ${
              item.active
                ? 'bg-[var(--petal-light)] text-[var(--petal)]'
                : 'text-[var(--ink-faint)] hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]'
            }`}
            aria-label={item.label}
          >
            <HomeIcon icon={item.icon} className="h-5 w-5" />
          </button>
        ))}
        <div className="my-3 h-px w-9 bg-[rgba(196,115,122,0.12)]" />
        <button className="nav-item mt-auto flex h-12 w-12 items-center justify-center rounded-[18px] text-[var(--ink-faint)] hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]">
          <SettingsIcon className="h-5 w-5" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="glass-deep relative z-10 flex w-full flex-col border-b border-[rgba(196,115,122,0.1)] shadow-[0_1px_24px_rgba(28,22,20,0.04)] lg:h-screen lg:w-64 lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:shadow-[1px_0_24px_rgba(28,22,20,0.04)]">
      <div className="petal-deco -left-24 -top-24 opacity-60" />

      <div className="flex items-center gap-3 px-6 pb-6 pt-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] shadow-[var(--shadow-lift-sm)]">
          <FlowerIcon className="h-5 w-5 text-[var(--petal)]" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)]">
            交个代
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--ink-faint)]">
            工作总结工作台
          </p>
        </div>
      </div>

      <div className="px-4 pb-5">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--petal)] py-2.5 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_4px_16px_rgba(196,115,122,0.32)] transition-all hover:bg-[#b56870] hover:shadow-[0_6px_20px_rgba(196,115,122,0.4)] active:scale-[0.98]">
          <PlusIcon className="h-4 w-4" />
          新建今日待办
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">
          工作区
        </p>
        {navigationItems.map(item => (
          <SidebarNavItem key={item.label} item={item} />
        ))}

        <div className="my-3 border-t border-[rgba(196,115,122,0.08)]" />
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">
          标签
        </p>

        {labelItems.map(item => (
          <button
            key={item.label}
            className="nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-[var(--ink-muted)] hover:bg-[var(--petal-xlight)]"
          >
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotToneClass(item.tone)}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-[rgba(196,115,122,0.08)] px-3 pb-5 pt-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[var(--petal-xlight)] to-[var(--teal-xlight)] px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 shadow-[var(--shadow-lift-sm)]">
            <TimerIcon className="h-[15px] w-[15px] text-[var(--petal)]" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              专注计时器
            </p>
            <p className="text-[10px] text-[var(--ink-faint)]">25 分钟 · 番茄工作法</p>
          </div>
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(196,115,122,0.15)] transition-colors hover:bg-[rgba(196,115,122,0.25)]">
            <PlayIcon className="h-[13px] w-[13px] text-[var(--petal)]" />
          </button>
        </div>

        <button className="nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-[var(--ink-muted)] hover:bg-[var(--petal-xlight)]">
          <SettingsIcon className="h-[18px] w-[18px] text-[var(--ink-faint)]" />
          设置
        </button>

        <div className="nav-item mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--petal-xlight)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-light)] text-[11px] font-semibold text-[var(--petal)]">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--ink)]">{userName}</p>
            <p className="text-[11px] text-[var(--ink-faint)]">专业版</p>
          </div>
          <MoreIcon className="h-4 w-4 text-[var(--ink-faint)]" />
        </div>
      </div>
    </aside>
  )
}

export function MainTaskWorkspace({ mode }: { mode: WorkspaceMode }) {
  const isDesktop = mode === 'desktop'
  const isMobile = mode === 'mobile'
  const isEmptyWorkspace =
    pendingTasks.length === 0 &&
    activeTasks.length === 0 &&
    completedTasks.length === 0 &&
    upcomingTasks.length === 0

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header
        className={`flex flex-col gap-4 px-5 pb-4 pt-6 ${isDesktop ? 'md:px-8 md:pt-8 lg:flex-shrink-0' : ''}`}
      >
        <div
          className={`flex flex-col gap-4 ${isDesktop ? 'lg:flex-row lg:items-start lg:justify-between' : 'md:flex-row md:items-start md:justify-between'}`}
        >
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              <SunIcon className="h-3 w-3" />
              周二，5 月 8 日
            </p>
            {isEmptyWorkspace ? (
              <span className="inline-flex rounded-full border border-[rgba(196,115,122,0.14)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--petal)]">
                今日工作台为空
              </span>
            ) : null}
            <h2
              className={`font-light leading-[1.1] tracking-[-0.03em] text-[var(--ink)] ${isMobile ? 'text-[28px]' : isDesktop ? 'text-[32px] md:text-[36px]' : 'text-[34px]'} ${isEmptyWorkspace ? 'mt-2' : ''}`}
            >
              早安，<span className="font-medium text-[var(--petal)]">{userName}</span>
            </h2>
            <p
              className={`mt-1.5 text-[14px] leading-6 text-[var(--ink-muted)] ${isMobile ? 'max-w-[280px]' : 'max-w-3xl'}`}
            >
              {isEmptyWorkspace
                ? '先创建第一条待办，把今天要推进的事项放进工作台；后续补充进展和结果说明后，就能直接生成日报、周报和述职草稿。'
                : '维护今日待办，补充进展和结果说明，再把这些事实直接整理成日报、周报和述职草稿。'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TopActionButton icon={<FilterIcon className="h-4 w-4" />}>筛选</TopActionButton>
            <TopActionButton icon={<SummaryIcon className="h-4 w-4" />}>汇总入口</TopActionButton>
          </div>
        </div>
      </header>

      <div
        className={`grid gap-3 px-5 pb-5 ${isMobile ? 'grid-cols-2' : isDesktop ? 'sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_192px] md:px-8 lg:flex-shrink-0' : 'grid-cols-[repeat(3,minmax(0,1fr))_180px]'}`}
      >
        {isEmptyWorkspace ? (
          <>
            <EmptyStatTile
              icon={<CheckCircleIcon className="h-4 w-4 text-[var(--petal)]" />}
              iconClassName="bg-[var(--petal-light)]"
              value="0"
              suffix="项"
              label="已完成任务"
              detail="还没有完成记录"
            />
            <EmptyStatTile
              icon={<SparkIcon className="h-4 w-4 text-[var(--teal)]" />}
              iconClassName="bg-[var(--teal-xlight)]"
              value="0"
              suffix="项"
              label="关键产出"
              detail="等待任务事实沉淀"
            />
            {!isMobile ? (
              <EmptyStatTile
                icon={<TimerIcon className="h-4 w-4 text-[#c48240]" />}
                iconClassName="bg-[rgba(232,168,124,0.15)]"
                value="0"
                suffix="分钟"
                label="深度专注"
                detail="开始任务后自动累计"
              />
            ) : null}
            <article className="stat-card glass flex items-center gap-4 rounded-xl border border-[rgba(196,115,122,0.08)] px-4 py-3 opacity-90">
              <div className="relative h-12 w-12 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="h-12 w-12">
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="rgba(196,115,122,0.12)"
                    strokeWidth="4"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--ink-faint)]">
                  日报
                </span>
              </div>
              <div>
                <p className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  暂无草稿
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                  等待任务内容进入汇总
                </p>
              </div>
            </article>
          </>
        ) : (
          <>
            <StatTile
              icon={<CheckCircleIcon className="h-4 w-4 text-[var(--petal)]" />}
              iconClassName="bg-[var(--petal-light)]"
              value="3"
              suffix="/ 7"
              label="已完成任务"
            />
            <StatTile
              icon={<SparkIcon className="h-4 w-4 text-[var(--teal)]" />}
              iconClassName="bg-[var(--teal-xlight)]"
              value="2"
              suffix="项"
              label="关键产出"
            />
            {!isMobile ? (
              <StatTile
                icon={<TimerIcon className="h-4 w-4 text-[#c48240]" />}
                iconClassName="bg-[rgba(232,168,124,0.15)]"
                value="2小时"
                suffix="14分"
                label="深度专注"
              />
            ) : null}
            <article className="stat-card glass flex items-center gap-4 rounded-xl border border-[rgba(196,115,122,0.1)] px-4 py-3">
              <div className="relative h-12 w-12 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="h-12 w-12">
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="rgba(196,115,122,0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="var(--petal)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="119.38"
                    strokeDashoffset="40"
                    transform="rotate(-90 24 24)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--petal)]">
                  日报
                </span>
              </div>
              <div>
                <p className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  立即生成
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
                  今日总结
                </p>
              </div>
            </article>
          </>
        )}
      </div>

      <div className={`px-5 pb-5 ${isDesktop ? 'md:px-8 lg:flex-shrink-0' : ''}`}>
        {isEmptyWorkspace ? (
          <div className="glass rounded-xl border border-[rgba(196,115,122,0.1)] p-4 shadow-[var(--shadow-lift-sm)]">
            <div
              className={`flex flex-col gap-4 ${isDesktop ? 'lg:flex-row lg:items-start lg:justify-between' : 'md:flex-row md:items-start md:justify-between'}`}
            >
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--petal)]">
                  汇总中心待激活
                </p>
                <h3 className="text-[20px] font-medium leading-7 tracking-[-0.015em] text-[var(--ink)]">
                  先留下待办、进展和结果，汇总中心才会开始生成你的日报草稿。
                </h3>
                <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-[var(--ink-muted)]">
                  当工作台里有任务事实后，系统会自动整理今日完成、关键产出、未完成原因和明日计划，并保留引用来源。
                </p>
              </div>
              <button className="flex items-center gap-1.5 rounded-xl border border-[rgba(196,115,122,0.18)] bg-white/70 px-3.5 py-2 text-[14px] font-medium text-[var(--petal)] transition-all hover:bg-[var(--petal-xlight)] active:scale-[0.98]">
                <SummaryIcon className="h-4 w-4" />
                查看汇总结构
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl border border-[rgba(196,115,122,0.1)] p-4 shadow-[var(--shadow-lift-sm)]">
            <div
              className={`flex flex-col gap-4 ${isDesktop ? 'lg:flex-row lg:items-start lg:justify-between' : 'md:flex-row md:items-start md:justify-between'}`}
            >
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--petal)]">
                  汇总中心预览
                </p>
                <h3 className="text-[20px] font-medium leading-7 tracking-[-0.015em] text-[var(--ink)]">
                  日报草稿会基于任务状态、结果说明和未完成原因自动生成。
                </h3>
                <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-[var(--ink-muted)]">
                  默认结构包含今日完成、关键产出、未完成事项及原因、明日计划，并支持查看引用来源任务。
                </p>
              </div>
              <button className="flex items-center gap-1.5 rounded-xl bg-[var(--petal)] px-3.5 py-2 text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(196,115,122,0.26)] transition-all hover:bg-[#b56870] active:scale-[0.98]">
                <SparkIcon className="h-4 w-4" />
                生成日报
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-5 pb-8 ${isDesktop ? 'md:px-8' : ''}`}>
        {isEmptyWorkspace ? (
          <EmptyWorkspaceState isDesktop={isDesktop} isMobile={isMobile} />
        ) : (
          <div className="space-y-6">
            <TaskSection title="待开始" badge="2 项待开始" tasks={pendingTasks} />
            <TaskSection title="进行中" badge="2 项进行中" tasks={activeTasks} />
            <TaskSection
              title="已完成"
              badge="3 项已完成"
              badgeTone="teal"
              tasks={completedTasks}
              completed
            />
            <TaskSection title="即将到来" tasks={upcomingTasks} upcoming />
          </div>
        )}
      </div>
    </section>
  )
}

export function DesktopAiPanel() {
  return (
    <aside className="glass-deep relative flex w-full flex-col overflow-hidden border-t border-[rgba(196,115,122,0.1)] shadow-[0_-1px_24px_rgba(28,22,20,0.04)] lg:h-full lg:w-[360px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:shadow-[-1px_0_24px_rgba(28,22,20,0.04)]">
      <div className="petal-deco -bottom-32 -right-32 opacity-40" />
      <AiPanelContent />
    </aside>
  )
}

export function TabletAiOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button
        className={`fixed inset-0 z-40 bg-[rgba(28,22,20,0.22)] transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-label="关闭 AI 面板遮罩"
      />
      <section
        className={`glass-deep fixed bottom-28 right-6 z-50 w-[360px] rounded-[30px] border border-[rgba(196,115,122,0.14)] p-4 shadow-[0_8px_40px_rgba(28,22,20,0.08),0_16px_56px_rgba(196,115,122,0.12)] transition-all ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}
      >
        <AiPanelContent compact onClose={onClose} />
      </section>
    </>
  )
}

export function MobileAiChatScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="relative z-20 min-h-screen px-4 pb-6 pt-4">
      <div className="glass-deep flex min-h-[calc(100vh-2rem)] flex-col rounded-[32px] border border-[rgba(196,115,122,0.14)] shadow-[0_8px_40px_rgba(28,22,20,0.08),0_16px_56px_rgba(196,115,122,0.12)]">
        <div className="flex items-center justify-between border-b border-[rgba(196,115,122,0.1)] px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(28,22,20,0.04)] text-[var(--ink-faint)]"
              onClick={onBack}
            >
              <ArrowLeftIcon className="h-[18px] w-[18px]" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--petal-light)] via-[#f5e5e8] to-[var(--teal-xlight)] text-[var(--petal)] shadow-[var(--shadow-lift-sm)]">
              <SparkIcon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                代办官
              </p>
              <p className="text-[11px] text-[var(--teal)]">独立 AI 聊天界面</p>
            </div>
          </div>
          <button className="rounded-full bg-[var(--petal-xlight)] px-3 py-1 text-[11px] font-semibold text-[var(--petal)]">
            今天
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <AiConversation showTyping={false} />
        </div>

        <AiInputBar mobile />
      </div>
    </section>
  )
}

export function FloatingAiOrb({
  onClick,
  expanded = false,
}: {
  onClick: () => void
  expanded?: boolean
}) {
  return (
    <button
      className={`fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c4737a,#e8adb4)] text-white shadow-[0_16px_40px_rgba(196,115,122,0.35)] after:absolute after:inset-[-8px] after:rounded-full after:border after:border-[rgba(196,115,122,0.18)] ${expanded ? 'scale-[0.98]' : ''}`}
      onClick={onClick}
      aria-label="打开 AI 助手"
    >
      <SparkIcon className="h-6 w-6" />
    </button>
  )
}

function AiPanelContent({ compact = false, onClose }: { compact?: boolean; onClose?: () => void }) {
  return (
    <>
      <div className="relative z-10 border-b border-[rgba(196,115,122,0.1)] px-5 pb-4 pt-6 lg:flex-shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--petal-light)] via-[#f5e5e8] to-[var(--teal-xlight)] shadow-[var(--shadow-lift-sm)]">
              <SparkIcon className="h-[18px] w-[18px] text-[var(--petal)]" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#7faa96] shadow-sm" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                代办官
              </h3>
              <p className="text-[11px] font-medium text-[var(--teal)]">
                ● 在线 · 正在整理你的今日工作
              </p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(28,22,20,0.04)] text-[var(--ink-faint)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]"
            onClick={onClose}
          >
            <MoreIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <button
              key={chip}
              className="chip rounded-xl border border-[rgba(28,22,20,0.06)] bg-[rgba(28,22,20,0.05)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`relative z-10 flex-1 overflow-y-auto px-5 py-5 ${compact ? 'max-h-[420px]' : ''}`}
      >
        <AiConversation />
      </div>

      <AiInputBar />
    </>
  )
}

function AiConversation({ showTyping = true }: { showTyping?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="my-1 flex items-center gap-3">
        <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
        <span className="rounded-full border border-[rgba(196,115,122,0.08)] bg-[var(--sand)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink-faint)]">
          今天 上午 9:12
        </span>
        <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
      </div>

      {messages.map((message, index) => (
        <ChatThread
          key={`${message.time}-${index}`}
          message={message}
          showSummaryCard={index === 2}
        />
      ))}

      {showTyping ? (
        <div className="flex items-end gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)]">
            <SparkIcon className="h-3 w-3 text-[var(--petal)]" />
          </div>
          <div className="bubble-ai flex items-center gap-1.5 border border-[rgba(196,115,122,0.12)] bg-white/90 px-4 py-3.5 shadow-[var(--shadow-lift-sm)]">
            <span className="dot-1 h-1.5 w-1.5 rounded-full bg-[var(--petal)]" />
            <span className="dot-2 h-1.5 w-1.5 rounded-full bg-[var(--petal)]" />
            <span className="dot-3 h-1.5 w-1.5 rounded-full bg-[var(--petal)]" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AiInputBar({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="relative z-10 border-t border-[rgba(196,115,122,0.1)] px-4 pb-5 pt-3 lg:flex-shrink-0">
      <div className="glass overflow-hidden rounded-xl border border-[rgba(196,115,122,0.16)] shadow-[var(--shadow-lift-sm)]">
        <textarea
          rows={mobile ? 3 : 2}
          placeholder="让代办官整理待办、补充进展或生成总结…"
          className="block w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[14px] leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]">
              <AttachmentIcon className="h-4 w-4" />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]">
              <MicIcon className="h-4 w-4" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-[var(--petal)] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(196,115,122,0.35)] transition-all hover:bg-[#b56870] hover:shadow-[0_4px_12px_rgba(196,115,122,0.45)] active:scale-[0.97]">
            <SendIcon className="h-[15px] w-[15px]" />
            发送
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-[var(--ink-faint)]">
        代办官 · 由 GPT-4o 驱动
      </p>
    </div>
  )
}

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <button
      className={`nav-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-[14px] ${item.active ? 'bg-[var(--petal-light)] text-[var(--petal)]' : 'text-[var(--ink-muted)] hover:bg-[var(--petal-xlight)]'}`}
    >
      {item.active ? (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(196,115,122,0.08)] to-transparent" />
      ) : null}
      <HomeIcon
        icon={item.icon}
        className={`relative h-[18px] w-[18px] ${item.active ? 'text-[var(--petal)]' : 'text-[var(--ink-faint)] group-hover:text-[var(--petal)]'}`}
      />
      <span className={`relative flex-1 ${item.active ? 'font-semibold' : ''}`}>{item.label}</span>
      {item.active ? (
        <svg viewBox="0 0 22 22" className="relative h-[22px] w-[22px]">
          <circle
            cx="11"
            cy="11"
            r="8"
            fill="none"
            stroke="rgba(196,115,122,0.2)"
            strokeWidth="2.5"
          />
          <circle
            cx="11"
            cy="11"
            r="8"
            fill="none"
            stroke="var(--petal)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="50.27"
            strokeDashoffset="18"
            transform="rotate(-90 11 11)"
          />
        </svg>
      ) : null}
      {!item.active && item.badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.label === '即将到来' ? 'bg-[rgba(232,168,124,0.15)] text-[#c48240]' : 'bg-[var(--petal-xlight)] text-[var(--petal)]'}`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}

function TopActionButton({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <button className="flex items-center gap-1.5 rounded-xl border border-[rgba(196,115,122,0.2)] px-3.5 py-2 text-[14px] text-[var(--ink-muted)] transition-all hover:border-[rgba(196,115,122,0.3)] hover:bg-[var(--petal-xlight)]">
      {icon}
      {children}
    </button>
  )
}

function StatTile({
  icon,
  iconClassName,
  value,
  suffix,
  label,
}: {
  icon: ReactNode
  iconClassName: string
  value: string
  suffix: string
  label: string
}) {
  return (
    <article className="stat-card glass flex items-center gap-3 rounded-xl border border-[rgba(196,115,122,0.1)] px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>
        {icon}
      </div>
      <div>
        <p className="leading-none text-[22px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {value} <span className="text-[14px] font-normal text-[var(--ink-faint)]">{suffix}</span>
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
          {label}
        </p>
      </div>
    </article>
  )
}

function EmptyStatTile({
  icon,
  iconClassName,
  value,
  suffix,
  label,
  detail,
}: {
  icon: ReactNode
  iconClassName: string
  value: string
  suffix: string
  label: string
  detail: string
}) {
  return (
    <article className="stat-card glass flex items-center gap-3 rounded-xl border border-[rgba(196,115,122,0.08)] px-4 py-3 opacity-90">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>
        {icon}
      </div>
      <div>
        <p className="leading-none text-[22px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {value} <span className="text-[14px] font-normal text-[var(--ink-faint)]">{suffix}</span>
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
          {label}
        </p>
        <p className="mt-1 text-[11px] text-[var(--ink-faint)]">{detail}</p>
      </div>
    </article>
  )
}

function EmptyWorkspaceState({ isDesktop, isMobile }: { isDesktop: boolean; isMobile: boolean }) {
  return (
    <section className="space-y-4">
      <div className="glass-deep relative overflow-hidden rounded-[28px] border border-[rgba(196,115,122,0.12)] p-5 shadow-[0_8px_32px_rgba(28,22,20,0.06),0_16px_48px_rgba(196,115,122,0.08)] md:p-6">
        <div className="petal-deco -right-20 -top-20 opacity-50" />
        <div
          className={`relative z-10 grid gap-4 ${isDesktop ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start' : ''}`}
        >
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--petal)]">
              任务区空状态
            </p>
            <h3
              className={`max-w-2xl font-medium tracking-[-0.025em] text-[var(--ink)] ${isMobile ? 'text-[24px] leading-8' : 'text-[28px] leading-9'}`}
            >
              从第一条待办开始，把今天的工作事实沉淀进工作台。
            </h3>
            <p
              className={`mt-3 text-[14px] leading-6 text-[var(--ink-muted)] ${isMobile ? 'max-w-none' : 'max-w-2xl'}`}
            >
              现在还没有任何待办、进展或完成记录。先建一条任务，后续再补充进展和结果说明，汇总中心就能自动生成结构化草稿。
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button className="flex items-center gap-2 rounded-xl bg-[var(--petal)] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_20px_rgba(196,115,122,0.28)] transition-all hover:bg-[#b56870] active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                新建第一条待办
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-[rgba(196,115,122,0.18)] bg-white/72 px-4 py-2.5 text-[14px] font-medium text-[var(--ink-muted)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)] active:scale-[0.98]">
                <SparkIcon className="h-4 w-4" />让 AI 帮我拆分
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {emptyStateSuggestions.map(item => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(196,115,122,0.12)] bg-white/70 px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[24px] border border-[rgba(196,115,122,0.12)] bg-white/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                激活路径
              </p>
              <div className="space-y-2.5">
                {emptyStateFlow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--petal-xlight)] text-[11px] font-semibold text-[var(--petal)]">
                      0{index + 1}
                    </span>
                    <p className="text-[13px] leading-5 text-[var(--ink)]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(196,115,122,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(241,232,229,0.92))] p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                为什么现在就记录
              </p>
              <div className="space-y-3">
                {emptyStateHighlights.map(item => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-white/72 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]"
                  >
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--ink-muted)]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TaskSection({
  title,
  badge,
  tasks,
  completed = false,
  upcoming = false,
  badgeTone = 'petal',
}: {
  title: string
  badge?: string
  tasks: Task[]
  completed?: boolean
  upcoming?: boolean
  badgeTone?: 'petal' | 'teal'
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">
          {title}
        </p>
        <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
        {badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeTone === 'teal' ? 'bg-[var(--teal-xlight)] text-[var(--teal)]' : 'bg-[var(--petal-xlight)] text-[var(--petal)]'}`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {tasks.map(task => (
          <TaskCard key={task.title} task={task} completed={completed} upcoming={upcoming} />
        ))}
      </div>
    </section>
  )
}

function TaskCard({
  task,
  completed = false,
  upcoming = false,
}: {
  task: Task
  completed?: boolean
  upcoming?: boolean
}) {
  if (completed) {
    return (
      <article className="task-card flex items-start gap-4 rounded-xl border border-[rgba(196,115,122,0.06)] bg-[rgba(255,255,255,0.45)] p-4 opacity-60 transition-opacity hover:opacity-80">
        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#7faa96]">
          <CheckIcon className="h-[13px] w-[13px] text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[16px] font-medium leading-6 tracking-[-0.01em] text-[var(--ink-muted)] line-through">
            {task.title}
          </h3>
          <p className="mt-0.5 text-[14px] leading-6 text-[var(--ink-faint)]">{task.description}</p>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1 text-[12px] text-[var(--ink-faint)]">
          <CheckCircleIcon className="h-[13px] w-[13px]" />
          {task.doneAt}
        </span>
      </article>
    )
  }

  return (
    <article
      className={`task-card ${priorityClass(task.priority)} flex items-start gap-4 rounded-xl border p-4 ${upcoming ? 'glass border-[rgba(196,115,122,0.08)] hover:border-[rgba(196,115,122,0.2)]' : 'glass border-[rgba(196,115,122,0.1)] hover:border-[rgba(196,115,122,0.22)]'}`}
    >
      <button
        className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${toggleClass(task.priority)}`}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-medium leading-6 tracking-[-0.01em] text-[var(--ink)]">
            {task.title}
          </h3>
          <span
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${badgeClass(task.priority, upcoming)}`}
          >
            {task.badge}
          </span>
        </div>
        <p className="text-[14px] leading-6 text-[var(--ink-muted)]">{task.description}</p>

        {!upcoming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-[rgba(28,22,20,0.05)] px-2.5 py-1 text-[12px] text-[var(--ink-muted)]">
              <ClockIcon className="h-[13px] w-[13px]" />
              {task.time}
            </span>
            {task.tags.map(tag => (
              <span key={tag} className={tagClass(tag)}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {task.note ? (
          <div className="mt-3 rounded-lg bg-[rgba(196,115,122,0.06)] px-3 py-2.5">
            <p className="mb-1 text-[11px] font-semibold text-[var(--petal)]">{task.note.title}</p>
            <p className="text-[14px] leading-6 text-[var(--ink-muted)]">{task.note.text}</p>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function ChatThread({
  message,
  showSummaryCard = false,
}: {
  message: ChatMessage
  showSummaryCard?: boolean
}) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto flex max-w-[92%] items-end justify-end gap-2.5">
        <div>
          <div className="bubble-user bg-[var(--petal)] px-3.5 py-3 text-white shadow-[0_4px_16px_rgba(196,115,122,0.28)]">
            <p className="text-[14px] leading-relaxed">{message.text}</p>
          </div>
          <p className="mr-1 mt-1 text-right text-[10px] text-[var(--ink-faint)]">{message.time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-w-[92%] items-end gap-2.5">
      <div className="mb-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)]">
        <SparkIcon className="h-3 w-3 text-[var(--petal)]" />
      </div>
      <div className="space-y-2">
        <div className="bubble-ai border border-[rgba(196,115,122,0.12)] bg-white/90 px-3.5 py-3 shadow-[var(--shadow-lift-sm)]">
          <p className="text-[14px] leading-relaxed text-[var(--ink)]">{message.text}</p>
        </div>

        {showSummaryCard ? <SummaryCard rows={summaryRows} /> : null}

        <p className="ml-1 text-[10px] text-[var(--ink-faint)]">{message.time}</p>
      </div>
    </div>
  )
}

function SummaryCard({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="rounded-xl border border-[rgba(196,115,122,0.15)] bg-gradient-to-br from-[var(--petal-xlight)] to-[var(--teal-xlight)] p-3.5 shadow-[var(--shadow-lift-sm)]">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--petal)]">
        今日任务汇总
      </p>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--ink-muted)]">{row.label}</span>
            <span className={`text-[12px] font-semibold ${row.tone}`}>{row.value}</span>
          </div>
        ))}
        <div className="mt-2 border-t border-[rgba(196,115,122,0.1)] pt-2">
          <div className="mb-1 flex justify-between">
            <span className="text-[12px] text-[var(--ink-muted)]">日报草稿可信度</span>
            <span className="text-[12px] font-medium text-[var(--petal)]">高</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(196,115,122,0.12)]">
            <div className="h-full w-[82%] rounded-full bg-[var(--petal)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeIcon({ icon, className }: { icon: NavIconKey; className?: string }) {
  switch (icon) {
    case 'today':
      return <CalendarIcon className={className} />
    case 'upcoming':
      return <UpcomingIcon className={className} />
    case 'summary':
      return <SummaryIcon className={className} />
    case 'slideshow':
      return <SlideshowIcon className={className} />
    case 'folder':
      return <FolderIcon className={className} />
    case 'settings':
      return <SettingsIcon className={className} />
    case 'spark':
      return <SparkIcon className={className} />
    case 'timer':
      return <TimerIcon className={className} />
    case 'filter':
      return <FilterIcon className={className} />
    case 'mic':
      return <MicIcon className={className} />
    case 'attachment':
      return <AttachmentIcon className={className} />
    case 'send':
      return <SendIcon className={className} />
    case 'sun':
      return <SunIcon className={className} />
    default:
      return <SparkIcon className={className} />
  }
}

function dotToneClass(tone: LabelItem['tone']) {
  if (tone === 'petal') return 'bg-[var(--petal)]'
  if (tone === 'teal') return 'bg-[var(--teal)]'
  if (tone === 'amber') return 'bg-[#e8a87c]'
  return 'bg-[#8b7f96]'
}

function priorityClass(priority: Task['priority']) {
  if (priority === 'high') return 'priority-high'
  if (priority === 'medium') return 'priority-med'
  return 'priority-low'
}

function toggleClass(priority: Task['priority']) {
  if (priority === 'high')
    return 'border-[rgba(196,115,122,0.4)] hover:border-[var(--petal)] hover:bg-[var(--petal-xlight)]'
  if (priority === 'medium')
    return 'border-[rgba(232,168,124,0.5)] hover:border-[#e8a87c] hover:bg-[rgba(232,168,124,0.1)]'
  return 'border-[rgba(127,170,150,0.4)] hover:border-[#7faa96] hover:bg-[rgba(127,170,150,0.1)]'
}

function badgeClass(priority: Task['priority'], upcoming: boolean) {
  if (upcoming) return 'bg-[rgba(28,22,20,0.05)] text-[var(--ink-faint)]'
  if (priority === 'high') return 'bg-[var(--petal-xlight)] text-[var(--petal)]'
  if (priority === 'medium') return 'bg-[rgba(232,168,124,0.15)] text-[#c48240]'
  return 'bg-[var(--teal-xlight)] text-[var(--teal)]'
}

function tagClass(tag: string) {
  if (tag === '深度工作')
    return 'rounded-lg bg-[var(--teal-xlight)] px-2.5 py-1 text-[12px] text-[var(--teal)]'
  if (tag === '会议协作')
    return 'rounded-lg bg-[var(--teal-xlight)] px-2.5 py-1 text-[12px] text-[var(--teal)]'
  if (tag === '规划推进')
    return 'rounded-lg bg-[rgba(232,168,124,0.12)] px-2.5 py-1 text-[12px] text-[#c48240]'
  if (tag === '风险问题')
    return 'rounded-lg bg-[rgba(139,127,150,0.12)] px-2.5 py-1 text-[12px] text-[#8b7f96]'
  return 'rounded-lg bg-[rgba(28,22,20,0.04)] px-2.5 py-1 text-[12px] text-[var(--ink-muted)]'
}

function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect x="4" y="5" width="16" height="15" rx="3" />
    </svg>
  )
}
function UpcomingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 7v5l3 2" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}
function SummaryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  )
}
function SlideshowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="M10 9l5 3-5 3V9z" />
    </svg>
  )
}
function FolderIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
    </svg>
  )
}
function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function TimerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M10 2h4" />
      <path d="M12 14l3-2" />
      <circle cx="12" cy="14" r="7" />
      <path d="M12 7v7" />
    </svg>
  )
}
function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 6.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}
function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3l1.6 2.8 3.2.7-.7 3.2L19 12l-2.9 1.3.7 3.2-3.2.7L12 20l-1.6-2.8-3.2-.7.7-3.2L5 12l2.9-1.3-.7-3.2 3.2-.7L12 3z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function MoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}
function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}
function FilterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  )
}
function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.2 2.2 4.8-5.2" />
    </svg>
  )
}
function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  )
}
function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}
function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
      <path d="M5 12l4 4L19 6" />
    </svg>
  )
}
function AttachmentIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9 12.5l5.6-5.6a3 3 0 114.2 4.2l-7.1 7.1a5 5 0 11-7.1-7.1l7.1-7.1" />
    </svg>
  )
}
function MicIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0012 0M12 17v4M9 21h6" />
    </svg>
  )
}
function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 11.5L20 4l-4.5 16-3.4-6.1L4 11.5z" />
      <path d="M12.1 13.9L20 4" />
    </svg>
  )
}
function FlowerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" opacity="0.95" />
      <ellipse cx="12" cy="6.4" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" />
      <ellipse
        cx="17.2"
        cy="9.4"
        rx="2.1"
        ry="3.4"
        fill="currentColor"
        opacity="0.45"
        transform="rotate(60 17.2 9.4)"
      />
      <ellipse
        cx="17.1"
        cy="14.8"
        rx="2.1"
        ry="3.4"
        fill="currentColor"
        opacity="0.45"
        transform="rotate(120 17.1 14.8)"
      />
      <ellipse cx="12" cy="17.6" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" />
      <ellipse
        cx="6.8"
        cy="14.8"
        rx="2.1"
        ry="3.4"
        fill="currentColor"
        opacity="0.45"
        transform="rotate(60 6.8 14.8)"
      />
      <ellipse
        cx="6.8"
        cy="9.4"
        rx="2.1"
        ry="3.4"
        fill="currentColor"
        opacity="0.45"
        transform="rotate(120 6.8 9.4)"
      />
    </svg>
  )
}
function ArrowLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M15 6l-6 6 6 6" />
      <path d="M9 12h10" />
    </svg>
  )
}

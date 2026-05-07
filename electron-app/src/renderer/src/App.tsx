import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

type NavItem = {
  label: string
  badge?: string
  active?: boolean
  icon: (props: IconProps) => JSX.Element
}

type LabelItem = {
  label: string
  tone: 'petal' | 'teal' | 'amber' | 'slate'
}

type Task = {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  badge: string
  time: string
  tags: string[]
  note?: {
    title: string
    text: string
  }
  doneAt?: string
}

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
  time: string
}

const navigationItems: NavItem[] = [
  { label: '今日任务', active: true, icon: CalendarIcon },
  { label: '即将到来', badge: '7', icon: UpcomingIcon },
  { label: '汇总中心', badge: '日报', icon: SummaryIcon },
  { label: '述职工作台', icon: SlideshowIcon },
  { label: '项目', icon: FolderIcon }
]

const labelItems: LabelItem[] = [
  { label: '深度工作', tone: 'petal' },
  { label: '会议协作', tone: 'teal' },
  { label: '规划推进', tone: 'amber' },
  { label: '风险问题', tone: 'slate' }
]

const pendingTasks: Task[] = [
  {
    title: '整理 AI 运行时的任务回放链路',
    description: '明确任务事实如何沉淀到日报、周报与述职草稿的引用来源中。',
    priority: 'high',
    badge: '高优先级',
    time: '09:30 - 11:00',
    tags: ['深度工作', '约 90 分钟', '规划推进']
  },
  {
    title: '补齐汇总中心的引用来源说明',
    description: '让每一段总结都能追溯到任务、进展和结果说明。',
    priority: 'medium',
    badge: '中优先级',
    time: '14:00 前',
    tags: ['会议协作']
  }
]

const activeTasks: Task[] = [
  {
    title: '设计首页三栏工作台首屏',
    description: '统一统计条、任务区、汇总入口和 AI 面板的业务表达，形成首页工作台结构稿。',
    priority: 'high',
    badge: '高优先级',
    time: '进行中',
    tags: ['深度工作', '约 90 分钟'],
    note: {
      title: '结果摘要',
      text: '已完成结构稿，正在统一今日任务与汇总中心之间的事实链路。'
    }
  },
  {
    title: '补充完成任务的结果说明交互',
    description: '在标记完成后引导用户补一句“完成了什么”或“产出了什么”，用于日报和周报引用。',
    priority: 'medium',
    badge: '中优先级',
    time: '下一步',
    tags: ['风险问题'],
    note: {
      title: '阻塞问题',
      text: '还需确认完成弹层里的结果说明如何同步进入 AI 总结提示词。'
    }
  }
]

const completedTasks: Task[] = [
  {
    title: '梳理日报结构与生成条件',
    description: '已明确今日完成、关键产出、未完成事项及明日计划四段式结构。',
    priority: 'low',
    badge: '已完成',
    time: '',
    tags: [],
    doneAt: '上午 8:40'
  },
  {
    title: '整理今日任务的引用来源字段',
    description: '已确定任务卡片要保留项目、优先级、预计时长和结果摘要。',
    priority: 'low',
    badge: '已完成',
    time: '',
    tags: [],
    doneAt: '上午 8:10'
  },
  {
    title: '补齐专注时长与总结入口关系',
    description: '专注时长已作为统计条和后续总结依据的一部分保留。',
    priority: 'low',
    badge: '已完成',
    time: '',
    tags: [],
    doneAt: '上午 7:55'
  }
]

const upcomingTasks: Task[] = [
  {
    title: '下周周报生成入口联调',
    description: '串联未来 7 天任务与周报聚合规则，提前准备时间范围查询。',
    priority: 'low',
    badge: '明天',
    time: '',
    tags: []
  }
]

const chips = ['总结今日', '拆分待办', '补充进展', '生成述职草稿']

const summaryRows = [
  { label: '已完成任务', value: '3 项', tone: 'text-[#6d8f96]' },
  { label: '已补充结果说明', value: '2 项', tone: 'text-[var(--ink)]' },
  { label: '进行中任务', value: '2 项', tone: 'text-[#7faa96]' }
]

const messages: ChatMessage[] = [
  {
    role: 'assistant',
    text: '我已经整理出今天的任务状态、结果说明和阻塞信息。可以先生成日报草稿，再补齐未完成事项的原因。',
    time: '上午 9:12'
  },
  {
    role: 'user',
    text: '先帮我整理今天的关键产出，并告诉我哪些任务还缺结果说明或下一步计划。',
    time: '上午 9:13'
  },
  {
    role: 'assistant',
    text: '已完成汇总，以下是今日任务摘要：',
    time: '上午 9:14'
  }
]

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="glass-deep relative z-10 flex w-full flex-col border-b border-[rgba(196,115,122,0.1)] shadow-[0_1px_24px_rgba(28,22,20,0.04)] lg:h-screen lg:w-64 lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:shadow-[1px_0_24px_rgba(28,22,20,0.04)]">
        <div className="petal-deco -left-24 -top-24 opacity-60" />

        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--petal-light)] to-[var(--teal-xlight)] shadow-[var(--shadow-lift-sm)]">
            <FlowerIcon className="h-5 w-5 text-[var(--petal)]" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)]">交个代</h1>
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--ink-faint)]">工作总结工作台</p>
          </div>
        </div>

        <div className="px-4 pb-5">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--petal)] py-2.5 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_4px_16px_rgba(196,115,122,0.32)] transition-all hover:bg-[#b56870] hover:shadow-[0_6px_20px_rgba(196,115,122,0.4)] active:scale-[0.98]">
            <PlusIcon className="h-4 w-4" />
            新建今日待办
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">工作区</p>
          {navigationItems.map((item) => (
            <SidebarNavItem key={item.label} item={item} />
          ))}

          <div className="my-3 border-t border-[rgba(196,115,122,0.08)]" />
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">标签</p>

          {labelItems.map((item) => (
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
              <p className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--ink)]">专注计时器</p>
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
              <p className="truncate text-[13px] font-medium text-[var(--ink)]">田中米亚</p>
              <p className="text-[11px] text-[var(--ink-faint)]">专业版</p>
            </div>
            <MoreIcon className="h-4 w-4 text-[var(--ink-faint)]" />
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex flex-col gap-4 px-5 pb-4 pt-6 md:px-8 md:pt-8 lg:flex-shrink-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                  <SunIcon className="h-3 w-3" />
                  周二，5 月 7 日
                </p>
                <h2 className="text-[32px] font-light leading-[1.1] tracking-[-0.03em] text-[var(--ink)] md:text-[36px]">
                  早安。<span className="font-medium text-[var(--petal)]">『田中米亚』</span>
                </h2>
                <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-[var(--ink-muted)]">
                  维护今日待办，补充进展和结果说明，再把这些事实直接整理成日报、周报和述职草稿。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TopActionButton icon={FilterIcon}>筛选</TopActionButton>
                <TopActionButton icon={SummaryIcon}>汇总入口</TopActionButton>
              </div>
            </div>
          </header>

          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_192px] md:px-8 lg:flex-shrink-0">
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
            <StatTile
              icon={<TimerIcon className="h-4 w-4 text-[#c48240]" />}
              iconClassName="bg-[rgba(232,168,124,0.15)]"
              value="2小时"
              suffix="14分"
              label="深度专注"
            />
            <article className="stat-card glass flex items-center gap-4 rounded-xl border border-[rgba(196,115,122,0.1)] px-4 py-3">
              <div className="relative h-12 w-12 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="h-12 w-12">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(196,115,122,0.15)" strokeWidth="4" />
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
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--petal)]">日报</span>
              </div>
              <div>
                <p className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--ink)]">立即生成</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">今日总结</p>
              </div>
            </article>
          </div>

          <div className="px-5 pb-5 md:px-8 lg:flex-shrink-0">
            <div className="glass rounded-xl border border-[rgba(196,115,122,0.1)] p-4 shadow-[var(--shadow-lift-sm)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--petal)]">汇总中心预览</p>
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
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8 md:px-8">
            <div className="space-y-6">
              <TaskSection title="待开始" badge="2 项待开始" tasks={pendingTasks} />
              <TaskSection title="进行中" badge="2 项进行中" tasks={activeTasks} />
              <TaskSection title="已完成" badge="3 项已完成" badgeTone="teal" tasks={completedTasks} completed />
              <TaskSection title="即将到来" tasks={upcomingTasks} upcoming />
            </div>
          </div>
        </section>

        <aside className="glass-deep relative flex w-full flex-col overflow-hidden border-t border-[rgba(196,115,122,0.1)] shadow-[0_-1px_24px_rgba(28,22,20,0.04)] lg:h-full lg:w-[360px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:shadow-[-1px_0_24px_rgba(28,22,20,0.04)]">
          <div className="petal-deco -bottom-32 -right-32 opacity-40" />

          <div className="relative z-10 border-b border-[rgba(196,115,122,0.1)] px-5 pb-4 pt-6 lg:flex-shrink-0">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--petal-light)] via-[#f5e5e8] to-[var(--teal-xlight)] shadow-[var(--shadow-lift-sm)]">
                  <SparkIcon className="h-[18px] w-[18px] text-[var(--petal)]" />
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#7faa96] shadow-sm" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)]">代办官</h3>
                  <p className="text-[11px] font-medium text-[var(--teal)]">● 在线 · 正在整理你的今日工作</p>
                </div>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(28,22,20,0.04)] text-[var(--ink-faint)] transition-all hover:bg-[var(--petal-xlight)] hover:text-[var(--petal)]">
                <MoreIcon className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  className="chip rounded-xl border border-[rgba(28,22,20,0.06)] bg-[rgba(28,22,20,0.05)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-4">
              <div className="my-1 flex items-center gap-3">
                <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
                <span className="rounded-full border border-[rgba(196,115,122,0.08)] bg-[var(--sand)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink-faint)]">
                  今天 上午 9:12
                </span>
                <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
              </div>

              {messages.map((message, index) => (
                <ChatThread key={`${message.time}-${index}`} message={message} showSummaryCard={index === 2} />
              ))}

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
            </div>
          </div>

          <div className="relative z-10 border-t border-[rgba(196,115,122,0.1)] px-4 pb-5 pt-3 lg:flex-shrink-0">
            <div className="glass overflow-hidden rounded-xl border border-[rgba(196,115,122,0.16)] shadow-[var(--shadow-lift-sm)]">
              <textarea
                rows={2}
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
            <p className="mt-2 text-center text-[10px] text-[var(--ink-faint)]">代办官 · 由 GPT-4o 驱动</p>
          </div>
        </aside>
      </main>
    </div>
  )
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <button
      className={`nav-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-[14px] ${
        item.active ? 'bg-[var(--petal-light)] text-[var(--petal)]' : 'text-[var(--ink-muted)] hover:bg-[var(--petal-xlight)]'
      }`}
    >
      {item.active ? <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(196,115,122,0.08)] to-transparent" /> : null}
      <Icon className={`relative h-[18px] w-[18px] ${item.active ? 'text-[var(--petal)]' : 'text-[var(--ink-faint)] group-hover:text-[var(--petal)]'}`} />
      <span className={`relative flex-1 ${item.active ? 'font-semibold' : ''}`}>{item.label}</span>
      {item.active ? (
        <svg viewBox="0 0 22 22" className="relative h-[22px] w-[22px]">
          <circle cx="11" cy="11" r="8" fill="none" stroke="rgba(196,115,122,0.2)" strokeWidth="2.5" />
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
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            item.label === '即将到来'
              ? 'bg-[rgba(232,168,124,0.15)] text-[#c48240]'
              : 'bg-[var(--petal-xlight)] text-[var(--petal)]'
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}

function TopActionButton({ icon: Icon, children }: { icon: (props: IconProps) => JSX.Element; children: string }) {
  return (
    <button className="flex items-center gap-1.5 rounded-xl border border-[rgba(196,115,122,0.2)] px-3.5 py-2 text-[14px] text-[var(--ink-muted)] transition-all hover:border-[rgba(196,115,122,0.3)] hover:bg-[var(--petal-xlight)]">
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function StatTile({
  icon,
  iconClassName,
  value,
  suffix,
  label
}: {
  icon: JSX.Element
  iconClassName: string
  value: string
  suffix: string
  label: string
}) {
  return (
    <article className="stat-card glass flex items-center gap-3 rounded-xl border border-[rgba(196,115,122,0.1)] px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>{icon}</div>
      <div>
        <p className="leading-none text-[22px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {value} <span className="text-[14px] font-normal text-[var(--ink-faint)]">{suffix}</span>
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-faint)]">{label}</p>
      </div>
    </article>
  )
}

function TaskSection({
  title,
  badge,
  tasks,
  completed = false,
  upcoming = false,
  badgeTone = 'petal'
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-faint)]">{title}</p>
        <div className="flex-1 border-t border-[rgba(196,115,122,0.1)]" />
        {badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              badgeTone === 'teal' ? 'bg-[var(--teal-xlight)] text-[var(--teal)]' : 'bg-[var(--petal-xlight)] text-[var(--petal)]'
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.title} task={task} completed={completed} upcoming={upcoming} />
        ))}
      </div>
    </section>
  )
}

function TaskCard({ task, completed = false, upcoming = false }: { task: Task; completed?: boolean; upcoming?: boolean }) {
  if (completed) {
    return (
      <article className="task-card flex items-start gap-4 rounded-xl border border-[rgba(196,115,122,0.06)] bg-[rgba(255,255,255,0.45)] p-4 opacity-60 transition-opacity hover:opacity-80">
        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#7faa96]">
          <CheckIcon className="h-[13px] w-[13px] text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[16px] font-medium leading-6 tracking-[-0.01em] text-[var(--ink-muted)] line-through">{task.title}</h3>
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
      className={`task-card ${priorityClass(task.priority)} flex items-start gap-4 rounded-xl border p-4 ${
        upcoming
          ? 'glass border-[rgba(196,115,122,0.08)] hover:border-[rgba(196,115,122,0.2)]'
          : 'glass border-[rgba(196,115,122,0.1)] hover:border-[rgba(196,115,122,0.22)]'
      }`}
    >
      <button className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${toggleClass(task.priority)}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-medium leading-6 tracking-[-0.01em] text-[var(--ink)]">{task.title}</h3>
          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${badgeClass(task.priority, upcoming)}`}>{task.badge}</span>
        </div>
        <p className="text-[14px] leading-6 text-[var(--ink-muted)]">{task.description}</p>

        {!upcoming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-[rgba(28,22,20,0.05)] px-2.5 py-1 text-[12px] text-[var(--ink-muted)]">
              <ClockIcon className="h-[13px] w-[13px]" />
              {task.time}
            </span>
            {task.tags.map((tag) => (
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

function ChatThread({ message, showSummaryCard = false }: { message: ChatMessage; showSummaryCard?: boolean }) {
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

        {showSummaryCard ? (
          <div className="rounded-xl border border-[rgba(196,115,122,0.15)] bg-gradient-to-br from-[var(--petal-xlight)] to-[var(--teal-xlight)] p-3.5 shadow-[var(--shadow-lift-sm)]">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--petal)]">今日任务汇总</p>
            <div className="space-y-2">
              {summaryRows.map((row) => (
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
        ) : null}

        <p className="ml-1 text-[10px] text-[var(--ink-faint)]">{message.time}</p>
      </div>
    </div>
  )
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
  if (priority === 'high') return 'border-[rgba(196,115,122,0.4)] hover:border-[var(--petal)] hover:bg-[var(--petal-xlight)]'
  if (priority === 'medium') return 'border-[rgba(232,168,124,0.5)] hover:border-[#e8a87c] hover:bg-[rgba(232,168,124,0.1)]'

  return 'border-[rgba(127,170,150,0.4)] hover:border-[#7faa96] hover:bg-[rgba(127,170,150,0.1)]'
}

function badgeClass(priority: Task['priority'], upcoming: boolean) {
  if (upcoming) return 'bg-[rgba(28,22,20,0.05)] text-[var(--ink-faint)]'
  if (priority === 'high') return 'bg-[var(--petal-xlight)] text-[var(--petal)]'
  if (priority === 'medium') return 'bg-[rgba(232,168,124,0.15)] text-[#c48240]'

  return 'bg-[var(--teal-xlight)] text-[var(--teal)]'
}

function tagClass(tag: string) {
  if (tag === '深度工作') return 'rounded-lg bg-[var(--teal-xlight)] px-2.5 py-1 text-[12px] text-[var(--teal)]'
  if (tag === '会议协作') return 'rounded-lg bg-[var(--teal-xlight)] px-2.5 py-1 text-[12px] text-[var(--teal)]'
  if (tag === '规划推进') return 'rounded-lg bg-[rgba(232,168,124,0.12)] px-2.5 py-1 text-[12px] text-[#c48240]'
  if (tag === '风险问题') return 'rounded-lg bg-[rgba(139,127,150,0.12)] px-2.5 py-1 text-[12px] text-[#8b7f96]'

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
      <ellipse cx="17.2" cy="9.4" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" transform="rotate(60 17.2 9.4)" />
      <ellipse cx="17.1" cy="14.8" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" transform="rotate(120 17.1 14.8)" />
      <ellipse cx="12" cy="17.6" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" />
      <ellipse cx="6.8" cy="14.8" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" transform="rotate(60 6.8 14.8)" />
      <ellipse cx="6.8" cy="9.4" rx="2.1" ry="3.4" fill="currentColor" opacity="0.45" transform="rotate(120 6.8 9.4)" />
    </svg>
  )
}
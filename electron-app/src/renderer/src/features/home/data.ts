import type { ChatMessage, LabelItem, NavItem, SummaryRow, Task } from './types'

export const userName = '田中米亚'

export const navigationItems: NavItem[] = [
  { label: '今日任务', active: true, icon: 'today' },
  { label: '即将到来', icon: 'upcoming' },
  { label: '汇总中心', icon: 'summary' },
  { label: '述职工作台', icon: 'slideshow' },
  { label: '项目', icon: 'folder' },
]

export const labelItems: LabelItem[] = [
  { label: '深度工作', tone: 'petal' },
  { label: '会议协作', tone: 'teal' },
  { label: '规划推进', tone: 'amber' },
  { label: '风险问题', tone: 'slate' },
]

export const pendingTasks: Task[] = []

export const activeTasks: Task[] = []

export const completedTasks: Task[] = []

export const upcomingTasks: Task[] = []

export const chips = ['总结今日', '拆分待办', '补充进展', '生成述职草稿']

export const emptyStateHighlights = [
  {
    title: '先记录今天要推进的事',
    description: '新建第一条待办后，工作台会开始沉淀优先级、预计时间和结果说明。',
  },
  {
    title: '补一句进展，汇总就有事实可用',
    description: '每次推进任务时补充一句进展，日报和周报会直接引用这些内容。',
  },
  {
    title: '完成后留下结果说明',
    description: '标记完成时补上产出和影响，后续生成总结时就不用再回忆。',
  },
]

export const emptyStateFlow = ['新建第一条待办', '补充进展和结果说明', '自动生成日报与周报草稿']

export const emptyStateSuggestions = ['创建任务模版', '查看汇总结构', '让 AI 帮你拆分待办']

export const summaryRows: SummaryRow[] = [
  { label: '已完成任务', value: '0 项', tone: 'text-[var(--ink-faint)]' },
  { label: '已补充结果说明', value: '0 项', tone: 'text-[var(--ink-faint)]' },
  { label: '进行中任务', value: '0 项', tone: 'text-[var(--ink-faint)]' },
]

export const messages: ChatMessage[] = [
  {
    role: 'assistant',
    text: '今天的工作台还是空的。你可以先新建第一条待办，我会在你补充进展和结果说明后帮你整理日报草稿。',
    time: '上午 9:12',
  },
  {
    role: 'user',
    text: '那就先帮我规划一下，第一条待办应该怎么写更方便后面生成总结？',
    time: '上午 9:13',
  },
  {
    role: 'assistant',
    text: '建议先写清任务目标、预计完成时间和你希望沉淀的结果。我也可以继续帮你拆成 2 到 3 个可执行子任务。',
    time: '上午 9:14',
  },
]

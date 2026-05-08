import type { ChatMessage, LabelItem, NavItem, SummaryRow, Task } from './types'

export const userName = '田中米亚'

export const navigationItems: NavItem[] = [
  { label: '今日任务', active: true, icon: 'today' },
  { label: '即将到来', badge: '7', icon: 'upcoming' },
  { label: '汇总中心', badge: '日报', icon: 'summary' },
  { label: '述职工作台', icon: 'slideshow' },
  { label: '项目', icon: 'folder' }
]

export const labelItems: LabelItem[] = [
  { label: '深度工作', tone: 'petal' },
  { label: '会议协作', tone: 'teal' },
  { label: '规划推进', tone: 'amber' },
  { label: '风险问题', tone: 'slate' }
]

export const pendingTasks: Task[] = [
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

export const activeTasks: Task[] = [
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

export const completedTasks: Task[] = [
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

export const upcomingTasks: Task[] = [
  {
    title: '下周周报生成入口联调',
    description: '串联未来 7 天任务与周报聚合规则，提前准备时间范围查询。',
    priority: 'low',
    badge: '明天',
    time: '',
    tags: []
  }
]

export const chips = ['总结今日', '拆分待办', '补充进展', '生成述职草稿']

export const summaryRows: SummaryRow[] = [
  { label: '已完成任务', value: '3 项', tone: 'text-[#6d8f96]' },
  { label: '已补充结果说明', value: '2 项', tone: 'text-[var(--ink)]' },
  { label: '进行中任务', value: '2 项', tone: 'text-[#7faa96]' }
]

export const messages: ChatMessage[] = [
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
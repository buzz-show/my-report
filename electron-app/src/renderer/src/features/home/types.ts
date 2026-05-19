export type LayoutMode = 'mobile' | 'tablet' | 'desktop'

export type NavIconKey =
  | 'today'
  | 'upcoming'
  | 'summary'
  | 'slideshow'
  | 'folder'
  | 'settings'
  | 'spark'
  | 'timer'
  | 'filter'
  | 'mic'
  | 'attachment'
  | 'send'
  | 'sun'

export type NavItem = {
  label: string
  badge?: string
  path: string
  icon: NavIconKey
}

export type LabelItem = {
  label: string
  tone: 'petal' | 'teal' | 'amber' | 'slate'
}

export type Task = {
  id: string
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

export type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
  time: string
}

export type SummaryRow = {
  label: string
  value: string
  tone: string
}

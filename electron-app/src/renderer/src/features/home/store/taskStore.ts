import { create } from 'zustand'

import type { Task } from '../types'

interface TaskStore {
  tasks: Task[]
  modalOpen: boolean
  addTask: (task: Omit<Task, 'id'>) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  openModal: () => void
  closeModal: () => void
}

let counter = 0
const genId = (): string => `task-${++counter}-${Date.now()}`

export const useTaskStore = create<TaskStore>(set => ({
  tasks: [],
  modalOpen: false,

  addTask: task =>
    set(state => ({
      tasks: [...state.tasks, { ...task, id: genId() }],
    })),

  completeTask: id =>
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id
          ? {
              ...t,
              doneAt: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : t
      ),
    })),

  deleteTask: id =>
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
    })),

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}))

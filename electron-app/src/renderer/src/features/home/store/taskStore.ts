import { create } from 'zustand'

import { taskApi } from '../../../lib/runtimeClient'
import type { Task } from '../types'

interface TaskStore {
  tasks: Task[]
  modalOpen: boolean
  addTask: (task: Omit<Task, 'id'>) => Promise<void>
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  openModal: () => void
  closeModal: () => void
}

export const useTaskStore = create<TaskStore>(set => ({
  tasks: [],
  modalOpen: false,

  addTask: async task => {
    const view = await taskApi.create({
      title: task.title,
      description: task.description,
      priority: task.priority,
      badge: task.badge,
      time: task.time,
      tags: task.tags,
    })
    const newTask: Task = {
      id: view.id,
      title: view.title,
      description: view.description,
      priority: view.priority as Task['priority'],
      badge: view.badge,
      time: view.time,
      tags: view.tags,
      doneAt: view.done_at ?? undefined,
    }
    set(state => ({ tasks: [...state.tasks, newTask] }))
  },

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

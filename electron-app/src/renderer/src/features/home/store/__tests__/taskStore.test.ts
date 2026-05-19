/**
 * taskStore 单测
 *
 * 覆盖：
 * - addTask 成功：调用 taskApi.create，映射 API 响应到 Task，追加至 store
 * - addTask 失败：错误向外抛出，store 不更新
 * - completeTask：正确标记 doneAt，其余 task 不受影响
 * - deleteTask：从列表移除指定 task
 * - openModal / closeModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

import { useTaskStore } from '../taskStore'

// mock runtimeClient，使 taskStore 不发真实 HTTP 请求
vi.mock('../../../../lib/runtimeClient', () => ({
  taskApi: {
    create: vi.fn(),
  },
}))

import { taskApi } from '../../../../lib/runtimeClient'

// ---------- helpers ----------

const API_VIEW = {
  id: 'server-id-1',
  title: '写周报',
  description: '本周进展',
  priority: 'high',
  badge: '高优先级',
  time: '09:00 – 10:00',
  tags: ['深度工作'],
  done_at: null,
  created_at: '2026-05-19T00:00:00Z',
}

const TASK_PAYLOAD = {
  title: '写周报',
  description: '本周进展',
  priority: 'high' as const,
  badge: '高优先级',
  time: '09:00 – 10:00',
  tags: ['深度工作'],
}

beforeEach(() => {
  vi.clearAllMocks()
  act(() => {
    useTaskStore.setState({ tasks: [], modalOpen: false })
  })
})

// ---------- addTask ----------

describe('addTask', () => {
  it('calls taskApi.create with the correct payload', async () => {
    vi.mocked(taskApi.create).mockResolvedValue(API_VIEW)

    await act(async () => {
      await useTaskStore.getState().addTask(TASK_PAYLOAD)
    })

    expect(taskApi.create).toHaveBeenCalledWith({
      title: '写周报',
      description: '本周进展',
      priority: 'high',
      badge: '高优先级',
      time: '09:00 – 10:00',
      tags: ['深度工作'],
    })
  })

  it('appends the mapped Task to the store on success', async () => {
    vi.mocked(taskApi.create).mockResolvedValue(API_VIEW)

    await act(async () => {
      await useTaskStore.getState().addTask(TASK_PAYLOAD)
    })

    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({
      id: 'server-id-1',
      title: '写周报',
      description: '本周进展',
      priority: 'high',
      badge: '高优先级',
      time: '09:00 – 10:00',
      tags: ['深度工作'],
      doneAt: undefined,
    })
  })

  it('maps done_at string to doneAt when present', async () => {
    vi.mocked(taskApi.create).mockResolvedValue({
      ...API_VIEW,
      done_at: '2026-05-19T12:00:00Z',
    })

    await act(async () => {
      await useTaskStore.getState().addTask(TASK_PAYLOAD)
    })

    expect(useTaskStore.getState().tasks[0].doneAt).toBe('2026-05-19T12:00:00Z')
  })

  it('propagates error and does not update store on failure', async () => {
    vi.mocked(taskApi.create).mockRejectedValue(new Error('创建失败'))

    await expect(
      act(async () => {
        await useTaskStore.getState().addTask(TASK_PAYLOAD)
      })
    ).rejects.toThrow('创建失败')

    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })
})

// ---------- completeTask ----------

describe('completeTask', () => {
  it('sets doneAt on the matching task and leaves others unchanged', () => {
    act(() => {
      useTaskStore.setState({
        tasks: [
          { ...TASK_PAYLOAD, id: 'a', doneAt: undefined },
          { ...TASK_PAYLOAD, id: 'b', doneAt: undefined },
        ],
      })
    })

    act(() => {
      useTaskStore.getState().completeTask('a')
    })

    const { tasks } = useTaskStore.getState()
    expect(tasks.find(t => t.id === 'a')?.doneAt).toBeTruthy()
    expect(tasks.find(t => t.id === 'b')?.doneAt).toBeUndefined()
  })
})

// ---------- deleteTask ----------

describe('deleteTask', () => {
  it('removes the task with the given id', () => {
    act(() => {
      useTaskStore.setState({
        tasks: [
          { ...TASK_PAYLOAD, id: 'keep' },
          { ...TASK_PAYLOAD, id: 'remove' },
        ],
      })
    })

    act(() => {
      useTaskStore.getState().deleteTask('remove')
    })

    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe('keep')
  })
})

// ---------- modal ----------

describe('modal state', () => {
  it('openModal sets modalOpen to true', () => {
    act(() => {
      useTaskStore.getState().openModal()
    })
    expect(useTaskStore.getState().modalOpen).toBe(true)
  })

  it('closeModal sets modalOpen to false', () => {
    act(() => {
      useTaskStore.setState({ modalOpen: true })
      useTaskStore.getState().closeModal()
    })
    expect(useTaskStore.getState().modalOpen).toBe(false)
  })
})

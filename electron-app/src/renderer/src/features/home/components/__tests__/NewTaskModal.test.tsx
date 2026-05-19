/**
 * NewTaskModal 单测
 *
 * 覆盖：
 * - modalOpen=false 时不渲染
 * - modalOpen=true 时渲染表单
 * - 标题为空时提交按钮禁用
 * - 提交中（submitting）时按钮禁用并显示"创建中…"
 * - 成功提交：以正确参数调用 addTask，并调用 closeModal
 * - 失败提交：显示内联错误信息，不调用 closeModal
 * - 点击取消 / Backdrop 调用 closeModal
 * - Escape 键调用 closeModal
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import NewTaskModal from '../NewTaskModal'

// ---- mock useTaskStore ----

const mockStore = {
  modalOpen: true,
  closeModal: vi.fn(),
  addTask: vi.fn(),
}

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => mockStore,
}))

// ---------- setup ----------

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.modalOpen = true
  mockStore.addTask.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------- visibility ----------

describe('visibility', () => {
  it('renders nothing when modalOpen is false', () => {
    mockStore.modalOpen = false
    const { container } = render(<NewTaskModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the modal dialog when modalOpen is true', () => {
    render(<NewTaskModal />)
    expect(screen.getByRole('dialog', { name: '新建今日待办' })).toBeTruthy()
  })
})

// ---------- submit button state ----------

describe('submit button', () => {
  it('is disabled when title is empty', () => {
    render(<NewTaskModal />)
    expect((screen.getByRole('button', { name: /创建待办/ }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })

  it('is enabled after typing a title', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')

    expect((screen.getByRole('button', { name: /创建待办/ }) as HTMLButtonElement).disabled).toBe(
      false
    )
  })

  it('shows "创建中…" and is disabled while submitting', async () => {
    const user = userEvent.setup()
    // addTask never resolves during this test
    mockStore.addTask.mockReturnValue(new Promise(() => {}))

    render(<NewTaskModal />)
    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')
    await user.click(screen.getByRole('button', { name: /创建待办/ }))

    const btn = screen.getByRole('button', { name: /创建中/ }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})

// ---------- successful submit ----------

describe('successful submit', () => {
  it('calls addTask with correct payload and closes modal', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')
    await user.type(screen.getByPlaceholderText(/这个任务要完成什么/), '本周进展')

    await user.click(screen.getByRole('button', { name: /创建待办/ }))

    await waitFor(() => {
      expect(mockStore.addTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '写周报',
          description: '本周进展',
          priority: 'high',
          badge: '高优先级',
        })
      )
      expect(mockStore.closeModal).toHaveBeenCalledTimes(1)
    })
  })

  it('defaults time to "待定" when time field is empty', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')
    await user.click(screen.getByRole('button', { name: /创建待办/ }))

    await waitFor(() => {
      expect(mockStore.addTask).toHaveBeenCalledWith(expect.objectContaining({ time: '待定' }))
    })
  })
})

// ---------- failed submit ----------

describe('failed submit', () => {
  it('shows inline error and does not close modal on addTask rejection', async () => {
    const user = userEvent.setup()
    mockStore.addTask.mockRejectedValue(new Error('服务器错误'))

    render(<NewTaskModal />)
    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')
    await user.click(screen.getByRole('button', { name: /创建待办/ }))

    await waitFor(() => {
      expect(screen.getByText('服务器错误')).toBeTruthy()
      expect(mockStore.closeModal).not.toHaveBeenCalled()
    })
  })

  it('shows fallback message for non-Error rejections', async () => {
    const user = userEvent.setup()
    mockStore.addTask.mockRejectedValue('unexpected')

    render(<NewTaskModal />)
    await user.type(screen.getByPlaceholderText('你今天要推进什么？'), '写周报')
    await user.click(screen.getByRole('button', { name: /创建待办/ }))

    await waitFor(() => {
      expect(screen.getByText('创建失败，请重试')).toBeTruthy()
    })
  })
})

// ---------- close actions ----------

describe('close actions', () => {
  it('calls closeModal when 取消 is clicked', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.click(screen.getByRole('button', { name: '取消' }))

    expect(mockStore.closeModal).toHaveBeenCalledTimes(1)
  })

  it('calls closeModal when backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.click(screen.getByRole('button', { name: '关闭弹窗' }))

    expect(mockStore.closeModal).toHaveBeenCalledTimes(1)
  })

  it('calls closeModal on Escape key', async () => {
    const user = userEvent.setup()
    render(<NewTaskModal />)

    await user.keyboard('{Escape}')

    expect(mockStore.closeModal).toHaveBeenCalledTimes(1)
  })
})

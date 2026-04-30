/**
 * chat 功能域公开 API
 *
 * 外部（App.tsx 等）只从此处 import，不直接引用域内子路径。
 * 这是功能域的唯一对外接口，内部重构不影响外部调用方。
 */
export { default as ChatPanel } from './components/ChatPanel'
export { useChatStore } from './store/chatStore'
export { useStreamChat } from './hooks/useStreamChat'

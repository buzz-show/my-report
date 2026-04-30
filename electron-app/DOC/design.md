# 应用架构设计

> Electron + React + OpenAI 流式对话 Demo（含 Tool Use / ReAct 循环）

---

## 三层进程模型（Electron 安全边界）

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Process (Node.js)                                         │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │  index.ts   │    │              ipc.ts                  │   │
│  │             │    │                                      │   │
│  │ BrowserWindow│    │  registerIpcHandlers()               │   │
│  │ dotenv.load │    │    ipcMain.on('chat:stream:start')   │   │
│  │ registerIpc │    │    └─ runReActLoop(event, messages)  │   │
│  └─────────────┘    └──────────────┬─────────────────────-┘   │
│                                    │ import                     │
│                     ┌──────────────▼──────────────────────┐   │
│                     │            tools.ts                  │   │
│                     │                                      │   │
│                     │  TOOL_REGISTRY {                     │   │
│                     │    get_current_time → execute()      │   │
│                     │    calculate        → execute()      │   │
│                     │    get_system_info  → execute()      │   │
│                     │  }                                   │   │
│                     │  TOOL_DEFINITIONS (OpenAI schema)    │   │
│                     │  executeTool(name, args): string     │   │
│                     └──────────────────────────────────────┘   │
│                                    │ os / Node.js APIs          │
│                                    ▼ 系统层（完整权限）          │
└─────────────────────────────────────────────────────────────────┘
                              ↕ IPC 通道（6条）
┌─────────────────────────────────────────────────────────────────┐
│  Preload Script (contextBridge 安全桥梁)                        │
│                                                                 │
│  exposeInMainWorld('electronAPI', {                             │
│    startStream(messages)      →  send('chat:stream:start')     │
│    onChunk(cb)                ←  on('chat:stream:chunk')       │
│    onDone(cb)                 ←  once('chat:stream:done')      │
│    onError(cb)                ←  once('chat:stream:error')     │
│    onToolCall(cb)             ←  on('chat:stream:tool-call')   │
│    onToolResult(cb)           ←  on('chat:stream:tool-result') │
│  })                                                             │
│  ※ 所有方法返回 unsubscribe() 函数，防止内存泄漏               │
└─────────────────────────────────────────────────────────────────┘
                              ↕ window.electronAPI
┌─────────────────────────────────────────────────────────────────┐
│  Renderer Process (React + Chromium，无 Node 权限)              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Zustand Store (chatStore.ts)                           │   │
│  │                                                         │   │
│  │  messages: Message[]    systemPrompt: string            │   │
│  │                                                         │   │
│  │  addMessage()           ← user/assistant 消息入队        │   │
│  │  updateLastAssistant()  ← 流式 chunk 追加               │   │
│  │  appendToolCallToLast() ← tool call 挂载到 assistant    │   │
│  │  updateToolCallResult() ← 通过 id 填入工具结果           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │ useChatStore()                          │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │  useStreamChat() hook                                   │   │
│  │                                                         │   │
│  │  sendMessage(input)                                     │   │
│  │    addMessage(user)  → addMessage(assistant placeholder)│   │
│  │    register listeners: onChunk / onDone / onError /     │   │
│  │                        onToolCall / onToolResult        │   │
│  │    startStream(systemPrompt + history + userInput)      │   │
│  │  cleanupRef: (() => void)[]  ← 会话结束统一 unsubscribe │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │  Component Tree                                         │   │
│  │                                                         │   │
│  │  App                                                    │   │
│  │  └─ ChatPanel                                          │   │
│  │       ├─ header（标题 + 模型名 + 清空按钮）              │   │
│  │       ├─ MessageList                                    │   │
│  │       │    └─ MessageItem × N                           │   │
│  │       │         ├─ user: <p>                            │   │
│  │       │         └─ assistant: <ReactMarkdown>           │   │
│  │       │              └─ ToolCallBubble（可选）          │   │
│  │       │                   └─ ToolCallCard × M           │   │
│  │       │                        ├─ header（展开/折叠）    │   │
│  │       │                        ├─ args JSON（展开后）    │   │
│  │       │                        └─ result / spinner      │   │
│  │       └─ InputBar（textarea + 发送按钮）                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ReAct 循环时序

```
用户输入
  │
  ▼
useStreamChat.sendMessage()
  │  startStream(messages)
  ▼
Main: runReActLoop(event, messages)        ← 递归函数，每轮一次 LLM 调用
  │
  ├─[stream chunk] content delta ──────────► chat:stream:chunk → 打字机更新
  │
  └─[finish_reason = 'tool_calls']
       │
       ├─ 累积 toolCallAccumulator (Map<index, {id, name, argsJson}>)
       │
       ├─ FOR EACH tool_call:
       │    ├─ send chat:stream:tool-call {id,name,args} ──► ToolCallBubble loading
       │    ├─ executeTool(name, args)    ← tools.ts 执行，Node.js 全权限
       │    └─ send chat:stream:tool-result {id,result} ──► ToolCallBubble 填结果
       │
       ├─ messages.push(assistant + tool roles)  ← 上下文追加
       └─ runReActLoop(event, messages)  ← 递归，带入新上下文
            │
            └─[finish_reason = 'stop']
                 │
                 └─ chat:stream:done ──────────────────────► setStreaming(false)
```

---

## 类型系统

```typescript
// src/renderer/src/types/index.ts

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string            // undefined = 执行中（显示 spinner）
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]     // assistant 消息携带的工具调用列表
  toolCallId?: string        // tool 消息的关联 id（主进程内部使用）
}

// IPC payload（preload 边界传输）
// chat:stream:tool-call   → { id: string; name: string; args: Record<string, unknown> }
// chat:stream:tool-result → { id: string; result: string }
```

---

## 工具扩展协议

添加新工具**只需修改 `src/main/tools.ts`** 中的 `TOOL_REGISTRY`，无需改动其他任何文件。

```typescript
// 在 TOOL_REGISTRY 中追加一条：
my_new_tool: {
  definition: {
    type: 'function',
    function: {
      name: 'my_new_tool',
      description: '工具描述',
      parameters: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: '参数描述' },
        },
        required: ['param1'],
      },
    },
  },
  execute({ param1 }) {
    return `处理结果: ${param1}`
  },
},
```

`TOOL_DEFINITIONS` 和 `executeTool` 均通过 `Object.values(TOOL_REGISTRY)` 动态派生，注册即生效。

---

## 关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| API Key 位置 | 主进程环境变量 | renderer DevTools 可读内存，主进程不暴露给 Chromium |
| 流式传输方式 | `ipcMain.on` + `event.sender.send` | `ipcMain.handle` 只能 resolve 一次，不适合流 |
| ReAct 循环位置 | 主进程（递归） | 工具执行需要 Node.js 权限（`os`、`fs` 等），renderer 无法访问 |
| 工具管理 | Registry Pattern | 单一修改点，开闭原则，新增工具不触碰业务逻辑 |
| 状态管理 | Zustand | 轻量，selector 精确订阅，避免无关重渲染 |
| 监听器清理 | `cleanupRef` + unsubscribe 函数 | 每个 `ipcRenderer.on` 都有对应 `removeListener`，防内存泄漏 |
| 工具 UI 状态 | 组件内 `useState`（非 Store） | 展开/折叠是纯 UI 临时状态，不需要全局共享 |
| contextIsolation | 开启（默认） | 隔离 renderer JS 与 Node.js 环境，防止原型链污染攻击 |

---

## 文件结构

```
src/
├── main/
│   ├── index.ts          # 主进程入口：BrowserWindow + dotenv + registerIpcHandlers
│   ├── ipc.ts            # IPC 处理器：runReActLoop 递归 ReAct 循环
│   └── tools.ts          # 工具注册表：TOOL_REGISTRY / TOOL_DEFINITIONS / executeTool
├── preload/
│   ├── index.ts          # contextBridge：暴露 6 个 electronAPI 方法
│   └── index.d.ts        # ElectronAPI 类型声明（window.electronAPI）
└── renderer/src/
    ├── types/
    │   └── index.ts      # Message / ToolCall 接口定义
    ├── store/
    │   └── chatStore.ts  # Zustand store：消息列表 + systemPrompt + 4 个 actions
    ├── hooks/
    │   └── useStreamChat.ts  # 流式对话 hook：发送 + 5 个监听器 + cleanup
    └── components/
        ├── ChatPanel.tsx      # 布局容器：header + MessageList + InputBar
        ├── MessageList.tsx    # 消息列表，自动滚底
        ├── MessageItem.tsx    # 单条消息：user/assistant 气泡 + ToolCallBubble
        ├── ToolCallBubble.tsx # 工具调用气泡：展开/折叠 + spinner + JSON 格式化
        └── InputBar.tsx       # 输入框：textarea + 发送按钮 + streaming 禁用态
```


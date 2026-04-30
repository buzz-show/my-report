# my-report

基于 **Electron + React + Python LangGraph** 的桌面端 AI 对话应用。前端通过 Electron 提供原生桌面体验，AI 推理由 Python FastAPI 服务承载，两端通过 HTTP SSE 流式通信。

---

## 架构概览

```
┌──────────────────────────────────────────────────────────────┐
│  Electron 桌面应用 (electron-app)                            │
│                                                              │
│  Renderer (React + Zustand)                                  │
│      ↕ contextBridge IPC                                     │
│  Main Process (Node.js)                                      │
│      └── runtime.ts ──── HTTP SSE ──────────────────────┐   │
└─────────────────────────────────────────────────────────┼───┘
                                                          ↓
                         ┌────────────────────────────────────┐
                         │  Python AI Runtime (ai-runtime)    │
                         │                                    │
                         │  FastAPI :18765                    │
                         │  └── LangGraph ReAct Agent         │
                         │       └── ChatOpenAI + Tools       │
                         └────────────────────────────────────┘
```

### 关键设计

- **三层进程隔离**：Renderer 无 Node.js 权限，所有 AI 调用经由主进程代理，API Key 不暴露给 Chromium。
- **SSE 流式输出**：Python 端通过 LangGraph `astream_events` 推送增量事件，Electron 主进程解析后实时转发给渲染层，实现打字机效果。
- **ReAct 循环**：LangGraph 图节点自动在 `call_model → tool_node` 间循环，直到模型停止调用工具。
- **多轮记忆**：LangGraph `MemorySaver` 按 `thread_id` 持久化对话状态。

---

## 目录结构

```
my-report/
├── package.json          # Monorepo 根脚本（concurrently 同时启动两端）
├── electron-app/         # 桌面端（TypeScript + Electron + React）
│   ├── src/
│   │   ├── main/         # 主进程
│   │   │   ├── ai/
│   │   │   │   ├── client.ts     # OpenAI 单例（备用直连模式）
│   │   │   │   ├── loop.ts       # 备用：主进程内 ReAct 循环
│   │   │   │   └── runtime.ts    # 当前启用：调用 Python FastAPI
│   │   │   ├── ipc/              # IPC 处理器（chat、settings）
│   │   │   ├── tools/            # 工具系统（registry、executor、builtin）
│   │   │   └── config/           # 配置管理
│   │   ├── preload/      # contextBridge 安全桥
│   │   ├── renderer/     # React UI
│   │   │   └── src/features/chat/
│   │   │       ├── components/   # ChatPanel、MessageList、InputBar、ToolCallBubble
│   │   │       ├── hooks/        # useStreamChat
│   │   │       └── store/        # chatStore (Zustand)
│   │   └── shared/       # 跨进程共享类型与 IPC channel 常量
│   └── DOC/              # 架构设计、CI/CD、代码规范文档
└── ai-runtime/           # Python AI 后端
    └── ai_runtime/
        ├── server.py     # FastAPI 入口（/chat/stream SSE 接口）
        └── graph.py      # LangGraph ReAct 图（agent + tool_node）
```

---

## 快速开始

### 前置要求

- Node.js >= 18
- Python >= 3.11
- OpenAI API Key（或兼容接口，如阿里云 DashScope）

### 1. 安装依赖

```bash
# Electron 端
cd electron-app && npm install && cd ..

# Python 端
cd ai-runtime && python -m venv .venv && source .venv/bin/activate
pip install -e . && cd ..
```

### 2. 配置环境变量

**electron-app/.env**（参考 `.env.example`）：
```env
OPENAI_API_KEY=your_api_key_here
# 可选，自定义接口地址（兼容 OpenAI 格式）
# OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

**ai-runtime/.env**（参考 `.env.example`）：
```env
OPENAI_API_KEY=your_api_key_here
# 可选
OPENAI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=gpt-4o
AI_RUNTIME_PORT=18765
```

### 3. 启动开发环境

```bash
# 方式一：同时启动两端
npm run dev

# 方式二：分开启动
npm run dev:ai         # 先启动 Python FastAPI（必须先于 Electron 运行）
npm run dev:electron   # 再启动 Electron
```

---

## IPC 通信协议

Electron 主进程与渲染层之间有 6 条 IPC 通道：

| 方向 | Channel | 载荷 | 说明 |
|------|---------|------|------|
| Renderer → Main | `chat:stream:start` | `Message[]` | 发起对话 |
| Main → Renderer | `chat:stream:chunk` | `string` | 文字增量（打字机） |
| Main → Renderer | `chat:stream:tool-call` | `{id, name, args}` | 工具调用开始 |
| Main → Renderer | `chat:stream:tool-result` | `{id, result}` | 工具调用结果 |
| Main → Renderer | `chat:stream:done` | — | 流式结束 |
| Main → Renderer | `chat:stream:error` | `string` | 错误信息 |

---

## Python AI Runtime 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/chat/stream` | SSE 流式对话（LangGraph astream_events） |
| GET | `/chat/{thread_id}/state` | 获取会话状态 |
| DELETE | `/chat/{thread_id}/state` | 清空会话历史 |

### 内置工具

| 工具 | 说明 |
|------|------|
| `get_current_time` | 返回当前 UTC 时间（ISO-8601） |
| `calculate` | 安全算术表达式求值 |
| `get_system_info` | 获取系统平台、CPU、内存信息 |

扩展工具：在 `ai_runtime/graph.py` 中用 `@tool` 装饰器添加函数，加入 `TOOLS` 列表即可。

---

## 可用脚本

### 根目录

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动 Electron 和 Python 服务 |
| `npm run dev:electron` | 仅启动 Electron |
| `npm run dev:ai` | 仅启动 Python FastAPI |

### electron-app

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建生产产物 |
| `npm run package` | 打包为平台安装包（AppImage / exe / dmg） |
| `npm run test` | 运行单元测试 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |

---

## 工程规范

- **代码风格**：ESLint + Prettier，提交前通过 husky + lint-staged 自动检查
- **提交规范**：Conventional Commits（支持 `ai`、`prompt`、`tool` AI 专属类型）
- **安全扫描**：gitleaks 防止 API Key 提交入库
- **CI/CD**：GitHub Actions — 代码质量、依赖安全审计、三平台（Linux/Windows/macOS）并行构建发布
- **测试覆盖率阈值**：Lines / Functions ≥ 60%，Branches ≥ 50%

详见 `electron-app/DOC/` 目录下的完整文档。

---

## License

MIT

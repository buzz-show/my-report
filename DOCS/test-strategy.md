# 测试方案总体纲领

本项目是一个 **Electron + React + Python FastAPI + LangGraph** 的桌面 AI 助手，三层进程通过 IPC Bridge 和 HTTP 协议协作。测试策略按**测试金字塔**分三层，各层职责清晰、互不重叠。

---

## 测试金字塔

```
          ┌─────────────────┐
          │   E2E Tests     │  Playwright  ← 少量、慢、验证用户行为
          │  (端到端测试)    │
          ├─────────────────┤
          │ Integration     │  Pytest      ← 中量、验证接口契约
          │  Tests (集成)   │  Vitest IPC
          ├─────────────────┤
          │  Unit Tests     │  Vitest      ← 大量、快、验证逻辑正确性
          │  (单元测试)      │  Pytest
          └─────────────────┘
```

---

## 各层职责

### 第一层：单元测试（Unit Tests）

**工具**：Electron 侧用 Vitest，Python 侧用 Pytest

**职责**：验证每个模块的**内部逻辑**，完全隔离外部依赖（全部 mock）。

| 子层          | 验证对象                                            | 代表示例                            |
| ------------- | --------------------------------------------------- | ----------------------------------- |
| Main Process  | IPC handler 路由、config 读写、auth client 请求构造 | `SETTINGS_GET` 是否调用了正确的函数 |
| Renderer      | Zustand store 状态变更、自定义 hook 逻辑            | `addMessage` 后 store 状态正确      |
| Python Domain | 业务规则、JWT encode/decode、密码 hash              | 过期 token 抛出正确异常             |

**原则**：不启动任何真实服务，运行必须在 100ms 内完成，任何外部 IO 必须 mock。

---

### 第二层：集成测试（Integration Tests）

**工具**：Vitest（IPC 层）、Pytest + TestClient（Python API 层）

**职责**：验证**模块之间的接口契约**，允许部分真实依赖（如 FastAPI 内存路由），不启动完整进程。

| 子层         | 验证对象                                         | 代表示例                                                             |
| ------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| IPC Handlers | handler 注册、事件响应链路                       | 发送 `CHAT_STREAM_START` → 触发 ReAct loop → 发出 `CHAT_STREAM_DONE` |
| Python API   | HTTP 接口契约（请求/响应格式、状态码、认证校验） | `POST /auth/login` → 返回 access + refresh token                     |

**原则**：测试边界是进程内的模块协作，不依赖 Electron 窗口或真实 Python 进程。

---

### 第三层：端到端测试（E2E Tests）

**工具**：Playwright + electron launcher

**职责**：以**真实用户视角**验证完整用户旅程，完整启动 Electron 进程 + Python 后端，不 mock 任何东西。

| 场景      | 验证内容                                                      |
| --------- | ------------------------------------------------------------- |
| 认证流程  | 登录页渲染 → 输入凭据 → 跳转主页 → 登出                       |
| 页面导航  | 5 个视图（Today/Upcoming/Summary/Slideshow/Projects）切换正确 |
| Chat 对话 | 发送消息 → 流式响应显示 → 工具调用气泡出现                    |
| 设置管理  | 打开 Settings → 修改配置 → 保存后持久化                       |

**原则**：只覆盖核心用户旅程（4–6 条），不追求 100% 路径覆盖，优先验证**关键路径不断**。

---

## 测试触发时机

```
代码修改
  │
  ├─► 保存时（可选 watch mode）
  │       Vitest watch → 只跑受影响的单元测试
  │
  ├─► git commit（pre-commit hook）
  │       lint-staged → ESLint + Prettier（已有）
  │       + Vitest 全量单元测试（新增）
  │
  └─► 手动执行（按需触发）
  │       cd electron-app && npm run test:e2e
  │       → 立即输出 HTML + JSON 报告，不依赖 git 操作
  │
  └─► git push（pre-push hook）
          gitleaks 扫描（已有）
          + Playwright E2E（新增）→ 输出 HTML + JSON 报告
```

---

## 测试输出

| 层          | 输出                                         | 位置                       |
| ----------- | -------------------------------------------- | -------------------------- |
| 单元测试    | 终端通过/失败 + LCOV 覆盖率报告              | `electron-app/coverage/`   |
| Python 集成 | 终端 pytest summary                          | 终端                       |
| E2E         | HTML 可视化报告（截图 + 录屏 + trace）+ JSON | `electron-app/e2e/report/` |

---

## 核心原则

1. **快慢分离**：单元测试须毫秒级，E2E 允许分钟级，不混在同一个触发时机
2. **不重复覆盖**：同一逻辑只在最低合适层测试，E2E 不测业务规则，单元测试不测 UI 渲染
3. **真实 vs Mock 的边界**：E2E 全真实；集成测试 mock 外部服务（OpenAI API）；单元测试 mock 一切 IO
4. **失败可诊断**：每次失败都有足够信息定位问题——单元测试有 stack trace，E2E 有截图 + 操作录屏

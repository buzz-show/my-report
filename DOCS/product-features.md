# 交个代（Justify Work）产品功能说明文档

> 版本：v2.0 · 更新日期：2026-05-07

---

## 一、产品概述

**交个代**是一款基于 Electron + React 构建的桌面端 AI 工作总结助手，以待办事项为起点，围绕任务执行过程沉淀工作事实，并通过 AI 自动生成日报、周报、月报和述职草稿。

产品不是纯任务清单工具，也不是纯聊天助手，而是将三类能力整合到同一工作流中：

1. 用任务系统承载用户每天的待办和执行状态。
2. 用任务更新和完成备注沉淀真实工作结果。
3. 用 AI 将这些事实整理为可编辑、可追溯的总结内容。

首发阶段聚焦个人用户，目标用户可以从“列待办”开始工作，在完成任务时低成本补充结果说明，并在下班、周末、月末或述职节点快速生成结构化总结。

AI 核心基于 **OpenAI GPT-4o 流式对话**，支持 **Tool Use / ReAct 循环**。助手既可以通过自然语言帮助用户拆分任务、补充进展、生成总结，也可以调用系统工具与后续扩展的数据查询能力，为周期汇总和述职草稿生成提供支持。

---

## 二、界面结构总览

应用延续三栏布局，但产品中心从“泛任务看板”收敛为“待办驱动的工作执行与 AI 汇总工作台”：

```
┌──────────────┬────────────────────────────────┬──────────────────┐
│   侧边导航   │      今日任务与汇总主区域       │   AI 助手面板    │
│   (256px)    │          (flex-1)               │    (360px)       │
└──────────────┴────────────────────────────────┴──────────────────┘
```

| 区域 | 职责 |
|------|------|
| 侧边导航 | 工作区切换、项目/标签筛选、总结入口、专注计时器、用户信息 |
| 主区域 | 今日任务列表、任务进展补充、完成备注、统计看板、日报/周报/月报入口 |
| AI 助手面板 | 流式对话、任务整理、总结生成、述职草稿辅助、工具调用展示 |

### 2.1 首页工作流

首页默认进入“今日任务”视图，用户以待办事项为起点开展一天工作。系统围绕以下顺序组织体验：

1. 创建和查看今日待办。
2. 按优先级、项目和状态管理任务。
3. 在推进或完成任务时补充一句结果说明。
4. 基于当日任务与结果说明生成 AI 日报草稿。

### 2.2 视图层级

为支持从日常执行到周期复盘的连续链路，产品在主导航中提供四类核心视图：

| 视图 | 核心用途 |
|------|----------|
| 今日任务 | 维护当天待办、更新进展、标记完成 |
| 即将到来 | 查看未来计划任务和待提前准备事项 |
| 汇总中心 | 生成和管理日报、周报、月报 |
| 述职工作台 | 按时间范围与大纲组织季度、半年度、年度述职草稿 |

### 2.3 角色分工

三栏布局中的职责分工保持清晰：

1. 左栏负责定位和筛选，帮助用户快速进入任务、总结或述职视图。
2. 中栏承载核心事实数据，包括待办、进展更新、完成备注和周期汇总结果。
3. 右栏提供 AI 辅助，不替代主流程，而是围绕任务创建、任务整理、总结生成和表达润色提供支持。

---

## 三、核心功能模块

### 3.1 今日任务工作台

#### 3.1.1 任务分区

任务列表按工作状态进行组织，以支撑用户从待办到总结的完整过程：

| 分区 | 说明 |
|------|------|
| **待开始** | 当日已创建但尚未启动的任务，用于明确当天工作范围 |
| **进行中** | 正在推进的任务，显示当前活跃数量 |
| **已完成** | 已完成并可进入总结的任务，支持展示完成备注 |
| **即将到来** | 明日及后续计划任务，支持提前查看和调整 |

#### 3.1.2 任务卡片

每张任务卡片除基础任务信息外，还需要承载后续 AI 总结所依赖的上下文：

- **标题**：任务名称，字重 Medium，16px
- **描述**：任务详情，灰色辅助文字
- **项目归属**：任务所属项目或工作主题
- **优先级徽章**：高 / 中 / 低优先级视觉区分
- **时间标签**：计划执行时间或截止时间
- **标签芯片**：深度工作 / 会议 / 规划 / 协作等自定义标签
- **预计时长**：可选填写（如“约 90 分钟”）
- **结果摘要**：任务推进或完成后补充的一句话结果说明

#### 3.1.3 任务状态切换

- 点击左侧状态按钮，可将任务切换为待开始、进行中或已完成。
- 标记完成后，系统弹出轻量结果补充入口，引导用户补一句“完成了什么”或“产出了什么”。
- 已完成任务进入**已完成**分区，呈现删除线与透明度降低样式，但保留结果说明供总结引用。
- 悬停任务卡片触发轻微上移动画（`translateY(-2px)`）。

#### 3.1.4 新建任务

侧边栏顶部保留“**新建任务**”按钮，支持快速创建今日待办。任务创建时建议至少录入以下字段：

- 任务标题
- 项目归属
- 优先级
- 计划日期
- 预期结果

#### 3.1.5 任务进展补充

任务除了状态切换，还需要支持用户在执行过程中追加简短更新，用于后续周报、月报和述职聚合。更新内容包括：

- 当前进展
- 结果说明
- 阻塞问题
- 下一步计划
- 相关链接或附件

---

### 3.2 数据统计与总结入口

位于任务列表上方的统计条用于展示当天执行情况，并作为 AI 总结的触发入口。

建议包含 4 张数据卡：

| 卡片 | 指标 | 示例值 |
|------|------|--------|
| 已完成任务 | 今日完成数 / 总数 | 3 / 7 |
| 关键产出 | 今日已补充结果说明的任务数 | 2 项 |
| 深度专注 | 今日累计专注时长 | 2小时 14分 |
| 今日总结 | 一键生成日报草稿入口 | 立即生成 |

卡片使用毛玻璃效果（`backdrop-filter: blur`），悬停时有轻微投影加深动画。

---

### 3.3 汇总中心

汇总中心负责基于任务完成情况和任务更新生成不同周期的工作总结。

#### 3.3.1 日报生成

日报基于当日任务、任务状态和结果说明生成，默认输出以下结构：

1. 今日完成。
2. 关键产出。
3. 未完成事项及原因。
4. 明日计划。

#### 3.3.2 周报与月报生成

周报和月报基于时间范围内的任务与任务更新聚合生成：

- **周报**：聚焦本周推进、关键成果、风险与下周计划。
- **月报**：聚焦阶段成果、项目推进、问题复盘和下月重点。

#### 3.3.3 草稿管理

每一份总结都应支持以下能力：

- AI 生成草稿
- 查看引用来源任务
- 用户手动编辑
- 重新生成不同语气版本
- 导出为文本或 Markdown

---

### 3.4 导航与工作区

#### 3.4.1 主导航项

| 导航项 | 图标 | 说明 |
|--------|------|------|
| 今日任务 | `today` | 当前激活视图，展示当日待办、完成情况与总结入口 |
| 即将到来 | `event_upcoming` | 未来 7 天计划任务与预备事项 |
| 汇总中心 | `summarize` | 管理日报、周报、月报的生成与回看 |
| 述职工作台 | `slideshow` | 按大纲组织季度、半年度、年度述职草稿 |
| 项目 | `folder_open` | 按项目维度查看任务与阶段进展 |

激活导航项使用浅玫红背景 + 加粗字重，并带渐变光晕，其余项悬停时向右滑入 3px。

#### 3.4.2 标签系统

用户可创建颜色标签对任务分类：

- 🔴 深度工作（玫红）
- 🔵 会议协作（青绿）
- 🟠 规划推进（琥珀）
- 🟣 风险问题（紫灰）

标签以色点 + 文字列在导航底部，点击后筛选对应任务与总结来源。

---

### 3.5 专注计时器

位于侧边栏底部的专注模式条：

- **模式**：番茄工作法（Pomodoro），默认 25 分钟
- **操作**：点击播放按钮启动倒计时
- **价值**：为任务执行过程补充专注时长数据，辅助后续总结
- **视觉**：渐变背景条（玫红 → 青绿），与整体调色板统一

---

### 3.6 AI 助手（代办官）

#### 3.6.1 概述

右侧 AI 面板展示与**代办官**的实时流式对话。助手基于 OpenAI GPT-4o，支持工具调用和上下文记忆，重点围绕任务整理、总结生成与述职草稿辅助展开。

#### 3.6.2 在线状态

面板顶部显示：
- 助手头像（樱花风格渐变）
- 绿色实心圆点 `●` + “在线 · 正在整理你的今日工作”

#### 3.6.3 快捷指令芯片

对话框上方提供 4 个快捷操作按钮：

| 芯片 | 触发行为 |
|------|---------|
| 总结今日 | 汇总当日任务完成情况、结果说明和重点进展 |
| 拆分待办 | 将自然语言目标整理为多个可执行任务 |
| 补充进展 | 将零散描述整理为任务更新内容 |
| 生成述职草稿 | 根据时间范围或大纲生成章节化草稿 |

#### 3.6.4 流式对话

- 消息以**打字机动画**逐字呈现（OpenAI streaming chunks）。
- AI 消息气泡：左下圆角为直角，其余三角为圆角（`border-radius: 18px 18px 18px 4px`）。
- 用户消息气泡：右下圆角为直角，玫红色背景白字。
- 输入等待时显示三点跳动动画（`.dot-1/.dot-2/.dot-3`，错开 220ms 延迟）。

#### 3.6.5 工具调用展示（ReAct 卡片）

当助手需要查询任务或汇总数据时，对话中会插入工具调用卡片，用于展示结构化结果。例如：

```
┌─────────────────────────────┐
│  今日任务汇总               │  ← 标题（玫红小标签）
├─────────────────────────────┤
│  已完成任务             3 项 │
│  已补充结果说明         2 项 │
│  进行中任务             2 项 │
├─────────────────────────────┤
│  日报草稿可信度       高      │
└─────────────────────────────┘
```

卡片背景使用玫红 → 青绿渐变，视觉上区别于普通文字气泡。

#### 3.6.6 消息输入框

- 多行 `textarea`，支持换行
- 左侧：附件按钮（`attach_file`）、语音按钮（`mic`）
- 右侧：**发送**按钮（玫红，带投影）
- 底部标注“代办官 · 由 GPT-4o 驱动”

---

### 3.7 述职工作台

述职工作台服务于季度、半年度和年度复盘场景，强调“按大纲召回事实”，而不是一次性自动生成整篇终稿。

#### 3.7.1 核心流程

1. 用户输入述职大纲或章节结构。
2. 用户选择时间范围。
3. 系统召回相关任务、进展更新和结果说明。
4. AI 按章节生成述职草稿。
5. 用户逐章编辑、确认并导出。

#### 3.7.2 召回内容

系统召回内容至少包括：

- 关键完成任务
- 结果说明与阶段产出
- 典型问题与解决过程
- 相关项目维度信息
- 可复用的成长与复盘素材

---

## 四、技术架构说明

### 4.1 三层进程模型

应用遵循 Electron 安全边界，分为三个运行层，同时围绕“任务事实沉淀 -> AI 汇总生成”的产品主链路组织能力：

```
主进程（Node.js）
  ├── index.ts           — BrowserWindow 创建、环境变量加载
  ├── ipc/chat.ts        — AI 对话、总结生成、述职辅助的 IPC 入口
  ├── ipc/settings.ts    — 设置读写
  ├── data/              — 任务、任务更新、总结、草稿的本地持久化层
  └── tools/             — 工具注册表（TOOL_REGISTRY）

Preload Script（contextBridge）
  └── index.ts           — 暴露任务、总结、聊天等受控 API 至渲染层

渲染进程（React + Chromium，无 Node 权限）
  ├── features/tasks/      — 今日任务、任务详情、进展补充
  ├── features/reports/    — 日报、周报、月报的生成与回看
  ├── features/chat/       — AI 辅助面板与流式对话
  └── features/review/     — 述职工作台与章节化草稿编辑
```

> API Key 存储于主进程环境变量，不暴露给 Chromium DevTools，保障密钥安全。

### 4.2 数据分层

为了支撑从日常待办到周期性总结的连续能力，系统需要至少维护四类核心数据：

| 数据对象 | 作用 |
|----------|------|
| `Task` | 承载待办事项本体，包括标题、项目、优先级、计划日期、状态等 |
| `TaskUpdate` | 承载任务推进记录、结果说明、阻塞问题和下一步计划 |
| `Summary` | 承载日报、周报、月报的 AI 草稿与确认结果 |
| `ReportDraft` | 承载季度、半年度、年度述职草稿及章节结构 |

其中 `Task` 和 `TaskUpdate` 是事实层，`Summary` 和 `ReportDraft` 是生成层。系统必须清晰区分原始任务事实与 AI 生成内容，确保总结可追溯、可修订。

### 4.3 IPC 通道

当前应用已具备流式对话相关 IPC 通道。面向后续产品演进，IPC 层建议扩展为两类能力：任务数据通道和 AI 生成通道。

| 通道名 | 方向 | 用途 |
|--------|------|------|
| `chat:stream:start` | 渲染 → 主 | 发起新的流式对话 |
| `chat:stream:chunk` | 主 → 渲染 | 推送文字片段（打字机效果） |
| `chat:stream:done` | 主 → 渲染 | 对话结束，解除流式锁定 |
| `chat:stream:error` | 主 → 渲染 | 推送错误信息 |
| `chat:stream:tool-call` | 主 → 渲染 | 通知工具调用开始（显示加载中） |
| `chat:stream:tool-result` | 主 → 渲染 | 填入工具执行结果 |

后续建议补充以下类型的通道：

| 通道类型 | 用途 |
|----------|------|
| 任务读写通道 | 创建任务、更新任务状态、追加任务进展、查询任务列表 |
| 总结生成通道 | 触发日报、周报、月报生成与保存 |
| 述职草稿通道 | 输入大纲、召回素材、保存章节草稿 |

所有监听器方法均返回 `unsubscribe()` 函数，由 `cleanupRef` 统一管理，防止内存泄漏。

### 4.4 AI 工作流与 ReAct 循环

AI 层不再只服务普通聊天，而是服务三个核心场景：

1. 将自然语言整理为待办任务。
2. 基于任务与更新生成日报、周报、月报。
3. 基于时间范围和大纲生成述职草稿。

底层仍采用 ReAct 循环，但上下文组织需要从“只处理聊天消息”扩展为“组织任务事实 + 生成目标 + 工具结果”：

```
用户发起 AI 请求
    ↓
加载任务上下文 / 时间范围 / 用户大纲
    ↓
runReActLoop(event, messages)            ← 主进程递归函数
    ├── [streaming] 逐 chunk 推送文字 → 打字机效果
    └── [tool_calls] 数据查询与聚合轮次
          ├── 推送 tool-call 事件 → 前端显示加载气泡
          ├── 执行 executeTool()  → 查询任务、聚合时间范围数据
          ├── 推送 tool-result   → 填入执行结果
          └── 追加上下文，递归调用 runReActLoop
                  ↓
              [finish_reason = 'stop']
                  ↓
              推送 chat:stream:done → 输出总结或草稿
```

### 4.5 工具层能力

当前内置工具主要覆盖基础系统能力：

| 工具名 | 说明 | 所需权限 |
|--------|------|---------|
| `get_current_time` | 获取当前系统时间 | Node.js `Date` |
| `calculate` | 执行数学计算表达式 | 沙箱求值 |
| `get_system_info` | 获取系统信息（OS、CPU、内存等） | Node.js `os` 模块 |

为了匹配产品目标，后续工具层应扩展出面向业务数据的能力：

| 工具方向 | 用途 |
|----------|------|
| 任务检索工具 | 按日期、项目、状态、标签查询任务与任务更新 |
| 汇总聚合工具 | 汇总某一时间范围内的完成情况、产出和阻塞 |
| 述职素材召回工具 | 按大纲章节召回高相关任务、结果说明和案例 |
| 导出工具 | 将总结或草稿导出为 Markdown、文本及后续模板格式 |

新增工具只需在 `src/main/tools/registry.ts` 的 `TOOL_REGISTRY` 对象中追加一条记录，无需修改任何其他文件（开闭原则）。

---

## 五、状态管理

### 5.1 状态分层原则

状态管理不应只围绕聊天消息展开，而应围绕产品的四类核心对象进行拆分：

1. 任务事实状态。
2. 周期总结状态。
3. 述职草稿状态。
4. AI 会话状态。

建议继续使用 Zustand，但按功能域拆分 Store，避免把任务、总结和聊天全部堆叠在同一个全局状态中。

### 5.2 任务状态（taskStore）

`taskStore` 负责承载用户的日常待办与执行轨迹，是整个产品的事实基础。

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `tasks` | `Task[]` | 当前加载的任务列表 |
| `selectedTaskId` | `string | null` | 当前选中的任务 |
| `activeDate` | `string` | 当前查看的日期 |
| `filters` | `TaskFilters` | 项目、状态、标签、优先级等筛选条件 |
| `isTaskLoading` | `boolean` | 任务列表加载状态 |
| `isSavingTask` | `boolean` | 任务创建或更新状态 |

| Action | 说明 |
|--------|------|
| `loadTasks()` | 按日期和筛选条件加载任务 |
| `createTask()` | 创建新任务 |
| `updateTask()` | 更新任务基础信息 |
| `updateTaskStatus()` | 更新任务状态 |
| `selectTask()` | 选中任务并展示详情 |
| `setFilters()` | 更新筛选条件 |

### 5.3 任务进展状态（taskUpdateStore）

`taskUpdateStore` 负责承载任务推进过程中的补充信息，包括结果说明、阻塞和下一步。这部分数据直接决定 AI 总结质量。

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `updatesByTaskId` | `Record<string, TaskUpdate[]>` | 按任务维度缓存的更新记录 |
| `draftUpdate` | `TaskUpdateDraft | null` | 当前正在编辑的任务更新草稿 |
| `isSavingUpdate` | `boolean` | 任务更新保存状态 |
| `lastAutoPromptTaskId` | `string | null` | 最近一次触发“补充结果说明”的任务 |

| Action | 说明 |
|--------|------|
| `loadTaskUpdates()` | 加载某个任务的历史更新 |
| `startUpdateDraft()` | 初始化一条任务更新草稿 |
| `updateDraftField()` | 更新草稿字段 |
| `saveTaskUpdate()` | 保存任务更新 |
| `clearDraft()` | 清空当前草稿 |

### 5.4 汇总状态（summaryStore）

`summaryStore` 负责管理日报、周报、月报的生成、编辑和回看。

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `summaries` | `Summary[]` | 已生成的总结列表 |
| `activeSummaryId` | `string | null` | 当前打开的总结 |
| `summaryQuery` | `SummaryQuery` | 当前时间范围与总结类型 |
| `draftContent` | `string` | 当前总结草稿内容 |
| `sourceTaskIds` | `string[]` | 当前总结引用的任务来源 |
| `isGeneratingSummary` | `boolean` | AI 生成总结状态 |
| `isSavingSummary` | `boolean` | 总结保存状态 |

| Action | 说明 |
|--------|------|
| `loadSummaries()` | 加载历史总结 |
| `generateSummary()` | 触发日报、周报、月报生成 |
| `setActiveSummary()` | 打开指定总结 |
| `editSummaryDraft()` | 编辑当前总结草稿 |
| `saveSummary()` | 保存确认后的总结 |
| `regenerateSummary()` | 重新生成不同风格版本 |

### 5.5 述职状态（reportDraftStore）

`reportDraftStore` 负责承载季度、半年度、年度述职场景下的大纲、召回结果和章节草稿。

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `reportDrafts` | `ReportDraft[]` | 历史述职草稿列表 |
| `activeReportId` | `string | null` | 当前打开的述职草稿 |
| `outlineInput` | `string` | 用户输入的大纲原文 |
| `timeRange` | `ReportTimeRange` | 当前述职草稿对应的时间范围 |
| `sectionDrafts` | `ReportSectionDraft[]` | 按章节生成的内容草稿 |
| `retrievedTaskIds` | `string[]` | 当前章节召回的任务来源 |
| `isGeneratingReport` | `boolean` | AI 生成述职草稿状态 |
| `isSavingReport` | `boolean` | 保存状态 |

| Action | 说明 |
|--------|------|
| `createReportDraft()` | 创建新的述职草稿 |
| `setOutlineInput()` | 更新大纲输入 |
| `setTimeRange()` | 更新时间范围 |
| `generateReportDraft()` | 按大纲生成章节草稿 |
| `editSectionDraft()` | 编辑单个章节内容 |
| `saveReportDraft()` | 保存述职草稿 |

### 5.6 AI 会话状态（chatStore）

`chatStore` 保留，但定位从唯一主状态降级为 AI 辅助状态，负责承载流式会话、工具调用和生成中的交互上下文。

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `messages` | `Message[]` | 完整对话历史 |
| `systemPrompt` | `string` | 系统提示词 |
| `activeIntent` | `ChatIntent | null` | 当前会话意图，如拆分待办、总结今日、生成述职草稿 |
| `isStreaming` | `boolean` | 流式输出状态 |
| `pendingToolCalls` | `ToolCall[]` | 当前会话中的工具调用记录 |

| Action | 说明 |
|--------|------|
| `addMessage()` | 追加 user / assistant 消息 |
| `updateLastAssistant()` | 追加流式文字片段 |
| `appendToolCallToLast()` | 向最后一条 assistant 消息挂载工具调用 |
| `updateToolCallResult()` | 通过 `id` 填入工具执行结果 |
| `setActiveIntent()` | 设置当前会话意图 |
| `clearChatSession()` | 清空当前辅助会话 |

### 5.7 类型定义

```typescript
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'deferred'
type SummaryType = 'daily' | 'weekly' | 'monthly'
type ReportType = 'quarterly' | 'semi_annual' | 'annual'
type ChatIntent = 'task_breakdown' | 'task_update' | 'daily_summary' | 'report_draft'

interface Task {
  id: string
  title: string
  description?: string
  project?: string
  priority: 'high' | 'medium' | 'low'
  status: TaskStatus
  plannedDate: string
  dueDate?: string
  tags: string[]
  expectedOutcome?: string
  resultSummary?: string
}

interface TaskUpdate {
  id: string
  taskId: string
  progressNote?: string
  resultNote?: string
  blockerNote?: string
  nextStep?: string
  attachmentLinks?: string[]
  createdAt: string
}

interface Summary {
  id: string
  summaryType: SummaryType
  startDate: string
  endDate: string
  title: string
  content: string
  sourceTaskIds: string[]
  sourceUpdateIds: string[]
  status: 'draft' | 'confirmed'
}

interface ReportSectionDraft {
  id: string
  title: string
  content: string
  sourceTaskIds: string[]
}

interface ReportDraft {
  id: string
  reportType: ReportType
  outline: string
  startDate: string
  endDate: string
  sections: ReportSectionDraft[]
  sourceTaskIds: string[]
}

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}
```

---

## 六、设计规范摘要

| 规范项 | 取值 |
|--------|------|
| 主色调（玫红） | `#c4737a` |
| 辅助色（青绿） | `#6d8f96` |
| 背景底色 | `#faf6f4`（暖白） |
| 字体 | Inter（300 / 400 / 500 / 600 / 700） |
| 主要圆角 | 14px（卡片）、20px（大面板）、9999px（徽章/按钮） |
| 毛玻璃效果 | `backdrop-filter: blur(24px) saturate(160%)` |
| 动画曲线 | `cubic-bezier(0.34, 1.56, 0.64, 1)`（弹性） |
| 优先色边框 | 高 `#c4737a` · 中 `#e8a87c` · 低 `#7faa96` |

---

## 七、安全设计说明

| 决策点 | 方案 | 理由 |
|--------|------|------|
| API Key 存储 | 主进程环境变量 | 渲染层 DevTools 无法读取 |
| 进程隔离 | `contextIsolation: true` | 防止原型链污染攻击 |
| 流式通信 | `ipcMain.on` + `event.sender.send` | `ipcMain.handle` 只能 resolve 一次，不适合流 |
| 工具执行位置 | 主进程 | 工具需要 `os`、`fs` 等 Node.js 权限，渲染层无法访问 |
| 监听器生命周期 | `cleanupRef` + unsubscribe | 防止 `ipcRenderer.on` 堆积造成内存泄漏 |

---


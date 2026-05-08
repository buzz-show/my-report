# 认证与会话模块设计文档

> 版本：v0.1
> 日期：2026-05-08
> 状态：规划稿

---

## 一、设计背景

当前项目已经具备以下基础：

1. Electron 端已形成 `renderer -> preload -> main` 的安全分层。
2. Python 端已具备 FastAPI 服务入口与 LangGraph AI Runtime。
3. 产品已经明确需要补齐用户、登录、会话、权限四项基础能力。

本次设计不引入独立 Go 认证服务，也不展开多租户，而是在现有 Python FastAPI 架构上完成一套可落地的单租户多用户认证方案。

---

## 二、设计目标

本阶段的目标如下：

1. 支持账号密码登录。
2. 支持当前用户查询。
3. 支持会话恢复与静默续期。
4. 支持基础角色权限控制。
5. 保证真实 token 不暴露给 renderer。
6. 不破坏现有 AI Runtime 的职责边界。

本阶段明确不包含以下内容：

1. 多租户。
2. 第三方 OAuth 登录。
3. 注册、找回密码、邮箱验证、短信验证码。
4. 复杂 RBAC 或组织级权限模型。

---

## 三、总体架构

推荐继续采用单后端方案：

1. Python FastAPI 统一承载认证能力与 AI 能力。
2. Electron main 负责本地安全存储、服务编排与 token 注入。
3. Electron renderer 只处理登录页、登录态 UI 和受保护页面。

整体调用链如下：

1. 用户在 renderer 输入账号密码。
2. renderer 通过 preload 调用 main 暴露的认证接口。
3. main 请求 Python `/auth/login`。
4. Python 返回 access token、refresh token 和当前用户视图。
5. main 将 token 加密保存到本地。
6. renderer 仅接收脱敏后的用户信息和登录状态。
7. 后续 main 调用 Python 受保护接口时自动附带 access token。

该方案的核心原则是：认证可信源在 Python 服务端和 Electron main，renderer 只反映状态，不持有认证秘密。

---

## 四、职责划分

### 4.1 Python FastAPI

Python 服务负责：

1. 用户认证。
2. token 签发与校验。
3. refresh token 管理与会话失效。
4. 当前用户查询。
5. 基础角色权限校验。
6. 现有 AI Runtime 与聊天接口。

### 4.2 Electron Main

Electron main 负责：

1. 调用 Python 认证接口。
2. 本地保存会话信息。
3. 应用启动时恢复会话。
4. access token 过期时尝试静默刷新。
5. 调用受保护 AI 接口时附带 token。
6. 统一处理 401、登出和本地状态清理。

### 4.3 Electron Renderer

Electron renderer 负责：

1. 登录表单与错误提示。
2. 登录态显示。
3. 登录成功后展示主工作台。
4. 会话失效后回到登录页。

renderer 不负责：

1. 保存真实 token。
2. 直接访问本地敏感存储。
3. 自行判断 token 是否可信。

---

## 五、后端模块设计

建议保留现有 [ai-runtime/ai_runtime/server.py](/home/buzz/.openclaw/workspace/my-report/ai-runtime/ai_runtime/server.py#L1) 作为 FastAPI 入口，但不要把认证逻辑直接堆进聊天路由。

推荐在 `ai-runtime/ai_runtime` 下新增认证模块，最小结构如下：

1. `auth/models.py`
   定义用户、角色、会话相关模型。
2. `auth/repository.py`
   负责数据库读写。
3. `auth/security.py`
   负责密码散列、token 生成、token 校验。
4. `auth/service.py`
   负责登录、登出、刷新、当前用户、权限校验。
5. `auth/routers.py`
   负责 `/auth/*` 路由。
6. `auth/dependencies.py`
   负责 `get_current_user`、`require_role` 等依赖。

现有 [ai-runtime/ai_runtime/graph.py](/home/buzz/.openclaw/workspace/my-report/ai-runtime/ai_runtime/graph.py#L1) 保持 AI orchestration 职责，只在需要时消费上层注入的用户上下文。

---

## 六、数据模型设计

本阶段按单租户多用户设计，建议最小数据模型包含以下几类。

### 6.1 users

建议字段：

- `id`
- `username`
- `email`
- `password_hash`
- `display_name`
- `status`
- `created_at`
- `updated_at`
- `last_login_at`

### 6.2 roles

建议字段：

- `id`
- `code`
- `name`

### 6.3 user_roles

建议字段：

- `user_id`
- `role_id`

### 6.4 sessions`或`refresh_tokens`

建议字段：

- `id`
- `user_id`
- `refresh_token_hash`
- `expires_at`
- `revoked_at`
- `device_name`
- `client_type`
- `created_at`
- `last_used_at`

开发阶段建议直接采用 SQLite，后续若需要远程部署或更高并发，再迁移到 PostgreSQL。

---

## 七、认证与会话策略

推荐采用双 token 方案：

1. access token
   短期有效，用于访问受保护接口。
2. refresh token
   长期有效，用于静默续期和会话恢复。

推荐策略如下：

1. access token 生命周期较短，例如 15 到 30 分钟。
2. refresh token 生命周期较长，例如 7 到 30 天。
3. refresh token 在服务端持久化，支持主动吊销。
4. logout 时服务端使 refresh token 失效，同时客户端清空本地 session。
5. Electron main 只保存必要会话信息与 refresh token，renderer 不接触真实 token。

这种方式兼顾安全性与用户体验，避免频繁登录，同时保留会话可控性。

---

## 八、接口设计

建议新增以下认证接口。

### 8.1 `POST /auth/login`

输入：

- `username` 或 `email`
- `password`

输出：

- `access_token`
- `refresh_token`
- `expires_at`
- `user`

### 8.2 `GET /auth/me`

输入：

- Bearer access token

输出：

- 当前用户信息
- 当前角色列表

### 8.3 `POST /auth/refresh`

输入：

- `refresh_token`

输出：

- 新的 `access_token`
- 可选新的 `refresh_token`
- 新的过期时间

### 8.4 `POST /auth/logout`

输入：

- 当前 refresh token 或 session 标识

输出：

- 成功结果

错误响应至少要区分：

1. 凭证错误。
2. 未认证。
3. 会话过期。
4. 权限不足。
5. 服务内部异常。

---

## 九、权限模型设计

当前阶段不建议直接做复杂权限系统，先采用简单 RBAC。

初始角色建议只保留两档：

1. `admin`
2. `member`

权限接入方式建议如下：

1. `get_current_user`
   校验 access token 并返回当前用户。
2. `require_role("admin")`
   限制管理员接口。

聊天和普通业务接口默认只要求已登录，管理接口再做角色限制。这样能在复杂度可控的前提下先把权限边界建立起来。

---

## 十、Electron 接入设计

### 10.1 Preload

在 [electron-app/src/preload/index.ts](/home/buzz/.openclaw/workspace/my-report/electron-app/src/preload/index.ts#L1) 中新增认证相关安全桥接口：

1. `login`
2. `logout`
3. `getCurrentSession`
4. `restoreSession`

### 10.2 Main IPC

在 [electron-app/src/main/ipc/index.ts](/home/buzz/.openclaw/workspace/my-report/electron-app/src/main/ipc/index.ts#L1) 中新增 auth handler 注册，并补充 `ipc/auth.ts`。

main 侧认证服务建议负责：

1. 登录。
2. 登出。
3. 当前 session 查询。
4. 启动恢复。
5. 静默刷新。
6. 处理 401 后的本地状态清理。

### 10.3 本地会话存储

建议继续复用 [electron-app/src/main/config/index.ts](/home/buzz/.openclaw/workspace/my-report/electron-app/src/main/config/index.ts) 的 `safeStorage` 模式持久化本地 session。

需要坚持两条约束：

1. renderer 不能直接读取真实 token。
2. 本地存储结构应与 settings 配置解耦，避免敏感信息混放。

---

## 十一、前端接入设计

建议在 `electron-app/src/renderer/src/features` 下新增 `auth/` 功能域，包含以下内容：

1. `AuthGate`
2. `LoginForm`
3. `authStore`
4. `useAuth`

应用入口 [electron-app/src/renderer/src/App.tsx](/home/buzz/.openclaw/workspace/my-report/electron-app/src/renderer/src/App.tsx#L1) 需要从直接渲染 `ResponsiveAppShell` 改为：

1. 启动时先恢复 session。
2. 未登录时显示登录页。
3. 登录成功后进入主工作台。

当前首页用户名为硬编码，位置在 [electron-app/src/renderer/src/features/home/data.ts](/home/buzz/.openclaw/workspace/my-report/electron-app/src/renderer/src/features/home/data.ts#L3)。该值后续需要改为从当前登录用户视图读取。

---

## 十二、AI Runtime 与认证的关系

Python FastAPI 继续有必要保留，因为它当前的核心职责仍然是 AI Runtime，而不是单纯的认证服务。

加入认证能力后，Python 后端同时承担两类职责：

1. 认证域：用户、登录、会话、权限。
2. AI 域：聊天、流式输出、LangGraph 工作流、工具调用。

这里的重点不是物理拆分服务，而是代码职责隔离。认证逻辑不应直接侵入 `graph.py`，而应通过 API 层或依赖注入把当前用户上下文传递给 AI 侧。

---

## 十三、启动恢复与异常流

建议的启动恢复流程如下：

1. Electron 启动。
2. main 读取本地 session。
3. 如果 access token 仍有效，则直接进入已登录态。
4. 如果 access token 已过期或即将过期，则调用 `/auth/refresh` 静默续期。
5. 刷新成功则更新本地 session。
6. 刷新失败则清空本地状态，并通知 renderer 回到登录页。

需要统一处理的异常流包括：

1. 登录失败。
2. refresh token 失效。
3. 服务端主动吊销会话。
4. 受保护接口返回 401。
5. UI 登录态与服务端会话状态不一致。

统一原则仍然是：认证可信源在服务端和 main，renderer 只负责展示状态。

---

## 十四、验证方案

建议至少验证以下场景：

1. 无本地 session 时启动，直接显示登录页。
2. 正确账号密码登录成功后进入工作台。
3. 错误密码时显示明确错误信息。
4. 重启应用后能恢复有效会话。
5. access token 过期时能自动静默刷新。
6. refresh token 失效时能退回登录页。
7. 未登录时无法访问受保护接口。
8. 普通用户无法调用管理员接口。
9. renderer 无法直接读取真实 token。
10. AI 接口在登录态下可正常访问。

---

## 十五、结论

对当前阶段，最合适的方案是：

1. Python FastAPI 统一承载认证和 AI。
2. Electron main 继续承担本地会话与安全边界。
3. renderer 只处理 UI 和登录状态。
4. 当前先做单租户多用户，不引入多租户和独立 Go 服务。

该方案实现成本低、改造路径短，也最符合当前项目已有技术基础。

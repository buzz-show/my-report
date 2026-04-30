# CI/CD 流水线说明

> 项目：electron-ai-demo（Electron + React + OpenAI）
> 更新日期：2026-04-28

---

## 整体架构

流水线分为**两道防线**：本地 Git Hooks（提交前拦截）和 GitHub Actions（远端自动化）。

```
开发者本地                              GitHub 远端
─────────────────────────────────────  ──────────────────────────────────────
git commit
  ├─ [pre-commit]  gitleaks + lint-staged
  └─ [commit-msg]  commitlint

git push ──────────────────────────→   CI workflow（push/PR 触发）
                                         secret-scan
                                           ├─ quality（代码质量）
                                           └─ audit（依赖安全）

git tag v* && git push --tags ──────→  Release workflow（tag 触发）
                                         pre-release-check
                                           └─ build matrix（三平台并行）
                                                └─ release（创建 GitHub Release）
```

---

## 一、本地 Git Hooks

### 工具链

| 工具        | 版本       | 作用                       |
| ----------- | ---------- | -------------------------- |
| husky       | ^9         | Git Hook 管理              |
| lint-staged | ^16        | 只对暂存文件执行检查       |
| commitlint  | ^20        | 提交消息格式校验           |
| gitleaks    | 需手动安装 | 密钥泄露本地扫描（软约束） |

### pre-commit hook（`.husky/pre-commit`）

执行顺序：

1. **gitleaks protect --staged**：扫描本次暂存的文件，检测是否包含 API Key 等密钥。仅在本地已安装 gitleaks 时执行，避免阻断未安装的开发者。
2. **lint-staged**：对暂存文件按类型执行：
   - `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
   - `*.{json,md,css,html}` → `prettier --write`

### commit-msg hook（`.husky/commit-msg`）

调用 commitlint，校验提交消息是否符合 Conventional Commits 规范。

### 提交消息规范（`commitlint.config.mjs`）

格式：`<type>(<scope>): <subject>`

**允许的 type：**

| type       | 说明                                         |
| ---------- | -------------------------------------------- |
| `feat`     | 新功能                                       |
| `fix`      | Bug 修复                                     |
| `docs`     | 文档变更                                     |
| `style`    | 格式调整（不影响逻辑）                       |
| `refactor` | 重构                                         |
| `test`     | 测试相关                                     |
| `chore`    | 构建/工具链/依赖变更                         |
| `perf`     | 性能优化                                     |
| `ci`       | CI 配置变更                                  |
| `revert`   | 回滚提交                                     |
| `prompt`   | ⭐ AI 项目：Prompt 内容变更                  |
| `tool`     | ⭐ AI 项目：Tool 定义或实现变更              |
| `ai`       | ⭐ AI 项目：AI 逻辑变更（模型调用、loop 等） |

**其他规则：**

- scope 如果填写，必须小写
- subject 不能为空，不能以句号结尾
- header 总长度不超过 100 字符

**示例：**

```
feat(chat): 支持多轮对话历史截断
fix(loop): 修复工具调用死循环问题
prompt(system): 优化 system message 减少幻觉
tool(calculate): 增加白名单安全校验
ai(client): 切换至 gpt-4o-mini
```

---

## 二、CI Workflow（`.github/workflows/ci.yml`）

### 触发条件

| 事件           | 范围                             |
| -------------- | -------------------------------- |
| `push`         | `main`、`dev` 分支               |
| `pull_request` | 目标为 `main` 的 PR              |
| `schedule`     | 每周一 UTC 02:00（自动安全扫描） |

### Job 依赖关系

```
secret-scan
    ├── quality（串行，依赖 secret-scan）
    └── audit  （串行，依赖 secret-scan）
```

`quality` 和 `audit` 在 `secret-scan` 通过后**并行运行**。

---

### Job 1：`secret-scan` — 密钥泄露扫描

**运行环境：** ubuntu-latest

| 步骤                       | 说明                           |
| -------------------------- | ------------------------------ |
| checkout（fetch-depth: 0） | 拉取完整 git 历史              |
| gitleaks-action@v2         | 扫描所有提交历史，检测密钥泄露 |

**自定义规则（`.gitleaks.toml`）：**

| 规则 ID                  | 检测目标                       |
| ------------------------ | ------------------------------ |
| `openai-api-key`         | `sk-` 前缀的 OpenAI Key        |
| `anthropic-api-key`      | `sk-ant-` 前缀的 Anthropic Key |
| `generic-api-key-in-env` | 硬编码的 `API_KEY=xxx` 赋值    |

**白名单（不触发告警）：**

- `sk-placeholder`（CI 构建占位符）
- `your_api_key`、`<your-*-key>`（示例文件）
- `*.test.ts`、`*.spec.ts`（测试文件中的 mock 数据）

---

### Job 2：`quality` — 代码质量

**运行环境：** ubuntu-latest，依赖 `secret-scan`

| 步骤                | 命令                       | 失败行为             |
| ------------------- | -------------------------- | -------------------- |
| ESLint              | `npm run lint`             | 阻断                 |
| Prettier check      | `npm run format:check`     | 阻断                 |
| TypeScript 类型检查 | `npx tsc --noEmit`         | 阻断                 |
| 单元测试 + 覆盖率   | `npm run test:coverage`    | 阻断                 |
| 上传覆盖率报告      | actions/upload-artifact@v4 | 始终执行，保留 14 天 |
| Commitlint（仅 PR） | commitlint --from...--to   | 阻断（PR 时）        |
| 构建验证            | `npm run build`            | 阻断                 |

**覆盖率阈值（`vitest.config.ts`）：**

| 指标      | 阈值  |
| --------- | ----- |
| Lines     | ≥ 60% |
| Functions | ≥ 60% |
| Branches  | ≥ 50% |

**构建时环境变量：**

- `OPENAI_API_KEY=sk-placeholder`：仅验证编译，不需要真实 Key

---

### Job 3：`audit` — 依赖安全扫描

**运行环境：** ubuntu-latest，依赖 `secret-scan`

| 步骤             | 命令                                      | 失败行为             |
| ---------------- | ----------------------------------------- | -------------------- |
| 生产依赖扫描     | `npm audit --omit=dev --audit-level=high` | high/critical → 阻断 |
| 全量扫描（报告） | `npm audit --audit-level=none \|\| true`  | 仅输出，不阻断       |

> **策略说明：** 生产依赖出现 high/critical 漏洞时直接阻断 CI；devDependencies 的漏洞仅报告不阻断，因为不影响最终用户。

---

## 三、单元测试（Vitest）

### 配置文件（`vitest.config.ts`）

- **环境：** jsdom（模拟浏览器，兼容 React 组件和主进程纯逻辑）
- **测试文件匹配：** `src/**/*.{test,spec}.{ts,tsx}`
- **覆盖率工具：** `@vitest/coverage-v8`

### 测试文件列表

| 文件                                                               | 测试对象       | 用例数 | 核心覆盖点                         |
| ------------------------------------------------------------------ | -------------- | ------ | ---------------------------------- |
| `src/main/tools/builtin/__tests__/calculate.test.ts`               | calculate tool | 10     | 正常求值、**注入攻击拦截**、边界值 |
| `src/main/tools/builtin/__tests__/time.test.ts`                    | time tool      | 4      | 返回类型、fake timer 验证          |
| `src/renderer/src/features/chat/store/__tests__/chatStore.test.ts` | useChatStore   | 7      | 消息增删、流式拼接、toolCall 更新  |

### 本地运行命令

```bash
npm test               # 单次运行所有测试
npm run test:watch     # 开发时监听模式
npm run test:coverage  # 生成覆盖率报告（输出到 coverage/）
```

---

## 四、Dependabot（`.github/dependabot.yml`）

**作用：** 自动检测依赖新版本，定期向 `dev` 分支提 PR。

**扫描计划：** 每周一 09:00（上海时区）

**依赖分组（减少 PR 噪音）：**

| 分组            | 包含的依赖                                                 |
| --------------- | ---------------------------------------------------------- |
| `ai-sdk`        | openai                                                     |
| `electron-core` | electron, electron-vite, electron-builder                  |
| `react`         | react, react-dom, @types/react\*                           |
| `toolchain`     | typescript, eslint*, prettier, vitest*, husky, lint-staged |

**忽略规则：**

- `electron` 的大版本升级（破坏性变更多，需手动评估）

**同时扫描：** GitHub Actions 版本自动更新

---

## 五、Release Workflow（`.github/workflows/release.yml`）

### 触发条件

推送 `v*` 格式的 tag：

```bash
git tag v1.0.0
git push --tags
```

### Job 依赖关系

```
pre-release-check（gitleaks 全历史扫描）
    └── build matrix（三平台并行，fail-fast: false）
            ├── ubuntu-latest  → dist/*.AppImage
            ├── windows-latest → dist/*.exe（NSIS 安装包）
            └── macos-latest   → dist/*.dmg
        └── release（汇总产物，创建 GitHub Release）
```

### 构建矩阵详情

| 平台    | Runner         | 产物格式       | 签名                             |
| ------- | -------------- | -------------- | -------------------------------- |
| Linux   | ubuntu-latest  | `.AppImage`    | 不签名                           |
| Windows | windows-latest | `.exe`（NSIS） | 可选（`WIN_CERTIFICATE` Secret） |
| macOS   | macos-latest   | `.dmg`         | 可选（`MAC_CERTIFICATE` Secret） |

> `fail-fast: false`：某平台构建失败不取消其他平台的构建。

### GitHub Release 自动化

- **版本号：** 从 tag 名提取（`v1.0.0` → `1.0.0`）
- **Release Notes：** 自动从 git log 提取 `feat`/`fix`/`perf`/`ai`/`prompt`/`tool` 类型提交
- **预发布标记：** tag 名包含 `-`（如 `v1.0.0-beta.1`）时自动标记为 prerelease

### 所需 GitHub Secrets（可选）

| Secret 名称                | 用途                           |
| -------------------------- | ------------------------------ |
| `MAC_CERTIFICATE`          | macOS 代码签名证书（Base64）   |
| `MAC_CERTIFICATE_PASSWORD` | 证书密码                       |
| `WIN_CERTIFICATE`          | Windows 代码签名证书（Base64） |
| `WIN_CERTIFICATE_PASSWORD` | 证书密码                       |

> 未配置签名 Secret 时，构建产物未签名但可正常运行（开发/测试用）。

---

## 六、配置文件索引

| 文件                            | 作用                            |
| ------------------------------- | ------------------------------- |
| `.github/workflows/ci.yml`      | CI 主流水线（push/PR/定时触发） |
| `.github/workflows/release.yml` | CD 发布流水线（tag 触发）       |
| `.github/dependabot.yml`        | 依赖自动更新配置                |
| `.gitleaks.toml`                | 密钥泄露扫描规则                |
| `.husky/pre-commit`             | 提交前：gitleaks + lint-staged  |
| `.husky/commit-msg`             | 提交前：commitlint              |
| `commitlint.config.mjs`         | 提交消息规范（含 AI 扩展类型）  |
| `vitest.config.ts`              | 单元测试 + 覆盖率配置           |

---

## 七、开发工作流速查

```bash
# 日常开发
git add .
git commit -m "feat(chat): 新增消息撤回功能"   # 自动触发 pre-commit + commit-msg
git push origin dev                             # 触发 CI

# 发版
git checkout main
git pull
git tag v1.2.0
git push --tags                                 # 触发 Release workflow
```

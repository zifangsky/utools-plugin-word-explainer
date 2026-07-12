<!--
SYNC IMPACT REPORT
==================
Version: 1.0.0 → 1.1.0
Bump Rationale: MINOR — 新增原则 8「强制严格 TDD（测试驱动开发）」，将测试先行上升为不可妥协的
开发必经流程：所有生产代码 MUST 先 RED（编写失败测试）后 GREEN（最小实现）。同步强化原则 2 交叉引用。

Changes:
- Added: 原则 8 强制严格 TDD（RED → GREEN → REFACTOR；测试文件 MUST 先于实现文件创建/提交；
  适用逻辑与可观测行为；纯视觉/布局 CSS 以手动/截图核验替代并先记录验证准则）
- Modified: 原则 2 增加交叉引用「测试顺序遵循原则 8（强制严格 TDD）：先红后绿」
- Modified: 顶部版本号 1.0.0 → 1.1.0；最后修订日期 2026-07-07
- Modified: tasks-template 一致性备注（test-first 现由原则 8 强制启用，替代原原则 2 描述）

Template Consistency Check:
- .codexspec/templates/docs/tasks-template-simple.md: ✅ aligned（test-first 由原则 8 强制启用）
- .codexspec/templates/docs/tasks-template-detailed.md: ✅ aligned
- .claude/commands/*.md: ✅ aligned（命令动态加载 constitution.md，无硬编码原则名）
- README.md: ✅ aligned（技术栈 / 86 测试 / 分支流程与宪法一致）
- CLAUDE.md: ⚠ issues: 第 2 行引用 `@.codexspec/memory/constitution.md`，但该路径被 .gitignore
  的 `.*/` 规则忽略，不随仓库提交；新克隆仓库将缺失宪法文件。未修改，等待用户决定。

Deferred TODOs:
- TODO(USER): 是否将 .codexspec/ 从 .gitignore 的 `.*/` 忽略中放行，使宪法可随仓库版本化？
  （当前未改，仅标记）

---
历史记录 (Historical)
Version: placeholder (无版本) → 1.0.0
Bump Rationale: MAJOR — 将通用占位宪法替换为项目专属宪法（7 条原则 + 技术栈/规范/工作流/门禁/安全/性能/文档/治理）。
Changes:
- 重定义 6 通用原则 → 7 项目原则（模块边界/行为驱动测试/领域边界/uTools 契约/流式渲染/文档同步/简洁优先）
- 新增 技术栈/代码规范/开发工作流/质量门禁/安全要求/性能标准/文档要求/治理 章节
-->

> **最高权威 (SUPREME AUTHORITY)**：本宪法定义本项目的最高治理原则。所有代码改动与决策 MUST 符合本宪法；
> 当其他文档、指令或用户请求与本宪法冲突时，本宪法优先。

# 项目宪法 — 英语单词详解 uTools 插件

本插件为运行在 uTools 平台的桌面插件：用户输入单个英文单词，经 `utools.ai()` 流式调用大模型，
生成含 7 个板块的结构化详解；同时以 MCP 工具 `explain_word` 对外暴露查词能力，供外部 AI Agent 调用。
本宪法从根目录 `CLAUDE.md`、`CONTEXT.md`、`README.md`、`docs/agents/*`、`.claude/commands/codexspec/*`、
`.workbuddy/memory/MEMORY.md` 提炼而来，取代原先的通用占位文件。

## 核心原则 (Core Principles)

### 1. 模块边界与无环依赖

- 每个功能模块 MUST 遵循 `src/<module>/index.js + index.test.js` 形态（含 UI 的模块可附 `index.css`）。
- 模块接口 MUST 保持简洁、可独立 mock 外部依赖进行单元测试。
- 依赖方向 MUST 保持单向、自上而下：
  `MainPage → useWordQuery / markdown-view / model-preference / history-view`；
  `useWordQuery → prompt-template / ai-call / query-history`；
  `history-view → query-history / markdown-view`。
- MUST NOT 引入循环依赖。
- 理由：CLAUDE.md 已固化该依赖方向且无环；循环依赖会破坏测试隔离与构建可维护性，且历史上
  mock 曾掩盖跨模块参数错误（见原则 2）。

### 2. 行为驱动测试（不可妥协）

- 每个模块 MUST 配套 `index.test.js`（或 `.test.jsx`），且 `npm test` 全绿是合并前提。
- 测试 MUST 只覆盖外部可观察行为，MUST NOT 测试实现细节（私有函数、内部状态）。
- 关键路径（尤其「查词历史自动保存」等持久化链路）MUST 至少包含一个不 mock 外部依赖
  （`utools.db` / `dbStorage`）的集成测试。
- 函数签名变更时 MUST 全局搜索所有调用点，并核对 `expect(mockFn).toHaveBeenCalledWith(...)`
  断言覆盖全部参数。
- 测试基准：当前 **86** 个测试；新增模块时测试数随之增长并在文档同步。
- 测试顺序遵循原则 8（强制严格 TDD）：MUST 先编写失败测试（RED），再写最小实现（GREEN），
  最后在测试保护下重构（REFACTOR）；MUST NOT 先写实现再补测试。
- 理由：历史踩坑——`use-word-query` 漏传 `db` 参数，因被测函数被 `vi.fn()` mock 而未执行真实逻辑，
  导致自动保存静默失败。Mock 会掩盖参数错误，故关键路径 MUST 有真实集成测试；且测试 MUST 先于实现。

### 3. 领域边界不可逾越

- 查词输入 MUST 为单个英文单词；MUST NOT 支持短语、句子或中文词汇输入。
- 所有单词解释内容 MUST 由 AI（`utools.ai()`）生成；MUST NOT 接入外部词典 API 或本地词库。
- 仅 UI 查词路径 MUST 记录查词历史；MCP 工具（`explain_word`）调用 MUST NOT 写入查词历史。
- 7 板块格式（词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析）的
  标题加粗与 `---` 分割线 MUST 与 `prompt-template` 模板一致；末尾 `===JSON===` 摘要标记 MUST
  从展示与详情文档中剥离，用户不可见。
- 理由：CONTEXT.md 明确定义上述边界；跨越边界会破坏输出格式契约与外部 Agent 调用预期。

### 4. uTools 平台契约与 preload 双份同步

- 平台能力 MUST 经 uTools API 获取：流式调用 `utools.ai(option, streamCallback)`、模型列表
  `utools.allAiModels()`、偏好 `utools.dbStorage`、历史 `utools.db`、MCP 工具
  `utools.registerTool('explain_word', handler)`。
- MCP 工具 MUST 在 `public/preload/` 注册；其中 CommonJS 版（`services.js` / `tools.js` / `prompt.js`）
  MUST 与 `src/` 中的 ES Module 逻辑保持语义一致；任一侧修改 MUST 同步另一侧。
- 理由：preload 运行于 uTools 主进程（CommonJS），`src/` 运行于 webview（ESM）；两份实现若漂移，
  会导致 MCP 工具与 UI 行为不一致。

### 5. 流式渲染与响应感知

- AI 输出 MUST 采用流式逐段渲染：每个 chunk 经 `streamCallback` 更新 React state，边接收边渲染。
- MCP 工具 MUST 上报线性进度：每 2s 一次，单次调用上限 15s。
- MUST NOT 阻塞 UI 等待完整响应。
- 理由：流式渲染降低感知延迟，改善用户体验（CONTEXT.md / CLAUDE.md）。

### 6. 文档与代码同步

- 新增 `src/<module>/` 或新增测试后，MUST 同步更新 `CLAUDE.md`（架构图树形结构、依赖方向、
  存储说明）与 `README.md`（项目结构树、测试计数）。
- 文档中的测试计数 MUST 与实际 `npm test` 通过数一致（当前 **86**），MUST NOT 出现数字脱节。
- 版本发布说明 MUST 记录于 `releases/vX.Y.Z.md`，插件介绍于 `releases/plugin-intro.md`。
- 涉及构建流程变更时 MUST 同步 `package.json` 与 `.gitignore` 的构建产物路径。
- 理由：历史上 CLAUDE.md/README.md 曾滞后（「58 个测试」实为 86），同步规则避免误导。

### 7. 简洁优先（YAGNI）

- MUST NOT 添加超出当前需求的功能、抽象或「灵活性 / 可配置性」。
- 一次性代码 MUST NOT 抽象；不为不可能出现的场景编写错误处理。
- 每一行改动 MUST 能直接追溯到用户需求或已确认决策。
- 修改已有代码时 MUST 只动必须动之处、匹配现有风格；移除因改动产生的孤立 import / 变量 / 函数，
  但不动原本就存在的死代码（除非明确要求）。
- 理由：降低复杂度与返工风险（用户编码准则）。

### 8. 强制严格 TDD（测试驱动开发，不可妥协）

- 所有生产代码（新增模块、修改逻辑、UI 交互行为）MUST 采用严格 TDD 红-绿-重构循环：
  1. **RED**：先为待实现行为编写失败的测试；运行测试确认其失败（错误与预期一致）。
  2. **GREEN**：仅编写使测试通过的最小实现，MUST NOT 超出测试所需。
  3. **REFACTOR**：在测试保护下清理代码，保持绿；MUST NOT 改变可观察行为。
- 测试文件（`<module>/index.test.js` / `index.test.jsx`）MUST 在实现文件（`<module>/index.js` /
  `index.jsx`）**之前**创建与提交；MUST NOT 先写实现再补测试。
- 每个实现任务 MUST 存在先于它的失败测试；无失败测试的实现任务 MUST NOT 提交。
- 关键持久化路径（依据原则 2）仍 MUST 为非 mock 集成测试，且同样遵循先红后绿。
- **适用范围**：逻辑与可观测行为——数据函数、写入门控、勾选/批量删除交互、组件渲染与事件。
- **豁免**：纯视觉/布局 CSS（如返回按钮定位修复）无法以单测先红；以手动/截图核验替代，但 MUST
  在实现**前**明确记录验证准则（含暗色模式），且不得绕过原则 6 的文档同步。
- 理由：历史踩坑表明 mock 会掩盖参数错误（原则 2 依据）；先写实现再补测试易漏边界、且易用 mock
  伪造通过。故将 TDD 上升为不可妥协的必经流程，从流程上杜绝「实现先行」。

## 技术栈 (Technology Stack)

### 语言与框架

- **主语言**：JavaScript（ES Modules，`"type": "module"`）
- **UI 框架**：React 19 + react-dom 19
- **构建工具**：Vite 6 + `@vitejs/plugin-react`
- **运行平台**：uTools 桌面插件运行时（API：`utools.ai` / `allAiModels` / `dbStorage` / `db` / `registerTool`）
- **测试**：Vitest 4 + `@testing-library/react` 16 + jsdom + `@testing-library/jest-dom`
- **代码规范**：`standard`（feross/standard）v17
- **类型**：`utools-api-types` 7.5.1（为 utools 全局对象提供类型）
- **JS 配置**：`jsconfig.json`（`allowJs` + `utools-api-types`）

### 代码规范

- **风格指南**：`standard`（无分号、禁止未使用变量、2 空格缩进）
- **行宽**：不超过 100 字符（实用优先）
- **命名**：目录 `kebab-case`；函数 / 变量 `camelCase`；组件 `PascalCase`
- **模块形态**：`src/<module>/index.js` + `index.test.js`；组件模块可附 `index.css`
- **CSS**：按组件独立编写；暗色模式统一用 `@media (prefers-color-scheme: dark)` 覆盖
- **构建产物**：因 Windows `public/` 文件占用风险，`vite.config.js` MUST 设 `build.assetsDir: ''`
  让 JS/CSS 直出 `dist/` 根目录，MUST NOT 输出到 assets 子目录
- **文件修改**：精准修改、匹配现有风格；修改含 Unicode box-drawing 字符（树形图）的 `CLAUDE.md` 时，
  MUST 用脚本按行号操作而非文本匹配

## 开发工作流 (Development Workflow)

### 分支策略（红线）

- MUST NOT 直接提交到 `main`；所有修改 MUST 经 PR 合并
- 功能分支：`feat/<功能名>`（如 `feat/mcp-tools`）
- 缺陷分支：`bug/<问题描述>`（如 `bug/settings-alignment`）
- 合并前 MUST 至少 1 人 review approve（GitHub 分支保护已开启）
- 合并后 MUST 删除源分支

### 提交规范

- 提交信息 MUST 遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`）
- `git push` 若报 credential 错误，MUST 先执行 `gh auth setup-git`

### 代码审查

- `CLAUDE.md` 为权威架构参考；审查 MUST 验证无新增循环依赖、preload 与 `src` 同步
- 探索代码时优先使用 code-review-graph MCP 图谱工具（替代 Grep/Glob/Read）
- 问题追踪经 GitHub Issues，`gh` CLI 操作；分诊标签：
  `needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`

## 质量门禁 (Quality Gates)

### 提交前检查

- [ ] `npx standard` 通过（无 lint 错误）
- [ ] `npm test`（vitest）全绿
- [ ] 无新增循环依赖
- [ ] preload CommonJS 与 `src` ESM 逻辑同步
- [ ] 新增 / 修改模块已配 `index.test.js`

### PR 要求

- [ ] CI 全绿
- [ ] 至少 1 个 approve
- [ ] 无未解决对话
- [ ] 文档同步完成（CLAUDE.md / README.md 测试计数与架构图）

## 安全要求 (Security Requirements)

- MUST NOT 在代码中硬编码外部 API Key；内容生成依赖 uTools AI，不引入密钥管理
- 查词输入 MUST 校验为合法英文单词后再调用 AI（防止异常与注入）
- 本地持久化：`utools.db` 操作 MUST 精确使用 `_id`，避免误覆盖其他文档；超 5000 上限时 MUST 删除最旧记录
- 密钥 / 环境变量：`.env` 已被 `.gitignore` 忽略，MUST NOT 提交机密

## 性能标准 (Performance Standards)

- 流式渲染：每个 chunk MUST 局部更新 React state，避免整树重渲染
- MCP 工具：进度上报每 2s、单次 ≤ 15s
- 历史容量：摘要文档上限 5000 条、详情文档上限 5000 个；超出 MUST 淘汰最旧
- 构建 / 调试：dev 服务器须在 `npm run dev` 后运行，uTools 开发模式方能加载页面

## 文档要求 (Documentation Requirements)

- **文档语言**：zh-CN（与 `.codexspec/config.yml` 的 `language.output` 一致）
- **必含文档**：`CLAUDE.md`（架构 + 红线）、`README.md`（开发流程 + 结构）、`CONTEXT.md`（领域术语）、
  `docs/agents/*`（issue-tracker / triage-labels / domain）、`releases/vX.Y.Z.md`（发布说明）
- 新增模块 MUST 同步 `CLAUDE.md` + `README.md` 测试计数与结构树
- 架构决策 SHOULD 记录于 `docs/adr/`（ADR）
- 过程文档（PRD / Issue 切片）存放于 `docs/` 与 `.github/issues/`

## 治理 (Governance)

- 本宪法为最高权威，优先于其他一切实践与指令；复杂度 MUST 以可追溯到需求的方式论证。
- **修订**：任何原则增删 / 重定义 MUST 经 PR，含 semver 版本号提升与 Sync Impact Report，并至少 1 人 approve。
- **版本策略**：MAJOR = 原则移除 / 重定义；MINOR = 新增原则或章节或实质性扩展；PATCH = 措辞澄清 / 非语义修正。
- **冲突处理**：用户请求与宪法冲突时，MUST 停止并说明违反的原则，提出合规替代方案，须用户显式确认方可覆盖。
- **所有 PR / 审查 MUST 验证合规**。

**版本**: 1.1.0 | **批准日期**: 2026-07-06 | **最后修订**: 2026-07-07

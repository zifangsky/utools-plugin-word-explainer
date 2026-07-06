# Tasks: history-settings-and-batch-ops

<!--
Language: zh-CN (per .codexspec/config.yml language.output)
TDD Mode: 强制严格 TDD（宪法原则 8）— 每个模块 MUST 先 RED（失败测试）后 GREEN（最小实现）。
-->

**Input**: `.codexspec/specs/2026-0706-2348ab/history-settings-and-batch-ops/{plan.md, spec.md, requirements.md}`
**Prerequisites**: plan.md ✅ / spec.md ✅ / requirements.md ✅
**TDD 约束（宪法原则 8）**: 强制严格 TDD。每个模块按 RED → GREEN → REFACTOR 执行：
1. **RED**：先编写该模块/行为的失败测试，运行 `npm test`（或 `npx vitest run <file>`）确认其失败（错误与预期一致）。
2. **GREEN**：仅编写使测试通过的最小实现，运行确认测试变绿。
3. **REFACTOR**：在测试保护下清理，保持绿。
测试文件 MUST 先于实现文件提交；同模块 test/impl 任务取消 `[P]`（强制顺序）。纯视觉 CSS（Phase 4）依原则 8 豁免单测先红，改为「先记录验证准则 → 再实现 → 手动/截图核验」。
**Organization**: 按 plan.md 的 Implementation Phases 分组，并用 `US1`–`US4` 标记所属用户故事；每个模块内测试（RED）编号在前、实现（GREEN）在后。

---

## TDD 执行约束（全局）

- 每个实现任务（GREEN）MUST 有先于它的失败测试任务（RED）；无对应 RED 的实现任务 MUST NOT 执行。
- 关键持久化路径（`deleteQueryRecords`、写入门控）的 RED 测试 MUST 为非 mock 集成测试（真实 db double / 真实 dbStorage fake），禁止用 `vi.fn()` mock 掩盖参数错误（宪法原则 2）。
- 每完成一个 GREEN，MUST 立即运行对应测试确认通过，再进入下一模块。
- `[P]` 标记仅保留给真正无依赖、可并行的独立任务（如 Phase 5 的 lint/文档）；同模块 test→impl 取消 `[P]`。

---

## Phase 1: 数据层与偏好层（US1 + US2 基础）

**Goal**: 提供 `saveQueryHistory` 偏好读写与 `deleteQueryRecords` 批量删除数据函数。

### T001 [US1] RED — history-preference 失败测试

- 新增 `src/history-preference/index.test.js`（沿用 `src/model-preference/index.test.js` 范式）：
  - `getSaveQueryHistory()` 读 `null` 缺省返回 `true`；
  - `setSaveQueryHistory(false)` 后 `getSaveQueryHistory()` 返回 `false`；
  - `setSaveQueryHistory(true)` 后返回 `true`。
- **运行** `npx vitest run src/history-preference` → **确认失败**（模块尚不存在）——RED 完成。

**Covers**: REQ-001（缺省 true）; CON-001; Plan: Phase 1 偏好层

### T002 [US1] GREEN — 实现 history-preference

- 新增 `src/history-preference/index.js`：`getSaveQueryHistory()`（读 `utools.dbStorage.getItem('saveQueryHistory')`，`null/undefined` 视为 `true`）、`setSaveQueryHistory(bool)`（写 `dbStorage`）。
- **运行** `npx vitest run src/history-preference` → **确认 T001 通过**——GREEN 完成。

**Covers**: REQ-001; CON-001; Plan: Phase 1 偏好层

### T003 [US2] RED — deleteQueryRecords 非 mock 集成测试

- 在 `src/query-history/index.test.js` 新增 `deleteQueryRecords` **集成测试**（非 mock）：用真实内存版 db double（实现 `get/put/remove` 真实语义）验证——删除后 `db.get(detailId)` 为 `null`、旧 `history_summary.records` 不再含该条、缺失详情文档被跳过且其余正常删除。
- **运行** `npx vitest run src/query-history` → **确认该用例失败**（函数尚不存在）——RED 完成。

**Covers**: REQ-007; Plan: Phase 1 删除函数

### T004 [US2] GREEN — 实现 deleteQueryRecords

- 在 `src/query-history/index.js` 新增 `deleteQueryRecords(db, detailDocIds)`：读 `history_summary` → 逐条 `db.get(detailDocId)`，命中则 `db.remove(doc)` 并从 `records` 过滤、缺失项跳过 → `db.put(summary)` 写回。不改变既有 `saveQueryRecord`/`getHistoryRecords` 逻辑。
- **运行** `npx vitest run src/query-history` → **确认 T003 通过**——GREEN 完成。

**Covers**: REQ-007; Plan: Phase 1 删除函数
**Checkpoint**: 偏好层与删除数据函数可用，且 `deleteQueryRecords` 有非 mock 集成测试覆盖（原则 2 + 原则 8）。

---

## Phase 2: 写入门控与设置开关（US1）

**Goal**: 关闭开关后停止写入新历史；设置页提供默认开启的 toggle 开关。

### T005 [US1] RED — use-word-query 门控失败测试

- 在 `src/use-word-query/index.test.js` 新增测试：dbStorage 置 `saveQueryHistory=false` 时，查询完成后 `saveQueryRecord` 不被调用（dbStorage 用真实 fake，`saveQueryRecord` 可 mock）；置 `true` 时正常调用。
- **运行** `npx vitest run src/use-word-query` → **确认失败**——RED 完成。

**Covers**: REQ-002; CON-001; Plan: Phase 2 门控

### T006 [US1] GREEN — 实现 use-word-query 门控

- 修改 `src/use-word-query/index.js`：查询完成后先 `if (getSaveQueryHistory())` 才调用 `saveQueryRecord(...)`；从 `history-preference` 导入 `getSaveQueryHistory`。
- **运行** `npx vitest run src/use-word-query` → **确认 T005 通过**——GREEN 完成。

**Covers**: REQ-002; CON-001; Plan: Phase 2 门控

### T007 [US1] RED — MainPage 开关渲染失败测试

- 在 `src/MainPage/index.test.jsx` 新增测试：设置视图渲染出「保存查词历史记录」toggle 且初始为开启态。
- **运行** `npx vitest run src/MainPage` → **确认失败**（toggle 元素尚未存在）——RED 完成。

**Covers**: REQ-001; NFR-001; Plan: Phase 2 设置开关

### T008 [US1] GREEN — 实现 MainPage 设置开关

- 修改 `src/MainPage/index.jsx` 设置视图（VIEW_SETTINGS 分支）：新增「保存查词历史记录」标签 + 纯 CSS toggle 开关（`<input type="checkbox">` + `<span class="slider">`），初始化读 `getSaveQueryHistory()`，变更调 `setSaveQueryHistory()`。
- **运行** `npx vitest run src/MainPage` → **确认 T007 通过**——GREEN 完成。

**Covers**: REQ-001; NFR-001; Plan: Phase 2 设置开关

### T009 [US1] style — MainPage 开关样式（配套 T008）

- 在 `src/MainPage/index.css` 新增 `.save-history-switch` 等样式（复用现有边框 / 主色 `#1677ff` token）+ 暗色 `@media (prefers-color-scheme: dark)` 覆盖。样式非逻辑，TDD 不适用，但 MUST 在 T008 之后确认视觉无回归。

**Covers**: NFR-001; Plan: Phase 2 设置开关
**Checkpoint**: 设置开关默认开启；关闭后任一次查词均不向 `utools.db` 新增 `detail/*` 或 `history_summary` 记录。

---

## Phase 3: 历史页勾选与批量操作（US2 + US3）

**Goal**: 卡片可勾选；左下角操作栏含全选框 / 删除按钮（≥1 可用）/ 灰色 disabled 练习按钮；删除带二次确认并同步索引。

### T010 [US2] RED — history-view 交互失败测试

- 在 `src/history-view/index.test.jsx` 扩充测试：
  - 渲染含记录的列表 → 勾选某卡片复选框使「删除」按钮由 `disabled` 变 `enabled`；
  - 点击操作栏最左「全选」复选框 → 当前列表全部卡片选中；再点击 → 全部取消；
  - 点击「删除」→ `window.confirm` mock 弹出「确定删除 N 条记录吗？」；确认后 `deleteQueryRecords` 以正确 ids 被调用且列表刷新；取消则无调用；
  - 「练习」按钮渲染为 `disabled` 且无 `onClick` 副作用。
- **运行** `npx vitest run src/history-view` → **确认失败**（勾选/操作栏尚未实现）——RED 完成。

**Covers**: REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008; CON-002; NFR-001; Plan: Phase 3

### T011 [US2] GREEN — 实现 history-view 勾选与批量操作

- 修改 `src/history-view/index.jsx`：
  - 引入 `selectedIds`（`useState(new Set())`，内存态不持久化）；
  - 卡片左侧渲染复选框（REQ-003），勾选态与卡片点击查看详情相互独立；
  - 在左栏 `.history-left` 内、`.history-card-list` 之下新增 `flex-shrink:0` 底部操作栏（REQ-004）：最左全选复选框（Decision 5 派生 `allSelected = records.length>0 && records.every(r => selectedIds.has(r.detailDocId))`）、删除按钮（≥1 可用，REQ-006）、灰色 disabled 练习按钮（REQ-008）；
  - 删除按钮 `onClick`：`window.confirm('确定删除 N 条记录吗？')` → 确认后 `deleteQueryRecords(db, [...selectedIds])` → 重新 `getHistoryRecords` 刷新 → 清空 `selectedIds`。
- **运行** `npx vitest run src/history-view` → **确认 T010 通过**——GREEN 完成。

**Covers**: REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008; CON-002; Plan: Phase 3

### T012 [US2] style — history-view 操作栏样式（配套 T011）

- 在 `src/history-view/index.css` 新增 `.history-op-bar` / `.history-select-all` / `.history-del-btn` / `.history-practice-btn`（灰色 disabled，`cursor: not-allowed`）样式 + 暗色覆盖。

**Covers**: NFR-001; Plan: Phase 3
**Checkpoint**: 历史页可勾选、全选、批量删除（带确认）并同步索引；练习按钮仅占位、无副作用。

---

## Phase 4: 返回按钮布局修复（US4）

**Goal**: 设置 / 历史视图 header 返回按钮与下方内容不再重叠；主视图（VIEW_MAIN）布局不变。

> 依宪法原则 8 豁免：纯视觉 CSS 无法以单测先红。本 Phase 改为「先记录验证准则（T013）→ 再实现（T014）→ 手动/截图核验」。

### T013 [US4] verify — 返回按钮验证准则（先于实现记录）

- 明确验证准则（实现前记录）：`npm run dev` 起 Vite → uTools 开发模式加载 → 进入设置页与历史页，确认 `.back-btn` 与下方搜索 / 内容区无重叠（含暗色模式）；主视图 header 无视觉回归。纯 CSS 布局修复，无单测先红条件。

**Covers**: REQ-009; CON-003; Plan: Phase 4

### T014 [US4] impl — 实现返回按钮布局修复

- 修改 `src/MainPage/index.css`：`.main-header` 增加 `min-height: 32px`（Decision 4）；确认既有暗色 `.back-btn` 覆盖无误。
- 对照 T013 准则手动 / 截图核验通过。

**Covers**: REQ-009; CON-003; Plan: Phase 4
**Checkpoint**: 设置 / 历史视图返回按钮与下方内容清晰分隔，主视图布局不变。

---

## Phase 5: 质量门禁与文档同步（跨领域）

**Goal**: 通过质量门禁并同步文档，符合宪法原则 6（文档与代码同步）。

### T015 [P] 质量门禁

- 运行 `npx standard` 通过（无 lint 错误）；`npm test` 全绿（含 Phase 1–3 全部 RED→GREEN 测试）。

### T016 同步 CLAUDE.md

- 架构图树形结构（新增 `history-preference/`）、依赖方向、存储说明（`saveQueryHistory` 键）。修改含 Unicode 树形图时按行号脚本操作（宪法代码规范要求），不用文本匹配。

### T017 同步 README.md

- 项目结构树（新增 `history-preference/`）、测试计数（当前基准 86，新增后以实际 `npm test` 通过数为准，MUST NOT 脱节）。

### T018 分支 / PR

- 在分支 `feat/history-settings-batch-ops` 提交（Conventional Commits，含 `test:` 先于 `feat:`/`fix:` 的提交顺序以体现 TDD）；推送并发 PR 至 `main`，确保合并前 ≥1 approve（宪法工作流）。PR 的 approve 需人工完成。

**Covers**: 全局（文档同步为宪法原则 6）
**Checkpoint**: 质量门禁全绿、文档计数一致、PR 待 review。

---

## Dependencies & Execution Order（强制 TDD 顺序）

```
Phase 1 (基础, 逐模块 RED→GREEN):
  T001 (RED, history-preference 测试) ──> T002 (GREEN, history-preference 实现)
  T003 (RED, deleteQueryRecords 测试) ──> T004 (GREEN, deleteQueryRecords 实现)
  （T003 不依赖 T002，但为清晰红绿流，顺序执行；均无可并行同模块依赖）

Phase 2 (US1, 逐模块 RED→GREEN):
  T005 (RED, use-word-query 门控测试) ──> T006 (GREEN, 门控实现)
  T007 (RED, MainPage 开关测试)        ──> T008 (GREEN, 开关实现)
  T009 (style, 配套 T008，非逻辑)

Phase 3 (US2+US3, RED→GREEN):
  T010 (RED, history-view 交互测试) ──> T011 (GREEN, 实现)
  T012 (style, 配套 T011)

Phase 4 (US4, 豁免 TDD 单测先红):
  T013 (verify 准则, 先于实现) ──> T014 (impl, 手动核验)

Phase 5 (门禁, 依赖全部 RED→GREEN 完成):
  T015 (lint+test) ── 依赖 T001–T014
  T016, T017 (文档) ── 依赖全部实现完成
  T018 (PR)        ── 依赖 T015
```

---

## Notes

- **宪法原则 8（强制严格 TDD）**：本任务全部改此约束。每模块 RED 任务必须先于 GREEN 任务完成且确认失败；同模块 test/impl 任务**取消 `[P]`**（强制顺序）。
- **非 mock 集成测试（原则 2）**：T003 `deleteQueryRecords` 测试 MUST 为真实 `db double`；T005 `use-word-query` 门控测试 dbStorage 用真实 fake、仅 `saveQueryRecord` 可 mock。
- **模块形态（原则 1）**：`src/<module>/index.js` + `index.test.js`；新增 `history-preference` 与 `query-history` 同层，不引入反向依赖。
- **Phase 4 豁免**：纯视觉 CSS 无法单测先红，依原则 8 改为「准则先行 + 手动核验」，不视为违反 TDD。
- **文档测试计数（原则 6，T017）**：以 `npm test` 实际通过数为准；当前基准 86（宪法），新增后 MUST 同步更新，MUST NOT 数字脱节。
- **分支命名**：`feat/history-settings-batch-ops`（plan Phase 5，符合宪法 `feat/<功能名>`）；spec 头部的 `2026-0706-2348ab-...` 为功能 ID 式命名，以 plan 为准。
- **练习按钮（REQ-008 / CON-002 / OUT-001）**：本次仅 UI 占位，T011/T012 不含任何 `onClick` 逻辑或路由跳转。
- **OUT-001 / OUT-002** 明确不在任务范围（练习业务逻辑、清空全部历史）。

---

## Coverage Table

| Plan Component | Requirement | Tasks (RED → GREEN) |
|---|---|---|
| Phase 1 偏好层 | REQ-001 | T001 (RED) → T002 (GREEN) |
| Phase 1 删除函数 | REQ-007 | T003 (RED) → T004 (GREEN) |
| Phase 2 写入门控 | REQ-002 | T005 (RED) → T006 (GREEN) |
| Phase 2 设置开关 | REQ-001 | T007 (RED) → T008 (GREEN), T009 (style) |
| Phase 3 卡片复选框 | REQ-003 | T010 (RED) → T011 (GREEN) |
| Phase 3 操作栏 | REQ-004 | T010 (RED) → T011 (GREEN) |
| Phase 3 全选 | REQ-005 | T010 (RED) → T011 (GREEN) |
| Phase 3 删除可用态 | REQ-006 | T010 (RED) → T011 (GREEN) |
| Phase 3 批量删除 | REQ-007 | T010 (RED) → T011 (GREEN) |
| Phase 3 练习占位 | REQ-008 | T010 (RED) → T011 (GREEN) |
| NFR-001 样式复用 | NFR-001 | T009, T012 |
| CON-001 复用 dbStorage | CON-001 | T001, T002, T005, T006 |
| CON-002 练习仅 UI | CON-002 | T010, T011 |
| CON-003 修复范围限定 | CON-003 | T013, T014 |
| Phase 5 文档同步 | 宪法原则 6 | T015, T016, T017, T018 |

---

## Unmapped Tasks

（无。所有 plan 组件与 REQ-001~009 / NFR-001 / CON-001~003 均已映射，无范围漂移；每模块均含先于实现的 RED 测试，符合宪法原则 8。）

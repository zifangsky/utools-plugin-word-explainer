# Feature Specification: history-settings-and-batch-ops

**Feature Branch**: `2026-0706-2348ab-history-settings-and-batch-ops`
**Created**: 2026-07-06
**Status**: Draft
**Input**: 用户需求：设置页新增「保存查词历史」开关（默认开启）；历史页单词卡片加复选框 + 左下角操作栏（全选复选框 / 删除按钮 / 灰色练习占位按钮）；批量删除带二次确认；修复设置与历史视图返回按钮与下方搜索区重叠的布局问题。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 控制是否保留查词历史 (Priority: P1)

用户进入设置页，看到一个「保存查词历史记录」开关，默认处于开启状态。若关闭，此后查询单词不再写入历史；已存在的历史仍可正常查看、删除。若保持开启，行为与现状一致。

**Why this priority**: 这是用户对隐私/数据累积的自主控制权，且是后续批量删除功能的前提语义基础（关闭后无新数据产生，但不影响既有数据管理）。

**Independent Test**: 进入设置页→观察开关默认开启；关闭后查询一个单词→返回历史页确认该次查询未出现；重新开启→查询同一单词→历史页出现新记录。

**Acceptance Scenarios**:

1. **Given** 首次进入设置页，**When** 未做任何更改，**Then** 开关渲染为开启状态，且 `dbStorage['saveQueryHistory']` 为 `true`（缺省视为开启）。
2. **Given** 开关处于关闭状态，**When** 用户查询一个单词并完成，**Then** `history_summary` 与 `detail/*` 不产生新文档。
3. **Given** 开关处于开启状态，**When** 用户查询一个单词并完成，**Then** 该单词按现有逻辑写入历史。

---

### User Story 2 - 批量勾选并删除查词记录 (Priority: P1)

用户在历史页左栏列表中，通过每个卡片左侧的复选框勾选待删除记录；或点击左下角操作栏最左侧的「全选」复选框一次性勾选当前列出的所有记录。勾选后点击「删除」按钮（至少勾选 1 项才可用），弹出 `window.confirm()` 确认，确认后批量删除对应详情文档并更新索引。

**Why this priority**: 直接解决用户「批量删除」的核心诉求，是本次功能的主要价值交付。

**Independent Test**: 历史页勾选 2 条记录→点删除→确认→确认列表中不再出现这 2 条且详情文档已从 `utools.db` 移除、`history_summary.records` 已同步。

**Acceptance Scenarios**:

1. **Given** 历史页存在多条记录，**When** 用户勾选某卡片的复选框，**Then** 该卡片进入选中态，操作栏「删除」按钮变为可用。
2. **Given** 未勾选任何记录，**When** 页面渲染，**Then** 「删除」按钮呈禁用态。
3. **Given** 用户点击操作栏最左侧「全选」复选框，**When** 当前列表有 N 条记录，**Then** N 张卡片全部选中；再次点击同一复选框，**Then** 全部取消选中。
4. **Given** 已勾选 m 条记录，**When** 用户点击「删除」，**Then** 弹出确认框显示「确定删除 m 条记录吗？」；取消则不做任何变更。
5. **Given** 用户在确认框点击确定，**When** 删除执行完毕，**Then** 被删记录的详情文档（`detail/*`）与 `history_summary` 索引同步移除，左侧列表刷新且选择态清空。

---

### User Story 3 - 练习功能占位入口 (Priority: P3)

历史页左下角操作栏「删除」按钮右侧，存在一个灰色的「练习」按钮。本次不绑定任何逻辑，点击无响应，仅作为未来功能的可见占位。

**Why this priority**: 仅 UI 占位，不交付功能价值，但需与删除按钮并排固定位置以便后续迭代。

**Independent Test**: 观察按钮渲染为灰色、不可点击态（`disabled`），点击无副作用。

**Acceptance Scenarios**:

1. **Given** 历史页左下角操作栏，**When** 页面渲染，**Then** 可见「练习」按钮呈灰色 disabled 样式。
2. **Given** 「练习」按钮，**When** 用户点击，**Then** 不发生跳转、不报错、不产生任何状态变更。

---

### User Story 4 - 修复返回按钮布局重叠 (Priority: P2)

设置视图与历史视图的 header 中，返回按钮（`.back-btn`）当前与下方搜索文本框/内容区视觉重叠。修复后返回按钮与下方内容清晰分隔、不再重叠；主视图（VIEW_MAIN）的 header 布局保持不变。

**Why this priority**: 影响设置页与历史页的可读性与交互正确性，但不阻塞数据存储功能，优先级次于数据类需求。

**Independent Test**: 进入设置页与历史页→观察 header 区域，返回按钮完整可见且与下方「搜索文本框 / 设置面板」之间无边框重叠或内容压字。

**Acceptance Scenarios**:

1. **Given** 设置视图 header，**When** 页面渲染，**Then** 返回按钮完整显示且不与其下方内容（设置标题/模型选择框）发生边框或文字重叠。
2. **Given** 历史视图 header，**When** 页面渲染，**Then** 返回按钮与下方历史列表/搜索区无重叠。
3. **Given** 主视图（VIEW_MAIN），**When** 页面渲染，**Then** header 布局与修复前一致，无视觉回归。

---

### Edge Cases

- 全选后，若上方列表因时间筛选/搜索变化而变更，全选复选框的勾选态应反映「当前列表是否全部选中」，避免脏选中态。
- 批量删除过程中某条详情文档已不存在（数据不一致），应跳过该条并继续删除其余，不应整体中断。
- 全部记录被删除后，历史列表显示空状态占位（复用现有 `.history-empty`）。
- 关闭「保存查词历史」开关后，已存在的历史记录仍可继续被勾选、删除（开关只控制"新写入"，不影响"已有数据管理"）。
- 暗色模式下返回按钮、操作栏按钮、复选框样式需同步适配（沿用现有 `@media (prefers-color-scheme: dark)` 体系）。

## Requirements *(mandatory)*

### Functional Requirements

- **REQ-001**: 系统 MUST 在设置界面提供一个「保存查词历史记录」开关（toggle switch），渲染为开启状态，对应 `dbStorage` 键 `saveQueryHistory`（缺省 `true`）。
  - Sources: NEED-001, DEC-001, CON-001
- **REQ-002**: 系统 MUST 在 `useWordQuery` 完成查询后，先读取 `dbStorage['saveQueryHistory']`；仅当为 `true` 时才调用 `saveQueryRecord` 写入历史。
  - Sources: NEED-001, CON-001
- **REQ-003**: 历史记录左栏每个单词卡片 MUST 在其左侧渲染一个复选框，用于标记该记录是否被选入批量操作集；勾选态与卡片点击查看详情相互独立。
  - Sources: NEED-002
- **REQ-004**: 历史页左下角操作栏 MUST 从左到右依次包含：①「全选」复选框（位于最左）；②「删除」按钮；③灰色 disabled「练习」按钮。
  - Sources: NEED-003, DEC-003, CON-002
- **REQ-005**: 「全选」复选框 MUST 在点击时选中当前上方列出的所有单词卡片，再次点击取消全部选中；其勾选态应与当前列表实际选中情况保持一致（列表变化时实时同步）。
  - Sources: NEED-003, DEC-003
- **REQ-006**: 「删除」按钮 MUST 在选中数量 ≥ 1 时可用，否则禁用。
  - Sources: NEED-003
- **REQ-007**: 系统 MUST 提供批量删除能力：点击删除→`window.confirm()` 二次确认（文案含待删条数）→确认后调用数据层删除函数，移除对应 `detail/*` 详情文档并同步更新 `history_summary.records` 索引→刷新列表并清空选择态。
  - Sources: NEED-004, DEC-002
- **REQ-008**: 「练习」按钮 MUST 渲染为灰色且 `disabled`，不绑定任何 `onClick`、不跳转、不产生逻辑副作用。
  - Sources: NEED-003, CON-002
- **REQ-009**: 系统 MUST 修复设置视图（VIEW_SETTINGS）与历史视图（VIEW_HISTORY）header 中返回按钮（`.back-btn`）与下方内容的重叠，确保二者清晰分隔；主视图（VIEW_MAIN）header 布局不得改变。
  - Sources: NEED-005, CON-003

### Key Entities

- **设置项 `saveQueryHistory`**：布尔值，存于 `window.utools.dbStorage`（键名 `saveQueryHistory`），缺省 `true`；新增模块 `src/history-preference/index.js`，提供 `getSaveQueryHistory()` / `setSaveQueryHistory(bool)`，与 `model-preference` 风格一致。
- **查词记录（既有）**：`history_summary` 索引文档（`{ _id:'history_summary', records:[{word, phonetic, chineseMeanings, timestamp, detailDocId}, ...] }`）+ `detail/<ISO时间戳>_<单词>` 详情文档。本次新增数据层函数 `deleteQueryRecords(db, detailDocIds)`：读 `summary`→逐条 `db.remove(db.get(detailDocId))`（跳过不存在项）→从 `records` 过滤移除→`db.put(summary)` 写回。
- **选择集（内存态）**：历史页组件内 `Set<string>` 维护当前选中的 `detailDocId`，不持久化。

### Non-Functional Requirements

- **NFR-001**: 新增开关与按钮的样式 MUST 复用现有设计语言（灰色边框按钮、`#1677ff` 主色、暗色模式 `@media` 覆盖），不引入新 UI 库。
  - Sources: CON-001, CON-002

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 设置开关默认开启；关闭后任一次查词均不向 `utools.db` 新增 `detail/*` 或 `history_summary` 记录。
- **SC-002**: 用户在历史页可通过「全选」复选框一次选中全部当前列表项，并通过删除按钮（带确认）在单次操作中移除 ≥1 条记录，且索引与详情文档保持一致。
- **SC-003**: 「练习」按钮在任何状态下均不可触发任何逻辑副作用。
- **SC-004**: 设置页与历史页 header 中返回按钮与下方内容无视觉重叠（人工/截图核验）。

## Out of Scope

- **练习功能业务逻辑**：单词/短语/例句的答题、计分、复习等不在本次范围，仅保留占位按钮。（OUT-001）
- **清空全部历史**：一键清空全部记录的功能不在本次范围，仅支持按勾选批量删除。（OUT-002）

## Assumptions

- `window.utools.dbStorage` 与 `window.utools.db` 在 uTools 运行环境下可用（沿用现有架构前提）。
- 历史页「全选」仅针对当前已加载/过滤后的列表项，不跨时间筛选分页（与现有前端实时过滤、按 `timeFilter` 读库的机制一致）。
- 「保存查词历史」开关的缺省值以 `true` 处理：读取到 `null`/`undefined` 时等同于开启。

## Dependencies

- 既有模块：`src/query-history/index.js`（`saveQueryRecord`/`getHistoryRecords`/`getDetailRecord`）、`src/model-preference/index.js`（存储范式参考）、`src/use-word-query/index.js`、`src/history-view/index.jsx` 与 `index.css`、`src/MainPage/index.jsx` 与 `index.css`。
- uTools 运行时：`utools.db`（文档库）、`utools.dbStorage`（KV 存储）、`window.confirm`。

## Requirements Traceability

| Confirmed Requirement | Spec Coverage | Notes |
|-----------------------|---------------|-------|
| NEED-001 | REQ-001, REQ-002 | 开关默认开启 + 写入门控 |
| NEED-002 | REQ-003 | 卡片复选框 |
| NEED-003 | REQ-004, REQ-005, REQ-006, REQ-008 | 操作栏 + 全选 + 删除可用态 + 练习占位 |
| NEED-004 | REQ-007 | 批量删除 + 确认弹窗 |
| NEED-005 | REQ-009 | 返回按钮布局修复 |
| CON-001 | REQ-001, REQ-002, NFR-001 | 复用 dbStorage，不引新依赖 |
| CON-002 | REQ-004, REQ-008, NFR-001 | 练习按钮仅 UI 占位 |
| CON-003 | REQ-009 | 修复范围限定于设置/历史视图 |
| DEC-001 | REQ-001 | toggle 开关 |
| DEC-002 | REQ-007 | 删除前 confirm 确认 |
| DEC-003 | REQ-004, REQ-005 | 操作栏最左全选复选框 |
| OUT-001 | Out of Scope | 练习业务逻辑排除 |
| OUT-002 | Out of Scope | 清空全部排除 |

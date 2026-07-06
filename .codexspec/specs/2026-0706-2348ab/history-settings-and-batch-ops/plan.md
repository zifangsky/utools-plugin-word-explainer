# Implementation Plan: history-settings-and-batch-ops

**Related Spec**: `.codexspec/specs/2026-0706-2348ab/history-settings-and-batch-ops/spec.md`
**Confirmed Requirements**: `.codexspec/specs/2026-0706-2348ab/history-settings-and-batch-ops/requirements.md`
**Created**: 2026-07-07
**Status**: Draft

## Context

插件已具备查词历史的数据层（`src/query-history/index.js`）与基础历史 UI（`src/history-view/index.jsx`）。本次在既有能力之上扩展四项用户已确认的能力：设置开关控制历史写入、历史卡片可勾选、左下角操作栏（全选/删除/练习占位）、以及修复设置与历史视图 header 返回按钮的布局重叠。所有改动须遵循项目宪法（模块边界、行为驱动测试、简洁优先、文档同步、uTools 平台契约）。

## Goals / Non-Goals

**Goals:**

- 提供「保存查词历史记录」开关（默认开），关闭后停止写入新历史，已存在数据可继续查看/删除。
- 历史卡片增加复选框；左下角操作栏含全选复选框、删除按钮（≥1 项可用）、灰色 disabled 练习按钮。
- 批量删除经 `window.confirm()` 二次确认后，清理 `detail/*` 详情文档并同步 `history_summary` 索引。
- 修复设置/历史视图返回按钮与下方内容重叠，主视图布局不变。

**Non-Goals:**

- 练习功能业务逻辑（答题/计分/复习）——仅 UI 占位。
- 清空全部历史功能。
- 修改查词历史的既有写入/去重/上限（5000）逻辑（仅新增删除能力）。

## Tech Stack

- **Language**: JavaScript（ESM，`"type": "module"`）
- **Framework**: React 19 + Vite 6
- **Platform**: uTools（`utools.dbStorage` / `utools.db` / `window.confirm`）
- **Test**: Vitest 4 + @testing-library/react 16 + jsdom
- **Lint**: standard v17

## Architecture Overview

```
MainPage (settings view)
  └─ <toggle switch> ── getSaveQueryHistory()/setSaveQueryHistory() ── utools.dbStorage['saveQueryHistory']

useWordQuery (查询完成后)
  └─ if getSaveQueryHistory() === true → saveQueryRecord(db, ...)   [写入门控]

HistoryView (左栏列表 + 操作栏)
  ├─ per-card checkbox  ── selectedIds: Set<detailDocId>
  ├─ select-all checkbox (最左) ── 选中当前全部 / 取消
  ├─ delete button (≥1 可用) ── window.confirm() ── deleteQueryRecords(db, ids) ── 刷新列表
  └─ practice button (disabled 占位)

query-history (数据层, 新增)
  └─ deleteQueryRecords(db, detailDocIds): 移除 detail/* + 同步 history_summary.records
```

**Covers**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, NFR-001

依赖方向保持宪法既定单向：`MainPage → useWordQuery / history-view / history-preference`；`useWordQuery → query-history`；`history-view → query-history`。新增 `history-preference` 与 `query-history` 同层，不引入反向依赖。

## Component Structure（本次涉及）

```
src/
├── history-preference/        # 新增
│   ├── index.js               # getSaveQueryHistory / setSaveQueryHistory
│   └── index.test.js          # 默认 true / set-get 往返
├── query-history/
│   ├── index.js               # 新增 deleteQueryRecords(db, detailDocIds)
│   └── index.test.js          # 集成级：删除详情+同步索引+跳过缺失
├── use-word-query/
│   └── index.js               # 写入前门控 getSaveQueryHistory()
├── MainPage/
│   ├── index.jsx              # 设置视图新增 toggle + 绑定
│   └── index.css              # 新增 .save-history-switch 样式 + .main-header min-height 修复
└── history-view/
    ├── index.jsx              # 卡片复选框 + 操作栏 + 批量删除
    └── index.css              # .history-op-bar / .history-select-all / .history-del-btn / .history-practice-btn(disabled)
```

## Data Models

### 设置项 `saveQueryHistory`（KV，utools.dbStorage）

| Key | Type | Default | 说明 |
|-----|------|---------|------|
| `saveQueryHistory` | boolean | `true`（读取为 `null` 时等同 `true`） | 控制是否写入新历史 |

### 查词记录（既有，见 spec Key Entities）

- `history_summary.records: [{ word, phonetic, chineseMeanings, timestamp, detailDocId }]`
- `detail/<ISO时间戳>_<单词>` 详情文档
- 本次新增删除函数操作上述二者，不改变其既有结构。

## API Contracts（uTools 平台调用）

- `window.utools.dbStorage.getItem('saveQueryHistory')` → `string|null`；`setItem('saveQueryHistory', boolean)`
- `window.utools.db.get(id)` / `.put(doc)` / `.remove(doc)`（既有，删除函数复用）
- `window.confirm(message)` → `boolean`

## Decisions

### Decision 1: 设置开关用纯 CSS toggle，不引入 UI 库

**Context**: REQ-001 要求「开关（toggle switch）」默认开启。
**Options Considered**:
1. 纯 CSS 开关（`<input type=checkbox>` + `<span class=slider>`），复用现有边框/主色 token。
2. 引入第三方 switch 组件库。
**Decision**: 选项 1。
**Rationale**: 宪法原则 7（YAGNI）与 CON-001（不引新依赖）；纯 CSS 实现量与现有 `.back-btn`/`.model-select` 风格一致。
**Covers**: REQ-001, CON-001
**Decision Level**: Plan-level technical decision; does not change confirmed product scope

### Decision 2: 选择态用组件内 `useState(Set)`，不持久化

**Context**: REQ-003/REQ-005 需要勾选与全选状态。
**Options Considered**:
1. HistoryView 内 `useState(new Set())` 维护 `selectedIds`。
2. 持久化选择态到 dbStorage。
**Decision**: 选项 1。
**Rationale**: 选择态是瞬时 UI 态，刷新/重进无需保留；与 spec 假设「选择集（内存态）不持久化」一致，避免无谓持久化。
**Covers**: REQ-003, REQ-005
**Decision Level**: Plan-level technical decision

### Decision 3: `deleteQueryRecords(db, detailDocIds)` 签名与容错

**Context**: REQ-007 需批量删除详情文档并同步索引。
**Options Considered**:
1. 函数接收 `db` 与 `detailDocIds[]`，内部逐条 `db.get`→若命中则 `db.remove`，并从 `history_summary.records` 过滤，最后 `db.put(summary)`。
2. 在 HistoryView 内联完成删除逻辑。
**Decision**: 选项 1（数据层函数）。
**Rationale**: 符合宪法原则 1（数据操作集中于 `query-history`，UI 不碰 db 细节）；对缺失详情文档跳过而非中断，满足 spec Edge Case。
**Covers**: REQ-007
**Decision Level**: Plan-level technical decision

### Decision 4: 返回按钮布局修复采用 `.main-header` 预留 `min-height`

**Context**: REQ-009——设置/历史视图 header 仅含绝对定位的 `.back-btn`，header 高度坍塌导致与下方内容重叠；主视图不受影响。
**Options Considered**:
1. 为 `.main-header` 增加 `min-height: 32px`，使绝对定位的 `.back-btn` 获得容纳空间，内容区从 header 之后正常排布。
2. 将 `.back-btn` 改为正常文档流（flex 左对齐）。
**Decision**: 选项 1（最小改动，主视图 h1 高度已≥该值，视觉无回归）。
**Rationale**: 符合宪法原则 7（精准修改、不动未坏部分）与 CON-003（主视图布局不变）；选项 2 会改变主视图 header 的居中布局。
**Covers**: REQ-009, CON-003
**Decision Level**: Plan-level technical decision

### Decision 5: 全选勾选态由「当前列表是否全选」派生

**Context**: spec Edge Case——列表因筛选/搜索变化后，全选复选框需反映真实选中情况。
**Decision**: 由 `records`（当前列表）与 `selectedIds` 计算 `allSelected = records.length>0 && records.every(r => selectedIds.has(r.detailDocId))`；点击全选框时批量 add/remove 当前 `records` 的全部 `detailDocId`。
**Rationale**: 避免脏选中态，符合 REQ-005「勾选态与当前列表实际选中情况保持一致」。
**Covers**: REQ-005

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 返回按钮修复在不同 uTools 窗口尺寸下仍需微调 | Medium | Low | 手动 `npm run dev` + uTools 加载截图核验，含暗色模式 |
| 全选框与过滤后列表同步出现脏态 | Low | Medium | 采用 Decision 5 派生计算，并加组件测试覆盖 |
| 新增测试导致 CLAUDE.md/README.md 计数脱节 | Medium | Low | 完成后同步更新测试计数（宪法原则 6） |
| `detail/*` 文档缺失导致删除中断 | Low | Medium | `deleteQueryRecords` 跳过缺失项（Decision 3） |

## Implementation Phases

### Phase 1: 数据层与偏好层

- [ ] 新增 `src/history-preference/index.js`：`getSaveQueryHistory()`（缺省 `true`）、`setSaveQueryHistory(bool)`。
- [ ] 新增 `src/history-preference/index.test.js`（默认 true、set/get 往返）。
- [ ] 在 `src/query-history/index.js` 新增 `deleteQueryRecords(db, detailDocIds)`；同步补充 `index.test.js`（集成级：用内存版 db double 验证详情移除 + `history_summary` 同步 + 缺失跳过）。
- [ ] **Covers**: REQ-001, REQ-007, CON-001

### Phase 2: 写入门控与设置开关

- [ ] 修改 `src/use-word-query/index.js`：查询完成后 `if (getSaveQueryHistory()) saveQueryRecord(...)`。
- [ ] 修改 `src/MainPage/index.jsx` 设置视图：新增「保存查词历史记录」标签 + toggle 开关，初始化读 `getSaveQueryHistory()`，变更调 `setSaveQueryHistory()`。
- [ ] 在 `src/MainPage/index.css` 新增 `.save-history-switch` 等样式（复用现有 token）+ 暗色覆盖。
- [ ] **Covers**: REQ-001, REQ-002, NFR-001

### Phase 3: 历史页勾选与批量操作

- [ ] 修改 `src/history-view/index.jsx`：引入 `selectedIds` state；卡片左侧渲染复选框（REQ-003）；在左栏 `.history-left` 内部、`.history-card-list` 之下新增 `flex-shrink:0` 的底部操作栏（REQ-004，对应「左下角」）：最左全选复选框（Decision 5）、删除按钮（≥1 可用，REQ-006）、灰色 disabled 练习按钮（REQ-008）。右栏详情区保持不变。
- [ ] 删除按钮 `onClick`：`window.confirm('确定删除 N 条记录吗？')` → 确认后 `deleteQueryRecords(db, [...selectedIds])` → 重新 `getHistoryRecords` 刷新 → 清空 `selectedIds`。
- [ ] 在 `src/history-view/index.css` 新增操作栏/复选框/练习按钮样式（含 `.history-practice-btn` 灰色 disabled）与暗色覆盖。
- [ ] 新增/补充 `src/history-view/index.test.jsx`：勾选同步删除可用态、点击全选全选/取消、删除触发 confirm 并调用 `deleteQueryRecords`、练习按钮 `disabled`。
- [ ] **Covers**: REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, NFR-001

### Phase 4: 返回按钮布局修复

- [ ] 修改 `src/MainPage/index.css`：`.main-header` 增加 `min-height: 32px`（Decision 4）；确认既有暗色 `.back-btn` 覆盖无误。
- [ ] **Covers**: REQ-009, CON-003

### Phase 5: 质量门禁与文档同步

- [ ] `npx standard` 通过；`npm test` 全绿（新增测试计数需计入）。
- [ ] 同步 `CLAUDE.md`（架构图/依赖方向/存储说明）与 `README.md`（结构树/测试计数）。
- [ ] 在 `feat/history-settings-batch-ops` 分支提交，PR 合入 `main` 前确保 ≥1 approve（宪法工作流）。
- [ ] **Covers**: 全局（文档同步为宪法原则 6）

## Verification Strategy

- **单元/集成测试（Vitest）**：
  - `history-preference`：缺省返回 `true`；`set` 后 `get` 一致。
  - `query-history.deleteQueryRecords`：使用内存版 db double（实现 `get/put/remove` 真实语义，非 `vi.fn` mock）验证——删除后 `db.get(detailId)` 为 `null`、旧 `summary.records` 不再含该条、缺失详情文档被跳过、其余正常删除（满足宪法原则 2：持久化关键路径至少 1 个非 mock 集成测试）。
  - `use-word-query`：关闭开关后不调用 `saveQueryRecord`（用 `vi.fn` mock `saveQueryRecord` 验证分支，dbStorage 用真实 fake）。
  - `history-view`（@testing-library/react）：渲染含记录的列表 → 勾选卡片使删除按钮 `disabled` 变 `enabled`；点击全选框全部选中、再点取消；点击删除弹 `window.confirm` mock → 确认后 `deleteQueryRecords` 被以正确 ids 调用且列表刷新；练习按钮 `disabled` 且无 `onClick` 触发。
  - `MainPage` 设置视图：渲染出开关且初始为开启态。
- **手动/可视验证**：`npm run dev` 起 Vite → uTools 开发模式加载 → 进入设置页与历史页截图，确认返回按钮与下方搜索/内容无重叠（含暗色模式）；执行一次真实批量删除确认数据被正确清除。

## Security Considerations

- 删除操作精确使用 `detailDocId`（`_id`），不误删其他文档（宪法安全要求）。
- 不引入任何密钥/外部 API；仅用既有 uTools 平台 API。

## Performance Considerations

- 批量删除为 O(n) 次 `db` 操作，n 为用户勾选数（通常很小），无性能风险。
- 全选态为派生计算（O(records.length)），列表规模受 5000 上限约束，无需缓存。

## Requirements Coverage

| Spec Requirement | Plan Coverage | Reference |
|------------------|---------------|-----------|
| REQ-001 | Full | Decision 1 / Phase 2 |
| REQ-002 | Full | Phase 2 (useWordQuery 门控) |
| REQ-003 | Full | Phase 3 (卡片复选框) |
| REQ-004 | Full | Phase 3 (操作栏三元素) |
| REQ-005 | Full | Decision 5 / Phase 3 |
| REQ-006 | Full | Phase 3 (删除可用态) |
| REQ-007 | Full | Decision 3 / Phase 1 / Phase 3 |
| REQ-008 | Full | Phase 3 (练习 disabled) |
| REQ-009 | Full | Decision 4 / Phase 4 |
| NFR-001 | Full | Decision 1 / Phase 2 / Phase 3 (复用 token + 暗色) |

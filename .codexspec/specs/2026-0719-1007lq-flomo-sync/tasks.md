# Tasks: flomo-sync

<!--
Language: Generate this document in the language specified in .codexspec/config.yml
-->

**Input**: Design documents from `.codexspec/specs/2026-0719-1007lq-flomo-sync/`
**Prerequisites**: plan.md ✓, spec.md ✓, requirements.md ✓

**Tests**: 宪法原则 8 强制 TDD。所有逻辑与可观测行为的测试 MUST 先于实现创建（RED → GREEN）。preload 层免测（jsdom 不可达）。

**Organization**: 按 plan.md 的 Phase 1/2/3 分组，Phase 内遵循 TDD 顺序。

## Format: `[ID] [P?] Description`

- **[P]**: 独立文件，无任务间依赖，可并行
- 每个任务包含 `Covers: REQ-xxx; Plan: <component/phase>`
- 每个任务产出单一可验证结果

---

## Phase 1: 数据层（纯逻辑，无 UI 依赖）

### T001 [x] — [P] 创建 sync 模块测试（RED）

**文件**: `src/sync/index.test.js`

**产出**: 一份包含所有预期测试用例但**全部失败**的测试文件。

**覆盖场景**:
- `getFlomoApiEndpoint` / `setFlomoApiEndpoint` — 写后读、空值返回空字符串
- `getFlomoTags` / `setFlomoTags` — 写后读、默认值为 `#English/vocabulary`、空值 trim、null/undefined 守卫
- `buildFlomoContent(word, result, tags)` — 含标签 / 无标签（空字符串/null）/ 多标签 / 空正文
- `syncToFlomo(word, result)` — 端点为空时返回 `{ success: false, message: "..." }`；端点有效时调用 `window.services.sendToFlomo` 并返回成功；preload 失败时返回错误

**验证**: `npm test src/sync/index.test.js` — 全部 FAIL → 全部 PASS (22 tests)

**Covers**: REQ-003, REQ-004, REQ-005, REQ-009, REQ-010; Plan: sync module

---

### T002 [x] — 创建 sync 模块实现（GREEN）

**文件**: `src/sync/index.js`

**依赖**: T001

**产出**: 实现文件，使 T001 全部通过。

**导出函数**:
- `getFlomoApiEndpoint()` / `setFlomoApiEndpoint(endpoint)` — 读写 `window.utools.dbStorage` key `flomoApiEndpoint`，默认 `""`
- `getFlomoTags()` / `setFlomoTags(tags)` — 读写 `window.utools.dbStorage` key `flomoTags`，默认 `"#English/vocabulary"`，trim 首尾空白，null/undefined 安全
- `buildFlomoContent(word, result, tags)` — 纯函数，输出 `{tags} **{word} 单词详解**\n\n{result}`，tags 为空时不含标签前缀
- `syncToFlomo(word, result)` — 异步函数：读端点→空则 return error message；读标签→build content→调 `window.services.sendToFlomo`→包装返回值

**验证**: `npm test src/sync/index.test.js` — 全部 PASS (22 tests)

**Covers**: REQ-003, REQ-004, REQ-005, REQ-009, REQ-010; Plan: sync module

---

### T003 [x] — 修改 preload 新增 sendToFlomo 方法

**文件**: `public/preload/services.js`

**产出**: `window.services` 新增 `sendToFlomo(endpoint, body)` async 方法。

**实现要点** (plan Decision 1):
- 解析 endpoint URL 取协议 → 选用 `https` 或 `http` 模块
- `JSON.stringify(body)`，headers: `Content-Type: application/json`，`Content-Length: Buffer.byteLength(data)`
- Promise 封装，`req.setTimeout(10000)`
- 成功返回 `{ ok: true, status: res.statusCode, body }`，失败返回 `{ ok: false, error: message }`

**验证**: 手动集成测试（preload 不可在 Vitest 中测）

**Covers**: REQ-002, REQ-003, REQ-011; Plan: preload

---

## Phase 2: UI 层（依赖 Phase 1）

### T004 [x] — [P] 修改 vite.config.js 支持 .ico 导入

**文件**: `vite.config.js`

**产出**: `assetsInclude: ['.ico']` 加入配置。vitest 配置后续分离到 `vitest.config.js`。

**验证**: `import flomoIcon from '../../assets/flomo_favicon.ico'` 在 Vite dev/build 中均返回正确 URL。

**Covers**: REQ-001; Plan: Decision 3

---

### T005 [x] — 编写 main-page 新增测试用例（RED）

**文件**: `src/main-page/index.test.jsx`（原 `src/MainPage/index.test.jsx`）

**依赖**: T002（sync 模块必须存在，测试中 mock 其导出）

**产出**: 新增测试用例，全部 FAIL（预期）。

**新增 mock**: `vi.mock('../sync/index.js')`，mock `syncToFlomo`, `getFlomoApiEndpoint`, `getFlomoTags` 返回可控值。

**新增测试场景** (7 个):
1. 有查词结果 + 有端点 → flomo 同步按钮可见
2. 有查词结果 + 无端点 → flomo 同步按钮不可见
3. 有查词结果 + loading 状态 → 同步按钮不可见
4. 点击同步按钮 → `syncToFlomo` 被调用，按钮进入 disabled/syncing 态
5. `syncToFlomo` 返回 `{ success: true }` → 按钮变绿，2s 后恢复 idle
6. `syncToFlomo` 返回 `{ success: false }` → 按钮变红 + 显示错误消息，3s 后恢复
7. 进入设置页 → 标签输入框默认值为 `#English/vocabulary`

**验证**: `npm test src/main-page/index.test.jsx` — 新增用例全部 FAIL，旧用例全部 PASS（无回归）→ 全部 PASS (25 tests)

**Covers**: REQ-001, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015, REQ-019; Plan: main-page tests

---

### T006 [x] — 修改 main-page JSX 实现（GREEN）

**文件**: `src/main-page/index.jsx`（原 `src/MainPage/index.jsx`）

**依赖**: T005

**产出**: 实现同步按钮 + 设置页卡片化排版，使 T005 全部通过。

**变更要点**:
- import `syncToFlomo` from `../sync/index.js` 和 flomo 图标
- 新增 state: `syncStatus` (`idle|syncing|success|error`), `syncMessage`, `endpoint`, `tags`
- 结果区 flex 布局：左侧 MarkdownView + 右侧同步按钮面板
- 同步按钮四态：纯图标 + title tooltip，样式对齐 header 按钮
- 设置页重组为两个 `.settings-card`：基本设置卡片 + 同步卡片
- 同步卡片含 flomo 端点 input + 标签 input（默认 `#English/vocabulary`）
- 从 sync 模块读写 flomo 配置（初始化时读取，onChange 时写入）
- useRef 追踪 timeout，组件卸载时清理

**验证**: `npm test src/main-page/index.test.jsx` — 全部 PASS (25 tests)

**Covers**: REQ-001, REQ-002, REQ-006, REQ-007, REQ-008, REQ-019; Plan: main-page

---

### T007 [x] — 修改 main-page CSS 样式

**文件**: `src/main-page/index.css`（原 `src/MainPage/index.css`）

**依赖**: T006

**产出**: 结果区 flex 布局 + 同步按钮四态样式 + 设置卡片样式 + 暗色模式。

**变更要点**:
- `.result-with-actions` — flex 布局，gap 16px
- `.result-actions` — 固定宽度列，同步按钮容器
- `.sync-flomo-btn` — 对齐 header 按钮风格（padding: 4px 10px, border-radius: 4px, 图标 16×16px）+ 四态样式
- `.settings-card` — 卡片容器（背景、边框、圆角、padding）
- `.settings-card-title` — 卡片标题
- `.sync-input` — 端点/标签输入框样式
- 全部在 `@media (prefers-color-scheme: dark)` 中补暗色覆盖

**验证**: 手动检查

**Covers**: REQ-001, REQ-006, REQ-019; Plan: main-page CSS

---

### T010 [x] — 编写 history-view 新增测试用例（RED）

**文件**: `src/history-view/index.test.jsx`

**依赖**: T002（sync 模块必须存在）

**产出**: 新增 5 个测试用例。

**新增 mock**: `vi.mock('../sync/index.js')`，mock `syncToFlomo`, `getFlomoApiEndpoint` 返回可控值。

**新增测试场景** (5 个):
1. 选中单词 + 有端点 → 同步按钮可见
2. 选中单词 + 无端点 → 同步按钮不可见
3. 点击同步按钮 → `syncToFlomo` 被调用，按钮进入 syncing 态
4. 同步成功 → 按钮短暂 success 后恢复 idle
5. 同步失败 → 按钮短暂 error 后恢复 idle

**验证**: `npm test src/history-view/index.test.jsx` — 新增全部 FAIL → 全部 PASS (+5, 总共 20 tests)

**Covers**: REQ-016, REQ-017, REQ-018, REQ-019; Plan: history-view tests

---

### T011 [x] — 修改 history-view JSX 实现（GREEN）

**文件**: `src/history-view/index.jsx`

**依赖**: T010

**产出**: 详情区同步按钮实现。

**变更要点**:
- import `syncToFlomo`, `getFlomoApiEndpoint` from `../sync/index.js` 和 flomo 图标
- 新增 state: `endpoint`, `syncStatus`, `syncMessage`, `selectedWord`
- 详情区 flex 布局：左侧 markdown + 右侧同步按钮
- 同步按钮样式和行为与首页一致
- `handleSelect` 切换单词时重置 `syncStatus` 为 idle
- useRef 追踪 timeout，每次新同步前清除旧定时器

**验证**: `npm test src/history-view/index.test.jsx` — 全部 PASS (20 tests)

**Covers**: REQ-016, REQ-017, REQ-018, REQ-019; Plan: history-view

---

### T012 [x] — 修改 history-view CSS 样式

**文件**: `src/history-view/index.css`

**依赖**: T011

**产出**: 详情区 flex 布局 + 同步按钮四态样式 + 暗色模式。

**变更要点**:
- `.history-right-detail-row` — flex 布局
- `.history-right-sync-flomo-btn` — 按钮四态样式（对齐 header 按钮风格）
- `.sync-flomo-icon` — 16×16px block
- 暗色模式覆盖
- 合并 `.history-card-checkbox` 重复定义

**验证**: 手动检查

**Covers**: REQ-016, REQ-019; Plan: history-view CSS

---

## Phase 3: 验证与文档

### T008 [x] — 运行全量测试套件 + 代码规范检查

**依赖**: T001–T007, T010–T012 全部完成

**产出**: `npm test` 全绿 (140 tests) + `npm run lint` 无错误。

**验证步骤**:
1. `npm test` — 140 tests passed
2. `npm run lint` — 0 errors
3. 无现有测试回归

**Covers**: SC-004; Plan: Phase 3

---

### T009 [x] — [P] 同步项目文档

**依赖**: T008

**产出**: CLAUDE.md 和 README.md 更新。

**更新内容**:
- `CLAUDE.md`：架构树新增 `src/sync/` + `src/history-view/` + `vitest.config.js`，依赖方向补充 `/sync`，存储说明（`flomoApiEndpoint`、`flomoTags`），`MainPage/` → `main-page/` 重命名，测试计数 140
- `README.md`：项目结构树新增 `src/sync/` + `main-page/` 重命名，测试计数 140

**验证**: 目视 diff 确认架构图一致性、测试数字与 `npm test` 输出一致。

**Covers**: SC-004; Plan: documentation

---

### T013 [x] — [P] 架构审查问题修复

**依赖**: T008

**产出**: 修复架构审查发现的 HIGH/MEDIUM/LOW 问题。

**修复内容**:
- A-01: main.css 暗色模式 `&` 语法修复
- A-02: package.json 添加 lint 脚本
- A-03: tools.js/prompt.js 添加 preload/src 同步注释
- A-04: `MainPage/` → `main-page/` 目录重命名
- A-05: `.history-card-checkbox` 重复定义合并
- A-06: `prompt-template` 导出 `systemPrompt`
- A-07: vitest 配置分离为 `vitest.config.js`
- A-08: services.js CJS/ESM 风格差异注释
- A-09: mcp-tools 模块用途注释

**验证**: `npm test` 140 PASS + `npm run lint` 0 errors

**Covers**: SC-004; Plan: architecture

---

## Dependencies & Execution Order

```
Phase 1:
  T001 (sync test, RED)  ──→  T002 (sync impl, GREEN)
  T003 (preload)           [独立，可与 T001 并行]

Phase 2: (全部依赖 T002)
  T004 (vite config)      [P] 独立
  T005 (main-page test)   [依赖 T002]
      └── T006 (main-page JSX)  [依赖 T005]
            └── T007 (main-page CSS)  [依赖 T006]
  T010 (history-view test) [依赖 T002]
      └── T011 (history-view JSX)  [依赖 T010]
            └── T012 (history-view CSS)  [依赖 T011]

Phase 3:
  T008 (test + lint)      [依赖 T001-T007, T010-T012 全部]
      ├── T009 (docs)     [P] [依赖 T008]
      └── T013 (arch fix) [P] [依赖 T008]
```

## Parallel Opportunities

- T001 与 T003 可并行（不同文件）
- T004 可与 T005/T010 并行（不同文件）
- T005 + T010 可并行（不同模块的测试）
- T009 和 T013 可并行（不同文件）

## Requirements Coverage

| Plan Phase / Task | REQ Coverage |
|-------------------|-------------|
| T001 + T002 (sync) | REQ-003, REQ-004, REQ-005, REQ-009, REQ-010 |
| T003 (preload) | REQ-002, REQ-003, REQ-011 |
| T004 (vite) | REQ-001 |
| T005 + T006 (main-page) | REQ-001, REQ-002, REQ-006, REQ-007, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015, REQ-019 |
| T007 (main-page CSS) | REQ-001, REQ-006, REQ-019 |
| T010 + T011 (history-view) | REQ-016, REQ-017, REQ-018, REQ-019 |
| T012 (history-view CSS) | REQ-016, REQ-019 |
| T008 + T009 + T013 (verify + docs + arch) | SC-004, SC-006 |

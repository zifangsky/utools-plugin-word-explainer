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

### T001 — [P] 创建 sync 模块测试（RED）

**文件**: `src/sync/index.test.js`

**产出**: 一份包含所有预期测试用例但**全部失败**的测试文件。

**覆盖场景**:
- `getFlomoApiEndpoint` / `setFlomoApiEndpoint` — 写后读、空值返回空字符串
- `getFlomoTags` / `setFlomoTags` — 写后读、默认值为 `#English/vocabulary`、空值 trim
- `buildFlomoContent(word, result, tags)` — 含标签 / 无标签（空字符串）/ 多标签 / 空正文
- `syncToFlomo(word, result)` — 端点为空时返回 `{ success: false, message: "..." }`；端点有效时调用 `window.services.sendToFlomo` 并返回成功；preload 失败时返回错误

**验证**: `npm test src/sync/index.test.js` — 全部 FAIL（预期行为，证明测试能捕获缺失的实现）

**Covers**: REQ-003, REQ-004, REQ-005, REQ-009, REQ-010; Plan: sync module

---

### T002 — 创建 sync 模块实现（GREEN）

**文件**: `src/sync/index.js`

**依赖**: T001

**产出**: 实现文件，使 T001 全部通过。

**导出函数**:
- `getFlomoApiEndpoint()` / `setFlomoApiEndpoint(endpoint)` — 读写 `window.utools.dbStorage` key `flomoApiEndpoint`，默认 `""`
- `getFlomoTags()` / `setFlomoTags(tags)` — 读写 `window.utools.dbStorage` key `flomoTags`，默认 `"#English/vocabulary"`，trim 首尾空白
- `buildFlomoContent(word, result, tags)` — 纯函数，输出 `{tags} **{word} 单词详解**\n\n{result}`，tags 为空时不含标签前缀
- `syncToFlomo(word, result)` — 异步函数：读端点→空则 return error message；读标签→build content→调 `window.services.sendToFlomo`→包装返回值

**验证**: `npm test src/sync/index.test.js` — 全部 PASS

**Covers**: REQ-003, REQ-004, REQ-005, REQ-009, REQ-010; Plan: sync module

---

### T003 — 修改 preload 新增 sendToFlomo 方法

**文件**: `public/preload/services.js`

**产出**: `window.services` 新增 `sendToFlomo(endpoint, body)` async 方法。

**实现要点** (plan Decision 1):
- 解析 endpoint URL 取协议 → 选用 `https` 或 `http` 模块
- `JSON.stringify(body)`，headers: `Content-Type: application/json`，`Content-Length: Buffer.byteLength(data)`
- Promise 封装，`req.setTimeout(10000)`
- 成功返回 `{ ok: true, status: res.statusCode, body }`，失败返回 `{ ok: false, error: message }`

**验证**: 手动集成测试（preload 不可在 Vitest 中测）
1. 配置有效 flomo API 端点 → 查词 → 点击同步 → flomo 收到笔记
2. 配置无效端点 → 查词 → 点击同步 → UI 显示错误信息

**Covers**: REQ-002, REQ-003, REQ-011; Plan: preload

---

## Phase 2: UI 层（依赖 Phase 1）

### T004 — [P] 修改 vite.config.js 支持 .ico 导入

**文件**: `vite.config.js`

**产出**: `assetsInclude: ['.ico']` 加入配置。

**验证**: `import icon from '../../assets/flomo_favicon.ico'` 在 Vite dev/build 中均返回正确 URL。

**Covers**: REQ-001; Plan: Decision 3

---

### T005 — 编写 MainPage 新增测试用例（RED）

**文件**: `src/MainPage/index.test.jsx`

**依赖**: T002（sync 模块必须存在，测试中 mock 其导出）

**产出**: 新增测试用例，全部 FAIL（预期）。

**新增 mock**: `vi.mock('../sync/index.js')`，mock `syncToFlomo` 返回可控值。

**新增测试场景** (7 个):
1. 有查词结果 + 有端点 → flomo 同步按钮可见
2. 有查词结果 + 无端点 → flomo 同步按钮不可见
3. 有查词结果 + loading 状态 → 同步按钮不可见
4. 点击同步按钮 → `syncToFlomo` 被调用，按钮进入 disabled/syncing 态
5. `syncToFlomo` 返回 `{ success: true }` → 按钮变绿，2s 后恢复 idle
6. `syncToFlomo` 返回 `{ success: false }` → 按钮变红 + 显示错误消息，3s 后恢复
7. 进入设置页 → 标签输入框默认值为 `#English/vocabulary`

**验证**: `npm test src/MainPage/index.test.jsx` — 新增用例全部 FAIL，旧用例全部 PASS（无回归）

**Covers**: REQ-001, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015; Plan: MainPage tests

---

### T006 — 修改 MainPage JSX 实现（GREEN）

**文件**: `src/MainPage/index.jsx`

**依赖**: T005

**产出**: 实现同步按钮 + 设置页卡片化排版，使 T005 全部通过。

**变更要点**:
- import `syncToFlomo` from `../sync/index.js` 和 flomo 图标
- 新增 state: `syncStatus` (`idle|syncing|success|error`), `syncMessage`
- 结果区 flex 布局：左侧 MarkdownView + 右侧同步按钮面板
- 同步按钮四态渲染（idle 图标 / syncing 灰度+disabled / success 绿色 / error 红色+message）
- 设置页重组为两个 `.settings-card`：基本设置卡片 + 同步卡片
- 同步卡片含 flomo 端点 input + 标签 input（默认 `#English/vocabulary`）
- 从 sync 模块读写 flomo 配置（初始化时读取，onChange 时写入）

**验证**: `npm test src/MainPage/index.test.jsx` — 全部 PASS

**Covers**: REQ-001, REQ-002, REQ-006, REQ-007, REQ-008; Plan: MainPage

---

### T007 — 修改 MainPage CSS 样式

**文件**: `src/MainPage/index.css`

**依赖**: T006

**产出**: 结果区 flex 布局 + 同步按钮四态样式 + 设置卡片样式 + 暗色模式。

**变更要点**:
- `.result-with-actions` — flex 布局，gap 16px
- `.result-actions` — 固定宽度列，同步按钮容器
- `.sync-flomo-btn` — idle/syncing/success/error 四种 .className 状态样式
- `.settings-card` — 卡片容器（背景、边框、圆角、padding）
- `.settings-card-title` — 卡片标题
- `.sync-input` — 端点/标签输入框样式
- 全部在 `@media (prefers-color-scheme: dark)` 中补暗色覆盖

**验证**: 手动检查：
- idle 状态：flomo 图标正常色
- syncing 状态：图标 opacity 或旋转动画
- success 状态：绿色 ✓
- error 状态：红色 ✗ + tooltip
- 暗色模式：卡片、输入框颜色一致

**Covers**: REQ-001, REQ-006; Plan: MainPage CSS

---

## Phase 3: 验证与文档

### T008 — 运行全量测试套件 + 代码规范检查

**依赖**: T001–T007 全部完成

**产出**: `npm test` 全绿 + `npx standard` 无错误。

**验证步骤**:
1. `npm test` — 全部测试通过，现有 86 个测试无回归
2. `npx standard` — 无 lint 错误
3. 若 `standard` 有自动修复项，执行 `npx standard --fix`

**Covers**: SC-004; Plan: Phase 3

---

### T009 — [P] 同步项目文档

**依赖**: T008

**产出**: CLAUDE.md 和 README.md 更新。

**更新内容**:
- `CLAUDE.md`：架构树新增 `src/sync/` 节点 + 依赖方向补充 + 存储说明（`flomoApiEndpoint`、`flomoTags`）
- `README.md`：项目结构树新增 `src/sync/` + 测试计数更新

**验证**: 目视 diff 确认架构图一致性、测试数字与 `npm test` 输出一致。

**Covers**: SC-004; Plan: documentation

---

## Dependencies & Execution Order

```
Phase 1:
  T001 (sync test, RED)  ──→  T002 (sync impl, GREEN)
  T003 (preload)           [独立，可与 T001 并行]

Phase 2: (全部依赖 T002)
  T004 (vite config)      [P] 独立
  T005 (MainPage test)    [依赖 T002]
      └── T006 (MainPage JSX)  [依赖 T005]
            └── T007 (MainPage CSS)  [依赖 T006]

Phase 3:
  T008 (test + lint)      [依赖 T001-T007 全部]
      └── T009 (docs)     [P] [依赖 T008]
```

## Parallel Opportunities

- T001 与 T003 可并行（不同文件）
- T004 可与 T005 并行（不同文件）
- T009 独立，只需 T008 通过

## Requirements Coverage

| Plan Phase / Task | REQ Coverage |
|-------------------|-------------|
| T001 + T002 (sync) | REQ-003, REQ-004, REQ-005, REQ-009, REQ-010 |
| T003 (preload) | REQ-002, REQ-003, REQ-011 |
| T004 (vite) | REQ-001 |
| T005 + T006 (MainPage) | REQ-001, REQ-002, REQ-006, REQ-007, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015 |
| T007 (CSS) | REQ-001, REQ-006 |
| T008 + T009 (verify) | SC-004 |

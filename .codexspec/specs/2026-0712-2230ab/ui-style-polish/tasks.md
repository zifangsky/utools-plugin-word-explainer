# Implementation Tasks: 批量样式优化（返回图标 / 按钮高度 / 复选框间距）

<!--
Language: zh-CN
-->

## Task Groups

### Group A — 返回按钮图标替换 (REQ-1 / CON-1 / DEC-2)

#### Task A1: 替换 BackIcon 为清理版 SVG

- **Outcome**: `src/MainPage/index.jsx` 中 `BackIcon` 组件渲染用户最新提供的 SVG（清理 `metadata`/`rdf:RDF`，`viewBox="0 0 800 800"`，`fill="currentColor"`，含两个 `<path>`），并保留 `className="back-icon"` 与尺寸 `16×16`；按钮保留「返回」文字。
- **Paths**: `src/MainPage/index.jsx`
- **Covers**: REQ-1 返回按钮图标替换; Plan: Decision 1
- **Depends on**: 无
- **Verification**:
  1. 在设置页与历史页渲染 `MainPage`，断言存在 `<svg class="back-icon">`。
  2. 断言 svg 的 `viewBox` 为 `0 0 800 800`。
  3. 断言 svg 含 2 个 `<path>` 子元素。
  4. 断言 svg 使用 `currentColor`（fill 属性或继承）。
  5. 断言按钮文本仍含「返回」。

#### Task A2: BackIcon 结构回归测试（先红后绿）

- **Outcome**: 在 `src/MainPage/index.test.jsx` 中新增/更新测试，验证 A1 的 DOM 结构（viewBox、path 数、currentColor、文字），防止图标被误改。
- **Paths**: `src/MainPage/index.test.jsx`
- **Covers**: REQ-1; Plan: Implementation Notes（结构性断言）; 宪法原则 8（可观察行为先红后绿）
- **Depends on**: 无（可与 A1 并行 `[P]`，但建议测试先于实现提交）
- **Verification**: `npm test` 中该用例覆盖 A1 的 5 项断言。

### Group B — 操作按钮高度统一 (REQ-2 / CON-2 / DEC-1)

#### Task B1: 收敛返回/删除/练习按钮高度

- **Outcome**: `.back-btn`、`.history-del-btn`、`.history-practice-btn` 的 `padding`、`font-size`、`line-height` 收敛至与 `.history-search-btn`（`padding: 4px 8px`）一致的紧凑值；保留各自配色与禁用态（删除按钮 `disabled`、练习按钮 `disabled` 不变）。
- **Paths**: `src/MainPage/index.css`、 `src/history-view/index.css`
- **Covers**: REQ-2 操作按钮高度统一; Plan: Decision 2
- **Depends on**: 无
- **Verification**（宪法原则 8 豁免：纯 CSS，以手动/截图核验替代先红）:
  1. 浅色模式下并排查看返回/删除/练习按钮与历史页搜索按钮，高度视觉一致。
  2. 删除按钮在未选中卡片时仍为 `disabled` 灰态；练习按钮 disabled 态不变。
  3. 暗色模式下按钮高度一致且配色正确。

### Group C — 复选框间距缩短 (REQ-3 / CON-2 / DEC-3)

#### Task C1: 缩短卡片复选框与单词间距

- **Outcome**: `.history-card-checkbox` 的 `margin-right` 由 `6px` 改为 `2px`，移除 `margin-top` 与 `align-self: flex-start`，在 `flex` 行中与文字自然垂直居中；保留 `flex-shrink: 0` 与 `onClick stopPropagation`。
- **Paths**: `src/history-view/index.css`
- **Covers**: REQ-3 复选框与单词间距缩短; Plan: Decision 3
- **Depends on**: 无
- **Verification**（宪法原则 8 豁免：纯 CSS）:
  1. 历史卡片中复选框紧贴单词左侧，间距明显缩短。
  2. 点击卡片区域仍加载详情；点击复选框仅切换勾选（现有 history-view 测试仍通过）。

### Group D — 验证与交付

#### Task D1: 运行全量测试

- **Outcome**: `npm test` 全绿（含 A2 新增用例，现有 105 个测试计数因新增用例而增长）。
- **Paths**: 全仓库
- **Covers**: CON-3 严格 TDD（验证准则）; Plan: Implementation Notes
- **Depends on**: A1, A2, B1, C1
- **Verification**: `npm test` 退出码为 0，所有用例通过。

#### Task D2: 同步文档测试计数

- **Outcome**: `README.md` 与 `CLAUDE.md` 中的测试计数更新为实际通过数（新增 A2 用例后计数 +1，即 106）。
- **Paths**: `README.md`、`CLAUDE.md`
- **Covers**: CON-4 文档同步; 宪法原则 6
- **Depends on**: D1
- **Verification**: `grep` 文档中测试计数与 `npm test` 实际通过数一致。

#### Task D3: 提交到 feat/ui-style-polish 分支

- **Outcome**: 在 `feat/ui-style-polish` 分支提交实现（`test:` 先于 `feat:` 或合并提交），遵循 Conventional Commits；本地提交就绪（push 受网络限制待恢复）。
- **Paths**: git
- **Covers**: OUT-* 输出项; 宪法原则 8（test 先于 feat 提交）
- **Depends on**: D1, D2
- **Verification**: `git log --oneline` 显示本功能相关提交；`git status` 干净。

## Coverage Table

| Plan Component | Requirement | Task |
|----------------|-------------|------|
| Decision 1 BackIcon SVG 替换 | REQ-1 | A1, A2 |
| Decision 2 按钮高度统一 | REQ-2 | B1 |
| Decision 3 复选框间距 | REQ-3 | C1 |
| Implementation Notes 验证/文档 | CON-3/4 | D1, D2, D3 |

## Unmapped Tasks

无。所有计划交付项均有对应任务。

## Verification Checkpoints

- **CP-1（图标）**: A2 测试断言 svg viewBox/path 数/currentColor/文字。
- **CP-2（高度）**: B1 手动+截图核验（浅色/暗色），禁用态不变。
- **CP-3（间距）**: C1 手动核验 + 现有 history-view 测试通过。
- **CP-4（全绿）**: D1 `npm test` 全绿。
- **CP-5（计数）**: D2 文档计数与实际一致。

# Design Document: 批量样式优化（返回图标 / 按钮高度 / 复选框间距）

<!--
Language: zh-CN
-->

## Context

当前分支 `feat/back-icon-and-checkbox-row` 已完成上一轮 UI 打磨：返回按钮使用简化 SVG 箭头（`viewBox="0 0 1024 1024"`），复选框已移至单词前同一行。本轮在 `feat/ui-style-polish` 上继续优化：

- 用用户最新提供的更精细 SVG 替换返回箭头（双 `path`，`viewBox="0 0 800 800"`）；
- 压缩返回 / 删除 / 练习按钮高度，与历史页搜索按钮（`.history-search-btn`，`padding: 4px 8px`）视觉等高；
- 缩短卡片复选框与单词的间距（`margin-right: 6px → 2px` 并移除多余定位）。

代码基线（已确认）：
- `src/MainPage/index.jsx` → `BackIcon` 组件 + `.back-btn` 渲染
- `src/MainPage/index.css` → `.back-btn` / `.back-icon`
- `src/history-view/index.css` → `.history-del-btn` / `.history-practice-btn` / `.history-card-checkbox`

宪法约束（原则 8 强制严格 TDD）：逻辑与可观测行为 MUST 先红后绿；纯视觉/布局 CSS 豁免单测先红，但 MUST 在实现**前**明确验证准则（含暗色模式）。本任务三项需求均为纯 CSS / SVG 视觉变更，**适用原则 8 豁免**，验证以手动/截图 + DOM 结构断言为主。

## Goals / Non-Goals

**Goals:**

- 返回按钮渲染用户最新 SVG 箭头，保留「返回」文字，暗色模式自动反色。
- 返回、删除、练习按钮视觉高度与历史页搜索按钮一致。
- 卡片复选框紧跟单词，间距缩短且垂直居中。

**Non-Goals:**

- 不修改搜索按钮、历史搜索按钮、筛选下拉、AI 模型选择等其它控件样式。
- 不改动查词历史数据层、批量删除/全选逻辑、发音功能、设置开关逻辑。
- 不新增任何交互行为（仅图标替换 + 样式调整）。

## Decisions

### Decision 1: 返回图标 SVG 清理策略

**Context**: 用户提供的 SVG 含 `metadata` / `rdf:RDF` 与 `fill="#000000"`，直接内联不利于主题适配且冗长。
**Decision**: 移除 `metadata` / `rdf:RDF` 节点；保留 `<svg>` + `<g transform>` + 两个 `<path>`；将 `fill="#000000"` 改为 `fill="currentColor"`；在 `BackIcon` 组件上设 `className="back-icon"`、`viewBox="0 0 800 800"`、尺寸 `16×16`。
**Rationale**: `currentColor` 使图标继承文字颜色，暗色模式（`prefers-color-scheme: dark`）下无需新增样式即可反色（CON-1）；移除元数据减小体积（DEC-2）。
**Plan-Level 验证准则**: 暗色模式下 SVG 颜色应随文字颜色反转；浅色下与文字同色。

### Decision 2: 按钮高度统一基准

**Context**: 返回/删除/练习按钮内边距不一致，视觉上相对历史页搜索按钮偏厚。
**Decision**: 以 `.history-search-btn` 的 `padding: 4px 8px` 为基准，将 `.back-btn`、`.history-del-btn`、`.history-practice-btn` 的 `padding` 收敛到同等紧凑值，并统一 `font-size` 与 `line-height`（与搜索按钮一致）。
**Rationale**: 消除「过高」观感，保持操作栏与搜索栏视觉一致性（DEC-1，REQ-2）。
**Plan-Level 验证准则**: 并排查看时，返回/删除/练习按钮高度 ≈ 历史页搜索按钮高度；禁用态样式不变。

### Decision 3: 复选框间距与对齐

**Context**: 复选框 `margin-right: 6px` 且 `margin-top: 2px` + `align-self: flex-start`，与文字间距偏宽且基线未对齐。
**Decision**: `.history-card-checkbox` 的 `margin-right` 改为 `2px`，移除 `margin-top` 与 `align-self: flex-start`，保留 `flex-shrink: 0`，使其在 `flex` 行中与文字自然垂直居中（DEC-3，REQ-3）。
**Rationale**: 缩短间距、改善对齐；不破坏点击拦截（`onClick stopPropagation` 保留）。
**Plan-Level 验证准则**: 复选框紧贴单词左侧；点击卡片仍加载详情，点击复选框仅切换勾选。

## Architecture

```
修改范围（均为样式/CSS 与 SVG 替换，不涉及模块依赖图变更）：

src/MainPage/index.jsx
  └── BackIcon 组件：SVG 内容替换为清理版（currentColor, viewBox 0 0 800 800）
src/MainPage/index.css
  └── .back-btn   : padding/line-height 收敛，与搜索按钮等高
  └── .back-icon  : 尺寸 16×16（保留），确保与文字垂直居中
src/history-view/index.css
  └── .history-del-btn      : padding 收敛
  └── .history-practice-btn : padding 收敛
  └── .history-card-checkbox: margin-right 2px，移除多余定位
```

Covers: REQ-1, REQ-2, REQ-3

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| SVG 在 16px 下双 path 细节显示过密 | 图标在小尺寸下略糊 | 保留 `viewBox` 缩放，依赖矢量清晰度；如观感不佳可后续调整 |
| 不同按钮字号差异导致视觉高度仍不完全一致 | 轻微不齐 | 统一 `font-size` 与 `line-height`，以 `padding` 为基准对齐 |
| 复选框移除 `align-self` 后垂直居中依赖 flex 行高 | 对齐偏差 | 验收时检查卡片行在 14px 字号下居中 |

## Implementation Notes

- 本任务为**纯视觉/CSS/SVG 变更**，适用宪法原则 8 豁免：不要求单测先红，但 MUST 在实现前明确上列验证准则（已含暗色模式）。
- 仍 SHOULD 为 `BackIcon` 增加 DOM 结构测试（断言渲染 `<svg class="back-icon">` 且含两个 `<path>`，便于回归），但该类测试属结构性断言，不强制先红。
- 历史页组件测试（`history-view/index.test.jsx`）已覆盖卡片复选框 `data-testid` 与点击拦截；本轮不改交互，仅需确保现有测试仍通过。
- 测试计数同步：若新增测试则更新 README/CLAUDE（CON-4，原则 6）。

## Requirements Coverage

| Spec Requirement | Plan Coverage |
|------------------|---------------|
| REQ-1 返回按钮图标替换 | Decision 1 + BackIcon 替换 |
| REQ-2 操作按钮高度统一 | Decision 2 + .back-btn/.history-del-btn/.history-practice-btn |
| REQ-3 复选框与单词间距缩短 | Decision 3 + .history-card-checkbox |
| CON-1 主题适配 | Decision 1 currentColor |
| CON-2 不破坏既有交互 | Decision 2/3 保留 disabled 与 stopPropagation |
| CON-3 严格 TDD | Implementation Notes 豁免说明 |
| CON-4 文档同步 | Implementation Notes 测试计数同步 |
| DEC-1 搜索按钮基准 | Decision 2 |
| DEC-2 SVG 清理 | Decision 1 |
| DEC-3 复选框间距 | Decision 3 |

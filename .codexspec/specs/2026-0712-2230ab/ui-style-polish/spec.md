# Feature Specification: 批量样式优化（返回图标 / 按钮高度 / 复选框间距）

<!--
Language: zh-CN
-->

## ADDED Requirements

### Requirement: REQ-1 返回按钮图标替换

将设置页与查词历史页「返回」按钮的箭头替换为用户最新提供的 SVG 图标；SVG 使用 `currentColor` 填充以适配浅色/暗色主题；保留「返回」文字。

Sources: NEED-1, CON-1, DEC-2

#### Scenario: 返回按钮渲染 SVG 图标

- **WHEN** 用户在设置页或历史页查看「返回」按钮
- **THEN** 按钮显示一个使用 `currentColor` 填充的 SVG 箭头图标，紧邻「返回」文字

#### Scenario: 暗色模式自动反色

- **WHEN** 系统处于 `prefers-color-scheme: dark` 模式
- **THEN** 返回按钮 SVG 图标颜色随文字颜色自动反转，无需新增暗色样式

### Requirement: REQ-2 操作按钮高度统一

将返回按钮（`.back-btn`）、历史页底部删除按钮（`.history-del-btn`）、练习按钮（`.history-practice-btn`）的高度调整至与历史页搜索按钮（`.history-search-btn`）一致，使用紧凑的 `padding` 与行高。

Sources: NEED-2, CON-2, DEC-1

#### Scenario: 按钮高度一致性

- **WHEN** 在设置页/历史页与历史页底部操作栏并排查看各按钮
- **THEN** 返回、删除、练习按钮的视觉高度与历史页搜索按钮相同（去掉过厚内边距）

#### Scenario: 按钮交互逻辑不变

- **WHEN** 删除按钮在「未选中任何卡片」时
- **THEN** 删除按钮保持 `disabled` 状态，练习按钮保持 `disabled`，全选/删除行为不受影响

### Requirement: REQ-3 复选框与单词间距缩短

缩短单词卡片中复选框（`.history-card-checkbox`）与单词（`.history-card-word`）之间的水平间距，并使其与文字行自然垂直居中对齐。

Sources: NEED-3, CON-2, DEC-3

#### Scenario: 复选框紧跟单词

- **WHEN** 在历史页单词卡片列表中查看某卡片
- **THEN** 复选框位于单词左侧，间距明显缩短（原 `margin-right: 6px` → `2px`），且垂直与文字基线对齐

#### Scenario: 点击卡片仍加载详情

- **WHEN** 用户点击卡片区域（非复选框）
- **THEN** 仍触发详情加载，复选框点击被 `stopPropagation` 拦截，不触发详情切换

## Context

当前 `feat/back-icon-and-checkbox-row` 分支已完成上一轮 UI 打磨：返回按钮已使用 SVG（`viewBox="0 0 1024 1024"` 的简化箭头），复选框已移至单词前同一行。本轮用户要求：

1. 用一份更精细的 SVG 替换返回按钮箭头；
2. 压缩返回/删除/练习按钮高度，使其与历史页搜索按钮（`padding: 4px 8px`）视觉等高；
3. 缩短卡片复选框与单词的间距（原 `margin-right: 6px`）。

涉及文件：
- `src/MainPage/index.jsx`（`BackIcon` 组件 + `.back-btn` 渲染）
- `src/MainPage/index.css`（`.back-btn`、`.back-icon`）
- `src/history-view/index.css`（`.history-del-btn`、`.history-practice-btn`、`.history-card-checkbox`）

## Goals

- 提升界面视觉一致性，消除返回/删除/练习按钮相对搜索按钮「过高」的观感。
- 提供更具辨识度的返回箭头图标，并兼容暗色主题。
- 缩短复选框与单词的间距，使卡片行更紧凑。

## Non-Goals

- 不修改搜索按钮、历史搜索按钮、筛选下拉、AI 模型选择等其它控件的样式。
- 不改动查词历史的数据层、批量删除逻辑、全选逻辑或发音功能。
- 不新增任何交互行为（仅做样式与图标替换）。

## User Stories

### Story: 视觉一致性偏好

**As a** 使用该插件的用户
**I want** 各操作按钮高度统一、返回图标更清晰、复选框更紧凑
**So that** 界面观感更整洁、操作区域不突兀

**Acceptance Criteria:**

- [ ] 返回按钮显示用户最新提供的 SVG 箭头，保留「返回」文字
- [ ] 返回、删除、练习按钮高度与历史页搜索按钮一致
- [ ] 卡片复选框与单词间距缩短且垂直居中
- [ ] 暗色模式下图标自动反色
- [ ] 既有点击交互（卡片详情、全选、删除、复选框切换）不受影响

## Constraints

- 所有颜色通过 `currentColor` 或既有 CSS 变量继承，暗色模式无需新增样式即可反色（CON-1）
- 复选框仍置于单词前同一行；全选/删除/练习按钮禁用逻辑保持不变（CON-2）
- 严格 TDD：先写测试（RED）再实现（GREEN），聚焦外部可见行为（CON-3）
- README.md / CLAUDE.md 测试计数随测试新增同步更新（CON-4）

## Assumptions

- 用户提到的「联系按钮」即当前界面唯一的「练习」按钮，本次按练习按钮处理；如理解有误，后续可修正。
- 「搜索」按钮高度基准指历史页搜索按钮 `.history-search-btn`（`padding: 4px 8px`）。
- 保留「返回」文字，仅替换箭头图标。

## Requirements Traceability

| Confirmed Requirement | Spec Coverage |
|-----------------------|---------------|
| NEED-1 返回图标替换 | Requirement: REQ-1 返回按钮图标替换 |
| NEED-2 按钮高度统一 | Requirement: REQ-2 操作按钮高度统一 |
| NEED-3 复选框间距缩短 | Requirement: REQ-3 复选框与单词间距缩短 |
| CON-1 主题适配 | REQ-1/REQ-2/REQ-3 暗色反色 |
| CON-2 不破坏既有交互 | REQ-2/REQ-3 Scenario: 按钮交互逻辑不变 / 点击卡片仍加载详情 |
| CON-3 严格 TDD | 实现阶段所有变更先写测试 |
| CON-4 文档同步 | 提交前更新 README/CLAUDE 测试计数 |
| DEC-1 搜索按钮基准 | REQ-2 高度基准 `padding: 4px 8px` |
| DEC-2 SVG 清理 | REQ-1 使用 currentColor 清理版 SVG |
| DEC-3 复选框间距 | REQ-3 `margin-right: 2px` 并移除多余定位 |

## Open Questions

- OPEN-1 「联系按钮」指向：已默认按「练习按钮」处理，待用户最终确认。
- OPEN-2 返回文字保留：已默认保留「返回」文字，待用户最终确认。

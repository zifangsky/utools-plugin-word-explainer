# Feature Specification: 返回按钮图标化与单词卡片复选框同行

## Context

功能实现已符合预期，但用户反馈两个 UI 细节：

1. 设置页与查词历史页左上角的返回按钮为“← 返回”纯文字按钮，视觉较粗糙。
2. 查词历史单词卡片中，复选框单独占一行，与单词错位，显得拥挤。

## Goals

- 将返回按钮的“←”替换为更符合现代感的 SVG 图标，同时保留“返回”文字。
- 将历史卡片复选框与单词文本置于同一行，并位于单词之前。
- 不引入新依赖、不改动业务逻辑与行为，保持所有既有测试通过。

## Non-Goals

- 不调整返回按钮的位置、尺寸与响应区域。
- 不新增业务逻辑或数据持久化。
- 不引入图标库或字体库。

## User Stories

### Story: 图标化返回按钮

**As a** 用户
**I want** 返回按钮使用更精致的 SVG 图标
**So that** 设置页与历史页顶部更美观

**Acceptance Criteria:**

- [ ] 设置页左上角返回按钮显示为 SVG 图标 + “返回”文字。
- [ ] 查词历史页左上角返回按钮同样显示为 SVG 图标 + “返回”文字。
- [ ] 返回按钮点击行为不变，仍可回到主界面。
- [ ] SVG 颜色在暗色模式下仍可见。

### Story: 复选框与单词同行

**As a** 用户
**I want** 查词历史卡片中的复选框与单词在同一行
**So that** 列表更紧凑、信息更易读

**Acceptance Criteria:**

- [ ] 复选框显示在单词文本的左侧，且与单词在同一行。
- [ ] 点击复选框只切换选中状态，不触发卡片进入详情。
- [ ] 批量删除、全选等功能行为保持不变。

## ADDED Requirements

### Requirement: 返回按钮图标化

设置页（`VIEW_SETTINGS`）与查词历史页（`HistoryView`）左上角的返回按钮，将文本“←”替换为用户提供的 SVG 图标，并保留“返回”文字。SVG 使用 `fill: currentColor` 以适配暗色模式。

**Sources:** NEED-001, CON-003, DEC-001, DEC-003, DEC-004

#### Scenario: 设置页返回按钮

- **WHEN** 用户进入设置页
- **THEN** 左上角按钮显示为 [SVG 图标] + “返回”，点击后返回主界面

#### Scenario: 历史页返回按钮

- **WHEN** 用户进入查词历史页
- **THEN** 左上角按钮显示为 [SVG 图标] + “返回”，点击后返回主界面

### Requirement: 单词卡片复选框与单词同行

查词历史列表卡片中，复选框从单独一行移动到单词所在行，并位于 `.history-card-word` 之前。复选框点击事件仍应阻止冒泡，避免误触进入详情。

**Sources:** NEED-002, CON-002, DEC-002

#### Scenario: 卡片复选框位置

- **WHEN** 用户查看查词历史列表
- **THEN** 每个卡片的复选框与单词在同一行，且位于单词左侧

#### Scenario: 复选框防冒泡

- **WHEN** 用户点击复选框
- **THEN** 仅切换该卡片选中状态，不加载右侧详情

## Constraints

- 仅做 UI 调整，不改动返回按钮点击行为、复选框逻辑与批量删除业务逻辑。
- 复选框仍应阻止点击事件冒泡到卡片。
- 使用内联 SVG，不引入新图标库。
- 所有既有测试继续通过。

## Assumptions

- 返回按钮 SVG 图标以 `className="back-icon"` 包裹，便于统一控制尺寸与颜色。
- `currentColor` 在 `.back-btn` 的文字色上表现正常，亮/暗色模式下均可见。

## Requirements Traceability

| Confirmed Requirement | Spec Coverage |
|-----------------------|---------------|
| NEED-001 | Requirement: 返回按钮图标化 |
| NEED-002 | Requirement: 单词卡片复选框与单词同行 |
| CON-001 | Constraints (仅 UI 调整) |
| CON-002 | Requirement: 单词卡片复选框与单词同行 |
| CON-003 | Requirement: 返回按钮图标化 (currentColor) |
| CON-004 | Constraints (测试通过) |
| DEC-001 | Requirement: 返回按钮图标化 |
| DEC-002 | Requirement: 单词卡片复选框与单词同行 |
| DEC-003 | Requirement: 返回按钮图标化 |
| DEC-004 | Requirement: 返回按钮图标化 |
| OUT-001 | Non-Goals |
| OUT-002 | Non-Goals |
| OUT-003 | Non-Goals |

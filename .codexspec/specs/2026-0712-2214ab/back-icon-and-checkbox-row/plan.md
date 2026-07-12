# Design Document: 返回按钮图标化与单词卡片复选框同行

## Context

功能实现已符合预期，本次仅处理用户反馈的两个 UI 细节：

1. 设置页与查词历史页左上角的“← 返回”按钮需要图标化。
2. 查词历史单词卡片的复选框需要与单词在同一行。

## Goals / Non-Goals

**Goals:**

- 将返回按钮的“←”替换为用户提供的 SVG 图标，保留“返回”文字。
- 将历史卡片复选框移至单词左侧并保持同一行。
- 确保暗色模式下 SVG 图标可见。
- 保持所有既有测试通过。

**Non-Goals:**

- 不改返回按钮位置、尺寸、响应区域。
- 不改复选框逻辑、批量删除逻辑、全选逻辑。
- 不引入图标库或字体库。

## Decisions

### Decision 1: 内联 SVG + currentColor

**Context**: 用户提供了具体 SVG 路径，且希望暗色模式可见。
**Decision**: 将 SVG 以 JSX 内联形式写入 `MainPage/index.jsx` 与 `history-view/index.jsx` 的返回按钮中，设置 `fill="currentColor"`。
**Rationale**: 无新增依赖，通过 CSS `color` 自动适配 light/dark 模式。`.back-btn` 文字色在暗色模式下已知为可辨识颜色。

### Decision 2: 复选框移入 .history-card-header

**Context**: 当前复选框在 `.history-card` 顶层，作为块级元素位于 header 上方。
**Decision**: 将 `<input type="checkbox">` 移动到 `.history-card-header` 内，置于 `.history-card-word` 之前，并通过 `align-items: center` 与 `gap` 保持同一行对齐。
**Rationale**: 最小改动，不破坏现有点击事件结构，保留 `onClick={(e) => e.stopPropagation()}` 防冒泡。

## Architecture

```
┌─────────────────────────────────────────┐
│  MainPage/index.jsx                     │
│  ├─ settings view back button: SVG + 返回  │
│  └─ history view back button: SVG + 返回    │
│                                         │
│  history-view/index.jsx                 │
│  └─ history-card-header                 │
│     └─ checkbox + word + phonetic + play  │
│                                         │
│  MainPage/index.css                     │
│  └─ .back-btn / .back-icon styles       │
│                                         │
│  history-view/index.css                 │
│  └─ .history-card-header / .history-card-checkbox styles │
└─────────────────────────────────────────┘
```

**Covers:** REQ-001, REQ-002

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| 复选框移动后影响 `.history-card.selected` 的左边框 padding | 低 | 保持原 `padding-left` 逻辑，仅微调 header 内部 gap |
| 返回按钮 SVG 在极小宽度下被截断 | 低 | 图标尺寸设为 16px，与文字行高对齐 |
| 既有测试依赖 `.back-btn` 文本内容 | 中 | 先跑全量测试，若失败则同步测试断言 |

## Implementation Notes

- 返回按钮 JSX 结构：`<button className="back-btn"><span className="back-icon"><svg ...></svg></span>返回</button>`。
- 复选框 JSX 位置：从 `.history-card` 顶层移至 `.history-card-header` 的最前面。
- CSS 增加：`.back-icon { display: inline-flex; width: 16px; height: 16px; margin-right: 4px; }`。
- CSS 调整：`.history-card-checkbox { margin: 0 6px 0 0; flex-shrink: 0; }`。

## Requirements Coverage

| Spec Requirement | Plan Coverage |
|------------------|---------------|
| REQ-001 (返回按钮图标化) | Decision 1, Architecture, Implementation Notes |
| REQ-002 (复选框与单词同行) | Decision 2, Architecture, Implementation Notes |

# 批量样式优化需求

## 用户原始请求

1. 将设置页与查词历史页的"返回"按钮箭头替换为指定 SVG 图标；
2. 压缩返回按钮、删除按钮、练习按钮等操作按钮的高度，使其与界面的"搜索"按钮保持同一高度；
3. 缩短单词卡片中复选框与单词之间的距离。

## 已确认需求 (NEED)

- **NEED-1 返回图标替换** (Status: confirmed)：`src/MainPage/index.jsx` 中的 `BackIcon` 组件使用用户**最新提供**的 SVG 路径（`viewBox="0 0 800 800"`，双 `path`）；SVG 使用 `currentColor` 填充，以适配浅色/暗色主题；保留"返回"文字。
- **NEED-2 按钮高度统一** (Status: confirmed)：将返回按钮（`.back-btn`）、历史页底部删除按钮（`.history-del-btn`）、练习按钮（`.history-practice-btn`）的高度调整至与历史页搜索按钮（`.history-search-btn`）一致；统一使用紧凑的 `padding` 与行高，避免视觉上过厚。
- **NEED-3 复选框间距缩短** (Status: confirmed)：缩短 `.history-card-checkbox` 与 `.history-card-word` 之间的间距。

## 约束 (CON)

- **CON-1 主题适配** (Status: confirmed)：所有颜色通过 `currentColor` 或既有 CSS 变量继承，暗色模式 (`prefers-color-scheme: dark`) 下无需新增样式即可自动反色。
- **CON-2 不破坏既有交互** (Status: confirmed)：复选框仍置于单词前同一行，点击卡片仍可加载详情；全选/删除/练习按钮的禁用逻辑保持不变。
- **CON-3 严格 TDD** (Status: confirmed)：按宪法原则 8，先写测试（RED）再实现（GREEN），测试聚焦外部可见行为（DOM 结构、样式类、交互事件）。
- **CON-4 文档同步** (Status: confirmed)：README.md / CLAUDE.md 中测试计数随测试新增同步更新。

## 决策 (DEC)

- **DEC-1 搜索按钮基准** (Status: confirmed)：以历史页搜索按钮 `.history-search-btn` 的紧凑高度作为统一基准（`padding: 4px 8px`）。
- **DEC-2 SVG 清理** (Status: confirmed)：移除用户所提供 SVG 中的 `metadata` 与 `rdf:RDF` 节点，仅保留 `<svg>` 与 `<path>`，并将 `fill="#000000"` 改为 `fill="currentColor"`。
- **DEC-3 复选框间距** (Status: confirmed)：将 `.history-card-checkbox` 的 `margin-right` 从 `6px` 降至 `2px`，同时移除 `margin-top` 与 `align-self: flex-start`，使其与文字行自然居中。

## 输出 (OUT)

- 修改 `src/MainPage/index.jsx` 中的 `BackIcon` 组件 (Status: confirmed)。
- 修改 `src/MainPage/index.css` 中 `.back-btn` 与 `.back-icon` 样式 (Status: confirmed)。
- 修改 `src/history-view/index.css` 中 `.history-del-btn`、`.history-practice-btn`、`.history-card-checkbox` 样式 (Status: confirmed)。
- 新增/更新对应测试文件，确保样式变更可验证 (Status: confirmed)。
- 更新 README.md 与 CLAUDE.md 测试计数 (Status: confirmed)。
- 本地提交到 `feat/ui-style-polish` 分支 (Status: confirmed)。

## 待确认 (OPEN)

- **OPEN-1 "联系按钮" 指向**：用户原文提到"联系按钮"，但当前界面只有"练习"按钮。**已默认按"练习按钮"处理**（用户后续提供最新 SVG 未提出异议）。
- **OPEN-2 返回文字保留**：**已默认保留"返回"文字，仅替换箭头图标**（用户后续提供最新 SVG 未提出异议）。

## 参考：清理后的 BackIcon SVG

移除 `metadata`/`rdf:RDF` 节点，保留 `<svg>` + `<g transform>` + 两个 `<path>`，并将 `fill="#000000"` 改为 `fill="currentColor"`：

```jsx
<svg
  className="back-icon"
  viewBox="0 0 800 800"
  version="1.0"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
  fill="currentColor"
>
  <g transform="translate(106.309616,701.457782) scale(0.075135,-0.075135)" stroke="none">
    <path d="M4993 6800 c-24 -5 -73 -23 -110 -41 ..." />
    <path d="M4917 6415 c-9 -9 -17 -21 -17 -27 ..." />
  </g>
</svg>
```

> 实现时填入用户提供的完整 `d` 属性值（见需求原始消息）。

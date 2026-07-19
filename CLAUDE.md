<!-- markdownlint-disable MD041 -->
@.codexspec/memory/constitution.md

# 英语单词详解 uTools 插件

React + Vite 工程，在 uTools 平台中运行的桌面插件。用户输入英文单词后调用 uTools AI API 生成 7 板块结构化详解，同时以 MCP 工具形式对外暴露查词能力。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:5173)
npm run build    # 生产构建到 dist/
npm test         # 运行 141 个测试 (vitest)
```

## 架构概述

```
src/
├── main.jsx                    # React 入口
├── main.css                    # 全局样式
├── App.jsx                     # 根组件 — utools 生命周期 (onPluginEnter/Out)
├── main-page/
│   ├── index.jsx               # 主界面 + 设置面板 + 查词历史视图切换 (编排组件)
│   └── index.css               # 布局、按钮、结果区、暗色模式
├── prompt-template/
│   ├── index.js                # 7 板块提示词模板 + buildMessages()
│   └── index.test.js
├── ai-call/
│   ├── index.js                # queryWord + queryWordStream (流式)
│   └── index.test.js
├── markdown-view/
│   ├── index.jsx               # 块解析器: 段落/分割线/嵌套列表 + **加粗**
│   └── index.test.jsx
├── model-preference/
│   ├── index.js                # getPreferredModel/setPreferredModel (dbStorage)
│   ├── index.test.js
├── history-preference/
│   ├── index.js                # getSaveQueryHistory/setSaveQueryHistory (dbStorage)
│   └── index.test.js
├── use-word-query/
│   ├── index.js                # useWordQuery Hook — 查询状态机 + 自动保存查词历史(受 saveQueryHistory 开关门控)
│   └── index.test.js
├── query-history/
│   ├── index.js                # 数据层 — saveQueryRecord / getHistoryRecords / getDetailRecord / deleteQueryRecords
│   └── index.test.js
├── history-view/
│   ├── index.jsx               # 查词历史 UI — 搜索、时间筛选、单词卡片列表、详情
│   ├── index.css               # 左栏搜索/卡片样式、右栏详情、暗色模式
│   └── index.test.jsx
├── sync/
│   ├── index.js                # flomo 同步 — get/set 端点、get/set 标签、buildFlomoContent、syncToFlomo
│   └── index.test.js
└── mcp-tools/
    ├── index.js                # createExplainWordHandler 工厂函数 — MCP 工具 handler
    └── index.test.js
```

```
public/preload/
├── services.js                 # Node.js 能力注入 + require tools.js
├── tools.js                    # MCP 工具注册 + createExplainWordHandler
└── prompt.js                   # CommonJS 版 systemPrompt + buildMessages
```

- **依赖方向**：main-page → useWordQuery / markdown-view / model-preference / history-view / sync，useWordQuery → prompt-template / ai-call / query-history，history-view → query-history / markdown-view，无循环依赖
- **MCP 工具**：通过 `utools.registerTool('explain_word', handler)` 在 preload 中注册，handler 流式调用 AI + 每 2s 线性进度上报（15s 上限）
- **AI 调用**：流式模式 (`utools.ai(option, streamCallback)`)，边接收边渲染
- **存储**：`utools.dbStorage` (key-value，模型偏好 `preferredModel` + 保存查词历史开关 `saveQueryHistory` + flomo 端点 `flomoApiEndpoint` + flomo 标签 `flomoTags`) + `utools.db` (文档型，查词历史)
- **渲染**：自定义 markdown 解析器，支持 3 层嵌套列表

## 分支规则（红线）

- **禁止直接提交到 main 分支**，所有修改必须通过 PR 合并
- 新功能：`feat/<功能名>` 分支（如 `feat/mcp-tools`）
- Bug 修复：`bug/<问题描述>` 分支（如 `bug/settings-alignment`）
- 合并前需至少 1 人 review approve（GitHub 分支保护已开启）
- 合并后删除源分支，保持仓库整洁

## 约定

- 新增功能模块遵循 `src/<module>/index.js + index.test.js` 模式
- 模块接口简洁，可 mock 外部依赖独立测试
- 测试原则：只测外部行为，不测实现细节
- CSS 按组件独立编写，暗色模式用 `@media (prefers-color-scheme: dark)` 覆盖
- 版本发布说明记录在 `releases/vX.Y.Z.md`，插件介绍在 `releases/plugin-intro.md`

## Agent skills

### 问题追踪器

问题通过 GitHub Issues 管理，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### 分诊标签

默认标签词汇：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### 领域文档

单上下文布局：仓库根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。

## MCP Tools: code-review-graph

本仓库配置了 code-review-graph MCP 服务器。在探索代码前，优先使用图谱工具代替 Grep/Glob/Read。

### 优先使用图谱工具的场景

- **查找代码**：`semantic_search_nodes` 或 `query_graph` 替代 Grep
- **理解影响范围**：`get_impact_radius` 替代手动追踪 import
- **代码审查**：`detect_changes` + `get_review_context` 替代逐文件阅读
- **查找关系**：`query_graph` 查询调用方/被调用方/导入关系/测试
- **架构问题**：`get_architecture_overview`

### 关键工具

| 工具 | 用途 |
|------|------|
| `detect_changes` | 审查变更 — 风险评分分析 |
| `get_review_context` | 审查上下文 — 包含源码片段 |
| `get_impact_radius` | 了解变更的爆炸半径 |
| `get_affected_flows` | 判断哪些执行路径受影响 |
| `query_graph` | 追踪调用方、被调用方、导入、测试 |
| `semantic_search_nodes` | 按名称或关键词查找函数/类 |
| `get_architecture_overview` | 理解高层代码库结构 |
| `refactor_tool` | 规划重命名、发现死代码 |

### 工作流

1. 文件变更后自动增量更新图谱（通过钩子）
2. 审查变更用 `detect_changes`
3. 理解影响范围用 `get_affected_flows`
4. 检查测试覆盖用 `query_graph pattern="tests_for"`

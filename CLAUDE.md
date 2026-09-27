<!-- markdownlint-disable MD041 -->
@.codexspec/memory/constitution.md

# 英语单词详解 uTools 插件

React + Vite 工程，在 uTools 平台中运行的桌面插件。用户输入英文单词后调用 uTools AI API 生成 7 板块结构化详解，同时以 MCP 工具形式对外暴露查词能力。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:5173) — 只提供前端代码，不注册指令
npm run build    # 生产构建到 dist/
npm run deploy   # 构建 + 复制产物到 public/（uTools 应用商店打包用）
npm test         # 运行 149 个测试 (vitest)
```

> **⚠️ 改了 `public/plugin.json` 后：完全退出 uTools 再重启即可生效**
>
> 依据（实测）：uTools **不把开发插件的 `features` 持久化到数据库**，只保存 `plugin.json`
> 的**路径**，指令列表在**启动时**从该文件现读。自查方法 —— 在
> `%APPDATA%\uTools\database` 中检索：商店版插件有 `//feature/<pluginId>/<code>` 记录，
> 本插件 `ztwpfbsl` **一条都没有**（连旧指令的 label 也搜不到）。
>
> 由此推出两条结论：
>
> 1. **`npm run dev` 与指令注册无关**——它只热更新前端代码，重启它不会让新指令出现；
> 2. **让新 `plugin.json` 生效只需「完全退出 uTools + 重新启动」**，不必卸载重装。
>    「接入开发」只在首次添加项目或项目路径变更时才需要。热键为 `Alt+Space`。
>
> **验证手段**：uTools 开发者工具的本项目详情页有「功能 / 匹配」两个标签，「匹配」页会列出
> 解析到的匹配指令（类型、正则、最少 / 最多字符数）。页面上能看到新指令 = `plugin.json`
> 已被正确解析；此时若主搜索框仍匹配不到，才需要重新「接入开发」（或先「卸载（开发模式）」
> 再接入）。
>
> 另注：`public/` 是 uTools 实际加载的目录，`dist/` 是 `vite build` 产物（构建时会把 `public/`
> 的内容一并拷入）。**`plugin.json` 的唯一源是 `public/plugin.json`**，不要改 `dist/` 下的副本。
> `%APPDATA%\uTools\plugins\*.asar` 中可能残留本插件曾经的商店打包副本（内嵌**旧版**
> `plugin.json`），那是下载缓存而非活动安装，排查时可忽略。

## 架构概述

```
src/
├── main.jsx                    # React 入口
├── main.css                    # 全局样式
├── App.jsx                     # 根组件 — utools 生命周期 (onPluginEnter/Out)
├── App.test.jsx                # 根组件测试 — 进入动作 (action) 透传
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
│   ├── index.js                # flomo 同步数据层 — get/set 端点/标签、buildFlomoContent、syncToFlomo
│   ├── useFlomoSync.js         # 同步状态管理 Hook — syncStatus 状态机 + 定时器生命周期
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
- 分支命名按改动类型：`feat/<desc>`（新功能）、`fix/<desc>`（Bug修复）、`docs/<desc>`（文档）、`chore/<desc>`（版本/构建/杂项）、`refactor/<desc>`（重构）、`test/<desc>`（测试）、`style/<desc>`（样式）
- 提交前 MUST 执行 `git branch --show-current` 确认为分支
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

单上下文布局：仓库根目录 `CONTEXT.md` + `docs/agents/`。详见 `docs/agents/domain.md`。

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

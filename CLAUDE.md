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

> **⚠️ 改了 `public/plugin.json` 后：在 uTools 开发者工具中「卸载（开发模式）」再重新安装**
>
> 已确认的两条事实（均实测）：
>
> 1. **`npm run dev` 与指令注册无关** —— 它只热更新**前端代码**，不注册、也不刷新指令。
>    重启它永远无法让新指令出现（这是最容易走的一段弯路）。
> 2. **让新 `plugin.json` 生效的正确操作**：在 uTools 开发者工具中对本项目
>    「**卸载（开发模式）**」→ 再「**安装（开发模式）**」。**不需要重启 uTools**。
>    呼出热键为 `Alt+Space`。
>
> **⚠️ AI 侧约定（用户明确要求）**：**不要结束 uTools 进程**。uTools 常驻运行、无需手动关闭；
>    AI 修改配置后只需重启本地开发服务（`npm run dev`），uTools 侧的卸载 / 重装由用户自行执行。
>
> **自查手段**：uTools 开发者工具的本项目详情页有「功能 / 匹配」两个标签，「匹配」页会列出解析
> 到的匹配指令（类型、正则、最少 / 最多字符数）。**页面上能看到 = `plugin.json` 已被正确解析**，
> 此时可排除配置语法问题。
>
> **⚠️ 但「看得到」≠「会生效」**（2026-09-27 实测）：曾出现「开发者工具『匹配』页已正确显示指令、
> 主搜索框却匹配不到」的情形（当时只重启了 uTools 进程）。**主搜索框的指令索引只在
> 「安装（开发模式）」时重建**，故改了 `plugin.json` 后 MUST 执行
> 「卸载（开发模式）」→「安装（开发模式）」。该页只能用来排除语法问题，不能用来判断是否生效。
>
> **不要用「磁盘检索」判断指令是否注册**：uTools **不把开发插件的 `features` 持久化到数据库**，
> 只保存 `plugin.json` 的**路径**。商店版插件有 `//feature/<pluginId>/<code>` 记录，本插件
> `ztwpfbsl` 一条都没有（连旧指令的 label 也搜不到）——那是**常态，不构成未注册的证据**。
>
> **匹配指令的配置形态**（对照官方示例 *plugin.json 配置完整示例*）：
>
> - `regex` 指令字段为 `type` / `label`（必须）/ `match`（**含前后斜杠的字符串**）/ `minLength` /
>   `maxLength`；`over` 指令字段为 `type` / `label` / `exclude`（可选）/ `minLength` / `maxLength`。
> - 官方示例的 feature `code` **自带连字符**（`test-regex`、`test-over`、`test-files`），故
>   `code` 中含 `-` 无害；`cmds` 支持**字符串与对象混排**（生产插件如
>   `UtilityTools.jsonOper` 即 `["JSON处理", {regex 对象}]`）。
> - **实测结论（2026-09-27，经 5 轮真机复验）**：`wordMatch` 下曾并行挂 `regex`（label
>   `单词详解`）与 `over`（label `单词详解（复制即查）`）作 A/B 探针。结论：**`regex` 型在本机
>   从未生效，`over` 型是唯一生效路径**。
>   判定依据是**控制变量实验**：删除 `over` 后候补即消失（第 4 ↔ 5 轮唯一变量为 `over` 的存删，
>   其余配置逐字一致）。
>   ⚠️ **不要用「候补 label 与某条指令的 label 一致」来判定生效指令** —— uTools 对同一 feature
>   的候补显示 label **并非取被命中指令自身的 label**（第 4 轮据此误判过一轮）。
> - **当前形态**：`cmds` = `["单词详解", { "type": "over", "label": "单词详解",
>   "exclude": "/[^a-zA-Z]/", "minLength": 2, "maxLength": 100 }]`。`over` 的 `exclude` 承担
>   「仅单个英文单词」的语义（等价于原 `^[a-zA-Z]+$` 且更严格——空格亦被排除）。
> - **⚠️ 代码侧联动（易漏）**：`onPluginEnter` 的 `action.type` **随匹配类型变化**（`over` 型即
>   `'over'`，`regex` 型即 `'regex'`）。**改 `plugin.json` 的匹配类型时 MUST 同步
>   `src/main-page/index.jsx` 的守卫**（当前为 `enterAction.type !== 'over'`），否则会出现
>   「候补能出现、但进入后不自动查询」的隐性故障。
>
> **🚫 `regex` 型不可用于「任意匹配」（2026-09-27 解包 `app.asar` 确证，本插件场景的定论）**：
> 构建索引时 `regex` 走 `H(match, cmd)` **双参数**路径，会做「是否属于任意匹配」的启发式判定，
> 判定为真则 `H` 返回 `null` → 该指令**永不入索引**（表现为「开发者工具『匹配』页能看到、
> 主搜索框永远搜不到」）；`over` 走 `H(exclude)` **单参数**路径，**无任何判定门槛**、无条件入索引。
> 判定方式为**随机样本探测**：凡能命中「随机小写字母串」（`minLength<2` 时 1 个；`<3` 时 2 个；
> 或 3~16 长度区间内连续 2 次命中）或「随机汉字串」者一律被拒。
> 实测 `/^[a-zA-Z]+$/`、`/[a-zA-Z]+/`、`/^[a-zA-Z]{3,}$/` 均 **500/500** 被拒——
> **「匹配任意字母」与判定规则直接冲突，调 `match` / `minLength` / `maxLength` 均无法绕开**。
> 故本插件 MUST 继续使用 `over` + `exclude`，**不得回退到 `regex`**。
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

# 英语单词详解 uTools 插件

在 uTools 平台中运行的英语单词详解插件。输入英文单词后，通过 uTools AI API 生成包含音标、词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析 7 个板块的结构化详解。同时以 MCP 工具形式对外暴露查词能力，供外部 AI Agent 调用。

## 触发方式

**功能指令** — 在 uTools 搜索框输入以下任意关键词进入插件：

- `explain` / `查词` / `word` / `vocabulary`

**匹配指令** — 主输入框内容为单个英文单词（仅字母，长度 2~100）时，候选中出现「单词详解」；选中后自动预填并查询该单词。复制一个单词后直接呼出 uTools 即可使用。为免候补重复，`explain` / `word` / `vocabulary` 这三个既有功能指令关键词**不会**再额外触发匹配指令。

**首页查词** — 输入框接受单个英文单词：英文字母，可含连字符与撇号（`well-known`、`don't`），最长 100 字符。输入含空格、数字、中文或超长内容时不会调用 AI，界面会给出提示，并同时清空上一次的查询结果。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 生产构建 → dist/（构建前自动清空 public/ 下的历史产物）
npm run build

# 构建并复制产物到 public/（开发模式本地安装用）
npm run deploy
```

发布到 uTools 插件市场：

1. 执行 `npm run build`
2. 在 uTools 开发者工具中点击「发布」→ 选择 **`dist/`** 目录（`plugin.json` 及全部运行资源所在处）
3. 填写版本号、版本说明、插件介绍与截图，提交审核

> `dist/` 由 `vite build` 生成，内容为构建产物 + 从 `public/` 拷入的 `plugin.json` / `logo.png` / `preload/`。
> 构建前 `prebuild` 会先清空 `public/assets` 与 `public/index.html`，避免历史产物被 Vite 的
> `copyPublicDir` 回灌进发布目录。**`deploy` MUST 经 `npm run build` 调用**（不可直接写 `vite build`），
> 否则 `prebuild` 生命周期不触发、清空失效。

开发流程：
1. 本地修改代码后，启动开发服务器 `npm run dev`
2. 在 uTools 中打开"uTools开发者工具"插件
3. 点击"卸载 (开发模式)"按钮（将当前工程从 uTools 开发模式卸载）
4. 点击"安装 (开发模式)"按钮（将当前工程以开发模式重新安装到 uTools）
5. 点击"打开"按钮（运行 `plugin.json` 配置的首个功能指令），验证实际运行效果

> 改 `public/plugin.json` 后同样需要「卸载（开发模式）」→「安装（开发模式）」：`npm run dev`
> 只热更新前端代码、不刷新指令，重启 uTools 也无效。平台约束与实测取证见 `docs/utools-platform.md`。

## 架构

- **依赖方向**（单向、无环）：`main-page → useWordQuery / markdown-view / model-preference / history-view / sync / word-audio`；`useWordQuery → prompt-template / ai-call / query-history`；`history-view → query-history / markdown-view / word-audio`。MUST NOT 引入循环依赖。
- **查词入口**：首页「查询」按钮 / Enter 与匹配指令进入后自动查询，两条入口汇于唯一的 `useWordQuery().query()`，统一经 `normalizeWord()`（去首尾空格 + 转小写）→ `validateWord()` 后调用 AI，使 AI 提示词、查词历史与 flomo 笔记标题三处一致。
- **MCP 工具**：在 `public/preload/` 中经 `utools.registerTool('explain_word', handler)` 注册，handler 流式调用 AI + 每 2s 线性进度上报（单次上限 15s）。preload 运行于主进程（CommonJS），`src/` 运行于 webview（ESM），两份实现 MUST 语义一致、同步修改。
- **AI 调用**：流式模式（`utools.ai(option, streamCallback)`），每个 chunk 局部更新 state，边接收边渲染。
- **渲染**：自定义 markdown 解析器，支持 3 层嵌套列表；`---` 渲染为分割线，`**粗体**` 加粗。
- **存储**：`utools.dbStorage`（偏好：`preferredModel` / `saveQueryHistory` / `flomoApiEndpoint` / `flomoTags`）+ `utools.db`（查词历史：摘要文档 + 详情文档）。
- ⚠️ **性能红线**：`utools.dbStorage.getItem()` 是**同步 IPC**（`ipcRenderer.sendSync` 配对），读取期间**渲染进程完全阻塞**。契约：① 禁止在 render / mount 期**批量**读取；② 同一 key 每次挂载**只读一次**（用 ref 复用）；③ 仅子页面使用的数据 MUST 延迟到进入该页面时再加载 —— 当前 `allAiModels()`（内含全库前缀扫描 + 远程 `/model/list` 请求）与 `flomoTags` 已下放至设置页加载。
- ⚠️ **匹配指令路径的敏感性**：经匹配指令进入时，启动期开销全部落在「进入之后」的感知窗口内，而手动进入再点查询则无感。因此**启动路径上的任何额外 IO / 请求都会被用户直接感知为「进去后卡住」**。

## 项目结构

```
src/
├── main.jsx                    # webview 入口（挂载 React 根）
├── main.css                    # 全局样式（含暗色模式基础变量）
├── App.jsx                     # 根组件
├── App.test.jsx                # 根组件测试（进入动作透传）
├── plugin-manifest.test.js     # plugin.json 契约守护（匹配区间 / exclude 与关键词不重叠 / tools 声明）
├── main-page/                  # 主界面 + 设置面板
├── prompt-template/            # 7 板块提示词模板
├── ai-call/                    # AI 调用封装（流式）
├── markdown-view/              # Markdown 富文本渲染
├── model-preference/           # 模型偏好持久化
├── history-preference/         # 保存查词历史开关持久化
├── use-word-query/             # 查询状态机 Hook（输入归一化 + 合法英文单词校验 + 自动保存查词历史，受 saveQueryHistory 开关门控）
├── query-history/              # 查词历史数据层（save/getHistoryRecords/getDetailRecord/deleteQueryRecords）
├── history-view/               # 查词历史 UI（搜索、时间筛选、单词卡片、详情）
├── word-audio/                 # 英文单词朗读 Hook（SpeechSynthesis，主界面与历史共用）
├── mcp-tools/                  # MCP 工具 handler
├── sync/                       # flomo 同步（index.js 数据层 + useFlomoSync.js Hook）
assets/
├── logo/                       # 插件 Logo 源文件
├── flomo_favicon.ico           # flomo 同步按钮图标
public/
├── logo.png                    # uTools 插件 Logo（运行时）
├── plugin.json                 # 插件配置（唯一源；dist/ 下副本为构建产物）
└── preload/
    ├── services.js             # Node.js 能力注入 + require tools.js
    ├── tools.js                # MCP 工具注册 + createExplainWordHandler
    └── prompt.js               # CommonJS 版 systemPrompt + buildMessages
dist/                           # 生产构建产物（发布到 uTools 插件市场时选择该目录）
docs/                           # uTools 平台笔记、PRD、agent 工具说明
.codexspec/                     # CodexSpec 治理工作区（宪法 / 规格 / 模板）
```

## 分支与提交规范（红线）

- **禁止直接提交到 `main`**，所有修改 MUST 经 PR 合并（仓库已开启分支保护）
- 分支命名按改动类型：`feat/`（新功能）、`fix/`（缺陷）、`docs/`（文档）、`chore/`（版本 / 构建 / 杂项）、`refactor/`（重构）、`test/`（测试）、`style/`（样式）
- 提交信息遵循 Conventional Commits（`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`）
- 提交前 MUST 执行 `git branch --show-current` 确认为分支；合并后删除源分支
- 完整治理条款见 `.codexspec/memory/constitution.md`

提交前检查：`npx standard` 通过、`npm test` 全绿、无新增循环依赖、preload（CommonJS）与 `src`（ESM）逻辑同步、新增 / 修改模块已配 `index.test.js`、文档测试计数与结构树已同步。

## 相关文档

| 文档 | 内容 |
|------|------|
| `CONTEXT.md` | 领域术语与边界 |
| `docs/utools-platform.md` | uTools 平台契约与实测取证（指令注册、`over` / `regex`、关键词重叠） |
| `docs/agents/` | issue-tracker / triage-labels / domain / code-review-graph |
| `docs/prd-*.md` | 产品需求文档（v0.6 主功能 / v0.7 MCP 工具 / 历史 Issue 切片） |
| `.codexspec/memory/constitution.md` | 项目宪法（最高权威） |
| `releases/` | 版本发布说明与插件介绍 |

## 技术栈

- Vitest 4 + Testing Library (227 个测试)
- uTools AI API（流式调用）
- uTools dbStorage（偏好持久化）
- uTools MCP Tools（registerTool）

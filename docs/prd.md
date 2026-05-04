# PRD — 英语单词详解 uTools 插件

## Problem Statement

用户在桌面端（Windows/Mac/Linux）工作中遇到不认识的英文单词时，需要快速获取该单词的完整解释——不仅仅是中文翻译，而是包含音标、多义项解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧和同义词辨析的结构化详解。现有方案需要打开浏览器、访问词典网站或切换到大模型对话窗口，流程繁琐、中断工作流。

## Solution

开发一个 uTools 插件，用户通过快捷键唤起 uTools 后输入触发词（`explain`/`查词`/`word`/`vocabulary`），进入插件主界面。在输入框中输入单词，点击查询后调用 uTools 内置 AI API 生成 7 板块结构化单词详解，渲染为富文本展示。提供设置页面（齿轮图标进入），用户可在下拉框中选择调用哪个 AI 模型，偏好通过 uTools 本地存储持久化。

## User Stories

1. 作为英语学习者，我想输入一个英文单词并查看其完整详解（音标、词义、例句及中文翻译），以便深入理解单词的用法和语境。
2. 作为英语学习者，我想看到单词的词源故事和演变路径，以便通过词源理解加深记忆。
3. 作为英语学习者，我想看到单词的记忆技巧（词根拆解法、形象联想法），以便更高效地背单词。
4. 作为英语学习者，我想看到目标单词与近义词的辨析，以便在写作或口语中准确选词。
5. 作为一名在工作中遇到英文单词的用户，我想通过 uTools 快捷键快速唤出插件查词，而不需要切换到浏览器或打开其他应用。
6. 作为用户，我想在设置中选择自己偏好的大模型（如 DeepSeek、GPT 等），以便根据实际需求平衡成本和效果。
7. 作为用户，我选择的模型偏好应在下次打开插件时自动生效，无需重复设置。
8. 作为用户，我看到的单词解释应该格式清晰——板块标题加粗、板块之间用分割线隔开、列表项正确缩进嵌套，视觉上一目了然。
9. 作为用户，查询过程中应边接收边显示（流式输出），不需要长时间等待后才看到全部结果。

## Implementation Decisions

### 架构

- **单一 feature**：`plugin.json` 仅注册一个 `explain` feature，用 `explain`、`查词`、`word`、`vocabulary` 作为触发词。删除初始化模板中 `hello`、`read`、`write` 三个功能及对应文件。
- **主界面内嵌设置页**：齿轮图标切换当前页面到设置模式，不注册独立 feature。
- **React + Vite**：沿用 uTools 开发者工具初始化的工程结构。

### 模块

| 模块 | 职责 | 可独立测试 |
|---|---|---|
| prompt 模板 | 将单词详解格式模板（源自 word-explainer SKILL.md）转换为 AI system prompt | 是 |
| AI 调用 | 封装 `utools.ai()`，接收 messages 数组，返回 AI 生成的 markdown 文本 | 是 |
| 模型偏好存储 | 通过 `utools.db` 读写用户选择的模型 ID | 是 |
| Markdown 渲染 | 将 markdown 字符串渲染为 React 富文本组件 | 是 |
| 设置面板 | 下拉框展示可用模型列表，读取/保存用户偏好 | 需集成测试 |
| 主界面 | 单词输入框 + 查询按钮 + 结果展示区 + 齿轮图标 | 需集成测试 |

### API 依赖

- `utools.ai(option, streamCallback?)` — 流式调用（带 streamCallback），`option.model` 不传时使用 uTools 默认模型
- `utools.allAiModels()` — 获取可用模型列表（id、label、description、icon、cost）
- `utools.dbStorage.setItem/getItem` — 存储/读取用户模型偏好
- `utools.onPluginEnter` — 插件入口事件

### 渲染规则

- AI 返回的 markdown 文本解析为富文本 HTML
- 板块标题（`**N、xxx**`）加粗显示
- `---` 分割线渲染为 `<hr>` 视觉分割线
- `- ` 无序列表项按缩进层级渲染为嵌套 `<ul>/<li>`，支持 3 层嵌套，每层使用不同列表符号（disc/circle/square）
- 结果区域使用 flex 弹性布局 + `overflow-y: auto`，内容过长时区域内滚动，不撑开插件窗口
- `window.services` 中现有的 `readFile`/`writeTextFile`/`writeImageFile` 保留但本功能不使用

## Testing Decisions

- 重点测试 **prompt 模板**、**AI 调用**、**Markdown 渲染**、**模型偏好存储** 四个深度模块 — 它们接口简单、不常变、可 mock 外部依赖。
- 测试原则：只测外部行为，不测实现细节。
- prompt 模板测试：给定一个单词，验证返回的 messages 数组结构正确（role、content），system message 包含 7 板块格式要求。
- AI 调用测试：mock `utools.ai`，验证接收的 messages 格式正确，返回的 mock 文本被正确传递。
- Markdown 渲染测试：给定 markdown 输入，验证输出的 React 组件包含预期的分割线、加粗元素。
- 模型偏好存储测试：mock `utools.db`，验证 setItem/getItem 的 key 和 value 正确。

## Out of Scope

- 查询历史记录（不持久化用户查过的单词）
- 短语、句子、中文词汇查询
- 离线词典或本地词库
- 插件应用市场发布（暂不发布）
- 多语言界面（仅支持中文界面）
- 发音/语音朗读功能

## Further Notes

- uTools 开发者文档地址：https://www.u-tools.cn/docs/developer/docs.html，开发中遇到 API 疑问可通过此入口查阅对应章节（plugin.json 配置、preload、Node.js、事件、窗口、输入等）
- System prompt 源自已有 word-explainer Claude Code skill（`C:\Users\A69721\.claude\skills\word-explainer\SKILL.md`），原样搬运为 AI system prompt
- 插件 logo 沿用初始化模板生成的 `public/logo.png`，后续可替换

# CONTEXT — 英语单词详解插件

一个基于 uTools 平台的英文单词详解插件，通过 uTools AI API 调用大模型，按固定 7 板块格式输出单词的完整解释。

## 领域术语

- **查词**：用户在主界面输入框输入一个英文单词并触发查询的行为。输入内容必须是单个英文单词，不支持短语、句子或中文词汇。
- **7 板块格式**：单词解释的固定输出结构，包含：词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析。每个板块之间以分割线隔开，标题加粗。
- **触发词**：用户在 uTools 搜索框中输入的关键词，用于进入插件主界面。包括 `explain`、`查词`、`word`、`vocabulary`。
- **匹配指令**：`plugin.json` 中 `features[].cmds[]` 的对象形式指令，按输入内容形态自动匹配，无需用户键入关键词。本插件注册一条 `over` 型指令（`label` 为「单词详解」，`exclude` 为 `/[^a-zA-Z]|^(explain|word|vocabulary)$/i`，长度 2~100），即主输入框为单个纯英文单词时命中；与功能指令（`cmds` 的字符串项）的区别在于后者要求键入固定关键词。uTools 只在「安装（开发模式）」时重建主搜索框的指令索引。
- **输入归一化**：所有查词入口统一执行的输入处理——去除首尾空格并转为小写。首页「查询」按钮 / Enter 与匹配指令路径均调用 `normalizeWord()`（`use-word-query`），确保查询内容、查词历史记录与 flomo 笔记标题三处一致。
- **朗读**：调用浏览器 `SpeechSynthesis`（`en-US` 语音）朗读英文单词。封装为 `src/word-audio/` 的 `useWordAudio()` Hook，供主界面结果区（内联在音标行末尾）与查词历史卡片共用。
- **模型选择**：用户在设置页面（齿轮图标进入）从下拉框中选择调用哪个 AI 模型。模型列表通过 `utools.allAiModels()` 获取。不显式指定 model 时使用 uTools 默认模型。用户选择的模型偏好通过 `utools.dbStorage` 持久化存储。
- **AI 输出模式**：流式逐段输出（`utools.ai` 带 streamCallback），每次收到 chunk 时更新 React state，边接收边渲染，改善用户感知的响应速度。
- **富文本渲染**：AI 返回的 markdown 文本解析为 HTML 富文本展示，而非纯文本。标题加粗，`---` 渲染为分割线，`- ` 无序列表项根据缩进层级渲染为嵌套 `<ul>/<li>`。
- **查词提示词模板**：发送给 AI 的 system prompt，源自 Claude Code skill 的 SKILL.md，定义了 7 板块的精确格式、例句要求、缩进规则、加粗规则等。
- **结构化摘要**：AI 输出末尾附加的 `===JSON===` 标记行，包含 {word, phonetic, chineseMeanings} 结构。用于提取单词摘要，提取后从展示内容和详情文档中剥离，用户不可见。
- **查词历史**：用户查过的单词记录。通过 `utools.db` 持久化存储，包含摘要文档（`history_summary`）和详情文档（`detail/<timestamp>_<word>`）。
- **摘要文档**：`_id="history_summary"` 的单一文档，存储所有查词记录的摘要数组。每条含 word、phonetic、chineseMeanings、timestamp、detailDocId。最大 5000 条，超出时删除最旧记录。
- **详情文档**：`_id="detail/<timestamp>_<word>"` 的独立文档，存储单条单词的完整 7 板块 Markdown 解释。同词重新查询时先删除旧文档再创建新文档。总数上限 5000 个。
- **历史时间筛选**：按 1d/3d/7d/15d/30d/all 过滤查词历史，默认 7 天。
- **flomo 同步**：将查词结果一键同步到 flomo 笔记。支持自定义 API 端点（通过设置页配置，无默认值），笔记标签默认 `#English/vocabulary`。首页查词结果和查词历史详情页均可触发同步。按钮下方有状态文字提示（同步中/已同步/同步失败）。

## 与 uTools 平台的关系

- 依赖 `utools.ai()` 调用大模型生成解释内容（不依赖外部 API Key）
- 依赖 `utools.allAiModels()` 获取可用模型列表（**仅进入设置页时调用** —— 其内部含全库前缀扫描与远程 `/model/list` 请求，放在启动路径会阻塞主界面）
- 依赖 `utools.dbStorage` 存储用户模型偏好（**其 `getItem` 为同步 IPC，读取期间渲染进程阻塞**：同一 key 每次挂载只读一次，仅设置页使用的数据延迟到进入设置页时加载）
- 依赖 `utools.registerTool()` 将查词能力注册为 MCP 工具，供外部 AI Agent 调用
- 依赖 `utools.db.put/get/remove/allDocs` 读写查词历史（摘要文档 + 详情文档）
- 通过 `plugin.json` 的 `features` 配置功能指令（`cmds` 字符串项）与匹配指令（`cmds` 对象项，本插件用 `over` 型），通过 `tools` 字段声明 MCP 工具元数据

## 边界

- 不对接外部词典 API 或本地词库 — 所有内容由 AI 生成
- 查词历史通过 `utools.db` 持久化，摘要文档上限 5000 条，详情文档上限 5000 个，同词多次查询覆盖更新
- 仅 UI 路径记录查词历史，MCP 工具调用不保存历史
- 不支持短语、句子或中文输入 — 仅单个英文单词。匹配指令对含空格、数字、连字符等非纯字母内容的输入**整条排除**，长度限 2~100（故单字母单词 `a`、`I` 亦不命中）
- 匹配指令不与功能指令关键词重叠 — `exclude` 锚定排除 `explain` / `word` / `vocabulary`，避免输入这些关键词时同一插件出现两条候补（uTools 不合并二者，且功能指令按「输入是关键词的子串」命中）。由 `src/plugin-manifest.test.js` 守护

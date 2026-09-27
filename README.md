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
> 构建前会先清空 `public/assets` 与 `public/index.html`，避免历史产物被 Vite 的 `copyPublicDir`
> 回灌进发布目录。

开发流程：
1. 本地修改代码后，启动开发服务器 `npm run dev`
2. 在 uTools 中打开"uTools开发者工具"插件
3. 点击"卸载 (开发模式)"按钮（将当前工程从 uTools 开发模式卸载）
4. 点击"安装 (开发模式)"按钮（将当前工程以开发模式重新安装到 uTools）
5. 点击"打开"按钮（运行 `plugin.json` 配置的首个功能指令），验证实际运行效果

## 项目结构

```
src/
├── App.jsx                     # 根组件
├── App.test.jsx                # 根组件测试（进入动作透传）
├── main-page/                   # 主界面 + 设置面板
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
├── sync/                       # flomo 同步（数据层 + useFlomoSync Hook）
assets/
├── logo/                       # 插件 Logo 源文件
├── flomo_favicon.ico           # flomo 同步按钮图标
public/
├── logo.png                    # uTools 插件 Logo（运行时）
├── plugin.json                 # 插件配置
└── preload/                    # Node.js preload 脚本
dist/                           # 生产构建产物（发布到 uTools 插件市场时选择该目录）
```

## 技术栈

- Vitest 4 + Testing Library (227 个测试)
- uTools AI API（流式调用）
- uTools dbStorage（偏好持久化）
- uTools MCP Tools（registerTool）

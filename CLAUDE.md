# 英语单词详解 uTools 插件

React + Vite 工程，在 uTools 平台中运行的桌面插件。用户输入英文单词后调用 uTools AI API 生成 7 板块结构化详解，同时以 MCP 工具形式对外暴露查词能力。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:5173)
npm run build    # 生产构建到 dist/
npm test         # 运行 58 个测试 (vitest)
```

## 架构概述

```
src/
├── main.jsx                    # React 入口
├── main.css                    # 全局样式
├── App.jsx                     # 根组件 — utools 生命周期 (onPluginEnter/Out)
├── MainPage/
│   ├── index.jsx               # 主界面 + 设置面板 (编排组件)
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
│   └── index.test.js
├── use-word-query/
│   ├── index.js                # useWordQuery Hook — 查询状态机
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

- **依赖方向**：MainPage → useWordQuery / markdown-view / model-preference，useWordQuery → prompt-template / ai-call，无循环依赖
- **MCP 工具**：通过 `utools.registerTool('explain_word', handler)` 在 preload 中注册，handler 流式调用 AI + 每 2s 线性进度上报（15s 上限）
- **AI 调用**：流式模式 (`utools.ai(option, streamCallback)`)，边接收边渲染
- **存储**：`utools.dbStorage` (key-value)，key 为 `preferredModel`
- **渲染**：自定义 markdown 解析器，支持 3 层嵌套列表

## 约定

- 新增功能模块遵循 `src/<module>/index.js + index.test.js` 模式
- 模块接口简洁，可 mock 外部依赖独立测试
- 测试原则：只测外部行为，不测实现细节
- CSS 按组件独立编写，暗色模式用 `@media (prefers-color-scheme: dark)` 覆盖

## Agent skills

### 问题追踪器

问题通过 GitHub Issues 管理，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### 分诊标签

默认标签词汇：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### 领域文档

单上下文布局：仓库根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。

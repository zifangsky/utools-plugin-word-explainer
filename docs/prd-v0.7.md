# PRD — MCP 工具：将查词能力暴露给 AI Agent

## Problem Statement

当前插件仅支持用户在 uTools 主界面手动输入单词查询解释，无法被外部 AI Agent（如 Claude Code、OpenClaw 等）调用。uTools v7.6.0 已支持将插件能力以 MCP 标准化工具形式暴露给 AI Agent，插件需要对接这一能力。

## Solution

新增一个 MCP 工具 `explain_word`，接收英文单词作为输入，返回包含 7 板块结构化详解的结果对象。AI Agent 可直接调用该工具获取单词解释，无需打开插件 UI。

## User Stories

1. 作为 AI Agent，我想通过 MCP 协议调用 `explain_word` 工具查询英文单词的完整解释，以便在对话中直接向用户提供查词结果。
2. 作为 AI Agent，调用工具时只需传入单词参数，无需了解底层 AI 模型选择逻辑，模型偏好由插件内部静默处理。
3. 作为用户在 AI 对话中查词时，调用应在合理时间内返回完整结果，不被超时中断。
4. 作为 AI Agent，调用返回的结果应包含查询的单词和完整的 markdown 格式解释，以便后续解析和展示。
5. 作为插件开发者，MCP 工具 handler 应可独立测试，通过工厂函数注入 mock 依赖，不依赖真实的 uTools API。

## Implementation Decisions

### 注册方式

- 使用 `utools.registerTool(name, handler)` 编程式注册，在 `preload.js` 入口级调用
- 同时在 `plugin.json` 的 `tools` 字段声明工具元数据（name、description、inputSchema）
- 两者 `name` 必须严格一致

### 工具定义

- **工具名称**：`explain_word`
- **输入参数**：`word`（必填，string）— 单个英文单词
- **返回值**：结构化对象 `{ word: string, content: string }`
  - `word`：查询的单词
  - `content`：7 板块 markdown 格式解释

### 流式调用与进度上报

- 底层复用流式 `utools.ai(option, streamCallback)` 逐段拼接内容，避免超时
- 假设 15s 为输出上限，每 2s 通过 `ctx.sendProgress` 上报一次进度：
  - `progress` = `Math.min(Math.round(elapsed / 15000 * 100), 99)` — 到达 15s 上限前封顶 99
  - `total` = `100`
  - `message` = `"单词解释生成中..."`
- 流式完成时上报 `{ progress: 100, total: 100 }`
- `ctx.sendProgress` 可能不存在（取决于 MCP 客户端能力），调用前做可选判断

### 模块结构

| 模块 | 职责 | 可独立测试 |
|---|---|---|
| MCP Tool Handler（新增） | `createExplainWordHandler(aiClient, modelPreference)` 工厂函数，封装流式 AI 调用 + 进度上报 + 结果组装 | 是 |
| Preload 注册入口（新增） | 组装真实 `utools.ai` + `utools.dbStorage` 依赖，调用 `registerTool` | 否 |
| plugin.json（修改） | 新增 `tools` 字段声明工具元数据 | 否 |

### 依赖关系

- Tool handler 复用 `prompt-template` 的 `buildMessages()` 构建 system prompt + user message
- Tool handler 通过工厂函数注入 `aiClient`（包装 `utools.ai` 流式调用）和 `modelPreference`（读写用户偏好模型）
- `model` 参数不暴露给 Agent，由 handler 内部从 `dbStorage` 读取

### 架构约束

- handler 核心逻辑放在 `src/` 下以便 Vite 构建和 Vitest 测试
- 遵循现有 `src/<module>/index.js + index.test.js` 模式
- `preload.js` 只做依赖组装和 `registerTool` 调用，不含业务逻辑

## Testing Decisions

- 重点测试 **MCP Tool Handler** 模块
- 通过 `createExplainWordHandler` 工厂函数注入 mock `aiClient` 和 mock `modelPreference`，验证：
  - 参数正确透传（word 传给 buildMessages，model 从 preference 读取）
  - 流式 chunk 逐段拼接为完整 content
  - 返回值结构 `{ word, content }` 正确
  - AI 调用失败时错误正确抛出
  - `ctx.sendProgress` 每 2s 上报，progress 基于 elapsed/15000 线性增长，完成时 progress=100
  - 空 word 参数的行为（由 handler 或 prompt-template 层处理）
- 不测试 preload.js 中的 registerTool 注册调用（纯组装，无逻辑）

## Out of Scope

- 向 Agent 暴露模型选择能力
- 多个 MCP 工具（仅 `explain_word` 一个）
- MCP 工具调用日志或统计
- 工具调用权限控制

## Further Notes

- uTools MCP 工具文档：`local_test/uTools-MCP-工具官方文档.md`
- `utools.registerTool()` 必须在页面初始化阶段执行（preload.js 或与 onPluginEnter 同级），不可写在 onPluginEnter 内部
- `ctx.sendProgress` 可能不存在，调用前需做可选判断 `ctx.sendProgress?.()`
- 工具返回值统一使用结构化对象，避免裸字符串

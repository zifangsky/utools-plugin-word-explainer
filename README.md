# 英语单词详解 uTools 插件

在 uTools 平台中运行的英语单词详解插件。输入英文单词后，通过 uTools AI API 生成包含音标、词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析 7 个板块的结构化详解。同时以 MCP 工具形式对外暴露查词能力，供外部 AI Agent 调用。

## 触发方式

在 uTools 搜索框中输入以下任意关键词进入插件：

- `explain` / `查词` / `word` / `vocabulary`

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
```

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
├── main-page/                   # 主界面 + 设置面板
├── prompt-template/            # 7 板块提示词模板
├── ai-call/                    # AI 调用封装（流式）
├── markdown-view/              # Markdown 富文本渲染
├── model-preference/           # 模型偏好持久化
├── history-preference/         # 保存查词历史开关持久化
├── use-word-query/             # 查询状态机 Hook（含自动保存查词历史，受 saveQueryHistory 开关门控）
├── query-history/              # 查词历史数据层（save/getHistoryRecords/getDetailRecord/deleteQueryRecords）
├── history-view/               # 查词历史 UI（搜索、时间筛选、单词卡片、详情）
├── mcp-tools/                  # MCP 工具 handler
├── sync/                       # flomo 同步（偏好存取 + 内容构建 + API 调用）
```

## 技术栈

- Vitest 4 + Testing Library (135 个测试)
- uTools AI API（流式调用）
- uTools dbStorage（偏好持久化）
- uTools MCP Tools（registerTool）

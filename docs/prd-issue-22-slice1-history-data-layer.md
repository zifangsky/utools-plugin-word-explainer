# PRD: Slice 1 — 查词历史数据层 + 自动保存 + 基础历史 UI

> **来源**: [GitHub Issue #22](https://github.com/zifangsky/utools-plugin-word-explainer/issues/22)
> **标签**: `needs-triage`
> **创建时间**: 2026-07-05
> **阻塞关系**: 无前置依赖，可立即启动

---

## 1. 概述

实现完整的端到端查词历史功能：用户在 UI 界面查词后自动保存记录，并提供基础的历史查看界面。

---

## 2. 功能需求

### 2.1 数据层（`src/query-history/`）

#### 2.1.1 结构化摘要输出指令

- **文件**: `src/prompt-template/index.js`
- **变更**: 在 `systemPrompt` 末尾追加 `===JSON===` 结构化摘要输出指令
- **指令内容**: AI 在全文末尾输出一行 `===JSON===`，后接一行 JSON，格式如下：

```json
{"word":"hello","phonetic":"həˈləʊ","chineseMeanings":["你好","喂"]}
```

#### 2.1.2 数据层核心模块

- **文件**: `src/query-history/index.js`（新建）

| 函数 | 职责 |
|------|------|
| `saveQueryRecord(db, word, phonetic, chineseMeanings, content, model)` | 保存查词记录 |
| `getHistoryRecords(db, timeFilter)` | 获取历史记录列表 |
| `getDetailRecord(db, detailDocId)` | 按 ID 读取详情文档 |
| `parseJsonFromContent(content)` | 从 AI 响应提取并剥离 `===JSON===` 标记 |

#### 2.1.3 `saveQueryRecord` 详细逻辑

1. 创建 `detail/<timestamp>_<word>` 详情文档
2. 更新或创建 `history_summary` 摘要文档
3. 同词覆盖：若已存在同词记录，删除旧 detail 文档 → 移除旧摘要条目 → 插入新条目至最前
4. 5000 条上限管理：超出上限时删除最旧的 summary 条目及其关联 detail 文档（联动删除）
5. 返回 `{ detailDocId }`

#### 2.1.4 `parseJsonFromContent` 容错

- 正常情况：从 `===JSON===` 后提取 JSON 并剥离，返回 `{ parsed, cleanContent }`
- 无 JSON 标记时：返回 `null`
- JSON 格式异常时：返回 `null`

### 2.2 自动保存（`src/use-word-query/`）

- **文件**: `src/use-word-query/index.js`（修改）
- **触发时机**: query 成功后（流式完成时）
- **流程**:
  1. 解析 `fullContent` → `parseJsonFromContent(fullContent)`
  2. 解析成功 → `saveQueryRecord(db, ...)` → `setResult(cleanContent)`
  3. 解析失败 → 静默跳过保存 → `setResult(fullContent)`

### 2.3 历史 UI（`src/history-view/` + `src/MainPage/`）

#### 2.3.1 HistoryView 组件

- **文件**: `src/history-view/index.jsx` + `index.css`（新建）
- **布局**: 左右分栏
  - 左栏（~1/4 宽度）：单词卡片列表，每张卡片显示单词 + 音标 + 中文含义 + 时间
  - 右栏（~3/4 宽度）：选中前显示占位文字，选中后通过 `MarkdownView` 渲染完整解释
- **交互**: 卡片点击选中高亮

#### 2.3.2 MainPage 修改

- **文件**: `src/MainPage/index.jsx` + `index.css`（修改）
- **变更**:
  - 标题栏新增历史图标（📖）
  - 三视图切换：主界面 / 设置 / 历史
  - 历史面板显示返回箭头按钮
  - 暗色模式适配

#### 2.3.3 组件复用

- 复用现有 `<MarkdownView>` 组件渲染详情内容

---

## 3. 验收标准

- [ ] 查词后自动保存到 `utools.db`，用户不可见 JSON 尾缀
- [ ] 点击 📖 图标进入历史视图，看到左右分栏布局
- [ ] 左栏显示已查单词的卡片（单词 + 音标 + 中文含义 + 时间）
- [ ] 点击卡片后右栏加载并渲染完整 7 板块解释
- [ ] 同词重复查询更新已有记录（移至最前、更新内容），不产生重复条目
- [ ] 超过 5000 条时自动淘汰最旧记录
- [ ] 所有 58+ 现有测试 + 新增测试通过（`npm test`）

---

## 4. 测试范围

### 4.1 query-history 模块

- 首次保存
- 同词覆盖
- 异词追加
- 5000 上限截断联动
- `parseJsonFromContent` 正常 / 无 JSON / 格式异常
- `getDetailRecord` 存在 / 不存在

### 4.2 useWordQuery 模块

- 保存调用
- 解析失败回退

### 4.3 HistoryView 组件

- 组件渲染
- 卡片点击加载详情
- 空状态

### 4.4 MainPage 组件

- 三视图切换
- 图标点击

---

## 5. 不修改范围

- `public/preload/` 下的所有文件
- `src/mcp-tools/`

---

## 6. 约束与依赖

- 依赖 `utools.db` API 进行数据持久化
- 依赖 AI 模型正确输出 `===JSON===` 标记格式
- 前端过滤搜索逻辑在 Slice 2 中实现

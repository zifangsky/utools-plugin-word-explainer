# code-review-graph

本仓库使用 code-review-graph MCP 服务器做代码探索与审查。MCP 配置属各客户端的**本机配置**
（不入库），索引存于 `.code-review-graph/`（被 `.gitignore` 的 `.*/` 规则忽略）。

**在探索代码前，优先使用图谱工具代替 Grep / Glob / Read。**

## 优先使用图谱工具的场景

- **查找代码**：`semantic_search_nodes` 或 `query_graph` 替代 Grep
- **理解影响范围**：`get_impact_radius` 替代手动追踪 import
- **代码审查**：`detect_changes` + `get_review_context` 替代逐文件阅读
- **查找关系**：`query_graph` 查询调用方 / 被调用方 / 导入关系 / 测试
- **架构问题**：`get_architecture_overview`

## 关键工具

| 工具 | 用途 |
|------|------|
| `detect_changes` | 审查变更 — 风险评分分析 |
| `get_review_context` | 审查上下文 — 包含源码片段 |
| `get_impact_radius` | 了解变更的爆炸半径 |
| `get_affected_flows` | 判断哪些执行路径受影响 |
| `query_graph` | 追踪调用方、被调用方、导入、测试 |
| `semantic_search_nodes` | 按名称或关键词查找函数 / 类 |
| `get_architecture_overview` | 理解高层代码库结构 |
| `refactor_tool` | 规划重命名、发现死代码 |

## 工作流

1. 文件变更后自动增量更新图谱（通过钩子）
2. 审查变更用 `detect_changes`
3. 理解影响范围用 `get_affected_flows`
4. 检查测试覆盖用 `query_graph pattern="tests_for"`

## 索引维护（CLI）

索引滞后时用 CLI 更新（本机 `code-review-graph` 2.3.3，位于 pyenv-win 3.12.0 的 Scripts 目录）：

```bash
code-review-graph update   # 增量更新（仅变更文件）
code-review-graph build    # 全量重建
code-review-graph status   # 查看图谱统计
```

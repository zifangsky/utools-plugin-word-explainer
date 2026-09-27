# code-review-graph

本仓库使用 code-review-graph MCP 服务器做代码探索与审查。MCP 配置属各客户端的**本机配置**
（不入库），索引存于 `.code-review-graph/`（被 `.gitignore` 的 `.*/` 规则忽略）。

**在探索代码前，优先使用图谱工具代替 Grep / Glob / Read。**

## 优先使用图谱工具的场景

- **查找代码**：`semantic_search_nodes_tool` 或 `query_graph_tool` 替代 Grep
- **代码审查**：`detect_changes_tool` + `get_review_context_tool` 替代逐文件阅读
- **查找关系**：`query_graph_tool` 查询调用方 / 被调用方 / 导入关系 / 测试

## 已启用的工具（4 个）

本机 MCP 通过 `--tools` 白名单启动，**只暴露下列 4 个**；包内另有
`get_impact_radius_tool` / `get_affected_flows_tool` / `get_architecture_overview_tool` /
`refactor_tool` / `list_flows_tool` / `list_communities_tool` 等，默认未放行：

| 工具 | 用途 |
|------|------|
| `detect_changes_tool` | 审查变更 — 风险评分分析 |
| `get_review_context_tool` | 审查上下文 — 包含源码片段 |
| `query_graph_tool` | 追踪调用方、被调用方、导入、测试 |
| `semantic_search_nodes_tool` | 按名称或关键词查找函数 / 类 |

> 需要其余工具时，在 `~/.workbuddy/mcp.json` 的 `code-review-graph` 项中把工具名
> （带 `_tool` 后缀）追加进 `args` 的 `--tools` 列表（逗号分隔），重启客户端后生效。

## 工作流

1. **图谱不会自动更新** —— 本机未配置任何钩子，代码变更后 MUST 手动跑 CLI（见下节），
   否则图谱工具读到的是过期索引（2026-09-27 曾发现索引停留在 4 个月前的提交）
2. 审查变更用 `detect_changes_tool`
3. 追踪调用方 / 被调用方 / 导入 / 测试用 `query_graph_tool`
4. 按名称或关键词定位函数 / 类用 `semantic_search_nodes_tool`

## 索引维护（CLI）

索引滞后时用 CLI 更新（本机 `code-review-graph` 2.3.3，位于 pyenv-win 3.12.0 的 Scripts 目录）：

```bash
code-review-graph update   # 增量更新（仅变更文件）
code-review-graph build    # 全量重建
code-review-graph status   # 查看图谱统计
```

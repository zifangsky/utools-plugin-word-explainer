# Task List: 返回按钮图标化与单词卡片复选框同行

## 变更范围

- 文件：`src/MainPage/index.jsx`, `src/MainPage/index.css`, `src/history-view/index.jsx`, `src/history-view/index.css`, `src/MainPage/index.test.jsx`, `src/history-view/index.test.jsx`, `README.md`, `CLAUDE.md`
- 无新增依赖、无业务逻辑变更、纯 UI 调整。

## 任务详情

### Phase 1: 返回按钮图标化（TDD）

#### T001 — RED: 编写返回按钮 SVG 图标测试
- **Outcome**: 测试断言设置页与历史页返回按钮均包含 `.back-icon` SVG 元素。
- **Covers**: REQ-001; Plan: Decision 1
- **Files**: `src/MainPage/index.test.jsx`
- **Depends**: 无
- **Verification**: `npx vitest run src/MainPage` 失败（RED）

#### T002 — GREEN: 实现返回按钮 SVG 图标
- **Outcome**: `MainPage` 中两处返回按钮渲染为 `<span className="back-icon"><svg ...>返回</span>返回`。
- **Covers**: REQ-001; Plan: Decision 1, Implementation Notes
- **Files**: `src/MainPage/index.jsx`
- **Depends**: T001
- **Verification**: `npx vitest run src/MainPage` 通过（GREEN）

### Phase 2: 单词卡片复选框同行（TDD）

#### T003 — RED: 编写复选框与单词同行测试
- **Outcome**: 测试断言 `.history-card-checkbox` 位于 `.history-card-header` 内。
- **Covers**: REQ-002; Plan: Decision 2
- **Files**: `src/history-view/index.test.jsx`
- **Depends**: 无
- **Verification**: `npx vitest run src/history-view` 失败（RED）

#### T004 — GREEN: 实现复选框与单词同行
- **Outcome**: 将复选框从 `.history-card` 顶层移入 `.history-card-header` 中，位于单词文本之前，保留防冒泡。
- **Covers**: REQ-002; Plan: Decision 2, Implementation Notes
- **Files**: `src/history-view/index.jsx`
- **Depends**: T003
- **Verification**: `npx vitest run src/history-view` 通过（GREEN）

### Phase 3: 样式微调

#### T005 — 调整返回按钮与复选框样式
- **Outcome**: 新增 `.back-icon` 样式；调整 `.history-card-header` 与 `.history-card-checkbox` 使复选框与单词对齐且同一行。
- **Covers**: REQ-001, REQ-002; Plan: Implementation Notes
- **Files**: `src/MainPage/index.css`, `src/history-view/index.css`
- **Depends**: T002, T004
- **Verification**: `npx vitest run` 仍通过；Vite dev server 手动查看效果

### Phase 4: 质量门禁与文档同步

#### T006 — 全量测试与 lint 门禁
- **Outcome**: 全量测试通过；`npx standard` 在改动文件内无新增错误。
- **Covers**: CON-004; Plan: Risks / Trade-offs
- **Files**: 全部
- **Depends**: T005
- **Verification**: `npx vitest run` 通过；`npx standard` 已改动文件无新增错误

#### T007 — 同步 README.md / CLAUDE.md 测试计数
- **Outcome**: 更新文档中的测试计数为实际通过数（当前基准 103 + 新增 2 = 105）。
- **Covers**: CON-004; Plan: 项目宪法文档同步要求
- **Files**: `README.md`, `CLAUDE.md`
- **Depends**: T006
- **Verification**: 文档中测试计数与 `npx vitest run` 输出一致

## 依赖关系

```
T001 → T002 → T005 → T006 → T007
T003 → T004 ↗
```

## 计划覆盖表

| Plan Component | Task Coverage |
|----------------|---------------|
| Decision 1 (内联 SVG + currentColor) | T001, T002, T005 |
| Decision 2 (复选框移入 header) | T003, T004, T005 |
| Risks / Trade-offs (测试与可访问性) | T006, T007 |

## 可追溯性

| Spec Requirement | Tasks |
|------------------|-------|
| REQ-001 | T001, T002, T005, T006 |
| REQ-002 | T003, T004, T005, T006 |

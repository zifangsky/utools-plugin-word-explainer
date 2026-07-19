# Feature Specification: flomo-sync

<!--
Language: Generate this document in the language specified in .codexspec/config.yml
-->

**Feature Branch**: `2026-0719-1007lq-flomo-sync`
**Created**: 2026-07-19
**Status**: Implemented
**Input**: 用户确认的需求：增加同步单词解释到 flomo 的能力，并重新优化设置界面排版。

## User Scenarios & Testing

### User Story 1 - 将单词解释同步到 flomo (Priority: P1)

用户完成一次单词查询后，在结果区域右侧看到一个 flomo 图标按钮（前提：已配置 API 端点）。点击该按钮，系统将当前解释正文（含标题标签行）发送到用户在设置中配置的 flomo API 端点，成功后给予反馈。若用户未配置 API 端点，则不显示 flomo 图标。

**Why this priority**: 这是本次功能的核心用户价值——将查询结果归档到笔记工具。

**Independent Test**: 可通过配置有效 flomo API 端点、查询一个单词、点击同步按钮、检查 flomo 是否收到笔记来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户已在设置页配置了 flomo API 端点和标签 `#English/vocabulary`，且当前有查词结果（单词 `notification`），**When** 用户在结果右侧看到 flomo 图标并点击，**Then** 系统发送 POST 请求到配置的端点，请求体为 `{"content": "#English/vocabulary **notification 单词详解**\n\n通知 /ˌnəʊtɪfɪˈkeɪʃn/...", "content_type": "markdown"}`，且 flomo 收到完整笔记。

2. **Given** 用户已配置端点但手动清空了标签（留存为空），**When** 用户点击同步按钮，**Then** 笔记第一行为 `**notification 单词详解**`（无标签前缀，标题仍然加粗），正文原封不动跟在空行后。

3. **Given** 用户配置了多个标签如 `#English #vocabulary`，**When** 点击同步按钮，**Then** 第一行为 `#English #vocabulary **notification 单词详解**`（多个标签以英文空格连接）。

4. **Given** 用户未配置 flomo API 端点（端点输入框为空），**When** 用户查看已完成的查词结果，**Then** 右侧不显示 flomo 同步按钮。

5. **Given** 用户点击同步后请求成功（HTTP 2xx），**When** 收到响应，**Then** 按钮短暂显示成功状态（例如绿色对勾或成功提示）。

6. **Given** 用户点击同步后请求失败（网络错误或非 2xx），**When** 收到错误，**Then** 显示错误提示信息（例如 "同步失败，请检查 API 端点配置"）。

7. **Given** 没有查词结果（初始状态或发生错误），**When** 查看主页面，**Then** 不显示同步按钮。

---

### User Story 2 - 在设置页配置 flomo 同步参数 (Priority: P2)

用户进入设置页面，在「同步到其他笔记应用」卡片中看到 flomo API 端点输入框（必填）和笔记标签输入框（默认值 `#English/vocabulary`）。用户可保留默认标签、修改标签或增加更多标签。配置自动持久化。

**Why this priority**: 同步功能依赖正确的配置；没有此 story，同步按钮无法实际使用。

**Independent Test**: 可通过进入设置页、验证标签默认值为 `#English/vocabulary`、修改端点地址和标签、退出设置再重新进入验证配置是否持久化来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户首次进入设置页，**When** 查看「同步到其他笔记应用」卡片，**Then** 显示 flomo API 端点文本输入框（占位符提示"请输入 flomo API 端点"，初始为空）和笔记标签文本输入框（初始值 `#English/vocabulary`，占位符提示"多个标签以空格分隔，选填"）。

2. **Given** 用户在端点输入框中填入 URL，**When** 退出设置再重新进入，**Then** 之前填入的 URL 仍在输入框中。

3. **Given** 用户将标签输入框中的默认值 `#English/vocabulary` 修改为 `#English/vocabulary #单词`，**When** 退出设置再重新进入，**Then** 修改后的标签仍在输入框中。

4. **Given** 用户删除标签输入框中的所有内容（置空），**When** 回到主页面查词后点击同步，**Then** 笔记第一行只有加粗标题，无标签前缀。

5. **Given** 用户未填写端点（留空），**When** 回到主页面查词后，**Then** 同步按钮不显示。

---

### User Story 3 - 设置页卡片化布局 (Priority: P3)

设置页面重新排版为两个独立卡片：「基本设置」和「同步到其他笔记应用」。基本设置卡片包含 AI 模型选择和查词历史开关；同步卡片包含 flomo 端点地址和笔记标签。

**Why this priority**: 这是用户体验优化，不影响核心同步功能，但为后续扩展其他笔记应用奠定结构基础。

**Independent Test**: 可通过进入设置页、目视检查两个卡片的标题和包含的字段是否正确来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户进入设置页，**When** 查看页面，**Then** 显示「基本设置」标题卡片，内包含 AI 模型选择下拉框和「保存查词历史记录」开关及提示文案。

2. **Given** 用户进入设置页，**When** 查看页面，**Then** 显示「同步到其他笔记应用」标题卡片，内包含 flomo API 端点输入框和笔记标签输入框（默认值 `#English/vocabulary`）。

3. **Given** 用户处于暗色模式，**When** 查看两个卡片，**Then** 卡片背景、输入框、文字颜色与暗色主题一致。

---

### User Story 4 - 从查词历史详情页同步到 flomo (Priority: P1)

用户在查词历史页面选中某个历史记录后，在右侧单词详解区域看到一个与首页相同的 flomo 图标按钮（前提：已配置 API 端点）。点击按钮后，系统将历史记录中保存的单词和详解内容同步到 flomo。

**Why this priority**: 用户可能在复习历史记录时需要同步，应当覆盖此高频场景。

**Independent Test**: 可通过进入查词历史、选中一条记录、点击同步按钮、检查 flomo 是否收到笔记来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户已配置 flomo API 端点，在查词历史中选中一条记录（单词 `notification`），**When** 查看右侧详解区域，**Then** 在详解内容右侧显示 flomo 同步按钮。

2. **Given** 用户未配置 flomo API 端点，在查词历史中选中一条记录，**When** 查看右侧详解区域，**Then** 不显示 flomo 同步按钮。

3. **Given** 点击同步按钮后请求成功，**When** 收到响应，**Then** 按钮短暂显示绿色成功状态，2 秒后恢复。

4. **Given** 点击同步按钮后请求失败，**When** 收到错误，**Then** 按钮变红，同时 title tooltip 显示错误消息，3 秒后恢复。

5. **Given** 用户选中另一条历史记录，**When** 查看新单词的详解，**Then** 之前的同步状态被重置为 idle（不会残留上一次的 success/error 样式）。

---

### Edge Cases

- 首页同步按钮在 `loading` 状态（查询进行中）不显示，因为此时没有完整结果。
- 首页同步按钮在 `error` 状态不显示，因为没有可同步的结果。
- 用户配置了端点但端点 URL 格式非法（如不以 `http` 开头），同步时 HTTP 层会自然报错，错误提示应泛化为"同步失败，请检查 API 端点配置"。
- 标签输入中可能包含首尾空格，保存和读取时应 trim。
- 正文内容可能包含 markdown 特殊字符（如 `**`、`#`），不应被错误解析或截断。
- 查词历史详情页切换选中单词时，同步按钮状态自动重置为 idle。

## Requirements

### Functional Requirements

- **REQ-001**: 主页面查词结果（`result` 非空且 `loading` 为 false 且 `error` 为空且 API 端点已配置）区域右侧 MUST 显示一个 flomo 同步按钮，图标使用 `assets/flomo_favicon.ico`。
  - Sources: NEED-001, CON-003

- **REQ-002**: 点击同步按钮 MUST 将当前输出正文 + 标题行通过 HTTP POST 发送到用户在设置中配置的 flomo API 端点。
  - Sources: NEED-001, NEED-002

- **REQ-003**: POST 请求体 MUST 为 `{"content": "<第一行>\n\n<正文>", "content_type": "markdown"}`。
  - Sources: NEED-002

- **REQ-004**: 同步内容的第一行 MUST 为：`{tags} **{当前单词} 单词详解**`。若标签为空则第一行为 `**{当前单词} 单词详解**`。标签之间以英文空格分隔。第二行为空行，第三行起为原正文。
  - Sources: NEED-003, DEC-001, DEC-003

- **REQ-005**: 正文部分 MUST 原封不动保留，不执行任何排版优化、标点修正、加粗调整或内容修改。
  - Sources: NEED-002, OUT-002

- **REQ-006**: 设置页 MUST 分为两个卡片：「基本设置」和「同步到其他笔记应用」。
  - Sources: DEC-002

- **REQ-007**: 「基本设置」卡片 MUST 包含当前已有的 AI 模型选择下拉框和「保存查词历史记录」开关及提示文案。
  - Sources: DEC-002

- **REQ-008**: 「同步到其他笔记应用」卡片 MUST 包含 flomo API 端点文本输入框（必填，初始为空）和笔记标签文本输入框（选填，默认值 `#English/vocabulary`，支持多个标签以空格分隔）。
  - Sources: CON-002, DEC-002, DEC-003

- **REQ-009**: flomo API 端点配置 MUST 通过 `window.utools.dbStorage` 持久化存储，key 为 `flomoApiEndpoint`。
  - Sources: CON-002

- **REQ-010**: flomo 笔记标签配置 MUST 通过 `window.utools.dbStorage` 持久化存储，key 为 `flomoTags`。初始默认值为 `#English/vocabulary`。读取和保存时均需 trim 首尾空白。
  - Sources: CON-002, DEC-003

- **REQ-011**: HTTP 请求 MUST 通过 preload 脚本（`public/preload/services.js`）中的 Node.js `https`/`http` 模块发送，禁止使用浏览器 fetch 或 Windows curl（避免 UTF-8 编码缺陷）。
  - Sources: CON-002 (参考 flomo skill 的踩坑经验)

- **REQ-012**: 同步成功后 MUST 给用户可见的反馈（如成功提示或按钮短暂变绿）。
  - Sources: NEED-001

- **REQ-013**: 同步失败（网络错误或非 2xx）MUST 显示错误信息 "同步失败，请检查 API 端点配置"。
  - Sources: NEED-001

- **REQ-014**: 当 result 为空（初始状态）、loading 为 true（查询中）、或 error 非空时，同步按钮 MUST NOT 显示。
  - Sources: NEED-001, edge case analysis

- **REQ-015**: 当用户未配置 API 端点（值为空字符串）时，同步按钮 MUST NOT 显示。
  - Sources: CON-002, User Story 2 - Scenario 5, User Story 1 - Scenario 4

- **REQ-016**: 查词历史详情页（`history-view`）在选中某条历史记录、且 API 端点已配置时，MUST 在详解内容右侧显示 flomo 同步按钮，行为和样式与首页按钮一致。
  - Sources: DEC-004, User Story 4

- **REQ-017**: 查词历史详情页同步按钮 MUST 使用历史记录中保存的单词和详解内容（`selectedWord` + `detailContent`）作为同步数据源。
  - Sources: DEC-004, User Story 4

- **REQ-018**: 查词历史详情页切换选中单词时，同步按钮状态 MUST 自动重置为 idle（清除上一单词的 success/error 残留状态）。
  - Sources: DEC-004, User Story 4 - Scenario 5

- **REQ-019**: 首页和查词历史详情页的 flomo 同步按钮 MUST 采用小型图标按钮样式，与 header 按钮（📖 查词历史、设置）风格一致：无文字标签、通过 title tooltip + CSS 颜色变化传达同步状态。
  - Sources: DEC-005

### Key Entities

- **Flomo 配置**：存储为两个 dbStorage key：`flomoApiEndpoint`（字符串，API 端点 URL，默认空）和 `flomoTags`（字符串，空格分隔的标签列表，默认 `#English/vocabulary`）。两者均对应用户设置输入，由 preload 服务读取后构建 POST 请求。
- **Flomo 笔记内容**：构建逻辑为 `<flomoTags> **<lastQueriedWord> 单词详解**` + `\n\n` + `<result>`。不对 result 做任何修改。

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户完成单词查询后，能在 1 秒内点击同步按钮并将笔记发送到 flomo。
- **SC-002**: 同步请求在网络正常情况下 3 秒内返回结果（成功或失败）。
- **SC-003**: 配置持久化后，用户关闭插件再重新打开，之前配置的端点和标签仍然存在。
- **SC-004**: 不修改现有功能的任何行为或测试用例——所有现有测试继续通过。实现完成后测试总数从 106 增长到 141。
- **SC-005**: 首次进入设置页时，flomo 标签输入框默认显示 `#English/vocabulary`。
- **SC-006**: 查词历史详情页在选中历史记录且有端点配置时，显示与首页风格一致的同步按钮。

## Out of Scope

- 同步到 flomo 以外的笔记应用（Notion、Obsidian、Bear 等）。
  - 来源: OUT-001
- 对正文做任何排版优化、自动标题生成、内容修改。
  - 来源: OUT-002
- 在设置页配置多重笔记应用的切换、选择、或优先级。
  - 来源: OUT-001（扩展）

## Assumptions

- `window.utools.dbStorage` 可用且行为与现有的 `model-preference`、`history-preference` 模块一致。
- `window.services`（preload 注入）可用于调用 Node.js API；需要在 `public/preload/services.js` 中新增 `sendToFlomo` 方法。
- 当前查询的单词来自 main-page 的 `word` state，查词结果 `result` 来自 `useWordQuery` hook 返回值——两者均在查词成功后同时可用，无需额外缓存或 hook 扩展。
- 查词历史详情页同步时，单词选自 `history-view` 的 `selectedWord` state，内容来自 `detailContent`（存储在 `utools.db` 中的详情文档）。
- `assets/flomo_favicon.ico` 通过 Vite import 引用（需在 `vite.config.js` 中设置 `assetsInclude: ['.ico']`）。
- 目录命名已统一为 kebab-case（`src/main-page/` 替代原 `src/MainPage/`）。

## Dependencies

- 现有的 `useWordQuery` hook 无需修改——`result` 已有返回值，`word` 由 main-page input state 提供。
- 现有的 `public/preload/services.js` 需要扩展 `sendToFlomo` 方法。
- `vite.config.js` 需新增 `assetsInclude: ['.ico']`，vitest 配置已分离到 `vitest.config.js`。
- 现有的 `src/main-page/` 组件和 CSS 需要修改以支持新 UI。
- 现有的 `src/history-view/` 组件和 CSS 需要修改以支持详情页同步按钮。
- 不依赖外部 npm 包；不修改 `plugin.json`。

## Requirements Traceability

| Confirmed Requirement | Spec Coverage | Notes |
|-----------------------|---------------|-------|
| NEED-001 | REQ-001, REQ-002, REQ-012, REQ-013, REQ-014 | 同步按钮显示、点击、反馈全覆盖 |
| NEED-002 | REQ-003, REQ-005 | POST 格式和原文不变 |
| NEED-003 | REQ-004 | 第一行格式确认 |
| CON-001 | REQ-002, Out of Scope | 仅 flomo |
| CON-002 | REQ-009, REQ-010, REQ-011, REQ-015 | 端点、标签存储和请求方式 |
| CON-003 | REQ-001 | 图标路径确认 |
| DEC-001 | REQ-004 | 「{单词} 单词详解」标题格式 |
| DEC-002 | REQ-006, REQ-007, REQ-008 | 双卡片布局 |
| DEC-003 | REQ-004, REQ-008, REQ-010 | 默认标签值 + 多标签空格分隔 |
| DEC-004 | REQ-016, REQ-017, REQ-018 | 查词历史详情页同步入口 |
| DEC-005 | REQ-019 | 按钮样式统一 |
| OUT-001 | Out of Scope | 明确排除 |
| OUT-002 | REQ-005, Out of Scope | 明确排除 |

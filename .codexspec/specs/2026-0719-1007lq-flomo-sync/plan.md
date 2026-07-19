# Implementation Plan: flomo-sync

<!--
Language: Generate this document in the language specified in .codexspec/config.yml
-->

**Related Spec**: `.codexspec/specs/2026-0719-1007lq-flomo-sync/spec.md`
**Confirmed Requirements**: `.codexspec/specs/2026-0719-1007lq-flomo-sync/requirements.md`
**Created**: 2026-07-19
**Status**: Draft

## Context

英语单词详解 uTools 插件当前具备完整的查词→AI 解释→渲染流程，以及查词历史管理。用户需要一个将查词结果快速归档到个人笔记工具 flomo 的能力，同时重新整理设置页排版。

项目当前采用 React 19 + Vite 6，遵循 `src/<module>/index.js + index.test.js` 模块形态。preload 层（`public/preload/services.js`）提供 Node.js 能力桥接；React 层通过 `window.services` 调用。宪法要求所有改动遵循原则 1（模块边界）、原则 2（行为驱动测试）、原则 8（强制严格 TDD）。

## Goals / Non-Goals

**Goals:**
- 查词结果右侧新增 flomo 同步按钮（仅在端点已配置时可见）
- 通过 preload Node.js 层发送 HTTP POST 到用户配置的 flomo API 端点
- flomo 笔记第一行为「标签 + **{单词} 单词详解**」，第二行空，第三行起为原正文
- 设置页重组为两个卡片，新增 flomo 端点/标签配置
- flomo 标签默认值为 `#English/vocabulary`
- 不修改现有功能的任何行为或测试

**Non-Goals:**
- 同步到 flomo 以外的笔记应用
- 正文排版优化或自动标题生成
- 在设置页配置多重笔记应用的切换

## Tech Stack

沿用现有技术栈，不引入新依赖：
- **语言**: JavaScript ES Modules
- **UI**: React 19 + react-dom 19
- **Preload**: Node.js CommonJS (`https`/`http` 模块)
- **测试**: Vitest + @testing-library/react + jsdom
- **代码规范**: `standard`

## Architecture Overview

```
┌─ Renderer (React / webview) ────────────────────────────────────────┐
│                                                                      │
│  MainPage ──┬── useWordQuery ──→ prompt-template / ai-call / ...    │
│             │    (unchanged)                                         │
│             │                                                        │
│             └── sync (NEW) ──┬─→ window.utools.dbStorage             │
│                              │   (flomoApiEndpoint, flomoTags)       │
│                              │                                       │
│                              └─→ window.services.sendToFlomo()       │
│                                  (bridge to preload)                 │
│                                                                      │
│  Note: MainPage 直接传递 result + word 给 sync，无需修改             │
│        useWordQuery 返回值结构                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ window.services
                                    ▼
┌─ Preload (Node.js / main process) ───────────────────────────────────┐
│                                                                      │
│  services.js  ─── sendToFlomo(endpoint, body) ──→ https.request()   │
│  (NEW method)                                        POST JSON       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Covers**: REQ-001, REQ-002, REQ-003, REQ-011

## Component Structure

新增和变更的文件：

```
src/
├── sync/                   # NEW: 同步偏好存储 + 笔记内容构建 + flomo 同步逻辑
│   ├── index.js            #   偏好存取 / buildFlomoContent / syncToFlomo
│   └── index.test.js
├── MainPage/               # MODIFIED: 同步按钮 + 设置卡片化
│   ├── index.jsx
│   ├── index.css
│   └── index.test.jsx
public/
├── preload/
│   └── services.js         # MODIFIED: 新增 sendToFlomo 方法
vite.config.js              # MODIFIED: assetsInclude 新增 '.ico'
```

**修改范围**: 新增 1 个模块 (`src/sync/`)，修改 3 个文件 (`MainPage/index.jsx` + `index.css` + `vite.config.js`) 和 1 个 preload 文件。不修改 `useWordQuery`、`plugin.json`、`package.json`。

**设计理由**:
- `MainPage` 查词后已有 `result`（来自 `useWordQuery`）+ `word`（来自 input state），sync 所需数据原地就绪，无需通过 hook 中转。
- 将所有同步逻辑内聚于 `src/sync/` 单一模块，避免每种笔记应用产生独立目录。未来扩展 Notion 仅需在 `sync/` 中新增 `syncToNotion` 等函数。
- 静态资源（flomo 图标）统一放在根 `assets/`，通过 Vite import 引用，不混入 `public/` 或 `dist/`。

不修改的文件：`plugin.json`、`package.json`、`CLAUDE.md`（实现后同步）。

## Data Models

### Flomo 配置（dbStorage）

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `flomoApiEndpoint` | string | `""` | flomo API 端点 URL，用户配置。为空时不显示同步按钮 |
| `flomoTags` | string | `"#English/vocabulary"` | 空格分隔的标签列表，有默认值 |

**Covers**: REQ-009, REQ-010

### Flomo 笔记内容格式

```
{tags} **{word} 单词详解**\n
\n
{result}
```

- 构建为纯函数 `buildFlomoContent(word, result, tags)`。
- tags 为空时不包含标签前缀（仅 `**{word} 单词详解**`）。
- 不对 result 做任何修改。

**Covers**: REQ-003, REQ-004, REQ-005

## API Contracts

### window.services.sendToFlomo(endpoint, body)

由 preload `services.js` 注入到 `window.services`，供渲染进程调用。

**调用方** (renderer):
```javascript
const result = await window.services.sendToFlomo(endpoint, {
  content: "#English/vocabulary **notification 单词详解**\n\n正文...",
  content_type: "markdown"
})
```

**返回**:
- 成功: `{ ok: true, status: 200, body: "..." }`
- 失败: `{ ok: false, error: "错误消息" }`

**内部实现** (preload, Node.js):
- 解析 endpoint URL，判断协议选用 `https` 或 `http` 模块。
- POST 请求体 JSON.stringify，headers 含 `Content-Type: application/json`。
- `Buffer.byteLength(data)` 设置 Content-Length（确保 UTF-8 字节数正确）。
- 返回值通过 `resolve/reject` 封装为 Promise。
- 设置 `req.setTimeout(10000)` 避免无限挂起。

**Covers**: REQ-002, REQ-003, REQ-011

### syncToFlomo(word, result)

由 `src/sync/index.js` 导出，供 MainPage 调用。

**签名**: `syncToFlomo(word: string, result: string) → Promise<{ success: boolean, message?: string }>`

**行为**:
1. 从 `getFlomoApiEndpoint()` 读取端点。若为空 → `{ success: false, message: "请先在设置中配置 flomo API 端点" }`
2. 读取 `getFlomoTags()`。
3. 调用 `buildFlomoContent(word, result, tags)` 构建笔记内容。
4. 调用 `window.services.sendToFlomo(endpoint, { content, content_type: "markdown" })`。
5. 若 preload 返回 `{ ok: true }` → `{ success: true }`
6. 若 preload 返回 `{ ok: false }` → `{ success: false, message: "同步失败，请检查 API 端点配置" }`

**返回**:
```javascript
// 成功
{ success: true }

// API 端点未配置
{ success: false, message: "请先在设置中配置 flomo API 端点" }

// 网络错误 / 非 2xx
{ success: false, message: "同步失败，请检查 API 端点配置" }
```

**MainPage 使用方式**:
```jsx
const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | success | error
const [syncMessage, setSyncMessage] = useState('')

async function handleSyncFlomo () {
  setSyncStatus('syncing')
  const res = await syncToFlomo(word, result)
  if (res.success) {
    setSyncStatus('success')
    setTimeout(() => setSyncStatus('idle'), 2000)
  } else {
    setSyncStatus('error')
    setSyncMessage(res.message)
    setTimeout(() => setSyncStatus('idle'), 3000)
  }
}
```

**按钮渲染**:
- `idle`: 显示 flomo 图标，可点击
- `syncing`: 图标显示 loading 态（旋转或灰度），不可点击
- `success`: 图标短暂变绿（2 秒后自动恢复 idle）
- `error`: 图标变红 + tooltip/文字显示 `syncMessage`（3 秒后自动恢复 idle）

**Covers**: REQ-001, REQ-002, REQ-012, REQ-013

## Decisions

### Decision 1: HTTP 请求放在 preload 层，不用 fetch 或 curl

**Context**: 渲染进程运行在 Chromium webview 中，`fetch` 受 CORS 限制可能无法调用外部 API；Windows curl 对中文 UTF-8 编码有缺陷（已知 flomo skill 踩坑）。

**Options Considered**:
1. 使用浏览器 `fetch`
2. 使用 Windows curl
3. 使用 preload Node.js `https` 模块

**Decision**: 选项 3 — preload Node.js `https`/`http` 模块

**Rationale**: Node.js 无 CORS 限制，UTF-8 字节计数通过 `Buffer.byteLength` 可靠。与 flomo skill 已验证方案一致。

**Covers**: REQ-011

**Decision Level**: Plan-level technical decision; does not change confirmed product scope

### Decision 2: 同步所需数据从 MainPage 现有 state 获取，不修改 useWordQuery

**Context**: flomo 同步需要构建笔记内容（含标题中的查询单词和正文）。

**Decision**: 不修改 `useWordQuery` hook 的返回值结构。`syncToFlomo(result, word)` 的 `result` 来自 hook 已有返回值，`word` 来自 MainPage 自身的 input state（查询后 input 中仍保留当前查词词条）。

**Rationale**: 无查词结果时 flomo 图标本身就不显示，因此需要同步的场景下 `result` 和 `word` 必然同时可用。无需通过 hook 中转或额外缓存。符合原则 7（简洁优先）——减少 1 个修改文件，减少 useWordQuery 测试用例的联动变更。

**Covers**: REQ-004

**Decision Level**: Plan-level technical decision; does not change confirmed product scope

### Decision 3: 图标放在项目根 `assets/`，通过 Vite import 引用

**Context**: 项目约定静态资源统一放在根目录 `assets/` 下，不混入 `public/`（含构建产物）或 `dist/`（构建输出）。但 Vite 默认不识别 `.ico` 文件为可导入资源。

**Decision**:
1. 将 `vite.config.js` 的 `assetsInclude` 扩展为 `['.ico']`。
2. 保持 `assets/flomo_favicon.ico` 不动（已在根 `assets/` 下）。
3. 在 React 组件中通过 `import flomoIcon from '../../assets/flomo_favicon.ico'` 引用，`flomoIcon` 为 Vite 处理后的 URL。

**Rationale**: 遵循用户的"所有静态资源放根 `assets/`"约定。Vite 的 `assetsInclude` 是最小配置变更，仅添加一行，不影响现有构建行为。

**Covers**: REQ-001

**Decision Level**: Plan-level technical decision; does not change confirmed product scope

### Decision 4: 统一同步模块而非拆分为 flomo-* 子模块

**Context**: 当前需求仅需同步到 flomo，但 spec 和设置页卡片设计已预留"同步到其他笔记应用"的扩展空间。

**Options Considered**:
1. 两个独立模块：`flomo-preference/` + `flomo-sync/`
2. 单一模块：`sync/`（偏好存取 + 内容构建 + 同步逻辑合一）

**Decision**: 选项 2 — 单一 `src/sync/` 模块

**Rationale**: flomo 仅为一种同步方式。若采用选项 1，后续添加 Notion 同步将产生 `notion-preference/` + `notion-sync/` 两个新目录，模块数量随同步目标线性膨胀。单一模块将所有同步相关逻辑内聚于一处：导出 `getFlomoEndpoint`、`getFlomoTags`、`buildFlomoContent`、`syncToFlomo`；未来扩展 Notion 仅需新增 `syncToNotion` 等函数，无需新增目录。符合宪法原则 1（模块边界清晰、职责明确）与原则 7（简洁优先）。

**Covers**: REQ-009, REQ-010, REQ-003, REQ-004, REQ-005

**Decision Level**: Plan-level technical decision; does not change confirmed product scope

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| preload `sendToFlomo` 中的 Node.js 网络错误未能正确返回给 renderer | Low | Medium | 使用 Promise 封装，resolve/reject 正确处理所有分支；超时也 reject |
| flomo API 端点 URL 格式意外（如带 fragment）导致 `new URL()` 解析失败 | Low | Low | preload 中 try/catch 包裹，解析失败返回友好错误信息 |
| `public/assets/` 目录可能存在 Windows 文件占用（已知踩坑） | Low | Medium | favicon 为静态文件，仅复制一次，构建时不被 vite 写入；不涉及 build 输出文件冲突 |

## Implementation Phases

### Phase 1: 数据层（纯逻辑，无 UI 依赖）
- [ ] 创建 `src/sync/index.js` + `index.test.js`（偏好存取 + buildFlomoContent + syncToFlomo）
- [ ] 修改 `public/preload/services.js` 新增 `sendToFlomo` 方法

**Covers**: REQ-003, REQ-004, REQ-005, REQ-009, REQ-010, REQ-011

### Phase 2: UI 层（依赖 Phase 1）
- [ ] 修改 `vite.config.js`：`assetsInclude: ['.ico']`（1 行新增，确保 Vite 识别 .ico 为可导入资源）
- [ ] 修改 `src/MainPage/index.jsx`：
  - import `syncToFlomo` 及 flomo 图标
  - 新增 `syncStatus` state（`idle | syncing | success | error`）和 `syncMessage` state
  - 同步按钮：`idle` 可点击 → `syncing` loading 态 → `success` 绿色/`error` 红色 + message，自动恢复
  - 设置页重组为两个卡片，读取 flomo 配置
- [ ] 修改 `src/MainPage/index.css`：结果区 flex 布局 + 同步按钮四态样式 + 卡片样式 + dark mode
- [ ] 修改 `src/MainPage/index.test.jsx`：新增场景测试
  - Mock: `vi.mock('../sync/index.js')` → `syncToFlomo` 可控返回值
  - 场景: 有结果+有端点→按钮可见、无端点→按钮不可见、loading→不可见、点击同步→调用 syncToFlomo 并进入 syncing 态、syncToFlomo success→按钮变绿 2s 后恢复、syncToFlomo error→显示错误消息 3s 后恢复、设置页默认标签 `#English/vocabulary`

**Covers**: REQ-001, REQ-002, REQ-006, REQ-007, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015

### Phase 3: 验证与文档
- [ ] 运行 `npm test` 确保全部通过（含新增测试）
- [ ] 运行 `npx standard` 确保代码风格合规
- [ ] 同步更新 `CLAUDE.md`（架构树、依赖方向、模块列表）
- [ ] 同步更新 `README.md`（项目结构树、测试计数）

**Covers**: SC-004

## Verification Strategy

### 单元测试（Vitest）
| 模块 | 关键测试场景 | 覆盖 REQ |
|------|-------------|---------|
| `sync` | get/set 端点、get/set 标签、默认值、空值；buildFlomoContent 含标签/无标签/多标签/空正文 | REQ-003, REQ-004, REQ-005, REQ-009, REQ-010 |
| `MainPage` | Mock: `vi.mock('../sync/index.js')`。场景：有结果+有端点→按钮可见；无端点→不可见；loading→不可见；点击→调用 syncToFlomo 进入 syncing 态；success→绿色 2s 恢复；error→红色+消息 3s 恢复；设置页默认标签 | REQ-001, REQ-008, REQ-012, REQ-013, REQ-014, REQ-015 |

### 集成测试（手动）
| 场景 | 验证项 |
|------|--------|
| 配置有效 flomo API 端点 → 查词 → 点击同步 | flomo 收到笔记、格式正确 |
| 不配置端点 → 查词 | 不显示 flomo 图标 |
| 修改标签默认值 → 退出再进入 | 标签持久化 |

## Security Considerations

- flomo API 端点以明文存储在 `utools.dbStorage`，不涉及密钥管理（与现有 `preferredModel` 模式一致）。
- preload 层不做任何内容过滤——内容由用户确认后主动发起，不存在注入风险。
- `https.request` 仅目标端点，不向任何其他域名发送数据。

## Performance Considerations

- `sendToFlomo` 为异步调用，不阻塞 UI；使用 `https.request` 10 秒超时避免挂起。
- `buildFlomoContent` 为纯字符串拼接，O(n) 复杂度，无性能问题。
- 同步按钮仅在 result 存在时渲染（条件渲染），不增加初始加载成本。

## Requirements Coverage

| Spec Requirement | Plan Coverage | Reference |
|------------------|---------------|-----------|
| REQ-001 | Full | Decision 3 / Phase 2 |
| REQ-002 | Full | Phase 1 (preload) / Phase 2 (button handler) |
| REQ-003 | Full | Phase 1 (sync/buildFlomoContent) |
| REQ-004 | Full | Decision 2 / Phase 1 (sync/buildFlomoContent) |
| REQ-005 | Full | Phase 1 (sync, pure function) |
| REQ-006 | Full | Phase 2 (MainPage UI cards) |
| REQ-007 | Full | Phase 2 (MainPage basic card) |
| REQ-008 | Full | Phase 2 (MainPage sync card) |
| REQ-009 | Full | Phase 1 (sync preference storage) |
| REQ-010 | Full | Phase 1 (sync preference storage, default value) |
| REQ-011 | Full | Decision 1 / Phase 1 (preload) |
| REQ-012 | Full | Phase 2 (MainPage success feedback) |
| REQ-013 | Full | Phase 2 (MainPage error feedback) |
| REQ-014 | Full | Phase 2 (conditional render) |
| REQ-015 | Full | Phase 2 (conditional render, depends on endpoint config) |

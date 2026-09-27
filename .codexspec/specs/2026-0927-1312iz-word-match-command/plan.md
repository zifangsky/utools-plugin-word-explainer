# Design Document: 匹配指令（复制单词即出详解）

<!--
Language: zh-CN（与 .codexspec/config.yml 的 language.output 一致）
-->

**Feature ID**: `2026-0927-1312iz`
**Specification**: [spec.md](./spec.md)
**Requirements**: [requirements.md](./requirements.md)

## Context

本插件当前只声明了功能指令（`explain` / `查词` / `word` / `vocabulary`）。uTools 主输入框在用户复制文本后呼出时会自动填入剪贴板内容，但单词文本不匹配任何功能指令名，因此插件不会出现在候选中，用户必须清空输入、键入指令名、再回来粘贴单词。

本设计落地 uTools 的「匹配指令」机制：在 `public/plugin.json` 中按输入内容类型声明指令，并把 uTools 回传的匹配数据接入既有查词链路。

已核实的仓库事实（决定设计取舍）：

| 事实 | 位置 | 影响 |
|------|------|------|
| `onPluginEnter` 回调当前完全丢弃入参，仅用于 `setVisible(true)` | `src/App.jsx:9-11` | 需新增进入动作的透传通道 |
| `MainPage` 的 `word` 完全由输入框 `onChange` 驱动，无外部入口 | `src/main-page/index.jsx:43,178` | 需让外部预填成为可能 |
| `handleQuery` 从 `word` **state** 取值 | `src/main-page/index.jsx:64-68` | 自动查询不能复用它（同一 commit 内 state 未更新） |
| `selectedModel` 在挂载 effect 中异步写入，初始值为空串 | `src/main-page/index.jsx:47,53-56` | 自动查询读 state 会引入 effect 顺序依赖 |
| `useWordQuery().query` 由 `useCallback([], ...)` 返回，引用稳定 | `src/use-word-query/index.js:12-43` | 可安全放入 effect 依赖 |
| `App.jsx` 目前无测试文件 | `src/` 目录树 | 新增 `App.test.jsx` 属本特性必需 |
| 历史 spec 产物均已纳入版本控制 | `git ls-files .codexspec/specs` | 本次过程产物应随 PR 提交 |
| uTools 读取 `public/plugin.json`（开发模式；构建产物不覆盖该文件） | `public/plugin.json`、`package.json` 的 `deploy` 脚本 | 配置只需改一处 |

## Goals / Non-Goals

**Goals:**

- 主输入框为单个纯英文单词时，候选中出现「单词详解」匹配指令（REQ-001）
- 经该指令进入后预填单词并自动发起查询，实现「复制即出解释」（REQ-002、REQ-003）
- 对既有功能指令入口与既有查词能力零回归（REQ-004、REQ-005）

**Non-Goals:**

- 其他匹配类型（`over` / `img` / `files` / `window`）与超级面板、快捷键入口
- 外部词典 API 或本地词库
- 为与 `explain` / `word` / `vocabulary` 的重复命中编写负向断言（DEC-004，待实测）
- 新增 npm 依赖、新增 `src/<module>/` 目录、改变依赖方向

## Decisions

### Decision 1（PLD-1）：进入动作经 `App` 的 state + prop 透传，不在 `MainPage` 内二次注册监听

**Context**：匹配数据需要从 `onPluginEnter` 回调送达主界面；当前唯一注册点为 `src/App.jsx`。

**Decision**：在 `App.jsx` 增加 `enterAction` state，回调参数原样存入，并作为 `enterAction` prop 传给 `MainPage`。

**Rationale**：

- uTools 官方文档只描述「调用这个方法」，**未定义同一 API 被多次调用时的注册语义**（累积还是覆盖）。在 `MainPage` 内再注册一次会把功能建立在平台未定义行为之上：若语义为覆盖，`App.jsx` 已有的 `setVisible(true)` 会失效，导致插件不可见。
- 保持单一注册点，数据流向显式且可测。

**Alternatives Considered**：

- 在 `MainPage` 内注册第二个 `onPluginEnter` —— 代码更短，但依赖平台未定义语义，且两个回调的职责边界模糊。
- 为 `App.jsx` 与 `MainPage` 引入共享模块级事件总线 —— 为新需求引入新抽象，违反原则 7。

**Accepted Trade-offs**：需新增 `src/App.test.jsx`（该文件此前不存在）。

### Decision 2（PLD-2）：判定条件为 `enterAction.type === 'regex' && enterAction.payload`

**Context**：需要在「匹配指令进入」与「功能指令进入」之间判别。

**Decision**：以 `type` 为 `'regex'` 且 `payload` 为真值作为自动查询的唯一条件。判定 MUST 以空值安全形式书写——`if (!enterAction || enterAction.type !== 'regex' || !enterAction.payload) return`——因为既有 25 条 `MainPage` 测试均未传入该 prop（值为 `undefined`），且 `App.jsx` 在首次进入前的初始 `enterAction` 为 `null`。

**Rationale**：

- `type` 直接指示 `payload` 的数据语义（spec REQ-002 的第二条场景即以此表述）。
- 空字符串为假值，因此「匹配数据为空时不查询」（REQ-003 第三条场景）由同一条件自然满足，**无需任何防御分支**（原则 7：不为不可能出现的场景写错误处理；`type` 为 `regex` 时 `payload` 必然为字符串）。
- 不以 `code === 'wordMatch'` 为条件：`type` 已足够，且 `code` 判定会在未来新增匹配指令时静默失效。

### Decision 3（PLD-3）：自动查询的模型来源直接读 `getPreferredModel()`，不读 `selectedModel` state

**Context**：`src/main-page/index.jsx:47` 的 `selectedModel` 初始值为空串，其真实值由 `:53-56` 的挂载 effect 异步写入。若自动查询 effect 读该 state，则「使用当前偏好模型」（REQ-003 第二条场景）是否成立，取决于两个 effect 的执行顺序，属隐式时序依赖。

**Decision**：自动查询 effect 内以 `getPreferredModel() || undefined` 解析模型。

**Rationale**：

- `getPreferredModel()` 与 `selectedModel` 始终同源：`handleModelChange` 同时调用 `setPreferredModel` 写偏好与 `setSelectedModel` 更新 state，故二者不会漂移。
- 消除对 effect 执行顺序的依赖，使 REQ-003 的模型场景**确定成立**而非偶然成立。
- 只新增代码，不改动既有初始化逻辑（原则 7：只动必须动之处）。

**Alternatives Considered**：

- 复用 `handleQuery` —— 不可行：它从 `word` state 取词，而 effect 内该 state 尚未更新（同一 commit）。
- 把 `selectedModel` 改为惰性初始化并删除挂载 effect 中的赋值 —— 可让 state 首渲染即正确，但修改了与本需求无关的既有初始化代码，属非必要改动。
- 让 effect 依赖 `selectedModel` —— 会在用户切换模型时重复触发查询，行为错误。

### Decision 4（PLD-4）：自动查询直接调用 `query(payload, model)`，`setWord` 仅用于界面预填

**Context**：REQ-003 要求输入框预填**且**自动查询。

**Decision**：先把 `payload` 写入 `word` state 用于界面显示，再以 `payload` 实参调用 `query`。

**Rationale**：`query` 是 `useWordQuery` 暴露的既有入口，自动查询因此与手动查询走**完全相同**的下游链路（`prompt-template` → `ai-call` 流式 → `parseJsonFromContent` → 受开关门控的历史写入）。REQ-005 由此**由构造保证**，无需新增旁路或额外代码。

### Decision 5（PLD-5）：REQ-001 不编写单元测试，采用真实 uTools 手工核验

**Context**：`review-spec.md` 的 Design Opportunity D-1 建议增加 `plugin.json` 配置断言测试。

**Decision**：**不采纳** D-1。REQ-001 的可观察结果由 uTools 运行时产生，其核验准则已按宪法原则 8 的豁免条款记录在 `spec.md` 的 REQ-001 场景内；实现后于真实 uTools 环境手工核验。

**Rationale**：JSON 字段断言属配置快照式校验，对本次单一变更的回归价值低于其维护成本（原则 7）。D-1 为建议项而非缺陷，spec 未将其列为必需。

## Architecture

```
uTools 主输入框（用户粘贴/输入）
        │  单个纯英文单词
        ▼
public/plugin.json  ── features[].cmds[] 含 type:"regex"
        │  命中 → 候选出现「单词详解」
        ▼
utools.onPluginEnter({ code:'wordMatch', type:'regex', payload:'ephemeral' })
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ src/App.jsx                                             │
│   setEnterAction(action)  ──► state: enterAction        │
│   setVisible(true)                                      │
└─────────────────────────────────────────────────────────┘
        │  prop: enterAction                        Covers: REQ-002
        ▼
┌─────────────────────────────────────────────────────────┐
│ src/main-page/index.jsx                                 │
│   useEffect([enterAction])                              │
│     if (type !== 'regex' || !payload) return            │  ← 功能指令入口在此短路
│     setWord(payload)              ──► 输入框预填         │
│     query(payload, getPreferredModel() || undefined)     │
└─────────────────────────────────────────────────────────┘
        │                                           Covers: REQ-003, REQ-004, REQ-005
        ▼
use-word-query ──► prompt-template ──► ai-call（utools.ai 流式）
        └──► parseJsonFromContent ──►（受 saveQueryHistory 门控）query-history ──► utools.db

【新增依赖边】无。App → main-page 为既有依赖方向；本特性仅沿该边增加一个 prop。
```

### 组件与接口

| 组件 | 变更 | 接口 / 内容 | Covers |
|------|------|-------------|--------|
| `public/plugin.json` | 在 `features` 数组追加一项 | 见下方配置契约 | REQ-001 |
| `src/App.jsx` | 新增 state 与 prop | `enterAction` state；`<MainPage enterAction={enterAction} />` | REQ-002 |
| `src/main-page/index.jsx` | 新增 prop 与 effect | `MainPage({ enterAction })`；新增自动查询 effect | REQ-003、REQ-004、REQ-005 |
| `src/App.test.jsx` | 新建 | 进入动作透传与可见性 | REQ-002 |
| `src/main-page/index.test.jsx` | 扩展 | 新增 `匹配指令进入` 用例组 | REQ-003、REQ-004、REQ-005 |
| `CLAUDE.md` | 文档同步 | 架构树补 `App.test.jsx`；测试计数 141 → 实际值 | NFR-003 |
| `README.md` | 文档同步 | 「触发方式」补「单词详解」；结构树补 `App.test.jsx`；测试计数 141 → 实际值 | NFR-001、NFR-003 |

### `public/plugin.json` 新增配置契约

```json
{
  "code": "wordMatch",
  "explain": "匹配指令 —— 主输入框为单个英文单词时，直接进入插件查询该单词",
  "cmds": [
    {
      "type": "regex",
      "label": "单词详解",
      "match": "/^[a-zA-Z]+$/",
      "minLength": 1,
      "maxLength": 64
    }
  ]
}
```

要点：

- `match` 为字符串形式正则（带斜杠），本式无需转义反斜杠；`^…$` 全串锚定保证 uTools 回传的 `payload` 即完整输入（Assumption A-001）。
- `maxLength: 64` 为 spec 派生边界（Assumption A-003），DEC-004 确认的正则字面量未被修改。
- 现有 `explain` feature、`tools` 配置一字不动（DEC-001、OUT-004）。

## Implementation Phases

严格遵循宪法原则 8：测试文件先于实现文件创建并先跑出 RED。

| 阶段 | 动作 | Covers | 验证（Verification） |
|------|------|--------|----------------------|
| **P1（RED）** | 新建 `src/App.test.jsx`：mock `./main-page` 捕获 props，断言 `onPluginEnter` 回调携带的 action 被透传、`onPluginOut` 后不渲染 | REQ-002 | `npm test` → 该文件**失败**，且失败原因与预期一致 |
| **P2（GREEN）** | 改 `src/App.jsx`：新增 `enterAction` state 与 prop 透传 | REQ-002 | `npm test src/App.test.jsx` → 通过；其余既有测试仍全绿 |
| **P3（RED）** | 在 `src/main-page/index.test.jsx` 追加 `describe('MainPage 匹配指令进入')`：预填+自动查询、模型取自偏好、空 payload 不查询、功能指令进入不查询、重复进入使用新 payload | REQ-003、REQ-004、REQ-005 | `npm test` → 该用例组**失败** |
| **P4（GREEN）** | 改 `src/main-page/index.jsx`：新增 `enterAction` prop 与自动查询 effect（PLD-2/3/4） | REQ-003、REQ-004、REQ-005 | `npm test` → 全部通过（基线 141 + 新增） |
| **P5** | 改 `public/plugin.json`：按上节契约追加 feature（配置无单测，核验准则已在 spec REQ-001 记录） | REQ-001 | 手工：`node -e` 解析 JSON 校验合法性 |
| **P6** | 文档同步：`CLAUDE.md`（架构树 + 计数）、`README.md`（触发方式 + 结构树 + 计数） | NFR-003 | 回读校验：计数与 `npm test` 实际通过数一致；文档中不再出现旧计数 |
| **P7** | 门禁与人工核验 | NFR-002（门禁）、REQ-001（人工核验） | `npm test` 全绿；`npx standard` 无错；真实 uTools 按 spec REQ-001 三场景核验；顺带核验 OPEN-001（是否出现重复条目）并回写结论 |

**P6 编辑方式约束**：`CLAUDE.md` 与 `README.md` 的结构树含 Unicode box-drawing 字符（`├` / `└` / `│`），按宪法「代码规范」条款，对其修改 MUST 使用按行号操作的脚本（显式 UTF-8），MUST NOT 依赖文本匹配，且修改后 MUST 回读校验。

**分支与提交**：项目红线要求不得直接提交 `main`；本次在 spec 阶段创建的时间戳分支（`2026-0927-1312iz-word-match-command`）仅承载 CodexSpec 过程产物。实现阶段 MUST 从 `main` 创建 `feat/word-match-command` 分支（`git branch --show-current` 先行确认），并在该分支上一并提交：实现代码 + 测试 + 文档同步 + `.codexspec/specs/2026-0927-1312iz-word-match-command/` 过程产物 + `.codexspec/memory/constitution.md` 的 PATCH 修正。

## Verification Strategy

### 自动化

- `npm test`：全绿（基线 **141 passed** + 本特性新增）
- `npx standard`：无 lint 错误

### Spec 场景 ↔ 测试用例映射

| Spec 场景 | 测试位置 | 断言要点 |
|-----------|----------|----------|
| REQ-002 / 匹配指令进入时动作含匹配数据 | `src/App.test.jsx` | `MainPage` 收到的 `enterAction` 等于回调入参 |
| REQ-002 / 功能指令进入时动作不含匹配数据 | `src/main-page/index.test.jsx` | `type: 'text'` 时不触发 `query` |
| REQ-003 / 自动预填并出结果 | `src/main-page/index.test.jsx` | 输入框 `value` 为 payload；`query` 被调用一次且实参为 `(payload, undefined)` |
| REQ-003 / 自动查询使用当前偏好模型 | `src/main-page/index.test.jsx` | `getPreferredModel` 返回 `'model-x'` 时，`query` 实参为 `(payload, 'model-x')` |
| REQ-003 / 匹配数据为空时不查询 | `src/main-page/index.test.jsx` | `payload: ''` 时 `query` 未被调用 |
| REQ-004 / 功能指令进入保持手动查询 | `src/main-page/index.test.jsx` | `query` 未被调用且输入框为空 |
| REQ-004 / 重复进入行为可复现 | `src/main-page/index.test.jsx` | 以不同 `enterAction` 重新渲染后，`query` 以新 payload 被再次调用 |
| REQ-005 / 自动查询复用既有链路 | `src/main-page/index.test.jsx` | 断言调用的是 `useWordQuery` 返回的同一个 `query` 函数 |
| REQ-005 / 自动查询受历史开关约束 | 既有 `src/use-word-query/index.test.js` | 由构造保证（同一条 `query` 链路），不新增测试 |
| REQ-005 / 自动查询后同步按钮可见性一致 | 既有 `src/main-page/index.test.jsx` 的 flomo 用例组 | 由构造保证（`result` 为同一 state），不新增测试 |
| REQ-001 / 三个匹配场景 | 真实 uTools 手工核验 | 按 spec REQ-001 记录的准则逐条核验 |

### 人工核验步骤（P7）

1. `npm run dev` 启动 Vite（uTools 开发模式必须依赖它）
2. uTools 开发者工具中「卸载（开发模式）」→「安装（开发模式）」重新加载 `plugin.json`
3. 主输入框输入 `ephemeral` → 期望出现「单词详解」
4. 输入 `你好`、`hello world`、`abc123`、`well-known`、以及 65 个连续字母 → 期望均不出现
5. 输入 `查词` → 期望不出现「单词详解」（既有功能指令行为不变）
6. 选中「单词详解」进入 → 期望输入框预填且详解自动开始生成
7. 顺带观察（OPEN-001）：输入 `word` 是否同时出现功能指令与匹配指令两条目，将结论回写 `requirements.md`

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| `onPluginEnter` 监听注册时机晚于 uTools 派发，导致 payload 丢失、功能静默失效（当前 `setVisible(true)` 因初始值为 `true` 而掩盖了该风险） | 高：功能完全不可用 | 保持 uTools 插件通行做法——在根组件挂载时注册（页面加载期，早于 uTools 的页面就绪派发）；不引入额外机制（原则 7）。P7 第 6 步即为该风险的人工验证 |
| 同一插件在候选列表出现两条目（OPEN-001） | 低：轻微混淆 | 按 DEC-004 先不处理，P7 第 7 步实测后决策 |
| 自动查询消耗 AI 调用并写入历史 | 低：用户已知悉并接受（DEC-002） | 触发需用户显式选中指令并回车，非自动轮询；历史写入受既有开关门控（REQ-005） |
| 重复进入场景依赖 `MainPage` 的卸载/重挂载（`review-spec.md` Advisory A-1） | 中：若未来改为保持挂载，该场景静默失效 | P3 显式编写「重复进入」测试，把该依赖固定为契约 |
| 模型解析在两个位置各出现一次（`handleQuery` 用 state、自动查询用 getter） | 低：可读性 | PLD-3 已论证二者同源；若未来模型来源变更，两处需同步——已在文档中标注 |
| 长字母串（如 65 字母）不匹配 | 低：无真实英文单词受影响（最长 45 字母） | Assumption A-003 已标注该边界为 spec 派生 |

## Requirements Coverage

| Spec Requirement | Plan Coverage |
|------------------|---------------|
| REQ-001 | 组件表（`public/plugin.json`）+ 配置契约 + P5 + PLD-5（核验方式） |
| REQ-002 | PLD-1、PLD-2 + 组件表（`App.jsx`、`App.test.jsx`）+ P1/P2 |
| REQ-003 | PLD-2、PLD-3、PLD-4 + 组件表（`main-page`）+ P3/P4 |
| REQ-004 | PLD-2（短路条件）+ P3（功能指令进入、重复进入用例） |
| REQ-005 | PLD-4（同一 `query` 链路，由构造保证）+ Verification Strategy 映射表 |
| NFR-001 | Non-Goals + Architecture「新增依赖边：无」 |
| NFR-002 | Implementation Phases 的 RED/GREEN 顺序 + P7 门禁 |
| NFR-003 | 组件表（`CLAUDE.md`、`README.md`）+ P6 |

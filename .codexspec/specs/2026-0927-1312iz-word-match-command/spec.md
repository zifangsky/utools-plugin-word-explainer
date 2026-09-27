# Feature Specification: 匹配指令（复制单词即出详解）

<!--
Language: zh-CN（与 .codexspec/config.yml 的 language.output 一致）
-->

**Feature ID**: `2026-0927-1312iz`
**Requirements**: [requirements.md](./requirements.md)

## ADDED Requirements

### Requirement: REQ-001 注册单词匹配指令

插件 MUST 在 `public/plugin.json` 的 `features` 数组中新增一个功能项，`code` 为 `wordMatch`，其 `cmds` 包含一条 `type` 为 `"over"` 的匹配指令，`label` 为「单词详解」。该匹配指令 MUST 仅在主输入框内容为单个纯英文单词时命中。

Sources: NEED-001, CON-001, CON-002, CON-003, DEC-001, DEC-003

**验证方式**：本条属于 uTools 平台侧配置契约，其可观察结果（候选列表是否出现该指令）只能由 uTools 运行时产生，无法在本仓库的单元测试中验证。因此本条 MUST 在真实 uTools 环境中按下列场景手工核验；宪法原则 8「纯视觉/布局」豁免条款要求核验准则在实现前记录，下列场景即该准则。插件内部的进入动作处理逻辑由 REQ-002~REQ-005 的自动化测试覆盖。

#### Scenario: 单个英文单词命中匹配指令

- **WHEN** uTools 主输入框内容为单个纯英文单词（仅含 `[a-zA-Z]`，长度 2–100）
- **THEN** 候选中出现一条 `label` 为「单词详解」的匹配指令，其归属功能 `code` 为 `wordMatch`

#### Scenario: 非单词内容不命中

- **WHEN** 主输入框内容含空格、中文、数字、标点（如 `hello world`、`你好`、`abc123`、`well-known`），或字母长度超过 100
- **THEN** 该匹配指令不出现在候选中

#### Scenario: 中文功能指令不误命中

- **WHEN** 主输入框内容为「查词」
- **THEN** 该匹配指令不命中（正则仅接受 `[a-zA-Z]`），既有功能指令行为不受影响

### Requirement: REQ-002 进入动作可被主界面感知

uTools 调用 `onPluginEnter` 时传入的进入动作（至少含 `code`、`type`、`payload`）MUST 可被主界面获取，用于判定本次进入是否来自匹配指令。

Sources: NEED-002, CON-003

#### Scenario: 匹配指令进入时动作含匹配数据

- **WHEN** 用户通过 `wordMatch` 的匹配指令进入插件
- **THEN** 主界面可获取到 `code` 为 `wordMatch`、`type` 为 `"over"`、`payload` 为匹配到的单词字符串

#### Scenario: 功能指令进入时动作不含匹配数据

- **WHEN** 用户通过 `explain` 功能指令（`explain` / `查词` / `word` / `vocabulary`）进入插件
- **THEN** 主界面可获取到的 `type` 不为 `"over"`

### Requirement: REQ-003 匹配进入时预填并自动查询

当本次进入来自匹配指令且匹配数据为非空字符串时，主界面 MUST 将输入框预填为该字符串，并 MUST 立即自动发起一次查词，无需用户再点击「查询」。

Sources: NEED-002, DEC-002

#### Scenario: 自动预填并出结果

- **WHEN** 用户通过匹配指令进入，匹配数据为 `ephemeral`
- **THEN** 输入框显示 `ephemeral`，且立即以 `ephemeral` 发起一次查词，结果按既有流式渲染方式展示

#### Scenario: 自动查询使用当前偏好模型

- **WHEN** 用户已保存过 AI 模型偏好 `model-x`，并通过匹配指令进入
- **THEN** 本次自动查询以 `model-x` 作为模型参数；若未保存偏好，则以「默认模型」发起

#### Scenario: 匹配数据为空时不查询

- **WHEN** 本次进入来自匹配指令但匹配数据为空字符串
- **THEN** 不发起任何查词，界面停留在初始状态

### Requirement: REQ-004 其他入口行为不变

非匹配指令入口（`explain` 功能指令、`onMainPush` 选项进入等）MUST NOT 触发自动查询。

Sources: NEED-001, DEC-001, OUT-004

#### Scenario: 功能指令进入保持手动查询

- **WHEN** 用户通过 `explain` 功能指令进入插件
- **THEN** 输入框为空、无任何自动查词，用户仍可手动输入并点击「查询」或按 Enter

#### Scenario: 插件被重复进入时行为可复现

- **WHEN** 用户先后两次通过匹配指令进入，第二次匹配数据与首次不同
- **THEN** 两次均自动查询，且第二次查询使用的是第二次的匹配数据

### Requirement: REQ-005 自动查询复用既有查词链路

自动查询 MUST 复用既有 `useWordQuery` 链路，因此「保存查词历史记录」开关、AI 模型偏好、流式渲染、flomo 同步按钮显示条件等既有行为 MUST 保持不变。MUST NOT 为自动查询新增独立的调用路径或旁路。

Sources: NEED-002, CON-005

#### Scenario: 自动查询受历史开关约束

- **WHEN** 用户在设置中关闭「保存查词历史记录」，并通过匹配指令进入触发自动查询
- **THEN** 本次查询不写入查词历史（与手动查询行为一致），已有记录保留

#### Scenario: 自动查询后同步按钮可见性一致

- **WHEN** 自动查询产出结果，且已配置 flomo API 端点
- **THEN** flomo 同步按钮在结果生成后可见，与手动查询后的表现一致

### Requirement: REQ-006 匹配指令不与功能指令关键词重复命中

`over` 匹配指令的 `exclude` MUST 排除 `features[].cmds` 中所有纯 ASCII 字母关键词，使这些关键词的输入**只**命中功能指令，不额外产生一条「单词详解」候选。排除 MUST 为精确锚定且大小写不敏感，MUST NOT 误伤以关键词为前缀的真实单词。

Sources: CON-006, DEC-005, OUT-004

**验证方式**：本条为配置契约，由仓库内自动化测试覆盖（`src/plugin-manifest.test.js`）——遍历 `public/plugin.json` 的全部 `cmds` 字符串项，对纯 ASCII 关键词断言 `exclude` 命中；该测试同时防止后续新增关键词时 `exclude` 漂移，无需真机核验。

#### Scenario: 关键词输入只出现功能指令条目

- **WHEN** 主输入框内容为 `word` / `explain` / `vocabulary`（含大小写变体，如 `Word`、`EXPLAIN`）
- **THEN** 该输入不命中匹配指令，同一插件在候补中只有一个条目（功能指令）

#### Scenario: 普通单词仍出现匹配指令

- **WHEN** 主输入框内容为普通英文单词（如 `ephemeral`）
- **THEN** 候选中出现「单词详解」匹配指令，且该插件的功能指令不命中

#### Scenario: 以关键词为前缀的真实单词不受影响

- **WHEN** 主输入框内容为 `words` / `wordy` / `explains`
- **THEN** 该输入仍命中匹配指令（排除为精确锚定，不误伤更长的单词）

### Requirement: NFR-001 无新增依赖与依赖方向不变

本改动 MUST NOT 引入任何新的 npm 依赖，MUST NOT 新增或改变 `src/` 模块之间的依赖方向（宪法原则 1 的无环约束），MUST NOT 新增 `src/<module>/` 目录。

Sources: CON-005

### Requirement: NFR-002 严格 TDD 与质量门禁

本改动涉及的所有逻辑与可观测行为 MUST 先写失败测试（RED）再写最小实现（GREEN）；提交前 `npm test` MUST 全绿，`npx standard` MUST 无错误。

Sources: CON-004

### Requirement: NFR-003 文档与测试计数同步

新增测试后，`CLAUDE.md` 与 `README.md` 中的测试计数 MUST 更新为实际 `npm test` 通过数。

Sources: CON-004；宪法原则 6「文档与代码同步」

## Context

本插件当前只注册了功能指令（`explain` / `查词` / `word` / `vocabulary`），用户必须在 uTools 主输入框手动输入指令名才能打开插件。

uTools 主输入框的行为是：用户复制文本后呼出 uTools，剪贴板内容会被自动填入输入框。此时插件不会出现在候选中——因为单词文本不匹配任何功能指令名。用户必须清空输入、重新键入 `查词` 等指令，再回到输入框粘贴单词。

uTools 提供「匹配指令」机制（`plugin.json` → `features[].cmds[]` 的对象形式），可依据输入内容类型自动匹配出指令。本特性即为其在单词查词场景的落地。

涉及文件：

- `public/plugin.json` —— 新增 `wordMatch` feature 与 over 匹配指令
- `src/App.jsx` —— 当前 `onPluginEnter` 回调丢弃了进入动作，需使其可被主界面感知
- `src/main-page/index.jsx` —— 接收进入动作，命中匹配指令时预填并自动查询
- `src/main-page/index.test.jsx` —— 新增行为测试

已确认的 uTools 平台契约（来源：官方文档 `plugin.json 核心配置文件说明` 与 `事件`）：

- `feature.code`：必填，MUST 唯一，进入插件时回传给应用用于区分功能
- `feature.cmds`：`Array<string|object>`，字符串为功能指令，对象为匹配指令
- 匹配指令对象字段：`type`（必填，取 `regex` / `over` 等）、`label`（必填）、`regex` 型用 `match`、`over` 型用 `exclude`（均为带斜杠与 flag 的字符串；JSON 中反斜杠需双写）、`minLength` / `maxLength`（可选，按字符数）
- `utools.onPluginEnter(callback)` 回调参数为 `{ code, type, payload, option, from }`；`type` 取 `"text" | "img" | "file" | "regex" | "over" | "window"`，`payload` 为「`feature.cmd.type` 对应匹配的数据」
- （解包 `app.asar` 实证，2026-09-27）功能指令（`base`）的命中条件是**「输入是关键词的子串」**（`index.js` 的 `F()` 用 `keyword.indexOf(input) >= 0`），故 `ephemeral` 不命中 `explain`、`password` 不命中 `word`
- （解包 `app.asar` 实证，2026-09-27）`over` 的 `exclude` 转换走**单参数**路径，**不受**「任意匹配正则被忽视」判定的约束；`regex` 的 `match` 走双参数路径会被判定（本项目 `regex` 型因此从未生效）

## Goals

1. 用户复制一个英文单词后呼出 uTools，候选中直接出现「单词详解」指令，无需手动键入指令名。
2. 选中该指令进入插件后，单词已预填且详解已自动开始生成，实现「复制即出解释」。
3. 对既有功能指令入口、查词历史、模型偏好、flomo 同步等既有能力零回归。

## Non-Goals

- 不实现 `img` / `files` / `window` 等其他匹配类型；`over` 已是本特性的实现方案（见 CON-002），不在排除之列（OUT-001）
- 不实现 uTools 超级面板、全局快捷键等触发入口（OUT-002）
- 不接入外部词典 API 或本地词库（OUT-003）
- 不重构、不删除、不改名现有功能指令（OUT-004）
- ~~不为「与 `explain` / `word` / `vocabulary` 的重复命中」编写负向断言（DEC-004，待实测）~~ —— **已推翻**：真机实测确认会重复（OPEN-001），改由 REQ-006 + CON-006 + DEC-005 以 `exclude` 处理

## User Stories

### Story: 复制单词直接看解释

**As a** 英语学习者
**I want** 复制一个英文单词并呼出 uTools 后直接选中「单词详解」就得到完整解释
**So that** 我不必记忆和键入插件指令名，查词路径缩短为「复制 → 呼出 → 回车」

**Acceptance Criteria:**

- [ ] 主输入框为单个英文单词时，候选中出现 `label` 为「单词详解」的匹配指令
- [ ] 主输入框为「你好」、「hello world」、「abc123」等内容时，该指令不出现
- [ ] 选中该指令进入后，输入框预填该单词且详解自动开始生成
- [ ] 通过 `explain` / `查词` / `word` / `vocabulary` 进入时，不触发自动查询
- [ ] 关闭「保存查词历史记录」后，自动查询不写入历史

## Constraints

- **CON-001** 仅匹配单个纯英文单词（`[a-zA-Z]`），MUST NOT 匹配短语、句子、中文
- **CON-002** 匹配类型 MUST 为 `over`，MUST NOT 使用 `regex`（`regex` 型在本项目真机环境从未生效，见 requirements.md 的 CON-002-SUPERSEDED）
- **CON-003** 配置载体为 `public/plugin.json`；`over` 型的 `exclude` 为字符串形式的正则（当前 `"/[^a-zA-Z]|^(explain|word|vocabulary)$/i"`，语义为「排除任何含非字母字符的输入，或恰为功能指令关键词的输入」；flags 合法集为 `gimuy`）
- **CON-004** 严格 TDD：测试先于实现；`npm test` 全绿 + `npx standard` 无错
- **CON-005** 不新增依赖、不改变既有模块依赖方向
- **CON-006** 匹配指令 MUST NOT 与功能指令关键词产生重复候补：`exclude` MUST 精确锚定地排除 `cmds` 中的全部纯 ASCII 字母关键词（由 `src/plugin-manifest.test.js` 守护）
- **宪法原则 3** 单词解释内容 MUST 由 `utools.ai()` 生成，不接外部词典
- **宪法原则 7** 不为不可能出现的场景编写错误处理（如对 `type` 为 `over` 时 `payload` 必然为字符串这一前提不写防御分支）

## Assumptions

- **A-001**：`exclude` 的首项 `[^a-zA-Z]` 会排除任何含非字母字符（含空格）的输入，因此 `over` 命中时 uTools 回传的 `payload` 即用户输入的全部文本（纯字母串），无需再做截取或规整。
- **A-002**：自动查询的模型参数与手动点击「查询」完全一致——取当前已保存的模型偏好；无偏好时传 `undefined`，由既有 `useWordQuery` / `ai-call` 逻辑交给平台默认模型处理。
- **A-003（最终取值由用户指示确定，2026-09-27）**：REQ-001 的长度区间 2~100 由用户指示确定，取代原 spec 派生的 64 上界。下界 2 使单字母单词（`a`、`I`）不命中；上界 100 大于最长英文单词（`pneumonoultramicroscopicsilicovolcanoconiosis`，45 个字母），对任何真实英文单词不改变可观察行为。

## Open Questions

- ~~**OPEN-001**（非阻塞，Owner: Team）：uTools 是否合并同一插件的功能指令与匹配指令命中？~~ **已关闭（2026-09-27 15:27，真机实测）**：**不合并** —— 键入 `word` / `explain` 时同时出现两条目（功能指令 + 匹配指令）。处置见 DEC-005 / CON-006 / REQ-006。
- **OPEN-002**（非阻塞，Owner: User）：匹配范围是否应放宽到连字符 / 撇号词汇（`well-known`、`don't`）？首版按 CON-001 取纯字母，如需放宽再单独迭代。

## Requirements Traceability

| Confirmed Requirement | Spec Coverage |
|-----------------------|---------------|
| NEED-001 | REQ-001、REQ-002、REQ-004 |
| NEED-002 | REQ-002、REQ-003、REQ-005 |
| CON-001 | REQ-001（Scenario: 非单词内容不命中 / 中文功能指令不误命中） |
| CON-002 | REQ-001 |
| CON-003 | REQ-001、REQ-002 |
| CON-004 | NFR-002、NFR-003 |
| CON-005 | REQ-005、NFR-001 |
| CON-006 | REQ-006 |
| DEC-001 | REQ-001、REQ-004 |
| DEC-002 | REQ-003 |
| DEC-003 | REQ-001 |
| DEC-004（已由 DEC-005 取代） | Non-Goals、OPEN-001 |
| DEC-005 | REQ-006、Non-Goals |
| OUT-001 | Non-Goals |
| OUT-002 | Non-Goals |
| OUT-003 | Non-Goals、Constraints（宪法原则 3） |
| OUT-004 | REQ-004、Non-Goals |
| OPEN-001 | Open Questions（**已关闭**，结论转化为 REQ-006） |
| OPEN-002 | Open Questions（保留为未决，未转化为需求） |

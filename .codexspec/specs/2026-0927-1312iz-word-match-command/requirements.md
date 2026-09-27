# Confirmed Requirements: word-match-command

<!--
Language: zh-CN（与 .codexspec/config.yml 的 language.output 一致）
本文件是用户确认意图的权威持久记录。不复制完整对话，仅保留已确认决策与用于消解
后续解释争议的简短证据。
-->

**Feature ID**: `2026-0927-1312iz`
**Status**: Confirmed
**Last Confirmed**: 2026-09-27 13:16（后续 CON-002 / CON-003 的变更见文末「变更记录」）

## Authority Rules

- 仅 `Status: confirmed` 的条目是下游可绑定的输入。
- `open` 条目 MUST NOT 被转化为已确认的产品需求。
- 被替换的条目保留在本文件中，状态置为 `superseded` 并链接到替代条目。
- AI 推断 MUST 标注为假设，并在用户确认后方可成为绑定输入。

## Needs

### NEED-001: 复制英文单词后自动出现本插件的查词指令

- **Status**: confirmed
- **Statement**: 当 uTools 主搜索框中的内容为单个英文单词时，本插件应以「匹配指令」形式出现在候选中，指令名称为「单词详解」。
- **Rationale**: 当前插件只能通过输入 `explain` / `查词` / `word` / `vocabulary` 等功能指令触发。用户已把单词复制到剪贴板（uTools 会自动填入搜索框），此时插件不会被匹配出来，必须手动输入指令名，多一步操作。
- **User Evidence**: "复制一个单词到 utools 后能自动弹出当前单词解释插件"
- **Confirmed At**: 2026-09-27 13:16

### NEED-002: 通过匹配指令进入后自动发起查询并展示详解

- **Status**: confirmed
- **Statement**: 经匹配指令进入插件后，输入框预填该单词，并立即自动调用 AI 生成 7 板块详解，无需用户再点击「查询」。自动查询 MUST 复用既有查词链路（`useWordQuery`），因此「保存查词历史记录」开关与已选 AI 模型偏好的既有语义保持不变。
- **Rationale**: 用户诉求是「复制即得到解释」，仅预填输入框仍需额外一次点击，未达成目标。
- **User Evidence**: 设计确认题「通过匹配指令进入插件后，是否自动发起查询？」→ 用户选择「自动查询（复制即出结果）」
- **Confirmed At**: 2026-09-27 13:16

## Constraints

### CON-001: 仅匹配单个英文单词

- **Status**: confirmed
- **Statement**: 匹配范围为单个纯英文单词（仅 `[a-zA-Z]`），MUST NOT 匹配短语、句子或中文内容。
- **User Evidence**: 项目宪法原则 3「查词输入 MUST 为单个英文单词；MUST NOT 支持短语、句子或中文词汇输入」（supreme authority，不可覆盖）

### CON-002: 匹配指令 MUST 使用 `over` 类型并配严格 `exclude`

- **Status**: confirmed（**2026-09-27 14:36 变更**，原为「MUST 为 `regex`」；理由见「变更记录」）
- **Statement**: 指令 MUST 使用 `"type": "over"`，且 MUST 配 `exclude` 以排除非纯字母内容
  （`exclude: "/[^a-zA-Z]/"`）。原约束的前提「`over` 会匹配任意文本（含中文与长句）」在配
  `exclude` 后**不再成立**：`exclude` 命中的输入被直接排除，故中文（`你好`）、短语
  （`hello world`）、含数字（`abc123`）、含连字符（`well-known`）的输入均不会命中，
  **CON-001（仅匹配单个英文单词）仍被完整满足**。已用脚本对 17 组输入逐条核验。
- **变更理由（实测证据，非推测）**: `regex` 型指令在本项目真实环境中**连续 4 轮从未生效**，
  而 `over` 型一经配置即生效。判定实验（见 `issues.md` 第 5 轮）：

  | 轮次 | `wordMatch.cmds` | 是否重装 | 候补出现「单词详解」 |
  |------|-----------------|---------|-------------------|
  | 第 2 轮 | `regex` 单独 | 重启进程 | 否 |
  | 第 4 轮 | 字符串 + `regex` + **`over`** | 已重装 | **是** |
  | 第 5 轮 | 字符串 + `regex`（删 `over`） | 已重装 | **否** |

  第 4 ↔ 5 轮**唯一变量为 `over` 的存删** → `over` 是生效路径，`regex` 非。
- **User Evidence**: 原约束源自用户对「CON-002: 匹配类型 MUST 为 regex」的确认。
  2026-09-27 14:35 用户指示「把正则改成 `/[a-zA-Z]+/`，最小/最大字符改为 2/100」以解决
  匹配不到的问题。本变更**采纳其意图**（让「仅单个英文单词」的匹配真正生效 + 字符数 2~100），
  但**未采纳其具体形式**，两项理由：
  1. `regex` 型已确证不生效，修改其 `match` 内容无法解决「匹配不到」；
  2. 去掉 `^` `$` 后的 `/[a-zA-Z]+/` 为 search 语义（子串匹配），`hello world`、`abc123`
     均会命中，直接违反 CON-001。改用 `over` + `exclude: "/[^a-zA-Z]/"` 实现同一意图，
     语义上比原 `^...$` 更严格（后者的 exclude 版本连空格都排除）。

### CON-002-SUPERSEDED: ~~匹配类型 MUST 为 `regex`~~（已由 CON-002 取代）

- **Statement（历史）**: 指令 MUST 使用 `"type": "regex"`；MUST NOT 使用 `"type": "over"`。
- **原理由（历史）**: `over` 会匹配任意文本（含中文与长句），直接违反 CON-001。
- **失效说明**: 该理由的前提是 `over` **不配 `exclude`**。配 `exclude: "/[^a-zA-Z]/"` 后，
  `over` 的可观察行为等价于 `^[a-zA-Z]+$`，且 CON-001 经脚本逐条核验仍成立。
  加之 `regex` 型在真机 4 轮从未生效（实证），故本约束已由 CON-002 取代。

### CON-003: 配置载体为 `public/plugin.json`

- **Status**: confirmed（2026-09-27 14:36 字段形态随 CON-002 变更同步）
- **Statement**: 匹配指令 MUST 配置在 `public/plugin.json` 的 `features[].cmds[]` 中。`cmds` 元素为对象形式：`regex` 型用 `{type, label, match, minLength, maxLength}`，`over` 型用 `{type, label, exclude, minLength, maxLength}`。`match` / `exclude` 均为**带斜杠与 flag 的字符串**（JSON 中反斜杠需双写）。当前采用 `over` 型。
- **User Evidence**: uTools 官方文档「plugin.json 核心配置文件说明 → 匹配指令 / feature.cmds」；进入插件时 `onPluginEnter` 回调收到 `{code, type, payload}`，`type` 为匹配指令类型（`regex` 或 `over`）时 `payload` 为匹配到的文本。

### CON-004: 严格 TDD（测试先于实现）

- **Status**: confirmed
- **Statement**: 所有逻辑与可观测行为的改动 MUST 先写失败测试（RED）再写最小实现（GREEN）；`npm test` 全绿与 `npx standard` 无错是提交前提。
- **User Evidence**: 项目宪法原则 8「强制严格 TDD（不可妥协）」；质量门禁章节

### CON-005: 不新增运行时依赖

- **Status**: confirmed
- **Statement**: 本改动 MUST NOT 引入任何新的 npm 依赖，MUST NOT 改变既有模块依赖方向（宪法原则 1 的无环约束）。
- **User Evidence**: 宪法原则 7「简洁优先（YAGNI）」——匹配指令是平台配置能力，无需额外依赖。

## Decisions

### DEC-001: 匹配指令独立成新 feature（`code: wordMatch`）

- **Status**: confirmed
- **Decision**: 在 `public/plugin.json` 的 `features` 数组中新增一个 feature（`code: "wordMatch"`，承载「单词详解」指令），现有 `explain` feature 完全不动。**初始形态**为单条 `regex` 匹配指令；2026-09-27 真实环境复验未生效后，按用户指示更名为 `wordMatch`（原名 `explain-word`）并追加指令。当前实际形态见文末「变更记录」。原文中 `explain` 与 `wordMatch` 的并列审查记录（`review-spec.md` / `review-plan.md` / `review-tasks.md`）为**重命名前的审计快照**，其中的 `explain-word` 字样按历史记录保留，不追溯修改。
- **Alternatives Rejected**: 在现有 `explain.cmds` 中直接追加 regex 对象（改动行数更少，但需靠 `type === 'regex'` 判别，且把功能指令与匹配指令混在同一 feature 内）。
- **Reason**: 与 uTools 官方文档「plugin.json 配置完整示例」的写法一致（匹配指令各自独立成 feature，如 `test-regex` / `test-over` / `test-files` / `test-img` / `test-window`）；`onPluginEnter` 收到的 `code` 唯一，判别无歧义；现有功能指令零回归风险。
- **User Evidence**: 设计确认题「匹配指令的配置结构怎么放？」→ 用户选择「新建独立 feature（推荐）」

### DEC-002: 进入后自动查询

- **Status**: confirmed
- **Decision**: 经匹配指令进入时自动调用查询，输入框同步预填。
- **Alternatives Rejected**: 仅预填输入框、由用户手动点击「查询」（零副作用，但需多一次点击）。
- **Reason**: 最贴合「复制单词 → 直接看解释」的目标。副作用（消耗一次 AI 调用、按设置写入查词历史）用户已知悉并接受。
- **User Evidence**: 设计确认题「是否自动发起查询？」→ 用户选择「自动查询（复制即出结果，推荐）」

### DEC-003: 指令名称（`label`）为「单词详解」

- **Status**: confirmed
- **Decision**: 匹配指令的 `label` 取「单词详解」。（原始表述为「regex 指令」；2026-09-27 CON-002 将类型改为 `over` 后 `label` 取值不变。）
- **Alternatives Rejected**: 「查词」（最简短，但与现有功能指令同名，易混淆）；「英语单词详解」（信息完整，但与插件名重复且过长）。
- **Reason**: 与插件标题「英语单词详解」呼应，同时与既有功能指令「查词」形成区分，便于两个条目并存时辨认。
- **User Evidence**: 设计确认题「匹配指令在 uTools 搜索框里显示的指令名称（label）用哪个？」→ 用户选择「单词详解」

### DEC-004: 首版不处理与英文功能指令的重复命中

- **Status**: confirmed
- **Decision**: 匹配指令首版不为排除 `explain` / `word` / `vocabulary` 而写负向断言。（原始表述含「正则首版采用最简形式 `/^[a-zA-Z]+$/`」；该字面量已随 CON-002 变更为 `over` + `exclude: "/[^a-zA-Z]/"` 而失效，本决策本身继续有效。）
- **Alternatives Rejected**: 用负向断言排除这三个词（彻底避免重复，但正则可读性下降）；删除这三个英文功能指令（根治重复，但破坏既有用法）。
- **Reason**: uTools 很可能已对同一插件的命中做合并；且重复条目不影响功能。待真实 uTools 环境实测后再决定是否优化，避免为未证实的问题增加复杂度。
- **User Evidence**: 设计确认题「现有功能指令含 explain / word / vocabulary，可能产生重复条目，是否处理？」→ 用户选择「先不处理，实测后再定（推荐）」

## Out of Scope

### OUT-001: 其他匹配类型

- **Status**: confirmed
- **Statement**: 不实现 `img` / `files` / `window` 三类匹配指令。`over` 原列于此，但 2026-09-27 因 `regex` 型真机不可用而成为本特性的实现方案（见 CON-002），已移出「不实现」范围。
- **Reason**: 均超出本次「复制单词即查词」的诉求范围。
- **User Evidence**: 用户仅要求「匹配指令」能力用于单词查词场景。

### OUT-002: 其他触发入口

- **Status**: confirmed
- **Statement**: 不实现 uTools 超级面板（`from: "panel"`）与全局快捷键（`from: "hotkey"`）触发。
- **Reason**: 用户明确指向「匹配指令」这一机制，未提及超级面板或快捷键。
- **User Evidence**: "阅读一下…plugin-json.html#匹配指令 这个网页然后看看怎么实现"

### OUT-003: 外部词典能力

- **Status**: confirmed
- **Statement**: 不接入外部词典 API 或本地词库，不为匹配到的单词增加输入合法性二次校验之外的词典行为。
- **Reason**: 宪法原则 3 明确「所有单词解释内容 MUST 由 AI（`utools.ai()`）生成；MUST NOT 接入外部词典 API 或本地词库」。
- **User Evidence**: 项目宪法原则 3

### OUT-004: 不重构现有功能指令

- **Status**: confirmed
- **Statement**: 不删除、不改名现有 `explain` / `查词` / `word` / `vocabulary` 功能指令。
- **Reason**: 见 DEC-004；保持既有用户习惯。
- **User Evidence**: 见 DEC-004 用户选择「先不处理，实测后再定」

## Open Questions

### OPEN-001: uTools 是否合并同一插件的功能指令与匹配指令命中

- **Status**: open
- **Why It Matters**: 决定是否需要为 `explain` / `word` / `vocabulary` 增加负向断言（DEC-004 的后续）。
- **Owner**: Team（实现后于真实 uTools 环境手工验证）
- **阻塞性**: 非阻塞——不阻断 spec/plan/tasks 生成与实现。

### OPEN-002: 匹配范围是否含连字符 / 撇号词汇

- **Status**: open
- **Why It Matters**: 决定匹配范围是否放宽到连字符 / 撇号词汇（如 `well-known`、`don't`）——当前 `exclude: "/[^a-zA-Z]/"` 会将这些词整体排除。
- **Owner**: User
- **阻塞性**: 非阻塞——首版按 CON-001 取纯字母，如需放宽再单独迭代。
- **AI 假设（未确认）**: 依据宪法原则 3「单个英文单词」，首版取纯 `[a-zA-Z]`。用户在阶段摘要确认中未对该假设单独表态，故本条保持 `open`，仅 CON-001 为绑定约束。

## Superseded Entries

| 被替换条目 | 替代条目 | 替换时间 |
|-----------|---------|---------|
| `CON-002-SUPERSEDED`（匹配类型 MUST 为 `regex`） | `CON-002`（MUST 为 `over` + 严格 `exclude`） | 2026-09-27 14:36 |

## Confirmation Log

### Session 2026-09-27 13:16

- **Summary Presented**: 按 ID 分组的阶段摘要——NEED-001/002、CON-001~005、DEC-001~004、OUT-001~004 拟确认；OPEN-001（uTools 是否合并命中）与 OPEN-002（是否含连字符/撇号词）列为未决且非阻塞；另单独提请裁决「宪法内部测试计数不一致（原则 6 写 135，实测 141）」。
- **User Confirmation**: 明确选择「确认，继续生成 spec」；对宪法计数选择「本次一并修正（推荐）」。
- **Entries Confirmed**: NEED-001, NEED-002, CON-001, CON-002, CON-003, CON-004, CON-005, DEC-001, DEC-002, DEC-003, DEC-004, OUT-001, OUT-002, OUT-003, OUT-004
- **Entries Remaining Open**: OPEN-001, OPEN-002（均非阻塞，不阻断后续生成）

## 变更记录

### 2026-09-27 14:20 复验第 3 轮：feature 更名 + 指令扩充（用户指示）

- **触发**: 用户在真实 uTools 中复验，候补列表仍未出现「单词详解」；但开发者工具本项目详情页的「匹配」标签**已正确显示**解析结果（`特定文本` → `单词详解`；`/^[a-zA-Z]+$/`；最少 1 ~ 最多 64）。
- **用户指示**: ① 去掉 `code` 中的 `-`，`explain-word` 改名 `wordMatch`；② 为匹配指令补配一条「当前插件的指令」；③ 插件本地环境重启后**无需重启 uTools**，重新在开发者工具中「卸载（开发模式）」并安装即可；④ **AI 不得自动关闭 uTools 进程**。
- **已执行**:
  - `code`：`explain-word` → `wordMatch`；本文件 DEC-001 与 `spec.md` / `plan.md` / `tasks.md`、测试桩（`src/App.test.jsx`、`src/main-page/index.test.jsx`）同步更名。
  - `cmds` 由 1 条扩为 3 条：字符串指令 `单词详解` + `regex`（`label: 单词详解`）+ `over`（`label: 单词详解（复制即查）`）。
- **证据评估（重要）**: 用户提出的两条假设**在证据上均不成立**，但已按要求执行：
  - 「`-` 导致不生效」——官方 `plugin.json 配置完整示例` 中 feature `code` 自带连字符（`test-regex` / `test-over` / `test-files` / `test-img` / `test-window`）；
  - 「未配置 `label`」——`regex` 对象的 `label` 自首版即存在（`"label": "单词详解"`），且开发者工具「匹配」页正常显示该 label。
- **新增假设（本轮由 `over` 探针并行验证）**: 用户截图中的「匹配结果」列表内三条第三方指令**全为 `over` 类型**（「汇率换算 - 选中文本后计算」「翻译文本：用于快速翻译复制的文本」「搜索文本片段」），而 `over` 正是官方示例中「任意文本（含复制粘贴）匹配」的机制（`test-over`）。故保留 `over` 指令作为探针，一次性判定该场景下 `regex` 与 `over` 哪条真正生效。
- **待收敛**: 探针结论明确后，`wordMatch.cmds` 应合并为单条生效指令，移除冗余条目（避免候补中出现两个同类「单词详解」）。
- **对 REQ-001 的影响**: 无。`regex` 的 `match` 与 `minLength` / `maxLength` 未变，命中行为已用脚本对 12 组输入逐条核验，与 REQ-001 期望一致。

### 2026-09-27 14:30 复验第 4 轮：**复验通过** + 探针收敛

- **触发**: 用户在真实 uTools 中复验，`Alt+Space` → 输入 `ephemeral` → 「匹配结果」中出现带 `dev`
  角标的「**单词详解**」（本插件图标，快捷键提示 `(O)`）。**REQ-001 的正向场景首次在真实环境成立。**
- **结论一（`regex` 生效，非 `over`）**: 候补条目的 label 为「单词详解」，与 `regex` 指令的 label
  逐字一致；`over` 探针的 label「单词详解（复制即查）」**未出现**。故 A/B 探针的判别目标达成。
- **结论二（生效方式定论）**: 主搜索框的指令索引**只在「安装（开发模式）」时重建**。对比：
  第 2 轮「重启 uTools 进程」→ 候选无；第 4 轮「卸载（开发模式）」+「安装（开发模式）」→ 候选有。
  第 2 轮「重启 uTools 即生效」的结论**正式推翻**；用户在第 3 轮给出的操作方式**得到证实**。
- **归因说明（诚实记录）**: 第 3 → 第 4 轮之间，配置改动（`code` 更名、补字符串指令）与操作方式
  变更**同时发生**，故**无法严格单一归因**。可确证者仅两条：① 配置语法从未有错（第 2、3 轮开发者
  工具「匹配」页均能正常解析显示）；② 「重启进程」不足以重建索引，「卸载 + 安装」可以。
- **已执行（探针收敛）**: `wordMatch.cmds` 由 3 条收敛为 2 条，移除 `over` 探针：
  `["单词详解", { "type": "regex", "label": "单词详解", "match": "/^[a-zA-Z]+$/", "minLength": 1, "maxLength": 64 }]`。
- **对 REQ-001 / REQ-002 / REQ-003 的影响**: 无。`regex` 路径的字段与行为未变。
- **仍未核验（交接用户）**: Task 5.2 的负例集合、Task 5.3 端到端（预填 + 自动查询、功能指令回归）、
  Task 5.4 的 OPEN-001（输入 `word` 是否同时出现两条目）。

### 2026-09-27 14:39 复验第 5 轮：**推翻第 4 轮判定** —— 生效路径为 `over`，`regex` 从未生效

- **触发**: 用户第 5 轮复验，候补中的「单词详解」**消失**。用户怀疑「正则表达式有问题」，指示把
  `match` 改为 `/[a-zA-Z]+/`，并把最小 / 最大字符数改为 2 / 100。
- **决定性证据（第 4 ↔ 5 轮唯一变量）**: 两轮的 `public/plugin.json` 差异**仅为 `over` 指令的存删**，
  其余（`code`、字符串指令、`regex` 指令）完全一致；两轮均已重新「安装（开发模式）」。

  | 轮次 | `wordMatch.cmds` | 候补「单词详解」 |
  |------|-----------------|----------------|
  | 第 4 轮 | 字符串 + `regex` + **`over`** | **有** |
  | 第 5 轮 | 字符串 + `regex`（删 `over`） | **无** |

  → **`over` 是唯一生效路径；`regex` 在真机从未生效。** 第 4 轮「候补 label 与 `regex` 的 label
  一致 → 判定 `regex` 生效」的推断**不成立**：uTools 对同一 feature 的候补显示 label 并非取被命中
  指令自身的 label（推断：取 `cmds` 首项，即字符串指令「单词详解」；未直接验证）。
- **用户指示的采纳情况（部分采纳，理由如下）**:
  - **采纳其意图**：① 让「仅单个英文单词」的匹配**真正生效**；② 字符数区间改为 2 ~ 100。
  - **未采纳其具体形式**（继续使用 `regex` 并把 `match` 改为 `/[a-zA-Z]+/`），两项理由：
    1. `regex` 型已确证不生效，修改其 `match` 内容**无法解决**「匹配不到」；
    2. 去掉 `^` `$` 后的 `/[a-zA-Z]+/` 是 **search（子串）语义**，`hello world`、`abc123`
       均会命中，直接违反 CON-001。
  - **替代实现**：改用 `over` 型 + `exclude: "/[^a-zA-Z]/"`。该组合对 17 组输入的命中行为与
    原 `^[a-zA-Z]+$` 等价且**更严格**（连空格也排除），CON-001 完整满足。
- **已执行的全部变更**:
  | 项 | 变更 |
  |----|------|
  | `public/plugin.json` | `wordMatch.cmds` 第 2 项：`regex`+`match` → **`over`+`exclude: "/[^a-zA-Z]/"`**；`minLength` 1 → **2**；`maxLength` 64 → **100** |
  | `src/main-page/index.jsx` | 自动查询守卫：`enterAction.type !== 'regex'` → **`!== 'over'`**（`onPluginEnter` 的 `type` 随匹配类型变化，不改则端到端失效） |
  | `src/main-page/index.test.jsx`、`src/App.test.jsx` | 测试桩的 `type: 'regex'` → `'over'`（共 7 处） |
  | `requirements.md` | CON-002 由「MUST 为 `regex`」变更为「MUST 为 `over` 且配严格 `exclude`」；原条目降为 `CON-002-SUPERSEDED`；CON-003 字段形态同步 |
  | `spec.md` / `plan.md` / `tasks.md` | 类型与长度参数全量同步（21 处）；`spec.md` 的官方 type 枚举列表经人工复核已还原为 `"text" \| "img" \| "file" \| "regex" \| "over" \| "window"` |
  | `spec.md` | 「匹配指令对象字段」补充 `over` 型所用 `exclude` 字段说明 |
- **测试先行证据（宪法原则 8）**: 先改测试 → `npx vitest run src/main-page/index.test.jsx`
  得 **`3 failed | 27 passed (30)`**，失败原因为预期（输入框 `Received:` 空字符串、`query` 调用数为 0）
  → 再改实现 → 全套 **149 passed**。
- **⚠️ 由参数变更直接引入的两项行为变化（已向用户明示）**:
  1. **`minLength: 2`** → 单字母单词（`a`、`I`）**不再命中**。原 `minLength` 为 1。
  2. **`maxLength: 100`** → 「65 个连续字母」由「不命中」变为**命中**；`tasks.md` 中 5.2 的负例
     上界已相应调整为 101 个连续字母。
- **对 REQ-001 / REQ-002 / REQ-003 的影响**: 触发条件（仅单字母序列）不变；**进入动作的 `type`
  取值由 `regex` 变为 `over`**（REQ-002 已同步）。REQ-003 的自动查询逻辑不变。


### 2026-09-27 15:05 复验第 6 轮：**端到端核验通过**（Task 5.3）+ 启动路径性能修复

- **触发**: 用户第 6 轮真机复验确认 `Alt+Space` → 输入 `ephemeral` → 候补出现「单词详解」→
  **选中后输入框预填且详解自动开始生成**。REQ-003 与 REQ-004 的端到端行为在真机成立。
- **新增问题（用户报告）**: 经匹配指令进入后「要等很久才真正执行查询并在屏幕中展示」，
  而手动进入再点查询无此观感。
- **根因（解包 `app.asar` 取证，非推测）**:
  1. `utools.dbStorage.getItem()` 为**同步 IPC**（handler 用 `event.returnValue` 回填，配对
     `ipcRenderer.sendSync`），读取期间渲染进程**完全阻塞**；
  2. 主界面挂载期连续发起 6 次同步存储读取，其中 2 次为同一 key 的重复读取；
  3. `utools.allAiModels()` 在挂载期被调用，其内部为「全库前缀扫描 + 远程 `/model/list` 请求」，
     而结果仅设置页的模型下拉框使用。
- **差异成因**: 手动路径把上述开销算在「插件打开」阶段，用户无感；匹配指令路径把同样开销压在
  「进入之后」的感知窗口内，故只有该路径显得卡顿。本质是**既有实现缺陷被新入口放大**，非本特性引入。
- **已执行（严格 TDD）**: `allAiModels()` 与 `getFlomoTags()` 下放到进入设置页时加载；模型偏好改用
  `ref` 缓存，每次挂载只读一次。新增 5 条测试，先跑出 `4 failed | 31 passed` 再修实现至全绿。
- **旁证**: 全量测试的 React `act` 警告由 27 条降至 1 条（残留 1 条属 `HistoryView`，与本次无关）。
- **门禁**: `npm test` **154 passed**、`npx standard` 退出码 0、`npm run build` 成功。
- **仍未核验**: Task 5.2 的负例集合与 101 字母上界；Task 5.4 的 OPEN-001（输入 `word` 是否同时出现两条目）。

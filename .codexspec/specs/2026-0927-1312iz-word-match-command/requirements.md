# Confirmed Requirements: word-match-command

<!--
Language: zh-CN（与 .codexspec/config.yml 的 language.output 一致）
本文件是用户确认意图的权威持久记录。不复制完整对话，仅保留已确认决策与用于消解
后续解释争议的简短证据。
-->

**Feature ID**: `2026-0927-1312iz`
**Status**: Confirmed
**Last Confirmed**: 2026-09-27 13:16

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

### CON-002: 匹配类型 MUST 为 `regex`

- **Status**: confirmed
- **Statement**: 指令 MUST 使用 `"type": "regex"`；MUST NOT 使用 `"type": "over"`。
- **User Evidence**: `over` 会匹配任意文本（含中文与长句），直接违反 CON-001。uTools 官方文档亦指出「任意匹配的正则会被 uTools 忽视」，故需可判别的具体正则。

### CON-003: 配置载体为 `public/plugin.json`

- **Status**: confirmed
- **Statement**: 匹配指令 MUST 配置在 `public/plugin.json` 的 `features[].cmds[]` 中。`cmds` 元素为对象形式 `{type, label, match, minLength, maxLength}`，`match` 为带斜杠与 flag 的字符串（JSON 中反斜杠需双写）。
- **User Evidence**: uTools 官方文档「plugin.json 核心配置文件说明 → 匹配指令 / feature.cmds」；进入插件时 `onPluginEnter` 回调收到 `{code, type, payload}`，`type` 为 `regex` 时 `payload` 为匹配到的文本。

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
- **Decision**: regex 指令的 `label` 取「单词详解」。
- **Alternatives Rejected**: 「查词」（最简短，但与现有功能指令同名，易混淆）；「英语单词详解」（信息完整，但与插件名重复且过长）。
- **Reason**: 与插件标题「英语单词详解」呼应，同时与既有功能指令「查词」形成区分，便于两个条目并存时辨认。
- **User Evidence**: 设计确认题「匹配指令在 uTools 搜索框里显示的指令名称（label）用哪个？」→ 用户选择「单词详解」

### DEC-004: 首版不处理与英文功能指令的重复命中

- **Status**: confirmed
- **Decision**: 正则首版采用最简形式 `/^[a-zA-Z]+$/`，不为排除 `explain` / `word` / `vocabulary` 而写负向断言。
- **Alternatives Rejected**: 用负向断言排除这三个词（彻底避免重复，但正则可读性下降）；删除这三个英文功能指令（根治重复，但破坏既有用法）。
- **Reason**: uTools 很可能已对同一插件的命中做合并；且重复条目不影响功能。待真实 uTools 环境实测后再决定是否优化，避免为未证实的问题增加复杂度。
- **User Evidence**: 设计确认题「现有功能指令含 explain / word / vocabulary，可能产生重复条目，是否处理？」→ 用户选择「先不处理，实测后再定（推荐）」

## Out of Scope

### OUT-001: 其他匹配类型

- **Status**: confirmed
- **Statement**: 不实现 `over` / `img` / `files` / `window` 四类匹配指令。
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
- **Why It Matters**: 决定正则采用 `/^[a-zA-Z]+$/` 还是放宽（如 `well-known`、`don't`）。
- **Owner**: User
- **阻塞性**: 非阻塞——首版按 CON-001 取纯字母，如需放宽再单独迭代。
- **AI 假设（未确认）**: 依据宪法原则 3「单个英文单词」，首版取纯 `[a-zA-Z]`。用户在阶段摘要确认中未对该假设单独表态，故本条保持 `open`，仅 CON-001 为绑定约束。

## Superseded Entries

（无）

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

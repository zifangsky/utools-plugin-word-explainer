# Issues: 匹配指令（复制单词即出详解）

**Feature ID**: `2026-0927-1312iz`
**Last Updated**: 2026-09-27

---

## Issue: 三项任务需真实 uTools 环境方可完成，AI 侧无法执行

- **Task**: 5.2、5.3、5.4
- **Error**: 这三项任务的核验对象是 uTools 运行时的可观察结果（主输入框候选列表、进入后的自动查询），
  本仓库的 Vitest/jsdom 环境无法产生该结果。uTools 的「安装（开发模式）」重载与主输入框交互
  属桌面 GUI 操作，需由用户在真实环境执行。
- **Attempted**:
  1. 已用等价手段覆盖可自动化的部分：`Task 3.2` 以脚本解析 `public/plugin.json`，逐字段比对配置值，
     并用 Python `re` 对该正则执行 12 组输入（含 `ephemeral`、`你好`、`hello world`、`abc123`、
     `well-known`、`查词`、64 字母、65 字母、空串），结果与 spec REQ-001 的期望逐条一致（全部 PASS）。
  2. 已按项目约定启动 Vite 开发服务器（`npm run dev`，HTTP 200），消除「空白页根因：dev server 未启动」这一前置阻塞。
  3. 已在 `tasks.md` 与 `plan.md` 中预先记录核验准则（符合宪法原则 8 的豁免条款要求：实现前记录验证准则）。
- **未尝试**：未以任何方式伪造 uTools 环境，也未将这三项标记为已完成。平台级配置断言的单元测试方案
  （`review-spec.md` 的 D-1）已在 `plan.md` PLD-5 中论证不采纳。
- **Status**: **Needs Discussion → 已交接用户执行**
  - 前置条件已就绪：Vite dev server 正在运行（`localhost:5173`）。
  - 待用户执行：uTools 开发者工具中「卸载（开发模式）」→「安装（开发模式）」重载 `plugin.json`，
    然后按 `tasks.md` 的 5.2 / 5.3 / 5.4 逐条核验。
  - 核验完成后由 AI 承接：把 OPEN-001 的观察结论回写 `requirements.md`，再执行 Task 6.2（创建 PR）。

---

## Issue: 匹配指令在真实 uTools 中未生效（根因已定位，待重新「接入开发」）

- **Task**: 5.2、5.3（首次复验失败，非实现缺陷）
- **现象**: 在主搜索框输入单个英文单词（如 `requirements`），候补列表中未出现「单词详解」。
- **根因**: **uTools 只在「接入开发 / 安装（开发模式）」时读取 `plugin.json` 中声明的指令。**
  `npm run dev` 仅热更新**前端代码**，不会重新注册指令；改完 `plugin.json` 而未重新接入，
  就会出现「配置正确 + 前端正常 + `npm test` 全绿，但搜索框匹配不到」的假象。
- **证据链**（非推测，均可复现）:
  1. uTools 数据库中记录本插件为开发模式：
     `{"value":"E:\\Claude_Code\\utools-plugins\\...word-explainer\\public\\plugin.json",
     "_id":"developer/fff29a109556969ec30c2459cb7aef48/ztwpfbsl"}`（`_rev: 11-...`）；
     `public/` 下仅有一个 `.json`，即 `plugin.json`，故加载目标无歧义。
  2. 对 uTools 全量数据检索 `explain-word` 与 `单词详解` → **零命中**；而 uTools 确实会缓存
     feature 列表（如 `{"pluginId":"a2478731","code":"Ctool","cmds":[...]}`）→ 新 feature 未被注册。
  3. 官方文档「调试插件应用」(`basic/debug-plugin.html`) 仅承诺「每次进入插件应用加载最新**代码**」，
     「进阶（代码热更新）」亦只针对入口文件 URL，均未涵盖 `plugin.json` 的指令注册。
  4. `public/plugin.json` 本身经逐字段比对官方示例确认写法正确（含 `match` 需带前后斜杠、
     匹配指令需独立成 feature），正则对 12 组输入判定与 spec REQ-001 期望逐条一致。
- **处置（已被第 2 轮修正，见下）**: 在 uTools 开发者工具中对本项目重新「**接入开发**」（或先
  「卸载（开发模式）」再接入）。
- **Status**: **Superseded by 第 2 轮结论** —— 本条的「根因」表述不准确，正确结论见下一个 Issue。

---

## Issue: 第 2 轮复验仍未生效 → 根因修正为「uTools 需完全重启」，环境已重置

- **Task**: 5.2、5.3、5.4（第 2 轮）
- **现象**: 用户复验后仍未匹配到「单词详解」。
- **根因修正**: 第 1 轮把「必须重新『接入开发』」写成了结论，**该表述不准确**。本轮证据显示：
  uTools **不把开发插件的 `features` 持久化到数据库**，只保存 `plugin.json` 的**路径**
  （`developer/fff29a109556969ec30c2459cb7aef48/ztwpfbsl`），指令列表在**启动时**从该文件现读。
  故正确结论是：**完全退出 uTools 并重启即可让新 `plugin.json` 生效**；「接入开发」只在首次
  添加项目或路径变更时才需要。
- **证据链（本轮新增）**:
  1. uTools 全量数据中，`单词详解`、`explain-word` 以及**旧指令的 label**（`英语单词详解`、
     `查词历史`）**全部零命中**。作为对照，商店版插件均有 `//feature/<pluginId>/<code>` 记录
     （如 `//feature/a2478731/...`、`//feature/zzllwcjx/codeMode__startCase`），而本插件
     `ztwpfbsl` **一条都没有** → 开发插件的 feature 表不落库，只能运行时构建。
  2. 唯一含旧 label 的载体是 `%APPDATA%\uTools\plugins\e42dee628bf745e1ed1fce04f98951b1.asar`
     ——本插件**曾经的商店打包副本**，内嵌 `plugin.json` 仅含旧 `explain` 功能。该 hash 在
     uTools 数据库中 **0 命中**（非活动安装），只是下载缓存 → 已排除「商店版重复安装」干扰。
  3. 本轮实际执行并观察到：结束全部 `uTools.exe` → 重新启动 → uTools **开发者工具本项目详情页的
     「匹配」标签**已正确显示新指令：`特定文本` → `单词详解`；`文本匹配 /^[a-zA-Z]+$/`；
     `最少字符数 1`；`最多字符数 64`。即 uTools 已重新解析 `public/plugin.json`。
- **处置**:
  - `CLAUDE.md` 的操作说明已按上述事实**改正**：原「必须重新『接入开发』」→「完全退出 uTools 后
    重启即生效，`npm run dev` 与指令注册无关」；并补充「开发者工具『匹配』页可作为解析验证手段」
    与 uTools 热键 `Alt+Space`。
  - 环境已重置：Vite dev server 已重启（`localhost:5173` HTTP 200）；uTools 已完全退出并重新启动。
- **Status**: **Partially superseded by 第 3 轮** —— 其中「uTools 重启后，开发者工具『匹配』页已正确
  显示新指令」这一观察**得到证实**；但用户复验后主搜索框仍未出现「单词详解」，故本条的结论
  「重启 uTools 即生效」**不成立**。正确处置见第 3 轮。
  - 复验方式：`Alt+Space` 呼出 uTools → 输入或粘贴单个英文单词（如 `ephemeral`）→
    候补列表应出现「单词详解」。
  - 若仍不出现，下一步才是重新「接入开发」（或先「卸载（开发模式）」再接入）。
  - 通过后由 AI 承接：回写 OPEN-001 结论 → 执行 Task 6.2（创建 PR）。

---

## Issue: 第 3 轮复验仍未生效 → 配置已按用户指示更名并扩充，新增 `over` 并行探针

- **Task**: 5.2、5.3、5.4（第 3 轮）
- **现象**: 用户复验后主搜索框仍未匹配到「单词详解」；但开发者工具本项目详情页的「匹配」标签
  **已正确显示**解析结果（`特定文本` → `单词详解`；`/^[a-zA-Z]+$/`；1 ~ 64）。
- **用户指示（已执行）**:
  1. `code` 去掉 `-`：`explain-word` → `wordMatch`；
  2. 为匹配指令**补配一条「当前插件的指令」**；
  3. 插件本地环境重启后**无需重启 uTools**，在开发者工具中「卸载（开发模式）」再安装即可；
  4. **AI 不得自动关闭 uTools 进程**（uTools 常驻，无需手动关闭）。→ 已写入 `CLAUDE.md`。
- **对用户两条假设的证据评估（均不成立，但已按要求执行）**:
  - 「`-` 导致不生效」：官方 `plugin.json 配置完整示例` 中 feature `code` **自带连字符**
    （`test-regex` / `test-over` / `test-files` / `test-img` / `test-window`）；
  - 「未配置 `label`」：`regex` 对象的 `label` 自首版即存在，且开发者工具「匹配」页正常显示该 label。
- **本轮新增假设（并行探针）**: 用户截图中的「匹配结果」列表内三条第三方指令**全为 `over` 类型**
  （「汇率换算 - 选中文本后计算」「翻译文本：用于快速翻译复制的文本」「搜索文本片段」），而
  `over` 正是官方示例中「任意文本（含复制粘贴）匹配」的机制（`test-over`）。故在 `wordMatch`
  下同时保留 `regex`（`label: 单词详解`）与 `over`（`label: 单词详解（复制即查）`），
  以**一次性判定**该场景下真正生效的类型。
- **为避免的弯路**: 「在 `%APPDATA%\uTools` 中检索新指令」**不能**作为判据 —— 已证实开发插件的
  feature 表**不落库**（见第 2 轮证据 1），全量检索零命中是**常态**。
- **处置**: `public/plugin.json` 已更新；spec 产物（`requirements.md` / `spec.md` / `plan.md` /
  `tasks.md`）与测试桩中的 `explain-word` 已同步更名为 `wordMatch`（`review-*.md` 为更名前的
  审计快照，按历史保留）。本地开发环境已重启（Vite，`localhost:5173` HTTP 200）。
- **Status**: **Resolved by 第 4 轮** —— 用户复验通过（候补出现「单词详解」），确证 `regex`
  路径生效；`over` 探针已按本节「待收敛」要求移除。详见下一条 Issue。

---

## Issue: 第 4 轮复验通过 —— 候补出现「单词详解」，探针已收敛

- **Task**: 5.2（正向场景）、5.4（部分）
- **现象（用户截图实测）**: `Alt+Space` 呼出 uTools → 输入框为 `ephemeral` → 「匹配结果」网格中
  出现带 `dev` 角标的「**单词详解**」（本插件图标，快捷键提示 `(O)`）。
- **结论一：`regex` 路径生效（非 `over`）**。判定依据（非推测）：
  - 候补条目的 label 为「**单词详解**」，与 `regex` 指令的 `label` 逐字一致；
  - `over` 探针的 label 是「**单词详解（复制即查）**」，**未出现在候补中**。
  - 故 `over` 并非本场景的生效路径，「并行探针」的判别目标已达成。
- **结论二：主搜索框的指令索引只在「安装（开发模式）」时重建。**
  对比第 2 轮与第 3 轮的操作差异：
  | 轮次 | `plugin.json` 配置 | 用户操作 | 结果 |
  |------|-------------------|---------|------|
  | 第 2 轮 | 含 `regex`（`code: explain-word`） | 完全退出并重启 **uTools 进程** | 候补**无**「单词详解」 |
  | 第 3 轮 | 含 `regex` + `over`（`code: wordMatch`） | 重启 Vite（不动 uTools） | 候补**无** |
  | 第 4 轮 | 同上（仅少一个 `over` 探针） | **「卸载（开发模式）」→「安装（开发模式）」** | 候补**有**「单词详解」✔ |
  第 2 轮的「重启 uTools 即生效」由此**正式推翻**；第 3 轮用户给出的操作方式
  （「卸载（开发模式）」→ 安装）**得到证实**。
- **归因的诚实说明**：第 3 → 第 4 轮之间，配置改动（`code` 更名 `wordMatch`、补字符串指令）
  与操作方式变更**同时发生**，故**无法严格单一归因**。可确证的仅是：
  1. 配置语法合法 —— 第 2、3 轮中开发者工具「匹配」页均已能正常解析显示，说明语法从未有错；
  2. 「重启进程」不足以重建主搜索框索引，而「卸载 + 安装（开发模式）」可以。
- **处置（已完成收敛）**: 移除 `over` 探针，`wordMatch.cmds` 收敛为
  `["单词详解", { type: "regex", label: "单词详解", match: "/^[a-zA-Z]+$/", minLength: 1, maxLength: 64 }]`。
  字符串指令「单词详解」保留（供直接搜索该词进入插件）。
  `CLAUDE.md` 已同步更新为上述两条结论（含「看得到 ≠ 会生效」的警示）。
- **Status**: **Superseded by 第 5 轮** —— 「结论一：`regex` 路径生效」**已被推翻**（第 5 轮删掉
  `over` 后候补即消失，两轮唯一变量为 `over` 的存删 → 实际生效路径是 `over`）。
  「结论二：索引只在『安装（开发模式）』时重建」**仍然成立**。详见下一条 Issue。
- **Remaining（仍需用户核验）**:
  - Task 5.2 的**负例**：`你好`、`hello world`、`abc123`、`well-known`、65 个连续字母、
    `查词` 均**不应**出现「单词详解」；
  - Task 5.3 端到端：选中「单词详解」进入后，输入框应已预填该单词且详解**自动开始生成**；
    再以功能指令 `查词` 进入时，输入框应为空且**不**自动查询；
  - Task 5.4 / OPEN-001：输入 `word` 观察是否**同时**出现功能指令（`explain` feature 的字符串
    指令 `word`）与匹配指令（`单词详解`）两条目，结论回写 `requirements.md`。

---

## Issue: 第 5 轮复验「单词详解」消失 → 第 4 轮判定被推翻，生效路径确认为 `over`

- **Task**: 5.2、5.3
- **现象（用户截图实测）**: `Alt+Space` → 输入 `ephemeral` → 「匹配结果」中**没有**「单词详解」
  （该位置被第三方指令「汉字转拼音」占据）。用户判断「是不是正则表达式有问题」，指示把 `match`
  改成 `/[a-zA-Z]+/`，最小 / 最大字符数改为 2 / 100。
- **决定性证据（第 4 ↔ 5 轮唯一变量）**: 两轮 `public/plugin.json` 的差异**仅为 `over` 指令的
  存删**，其余（`code`、字符串指令、`regex` 指令）逐字一致，且两轮均已重新「安装（开发模式）」。

  | 轮次 | `wordMatch.cmds` | 候补「单词详解」 |
  |------|-----------------|----------------|
  | 第 4 轮 | 字符串 + `regex` + **`over`** | **有** |
  | 第 5 轮 | 字符串 + `regex`（删 `over`） | **无** |

  → **`over` 是唯一生效路径；`regex` 在真机从未生效**（第 2 轮单独挂 `regex` 时同为「无」）。
- **第 4 轮推断为何错（认知修正）**: 第 4 轮依据「候补 label 为『单词详解』，与 `regex` 的 label
  逐字一致」判定 `regex` 生效。该推断**不成立** —— uTools 对同一 feature 的候补显示 label
  **并非取被命中指令自身的 label**（**推断**：取 `cmds` 首项，即字符串指令「单词详解」；未直接
  验证）。教训：**label 匹配不足以判定生效指令**，唯一可靠判据是**控制变量法的存删实验**。
- **用户指示的采纳情况（部分采纳）**:
  - **采纳其意图**：① 让匹配真正生效；② 字符数区间 2 ~ 100。
  - **未采纳其具体形式**（继续用 `regex` + `match: "/[a-zA-Z]+/"`），两项理由：
    1. `regex` 型已确证不生效，改其 `match` 内容无法解决问题；
    2. 去掉 `^` `$` 后为 **search（子串）语义**，`hello world`、`abc123` 均会命中，违反 CON-001。
  - **替代实现**：`over` 型 + `exclude: "/[^a-zA-Z]/"`，语义等价且更严格（空格亦排除）。
- **已执行**:
  | 文件 | 变更 |
  |------|------|
  | `public/plugin.json` | `wordMatch.cmds[1]`：`regex`+`match` → **`over`+`exclude: "/[^a-zA-Z]/"`**；`minLength` 1 → **2**；`maxLength` 64 → **100** |
  | `src/main-page/index.jsx` | 守卫 `enterAction.type !== 'regex'` → **`!== 'over'`**（`onPluginEnter` 的 `type` 随匹配类型变化，**不改则端到端失效**，候补出现也点不出结果） |
  | `src/main-page/index.test.jsx`、`src/App.test.jsx` | 测试桩 `type: 'regex'` → `'over'`（7 处） |
  | `requirements.md` | CON-002 变更为「MUST 为 `over` 且配严格 `exclude`」；原条目降为 `CON-002-SUPERSEDED`；CON-003 字段形态同步；新增第 5 轮变更记录 |
  | `spec.md` / `plan.md` / `tasks.md` | 类型与长度参数同步（21 处）；`spec.md` 官方 type 枚举经人工复核还原；补 `over` 型 `exclude` 字段说明；`tasks.md` 5.2 负例上界 65 → **101** |
  | `CLAUDE.md` | 探针段改为「`over` 为生效路径」的实测结论 |
  | 构建 | 已执行 `npm run build`，`dist/plugin.json` 与 `public/plugin.json` **无差异** |
- **测试先行证据（宪法原则 8）**: 先改测试 → `npx vitest run src/main-page/index.test.jsx` 得
  **`3 failed | 27 passed (30)`**（失败原因与预期一致：输入框 `Received:` 为空、`query` 调用数 0）
  → 再改实现 → 全套 **`12 files / 149 passed`**，`npx standard` 退出码 0。
- **⚠️ 由参数变更直接引入的两项行为变化（已向用户明示）**:
  1. **`minLength: 2`** → 单字母单词（`a`、`I`）**不再命中**；
  2. **`maxLength: 100`** → 「65 个连续字母」由不命中变为**命中**（负例上界已调至 101）。
- **Status**: **Needs Verification → 待用户复验（第 5 轮）**
  - 前置条件就绪：Vite dev server 运行中（`localhost:5173` HTTP 200，PID 17716）；
    已重新打包（`npm run build`，`dist/` 与 `public/` 的 `plugin.json` 已同步）。
  - 复验步骤：uTools 开发者工具 → 本项目 →「**卸载（开发模式）**」→「**安装（开发模式）**」
    → `Alt+Space` → 输入 `ephemeral`。
  - **期望**：候补出现「单词详解」，选中后**输入框预填且详解自动开始生成**（本轮同步修正了
    `type` 守卫，端到端才能通）。

---

## 未纳入本文件的事项

以下项为已识别的非缺陷建议，已在对应产物中书面记录理由，不构成待办阻塞：

| 项 | 出处 | 处置 |
|----|------|------|
| `plugin.json` 配置断言测试 | `review-spec.md` Design Opportunity D-1 | 不采纳，理由见 `plan.md` PLD-5 |
| 核验步骤脚本化 | `review-plan.md` Design Opportunity PD-2 | 不采纳，理由见 `tasks.md` Notes |
| 自动查询 effect 的依赖数组 | `review-code.md` CODE-001（LOW） | 仅报告不修复，理由见 `review-code.md` |
| `onPluginEnter` 注册时机竞态 | `review-plan.md` Risk Advisory PA-1 | 由 Task 5.3 人工核验承接 |
| 同插件重复命中去重 | `requirements.md` OPEN-001 | 由 Task 5.4 人工核验后决策 |
| 匹配范围是否含连字符/撇号词 | `requirements.md` OPEN-002 | 保持未决，非阻塞；如需放宽另行迭代 |

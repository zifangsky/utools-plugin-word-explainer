# Tasks: 匹配指令（复制单词即出详解）

<!--
Language: zh-CN（与 .codexspec/config.yml 的 language.output 一致）
-->

**Feature ID**: `2026-0927-1312iz`
**Plan**: [plan.md](./plan.md)
**Test-first 依据**：项目宪法原则 8「强制严格 TDD（不可妥协）」——所有逻辑与可观测行为的改动 MUST 先 RED 后 GREEN；以下第 1、2 组严格按该顺序编排。第 3、4、5 组为配置、文档与门禁，不适用单元测试先行的要求。

## 1. 进入动作透传（`src/App.jsx` 层）

- [x] 1.1 **[RED]** 新建 `src/App.test.jsx`：`vi.mock('./main-page')` 以捕获传入的 props；用例覆盖「`onPluginEnter` 回调携带的 action 被原样传给 `MainPage`」「`onPluginOut` 触发后不再渲染 `MainPage`」。Covers: REQ-002; Plan: P1 / 组件 `src/App.test.jsx`
- [x] 1.2 **[RED 确认]** 运行 `npm test src/App.test.jsx`，确认失败，且失败原因为「`MainPage` 未收到 action（prop 为 `undefined`）」，而非环境或语法错误。Covers: NFR-002; Plan: P1 验证
- [x] 1.3 **[GREEN]** 修改 `src/App.jsx`：新增 `enterAction` state（初值 `null`），在既有 `onPluginEnter` 回调内以入参更新该 state（保留既有 `setVisible(true)`），并向 `MainPage` 传入 `enterAction` prop。改动限定于此，不动 `onPluginOut` 分支与导入。Covers: REQ-002; Plan: P2 / PLD-1 / 组件 `src/App.jsx`
- [x] 1.4 **[回归]** 运行 `npm test`，确认 `src/App.test.jsx` 转绿，且既有 141 条测试无一失败。Covers: NFR-002; Plan: P2 验证

## 2. 主界面匹配进入行为（`src/main-page/index.jsx` 层）

- [x] 2.1 **[RED]** 在 `src/main-page/index.test.jsx` 追加 `describe('MainPage 匹配指令进入')`，复用文件既有的 `setupUseWordQuery` / `setupWindowUtools` / `getPreferredModel` mock 机制，覆盖 5 个用例：① `type: 'regex'` + `payload` 时输入框预填且 `query` 被调用一次，实参为 `(payload, undefined)`；② `getPreferredModel` 返回 `'model-x'` 时 `query` 实参为 `(payload, 'model-x')`；③ `payload` 为空字符串时不调用 `query`；④ `type: 'text'`（功能指令进入）时不调用 `query` 且输入框为空；⑤ 以不同 action 重新渲染后 `query` 以新 payload 被再次调用。Covers: REQ-003、REQ-004、REQ-005; Plan: P3 / 组件 `src/main-page/index.test.jsx`
- [x] 2.2 **[RED 确认]** 运行 `npm test src/main-page/index.test.jsx`，确认新增用例组失败，且既有 25 条 `MainPage` 测试仍全部通过（后者验证新增断言未误伤既有行为）。Covers: NFR-002; Plan: P3 验证
- [x] 2.3 **[GREEN]** 修改 `src/main-page/index.jsx`：函数签名改为接收 `enterAction` prop；新增自动查询 effect，守卫 MUST 为空值安全形式（`if (!enterAction || enterAction.type !== 'regex' || !enterAction.payload) return`），命中时 `setWord(payload)` 并 `query(payload, getPreferredModel() || undefined)`；effect 依赖数组为 `[enterAction]`。MUST NOT 复用 `handleQuery`（其从 `word` state 取值，同一 commit 内未更新）。Covers: REQ-003、REQ-004、REQ-005; Plan: P4 / PLD-2、PLD-3、PLD-4 / 组件 `src/main-page/index.jsx`
- [x] 2.4 **[全绿]** 运行 `npm test`，确认全部通过；记录实际通过数（记为 `N`），用于第 4 组文档同步。Covers: NFR-002; Plan: P4 验证

## 3. uTools 平台配置

- [x] 3.1 **[P]** 在 `public/plugin.json` 的 `features` 数组追加一项，内容严格等于 plan.md「`public/plugin.json` 新增配置契约」：`code` 为 `wordMatch`，`cmds` 含 `{ type: "regex", label: "单词详解", match: "/^[a-zA-Z]+$/", minLength: 1, maxLength: 64 }`。MUST NOT 改动既有 `explain` feature 与 `tools` 配置。Covers: REQ-001、DEC-001、DEC-003、OUT-004; Plan: P5 / 配置契约
- [x] 3.2 校验配置：用 node 解析 `public/plugin.json` 确认 JSON 合法、`features` 长度由 1 变为 2、新 feature 的字段值与上面逐项一致、既有 feature 的 `code`/`cmds` 与改动前相同（可用 `git diff` 佐证）。Covers: REQ-001、OUT-004; Plan: P5 验证

## 4. 文档与代码同步

- [x] 4.1 **[P]** 更新 `CLAUDE.md`：架构树 `App.jsx` 节点下补 `App.test.jsx` 行；「常用命令」中 `npm test` 的计数 `141` 改为实际值 `N`。MUST 使用按行号操作的脚本（显式 UTF-8），MUST NOT 依赖文本匹配（宪法「代码规范」条款）。Covers: NFR-003; Plan: P6 / 组件 `CLAUDE.md`
- [x] 4.2 **[P]** 更新 `README.md`：「触发方式」章节在既有功能指令之外补充匹配指令「单词详解」的说明；项目结构树 `App.jsx` 行下补 `App.test.jsx`；技术栈中 `(141 个测试)` 改为 `(N 个测试)`。项目结构树同样含 Unicode box-drawing 字符（`├` / `└`），对该行的修改 MUST 使用按行号操作的脚本（显式 UTF-8），MUST NOT 依赖文本匹配（plan P6 编辑方式约束）。Covers: NFR-003; Plan: P6 / 组件 `README.md`
- [x] 4.3 回读校验两份文档：确认取值为 `N`、旧计数与旧触发方式描述不再残留、文件头部内容未被截断（行数前后比对）。Covers: NFR-003; Plan: P6 验证

## 5. 门禁与人工核验

- [x] 5.1 运行 `npm test` 与 `npx standard`，记录实际通过数与 lint 结果；两者 MUST 全绿/无错。同一步以 `git diff --stat` 确认改动面不含 `package.json` / `package-lock.json`、`git status` 无新增 `src/<module>/` 目录，据此验证「无新增依赖、无新模块」。Covers: NFR-002、NFR-001; Plan: P7 门禁
- [ ] 5.2 真实 uTools 手工核验 REQ-001：`npm run dev` 启动 Vite；在 uTools 开发者工具中「卸载（开发模式）」→「安装（开发模式）」重载 `plugin.json`；主输入框依次输入 `ephemeral`（期望出现「单词详解」）、`你好`、`hello world`、`abc123`、`well-known`、65 个连续字母（均期望不出现）、`查词`（期望不出现「单词详解」且既有功能指令行为不变）。Covers: REQ-001、CON-001; Plan: P7 人工核验（spec REQ-001 记录的核验准则）
- [ ] 5.3 真实 uTools 手工核验端到端行为：选中「单词详解」进入后，确认输入框已预填该单词且详解自动开始生成（REQ-003）；随后退出并以功能指令 `查词` 进入，确认输入框为空且无自动查询（REQ-004）。Covers: REQ-003、REQ-004; Plan: P7 人工核验
- [ ] 5.4 核验 OPEN-001：输入 `word` 观察是否同时出现功能指令与匹配指令两条目；将观察结论回写 `requirements.md` 的 OPEN-001（若为「合并」则关闭该条目；若为「不合并」则保留并记录是否按 DEC-004 后续处理）。Covers: OPEN-001; Plan: P7 人工核验

## 6. 交付

- [x] 6.1 确认当前分支 `git branch --show-current` ≠ `main`；若在 `main` 则先从 `main` 创建 `feat/word-match-command`。在 `feat/word-match-command` 上提交：实现代码、测试、文档同步、`.codexspec/specs/2026-0927-1312iz-word-match-command/` 全部过程产物、`.codexspec/memory/constitution.md` 的 PATCH 修正。Covers: NFR-002; Plan: 分支与提交
- [ ] 6.2 创建到 `main` 的 PR，描述中附特性目录链接、spec/plan/tasks 路径、门禁结果与 5.2~5.4 的核验记录。Covers: NFR-002; Plan: 分支与提交（宪法「PR 要求」）

## Dependencies

```
1.1(RED) -> 1.2 -> 1.3(GREEN) -> 1.4 ---------------------+
                                                          |
2.1(RED) -> 2.2 -> 2.3(GREEN) -> 2.4 -----------------+   |
                                                      |   |
3.1 [P] -> 3.2 -------------------------------------+ |   |
                                                    | |   |
                      2.4 ---------------------+    | |   |
                                               v    | |   |
                             4.1 [P] ---------> 4.3 <-+ +--> 5.1 -> 5.2 -> 5.3 -> 5.4 -> 6.1 -> 6.2
                             4.2 [P] ---------> 4.3
```

说明：

- 第 1 组与第 2 组分别改动 `src/App.jsx` 与 `src/main-page/index.jsx`，逻辑上互不依赖，但按 plan.md 的 P1→P4 顺序串行执行，以保持与已批准计划一致。
- `4.1` / `4.2` 改动不同文件且都只依赖 `2.4` 的测试计数与 `3.1` 的配置，故可并发；`4.3` 依赖二者完成。
- `5.1` 依赖全部代码、配置与文档改动落地。
- `5.2` / `5.3` / `5.4` 为真实 uTools 人工核验，必须串行（同一次开发模式重载会话内完成）。

## Coverage

| Plan 组件 / 阶段 | Spec 需求 | Tasks |
|------------------|-----------|-------|
| `src/App.test.jsx`（新建）+ P1 | REQ-002 | 1.1、1.2 |
| `src/App.jsx` + P2 | REQ-002 | 1.3、1.4 |
| `src/main-page/index.test.jsx`（扩展）+ P3 | REQ-003、REQ-004、REQ-005 | 2.1、2.2 |
| `src/main-page/index.jsx` + P4 | REQ-003、REQ-004、REQ-005 | 2.3、2.4 |
| `public/plugin.json` + 配置契约 + P5 | REQ-001 | 3.1、3.2 |
| `CLAUDE.md` + `README.md` + P6 | NFR-003 | 4.1、4.2、4.3 |
| P7 门禁 | NFR-002 | 5.1 |
| P7 人工核验 | REQ-001、REQ-003、REQ-004 | 5.2、5.3 |
| P7 门禁（NFR-001 部分） | NFR-001 | 5.1 |
| Plan「分支与提交」 | NFR-002（提交与 PR 门禁） | 6.1、6.2 |

## Unmapped Tasks

- **6.1、6.2（分支与交付）**：不对应任何单条 `REQ`/`NFR`，依据为宪法「开发工作流 → 分支策略（红线）」与「质量门禁 → PR 要求」的仓库策略，属必要的实现支撑，非范围扩张。
- **5.4（OPEN-001 实测回写）**：不对应 `REQ`，依据为 requirements.md 的 OPEN-001 处置约定（DEC-004「实测后再定」）。该任务不修改产品行为，仅回写观察结论。

## Notes

- 任务 2.3 的守卫表达式 MUST 为空值安全形式：既有 25 条 `MainPage` 测试均不传 `enterAction`，且 `App.jsx` 首次进入前该值为 `null`（plan.md PLD-2）。
- 任务 2.3 MUST NOT 复用 `handleQuery`，也 MUST NOT 把 `selectedModel` state 作为模型来源（plan.md PLD-3、PLD-4）。
- 任务 4.1 / 4.2 的计数 `N` 以 2.4 记录的 `npm test` 实际通过数为准，MUST NOT 使用估算值（宪法原则 6）。
- 任务 4.1 与 4.2 均涉及含 Unicode box-drawing 字符的树形行（`CLAUDE.md` 架构树、`README.md` 项目结构树），MUST 用按行号操作的脚本（宪法「代码规范」条款 + plan P6 编辑方式约束）。
- 任务 3.1 的 `maxLength: 64` 为 spec 派生边界（spec Assumption A-003），DEC-004 确认的正则字面量 `/^[a-zA-Z]+$/` 不得修改。
- 未采纳 `review-spec.md` 的 Design Opportunity D-1（`plugin.json` 配置断言测试），理由见 plan.md PLD-5；任务 3.2 以一次性校验替代。
- 未采纳 `review-plan.md` 的 PD-2（把 5.2 的核验步骤脚本化），理由是本次仅一次核验、收益不足。


## 执行记录（2026-09-27）

### 测试先行证据（宪法原则 8）

| 任务 | RED 证据 | GREEN 证据 |
|------|----------|------------|
| 1.1 / 1.2 | `src/App.test.jsx` 首次运行：`2 failed \| 1 passed (3)`，失败原因为 `expected undefined to be null` 与 action 未透传，与预期一致 | 见 1.3 / 1.4 |
| 1.3 / 1.4 | — | `npm test` → 12 文件 / **144 passed**，既有 141 条无回归 |
| 2.1 / 2.2 | `src/main-page/index.test.jsx` 首次运行：`3 failed \| 27 passed (30)`，失败集中在「预填 + 自动查询」类断言（`query` 未被调用 / 输入框为空），既有 25 条 MainPage 测试仍全绿 | 见 2.3 / 2.4 |
| 2.3 / 2.4 | — | `npm test` → 12 文件 / **149 passed**（实际计数 `N = 149`） |

### 各任务实际结果

| 任务 | 结果 |
|------|------|
| 1.3 | `src/App.jsx` 新增 `enterAction` state（初值 `null`）与 prop 透传，净改动 2 行新增 + 2 行修改 |
| 2.3 | `src/main-page/index.jsx` 新增 `enterAction` prop 与自动查询 effect，守卫为空值安全形式，模型来源为 `getPreferredModel()`（PLD-3），未复用 `handleQuery`（PLD-4） |
| 3.1 | `public/plugin.json` 的 `features` 由 1 项增至 2 项，新增 `wordMatch` |
| 3.2 | 脚本逐项校验：JSON 合法、`features` 长度 = 2、新 feature 的 `code`/`type`/`label`/`match`/`minLength`/`maxLength` 全部匹配、既有 `explain` feature 与 `tools` 与改动前逐字符一致、正则对 12 组输入的判定与 spec REQ-001 期望逐条一致 → **ALL CHECKS PASSED** |
| 4.1 / 4.2 | 按行号脚本（显式 UTF-8）完成。`CLAUDE.md`：134 → 135 行；`README.md`：68 → 73 行（触发方式章节展开为功能指令/匹配指令两段） |
| 4.3 | 回读校验：两份文档 `grep "141"` 无残留；`149` 分别出现于 `CLAUDE.md:14` 与 `README.md:69`；两份文件头部内容完好 |
| 5.1 | `npm test` → **149 passed**；`npx standard`（改动面 4 个文件）→ 退出码 0、无输出；`git diff --stat` 不含 `package.json` / `package-lock.json`，无新增 `src/<module>/` 目录 → NFR-001 成立 |
| 6.1 | 在 `feat/word-match-command` 分支提交（已 `git branch --show-current` 确认非 `main`） |

### 最终代码审查（implement-tasks §7）

- 审查目标：`src/App.jsx`、`src/App.test.jsx`、`src/main-page/index.jsx`、`src/main-page/index.test.jsx`
- 结果：**Pass，99/100**；CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 1（`review-code.md` CODE-001，仅报告不修复）
- 自动修复轮次：1 / 2（无可自动修复项）
- 详细报告：`review-code.md`

### 未完成任务

`5.2`、`5.3`、`5.4`、`6.2` 因需真实 uTools 桌面环境而未能完成，原因、已尝试的等价手段与交接方式记录于 `issues.md`。前置条件（Vite dev server）已就绪。

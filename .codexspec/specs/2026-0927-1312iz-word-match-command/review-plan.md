# Plan Review Report

## Summary

- **Overall Status**: PASS
- **Compatibility Score**: 100/100
- **Authority Mode**: Requirements-first
- **Readiness**: Ready for Tasks
- **Review Rounds**: 2（第 1 轮 PASS_WITH_WARNINGS → 自动修正 3 Minor → 第 2 轮 PASS）

## Requirement Coverage

| Requirement | Plan Reference | Result |
|-------------|----------------|--------|
| REQ-001 | 组件表（`public/plugin.json`）+「`public/plugin.json` 新增配置契约」+ P5（`Covers: REQ-001`）+ PLD-5 + P7 人工核验 | ✅ 覆盖 |
| REQ-002 | PLD-1、PLD-2 + 组件表（`src/App.jsx`、`src/App.test.jsx`）+ Architecture 图中 `Covers: REQ-002` + P1/P2 | ✅ 覆盖 |
| REQ-003 | PLD-2、PLD-3、PLD-4 + 组件表（`src/main-page/index.jsx`）+ P3/P4 | ✅ 覆盖 |
| REQ-004 | PLD-2（短路条件）+ P3 用例（功能指令进入、重复进入）+ P7 人工核验步骤 5 | ✅ 覆盖 |
| REQ-005 | PLD-4（复用同一 `query`）+ Verification Strategy 映射表两行 | ✅ 覆盖 |
| NFR-001 | Goals/Non-Goals + Architecture「新增依赖边：无」+ 组件表 | ✅ 覆盖 |
| NFR-002 | Implementation Phases 的 RED/GREEN 顺序 + P7（`Covers: NFR-002`）| ✅ 覆盖 |
| NFR-003 | 组件表（`CLAUDE.md`、`README.md`）+ P6（`Covers: NFR-003`）| ✅ 覆盖 |

阶段/组件 `Covers:` 完备性：7 个实施阶段与 7 个组件行均具备 `Covers:`（第 1 轮修正后）。

### 核实过的仓库事实

| 计划中的断言 | 核实方式 | 结果 |
|--------------|----------|------|
| `src/App.jsx` 丢弃 `onPluginEnter` 入参 | 读 `src/App.jsx:9-11` | ✅ 属实 |
| `MainPage` 的 `word` 仅由输入框驱动 | 读 `src/main-page/index.jsx:43,178` | ✅ 属实 |
| `handleQuery` 从 `word` state 取值 | 读 `src/main-page/index.jsx:64-68` | ✅ 属实 |
| `selectedModel` 初始为空串、由挂载 effect 异步写入 | 读 `src/main-page/index.jsx:47,53-56` | ✅ 属实 |
| `query` 引用稳定（`useCallback([], …)`） | 读 `src/use-word-query/index.js:12-43` | ✅ 属实 |
| `App.jsx` 无测试文件 | `src/` 目录树 | ✅ 属实 |
| 历史 spec 产物已纳入版本控制 | `git ls-files .codexspec/specs` | ✅ 属实 |
| 新增 `src/**/*.test.jsx` 会被测试配置纳入 | 读 `vitest.config.js:9`（`include: ['src/**/*.test.{js,jsx}']`） | ✅ 可行 |
| `npm run deploy` 不会覆盖 `public/plugin.json` | 读 `package.json`（仅复制 `dist/assets/*`、`dist/index.html`） | ✅ 属实 |
| `getPreferredModel` 已在 `main-page` 内导入并在测试中被 mock | 读 `src/main-page/index.jsx:5`、`src/main-page/index.test.jsx:15-18` | ✅ 可行 |

## Verified Defects

### Critical

无。

### Warnings

无。

### Minor

（第 1 轮发现，已修正）

**PM-1：实施阶段表缺少 `Covers:` 追溯，违反规划规则**

- **Evidence**：`review-plan` 技能第 1 轮检查项「Verify each component or phase has `Covers:`」。
- **Location**：`plan.md` → Implementation Phases 表
- **Mismatch**：7 个阶段仅列出动作与验证，未标注所覆盖的 `REQ`/`NFR`；组件表与架构图已有 `Covers:`，阶段表缺失。
- **Impact**：`plan-to-tasks` 从阶段生成任务时缺少直接追溯锚点，降低任务到需求的可追溯性。
- **Remediation**：为阶段表增加 `Covers` 列并按阶段实际内容填入 `REQ-002` / `REQ-003~005` / `REQ-001` / `NFR-003` / `NFR-002`。不引入新决策。
- **Status**: ✅ 已修正（第 1 轮）

**PM-2：PLD-2 的判定条件未显式空值安全，会导致既有测试报错**

- **Evidence**：`src/main-page/index.test.jsx` 中 25 条既有测试均以 `<MainPage />` 渲染，不传 `enterAction`（值为 `undefined`）；`src/App.jsx` 在首次进入前该 state 为 `null`。
- **Location**：`plan.md` → Decision 2（PLD-2）
- **Mismatch**：原文以 `enterAction.type === 'regex' && enterAction.payload` 描述条件，字面直译为代码会在 `enterAction` 为 `undefined` 时抛错。
- **Impact**：若按字面实现，25 条既有测试全部失败，产生返工。
- **Remediation**：明确规定判定 MUST 以空值安全形式书写，并给出具体守卫表达式（`if (!enterAction || enterAction.type !== 'regex' || !enterAction.payload) return`）。属实现细节澄清，不改变产品行为。
- **Status**: ✅ 已修正（第 1 轮）

**PM-3：P6 未指明含 Unicode 树形字符文档的编辑方式**

- **Evidence**：宪法「代码规范」条款：「修改含 Unicode box-drawing 字符（树形图）的 `CLAUDE.md` 时，MUST 用脚本按行号操作而非文本匹配」；`CLAUDE.md` 架构树与 `README.md` 结构树均含 `├` / `└` / `│`。
- **Location**：`plan.md` → Implementation Phases P6
- **Mismatch**：P6 只写「文档同步」，未声明该强制编辑方式。
- **Impact**：实现阶段可能以文本匹配方式改树形行而反复失败，浪费时间并可能误改。
- **Remediation**：在阶段表下补 P6 编辑方式约束（按行号脚本 + 显式 UTF-8 + 修改后回读校验）。引用既有宪法条款，不引入新决策。
- **Status**: ✅ 已修正（第 1 轮）

### 第 2 轮复检结论

对修正后的 `plan.md` 重新执行 Fidelity/Coverage 与 Feasibility/Internal Quality 两轮检查：

- 8 条 `REQ`/`NFR` 全部有覆盖，且阶段与组件均带 `Covers:`。
- 10 条仓库事实断言全部核实通过；无引用不存在的模块、API 或路径。
- 无自相矛盾的组件职责或依赖声明；架构图标注「新增依赖边：无」与 NFR-001 一致。
- 计划级决策（PLD-1~5）均未改写任何已确认的产品行为或权衡：PLD-3 与 PLD-4 属实现细节，PLD-5 为对既有建议项 D-1 的显式不采纳，Assumption A-003 保持标注状态未被提升为需求。
- 无阻塞任务生成的决策缺口；无非法顺序、兼容性或安全假设。
- 无新增缺陷。

## Risk Advisories

**PA-1：`onPluginEnter` 注册时机与 uTools 派发时机的竞态**

- **适用条件**：插件页面加载与 uTools 派发进入事件的先后关系。
- **风险**：若派发早于根组件挂载时的监听注册，`payload` 丢失，功能静默失效。当前 `setVisible(true)` 因 `visible` 初始值为 `true` 而掩盖了同类风险，本特性会使该风险首次具备可观察后果。
- **与目标的关系**：直接决定 REQ-003 是否成立。
- **建议**：实现后按 P7 步骤 6 显式核验。若确有问题，再评估是否需将监听注册前移到模块加载期——但该前移会引入新的架构机制，与原则 7 存在张力，应先取得实测证据再决策。
- **状态**：计划已识别并给出缓解措施，不构成缺陷，不影响状态与评分。

**PA-2：模型解析存在两处来源**

- **适用条件**：未来若修改模型偏好的解析方式。
- **风险**：`handleQuery` 用 `selectedModel` state、自动查询用 `getPreferredModel()`，两处需同步修改。
- **与目标的关系**：PLD-3 已论证二者同源（`handleModelChange` 同时更新两者），当前不产生行为差异。
- **建议**：若后续引入新的模型来源（如按单词类型选模型），应把解析收敛为单一函数。
- **状态**：不构成缺陷。

## Design Opportunities

**PD-1：把「重复进入」依赖固定为显式契约（对应 `review-spec.md` 的 A-1）**

- **适用条件**：`MainPage` 的卸载/重挂载行为被改动时。
- **可获收益**：计划已把 P3 的「重复进入」用例列为必需测试，该用例将把「进入即重新挂载」的隐式依赖固定为可回归的契约，成本极低。
- **关系与目标**：保障 REQ-004 第二条场景长期成立。
- **备注**：计划已安排，无需额外动作。

**PD-2：REQ-001 的核验步骤可脚本化**

- **适用条件**：后续需要频繁回归匹配指令配置时。
- **可获收益**：把 P7 的 7 条人工核验步骤整理为可复用的检查清单。
- **关系与目标**：降低 REQ-001 的回归成本。
- **备注**：本次仅一次核验，脚本化收益不足，不采纳；属可选建议，不自动修正。

## Score Derivation

- Critical root causes: 0
- Warning root causes: 0
- Minor root causes: 3（PM-1、PM-2、PM-3，均已于第 1 轮修正）
- Round 1 formula: `max(80, 100 - 3 × 3)` = **91**
- Round 2（修正后复检）: 无残留缺陷 → 依规则「No defects: 100」→ **100/100**

# Code Review Report（第 2 轮 · 含配置面）

## Meta Information

- **Target**: `src/App.jsx`、`src/App.test.jsx`、`src/main-page/index.jsx`、`src/main-page/index.test.jsx`、`public/plugin.json`
- **Detected Language(s)**: JavaScript / JSX（React 19 + Vite 6 + Vitest 4）、JSON 配置
- **Review Date**: 2026-09-27
- **Reviewer Role**: Chief Architect
- **触发方式**: 用户手动调用 `codexspec:review-code`；起因是真实 uTools 环境中「匹配指令未生效」

## Summary

- **Overall Status**: Pass
- **Quality Score**: 99/100
- **One-line Assessment**: 代码与配置本身均无缺陷——`plugin.json` 的匹配指令写法经与官方文档逐字段比对确认正确；本轮唯一实质性发现是**一条未文档化的操作约束**（`plugin.json` 不随开发模式热更新），它正是用户侧「匹配不到」的直接诱因，已修复。

## 与第 1 轮的差异

| 项 | 第 1 轮 | 第 2 轮 |
|----|---------|---------|
| 审查范围 | 4 个 JS/JSX 文件 | 追加 `public/plugin.json`（**上轮遗漏的配置面**） |
| 新增发现 | — | CODE-201（MEDIUM，已修复） |
| 代码本身结论 | Pass 99/100 | 不变 |

> 上轮未覆盖 `public/plugin.json`，而本特性的核心改动恰好落在该文件上——这是本轮补审的直接动因。

## Static Analysis Results

| Tool | Status | Issues | Details |
|------|--------|--------|---------|
| `standard`（等价 eslint） | Pass | 0 | 4 个改动文件，退出码 0，无输出 |
| `npm test`（Vitest） | Pass | 0 | 12 个测试文件、149 条测试全部通过 |
| `tsc --noEmit` | 跳过 | — | 无 `tsconfig.json`（纯 JS + `jsconfig.json`），不适用 |
| JSON 解析 + 结构校验 | Pass | 0 | `public/plugin.json` 合法；顶层键 `main`/`preload`/`logo`/`development`/`features`/`tools`；`features` 长度 2（`explain` 4 条指令、`explain-word` 1 条） |
| 官方文档字段比对 | Pass | 0 | 见下「配置正确性交叉验证」 |

### 配置正确性交叉验证（人工审查承担）

针对「本地无 uTools 运行时可验的执行契约」，与官方文档（`plugin-json.html` 的「配置完整示例」及各类型示例）逐项比对：

| 字段 | 本项目取值 | 官方示例形态 | 结论 |
|------|-----------|--------------|------|
| feature 组织方式 | `features: [explain, explain-word]`，匹配指令独立成 feature | 完整示例中 `test-regex`/`test-over`/`test-files`/`test-img`/`test-window` **各自独立成 feature** | 一致 |
| `type` | `"regex"` | `"regex"` | 一致 |
| `label` | `"单词详解"` | `"打开链接"`、`"手机号查询"`（中文 label 合法） | 一致 |
| `match` | `"/^[a-zA-Z]+$/"` | `"/^1[3456789]\\d{9}$/"`（**字符串含前后斜杠**） | 一致 |
| `minLength` / `maxLength` | `1` / `64` | `1` / `1000`、`11` / `11` | 一致 |
| 未声明 `exclude` | — | `exclude` 仅属 `over` 类型（可选） | 正确省略 |

另核对官方限制条款：**「任意匹配的正则」会被 uTools 忽视**（如 `/.*/`、`/(.)+/`、`/[\s\S]*/`）。
本项目正则为 `^[a-zA-Z]+$`，属精确字符类约束，**不落入该限制**。

> 覆盖度说明：本仓库未配置 react-hooks ESLint 插件，「effect 依赖数组完整性」与「uTools 运行时可观察行为」两个维度无自动化工具覆盖，由人工审查承担（见 CODE-001、CODE-201）。

## Dimension Analysis

| Dimension | Score | Status | Key Findings |
|-----------|-------|--------|--------------|
| Idiomatic Clarity & Simplicity | 100/100 | Pass | 配置为声明式最小集，未加无关注释与投机字段；代码面与第 1 轮一致 |
| Correctness & Explicit Contracts | 100/100 | Pass | 配置字段与官方契约逐项一致；正则经 12 组输入验证与 spec REQ-001 期望逐条相符 |
| Runtime Robustness & Resource Discipline | 100/100 | Pass | 本次未引入新的运行时问题；上轮 CODE-001（LOW）维持「仅报告不修复」判定 |
| Architecture & Design Integrity | 100/100 | Pass | 未新增依赖边；匹配置信号独立成 feature，与既有功能指令解耦 |
| Constitution Alignment | 97/100 | Warn | 原则 6（文档与代码同步）缺口——见 CODE-201，已修复 |

## Constitution Alignment

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. 模块边界与无环依赖 | Pass | 无新增 `src/<module>/`；依赖边未变 |
| 2. 行为驱动测试 | Pass | 8 条新增测试均针对外部可观察行为；计数 149 已同步 |
| 3. 领域边界不可逾越 | Pass | `^[a-zA-Z]+$` 在平台层强制单个英文单词；内容仍由 `utools.ai()` 生成 |
| 4. uTools 平台契约与 preload 双份同步 | Pass | `public/preload/` 未改动，不产生 CommonJS/ESM 漂移；仅使用文档化契约 |
| 5. 流式渲染与响应感知 | Pass | 自动查询复用既有流式链路，未阻塞 UI |
| 6. 文档与代码同步 | **Warn** | 未文档化「`plugin.json` 改动后须重新接入开发」——CODE-201，已在本轮补齐 |
| 7. 简洁优先（YAGNI） | Pass | 未新增依赖与抽象；未为不可能场景写防御 |
| 8. 强制严格 TDD | Pass | 两轮 RED 均确认失败原因与预期一致后才进入 GREEN |

## Detailed Findings

### Critical Issues (CRITICAL)

无。

### Warnings (HIGH)

无。

### Warnings (MEDIUM)

- [x] **[CODE-201]**：`CLAUDE.md:8-28` — **文档缺失导致的操作性故障**：`plugin.json` 中声明的指令只在 uTools「接入开发」时被读取，`npm run dev` 不重新注册指令，而项目文档未声明该约束。
  - **Impact**：表现为「配置已正确写入、前端正常、`npm test` 全绿，但主搜索框匹配不到本插件」的假象。本次即因此产生一轮无效的自行排查，属可复现的协作成本。
  - **证据链**（非推测）：
    1. uTools 数据库中记录本插件为开发模式（`developer/<hash>/ztwpfbsl` → `...\utools-plugin-word-explainer\public\plugin.json`）；
    2. 对 uTools 全量数据检索 `explain-word` / `单词详解` → **零命中**，即新 feature 未被注册；
    3. uTools 确实会缓存 feature 列表（如 `{"pluginId":"a2478731","code":"Ctool","cmds":[...]}`）；
    4. 官方文档「调试插件应用」仅承诺「每次进入插件应用加载最新**代码**」，「进阶(代码热更新)」亦只针对入口文件 URL。
  - **Suggestion**（已应用）：
    ```markdown
    > **⚠️ 修改 `public/plugin.json` 后必须重新「接入开发」**
    > uTools 只在「接入开发 / 安装（开发模式）」时读取 `plugin.json` 中声明的指令。
    > `npm run dev` 仅热更新前端代码，**不会**重新注册指令。
    ```
    同时声明 `public/plugin.json` 为唯一配置源，`dist/` 下的副本不得手改。

### Suggestions (LOW)

- [x] **[CODE-202]**：`src/main-page/index.test.jsx` — 测试运行时输出 26 条 `An update to MainPage inside a test was not wrapped in act(...)`。
  - **归属已判定为既有技术债，非本次引入**。判定方法（可复现）：`git stash push -- src/main-page/index.test.jsx` 后用**原版**跑同一文件 → **21 条**；改后 26 条，差值 5 恰为本次新增用例数，且既有用例同样逐条产出该警告。
  - **处置**：按「精准修改」原则沿用既有写法，不做无关重构；根因（疑似异步 state 更新未 await）属独立的测试基建改造。**本轮不扣分**，仅备案以防后续被误判为回归。
- [x] **[CODE-203]**：`public/plugin.json` 与 `dist/plugin.json` 构成双份配置副本，`dist/plugin.json` 当前为过期版本（5 月 4 日，不含 `explain-word`）。
  - **Benefit**：属 `vite build` 的正常产物（构建时自 `public/` 拷入），非缺陷；已在 CODE-201 的文档补强中显式声明「唯一源为 `public/plugin.json`」，消除误改风险。**不扣分**。

## Strengths

- **配置面与代码面一致地保持最小化**：新增 feature 未复用既有 `explain` 的 `cmds`，而是独立声明，与官方完整示例的组织方式一致，也避免了功能指令与匹配指令的语义纠缠。
- **`match` 字面量与平台约定严格对齐**：保留字符串内前后斜杠（uTools 特有写法，易被误写成裸正则），并在 spec Assumption A-003 中标注 `maxLength: 64` 为派生边界而非需求。
- **故障定位依赖证据而非猜测**：本轮未凭经验断言「重启即可」，而是通过 uTools LevelDB 中的开发者记录与 feature 缓存检索构成证据链，再据官方文档确认机制。

## Recommendations

### Priority 1: Must Fix (Before Merge)

1. 无。CRITICAL/HIGH 为 0；CODE-201 已修复。

### Priority 2: Should Fix（当前迭代）

1. **在真实 uTools 中重新「接入开发」后复验匹配指令**——这是本特性的最终验收门，且**无法由自动化替代**（宪法原则 8 豁免条款）。前置条件已就绪：Vite dev server 运行中（`localhost:5173` HTTP 200）。
2. 复验通过后回写 `requirements.md` 的 OPEN-001（`word` 是否同时出现功能指令与匹配指令两条目），再执行 Task 6.2 创建 PR。

### Priority 3: Nice to Have (Future)

1. 若引入 `eslint-plugin-react-hooks`，需同步评估 CODE-001 的处理方式，**避免直接套用「补全依赖数组」**而引入重复查询。
2. 修复 CODE-202 的既有 `act(...)` 警告需先统一项目的异步测试约定（如需 await 微任务队列），属独立改造。

## Scoring Breakdown

| Category | Weight | Score | Rubric Basis | Deduction Details | Weighted |
|----------|--------|-------|-------------|-------------------|----------|
| Idiomatic Clarity & Simplicity | 25% | 100/100 | 90-100：符合语言与平台惯用法，无过度工程 | 无 | 25.0 |
| Correctness & Explicit Contracts | 25% | 100/100 | 90-100：契约明确，字段与官方文档逐项一致 | 无 | 25.0 |
| Runtime Robustness & Resource Discipline | 25% | 100/100 | 90-100：无新增运行时问题 | 无（CODE-202/203 备案不扣分） | 25.0 |
| Architecture & Design Integrity | 15% | 100/100 | 90-100：SRP 清晰、依赖方向干净 | 无 | 15.0 |
| Constitution Alignment | 10% | 97/100 | 90-100：完全对齐，仅原则 6 有缺口 | CODE-201（MEDIUM，-3，已修复） | 9.7 |
| **Total** | **100%** | | | | **99.7 → 99/100** |

> **Suggestion Cap**：LOW 项均备案不扣分（0/5），未触及上限。

### Score Validation Checklist

- [x] 每条扣分均在 Detailed Findings 中有对应条目（CODE-201）
- [x] 各维度分数 = 100 − 扣分之和（97 = 100 − 3；其余为 100）
- [x] 加权总分 = Σ(维度分 × 权重) = 25.0 + 25.0 + 25.0 + 15.0 + 9.7 = 99.7
- [x] LOW 扣分 0 ≤ 5 分上限
- [x] 无「幽灵扣分」
- [x] 分数与状态一致（Pass 要求 ≥ 80）

## Fix Loop 记录

- **轮次**：1 / 2（未触发第二轮）
- **自动修复范围**：CODE-201（MEDIUM）→ 已在 `CLAUDE.md` 补强文档约束并落地
- **仅报告不修复**：CODE-001（LOW，第 1 轮遗留，理由见 `review-code.md`）
- **备案不扣分**：CODE-202（既有技术债，已证归属）、CODE-203（构建产物正常现象）
- **测试安全性**：修复仅涉及 `CLAUDE.md` 文本，未触碰源码；`npm test` 基线保持 149 passed
- **终态**：无未解决的 CRITICAL/HIGH 缺陷 → 整体状态 **success**

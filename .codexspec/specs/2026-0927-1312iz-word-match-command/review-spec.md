# Specification Review Report

## Summary

- **Overall Status**: PASS
- **Compatibility Score**: 100/100
- **Authority Mode**: Requirements-first（`requirements.md` 已确认，权威顺序正常）
- **Readiness**: Ready for Planning
- **Review Rounds**: 2（第 1 轮 NEEDS_REVISION → 自动修正 1 Warning + 2 Minor → 第 2 轮 PASS）

## Traceability

| Confirmed Entry | Spec Reference | Result |
|-----------------|----------------|--------|
| NEED-001 | REQ-001、REQ-002、REQ-004；User Story「复制单词直接看解释」 | ✅ 覆盖 |
| NEED-002 | REQ-002、REQ-003、REQ-005；User Story 验收项 3/5 | ✅ 覆盖 |
| CON-001 | REQ-001（Scenario: 非单词内容不命中 / 中文功能指令不误命中）；Constraints | ✅ 覆盖 |
| CON-002 | REQ-001（`type` 为 `"regex"`）；Constraints | ✅ 覆盖 |
| CON-003 | REQ-001、REQ-002；Context（平台契约）；Constraints | ✅ 覆盖 |
| CON-004 | NFR-002、NFR-003；Constraints | ✅ 覆盖 |
| CON-005 | REQ-005、NFR-001；Constraints | ✅ 覆盖 |
| DEC-001 | REQ-001（`code: explain-word`）、REQ-004（现有 feature 不动） | ✅ 覆盖 |
| DEC-002 | REQ-003（预填 + 自动查询） | ✅ 覆盖 |
| DEC-003 | REQ-001（`label` 为「单词详解」） | ✅ 覆盖 |
| DEC-004 | Non-Goals；OPEN-001；A-003（正则字面量保持最简） | ✅ 覆盖 |
| OUT-001 | Non-Goals | ✅ 显式排除 |
| OUT-002 | Non-Goals | ✅ 显式排除 |
| OUT-003 | Non-Goals + Constraints（宪法原则 3） | ✅ 显式排除 |
| OUT-004 | REQ-004（Scenario: 功能指令进入保持手动查询）、Non-Goals | ✅ 显式排除 |
| OPEN-001 | Open Questions（保持 open，未转化为需求） | ✅ 合规 |
| OPEN-002 | Open Questions（保持 open，未转化为需求） | ✅ 合规 |

Sources 完备性：8 条 `REQ`/`NFR` 全部具备合法来源引用。

## Verified Defects

### Critical

无。

### Warnings

（第 1 轮发现，已修正）

**W-1：REQ-001 的验证方式缺失，会导致规划阶段产出不可执行的任务**

- **Evidence**：宪法原则 8 要求「测试文件 MUST 在实现文件之前创建」，同时豁免「纯视觉/布局」类改动并规定「以手动/截图核验替代，但 MUST 在实现**前**明确记录验证准则」。REQ-001 的验收对象是 uTools 运行时的候选列表，属平台侧配置契约，本仓库的 Vitest 环境无法产生该可观察结果。
- **Location**：`spec.md` → REQ-001
- **Mismatch**：原 REQ-001 只给出场景，未声明这些场景的验证载体。下游 `plan-to-tasks` 会据此生成「为 REQ-001 先写失败测试」的任务，而该测试在本仓库不可能成立。
- **Impact**：规划阶段产生无法执行或必然空转的任务，违反原则 8 的 TDD 门禁。
- **Remediation**：在 REQ-001 中显式声明其为手工核验项、记录核验准则，并指明自动化测试的覆盖边界落在 REQ-002~REQ-005。不引入任何新产品决策。
- **Status**: ✅ 已修正（第 1 轮）

### Minor

（第 1 轮发现，已修正）

**M-1：`maxLength: 64` 边界以确定语气表述，未标注为 spec 派生**

- **Evidence**：`requirements.md` 的 DEC-004 只确认正则字面量 `/^[a-zA-Z]+$/`，未确认任何长度上界；`/^[a-zA-Z]+$/` 本身不含长度约束。
- **Location**：`spec.md` → REQ-001 Scenario「非单词内容不命中」
- **Mismatch**：规范以已确认口吻断言「长度 1–64」，但该数值由 spec 自行推导。
- **Impact**：若下游误认为该数值经用户确认，后续迭代会缺失一次边界决策；因 64 大于最长英文单词（45 字母），对真实输入无可观察影响，故不构成 Warning。
- **Remediation**：新增 Assumption A-003，明确标注该边界为 spec 派生而非用户确认，并保留 DEC-004 的正则字面量不变。
- **Status**: ✅ 已修正（第 1 轮）

**M-2：NFR-003 的来源引用不完整**

- **Evidence**：文档与测试计数同步义务的直接出处是宪法原则 6「文档与代码同步」，而 NFR-003 仅引用了 CON-004（内容为严格 TDD 与质量门禁）。
- **Location**：`spec.md` → NFR-003
- **Mismatch**：单来源引用未覆盖该义务的权威出处。
- **Impact**：规划阶段追溯文档同步任务的依据时缺少宪法锚点。
- **Remediation**：Sources 追加「宪法原则 6」。属已验证事实的补全，不引入新决策。
- **Status**: ✅ 已修正（第 1 轮）

### 第 2 轮复检结论

对修正后的 `spec.md` 重新执行 Fidelity 与 Intrinsic Quality 两轮检查：

- 16 条已确认条目（NEED ×2、CON ×5、DEC ×4、OUT ×4、以及 OPEN ×2 的合规性）全部覆盖或显式排除，无遗漏、无语义漂移、无范围扩张。
- 无条目冲突；无多义性解释；无不可测试的必需行为；无缺失的失败/边界场景；无不可实现的约束。
- 两条 `OPEN` 条目均保持未决状态，未被提升为需求。
- 无新增缺陷。

## Risk Advisories

**A-1：进入动作的传递机制依赖 `App` 的挂载/卸载生命周期**

- **适用条件**：`spec.md` REQ-003 的「插件被重复进入时行为可复现」场景。
- **风险**：若具体实现把进入动作的传递设计成仅在组件首次挂载时读取一次，则第二次经匹配指令进入时不会重新触发查询。现有 `src/App.jsx` 通过 `visible` 状态控制 `MainPage` 的挂载（`onPluginOut` 时返回 `null`），该卸载行为恰好使 `MainPage` 每次进入都重新挂载，从而天然满足该场景；但若实现改为保持挂载以优化性能，该场景会静默失效。
- **与目标的关系**：直接影响 NEED-002「复制即出结果」的可重复达成。
- **建议**：规划阶段为该场景安排一条显式测试，使该依赖关系被测试固定，而非依赖现有副作用。
- **状态**：不构成缺陷，不影响状态与评分，不自动修正。

**A-2：与英文功能指令的重复命中尚未实测**

- **适用条件**：键入 `explain` / `word` / `vocabulary` 时（同时命中功能指令与新正则）。
- **风险**：候选列表可能出现同一插件的两条目，产生轻微混淆。
- **与目标的关系**：DEC-004 已确认「先不处理，实测后再定」，与本决策一致，无需在本次修订中解决。
- **建议**：实现后在真实 uTools 环境核验 OPEN-001，并把观察结果回写 `requirements.md`。

## Design Opportunities

**D-1：`plugin.json` 配置一致性可加一条低成本回归测试**

- **适用条件**：团队希望防止后续改动误删或改坏匹配指令声明。
- **可获收益**：可断言 `public/plugin.json` 中 `explain-word` feature 存在、其 `cmds` 含 `type: "regex"`、`label` 为「单词详解」、`match` 可构造为正则。属配置契约校验而非实现细节测试。
- **与目标的关系**：降低 REQ-001 手工核验的回归成本。
- **备注**：与原则 7「简洁优先」存在张力，是否采纳由规划阶段判断；不自动修正。

## Score Derivation

- Critical root causes: 0
- Warning root causes: 1（W-1，已于第 1 轮修正）
- Minor root causes: 2（M-1、M-2，已于第 1 轮修正）
- Round 1 formula: `max(50, 79 - 8 × (1 - 1) - 3 × 2)` = **73**
- Round 2（修正后复检）: 无残留缺陷 → 依规则「No defects: 100」→ **100/100**

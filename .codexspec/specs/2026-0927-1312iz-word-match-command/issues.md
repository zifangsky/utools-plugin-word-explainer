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
- **处置**: 在 uTools 开发者工具中对本项目重新「**接入开发**」（或先「卸载（开发模式）」再接入）；
  仍不生效则完全退出 uTools 后重启再试。该约束已补入 `CLAUDE.md`，防止再次误判。
- **Status**: **Needs Action → 待用户执行后复验**
  - 前置条件就绪：Vite dev server 运行中（`localhost:5173` HTTP 200）。
  - 复验步骤见 `tasks.md` 的 5.2 / 5.3 / 5.4。
  - 复验通过后由 AI 承接：回写 OPEN-001 结论 → 执行 Task 6.2（创建 PR）。

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

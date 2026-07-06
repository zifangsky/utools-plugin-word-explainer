# Confirmed Requirements: history-settings-and-batch-ops

**Feature ID**: `2026-0706-2348ab`
**Status**: Confirmed
**Last Confirmed**: 2026-07-06 23:55

## Authority Rules

- Only entries with `Status: confirmed` are binding downstream inputs.
- `open` entries MUST NOT be converted into confirmed product requirements.
- Replaced entries remain in this file with `Status: superseded` and a link to the replacement.
- AI inferences must be labeled as assumptions and require user confirmation before becoming binding.

## Needs

### NEED-001: 设置页新增「保存查词历史记录」开关

- **Status**: confirmed
- **Statement**: 在插件设置界面新增一个开关（toggle switch），控制是否保留单词查词记录。默认状态为开启（勾上）。关闭后，新的查词结果不再写入历史；已存在的历史记录不受影响、仍可查看。
- **Rationale**: 用户希望自主决定是否累积查词历史，避免隐私或无意义数据堆积。
- **User Evidence**: "新增一个选项，让用户决定是否需要保留单词的查词记录。这个选项默认勾上。"
- **Confirmed At**: 2026-07-06 23:55

### NEED-002: 历史页单词卡片增加复选框

- **Status**: confirmed
- **Statement**: 在历史记录列表（左栏）中，每一个单词卡片左侧增加复选框（checkbox），供用户勾选需要操作的记录。勾选状态与卡片点击查看详情互不冲突。
- **Rationale**: 为批量删除提供选择入口。
- **User Evidence**: "每一个查过的单词卡片旁边也增加一个复选框，让用户决定勾选哪些查词记录"
- **Confirmed At**: 2026-07-06 23:55

### NEED-003: 左下角批量操作栏（全选框 + 删除 + 练习占位）

- **Status**: confirmed
- **Statement**: 在历史记录页左下角（列表底部）增加操作栏，从左到右依次为：
  1. **全选复选框**：位于操作栏最左侧，点击选中当前上方列出的所有单词卡片，再次点击取消全部勾选。
  2. **删除按钮**：需至少勾选 1 项时可用；点击后执行批量删除。
  3. **练习按钮**：灰色、disabled 状态，本次仅做 UI 占位，不绑定任何逻辑。
- **Rationale**: 提供批量删除的操作入口与未来练习功能的占位。
- **User Evidence**: "在左下角区域，增加上复选勾选框，删除按钮"；"在左下角删除按钮的旁边增加一个灰色的'练习'按钮"；"操作栏最左边放置一个复选框，点击后自动全选当前上方列出的所有单词，再次点击则取消全部勾选"
- **Confirmed At**: 2026-07-06 23:55

### NEED-004: 批量删除历史记录

- **Status**: confirmed
- **Statement**: 勾选 1 条及以上记录并点击删除后：
  1. 弹出 `window.confirm()` 二次确认（文案含将要删除的条数）。
  2. 确认后，调用 `utools.db.remove()` 删除对应详情文档（`detail/*`），并同步更新 `history_summary` 索引文档（移除被删记录）。
  3. 删除完成后刷新左侧列表，清空已删除项的选择态。
- **Rationale**: 防止误操作导致历史丢失，并保持索引与详情文档一致。
- **User Evidence**: "在下面的删除按钮批量删除"；确认需要二次确认弹窗
- **Confirmed At**: 2026-07-06 23:55

### NEED-005: 修复返回按钮与搜索区重叠布局

- **Status**: confirmed
- **Statement**: 修复设置视图（VIEW_SETTINGS）与历史视图（VIEW_HISTORY）header 中返回按钮（`.back-btn`）的布局问题——其边框/区域与下方搜索文本框或内容区发生视觉重叠。调整后返回按钮与下方内容应清晰分隔、不重叠；主视图（VIEW_MAIN）的 header 布局不受影响。
- **Rationale**: 截图显示返回按钮组件框与下方单词搜索文本框重合，影响可读性与交互。
- **User Evidence**: "设置界面和单词查词界面的返回按钮 UI 效果不是很好。返回按钮组件的框跟下方的单词搜索文本框重合在一起了。"
- **Confirmed At**: 2026-07-06 23:55

## Constraints

### CON-001: 复用现有存储机制

- **Status**: confirmed
- **Statement**: 设置开关状态复用 `window.utools.dbStorage`（键值存储），与现有 `model-preference` 模块一致，不引入新的存储依赖或库。
- **User Evidence**: 架构约定（model-preference/index.js 使用 dbStorage）

### CON-002: 练习按钮仅做 UI 占位

- **Status**: confirmed
- **Statement**: 练习按钮本次仅渲染灰色 disabled 样式，不绑定 onClick、不跳转路由、不实现任何业务逻辑。
- **User Evidence**: "本次不做开发，仅保留练习按钮的灰色且不可点击的前端 UI 效果。"

### CON-003: 返回按钮修复范围限定

- **Status**: confirmed
- **Statement**: 返回按钮布局修复仅影响 VIEW_SETTINGS 与 VIEW_HISTORY 的 header；不得改变主视图（VIEW_MAIN）现有 header 布局。
- **User Evidence**: 用户明确指向设置界面与单词查词界面的返回按钮

## Decisions

### DEC-001: 设置项使用 toggle 开关

- **Status**: confirmed
- **Decision**: 设置项采用 iOS 风格滑块开关（switch toggle），而非方形 checkbox。
- **Alternatives Rejected**: 复选框 checkbox（用户认为 toggle 视觉更现代、与主视图模型选择区风格协调）
- **Reason**: 用户在选项中选择了"开关 toggle (Recommended)"。
- **User Evidence**: 用户选择"开关 toggle (Recommended)"

### DEC-002: 批量删除需要二次确认

- **Status**: confirmed
- **Decision**: 点击删除按钮后弹出 `window.confirm()` 确认弹窗，确认后才执行删除。
- **Alternatives Rejected**: 直接删除（无确认）
- **Reason**: 用户选择"需要确认弹窗 (Recommended)"，防止误删历史。
- **User Evidence**: 用户选择"需要确认弹窗 (Recommended)"

### DEC-003: 全选通过操作栏最左侧复选框实现

- **Status**: confirmed
- **Decision**: 左下角操作栏最左侧放置一个「全选」复选框（非文字按钮），点击选中当前上方列出的所有单词卡片，再次点击取消全部勾选。
- **Alternatives Rejected**: 独立的「全选/取消全选」文字切换按钮
- **Reason**: 用户明确要求"在左下角操作栏的最左边放置一个复选框即可，点击后自动全选当前上方列出的所有单词，再次点击则取消全部勾选"。
- **User Evidence**: "左下角操作栏的最左边放置一个'复选框（checkbox）'即可"

## Out of Scope

### OUT-001: 练习功能业务逻辑

- **Status**: confirmed
- **Statement**: 单词 / 短语 / 例句的练习功能（答题、计分、复习等）不在本次范围，仅保留占位按钮。
- **Reason**: 用户明确"后续我们将进一步开发……本次不做开发"。
- **User Evidence**: "后续我们将进一步开发单词、短语及例句的练习功能，本次不做开发"

### OUT-002: 「清空全部历史」功能

- **Status**: confirmed
- **Statement**: 一键清空全部历史记录的功能不在本次范围。
- **Reason**: 用户仅要求按勾选批量删除，未提出清空全部。
- **User Evidence**: 需求未提及清空全部

## Open Questions

（无）

## Confirmation Log

### Session 2026-07-06 23:55

- **Summary Presented**: 5 项 NEED（设置开关、卡片复选框、左下角操作栏、批量删除、返回按钮布局修复）+ 3 项 CON + 3 项 DEC + 2 项 OUT。
- **User Confirmation**: 用户确认三项交互选择（toggle / 确认弹窗 / 含全选），并细化全选控件为操作栏最左侧复选框。
- **Entries Confirmed**: NEED-001, NEED-002, NEED-003, NEED-004, NEED-005, CON-001, CON-002, CON-003, DEC-001, DEC-002, DEC-003, OUT-001, OUT-002

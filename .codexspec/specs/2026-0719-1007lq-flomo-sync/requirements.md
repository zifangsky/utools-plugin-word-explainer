Confirmed Requirements: flomo-sync

<!--
Language: Maintain this document in the language specified in .codexspec/config.yml.
This file is the authoritative, persistent record of user-confirmed intent.
Do not copy the full conversation. Keep only confirmed decisions and short evidence
quotes needed to resolve later interpretation disputes.
-->

**Feature ID**: `2026-0719-1007lq`
**Status**: Confirmed
**Last Confirmed**: 2026-07-19

## Authority Rules

- Only entries with `Status: confirmed` are binding downstream inputs.
- `open` entries MUST NOT be converted into confirmed product requirements.
- Replaced entries remain in this file with `Status: superseded` and a link to the replacement.
- AI inferences must be labeled as assumptions and require user confirmation before becoming binding.

## Needs

### NEED-001: 在查词结果右侧显示同步到 flomo 的按钮

- **Status**: confirmed
- **Statement**: 在首页查词结果界面右侧增加同步按钮，点击后将当前单词解释同步到 flomo。本次仅实现同步到 flomo 的能力。
- **Rationale**: 用户希望将查询结果快速归档到个人笔记工具中，方便后续复习。
- **User Evidence**: "在首页的查词之后，在界面右侧显示同步到其他笔记应用的按钮，点击后同步到其他笔记应用。本次我只需要你增加同步到 flomo 的能力。"
- **Confirmed At**: 2026-07-19

### NEED-002: 原封不动同步正文到 flomo

- **Status**: confirmed
- **Statement**: 将当前输出的解释正文原封不动同步到 flomo，不执行任何排版优化。默认使用 `content_type: "markdown"`，支持加粗、列表等格式。
- **Rationale**: 保留 AI 原始输出，避免信息损失或格式改动。
- **User Evidence**: "将单词解释同步到 flomo 的时候，原封不动地同步当前输出的正文即可，不执行任何排版优化。默认使用 `content_type: "markdown"`，支持加粗、列表等格式。"
- **Confirmed At**: 2026-07-19

### NEED-003: flomo 笔记第一行格式为标签 + 加粗标题

- **Status**: confirmed
- **Statement**: 笔记第一行必须是标签（如果用户在设置页设置了标签）+ 空格 + `**{当前单词} 单词详解**`，标签和加粗标题在同一行。第二行为空行，第三行起为原正文。
- **Rationale**: 与 flomo 的记录习惯保持一致，便于标签分类和标题识别。
- **User Evidence**: "笔记第一行必须是 标签（如果用户在设置页设置了标签的话） + 空格 + `**标题**`，标签和加粗标题在同一行。" 标题确认为 `{当前单词} 单词详解`。
- **Confirmed At**: 2026-07-19

## Constraints

### CON-001: 本次仅支持 flomo

- **Status**: confirmed
- **Statement**: 本次只实现同步到 flomo 的能力；其他笔记应用（如 Notion、Obsidian 等）暂不支持。
- **User Evidence**: "本次我只需要你增加同步到 flomo 的能力。"
- **Confirmed At**: 2026-07-19

### CON-002: flomo API 端点和标签在设置页配置

- **Status**: confirmed
- **Statement**: flomo 新增笔记的 API 端点由用户在设置界面配置。用户也可以在设置界面配置笔记最前面的标签，多个标签以空格分隔，选填。
- **User Evidence**: "向 flomo 新增笔记的 API 端点由用户在设置界面配置，同时用户也可以在设置界面配置笔记最前面的标签（选填）"
- **Confirmed At**: 2026-07-19

### CON-003: 使用项目内的 flomo 图标

- **Status**: confirmed
- **Statement**: 同步按钮使用 `assets/flomo_favicon.ico` 作为图标。
- **User Evidence**: "flomo的图标可以看 `assets/flomo_favicon.ico` 文件。"
- **Confirmed At**: 2026-07-19

## Decisions

### DEC-001: 标题使用「{当前单词} 单词详解」格式

- **Status**: confirmed
- **Decision**: flomo 笔记第一行的加粗标题使用「{当前单词} 单词详解」，例如查询 immediate 时标题为 **immediate 单词详解**。
- **Alternatives Rejected**: 使用纯查询单词作为标题（用户主动要求改为带"单词详解"后缀的格式）。
- **Reason**: 用户希望标题更明确，一眼看出这是一条单词详解笔记。
- **User Evidence**: "使用类似 'immediate 单词详解' 加粗后的文字作为标题"
- **Confirmed At**: 2026-07-19

### DEC-002: 设置页分为两个卡片

- **Status**: confirmed
- **Statement**: 重新优化设置界面选项排版，将当前基本设置放在一个卡片，将「同步到其他笔记应用」相关设置放在另一个卡片。同步卡片包含 flomo API 端点地址和 flomo 笔记标签。
- **Reason**: 功能分类更清晰，便于后续扩展其他笔记应用。
- **User Evidence**: "将当前的基本设置放在一个卡片，将'同步到其他笔记应用'相关的设置放在另一个卡片，其中就包含设置 flomo 的 API 端点地址，flomo 笔记标签（支持多个笔记标签，以空格分隔）"
- **Confirmed At**: 2026-07-19

### DEC-003: flomo 笔记标签默认值为 #English/vocabulary

- **Status**: confirmed
- **Decision**: 设置界面的 flomo 笔记标签输入框默认显示 `#English/vocabulary`。用户可手动修改、删除或增加更多标签。同步时，用户设置的所有标签（以空格分隔）均置于笔记第一行最前面。
- **Alternatives Rejected**: 标签全部留空（用户主动要求提供默认值以降低首次使用门槛）。
- **Reason**: 提供常用默认标签减少用户首次配置成本，同时保留完整可编辑性。
- **User Evidence**: "设置界面的 flomo 标签可以默认设置为 `#English/vocabulary`，然后用户可以手动修改，也可以增加更多的标签。如果用户设置了多个标签，那么在调用 flomo 的笔记新增 API 的时候，将用户设置的多个标签都设置在笔记最前面，用英文空格隔开。"
- **Confirmed At**: 2026-07-19

## Out of Scope

### OUT-001: 其他笔记应用同步

- **Status**: confirmed
- **Statement**: 同步到 flomo 以外的笔记应用（如 Notion、Obsidian、Bear 等）不在本次范围内。
- **Reason**: 用户明确要求本次只实现 flomo。
- **User Evidence**: "本次我只需要你增加同步到 flomo 的能力。"
- **Confirmed At**: 2026-07-19

### OUT-002: 正文排版优化或自动标题生成

- **Status**: confirmed
- **Statement**: 对正文不做任何排版优化、不自动生成标题、不修改任何内容。仅按用户指定格式在第一行添加标签和标题，并保留空行。
- **Reason**: 用户明确要求"原封不动地同步当前输出的正文即可，不执行任何排版优化"。
- **User Evidence**: "原封不动地同步当前输出的正文即可，不执行任何排版优化。"
- **Confirmed At**: 2026-07-19

## Open Questions

无。

## Superseded Entries

无。

## Confirmation Log

### 2026-07-19

- **Summary Presented**: 用户确认首页查词结果右侧增加 flomo 同步按钮；同步时原封不动发送正文；第一行格式为标签 + `**{当前单词} 单词详解**`；设置页分为两个卡片；本次仅支持 flomo。
- **User Confirmation**: 用户在问答中连续确认标题规则与最终需求摘要。
- **Entries Confirmed**: NEED-001, NEED-002, NEED-003, CON-001, CON-002, CON-003, DEC-001, DEC-002, OUT-001, OUT-002

### 2026-07-19 (追加)

- **Summary Presented**: 用户追加两个优化：(1) flomo 标签默认值为 `#English/vocabulary`；(2) 未配置端点时查词结果不显示图标。
- **User Confirmation**: 用户直接指定。
- **Entries Confirmed**: DEC-003 (新增)

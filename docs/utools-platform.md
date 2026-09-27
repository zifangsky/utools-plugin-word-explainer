# uTools 平台集成笔记

本插件运行于 uTools 平台。本文件记录**平台侧的行为约束与实测取证**——这些结论无法从源码读出，
且多来自真机复验或解包 uTools 运行时（`app.asar`）取证，重获成本高，故集中记录于此。

> 领域术语见 `CONTEXT.md`；开发流程与项目结构见 `README.md`；治理条款见 `.codexspec/memory/constitution.md`。

## 一、插件配置（plugin.json）

- **唯一源是 `public/plugin.json`**。`dist/` 下的副本是构建时由 Vite `copyPublicDir` 拷入的产物，
  MUST NOT 直接修改；`%APPDATA%\uTools\plugins\*.asar` 中可能残留本插件曾经的商店打包副本
  （内嵌**旧版** `plugin.json`），那是下载缓存而非活动安装，排查时可忽略。

### 1.1 配置改动的生效方式

改 `public/plugin.json` 后，MUST 在 uTools 开发者工具中对本项目执行
「**卸载（开发模式）**」→「**安装（开发模式）**」。**不需要重启 uTools。**

已实测确认的两条事实：

1. **`npm run dev` 与指令注册无关** —— 它只热更新**前端代码**，不注册、也不刷新指令。
   重启它永远无法让新指令出现（这是最容易走的一段弯路）。
2. 主搜索框的指令索引**只在「安装（开发模式）」时重建**。曾出现「开发者工具『匹配』页已正确
   显示指令、主搜索框却匹配不到」的情形（当时只重启了 uTools 进程）。

> **AI 侧约定（用户明确要求）**：**不要结束 uTools 进程**。uTools 常驻运行、无需手动关闭；
> AI 修改配置后只需重启本地开发服务（`npm run dev`），uTools 侧的卸载 / 重装由用户自行执行。

### 1.2 自查手段与误判防范

- **自查手段**：开发者工具的本项目详情页有「功能 / 匹配」两个标签，「匹配」页会列出解析到的
  匹配指令（类型、正则、最少 / 最多字符数）。**页面上能看到 = `plugin.json` 已被正确解析**。
- ⚠️ **但「看得到」≠「会生效」**：该页**只能用来排除语法问题**，不能用来判断是否生效
  （见 1.1 第 2 条）。
- ⚠️ **不要用「磁盘检索」判断指令是否注册**：uTools **不把开发插件的 `features` 持久化到数据库**，
  只保存 `plugin.json` 的**路径**。商店版插件有 `//feature/<pluginId>/<code>` 记录，本插件
  `ztwpfbsl` 一条都没有（连旧指令的 label 也搜不到）——那是**常态，不构成未注册的证据**。

## 二、匹配指令（`cmds` 对象项）

### 2.1 配置形态

对照官方示例 *plugin.json 配置完整示例*：

- `regex` 指令字段为 `type` / `label`（必须）/ `match`（**含前后斜杠的字符串**）/ `minLength` / `maxLength`
- `over` 指令字段为 `type` / `label` / `exclude`（可选）/ `minLength` / `maxLength`
- 官方示例的 feature `code` **自带连字符**（`test-regex`、`test-over`、`test-files`），故 `code`
  中含 `-` 无害；`cmds` 支持**字符串与对象混排**（生产插件如 `UtilityTools.jsonOper` 即
  `["JSON处理", {regex 对象}]`）

### 2.2 当前形态

```
cmds = ["单词详解", { "type": "over", "label": "单词详解",
  "exclude": "/[^a-zA-Z]|^(explain|word|vocabulary)$/i", "minLength": 2, "maxLength": 100 }]
```

`exclude` 承担两件事：

1. 「仅单个英文单词」的语义（`[^a-zA-Z]`，等价于原 `^[a-zA-Z]+$` 且更严格——空格亦被排除）
2. **排除与功能指令重名的关键词**（`^(explain|word|vocabulary)$`），否则输入 `word` 会同时命中
   功能指令与匹配指令

### 2.3 实测结论：`over` 是唯一生效路径

经 5 轮真机复验：`wordMatch` 下曾并行挂 `regex`（label `单词详解`）与 `over`（label
`单词详解（复制即查）`）作 A/B 探针，结论为 **`regex` 型在本机从未生效，`over` 型是唯一生效路径**。

判定依据是**控制变量实验**：删除 `over` 后候补即消失（第 4 ↔ 5 轮唯一变量为 `over` 的存删，
其余配置逐字一致）。

⚠️ **不要用「候补 label 与某条指令的 label 一致」来判定生效指令** —— uTools 对同一 feature 的
候补显示 label **并非取被命中指令自身的 label**（第 4 轮据此误判过一轮）。

### 2.4 `regex` 型不可用于「任意匹配」（本插件场景的定论）

2026-09-27 解包 `app.asar` 确证：构建索引时 `regex` 走 `H(match, cmd)` **双参数**路径，会做
「是否属于任意匹配」的启发式判定，判定为真则 `H` 返回 `null` → 该指令**永不入索引**（表现为
「开发者工具『匹配』页能看到、主搜索框永远搜不到」）；`over` 走 `H(exclude)` **单参数**路径，
**无任何判定门槛**、无条件入索引。

判定方式为**随机样本探测**：凡能命中「随机小写字母串」（`minLength<2` 时 1 个；`<3` 时 2 个；
或 3~16 长度区间内连续 2 次命中）或「随机汉字串」者一律被拒。

实测 `/^[a-zA-Z]+$/`、`/[a-zA-Z]+/`、`/^[a-zA-Z]{3,}$/` 均 **500/500** 被拒——
**「匹配任意字母」与判定规则直接冲突，调 `match` / `minLength` / `maxLength` 均无法绕开**。

故本插件 MUST 继续使用 `over` + `exclude`，**不得回退到 `regex`**。

### 2.5 关键词重叠约束

uTools **不合并**同一插件的功能指令与匹配指令命中，二者各占一格；且功能指令（`base`）的命中
条件是**「输入是关键词的子串」**（`index.js` 的 `F()` 用 `keyword.indexOf(input) >= 0`，故
`ephemeral` 不命中 `explain`）。

因此**新增任何纯 ASCII 关键词时 MUST 同步把它加入 `exclude` 的锚定组**；
`src/plugin-manifest.test.js` 会遍历 `cmds` 断言这一点，漏改即测试失败。

已知残留：当输入本身是关键词的**子串**时（如 `in` / `or` / `ab` / `la`）仍会出现两条目；根治需
枚举全部子串，但会连带排除 `in` / `or` 等**真实英文单词**，代价大于收益，故不采纳。

### 2.6 代码侧联动（易漏）

`onPluginEnter` 的 `action.type` **随匹配类型变化**（`over` 型即 `'over'`，`regex` 型即
`'regex'`）。**改 `public/plugin.json` 的匹配类型时 MUST 同步 `src/main-page/index.jsx` 的守卫**
（当前为 `enterAction.type !== 'over'`），否则会出现「候补能出现、但进入后不自动查询」的隐性故障。

## 三、构建与发布

- **发布目录是 `dist/`**，不是 `public/`（操作步骤见 `README.md`「开发」章节）。
- `vite build` 会把 `public/` 整体拷进 `dist/`（Vite `copyPublicDir` 默认行为），故 `public/assets/`
  中的历史产物会被**回灌进发布目录**，使发布包带上全部历史 hash 包。`package.json` 的 `prebuild`
  负责在构建前清空 `public/assets` 与 `public/index.html`；**`deploy` MUST 经 `npm run build` 调用**，
  否则 `prebuild` 生命周期不触发、清空失效。

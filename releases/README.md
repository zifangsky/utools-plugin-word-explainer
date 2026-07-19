# 版本发布记录

本目录存放每个版本的发布说明，用于 uTools 应用商店更新时填写版本变更内容。

## 文件说明

- `plugin-intro.md` — 插件应用介绍（首次提交应用商店时使用，后续不需频繁修改）
- `vX.Y.Z.md` — 各版本变更说明

## 版本号规则

- 格式：`主版本.次版本.修订号`（语义化版本）
- 示例：`v0.7.3`、`v0.8.0`、`v1.0.0`

## 发布流程

1. 在本地完成开发和测试后，更新 `releases/vX.Y.Z.md`
2. GitHub 打 tag 并创建 Release：`gh release create vX.Y.Z --notes-file releases/vX.Y.Z.md`
3. 将版本说明内容粘贴到 uTools 插件发布页面的版本更新说明中
4. 首次发布时还需提交 `plugin-intro.md` 作为插件介绍

英语单词详解是一款基于 uTools AI 的智能查词插件。输入任意英文单词，AI 流式生成涵盖词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析 7 大板块的结构化详解。

开源地址：https://github.com/zifangsky/utools-plugin-word-explainer


【核心功能】
📖 7 大板块深度详解
词义解析、词性用法、语境应用、常见搭配、词源故事、记忆技巧、同义词辨析

⚡ AI 流式生成
调用 uTools AI API 边接收边渲染，无需配置外部 API Key

📚 查词历史记录
自动保存查词记录，支持时间筛选（1d/3d/7d/15d/30d）、单词搜索、详情回溯和批量删除。存储上限 5000 条，可在设置中开关自动保存功能

📝 同步到 flomo
支持将查词结果一键同步到 flomo 笔记，首页查词和查词历史详情页均可触发。支持自定义 API 端点、笔记标签（默认 #English/vocabulary），按钮下方有状态文字提示

🔧 AI 模型自由切换
设置页支持从 uTools 可用模型列表中选择偏好模型，偏好自动持久化

🤖 MCP 工具集成
安装后自动向外部 AI Agent 暴露 explain_word 工具，Claude Code 等客户端可直接调用

🌓 暗色模式自适应
根据系统主题自动切换亮色/暗色模式


【触发方式】
在 uTools 搜索框输入以下关键词唤起插件：
explain / 查词 / word / vocabulary


【MCP 工具】
explain_word：接收英文单词，返回完整的 7 板块结构化详解，流式生成并实时上报进度


【技术栈】
React 19 + Vite 6 + uTools API + Node.js (preload)


【开源协议】
本项目基于 Apache-2.0 license 协议开源。
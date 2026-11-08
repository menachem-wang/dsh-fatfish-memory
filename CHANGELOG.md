# 更新记录

## 0.3.0 - 2026-11-08

基于 `dsh-local-vector-memory@0.2.1`（MIT，Copyright (c) 2026 xiaozeng）的 fork。

- 新增 `lib/guard.mjs`：记忆投毒守卫。auto-capture 存库前拦截「看起来像指令」的文本（子代理提示词、委派载荷、粘贴进来的 system prompt 等），避免被永久召回成幽灵指令。
- 修复 DSH 0.2.x 消息来源兼容：`source.kind` 由 `"plugin"` 改为 `plugin:${PLUGIN_SOURCE}`，并同步 `messageText()` 的过滤逻辑；否则新版 DSH 会静默丢弃召回/置顶注入。
- 新增 `lib/authority.mjs`：记忆写权限闸。子代理一律不算主人；onebot 会话默认全部只读，只有命中 `ownerChatPrefixes` 白名单的私聊可删除/修改记忆；网页/本地会话不受影响。
- 召回排序加入 priority 加权，并在命中后回血（`store.mjs`）。
- 配置通用化：`ownerChatPrefixes` 默认空；dbPath 改为 `~/.dsh/storages/fatfish-memory/`；提示词与描述不再写死个人端口/模型名。
- 日志前缀统一为 `[dsh-fatfish-memory]`。
- 新增 `tests/`（guard 与 authority 的单元测试）。

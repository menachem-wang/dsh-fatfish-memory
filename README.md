# 🐟 dsh-fatfish-memory（大肥鱼的记忆）

给 DSH 会话一份**带防注入守卫**的长期向量记忆：本地 embedding + SQLite + RRF 混合召回 + 云端提取 + 取代链 / 置顶 / 回收站。

> 本项目基于 [liangxiaobing520/dsh-local-vector-memory](https://github.com/liangxiaobing520/dsh-local-vector-memory) `0.2.1`（MIT，Copyright (c) 2026 xiaozeng）修改而来。原项目的设计功劳归原作者；本 fork 的差异见下文。

## 和上游的区别

1. **记忆投毒守卫**（`lib/guard.mjs`）
   auto-capture 存库前先检查文本像不像「指令」——子代理提示词、`send_message({agent_id…})` 委派载荷、粘贴进来的 system prompt、"忽略之前的指令" 之类，一律不存。否则这类文本一旦进了记忆，每次召回都会被当成记忆喂回模型，等于永久注入。

2. **DSH 0.2.x 消息来源兼容修复**
   上游把注入消息的 `source.kind` 写成 `"plugin"`；新版 DSH 只认 `plugin:插件名`，不修的话召回和置顶注入会被静默丢掉，日志里看不出任何异常。

3. **写权限闸**（`lib/authority.mjs`）
   - 子代理（`delegationDepth > 0`）永远不算主人；
   - onebot 会话默认**全部只读**，只有命中 `ownerChatPrefixes` 白名单的私聊能删除/修改记忆；
   - 网页 / 本地会话不受影响。
   解决的问题：群聊、陌生私聊、子代理都能调 `memory_forget`，一条提示词就能把主子的记忆清掉。

4. **召回命中回血 + priority 加权**（`store.mjs`）
   排序按 priority 加权；真正被召回注入的记忆会刷新 `last_hit_time` 并把优先级回满，常想起的记忆更不容易淡掉。

5. **配置通用化**
   `ownerChatPrefixes` 默认空数组；数据目录默认 `~/.dsh/storages/fatfish-memory/`；提示词与工具描述里不再写死个人端口、模型名和 QQ 号。

## 安装

npm 发布后：

```bash
dsh plugin --profile web add dsh-fatfish-memory
```

本地源码 / git 安装：

```bash
dsh plugin --profile web add E:\path\to\dsh-fatfish-memory
# 或
dsh plugin --profile web add https://github.com/menachem-wang/dsh-fatfish-memory
```

装完**重启一次 DSH**。

## 配置

在 `profiles/web/cordis.patch.yml` 里覆盖（注意：是**整段替换**，不是深合并，没写的项会回到默认值）：

```yaml
- insert:
    - id: fatfish-memory
      name: 'dsh-fatfish-memory'
      config:
        # 允许改记忆的 onebot 会话前缀；不填 = 所有 onebot 会话只读
        ownerChatPrefixes: ["onebot-private-123456789"]
        # 本地 embedding 服务（OpenAI 兼容）
        embeddingEndpoint: "http://127.0.0.1:8081/v1"
        embeddingModel: "local-embedding"
        # 云端提取（可选，默认 autoExtract: false）
        extractionEndpoint: "https://api.deepseek.com/v1"
        extractionApiKey: "sk-..."
        extractionModel: "deepseek-chat"
        autoExtract: false
```

常用开关都在 `lib/config.mjs` 的 `DEFAULT_CONFIG` 里，带中文注释。

## 从 dsh-local-vector-memory 迁移

1. 先停用旧插件（删掉/注释旧 patch），**两套不要同时开**——会双份召回注入，token 直接翻倍。
2. 复制库文件：

   ```bash
   mkdir -p ~/.dsh/storages/fatfish-memory
   cp ~/.dsh/storages/local-vector-memory/memory.sqlite ~/.dsh/storages/fatfish-memory/memory.sqlite
   ```

   或者把 `dbPath` 直接配回旧路径。
3. 重启 DSH，用 `memory_stats` 核对条数。

## 安全与隐私

- 默认全部数据在本地 SQLite；`memory_backup` 走 `VACUUM INTO`，备份在 `~/.dsh/backups/memory`。
- `autoExtract` 默认**关闭**。开启后，会话内容会发送到 `extractionEndpoint` 配置的模型，请自行确认隐私边界。
- 防注入守卫是**关键词特征匹配**，挡得住常见的提示词粘贴，挡不住精心构造的绕过——它是一道门，不是保险箱。
- 网页/本地会话视为主人本人；onebot 与子代理按上面的权限闸处理。

## 开发

```bash
node --test tests/
```

零依赖，纯 ESM。改完代码重启 DSH 生效。

## 许可

MIT。保留上游版权声明：`Copyright (c) 2026 xiaozeng (upstream: dsh-local-vector-memory)`。再发布时请在 README 注明基于原仓库。

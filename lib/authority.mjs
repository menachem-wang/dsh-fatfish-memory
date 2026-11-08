import { normalizePrefixList } from "./config.mjs";

/**
 * 判断调用者是否有权删除/修改记忆。
 *
 * - 子代理(delegationDepth > 0)一律不算主人
 * - onebot 会话必须命中 ownerChatPrefixes 白名单(默认空 = 全部只读)
 * - 网页/本地会话视为主人本人
 */
export function isOwnerCaller(session, cfg) {
  if (!session) return false;
  const id = String(session.id ?? "");
  const depth = Number(session?.header?.delegationDepth ?? 0) || 0;
  if (depth > 0) return false;
  if (id.startsWith("onebot-")) {
    const prefixes = normalizePrefixList(cfg?.ownerChatPrefixes);
    return prefixes.some((prefix) => id.startsWith(prefix));
  }
  return true;
}

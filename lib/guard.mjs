/**
 * 记忆投毒守卫:绝不把「看起来像指令」的文本存进长期记忆。
 *
 * 典型来源:子代理提示词、被粘贴进来的系统提示、转发来的委派载荷。
 * 一旦存进记忆,以后每次召回都会把它当「记忆」喂回模型,等于永久注入。
 */
export const INSTRUCTION_MARKERS = [
  /parent agent id/i,
  /send_message\s*\(\s*\{\s*agent_id/i,
  /ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|above|prior)\s+(?:instructions?|messages?)/i,
  /\bsystem prompt\b/i,
  /忽略(?:之前|以上|前面)(?:的)?(?:所有)?(?:指令|提示)/,
  /<\|?system\|?>/i,
];

/** 只检查开头一段,避免超长文本拖慢捕获流程。 */
export function looksLikeInstruction(text, maxChars = 4000) {
  const head = String(text || "").slice(0, maxChars);
  return INSTRUCTION_MARKERS.some((re) => re.test(head));
}

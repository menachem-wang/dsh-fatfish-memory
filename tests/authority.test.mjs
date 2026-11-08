import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnerCaller } from "../lib/authority.mjs";
import { normalizePrefixList } from "../lib/config.mjs";

const web = { id: "web-session-1", header: {} };
const qq = { id: "onebot-private-123456789", header: {} };
const subagent = { id: "onebot-private-123456789", header: { delegationDepth: 1 } };

test("网页/本地会话视为主人", () => {
  assert.equal(isOwnerCaller(web, {}), true);
});

test("onebot 默认全部只读", () => {
  assert.equal(isOwnerCaller(qq, {}), false);
  assert.equal(isOwnerCaller(qq, { ownerChatPrefixes: [] }), false);
});

test("配置白名单后主人私聊可写", () => {
  assert.equal(isOwnerCaller(qq, { ownerChatPrefixes: ["onebot-private-123456789"] }), true);
  assert.equal(isOwnerCaller(qq, { ownerChatPrefixes: "onebot-private-123456789" }), true);
  assert.equal(isOwnerCaller({ id: "onebot-private-999", header: {} }, { ownerChatPrefixes: ["onebot-private-123456789"] }), false);
});

test("子代理永远不算主人", () => {
  assert.equal(isOwnerCaller(subagent, { ownerChatPrefixes: ["onebot-private-123456789"] }), false);
});

test("没有会话时拒绝", () => {
  assert.equal(isOwnerCaller(null, {}), false);
});

test("前缀列表接受数组或字符串", () => {
  assert.deepEqual(normalizePrefixList(["a", " b "]), ["a", "b"]);
  assert.deepEqual(normalizePrefixList("a,b c"), ["a", "b", "c"]);
  assert.deepEqual(normalizePrefixList(undefined), []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apply, name } from "../index.mjs";

function fakeContext() {
  const exposed = {};
  const disposers = [];
  const ctx = {
    logger: { info() {}, warn() {}, debug() {}, error() {} },
    provide(key, value) {
      exposed[key] = value;
    },
    effect(fn) {
      const d = fn();
      if (typeof d === "function") disposers.push(d);
    },
    on() {},
    systemPrompt: { section() { return "section"; } },
    tools: { register() {} },
  };
  return { ctx, exposed, disposers };
}

test("插件可以加载并初始化记忆库", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fatfish-memory-"));
  const { ctx, exposed, disposers } = fakeContext();
  apply(ctx, {
    dbPath: join(dir, "smoke.sqlite"),
    ownerChatPrefixes: "onebot-private-123",
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  assert.equal(name, "fatfish-memory");
  const provided = exposed.localVectorMemory;
  assert.ok(provided, "应通过 ctx.provide 暴露 runtime");
  assert.equal(provided.config.ownerChatPrefixes[0], "onebot-private-123");
  assert.equal(provided.store.ok, true, "SQLite 记忆库应初始化成功");

  for (const dispose of disposers) dispose();
});

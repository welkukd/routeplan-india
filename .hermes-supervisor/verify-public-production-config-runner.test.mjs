import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const runner = resolve(import.meta.dirname, "verify-public-production-config.mjs");

function fixture(valid) {
  const root = mkdtempSync(join(tmpdir(), "routeplan-config-runner-test-"));
  const bin = join(root, "bin");
  mkdirSync(bin);
  mkdirSync(join(root, ".vercel"));
  writeFileSync(
    join(root, ".vercel", "project.json"),
    JSON.stringify({
      orgId: "team_1MT3qwKcThJzTWuaPDMn6mKB",
      projectId: "prj_ezYKEfpUDGT7p4xJhhK9yWV7QVjJ",
      projectName: "routeplan-india",
    }),
    { mode: 0o600 },
  );

  const publicEnv = valid
    ? `NEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_0123456789abcdefghijklmnopqrstuv"\nNEXT_PUBLIC_WHATSAPP_NUMBER="919876543210"\nGUPSHUP_API_KEY="must-not-leak"\n`
    : `NEXT_PUBLIC_SUPABASE_URL="raw-url-value"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="raw-key-value"\nNEXT_PUBLIC_WHATSAPP_NUMBER="raw-number-value"\nGUPSHUP_API_KEY="must-not-leak"\n`;

  const fakeVercel = join(bin, "vercel");
  writeFileSync(
    fakeVercel,
    `#!/usr/bin/env node\nconst { writeFileSync } = require("node:fs");\nwriteFileSync(process.argv[4], ${JSON.stringify(publicEnv)}, { mode: 0o600 });\n`,
    { mode: 0o700 },
  );
  chmodSync(fakeVercel, 0o700);
  return { root, bin };
}

function runFixture(valid) {
  const { root, bin } = fixture(valid);
  try {
    return spawnSync(process.execPath, [runner], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH || ""}`,
        NODE_ENV: "test",
        ROUTEPLAN_REPOSITORY_ROOT: root,
      },
      timeout: 10_000,
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

test("runner accepts valid canonical Vercel public configuration without value leakage", () => {
  const result = runFixture(true);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Public production configuration verified/u);
  assert.equal(result.stdout.includes("abcdefghijklmnopqrst"), false);
  assert.equal(result.stdout.includes("919876543210"), false);
  assert.equal(result.stdout.includes("must-not-leak"), false);
});

test("runner fails closed with key-only diagnostics for invalid public configuration", () => {
  const result = runFixture(false);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /NEXT_PUBLIC_SUPABASE_URL/u);
  assert.match(result.stderr, /NEXT_PUBLIC_SUPABASE_ANON_KEY/u);
  assert.match(result.stderr, /NEXT_PUBLIC_WHATSAPP_NUMBER/u);
  for (const rawValue of [
    "raw-url-value",
    "raw-key-value",
    "raw-number-value",
    "must-not-leak",
  ]) {
    assert.equal(result.stderr.includes(rawValue), false);
    assert.equal(result.stdout.includes(rawValue), false);
  }
});

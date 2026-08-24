import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePublicProductionConfig,
  parsePublicEnv,
} from "./lib/public-production-config.mjs";

const validConfig = {
  projectName: "routeplan-india",
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.synthetic_signature_123456",
    NEXT_PUBLIC_WHATSAPP_NUMBER: "919876543210",
  },
};

test("approves valid canonical public production configuration", () => {
  assert.deepEqual(evaluatePublicProductionConfig(validConfig), {
    complete: true,
    checkedKeys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_WHATSAPP_NUMBER",
    ],
    problems: [],
  });
});

test("rejects every missing or placeholder public production value", () => {
  const result = evaluatePublicProductionConfig({
    projectName: "routeplan-india",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "[SENSITIVE]",
    },
  });

  assert.equal(result.complete, false);
  assert.deepEqual(result.problems, [
    "NEXT_PUBLIC_SUPABASE_URL contains a placeholder or redacted value",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY contains a placeholder or redacted value",
    "NEXT_PUBLIC_WHATSAPP_NUMBER is missing",
  ]);
});

test("rejects non-HTTPS and non-Supabase project URLs", () => {
  for (const invalidUrl of [
    "http://abcdefghijklmnopqrst.supabase.co",
    "https://supabase.co",
    "https://abcdefghijklmnopqrst.supabase.com",
    "https://abcdefghijklmnopqrst.supabase.co/path",
  ]) {
    const result = evaluatePublicProductionConfig({
      ...validConfig,
      env: { ...validConfig.env, NEXT_PUBLIC_SUPABASE_URL: invalidUrl },
    });
    assert.equal(result.complete, false);
    assert.ok(
      result.problems.includes(
        "NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase project URL",
      ),
    );
  }
});

test("accepts current Supabase public-key formats and rejects malformed keys", () => {
  const publishable = evaluatePublicProductionConfig({
    ...validConfig,
    env: {
      ...validConfig.env,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "sb_publishable_0123456789abcdefghijklmnopqrstuv",
    },
  });
  assert.equal(publishable.complete, true);

  for (const invalidKey of [
    "not-a-public-key",
    "sb_secret_0123456789abcdefghijklmnopqrstuv",
    "eyJ.too-short.parts",
  ]) {
    const result = evaluatePublicProductionConfig({
      ...validConfig,
      env: { ...validConfig.env, NEXT_PUBLIC_SUPABASE_ANON_KEY: invalidKey },
    });
    assert.equal(result.complete, false);
    assert.ok(
      result.problems.includes(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY is not a valid Supabase public key",
      ),
    );
  }
});

test("requires a plausible 12-digit Indian mobile number without a plus sign", () => {
  for (const invalidNumber of [
    "+919876543210",
    "91987654321",
    "911234567890",
    "9198765432100",
  ]) {
    const result = evaluatePublicProductionConfig({
      ...validConfig,
      env: { ...validConfig.env, NEXT_PUBLIC_WHATSAPP_NUMBER: invalidNumber },
    });
    assert.equal(result.complete, false);
    assert.ok(
      result.problems.includes(
        "NEXT_PUBLIC_WHATSAPP_NUMBER must use 91XXXXXXXXXX Indian mobile format",
      ),
    );
  }
});

test("rejects a Vercel link that is not the canonical routeplan-india project", () => {
  const result = evaluatePublicProductionConfig({
    ...validConfig,
    projectName: "web",
  });

  assert.equal(result.complete, false);
  assert.equal(
    result.problems[0],
    "Linked Vercel project is not the canonical routeplan-india project",
  );
});

test("rejects malformed evaluator input with a stable error", () => {
  assert.throws(
    () => evaluatePublicProductionConfig(undefined),
    /Public production configuration input must be an object/u,
  );
  assert.throws(
    () => evaluatePublicProductionConfig({ projectName: "routeplan-india" }),
    /Public production configuration env must be an object/u,
  );
});

test("parses only allowlisted public keys from Vercel dotenv output", () => {
  const parsed = parsePublicEnv(`
# Created by Vercel CLI
GUPSHUP_API_KEY="must-never-survive"
NEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY='sb_publishable_0123456789abcdefghijklmnopqrstuv'
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
UNRELATED_PUBLIC_VALUE="drop-me"
`);

  assert.deepEqual(parsed, {
    NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "sb_publishable_0123456789abcdefghijklmnopqrstuv",
    NEXT_PUBLIC_WHATSAPP_NUMBER: "919876543210",
  });
  assert.equal("GUPSHUP_API_KEY" in parsed, false);
  assert.equal("UNRELATED_PUBLIC_VALUE" in parsed, false);
});

test("never returns raw public configuration values in validation evidence", () => {
  const marker = "raw-value-must-not-leak";
  const result = evaluatePublicProductionConfig({
    projectName: "routeplan-india",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: marker,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: marker,
      NEXT_PUBLIC_WHATSAPP_NUMBER: marker,
    },
  });

  assert.equal(result.complete, false);
  assert.equal(JSON.stringify(result).includes(marker), false);
  assert.equal("env" in result, false);
});

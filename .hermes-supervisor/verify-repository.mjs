import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  ".hermes-supervisor/GOAL.md",
  ".hermes-supervisor/ACCEPTANCE.md",
  ".hermes-supervisor/STATUS.md",
  ".hermes-supervisor/LATEST_REVIEW.md",
  ".hermes-supervisor/GITHUB_ISSUE_DRAFT.md",
  ".hermes-supervisor/qa.sh",
  "docs/WHATSAPP.md",
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_whatsapp_webhook_sessions.sql",
];

const missingFiles = requiredFiles.filter((path) => !existsSync(resolve(root, path)));
if (missingFiles.length > 0) {
  throw new Error(`Missing required repository files: ${missingFiles.join(", ")}`);
}

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GUPSHUP_API_KEY",
  "GUPSHUP_APP_ID",
  "GUPSHUP_APP_NAME",
  "GUPSHUP_SOURCE_NUMBER",
  "GUPSHUP_WEBHOOK_SECRET",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
];

const envText = readFileSync(resolve(root, ".env.example"), "utf8");
const env = new Map();
for (const rawLine of envText.split(/\r?\n/u)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const separator = line.indexOf("=");
  env.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
}

const missingEnv = requiredEnv.filter((name) => !env.has(name));
if (missingEnv.length > 0) {
  throw new Error(`.env.example is missing: ${missingEnv.join(", ")}`);
}
const populatedEnv = requiredEnv.filter((name) => env.get(name) !== "");
if (populatedEnv.length > 0) {
  throw new Error(`.env.example must keep values blank: ${populatedEnv.join(", ")}`);
}

const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
}).split("\0").filter(Boolean);
const trackedSecretEnv = tracked.filter((path) => {
  const name = basename(path);
  return name.startsWith(".env") && name !== ".env.example";
});
if (trackedSecretEnv.length > 0) {
  throw new Error(`Secret-bearing env files are tracked: ${trackedSecretEnv.join(", ")}`);
}

const whatsappSource = readFileSync(resolve(root, "packages/whatsapp/src/index.ts"), "utf8");
for (const contract of [
  "/wa/api/v1/msg",
  "/wa/api/v1/template/msg",
  "verifyWebhookToken",
  "message-event",
]) {
  if (!whatsappSource.includes(contract)) {
    throw new Error(`WhatsApp contract marker is missing: ${contract}`);
  }
}

const webhookRoute = readFileSync(
  resolve(root, "apps/web/src/app/api/whatsapp/webhook/route.ts"),
  "utf8",
);
for (const marker of [
  "verifyWebhookToken",
  "after(async () =>",
  "new NextResponse(null, { status: 202 })",
]) {
  if (!webhookRoute.includes(marker)) {
    throw new Error(`Webhook route marker is missing: ${marker}`);
  }
}

console.log("Repository invariants verified; no secret values printed.");

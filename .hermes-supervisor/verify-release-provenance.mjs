import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  combineDirtyPaths,
  evaluateReleaseProvenance,
  selectDeploymentEvidence,
} from "./lib/release-provenance.mjs";

const root = resolve(import.meta.dirname, "..");
const baseUrl = (
  process.env.ROUTEPLAN_PRODUCTION_URL ||
  "https://routeplan-india.vercel.app"
).replace(/\/$/u, "");
const deployPaths = [
  "apps/web",
  "packages",
  "supabase",
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".npmrc",
  ".github/workflows",
  "tsconfig.json",
  "turbo.json",
  "vercel.json",
];
const operationalProblems = [];

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    killSignal: "SIGTERM",
  });
  if (result.error || result.status !== 0) {
    const status = Number.isInteger(result.status) ? result.status : "unavailable";
    operationalProblems.push(`${label} failed (exit ${status})`);
    return null;
  }
  return result.stdout;
}

function parseJson(label, text) {
  if (typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    operationalProblems.push(`${label} returned invalid JSON`);
    return null;
  }
}

function nulPaths(text) {
  if (typeof text !== "string") return null;
  return text.split("\0").filter(Boolean);
}

const localHead = run("Local HEAD readback", "git", ["rev-parse", "HEAD"])?.trim() || null;
const remoteOutput = run("origin/main readback", "git", [
  "ls-remote",
  "--heads",
  "origin",
  "main",
]);
let remoteHead = null;
if (remoteOutput !== null) {
  const candidate = remoteOutput.trim().split(/\s+/u)[0] || "";
  if (/^[0-9a-f]{40}$/u.test(candidate)) {
    remoteHead = candidate;
  } else {
    operationalProblems.push("origin/main readback returned no valid commit");
  }
}

const unstagedOutput = run("Unstaged working-tree readback", "git", [
  "diff",
  "--name-only",
  "-z",
  "--",
  ...deployPaths,
]);
const stagedOutput = run("Staged working-tree readback", "git", [
  "diff",
  "--name-only",
  "--cached",
  "-z",
  "HEAD",
  "--",
  ...deployPaths,
]);
const untrackedOutput = run("Untracked working-tree readback", "git", [
  "ls-files",
  "--others",
  "--exclude-standard",
  "-z",
  "--",
  ...deployPaths,
]);
const unstagedPaths = nulPaths(unstagedOutput);
const stagedPaths = nulPaths(stagedOutput);
const untrackedPaths = nulPaths(untrackedOutput);
const dirtyPaths = combineDirtyPaths(
  unstagedPaths,
  stagedPaths,
  untrackedPaths,
);

const inspectOutput = run("Canonical Vercel deployment readback", "vercel", [
  "inspect",
  baseUrl,
  "--json",
]);
const inspection = parseJson("Canonical Vercel deployment readback", inspectOutput);
let deployment = null;
if (inspection?.id) {
  const deploymentOutput = run("Vercel deployment provenance readback", "vercel", [
    "api",
    `/v13/deployments/${inspection.id}`,
  ]);
  const rawDeployment = parseJson(
    "Vercel deployment provenance readback",
    deploymentOutput,
  );
  deployment = selectDeploymentEvidence(rawDeployment);
} else if (inspection) {
  operationalProblems.push("Canonical Vercel deployment has no deployment ID");
}

const result = evaluateReleaseProvenance({
  deployment,
  dirtyPaths,
  localHead,
  operationalProblems,
  remoteHead,
});

if (!result.complete) {
  console.error("Release provenance verification failed:");
  for (const problem of result.problems) {
    console.error(`- ${problem}`);
  }
  console.error(
    `Evidence: local=${result.localHead || "unavailable"}; remote=${result.remoteHead || "unavailable"}; deployment=${result.deploymentId || "unavailable"}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Release provenance verified: ${result.localHead}; deployment ${result.deploymentId}; clean local, remote, and production state.`,
  );
}

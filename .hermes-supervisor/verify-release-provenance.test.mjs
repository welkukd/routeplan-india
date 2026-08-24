import assert from "node:assert/strict";
import test from "node:test";
import {
  combineDirtyPaths,
  evaluateReleaseProvenance,
  selectDeploymentEvidence,
} from "./lib/release-provenance.mjs";

const sha = "0123456789abcdef0123456789abcdef01234567";

test("combines staged, unstaged, and untracked deploy changes without duplicates", () => {
  assert.deepEqual(
    combineDirtyPaths(
      ["apps/web/src/app/page.tsx"],
      ["package-lock.json", "apps/web/src/app/page.tsx"],
      ["vercel.json"],
    ),
    ["apps/web/src/app/page.tsx", "package-lock.json", "vercel.json"],
  );
  assert.equal(combineDirtyPaths([], null, []), null);
});

function validInput(overrides = {}) {
  return {
    dirtyPaths: [],
    localHead: sha,
    operationalProblems: [],
    remoteHead: sha,
    deployment: {
      id: "dpl_example",
      name: "routeplan-india",
      readyState: "READY",
      target: "production",
      source: "git",
      meta: {
        gitDirty: "0",
        githubCommitSha: sha,
      },
    },
    ...overrides,
  };
}

test("approves a clean release whose local, remote, and deployed commits match", () => {
  const result = evaluateReleaseProvenance(validInput());

  assert.equal(result.complete, true);
  assert.deepEqual(result.problems, []);
});

test("rejects dirty deploy-relevant files", () => {
  const result = evaluateReleaseProvenance(
    validInput({ dirtyPaths: ["apps/web/src/app/page.tsx"] }),
  );

  assert.equal(result.complete, false);
  assert.match(result.problems[0], /deploy-relevant working tree is dirty/u);
  assert.match(result.problems[0], /apps\/web\/src\/app\/page\.tsx/u);
});

test("rejects a local main commit that is not the remote main commit", () => {
  const remoteHead = "fedcba9876543210fedcba9876543210fedcba98";
  const result = evaluateReleaseProvenance(validInput({ remoteHead }));

  assert.equal(result.complete, false);
  assert.ok(result.problems.some((problem) => problem.includes("origin/main")));
});

test("rejects a deployment built from a dirty working tree", () => {
  const input = validInput();
  input.deployment.meta.gitDirty = "1";
  const result = evaluateReleaseProvenance(input);

  assert.equal(result.complete, false);
  assert.ok(result.problems.some((problem) => problem.includes("dirty source tree")));
});

test("accepts documented clean gitDirty value variants and rejects dirty variants", () => {
  for (const cleanValue of [false, 0, "0", "false"]) {
    const input = validInput();
    input.deployment.meta.gitDirty = cleanValue;
    assert.equal(evaluateReleaseProvenance(input).complete, true);
  }

  for (const dirtyValue of [true, 1, "1", "true"]) {
    const input = validInput();
    input.deployment.meta.gitDirty = dirtyValue;
    const result = evaluateReleaseProvenance(input);
    assert.equal(result.complete, false);
    assert.ok(result.problems.some((problem) => problem.includes("dirty source tree")));
  }
});

test("rejects a deployment whose commit differs from the verified git commit", () => {
  const input = validInput();
  input.deployment.meta.githubCommitSha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const result = evaluateReleaseProvenance(input);

  assert.equal(result.complete, false);
  assert.ok(result.problems.some((problem) => problem.includes("deployment commit")));
});

test("fails closed when deployment provenance metadata is missing", () => {
  const input = validInput();
  input.deployment.meta = {};
  const result = evaluateReleaseProvenance(input);

  assert.equal(result.complete, false);
  assert.ok(result.problems.some((problem) => problem.includes("gitDirty metadata")));
  assert.ok(result.problems.some((problem) => problem.includes("commit metadata")));
});

test("allowlists Vercel evidence, drops environment data, and normalizes metadata keys", () => {
  const evidence = selectDeploymentEvidence({
    id: "dpl_safe",
    name: "routeplan-india",
    readyState: "READY",
    source: "cli",
    target: "production",
    env: { GUPSHUP_API_KEY: "must-not-survive" },
    meta: {
      GITDIRTY: "0",
      GITHUBCOMMITSHA: sha,
      unrelated: "drop-me",
    },
  });

  assert.deepEqual(evidence, {
    id: "dpl_safe",
    name: "routeplan-india",
    readyState: "READY",
    source: "cli",
    target: "production",
    meta: {
      gitCommitSha: undefined,
      gitDirty: "0",
      githubCommitSha: sha,
    },
  });
  assert.equal("env" in evidence, false);
});

test("rejects a deployment that is not ready production", () => {
  const input = validInput();
  input.deployment.readyState = "ERROR";
  input.deployment.target = "preview";
  const result = evaluateReleaseProvenance(input);

  assert.equal(result.complete, false);
  assert.ok(result.problems.some((problem) => problem.includes("not READY")));
  assert.ok(result.problems.some((problem) => problem.includes("not production")));
});

test("preserves sanitized operational failures without requiring partial data", () => {
  const result = evaluateReleaseProvenance(
    validInput({
      deployment: null,
      operationalProblems: [
        "origin/main readback failed (exit 128)",
        "Vercel deployment readback failed (exit 1)",
      ],
      remoteHead: null,
    }),
  );

  assert.equal(result.complete, false);
  assert.ok(result.problems.includes("origin/main readback failed (exit 128)"));
  assert.ok(result.problems.includes("Vercel deployment readback failed (exit 1)"));
  assert.ok(result.problems.some((problem) => problem.includes("origin/main commit is unavailable")));
  assert.ok(result.problems.some((problem) => problem.includes("deployment metadata is unavailable")));
});

test("rejects malformed input", () => {
  assert.throws(
    () => evaluateReleaseProvenance(undefined),
    /Release provenance input must be an object/u,
  );
});

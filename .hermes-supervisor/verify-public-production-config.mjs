import { spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  evaluatePublicProductionConfig,
  parsePublicEnv,
} from "./lib/public-production-config.mjs";

const defaultRoot = resolve(import.meta.dirname, "..");
const root =
  process.env.NODE_ENV === "test" && process.env.ROUTEPLAN_REPOSITORY_ROOT
    ? process.env.ROUTEPLAN_REPOSITORY_ROOT
    : defaultRoot;
const expectedProject = {
  orgId: "team_1MT3qwKcThJzTWuaPDMn6mKB",
  projectId: "prj_ezYKEfpUDGT7p4xJhhK9yWV7QVjJ",
  projectName: "routeplan-india",
};
let temporaryDirectory = null;

function fail(problems) {
  console.error("Public production configuration verification failed:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exitCode = 1;
}

try {
  let linkedProject;
  try {
    linkedProject = JSON.parse(
      readFileSync(resolve(root, ".vercel/project.json"), "utf8"),
    );
  } catch {
    fail(["Canonical Vercel project link is unavailable or malformed"]);
  }

  if (
    process.exitCode !== 1 &&
    (linkedProject?.projectName !== expectedProject.projectName ||
      linkedProject?.projectId !== expectedProject.projectId ||
      linkedProject?.orgId !== expectedProject.orgId)
  ) {
    fail(["Linked Vercel project does not match the canonical project identity"]);
  }

  if (process.exitCode !== 1) {
    temporaryDirectory = mkdtempSync(
      join(tmpdir(), "routeplan-public-production-config-"),
    );
    chmodSync(temporaryDirectory, 0o700);
    const envPath = join(temporaryDirectory, "production.env");
    closeSync(openSync(envPath, "wx", 0o600));

    const pull = spawnSync(
      "vercel",
      [
        "env",
        "pull",
        envPath,
        "--environment",
        "production",
        "--yes",
        "--non-interactive",
        "--project",
        expectedProject.projectId,
        "--scope",
        "zone-1433",
      ],
      {
        cwd: root,
        env: process.env,
        stdio: ["ignore", "ignore", "ignore"],
        timeout: 30_000,
        killSignal: "SIGTERM",
      },
    );

    if (pull.error || pull.status !== 0) {
      const status = Number.isInteger(pull.status) ? pull.status : "unavailable";
      fail([`Vercel production environment readback failed (exit ${status})`]);
    } else {
      chmodSync(envPath, 0o600);
      if (!lstatSync(envPath).isFile()) {
        fail(["Vercel production environment readback did not create a regular file"]);
      } else {
        const env = parsePublicEnv(readFileSync(envPath, "utf8"));
        const result = evaluatePublicProductionConfig({
          env,
          projectName: linkedProject.projectName,
        });
        if (!result.complete) {
          fail(result.problems);
        } else {
          console.log(
            `Public production configuration verified for ${result.checkedKeys.length} allowlisted variables; no values printed.`,
          );
        }
      }
    }
  }
} catch {
  fail(["Public production configuration evidence could not be collected safely"]);
} finally {
  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

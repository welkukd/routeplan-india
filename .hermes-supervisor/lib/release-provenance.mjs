function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCleanDeploymentFlag(value) {
  return value === false || value === 0 || value === "0" || value === "false";
}

export function combineDirtyPaths(...groups) {
  if (groups.some((group) => !Array.isArray(group))) return null;
  return [
    ...new Set(
      groups.flat().filter((path) => typeof path === "string" && path.length > 0),
    ),
  ].sort();
}

export function selectDeploymentEvidence(rawDeployment) {
  if (!isObject(rawDeployment)) return null;

  const rawMeta = isObject(rawDeployment.meta) ? rawDeployment.meta : {};
  const normalizedMeta = Object.fromEntries(
    Object.entries(rawMeta).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    id: rawDeployment.id,
    name: rawDeployment.name,
    readyState: rawDeployment.readyState,
    source: rawDeployment.source,
    target: rawDeployment.target,
    meta: {
      gitCommitSha: normalizedMeta.gitcommitsha,
      gitDirty: normalizedMeta.gitdirty,
      githubCommitSha: normalizedMeta.githubcommitsha,
    },
  };
}

export function evaluateReleaseProvenance(input) {
  if (!isObject(input)) {
    throw new TypeError("Release provenance input must be an object");
  }

  const problems = Array.isArray(input.operationalProblems)
    ? input.operationalProblems.filter(
        (problem) => typeof problem === "string" && problem.trim().length > 0,
      )
    : ["Operational-problem evidence is malformed"];

  const dirtyPaths = Array.isArray(input.dirtyPaths)
    ? input.dirtyPaths.filter((path) => typeof path === "string" && path.length > 0)
    : [];
  if (!Array.isArray(input.dirtyPaths)) {
    problems.push("Deploy-relevant working-tree evidence is unavailable");
  } else if (dirtyPaths.length > 0) {
    problems.push(
      `deploy-relevant working tree is dirty: ${dirtyPaths.join(", ")}`,
    );
  }

  const localHead = typeof input.localHead === "string" ? input.localHead.trim() : "";
  const remoteHead = typeof input.remoteHead === "string" ? input.remoteHead.trim() : "";
  if (!localHead) {
    problems.push("Local HEAD commit is unavailable");
  }
  if (!remoteHead) {
    problems.push("origin/main commit is unavailable");
  } else if (localHead && localHead !== remoteHead) {
    problems.push(`Local HEAD ${localHead} does not match origin/main ${remoteHead}`);
  }

  const deployment = isObject(input.deployment) ? input.deployment : null;
  if (!deployment) {
    problems.push("Production deployment metadata is unavailable");
  } else {
    if (deployment.readyState !== "READY") {
      problems.push(
        `Production deployment is not READY: ${String(deployment.readyState || "unknown")}`,
      );
    }
    if (deployment.target !== "production") {
      problems.push(
        `Deployment target is not production: ${String(deployment.target || "unknown")}`,
      );
    }
    if (deployment.name !== "routeplan-india") {
      problems.push(
        `Deployment project is not routeplan-india: ${String(deployment.name || "unknown")}`,
      );
    }

    const meta = isObject(deployment.meta) ? deployment.meta : {};
    if (!("gitDirty" in meta)) {
      problems.push("Deployment gitDirty metadata is unavailable");
    } else if (!isCleanDeploymentFlag(meta.gitDirty)) {
      problems.push("Production deployment was built from a dirty source tree");
    }

    const deploymentHead =
      typeof meta.githubCommitSha === "string" && meta.githubCommitSha.trim()
        ? meta.githubCommitSha.trim()
        : typeof meta.gitCommitSha === "string" && meta.gitCommitSha.trim()
          ? meta.gitCommitSha.trim()
          : "";
    if (!deploymentHead) {
      problems.push("Deployment commit metadata is unavailable");
    } else if (
      (localHead && deploymentHead !== localHead) ||
      (remoteHead && deploymentHead !== remoteHead)
    ) {
      problems.push(
        `Production deployment commit ${deploymentHead} does not match the verified git commit`,
      );
    }
  }

  return {
    complete: problems.length === 0,
    dirtyPaths,
    localHead: localHead || null,
    remoteHead: remoteHead || null,
    deploymentId: deployment?.id || null,
    problems,
  };
}

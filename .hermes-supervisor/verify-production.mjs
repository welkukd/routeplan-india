const baseUrl = (process.env.ROUTEPLAN_PRODUCTION_URL || "https://routeplan-india.vercel.app").replace(/\/$/u, "");
const problems = [];

async function fetchWithTimeout(url) {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/json,text/html" },
  });
}

try {
  const landing = await fetchWithTimeout(`${baseUrl}/`);
  if (landing.status !== 200) {
    problems.push(`Landing page returned HTTP ${landing.status}`);
  } else {
    const html = await landing.text();
    if (/91X{5,}/u.test(html)) {
      problems.push("Landing page exposes a placeholder WhatsApp number");
    }
    const deadAnchors = html.match(/href=["']#["']/gu) || [];
    if (deadAnchors.length > 0) {
      problems.push(`Landing page contains ${deadAnchors.length} dead href=\"#\" anchors`);
    }
    if (html.includes("99.9%")) {
      problems.push("Landing page contains an unverified 99.9% uptime claim");
    }
  }
} catch (error) {
  problems.push(`Landing page request failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const readiness = await fetchWithTimeout(`${baseUrl}/api/whatsapp/webhook`);
  let body;
  try {
    body = await readiness.json();
  } catch {
    problems.push(`Webhook readiness returned non-JSON HTTP ${readiness.status}`);
  }
  if (body && (readiness.status !== 200 || body.configured !== true)) {
    const missing = Array.isArray(body.missing) ? body.missing.join(", ") : "unknown";
    problems.push(`Webhook is not production-ready: HTTP ${readiness.status}; missing=${missing}`);
  }
  if (body && Array.isArray(body.missing) && body.missing.length > 0 && readiness.status === 200) {
    problems.push(`Webhook reports missing configuration: ${body.missing.join(", ")}`);
  }
} catch (error) {
  problems.push(`Webhook readiness request failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (problems.length > 0) {
  throw new Error(`Production verification failed:\n- ${problems.join("\n- ")}`);
}

console.log(`Production verified at ${baseUrl}; no secret values printed.`);

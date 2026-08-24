export const PUBLIC_PRODUCTION_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
];

const PUBLIC_PRODUCTION_KEY_SET = new Set(PUBLIC_PRODUCTION_KEYS);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "[sensitive]" ||
    normalized.includes("placeholder") ||
    normalized.includes("changeme") ||
    normalized.startsWith("your-") ||
    normalized.startsWith("your_")
  );
}

function isSupabasePublicKey(value) {
  return (
    /^eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}$/u.test(
      value,
    ) || /^sb_publishable_[A-Za-z0-9_-]{20,}$/u.test(value)
  );
}

function parseDotenvValue(rawValue) {
  const value = rawValue.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

export function parsePublicEnv(text) {
  if (typeof text !== "string") {
    throw new TypeError("Vercel dotenv input must be a string");
  }

  const env = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    const name = line.slice(0, separator).trim();
    if (!PUBLIC_PRODUCTION_KEY_SET.has(name)) continue;
    env[name] = parseDotenvValue(line.slice(separator + 1));
  }
  return env;
}

export function evaluatePublicProductionConfig(input) {
  if (!isObject(input)) {
    throw new TypeError("Public production configuration input must be an object");
  }
  if (!isObject(input.env)) {
    throw new TypeError("Public production configuration env must be an object");
  }

  const problems = [];
  const env = input.env;

  if (input.projectName !== "routeplan-india") {
    problems.push(
      "Linked Vercel project is not the canonical routeplan-india project",
    );
  }

  for (const name of PUBLIC_PRODUCTION_KEYS) {
    const value = typeof env[name] === "string" ? env[name].trim() : "";
    if (!value) {
      problems.push(`${name} is missing`);
    } else if (isPlaceholder(value)) {
      problems.push(`${name} contains a placeholder or redacted value`);
    } else if (
      name === "NEXT_PUBLIC_SUPABASE_URL" &&
      !/^https:\/\/[a-z0-9]{15,30}\.supabase\.co$/u.test(value)
    ) {
      problems.push(`${name} is not a valid Supabase project URL`);
    } else if (
      name === "NEXT_PUBLIC_SUPABASE_ANON_KEY" &&
      !isSupabasePublicKey(value)
    ) {
      problems.push(`${name} is not a valid Supabase public key`);
    } else if (
      name === "NEXT_PUBLIC_WHATSAPP_NUMBER" &&
      !/^91[6-9][0-9]{9}$/u.test(value)
    ) {
      problems.push(`${name} must use 91XXXXXXXXXX Indian mobile format`);
    }
  }

  return {
    complete: problems.length === 0,
    checkedKeys: [...PUBLIC_PRODUCTION_KEYS],
    problems,
  };
}

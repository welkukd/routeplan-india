export const REQUIRED_SECTION_MINIMUMS = Object.freeze({
  "A. Local implementation": 18,
  "B. Production deployment": 11,
  "C. Supabase readback": 7,
  "D. Gupshup readback": 5,
  "E. Real conversation": 8,
  "F. Security and operations": 10,
});

export function parseAcceptanceChecklist(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("Acceptance document must be a string");
  }

  const items = [];
  let section = "Unsectioned";

  for (const [index, rawLine] of markdown.split(/\r?\n/u).entries()) {
    const heading = rawLine.match(/^##\s+(.+?)\s*$/u);
    if (heading) {
      section = heading[1];
      continue;
    }

    const checkbox = rawLine.match(/^\s*-\s+\[([ xX])\]\s+(.+?)\s*$/u);
    if (!checkbox) continue;

    items.push({
      checked: checkbox[1].toLowerCase() === "x",
      line: index + 1,
      section,
      text: checkbox[2],
    });
  }

  return items;
}

export function validateAcceptanceStructure(
  items,
  sectionMinimums = REQUIRED_SECTION_MINIMUMS,
) {
  if (!Array.isArray(items)) {
    throw new TypeError("Acceptance items must be an array");
  }

  const counts = new Map();
  for (const item of items) {
    counts.set(item.section, (counts.get(item.section) || 0) + 1);
  }

  const problems = [];
  for (const [section, minimum] of Object.entries(sectionMinimums)) {
    const actual = counts.get(section) || 0;
    if (actual < minimum) {
      problems.push(`${section} has ${actual} checklist items; expected at least ${minimum}`);
    }
  }

  return {
    counts: Object.fromEntries(counts),
    problems,
    valid: problems.length === 0,
  };
}

export function evaluateAcceptanceChecklist(markdown) {
  const items = parseAcceptanceChecklist(markdown);
  const checked = items.filter((item) => item.checked);
  const unchecked = items.filter((item) => !item.checked);

  return {
    checked,
    complete: items.length > 0 && unchecked.length === 0,
    items,
    total: items.length,
    unchecked,
  };
}

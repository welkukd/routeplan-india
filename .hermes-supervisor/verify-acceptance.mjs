import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateAcceptanceChecklist,
  validateAcceptanceStructure,
} from "./lib/acceptance-contract.mjs";

const acceptancePath = resolve(
  process.argv[2] || resolve(import.meta.dirname, "ACCEPTANCE.md"),
);
const markdown = readFileSync(acceptancePath, "utf8");
const result = evaluateAcceptanceChecklist(markdown);
const structure = validateAcceptanceStructure(result.items);

if (!structure.valid) {
  console.error("Completion acceptance contract structure is invalid:");
  for (const problem of structure.problems) {
    console.error(`- ${problem}`);
  }
  process.exitCode = 1;
} else if (!result.complete) {
  console.error(
    `Completion acceptance contract is incomplete: ${result.checked.length}/${result.total} checked; ${result.unchecked.length} remaining.`,
  );
  for (const item of result.unchecked) {
    console.error(`- ${item.section} (line ${item.line}): ${item.text}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Completion acceptance contract verified: ${result.total}/${result.total} checked.`,
  );
}

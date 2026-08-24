import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAcceptanceChecklist,
  parseAcceptanceChecklist,
  validateAcceptanceStructure,
} from "./lib/acceptance-contract.mjs";

test("parses checked and unchecked items with section and line evidence", () => {
  const markdown = [
    "# Acceptance",
    "",
    "## A. Local",
    "- [x] Typecheck passes.",
    "- [ ] Production credentials are configured.",
    "",
    "## B. External",
    "- [X] Landing returns HTTP 200.",
  ].join("\n");

  assert.deepEqual(parseAcceptanceChecklist(markdown), [
    {
      checked: true,
      line: 4,
      section: "A. Local",
      text: "Typecheck passes.",
    },
    {
      checked: false,
      line: 5,
      section: "A. Local",
      text: "Production credentials are configured.",
    },
    {
      checked: true,
      line: 8,
      section: "B. External",
      text: "Landing returns HTTP 200.",
    },
  ]);
});

test("ignores narrative and malformed checkbox-like text", () => {
  const markdown = [
    "## Scope",
    "A deployed build is not proof.",
    "[ ] Missing list marker",
    "- [] Missing checkbox space",
    "- [y] Unsupported marker",
    "- [ ] Real acceptance item",
  ].join("\n");

  const items = parseAcceptanceChecklist(markdown);
  assert.equal(items.length, 1);
  assert.equal(items[0].text, "Real acceptance item");
});

test("reports complete only when a non-empty checklist is fully checked", () => {
  const complete = evaluateAcceptanceChecklist("## Done\n- [x] One\n- [X] Two");
  assert.equal(complete.complete, true);
  assert.equal(complete.total, 2);
  assert.equal(complete.checked.length, 2);
  assert.equal(complete.unchecked.length, 0);

  const incomplete = evaluateAcceptanceChecklist("## Pending\n- [x] One\n- [ ] Two");
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.unchecked.length, 1);

  const empty = evaluateAcceptanceChecklist("# No checklist here");
  assert.equal(empty.complete, false);
  assert.equal(empty.total, 0);
});

test("rejects non-string documents", () => {
  assert.throws(
    () => parseAcceptanceChecklist(undefined),
    /Acceptance document must be a string/u,
  );
});

test("fails closed when a required section loses checklist items", () => {
  const items = parseAcceptanceChecklist(
    "## A\n- [x] One\n## B\n- [ ] Two",
  );
  const valid = validateAcceptanceStructure(items, { A: 1, B: 1 });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.problems, []);

  const contracted = validateAcceptanceStructure(items, { A: 2, B: 1 });
  assert.equal(contracted.valid, false);
  assert.deepEqual(contracted.problems, [
    "A has 1 checklist items; expected at least 2",
  ]);
});

test("rejects non-array structure input", () => {
  assert.throws(
    () => validateAcceptanceStructure(undefined),
    /Acceptance items must be an array/u,
  );
});

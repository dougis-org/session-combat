---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `decompose-active-combat-view` change.
This is a pure structural refactor (`skip_specs: true` — no new behavior, no
new acceptance scenarios), so "TDD" here means **characterization testing**:
capture the current passing state as a baseline *before* any extraction, then
require the exact same tests to pass, unchanged, *after* each extraction step.
Any red result after refactoring is a defect in the refactor, not a missing
feature — fix the extraction, never the test.

## Testing Steps

For each extraction sub-task in `tasks.md`:

1. **Capture baseline:** run the relevant existing test command against the
   pre-extraction code and record the pass/fail result (should be all green).
2. **Extract:** move the code per the sub-task, preserving behavior exactly.
3. **Re-run the same command:** result must match the baseline exactly — same
   tests, same pass/fail outcome, no new failures and no silently-dropped
   tests.
4. **Refactor only if a mismatch is found:** if a test that passed at baseline
   now fails, treat it as a bug in the extraction and fix the extraction, not
   the test's expectations.

## Test Cases

### Sub-task 1 — `useInitiativeModal` hook extraction

- [ ] Baseline: run `npx playwright test tests/e2e/combat.spec.ts` before extraction; record pass count (all tests green).
- [ ] `npx tsc --noEmit` passes after the hook extraction (no type errors, no hook-order violations).
- [ ] Re-run `npx playwright test tests/e2e/combat.spec.ts` (pre-split, still one file at this point) after extraction — same pass count as baseline, specifically covering: initiative auto-opens for the first unrolled combatant; manual dismissal via close button prevents auto-reopen for that combatant but not others; setting an initiative advances to the next unrolled combatant's modal; removing a combatant while its modal is open closes the modal without error; the modal stays within the viewport when the anchor card is near the bottom of the page (exercised implicitly by the full end-to-end flow test at the original line ~538).
- [ ] Manual/visual spot check (or existing e2e coverage) confirms the modal is still positioned directly below its target card, same width, after the extraction — no anchoring regression.

### Sub-task 2 — Gate-threshold check / Decision 2 fallback

- [ ] `wc -l lib/components/ActiveCombatView.tsx` recorded and compared against Verity's file-length threshold; result (pass/fail) documented in the PR description.
- [ ] If the fallback (`useCombatantPopups` or similar) is triggered: repeat the baseline → extract → re-run pattern above for whichever tests exercise remove-confirm and detail-panel behavior (covered within `tests/e2e/combat.spec.ts`'s core/HP and legendary sections).
- [ ] Verity's pre-commit/pre-push gate reports PASS for `lib/components/ActiveCombatView.tsx` before this change is committed.

### Sub-task 3 — `combat.spec.ts` split

- [ ] Baseline: full `npx playwright test tests/e2e/combat.spec.ts` run captured before deletion — record exact test names and total count (expected 29, per the pre-change file).
- [ ] After creating `combat-import.spec.ts`, `combat-core.spec.ts`, `combat-legendary.spec.ts`, `combat-lair.spec.ts`: run `npx playwright test tests/e2e/combat-import.spec.ts tests/e2e/combat-core.spec.ts tests/e2e/combat-legendary.spec.ts tests/e2e/combat-lair.spec.ts` — total test count and names must match the baseline exactly (no test silently dropped, none duplicated).
- [ ] Confirm the promoted `registerTestUser` helper in `tests/e2e/helpers/actions.ts` produces the same registration behavior as the original file-scoped version (all four split files' import/registration-dependent tests still pass).
- [ ] Confirm the existing `STRONG_PASSWORD` export in `tests/e2e/helpers/actions.ts` is unchanged, and that other spec files depending on it (`parties.spec.ts`, `characters.spec.ts`, `auth.spec.ts`, `campaigns.spec.ts`, `encounters.spec.ts`, `monsters.spec.ts`, `dice-appearance.spec.ts`, `dice-roll-animation.spec.ts`, `campaign-combat-linking.spec.ts`) still pass unmodified — run `npx playwright test tests/e2e/parties.spec.ts tests/e2e/characters.spec.ts tests/e2e/auth.spec.ts` as a spot-check.
- [ ] Each new spec file's line count checked against Verity's gate threshold; all must report PASS.
- [ ] `tests/e2e/combat.spec.ts` no longer exists after the split is confirmed complete.

### Full regression gate (Validation section of tasks.md)

- [ ] `npm run test:unit` — all pass, no change in count from pre-change baseline.
- [ ] `npm run test:integration` — all pass, no change in count from pre-change baseline.
- [ ] `npm run test:regression` (or the full `tests/e2e/` Playwright suite) — all pass, no change in count from pre-change baseline.
- [ ] `npm run build` — succeeds with no errors.
- [ ] `npm run lint` — no new violations introduced.
